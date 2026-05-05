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
