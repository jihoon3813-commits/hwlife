import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, Check, ShieldCheck, ChevronRight, ChevronLeft, X, Star, Gift, 
  Sparkles, Award, Search, Info, HelpCircle, CheckCircle2,
  Clock, Flame, CheckSquare, Square, ChevronDown, FileText, Layers, Tag,
  Maximize2, Zap, ArrowRight, ThumbsUp, HeartHandshake, Headphones,
  Percent, CreditCard, RotateCcw, Wrench, Sparkle, RefreshCw, Calendar,
  Shield, CheckCircle, Smartphone, AlertCircle, Share2, Heart
} from 'lucide-react';
import { formatPhoneNumber } from '../utils/phone';
import PrivacyModal from '../components/PrivacyModal';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import SEO from '../components/SEO';

interface LgCarePageProps {
  channelSubdomain?: string;
  landingPath?: string;
}

import { LG_OFFICIAL_PRODUCTS, CATEGORY_SUBTABS, LgProduct, SubscriptionOptions } from '../data/lgCareProducts';
import { getProductCapacityInfo } from '../utils/productCapacity';
import { matchesSubCategory } from '../utils/subCategoryMatcher';
import { buildLgOfficialPdpUrl } from '../utils/lgeUrl';

export { type LgProduct, type SubscriptionOptions };

// 20 Core LG Categories
interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  badge?: string;
  group: 'all' | 'living' | 'kitchen' | 'air' | 'display' | 'health';
}

const CATEGORIES: CategoryItem[] = [
  { id: 'water', name: '정수기', icon: '💧', badge: '인기', group: 'kitchen' },
  { id: 'fridge', name: '냉장고', icon: '🧊', badge: '인기', group: 'kitchen' },
  { id: 'kimchi', name: '김치냉장고', icon: '🥬', group: 'kitchen' },
  { id: 'dishwasher', name: '식기세척기', icon: '🍽️', badge: 'BEST', group: 'kitchen' },
  { id: 'range', name: '전기레인지', icon: '🔥', group: 'kitchen' },
  { id: 'washer', name: '세탁기', icon: '🧺', group: 'living' },
  { id: 'washtower', name: '워시타워', icon: '🏢', badge: 'BEST', group: 'living' },
  { id: 'washcombo', name: '워시콤보', icon: '🔄', badge: 'HOT', group: 'living' },
  { id: 'dryer', name: '의류건조기', icon: '👕', group: 'living' },
  { id: 'styler', name: '스타일러', icon: '👔', badge: '추천', group: 'living' },
  { id: 'aircon', name: '에어컨', icon: '❄️', badge: '필수', group: 'air' },
  { id: 'airpurifier', name: '공기청정기', icon: '🍃', group: 'air' },
  { id: 'aerotower', name: '에어로타워', icon: '🌪️', group: 'air' },
  { id: 'humidifier', name: '정수가습기', icon: '💨', group: 'air' },
  { id: 'dehumidifier', name: '제습기', icon: '💦', group: 'air' },
  { id: 'tv', name: '올레드 TV', icon: '📺', badge: '인기', group: 'display' },
  { id: 'standby', name: '스탠바이미', icon: '📱', badge: '품절임박', group: 'display' },
  { id: 'vacuum', name: '청소기', icon: '🧹', group: 'living' },
  { id: 'massage', name: '안마의자', icon: '💆', group: 'health' },
  { id: 'shoecare', name: '슈케어', icon: '👟', group: 'living' },
  { id: 'bathair', name: '바스에어시스템', icon: '🛁', badge: '신제품', group: 'air' },
];

const LG_PRODUCTS: LgProduct[] = LG_OFFICIAL_PRODUCTS;

const HERO_SLIDES = [
  {
    id: 1,
    badge: '월 5천원 상조 + 144만원 만기축하금',
    title: '월 5천원으로 시작하는',
    highlight: 'LG가전 구독 할인',
    desc: '구독료는 매월 10% 할인, 만기에는 낸 돈 + 144만원\nLG가전 구독 예정이라면 그냥 가입하지 마세요',
    subDesc: '',
    ctaText: '무료 상담받기',
    disclaimer: '※ 1구좌 기준 1~48회 월 5천원, 49~200회 월 28,000원. 만기 지급은 약관 조건 충족 시.',
    image: 'https://res.cloudinary.com/lyjyvy54/image/upload/v1787280194/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_21%EC%9D%BC_%EC%98%A4%EC%A0%84_11_40_31_1_1_cwr88q.png',
    tag: '매월 10% 할인 + 만기 시 낸 돈 + 144만원'
  },
  {
    id: 2,
    badge: '효원상조 결합 스마트 할인',
    title: 'LG가전 구독,',
    highlight: '정가대로 내고 계세요?',
    desc: '효원상조와 함께하면 LG가전 구독료 매월 10% 할인\n상조 만기에는 낸 돈 + 1구좌당 144만원',
    subDesc: '',
    ctaText: '내 할인금액 확인하기',
    disclaimer: '※ LG 구독료 할인은 제품별 5년 또는 6년 계약기간 적용. 만기 지급은 상조 200회 완납 및 라이프서비스 미사용 등 약관 조건 충족 시.',
    image: 'https://res.cloudinary.com/lyjyvy54/image/upload/v1787280194/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_21%EC%9D%BC_%EC%98%A4%EC%A0%84_11_40_32_2_1_gbpavn.png',
    tag: '매월 10% 할인 + 만기 시 1구좌당 144만원 지원'
  }
];

const FAQS = [
  {
    q: 'LG전자 가전 구독(케어솔루션)은 일반 렌탈이나 일시불 구매와 무엇이 다른가요?',
    a: 'LG전자 가전 구독은 가전제품을 단순히 빌려 쓰는 렌탈을 넘어, 원하는 계약 기간(3~6년) 동안 제품 소유권과 함께 전문가의 정기 방문 케어(분해 세척, 살균, 필터/소모품 무상 교체) 및 계약 기간 내내 전액 무상 A/S가 결합된 LG전자 공식 라이프 맞춤 서비스입니다. 여기에 효원라이프 결합 시 월 구독료를 전액 또는 파격적으로 할인 지원해 드립니다.'
  },
  {
    q: '전문 케어 매니저 방문 서비스는 어떻게 진행되나요?',
    a: 'LG전자 공식 교육을 이수한 케어 매니저가 고객님과 사전 일정 조율 후 주기별(3개월, 6개월, 12개월)로 방문합니다. 특수 살균 장비를 통한 고압·고온 스팀 세척, 직수관 및 주요 부품 무상 교체, 소모품 무상 제공 등 제품 성능을 최상으로 유지해 드립니다.'
  },
  {
    q: '구독 기간 동안 제품이 고장 나면 수리비가 발생하나요?',
    a: '아닙니다. 고객 과실을 제외한 제품 자체 결함 및 고장에 대해서는 구독 계약 기간 내내 100% 무상 A/S 수리 서비스를 제공해 드려 수리비 걱정 없이 안심하고 사용하실 수 있습니다.'
  },
  {
    q: '효원라이프 결합 할인은 어떻게 적용되며, 만기 시 환급도 가능한가요?',
    a: 'LG 가전 구독 계약 시 효원라이프 결합 상품(1구좌~3구좌)을 연계하시면, 매월 발생되는 가전 구독료를 효원라이프에서 최대 전액 지원해 드립니다. 또한 효원라이프 만기 시 납입하신 상조 원금은 100% 전액 환급되므로 실질적인 체감 혜택이 매우 큽니다.'
  },
  {
    q: '제휴카드 추가 청구할인은 어떻게 받나요?',
    a: 'LG전자 제휴카드(신한, KB국민, 롯데, 하나 등)로 월 구독료를 자동이체 신청하시면 전월 실적에 따라 매월 15,000원 ~ 최대 30,000원까지 추가 청구할인 혜택을 중복으로 받으실 수 있어 월 부담금을 0원 이하로 낮추실 수도 있습니다.'
  },
  {
    q: '이사 시 이전 설치나 철거는 지원되나요?',
    a: '네, LG전자 전문 설치 기사님이 안전하게 철거 및 재설치를 진행해 드립니다. (제품군 및 거리에 따라 일부 이전설치비가 상이할 수 있으니 상담 시 상세 안내해 드립니다.)'
  }
];

// 10% discount calculation with 10-won cut (100-won unit floor)
function calc10PercentDiscount(price: number): number {
  if (!price || price <= 0) return 0;
  return Math.floor((price * 0.9) / 100) * 100;
}

export default function LgCarePage({ channelSubdomain, landingPath = '/care' }: LgCarePageProps) {
  // Queries & Mutations
  const channel = useQuery(api.channels.getBySubdomain, channelSubdomain ? { subdomain: channelSubdomain } : "skip");
  const careLanding = useQuery(api.landings.getByPath, { path: landingPath || '/care' });
  const dbLgProducts = useQuery(api.lgProducts.getVisible);
  const dbCategories = useQuery(api.lgCategories.getOrdered);
  const createInquiry = useMutation(api.inquiries.create);

  // Dynamic Categories from DB (reflecting admin drag & drop ordering)
  const categories = useMemo<CategoryItem[]>(() => {
    if (dbCategories && dbCategories.length > 0) {
      return dbCategories.map(c => ({
        id: c.key,
        name: c.name,
        icon: c.icon,
        badge: c.badge,
        group: (c.group as any) || 'living'
      }));
    }
    return CATEGORIES;
  }, [dbCategories]);

  // States
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubTab, setSelectedSubTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<LgProduct | null>(null);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Initialize default landing category from Admin setting
  const [hasInitializedDefaultCategory, setHasInitializedDefaultCategory] = useState(false);
  useEffect(() => {
    if (!hasInitializedDefaultCategory && dbCategories && dbCategories.length > 0) {
      const defaultCat = dbCategories.find((c: any) => c.isDefault);
      if (defaultCat && defaultCat.key) {
        setSelectedCategory(defaultCat.key);
      }
      setHasInitializedDefaultCategory(true);
    }
  }, [dbCategories, hasInitializedDefaultCategory]);

  // Pagination / Load More State (Default: 9 products per batch)
  const [visibleCount, setVisibleCount] = useState<number>(9);

  // Reset pagination when filter changes
  useEffect(() => {
    setVisibleCount(9);
  }, [selectedCategory, selectedSubTab, searchTerm]);

  // Detail Modal Tab: 'subscription' (공식구독탭) vs 'hyowon' (효원특가탭) vs 'card' (제휴카드할인탭)
  const [modalTab, setModalTab] = useState<'subscription' | 'hyowon' | 'card'>('subscription');
  const [selectedCardCompany, setSelectedCardCompany] = useState<string>('woori');
  const [selectedCardSpend, setSelectedCardSpend] = useState<number>(1200000); // 30만 / 70만 / 120만
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);

  // Option Sub-modal States (LG.com Style Option Selector)
  const [isOptionSelectModalOpen, setIsOptionSelectModalOpen] = useState(false);
  const [selectedModalColor, setSelectedModalColor] = useState<string>('');
  const [tempSelectedColor, setTempSelectedColor] = useState<string>('');

  // Interactive Options for Detail Modal (5년/6년 전용)
  const [selectedTerm, setSelectedTerm] = useState<string>('72');
  const [selectedCycle, setSelectedCycle] = useState<string>('12');
  const [selectedType, setSelectedType] = useState<string>('001');
  const [hyowonAccountCount, setHyowonAccountCount] = useState<number>(1);
  const [applyCardDiscount, setApplyCardDiscount] = useState<boolean>(true);

  // Hyowon Plan 144 Showcase Tab (1, 2, 3, 4 Accounts)
  const [selectedPlanAccounts, setSelectedPlanAccounts] = useState<number>(1);

  // Always initialize options & open with 'subscription' tab when product detail modal is opened
  const handleOpenProductModal = (product: any) => {
    setSelectedProduct(product);
    setModalTab('subscription');

    const defaultColor = product.colors?.find((c: any) => c.isDefault)?.name || product.colors?.[0]?.name || product.color || '블랙 틴트 미러';
    setSelectedModalColor(defaultColor);
    setTempSelectedColor(defaultColor);

    const availableTerms = product.subscriptionOptions?.contractTerms || [];
    const bestTerm = product.defaultTerm || (availableTerms.find((t: any) => t.value === '72') ? '72' : (availableTerms[0]?.value || '72'));
    setSelectedTerm(bestTerm);

    const bestCycle = product.defaultCycle || product.subscriptionOptions?.careServiceCycles?.[0]?.value || '12';
    const bestType = product.defaultType || product.subscriptionOptions?.careServiceTypes?.[0]?.value || '001';

    setSelectedCycle(bestCycle);
    setSelectedType(bestType);
  };

  useEffect(() => {
    if (selectedProduct) {
      setModalTab('subscription');

      const defaultColor = selectedProduct.colors?.find(c => (c as any).isDefault)?.name || selectedProduct.colors?.[0]?.name || selectedProduct.color || '블랙 틴트 미러';
      setSelectedModalColor(defaultColor);
      setTempSelectedColor(defaultColor);

      const availableTerms = selectedProduct.subscriptionOptions?.contractTerms || [];
      const bestTerm = (selectedProduct as any).defaultTerm || (availableTerms.find(t => t.value === '72') ? '72' : (availableTerms[0]?.value || '72'));
      setSelectedTerm(bestTerm);

      const bestCycle = (selectedProduct as any).defaultCycle || selectedProduct.subscriptionOptions?.careServiceCycles?.[0]?.value || '12';
      const bestType = (selectedProduct as any).defaultType || selectedProduct.subscriptionOptions?.careServiceTypes?.[0]?.value || '001';

      setSelectedCycle(bestCycle);
      setSelectedType(bestType);
    }
  }, [selectedProduct]);

  // Synchronize Cycle whenever Type changes (Guarantee 100% consistency)
  useEffect(() => {
    if (selectedProduct?.subscriptionOptions?.careServiceTypes) {
      const types = selectedProduct.subscriptionOptions.careServiceTypes;
      const targetType = types.find(t => t.value === selectedType);
      if (targetType) {
        const targetCycleVal = (targetType as any).cycleValue;
        if (targetCycleVal && targetCycleVal !== selectedCycle) {
          setSelectedCycle(targetCycleVal);
        } else if (targetType.accentLabel?.includes('셀프') || targetType.accentLabel?.includes('자가')) {
          if (selectedCycle !== 'self') setSelectedCycle('self');
        }
      }
    }
  }, [selectedType, selectedProduct]);

  // 1:1 Bidirectional Auto Matching Handlers between Cycle and Type
  const handleSelectCycle = (cycleVal: string) => {
    setSelectedCycle(cycleVal);
    if (selectedProduct?.subscriptionOptions?.careServiceTypes) {
      const types = selectedProduct.subscriptionOptions.careServiceTypes;
      const matchingType = types.find(t => (t as any).cycleValue === cycleVal);
      if (matchingType) {
        setSelectedType(matchingType.value);
        return;
      }
      if (cycleVal === 'self' || cycleVal.includes('자가')) {
        const selfType = types.find(t => t.accentLabel?.includes('셀프') || t.accentLabel?.includes('자가') || t.label?.includes('자가'));
        if (selfType) setSelectedType(selfType.value);
      } else {
        const visitType = types.find(t => t.accentLabel?.includes('방문') || t.label?.includes('방문'));
        if (visitType) setSelectedType(visitType.value);
      }
    }
  };

  const handleSelectType = (typeVal: string) => {
    setSelectedType(typeVal);
    if (selectedProduct?.subscriptionOptions?.careServiceTypes) {
      const types = selectedProduct.subscriptionOptions.careServiceTypes;
      const targetType = types.find(t => t.value === typeVal);
      if (targetType) {
        const targetCycleVal = (targetType as any).cycleValue;
        if (targetCycleVal) {
          setSelectedCycle(targetCycleVal);
          return;
        }
        if (targetType.accentLabel?.includes('셀프') || targetType.accentLabel?.includes('자가')) {
          setSelectedCycle('self');
        } else {
          const cycles = selectedProduct.subscriptionOptions?.careServiceCycles || [];
          const visitCycle = cycles.find(c => c.value !== 'self' && c.value !== '-');
          if (visitCycle) setSelectedCycle(visitCycle.value);
        }
      }
    }
  };

  // Hero Slider States
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSlidePaused, setIsSlidePaused] = useState(false);
  const [choiceModalProduct, setChoiceModalProduct] = useState<any | null>(null);

  const handleOpenOfficialLink = (p: any, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const rels = (p as any)?.relatedUrls || [];
    if (rels.length > 1) {
      setChoiceModalProduct(p);
    } else {
      const initialUrl = rels.length === 1 && rels[0].url ? rels[0].url : (p as any)?.refUrl;
      const imgMatch = (p?.image || (p?.images && p.images[0]) || '').match(/md(\d{6,10})/i);
      const modelIdHint = imgMatch ? `MD${imgMatch[1]}` : (p as any)?.modelId;
      const targetUrl = buildLgOfficialPdpUrl(initialUrl, p?.model, p?.categoryKey || p?.category, modelIdHint);
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Consultation Form States
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAccountCount, setFormAccountCount] = useState<number>(1);
  const [formSelectedProduct, setFormSelectedProduct] = useState<LgProduct | null>(null);
  const [formProductOptions, setFormProductOptions] = useState<string>('');
  const [formProduct, setFormProduct] = useState('상담 시 제품선택 (전문 상담원 맞춤 추천)');
  const [formMessage, setFormMessage] = useState('');
  const [isAgreed, setIsAgreed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Phone number automatic hyphens formatting handler
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
    let formatted = raw;
    if (raw.length > 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`;
    } else if (raw.length > 3) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    }
    setFormPhone(formatted);
  };

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Auto Slider Effect
  useEffect(() => {
    if (isSlidePaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isSlidePaused]);

  // When modal product changes, initialize selected options (5 or 6 years only)
  useEffect(() => {
    if (selectedProduct && selectedProduct.subscriptionOptions) {
      const opts = selectedProduct.subscriptionOptions;
      // Filter contract terms to only 5 years (60) and 6 years (72)
      const validTerms = (opts.contractTerms || []).filter(t => t.value === '60' || t.value === '72' || t.label.includes('5년') || t.label.includes('6년'));
      const defaultTerm = validTerms.length > 0 ? validTerms[validTerms.length - 1].value : '72';
      
      setSelectedTerm(defaultTerm);
      if (opts.careServiceCycles && opts.careServiceCycles.length > 0) {
        setSelectedCycle(opts.careServiceCycles[0].value);
      }
      if (opts.careServiceTypes && opts.careServiceTypes.length > 0) {
        setSelectedType(opts.careServiceTypes[opts.careServiceTypes.length - 1].value);
      }
    }
  }, [selectedProduct]);

  // Merge DB products by model code and build unified multi-care options
  const allProductList = useMemo<LgProduct[]>(() => {
    if (dbLgProducts && dbLgProducts.length > 0) {
      // 1. Group raw DB items by clean model
      const modelGroupMap = new Map<string, any[]>();
      
      for (const p of dbLgProducts) {
        const cleanKey = (p.model || '').trim().split('.')[0].trim().toUpperCase();
        if (!modelGroupMap.has(cleanKey)) {
          modelGroupMap.set(cleanKey, []);
        }
        modelGroupMap.get(cleanKey)!.push(p);
      }

      // 2. Build merged product list
      const mergedList: LgProduct[] = [];

      for (const [cleanKey, items] of modelGroupMap.entries()) {
        const p = items[0]; // Representative product
        const specsMap: Record<string, string> = {};
        if (p.specifications) {
          for (const s of p.specifications) {
            specsMap[s.name] = s.value;
          }
        }

        // Collect all care options and care types across duplicate records
        const allCareOptions: any[] = [];
        const seenCareOptionKeys = new Set<string>();

        for (const item of items) {
          const rawOptions = (item as any).careOptions || [];
          if (rawOptions.length > 0) {
            for (const ro of rawOptions) {
              const optKey = `${ro.cycle}_${ro.type}`;
              if (!seenCareOptionKeys.has(optKey)) {
                seenCareOptionKeys.add(optKey);
                allCareOptions.push(ro);
              }
            }
          } else {
            const types = (item as any).careTypes || ['방문관리'];
            const cycles = (item as any).careCycles || ['12개월'];
            for (const t of types) {
              for (const c of cycles) {
                const optKey = `${c}_${t}`;
                if (!seenCareOptionKeys.has(optKey)) {
                  seenCareOptionKeys.add(optKey);
                  allCareOptions.push({
                    cycle: c,
                    type: t,
                    p5Base: item.rentalPrice5Year || 39900,
                    p5Discount: item.discountPrice5Year || Math.floor((item.rentalPrice5Year || 39900) * 0.9 / 100) * 100,
                    p6Base: item.rentalPrice6Year || 35900,
                    p6Discount: item.discountPrice6Year || Math.floor((item.rentalPrice6Year || 35900) * 0.9 / 100) * 100,
                  });
                }
              }
            }
          }
        }

        const contractTerms = [
          { value: '60', label: '5년' },
          { value: '72', label: '6년' }
        ];

        // Unique cycles formatted accurately without 1회 prefix for self-care or hyphens
        const uniqueCycles = Array.from(new Set(allCareOptions.map(o => (o.cycle || '').trim() || '-')));
        const careServiceCycles = uniqueCycles.map(c => {
          const clean = (c || '').trim();
          let label = clean;
          let value = clean;
          if (!clean || clean === '-' || clean === '해당없음' || clean === '없음') {
            label = '-';
            value = '-';
          } else if (clean.includes('자가관리') || clean.includes('셀프')) {
            label = '자가관리';
            value = 'self';
          } else if (clean.includes('개월') || clean.match(/^\d+$/)) {
            const months = clean.replace(/\D/g, '');
            label = months ? `1회 / ${months}개월` : clean;
            value = months || clean;
          } else if (clean.includes('회')) {
            label = clean;
            value = clean.replace(/\D/g, '') || clean;
          }
          return {
            value,
            label,
            rawCycle: clean
          };
        });

        // Unique Care Service Types (Context-aware official descriptions by product category)
        const isTv = p.categoryKey === 'tv' || (p.category && p.category.includes('TV'));
        const isStyler = p.categoryKey === 'styler' || (p.category && p.category.includes('스타일러'));
        const isWater = p.categoryKey === 'water' || (p.category && p.category.includes('정수기'));

        const careServiceTypes: Array<{ 
          value: string; 
          label: string; 
          accentLabel: string; 
          description?: string; 
          cycleValue: string;
          rawCycle: string;
          p5Base?: number;
          p6Base?: number;
        }> = allCareOptions.map((ro, idx) => {
          const typeName = (ro.type || '기본').trim();
          let fullDesc = typeName;

          if (isTv) {
            if (typeName.includes('넷플릭스')) {
              fullDesc = '넷플릭스 프리미엄/스탠다드 OTT 멤버십 결합 지원 및 계약기간 무상 A/S';
            } else if (typeName.includes('스탠다드')) {
              fullDesc = '기본 OTT 멤버십 결합 혜택 및 계약기간 무상 A/S';
            } else {
              fullDesc = 'LG 올레드/QNED 공식 무상 A/S 품질 보증 지원';
            }
          } else if (isStyler) {
            if (typeName.includes('프리미엄')) {
              fullDesc = '라이트(+) 기계실 분해세척, 급/배수통 교체, 향기시트 1box 제공, 인산염 키트 관리';
            } else if (typeName.includes('라이트')) {
              fullDesc = '스팀 케어, 조도 센서 점검, 무상A/S';
            } else {
              fullDesc = '전문 케어 매니저 방문 살균 세척 및 무상 부품 점검';
            }
          } else if (isWater) {
            if (typeName.includes('자가관리') || typeName.includes('셀프')) {
              fullDesc = '정기 직수관/필터 무상 배송 및 원터치 자가 교체';
            } else if (typeName.includes('방문')) {
              fullDesc = '케어 매니저 정기 방문 고온 살균 세척 및 코크/필터 무상 교체';
            }
          } else {
            if (typeName.includes('자가관리') || typeName.includes('셀프')) {
              fullDesc = '정기 소모품 무상 배송 및 고객 직접 교체';
            } else if (typeName.includes('방문') || typeName.includes('케어')) {
              fullDesc = '전문 케어 매니저 방문 살균 세척 및 무상 소모품 교체';
            } else {
              fullDesc = 'LG전자 공식 계약기간 내 100% 무상 A/S 품질 보증';
            }
          }

          const rawCycle = (ro.cycle || '').trim();
          let cycleValue = rawCycle;
          if (rawCycle.includes('자가관리') || rawCycle.includes('셀프')) {
            cycleValue = 'self';
          } else if (rawCycle.includes('개월') || rawCycle.match(/^\d+$/)) {
            cycleValue = rawCycle.replace(/\D/g, '') || rawCycle;
          }

          return {
            value: String(idx + 1).padStart(3, '0'),
            label: fullDesc,
            accentLabel: typeName,
            description: fullDesc,
            cycleValue,
            rawCycle,
            p5Base: ro.p5Base,
            p6Base: ro.p6Base,
          };
        });

        // Build comprehensive priceMap for every combination
        const priceMap: Record<string, { monthlyPrice: number; originalPrice?: number }> = {};
        for (let i = 0; i < careServiceTypes.length; i++) {
          const typeObj = careServiceTypes[i];
          const ro = allCareOptions[i] || {};
          const p5 = ro.p5Base || typeObj.p5Base || p.rentalPrice5Year || 39900;
          const p6 = ro.p6Base || typeObj.p6Base || p.rentalPrice6Year || 35900;

          const typeVal = typeObj.value;
          const cycleVal = typeObj.cycleValue;

          priceMap[`60_${cycleVal}_${typeVal}`] = { monthlyPrice: p5 };
          priceMap[`72_${cycleVal}_${typeVal}`] = { monthlyPrice: p6 };
          priceMap[`60_${cycleVal}`] = { monthlyPrice: p5 };
          priceMap[`72_${cycleVal}`] = { monthlyPrice: p6 };
          priceMap[`60_${typeVal}`] = { monthlyPrice: p5 };
          priceMap[`72_${typeVal}`] = { monthlyPrice: p6 };
        }

        const subscriptionOptions = {
          contractTerms,
          careServiceCycles: careServiceCycles.length > 0 ? careServiceCycles : [{ value: '12', label: '1회 / 12개월' }],
          careServiceTypes: careServiceTypes.length > 0 ? careServiceTypes : [{ value: '001', label: '방문관리', accentLabel: '방문관리' }],
          priceMap
        };

        // Real Colors
        const dbColors = p.colors && p.colors.length > 0 ? p.colors : [{ name: p.color || '기본', code: '#2B2B2B', isDefault: true }];
        const defaultColor = dbColors.find((c: any) => c.isDefault)?.name || dbColors[0]?.name || p.color || '';

        // Find lowest price option among all care options (6-year preferred, then 5-year)
        let lowestOpt = allCareOptions[0] || {};
        let minPrice = Infinity;
        for (const opt of allCareOptions) {
          const price = opt.p6Base || opt.p5Base || Infinity;
          if (price > 0 && price < minPrice) {
            minPrice = price;
            lowestOpt = opt;
          }
        }

        const rentalPrice = lowestOpt.p6Base || lowestOpt.p5Base || p.rentalPrice6Year || p.rentalPrice5Year || 39900;
        const combinedDiscount = lowestOpt.p6Discount || lowestOpt.p5Discount || calc10PercentDiscount(rentalPrice);

        // Find exact cycle and type value for lowestOpt
        const lowestCycleClean = (lowestOpt.cycle || '').trim();
        let defaultCycle = lowestCycleClean;
        if (lowestCycleClean.includes('자가관리') || lowestCycleClean.includes('셀프')) {
          defaultCycle = 'self';
        } else if (lowestCycleClean.includes('개월') || lowestCycleClean.match(/^\d+$/)) {
          defaultCycle = lowestCycleClean.replace(/\D/g, '') || lowestCycleClean;
        }

        const lowestOptIdx = allCareOptions.indexOf(lowestOpt);
        const defaultType = String((lowestOptIdx >= 0 ? lowestOptIdx : 0) + 1).padStart(3, '0');
        const defaultTerm = lowestOpt.p6Base ? '72' : '60';

        const cleanModelStr = (p.model || '').toUpperCase().trim();
        let resolvedCategoryKey = p.categoryKey;
        let resolvedCategoryName = p.category;

        if (resolvedCategoryKey === 'bathair' || cleanModelStr.startsWith('MX0120') || cleanModelStr.startsWith('M-X0120') || cleanModelStr.includes('BASV') || cleanModelStr.includes('BASR') || cleanModelStr.includes('BASA')) {
          resolvedCategoryKey = 'bathair';
          resolvedCategoryName = '바스에어시스템';
        }

        mergedList.push({
          id: p._id,
          name: p.name,
          model: p.model,
          category: resolvedCategoryKey,
          categoryName: resolvedCategoryName,
          group: p.group || 'living',
          tag: 'LG 공식 가전구독 / 100% 무상 케어',
          badge: p.discountRate6Year ? `${p.discountRate6Year}% 할인` : '프리미엄',
          rentalPrice,
          combinedDiscount,
          finalPrice: 0,
          cardDiscountPrice: 0,
          accountCount: '1구좌 결합',
          image: p.image,
          images: p.images?.length ? p.images : [p.image],
          color: defaultColor,
          colors: dbColors,
          careCycle: uniqueCycles.join(', ') || '1회 / 12개월 방문케어',
          careBenefits: [
            '전문가 방문 분해 살균 세척',
            '핵심 소모품 무상 교체',
            '계약기간 100% 무상 A/S'
          ],
          specs: specsMap,
          subscriptionOptions,
          careOptions: allCareOptions,
          careCycles: uniqueCycles,
          careTypes: careServiceTypes.map(t => t.accentLabel),
          defaultCycle,
          defaultType,
          defaultTerm,
          refUrl: p.refUrl,
          relatedUrls: p.relatedUrls,
          topBadges: (p as any).topBadges,
          stickers: (p as any).stickers,
          keywdTags: (p as any).keywdTags,
          rating: (p as any).rating,
          reviewCount: (p as any).reviewCount,
          featureSummary: (p as any).featureSummary,
          deliveryText: (p as any).deliveryText,
        } as any);
      }

      return mergedList;
    }
    
    // Fallback: Sort static products based on dynamically ordered categories
    const catPriority: Record<string, number> = {};
    for (let i = 0; i < categories.length; i++) {
      catPriority[categories[i].id] = i + 1;
    }

    return [...LG_OFFICIAL_PRODUCTS].sort((a, b) => {
      const pA = catPriority[a.category] || 99;
      const pB = catPriority[b.category] || 99;
      return pA - pB;
    });
  }, [dbLgProducts, categories]);

  // Real product count per category for badges
  const categoryProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of allProductList) {
      const catKey = p.category || (p as any).categoryKey;
      if (catKey) {
        counts[catKey] = (counts[catKey] || 0) + 1;
      }
    }
    return counts;
  }, [allProductList]);

  // Current category's subtabs list
  const currentSubTabs = useMemo(() => {
    if (selectedCategory === 'all') return [];
    const list = CATEGORY_SUBTABS[selectedCategory] || [];
    return list.filter(s => s.name && s.name !== '전체' && s.name !== selectedCategory);
  }, [selectedCategory]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return allProductList.filter((p) => {
      // 1. Category Matching
      if (selectedCategory !== 'all') {
        if (p.category !== selectedCategory) return false;
      }

      // 2. Subcategory Tab Matching
      if (selectedSubTab !== 'all') {
        const subTabs = CATEGORY_SUBTABS[selectedCategory] || [];
        const matchedTabObj = subTabs.find(t => t.id === selectedSubTab);
        const subName = matchedTabObj?.name || selectedSubTab;

        const matchSub = matchesSubCategory(
          {
            category: p.category,
            categoryName: p.categoryName,
            subCategory: p.subCategory,
            subCategoryName: p.subCategoryName,
            name: p.name,
            model: p.model,
            specs: p.specs,
          },
          selectedSubTab,
          subName
        );
        if (!matchSub) return false;
      }

      // 3. Search Term Matching
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchSearch = p.name.toLowerCase().includes(term) || p.model.toLowerCase().includes(term);
        if (!matchSearch) return false;
      }

      return true;
    });
  }, [allProductList, selectedCategory, selectedSubTab, searchTerm]);

  // Displayed Products (Sliced by visibleCount for Load More)
  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  // Active image for Main Modal (reflects selectedModalColor)
  const currentProductImage = useMemo(() => {
    if (!selectedProduct) return '';
    const matchedColor = selectedProduct.colors?.find(c => c.name === selectedModalColor);
    return matchedColor?.image || selectedProduct.image;
  }, [selectedProduct, selectedModalColor]);

  // Active preview image for Option Selection Sub-modal (reflects tempSelectedColor)
  const tempProductImage = useMemo(() => {
    if (!selectedProduct) return '';
    const matchedColor = selectedProduct.colors?.find(c => c.name === tempSelectedColor);
    return matchedColor?.image || selectedProduct.image;
  }, [selectedProduct, tempSelectedColor]);

  // Current Selected Care Type Object & Guaranteed Consistent Cycle Value
  const currentSelectedTypeObj = useMemo(() => {
    if (!selectedProduct?.subscriptionOptions?.careServiceTypes) return null;
    const types = selectedProduct.subscriptionOptions.careServiceTypes;
    return types.find(t => t.value === selectedType) || types[0] || null;
  }, [selectedProduct, selectedType]);

  const activeSelectedCycle = useMemo(() => {
    if (currentSelectedTypeObj && (currentSelectedTypeObj as any).cycleValue) {
      return (currentSelectedTypeObj as any).cycleValue;
    }
    return selectedCycle;
  }, [currentSelectedTypeObj, selectedCycle]);

  // Calculate current selected monthly price from priceMap & careOptions
  const currentMonthlyPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    if (!selectedProduct.subscriptionOptions) {
      return selectedTerm === '60' ? (selectedProduct.rentalPrice5Year ?? selectedProduct.rentalPrice ?? 0) : (selectedProduct.rentalPrice6Year ?? selectedProduct.rentalPrice ?? 0);
    }

    const types = selectedProduct.subscriptionOptions.careServiceTypes || [];
    const matchedType = currentSelectedTypeObj || 
                        types.find(t => t.value === selectedType) || 
                        types.find(t => (t as any).cycleValue === activeSelectedCycle) || 
                        types[0];

    // 1. Check matchedType explicit p5Base / p6Base
    if (matchedType) {
      if (selectedTerm === '60' && (matchedType as any).p5Base !== undefined) {
        return (matchedType as any).p5Base;
      }
      if (selectedTerm === '72' && (matchedType as any).p6Base !== undefined) {
        return (matchedType as any).p6Base;
      }
    }

    // 2. Check careOptions array
    if (selectedProduct.careOptions && selectedProduct.careOptions.length > 0) {
      const opt = selectedProduct.careOptions.find((o: any) => 
        (o.type === selectedType || o.type === matchedType?.label || o.type === matchedType?.accentLabel) ||
        (o.cycle === selectedCycle || o.cycle === activeSelectedCycle)
      );
      if (opt) {
        if (selectedTerm === '60' && opt.p5Base !== undefined) return opt.p5Base;
        if (selectedTerm === '72' && opt.p6Base !== undefined) return opt.p6Base;
      }
    }

    // 3. Check priceMap
    const map = selectedProduct.subscriptionOptions.priceMap;
    const key = `${selectedTerm}_${activeSelectedCycle}_${selectedType}`;

    if (map && map[key] !== undefined) {
      return map[key]?.monthlyPrice ?? 0;
    }
    if (map && map[`${selectedTerm}_${selectedCycle}`] !== undefined) {
      return map[`${selectedTerm}_${selectedCycle}`]?.monthlyPrice ?? 0;
    }
    if (map && map[`${selectedTerm}_${selectedType}`] !== undefined) {
      return map[`${selectedTerm}_${selectedType}`]?.monthlyPrice ?? 0;
    }

    // If 24 months / specific type is selected and term is 5 years, return 0 if not explicitly available
    if (selectedTerm === '60' && (selectedCycle === '24' || (matchedType as any)?.accentLabel?.includes('24'))) {
      return 0;
    }

    return selectedTerm === '60'
      ? (selectedProduct.rentalPrice5Year ?? 0)
      : (selectedProduct.rentalPrice6Year ?? 0);
  }, [selectedProduct, selectedTerm, selectedCycle, selectedType, currentSelectedTypeObj, activeSelectedCycle]);

  // Hyowon Sangjo 144 Plan Calculations (Official Proposal Structure with 10-won cut)
  const discountedMonthlyPrice = Math.floor((currentMonthlyPrice * 0.9) / 100) * 100;
  const hyowonMonthlyDiscount = currentMonthlyPrice - discountedMonthlyPrice;
  const discountedAppliancePrice = discountedMonthlyPrice;
  const cardDiscountAmount = applyCardDiscount ? Math.min(42000, discountedAppliancePrice) : 0; // 제휴카드 할인
  const finalMonthlyPayment = Math.max(0, discountedAppliancePrice - cardDiscountAmount);
  
  // Sangjo Timeline amounts based on account count (1~4 accounts)
  const contractMonths = parseInt(selectedTerm) || 72;
  const totalApplianceDiscount = hyowonMonthlyDiscount * contractMonths;
  const sangjoEarlyMonthly = 5000 * hyowonAccountCount; // 1~48회 월납
  const sangjoLaterMonthly = 28000 * hyowonAccountCount; // 49~200회 월납
  const totalSangjoDeposit = 4496000 * hyowonAccountCount; // 실납입 원금 (100% 환급)
  const maturityBonus = 1440000 * hyowonAccountCount; // 만기축하금
  const totalMaturityPayout = totalSangjoDeposit + maturityBonus; // 총 수령액 (5,936,000 * n)
  const totalCombinedBenefit = totalApplianceDiscount + maturityBonus; // 총 결합 혜택

  // Handle Form Submit
  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('성함을 입력해 주세요.');
      return;
    }
    if (!formPhone.trim() || formPhone.replace(/\D/g, '').length < 10) {
      alert('정확한 휴대폰 번호를 입력해 주세요.');
      return;
    }
    if (!isAgreed) {
      alert('개인정보 처리방침에 동의해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. 랜딩페이지 관리에 등록된 제목 (상품명)
      const landingTitle = careLanding?.name || 'LG전자 가전구독 X 효원라이프 144';
      const sangjoAccount = `${formAccountCount}구좌`;

      // 2. 결합제품 (가전제품 정보만 순수하게 전달)
      let pureAppliance = '';
      if (formSelectedProduct) {
        pureAppliance = `[${formSelectedProduct.categoryName}] ${formSelectedProduct.name} (${formSelectedProduct.model})${formProductOptions ? ` - ${formProductOptions}` : ''}`;
      } else if (formProduct && !formProduct.includes('상담 시 제품선택')) {
        pureAppliance = formProduct;
      } else {
        pureAppliance = '상담 시 제품선택 (전문 상담원 맞춤 추천)';
      }

      await createInquiry({
        name: formName,
        phone: formPhone,
        productName: `${landingTitle} (${sangjoAccount})`,
        account: sangjoAccount,
        appliance: pureAppliance,
        message: formMessage ? `[LG가전구독] ${formMessage}` : '[LG가전구독 할인 전용 상담 접수]',
        channelId: channel?.subdomain || channelSubdomain || undefined,
        source: 'lg_care',
      });

      setIsConsultModalOpen(false);
      setIsSuccessModalOpen(true);
      setFormName('');
      setFormPhone('');
      setFormSelectedProduct(null);
      setFormProductOptions('');
      setFormProduct('상담 시 제품선택 (전문 상담원 맞춤 추천)');
      setFormAccountCount(1);
      setFormMessage('');
      if (selectedProduct) {
        setSelectedProduct(null);
      }
    } catch (err) {
      console.error('Inquiry error:', err);
      alert('상담 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectProductForConsult = (product?: LgProduct, optionsDesc?: string, accountCount?: number) => {
    if (product) {
      setFormSelectedProduct(product);
      setFormProductOptions(optionsDesc || '');
      setFormProduct(`[${product.categoryName}] ${product.name} (${product.model})`);
      setFormAccountCount(accountCount || hyowonAccountCount || 1);
    } else {
      setFormSelectedProduct(null);
      setFormProductOptions('');
      setFormProduct('상담 시 제품선택 (전문 상담원 맞춤 추천)');
      setFormAccountCount(selectedPlanAccounts || 1);
    }
    setIsConsultModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#191F28] font-sans antialiased selection:bg-[#EA1D2C] selection:text-white">
      <SEO 
        title="LG전자 가전 구독 공식 할인몰 | 효원상조 결합 혜택"
        description="LG전자 가전 구독 공식 혜택! 오브제컬렉션, 워시타워, 정수기, 냉장고 등 원하는 가전에 정기 방문 케어와 100% 무상 A/S, 효원상조 결합 시 매월 10% 할인 + 만기 시 144만원 지원까지!"
        image="https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?q=80&w=1200"
      />

      {/* Top Banner Bar (Hidden on Mobile) */}
      <div className="hidden md:flex bg-[#111111] text-white py-2.5 px-4 text-center text-[12px] sm:text-[13px] font-medium items-center justify-center gap-2 tracking-tight">
        <span className="bg-[#EA1D2C] text-white text-[11px] font-black px-2 py-0.5 rounded-full">
          LG X 효원상조
        </span>
        <span>효원상조 결합 시 <strong>LG가전 구독료 매월 10% 즉시할인</strong> & 만기 시 <strong>전액환급 + 144만원 지원!</strong></span>
        <button 
          type="button"
          onClick={() => handleSelectProductForConsult()} 
          className="inline-flex items-center gap-1 text-[#FF8591] font-bold hover:underline ml-2 cursor-pointer"
        >
          상담 신청하기 <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* GNB Navigation Header */}
      <header className="relative lg:sticky lg:top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E8EB] transition-all shadow-2xs">
        {/* Mobile View Header: Centered Logo only, no right button */}
        <div className="flex lg:hidden max-w-7xl mx-auto px-4 h-16 items-center justify-center relative">
          <a href="/care" className="flex items-center justify-center gap-2.5 text-center group">
            {/* LG구독 효원 */}
            <div className="text-[17px] font-black leading-none tracking-tight flex items-center justify-center shrink-0">
              <span className="text-[#191F28] font-black">
                LG구독
              </span>
              <span className="text-[#EA1D2C] font-black ml-1">
                효원
              </span>
            </div>

            {/* Divider */}
            <div className="h-4 w-[1px] bg-[#D1D6DB] shrink-0"></div>

            {/* LG로고 x 효원상조로고 */}
            <div className="flex items-center justify-center gap-1.5 shrink-0">
              <img 
                src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786429410/2024-07-18_14_21_49_%EB%88%84%EB%81%BC_ozsj2h.png" 
                alt="LG전자 로고" 
                className="h-4 w-auto object-contain"
              />
              <span className="text-[10px] font-extrabold text-[#94A3B8]">x</span>
              <img 
                src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786415950/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_opfls9.png" 
                alt="효원상조 로고" 
                className="h-3.5 w-auto object-contain"
              />
            </div>
          </a>

          {channel?.channelName && (
            <span className="absolute right-4 text-[10px] font-bold bg-[#F2F4F6] text-[#4E5968] px-2 py-0.5 rounded-md">
              {channel.channelName}
            </span>
          )}
        </div>

        {/* Desktop View Header: Full Navigation & Quick CTA */}
        <div className="hidden lg:flex max-w-7xl mx-auto px-6 h-20 items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-4">
            <a href="/care" className="flex flex-col justify-center group">
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="font-black text-[22px] tracking-tight text-[#191F28]">
                  LG구독 <span className="text-[#EA1D2C]">효원</span>
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <img 
                  src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786429410/2024-07-18_14_21_49_%EB%88%84%EB%81%BC_ozsj2h.png" 
                  alt="LG전자 로고" 
                  className="h-3.5 w-auto object-contain"
                />
                <span className="text-[10px] text-[#D1D6DB]">|</span>
                <img 
                  src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786415950/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_opfls9.png" 
                  alt="효원상조 로고" 
                  className="h-3 w-auto object-contain"
                />
              </div>
            </a>
          </div>

          {/* Desktop Nav Links */}
          <nav className="flex items-center gap-8 text-[15px] font-semibold text-[#4E5968]">
            <a href="#category-section" className="hover:text-[#EA1D2C] transition-colors">카테고리</a>
            <a href="#product-section" className="hover:text-[#EA1D2C] transition-colors">인기 구독 상품</a>
            <a href="#benefit-section" className="hover:text-[#EA1D2C] transition-colors">5대 구독 혜택</a>
            <a href="#hyowon-plan-section" className="hover:text-[#EA1D2C] transition-colors">매월할인 혜택</a>
            <a href="#faq-section" className="hover:text-[#EA1D2C] transition-colors">자주 묻는 질문</a>
          </nav>

          {/* Quick CTA */}
          <div className="flex items-center gap-3">
            {channel?.channelName && (
              <span className="text-[11px] font-bold bg-[#F2F4F6] text-[#4E5968] px-2 py-1 rounded-md">
                제휴: {channel.channelName}
              </span>
            )}
            <button 
              type="button"
              onClick={() => handleSelectProductForConsult()}
              className="bg-[#EA1D2C] hover:bg-[#C81020] text-white px-5 py-2.5 rounded-full text-[14px] font-bold shadow-md shadow-[#EA1D2C]/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <span>빠른 상담 신청</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section Carousel */}
      <section 
        className="relative bg-[#1A1C20] text-white overflow-hidden"
        onMouseEnter={() => setIsSlidePaused(true)}
        onMouseLeave={() => setIsSlidePaused(false)}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Texts */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[12px] sm:text-[13px] font-bold text-[#FF8591] border border-white/15">
                <Sparkles className="w-4 h-4 text-[#FF8591]" />
                <span>{HERO_SLIDES[currentSlide].badge}</span>
              </div>

              {/* Title with Fixed Height */}
              <h1 className="h-[70px] sm:h-[100px] flex flex-col justify-center text-[28px] sm:text-[40px] lg:text-[46px] font-black tracking-tight leading-[1.2]">
                <span>{HERO_SLIDES[currentSlide].title}</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF8591] via-[#EA1D2C] to-[#FFA7B1]">
                  {HERO_SLIDES[currentSlide].highlight}
                </span>
              </h1>

              {/* Description with Fixed Height */}
              <div className="h-[48px] sm:h-[55px] flex flex-col justify-start text-[14px] sm:text-[16px] text-[#D1D6DB] leading-relaxed max-w-xl break-keep whitespace-pre-line overflow-hidden">
                <p>{HERO_SLIDES[currentSlide].desc}</p>
              </div>

              {/* CTA Buttons right under description (Single row on mobile & desktop) */}
              <div className="flex flex-row items-center gap-2 sm:gap-3 pt-1 w-full sm:w-auto">
                <button 
                  type="button"
                  onClick={() => handleSelectProductForConsult()} 
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-[#EA1D2C] hover:bg-[#D41423] text-white px-3 sm:px-7 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[13px] sm:text-[15px] font-extrabold shadow-lg shadow-[#EA1D2C]/40 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span className="truncate">{HERO_SLIDES[currentSlide].ctaText || '무료 상담받기'}</span>
                </button>
                <a 
                  href="#product-section" 
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[13px] sm:text-[15px] font-bold backdrop-blur-md border border-white/20 transition-all flex items-center active:scale-95 whitespace-nowrap"
                >
                  <span className="truncate">구독 상품 둘러보기</span>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                </a>
              </div>

              {/* Disclaimer with Reserved Height */}
              <div className="min-h-[32px] sm:min-h-[36px] flex items-center">
                {HERO_SLIDES[currentSlide].disclaimer ? (
                  <p className="text-[11px] sm:text-[12px] text-[#A6ADB8] leading-normal">
                    {HERO_SLIDES[currentSlide].disclaimer}
                  </p>
                ) : (
                  <span className="opacity-0 pointer-events-none text-[11px]">.</span>
                )}
              </div>

              {/* Badges Info */}
              <div className="pt-3 border-t border-white/10 flex flex-wrap gap-4 sm:gap-6 text-[12px] sm:text-[13px] text-[#A6ADB8]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#EA1D2C]" />
                  <span>LG 본사 공인 케어 매니저 방문</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#EA1D2C]" />
                  <span>계약 기간 내내 무상 A/S</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#EA1D2C]" />
                  <span>만기 시 100% 전액 환급</span>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <motion.div 
                key={currentSlide}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative aspect-[4/3] sm:aspect-[16/11] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group"
              >
                <img 
                  src={HERO_SLIDES[currentSlide].image} 
                  alt={HERO_SLIDES[currentSlide].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 sm:p-6">
                  <span className="text-[11px] sm:text-[12px] font-bold text-[#FF8591] bg-black/60 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-md self-start mb-2 border border-white/10 whitespace-nowrap shrink-0">
                    {HERO_SLIDES[currentSlide].tag}
                  </span>
                  <p className="text-[16px] sm:text-[18px] font-black text-white line-clamp-1">
                    {HERO_SLIDES[currentSlide].title} {HERO_SLIDES[currentSlide].highlight}
                  </p>
                </div>
              </motion.div>

              {/* Slider Controls */}
              <div className="flex items-center justify-between mt-4 px-2">
                <div className="flex items-center gap-2">
                  {HERO_SLIDES.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 rounded-full transition-all ${
                        currentSlide === idx ? 'w-8 bg-[#EA1D2C]' : 'w-2 bg-white/30 hover:bg-white/50'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-white">
                  <button 
                    onClick={() => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#EA1D2C]/10 blur-[140px] pointer-events-none rounded-full" />
      </section>

      {/* Infographic Guide Section: LG가전 구독료 10% 할인, 이렇게 받으세요 */}
      <section className="bg-[#F8F9FA] py-10 sm:py-16 border-b border-[#E5E8EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-14">
          
          {/* Section 1 Header & 3-Step Process Flow */}
          <div>
            <div className="text-center max-w-3xl mx-auto mb-7 sm:mb-9 space-y-2.5">
              <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-[12px] font-black text-[#EA1D2C] bg-[#FEECEF] px-3 py-0.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5 fill-[#EA1D2C]" />
                <span>EASY STEP GUIDE</span>
              </div>
              <h2 className="text-[23px] sm:text-[34px] font-black text-[#191F28] tracking-tight leading-[1.25]">
                LG가전 구독료 10% 할인,<br className="sm:hidden" /> 이렇게 받으세요
              </h2>
              <p className="text-[14px] sm:text-[16px] text-[#4E5968] font-medium break-keep leading-relaxed">
                상조 <strong>월 5천원</strong>으로 시작하고,<br className="sm:hidden" /> 원하는 LG가전 구독료는 <strong>매월 10% 할인</strong>받으세요.
              </p>
            </div>

            {/* 3 Step Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5 relative">
              {/* Step 1 */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-[#E5E8EB] shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative group">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-[#EA1D2C] text-white font-black text-[13px] flex items-center justify-center shadow-xs shrink-0">
                        1
                      </span>
                      <h3 className="text-[16px] sm:text-[18px] font-black text-[#191F28] tracking-tight">
                        효원상조 가입
                      </h3>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#EA1D2C] bg-[#FEECEF] px-2 py-0.5 rounded-full shrink-0">
                      STEP 01
                    </span>
                  </div>
                  <p className="text-[12px] sm:text-[13px] text-[#4E5968] font-medium pl-0.5">
                    모바일로 간편하게 가입합니다.
                  </p>
                  <div className="bg-[#F8F9FA] rounded-xl sm:rounded-2xl p-3 sm:p-3.5 space-y-1.5 border border-[#F2F4F6]">
                    <div className="flex items-center justify-between text-[12px] sm:text-[13px]">
                      <span className="text-[#6B7684]">1~48회 납입금</span>
                      <strong className="text-[#191F28] font-extrabold">월 5,000원</strong>
                    </div>
                    <div className="flex items-center justify-between text-[12px] sm:text-[13px] pt-1.5 border-t border-[#E5E8EB]">
                      <span className="text-[#6B7684]">만기 혜택</span>
                      <strong className="text-[#3182F6] font-extrabold">상조회비 전액 환급*</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-[#E5E8EB] shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative group">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-[#3182F6] text-white font-black text-[13px] flex items-center justify-center shadow-xs shrink-0">
                        2
                      </span>
                      <h3 className="text-[16px] sm:text-[18px] font-black text-[#191F28] tracking-tight">
                        원하는 LG가전 구독 가입
                      </h3>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#3182F6] bg-[#E8F3FF] px-2 py-0.5 rounded-full shrink-0">
                      STEP 02
                    </span>
                  </div>
                  <p className="text-[12px] sm:text-[13px] text-[#4E5968] font-medium pl-0.5">
                    원하는 대상 제품 선택 & 계약
                  </p>
                  <div className="bg-[#F8F9FA] rounded-xl sm:rounded-2xl p-3 sm:p-3.5 space-y-1.5 border border-[#F2F4F6] text-[12px] sm:text-[13px]">
                    <div className="flex items-center gap-1.5 text-[#4E5968]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#3182F6] shrink-0" />
                      <span>원하는 대상 제품 선택</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#4E5968]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#3182F6] shrink-0" />
                      <span>LG고객센터를 통한 녹취 계약</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#4E5968]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#3182F6] shrink-0" />
                      <span>제품별 구독 조건 확인</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-gradient-to-br from-[#191F28] to-[#2C3440] text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-md flex flex-col justify-between relative overflow-hidden">
                <div className="space-y-2.5 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-[#EA1D2C] text-white font-black text-[13px] flex items-center justify-center shadow-xs shrink-0">
                        3
                      </span>
                      <h3 className="text-[16px] sm:text-[18px] font-black text-white tracking-tight">
                        혜택: 매월 구독료 10% 할인
                      </h3>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#FF8591] bg-white/10 px-2 py-0.5 rounded-full border border-white/10 shrink-0">
                      BENEFIT
                    </span>
                  </div>
                  <p className="text-[12px] sm:text-[13px] text-[#D1D6DB] font-medium pl-0.5">
                    LG가전 구독료 청구 시 10% 할인된 금액 적용
                  </p>
                  <div className="bg-white/10 backdrop-blur-xs rounded-xl sm:rounded-2xl p-3 sm:p-3.5 space-y-1.5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] sm:text-[13px] text-[#D1D6DB]">매월 구독료 할인율</span>
                      <strong className="text-[15px] sm:text-[17px] text-[#FF8591] font-black">매월 10% 즉시할인</strong>
                    </div>
                    <p className="text-[11px] text-[#A6ADB8] leading-tight">
                      계약 기간(60~72개월) 내내 매월 청구 시 자동 할인 적용
                    </p>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#EA1D2C]/20 rounded-full blur-2xl pointer-events-none" />
              </div>
            </div>

            <p className="text-[11px] sm:text-[12px] text-[#8B95A1] mt-2.5 sm:mt-3 text-left sm:text-right">
              *상조회비 환급은 200회 완납 및 라이프서비스 미사용 등 약관 조건 충족 시 적용됩니다.
            </p>
          </div>

          {/* Section 2: LG가전 구독료 지원금 144만원 받는 방법 & 제휴카드 할인 그리드 (2 Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Box 1: 지원금 144만원 받는 방법 (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E8EB] shadow-xs flex flex-col justify-between space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#3182F6] bg-[#E8F3FF] px-2.5 py-0.5 rounded-md mb-2">
                  <Gift className="w-3.5 h-3.5" />
                  <span>만기 축하금 & 구독료 지원금</span>
                </div>
                <h3 className="text-[20px] sm:text-[24px] font-black text-[#191F28] tracking-tight">
                  LG가전 구독료 지원금 144만원 받는 방법
                </h3>
              </div>

              {/* 2 Step Flow Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Step 1 */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#191F28] text-white text-[12px] font-bold flex items-center justify-center">1</span>
                    <h4 className="font-extrabold text-[15px] text-[#191F28]">효원상조 회비 200회 완납</h4>
                  </div>
                  <div className="space-y-1 text-[12px] text-[#475569]">
                    <div className="flex justify-between">
                      <span>• 1~48회</span>
                      <strong className="text-[#191F28]">월 5,000원</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• 49~200회</span>
                      <strong className="text-[#191F28]">월 28,000원</strong>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#E2E8F0] text-[13px] font-black text-[#191F28]">
                      <span>총 납부 상조회비</span>
                      <span className="text-[#3182F6]">4,496,000원</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#16A34A] text-white text-[12px] font-bold flex items-center justify-center">2</span>
                    <h4 className="font-extrabold text-[15px] text-[#166534]">200회 만기 후 환급 신청</h4>
                  </div>
                  <div className="space-y-1 text-[12px] text-[#15803D]">
                    <div className="flex justify-between">
                      <span>• 상조회비 전액환급</span>
                      <strong>4,496,000원</strong>
                    </div>
                    <div className="flex justify-between text-[#EA1D2C]">
                      <span>• 만기축하금</span>
                      <strong className="font-black">+1,440,000원</strong>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#86EFAC] text-[13px] font-black text-[#14532D]">
                      <span>총 환급금 수령</span>
                      <span className="text-[15px] text-[#16A34A]">5,936,000원</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Highlight Note */}
              <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-2xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#EA580C] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[#9A3412] font-medium leading-relaxed">
                  <strong>144만원</strong>은 200회 만기 시 지급되는 만기축하금으로, <strong>가전 구독료 지원금</strong>에 해당합니다.
                </p>
              </div>
            </div>

            {/* Box 2: 선택 혜택 | 제휴카드 추가 할인 (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E8EB] shadow-xs flex flex-col justify-between space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#16A34A] bg-[#DCFCE7] px-2.5 py-0.5 rounded-md mb-2">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>OPTIONAL BENEFIT</span>
                </div>
                <h3 className="text-[20px] sm:text-[24px] font-black text-[#191F28] tracking-tight whitespace-nowrap flex items-baseline gap-1.5">
                  <span className="text-[13px] sm:text-[15px] font-bold text-[#6B7684] tracking-normal">
                    (선택)
                  </span>
                  <span>LG구독 제휴카드 추가 할인</span>
                </h3>
              </div>

              {/* 3 Step Steps */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-2xl">
                  <span className="w-5 h-5 rounded-full bg-[#3182F6] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="text-[13px] text-[#334155] font-medium">
                    LG전자 홈페이지에서 제휴카드 신청
                  </p>
                </div>
                <div className="flex items-start gap-3 bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-2xl">
                  <span className="w-5 h-5 rounded-full bg-[#3182F6] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="text-[13px] text-[#334155] font-medium">
                    발급받은 카드로 LG구독 자동이체 등록
                  </p>
                </div>
                <div className="flex items-start gap-3 bg-[#F0FDF4] border border-[#86EFAC] p-3.5 rounded-2xl">
                  <span className="w-5 h-5 rounded-full bg-[#16A34A] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <p className="text-[13px] text-[#166534] font-black">
                      카드 조건 충족 시 최대 월 42,000원 청구할인
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[12px] text-[#8B95A1]">
                * 카드별 전월 이용실적과 할인 조건이 적용됩니다.
              </p>
            </div>

          </div>

          {/* Section 3: Consultation Callout Banner */}
          <div className="bg-gradient-to-r from-[#191F28] via-[#1E293B] to-[#0F172A] rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#FF8591] bg-white/10 px-2.5 py-0.5 rounded-md">
                <Headphones className="w-3.5 h-3.5" />
                <span>1:1 전담 무료 맞춤 견적</span>
              </div>
              <h4 className="text-[19px] sm:text-[24px] font-black text-white tracking-tight leading-snug break-keep">
                자세한 할인 조건과<br className="sm:hidden" /> 가입 방법이 궁금하신가요?
              </h4>
              <p className="text-[13px] sm:text-[15px] text-[#D1D6DB] font-medium break-keep">
                상담을 신청하시면 제품별 할인 가능 여부와 가입 절차를 친절하게 안내해 드립니다.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleSelectProductForConsult()}
              className="bg-[#EA1D2C] hover:bg-[#D41423] text-white font-extrabold px-8 py-4 rounded-2xl text-[15px] sm:text-[16px] shadow-lg shadow-[#EA1D2C]/40 transition-all flex items-center gap-2 whitespace-nowrap active:scale-95 cursor-pointer shrink-0"
            >
              <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <span>무료 상담 신청하기</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* Quick Category Icons Menu */}
      <section id="category-section" className="bg-white border-b border-[#E5E8EB] py-7 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] sm:text-[12px] font-extrabold text-[#EA1D2C] bg-[#FEECEF] px-2 py-0.5 rounded-sm">
                  CATEGORY QUICK MENU
                </span>
                <span className="text-[12px] sm:text-[13px] font-bold text-[#8B95A1]">LG전자 20대 핵심 가전</span>
              </div>
              <h2 className="text-[18px] sm:text-[24px] font-black text-[#191F28] leading-snug">
                원하는 가전을 선택하고<br className="sm:hidden" /> 맞춤 혜택을 확인하세요
              </h2>
            </div>

            {/* Category Reset */}
            {selectedCategory !== 'all' && (
              <button 
                onClick={() => setSelectedCategory('all')}
                className="flex items-center gap-1.5 text-[12px] sm:text-[13px] font-bold text-[#4E5968] bg-[#F2F4F6] hover:bg-[#E5E8EB] px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>전체 카테고리 보기</span>
              </button>
            )}
          </div>

          {/* Categories Grid - 20 categories balanced into 2 rows of 10 in PC (Dynamically ordered from Admin) */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-4">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = categoryProductCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    const newCat = cat.id === selectedCategory ? 'all' : cat.id;
                    setSelectedCategory(newCat);
                    setSelectedSubTab('all');
                    setActiveTab('all');
                    const prdSection = document.getElementById('product-section');
                    if (prdSection) {
                      prdSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className={`group relative flex flex-col items-center justify-center py-2.5 px-1 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected 
                      ? 'bg-[#FEECEF] border-[#EA1D2C] shadow-md shadow-[#EA1D2C]/10 translate-y-[-2px]' 
                      : 'bg-[#F9FAFB] border-[#E5E8EB] hover:bg-white hover:border-[#D1D6DB] hover:shadow-xs'
                  }`}
                >
                  {/* Category Product Count Badge */}
                  <span className={`absolute -top-1.5 -right-1 text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs z-10 transition-colors ${
                    count > 0 
                      ? (isSelected ? 'bg-[#EA1D2C] text-white ring-1 ring-white' : 'bg-[#FEECEF] text-[#EA1D2C] group-hover:bg-[#EA1D2C] group-hover:text-white')
                      : 'bg-gray-100 text-gray-400 opacity-60'
                  }`}>
                    {count}
                  </span>
                  <span className="h-8 sm:h-9 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                    {cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('data:image') || cat.icon.startsWith('/')) ? (
                      <img src={cat.icon} alt={cat.name} className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
                    ) : (
                      <span className="text-[22px] sm:text-3xl leading-none">{cat.icon || '📦'}</span>
                    )}
                  </span>
                  <span className={`text-[11px] sm:text-[13px] font-bold tracking-tight text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-0.5 ${
                    isSelected ? 'text-[#EA1D2C] font-black' : 'text-[#333D4B]'
                  }`}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Products Section */}
      <section id="product-section" className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[12px] font-black text-[#EA1D2C] bg-[#FEECEF] px-2.5 py-1 rounded-full mb-2">
              <Sparkle className="w-3.5 h-3.5 fill-[#EA1D2C]" />
              <span>POPULAR CARE PRODUCTS</span>
            </div>
            <h2 className="text-[24px] sm:text-[32px] font-black text-[#191F28] tracking-tight">
              카테고리별 인기 가전 구독 모델
            </h2>
            <p className="text-[14px] sm:text-[15px] text-[#6B7684] mt-1">
              LG 공식 월 구독료에서 <strong>효원라이프 결합 지원</strong>으로 파격적인 할인 혜택을 제공합니다.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-[#8B95A1] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="모델명/가전명 검색..."
              className="w-full bg-white border border-[#E5E8EB] rounded-xl pl-9 pr-4 py-2.5 text-[13px] font-medium focus:outline-none focus:border-[#EA1D2C] transition-colors"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B95A1] hover:text-[#191F28]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Selected Category Filter Status Bar */}
        <div className="flex flex-row items-center justify-between gap-2 bg-white px-3.5 sm:px-5 py-2.5 sm:py-3.5 rounded-2xl border border-[#E5E8EB] mb-4 shadow-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[13px] sm:text-[14px] min-w-0">
            <span className="hidden sm:inline text-[#8B95A1] font-medium text-[13px]">카테고리:</span>
            {selectedCategory === 'all' ? (
              <span className="font-extrabold text-[#191F28] truncate">
                전체 가전 구독 상품 <span className="text-[#8B95A1] font-semibold text-[12px]">({filteredProducts.length}개)</span>
              </span>
            ) : (
              <div className="flex items-center gap-1.5 truncate">
                <span className="inline-flex items-center font-extrabold text-[#EA1D2C] bg-[#FEECEF] px-2 py-0.5 rounded-md text-[12px] sm:text-[13px] whitespace-nowrap shrink-0">
                  {CATEGORIES.find(c => c.id === selectedCategory)?.name || selectedCategory}
                </span>
                <span className="font-extrabold text-[#191F28] whitespace-nowrap">구독 라인업</span>
                <span className="text-[11px] sm:text-[12px] font-semibold text-[#8B95A1] whitespace-nowrap">
                  (총 {filteredProducts.length}개)
                </span>
              </div>
            )}
          </div>

          {selectedCategory !== 'all' && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSubTab('all');
                setSearchTerm('');
              }}
              className="flex items-center gap-1 text-[11px] sm:text-[12px] font-bold text-[#EA1D2C] bg-[#FFF0F2] hover:bg-[#FEECEF] px-2.5 py-1 rounded-full shrink-0 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>전체보기</span>
            </button>
          )}
        </div>

        {/* Subcategory Secondary Tabs (e.g. STEM, 상냉장/하냉동, 양문형, 일반형 등) */}
        {currentSubTabs.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 no-scrollbar">
            <button
              onClick={() => setSelectedSubTab('all')}
              className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${
                selectedSubTab === 'all'
                  ? 'bg-[#191F28] text-white shadow-xs'
                  : 'bg-white text-[#4E5968] border border-[#E5E8EB] hover:bg-[#F2F4F6]'
              }`}
            >
              전체
            </button>
            {currentSubTabs.map((sub) => {
              const matchCount = allProductList.filter(p => {
                if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
                return matchesSubCategory(
                  {
                    category: p.category,
                    categoryName: p.categoryName,
                    subCategory: p.subCategory,
                    subCategoryName: p.subCategoryName,
                    name: p.name,
                    model: p.model,
                    specs: p.specs,
                  },
                  sub.id,
                  sub.name
                );
              }).length;

              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubTab(sub.name)}
                  className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    selectedSubTab === sub.name
                      ? 'bg-[#EA1D2C] text-white shadow-md shadow-[#EA1D2C]/20 font-black'
                      : 'bg-white text-[#4E5968] border border-[#E5E8EB] hover:bg-[#F2F4F6]'
                  }`}
                >
                  <span>{sub.name}</span>
                  {matchCount > 0 && (
                    <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedSubTab === sub.name ? 'bg-white/20 text-white' : 'bg-[#F2F4F6] text-[#8B95A1]'
                    }`}>
                      {matchCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Products Grid */}
        {displayedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {displayedProducts.map((product) => (
                <div 
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden border border-[#E5E8EB] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group relative"
                >
                  {/* 1. Top Badges (Filtered) */}
                  <div className="p-4 pb-0 flex items-start justify-between min-h-[36px]">
                    {/* Top Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {product.topBadges && product.topBadges.length > 0 ? (
                        product.topBadges
                          .filter(badge => 
                            !badge.includes('다품목') && 
                            !badge.includes('포인트') && 
                            !badge.includes('사은품') && 
                            !badge.includes('닷컴') && 
                            !badge.includes('ONLY')
                          )
                          .map((badge, bIdx) => (
                            <span 
                              key={bIdx}
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-xs tracking-tight ${
                                badge.includes('출시') 
                                  ? 'bg-[#191F28] text-white' 
                                  : 'bg-[#EA1D2C] text-white'
                              }`}
                            >
                              {badge}
                            </span>
                          ))
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-xs bg-[#EA1D2C] text-white">
                          무상철거및재설치
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. Center Product Image */}
                  <div 
                    onClick={() => handleOpenProductModal(product)}
                    className="relative aspect-square px-8 py-4 flex items-center justify-center cursor-pointer bg-white"
                  >
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenProductModal(product);
                      }}
                      className="absolute bottom-2 right-4 bg-white/90 p-2 rounded-full text-[#8B95A1] hover:text-[#191F28] border border-[#E5E8EB] shadow-xs transition-transform group-hover:scale-110"
                      title="상세보기"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 3. Product Info & Key Specs */}
                  <div className="p-5 pt-2 flex-1 flex flex-col justify-between border-t border-[#F2F4F6]">
                    <div className="space-y-2.5">
                      {/* Title and Keywd Tags with Fixed Heights for Perfect Horizontal Alignment */}
                      <div>
                        {(() => {
                          const capInfo = getProductCapacityInfo(
                            product.model, 
                            product.name, 
                            product.category, 
                            product.categoryName, 
                            product.specs
                          );

                          return (
                            <>
                              <h3 
                                onClick={() => handleOpenProductModal(product)}
                                className="h-[48px] text-[16px] sm:text-[17px] font-black text-[#191F28] group-hover:text-[#EA1D2C] transition-colors leading-[24px] cursor-pointer line-clamp-2 flex items-start flex-wrap gap-1"
                                title={product.name}
                              >
                                <span>{product.name}</span>
                                {capInfo && (
                                  <span className="inline-flex items-center bg-[#E8F3FF] text-[#1B64DA] border border-[#BBDDFF] text-[11.5px] font-black px-1.5 py-0.2 rounded-md shrink-0">
                                    {capInfo.label}
                                  </span>
                                )}
                              </h3>

                              {/* Spec Badges (Unique additional tags like 1등급, 에너지효율 등 - no duplicate capacity) with Fixed Height */}
                              <div className="h-[24px] flex items-center gap-1.5 mt-1.5 overflow-hidden">
                                {(() => {
                                  const filteredTags = (product.keywdTags || []).filter(tag => {
                                    if (!tag) return false;
                                    const lower = tag.toLowerCase().trim();
                                    // Filter out duplicate capacity tags
                                    if (capInfo && (lower.includes('kg') || lower.includes('l') || lower.includes('평') || lower.includes('인용'))) {
                                      return false;
                                    }
                                    return true;
                                  });

                                  if (filteredTags.length > 0) {
                                    return filteredTags.map((tag, tIdx) => (
                                      <span 
                                        key={tIdx}
                                        className="text-[11px] font-bold text-[#4E5968] bg-[#F2F4F6] px-2 py-0.5 rounded border border-[#E5E8EB] shrink-0"
                                      >
                                        {tag}
                                      </span>
                                    ));
                                  }

                                  return (
                                    <span className="text-[11px] font-bold text-[#8B95A1] bg-[#F9FAFB] px-2 py-0.5 rounded border border-[#F2F4F6]">
                                      공식 정품
                                    </span>
                                  );
                                })()}
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Feature Summary Line (주요 기능 요약) with Fixed Height */}
                      <div className="h-[54px] bg-[#F9FAFB] p-2.5 rounded-xl border border-[#F2F4F6] flex items-center">
                        <p className="text-[12px] text-[#6B7684] leading-tight line-clamp-2 w-full">
                          {product.featureSummary || 'LG 본사 공인 전문 케어 매니저 정기 방문 살균 세척 및 무상 소모품 교체 지원'}
                        </p>
                      </div>

                      {/* Model Code, Color/Type & Rating with Fixed Height */}
                      <div className="h-[20px] flex items-center gap-1.5 text-[12px] text-[#8B95A1] overflow-hidden">
                        <span className="font-mono text-[#4E5968] font-bold shrink-0">{product.model}</span>
                        {(() => {
                          const isTv = product.category === 'tv' || product.categoryName?.includes('TV') || product.name?.includes('TV') || product.name?.includes('QNED') || product.name?.includes('OLED');
                          if (isTv) {
                            const upperModel = (product.model || '').toUpperCase().trim();
                            const isWall = upperModel.endsWith('W') || upperModel.endsWith('MW') || upperModel.endsWith('KW') || upperModel.endsWith('BKW') || upperModel.endsWith('BMW') || upperModel.includes('WALL') || product.name?.includes('벽걸이');
                            const tvType = isWall ? '벽걸이형' : '스탠드형';
                            return (
                              <>
                                <span className="text-[#D1D6DB] shrink-0">|</span>
                                <span className="text-[#191F28] font-bold shrink-0">{tvType}</span>
                              </>
                            );
                          }
                          // Filter out color if it's just capacity like '24kg', '870L'
                          const isColorCapacity = product.color && /^\d+(kg|l|평|인용)?$/i.test(product.color.trim());
                          if (product.color && !isColorCapacity && product.color !== '기본') {
                            return (
                              <>
                                <span className="text-[#D1D6DB] shrink-0">|</span>
                                <span className="text-[#191F28] font-medium truncate">{product.color}</span>
                              </>
                            );
                          }
                          return null;
                        })()}
                        {product.rating && (
                          <>
                            <span className="text-[#D1D6DB] shrink-0">|</span>
                            <span className="flex items-center gap-0.5 text-[#FF8A00] font-bold shrink-0">
                              ★ {product.rating} <span className="text-[#8B95A1] font-normal text-[10px] sm:text-[11px]">{product.reviewCount || ''}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 4. Pricing Box - 3 Clear Graduated Steps */}
                    <div className="pt-3 mt-2 border-t border-[#F2F4F6] space-y-2">
                      {/* Step 1: LG Official Monthly Price (Subtle Reference Price) */}
                      <div className="flex items-baseline justify-between px-1 text-[#6B7684]">
                        <span className="text-[12px] font-semibold">1. LG 공식 월 구독료</span>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-[11px] font-medium">월</span>
                          <span className="text-[14px] sm:text-[15px] font-bold text-[#4E5968]">
                            {product.rentalPrice.toLocaleString()}
                          </span>
                          <span className="text-[11px] font-medium">원</span>
                        </div>
                      </div>

                      {/* Step 2: Hyowon Sangjo 10% Discount Benefit Box (Larger & Prominent) */}
                      <div className="bg-[#FFF0F2] rounded-xl p-2.5 border border-[#EA1D2C]/30 flex items-center justify-between shadow-2xs">
                        <div className="text-[12px]">
                          <span className="font-extrabold text-[#EA1D2C] block">2. 효원상조 결합 혜택</span>
                          <span className="text-[10px] text-[#6B7684]">매월 10% 할인 + 만기 100% 환급</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[17px] sm:text-[18px] font-black text-[#EA1D2C] block leading-tight">
                            월 {calc10PercentDiscount(product.rentalPrice).toLocaleString()}원
                          </span>
                          <span className="text-[10px] text-[#EA1D2C] font-extrabold">
                            만기축하금 +144만~
                          </span>
                        </div>
                      </div>

                      {/* Step 3: LG Subscription Affiliate Card Applied Price (Largest & Most Eye-catching Highlight) */}
                      <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-[#F0FDF4] to-[#DCFCE7] border-2 border-[#22C55E]/60 shadow-xs">
                        <div>
                          <span className="text-[#15803D] font-extrabold text-[12px] sm:text-[13px] flex items-center gap-1">
                            <CreditCard className="w-4 h-4 text-[#16A34A]" />
                            3. 제휴카드 적용 시
                          </span>
                          <span className="text-[10px] text-[#166534] block font-medium mt-0.5">
                            (제휴카드 최대 -42,000원 추가할인)
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[20px] sm:text-[22px] font-black text-[#15803D] block tracking-tight leading-none">
                            월 {Math.max(0, calc10PercentDiscount(product.rentalPrice) - 42000).toLocaleString()}원
                          </span>
                        </div>
                      </div>

                      {/* Delivery & Care Notice */}
                      <div className="text-[11px] text-[#8B95A1] pt-0.5 px-1 flex items-center justify-between">
                        <span>설치비 안내</span>
                        <span>{product.deliveryText || '전문기사 설치 | 이번주 도착 예정'}</span>
                      </div>
                    </div>

                    {/* 5. Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-3">
                      <button 
                        onClick={() => handleOpenProductModal(product)}
                        className="py-2.5 px-3 rounded-xl text-[12px] font-bold bg-[#F2F4F6] hover:bg-[#E5E8EB] text-[#333D4B] transition-colors text-center"
                      >
                        구독 옵션 보기
                      </button>
                      <button 
                        onClick={() => handleSelectProductForConsult(product)}
                        className="py-2.5 px-3 rounded-xl text-[12px] font-black bg-[#EA1D2C] hover:bg-[#C81020] text-white transition-colors shadow-md shadow-[#EA1D2C]/15 flex items-center justify-center gap-1 active:scale-95 text-center"
                      >
                        <span>효원특가 신청</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {filteredProducts.length > visibleCount && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 9)}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-[#F9FAFB] text-[#191F28] font-black text-[15px] rounded-2xl border-2 border-[#E5E8EB] hover:border-[#191F28] transition-all shadow-sm hover:shadow-md active:scale-98"
                >
                  <span>가전 구독 상품 더보기 ({Math.min(visibleCount, filteredProducts.length)} / {filteredProducts.length})</span>
                  <ChevronDown className="w-4 h-4 text-[#8B95A1]" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-[#D1D6DB] space-y-3">
            <Search className="w-10 h-10 text-[#8B95A1] mx-auto" />
            <p className="text-[16px] font-bold text-[#4E5968]">해당 조건에 맞는 가전 구독 상품이 없습니다.</p>
            <button 
              onClick={() => { setSelectedCategory('all'); setSelectedSubTab('all'); setSearchTerm(''); }}
              className="text-[13px] font-bold text-[#EA1D2C] hover:underline"
            >
              필터 초기화
            </button>
          </div>
        )}
      </section>

      {/* 5 Core Benefits Showcase Section */}
      <section id="benefit-section" className="bg-[#191F28] text-white py-12 sm:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14 space-y-3.5 sm:space-y-4">
            <div>
              <span className="inline-block text-[11px] sm:text-[12px] font-extrabold text-[#FF8591] bg-white/10 px-3.5 py-1 rounded-full border border-white/15">
                WHY LG CARE SOLUTIONS?
              </span>
            </div>
            <h2 className="text-[26px] sm:text-[36px] font-black tracking-tight leading-tight sm:leading-snug pt-1">
              LG전자 가전구독만의<br className="sm:hidden" /> 5대 프리미엄 혜택
            </h2>
            <p className="text-[13px] sm:text-[15px] text-[#A6ADB8] break-keep leading-relaxed">
              단순한 렌탈을 넘어 늘 새것처럼 쾌적하게 관리받고,<br className="sm:hidden" /> 효원상조 결합으로 비용 부담은 확 줄이세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {/* Benefit 1 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:bg-white/10 transition-all flex items-start gap-3.5 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#EA1D2C] flex items-center justify-center text-white shadow-md shadow-[#EA1D2C]/30 shrink-0">
                <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-[15px] sm:text-[17px] font-black text-white">
                  1. 전문 케어 서비스 제공
                </h3>
                <p className="text-[12px] sm:text-[13px] text-[#A6ADB8] leading-relaxed break-keep">
                  LG전자에서 직접 교육하고 엄격하게 검증한 가전 케어 전문가가 정기적으로 방문하여 고압·고온 스팀 살균, 분해 세척, 소모품 무상 교체까지 꼼꼼히 관리합니다.
                </p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:bg-white/10 transition-all flex items-start gap-3.5 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#3182F6] flex items-center justify-center text-white shadow-md shadow-[#3182F6]/30 shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-[15px] sm:text-[17px] font-black text-white">
                  2. 계약기간 내 100% 무상 A/S
                </h3>
                <p className="text-[12px] sm:text-[13px] text-[#A6ADB8] leading-relaxed break-keep">
                  구독 계약 기간 내내 제품 고장으로 발생한 A/S 수리 서비스를 무상으로 제공해 드려 예기치 못한 수리비 걱정 없이 언제나 안심하고 사용하실 수 있습니다.
                </p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:bg-white/10 transition-all flex items-start gap-3.5 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#EA1D2C] flex items-center justify-center text-white shadow-md shadow-[#EA1D2C]/30 shrink-0">
                <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-[15px] sm:text-[17px] font-black text-white">
                  3. 효원상조 결합 전액 지원
                </h3>
                <p className="text-[12px] sm:text-[13px] text-[#A6ADB8] leading-relaxed break-keep">
                  효원상조 결합 시 매월 구독료를 최대 100% 전액 지원해 드리며, 만기 시 납입금 100% 원금 환급으로 최고의 가성비를 선사합니다.
                </p>
              </div>
            </div>

            {/* Benefit 4 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:bg-white/10 transition-all flex items-start gap-3.5 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#00B074] flex items-center justify-center text-white shadow-md shadow-[#00B074]/30 shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-[15px] sm:text-[17px] font-black text-white">
                  4. 다품목 캐시백 & 멤버십P
                </h3>
                <p className="text-[12px] sm:text-[13px] text-[#A6ADB8] leading-relaxed break-keep">
                  신규 2개 이상의 제품군을 동시 구독 시 추가 월 요금 할인 및 추가 품목 수에 따른 특별 캐시백과 LGE.COM 멤버십 포인트를 증정합니다.
                </p>
              </div>
            </div>

            {/* Benefit 5 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:bg-white/10 transition-all flex items-start gap-3.5 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#F59E0B] flex items-center justify-center text-white shadow-md shadow-[#F59E0B]/30 shrink-0">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-[15px] sm:text-[17px] font-black text-white">
                  5. 제휴카드 매월 추가 청구할인
                </h3>
                <p className="text-[12px] sm:text-[13px] text-[#A6ADB8] leading-relaxed break-keep">
                  LG전자 우리카드, KB국민, 신한, 롯데 등 제휴카드로 월 구독료 납부 시 전월 실적에 따라 매월 최대 22,000원 ~ 42,000원 추가 청구할인을 제공합니다.
                </p>
              </div>
            </div>

            {/* Benefit 6 - Quick CTA Card */}
            <div className="bg-gradient-to-br from-[#EA1D2C] to-[#8E0914] rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col justify-between space-y-4 sm:space-y-6 shadow-xl">
              <div className="space-y-1.5">
                <span className="text-[11px] sm:text-[12px] font-black bg-white/20 px-2.5 py-0.5 rounded-md text-white inline-block">
                  1:1 맞춤 견적
                </span>
                <h3 className="text-[16px] sm:text-[20px] font-black text-white leading-snug">
                  전문 플래너와 함께 최대 혜택 견적을 확인하세요
                </h3>
                <p className="text-[12px] sm:text-[13px] text-white/80">
                  결합 구좌별 최적의 할인 조합을 친절하게 안내해 드립니다.
                </p>
              </div>

              <button 
                type="button"
                onClick={() => handleSelectProductForConsult()}
                className="w-full py-3 sm:py-3.5 bg-white text-[#EA1D2C] hover:bg-[#F2F4F6] rounded-xl sm:rounded-2xl text-[13px] sm:text-[14px] font-black text-center shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                무료 견적 상담 신청
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Hyowon Life Plan 144 Combined Discount Structure Section */}
      <section id="hyowon-plan-section" className="bg-[#F8F9FA] py-12 sm:py-20 border-b border-[#E5E8EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14 space-y-2 sm:space-y-3">
            <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-[12px] font-black text-[#EA1D2C] bg-[#FEECEF] px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 fill-[#EA1D2C]" />
              <span>HYOWON × LG ELECTRONICS SUBSCRIBE 144</span>
            </div>
            <h2 className="text-[22px] sm:text-[36px] font-black text-[#191F28] tracking-tight leading-tight">
              LG 가전 구독료는 낮추고,<br className="sm:hidden" /> 상조 만기 혜택은 더하고!
            </h2>
            <p className="text-[13px] sm:text-[15px] text-[#4E5968] break-keep leading-relaxed">
              단순히 가전을 빌려 쓰는 비용에 그치지 않고, <strong>매월 구독료 10% 즉시 할인</strong>받으면서 미래의 <strong>라이프서비스와 만기 100% 환급+축하금 144만원</strong>까지 준비하는 파격 결합형 상품입니다.
            </p>
          </div>

          {/* 3 Core Benefit Pillars Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 mb-8 sm:mb-12">
            {/* Pillar 1 */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-[#E5E8EB] shadow-xs hover:shadow-lg transition-all space-y-2 sm:space-y-3 relative overflow-hidden">
              <div className="inline-block text-[11px] font-black bg-[#E8F3FF] text-[#3182F6] px-2.5 py-0.5 rounded-md">
                지금 받는 즉시 혜택
              </div>
              <div className="text-[26px] sm:text-[34px] font-black text-[#3182F6] whitespace-nowrap">
                매월 10% <span className="text-[17px] sm:text-[20px] font-bold text-[#191F28]">할인</span>
              </div>
              <h3 className="text-[15px] sm:text-[18px] font-black text-[#191F28] whitespace-nowrap">
                LG 가전 구독료 매월 10% 즉시 할인
              </h3>
              <p className="text-[12px] sm:text-[13px] text-[#6B7684] leading-relaxed break-keep">
                상조 결합 유지 기간 동안 5년(60개월) 또는 6년(72개월) 계약 전 기간 내내 매월 가전 구독료를 10% 파격 할인해 드립니다.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-[#E5E8EB] shadow-xs hover:shadow-lg transition-all space-y-2 sm:space-y-3 relative overflow-hidden">
              <div className="inline-block text-[11px] font-black bg-[#E6F9F0] text-[#00B074] px-2.5 py-0.5 rounded-md">
                초기 48개월 파격 부담 완화
              </div>
              <div className="text-[26px] sm:text-[34px] font-black text-[#00B074] whitespace-nowrap">
                월 5,000원 <span className="text-[17px] sm:text-[20px] font-bold text-[#191F28]">(1구좌)</span>
              </div>
              <h3 className="text-[15px] sm:text-[18px] font-black text-[#191F28] whitespace-nowrap">
                초기 48개월 상조 회비 지원
              </h3>
              <p className="text-[12px] sm:text-[13px] text-[#6B7684] leading-relaxed break-keep">
                1~48회차까지 매월 30,000원 할인지원으로 고객 실납입금은 월 단 5,000원! 부담 없이 가전 할인과 미래 보장을 시작하세요.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-gradient-to-br from-[#FFF5F6] to-[#FEECEF] rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-[#EA1D2C]/30 shadow-xs hover:shadow-lg transition-all space-y-2 sm:space-y-3 relative overflow-hidden">
              <div className="inline-block text-[11px] font-black bg-[#EA1D2C] text-white px-2.5 py-0.5 rounded-md shadow-2xs">
                만기 시 100% 환급 + 추가 축하금
              </div>
              <div className="text-[26px] sm:text-[34px] font-black text-[#EA1D2C] whitespace-nowrap">
                +144만원 <span className="text-[17px] sm:text-[20px] font-bold text-[#191F28]">(구좌당)</span>
              </div>
              <h3 className="text-[15px] sm:text-[18px] font-black text-[#191F28] whitespace-nowrap">
                실납입금 100% 환급 + 만기축하금
              </h3>
              <p className="text-[12px] sm:text-[13px] text-[#4E5968] leading-relaxed break-keep">
                200회 완납 후 라이프서비스 미사용 시 <strong>고객 실납입금 전액 환급 + 만기축하금 144만원</strong>을 합산하여 총 5,936,000원을 지급합니다.
              </p>
            </div>
          </div>

          {/* Interactive Accounts Plan Comparison Tabs */}
          {/* Interactive Accounts Plan Comparison Tabs */}
          <div className="bg-white rounded-3xl border border-[#E5E8EB] p-4 sm:p-10 shadow-md mb-8 sm:mb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-[#E5E8EB]">
              <div>
                <span className="text-[11px] sm:text-[12px] font-extrabold text-[#EA1D2C] uppercase tracking-wider">
                  PLAN OPTIONS (1~4 구좌 선택)
                </span>
                <h3 className="text-[18px] sm:text-[24px] font-black text-[#191F28] mt-0.5 leading-snug">
                  필요한 서비스 횟수와 만기 규모에 따른 구좌별 구성
                </h3>
              </div>

              {/* Account Tabs (Responsive Grid) */}
              <div className="grid grid-cols-4 w-full md:w-auto bg-[#F2F4F6] p-1 sm:p-1.5 rounded-2xl gap-1">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedPlanAccounts(num)}
                    className={`py-2 px-1 sm:px-5 sm:py-2.5 rounded-xl text-center transition-all cursor-pointer ${
                      selectedPlanAccounts === num
                        ? 'bg-white text-[#EA1D2C] shadow-sm font-black'
                        : 'text-[#6B7684] hover:text-[#191F28] font-bold'
                    }`}
                  >
                    <div className="text-[12px] sm:text-[14px] whitespace-nowrap">{num}구좌</div>
                    <div className="text-[9px] sm:text-[11px] opacity-75 font-semibold">
                      {num === 1 ? 'SINGLE' : num === 2 ? 'DOUBLE' : num === 3 ? 'TRIPLE' : 'QUAD'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content Box */}
            <div className="pt-5 sm:pt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
              {/* Left Details */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="text-[17px] sm:text-[22px] font-black text-[#191F28] break-keep">
                    해피효원라이프·구독 144 ({selectedPlanAccounts}구좌)
                  </h4>
                  <span className="text-[11px] sm:text-[12px] font-extrabold bg-[#EA1D2C] text-white px-2.5 py-0.5 rounded-full shrink-0">
                    라이프서비스 {selectedPlanAccounts}회 제공
                  </span>
                </div>

                <p className="text-[13px] sm:text-[14px] text-[#4E5968] leading-relaxed break-keep">
                  {selectedPlanAccounts === 1 && 'LG 가전 구독 10% 할인과 기본적인 1인 미래 라이프케어를 원하는 고객에게 추천합니다.'}
                  {selectedPlanAccounts === 2 && '부부 또는 부모·자녀 등 가족 내 2회의 라이프서비스 이용 가능성을 고려하는 고객에게 최적입니다.'}
                  {selectedPlanAccounts === 3 && '가족 단위 보장 횟수와 만기 환급 자금(432만원 축하금) 규모를 함께 높이려는 고객에게 적합합니다.'}
                  {selectedPlanAccounts === 4 && '1인 최대 한도! 만기축하금 576만원과 4회의 프리미엄 전환 서비스를 완벽하게 준비할 수 있습니다.'}
                </p>

                {/* Timeline Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
                  <div className="bg-[#F8F9FA] p-3 sm:p-3.5 rounded-2xl border border-[#E5E8EB]">
                    <span className="text-[10px] sm:text-[11px] text-[#8B95A1] font-bold block">1~48회 월 실납입</span>
                    <span className="text-[14px] sm:text-[18px] font-black text-[#191F28] mt-0.5 block whitespace-nowrap">
                      월 {(5000 * selectedPlanAccounts).toLocaleString()}원
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-[#EA1D2C] font-bold whitespace-nowrap block mt-0.5">월 {(30000 * selectedPlanAccounts).toLocaleString()}원 지원</span>
                  </div>

                  <div className="bg-[#F8F9FA] p-3 sm:p-3.5 rounded-2xl border border-[#E5E8EB]">
                    <span className="text-[10px] sm:text-[11px] text-[#8B95A1] font-bold block">49~200회 월 납입</span>
                    <span className="text-[14px] sm:text-[18px] font-black text-[#191F28] mt-0.5 block whitespace-nowrap">
                      월 {(28000 * selectedPlanAccounts).toLocaleString()}원
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-[#6B7684] whitespace-nowrap block mt-0.5">만기 시 전액 환급</span>
                  </div>

                  <div className="bg-[#F8F9FA] p-3 sm:p-3.5 rounded-2xl border border-[#E5E8EB]">
                    <span className="text-[10px] sm:text-[11px] text-[#8B95A1] font-bold block">고객 실납입 총액</span>
                    <span className="text-[14px] sm:text-[18px] font-black text-[#191F28] mt-0.5 block whitespace-nowrap">
                      {(4496000 * selectedPlanAccounts).toLocaleString()}원
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-[#00B074] font-bold whitespace-nowrap block mt-0.5">200회 완납 기준</span>
                  </div>

                  <div className="bg-[#FEECEF] p-3 sm:p-3.5 rounded-2xl border border-[#EA1D2C]/30">
                    <span className="text-[10px] sm:text-[11px] text-[#EA1D2C] font-bold block">만기 시 총 지급액</span>
                    <span className="text-[14px] sm:text-[18px] font-black text-[#EA1D2C] mt-0.5 block whitespace-nowrap">
                      {(5936000 * selectedPlanAccounts).toLocaleString()}원
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-[#EA1D2C] font-extrabold whitespace-nowrap block mt-0.5">+{(1440000 * selectedPlanAccounts).toLocaleString()}원 축하금</span>
                  </div>
                </div>
              </div>

              {/* Right Big Highlight Card */}
              <div className="lg:col-span-5 bg-gradient-to-br from-[#191F28] to-[#2B3441] rounded-3xl p-5 sm:p-7 text-white space-y-3.5 sm:space-y-4 shadow-xl">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] sm:text-[12px] font-black bg-[#EA1D2C] px-2.5 py-0.5 rounded-full text-white shrink-0">
                    만기 혜택 요약
                  </span>
                  <span className="text-[11px] sm:text-[12px] text-[#A6ADB8] shrink-0">
                    200회 완납 & 미사용 기준
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] sm:text-[12px] text-[#A6ADB8] block">고객이 돌려받는 만기 총 금액</span>
                  <div className="text-[26px] sm:text-[34px] font-black text-[#FF8591] whitespace-nowrap">
                    {(5936000 * selectedPlanAccounts).toLocaleString()}<span className="text-[18px] sm:text-[20px] text-white font-bold ml-0.5">원</span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-3 space-y-1.5 text-[12px] sm:text-[13px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#A6ADB8] min-w-0">• 고객 실납입 원금 (100% 환급)</span>
                    <span className="font-bold text-white whitespace-nowrap shrink-0">{(4496000 * selectedPlanAccounts).toLocaleString()}원</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[#00B074]">
                    <span className="min-w-0">• 만기축하금 ({selectedPlanAccounts}구좌)</span>
                    <span className="font-black whitespace-nowrap shrink-0">+{(1440000 * selectedPlanAccounts).toLocaleString()}원</span>
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-3 text-[11px] sm:text-[12px] text-[#E5E8EB] leading-relaxed break-keep">
                  💡 가전을 이용하는 동안 <strong>매월 10% 구독료를 할인</strong>받고, 상조를 만기까지 유지하면 <strong>낸 돈 전액과 만기축하금 {(144 * selectedPlanAccounts)}만원</strong>을 고스란히 돌려받습니다.
                </div>
              </div>
            </div>
          </div>

          {/* Real Customer Simulation Example Box (체감 구독비 50% 절감 예시) */}
          <div className="bg-white rounded-3xl border border-[#E5E8EB] p-4 sm:p-10 shadow-sm mb-8 sm:mb-12">
            <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8 space-y-1.5 sm:space-y-2">
              <span className="text-[11px] sm:text-[12px] font-black text-[#3182F6] bg-[#E8F3FF] px-3 py-0.5 sm:py-1 rounded-full">
                REAL SAVINGS SIMULATION
              </span>
              <h3 className="text-[18px] sm:text-[26px] font-black text-[#191F28] leading-tight">
                고객이 바로 체감하는 혜택 예시<br className="sm:hidden" /> (월 5만원 가전 기준)
              </h3>
              <p className="text-[12px] sm:text-[14px] text-[#6B7684]">
                월 50,000원 (72개월) LG 프리미엄 가전 구독 시 1구좌 결합 시뮬레이션
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 items-center">
              {/* Box 1 */}
              <div className="bg-[#F8F9FA] p-4 sm:p-6 rounded-2xl border border-[#E5E8EB] text-center space-y-0.5 sm:space-y-1">
                <span className="text-[11px] sm:text-[12px] text-[#8B95A1] font-bold block">정상 가전 구독료</span>
                <span className="text-[20px] sm:text-[22px] font-black text-[#191F28] block whitespace-nowrap">3,600,000원</span>
                <span className="text-[11px] text-[#6B7684]">월 50,000원 × 72개월</span>
              </div>

              {/* Minus Box 2 */}
              <div className="bg-[#E8F3FF] p-4 sm:p-6 rounded-2xl border border-[#3182F6]/20 text-center space-y-0.5 sm:space-y-1">
                <span className="text-[11px] sm:text-[12px] text-[#3182F6] font-bold block">매월 10% 즉시 할인</span>
                <span className="text-[20px] sm:text-[22px] font-black text-[#3182F6] block whitespace-nowrap">-360,000원</span>
                <span className="text-[11px] text-[#3182F6]">월 5,000원 × 72개월 절감</span>
              </div>

              {/* Minus Box 3 */}
              <div className="bg-[#FEECEF] p-4 sm:p-6 rounded-2xl border border-[#EA1D2C]/20 text-center space-y-0.5 sm:space-y-1">
                <span className="text-[11px] sm:text-[12px] text-[#EA1D2C] font-bold block">상조 만기축하금</span>
                <span className="text-[20px] sm:text-[22px] font-black text-[#EA1D2C] block whitespace-nowrap">-1,440,000원</span>
                <span className="text-[11px] text-[#EA1D2C]">200회 만기 시 환급 지급</span>
              </div>

              {/* Equal Final Result */}
              <div className="bg-gradient-to-br from-[#EA1D2C] to-[#C81020] p-4 sm:p-6 rounded-2xl text-white text-center space-y-1 shadow-lg">
                <span className="text-[11px] sm:text-[12px] text-white/80 font-bold block">최종 체감 구독비</span>
                <span className="text-[22px] sm:text-[24px] font-black text-white block whitespace-nowrap">1,800,000원</span>
                <span className="text-[11px] sm:text-[12px] font-extrabold text-[#FFE8EA] bg-black/20 px-2 py-0.5 rounded inline-block">
                  월 25,000원 수준 (50% 절감!)
                </span>
              </div>
            </div>
          </div>

          {/* Plus: Conversion Life Services & VIP Membership */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Life Services */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E5E8EB] shadow-xs space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FEECEF] flex items-center justify-center text-[#EA1D2C]">
                  <HeartHandshake className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h4 className="text-[16px] sm:text-[17px] font-black text-[#191F28]">
                  가전 혜택에 라이프서비스까지 100% 보장
                </h4>
              </div>
              <p className="text-[12px] sm:text-[13px] text-[#6B7684] leading-relaxed break-keep">
                필요할 때 언제든 원하는 라이프케어 서비스로 1구좌당 1회 자유롭게 전환 이용하실 수 있습니다.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 pt-1 text-[11px] sm:text-[12px] font-bold text-[#333D4B]">
                <div className="bg-[#F8F9FA] p-2 sm:p-2.5 rounded-xl border border-[#E5E8EB] text-center whitespace-nowrap">
                  🕊️ 고품격 장례 의전
                </div>
                <div className="bg-[#F8F9FA] p-2 sm:p-2.5 rounded-xl border border-[#E5E8EB] text-center whitespace-nowrap">
                  🚢 크루즈 여행 (2인)
                </div>
                <div className="bg-[#F8F9FA] p-2 sm:p-2.5 rounded-xl border border-[#E5E8EB] text-center whitespace-nowrap">
                  👰 웨딩 서비스
                </div>
                <div className="bg-[#F8F9FA] p-2 sm:p-2.5 rounded-xl border border-[#E5E8EB] text-center whitespace-nowrap">
                  ✈️ 맞춤 해외여행
                </div>
                <div className="bg-[#F8F9FA] p-2 sm:p-2.5 rounded-xl border border-[#E5E8EB] text-center whitespace-nowrap">
                  🎂 칠순·팔순 행사
                </div>
                <div className="bg-[#F8F9FA] p-2 sm:p-2.5 rounded-xl border border-[#E5E8EB] text-center text-[#EA1D2C] whitespace-nowrap">
                  💰 미사용 100% 환급
                </div>
              </div>
            </div>

            {/* VIP Membership */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E5E8EB] shadow-xs space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E8F3FF] flex items-center justify-center text-[#3182F6]">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h4 className="text-[16px] sm:text-[17px] font-black text-[#191F28]">
                  효원상조 회원 전용 VIP 멤버십 혜택
                </h4>
              </div>
              <p className="text-[12px] sm:text-[13px] text-[#6B7684] leading-relaxed break-keep">
                가입 즉시 회원 자격이 유지되는 동안 프리미엄 제휴 복지 혜택을 무료로 누리실 수 있습니다.
              </p>
              <ul className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-[12px] text-[#4E5968] pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00B074] shrink-0" />
                  <span><strong>회원 전용 종합 복지몰 무료 이용</strong> (생필품·가전 최저가 할인)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00B074] shrink-0" />
                  <span><strong>전국 유명 리조트 및 호텔 레저 시설 제휴 할인</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00B074] shrink-0" />
                  <span><strong>우수 종합병원 건강검진 우대 할인 혜택</strong></span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Consultation Request Form Section */}
      <section id="consult-section" className="bg-[#F2F4F6] py-12 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl border border-[#E5E8EB] p-5 sm:p-14 shadow-xl">
            <div className="text-center max-w-xl mx-auto mb-7 sm:mb-10 space-y-2">
              <span className="text-[11px] sm:text-[12px] font-black text-[#EA1D2C] bg-[#FEECEF] px-3 py-1 rounded-full">
                FAST COUNSELING
              </span>
              <h2 className="text-[22px] sm:text-[34px] font-black text-[#191F28] tracking-tight leading-tight">
                LG 가전구독 1:1<br className="sm:hidden" /> 결합 특가 상담 예약
              </h2>
              <p className="text-[13px] sm:text-[14px] text-[#6B7684] break-keep leading-relaxed">
                전담 전문 상담원이 최대 결합 할인 혜택을 1:1로 맞춤 안내해 드립니다.
              </p>
            </div>

            <form onSubmit={handleSubmitInquiry} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
                {/* Name */}
                <div>
                  <label className="block text-[13px] font-bold text-[#333D4B] mb-1.5">
                    고객 성함 <span className="text-[#EA1D2C]">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-2xl text-[14px] font-medium focus:outline-none focus:border-[#EA1D2C] focus:bg-white transition-all"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[13px] font-bold text-[#333D4B] mb-1.5">
                    연락처 <span className="text-[#EA1D2C]">*</span>
                  </label>
                  <input 
                    type="tel"
                    inputMode="numeric"
                    maxLength={13}
                    required
                    value={formPhone}
                    onChange={handlePhoneChange}
                    placeholder="010-0000-0000"
                    className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-2xl text-[14px] font-medium focus:outline-none focus:border-[#EA1D2C] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Interested Product */}
              <div>
                <label className="block text-[13px] font-bold text-[#333D4B] mb-1.5">
                  희망 구독 가전 / 문의 상품
                </label>
                <input 
                  type="text"
                  value={formProduct}
                  onChange={(e) => setFormProduct(e.target.value)}
                  placeholder="예: [에어컨] LG 휘센 AI 오브제컬렉션 듀얼쿨"
                  className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-2xl text-[13px] sm:text-[14px] font-medium focus:outline-none focus:border-[#EA1D2C] focus:bg-white transition-all truncate"
                />
              </div>

              {/* Sangjo Account Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[13px] font-bold text-[#333D4B]">
                    신청 상조 구좌 <span className="text-[#EA1D2C]">*</span>
                  </label>
                  <span className="text-[11px] font-bold text-[#EA1D2C]">
                    {formAccountCount === 1 && '만기축하금 144만원 지원'}
                    {formAccountCount === 2 && '만기축하금 288만원 지원'}
                    {formAccountCount === 3 && '만기축하금 432만원 지원'}
                    {formAccountCount === 4 && '만기축하금 576만원 지원'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormAccountCount(num)}
                      className={`py-2 px-1 sm:px-2 rounded-xl text-center border transition-all cursor-pointer ${
                        formAccountCount === num
                          ? 'bg-[#FEECEF] border-[#EA1D2C] text-[#EA1D2C] font-black shadow-xs'
                          : 'bg-[#F9FAFB] border-[#E5E8EB] text-[#4E5968] hover:border-[#CCD0D5] font-bold'
                      }`}
                    >
                      <div className="text-[12px] sm:text-[13px] whitespace-nowrap">{num}구좌</div>
                      <div className="text-[9px] sm:text-[10px] opacity-75 whitespace-nowrap">
                        {num === 1 ? 'SINGLE' : num === 2 ? 'DOUBLE' : num === 3 ? 'TRIPLE' : 'QUAD'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-[13px] font-bold text-[#333D4B] mb-1.5">
                  문의 및 상담 희망 사항 (선택)
                </label>
                <textarea 
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  placeholder="이사 일정, 희망 결합 구좌수, 방문 케어 주기 등 궁금하신 점을 남겨주시면 더욱 정확한 상담이 가능합니다."
                  className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-2xl text-[13px] sm:text-[14px] font-medium focus:outline-none focus:border-[#EA1D2C] focus:bg-white transition-all min-h-[85px] resize-none"
                />
              </div>

              {/* Privacy Agreement */}
              <div className="pt-1">
                <div className="flex items-center justify-between p-3 sm:p-4 bg-[#F8FAFC] rounded-2xl border border-[#E5E8EB] gap-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none min-w-0">
                    <input 
                      type="checkbox"
                      checked={isAgreed}
                      onChange={(e) => setIsAgreed(e.target.checked)}
                      className="w-4 h-4 accent-[#EA1D2C] rounded cursor-pointer shrink-0"
                    />
                    <span className="text-[12px] sm:text-[13px] font-bold text-[#333D4B] break-keep">
                      [필수] 개인정보 수집 및 이용·상담 동의
                    </span>
                  </label>
                  <button 
                    type="button"
                    onClick={() => setIsPrivacyOpen(true)}
                    className="text-[11px] sm:text-[12px] font-bold text-[#3182F6] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    전문보기
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 sm:py-5 bg-[#EA1D2C] hover:bg-[#C81020] text-white rounded-2xl font-black text-[15px] sm:text-[17px] shadow-xl shadow-[#EA1D2C]/25 transition-all flex items-center justify-center gap-1.5 sm:gap-2 active:scale-98 disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Gift className="w-5 h-5 shrink-0" />
                    <span>LG 가전구독 결합 특가 상담 신청하기</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq-section" className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <span className="text-[12px] font-black text-[#EA1D2C] bg-[#FEECEF] px-3 py-1 rounded-full">
            FAQ
          </span>
          <h2 className="text-[26px] sm:text-[32px] font-black text-[#191F28]">
            자주 묻는 질문
          </h2>
          <p className="text-[14px] text-[#6B7684]">
            LG전자 가전 구독 및 효원라이프 결합 혜택에 대해 궁금하신 점을 확인하세요.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div 
                key={idx}
                className="bg-white rounded-2xl border border-[#E5E8EB] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-[15px] sm:text-[16px] text-[#191F28] hover:bg-[#F9FAFB] transition-colors"
                >
                  <span className="flex items-start gap-3">
                    <span className="text-[#EA1D2C] font-black">Q.</span>
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown className={`w-5 h-5 text-[#8B95A1] transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-[#EA1D2C]' : ''}`} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-5 sm:px-6 pb-6 pt-2 text-[14px] text-[#4E5968] leading-relaxed border-t border-[#F2F4F6] bg-[#F9FAFB] break-keep">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Floating Bottom CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E8EB] p-3 sm:p-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden md:flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FEECEF] flex items-center justify-center text-[#EA1D2C]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[13px] font-extrabold text-[#191F28]">
                LG 가전 구독 X 효원 결합 지원 프로모션 진행 중!
              </div>
              <div className="text-[11px] text-[#8B95A1]">
                전문가 정기 방문 케어 + 계약기간 100% 무상 A/S + 월 최대 0원
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <button 
              type="button"
              onClick={() => handleSelectProductForConsult()}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#EA1D2C] hover:bg-[#C81020] text-white px-8 py-3.5 rounded-2xl font-black text-[15px] sm:text-[16px] shadow-lg shadow-[#EA1D2C]/25 transition-all active:scale-98 cursor-pointer"
            >
              <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>결합 특가 상담 신청</span>
            </button>
          </div>
        </div>
      </div>

      {/* Product Detail Interactive Modal ([구독] 탭 vs [효원특가] 탭) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto hide-scrollbar">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto hide-scrollbar shadow-2xl border border-[#E5E8EB] p-5 sm:p-8 space-y-6 relative animate-in fade-in zoom-in duration-200">
            {/* Close Button */}
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-5 right-5 p-2.5 rounded-full bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB] transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Product Header Summary */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-[#F2F4F6]">
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#F8FAFC] rounded-2xl p-2 border border-[#E5E8EB] flex items-center justify-center shrink-0">
                <img 
                  src={currentProductImage} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-contain transition-all duration-300" 
                />
              </div>
              <div className="space-y-1.5 pr-8 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black bg-[#EA1D2C] text-white px-2 py-0.5 rounded">
                    {selectedProduct.categoryName}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-[#8B95A1] bg-[#F2F4F6] px-2 py-0.5 rounded">
                    {selectedProduct.model}
                  </span>
                  {(() => {
                    const capInfo = getProductCapacityInfo(
                      selectedProduct.model, 
                      selectedProduct.name, 
                      selectedProduct.category, 
                      selectedProduct.categoryName, 
                      selectedProduct.specs
                    );
                    return capInfo ? (
                      <span className="text-[11px] font-black text-[#1B64DA] bg-[#E8F3FF] px-2.5 py-0.5 rounded border border-[#BBDDFF] flex items-center gap-1">
                        ⚡ {capInfo.label}
                      </span>
                    ) : null;
                  })()}
                  {selectedProduct.rating && (
                    <span className="text-[11px] font-bold text-[#FF8A00] bg-[#FFF8E6] px-2 py-0.5 rounded flex items-center gap-0.5 border border-[#FFE2A8]/50">
                      ★ {selectedProduct.rating} <span className="text-[#8B95A1] font-normal">{selectedProduct.reviewCount || ''}</span>
                    </span>
                  )}
                </div>
                <h3 className="text-[17px] sm:text-[20px] font-black text-[#191F28] leading-snug flex items-center flex-wrap gap-2">
                  <span>{selectedProduct.name}</span>
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {(() => {
                    const isTv = selectedProduct.category === 'tv' || selectedProduct.categoryName?.includes('TV') || selectedProduct.name?.includes('TV') || selectedProduct.name?.includes('QNED') || selectedProduct.name?.includes('OLED');
                    if (isTv) {
                      const upperModel = (selectedProduct.model || '').toUpperCase().trim();
                      const isWall = upperModel.endsWith('W') || upperModel.endsWith('MW') || upperModel.endsWith('KW') || upperModel.endsWith('BKW') || upperModel.endsWith('BMW') || upperModel.includes('WALL') || selectedProduct.name?.includes('벽걸이');
                      const tvType = isWall ? '벽걸이형' : '스탠드형';
                      return (
                        <div className="inline-flex items-center gap-2 bg-[#F8FAFC] px-3 py-1.5 rounded-xl border border-[#E5E8EB] text-[12px] sm:text-[13px]">
                          <span className="text-[#8B95A1] font-medium">설치 형태:</span>
                          <span className="font-extrabold text-[#191F28]">{tvType}</span>
                        </div>
                      );
                    }

                    return (selectedProduct.material || selectedModalColor || selectedProduct.color) ? (
                      <div className="inline-flex items-center gap-2 bg-[#F8FAFC] px-3 py-1.5 rounded-xl border border-[#E5E8EB] text-[12px] sm:text-[13px]">
                        <span className="text-[#8B95A1] font-medium">색상/소재:</span>
                        <span className="font-extrabold text-[#191F28]">
                          {selectedProduct.material ? `${selectedProduct.material} · ` : ''}{selectedModalColor || selectedProduct.color}
                        </span>
                      </div>
                    ) : null;
                  })()}
                  {(selectedProduct as any).refUrl && (
                    <span className="text-[11px] font-bold text-[#4E5968] bg-[#F2F4F6] px-2.5 py-1 rounded-lg">
                      LG 공식 케어솔루션 인증 제품
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Main Tabs Header: 3-Tab Structure */}
            <div className="grid grid-cols-3 gap-1 rounded-2xl bg-[#F2F4F6] p-1.5 border border-[#E5E8EB]">
              <button
                type="button"
                onClick={() => setModalTab('subscription')}
                className={`py-2.5 px-1.5 sm:px-2 text-center rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  modalTab === 'subscription'
                    ? 'bg-white text-[#191F28] shadow-sm font-black'
                    : 'text-[#8B95A1] hover:text-[#191F28] font-bold'
                }`}
              >
                <span className="text-[12px] sm:text-[13px] leading-tight">LG 공식 가전구독</span>
                <span className="text-[10px] text-[#8B95A1]">정가 요금</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('hyowon')}
                className={`py-2.5 px-1.5 sm:px-2 text-center rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  modalTab === 'hyowon'
                    ? 'bg-[#EA1D2C] text-white shadow-md shadow-[#EA1D2C]/20 font-black'
                    : 'text-[#EA1D2C] bg-[#FEECEF] hover:bg-[#FEECEF]/80 font-bold'
                }`}
              >
                <div className="flex items-center gap-0.5 text-[12px] sm:text-[13px] leading-tight">
                  <Sparkles className="w-3 h-3" />
                  <span>효원 결합 혜택</span>
                </div>
                <span className={`text-[10px] font-black ${
                  modalTab === 'hyowon' ? 'text-white/90' : 'text-[#EA1D2C]'
                }`}>
                  10%할인+만기환급
                </span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('card')}
                className={`py-2.5 px-1.5 sm:px-2 text-center rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  modalTab === 'card'
                    ? 'bg-[#191F28] text-white shadow-sm font-black'
                    : 'text-[#4E5968] hover:text-[#191F28] font-bold'
                }`}
              >
                <span className="text-[12px] sm:text-[13px] leading-tight">제휴카드 추가할인</span>
                <span className={`text-[10px] ${modalTab === 'card' ? 'text-white/80' : 'text-[#16A34A] font-extrabold'}`}>
                  최대 -4.2만원
                </span>
              </button>
            </div>

            {/* TAB 1: [LG 공식 가전구독] 탭 - LG 전자 공홈 디자인 100% 일치 */}
            {modalTab === 'subscription' && (
              <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
                {/* 0. 색상/옵션 선택 (복수 색상이 실제로 존재할 때만 노출) */}
                {selectedProduct.colors && selectedProduct.colors.length > 1 && (
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-black text-[#191F28]">
                      옵션 선택
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setTempSelectedColor(selectedModalColor);
                        setIsOptionSelectModalOpen(true);
                      }}
                      className="w-full bg-white hover:bg-[#F9FAFB] border border-[#E5E8EB] hover:border-[#191F28] rounded-xl p-3 flex items-center justify-between transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                          style={{
                            backgroundColor: selectedProduct.colors.find(c => c.name === selectedModalColor)?.code || '#D1D6DB'
                          }}
                        />
                        <span className="font-extrabold text-[13px] sm:text-[14px] text-[#191F28]">
                          {selectedProduct.material ? `${selectedProduct.material} / ` : ''}{selectedModalColor}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8B95A1] group-hover:text-[#191F28] transition-colors" />
                    </button>
                  </div>
                )}

                {/* 1. 계약기간 */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-black text-[#191F28] flex items-center gap-1.5">
                    <span>계약기간</span>
                    <Info className="w-3.5 h-3.5 text-[#8B95A1]" />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProduct.subscriptionOptions.contractTerms
                      .filter((term) => term.value === '60' || term.value === '72' || term.label.includes('5년') || term.label.includes('6년'))
                      .map((term) => (
                        <button
                          key={term.value}
                          type="button"
                          onClick={() => setSelectedTerm(term.value)}
                          className={`py-3 px-3 rounded-xl text-[13px] font-extrabold border transition-all text-center cursor-pointer ${
                            selectedTerm === term.value
                              ? 'bg-white text-[#191F28] border-2 border-[#191F28] font-black shadow-2xs'
                              : 'bg-white text-[#4E5968] border border-[#E5E8EB] hover:border-[#B0B8C1]'
                          }`}
                        >
                          {term.label}
                        </button>
                      ))}
                  </div>
                </div>

                {/* 2. 케어서비스 주기 */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-black text-[#191F28] flex items-center gap-1.5">
                    <span>케어서비스 주기</span>
                    <Info className="w-3.5 h-3.5 text-[#8B95A1]" />
                  </label>
                  <div className={`grid gap-2 ${
                    selectedProduct.subscriptionOptions.careServiceCycles.length === 1 
                      ? 'grid-cols-1' 
                      : selectedProduct.subscriptionOptions.careServiceCycles.length === 2 
                      ? 'grid-cols-2' 
                      : 'grid-cols-3'
                  }`}>
                    {selectedProduct.subscriptionOptions.careServiceCycles.map((cycle) => (
                      <button
                        key={cycle.value}
                        type="button"
                        onClick={() => handleSelectCycle(cycle.value)}
                        className={`py-3 px-3 rounded-xl text-[13px] font-extrabold border transition-all text-center cursor-pointer ${
                          activeSelectedCycle === cycle.value
                            ? 'bg-white text-[#191F28] border-2 border-[#191F28] font-black shadow-2xs'
                            : 'bg-white text-[#4E5968] border border-[#E5E8EB] hover:border-[#B0B8C1]'
                        }`}
                      >
                        {cycle.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. 케어서비스 유형 (LG 공홈 2단 분할 레이아웃) */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-black text-[#191F28] flex items-center gap-1.5">
                    <span>케어서비스 유형</span>
                    <Info className="w-3.5 h-3.5 text-[#8B95A1]" />
                  </label>
                  <div className="space-y-2">
                    {selectedProduct.subscriptionOptions.careServiceTypes.map((type) => {
                      const isSelected = selectedType === type.value;
                      return (
                        <div
                          key={type.value}
                          onClick={() => handleSelectType(type.value)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-white border-2 border-[#191F28] shadow-2xs'
                              : 'bg-white border border-[#E5E8EB] hover:border-[#B0B8C1]'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 min-w-0 flex-1">
                            <span className="text-[13px] font-black text-[#191F28] shrink-0">
                              {type.accentLabel || type.label}
                            </span>
                            <span className="text-[11px] sm:text-[12px] text-[#6B7684] truncate">
                              {type.label || type.description}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 이용 요금 표시 (금액이 0원이거나 없는 옵션은 금액 영역을 노출하지 않음) */}
                {currentMonthlyPrice > 0 ? (
                  <div className="pt-3 border-t border-[#E5E8EB] flex items-center justify-between">
                    <span className="text-[15px] font-black text-[#191F28]">이용 요금 &gt;</span>
                    <span className="text-[22px] sm:text-[24px] font-black text-[#191F28]">
                      월 {currentMonthlyPrice.toLocaleString()}원
                    </span>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-[#E5E8EB] p-3 rounded-xl bg-[#F8FAFC] border border-dashed border-[#D1D6DB] text-center">
                    <span className="text-[12px] font-bold text-[#6B7684]">
                      선택하신 케어서비스 유형은 {selectedTerm === '60' ? '6년 약정' : '5년 약정'}에서 제공됩니다.
                    </span>
                  </div>
                )}

                {/* LG 공홈 바로가기 링크 (팝업 차단 없이 100% 정상 작동하는 네이티브 <a> 태그) */}
                {(() => {
                  const rels = (selectedProduct as any)?.relatedUrls || [];
                  const initialUrl = rels.length === 1 && rels[0].url ? rels[0].url : (selectedProduct as any)?.refUrl;
                  const imgMatch = (selectedProduct?.image || (selectedProduct?.images && selectedProduct.images[0]) || '').match(/md(\d{6,10})/i);
                  const modelIdHint = imgMatch ? `MD${imgMatch[1]}` : (selectedProduct as any)?.modelId;
                  const officialTargetUrl = buildLgOfficialPdpUrl(initialUrl, selectedProduct?.model, selectedProduct?.categoryKey || selectedProduct?.category, modelIdHint);

                  if (rels.length > 1) {
                    return (
                      <button
                        type="button"
                        onClick={() => setChoiceModalProduct(selectedProduct)}
                        className="w-full py-2.5 px-4 rounded-xl border border-[#D1D6DB] hover:border-[#191F28] bg-[#F8F9FA] hover:bg-white text-[#4E5968] hover:text-[#191F28] text-[12px] font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>LG 공식 홈페이지에서 제품 및 정가 확인하기</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    );
                  }

                  return (
                    <a
                      href={officialTargetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl border border-[#D1D6DB] hover:border-[#191F28] bg-[#F8F9FA] hover:bg-white text-[#4E5968] hover:text-[#191F28] text-[12px] font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center"
                    >
                      <span>LG 공식 홈페이지에서 제품 및 정가 확인하기</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  );
                })()}

                {/* Move to Hyowon Special CTA (금액이 있을 때만 노출) */}
                {currentMonthlyPrice > 0 && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#FFF5F6] to-[#FFF0F2] border border-[#EA1D2C]/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <div className="space-y-0.5">
                      <div className="text-[12px] sm:text-[13px] font-black text-[#EA1D2C]">
                        💡 효원 결합 시 매월 10% 추가 할인 지원
                      </div>
                      <div className="text-[11px] text-[#6B7684]">
                        월 {discountedMonthlyPrice.toLocaleString()}원 + 만기 시 100% 환급 및 144만원 지원
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalTab('hyowon')}
                      className="px-3.5 py-2 rounded-xl text-[12px] font-black bg-[#EA1D2C] hover:bg-[#D41423] text-white shadow-xs whitespace-nowrap active:scale-95 transition-all text-center shrink-0 cursor-pointer"
                    >
                      결합 혜택 계산하기 →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: [효원특가] 탭 - 10%할인 (10원 단위 절삭) + 상조 결합 만기환급 */}
            {modalTab === 'hyowon' && (
              <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
                {/* Current Selected Option Recap */}
                <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E5E8EB] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#6B7684] bg-[#EEF2F6] px-2 py-0.5 rounded-md">
                      선택된 구독 옵션
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalTab('subscription')}
                      className="text-[11px] sm:text-[12px] font-bold text-[#3182F6] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>옵션 변경</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="font-extrabold text-[#191F28] text-[12px] sm:text-[13px] leading-snug">
                    {selectedProduct.material ? `${selectedProduct.material} / ` : ''}{selectedModalColor || selectedProduct.color || ''} · {selectedTerm ? parseInt(selectedTerm) / 12 + '년' : '6년'} ({contractMonths}개월) · {selectedProduct.subscriptionOptions.careServiceCycles.find(c => c.value === selectedCycle)?.label || `${selectedCycle}개월 주기`} · {selectedProduct.subscriptionOptions.careServiceTypes.find(t => t.value === selectedType)?.accentLabel || (selectedType === 'premium' ? '프리미엄' : '라이트')}
                  </div>
                </div>

                {/* Select Hyowon Sangjo Account (1~4 accounts) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[13px] font-black text-[#191F28] flex items-center gap-1.5 min-w-0">
                      <Gift className="w-4 h-4 text-[#EA1D2C] shrink-0" />
                      <span className="truncate">효원 결합 구좌 선택</span>
                    </label>
                    <span className="text-[11px] text-[#EA1D2C] font-bold whitespace-nowrap shrink-0">
                      구좌당 지원금 144만원
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { count: 1, label: '1구좌 (SINGLE)', bonus: '지원금 +144만' },
                      { count: 2, label: '2구좌 (DOUBLE)', bonus: '지원금 +288만 (추천)' },
                      { count: 3, label: '3구좌 (TRIPLE)', bonus: '지원금 +432만' },
                      { count: 4, label: '4구좌 (QUAD)', bonus: '지원금 +576만' }
                    ].map((item) => (
                      <button
                        key={item.count}
                        type="button"
                        onClick={() => setHyowonAccountCount(item.count)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          hyowonAccountCount === item.count
                            ? 'bg-[#FEECEF] border-2 border-[#EA1D2C] text-[#EA1D2C] font-black shadow-2xs'
                            : 'bg-white border border-[#E5E8EB] text-[#4E5968] hover:border-[#B0B8C1] font-bold'
                        }`}
                      >
                        <div className="text-[12px] sm:text-[13px]">{item.label}</div>
                        <div className="text-[10px] text-[#EA1D2C] font-black mt-0.5">{item.bonus}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Comparison Calculation Card (제휴카드 제외 - 순수 효원 10%할인 + 만기환급) */}
                <div className="bg-[#191F28] text-white rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#FF8591]" />
                      <span className="font-extrabold text-[14px]">효원 144 결합 최종 계산서</span>
                    </div>
                    <span className="text-[11px] bg-[#EA1D2C] text-white px-2 py-0.5 rounded-full font-bold">
                      {hyowonAccountCount}구좌 적용
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[12px] sm:text-[13px]">
                    {/* 1. LG 공식 구독료 */}
                    <div className="flex items-center justify-between gap-2 text-[#A6ADB8]">
                      <span>1. LG 공식 월 구독료</span>
                      <span className="font-semibold text-white whitespace-nowrap">{currentMonthlyPrice.toLocaleString()}원/월</span>
                    </div>

                    {/* 2. 효원 10% 추가할인 (10원 단위 절삭) */}
                    <div className="flex items-center justify-between gap-2 text-[#55E4B0] font-bold">
                      <span>2. 효원 결합 10% 다이렉트 지원</span>
                      <span className="whitespace-nowrap">-{hyowonMonthlyDiscount.toLocaleString()}원/월</span>
                    </div>
                  </div>

                  {/* 4. 최종 고객 실부담 월 납부금 */}
                  <div className="pt-2.5 border-t border-white/10 flex items-baseline justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-bold text-[#A6ADB8]">효원 결합 실부담 월 구독료</div>
                    </div>
                    <div className="text-right whitespace-nowrap shrink-0">
                      <span className="text-[22px] sm:text-[26px] font-black text-[#FF8591]">
                        월 {discountedMonthlyPrice.toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  {/* Sangjo Maturity Highlight Box */}
                  <div className="bg-white/10 rounded-xl p-3 space-y-1.5 border border-white/10 text-[11px] sm:text-[12px]">
                    <div className="flex items-center justify-between gap-2 text-white font-bold pb-1 border-b border-white/10">
                      <span className="text-[#FF8591]">상조 만기 혜택</span>
                      <span className="text-[#55E4B0] font-black whitespace-nowrap">
                        총 {totalMaturityPayout.toLocaleString()}원 지급
                      </span>
                    </div>
                    <div className="text-[#A6ADB8] space-y-1 pt-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span>• 상조 실납입금 (100% 전액 환급):</span>
                        <span className="text-white font-bold">{totalSangjoDeposit.toLocaleString()}원</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[#55E4B0]">
                        <span>• 만기 축하금 ({hyowonAccountCount}구좌 지원):</span>
                        <span className="font-black">+{maturityBonus.toLocaleString()}원</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: [제휴카드 추가할인] 탭 - 제휴카드 전용 할인 계산기 */}
            {modalTab === 'card' && (
              <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
                {/* 1. LG 제휴카드사 선택 */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-black text-[#191F28] flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[#3182F6]" />
                    <span>LG구독 제휴카드 선택</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'woori', name: 'LG전자 우리 Platinum', maxDisc: 42000 },
                      { id: 'shinhan', name: 'LG전자 신한카드', maxDisc: 25000 },
                      { id: 'kb', name: 'LG전자 KB국민카드', maxDisc: 25000 },
                      { id: 'lotte', name: 'LG전자 롯데카드', maxDisc: 26000 },
                      { id: 'hana', name: 'LG전자 하나카드', maxDisc: 25000 },
                      { id: 'hyundai', name: 'LG전자 현대카드', maxDisc: 25000 },
                    ].map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => {
                          setSelectedCardCompany(card.id);
                          setSelectedCardSpend(card.id === 'woori' ? 1200000 : 700000);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedCardCompany === card.id
                            ? 'bg-white border-2 border-[#3182F6] shadow-2xs ring-1 ring-[#3182F6]'
                            : 'bg-white border border-[#E5E8EB] hover:border-[#B0B8C1]'
                        }`}
                      >
                        <div className="text-[12px] font-extrabold text-[#191F28] truncate">{card.name}</div>
                        <div className="text-[10px] text-[#3182F6] font-bold mt-0.5">월 최대 -{(card.maxDisc / 10000).toFixed(1)}만원</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. 전월 이용 실적 선택 */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-black text-[#191F28]">
                    전월 카드 이용 실적
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { spend: 300000, label: '30만원 이상', disc: 15000 },
                      { spend: 700000, label: '70만원 이상', disc: 20000 },
                      { spend: 1200000, label: '120만원 이상', disc: selectedCardCompany === 'woori' ? 42000 : 25000 },
                    ].map((tier) => (
                      <button
                        key={tier.spend}
                        type="button"
                        onClick={() => setSelectedCardSpend(tier.spend)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedCardSpend === tier.spend
                            ? 'bg-[#191F28] text-white border-[#191F28] font-bold shadow-xs'
                            : 'bg-white text-[#4E5968] border border-[#E5E8EB] hover:border-[#B0B8C1]'
                        }`}
                      >
                        <div className="text-[12px] font-bold">{tier.label}</div>
                        <div className={`text-[11px] font-black mt-0.5 ${selectedCardSpend === tier.spend ? 'text-[#55E4B0]' : 'text-[#3182F6]'}`}>
                          -{(tier.disc).toLocaleString()}원/월
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. 제휴카드 적용 최종 체감가 (효원 10% 할인가 기준) */}
                {(() => {
                  const cardDisc = selectedCardSpend >= 1200000
                    ? (selectedCardCompany === 'woori' ? 42000 : 25000)
                    : (selectedCardSpend >= 700000 ? 20000 : 15000);
                  const finalWithCard = Math.max(0, discountedMonthlyPrice - cardDisc);

                  return (
                    <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-[#E5E8EB] space-y-3">
                      <div className="flex items-center justify-between text-[12px] text-[#6B7684]">
                        <span>LG 공식 월 구독료</span>
                        <span className="text-[#8B95A1] line-through">{currentMonthlyPrice.toLocaleString()}원</span>
                      </div>
                      <div className="flex items-center justify-between text-[12px] text-[#EA1D2C] font-bold">
                        <span>효원 결합 10% 할인가</span>
                        <span>{discountedMonthlyPrice.toLocaleString()}원/월</span>
                      </div>
                      <div className="flex items-center justify-between text-[12px] text-[#16A34A] font-bold">
                        <span>제휴카드 청구할인</span>
                        <span>-{cardDisc.toLocaleString()}원/월</span>
                      </div>
                      <div className="pt-2 border-t border-[#E5E8EB] flex items-baseline justify-between">
                        <span className="text-[14px] font-black text-[#191F28]">제휴카드 적용 최종 체감가</span>
                        <span className="text-[22px] sm:text-[26px] font-black text-[#EA1D2C]">
                          월 {finalWithCard.toLocaleString()}원
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8B95A1] leading-tight">
                        ※ 효원 결합 10% 할인 금액에 제휴카드 전월 실적 충족 시 추가 청구할인이 중복 적용됩니다.
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Modal Bottom CTA Actions */}
            <div className="flex items-center gap-2 sm:gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="w-24 sm:w-28 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-[13px] sm:text-[14px] bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB] transition-colors shrink-0 cursor-pointer"
              >
                닫기
              </button>

              <button 
                type="button"
                onClick={() => {
                  const p = selectedProduct;
                  const cycleLabel = p.subscriptionOptions.careServiceCycles.find(c => c.value === selectedCycle)?.label || `${selectedCycle}개월 주기`;
                  const typeObj = p.subscriptionOptions.careServiceTypes.find(t => t.value === selectedType);
                  const typeLabel = typeObj?.accentLabel || (selectedType === 'premium' ? '프리미엄' : selectedType === 'light' ? '라이트' : '라이트플러스');
                  const optionStr = `${selectedProduct.material ? selectedProduct.material + ' / ' : ''}${selectedModalColor || selectedProduct.color || ''}, ${selectedTerm ? parseInt(selectedTerm)/12 + '년' : '6년'}/${cycleLabel}/${typeLabel}`;
                  const account = hyowonAccountCount;
                  setSelectedProduct(null);
                  handleSelectProductForConsult(p, optionStr, account);
                }}
                className="flex-1 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[13px] sm:text-[15px] bg-[#EA1D2C] hover:bg-[#C81020] text-white transition-colors shadow-lg shadow-[#EA1D2C]/20 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Gift className="w-4 h-4 shrink-0" />
                <span>이 조건으로 특가 예약</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Option Selection Sub-modal (LG.com Official Option Selector UI - Image 3) */}
      {isOptionSelectModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto hide-scrollbar">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto hide-scrollbar shadow-2xl border border-[#E5E8EB] p-5 sm:p-6 space-y-5 relative animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F2F4F6]">
              <h3 className="text-[17px] font-black text-[#191F28]">옵션선택</h3>
              <button
                type="button"
                onClick={() => setIsOptionSelectModalOpen(false)}
                className="p-2 rounded-full bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected Option Preview Header */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E5E8EB]">
              <div className="w-16 h-16 bg-white rounded-xl p-1.5 border border-[#E5E8EB] flex items-center justify-center shrink-0">
                <img 
                  src={tempProductImage} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-contain transition-all duration-300"
                />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="text-[12px] text-[#4E5968] truncate font-medium">{selectedProduct.name}</div>
                <div className="text-[14px] font-black text-[#191F28] truncate">
                  {(selectedProduct.colors?.find((c: any) => c.name === tempSelectedColor)?.material || selectedProduct.material) ? `${selectedProduct.colors?.find((c: any) => c.name === tempSelectedColor)?.material || selectedProduct.material} / ` : ''}{tempSelectedColor}
                </div>
                <div className="text-[12px] text-[#EA1D2C] font-bold">
                  월 {currentMonthlyPrice.toLocaleString()}원 <span className="text-[#8B95A1] font-normal">({selectedProduct.subscriptionOptions.careServiceCycles.find(c => c.value === selectedCycle)?.label || `${selectedCycle}개월`})</span>
                </div>
              </div>
            </div>

            {/* 소재 (Material) - show all unique materials from colors */}
            {(() => {
              const materials = selectedProduct.colors
                ? [...new Set(selectedProduct.colors.filter((c: any) => c.material).map((c: any) => c.material))]
                : selectedProduct.material ? [selectedProduct.material] : [];
              const currentMat = selectedProduct.colors?.find((c: any) => c.name === tempSelectedColor)?.material || selectedProduct.material;
              return materials.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-[13px] font-black text-[#191F28]">소재</label>
                  <div className="flex flex-wrap items-center gap-2">
                    {materials.map((mat: string, mi: number) => {
                      const isActive = mat === currentMat;
                      return (
                        <div key={mi} className={`px-3.5 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-colors ${
                          isActive 
                            ? 'bg-[#F9FAFB] border border-[#191F28] text-[#191F28] font-black' 
                            : 'bg-[#F9FAFB] border border-[#E5E8EB] text-[#8B95A1]'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#191F28]' : 'bg-[#D1D5DB]'}`} />
                          <span>{mat}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null;
            })()}

            {/* 색상 (Color) */}
            {selectedProduct.colors && selectedProduct.colors.length > 0 && (
              <div className="space-y-2.5">
                <label className="text-[13px] font-black text-[#191F28]">색상</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedProduct.colors.map((c, idx) => {
                    const isSelected = tempSelectedColor === c.name;
                    return (
                      <div
                        key={idx}
                        onClick={() => setTempSelectedColor(c.name)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-[#FEECEF] border-[#EA1D2C] shadow-2xs ring-1 ring-[#EA1D2C]'
                            : 'bg-[#F9FAFB] border-[#E5E8EB] hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-7 h-7 rounded-full border border-black/10 shrink-0 shadow-2xs relative flex items-center justify-center"
                            style={{ background: c.code || '#E8E1D5' }}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] stroke-[3]" />}
                          </div>
                          <div className="min-w-0">
                            <span className={`text-[12px] sm:text-[13px] font-bold block truncate ${
                              isSelected ? 'text-[#EA1D2C]' : 'text-[#191F28]'
                            }`}>
                              {c.name}
                            </span>
                            {c.badge && (
                              <span className="inline-block text-[10px] font-black text-[#EA1D2C] bg-[#FFF0F2] px-1.5 py-0.2 rounded-sm mt-0.5">
                                {c.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-[#F2F4F6]">
              <button
                type="button"
                onClick={() => {
                  const defColor = selectedProduct.colors?.find(c => (c as any).isDefault)?.name || selectedProduct.colors?.[0]?.name || '베이지/베이지';
                  setTempSelectedColor(defColor);
                }}
                className="w-12 h-12 rounded-2xl border border-[#E5E8EB] flex items-center justify-center text-[#6B7684] hover:bg-[#F2F4F6] transition-colors shrink-0 cursor-pointer"
                title="초기화"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedModalColor(tempSelectedColor);
                  setIsOptionSelectModalOpen(false);
                }}
                className="flex-1 py-3.5 rounded-2xl font-black text-[14px] bg-[#191F28] hover:bg-[#000000] text-white transition-colors cursor-pointer text-center"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LG Subscription Affiliate Card Details Modal */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto hide-scrollbar">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto hide-scrollbar shadow-2xl border border-[#E5E8EB] p-5 sm:p-8 space-y-6 relative animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#F2F4F6] pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#EA1D2C] bg-[#FEECEF] px-2.5 py-0.5 rounded-md">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>LG전자 공식 [구독 제휴카드] 특별 혜택</span>
                </div>
                <h3 className="text-[20px] sm:text-[22px] font-black text-[#191F28]">
                  LG전자 가전구독 제휴카드 청구할인 안내
                </h3>
                <p className="text-[13px] text-[#6B7684]">
                  구독료 자동이체 등록 시 전월 실적별로 매월 청구할인 혜택이 적용됩니다.
                </p>
              </div>
              <button 
                onClick={() => setIsCardModalOpen(false)}
                className="p-2 rounded-full bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB] transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Subscription Cards Breakdown */}
            <div className="space-y-4">
              {/* 1. [우리] LG전자 Platinum 우리카드 (최대 42,000원 할인) */}
              <div className="bg-[#FFF5F6] rounded-2xl p-4 sm:p-5 border-2 border-[#EA1D2C]/40 space-y-2.5 relative shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-black text-[#191F28]">
                      [우리] LG전자 Platinum 우리카드
                    </span>
                    <span className="text-[10px] font-black bg-[#EA1D2C] text-white px-2 py-0.5 rounded-full">
                      최대 4.2만 할인
                    </span>
                  </div>
                  <span className="text-[12px] font-black text-[#EA1D2C] bg-white px-2.5 py-1 rounded-lg border border-[#EA1D2C]/30 self-start sm:self-auto shadow-2xs">
                    최대 42,000원 할인/월 (72개월간)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[12px]">
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 100만원 이상</span>
                    <span className="font-black text-[#191F28] mt-0.5 block">월 35,000원</span>
                    <span className="text-[10px] text-[#EA1D2C] font-bold">(기본2.9만+프로모션6천)</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 150만원 이상</span>
                    <span className="font-black text-[#191F28] mt-0.5 block">월 39,000원</span>
                    <span className="text-[10px] text-[#EA1D2C] font-bold">(기본3.4만+프로모션5천)</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#EA1D2C]/30 bg-[#FFF8F8]">
                    <span className="text-[#EA1D2C] font-bold block text-[11px]">전월 200만원 이상</span>
                    <span className="font-black text-[#EA1D2C] text-[14px] mt-0.5 block">월 42,000원</span>
                    <span className="text-[10px] text-[#EA1D2C] font-bold">(기본4만+프로모션2천)</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#6B7684]">
                  * 대상: LG전자 구독요금 자동납부 최초 결제 회원 (최대 72개월간 프로모션 청구할인 제공)
                </p>
              </div>

              {/* 2. [우리] LG전자 우리카드 */}
              <div className="bg-[#F8FAFC] rounded-2xl p-4 sm:p-5 border border-[#E5E8EB] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-black text-[#191F28]">
                    [우리] LG전자 우리카드
                  </span>
                  <span className="text-[11px] font-extrabold bg-[#3182F6] text-white px-2 py-0.5 rounded">
                    최대 24,000원 할인
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[12px]">
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 30만원 이상</span>
                    <span className="font-black text-[#3182F6] mt-0.5 block">월 18,000원</span>
                    <span className="text-[10px] text-[#EA1D2C] font-bold">(프로모션 +8천)</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 70만원 이상</span>
                    <span className="font-black text-[#3182F6] mt-0.5 block">월 22,000원</span>
                    <span className="text-[10px] text-[#EA1D2C] font-bold">(프로모션 +7천)</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 120만원 이상</span>
                    <span className="font-black text-[#3182F6] mt-0.5 block">월 24,000원</span>
                    <span className="text-[10px] text-[#EA1D2C] font-bold">(프로모션 +4천)</span>
                  </div>
                </div>
              </div>

              {/* 3. [롯데] LG구독엔로카 (NEW) */}
              <div className="bg-[#F8FAFC] rounded-2xl p-4 sm:p-5 border border-[#E5E8EB] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-black text-[#191F28]">
                    [롯데] LG구독엔로카
                  </span>
                  <span className="text-[11px] font-extrabold bg-[#EA1D2C] text-white px-2 py-0.5 rounded">
                    최대 26,000원 할인
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[12px]">
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 40만원 이상</span>
                    <span className="font-black text-[#191F28] mt-0.5 block">월 20,000원</span>
                    <span className="text-[10px] text-[#EA1D2C] font-bold">(기본1.3만+프로모션7천)</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 80만원 이상</span>
                    <span className="font-black text-[#191F28] mt-0.5 block">월 23,000원</span>
                    <span className="text-[10px] text-[#EA1D2C] font-bold">(기본1.8만+프로모션5천)</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 160만원 이상</span>
                    <span className="font-black text-[#EA1D2C] mt-0.5 block">월 26,000원</span>
                  </div>
                </div>
              </div>

              {/* 4. [롯데] LG전자 스페셜카드 */}
              <div className="bg-[#F8FAFC] rounded-2xl p-4 sm:p-5 border border-[#E5E8EB] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-black text-[#191F28]">
                    [롯데] LG전자 스페셜카드
                  </span>
                  <span className="text-[11px] font-extrabold bg-[#EA1D2C] text-white px-2 py-0.5 rounded">
                    최대 23,000원 할인
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[12px]">
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 30만원 이상</span>
                    <span className="font-black text-[#191F28] mt-0.5 block">월 15,000원</span>
                    <span className="text-[10px] text-[#EA1D2C] font-bold">(프로모션 +2천)</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 70만원 이상</span>
                    <span className="font-black text-[#191F28] mt-0.5 block">월 17,000원</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 120만원 이상</span>
                    <span className="font-black text-[#EA1D2C] mt-0.5 block">월 23,000원</span>
                  </div>
                </div>
              </div>

              {/* 5. [신한] LG전자 The 구독케어 신한카드 */}
              <div className="bg-[#F8FAFC] rounded-2xl p-4 sm:p-5 border border-[#E5E8EB] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-black text-[#191F28]">
                    [신한] LG전자 The 구독케어 신한카드
                  </span>
                  <span className="text-[11px] font-extrabold bg-[#3182F6] text-white px-2 py-0.5 rounded">
                    최대 30,000원 혜택
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[12px]">
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 30만원 이상</span>
                    <span className="font-black text-[#3182F6] mt-0.5 block">월 17,000원 상당</span>
                    <span className="text-[10px] text-[#EA1D2C]">(할인1.3만+포인트4천P)</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 70만원 이상</span>
                    <span className="font-black text-[#3182F6] mt-0.5 block">월 17,000원~2.7만</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 130만원 이상</span>
                    <span className="font-black text-[#3182F6] mt-0.5 block">월 20,000원~3.0만</span>
                  </div>
                </div>
              </div>

              {/* 6. [KB국민] LG전자 KB국민카드 */}
              <div className="bg-[#F8FAFC] rounded-2xl p-4 sm:p-5 border border-[#E5E8EB] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-black text-[#191F28]">
                    [KB국민] LG전자 KB국민카드
                  </span>
                  <span className="text-[11px] font-extrabold bg-[#F59E0B] text-white px-2 py-0.5 rounded">
                    최대 25,000원 할인 (36개월)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-[12px]">
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 30만원 이상</span>
                    <span className="font-black text-[#191F28] mt-0.5 block">월 20,000원</span>
                    <span className="text-[10px] text-[#EA1D2C] font-bold">(기본1만+프로모션1만)</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 80만원 이상</span>
                    <span className="font-black text-[#EA1D2C] mt-0.5 block">월 25,000원</span>
                    <span className="text-[10px] text-[#EA1D2C] font-bold">(기본1.5만+프로모션1만)</span>
                  </div>
                </div>
              </div>

              {/* 7. [현대] LG전자 현대카드 (공식 구독탭 등록 카드) */}
              <div className="bg-[#F8FAFC] rounded-2xl p-4 sm:p-5 border border-[#E5E8EB] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-black text-[#191F28]">
                    [현대] LG전자 현대카드
                  </span>
                  <span className="text-[11px] font-extrabold bg-[#191F28] text-white px-2 py-0.5 rounded">
                    최대 16,000원 할인 (60개월)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[12px]">
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 40만원 이상</span>
                    <span className="font-black text-[#191F28] mt-0.5 block">월 8,000원</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 80만원 이상</span>
                    <span className="font-black text-[#191F28] mt-0.5 block">월 12,000원</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 120만원 이상</span>
                    <span className="font-black text-[#191F28] mt-0.5 block">월 16,000원</span>
                  </div>
                </div>
              </div>

              {/* 8. [하나] LG전자 플러스 하나카드 */}
              <div className="bg-[#F8FAFC] rounded-2xl p-4 sm:p-5 border border-[#E5E8EB] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-black text-[#191F28]">
                    [하나] LG전자 플러스 하나카드
                  </span>
                  <span className="text-[11px] font-extrabold bg-[#00B074] text-white px-2 py-0.5 rounded">
                    구독료 전월실적 인정
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[12px]">
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 30만원 이상</span>
                    <span className="font-black text-[#191F28] mt-0.5 block">월 13,000원</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 70만원 이상</span>
                    <span className="font-black text-[#191F28] mt-0.5 block">월 17,000원</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5E8EB]">
                    <span className="text-[#8B95A1] block text-[11px]">전월 100만원 이상</span>
                    <span className="font-black text-[#191F28] mt-0.5 block">월 20,000원</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Link Button */}
            <div className="p-4 bg-[#F2F4F6] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px]">
              <span className="text-[#4E5968] font-bold">
                카드별 상세 연회비 및 발급 신청은 LG전자 공식 사이트에서 확인하실 수 있습니다.
              </span>
              <a
                href="https://www.lge.co.kr/benefits/card-discount"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-4 py-2.5 bg-white hover:bg-[#191F28] hover:text-white text-[#191F28] font-black rounded-xl border border-[#E5E8EB] transition-all flex items-center gap-1.5"
              >
                <span>LG 공식 카드혜택 바로가기</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setIsCardModalOpen(false)}
              className="w-full py-4 bg-[#191F28] hover:bg-[#333D4B] text-white font-bold rounded-2xl transition-colors text-[14px]"
            >
              확인 완료
            </button>
          </div>
        </div>
      )}

      {/* Consultation Request Modal (간편 상담 신청 팝업) */}
      {isConsultModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto hide-scrollbar">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto hide-scrollbar shadow-2xl border border-[#E5E8EB] p-5 sm:p-8 space-y-5 relative animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#F2F4F6] pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#EA1D2C] bg-[#FEECEF] px-2.5 py-0.5 rounded-md">
                  <Gift className="w-3.5 h-3.5" />
                  <span>LG 가전구독 X 효원상조 결합 특가</span>
                </div>
                <h3 className="text-[20px] sm:text-[22px] font-black text-[#191F28]">
                  간편 상담 신청
                </h3>
                <p className="text-[13px] text-[#6B7684]">
                  전담 전문 상담원이 최대 결합 할인 혜택을 1:1로 맞춤 안내해 드립니다.
                </p>
              </div>
              <button 
                onClick={() => setIsConsultModalOpen(false)}
                className="p-2 rounded-full bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB] transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitInquiry} className="space-y-4">
              {/* 1. Appliance Selection / Selected Preview Box */}
              <div className="space-y-1.5 min-w-0 max-w-full">
                {formSelectedProduct ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[13px] font-extrabold text-[#191F28]">
                        선택 가전제품
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setFormSelectedProduct(null);
                          setFormProductOptions('');
                          setFormProduct('상담 시 제품선택 (전문 상담원 맞춤 추천)');
                        }}
                        className="text-[11px] font-bold text-[#3182F6] hover:underline cursor-pointer"
                      >
                        다른 가전 선택
                      </button>
                    </div>
                    <div className="bg-[#F8F9FA] border border-[#E5E8EB] rounded-2xl p-3 sm:p-3.5 space-y-1">
                      <div className="text-[13px] sm:text-[14px] font-black text-[#191F28] break-keep">
                        [{formSelectedProduct.categoryName}] {formSelectedProduct.name}
                      </div>
                      <div className="text-[11px] sm:text-[12px] font-semibold text-[#6B7684]">
                        모델명: {formSelectedProduct.model} {formProductOptions ? `| 옵션: ${formProductOptions}` : ''}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[13px] font-extrabold text-[#191F28] mb-1">
                      희망 구독 가전 / 문의 상품
                    </label>
                    <div className="relative w-full max-w-full overflow-hidden">
                      <select
                        value={formProduct}
                        onChange={(e) => setFormProduct(e.target.value)}
                        className="w-full max-w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-2xl text-[13px] sm:text-[14px] font-bold text-[#191F28] focus:outline-none focus:border-[#EA1D2C] focus:bg-white transition-all cursor-pointer truncate"
                      >
                        <option value="상담 시 제품선택 (전문 상담원 맞춤 추천)">
                          선택: 상담 시 맞춤 추천
                        </option>
                        <option value="[STEM 냉장고] 냉장고 / 김치냉장고">
                          [STEM 냉장고] 냉장고 / 김치냉장고
                        </option>
                        <option value="[워시타워] 세탁기 / 건조기 / 워시콤보">
                          [워시타워] 세탁기 / 건조기 / 워시콤보
                        </option>
                        <option value="[퓨리케어] 정수기 / 얼음정수기">
                          [퓨리케어] 정수기 / 얼음정수기
                        </option>
                        <option value="[에어로타워] 공기청정기 / 제습기">
                          [에어로타워] 공기청정기 / 제습기
                        </option>
                        <option value="[디오스] 식기세척기 / 인덕션">
                          [디오스] 식기세척기 / 인덕션
                        </option>
                        <option value="[스탠바이미] TV / 이동식 스크린">
                          [스탠바이미] TV / 이동식 스크린
                        </option>
                        <option value="[스타일러] 스타일러 / 슈케어">
                          [스타일러] 스타일러 / 슈케어
                        </option>
                        <option value="[휘센] 에어컨 / 시스템 에어컨">
                          [휘센] 에어컨 / 시스템 에어컨
                        </option>
                        <option value="[코드제로] 청소기 / 로봇청소기">
                          [코드제로] 청소기 / 로봇청소기
                        </option>
                        <option value="[다품목 패키지] 2대 이상 동시 결합">
                          [다품목 패키지] 2대 이상 동시 결합
                        </option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Sangjo Account Selection (1~4 구좌) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[13px] font-extrabold text-[#191F28]">
                    신청 상조 구좌 <span className="text-[#EA1D2C]">*</span>
                  </label>
                  <span className="text-[11px] font-bold text-[#EA1D2C]">
                    {formAccountCount === 1 && '만기축하금 144만원 지원'}
                    {formAccountCount === 2 && '만기축하금 288만원 지원'}
                    {formAccountCount === 3 && '만기축하금 432만원 지원'}
                    {formAccountCount === 4 && '만기축하금 576만원 지원'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormAccountCount(num)}
                      className={`py-2 px-1 sm:px-2 rounded-xl text-center border transition-all cursor-pointer ${
                        formAccountCount === num
                          ? 'bg-[#FEECEF] border-[#EA1D2C] text-[#EA1D2C] font-black shadow-xs'
                          : 'bg-[#F9FAFB] border-[#E5E8EB] text-[#4E5968] hover:border-[#CCD0D5] font-bold'
                      }`}
                    >
                      <div className="text-[12px] sm:text-[13px] whitespace-nowrap">{num}구좌</div>
                      <div className="text-[9px] sm:text-[10px] opacity-75 whitespace-nowrap">
                        {num === 1 ? 'SINGLE' : num === 2 ? 'DOUBLE' : num === 3 ? 'TRIPLE' : 'QUAD'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-extrabold text-[#191F28]">
                  신청 고객 성함 <span className="text-[#EA1D2C]">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="성함을 입력해 주세요"
                  className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-4 py-3.5 rounded-2xl text-[14px] font-medium focus:outline-none focus:border-[#EA1D2C] focus:bg-white transition-all"
                />
              </div>

              {/* Phone (Mobile Number Pad & Auto Hyphens) */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-extrabold text-[#191F28]">
                  휴대폰 번호 <span className="text-[#EA1D2C]">*</span>
                </label>
                <input 
                  type="tel"
                  inputMode="numeric"
                  maxLength={13}
                  required
                  value={formPhone}
                  onChange={handlePhoneChange}
                  placeholder="010-0000-0000"
                  className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-4 py-3.5 rounded-2xl text-[14px] font-medium focus:outline-none focus:border-[#EA1D2C] focus:bg-white transition-all"
                />
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-bold text-[#4E5968]">
                  문의 및 상담 희망 사항 (선택)
                </label>
                <textarea 
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  placeholder="이사 일정, 희망 결합 구좌수, 방문 케어 주기 등 궁금하신 점을 남겨주세요."
                  className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-4 py-3 rounded-2xl text-[13px] font-medium focus:outline-none focus:border-[#EA1D2C] focus:bg-white transition-all min-h-[75px] resize-none"
                />
              </div>

              {/* Privacy Agreement with Details View Link */}
              <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E5E8EB] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={isAgreed}
                      onChange={(e) => setIsAgreed(e.target.checked)}
                      className="w-4 h-4 accent-[#EA1D2C] rounded cursor-pointer"
                    />
                    <span className="text-[12px] sm:text-[13px] font-bold text-[#333D4B]">
                      [필수] 개인정보 수집·이용 동의
                    </span>
                  </label>
                  <button 
                    type="button"
                    onClick={() => setIsPrivacyOpen(true)}
                    className="text-[11px] sm:text-[12px] font-extrabold text-[#3182F6] hover:underline"
                  >
                    자세히 보기 &gt;
                  </button>
                </div>
                <p className="text-[10px] text-[#8B95A1] pl-6 leading-tight">
                  수집 항목: 성함, 연락처 / 이용 목적: LG 가전구독 및 결합 혜택 상담 안내 / 보유 기간: 상담 완료 후 3개월
                </p>
              </div>

              {/* Submit CTA */}
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4.5 bg-[#EA1D2C] hover:bg-[#C81020] text-white rounded-2xl font-black text-[15px] sm:text-[16px] shadow-lg shadow-[#EA1D2C]/25 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Gift className="w-4 h-4" />
                    <span>LG 가전구독 특가 상담 신청하기</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center space-y-5 shadow-2xl border border-[#E5E8EB] animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-[#E8F8F0] text-[#00B074] flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-[22px] font-black text-[#191F28]">
                상담 예약이 접수되었습니다!
              </h3>
              <p className="text-[14px] text-[#6B7684] leading-relaxed break-keep">
                LG 가전구독 전담 전문 상담원이 빠른 시일 내로 남겨주신 연락처로 친절하게 안내해 드리겠습니다.
              </p>
            </div>

            <button 
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full py-4 bg-[#191F28] hover:bg-[#333D4B] text-white font-bold rounded-2xl transition-colors shadow-md"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      <PrivacyModal 
        isOpen={isPrivacyOpen} 
        onClose={() => setIsPrivacyOpen(false)} 
      />

      {/* Footer Area (하단 푸터 영역) */}
      <footer className="bg-[#111111] pt-12 pb-24 sm:pb-20 text-white border-t border-white/5 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top Row: Logo & Legal Links */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
            <div className="opacity-60">
              <img 
                src="https://res.cloudinary.com/dfkntvpmv/image/upload/v1781672825/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_ns9erj.png" 
                alt="효원상조 로고" 
                className="h-[22px] w-auto object-contain brightness-0 invert"
              />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <a href="#" className="text-[13px] font-bold text-[#D1D6DB] hover:text-white transition-colors">이용약관</a>
              <button 
                type="button"
                onClick={() => setIsPrivacyOpen(true)}
                className="text-[13px] font-bold text-white hover:text-white transition-colors underline underline-offset-4 decoration-white/30 cursor-pointer"
              >
                개인정보처리방침
              </button>
              <a href="#" className="text-[13px] font-bold text-[#D1D6DB] hover:text-white transition-colors">중요정보고시사항</a>
            </div>
          </div>

          {/* Main Info Grid (Aligned with max-w-7xl product list width) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            {/* Distributor Info */}
            <div className="lg:col-span-4 px-1">
              <h5 className="text-[13px] font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-1 h-3 bg-[#3182F6] rounded-full"></span>
                총판사
              </h5>
              <div className="text-[12px] text-[#8B95A1] leading-[1.8] font-medium break-keep">
                <span className="text-white font-bold">(주)라이프앤조이</span> | 대표 : 김지훈<br/>
                경기도 하남시 미사대로 510, 624호(아이에스비즈타워)<br/>
                사업자등록번호: 388-86-02921 | 통신판매신고번호: 2024-경기하남-1853호<br/>
                E-mail: lifenjoy0296@gmail.com | 개인정보보호책임자: 김지훈(lifenjoy0296@gmail.co.kr)<br/>
                <span className="text-[11px] text-white/20 mt-1 block uppercase">Copyright(c)2026 LIFE&JOY Co.,Ltd. All Right Reserved.</span>
              </div>
            </div>

            {/* Service Provider Info */}
            <div className="lg:col-span-4 px-1 border-t lg:border-t-0 lg:border-l border-white/5 pt-8 lg:pt-0 lg:pl-8">
              <h5 className="text-[13px] font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-1 h-3 bg-[#A3B1C6] rounded-full"></span>
                상조서비스 주관사
              </h5>
              <div className="text-[12px] text-[#8B95A1] leading-[1.8] font-medium break-keep">
                <span className="text-white font-bold">(주)효원상조</span> 대표이사 : 이선주<br/>
                서울시 강동구 풍성로 38길 9, 바로빌딩 3층<br/>
                사업자등록번호 : 126-81-81624 | 선불식할부거래업등록번호 : 서울-2010-제28<br/>
                <span className="text-[11px] text-white/20 mt-1 block uppercase">COPYRIGHT ⓒ (주)효원상조 Co. All Rights Reserved.</span>
              </div>
            </div>

            {/* Customer Center Info */}
            <div className="lg:col-span-4 px-1 border-t lg:border-t-0 lg:border-l border-white/5 pt-8 lg:pt-0 lg:pl-8">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/5 h-full flex flex-col justify-between">
                <h5 className="text-[13px] font-bold text-[#3182F6] mb-3">(주)효원상조 고객센터</h5>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                    <span className="text-[12px] text-[#8B95A1]">고객센터</span>
                    <a href="tel:1588-8873" className="text-[17px] font-black text-white hover:text-[#3182F6] transition-colors">1588-8873</a>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-[12px] text-[#8B95A1]">24시 긴급행사</span>
                      <span className="text-[10px] text-[#3182F6]">(장례접수)</span>
                    </div>
                    <a href="tel:1577-8873" className="text-[17px] font-black text-white hover:text-[#3182F6] transition-colors">1577-8873</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 pt-6 border-t border-white/5">
            <p className="text-[11px] text-white/20 font-medium tracking-tight">© HYOWON. All rights reserved.</p>
            <div className="flex gap-4">
              <a 
                href="/lecture/special"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-white/30 hover:text-[#3182F6] transition-colors font-bold"
              >
                영업자 교육안
              </a>
              <a 
                href="/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-white/30 hover:text-[#3182F6] transition-colors font-bold"
              >
                관리자 전용 페이지
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Choice Modal for Multiple Matched/Fuzzy Models */}
      {choiceModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[#E5E8EB] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#EA1D2C] bg-red-50 px-2 py-0.5 rounded">
                  공홈 공식 제품 선택
                </span>
                <h3 className="text-[16px] font-black text-[#191F28] mt-1">
                  이동할 제품 페이지를 선택하세요
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setChoiceModalProduct(null)}
                className="text-[#8B95A1] hover:text-[#191F28] p-1 rounded-lg hover:bg-[#F2F4F6] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#F8F9FA] p-3 rounded-xl border border-[#E5E8EB]">
                <p className="text-[12px] font-bold text-[#6B7684]">요청 모델</p>
                <p className="text-[14px] font-black text-[#191F28] font-mono">
                  {choiceModalProduct.model} ({choiceModalProduct.name})
                </p>
                <p className="text-[11px] text-[#8B95A1] mt-1">
                  공홈에서 일치/유사한 제품 옵션이 확인되었습니다. 아래에서 원하는 형태를 클릭하시면 해당 공홈 페이지로 바로 이동합니다:
                </p>
              </div>

              <div className="space-y-2">
                {choiceModalProduct.relatedUrls?.map((rel: any, i: number) => {
                  const safeUrl = buildLgOfficialPdpUrl(rel.url, rel.model, choiceModalProduct.categoryKey || choiceModalProduct.category);
                  return (
                    <a
                      key={i}
                      href={safeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setChoiceModalProduct(null)}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-[#E5E8EB] hover:border-[#3182F6] hover:bg-[#F8FAFF] transition-all group cursor-pointer"
                    >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#E8F3FF] text-[#1B64DA] flex items-center justify-center font-bold text-[12px] shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-extrabold bg-[#F2F4F6] group-hover:bg-[#E8F3FF] text-[#333D4B] group-hover:text-[#1B64DA] px-2 py-0.5 rounded">
                            {rel.title}
                          </span>
                          <span className="text-[13px] font-black text-[#191F28] font-mono">
                            {rel.model}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8B95A1] mt-0.5 truncate max-w-[260px]">
                          {rel.url}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#8B95A1] group-hover:text-[#3182F6] shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </a>
                );
              })}

                {/* Direct Search Link Fallback */}
                <a
                  href={`https://www.lge.co.kr/search/search-all?searchKey=${encodeURIComponent(choiceModalProduct.model)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setChoiceModalProduct(null)}
                  className="flex items-center justify-between p-3 rounded-xl border border-dashed border-[#D1D6DB] hover:border-[#4E5968] hover:bg-gray-50 transition-all text-[#6B7684] hover:text-[#191F28] text-[12px] font-bold"
                >
                  <span>🔍 LG 공홈에서 &apos;{choiceModalProduct.model}&apos; 전체 검색결과 보기</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="p-4 bg-[#F8F9FA] border-t border-[#E5E8EB] flex justify-end">
              <button
                type="button"
                onClick={() => setChoiceModalProduct(null)}
                className="px-4 py-2 bg-white border border-[#D1D6DB] hover:bg-[#F2F4F6] text-[#4E5968] text-[13px] font-bold rounded-xl cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
