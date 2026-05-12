import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  handler: async (ctx) => {
    return await ctx.db.query("plans").withIndex("by_order").collect();
  },
});

export const create = mutation({
  args: {
    numericId: v.number(),
    name: v.string(),
    basePrice: v.string(),
    benefitPrice: v.string(),
    mainCount: v.number(),
    isMainActive: v.boolean(),
    accountCount: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const order = args.order ?? (await ctx.db.query("plans").collect()).length;
    return await ctx.db.insert("plans", { ...args, order });
  },
});

export const update = mutation({
  args: {
    id: v.id("plans"),
    numericId: v.optional(v.number()),
    name: v.optional(v.string()),
    basePrice: v.optional(v.string()),
    benefitPrice: v.optional(v.string()),
    mainCount: v.optional(v.number()),
    isMainActive: v.optional(v.boolean()),
    accountCount: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const updateOrder = mutation({
  args: {
    orders: v.array(v.object({ id: v.id("plans"), order: v.number() })),
  },
  handler: async (ctx, args) => {
    for (const item of args.orders) {
      await ctx.db.patch(item.id, { order: item.order });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("plans") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const defaults = [
      { numericId: 1, name: '스페셜 299 더블', basePrice: '59,800', benefitPrice: '29,800', mainCount: 4, isMainActive: true },
      { numericId: 2, name: '스페셜 399 실속', basePrice: '69,800', benefitPrice: '39,800', mainCount: 4, isMainActive: false },
    ];

    for (const d of defaults) {
      const existing = await ctx.db.query("plans").withIndex("by_numericId", (q) => q.eq("numericId", d.numericId)).first();
      if (!existing) {
        await ctx.db.insert("plans", d);
      }
    }
  },
});
