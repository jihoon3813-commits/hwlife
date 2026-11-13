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

export const duplicate = mutation({
  args: {
    id: v.id("landings"),
    name: v.optional(v.string()),
    path: v.optional(v.string()),
    description: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) {
      throw new Error("복제할 원본 랜딩페이지를 찾을 수 없습니다.");
    }

    const allLandings = await ctx.db.query("landings").collect();

    // Determine target name
    const targetName = args.name || `${source.name} (복사본)`;

    // Determine target path
    let targetPath = args.path;
    if (!targetPath) {
      const baseClean = source.path === '/' ? '/copy' : `${source.path}_copy`;
      targetPath = baseClean;
      let counter = 1;
      while (allLandings.some(l => l.path === targetPath)) {
        counter++;
        targetPath = `${baseClean}${counter}`;
      }
    } else {
      // If provided path already exists, append counter
      if (allLandings.some(l => l.path === targetPath)) {
        let counter = 1;
        const base = targetPath;
        while (allLandings.some(l => l.path === targetPath)) {
          counter++;
          targetPath = `${base}_${counter}`;
        }
      }
    }

    return await ctx.db.insert("landings", {
      name: targetName,
      path: targetPath,
      description: args.description !== undefined ? args.description : source.description,
      thumbnail: args.thumbnail !== undefined ? args.thumbnail : source.thumbnail,
      isActive: args.isActive !== undefined ? args.isActive : source.isActive,
    });
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
        thumbnail: "https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674553/IMG_3574_%EC%8B%A0%ED%95%9C%EC%B9%B4%EB%93%9C_rus6ls.png",
        isActive: true,
      });
      await ctx.db.insert("landings", {
        name: "해피효원라이프 스페셜299",
        path: "/special",
        description: "BSON 렌탈 결합 스페셜 상품 랜딩페이지",
        thumbnail: "https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674558/IMG_3521-1_v2su84.png",
        isActive: true,
      });
      await ctx.db.insert("landings", {
        name: "KCC홈씨씨 제휴 랜딩",
        path: "/kcc",
        description: "효원상조 X KCC홈씨씨 B2B 결합상품 랜딩페이지",
        thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=500",
        isActive: true,
      });
      await ctx.db.insert("landings", {
        name: "효원상조 트리플케어",
        path: "/triplecare",
        description: "최신가전 + 간병/헬스케어 멤버십 결합 상품 (효원상조 3구좌 트리플케어)",
        thumbnail: "https://res.cloudinary.com/lyjyvy54/image/upload/v1794287243/%EA%B0%80%EC%A0%84_%EB%8F%8C%EB%B4%84_%EA%B1%B4%EA%B0%95%EC%9D%84_%EC%9E%87%EB%8A%94_%EA%B0%80%EC%A1%B1_%EC%BC%80%EC%96%B4_klpbh5.png",
        isActive: true,
      });
      await ctx.db.insert("landings", {
        name: "해피효원 스페셜299(new)",
        path: "/package60",
        description: "해피효원라이프 스페셜299 가전결합상품 최신 랜딩페이지 (영업자 공식 60패키지 연동)",
        thumbnail: "https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674558/IMG_3521-1_v2su84.png",
        isActive: true,
      });
      await ctx.db.insert("landings", {
        name: "가전상조 60패키지 (기존)",
        path: "/special_new",
        description: "가전 & 효원상조 60회 결합 쇼핑몰 랜딩페이지 (기존 버전 보관용)",
        thumbnail: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500",
        isActive: true,
      });
    }
  },
});

export const updateDefaultThumbnails = mutation({
  handler: async (ctx) => {
    const landings = await ctx.db.query("landings").collect();
    const paths = landings.map(l => l.path);

    // Ensure Living2 exists
    if (!paths.includes("/living2")) {
      await ctx.db.insert("landings", {
        name: "리빙144(신한카드) 2",
        path: "/living2",
        description: "생활가전 및 매트리스 특화 랜딩페이지 (버전 2)",
        thumbnail: "https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674553/IMG_3574_%EC%8B%A0%ED%95%9C%EC%B9%B4%EB%93%9C_rus6ls.png",
        isActive: true,
      });
    }

    // Ensure Special2 exists
    if (!paths.includes("/special2")) {
      await ctx.db.insert("landings", {
        name: "스페셜299(BSON) 2",
        path: "/special2",
        description: "BSON 렌탈 결합 스페셜 상품 랜딩페이지 (버전 2)",
        thumbnail: "https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674558/IMG_3521-1_v2su84.png",
        isActive: true,
      });
    }

    // Ensure Kcc exists
    if (!paths.includes("/kcc")) {
      await ctx.db.insert("landings", {
        name: "KCC홈씨씨 제휴 랜딩",
        path: "/kcc",
        description: "효원상조 X KCC홈씨씨 B2B 결합상품 랜딩페이지",
        thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=500",
        isActive: true,
      });
      await ctx.db.insert("landings", {
        name: "효원상조 트리플케어",
        path: "/triplecare",
        description: "최신가전 + 간병/헬스케어 멤버십 결합 상품 (효원상조 3구좌 트리플케어)",
        thumbnail: "https://res.cloudinary.com/lyjyvy54/image/upload/v1794287243/%EA%B0%80%EC%A0%84_%EB%8F%8C%EB%B4%84_%EA%B1%B4%EA%B0%95%EC%9D%84_%EC%9E%87%EB%8A%94_%EA%B0%80%EC%A1%B1_%EC%BC%80%EC%96%B4_klpbh5.png",
        isActive: true,
      });
    }

    // Ensure /package60 and /special_new exist and are swapped according to current requirements:
    // /package60 -> 해피효원 스페셜299(new) (영업자 공식 최신 디자인)
    // /special_new -> 가전상조 60패키지 (기존 쇼핑몰 보관용)
    const specialNewThumb = "https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674558/IMG_3521-1_v2su84.png";
    const package60OldThumb = "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500";

    const existingPkg60 = landings.find(l => l.path === "/package60");
    const existingSpecialNew = landings.find(l => l.path === "/special_new");

    // Case 1: Both exist but need swapping
    if (existingPkg60 && existingSpecialNew) {
      if (existingPkg60.name.includes("60패키지") && existingSpecialNew.name.includes("스페셜299")) {
        // Swap them
        await ctx.db.patch(existingPkg60._id, { path: "/_temp_swap_path" });
        await ctx.db.patch(existingSpecialNew._id, {
          name: "해피효원 스페셜299(new)",
          path: "/package60",
          description: "해피효원라이프 스페셜299 가전결합상품 최신 랜딩페이지 (영업자 공식 60패키지 연동)",
          thumbnail: specialNewThumb,
          isActive: true,
        });
        await ctx.db.patch(existingPkg60._id, {
          name: "가전상조 60패키지 (기존)",
          path: "/special_new",
          description: "가전 및 효원상조 60회 결합 쇼핑몰 랜딩페이지 (기존 버전 보관용)",
          thumbnail: package60OldThumb,
          isActive: true,
        });
      } else {
        // Enforce names and descriptions
        if (existingPkg60.name.includes("스페셜299") && existingPkg60.thumbnail === "/special299/hero.webp") {
          await ctx.db.patch(existingPkg60._id, { thumbnail: specialNewThumb });
        }
      }
    } else {
      if (!existingPkg60) {
        await ctx.db.insert("landings", {
          name: "해피효원 스페셜299(new)",
          path: "/package60",
          description: "해피효원라이프 스페셜299 가전결합상품 최신 랜딩페이지 (영업자 공식 60패키지 연동)",
          thumbnail: specialNewThumb,
          isActive: true,
        });
      }
      if (!existingSpecialNew) {
        await ctx.db.insert("landings", {
          name: "가전상조 60패키지 (기존)",
          path: "/special_new",
          description: "가전 및 효원상조 60회 결합 쇼핑몰 랜딩페이지 (기존 버전 보관용)",
          thumbnail: package60OldThumb,
          isActive: true,
        });
      }
    }

    // Ensure LG Care Solutions exists
    if (!paths.includes("/care")) {
      await ctx.db.insert("landings", {
        name: "LG가전 구독 할인 전용",
        path: "/care",
        description: "LG전자 가전 구독 & 케어솔루션 효원 결합 할인 전용 공식 랜딩페이지",
        thumbnail: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600",
        isActive: true,
      });
    }

    // Ensure LG Care 10% Discount exists
    if (!paths.includes("/care10")) {
      await ctx.db.insert("landings", {
        name: "LG가전 구독 10% 할인 전용",
        path: "/care10",
        description: "LG전자 가전 구독 매월 10% 파격할인 전용 공식 랜딩페이지",
        thumbnail: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600",
        isActive: true,
      });
    }

    // Ensure Package UP exists
    if (!paths.includes("/package_up")) {
      await ctx.db.insert("landings", {
        name: "가전상조 60패키지 (UP가전)",
        path: "/package_up",
        description: "LG UP가전 & 효원상조 60회 결합 프리미엄 쇼핑몰 랜딩페이지",
        thumbnail: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500",
        isActive: true,
      });
    }

    // Ensure Special60 exists and has updated thumbnail
    const special60Img = "https://res.cloudinary.com/dfkntvpmv/image/upload/v1781620540/Professional_hero_section_image_featuring_a_confid-1778653149667_owqlgb.png";
    const existingSpecial60 = landings.find(l => l.path === "/special60");
    if (!existingSpecial60) {
      await ctx.db.insert("landings", {
        name: "가전상조 60패키지(new)",
        path: "/special60",
        description: "효원상조 최신가전 결합 프리미엄 쇼핑몰 랜딩페이지",
        thumbnail: special60Img,
        isActive: true,
      });
    } else if (existingSpecial60.thumbnail !== special60Img) {
      await ctx.db.patch(existingSpecial60._id, {
        thumbnail: special60Img,
      });
    }

    // Ensure LG Care New exists
    const careNewThumb = "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600";
    const existingCareNew = landings.find(l => l.path === "/care_new" || l.name === "LG가전 구독 할인 전용 (new)");
    if (!existingCareNew) {
      await ctx.db.insert("landings", {
        name: "LG가전 구독 할인 전용 (new)",
        path: "/care_new",
        description: "효원상조 × LG 가전구독 10% 결합할인 전용 프리미엄 랜딩페이지 (신규 디자인)",
        thumbnail: careNewThumb,
        isActive: true,
      });
    }

    // Ensure CarePlus / TripleCare (해피효원라이프 간병PLUS) exists & update path to /triplecare
    const carePlusThumb = "https://res.cloudinary.com/lyjyvy54/image/upload/v1794287243/%EA%B0%80%EC%A0%84_%EB%8F%8C%EB%B4%84_%EA%B1%B4%EA%B0%95%EC%9D%84_%EC%9E%87%EB%8A%94_%EA%B0%80%EC%A1%B1_%EC%BC%80%EC%96%B4_klpbh5.png";
    const existingTripleCare = landings.find(l => l.path === "/triplecare" || l.path === "/careplus" || l.name.includes("간병PLUS") || l.name.includes("간병플러스") || l.name.includes("트리플케어"));
    if (!existingTripleCare) {
      await ctx.db.insert("landings", {
        name: "효원상조 트리플케어",
        path: "/triplecare",
        description: "최신가전 + 간병/헬스케어 멤버십 결합 상품 (효원상조 3구좌 트리플케어)",
        thumbnail: carePlusThumb,
        isActive: true,
      });
    } else if (existingTripleCare.path !== "/triplecare" || existingTripleCare.name !== "효원상조 트리플케어") {
      await ctx.db.patch(existingTripleCare._id, {
        path: "/triplecare",
        name: "효원상조 트리플케어",
        description: "최신가전 + 간병/헬스케어 멤버십 결합 상품 (효원상조 3구좌 트리플케어)",
      });
    }

    // Ensure 60패키지 products also include /package60 and /special_new in landingPages
    const allProducts = await ctx.db.query("products").collect();
    for (const prod of allProducts) {
      const is60Prod =
        [5, 6, 7, 8].includes(prod.planId) ||
        (prod.landingPages && (prod.landingPages.includes("/package60") || prod.landingPages.includes("/special_new"))) ||
        prod.isSmartRegistered === true;
      if (is60Prod) {
        const currentPages = prod.landingPages || ["/package60"];
        let updated = false;
        let newPages = [...currentPages];
        if (!newPages.includes("/package60")) {
          newPages.push("/package60");
          updated = true;
        }
        if (!newPages.includes("/special_new")) {
          newPages.push("/special_new");
          updated = true;
        }
        if (updated) {
          await ctx.db.patch(prod._id, {
            landingPages: newPages,
          });
        }
      }
    }
  },
});

export const swapPackage60AndSpecialNew = mutation({
  args: {},
  handler: async (ctx) => {
    const landings = await ctx.db.query("landings").collect();
    const specialNewThumb = "https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674558/IMG_3521-1_v2su84.png";
    const package60OldThumb = "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500";

    const itemPkg60 = landings.find(l => l.path === "/package60");
    const itemSpecialNew = landings.find(l => l.path === "/special_new");

    if (itemPkg60 && itemSpecialNew) {
      // Check if itemPkg60 is the old one or if they need swapping
      if (itemPkg60.name.includes("60패키지") && itemSpecialNew.name.includes("스페셜299")) {
        await ctx.db.patch(itemPkg60._id, { path: "/_temp_swap_path" });
        await ctx.db.patch(itemSpecialNew._id, {
          name: "해피효원 스페셜299(new)",
          path: "/package60",
          description: "해피효원라이프 스페셜299 가전결합상품 최신 랜딩페이지 (영업자 공식 60패키지 연동)",
          thumbnail: specialNewThumb,
          isActive: true,
        });
        await ctx.db.patch(itemPkg60._id, {
          name: "가전상조 60패키지 (기존)",
          path: "/special_new",
          description: "가전 & 효원상조 60회 결합 쇼핑몰 랜딩페이지 (기존 버전 보관용)",
          thumbnail: package60OldThumb,
          isActive: true,
        });
        return { success: true, swapped: true, message: "Swapped /package60 and /special_new successfully" };
      }
      return { success: true, swapped: false, message: "Already swapped or structured correctly" };
    }
    return { success: false, message: "Could not find both landings" };
  },
});



