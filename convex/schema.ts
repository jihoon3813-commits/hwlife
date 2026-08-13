import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  channels: defineTable({
    accountId: v.string(),
    password: v.string(),
    subdomain: v.string(),
    status: v.string(), // "승인대기", "정상", "정지"
    channelName: v.string(),
    managerName: v.string(),
    managerContact: v.string(),
    landingPage: v.optional(v.string()), // Legacy field
    landingPages: v.optional(v.array(v.string())), // Multiple landing pages
    parentChannelId: v.optional(v.string()), // Subdomain of the parent channel
  }).index("by_accountId", ["accountId"])
    .index("by_subdomain", ["subdomain"])
    .index("by_parent", ["parentChannelId"]),


  landings: defineTable({
    name: v.string(),
    path: v.string(), // e.g., "/", "/living"
    thumbnail: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.boolean(),
  }),
  products: defineTable({
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
  }),
  inquiries: defineTable({
    name: v.string(),
    phone: v.string(),
    productName: v.string(),
    message: v.optional(v.string()),
    status: v.string(), // "대기", "상담완료", "거절"
    createdAt: v.number(),
    
    // Additional Detail Fields
    gender: v.optional(v.string()),
    birth: v.optional(v.string()),
    address: v.optional(v.string()),
    detailAddress: v.optional(v.string()),
    
    // Schedule Fields
    newRegDate: v.optional(v.string()),
    cardPaymentDate: v.optional(v.string()),
    purchaseConsentDate: v.optional(v.string()),
    sangjoContractDate: v.optional(v.string()),
    rentalContractDate: v.optional(v.string()),
    cancelDate: v.optional(v.string()),
    terminationDate: v.optional(v.string()),
    deliveryDate: v.optional(v.string()),
    consentStatus: v.optional(v.string()), // "미발송", "발송완료", "서명완료"
    consentFileUrl: v.optional(v.string()),
    consentSentDate: v.optional(v.string()),
    note: v.optional(v.string()),
    
    // Product Details
    account: v.optional(v.string()),
    appliance: v.optional(v.string()),
    
    // History
    memoHistory: v.optional(v.array(
      v.object({
        date: v.string(),
        status: v.string(),
        memo: v.string(),
        writer: v.optional(v.string())
      })
    )),
    channelId: v.optional(v.string()),
    source: v.optional(v.string()), // "homepage", "direct"
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
  settings: defineTable({
    statuses: v.array(v.object({ name: v.string(), isUsed: v.boolean(), color: v.optional(v.string()) })),
    brands: v.array(v.string()),
    categories: v.array(v.string()),
    footer: v.object({
      companyName: v.string(),
      representative: v.string(),
      businessNumber: v.string(),
      phone: v.string(),
      address: v.string(),
      email: v.string(),
      notice: v.string(),
    }),
    sms: v.optional(v.object({
      apiKey: v.string(),
      userId: v.string(),
      sender: v.string(),
      consentMessage: v.optional(v.string()),
      consentPageUrl: v.optional(v.string()),
    })),
    headOfficeAccount: v.optional(v.object({
      accountId: v.string(),
      password: v.string(),
    })),
  }),
  visits: defineTable({
    ip: v.string(),
    userAgent: v.string(),
    referrer: v.optional(v.string()),
    path: v.string(),
    channelId: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),

  plans: defineTable({
    numericId: v.number(),
    name: v.string(),
    basePrice: v.string(),
    benefitPrice: v.string(),
    mainCount: v.number(),
    isMainActive: v.boolean(),
    accountCount: v.optional(v.string()),
    order: v.optional(v.number()),
  }).index("by_numericId", ["numericId"])
    .index("by_order", ["order"]),
});
