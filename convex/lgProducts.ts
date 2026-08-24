import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper validator for colors
const colorItemValidator = v.object({
  name: v.string(),
  code: v.string(),
  image: v.optional(v.string()),
  material: v.optional(v.string()),
  modelSuffix: v.optional(v.string()),
  isDefault: v.optional(v.boolean()),
});

// Helper validator for specifications
const specItemValidator = v.object({
  category: v.optional(v.string()),
  name: v.string(),
  value: v.string(),
});

// Helper validator for related URLs
const relatedUrlItemValidator = v.object({
  title: v.string(),
  model: v.string(),
  url: v.string(),
});

// Helper validator for care options
const careOptionItemValidator = v.object({
  cycle: v.string(),
  type: v.string(),
  p5Base: v.number(),
  p5Discount: v.number(),
  p5DiscountRate: v.number(),
  p6Base: v.number(),
  p6Discount: v.number(),
  p6DiscountRate: v.number(),
});

// Helper to format LG PDP subscription URL
function formatSubscriptionRefUrl(rawUrl?: string, model?: string, categoryKey?: string): string {
  let url = (rawUrl || '').trim();
  const cleanModel = (model || '').trim().split('.')[0].trim().toLowerCase();
  const m = cleanModel.toUpperCase();
  const cat = (categoryKey || '').toLowerCase();

  let slug = 'washing_machines';
  if (cat.includes('bath') || cat.includes('바스') || m.startsWith('MX0120') || m.startsWith('M-X0120') || m.includes('BASV') || m.includes('BASR')) slug = 'bath-air-system';
  else if (cat.includes('massage') || cat.includes('안마') || (m.startsWith('MX') && !m.startsWith('MX0120') && !m.startsWith('M-X0120')) || m.startsWith('BM') || m.startsWith('MH')) slug = 'massage-chairs';
  else if (cat.includes('dehumidifier') || cat.includes('제습기') || m.startsWith('DQ') || m.startsWith('DC') || m.startsWith('DD') || m.startsWith('DH')) slug = 'dehumidifiers';
  else if (((cat.includes('humidifier') || cat.includes('humid')) && !cat.includes('dehumid')) || cat.includes('가습기') || cat.includes('하이드로타워') || m.startsWith('HY') || m.startsWith('HW') || m.startsWith('HU')) slug = 'humidifiers';
  else if (cat.includes('광파오븐') || cat.includes('오븐') || cat.includes('전자레인지') || m.startsWith('ML') || m.startsWith('MZ') || m.startsWith('MJ') || m.startsWith('MW') || m.startsWith('MC')) slug = 'microwaves-and-ovens';
  else if (cat.includes('range') || cat.includes('stove') || cat.includes('인덕션') || cat.includes('전기레인지') || m.startsWith('BEF') || m.startsWith('BEI') || m.startsWith('BEY') || m.startsWith('BD')) slug = 'electric-stoves';
  else if (cat.includes('dishwasher') || cat.includes('식기세척기') || m.startsWith('DE') || m.startsWith('DU') || m.startsWith('DF') || m.startsWith('D1') || m.startsWith('D2')) slug = 'dishwashers';
  else if (cat.includes('washcombo') || cat.includes('워시콤보') || m.startsWith('FC') || m.startsWith('FH')) slug = 'wash-combo';
  else if (cat.includes('washtower') || cat.includes('워시타워') || m.startsWith('WA') || m.startsWith('WL') || m.startsWith('W2') || m.startsWith('W1')) slug = 'wash-tower';
  else if (cat.includes('cleaner') || cat.includes('vacuum') || cat.includes('청소기') || m.startsWith('AI9') || m.startsWith('A9') || m.startsWith('AX9') || m.startsWith('AU9') || m.startsWith('R9') || m.startsWith('RO9')) slug = 'vacuum-cleaners';
  else if (cat.includes('dryer') || cat.includes('건조기') || m.startsWith('RD') || m.startsWith('RG') || m.startsWith('RH') || m.startsWith('RC')) slug = 'dryers';
  else if (cat.includes('shoe') || cat.includes('슈케어') || m.startsWith('SS4') || m.startsWith('SS') || m.startsWith('SH')) slug = 'shoe-care';
  else if (cat.includes('styler') || cat.includes('스타일러') || m.startsWith('SC') || m.startsWith('S5') || m.startsWith('S3')) slug = 'lg-styler';
  else if (cat.includes('kimchi') || cat.includes('김치') || m.startsWith('Z') || m.startsWith('K')) slug = 'kimchi-refrigerators';
  else if (cat.includes('water') || cat.includes('정수기') || m.startsWith('WU') || m.startsWith('WD') || m.startsWith('WS')) slug = 'water-purifiers';
  else if (cat.includes('aircon') || cat.includes('에어컨') || m.startsWith('FQ') || m.startsWith('FN') || m.startsWith('SQ') || m.startsWith('SW') || m.startsWith('SN')) slug = 'air-conditioners';
  else if (cat.includes('aircare') || cat.includes('airpurifier') || cat.includes('aerotower') || cat.includes('공기청정기') || m.startsWith('AS') || m.startsWith('FS')) slug = 'air-purifiers';
  else if (cat.includes('tv') || cat.includes('티비') || m.includes('OLED') || m.includes('QNED') || m.includes('NANO') || /^\d{2,3}[A-Z]/.test(m) || m.startsWith('27LX') || m.startsWith('32LX')) slug = 'tvs';
  else if (cat.includes('fridge') || cat.includes('refriger') || cat.includes('냉장고') || m.startsWith('M') || m.startsWith('T8') || m.startsWith('W8') || m.startsWith('H8') || m.startsWith('B') || m.startsWith('S8') || m.startsWith('G8')) slug = 'refrigerators';
  else if (m.startsWith('FX') || m.startsWith('F2') || m.startsWith('F1') || m.startsWith('FR') || m.startsWith('TA') || m.startsWith('TS') || m.startsWith('TR') || m.startsWith('TH')) slug = 'washing_machines';

  let modelId = '';
  if (url && url.startsWith('http')) {
    try {
      const parsed = new URL(url);
      const mId = parsed.searchParams.get('modelId');
      if (mId) modelId = mId;
    } catch (e) {}
  }

  const params = new URLSearchParams();
  if (modelId) params.set('modelId', modelId);
  params.set('pdpType', 'SUBSCRIPTION');

  if (cleanModel) {
    return `https://www.lge.co.kr/product/care-solutions/${slug}/${cleanModel}?${params.toString()}`;
  }

  return 'https://www.lge.co.kr/care-solutions';
}

// Admin: Get all LG subscription products sorted by order
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("lg_products")
      .withIndex("by_order")
      .collect();

    return products;
  },
});

// Public: Get visible LG subscription products sorted by order
export const getVisible = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("lg_products")
      .withIndex("by_isVisible", (q) => q.eq("isVisible", true))
      .collect();

    products.sort((a, b) => a.order - b.order);
    return products;
  },
});

// Single Product Create
export const create = mutation({
  args: {
    name: v.string(),
    model: v.string(),
    originalModel: v.optional(v.string()),
    brand: v.string(),
    category: v.string(),
    categoryKey: v.string(),
    group: v.optional(v.string()),
    image: v.string(),
    images: v.array(v.string()),
    refUrl: v.string(),
    relatedUrls: v.optional(v.array(relatedUrlItemValidator)),
    color: v.optional(v.string()),
    colors: v.optional(v.array(colorItemValidator)),
    careCycles: v.array(v.string()),
    careTypes: v.array(v.string()),
    careOptions: v.optional(v.array(careOptionItemValidator)),
    rentalPrice5Year: v.number(),
    discountPrice5Year: v.number(),
    discountRate5Year: v.number(),
    rentalPrice6Year: v.number(),
    discountPrice6Year: v.number(),
    discountRate6Year: v.number(),
    subscriptionOptions: v.optional(v.any()),
    specifications: v.optional(v.array(specItemValidator)),
    order: v.optional(v.number()),
    isVisible: v.boolean(),
    isOfficialVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let order = args.order;
    if (order === undefined) {
      const highest = await ctx.db
        .query("lg_products")
        .withIndex("by_order")
        .order("desc")
        .first();
      order = highest ? highest.order + 1 : 0;
    }

    const refUrl = formatSubscriptionRefUrl(args.refUrl, args.model, args.categoryKey || args.category);
    let relatedUrls = args.relatedUrls;
    if (relatedUrls && relatedUrls.length > 0) {
      relatedUrls = relatedUrls.map(r => ({
        ...r,
        url: formatSubscriptionRefUrl(r.url, r.model || args.model, args.categoryKey || args.category)
      }));
    }

    return await ctx.db.insert("lg_products", {
      ...args,
      refUrl,
      relatedUrls,
      order,
      createdAt: Date.now(),
    });
  },
});

// Single Product Update
export const update = mutation({
  args: {
    id: v.id("lg_products"),
    name: v.optional(v.string()),
    model: v.optional(v.string()),
    originalModel: v.optional(v.string()),
    brand: v.optional(v.string()),
    category: v.optional(v.string()),
    categoryKey: v.optional(v.string()),
    group: v.optional(v.string()),
    image: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    refUrl: v.optional(v.string()),
    relatedUrls: v.optional(v.array(relatedUrlItemValidator)),
    color: v.optional(v.string()),
    colors: v.optional(v.array(colorItemValidator)),
    careCycles: v.optional(v.array(v.string())),
    careTypes: v.optional(v.array(v.string())),
    careOptions: v.optional(v.array(careOptionItemValidator)),
    rentalPrice5Year: v.optional(v.number()),
    discountPrice5Year: v.optional(v.number()),
    discountRate5Year: v.optional(v.number()),
    rentalPrice6Year: v.optional(v.number()),
    discountPrice6Year: v.optional(v.number()),
    discountRate6Year: v.optional(v.number()),
    subscriptionOptions: v.optional(v.any()),
    specifications: v.optional(v.array(specItemValidator)),
    order: v.optional(v.number()),
    isVisible: v.optional(v.boolean()),
    isOfficialVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    if (fields.refUrl) {
      fields.refUrl = formatSubscriptionRefUrl(fields.refUrl, fields.model, fields.categoryKey || fields.category);
    }
    if (fields.relatedUrls && fields.relatedUrls.length > 0) {
      fields.relatedUrls = fields.relatedUrls.map(r => ({
        ...r,
        url: formatSubscriptionRefUrl(r.url, r.model || fields.model, fields.categoryKey || fields.category)
      }));
    }
    await ctx.db.patch(id, fields);
  },
});

// Single Product Remove
export const remove = mutation({
  args: { id: v.id("lg_products") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Update display order via drag-and-drop
export const updateProductOrder = mutation({
  args: {
    orders: v.array(
      v.object({
        id: v.id("lg_products"),
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

// Batch delete selected products
export const batchDelete = mutation({
  args: {
    ids: v.array(v.id("lg_products")),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.delete(id);
    }
  },
});

// Batch toggle visibility
export const batchToggleVisibility = mutation({
  args: {
    ids: v.array(v.id("lg_products")),
    isVisible: v.boolean(),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.patch(id, { isVisible: args.isVisible });
    }
  },
});

// Batch Upsert from Excel + Scraped results
export const batchUpsert = mutation({
  args: {
    products: v.array(
      v.object({
        name: v.string(),
        model: v.string(),
        originalModel: v.optional(v.string()),
        brand: v.string(),
        category: v.string(),
        categoryKey: v.string(),
        group: v.optional(v.string()),
        image: v.string(),
        images: v.array(v.string()),
        refUrl: v.string(),
        relatedUrls: v.optional(v.array(relatedUrlItemValidator)),
        color: v.optional(v.string()),
        colors: v.optional(v.array(colorItemValidator)),
        careCycles: v.array(v.string()),
        careTypes: v.array(v.string()),
        careOptions: v.optional(v.array(careOptionItemValidator)),
        rentalPrice5Year: v.number(),
        discountPrice5Year: v.number(),
        discountRate5Year: v.number(),
        rentalPrice6Year: v.number(),
        discountPrice6Year: v.number(),
        discountRate6Year: v.number(),
        subscriptionOptions: v.optional(v.any()),
        specifications: v.optional(v.array(specItemValidator)),
        isVisible: v.boolean(),
        isOfficialVerified: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existingList = await ctx.db.query("lg_products").collect();
    const highestOrder = existingList.reduce((max, p) => Math.max(max, p.order ?? 0), -1);
    let nextOrder = highestOrder + 1;

    let insertedCount = 0;
    let updatedCount = 0;

    for (const item of args.products) {
      const cleanModel = item.model.trim().toLowerCase();
      const existing = existingList.find(
        (p) => p.model?.trim().toLowerCase() === cleanModel || (item.originalModel && p.originalModel?.trim().toLowerCase() === item.originalModel.trim().toLowerCase())
      );

      if (existing) {
        await ctx.db.patch(existing._id, {
          name: item.name,
          brand: item.brand,
          category: item.category,
          categoryKey: item.categoryKey,
          group: item.group || existing.group,
          image: item.image || existing.image,
          images: item.images.length > 0 ? item.images : existing.images,
          refUrl: item.refUrl || existing.refUrl,
          relatedUrls: item.relatedUrls || existing.relatedUrls,
          color: item.color || existing.color,
          colors: item.colors || existing.colors,
          careCycles: item.careCycles.length > 0 ? item.careCycles : existing.careCycles,
          careTypes: item.careTypes.length > 0 ? item.careTypes : existing.careTypes,
          careOptions: item.careOptions || existing.careOptions,
          rentalPrice5Year: item.rentalPrice5Year || existing.rentalPrice5Year,
          discountPrice5Year: item.discountPrice5Year || existing.discountPrice5Year,
          discountRate5Year: item.discountRate5Year || existing.discountRate5Year,
          rentalPrice6Year: item.rentalPrice6Year || existing.rentalPrice6Year,
          discountPrice6Year: item.discountPrice6Year || existing.discountPrice6Year,
          discountRate6Year: item.discountRate6Year || existing.discountRate6Year,
          subscriptionOptions: item.subscriptionOptions || existing.subscriptionOptions,
          specifications: item.specifications || existing.specifications,
          isVisible: item.isVisible !== undefined ? item.isVisible : existing.isVisible,
          isOfficialVerified: item.isOfficialVerified !== undefined ? item.isOfficialVerified : existing.isOfficialVerified,
        });
        updatedCount++;
      } else {
        await ctx.db.insert("lg_products", {
          ...item,
          order: nextOrder++,
          createdAt: Date.now(),
        });
        insertedCount++;
      }
    }

    return { insertedCount, updatedCount, total: args.products.length };
  },
});

// Hide all unverified products from landing page in batch
export const hideUnverifiedProducts = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("lg_products").collect();
    let hiddenCount = 0;

    for (const p of products) {
      if (p.isOfficialVerified === false && p.isVisible) {
        await ctx.db.patch(p._id, { isVisible: false });
        hiddenCount++;
      }
    }

    return { success: true, hiddenCount };
  },
});

// Batch update verification status from background verification action
export const batchUpdateVerification = mutation({
  args: {
    results: v.array(
      v.object({
        id: v.id("lg_products"),
        isOfficialVerified: v.boolean(),
        refUrl: v.optional(v.string()),
        autoHideUnverified: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    let updatedCount = 0;

    for (const item of args.results) {
      const patchData: any = {
        isOfficialVerified: item.isOfficialVerified,
      };
      if (item.refUrl) {
        patchData.refUrl = item.refUrl;
      }
      if (item.autoHideUnverified && !item.isOfficialVerified) {
        patchData.isVisible = false;
      }
      await ctx.db.patch(item.id, patchData);
      updatedCount++;
    }

    return { success: true, updatedCount };
  },
});

// Auto-Fix all existing products with accurate real colors and subscription URLs
export const autoFixProductDetails = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("lg_products").collect();
    let updatedCount = 0;

    for (const p of products) {
      const model = p.model.trim();
      const upper = model.toUpperCase();
      const cleanModel = model.split('.')[0].trim().toLowerCase();
      
      let realColor = p.color;
      let realHex = '#2B2B2B';

      // Infer exact real color
      if (upper.startsWith('SC5') || upper.startsWith('S5') || upper.startsWith('S3')) {
        if (upper.includes('GMR') || upper.includes('MR')) {
          realColor = '블랙 틴트 미러';
          realHex = '#2B2B2B';
        } else if (upper.includes('MBR') || upper.includes('MB')) {
          realColor = '미스트 베이지';
          realHex = '#D9CAB3';
        } else if (upper.includes('MSR') || upper.includes('SR')) {
          realColor = '미스트 실버';
          realHex = '#C4C8CC';
        } else if (upper.includes('GNE') || upper.includes('NE')) {
          realColor = '에센스 네이비';
          realHex = '#1B2A4A';
        } else if (upper.includes('GEW') || upper.includes('EW')) {
          realColor = '에센스 화이트';
          realHex = '#FFFFFF';
        }
      } else if (upper.includes('QNED') || upper.includes('OLED') || upper.includes('MRGB') || upper.includes('LX7') || upper.includes('NANO') || p.categoryKey === 'tv') {
        const isWall = upper.endsWith('W') || upper.endsWith('MW') || upper.endsWith('KW') || upper.endsWith('BKW') || upper.endsWith('BMW') || upper.includes('WALL') || p.name?.includes('벽걸이');
        realColor = isWall ? '벽걸이형' : '스탠드형';
        realHex = isWall ? '#3A3F47' : '#1A1A1A';
      } else if (upper.includes('ACB')) {
        realColor = '카밍 베이지';
        realHex = '#D9CAB3';
      } else if (upper.includes('AWB') || upper.includes('RH')) {
        realColor = '카밍 화이트';
        realHex = '#FFFFFF';
      } else if (upper.includes('ABB') || upper.includes('RK')) {
        realColor = '카밍 블랙';
        realHex = '#1A1A1A';
      } else if (upper.includes('ANB')) {
        realColor = '클레이 브라운';
        realHex = '#6B4E3D';
      } else if (upper.endsWith('AS') || upper.includes('AS.')) {
        realColor = '실버';
        realHex = '#C4C8CC';
      }

      const refUrl = formatSubscriptionRefUrl(p.refUrl, p.model, p.categoryKey || p.category);
      const isOfficialVerified = p.isOfficialVerified !== undefined 
        ? p.isOfficialVerified 
        : (Boolean(p.image) && Boolean(refUrl) && refUrl.includes('lge.co.kr') && !refUrl.includes('/search/'));

      await ctx.db.patch(p._id, {
        color: realColor,
        colors: [{ name: realColor, code: realHex, isDefault: true }],
        refUrl,
        isOfficialVerified,
      });
      updatedCount++;
    }

    return { success: true, updatedCount };
  }
});
