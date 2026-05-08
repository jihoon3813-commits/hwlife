import { action, internalAction, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Create a new inquiry
export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    productName: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("inquiries", {
      ...args,
      status: "대기",
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.inquiries.sendDiscordNotification, {
      name: args.name,
      phone: args.phone,
      productName: args.productName,
      message: args.message,
    });
    return id;
  },
});

export const sendDiscordNotification = internalAction({
  args: {
    name: v.string(),
    phone: v.string(),
    productName: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    const discordMessage = {
      embeds: [{
        title: "🔔 새로운 상담 신청이 접수되었습니다!",
        color: 0x3182F6,
        fields: [
          { name: "👤 성함", value: args.name, inline: true },
          { name: "📞 연락처", value: args.phone, inline: true },
          { name: "📦 신청 상품", value: args.productName },
          { name: "💬 문의 내용", value: args.message || "내용 없음" },
        ],
        footer: { text: "효원결합 상담 관리 시스템" },
        timestamp: new Date().toISOString(),
      }]
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordMessage),
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

export const update = mutation({
  args: {
    id: v.id("inquiries"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    status: v.optional(v.string()),
    gender: v.optional(v.string()),
    birth: v.optional(v.string()),
    address: v.optional(v.string()),
    detailAddress: v.optional(v.string()),
    newRegDate: v.optional(v.string()),
    sangjoContractDate: v.optional(v.string()),
    rentalContractDate: v.optional(v.string()),
    cancelDate: v.optional(v.string()),
    terminationDate: v.optional(v.string()),
    deliveryDate: v.optional(v.string()),
    note: v.optional(v.string()),
    account: v.optional(v.string()),
    appliance: v.optional(v.string()),
    memoHistory: v.optional(v.array(
      v.object({
        date: v.string(),
        status: v.string(),
        memo: v.string()
      })
    )),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("inquiries") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
