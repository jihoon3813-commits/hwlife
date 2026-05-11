import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Admin: Get all products
export const getAllProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    return await Promise.all(
      products.map(async (p) => {
        const resolveUrl = async (url: string | undefined) => {
          if (!url || url.startsWith("http") || url.startsWith("blob")) return url;
          try {
            return (await ctx.storage.getUrl(url)) || url;
          } catch (e) {
            return url;
          }
        };

        const images = p.images ? await Promise.all(p.images.map(resolveUrl)) : [];
        const detailImages = p.detailImages ? await Promise.all(p.detailImages.map(resolveUrl)) : [];
        
        return {
          ...p,
          images: images.filter((url): url is string => !!url),
          detailImages: detailImages.filter((url): url is string => !!url),
        };
      })
    );
  },
});

// For public view
export const getVisibleProducts = query({
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();

    return await Promise.all(
      products.map(async (p) => {
        const resolveUrl = async (url: string | undefined) => {
          if (!url || url.startsWith("http") || url.startsWith("blob")) return url;
          try {
            return (await ctx.storage.getUrl(url)) || url;
          } catch (e) {
            return url;
          }
        };

        const images = p.images ? await Promise.all(p.images.map(resolveUrl)) : [];
        const detailImages = p.detailImages ? await Promise.all(p.detailImages.map(resolveUrl)) : [];
        
        return {
          ...p,
          images: images.filter((url): url is string => !!url),
          detailImages: detailImages.filter((url): url is string => !!url),
        };
      })
    );
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
    showOnMain: v.optional(v.boolean()),
    landingPages: v.optional(v.array(v.string())),
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
    showOnMain: v.optional(v.boolean()),
    landingPages: v.optional(v.array(v.string())),
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
