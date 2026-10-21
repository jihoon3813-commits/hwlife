import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Search, RotateCcw, Sparkles, Check, ChevronRight, Maximize2, 
  Info, ArrowRight, Gift, Layers, CheckCircle2, SlidersHorizontal, Eye
} from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { LG_OFFICIAL_PRODUCTS, CATEGORY_SUBTABS, LgProduct } from '../data/lgCareProducts';
import { getProductCapacityInfo } from '../utils/productCapacity';
import { matchesSubCategory } from '../utils/subCategoryMatcher';
import { buildLgOfficialPdpUrl, getOptimizedImageUrl } from '../utils/lgeUrl';

// Category item structure
interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  badge?: string;
  group: 'all' | 'living' | 'kitchen' | 'air' | 'display' | 'health';
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
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

function calc10PercentDiscount(price: number): number {
  if (!price || price <= 0) return 0;
  return Math.floor((price * 0.9) / 100) * 100;
}

export interface SelectedProductPlan {
  product: LgProduct;
  term: string;
  cycle: string;
  type: string;
  originalPrice: number;
  discountedPrice: number;
  color?: string;
  optionSummary: string;
}

interface LgCareCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  onApplyToCalculator: (plan: SelectedProductPlan) => void;
  onDirectConsult?: (plan: SelectedProductPlan) => void;
}

export default function LgCareCatalogModal({
  isOpen,
  onClose,
  initialCategory = 'all',
  onApplyToCalculator,
  onDirectConsult,
}: LgCareCatalogModalProps) {
  // DB Queries (Live Admin Synchronization)
  const dbLgProducts = useQuery(api.lgProducts.getVisible);
  const dbCategories = useQuery(api.lgCategories.getOrdered);

  // Categories list (DB ordered categories prioritized)
  const categories = useMemo<CategoryItem[]>(() => {
    if (dbCategories && dbCategories.length > 0) {
      const cleaned = dbCategories.filter(c => c.key !== 'bath-air' && c.key !== 'bath_air');
      return cleaned.map(c => ({
        id: c.key,
        name: c.name,
        icon: c.icon,
        badge: c.badge,
        group: (c.group as any) || 'living'
      }));
    }
    return DEFAULT_CATEGORIES;
  }, [dbCategories]);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubTab, setSelectedSubTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // When initialCategory changes or modal opens, initialize category tab
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(initialCategory || 'all');
      setSelectedSubTab('all');
      setSearchTerm('');
    }
  }, [isOpen, initialCategory]);

  // Detail Modal States
  const [selectedProduct, setSelectedProduct] = useState<LgProduct | null>(null);
  const [detailTab, setDetailTab] = useState<'options' | 'specs'>('options');
  const [selectedTerm, setSelectedTerm] = useState<string>('72');
  const [selectedCycle, setSelectedCycle] = useState<string>('12');
  const [selectedType, setSelectedType] = useState<string>('001');
  const [selectedModalColor, setSelectedModalColor] = useState<string>('');

  // Process & Merge DB Products (Identical logic to care10)
  const allProductList = useMemo<LgProduct[]>(() => {
    if (dbLgProducts && dbLgProducts.length > 0) {
      const modelGroupMap = new Map<string, any[]>();
      
      for (const p of dbLgProducts) {
        const cleanKey = (p.model || '').trim().split('.')[0].trim().toUpperCase();
        if (!modelGroupMap.has(cleanKey)) {
          modelGroupMap.set(cleanKey, []);
        }
        modelGroupMap.get(cleanKey)!.push(p);
      }

      const mergedList: LgProduct[] = [];

      for (const [, items] of modelGroupMap.entries()) {
        const p = items[0];
        const specsMap: Record<string, string> = {};
        if (p.specifications) {
          for (const s of p.specifications) {
            specsMap[s.name] = s.value;
          }
        }

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
          return { value, label, rawCycle: clean };
        });

        const isTv = p.categoryKey === 'tv' || (p.category && p.category.includes('TV'));
        const isStyler = p.categoryKey === 'styler' || (p.category && p.category.includes('스타일러'));
        const isWater = p.categoryKey === 'water' || (p.category && p.category.includes('정수기'));

        const careServiceTypes = allCareOptions.map((ro, idx) => {
          const typeName = (ro.type || '기본').trim();
          let fullDesc = typeName;

          if (isTv) {
            fullDesc = typeName.includes('넷플릭스') 
              ? '넷플릭스 멤버십 결합 및 계약기간 무상 A/S' 
              : 'LG 올레드/QNED 공식 무상 A/S 품질 보증 지원';
          } else if (isStyler) {
            fullDesc = typeName.includes('프리미엄') 
              ? '기계실 분해세척, 급/배수통 교체, 향기시트 제공, 무상 A/S' 
              : '전문 케어 매니저 방문 살균 세척 및 무상 부품 점검';
          } else if (isWater) {
            fullDesc = (typeName.includes('자가관리') || typeName.includes('셀프'))
              ? '정기 직수관/필터 무상 배송 및 원터치 자가 교체'
              : '케어 매니저 정기 방문 고온 살균 세척 및 필터 무상 교체';
          } else {
            fullDesc = (typeName.includes('자가관리') || typeName.includes('셀프'))
              ? '정기 소모품 무상 배송 및 직접 교체'
              : '전문 케어 매니저 방문 살균 세척 및 무상 소모품 교체';
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

        const priceMap: Record<string, { monthlyPrice: number }> = {};
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

        const dbColors = p.colors && p.colors.length > 0 ? p.colors : [{ name: p.color || '기본', code: '#2B2B2B', isDefault: true }];
        const defaultColor = dbColors.find((c: any) => c.isDefault)?.name || dbColors[0]?.name || p.color || '';

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

        if (resolvedCategoryKey === 'bathair' || cleanModelStr.startsWith('MX0120') || cleanModelStr.startsWith('M-X0120') || cleanModelStr.includes('BASV')) {
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
          badge: p.discountRate6Year ? `${p.discountRate6Year}% 할인` : '인기구독',
          rentalPrice,
          combinedDiscount,
          finalPrice: 0,
          cardDiscountPrice: 0,
          image: getOptimizedImageUrl(p.image),
          images: p.images?.length ? p.images.map(getOptimizedImageUrl) : [getOptimizedImageUrl(p.image)],
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

    // Fallback: If DB is empty, use static catalog
    return LG_OFFICIAL_PRODUCTS;
  }, [dbLgProducts]);

  // Current Subtabs
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

      // 3. Search Matching
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchSearch = p.name.toLowerCase().includes(term) || p.model.toLowerCase().includes(term);
        if (!matchSearch) return false;
      }

      return true;
    });
  }, [allProductList, selectedCategory, selectedSubTab, searchTerm]);

  // Open Product Detail Modal
  const handleOpenProductDetail = (product: LgProduct) => {
    setSelectedProduct(product);
    setDetailTab('options');

    const defaultColor = product.colors?.find(c => c.isDefault)?.name || product.colors?.[0]?.name || product.color || '';
    setSelectedModalColor(defaultColor);

    const availableTerms = product.subscriptionOptions?.contractTerms || [];
    const bestTerm = (product as any).defaultTerm || (availableTerms.find(t => t.value === '72') ? '72' : (availableTerms[0]?.value || '72'));
    setSelectedTerm(bestTerm);

    const bestCycle = (product as any).defaultCycle || product.subscriptionOptions?.careServiceCycles?.[0]?.value || '12';
    const bestType = (product as any).defaultType || product.subscriptionOptions?.careServiceTypes?.[0]?.value || '001';

    setSelectedCycle(bestCycle);
    setSelectedType(bestType);
  };

  // Close Product Detail
  const handleCloseProductDetail = () => {
    setSelectedProduct(null);
  };

  // Calculate prices for detail modal
  const detailPricing = useMemo(() => {
    if (!selectedProduct || !selectedProduct.subscriptionOptions) {
      return { originalPrice: 0, discountedPrice: 0, discountDiff: 0 };
    }

    const priceMap = selectedProduct.subscriptionOptions.priceMap || {};
    const keyWithAll = `${selectedTerm}_${selectedCycle}_${selectedType}`;
    const keyWithCycle = `${selectedTerm}_${selectedCycle}`;
    const keyWithType = `${selectedTerm}_${selectedType}`;

    const originalPrice = 
      priceMap[keyWithAll]?.monthlyPrice ||
      priceMap[keyWithType]?.monthlyPrice ||
      priceMap[keyWithCycle]?.monthlyPrice ||
      (selectedTerm === '60' ? (selectedProduct.rentalPrice || 39900) : (selectedProduct.rentalPrice || 35900));

    const discountedPrice = calc10PercentDiscount(originalPrice);
    const discountDiff = originalPrice - discountedPrice;

    return { originalPrice, discountedPrice, discountDiff };
  }, [selectedProduct, selectedTerm, selectedCycle, selectedType]);

  // Apply to Calculator handler
  const handleApply = (product: LgProduct) => {
    const cycleLabel = product.subscriptionOptions?.careServiceCycles?.find(c => c.value === selectedCycle)?.label || `${selectedCycle}개월 주기`;
    const typeLabel = product.subscriptionOptions?.careServiceTypes?.find(t => t.value === selectedType)?.accentLabel || '방문관리';
    const optSummary = `${selectedTerm === '60' ? '5년' : '6년'} / ${cycleLabel} / ${typeLabel}${selectedModalColor ? ` (${selectedModalColor})` : ''}`;

    onApplyToCalculator({
      product,
      term: selectedTerm,
      cycle: selectedCycle,
      type: selectedType,
      originalPrice: detailPricing.originalPrice,
      discountedPrice: detailPricing.discountedPrice,
      color: selectedModalColor,
      optionSummary: optSummary,
    });
    handleCloseProductDetail();
    onClose();
  };

  // Direct Consult handler
  const handleDirectConsult = (product: LgProduct) => {
    const cycleLabel = product.subscriptionOptions?.careServiceCycles?.find(c => c.value === selectedCycle)?.label || `${selectedCycle}개월 주기`;
    const typeLabel = product.subscriptionOptions?.careServiceTypes?.find(t => t.value === selectedType)?.accentLabel || '방문관리';
    const optSummary = `${selectedTerm === '60' ? '5년' : '6년'} / ${cycleLabel} / ${typeLabel}${selectedModalColor ? ` (${selectedModalColor})` : ''}`;

    if (onDirectConsult) {
      onDirectConsult({
        product,
        term: selectedTerm,
        cycle: selectedCycle,
        type: selectedType,
        originalPrice: detailPricing.originalPrice,
        discountedPrice: detailPricing.discountedPrice,
        color: selectedModalColor,
        optionSummary: optSummary,
      });
    } else {
      handleApply(product);
    }
    handleCloseProductDetail();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#fbfbf9] rounded-2xl sm:rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl border border-[#dce1d9] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-[#173f35] text-white p-4 sm:p-5 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#d6e8b2] text-[#173f35] flex items-center justify-center font-black text-sm">
              LG
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-white/10 text-[#d6e8b2]">
                  인기 가전 구독 라인업
                </span>
                <span className="text-[11px] text-white/70 hidden sm:inline">
                  효원 결합 매월 10% 특별 할인
                </span>
              </div>
              <h2 className="text-[17px] sm:text-[20px] font-bold tracking-tight text-white mt-0.5">
                카테고리별 인기 가전 구독 모델
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls: Search & Reset */}
        <div className="p-3 sm:p-4 bg-white border-b border-[#e4e7de] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Category Chips Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 flex-1">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSubTab('all');
              }}
              className={`px-3 py-1.5 rounded-full text-[12px] sm:text-[13px] font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-[#173f35] text-white shadow-xs'
                  : 'bg-[#f5f6f0] text-[#455249] hover:bg-[#eaf0e1]'
              }`}
            >
              전체보기 ({allProductList.length})
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = allProductList.filter(p => p.category === cat.id).length;
              if (count === 0) return null;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedSubTab('all');
                  }}
                  className={`px-3 py-1.5 rounded-full text-[12px] sm:text-[13px] font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-[#173f35] text-white shadow-sm'
                      : 'bg-[#f5f6f0] text-[#455249] hover:bg-[#eaf0e1]'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isSelected ? 'bg-[#d6e8b2] text-[#173f35]' : 'bg-black/5 text-[#6b746d]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px] sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-[#778075] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="모델명/가전명 검색..."
              className="w-full bg-[#f5f6f0] border border-[#dce1d9] rounded-xl pl-9 pr-8 py-2 text-[12px] sm:text-[13px] font-medium text-[#222c27] focus:outline-none focus:border-[#173f35] transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#778075] hover:text-[#222c27]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Subcategories (if available) */}
        {currentSubTabs.length > 0 && (
          <div className="px-4 py-2 bg-[#f5f6f0] border-b border-[#e4e7de] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[11px] font-bold text-[#6b746d] mr-1 shrink-0">유형/용량:</span>
            <button
              type="button"
              onClick={() => setSelectedSubTab('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedSubTab === 'all'
                  ? 'bg-[#173f35] text-white'
                  : 'bg-white text-[#455249] border border-[#dce1d9] hover:bg-[#eaf0e1]'
              }`}
            >
              전체
            </button>
            {currentSubTabs.map((sub) => {
              const isSubSelected = selectedSubTab === sub.name;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubTab(sub.name)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSubSelected
                      ? 'bg-[#173f35] text-white shadow-xs'
                      : 'bg-white text-[#455249] border border-[#dce1d9] hover:bg-[#eaf0e1]'
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Products Grid Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredProducts.length === 0 ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 rounded-full bg-[#f5f6f0] flex items-center justify-center text-[#778075] mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-[16px] font-bold text-[#222c27] mb-1">
                일치하는 가전 모델이 없습니다
              </h3>
              <p className="text-[13px] text-[#6b746d] mb-4">
                검색어를 변경하거나 다른 카테고리를 선택해 보세요.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSubTab('all');
                  setSearchTerm('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#173f35] text-white text-[12px] font-bold hover:bg-[#205246] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>전체 모델 보기</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredProducts.map((product) => {
                const capInfo = getProductCapacityInfo(
                  product.model,
                  product.name,
                  product.category,
                  product.categoryName,
                  product.specs
                );

                const discountPrice = product.combinedDiscount || calc10PercentDiscount(product.rentalPrice);

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-[#e4e7de] hover:border-[#173f35] p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md group"
                  >
                    <div>
                      {/* Top Badges & Category */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#eaf0e1] text-[#173f35]">
                          {product.categoryName}
                        </span>
                        <div className="flex items-center gap-1">
                          {product.topBadges?.[0] ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#173f35] text-white">
                              {product.topBadges[0]}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#d6e8b2] text-[#173f35]">
                              10% 결합할인
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Product Thumbnail */}
                      <div 
                        onClick={() => handleOpenProductDetail(product)}
                        className="w-full h-32 p-2 flex items-center justify-center bg-[#fbfbf9] rounded-xl cursor-pointer overflow-hidden relative"
                      >
                        <img
                          src={getOptimizedImageUrl(product.image, 'thumb')}
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = 'https://static.lge.co.kr/kr/images/common/no-image.jpg';
                          }}
                        />
                        <button
                          type="button"
                          className="absolute bottom-2 right-2 p-1.5 rounded-full bg-white/90 text-[#455249] shadow-xs group-hover:bg-[#173f35] group-hover:text-white transition-colors"
                          title="상세보기"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Model & Name */}
                      <div className="mt-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-mono text-[11px] font-bold text-[#6b746d]">
                            {product.model}
                          </span>
                          {capInfo && (
                            <span className="text-[10.5px] font-bold px-1.5 py-0.2 rounded bg-[#eaf0e1] text-[#173f35]">
                              {capInfo.label}
                            </span>
                          )}
                        </div>

                        <h3 
                          onClick={() => handleOpenProductDetail(product)}
                          className="text-[14px] sm:text-[15px] font-bold text-[#222c27] line-clamp-2 leading-snug cursor-pointer group-hover:text-[#173f35] transition-colors"
                        >
                          {product.name}
                        </h3>

                        {/* Feature Summary */}
                        <p className="text-[11px] text-[#778075] line-clamp-1 mt-1">
                          {product.featureSummary || 'LG 공식 케어솔루션 방문 살균 케어 및 무상 A/S'}
                        </p>
                      </div>
                    </div>

                    {/* Pricing & CTA */}
                    <div className="mt-4 pt-3 border-t border-[#f0f2eb]">
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-[11px] text-[#778075]">
                          정가 <span className="line-through">{product.rentalPrice.toLocaleString()}원</span>
                        </span>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-[#457052] mr-1">10% 할인가</span>
                          <span className="text-[16px] sm:text-[18px] font-black text-[#173f35]">
                            월 {discountPrice.toLocaleString()}원
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenProductDetail(product)}
                          className="py-2 px-2.5 rounded-xl border border-[#dce1d9] text-[11px] sm:text-[12px] font-bold text-[#455249] hover:bg-[#f5f6f0] transition-colors text-center cursor-pointer"
                        >
                          스펙/옵션
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleOpenProductDetail(product);
                          }}
                          className="py-2 px-2.5 rounded-xl bg-[#173f35] hover:bg-[#205246] text-white text-[11px] sm:text-[12px] font-bold transition-colors text-center cursor-pointer shadow-xs"
                        >
                          선택하기
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Info Bar */}
        <div className="p-3 sm:p-4 bg-[#f5f6f0] border-t border-[#e4e7de] flex items-center justify-between text-[11px] sm:text-[12px] text-[#6b746d] shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#173f35]" />
            <span>선택한 모델은 아래 <strong>월 지출 계산기</strong>에 자동으로 적용됩니다.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-white border border-[#dce1d9] text-[#222c27] font-bold hover:bg-[#eaf0e1] transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>

      {/* Product Detail Sub-Modal */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in zoom-in duration-200"
          onClick={handleCloseProductDetail}
        >
          <div 
            className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-[#dce1d9] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#f0f2eb] flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-3">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#eaf0e1] text-[#173f35] mr-2">
                  {selectedProduct.categoryName}
                </span>
                <span className="font-bold text-[14px] sm:text-[16px] text-[#222c27] truncate">
                  {selectedProduct.name}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseProductDetail}
                className="w-8 h-8 rounded-full bg-[#f5f6f0] hover:bg-[#e4e7de] text-[#455249] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Product Preview Card */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-[#fbfbf9] border border-[#e4e7de]">
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-xl p-2 border border-[#e4e7de] flex items-center justify-center shrink-0">
                  <img
                    src={getOptimizedImageUrl(
                      selectedProduct.colors?.find(c => c.name === selectedModalColor)?.image || selectedProduct.image,
                      'modal'
                    )}
                    alt={selectedProduct.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-[#6b746d] bg-white px-2 py-0.5 rounded border border-[#e4e7de]">
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
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#eaf0e1] text-[#173f35]">
                          ⚡ {capInfo.label}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <h4 className="text-[15px] sm:text-[17px] font-black text-[#222c27] leading-snug">
                    {selectedProduct.name}
                  </h4>
                  <p className="text-[12px] text-[#6b746d]">
                    {selectedProduct.featureSummary || 'LG 공식 케어솔루션 방문 살균 케어 및 무상 A/S'}
                  </p>
                </div>
              </div>

              {/* Detail Tabs: Options vs Specs */}
              <div className="flex rounded-xl bg-[#f5f6f0] p-1 border border-[#e4e7de]">
                <button
                  type="button"
                  onClick={() => setDetailTab('options')}
                  className={`flex-1 py-2 text-center rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
                    detailTab === 'options'
                      ? 'bg-white text-[#173f35] shadow-xs'
                      : 'text-[#6b746d] hover:text-[#222c27]'
                  }`}
                >
                  구독 조건 & 옵션 설정
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('specs')}
                  className={`flex-1 py-2 text-center rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
                    detailTab === 'specs'
                      ? 'bg-white text-[#173f35] shadow-xs'
                      : 'text-[#6b746d] hover:text-[#222c27]'
                  }`}
                >
                  제품 상세 스펙
                </button>
              </div>

              {detailTab === 'options' ? (
                <div className="space-y-4">
                  {/* Colors */}
                  {selectedProduct.colors && selectedProduct.colors.length > 1 && (
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-[#222c27]">
                        색상 / 디자인 선택
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.colors.map((c) => {
                          const isSelectedColor = selectedModalColor === c.name;
                          return (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => setSelectedModalColor(c.name)}
                              className={`px-3 py-1.5 rounded-xl border text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                isSelectedColor
                                  ? 'bg-[#173f35] text-white border-[#173f35] shadow-xs'
                                  : 'bg-white text-[#455249] border-[#dce1d9] hover:border-[#173f35]'
                              }`}
                            >
                              <span 
                                className="w-3 h-3 rounded-full border border-black/20" 
                                style={{ backgroundColor: c.code || '#999' }} 
                              />
                              <span>{c.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Contract Term */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#222c27]">
                      계약기간 (약정)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: '60', label: '5년 약정 (60개월)' },
                        { value: '72', label: '6년 약정 (72개월)' },
                      ].map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setSelectedTerm(t.value)}
                          className={`py-2.5 px-3 rounded-xl border text-[12px] sm:text-[13px] font-bold transition-all text-center cursor-pointer ${
                            selectedTerm === t.value
                              ? 'bg-[#173f35] text-white border-[#173f35] shadow-xs'
                              : 'bg-white text-[#455249] border-[#dce1d9] hover:border-[#173f35]'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Care Cycles */}
                  {selectedProduct.subscriptionOptions?.careServiceCycles && (
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-[#222c27]">
                        케어서비스 주기
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {selectedProduct.subscriptionOptions.careServiceCycles.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => setSelectedCycle(c.value)}
                            className={`py-2.5 px-3 rounded-xl border text-[12px] font-bold transition-all text-center cursor-pointer ${
                              selectedCycle === c.value
                                ? 'bg-[#173f35] text-white border-[#173f35] shadow-xs'
                                : 'bg-white text-[#455249] border-[#dce1d9] hover:border-[#173f35]'
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Care Service Types */}
                  {selectedProduct.subscriptionOptions?.careServiceTypes && selectedProduct.subscriptionOptions.careServiceTypes.length > 1 && (
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-[#222c27]">
                        케어서비스 유형
                      </label>
                      <div className="space-y-1.5">
                        {selectedProduct.subscriptionOptions.careServiceTypes.map((t) => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => setSelectedType(t.value)}
                            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                              selectedType === t.value
                                ? 'bg-[#eaf0e1] border-[#173f35] text-[#173f35]'
                                : 'bg-white border-[#dce1d9] text-[#455249] hover:border-[#173f35]'
                            }`}
                          >
                            <div>
                              <div className="text-[12px] font-bold">{t.accentLabel || t.label}</div>
                              <div className="text-[11px] text-[#6b746d] line-clamp-1">{t.label}</div>
                            </div>
                            {selectedType === t.value && (
                              <Check className="w-4 h-4 text-[#173f35] shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Calculation Card */}
                  <div className="p-4 rounded-2xl bg-[#173f35] text-white space-y-3">
                    <div className="flex items-center justify-between text-[12px] text-white/70">
                      <span>LG 공식 월 구독료 (정가)</span>
                      <span className="line-through">{detailPricing.originalPrice.toLocaleString()}원/월</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px] text-[#d6e8b2] font-bold">
                      <span>효원 결합 10% 지원 할인</span>
                      <span>-{detailPricing.discountDiff.toLocaleString()}원/월</span>
                    </div>
                    <div className="pt-2 border-t border-white/20 flex items-baseline justify-between">
                      <span className="text-[13px] font-bold text-white">최종 고객 실부담 구독료</span>
                      <div className="text-right">
                        <span className="text-[20px] sm:text-[24px] font-black text-[#d6e8b2]">
                          월 {detailPricing.discountedPrice.toLocaleString()}원
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-white/60">
                      ※ 상조 만기 시 낸 돈 100% 전액 환급 및 추가 축하금 지원 혜택이 함께 제공됩니다.
                    </p>
                  </div>
                </div>
              ) : (
                /* Specs Table */
                <div className="space-y-3">
                  <div className="border border-[#e4e7de] rounded-xl overflow-hidden divide-y divide-[#e4e7de] text-[12px]">
                    <div className="grid grid-cols-3 bg-[#f5f6f0] p-2.5 font-bold text-[#173f35]">
                      <span className="col-span-1">항목</span>
                      <span className="col-span-2">상세 사양</span>
                    </div>
                    {selectedProduct.specs && Object.keys(selectedProduct.specs).length > 0 ? (
                      Object.entries(selectedProduct.specs).map(([key, val]) => (
                        <div key={key} className="grid grid-cols-3 p-2.5">
                          <span className="col-span-1 font-semibold text-[#6b746d]">{key}</span>
                          <span className="col-span-2 text-[#222c27]">{val}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-[#778075]">
                        등록된 상세 사양 정보가 없습니다. (LG 공식 사이트 참고)
                      </div>
                    )}
                  </div>

                  {/* LG Official PDP Link */}
                  {(() => {
                    const officialUrl = buildLgOfficialPdpUrl(
                      selectedProduct.refUrl,
                      selectedProduct.model,
                      selectedProduct.category
                    );
                    return (
                      <a
                        href={officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl border border-[#dce1d9] bg-[#fbfbf9] hover:bg-white text-[12px] font-bold text-[#455249] transition-colors"
                      >
                        <span>LG전자 공식 제품 상세페이지 열기</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-3 sm:p-4 border-t border-[#f0f2eb] bg-white flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCloseProductDetail}
                className="py-3 px-4 rounded-xl border border-[#dce1d9] text-[13px] font-bold text-[#455249] hover:bg-[#f5f6f0] transition-colors cursor-pointer"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => handleApply(selectedProduct)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#173f35] hover:bg-[#205246] text-white text-[13px] sm:text-[14px] font-black transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#d6e8b2]" />
                <span>이 모델로 견적 계산하기</span>
              </button>
              <button
                type="button"
                onClick={() => handleDirectConsult(selectedProduct)}
                className="py-3 px-4 rounded-xl bg-[#d6e8b2] hover:bg-[#c5dc9f] text-[#173f35] text-[13px] sm:text-[14px] font-black transition-colors shadow-sm hidden sm:inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Gift className="w-4 h-4" />
                <span>바로 상담 신청</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
