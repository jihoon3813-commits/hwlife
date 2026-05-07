import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all visible products
export const getVisibleProducts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();
  },
});

// Admin: Get all products
export const getAllProducts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("products").collect();
  },
});

export const create = mutation({
  args: {
    category: v.string(),
    planId: v.number(),
    brand: v.string(),
    model: v.string(),
    name: v.string(),
    price: v.string(),
    discountPrice: v.optional(v.string()),
    image: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    tag: v.optional(v.string()),
    priceLabel: v.optional(v.string()),
    shippingFee: v.optional(v.string()),
    detailImage: v.optional(v.string()),
    detailImages: v.optional(v.array(v.string())),
    isVisible: v.boolean(),
    comparisons: v.array(
      v.object({
        company: v.string(),
        target: v.string(),
        price: v.string(),
        period: v.string(),
        isOurs: v.boolean(),
        benefit: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("products", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    category: v.optional(v.string()),
    planId: v.optional(v.number()),
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    name: v.optional(v.string()),
    price: v.optional(v.string()),
    discountPrice: v.optional(v.string()),
    image: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    tag: v.optional(v.string()),
    priceLabel: v.optional(v.string()),
    shippingFee: v.optional(v.string()),
    detailImage: v.optional(v.string()),
    detailImages: v.optional(v.array(v.string())),
    isVisible: v.optional(v.boolean()),
    comparisons: v.optional(
      v.array(
        v.object({
          company: v.string(),
          target: v.string(),
          price: v.string(),
          period: v.string(),
          isOurs: v.boolean(),
          benefit: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Seed initial data
export const seedProducts = mutation({
  args: { products: v.array(v.any()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("products").first();
    if (existing) return "Already seeded";
    
    for (const product of args.products) {
      await ctx.db.insert("products", {
        ...product,
        isVisible: true,
      });
    }
    return "Seeded successfully";
  },
});
