import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const DEFAULT_LG_CATEGORIES = [
  { key: 'water', name: '정수기', icon: '💧', group: 'kitchen', badge: '인기' },
  { key: 'fridge', name: '냉장고', icon: '🧊', group: 'kitchen', badge: '인기' },
  { key: 'kimchi', name: '김치냉장고', icon: '🥬', group: 'kitchen' },
  { key: 'dishwasher', name: '식기세척기', icon: '🍽️', group: 'kitchen', badge: 'BEST' },
  { key: 'range', name: '전기레인지', icon: '🔥', group: 'kitchen' },
  { key: 'washer', name: '세탁기', icon: '🧺', group: 'living' },
  { key: 'washtower', name: '워시타워', icon: '🏢', group: 'living', badge: 'BEST' },
  { key: 'washcombo', name: '워시콤보', icon: '🔄', group: 'living', badge: 'HOT' },
  { key: 'dryer', name: '의류건조기', icon: '👕', group: 'living' },
  { key: 'styler', name: '스타일러', icon: '👔', group: 'living', badge: '추천' },
  { key: 'aircon', name: '에어컨', icon: '❄️', group: 'air', badge: '필수' },
  { key: 'airpurifier', name: '공기청정기', icon: '🍃', group: 'air' },
  { key: 'aerotower', name: '에어로타워', icon: '🌪️', group: 'air' },
  { key: 'humidifier', name: '정수가습기', icon: '💨', group: 'air' },
  { key: 'dehumidifier', name: '제습기', icon: '💦', group: 'air' },
  { key: 'tv', name: '올레드 / QNED TV', icon: '📺', group: 'display', badge: '인기' },
  { key: 'standby', name: '스탠바이미', icon: '📱', group: 'display', badge: '품절임박' },
  { key: 'vacuum', name: '청소기', icon: '🧹', group: 'living' },
  { key: 'massage', name: '안마의자', icon: '💆', group: 'health' },
  { key: 'shoecare', name: '슈케어', icon: '👟', group: 'living' },
  { key: 'bathair', name: '바스에어시스템', icon: '🛁', group: 'air' },
];

export const getOrdered = query({
  args: {},
  handler: async (ctx) => {
    const list = await ctx.db
      .query("lg_categories")
      .withIndex("by_order")
      .collect();

    // Filter out duplicate or legacy empty '바스에어' category (keep only '바스에어시스템')
    const cleaned = list.filter(c => c.name !== '바스에어' && c.key !== 'bath-air' && c.key !== 'bath_air');

    if (cleaned.length === 0) {
      return DEFAULT_LG_CATEGORIES.map((c, idx) => ({
        ...c,
        order: idx,
        isVisible: true,
      }));
    }

    return cleaned;
  },
});

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("lg_categories").collect();
    if (existing.length > 0) return { alreadyExists: true };

    for (let i = 0; i < DEFAULT_LG_CATEGORIES.length; i++) {
      const c = DEFAULT_LG_CATEGORIES[i];
      await ctx.db.insert("lg_categories", {
        key: c.key,
        name: c.name,
        icon: c.icon,
        group: c.group,
        badge: c.badge,
        order: i,
        isVisible: true,
      });
    }

    return { success: true, count: DEFAULT_LG_CATEGORIES.length };
  },
});

export const updateCategoryOrder = mutation({
  args: {
    orderedKeys: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("lg_categories").collect();
    const existingMap = new Map(existing.map((c) => [c.key, c]));

    // If categories table is empty, seed it first with new order
    if (existing.length === 0) {
      for (let i = 0; i < args.orderedKeys.length; i++) {
        const key = args.orderedKeys[i];
        const def = DEFAULT_LG_CATEGORIES.find((d) => d.key === key) || {
          key,
          name: key,
          icon: '📦',
          group: 'living',
        };
        await ctx.db.insert("lg_categories", {
          key: def.key,
          name: def.name,
          icon: def.icon,
          group: def.group,
          order: i,
          isVisible: true,
        });
      }
      return { success: true };
    }

    // Update order for each category
    for (let i = 0; i < args.orderedKeys.length; i++) {
      const key = args.orderedKeys[i];
      const cat = existingMap.get(key);
      if (cat) {
        await ctx.db.patch(cat._id, { order: i });
      } else {
        const def = DEFAULT_LG_CATEGORIES.find((d) => d.key === key) || {
          key,
          name: key,
          icon: '📦',
          group: 'living',
        };
        await ctx.db.insert("lg_categories", {
          key: def.key,
          name: def.name,
          icon: def.icon,
          group: def.group,
          order: i,
          isVisible: true,
        });
      }
    }

    return { success: true };
  },
});

export const updateCategoryDetails = mutation({
  args: {
    key: v.string(),
    name: v.string(),
    icon: v.string(),
    badge: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("lg_categories")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (args.isDefault) {
      // If setting this category as default, unset all others
      const allCats = await ctx.db.query("lg_categories").collect();
      for (const cat of allCats) {
        if (cat.key !== args.key && cat.isDefault) {
          await ctx.db.patch(cat._id, { isDefault: false });
        }
      }
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name.trim(),
        icon: args.icon.trim(),
        badge: args.badge ? args.badge.trim() : undefined,
        isDefault: args.isDefault !== undefined ? args.isDefault : existing.isDefault,
      });
      return { success: true };
    }

    // If not existing yet, create
    const def = DEFAULT_LG_CATEGORIES.find((d) => d.key === args.key) || {
      key: args.key,
      name: args.name,
      icon: args.icon,
      group: 'living',
    };

    const count = (await ctx.db.query("lg_categories").collect()).length;
    await ctx.db.insert("lg_categories", {
      key: args.key,
      name: args.name.trim(),
      icon: args.icon.trim(),
      badge: args.badge ? args.badge.trim() : undefined,
      group: def.group,
      order: count,
      isVisible: true,
      isDefault: args.isDefault || false,
    });

    return { success: true };
  },
});

// Set default landing category (e.g. 'water', 'styler', 'tv', 'all')
export const setDefaultLandingCategory = mutation({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const allCats = await ctx.db.query("lg_categories").collect();

    // If categories table is empty, seed defaults first
    if (allCats.length === 0) {
      for (let i = 0; i < DEFAULT_LG_CATEGORIES.length; i++) {
        const c = DEFAULT_LG_CATEGORIES[i];
        await ctx.db.insert("lg_categories", {
          key: c.key,
          name: c.name,
          icon: c.icon,
          group: c.group,
          badge: c.badge,
          order: i,
          isVisible: true,
          isDefault: c.key === args.key,
        });
      }
      return { success: true, defaultKey: args.key };
    }

    for (const cat of allCats) {
      const shouldBeDefault = cat.key === args.key;
      if (cat.isDefault !== shouldBeDefault) {
        await ctx.db.patch(cat._id, { isDefault: shouldBeDefault });
      }
    }

    return { success: true, defaultKey: args.key };
  },
});

