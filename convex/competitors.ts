import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const competitors = await ctx.db.query("competitors").collect();
    return await Promise.all(
      competitors.map(async (c) => ({
        ...c,
        logo: c.logo ? (c.logo.startsWith("http") ? c.logo : await ctx.storage.getUrl(c.logo)) : undefined,
      }))
    );
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    logo: v.optional(v.string()),
    type: v.string(),
    months: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("competitors", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("competitors"),
    name: v.optional(v.string()),
    logo: v.optional(v.string()),
    type: v.optional(v.string()),
    months: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("competitors") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
