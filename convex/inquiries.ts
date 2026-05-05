import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new inquiry
export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    productName: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("inquiries", {
      ...args,
      status: "대기",
      createdAt: Date.now(),
    });
  },
});

// Admin: Get all inquiries
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("inquiries").order("desc").collect();
  },
});
