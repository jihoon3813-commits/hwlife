import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const competitors = await ctx.db.query("competitors").collect();
    return await Promise.all(
      competitors.map(async (c) => {
        let logoUrl = c.logo;
        if (logoUrl && !logoUrl.startsWith("http") && !logoUrl.startsWith("blob")) {
          try {
            logoUrl = (await ctx.storage.getUrl(logoUrl)) || logoUrl;
          } catch (e) {
            // Not a storage ID
          }
        }
        return { ...c, logo: logoUrl };
      })
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
