import { v } from "convex/values";
import { action, internalAction, internalMutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { DEFAULT_GUIDE_TEMPLATES } from "./settings";

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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("sms_logs", {
      ...args,
      createdAt: Date.now(),
    });
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
      .take(50);
  },
});

// 알리고 SMS 발송 Action
// fetch()는 Convex 기본 런타임에서 사용 가능하므로 "use node" 불필요
export const sendConsentSms = action({
  args: {
    inquiryId: v.id("inquiries"),
    customerName: v.string(),
    customerPhone: v.string(),
    productName: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. settings에서 SMS 설정 가져오기
    const settings = await ctx.runQuery(api.settings.get);
    const smsConfig = (settings as any)?.sms;

    if (!smsConfig || !smsConfig.apiKey || !smsConfig.userId || !smsConfig.sender) {
      throw new Error("SMS 설정이 완료되지 않았습니다. 환경설정 > SMS 설정에서 알리고 API 정보를 입력해주세요.");
    }

    // 2. 동의서 페이지 URL 생성
    const consentPageUrl = smsConfig.consentPageUrl
      ? `${smsConfig.consentPageUrl}?id=${args.inquiryId}`
      : `https://hyowon-life.com/consent?id=${args.inquiryId}`;

    // 3. 메시지 내용 구성
    const defaultMessage = `[효원상조] {고객명}님, 결합제품 구매동의서가 도착했습니다.\n\n아래 링크를 클릭하여 동의서를 확인하고 서명해주세요.\n{동의서링크}\n\n문의: 1588-0883`;

    const messageTemplate = smsConfig.consentMessage || defaultMessage;
    const message = messageTemplate
      .replace("{고객명}", args.customerName)
      .replace("{동의서링크}", consentPageUrl)
      .replace("{상품명}", args.productName);

    // 4. 알리고 API 호출
    const formData = new URLSearchParams();
    formData.append("key", smsConfig.apiKey);
    formData.append("user_id", smsConfig.userId);
    formData.append("sender", smsConfig.sender);
    formData.append("receiver", args.customerPhone.replace(/-/g, ""));
    formData.append("msg", message);
    // LMS 자동 전환 (메시지가 90바이트 초과 시)
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
        // 발송 성공 → inquiry 상태 업데이트
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

// 테스트 발송 (testmode_yn=Y)
export const sendTestSms = action({
  args: {
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.runQuery(api.settings.get);
    const smsConfig = (settings as any)?.sms;

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

    if (!smsConfig || !smsConfig.apiKey || !smsConfig.userId || !smsConfig.sender) {
      throw new Error("SMS 설정이 완료되지 않았습니다. 환경설정 > SMS 설정에서 알리고 API 정보를 입력해주세요.");
    }

    const smsTitle = args.title || "[효원상조] 상품 안내";
    const smsType = args.smsType || "상품안내";

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
    if (!smsConfig || !smsConfig.apiKey || !smsConfig.userId || !smsConfig.sender) {
      return { success: false, skipped: true };
    }

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
