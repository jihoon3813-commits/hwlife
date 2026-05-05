import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("shorts").order("asc").collect();
  },
});

export const getVisible = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("shorts")
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    youtubeId: v.string(),
    length: v.string(),
    tag: v.string(),
    views: v.string(),
    order: v.number(),
    isVisible: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("shorts", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("shorts"),
    title: v.string(),
    youtubeId: v.string(),
    length: v.string(),
    tag: v.string(),
    views: v.string(),
    order: v.number(),
    isVisible: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("shorts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const toggleVisibility = mutation({
  args: { id: v.id("shorts"), isVisible: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isVisible: args.isVisible });
  },
});
