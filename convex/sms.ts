import { v } from "convex/values";
import { action, internalAction, internalMutation, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { DEFAULT_GUIDE_TEMPLATES } from "./settings";

export function normalizeKoreanPhone(raw: string): string {
  const digits = (raw || "").replace(/[^0-9]/g, "");
  if (digits.startsWith("82") && digits.length >= 11) {
    return `0${digits.slice(2)}`;
  }
  return digits;
}

async function findMatchingInquiry(ctx: any, normalizedPhone: string) {
  const allInquiries = await ctx.db.query("inquiries").order("desc").collect();
  const phoneMatches = allInquiries.filter(
    (inq: any) => normalizeKoreanPhone(inq.phone || "") === normalizedPhone
  );
  return (
    phoneMatches.find(
      (inq: any) =>
        inq.source === "lg_care" ||
        (inq.productName || "").includes("LG구독") ||
        (inq.productName || "").toLowerCase().includes("lg")
    ) ?? phoneMatches[0]
  );
}

export const logSms = internalMutation({
  args: {
    inquiryId: v.optional(v.id("inquiries")),
    customerName: v.optional(v.string()),
    customerPhone: v.string(),
    smsType: v.string(),
    title: v.optional(v.string()),
    message: v.string(),
    status: v.string(),
    errorMessage: v.optional(v.string()),
    senderName: v.optional(v.string()),
    direction: v.optional(v.union(v.literal("outbound"), v.literal("inbound"))),
    isRead: v.optional(v.boolean()),
    receiverNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedPhone = normalizeKoreanPhone(args.customerPhone) || args.customerPhone;
    return await ctx.db.insert("sms_logs", {
      ...args,
      customerPhone: normalizedPhone,
      direction: args.direction ?? "outbound",
      createdAt: Date.now(),
    });
  },
});

export const enqueuePhoneOutbox = internalMutation({
  args: {
    inquiryId: v.optional(v.id("inquiries")),
    customerName: v.optional(v.string()),
    customerPhone: v.string(),
    smsType: v.string(),
    title: v.optional(v.string()),
    message: v.string(),
    senderName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const normalizedPhone = normalizeKoreanPhone(args.customerPhone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      throw new Error("유효한 수신자 전화번호가 아닙니다.");
    }

    const smsLogId = await ctx.db.insert("sms_logs", {
      inquiryId: args.inquiryId,
      customerName: args.customerName,
      customerPhone: normalizedPhone,
      smsType: args.smsType,
      title: args.title,
      message: args.message,
      status: "발송대기",
      senderName: args.senderName ? `${args.senderName} (회사폰)` : "회사폰",
      direction: "outbound",
      createdAt: now,
    });

    const outboxId = await ctx.db.insert("sms_outbox", {
      smsLogId,
      inquiryId: args.inquiryId,
      receiverPhone: normalizedPhone,
      title: args.title,
      message: args.message,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return { outboxId, smsLogId };
  },
});

export const pollBridgeOutbox = internalMutation({
  args: {
    secret: v.string(),
    deviceName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("settings").first();
    const smsConfig = (settings as any)?.sms;
    const expectedSecret = smsConfig?.bridgeSecret || process.env.SMS_WEBHOOK_SECRET || "";

    if (!expectedSecret || args.secret !== expectedSecret) {
      return { ok: false, error: "연동 보안키가 일치하지 않습니다.", jobs: [] as any[] };
    }

    const now = Date.now();
    // 15초 이상 지났거나 기기명이 바뀐 경우에만 하트비트 갱신 (DB 쓰기 최소화)
    if (
      settings &&
      smsConfig &&
      (now - (smsConfig.bridgeLastSeenAt || 0) > 15_000 ||
        (args.deviceName && args.deviceName !== smsConfig.bridgeDeviceName))
    ) {
      await ctx.db.patch(settings._id, {
        sms: {
          ...smsConfig,
          bridgeLastSeenAt: now,
          bridgeDeviceName: args.deviceName || smsConfig.bridgeDeviceName,
        },
      });
    }

    // 2분 이상 processing에 멈춘 작업은 pending으로 자동 복구
    const stuckItems = await ctx.db
      .query("sms_outbox")
      .withIndex("by_status_and_createdAt", (q) => q.eq("status", "processing"))
      .take(20);
    for (const item of stuckItems) {
      if (now - item.updatedAt > 120_000) {
        await ctx.db.patch(item._id, { status: "pending", updatedAt: now });
      }
    }

    const pendingItems = await ctx.db
      .query("sms_outbox")
      .withIndex("by_status_and_createdAt", (q) => q.eq("status", "pending"))
      .order("asc")
      .take(10);

    const jobs = [];
    for (const item of pendingItems) {
      await ctx.db.patch(item._id, { status: "processing", updatedAt: now });
      jobs.push({
        outboxId: String(item._id),
        receiverPhone: item.receiverPhone,
        title: item.title || "",
        message: item.message,
      });
    }

    return { ok: true, jobs };
  },
});

export const ackBridgeOutbox = internalMutation({
  args: {
    secret: v.string(),
    outboxId: v.id("sms_outbox"),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("settings").first();
    const smsConfig = (settings as any)?.sms;
    const expectedSecret = smsConfig?.bridgeSecret || process.env.SMS_WEBHOOK_SECRET || "";

    if (!expectedSecret || args.secret !== expectedSecret) {
      return { ok: false, error: "연동 보안키가 일치하지 않습니다." };
    }

    const outbox = await ctx.db.get(args.outboxId);
    if (!outbox) {
      return { ok: false, error: "발송 대기 항목을 찾을 수 없습니다." };
    }

    const now = Date.now();
    await ctx.db.patch(args.outboxId, {
      status: args.success ? "sent" : "failed",
      errorMessage: args.success ? undefined : args.errorMessage || "휴대폰 발송 실패",
      updatedAt: now,
    });

    if (outbox.smsLogId) {
      const logDoc = await ctx.db.get(outbox.smsLogId);
      if (logDoc) {
        await ctx.db.patch(outbox.smsLogId, {
          status: args.success ? "성공" : "실패",
          errorMessage: args.success ? undefined : args.errorMessage || "휴대폰 발송 실패",
        });
      }
    }

    return { ok: true };
  },
});

export const syncBridgeMessages = internalMutation({
  args: {
    secret: v.string(),
    deviceName: v.optional(v.string()),
    messages: v.array(
      v.object({
        direction: v.union(v.literal("inbound"), v.literal("outbound")),
        phone: v.string(),
        message: v.string(),
        timestamp: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("settings").first();
    const smsConfig = (settings as any)?.sms;
    const expectedSecret = smsConfig?.bridgeSecret || process.env.SMS_WEBHOOK_SECRET || "";

    if (!expectedSecret || args.secret !== expectedSecret) {
      return { ok: false, error: "연동 보안키가 일치하지 않습니다.", synced: 0 };
    }

    const now = Date.now();
    if (settings && smsConfig && now - (smsConfig.bridgeLastSeenAt || 0) > 15_000) {
      await ctx.db.patch(settings._id, {
        sms: {
          ...smsConfig,
          bridgeLastSeenAt: now,
          bridgeDeviceName: args.deviceName || smsConfig.bridgeDeviceName,
        },
      });
    }

    let syncedCount = 0;

    for (const item of args.messages) {
      const normalizedPhone = normalizeKoreanPhone(item.phone);
      const trimmedMessage = (item.message || "").trim();
      if (!normalizedPhone || normalizedPhone.length < 9 || !trimmedMessage) {
        continue;
      }

      // 회사폰 동기화는 실제 등록된 고객과 매칭되는 문자만 기록 (개인 문자·카드승인·스팸 차단)
      const matchedInquiry = await findMatchingInquiry(ctx, normalizedPhone);
      if (!matchedInquiry) {
        continue;
      }

      if (item.direction === "inbound") {
        const recentLogs = await ctx.db
          .query("sms_logs")
          .withIndex("by_customerPhone_and_createdAt", (q) =>
            q.eq("customerPhone", normalizedPhone).gte("createdAt", now - 90_000)
          )
          .collect();

        const isDup = recentLogs.some(
          (l) => l.direction === "inbound" && l.message.trim() === trimmedMessage
        );
        if (isDup) continue;

        await ctx.db.insert("sms_logs", {
          inquiryId: matchedInquiry._id,
          customerName: matchedInquiry.name,
          customerPhone: normalizedPhone,
          smsType: "고객답장",
          message: trimmedMessage,
          status: "수신",
          direction: "inbound",
          isRead: false,
          createdAt: now,
        });

        await ctx.scheduler.runAfter(0, internal.sms.sendInboundSmsDiscordNotification, {
          customerName: matchedInquiry.name,
          customerPhone: normalizedPhone,
          productName: matchedInquiry.productName,
          appliance: matchedInquiry.appliance,
          message: trimmedMessage,
          matched: true,
        });
        syncedCount += 1;
      } else {
        // 회사폰에서 직접 보낸 문자: 최근 3분 내 어드민에서 발송한 문자(또는 분할 조각)와 겹치면 중복 제외
        const recentLogs = await ctx.db
          .query("sms_logs")
          .withIndex("by_customerPhone_and_createdAt", (q) =>
            q.eq("customerPhone", normalizedPhone).gte("createdAt", now - 180_000)
          )
          .collect();

        const isDup = recentLogs.some((l) => {
          if (l.direction === "inbound") return false;
          const existing = l.message.trim();
          return (
            existing === trimmedMessage ||
            (trimmedMessage.length >= 10 && existing.includes(trimmedMessage))
          );
        });
        if (isDup) continue;

        await ctx.db.insert("sms_logs", {
          inquiryId: matchedInquiry._id,
          customerName: matchedInquiry.name,
          customerPhone: normalizedPhone,
          smsType: "휴대폰발신",
          message: trimmedMessage,
          status: "성공",
          senderName: "회사폰 직접발송",
          direction: "outbound",
          createdAt: now,
        });
        syncedCount += 1;
      }
    }

    return { ok: true, synced: syncedCount };
  },
});

export const listByInquiry = query({
  args: {
    inquiryId: v.id("inquiries"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sms_logs")
      .withIndex("by_inquiryId_and_createdAt", (q) => q.eq("inquiryId", args.inquiryId))
      .order("desc")
      .take(100);
  },
});

export const getUnreadInboundCounts = query({
  args: {},
  handler: async (ctx) => {
    const unreadLogs = await ctx.db
      .query("sms_logs")
      .withIndex("by_direction_and_isRead", (q) =>
        q.eq("direction", "inbound").eq("isRead", false)
      )
      .collect();

    const counts: Record<string, number> = {};
    for (const log of unreadLogs) {
      if (log.inquiryId) {
        const key = String(log.inquiryId);
        counts[key] = (counts[key] || 0) + 1;
      }
    }
    return counts;
  },
});

export const getLatestSmsByInquiry = query({
  args: {},
  handler: async (ctx) => {
    const recentLogs = await ctx.db
      .query("sms_logs")
      .withIndex("by_createdAt")
      .order("desc")
      .take(1000);

    const latest: Record<
      string,
      {
        message: string;
        direction: "outbound" | "inbound";
        smsType: string;
        status: string;
        isRead?: boolean;
        createdAt: number;
      }
    > = {};

    for (const log of recentLogs) {
      if (!log.inquiryId) continue;
      const key = String(log.inquiryId);
      if (latest[key]) continue;
      latest[key] = {
        message: log.message,
        direction: log.direction ?? "outbound",
        smsType: log.smsType,
        status: log.status,
        isRead: log.isRead,
        createdAt: log.createdAt,
      };
    }

    return latest;
  },
});

export const markInboundRead = mutation({
  args: {
    inquiryId: v.id("inquiries"),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("sms_logs")
      .withIndex("by_inquiryId_and_createdAt", (q) => q.eq("inquiryId", args.inquiryId))
      .collect();

    let updated = 0;
    for (const log of logs) {
      if (log.direction === "inbound" && log.isRead !== true) {
        await ctx.db.patch(log._id, { isRead: true });
        updated += 1;
      }
    }
    return { updated };
  },
});

export const recordInboundSms = internalMutation({
  args: {
    senderPhone: v.string(),
    receiverNumber: v.optional(v.string()),
    message: v.string(),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedPhone = normalizeKoreanPhone(args.senderPhone);
    const trimmedMessage = args.message.trim();
    if (!normalizedPhone || !trimmedMessage) {
      return { ok: false, reason: "missing_phone_or_message" };
    }

    const now = Date.now();
    const recentLogs = await ctx.db
      .query("sms_logs")
      .withIndex("by_customerPhone_and_createdAt", (q) =>
        q.eq("customerPhone", normalizedPhone).gte("createdAt", now - 60_000)
      )
      .collect();
    if (recentLogs.some((l) => l.direction === "inbound" && l.message.trim() === trimmedMessage)) {
      return { ok: true, skippedDuplicate: true };
    }

    const matchedInquiry = await findMatchingInquiry(ctx, normalizedPhone);

    await ctx.db.insert("sms_logs", {
      inquiryId: matchedInquiry?._id,
      customerName: matchedInquiry?.name,
      customerPhone: normalizedPhone,
      smsType: "고객답장",
      title: args.title,
      message: trimmedMessage,
      status: "수신",
      direction: "inbound",
      isRead: false,
      receiverNumber: args.receiverNumber,
      createdAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.sms.sendInboundSmsDiscordNotification, {
      customerName: matchedInquiry?.name || "미등록 고객",
      customerPhone: normalizedPhone,
      productName: matchedInquiry?.productName,
      appliance: matchedInquiry?.appliance,
      message: trimmedMessage,
      matched: Boolean(matchedInquiry),
    });

    return {
      ok: true,
      inquiryId: matchedInquiry?._id ?? null,
      customerName: matchedInquiry?.name ?? null,
    };
  },
});

export const sendInboundSmsDiscordNotification = internalAction({
  args: {
    customerName: v.string(),
    customerPhone: v.string(),
    productName: v.optional(v.string()),
    appliance: v.optional(v.string()),
    message: v.string(),
    matched: v.boolean(),
  },
  handler: async (_ctx, args) => {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    const fields = [
      { name: "👤 고객명", value: args.customerName, inline: true },
      { name: "📞 발신번호", value: args.customerPhone, inline: true },
    ];
    if (args.productName || args.appliance) {
      fields.push({
        name: "📦 신청상품 / 가전",
        value: [args.productName, args.appliance].filter(Boolean).join(" / "),
        inline: false,
      });
    }
    fields.push({
      name: "💬 답장 내용",
      value: args.message.slice(0, 1000),
      inline: false,
    });

    const discordMessage = {
      embeds: [
        {
          title: args.matched
            ? "💬 고객 문자 답장이 도착했습니다!"
            : "💬 미등록 번호에서 문자 답장이 도착했습니다",
          color: args.matched ? 0xef4444 : 0xf59e0b,
          fields,
          footer: {
            text: `효원결합 문자 수신 알림 | 수신시간: ${new Date(Date.now() + 9 * 60 * 60 * 1000)
              .toISOString()
              .replace("T", " ")
              .slice(0, 19)} (KST)`,
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordMessage),
      });
    } catch (err) {
      console.error("Failed to send inbound SMS Discord notification:", err);
    }
  },
});

// 구매동의서 발송 Action (회사폰 브릿지 / 알리고 자동 분기)
export const sendConsentSms = action({
  args: {
    inquiryId: v.id("inquiries"),
    customerName: v.string(),
    customerPhone: v.string(),
    productName: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.runQuery(api.settings.get);
    const smsConfig = (settings as any)?.sms;
    const provider = smsConfig?.provider || "aligo";

    const consentPageUrl = smsConfig?.consentPageUrl
      ? `${smsConfig.consentPageUrl}?id=${args.inquiryId}`
      : `https://hyowon-life.com/consent?id=${args.inquiryId}`;

    const defaultMessage = `[효원상조] {고객명}님, 결합제품 구매동의서가 도착했습니다.\n\n아래 링크를 클릭하여 동의서를 확인하고 서명해주세요.\n{동의서링크}\n\n문의: 1588-0883`;
    const messageTemplate = smsConfig?.consentMessage || defaultMessage;
    const message = messageTemplate
      .replace("{고객명}", args.customerName)
      .replace("{동의서링크}", consentPageUrl)
      .replace("{상품명}", args.productName);

    if (provider === "phone_bridge") {
      if (!smsConfig?.bridgeSecret) {
        throw new Error("회사폰 연동 보안키가 설정되지 않았습니다. 환경설정 > 문자 연동 설정을 확인해주세요.");
      }
      await ctx.runMutation(internal.sms.enqueuePhoneOutbox, {
        inquiryId: args.inquiryId,
        customerName: args.customerName,
        customerPhone: args.customerPhone,
        smsType: "구매동의서",
        title: "[효원상조] 구매동의서 안내",
        message,
      });
      await ctx.runMutation(api.inquiries.update, {
        id: args.inquiryId,
        consentStatus: "발송완료",
        consentSentDate: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split("T")[0],
      });
      return { success: true, message: "회사폰으로 동의서 문자 발송 요청을 전달했습니다." };
    }

    if (!smsConfig || !smsConfig.apiKey || !smsConfig.userId || !smsConfig.sender) {
      throw new Error("SMS 설정이 완료되지 않았습니다. 환경설정 > 문자 연동 설정에서 정보를 입력해주세요.");
    }

    const formData = new URLSearchParams();
    formData.append("key", smsConfig.apiKey);
    formData.append("user_id", smsConfig.userId);
    formData.append("sender", smsConfig.sender);
    formData.append("receiver", args.customerPhone.replace(/-/g, ""));
    formData.append("msg", message);
    formData.append("msg_type", "LMS");
    formData.append("title", "[효원상조] 구매동의서 안내");

    try {
      const response = await fetch("https://apis.aligo.in/send/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const result = await response.json();

      if (result.result_code === "1") {
        await ctx.runMutation(api.inquiries.update, {
          id: args.inquiryId,
          consentStatus: "발송완료",
          consentSentDate: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split("T")[0],
        });
        await ctx.runMutation(internal.sms.logSms, {
          inquiryId: args.inquiryId,
          customerName: args.customerName,
          customerPhone: args.customerPhone,
          smsType: "구매동의서",
          title: "[효원상조] 구매동의서 안내",
          message,
          status: "성공",
        });
        return { success: true, message: "문자 발송이 완료되었습니다." };
      } else {
        const errMsg = `알리고 발송 실패: ${result.message || "알 수 없는 오류"}`;
        await ctx.runMutation(internal.sms.logSms, {
          inquiryId: args.inquiryId,
          customerName: args.customerName,
          customerPhone: args.customerPhone,
          smsType: "구매동의서",
          title: "[효원상조] 구매동의서 안내",
          message,
          status: "실패",
          errorMessage: errMsg,
        });
        throw new Error(errMsg);
      }
    } catch (error: any) {
      if (!error.message?.startsWith("알리고 발송 실패:")) {
        await ctx.runMutation(internal.sms.logSms, {
          inquiryId: args.inquiryId,
          customerName: args.customerName,
          customerPhone: args.customerPhone,
          smsType: "구매동의서",
          title: "[효원상조] 구매동의서 안내",
          message,
          status: "실패",
          errorMessage: error.message || "알 수 없는 오류",
        });
      }
      throw new Error(`SMS 발송 중 오류: ${error.message}`);
    }
  },
});

// 테스트 발송
export const sendTestSms = action({
  args: {
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.runQuery(api.settings.get);
    const smsConfig = (settings as any)?.sms;
    const provider = smsConfig?.provider || "aligo";

    if (provider === "phone_bridge") {
      if (!smsConfig?.bridgeSecret) {
        return { success: false, message: "회사폰 연동 보안키를 먼저 설정 후 저장해주세요." };
      }
      await ctx.runMutation(internal.sms.enqueuePhoneOutbox, {
        customerPhone: args.phone,
        smsType: "테스트",
        title: "[효원상조] 연동 테스트",
        message: "[효원상조] 회사폰 문자 연동 테스트 메시지입니다.",
        senderName: "테스트",
      });
      return {
        success: true,
        message: "회사폰으로 실제 테스트 발송 요청을 보냈습니다! 회사폰 문자함을 확인해보세요.",
      };
    }

    if (!smsConfig || !smsConfig.apiKey || !smsConfig.userId || !smsConfig.sender) {
      throw new Error("SMS 설정이 완료되지 않았습니다.");
    }

    const formData = new URLSearchParams();
    formData.append("key", smsConfig.apiKey);
    formData.append("user_id", smsConfig.userId);
    formData.append("sender", smsConfig.sender);
    formData.append("receiver", args.phone.replace(/-/g, ""));
    formData.append("msg", "[효원상조] SMS 연동 테스트 메시지입니다.");
    formData.append("msg_type", "SMS");
    formData.append("testmode_yn", "Y");

    try {
      const response = await fetch("https://apis.aligo.in/send/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const result = await response.json();

      if (result.result_code === "1") {
        return { success: true, message: "테스트 발송 성공 (실제 발송되지 않음)" };
      } else {
        return { success: false, message: `발송 실패: ${result.message || "알 수 없는 오류"}` };
      }
    } catch (error: any) {
      return { success: false, message: `오류: ${error.message}` };
    }
  },
});

// 잔여 건수 조회
export const getRemainCount = action({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.runQuery(api.settings.get);
    const smsConfig = (settings as any)?.sms;

    if (!smsConfig || !smsConfig.apiKey || !smsConfig.userId) {
      return { success: false, remain: 0, message: "SMS 설정이 완료되지 않았습니다." };
    }

    const formData = new URLSearchParams();
    formData.append("key", smsConfig.apiKey);
    formData.append("user_id", smsConfig.userId);

    try {
      const response = await fetch("https://apis.aligo.in/remain/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const result = await response.json();

      if (result.result_code === "1") {
        return {
          success: true,
          remain: {
            sms: result.SMS_CNT || 0,
            lms: result.LMS_CNT || 0,
            mms: result.MMS_CNT || 0,
          },
          message: "조회 성공",
        };
      } else {
        return { success: false, remain: 0, message: result.message || "조회 실패" };
      }
    } catch (error: any) {
      return { success: false, remain: 0, message: `오류: ${error.message}` };
    }
  },
});

export const sendCustomGuideSms = action({
  args: {
    inquiryId: v.optional(v.id("inquiries")),
    customerName: v.optional(v.string()),
    customerPhone: v.string(),
    smsType: v.optional(v.string()),
    senderName: v.optional(v.string()),
    title: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.runQuery(api.settings.get);
    const smsConfig = (settings as any)?.sms;
    const provider = smsConfig?.provider || "aligo";

    const smsTitle = args.title || "[효원상조] 상품 안내";
    const smsType = args.smsType || "상품안내";

    if (provider === "phone_bridge") {
      if (!smsConfig?.bridgeSecret) {
        throw new Error(
          "회사폰 연동 보안키가 설정되지 않았습니다. 환경설정 > 문자 연동 설정에서 보안키를 저장해주세요."
        );
      }
      await ctx.runMutation(internal.sms.enqueuePhoneOutbox, {
        inquiryId: args.inquiryId,
        customerName: args.customerName,
        customerPhone: args.customerPhone,
        smsType,
        title: smsTitle,
        message: args.message,
        senderName: args.senderName,
      });
      return {
        success: true,
        message: "회사폰으로 문자 발송 요청을 전달했습니다. (잠시 후 회사폰에서 발송됩니다)",
      };
    }

    if (!smsConfig || !smsConfig.apiKey || !smsConfig.userId || !smsConfig.sender) {
      throw new Error("SMS 설정이 완료되지 않았습니다. 환경설정 > 문자 연동 설정에서 정보를 입력해주세요.");
    }

    const formData = new URLSearchParams();
    formData.append("key", smsConfig.apiKey);
    formData.append("user_id", smsConfig.userId);
    formData.append("sender", smsConfig.sender);
    formData.append("receiver", args.customerPhone.replace(/-/g, ""));
    formData.append("msg", args.message);
    formData.append("msg_type", "LMS");
    formData.append("title", smsTitle);

    try {
      const response = await fetch("https://apis.aligo.in/send/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const result = await response.json();
      if (result.result_code === "1") {
        await ctx.runMutation(internal.sms.logSms, {
          inquiryId: args.inquiryId,
          customerName: args.customerName,
          customerPhone: args.customerPhone,
          smsType,
          title: smsTitle,
          message: args.message,
          status: "성공",
          senderName: args.senderName,
        });
        return { success: true, message: "문자 발송이 완료되었습니다." };
      }
      const errMsg = `알리고 발송 실패: ${result.message || "알 수 없는 오류"}`;
      await ctx.runMutation(internal.sms.logSms, {
        inquiryId: args.inquiryId,
        customerName: args.customerName,
        customerPhone: args.customerPhone,
        smsType,
        title: smsTitle,
        message: args.message,
        status: "실패",
        errorMessage: errMsg,
        senderName: args.senderName,
      });
      throw new Error(errMsg);
    } catch (error: any) {
      if (!error.message?.startsWith("알리고 발송 실패:")) {
        await ctx.runMutation(internal.sms.logSms, {
          inquiryId: args.inquiryId,
          customerName: args.customerName,
          customerPhone: args.customerPhone,
          smsType,
          title: smsTitle,
          message: args.message,
          status: "실패",
          errorMessage: error.message || "알 수 없는 오류",
          senderName: args.senderName,
        });
      }
      throw new Error(`SMS 발송 중 오류: ${error.message}`);
    }
  },
});

export const sendLgAutoGuideSms = internalAction({
  args: {
    inquiryId: v.optional(v.id("inquiries")),
    customerName: v.string(),
    customerPhone: v.string(),
    appliance: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.runQuery(api.settings.get);
    const smsConfig = (settings as any)?.sms;
    const provider = smsConfig?.provider || "aligo";

    const receiver = args.customerPhone.replace(/[^0-9]/g, "");
    if (receiver.length < 10) {
      return { success: false, skipped: true };
    }

    const templates = (settings as any)?.guideTemplates;
    const firstTemplate =
      Array.isArray(templates) && templates.length > 0
        ? templates[0]
        : DEFAULT_GUIDE_TEMPLATES[0];

    const safeName = args.customerName.trim() || "고객";
    const trimmedModel = (args.appliance || "").trim();
    const hasSpecificModel =
      Boolean(trimmedModel) &&
      trimmedModel !== "-" &&
      trimmedModel !== "아직 고민 중" &&
      trimmedModel !== "가전 선택 전" &&
      !trimmedModel.includes("제품선택");
    const safeModel = hasSpecificModel ? trimmedModel : "LG 가전구독";

    const message = String(firstTemplate.content || "")
      .replaceAll("{고객명}", safeName)
      .replaceAll("{모델명}", safeModel);

    if (!message.trim()) {
      return { success: false, skipped: true };
    }

    if (provider === "phone_bridge") {
      if (!smsConfig?.bridgeSecret) {
        return { success: false, skipped: true };
      }
      await ctx.runMutation(internal.sms.enqueuePhoneOutbox, {
        inquiryId: args.inquiryId,
        customerName: args.customerName,
        customerPhone: args.customerPhone,
        smsType: "자동안내",
        title: "[효원상조 × LG가전구독] 상품 안내",
        message,
        senderName: "자동발송",
      });
      return { success: true, queued: true };
    }

    if (!smsConfig || !smsConfig.apiKey || !smsConfig.userId || !smsConfig.sender) {
      return { success: false, skipped: true };
    }

    const formData = new URLSearchParams();
    formData.append("key", smsConfig.apiKey);
    formData.append("user_id", smsConfig.userId);
    formData.append("sender", smsConfig.sender);
    formData.append("receiver", receiver);
    formData.append("msg", message);
    formData.append("msg_type", "LMS");
    formData.append("title", "[효원상조 × LG가전구독] 상품 안내");

    try {
      const response = await fetch("https://apis.aligo.in/send/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });
      const result = await response.json();
      const isSuccess = result.result_code === "1";
      await ctx.runMutation(internal.sms.logSms, {
        inquiryId: args.inquiryId,
        customerName: args.customerName,
        customerPhone: args.customerPhone,
        smsType: "자동안내",
        title: "[효원상조 × LG가전구독] 상품 안내",
        message,
        status: isSuccess ? "성공" : "실패",
        errorMessage: isSuccess ? undefined : (result.message || "알 수 없는 오류"),
        senderName: "자동발송",
      });
      return { success: isSuccess, result };
    } catch (error: any) {
      console.error("sendLgAutoGuideSms failed:", error);
      await ctx.runMutation(internal.sms.logSms, {
        inquiryId: args.inquiryId,
        customerName: args.customerName,
        customerPhone: args.customerPhone,
        smsType: "자동안내",
        title: "[효원상조 × LG가전구독] 상품 안내",
        message,
        status: "실패",
        errorMessage: error?.message || "알 수 없는 오류",
        senderName: "자동발송",
      });
      return { success: false, error: error?.message };
    }
  },
});
