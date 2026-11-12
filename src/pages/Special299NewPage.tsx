import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useTrackVisit } from '../hooks/useTrackVisit';
import { formatPhoneNumber } from '../utils/phone';
import { getOptimizedImageUrl } from '../utils/lgeUrl';
import SEO from '../components/SEO';
import { Gift, Loader2, RefreshCw, FileText } from 'lucide-react';
import './Special299NewPage.css';

interface Special299NewPageProps {
  channelSubdomain?: string;
  landingPath?: string;
}

type AccountKey = '1구좌' | '2구좌' | '3구좌' | '4구좌';

interface PackageTierInfo {
  key: AccountKey;
  shortName: string;
  name: string;
  badgeLabel: string;
  accountNum: number;
  monthlyPrice: string;
  rentalPrice: string;
  sangjoPrice: string;
  extendPrice: string;
  totalPrice: string;
  tabSubtext: string;
}

const PACKAGE_TIERS: Record<AccountKey, PackageTierInfo> = {
  '1구좌': {
    key: '1구좌',
    shortName: '1구좌 (싱글)',
    name: '1구좌 패키지 (싱글)',
    badgeLabel: '1구좌(싱글) 전용',
    accountNum: 1,
    monthlyPrice: '29,900',
    rentalPrice: '26,910',
    sangjoPrice: '2,990',
    extendPrice: '29,900',
    totalPrice: '5,980,000',
    tabSubtext: '가전소유+상조부금 60회 포함',
  },
  '2구좌': {
    key: '2구좌',
    shortName: '2구좌 (더블 · 인기)',
    name: '2구좌 패키지 (더블)',
    badgeLabel: '2구좌(더블) 전용',
    accountNum: 2,
    monthlyPrice: '59,800',
    rentalPrice: '53,820',
    sangjoPrice: '5,980',
    extendPrice: '59,800',
    totalPrice: '11,960,000',
    tabSubtext: '가전소유+상조부금 60회 포함',
  },
  '3구좌': {
    key: '3구좌',
    shortName: '3구좌 (트리플)',
    name: '3구좌 패키지 (트리플)',
    badgeLabel: '3구좌(트리플) 전용',
    accountNum: 3,
    monthlyPrice: '89,700',
    rentalPrice: '80,730',
    sangjoPrice: '8,970',
    extendPrice: '89,700',
    totalPrice: '17,940,000',
    tabSubtext: '가전소유+상조부금 60회 포함',
  },
  '4구좌': {
    key: '4구좌',
    shortName: '4구좌 (쿼드)',
    name: '4구좌 패키지 (쿼드)',
    badgeLabel: '4구좌(쿼드) 전용',
    accountNum: 4,
    monthlyPrice: '119,600',
    rentalPrice: '107,640',
    sangjoPrice: '11,960',
    extendPrice: '119,600',
    totalPrice: '23,920,000',
    tabSubtext: '가전소유+상조부금 60회 포함',
  },
};

const ALL_ACCOUNT_KEYS: AccountKey[] = ['1구좌', '2구좌', '3구좌', '4구좌'];

const PLAN_ID_TO_ACCOUNT: Record<number, AccountKey> = {
  5: '1구좌',
  6: '2구좌',
  7: '3구좌',
  8: '4구좌',
};

const SCENARIOS = [
  {
    kicker: '01 / 새로운 시작',
    title: '살림을 채우는 설렘,\n준비는 조금 더 가볍게.',
    description:
      '냉장고부터 세탁기까지, 한 번에 준비할 가전이 많은 시기. 필요한 제품과 전체 납입 조건을 함께 살펴보세요.',
    image: '/special299/hero.webp',
    alt: '새로운 생활공간의 가전',
    caption: 'A NEW BEGINNING',
    interest: '신혼·입주 가전 상담',
    points: [
      '우리 집 공간에 맞는 가전 구성 상담',
      '선택 가전에 따른 구좌별 납입금 확인',
      '가족의 미래를 위한 상조서비스 준비',
    ],
  },
  {
    kicker: '02 / 일상의 변화',
    title: '매일 쓰는 가전,\n바꾸고 싶었던 그 순간.',
    description:
      '오래된 가전의 교체를 고민하고 있다면 원하는 성능, 디자인과 함께 계약 전체의 납입금도 비교해 보세요.',
    image: '/special299/hero.webp',
    alt: '가전이 놓인 거실과 주방',
    caption: 'A REFRESHED EVERYDAY',
    interest: '노후 가전 교체 상담',
    points: [
      '교체하려는 제품의 모델·규격 확인',
      '노트북·TV 등 희망 디지털 기기 문의',
      '월 납입금과 총 납입금 함께 확인',
    ],
  },
  {
    kicker: '03 / 부모님을 위한 마음',
    title: '부모님의 편안한 하루,\n마음까지 전하는 선물.',
    description:
      '매일의 휴식을 위한 안마의자부터 생활을 편리하게 하는 가전까지. 부모님께 필요한 구성을 함께 찾아드립니다.',
    image: '/special299/chair.jpg',
    alt: '부모님 선물로 상담할 수 있는 안마의자 예시',
    caption: 'A THOUGHTFUL GIFT',
    interest: '부모님 선물 가전 상담',
    points: [
      '사용 환경에 맞춘 제품 종류 상담',
      '부모님 댁 배송·설치 가능 조건 확인',
      '계약자·납입자·이용 대상 조건 확인',
    ],
  },
  {
    kicker: '04 / 새로운 도전',
    title: '시작하는 공간에,\n꼭 필요한 가전부터.',
    description:
      '매장이나 개인 사무실을 준비할 때 필요한 가전을 확인하세요. 사업장 설치와 이용 가능 조건을 개별적으로 안내합니다.',
    image: '/special299/office.jpg',
    alt: '밝고 편안한 사무실 공간 예시',
    caption: 'A SPACE FOR YOUR NEXT CHAPTER',
    interest: '매장·사무실 가전 상담',
    points: [
      'TV·공기청정기 등 희망 제품 문의',
      '사업장 설치·사용 가능 여부 확인',
      '계약 대상과 납입 조건 함께 확인',
    ],
  },
  {
    kicker: '05 / 가족의 특별한 날',
    title: '익숙한 일상을 넘어,\n함께할 추억을 준비해요.',
    description:
      '오늘은 필요한 가전으로, 미래에는 가족을 위한 라이프서비스로. 전환 가능 서비스와 이용 조건을 미리 확인해 보세요.',
    image: '/special299/cruise.webp',
    alt: '바다를 항해하는 크루즈 연출 이미지',
    caption: 'MEMORIES TO SHARE',
    interest: '가족 라이프서비스 상담',
    points: [
      '크루즈·웨딩 전환서비스 상담',
      '전환 시 납입금 정산·추가 비용 확인',
      '가전 혜택과 서비스 이용 조건 구분',
    ],
  },
];

const LIFE_SERVICES: Record<
  'funeral' | 'cruise' | 'wedding',
  { title: string; text: string; image: string; items: string[] }
> = {
  funeral: {
    title: '마음을 다하는 장례서비스',
    text: '효원상조의 장례서비스는 가족을 배웅하는 순간을 위한 준비입니다. 가입한 상품의 장례 인력, 차량, 용품 및 제공 범위를 먼저 확인하세요.',
    image: '/special299/funeral.webp',
    items: [
      '가입 상품에 따른 의전 인력·용품 구성',
      '서비스 이용 시 잔여 납입금 정산',
      '기본 제공 범위 외 선택 항목과 추가 비용',
    ],
  },
  cruise: {
    title: '가족과 함께하는 크루즈',
    text: '특별한 여행으로 함께할 추억을 준비하세요. 효원상조의 크루즈 전환서비스는 출발 일정과 목적지, 선택 상품에 따라 이용 조건이 달라집니다.',
    image: '/special299/cruise.webp',
    items: [
      '스페셜299의 전환 적용 및 신청 조건',
      '항공·선실·기항지 관광 등 포함 범위',
      '상품 차액·추가 비용·취소 규정',
    ],
  },
  wedding: {
    title: '새로운 시작을 위한 웨딩',
    text: '두 사람의 빛나는 시작을 위한 전환서비스입니다. 이용 가능 지역과 구성, 계약금의 정산 방식 등을 확인한 후 준비할 수 있습니다.',
    image: '/special299/wedding.webp',
    items: [
      '스페셜299의 웨딩 전환 적용 조건',
      '실제 제공 항목과 서비스 이용 지역',
      '이용 시 납입금 정산·선택 항목 추가 비용',
    ],
  },
};

const getProductImageList = (p: any): string[] => {
  if (!p) return ['/special299/fridge.jpg'];
  const list: string[] = [];
  if (p.image && typeof p.image === 'string' && p.image.trim() !== '') {
    const opt = getOptimizedImageUrl(p.image, 'modal');
    list.push(opt);
  }
  if (Array.isArray(p.images)) {
    for (const img of p.images) {
      if (img && typeof img === 'string' && img.trim() !== '') {
        const opt = getOptimizedImageUrl(img, 'modal');
        if (!list.includes(opt)) {
          list.push(opt);
        }
      }
    }
  }
  return list.length > 0 ? list : ['/special299/fridge.jpg'];
};

export default function Special299NewPage({
  channelSubdomain,
  landingPath = '/special_new',
}: Special299NewPageProps) {
  useTrackVisit(channelSubdomain, landingPath);

  const allProducts = useQuery(api.products.getVisibleProducts) || [];
  const dbPlans = useQuery(api.plans.get) || [];
  const landingInfo = useQuery(api.landings.getByPath, { path: landingPath });
  const channel = useQuery(
    api.channels.getBySubdomain,
    channelSubdomain ? { subdomain: channelSubdomain } : 'skip'
  );

  const createInquiry = useMutation(api.inquiries.create);
  const updateProduct = useMutation(api.products.update);
  const scrapeProductInfoAction = useAction(api.crawler.scrapeProductInfo);

  // Navigation & Section UI State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [planAccounts, setPlanAccounts] = useState<1 | 2 | 3 | 4>(1);
  const [quickInterest, setQuickInterest] = useState('냉장고');

  // Product List Filtering State (60패키지 싱글/더블/트리플/쿼드)
  const [activePackageTab, setActivePackageTab] = useState<AccountKey | '전체'>('1구좌');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Right-Side Full-Height Drawer State
  const [drawerMode, setDrawerMode] = useState<
    null | 'product' | 'consult' | 'service' | 'privacy'
  >(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedProductImgIdx, setSelectedProductImgIdx] = useState(0);
  const [isScrapingSpec, setIsScrapingSpec] = useState(false);
  const [selectedServiceKey, setSelectedServiceKey] = useState<
    'funeral' | 'cruise' | 'wedding'
  >('funeral');

  // Consultation Form State (inside Right-Side Drawer)
  const [consultInterest, setConsultInterest] = useState('전체 혜택 상담');
  const [consultName, setConsultName] = useState('');
  const [consultPhone, setConsultPhone] = useState('');
  const [consultPurpose, setConsultPurpose] = useState('신혼·입주 가전');
  const [consultBudget, setConsultBudget] = useState('1');
  const [consultTime, setConsultTime] = useState('빠른 상담');
  const [consultMessage, setConsultMessage] = useState('');
  const [consultConsent, setConsultConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    phone: string;
    interest: string;
    purpose: string;
    budget: string;
    time: string;
    message: string;
  } | null>(null);

  const drawerRef = useRef<HTMLDivElement>(null);
  const isPopStateCloseRef = useRef(false);

  // Helper: map a plan or product to '1구좌' | '2구좌' | '3구좌' | '4구좌'
  const getProductAccountKey = useMemo(() => {
    const planMap = new Map<number, any>();
    dbPlans.forEach((pl: any) => {
      if (typeof pl.numericId === 'number') {
        planMap.set(pl.numericId, pl);
      }
    });

    return (p: any): AccountKey => {
      const rawAcc = (p.accountCount || '').replace(/\s/g, '');
      if (rawAcc.includes('1구좌') || rawAcc.includes('싱글')) return '1구좌';
      if (rawAcc.includes('2구좌') || rawAcc.includes('더블')) return '2구좌';
      if (rawAcc.includes('3구좌') || rawAcc.includes('트리플')) return '3구좌';
      if (rawAcc.includes('4구좌') || rawAcc.includes('쿼드')) return '4구좌';

      if (PLAN_ID_TO_ACCOUNT[p.planId]) {
        return PLAN_ID_TO_ACCOUNT[p.planId];
      }

      const pl = planMap.get(p.planId);
      if (pl) {
        const plAcc = (pl.accountCount || '').replace(/\s/g, '');
        if (plAcc.includes('1구좌')) return '1구좌';
        if (plAcc.includes('2구좌')) return '2구좌';
        if (plAcc.includes('3구좌')) return '3구좌';
        if (plAcc.includes('4구좌')) return '4구좌';

        const plName = pl.name || '';
        if (plName.includes('싱글') || plName.includes('1구좌')) return '1구좌';
        if (plName.includes('더블') || plName.includes('2구좌')) return '2구좌';
        if (plName.includes('트리플') || plName.includes('3구좌')) return '3구좌';
        if (plName.includes('쿼드') || plName.includes('4구좌')) return '4구좌';
      }

      if (p.planId === 1) return '1구좌';
      if (p.planId === 2) return '2구좌';
      if (p.planId === 3) return '3구좌';
      if (p.planId === 4) return '4구좌';
      return '1구좌';
    };
  }, [dbPlans]);

  // Filter 60패키지(싱글, 더블, 트리플, 쿼드) products from Admin ProductManagement
  const package60Products = useMemo(() => {
    const plan60Ids = new Set<number>([5, 6, 7, 8]);
    dbPlans.forEach((pl: any) => {
      if (
        pl.name &&
        (pl.name.includes('60패키지') ||
          pl.name.includes('싱글') ||
          pl.name.includes('더블') ||
          pl.name.includes('트리플') ||
          pl.name.includes('쿼드')) &&
        !pl.name.includes('리빙144')
      ) {
        if (typeof pl.numericId === 'number' && pl.numericId >= 5) {
          plan60Ids.add(pl.numericId);
        } else if (pl.name.includes('60패키지')) {
          plan60Ids.add(pl.numericId);
        }
      }
    });

    return allProducts.filter((p: any) => {
      if (plan60Ids.has(p.planId)) return true;
      if (
        p.landingPages &&
        (p.landingPages.includes('/package60') ||
          p.landingPages.includes('/package_up') ||
          p.landingPages.includes('/special60') ||
          p.landingPages.includes('/special_new') ||
          p.landingPages.includes(landingPath))
      ) {
        return true;
      }
      if (p.isSmartRegistered === true) return true;
      return false;
    });
  }, [allProducts, dbPlans, landingPath]);

  // Counts per 구좌
  const accountCountsMap = useMemo(() => {
    const counts: Record<AccountKey, number> = {
      '1구좌': 0,
      '2구좌': 0,
      '3구좌': 0,
      '4구좌': 0,
    };
    package60Products.forEach((p: any) => {
      const k = getProductAccountKey(p);
      counts[k] = (counts[k] || 0) + 1;
    });
    return counts;
  }, [package60Products, getProductAccountKey]);

  // Products in currently selected 구좌 (before category/search filter)
  const productsInActiveAccount = useMemo(() => {
    if (activePackageTab === '전체') return package60Products;
    return package60Products.filter(
      (p: any) => getProductAccountKey(p) === activePackageTab
    );
  }, [package60Products, activePackageTab, getProductAccountKey]);

  // Dynamic category tabs (like /package60)
  const categoryOptions = useMemo(() => {
    const base = [
      '전체',
      '냉장고',
      '세탁기/건조기',
      'TV',
      '에어컨',
      '청소기',
      '주방가전',
      '생활가전',
      '가구',
    ];
    const additional: string[] = [];
    package60Products.forEach((p: any) => {
      if (!p.category) return;
      const c = p.category.trim();
      const isHandled = base.some((b) => {
        if (b === '전체') return false;
        if (b === '세탁기/건조기')
          return (
            c.includes('세탁기') ||
            c.includes('건조기') ||
            c.includes('워시타워') ||
            c.includes('의류')
          );
        if (b === '가구')
          return c.includes('가구') || c.includes('매트리스') || c.includes('침대');
        if (b === 'TV') return c.includes('TV') || c.includes('시청각') || c.includes('디지털');
        return c.includes(b) || b.includes(c);
      });
      if (!isHandled && !additional.includes(c)) {
        additional.push(c);
      }
    });
    return [...base, ...additional];
  }, [package60Products]);

  // Filtered products by 구좌 + category + search query
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return productsInActiveAccount.filter((p: any) => {
      const matchesCategory =
        selectedCategory === '전체' ||
        (() => {
          if (!p.category) return false;
          const cat = p.category.replace(/\s/g, '');
          const target = selectedCategory.replace(/\s/g, '');
          if (target === '세탁기/건조기') {
            return (
              cat.includes('세탁기') ||
              cat.includes('건조기') ||
              cat.includes('워시타워') ||
              cat.includes('의류')
            );
          }
          if (target === '가구') {
            return (
              cat.includes('가구') ||
              cat.includes('매트리스') ||
              cat.includes('침대')
            );
          }
          if (target === 'TV') {
            return (
              cat.includes('TV') ||
              cat.includes('시청각') ||
              cat.includes('디지털') ||
              cat.includes('티비')
            );
          }
          return cat.includes(target) || target.includes(cat);
        })();

      if (!matchesCategory) return false;

      if (!q) return true;
      return (
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.model && p.model.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    });
  }, [productsInActiveAccount, selectedCategory, searchQuery]);

  const currentPkgInfo =
    activePackageTab === '전체'
      ? PACKAGE_TIERS['1구좌']
      : PACKAGE_TIERS[activePackageTab];

  // Keep selectedProduct synced with real-time Convex updates
  useEffect(() => {
    if (!selectedProduct) return;
    const latest = allProducts.find((p: any) => p._id === selectedProduct._id);
    if (latest && latest.specifications && latest.specifications.length > 0) {
      setSelectedProduct((prev: any) => {
        if (!prev || prev._id !== latest._id) return prev;
        return {
          ...prev,
          ...latest,
          specifications:
            latest.specifications && latest.specifications.length > 0
              ? latest.specifications
              : prev.specifications,
        };
      });
    }
  }, [allProducts, selectedProduct?._id]);

  // Body scroll lock & Escape / PopState handling for Right-Side Drawer
  useEffect(() => {
    const isOpen = drawerMode !== null;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (drawerRef.current) {
        drawerRef.current.scrollTop = 0;
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerMode, selectedProduct?._id, submittedData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerMode !== null) {
        setDrawerMode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerMode]);

  useEffect(() => {
    const isOpen = drawerMode !== null;
    const handlePopState = () => {
      if (drawerMode !== null) {
        isPopStateCloseRef.current = true;
        setDrawerMode(null);
      }
    };
    if (isOpen) {
      if (!isPopStateCloseRef.current) {
        window.history.pushState({ s299Drawer: true }, '');
      }
      window.addEventListener('popstate', handlePopState);
    } else {
      if (!isPopStateCloseRef.current && window.history.state?.s299Drawer) {
        window.history.back();
      }
      isPopStateCloseRef.current = false;
    }
    return () => window.removeEventListener('popstate', handlePopState);
  }, [drawerMode]);

  // Real-time Spec Scraping Action
  const fetchRealTimeSpecs = async (product: any, force = false) => {
    if (!product || !product.model) return;
    if (
      !force &&
      product.specifications &&
      Array.isArray(product.specifications) &&
      product.specifications.length > 0
    ) {
      return;
    }

    try {
      setIsScrapingSpec(true);
      const scraped = await scrapeProductInfoAction({
        model: product.model.trim(),
        price: String(product.price || '0'),
      });

      if (scraped && scraped.specifications && scraped.specifications.length > 0) {
        const nextImages =
          scraped.thumbnails && scraped.thumbnails.length > 0
            ? scraped.thumbnails
            : product.images;
        const nextDetailImages =
          scraped.detailImages && scraped.detailImages.length > 0
            ? scraped.detailImages
            : product.detailImages;

        setSelectedProduct((prev: any) => {
          if (!prev || prev._id !== product._id) return prev;
          return {
            ...prev,
            specifications: scraped.specifications,
            images:
              prev.images && prev.images.length > 0 ? prev.images : nextImages,
            detailImages:
              prev.detailImages && prev.detailImages.length > 0
                ? prev.detailImages
                : nextDetailImages,
          };
        });

        // Persist scraped specs to DB if product had none
        if (
          product._id &&
          (!product.specifications || product.specifications.length === 0)
        ) {
          try {
            await updateProduct({
              id: product._id,
              specifications: scraped.specifications,
            });
          } catch {
            // Ignore permission/non-critical DB patch errors on public view
          }
        }
      }
    } catch (err) {
      console.warn('실시간 스펙 조회 안내:', err);
    } finally {
      setIsScrapingSpec(false);
    }
  };

  // Drawer Open Helpers
  const openProductDrawer = (product: any) => {
    setSelectedProduct(product);
    setSelectedProductImgIdx(0);
    setDrawerMode('product');
    fetchRealTimeSpecs(product, false);
  };

  const openConsultDrawer = (
    interestText = '전체 혜택 상담',
    accountNum?: number
  ) => {
    setConsultInterest(interestText);
    if (accountNum) {
      setConsultBudget(String(accountNum));
    } else if (activePackageTab !== '전체') {
      setConsultBudget(String(PACKAGE_TIERS[activePackageTab].accountNum));
    } else {
      setConsultBudget(String(planAccounts));
    }
    setSubmittedData(null);
    setDrawerMode('consult');
    setMobileMenuOpen(false);
  };

  const openServiceDrawer = (serviceKey: 'funeral' | 'cruise' | 'wedding') => {
    setSelectedServiceKey(serviceKey);
    setDrawerMode('service');
  };

  const openPrivacyDrawer = () => {
    setDrawerMode('privacy');
  };

  const closeDrawer = () => {
    setDrawerMode(null);
  };

  const handleConsultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultName.trim()) {
      alert('성함을 입력해 주세요.');
      return;
    }
    const cleanPhone = consultPhone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      alert('올바른 연락처를 입력해 주세요.');
      return;
    }
    if (!consultConsent) {
      alert('개인정보 수집·이용에 동의해 주세요.');
      return;
    }

    const accountLabel =
      consultBudget === '추천' ? '추천받기' : `${consultBudget}구좌`;

    setIsSubmitting(true);
    try {
      const detailMsg = [
        `[해피효원 스페셜299(new) 상담신청]`,
        `희망 가전·상담: ${consultInterest}`,
        `사용 목적: ${consultPurpose}`,
        `희망 구좌: ${accountLabel}`,
        `상담 희망 시간: ${consultTime}`,
        consultMessage.trim() ? `문의 내용: ${consultMessage.trim()}` : '',
        `유입경로: ${landingInfo?.name || landingPath}`,
      ]
        .filter(Boolean)
        .join('\n');

      await createInquiry({
        name: consultName.trim(),
        phone: consultPhone.trim(),
        productName: `해피효원 스페셜299(new) (${accountLabel})`,
        account: accountLabel,
        appliance: consultInterest,
        callTime: consultTime,
        landingPath,
        channelId: channel?.subdomain || channelSubdomain,
        message: detailMsg,
      });

      setSubmittedData({
        name: consultName.trim(),
        phone: consultPhone.trim(),
        interest: consultInterest,
        purpose: consultPurpose,
        budget: accountLabel,
        time: consultTime,
        message: consultMessage.trim() || '없음',
      });
    } catch (err) {
      console.error('Consult submit error:', err);
      alert('상담 신청 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentScenario = SCENARIOS[scenarioIdx] || SCENARIOS[0];
  const won = (val: number) => (val * planAccounts).toLocaleString('ko-KR') + '원';

  return (
    <div className="s299-page-wrapper">
      <SEO
        title={
          landingInfo?.name
            ? `${landingInfo.name} | 오늘의 가전, 내일의 든든함`
            : '해피효원라이프 스페셜299 | 오늘의 가전, 내일의 든든함'
        }
        description={
          landingInfo?.description ||
          '원하는 가전과 효원상조의 라이프서비스를 함께. 해피효원라이프 스페셜299의 가전 구성, 구좌별 납입금과 만기 환급 조건을 확인하세요.'
        }
        image={landingInfo?.thumbnail || '/special299/hero.webp'}
      />

      <a className="skip" href="#main">
        본문으로 바로가기
      </a>

      {/* Top Announcement */}
      <div className="announcement">
        오늘의 생활에 더하는, 내일의 든든함 <span>HAPPY HYOWON LIFE</span>
      </div>

      {/* Header */}
      <header className="header">
        <div className="nav wrap">
          <a
            className="brand"
            href="#"
            aria-label="효원상조 스페셜299 홈"
          >
            <img src="/special299/logo.png" alt="효원상조" />
            <span className="brand-divider"></span>
            <span>해피효원라이프</span>
          </a>

          <nav className="desktop-nav" aria-label="주요 메뉴">
            <a href="#benefits">상품 소개</a>
            <a href="#appliances">가전 선택</a>
            <a href="#plan">납입 안내</a>
            <a href="#life">라이프서비스</a>
            <a href="#faq">자주 묻는 질문</a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {channel?.channelName && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: '#eaf0e6',
                  color: '#214d3e',
                  padding: '4px 9px',
                  borderRadius: '4px',
                }}
              >
                {channel.channelName}
              </span>
            )}
            <button
              type="button"
              className="btn small"
              onClick={() => openConsultDrawer('전체 혜택 상담')}
            >
              맞춤 상담 <span>↗</span>
            </button>
            <button
              type="button"
              className="menu-btn"
              aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? '×' : '☰'}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="mobile-nav" aria-label="모바일 메뉴">
            <a href="#benefits" onClick={() => setMobileMenuOpen(false)}>
              상품 소개
            </a>
            <a href="#appliances" onClick={() => setMobileMenuOpen(false)}>
              가전 선택
            </a>
            <a href="#plan" onClick={() => setMobileMenuOpen(false)}>
              납입 안내
            </a>
            <a href="#life" onClick={() => setMobileMenuOpen(false)}>
              라이프서비스
            </a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>
              자주 묻는 질문
            </a>
          </nav>
        )}
      </header>

      {/* Main */}
      <main id="main">
        {/* Hero Section */}
        <section className="hero wrap">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="green-dot"></span> 해피효원라이프 스페셜299
            </div>
            <h1>
              가전은 지금,
              <br />
              <em>든든함은 오래.</em>
            </h1>
            <p className="hero-description">
              바꾸고 싶었던 가전부터
              <br />
              가족을 위한 내일의 준비까지.
              <br className="mobile-only" /> 한 번의 선택으로 함께하세요.
            </p>
            <div className="hero-price">
              <span>1구좌 기준 월</span>
              <strong>
                29,900<small>원</small>
              </strong>
            </div>
            <p className="fine">
              200회 납입 · 총 5,980,000원
              <br />
              1~60회 가전 렌탈료·상조부금 포함 / 61~200회 상조부금
            </p>
            <div className="hero-actions">
              <a href="#appliances" className="btn">
                내게 맞는 가전 찾기 <span>↗</span>
              </a>
              <button
                type="button"
                className="text-button"
                onClick={() => openConsultDrawer('무료 맞춤 상담')}
              >
                무료 상담받기 <span>→</span>
              </button>
            </div>
            <div className="hero-tags">
              <span>
                <i>✓</i> 원하는 가전 상담
              </span>
              <span>
                <i>✓</i> 라이프서비스 전환
              </span>
              <span>
                <i>✓</i> 만기 환급 혜택
              </span>
            </div>
          </div>

          <div className="hero-visual">
            <img
              className="hero-photo"
              src="/special299/hero.webp"
              alt="냉장고와 세탁건조기, TV가 놓인 따뜻한 생활공간 연출 이미지"
            />
            <div className="visual-label">
              <span>THE SPECIAL LIFE</span>
              <strong>
                좋은 가전으로 시작하는
                <br />
                우리 집의 새로운 일상
              </strong>
            </div>
            <div className="hero-stamp">
              <span>HAPPY LIFE</span>
              <strong>299</strong>
              <span>WITH HYOWON</span>
            </div>
            <span className="image-caption">
              가전 구성 이해를 돕기 위한 연출 이미지
            </span>
          </div>
        </section>

        {/* Highlights Strip */}
        <div className="highlights wrap">
          <div>
            <span className="highlight-index">01</span>
            <p>
              오늘 필요한 가전
              <small>우리 집에 맞게 골라서</small>
            </p>
            <span className="highlight-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <path d="M5 10h14M8 6v2M8 13v3" />
              </svg>
            </span>
          </div>
          <div>
            <span className="highlight-index">02</span>
            <p>
              내일을 위한 준비
              <small>상조·라이프서비스로 든든하게</small>
            </p>
            <span className="highlight-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
              </svg>
            </span>
          </div>
          <div>
            <span className="highlight-index">03</span>
            <p>
              만기에는 환급 혜택
              <small>200회 완납 등 약정 조건 충족 시</small>
            </p>
            <span className="highlight-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 8a9 9 0 1 1-1 8M4 3v5h5" />
                <path d="M12 7v5l3 2" />
              </svg>
            </span>
          </div>
        </div>

        {/* Benefits / Introduction Section */}
        <section id="benefits" className="section wrap introduction">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A BETTER CHOICE</span>
              <h2>
                가전을 고를 때,
                <br />
                그다음까지 생각한다면.
              </h2>
            </div>
            <p>
              원하는 제품도 중요하지만,
              <br />
              매달 내는 금액과 계약 이후의 혜택도 중요하니까요.
            </p>
          </div>

          <div className="question-strip">
            <div>
              <b>01</b>
              <h3>월 납입금은?</h3>
              <p>매달 부담과 전체 납입 총액</p>
            </div>
            <div>
              <b>02</b>
              <h3>만기 혜택은?</h3>
              <p>환급 금액과 적용 조건</p>
            </div>
            <div>
              <b>03</b>
              <h3>해지할 때는?</h3>
              <p>상조 환급금과 가전 잔여금</p>
            </div>
            <div>
              <b>04</b>
              <h3>가전 선택은?</h3>
              <p>원하는 종류와 실제 모델</p>
            </div>
            <div>
              <b>05</b>
              <h3>생활 혜택은?</h3>
              <p>전환서비스와 회원 혜택</p>
            </div>
          </div>

          <div className="intro-banner">
            <div className="intro-message">
              <span className="eyebrow">가전 + 상조 + 라이프서비스</span>
              <h3>
                오늘 누리고,
                <br />
                <em>내일도 준비하는 선택.</em>
              </h3>
              <p>
                스페셜299는 가전 렌탈과 상조서비스를 결합한 상품입니다.
                <br />각 계약의 납입 조건을 확인하고, 나에게 맞는 구성을 선택하세요.
              </p>
              <a href="#plan" className="text-button">
                결합 구조 자세히 보기 <span>↗</span>
              </a>
            </div>
            <img
              src="/special299/appliances.png"
              alt="냉장고, 세탁건조기, 안마의자와 노트북 등 가전 종류 예시"
              loading="lazy"
            />
          </div>
        </section>

        {/* Appliances Section (어드민 60패키지 싱글/더블/트리플/쿼드 연동 + 구좌별 금액 간략 표시 + 카테고리 구분) */}
        <section id="appliances" className="section products-section">
          <div className="wrap">
            <div className="section-heading">
              <div>
                <span className="eyebrow">FIND YOUR APPLIANCE</span>
                <h2>
                  어떤 가전이
                  <br className="mobile-only" /> 필요하세요?
                </h2>
              </div>
              <p>
                우리 집에 필요한 가전부터 골라보세요.
                <br />
                선택 제품에 맞는 구좌와 납입 조건을 안내해드립니다.
              </p>
            </div>

            {/* 구좌별 패키지 선택 + 구좌별 금액(간략) 안내 (https://hyowon-life.com/package60 스타일) */}
            <div className="s299-pkg-selector-box">
              <div className="s299-pkg-selector-header">
                <div className="s299-pkg-selector-title">
                  <span>SELECT YOUR PACKAGE</span>
                  <h3>원하시는 구좌 패키지를 선택하세요</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePackageTab('전체')}
                  className={`s299-pkg-summary-btn ${
                    activePackageTab === '전체' ? 'active' : ''
                  }`}
                  style={
                    activePackageTab === '전체'
                      ? {
                          background: '#214d3e',
                          color: '#fff',
                          borderColor: '#214d3e',
                        }
                      : undefined
                  }
                >
                  전체 구좌 한번에 보기 ({package60Products.length})
                </button>
              </div>

              <div className="s299-pkg-tabs-grid">
                {ALL_ACCOUNT_KEYS.map((pkgKey) => {
                  const tier = PACKAGE_TIERS[pkgKey];
                  const isActive = activePackageTab === pkgKey;
                  const count = accountCountsMap[pkgKey] || 0;
                  return (
                    <button
                      key={pkgKey}
                      type="button"
                      onClick={() => setActivePackageTab(pkgKey)}
                      className={`s299-pkg-tab-card ${isActive ? 'active' : ''}`}
                    >
                      {isActive && (
                        <div className="s299-pkg-selected-badge">선택됨</div>
                      )}
                      <div>
                        <div className="s299-pkg-tab-top">
                          <span className="s299-pkg-tab-name">
                            {tier.shortName}
                          </span>
                          <span className="s299-pkg-tab-count">{count}종</span>
                        </div>
                        <div className="s299-pkg-tab-price">
                          월 {tier.monthlyPrice}원
                        </div>
                      </div>
                      <div className="s299-pkg-tab-foot">
                        <strong>{tier.tabSubtext}</strong>
                        <span>60회 납입</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 선택된 구좌별 금액(간략) 요약 배너 */}
              <div className="s299-pkg-summary-banner">
                <div className="s299-pkg-summary-left">
                  <div className="s299-pkg-summary-badges">
                    <span className="s299-pkg-summary-tag">
                      {activePackageTab === '전체'
                        ? '전체 구좌 (1구좌 기준 안내)'
                        : `${currentPkgInfo.name} 가격 상세 구성`}
                    </span>
                    <span className="s299-pkg-summary-monthly">
                      월 {currentPkgInfo.monthlyPrice}원 × 60회
                    </span>
                  </div>
                  <p className="s299-pkg-summary-desc">
                    가전렌탈료 <strong>{currentPkgInfo.rentalPrice}원</strong> +
                    상조부금 <strong>{currentPkgInfo.sangjoPrice}원</strong> (1~60회)
                    {' | '}상조 61~200회차 유지 시 월{' '}
                    <strong>{currentPkgInfo.extendPrice}원</strong> (총 200회 만기 시
                    100% 환급)
                  </p>
                </div>

                <div className="s299-pkg-summary-actions">
                  <a href="#plan" className="s299-pkg-summary-btn">
                    구좌별 납입 조건 더보기 ↓
                  </a>
                </div>
              </div>
            </div>

            {/* 카테고리 탭 & 검색창 */}
            <div className="product-toolbar">
              <div
                className="category-tabs"
                role="group"
                aria-label="가전 종류 필터"
              >
                {categoryOptions.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={selectedCategory === cat ? 'active' : ''}
                    aria-pressed={selectedCategory === cat}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <label className="search-box">
                <span aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="10.5" cy="10.5" r="6.5" />
                    <path d="m16 16 5 5" />
                  </svg>
                </span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="제품명·모델명·브랜드 검색"
                  aria-label="원하는 가전 검색"
                />
              </label>
            </div>

            <div className="product-meta">
              <span>
                {activePackageTab === '전체'
                  ? '전체 구좌 가전 '
                  : `${PACKAGE_TIERS[activePackageTab].shortName} 가전 `}
                <b>{filteredProducts.length}</b>가지
              </span>
              <span>
                제품을 클릭하시면 우측 전체 패널에서 실시간 세부 스펙과 구좌별 조건을 확인하실 수 있습니다.
              </span>
            </div>

            {/* 가전제품 리스트 그리드 (전체 제품 표시) */}
            {filteredProducts.length === 0 ? (
              <div className="empty-state">
                <p>
                  선택하신 조건({activePackageTab} · {selectedCategory})에 해당하는
                  가전이 없습니다.
                  <br />
                  다른 구좌나 카테고리를 선택하시거나 맞춤 상담을 이용해 주세요.
                </p>
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map((p: any) => {
                  const pAccountKey = getProductAccountKey(p);
                  const pkg = PACKAGE_TIERS[pAccountKey] || PACKAGE_TIERS['1구좌'];
                  const rawImg =
                    p.image ||
                    (Array.isArray(p.images) && p.images[0]) ||
                    '/special299/fridge.jpg';
                  const mainImg = getOptimizedImageUrl(rawImg, 'modal');

                  return (
                    <article key={p._id} className="product-card">
                      <div
                        className="product-picture"
                        onClick={() => openProductDrawer(p)}
                      >
                        <span className="product-tag">
                          {p.category || 'SPECIAL 299'}
                        </span>
                        <span className="s299-product-account-tag">
                          {pkg.badgeLabel}
                        </span>
                        <img
                          src={mainImg}
                          alt={p.name}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          decoding="async"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/special299/fridge.jpg';
                          }}
                        />
                      </div>

                      <div className="product-card-copy">
                        {p.giftText && (
                          <div className="s299-product-gift-badge">
                            <Gift size={12} className="shrink-0" />
                            <span>사은품: {p.giftText}</span>
                          </div>
                        )}

                        <span className="product-brand">
                          {p.brand || 'LG전자'} {p.model || ''}
                        </span>
                        <h3
                          onClick={() => openProductDrawer(p)}
                          title={p.name}
                        >
                          {p.name}
                        </h3>

                        {/* 구좌별 금액(간략) 박스 */}
                        <div className="s299-card-price-box">
                          <div className="s299-card-price-main">
                            <span className="s299-card-price-label">
                              월 납입금
                            </span>
                            <span className="s299-card-price-val">
                              월 {pkg.monthlyPrice}원<small>(60회)</small>
                            </span>
                          </div>
                          <div className="s299-card-price-sub">
                            <div>
                              <span>가전 렌탈료</span>
                              <strong>{pkg.rentalPrice}원</strong>
                            </div>
                            <div>
                              <span>상조 부금</span>
                              <strong>{pkg.sangjoPrice}원</strong>
                            </div>
                          </div>
                        </div>

                        <div className="s299-card-benefits-mini">
                          <div>
                            <i>✓</i>
                            <span>60회 납입 후 가전 완전 소유</span>
                          </div>
                          <div>
                            <i>✓</i>
                            <span>상조 만기 시 렌탈료 100% 환급</span>
                          </div>
                        </div>

                        <div className="s299-card-actions">
                          <button
                            type="button"
                            className="s299-card-btn-spec"
                            onClick={() => openProductDrawer(p)}
                          >
                            상세 스펙 보기
                          </button>
                          <button
                            type="button"
                            className="s299-card-btn-consult"
                            onClick={() =>
                              openConsultDrawer(
                                `[${pkg.key}] ${p.name} (${p.model || ''})`,
                                pkg.accountNum
                              )
                            }
                          >
                            상담 신청 ↗
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="product-bottom">
              <p>
                찾으시는 제품이 없나요?
                <br />
                <strong>모델명이나 원하는 구성을 알려주세요.</strong>
              </p>
              <button
                type="button"
                className="btn outline"
                onClick={() => openConsultDrawer('원하는 모델·패키지 상담')}
              >
                맞춤 가전 문의하기 <span>↗</span>
              </button>
            </div>
          </div>
        </section>

        {/* Scenarios Section */}
        <section className="section wrap scenarios">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FOR YOUR LIFE</span>
              <h2>
                당신의 새로운 일상에,
                <br />
                스페셜299.
              </h2>
            </div>
            <p>
              살림의 시작부터 부모님을 위한 선물까지.
              <br />
              생활이 달라지는 순간에 함께합니다.
            </p>
          </div>

          <div className="scenario-tabs" role="tablist" aria-label="추천 대상">
            {[
              '신혼·새로운 입주',
              '가전 교체',
              '부모님 선물',
              '매장·사무실',
              '가족의 특별한 날',
            ].map((tabLabel, idx) => (
              <button
                key={tabLabel}
                type="button"
                role="tab"
                aria-selected={scenarioIdx === idx}
                className={scenarioIdx === idx ? 'active' : ''}
                onClick={() => setScenarioIdx(idx)}
              >
                {tabLabel}
              </button>
            ))}
          </div>

          <div className="scenario-panel" role="tabpanel">
            <div className="scenario-art">
              <img
                src={currentScenario.image}
                alt={currentScenario.alt}
                loading="lazy"
                style={{
                  objectFit: scenarioIdx === 2 ? 'contain' : 'cover',
                  background: scenarioIdx === 2 ? '#fff' : undefined,
                }}
              />
              <span
                style={{
                  color: scenarioIdx === 2 ? '#214d3e' : undefined,
                }}
              >
                {currentScenario.caption}
              </span>
            </div>
            <div className="scenario-copy">
              <span className="eyebrow">{currentScenario.kicker}</span>
              <h3>
                {currentScenario.title.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <br />}
                    {line}
                  </React.Fragment>
                ))}
              </h3>
              <p>{currentScenario.description}</p>
              <ul>
                {currentScenario.points.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
              <button
                type="button"
                className="text-button"
                onClick={() => openConsultDrawer(currentScenario.interest)}
              >
                우리 가족 맞춤 상담 <span>↗</span>
              </button>
            </div>
          </div>
        </section>

        {/* Plan Section */}
        <section id="plan" className="section plan-section">
          <div className="wrap">
            <div className="section-heading">
              <div>
                <span className="eyebrow">SIMPLE & CLEAR</span>
                <h2>
                  혜택만큼 중요한 조건,
                  <br />
                  한눈에 확인하세요.
                </h2>
              </div>
              <p>
                구좌 수를 선택하면
                <br />
                매달 내는 금액과 전체 납입금이 함께 바뀝니다.
              </p>
            </div>

            <div className="plan-layout">
              <div className="plan-card">
                <div className="plan-card-top">
                  <span>HAPPY HYOWON LIFE</span>
                  <span className="pill">가전결합</span>
                </div>
                <h3>
                  해피효원라이프
                  <br />
                  스페셜<span>299</span>
                </h3>
                <div
                  className="account-tabs"
                  role="group"
                  aria-label="가입 구좌 선택"
                >
                  {([1, 2, 3, 4] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={planAccounts === n ? 'active' : ''}
                      aria-pressed={planAccounts === n}
                      onClick={() => setPlanAccounts(n)}
                    >
                      {n}구좌
                    </button>
                  ))}
                </div>
                <div className="plan-price">
                  <span>월 납입금</span>
                  <strong>
                    {(29900 * planAccounts).toLocaleString('ko-KR')}
                    <small>원</small>
                  </strong>
                </div>
                <div className="plan-total">
                  <span>200회 총 납입금</span>
                  <b>{won(5980000)}</b>
                </div>
                <button
                  type="button"
                  className="btn light"
                  onClick={() =>
                    openConsultDrawer('납입·환급 조건 상담', planAccounts)
                  }
                >
                  이 조건으로 상담받기 <span>↗</span>
                </button>
                <p>
                  제휴카드 할인 미적용 기준
                  <br />
                  선택 가전과 가입 조건에 따라 필요 구좌가 달라집니다.
                </p>
              </div>

              <div className="payment-details">
                <h3>
                  월 납입금은 같아도,
                  <br />
                  구성은 이렇게 달라집니다.
                </h3>
                <div className="payment-step">
                  <span className="step-dot"></span>
                  <div>
                    <span className="pill pale">1~60회</span>
                    <h4>가전 렌탈료 + 상조부금</h4>
                    <div className="payment-split">
                      <p>
                        가전 렌탈료<b>{won(26910)}</b>
                      </p>
                      <span>+</span>
                      <p>
                        상조부금<b>{won(2990)}</b>
                      </p>
                    </div>
                    <p className="fine">각 계약의 납입금이 구분됩니다.</p>
                  </div>
                </div>
                <div className="payment-step">
                  <span className="step-dot"></span>
                  <div>
                    <span className="pill pale">61~200회</span>
                    <h4>상조부금으로 납입</h4>
                    <div className="payment-split">
                      <p>
                        월 상조부금<b>{won(29900)}</b>
                      </p>
                    </div>
                    <p className="fine">
                      가전 렌탈 납입 종료 후 상조 계약을 이어갑니다.
                    </p>
                  </div>
                </div>
                <div className="payment-notice">
                  <span aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 11v6M12 7h.01" />
                    </svg>
                  </span>
                  <p>
                    200회는 상조를 포함한 전체 납입기간입니다. 가전 렌탈기간과
                    구분해 확인해 주세요.
                  </p>
                </div>
              </div>
            </div>

            <div className="compare-table-wrap">
              <h3>일반 가전 렌탈과 무엇이 다를까요?</h3>
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>확인 항목</th>
                    <th>일반 가전 렌탈</th>
                    <th>스페셜299 가전결합</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>계약 구성</th>
                    <td>가전 렌탈 계약</td>
                    <td>가전 렌탈 + 상조 계약</td>
                  </tr>
                  <tr>
                    <th>납입 확인</th>
                    <td>제품별 렌탈료·약정기간</td>
                    <td>가전료·상조부금·전체 납입금</td>
                  </tr>
                  <tr>
                    <th>만기 혜택</th>
                    <td>소유권 이전 등 제품별 조건</td>
                    <td>200회 완납 등 조건 충족 시 환급</td>
                  </tr>
                  <tr>
                    <th>중도해지</th>
                    <td>렌탈 약정에 따라 정산</td>
                    <td>상조 해약환급금·가전 잔여금 별도 확인</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Refund Section */}
        <section className="refund-section">
          <div className="wrap refund-layout">
            <div>
              <span className="eyebrow">LONG-TERM VALUE</span>
              <h2>
                오래 준비한 마음에,
                <br />
                돌아오는 혜택까지.
              </h2>
              <p>
                상조서비스를 이용하지 않고 만기까지 유지했다면,
                <br />
                약정 조건에 따라 납입금 전액 환급을 신청할 수 있습니다.
              </p>
              <a href="#faq" className="text-button">
                환급 조건 자세히 확인하기 <span>↗</span>
              </a>
            </div>
            <div className="refund-number">
              <span>만기 환급</span>
              <strong>
                100<small>%</small>
              </strong>
              <p>
                200회 완납 · 상조서비스 미사용
                <br />
                약정된 해약·환급 조건 충족 시
              </p>
            </div>
          </div>
          <div className="wrap refund-footnote">
            중도해약은 만기 환급과 다릅니다. 상조 해약환급금과 가전 잔여금이 각각
            정산되며, 납입금보다 환급금이 적거나 추가 부담이 발생할 수 있습니다.
            서비스 이용과 환급은 중복 적용되지 않습니다.
          </div>
        </section>

        {/* Life Services Section */}
        <section id="life" className="section wrap life-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">LIFE, WITH MORE POSSIBILITIES</span>
              <h2>
                삶의 중요한 순간에도
                <br />
                함께할 수 있도록.
              </h2>
            </div>
            <p>
              장례를 위한 준비에서
              <br />
              크루즈와 웨딩 등 라이프서비스 전환까지.
            </p>
          </div>

          <div className="life-grid">
            <article className="life-card">
              <div className="life-photo">
                <img
                  src="/special299/funeral.webp"
                  alt="흰 국화와 촛불이 놓인 추모 공간 연출 이미지"
                  loading="lazy"
                />
                <span>01 / FUNERAL</span>
              </div>
              <h3>마음을 다하는 장례서비스</h3>
              <p>
                소중한 가족을 배웅하는 시간.
                <br />
                효원상조의 장례서비스를 준비합니다.
              </p>
              <button
                type="button"
                className="text-button"
                onClick={() => openServiceDrawer('funeral')}
              >
                서비스 살펴보기 <span>↗</span>
              </button>
            </article>

            <article className="life-card">
              <div className="life-photo">
                <img
                  src="/special299/cruise.webp"
                  alt="지중해를 항해하는 크루즈 연출 이미지"
                  loading="lazy"
                />
                <span>02 / CRUISE</span>
              </div>
              <h3>새로운 추억이 되는 크루즈</h3>
              <p>
                가족과 함께 떠나는 특별한 여행.
                <br />
                크루즈 전환서비스를 확인해 보세요.
              </p>
              <button
                type="button"
                className="text-button"
                onClick={() => openServiceDrawer('cruise')}
              >
                서비스 살펴보기 <span>↗</span>
              </button>
            </article>

            <article className="life-card">
              <div className="life-photo">
                <img
                  src="/special299/wedding.webp"
                  alt="정원에서 함께 웃는 신랑 신부 연출 이미지"
                  loading="lazy"
                />
                <span>03 / WEDDING</span>
              </div>
              <h3>빛나는 시작을 위한 웨딩</h3>
              <p>
                두 사람의 새로운 출발.
                <br />
                웨딩 전환서비스와 함께 준비하세요.
              </p>
              <button
                type="button"
                className="text-button"
                onClick={() => openServiceDrawer('wedding')}
              >
                서비스 살펴보기 <span>↗</span>
              </button>
            </article>
          </div>

          <p className="fine life-note">
            서비스 이미지는 연출 예시입니다. 전환 가능 상품, 제공 범위, 이용 시점
            및 추가 비용은 가입 상품의 약관과 이용 조건에 따라 달라집니다.
          </p>

          <div className="membership-line">
            <span aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="8" width="18" height="4" rx="1" />
                <path d="M5 12v9h14v-9M12 8v13" />
                <path d="M12 8H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z" />
              </svg>
            </span>
            <div>
              <h3>일상에서 누리는 회원 혜택도 확인하세요.</h3>
              <p>
                회원 전용 복지몰, 컨시어지 등 효원상조의 부가서비스를 안내합니다.
              </p>
            </div>
            <a
              href="https://hwsj.co.kr/2013/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-button"
            >
              공식 서비스 안내 <span>↗</span>
            </a>
          </div>
        </section>

        {/* Company Section */}
        <section className="company-section">
          <div className="wrap company-layout">
            <div>
              <span className="eyebrow">WITH HYOWON</span>
              <h2>
                가족을 위한 준비,
                <br />
                함께하는 회사를
                <br />
                먼저 확인하세요.
              </h2>
              <a
                href="https://hwsj.co.kr/2013/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-button"
              >
                효원상조 공식 홈페이지 <span>↗</span>
              </a>
            </div>
            <div className="company-info">
              <img src="/special299/logo.png" alt="효원상조" loading="lazy" />
              <p>
                상조서비스는 <strong>(주)효원상조</strong>가 제공합니다.
                <br />
                가전의 공급·렌탈은 별도 계약 조건에 따라 진행됩니다.
              </p>
              <div className="company-facts">
                <p>
                  <span>선불식할부거래업 등록</span>
                  <b>서울-2010-제28</b>
                </p>
                <p>
                  <span>고객센터</span>
                  <a href="tel:15888873">1588-8873</a>
                </p>
                <p>
                  <span>24시간 장례접수</span>
                  <a href="tel:15778873">1577-8873</a>
                </p>
              </div>
              <p className="fine">
                상담·판매 안내: (주)라이프앤조이
                <br />
                상조 계약과 가전 계약의 제공 주체·납입·해지 조건을 각각 안내합니다.
              </p>
            </div>
          </div>
        </section>

        {/* Check Section */}
        <section className="section wrap check-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">BEFORE YOU START</span>
              <h2>
                가입 전, 이 여덟 가지는
                <br />
                함께 확인할게요.
              </h2>
            </div>
            <p>
              혜택을 충분히 이해하고
              <br />
              내게 맞는 선택을 할 수 있도록.
            </p>
          </div>
          <div className="check-grid">
            <article>
              <span>01</span>
              <h3>월 납입금</h3>
              <p>기간별로 내는 금액</p>
            </article>
            <article>
              <span>02</span>
              <h3>총 납입금</h3>
              <p>전체 기간의 부담 총액</p>
            </article>
            <article>
              <span>03</span>
              <h3>제공 가전</h3>
              <p>모델·규격·설치 조건</p>
            </article>
            <article>
              <span>04</span>
              <h3>만기 환급</h3>
              <p>환급 대상·시점·신청 방법</p>
            </article>
            <article>
              <span>05</span>
              <h3>중도해약</h3>
              <p>해약환급금·가전 잔여금</p>
            </article>
            <article>
              <span>06</span>
              <h3>부가 혜택</h3>
              <p>이용 대상·기간·별도 비용</p>
            </article>
            <article>
              <span>07</span>
              <h3>서비스 구성</h3>
              <p>장례·전환서비스 제공 범위</p>
            </article>
            <article>
              <span>08</span>
              <h3>계약 주체</h3>
              <p>상조회사·렌탈 제공사 역할</p>
            </article>
          </div>
        </section>

        {/* Steps Section */}
        <section className="steps-section">
          <div className="wrap">
            <span className="eyebrow">EASY TO START</span>
            <h2>
              고르고, 확인하고,
              <br className="mobile-only" /> 충분히 이해한 후 결정하세요.
            </h2>
            <ol className="steps">
              <li>
                <b>01</b>
                <h3>희망 가전 선택</h3>
                <p>필요한 제품 고르기</p>
              </li>
              <li>
                <b>02</b>
                <h3>맞춤 상담</h3>
                <p>모델·구좌·납입 안내</p>
              </li>
              <li>
                <b>03</b>
                <h3>조건 확인</h3>
                <p>혜택·해지·환급 확인</p>
              </li>
              <li>
                <b>04</b>
                <h3>가입 결정</h3>
                <p>계약 설명·본인 확인</p>
              </li>
              <li>
                <b>05</b>
                <h3>배송·이용</h3>
                <p>설치 일정 개별 안내</p>
              </li>
            </ol>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="section wrap faq-layout">
          <div>
            <span className="eyebrow">QUESTIONS & ANSWERS</span>
            <h2>
              궁금한 점을
              <br />
              먼저 살펴보세요.
            </h2>
            <p>
              더 궁금한 내용은
              <br />
              맞춤 상담으로 자세히 안내해드릴게요.
            </p>
            <button
              type="button"
              className="text-button"
              onClick={() => openConsultDrawer('상품 조건 문의')}
            >
              상담으로 물어보기 <span>↗</span>
            </button>
          </div>

          <div className="faq-list">
            <details open>
              <summary>스페셜299는 어떤 상품인가요?</summary>
              <p>
                가전 렌탈과 효원상조의 상조서비스를 함께 준비하는 결합상품입니다.
                1구좌 기준 월 29,900원씩 200회, 총 5,980,000원을 납입하며 1~60회와
                61~200회의 납입 구성이 다릅니다. 원하는 가전에 따라 필요한 구좌 수를
                안내받으실 수 있습니다.
              </p>
            </details>
            <details>
              <summary>가전을 받으면 별도 렌탈료가 추가되나요?</summary>
              <p>
                안내된 기본 구성의 1~60회 월 납입금에는 가전 렌탈료와 상조부금이
                함께 포함됩니다. 선택 모델, 추가 옵션, 설치 환경에 따른 별도 비용
                여부와 실제 청구 방식은 계약 전에 확인해 주세요.
              </p>
            </details>
            <details>
              <summary>만기 환급은 언제, 어떻게 받나요?</summary>
              <p>
                200회 완납 및 상조서비스 미사용 등 상품의 약정 조건을 충족하고
                해약·환급을 신청하는 경우 납입금 전액 환급 조건이 적용됩니다. 자동
                환급 여부, 신청 가능 시점과 지급 일정은 가입 시 제공되는 계약서와
                약관으로 확인해야 합니다. 서비스 이용과 만기 환급은 중복 적용되지
                않습니다.
              </p>
            </details>
            <details>
              <summary>중간에 해약하면 어떻게 되나요?</summary>
              <p>
                중도해약 시에는 상조 해약환급금과 가전 렌탈 계약의 잔여 대금·해지
                조건을 각각 적용합니다. 만기 100% 환급 조건이 적용되지 않으며,
                납입금보다 환급금이 적거나 추가 부담이 발생할 수 있습니다.
              </p>
            </details>
            <details>
              <summary>원하는 가전 모델이나 브랜드를 선택할 수 있나요?</summary>
              <p>
                어드민에 등록된 1~4구좌(싱글·더블·트리플·쿼드) 60패키지 라인업에서
                원하는 모델을 직접 선택하실 수 있으며, 희망 모델·브랜드·규격을
                알려주시면 현재 공급 가능 여부와 필요한 구좌 수를 확인해드립니다.
              </p>
            </details>
            <details>
              <summary>상조 대신 크루즈나 웨딩으로 이용할 수 있나요?</summary>
              <p>
                효원상조는 크루즈, 웨딩 등 전환서비스를 안내하고 있습니다.
                스페셜299의 전환 적용 여부, 납입금 정산 방식, 상품별 차액과 추가
                비용은 이용 전 확인이 필요합니다.
              </p>
            </details>
            <details>
              <summary>제휴카드 할인이 있나요?</summary>
              <p>
                제휴카드 혜택은 카드 종류, 전월 이용 실적, 자동이체 및 할인
                적용기간에 따라 달라질 수 있습니다. 이 페이지의 납입금은 카드 할인을
                적용하지 않은 금액이며, 상담 시 적용 가능한 카드의 최신 조건을
                별도로 확인합니다.
              </p>
            </details>
          </div>
        </section>

        {/* Consult Section */}
        <section id="consult" className="consult-section">
          <div className="wrap consult-layout">
            <div>
              <span className="eyebrow">YOUR SPECIAL LIFE STARTS HERE</span>
              <h2>
                우리 집에 맞는 가전,
                <br />
                함께 찾아드릴게요.
              </h2>
              <p>
                필요한 가전과 궁금한 점만 알려주세요.
                <br />
                제품 선택부터 납입 조건까지 차근차근 안내합니다.
              </p>
              <a className="contact-phone" href="tel:16448399">
                <span aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 16.5v3a2 2 0 0 1-2.2 2A18 18 0 0 1 2.5 5.2 2 2 0 0 1 4.5 3h3a1 1 0 0 1 1 .9l.5 3a1 1 0 0 1-.4 1l-2 1.5a14 14 0 0 0 7 7l1.5-2a1 1 0 0 1 1-.4l3 .5a1 1 0 0 1 .9 1Z" />
                  </svg>
                </span>
                1644-8399
              </a>
              <span className="fine">라이프앤조이 상품 상담</span>
            </div>

            <div className="quick-form">
              <span className="form-kicker">간편 맞춤 상담</span>
              <h3>어떤 가전을 찾고 계세요?</h3>
              <div className="interest-options">
                {[
                  '냉장고',
                  '세탁·건조기',
                  'TV·디지털',
                  '안마의자',
                  '주방·생활가전',
                  '패키지·기타',
                ].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={quickInterest === opt ? 'active' : ''}
                    aria-pressed={quickInterest === opt}
                    onClick={() => setQuickInterest(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => openConsultDrawer(`${quickInterest} 맞춤 상담`)}
              >
                맞춤 상담 정보 입력 <span>↗</span>
              </button>
              <p className="fine">
                간편 입력 후 전문 상담사가 친절하게 안내해 드립니다.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer>
        <div className="wrap">
          <div className="footer-top">
            <div>
              <img src="/special299/logo.png" alt="효원상조" loading="lazy" />
              <span>해피효원라이프 스페셜299</span>
            </div>
            <button
              type="button"
              className="text-button"
              onClick={openPrivacyDrawer}
            >
              개인정보 수집·이용 안내
            </button>
            <a className="text-button" href="#">
              맨 위로 ↑
            </a>
          </div>
          <div className="footer-details">
            <div>
              <b>상담·판매 안내 | (주)라이프앤조이</b>
              <p>
                대표: 김지훈 · 사업자등록번호: 388-86-02921
                <br />
                통신판매신고번호: 2024-경기하남-1853호
                <br />
                이메일: lifenjoy0296@gmail.com
              </p>
            </div>
            <div>
              <b>상조서비스 제공 | (주)효원상조</b>
              <p>
                대표이사: 이선주 · 사업자등록번호: 126-81-81624
                <br />
                서울시 강동구 풍성로 38길 9, 바로빌딩 3층
                <br />
                고객센터 1588-8873 · 장례접수 1577-8873
              </p>
            </div>
          </div>
          <p className="footer-note">
            상품 조건은 가입 시 제공되는 설명서·계약서·약관을 기준으로 확인해
            주세요. 가전 공급·렌탈 조건은 상조 계약과 구분됩니다.
          </p>
          <div className="footer-bottom">
            <span>© 2026 LIFE&JOY. All rights reserved.</span>
            <span>HAPPY HYOWON LIFE</span>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Bar */}
      <div className="mobile-bottom">
        <div>
          <small>스페셜299 · 1구좌 기준</small>
          <strong>월 29,900원</strong>
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => openConsultDrawer('전체 혜택 상담')}
        >
          맞춤 상담 <span>↗</span>
        </button>
      </div>

      {/* Right-Side Full-Height Drawer (우측 영역 전체 패널: 상품 상세+실시간 스펙 / 상담 신청 / 라이프서비스 / 개인정보) */}
      {drawerMode !== null && (
        <div
          className="s299-drawer-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDrawer();
          }}
        >
          <div
            ref={drawerRef}
            className="s299-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="s299-drawer-title"
          >
            <button
              type="button"
              className="close-btn"
              aria-label="닫기"
              onClick={closeDrawer}
            >
              ×
            </button>

            {/* 1. PRODUCT DETAIL + REAL-TIME SPECIFICATIONS DRAWER */}
            {drawerMode === 'product' && selectedProduct && (() => {
              const pAccKey = getProductAccountKey(selectedProduct);
              const pkg = PACKAGE_TIERS[pAccKey] || PACKAGE_TIERS['1구좌'];
              const images = getProductImageList(selectedProduct);
              const safeIdx =
                selectedProductImgIdx >= 0 &&
                selectedProductImgIdx < images.length
                  ? selectedProductImgIdx
                  : 0;
              const currentImg = images[safeIdx];
              const specs = Array.isArray(selectedProduct.specifications)
                ? selectedProduct.specifications
                : [];

              return (
                <div>
                  <span className="eyebrow">
                    SPECIAL 299 COLLECTION · 60패키지
                  </span>
                  <div className="s299-drawer-badges">
                    <span className="s299-drawer-badge-primary">
                      {pkg.name}
                    </span>
                    <span className="s299-drawer-badge-secondary">
                      {selectedProduct.category || '프리미엄 가전'}
                    </span>
                  </div>

                  <h2 id="s299-drawer-title">{selectedProduct.name}</h2>
                  <p className="s299-drawer-model-code">
                    {selectedProduct.brand || 'LG전자'} · 모델명:{' '}
                    {selectedProduct.model || '-'}
                  </p>

                  {/* Image Gallery */}
                  <div className="s299-drawer-gallery">
                    <div className="s299-drawer-main-img-wrap">
                      <img
                        src={currentImg}
                        alt={selectedProduct.name}
                        referrerPolicy="no-referrer"
                        decoding="async"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/special299/fridge.jpg';
                        }}
                      />
                    </div>
                    {images.length > 1 && (
                      <div className="s299-drawer-thumbs">
                        {images.map((imgUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`s299-drawer-thumb-btn ${
                              safeIdx === idx ? 'active' : ''
                            }`}
                            onClick={() => setSelectedProductImgIdx(idx)}
                          >
                            <img
                              src={imgUrl}
                              alt=""
                              referrerPolicy="no-referrer"
                              decoding="async"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 구좌별 납입 조건 요약 카드 */}
                  <div className="s299-drawer-price-card">
                    <div className="s299-drawer-price-head">
                      <span>{pkg.name} 월 납입금</span>
                      <div>
                        <strong>월 {pkg.monthlyPrice}원</strong>
                        <small>(1~60회)</small>
                      </div>
                    </div>

                    <div className="s299-drawer-price-grid">
                      <div className="s299-drawer-price-item">
                        <span>1~60회 가전 렌탈료</span>
                        <strong>월 {pkg.rentalPrice}원</strong>
                      </div>
                      <div className="s299-drawer-price-item">
                        <span>1~60회 상조 부금</span>
                        <strong>월 {pkg.sangjoPrice}원</strong>
                      </div>
                      <div className="s299-drawer-price-item">
                        <span>61~200회 상조 부금</span>
                        <strong>월 {pkg.extendPrice}원</strong>
                      </div>
                      <div className="s299-drawer-price-item">
                        <span>200회 총 납입금 (만기 100% 환급)</span>
                        <strong>{pkg.totalPrice}원</strong>
                      </div>
                    </div>

                    {selectedProduct.giftText && (
                      <div
                        className="s299-product-gift-badge"
                        style={{ marginTop: '12px', marginBottom: 0 }}
                      >
                        <Gift size={14} className="shrink-0" />
                        <span>사은품 혜택: {selectedProduct.giftText}</span>
                      </div>
                    )}

                    <p className="s299-drawer-price-note">
                      • 60회 납입 완료 시 가전제품 완전 소유권 이전
                      <br />• 200회 만기 완납 및 상조 미사용 시 가전 렌탈료 포함
                      납입금 100% 환급
                    </p>
                  </div>

                  {/* 실시간 세부 스펙 정보 */}
                  <div className="s299-drawer-spec-section">
                    <div className="s299-drawer-spec-header">
                      <h3>
                        <FileText size={17} /> 세부 스펙 정보
                      </h3>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {isScrapingSpec ? (
                          <span className="s299-spec-status-badge">
                            <Loader2 size={12} className="animate-spin" />
                            실시간 스펙 불러오는 중...
                          </span>
                        ) : (
                          <>
                            <span className="s299-spec-status-badge">
                              실시간 연동 ({specs.length}개 항목)
                            </span>
                            {selectedProduct.model && (
                              <button
                                type="button"
                                className="s299-spec-refresh-btn"
                                onClick={() =>
                                  fetchRealTimeSpecs(selectedProduct, true)
                                }
                                title="제조사 공식 스펙 다시 불러오기"
                              >
                                <RefreshCw size={11} /> 새로고침
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="s299-spec-table-wrap">
                      <table className="s299-spec-table">
                        <tbody>
                          <tr>
                            <th>제품명</th>
                            <td>{selectedProduct.name}</td>
                          </tr>
                          <tr>
                            <th>모델명</th>
                            <td>{selectedProduct.model || '-'}</td>
                          </tr>
                          <tr>
                            <th>제조사 / 브랜드</th>
                            <td>{selectedProduct.brand || 'LG전자'}</td>
                          </tr>
                          <tr>
                            <th>카테고리</th>
                            <td>{selectedProduct.category || '가전'}</td>
                          </tr>
                          {specs.map((spec: any, idx: number) => (
                            <tr key={idx}>
                              <th>
                                {spec.category && (
                                  <span className="s299-spec-cat-label">
                                    {spec.category}
                                  </span>
                                )}
                                {spec.name}
                              </th>
                              <td>{spec.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 상세 이미지 (detailImages) 가 있는 경우 표시 */}
                  {Array.isArray(selectedProduct.detailImages) &&
                    selectedProduct.detailImages.length > 0 && (
                      <div style={{ margin: '24px 0' }}>
                        <h4
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            marginBottom: '10px',
                          }}
                        >
                          제품 상세 설명 이미지
                        </h4>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid #e2e6dc',
                          }}
                        >
                          {selectedProduct.detailImages.map(
                            (dImg: string, dIdx: number) => (
                              <img
                                key={dIdx}
                                src={dImg}
                                alt={`${selectedProduct.name} 상세 ${dIdx + 1}`}
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            )
                          )}
                        </div>
                      </div>
                    )}

                  <p className="fine">
                    재고, 설치 환경에 따라 실제 설치 일정 및 조건이 달라질 수
                    있으며, 전문 상담사가 정확하게 안내해 드립니다.
                  </p>

                  <button
                    type="button"
                    className="btn full"
                    onClick={() =>
                      openConsultDrawer(
                        `[${pkg.key}] ${selectedProduct.name} (${
                          selectedProduct.model || ''
                        })`,
                        pkg.accountNum
                      )
                    }
                  >
                    이 가전으로 맞춤 상담하기 <span>↗</span>
                  </button>
                </div>
              );
            })()}

            {/* 2. CONSULTATION DRAWER */}
            {drawerMode === 'consult' && (
              <div>
                {submittedData ? (
                  <div>
                    <div className="review-icon">✓</div>
                    <span className="eyebrow">CONSULTATION COMPLETED</span>
                    <h2 id="s299-drawer-title">
                      상담 신청이
                      <br />
                      접수되었습니다.
                    </h2>
                    <p className="s299-drawer-intro">
                      담당 전문 상담사가 확인 후 빠르게 연락드리겠습니다.
                    </p>
                    <table className="review-table">
                      <tbody>
                        <tr>
                          <th>이름</th>
                          <td>{submittedData.name}</td>
                        </tr>
                        <tr>
                          <th>연락처</th>
                          <td>{submittedData.phone}</td>
                        </tr>
                        <tr>
                          <th>희망 가전</th>
                          <td>{submittedData.interest}</td>
                        </tr>
                        <tr>
                          <th>사용 목적</th>
                          <td>{submittedData.purpose}</td>
                        </tr>
                        <tr>
                          <th>희망 구좌</th>
                          <td>{submittedData.budget}</td>
                        </tr>
                        <tr>
                          <th>상담 시간</th>
                          <td>{submittedData.time}</td>
                        </tr>
                        <tr>
                          <th>문의 내용</th>
                          <td>{submittedData.message}</td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="service-note">
                      빠른 전화 상담이 필요하시면 라이프앤조이 상품 상담 번호로
                      바로 연락하실 수 있습니다.
                    </p>
                    <div className="drawer-actions">
                      <button
                        type="button"
                        className="btn outline"
                        onClick={closeDrawer}
                      >
                        닫기
                      </button>
                      <a className="btn" href="tel:16448399">
                        1644-8399 전화 상담
                      </a>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="eyebrow">LET’S FIND YOUR SPECIAL LIFE</span>
                    <h2 id="s299-drawer-title">
                      나에게 맞는 혜택,
                      <br />
                      상담으로 확인하세요.
                    </h2>
                    <p className="s299-drawer-intro">
                      선택하신 가전과 납입 조건을 바탕으로 친절하게 안내합니다.
                    </p>

                    <form onSubmit={handleConsultSubmit}>
                      <label htmlFor="s299-interest">희망 가전·상담 내용</label>
                      <input
                        id="s299-interest"
                        name="interest"
                        value={consultInterest}
                        onChange={(e) => setConsultInterest(e.target.value)}
                        required
                        maxLength={100}
                      />

                      <div className="form-row">
                        <div>
                          <label htmlFor="s299-name">이름</label>
                          <input
                            id="s299-name"
                            name="name"
                            value={consultName}
                            onChange={(e) => setConsultName(e.target.value)}
                            autocomplete="name"
                            placeholder="성함을 입력해 주세요"
                            required
                            maxLength={40}
                          />
                        </div>
                        <div>
                          <label htmlFor="s299-phone">연락처</label>
                          <input
                            id="s299-phone"
                            name="phone"
                            value={consultPhone}
                            onChange={(e) =>
                              setConsultPhone(formatPhoneNumber(e.target.value))
                            }
                            autocomplete="tel"
                            inputMode="tel"
                            placeholder="010-0000-0000"
                            required
                          />
                        </div>
                      </div>

                      <label htmlFor="s299-purpose">사용 목적</label>
                      <select
                        id="s299-purpose"
                        name="purpose"
                        value={consultPurpose}
                        onChange={(e) => setConsultPurpose(e.target.value)}
                      >
                        <option value="신혼·입주 가전">신혼·입주 가전</option>
                        <option value="가전 교체">가전 교체</option>
                        <option value="부모님 선물">부모님 선물</option>
                        <option value="매장·사무실">매장·사무실</option>
                        <option value="기타·추천받기">기타·추천받기</option>
                      </select>

                      <div className="form-row">
                        <div>
                          <label htmlFor="s299-budget">희망 구좌</label>
                          <select
                            id="s299-budget"
                            name="budget"
                            value={consultBudget}
                            onChange={(e) => setConsultBudget(e.target.value)}
                          >
                            <option value="추천">추천받기</option>
                            <option value="1">1구좌 · 월 29,900원</option>
                            <option value="2">2구좌 · 월 59,800원</option>
                            <option value="3">3구좌 · 월 89,700원</option>
                            <option value="4">4구좌 · 월 119,600원</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="s299-time">상담 희망 시간</label>
                          <select
                            id="s299-time"
                            name="time"
                            value={consultTime}
                            onChange={(e) => setConsultTime(e.target.value)}
                          >
                            <option value="빠른 상담">빠른 상담</option>
                            <option value="오전 09~12시">오전 09~12시</option>
                            <option value="오후 12~18시">오후 12~18시</option>
                            <option value="저녁 18~20시">저녁 18~20시</option>
                          </select>
                        </div>
                      </div>

                      <label htmlFor="s299-message">
                        문의 내용 <span>(선택)</span>
                      </label>
                      <textarea
                        id="s299-message"
                        name="message"
                        rows={3}
                        maxLength={1000}
                        value={consultMessage}
                        onChange={(e) => setConsultMessage(e.target.value)}
                        placeholder="희망 모델이나 궁금한 점을 남겨주세요."
                      />

                      <div className="consent-row">
                        <label>
                          <input
                            type="checkbox"
                            required
                            checked={consultConsent}
                            onChange={(e) =>
                              setConsultConsent(e.target.checked)
                            }
                          />{' '}
                          개인정보 수집·이용 동의 <span>(필수)</span>
                        </label>
                      </div>

                      <details className="privacy-details">
                        <summary>개인정보 수집·이용 내용 보기</summary>
                        <p>
                          상담 운영자: (주)라이프앤조이. 목적: 상품 상담 및 연락.
                          항목: 이름, 연락처, 희망 가전, 사용 목적, 희망 구좌,
                          희망 시간 및 문의 내용. 보유기간: 상담 완료 후 1년 또는
                          삭제 요청 시까지. 동의를 거부할 수 있으며, 거부 시 상담
                          신청이 제한됩니다.
                        </p>
                      </details>

                      <button
                        type="submit"
                        className="btn form-submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting
                          ? '상담 신청 접수 중...'
                          : '무료 상담 신청하기'}{' '}
                        <span>↗</span>
                      </button>
                      <p
                        className="fine"
                        style={{ textAlign: 'center', marginTop: '12px' }}
                      >
                        가입 신청이 아닌 전문 상담 안내 단계입니다.
                      </p>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* 3. LIFE SERVICE DRAWER */}
            {drawerMode === 'service' && (() => {
              const s = LIFE_SERVICES[selectedServiceKey];
              return (
                <div>
                  <span className="eyebrow">HYOWON LIFE SERVICE</span>
                  <h2 id="s299-drawer-title">{s.title}</h2>
                  <img
                    className="detail-image"
                    src={s.image}
                    alt={`${s.title} 연출 이미지`}
                  />
                  <p className="s299-drawer-intro">{s.text}</p>
                  <ul className="info-list">
                    {s.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                  <p className="fine">
                    이미지는 서비스 이해를 돕는 연출 예시입니다. 전환서비스
                    이용과 만기 환급은 중복 적용되지 않습니다.
                  </p>
                  <button
                    type="button"
                    className="btn full"
                    onClick={() => openConsultDrawer(`${s.title} 문의`)}
                  >
                    이 서비스 상담하기 <span>↗</span>
                  </button>
                </div>
              );
            })()}

            {/* 4. PRIVACY DRAWER */}
            {drawerMode === 'privacy' && (
              <div>
                <span className="eyebrow">PRIVACY INFORMATION</span>
                <h2 id="s299-drawer-title">개인정보 수집·이용 안내</h2>
                <p className="service-note">
                  상담 운영자: (주)라이프앤조이
                  <br />
                  수집 목적: 상품 상담 및 연락
                  <br />
                  수집 항목: 이름, 연락처, 희망 가전, 사용 목적, 희망 구좌, 희망
                  시간, 문의 내용
                  <br />
                  보유기간: 상담 완료 후 1년 또는 삭제 요청 시까지
                  <br />
                  개인정보 관련 문의: lifenjoy0296@gmail.com
                </p>
                <p className="service-note">
                  동의를 거부하실 수 있으며 거부 시 상담 신청이 제한됩니다.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
