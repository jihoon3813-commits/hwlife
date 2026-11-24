import { action, internalAction, internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { formatKoreanPhone } from "./sms";

const isLgCareInquiry = (fields: {
  source?: string;
  productName?: string;
  appliance?: string;
  isLgCare?: boolean;
}) => {
  const productName = fields.productName || "";
  const appliance = fields.appliance || "";
  return (
    Boolean(fields.isLgCare) ||
    fields.source === "lg_care" ||
    productName.includes("LG구독") ||
    productName.includes("구독144") ||
    productName.includes("LG가전구독") ||
    productName.includes("LG가전 구독") ||
    productName.includes("LG가전 구독 할인 전용") ||
    productName.includes("할인코드") ||
    appliance.includes("할인코드") ||
    appliance.includes("퓨리케어") ||
    appliance.includes("에어로타워") ||
    (productName.startsWith("LG") && !productName.includes("("))
  );
};

// Create a new inquiry
export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    productName: v.string(),
    message: v.optional(v.string()),
    channelId: v.optional(v.string()),
    gender: v.optional(v.string()),
    birth: v.optional(v.string()),
    address: v.optional(v.string()),
    detailAddress: v.optional(v.string()),
    account: v.optional(v.string()),
    appliance: v.optional(v.string()),
    supplier: v.optional(v.string()),
    subscriptionPeriod: v.optional(v.string()),
    careCycle: v.optional(v.string()),
    careType: v.optional(v.string()),
    status: v.optional(v.string()),
    source: v.optional(v.string()),
    inflow: v.optional(v.string()),
    trafficChannel: v.optional(v.string()),
    trafficLabel: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
    referrer: v.optional(v.string()),
    deviceType: v.optional(v.string()),
    // Compatibility fields for various landing forms
    subdomain: v.optional(v.string()),
    callTime: v.optional(v.string()),
    landingPath: v.optional(v.string()),
    memo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const effectiveChannelId = args.channelId || args.subdomain;
    
    // Compose clean message if extra fields are provided
    let combinedMessage = args.message || args.memo || "";
    if (args.callTime && !combinedMessage.includes(args.callTime)) {
      combinedMessage = combinedMessage ? `${combinedMessage} | 희망시간: ${args.callTime}` : `희망시간: ${args.callTime}`;
    }
    if (args.landingPath && !combinedMessage.includes(args.landingPath)) {
      combinedMessage = combinedMessage ? `${combinedMessage} | 유입경로: ${args.landingPath}` : `유입경로: ${args.landingPath}`;
    }

    const formattedPhone = formatKoreanPhone(args.phone);
    const insertData: Record<string, any> = {
      name: args.name,
      phone: formattedPhone,
      productName: args.productName,
      status: "대기",
      createdAt: Date.now(),
    };

    if (combinedMessage) insertData.message = combinedMessage;
    if (effectiveChannelId) insertData.channelId = effectiveChannelId;
    if (args.gender) insertData.gender = args.gender;
    if (args.birth) insertData.birth = args.birth;
    if (args.address) insertData.address = args.address;
    if (args.detailAddress) insertData.detailAddress = args.detailAddress;
    if (args.account) insertData.account = args.account;
    if (args.appliance) insertData.appliance = args.appliance;
    if (isLgCareInquiry({ source: args.source, productName: args.productName, appliance: args.appliance })) {
      insertData.supplier = "라이프앤조이";
    } else if (args.supplier) {
      insertData.supplier = args.supplier;
    }
    if (args.subscriptionPeriod) insertData.subscriptionPeriod = args.subscriptionPeriod;
    if (args.careCycle) insertData.careCycle = args.careCycle;
    if (args.careType) insertData.careType = args.careType;
    if (args.source) insertData.source = args.source;
    if (args.inflow) {
      insertData.inflow = args.inflow;
    } else if (args.source === "direct") {
      insertData.inflow = "direct";
    } else if (args.source === "daangn") {
      insertData.inflow = "daangn";
    } else {
      insertData.inflow = "landing";
    }

    if (args.trafficChannel) insertData.trafficChannel = args.trafficChannel;
    if (args.trafficLabel) insertData.trafficLabel = args.trafficLabel;
    else if (insertData.inflow === "daangn") {
      insertData.trafficChannel = "daangn_ad";
      insertData.trafficLabel = "당근 리드폼";
    }
    if (args.utmSource) insertData.utmSource = args.utmSource;
    if (args.utmMedium) insertData.utmMedium = args.utmMedium;
    if (args.utmCampaign) insertData.utmCampaign = args.utmCampaign;
    if (args.utmContent) insertData.utmContent = args.utmContent;
    if (args.utmTerm) insertData.utmTerm = args.utmTerm;
    if (args.referrer) insertData.referrer = args.referrer;
    if (args.deviceType) insertData.deviceType = args.deviceType;

    const id = await ctx.db.insert("inquiries", insertData as any);

    // Add channel name to discord notification if available
    let channelName = "기본";
    if (effectiveChannelId) {
        const channel = await ctx.db
            .query("channels")
            .filter((q) => q.eq(q.field("subdomain"), effectiveChannelId))
            .first();
        if (channel) channelName = channel.channelName;
    }

    await ctx.scheduler.runAfter(0, internal.inquiries.sendDiscordNotification, {
      name: args.name,
      phone: args.phone,
      productName: args.productName,
      message: combinedMessage || undefined,
      channelName: channelName,
      trafficLabel: insertData.trafficLabel || undefined,
    });

    if (
      insertData.inflow !== "direct" &&
      isLgCareInquiry({ source: args.source, productName: args.productName, appliance: args.appliance })
    ) {
      await ctx.scheduler.runAfter(0, internal.sms.sendLgAutoGuideSms, {
        inquiryId: id,
        customerName: args.name,
        customerPhone: args.phone,
        appliance: args.appliance,
      });
    }
    return id;
  },
});

export const sendDiscordNotification = internalAction({
  args: {
    name: v.string(),
    phone: v.string(),
    productName: v.string(),
    message: v.optional(v.string()),
    channelName: v.optional(v.string()),
    trafficLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    const fields = [
      { name: "👤 성함", value: args.name, inline: true },
      { name: "📞 연락처", value: args.phone, inline: true },
      { name: "🏢 유입 채널", value: args.channelName || "기본", inline: true },
    ];
    if (args.trafficLabel) {
      fields.push({ name: "🧭 상세 유입경로", value: args.trafficLabel, inline: true });
    }
    fields.push(
      { name: "📦 신청 상품", value: args.productName, inline: false },
      { name: "💬 문의 내용", value: args.message || "내용 없음", inline: false },
    );

    const discordMessage = {
      embeds: [{
        title: "🔔 새로운 상담 신청이 접수되었습니다!",
        color: 0x3182F6,
        fields,
        footer: { text: `효원결합 상담 관리 시스템 | 접수시간: ${new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)} (KST)` },
        timestamp: new Date().toISOString(),
      }]
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordMessage),
    });
  },
});

// Admin: Get all inquiries with optional channel filter
export const list = query({
  args: { 
    channelId: v.optional(v.string()),
    channelIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("inquiries").order("desc");

    if (args.channelIds && args.channelIds.length > 0) {
        // If multiple IDs provided (Parent-Child hierarchy)
        const allInquiries = await query.collect();
        return allInquiries.filter(i => args.channelIds!.includes(i.channelId || '본사'));
    }

    if (args.channelId) {
        if (args.channelId === 'default' || args.channelId === '본사') {
            return await query
                .filter((q) => q.or(
                    q.eq(q.field("channelId"), undefined),
                    q.eq(q.field("channelId"), "본사"),
                    q.eq(q.field("channelId"), "default")
                ))
                .collect();
        }
        return await query
            .filter((q) => q.eq(q.field("channelId"), args.channelId))
            .collect();
    }
    
    return await query.collect();
  },
});


export const update = mutation({
  args: {
    id: v.id("inquiries"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    status: v.optional(v.string()),
    gender: v.optional(v.string()),
    birth: v.optional(v.string()),
    address: v.optional(v.string()),
    detailAddress: v.optional(v.string()),
    newRegDate: v.optional(v.string()),
    cardPaymentDate: v.optional(v.string()),
    purchaseConsentDate: v.optional(v.string()),
    sangjoContractDate: v.optional(v.string()),
    rentalContractDate: v.optional(v.string()),
    cancelDate: v.optional(v.string()),
    terminationDate: v.optional(v.string()),
    deliveryDate: v.optional(v.string()),
    consentStatus: v.optional(v.string()),
    consentFileUrl: v.optional(v.string()),
    consentSentDate: v.optional(v.string()),
    note: v.optional(v.string()),
    account: v.optional(v.string()),
    appliance: v.optional(v.string()),
    supplier: v.optional(v.string()),
    subscriptionPeriod: v.optional(v.string()),
    careCycle: v.optional(v.string()),
    careType: v.optional(v.string()),
    memoHistory: v.optional(v.array(
      v.object({
        date: v.string(),
        status: v.string(),
        memo: v.string(),
        writer: v.optional(v.string())
      })
    )),
    productName: v.optional(v.string()),
    channelId: v.optional(v.string()),
    source: v.optional(v.string()),
    inflow: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    if (updates.phone !== undefined) {
      updates.phone = formatKoreanPhone(updates.phone);
    }
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("inquiries") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// 동의서 페이지용 - ID로 단건 조회 (공개)
export const getById = query({
  args: { id: v.id("inquiries") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) return null;
    // 고객에게 필요한 정보만 반환 (보안)
    return {
      _id: doc._id,
      name: doc.name,
      phone: doc.phone,
      productName: doc.productName,
      account: doc.account,
      appliance: doc.appliance,
      consentStatus: doc.consentStatus,
      purchaseConsentDate: doc.purchaseConsentDate,
    };
  },
});

// 동의서 서명 완료 처리
export const completeConsent = mutation({
  args: {
    id: v.id("inquiries"),
    signatureData: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toISOString().replace("T", " ").slice(0, 19);
    
    await ctx.db.patch(args.id, {
      consentStatus: "서명완료",
      purchaseConsentDate: dateStr,
      consentFileUrl: args.signatureData || undefined,
    });
  },
});

export const markGoogleContactsSynced = mutation({
  args: {
    ids: v.array(v.id("inquiries")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const id of args.ids) {
      const doc = await ctx.db.get(id);
      if (doc && !doc.googleContactsSyncedAt) {
        await ctx.db.patch(id, { googleContactsSyncedAt: now });
      }
    }
  },
});

// 당근 리드폼 외부 연동 접수용
export const createDaangnLead = internalMutation({
  args: {
    name: v.string(),
    phone: v.string(),
    productName: v.optional(v.string()),
    appliance: v.optional(v.string()),
    account: v.optional(v.string()),
    supplier: v.optional(v.string()),
    subscriptionPeriod: v.optional(v.string()),
    careCycle: v.optional(v.string()),
    careType: v.optional(v.string()),
    address: v.optional(v.string()),
    detailAddress: v.optional(v.string()),
    message: v.optional(v.string()),
    channelId: v.optional(v.string()),
    isLgCare: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const productText = args.productName || "당근 리드폼 상담 신청";
    const combinedText = `${productText} ${args.appliance || ""} ${args.message || ""}`;
    const isLg =
      isLgCareInquiry({
        isLgCare: args.isLgCare,
        productName: args.productName,
        appliance: args.appliance,
      }) ||
      combinedText.includes("LG") ||
      combinedText.includes("구독");

    const formattedPhone = formatKoreanPhone(args.phone);
    const insertData: Record<string, any> = {
      name: args.name,
      phone: formattedPhone,
      productName: isLg && !args.productName ? "LG구독할인(new)" : productText,
      status: "대기",
      createdAt: Date.now(),
      source: isLg ? "lg_care" : "daangn",
      inflow: "daangn",
      channelId: args.channelId || "본사",
    };

    if (args.appliance) insertData.appliance = args.appliance;
    if (args.account) insertData.account = args.account;
    if (isLg) insertData.supplier = "라이프앤조이";
    else if (args.supplier) insertData.supplier = args.supplier;
    if (args.subscriptionPeriod) insertData.subscriptionPeriod = args.subscriptionPeriod;
    if (args.careCycle) insertData.careCycle = args.careCycle;
    if (args.careType) insertData.careType = args.careType;
    if (args.address) insertData.address = args.address;
    if (args.detailAddress) insertData.detailAddress = args.detailAddress;
    if (args.message) insertData.message = `[당근리드폼] ${args.message}`;
    else insertData.message = "[당근리드폼 외부연동 접수]";

    const id = await ctx.db.insert("inquiries", insertData as any);

    await ctx.scheduler.runAfter(0, internal.inquiries.sendDiscordNotification, {
      name: args.name,
      phone: args.phone,
      productName: `[당근리드폼] ${insertData.productName}`,
      message: insertData.message,
      channelName: args.channelId || "본사",
    });

    if (isLg) {
      await ctx.scheduler.runAfter(0, internal.sms.sendLgAutoGuideSms, {
        inquiryId: id,
        customerName: args.name,
        customerPhone: args.phone,
        appliance: args.appliance,
      });
    }

    return id;
  },
});

export const createLg144Application = internalMutation({
  args: {
    name: v.string(),
    phone: v.string(),
    note: v.optional(v.string()),
    productId: v.string(),
    model: v.string(),
    applianceName: v.optional(v.string()),
    optionIndex: v.number(),
    subscriptionPeriod: v.optional(v.string()),
    careCycle: v.optional(v.string()),
    careType: v.optional(v.string()),
    monthlySale: v.optional(v.number()),
    catalogDate: v.optional(v.string()),
    consentVersion: v.optional(v.string()),
    requestKey: v.string(),
    payloadHash: v.string(),
    receipt: v.string(),
    channelId: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("inquiries")
      .withIndex("by_requestKey", (q) => q.eq("requestKey", args.requestKey))
      .first();

    if (existing) {
      if (existing.payloadHash && existing.payloadHash !== args.payloadHash) {
        return { ok: false as const, status: 409, error: "접수 내용이 바뀌었습니다. 다시 신청해 주세요." };
      }
      return { ok: true as const, status: 200, receipt: existing.receipt || args.receipt };
    }

    const applianceLabel = args.applianceName
      ? `${args.applianceName} (${args.model})`
      : args.model;

    const optionSummary = [
      args.subscriptionPeriod,
      args.careType,
      args.careCycle,
      args.monthlySale ? `월 ${args.monthlySale.toLocaleString("ko-KR")}원` : undefined,
    ]
      .filter(Boolean)
      .join(" / ");

    const messageParts = [
      `[카톡안내창] 접수번호: ${args.receipt}`,
      `모델: ${applianceLabel}`,
      optionSummary ? `조건: ${optionSummary}` : "조건: 전화로 상세 조건 확인",
      args.note ? `문의: ${args.note}` : undefined,
      args.catalogDate ? `카탈로그: ${args.catalogDate}` : undefined,
      args.consentVersion ? `동의버전: ${args.consentVersion}` : undefined,
    ].filter(Boolean);

    const combinedMessage = messageParts.join(" | ");

    const formattedPhone = formatKoreanPhone(args.phone);
    const insertData: Record<string, any> = {
      name: args.name,
      phone: formattedPhone,
      productName: "LG가전구독(new) (1구좌)",
      account: "1구좌",
      appliance: applianceLabel,
      supplier: "라이프앤조이",
      status: "대기",
      createdAt: Date.now(),
      message: combinedMessage,
      source: "lg_care",
      inflow: "landing",
      trafficChannel: "kakao_guide",
      trafficLabel: "카톡 안내창 (LG구독144)",
      requestKey: args.requestKey,
      receipt: args.receipt,
      payloadHash: args.payloadHash,
    };

    if (args.subscriptionPeriod) insertData.subscriptionPeriod = args.subscriptionPeriod;
    if (args.careCycle) insertData.careCycle = args.careCycle;
    if (args.careType) insertData.careType = args.careType;
    if (args.consentVersion) insertData.consentVersion = args.consentVersion;
    if (args.channelId) insertData.channelId = args.channelId;
    if (args.utmSource) insertData.utmSource = args.utmSource;
    if (args.utmMedium) insertData.utmMedium = args.utmMedium;
    if (args.utmCampaign) insertData.utmCampaign = args.utmCampaign;
    if (args.utmContent) insertData.utmContent = args.utmContent;
    if (args.utmTerm) insertData.utmTerm = args.utmTerm;

    const insertedId = await ctx.db.insert("inquiries", insertData as any);

    let channelName = "기본";
    if (args.channelId) {
      const channel = await ctx.db
        .query("channels")
        .withIndex("by_subdomain", (q) => q.eq("subdomain", args.channelId!))
        .first();
      if (channel) channelName = channel.channelName;
    }

    await ctx.scheduler.runAfter(0, internal.inquiries.sendDiscordNotification, {
      name: args.name,
      phone: args.phone,
      productName: "LG가전구독(new) (1구좌) [카톡안내창]",
      message: combinedMessage,
      channelName,
      trafficLabel: "카톡 안내창 (LG구독144)",
    });

    await ctx.scheduler.runAfter(0, internal.sms.sendLgAutoGuideSms, {
      inquiryId: insertedId,
      customerName: args.name,
      customerPhone: args.phone,
      appliance: applianceLabel,
    });

    return { ok: true as const, status: 201, receipt: args.receipt };
  },
});

export const normalizeAllInquiryPhones = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("inquiries")
      .paginate({ numItems: 200, cursor: args.cursor ?? null });
    let updated = 0;
    for (const doc of page.page) {
      const formatted = formatKoreanPhone(doc.phone || "");
      if (formatted && formatted !== doc.phone) {
        await ctx.db.patch(doc._id, { phone: formatted });
        updated += 1;
      }
    }
    return {
      updated,
      scanned: page.page.length,
      isDone: page.isDone,
      continueCursor: page.continueCursor,
    };
  },
});
