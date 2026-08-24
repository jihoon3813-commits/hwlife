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
        priceMap: v.any(), // Record of option key (e.g. "72_12_007") -> { monthlyPrice, originalPrice, etc. }
        currentSelection: v.optional(v.string()),
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

  lg_products: defineTable({
    name: v.string(),                      // LG 공식 제품명
    model: v.string(),                     // 기본 모델명 / 주문 모델명
    originalModel: v.optional(v.string()), // 엑셀 원본 모델명 (+서픽스)
    brand: v.string(),                     // 'LG전자'
    category: v.string(),                  // 카테고리명 (정수기, 냉장고, 세탁기 등)
    categoryKey: v.string(),               // 카테고리 키 (water, fridge, washer 등)
    group: v.optional(v.string()),         // 그룹 ('kitchen', 'living', 'air', 'display' 등)
    image: v.string(),                     // 대표 썸네일 이미지
    images: v.array(v.string()),           // 갤러리 이미지 목록
    refUrl: v.string(),                    // LG 공홈 상세페이지 URL
    relatedUrls: v.optional(v.array(v.object({ // 연관 유사 모델 / 스탠드·벽걸이 선택 옵션 목록
      title: v.string(),
      model: v.string(),
      url: v.string(),
    }))),
    color: v.optional(v.string()),         // 기본 색상
    colors: v.optional(v.array(v.object({  // 실제 공홈 색상 목록
      name: v.string(),
      code: v.string(),
      image: v.optional(v.string()),
      material: v.optional(v.string()),
      modelSuffix: v.optional(v.string()),
      isDefault: v.optional(v.boolean()),
    }))),
    careCycles: v.array(v.string()),       // 케어서비스 주기 목록
    careTypes: v.array(v.string()),        // 케어서비스 유형 목록
    careOptions: v.optional(v.array(v.object({ // 엑셀 주기별 세부 요금 매트릭스
      cycle: v.string(),
      type: v.string(),
      p5Base: v.number(),
      p5Discount: v.number(),
      p5DiscountRate: v.number(),
      p6Base: v.number(),
      p6Discount: v.number(),
      p6DiscountRate: v.number(),
    }))),
    
    // 5년/6년 가격 및 할인 정보
    rentalPrice5Year: v.number(),          // 5년 공홈 기본 월구독료
    discountPrice5Year: v.number(),        // 5년 효원 결합 월구독료 (할인가)
    discountRate5Year: v.number(),         // 5년 할인율 (%)
    
    rentalPrice6Year: v.number(),          // 6년 공홈 기본 월구독료
    discountPrice6Year: v.number(),        // 6년 효원 결합 월구독료 (할인가)
    discountRate6Year: v.number(),         // 6년 할인율 (%)
    
    subscriptionOptions: v.optional(v.any()), // 공홈 subscriptionOptions 객체
    specifications: v.optional(v.array(v.object({
      category: v.optional(v.string()),
      name: v.string(),
      value: v.string(),
    }))),
    
    order: v.number(),                     // 정렬 순서
    isVisible: v.boolean(),                // 노출 여부
    isOfficialVerified: v.optional(v.boolean()), // LG 공홈 실존 인증 여부
    createdAt: v.number(),                 // 생성일시
  }).index("by_order", ["order"])
    .index("by_categoryKey", ["categoryKey"])
    .index("by_isVisible", ["isVisible"])
    .index("by_isOfficialVerified", ["isOfficialVerified"]),

  lg_categories: defineTable({
    key: v.string(),                       // 카테고리 키 ('water', 'styler', 'tv' 등)
    name: v.string(),                      // 카테고리명 ('정수기', '스타일러' 등)
    icon: v.string(),                      // 아이콘 ('💧', '👔' 등)
    group: v.optional(v.string()),         // 그룹 ('kitchen', 'living', 'display' 등)
    badge: v.optional(v.string()),         // 뱃지 ('인기', 'BEST', '추천' 등)
    order: v.number(),                     // 드래그앤드롭 정렬 순서
    isVisible: v.optional(v.boolean()),    // 카테고리 노출 여부
    isDefault: v.optional(v.boolean()),    // 랜딩 첫 화면 기본 노출 카테고리 여부
  }).index("by_order", ["order"])
    .index("by_key", ["key"]),
});
