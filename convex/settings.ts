import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const DEFAULT_GUIDE_TEMPLATES = [
  {
    id: "guide-catalog",
    title: "① 가전 목록 · 월 구독료 먼저 안내 (카톡/문자용)",
    content: `안녕하세요, {고객명}님! 라이프앤조이 × 효원상조 전문상담센터입니다.
신청해 주신 {모델명} 결합 상담 안내드립니다.

▶ LG 가전구독 10% 결합할인 모델 & 월 납입액 보기
https://hyowon-life.com/hyowon-talk/index.html#catalog

▶ 카카오톡 1:1 채팅 상담하기
https://pf.kakao.com/_dMfvX/chat

편하신 시간에 확인 후 답장 또는 010-2666-0883으로 연락 주시면 상세 조건 안내드리겠습니다!`,
  },
  {
    id: "guide-benefit",
    title: "② 10% 결합할인 · 상조회비 5,000원 요약 안내",
    content: `{고객명}님, 라이프앤조이 전문상담센터입니다.
문의하신 {모델명} 결합 혜택을 간단히 정리해 드립니다.

• LG 가전 구독료 매월 10% 결합 할인
• 처음 48회 효원상조 회비 월 5,000원(1구좌)
• 49회 이후 계속 납입 또는 납입 유예 선택 가능

▶ 가입 절차 한눈에 보기
https://hyowon-life.com/hyowon-talk/index.html#sign

자세한 견적은 010-2666-0883 또는 카톡(https://pf.kakao.com/_dMfvX/chat)으로 편하게 문의해 주세요.`,
  },
  {
    id: "guide-followup",
    title: "③ 통화 전 사전 안내 / 부재중 팔로업",
    content: `{고객명}님 안녕하세요, 효원상조 × LG가전구독 상담센터(010-2666-0883)입니다.
접수해 주신 {모델명} 상담 관련하여 안내드립니다.

통화가 어려우시다면 아래 카톡 채널로 편하신 통화 시간이나 궁금한 점을 남겨주시면 바로 확인해 드리겠습니다.

▶ 카톡 채널 상담하기
https://pf.kakao.com/_dMfvX/chat
▶ 자주하는 질문 보기
https://hyowon-life.com/hyowon-talk/index.html#faq`,
  },
];

export const get = query({
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").first();
    if (!settings) {
      // Default settings
      return {
        statuses: [
          { name: '신규신청', isUsed: true, color: '#F2F4F6' },
          { name: '부재중', isUsed: true, color: '#FFF8E1' },
          { name: '상담완료', isUsed: true, color: '#E8F3FF' },
          { name: '가입완료', isUsed: true, color: '#E7F9F3' },
          { name: '보류', isUsed: true, color: '#F5F0FF' },
          { name: '취소', isUsed: true, color: '#FFF0F0' },
        ],
        brands: ['삼성전자', 'LG전자', '바디프랜드', '코웨이', '캐리어'],
        categories: ['TV/시청각', '냉장고/김치냉장고', '세탁기/건조기', '안마의자/건강', '기타'],
        footer: {
          companyName: '(주)라이프앤조이',
          representative: '김지훈',
          businessNumber: '388-86-02921',
          phone: '1588-0883',
          address: '경기도 하남시 미사대로 510, 624호(아이에스비즈타워)',
          email: 'lifenjoy0296@gmail.com',
          notice: '가전 계약(렌탈/할부)과 상조 계약은 별도의 독립된 계약입니다. 해약환급금은 납입 기간 및 회차에 따라 상이하며, 중도 해지 시 납입한 금액보다 적거나 없을 수 있습니다. 가전 대금 납입 중 해지 시, 가전 잔여 할부금 및 위약금이 일시 청구될 수 있습니다. 반드시 상품 설명서 및 계약 약관을 확인하시기 바랍니다.'
        },
        sms: undefined,
        headOfficeAccount: undefined,
        guideTemplates: DEFAULT_GUIDE_TEMPLATES,
      };
    }
    return {
      ...settings,
      guideTemplates:
        settings.guideTemplates && settings.guideTemplates.length > 0
          ? settings.guideTemplates
          : DEFAULT_GUIDE_TEMPLATES,
    };
  },
});

export const update = mutation({
  args: {
    id: v.optional(v.id("settings")),
    statuses: v.optional(v.array(v.object({ name: v.string(), isUsed: v.boolean(), color: v.optional(v.string()) }))),
    brands: v.optional(v.array(v.string())),
    categories: v.optional(v.array(v.string())),
    footer: v.optional(v.object({
      companyName: v.string(),
      representative: v.string(),
      businessNumber: v.string(),
      phone: v.string(),
      address: v.string(),
      email: v.string(),
      notice: v.string(),
    })),
    sms: v.optional(v.object({
      provider: v.optional(v.union(v.literal("aligo"), v.literal("phone_bridge"))),
      apiKey: v.optional(v.string()),
      userId: v.optional(v.string()),
      sender: v.optional(v.string()),
      consentMessage: v.optional(v.string()),
      consentPageUrl: v.optional(v.string()),
      bridgeSecret: v.optional(v.string()),
      bridgeLastSeenAt: v.optional(v.number()),
      bridgeDeviceName: v.optional(v.string()),
      bridgeAppVersion: v.optional(v.string()),
      autoFallbackAligo: v.optional(v.boolean()),
      fallbackDelaySeconds: v.optional(v.number()),
    })),
    headOfficeAccount: v.optional(v.object({
      accountId: v.string(),
      password: v.string(),
    })),
    staffAccounts: v.optional(v.array(v.object({
      accountId: v.string(),
      password: v.string(),
      name: v.optional(v.string()),
      role: v.optional(v.string()),
    }))),
    guideTemplates: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      content: v.string(),
    }))),
    googleContacts: v.optional(v.object({
      clientId: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("settings").first();
    
    const data: any = {};
    if (args.statuses !== undefined) data.statuses = args.statuses;
    if (args.brands !== undefined) data.brands = args.brands;
    if (args.categories !== undefined) data.categories = args.categories;
    if (args.footer !== undefined) data.footer = args.footer;
    if (args.sms !== undefined) data.sms = args.sms;
    if (args.headOfficeAccount !== undefined) data.headOfficeAccount = args.headOfficeAccount;
    if (args.staffAccounts !== undefined) data.staffAccounts = args.staffAccounts;
    if (args.guideTemplates !== undefined) data.guideTemplates = args.guideTemplates;
    if (args.googleContacts !== undefined) data.googleContacts = args.googleContacts;

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      // If none exist, we need to provide defaults for the ones not provided
      const defaults = {
        statuses: [
          { name: '신규신청', isUsed: true, color: '#F2F4F6' },
          { name: '부재중', isUsed: true, color: '#FFF8E1' },
          { name: '상담완료', isUsed: true, color: '#E8F3FF' },
          { name: '가입완료', isUsed: true, color: '#E7F9F3' },
          { name: '보류', isUsed: true, color: '#F5F0FF' },
          { name: '취소', isUsed: true, color: '#FFF0F0' },
        ],
        brands: ['삼성전자', 'LG전자', '바디프랜드', '코웨이', '캐리어'],
        categories: ['TV/시청각', '냉장고/김치냉장고', '세탁기/건조기', '안마의자/건강', '기타'],
        footer: {
          companyName: '(주)라이프앤조이',
          representative: '김지훈',
          businessNumber: '388-86-02921',
          phone: '1588-0883',
          address: '경기도 하남시 미사대로 510, 624호(아이에스비즈타워)',
          email: 'lifenjoy0296@gmail.com',
          notice: '가전 계약(렌탈/할부)과 상조 계약은 별도의 독립된 계약입니다. 해약환급금은 납입 기간 및 회차에 따라 상이하며, 중도 해지 시 납입한 금액보다 적거나 없을 수 있습니다. 가전 대금 납입 중 해지 시, 가전 잔여 할부금 및 위약금이 일시 청구될 수 있습니다. 반드시 상품 설명서 및 계약 약관을 확인하시기 바랍니다.'
        }
      };
      const id = await ctx.db.insert("settings", {
        ...defaults,
        ...data
      });
      return id;
    }
  },
});

export const seedHeadOfficeAccount = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("settings").first();
    if (existing && !existing.headOfficeAccount) {
      await ctx.db.patch(existing._id, {
        headOfficeAccount: {
          accountId: "hyowon",
          password: "1111"
        }
      });
    } else if (!existing) {
        await ctx.db.insert("settings", {
            statuses: [],
            brands: [],
            categories: [],
            footer: {
                companyName: '',
                representative: '',
                businessNumber: '',
                phone: '',
                address: '',
                email: '',
                notice: ''
            },
            headOfficeAccount: {
                accountId: "hyowon",
                password: "1111"
            }
        });
    }
  }
});

export const addOrUpdateStaffAccount = mutation({
  args: {
    accountId: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("settings").first();
    if (!existing) return false;
    const currentStaff = (existing as any).staffAccounts || [];
    const idx = currentStaff.findIndex((s: any) => s.accountId === args.accountId);
    let updatedStaff;
    if (idx >= 0) {
      updatedStaff = [...currentStaff];
      updatedStaff[idx] = {
        accountId: args.accountId,
        password: args.password,
        name: args.name || updatedStaff[idx].name || args.accountId,
        role: args.role || updatedStaff[idx].role || 'head_office',
      };
    } else {
      updatedStaff = [
        ...currentStaff,
        {
          accountId: args.accountId,
          password: args.password,
          name: args.name || args.accountId,
          role: args.role || 'head_office',
        },
      ];
    }
    await ctx.db.patch(existing._id, { staffAccounts: updatedStaff });
    return true;
  },
});

export const removeStaffAccount = mutation({
  args: {
    accountId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("settings").first();
    if (!existing) return false;
    const currentStaff = (existing as any).staffAccounts || [];
    const updatedStaff = currentStaff.filter((s: any) => s.accountId !== args.accountId);
    await ctx.db.patch(existing._id, { staffAccounts: updatedStaff });
    return true;
  },
});
