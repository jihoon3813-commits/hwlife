import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Admin: Get all products
export const getAllProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    products.sort((a, b) => (a.order ?? 99999) - (b.order ?? 99999));
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
        const resolvedImage = await resolveUrl(p.image);
        
        return {
          ...p,
          image: resolvedImage,
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

    products.sort((a, b) => (a.order ?? 99999) - (b.order ?? 99999));

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
        const resolvedImage = await resolveUrl(p.image);
        
        return {
          ...p,
          image: resolvedImage,
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
    showOnHero: v.optional(v.boolean()),
    landingPages: v.optional(v.array(v.string())),
    accountCount: v.optional(v.string()),
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
    specifications: v.optional(
      v.array(
        v.object({
          category: v.optional(v.string()),
          name: v.string(),
          value: v.string(),
        })
      )
    ),
    isSmartRegistered: v.optional(v.boolean()),
    supplyPrice: v.optional(v.string()),
    giftText: v.optional(v.string()),
    order: v.optional(v.number()),
    subscriptionOptions: v.optional(
      v.object({
        contractTerms: v.array(
          v.object({
            value: v.string(),
            label: v.string(),
            available: v.optional(v.boolean()),
          })
        ),
        careServiceCycles: v.array(
          v.object({
            value: v.string(),
            label: v.string(),
            available: v.optional(v.boolean()),
          })
        ),
        careServiceTypes: v.array(
          v.object({
            value: v.string(),
            label: v.string(),
            accentLabel: v.optional(v.string()),
            description: v.optional(v.string()),
            available: v.optional(v.boolean()),
          })
        ),
        priceMap: v.any(),
        currentSelection: v.optional(v.string()),
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
    showOnHero: v.optional(v.boolean()),
    landingPages: v.optional(v.array(v.string())),
    accountCount: v.optional(v.string()),
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
    specifications: v.optional(
      v.array(
        v.object({
          category: v.optional(v.string()),
          name: v.string(),
          value: v.string(),
        })
      )
    ),
    isSmartRegistered: v.optional(v.boolean()),
    supplyPrice: v.optional(v.string()),
    giftText: v.optional(v.string()),
    order: v.optional(v.number()),
    subscriptionOptions: v.optional(
      v.object({
        contractTerms: v.array(
          v.object({
            value: v.string(),
            label: v.string(),
            available: v.optional(v.boolean()),
          })
        ),
        careServiceCycles: v.array(
          v.object({
            value: v.string(),
            label: v.string(),
            available: v.optional(v.boolean()),
          })
        ),
        careServiceTypes: v.array(
          v.object({
            value: v.string(),
            label: v.string(),
            accentLabel: v.optional(v.string()),
            description: v.optional(v.string()),
            available: v.optional(v.boolean()),
          })
        ),
        priceMap: v.any(),
        currentSelection: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const getProductsByLanding = query({
  args: { landingPath: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();

    const filtered = all.filter((p) => {
      if (!p.landingPages || p.landingPages.length === 0) return true;
      return p.landingPages.includes(args.landingPath);
    });

    filtered.sort((a, b) => (a.order ?? 99999) - (b.order ?? 99999));

    return await Promise.all(
      filtered.map(async (p) => {
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
        const resolvedImage = await resolveUrl(p.image);

        return {
          ...p,
          image: resolvedImage,
          images: images.filter((url): url is string => !!url),
          detailImages: detailImages.filter((url): url is string => !!url),
        };
      })
    );
  },
});

export const updateProductOrder = mutation({
  args: {
    orders: v.array(
      v.object({
        id: v.id("products"),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const item of args.orders) {
      await ctx.db.patch(item.id, { order: item.order });
    }
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
