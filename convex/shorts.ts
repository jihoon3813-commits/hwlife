import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("shorts").order("asc").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    length: v.string(),
    tag: v.string(),
    thumbnail: v.optional(v.string()),
    videoUrl: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("shorts", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("shorts"),
    title: v.optional(v.string()),
    length: v.optional(v.string()),
    tag: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("shorts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
