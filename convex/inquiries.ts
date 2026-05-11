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
    channelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("inquiries", {
      ...args,
      status: "대기",
      createdAt: Date.now(),
    });
    // Add channel name to discord notification if available
    let channelName = "기본";
    if (args.channelId) {
        const channel = await ctx.db
            .query("channels")
            .filter((q) => q.eq(q.field("subdomain"), args.channelId))
            .first();
        if (channel) channelName = channel.channelName;
    }

    await ctx.scheduler.runAfter(0, internal.inquiries.sendDiscordNotification, {
      name: args.name,
      phone: args.phone,
      productName: args.productName,
      message: args.message,
      channelName: channelName,
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
    channelName: v.optional(v.string()),
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
          { name: "🏢 유입 채널", value: args.channelName || "기본", inline: true },
          { name: "📦 신청 상품", value: args.productName },
          { name: "💬 문의 내용", value: args.message || "내용 없음" },
        ],
        footer: { text: `효원결합 상담 관리 시스템 | 접수시간: ${new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)} (KST)` },
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

// Admin: Get all inquiries with optional channel filter
export const list = query({
  args: { 
    channelId: v.optional(v.string()),
    channelIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("inquiries").order("desc");

    if (args.channelIds && args.channelIds.length > 0) {
        // If multiple IDs provided (Parent-Child hierarchy)
        const allInquiries = await query.collect();
        return allInquiries.filter(i => args.channelIds!.includes(i.channelId || '본사'));
    }

    if (args.channelId) {
        if (args.channelId === 'default' || args.channelId === '본사') {
            return await query
                .filter((q) => q.or(
                    q.eq(q.field("channelId"), undefined),
                    q.eq(q.field("channelId"), "본사"),
                    q.eq(q.field("channelId"), "default")
                ))
                .collect();
        }
        return await query
            .filter((q) => q.eq(q.field("channelId"), args.channelId))
            .collect();
    }
    
    return await query.collect();
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
    cardPaymentDate: v.optional(v.string()),
    purchaseConsentDate: v.optional(v.string()),
    sangjoContractDate: v.optional(v.string()),
    rentalContractDate: v.optional(v.string()),
    cancelDate: v.optional(v.string()),
    terminationDate: v.optional(v.string()),
    deliveryDate: v.optional(v.string()),
    consentStatus: v.optional(v.string()),
    consentFileUrl: v.optional(v.string()),
    consentSentDate: v.optional(v.string()),
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
