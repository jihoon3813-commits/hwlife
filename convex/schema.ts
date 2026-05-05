import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
    category: v.string(),
    planId: v.number(),
    brand: v.string(),
    model: v.string(),
    name: v.string(),
    price: v.string(),
    discountPrice: v.string(),
    image: v.string(),
    tag: v.optional(v.string()),
    priceLabel: v.optional(v.string()),
    shippingFee: v.optional(v.string()),
    detailImage: v.optional(v.string()),
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
  }),
  inquiries: defineTable({
    name: v.string(),
    phone: v.string(),
    productName: v.string(),
    message: v.optional(v.string()),
    status: v.string(), // "대기", "상담완료", "거절"
    createdAt: v.number(),
  }),
  shorts: defineTable({
    title: v.string(),
    length: v.string(),
    tag: v.string(),
    thumbnail: v.optional(v.string()),
    videoUrl: v.string(),
    order: v.number(),
  }),
  competitors: defineTable({
    name: v.string(),
    logo: v.optional(v.string()),
    type: v.string(), // "자사", "타사"
    months: v.number(),
  }),
});
