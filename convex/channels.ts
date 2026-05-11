import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  handler: async (ctx) => {
    return await ctx.db.query("channels").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    accountId: v.string(),
    password: v.string(),
    subdomain: v.string(),
    status: v.string(),
    channelName: v.string(),
    managerName: v.string(),
    managerContact: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if accountId already exists
    const existing = await ctx.db
      .query("channels")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .first();
      
    if (existing) {
      throw new Error("이미 존재하는 아이디입니다.");
    }

    return await ctx.db.insert("channels", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("channels"),
    password: v.optional(v.string()),
    subdomain: v.string(),
    status: v.string(),
    channelName: v.string(),
    managerName: v.string(),
    managerContact: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("channels") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

export const validateLogin = query({
  args: { accountId: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const channel = await ctx.db
      .query("channels")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .first();

    if (!channel) return null;
    if (channel.password !== args.password) return null;
    if (channel.status !== "정상") {
        throw new Error("정지되었거나 승인 대기 중인 계정입니다.");
    }
    return {
      _id: channel._id,
      accountId: channel.accountId,
      channelName: channel.channelName,
      subdomain: channel.subdomain,
      type: 'channel' as const
    };
  },
});

export const getBySubdomain = query({
  args: { subdomain: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("channels")
      .filter((q) => q.eq(q.field("subdomain"), args.subdomain))
      .first();
  },
});
