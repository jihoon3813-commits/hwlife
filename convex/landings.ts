import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  handler: async (ctx) => {
    return await ctx.db.query("landings").collect();
  },
});

export const getByPath = query({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("landings")
      .filter((q) => q.eq(q.field("path"), args.path))
      .first();
  },
});


export const create = mutation({
  args: {
    name: v.string(),
    path: v.string(),
    thumbnail: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("landings", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("landings"),
    name: v.optional(v.string()),
    path: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("landings") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Seed function to initialize the landing pages
export const seed = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("landings").collect();
    if (existing.length === 0) {
      await ctx.db.insert("landings", {
        name: "메인 랜딩페이지 (App)",
        path: "/",
        description: "기본 종합 가전결합 랜딩페이지",
        thumbnail: "https://res.cloudinary.com/dx7l09wwu/image/upload/v1778418168/A_photorealistic_cozy_family_scene_in_a_premium_Ko-1778416838228_lac7jp.png",
        isActive: true,
      });
      await ctx.db.insert("landings", {
        name: "리빙144(신한카드)",
        path: "/living",
        description: "생활가전 및 매트리스 특화 랜딩페이지",
        thumbnail: "https://res.cloudinary.com/dx7l09wwu/image/upload/v1778506774/IMG_3574_%EC%8B%A0%ED%95%9C%EC%B9%B4%EB%93%9C2_xogxll.png",
        isActive: true,
      });
      await ctx.db.insert("landings", {
        name: "해피효원라이프 스페셜299",
        path: "/special",
        description: "BSON 렌탈 결합 스페셜 상품 랜딩페이지",
        thumbnail: "https://res.cloudinary.com/dx7l09wwu/image/upload/v1778511843/IMG_3521-2_cr8tqi.png",
        isActive: true,
      });
    }
  },
});

export const updateDefaultThumbnails = mutation({
  handler: async (ctx) => {
    const landings = await ctx.db.query("landings").collect();
    for (const landing of landings) {
      if (landing.path === "/") {
        await ctx.db.patch(landing._id, { 
          thumbnail: "https://res.cloudinary.com/dx7l09wwu/image/upload/v1778418168/A_photorealistic_cozy_family_scene_in_a_premium_Ko-1778416838228_lac7jp.png" 
        });
      }
      if (landing.path === "/living") {
        await ctx.db.patch(landing._id, { 
          name: "리빙144(신한카드)",
          thumbnail: "https://res.cloudinary.com/dx7l09wwu/image/upload/v1778506774/IMG_3574_%EC%8B%A0%ED%95%9C%EC%B9%B4%EB%93%9C2_xogxll.png" 
        });
      }
      if (landing.path === "/special") {
        await ctx.db.patch(landing._id, { 
          name: "해피효원라이프 스페셜299",
          thumbnail: "https://res.cloudinary.com/dx7l09wwu/image/upload/v1778511843/IMG_3521-2_cr8tqi.png" 
        });
      }
    }
  },
});



