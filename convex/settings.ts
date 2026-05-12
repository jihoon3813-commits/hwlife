import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
        }
      };
    }
    return settings;
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
      apiKey: v.string(),
      userId: v.string(),
      sender: v.string(),
      consentMessage: v.optional(v.string()),
      consentPageUrl: v.optional(v.string()),
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
