import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('discount_codes')
      .withIndex('by_createdAt')
      .order('desc')
      .collect();
  },
});

export const verify = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const cleanCode = args.code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, reason: '할인코드를 입력해주세요.' };
    }

    const item = await ctx.db
      .query('discount_codes')
      .withIndex('by_code', (q) => q.eq('code', cleanCode))
      .first();

    if (!item) {
      return { success: false, reason: '유효하지 않은 할인코드입니다. 코드를 다시 확인해주세요.' };
    }

    if (!item.isActive) {
      return { success: false, reason: '사용이 중단(비활성화)된 할인코드입니다.' };
    }

    if (item.expiresAt && item.expiresAt < Date.now()) {
      return { success: false, reason: '사용 유효기간이 만료된 할인코드입니다.' };
    }

    await ctx.db.patch(item._id, {
      useCount: (item.useCount || 0) + 1,
    });

    const now = Date.now();
    return {
      success: true,
      code: item.code,
      customerName: item.customerName,
      memo: item.memo,
      expiresAt: item.expiresAt,
      verifiedAt: now,
    };
  },
});

export const checkCodeValidity = query({
  args: {
    code: v.string(),
    verifiedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const cleanCode = args.code.trim().toUpperCase();
    if (!cleanCode) {
      return { isValid: false, reason: '코드 미입력' };
    }

    const item = await ctx.db
      .query('discount_codes')
      .withIndex('by_code', (q) => q.eq('code', cleanCode))
      .first();

    if (!item) {
      return { isValid: false, reason: '코드가 삭제되었거나 존재하지 않습니다.' };
    }

    if (!item.isActive) {
      return { isValid: false, reason: '사용 중단된 코드입니다.' };
    }

    if (item.expiresAt && item.expiresAt < Date.now()) {
      return { isValid: false, reason: '유효기간이 만료되었습니다.' };
    }

    if (item.lastResetAt && item.lastResetAt > args.verifiedAt) {
      return { isValid: false, reason: '관리자에 의해 인증이 리셋되었습니다.' };
    }

    return { isValid: true, code: item.code };
  },
});

export const resetAuth = mutation({
  args: {
    id: v.id('discount_codes'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      lastResetAt: Date.now(),
    });
  },
});

export const batchResetAuth = mutation({
  args: {
    ids: v.array(v.id('discount_codes')),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const id of args.ids) {
      await ctx.db.patch(id, {
        lastResetAt: now,
      });
    }
  },
});

export const create = mutation({
  args: {
    code: v.string(),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    memo: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const cleanCode = args.code.trim().toUpperCase();
    if (!cleanCode) {
      throw new Error('할인코드를 입력해주세요.');
    }

    const existing = await ctx.db
      .query('discount_codes')
      .withIndex('by_code', (q) => q.eq('code', cleanCode))
      .first();

    if (existing) {
      throw new Error(`이미 등록된 할인코드 [${cleanCode}]입니다.`);
    }

    return await ctx.db.insert('discount_codes', {
      code: cleanCode,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      memo: args.memo,
      expiresAt: args.expiresAt,
      isActive: args.isActive !== undefined ? args.isActive : true,
      createdAt: Date.now(),
      useCount: 0,
    });
  },
});

export const batchCreate = mutation({
  args: {
    count: v.number(),
    prefix: v.optional(v.string()),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    memo: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const count = Math.min(Math.max(1, args.count), 100);
    const prefix = (args.prefix || 'LG').trim().toUpperCase();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const now = Date.now();
    const createdCodes: string[] = [];

    for (let i = 0; i < count; i++) {
      let rand = '';
      for (let j = 0; j < 6; j++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const code = `${prefix}-${rand}`;

      const existing = await ctx.db
        .query('discount_codes')
        .withIndex('by_code', (q) => q.eq('code', code))
        .first();

      if (!existing) {
        await ctx.db.insert('discount_codes', {
          code,
          customerName: args.customerName,
          customerPhone: args.customerPhone,
          memo: args.memo,
          expiresAt: args.expiresAt,
          isActive: true,
          createdAt: now,
          useCount: 0,
        });
        createdCodes.push(code);
      }
    }

    return { count: createdCodes.length, codes: createdCodes };
  },
});

export const remove = mutation({
  args: {
    id: v.id('discount_codes'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const batchDelete = mutation({
  args: {
    ids: v.array(v.id('discount_codes')),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.delete(id);
    }
  },
});

export const toggleActive = mutation({
  args: {
    id: v.id('discount_codes'),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isActive: args.isActive,
    });
  },
});