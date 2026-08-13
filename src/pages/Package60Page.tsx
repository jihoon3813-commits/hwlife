import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, Check, ShieldCheck, ChevronRight, ChevronLeft, X, Star, Gift, 
  Sparkles, Award, Search, Info, HelpCircle, CheckCircle2,
  Clock, Flame, CheckSquare, Square, ChevronDown, FileText, Layers, Tag,
  Maximize2, Zap
} from 'lucide-react';
import { formatPhoneNumber } from '../utils/phone';
import PrivacyModal from '../components/PrivacyModal';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import SEO from '../components/SEO';
import FuneralDetailModal from '../components/FuneralDetailModal';

interface Package60PageProps {
  channelSubdomain?: string;
}

const getProductImageList = (p: any): string[] => {
  if (!p) return ['https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?q=80&w=400'];
  const list: string[] = [];
  if (p.image) {
    list.push(p.image);
  }
  if (Array.isArray(p.images)) {
    for (const img of p.images) {
      if (img && !list.includes(img)) {
        list.push(img);
      }
    }
  }
  return list.length > 0 ? list : ['https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?q=80&w=400'];
};

const formatNumber = (val: string | number | undefined) => {
  if (!val) return "0";
  return val.toString().replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Auto-swiping card thumbnail component (1.5s interval, pauses on hover, mouse drag support)
function AutoSwipingCardThumbnail({
  imageList,
  productName,
  accountCount,
  tagColor,
}: {
  imageList: string[];
  productName: string;
  accountCount: string;
  tagColor: string;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-swipe every 1.5s (1500ms), pauses when mouse is hovered!
  useEffect(() => {
    if (imageList.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % imageList.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [imageList.length, isHovered]);

  const mainImg = imageList[currentIdx] || 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?q=80&w=400';

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full aspect-square bg-[#F8FAFC] border-b border-[#E5E8EB] overflow-hidden group/thumb transition-colors select-none p-3 sm:p-4 flex items-center justify-center"
    >
      {/* Top Badges Overlayed (z-30 so image layer never covers it) */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-30 pointer-events-none">
        <span className="text-[11px] font-extrabold bg-[#191F28]/90 text-white px-2 py-0.5 rounded-xs tracking-wider shadow-xs backdrop-blur-xs">
          가전&상조 60패키지
        </span>
        <div className="flex items-center gap-1">
          {imageList.length > 1 && (
            <span className="text-[10px] font-extrabold bg-black/60 text-white px-1.5 py-0.5 rounded-xs backdrop-blur-xs">
              {currentIdx + 1} / {imageList.length}
            </span>
          )}
          <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-xs border shadow-xs backdrop-blur-xs ${tagColor}`}>
            {accountCount ? accountCount.replace('지원', '').trim() + ' 전용' : '1구좌 전용'}
          </span>
        </div>
      </div>

      {/* Main Draggable Image Container (20% Reduced Thumbnail Size) */}
      <motion.div
        key={currentIdx}
        initial={{ opacity: 0.85, x: 15 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0.85, x: -15 }}
        transition={{ duration: 0.3 }}
        drag={imageList.length > 1 ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, { offset }) => {
          if (imageList.length <= 1) return;
          const threshold = 40;
          if (offset.x < -threshold) {
            // Drag Left -> Next
            setCurrentIdx((prev) => (prev + 1) % imageList.length);
          } else if (offset.x > threshold) {
            // Drag Right -> Prev
            setCurrentIdx((prev) => (prev - 1 + imageList.length) % imageList.length);
          }
        }}
        className="relative z-10 w-full h-full cursor-grab active:cursor-grabbing p-1 overflow-hidden flex items-center justify-center"
      >
        <img 
          src={mainImg} 
          alt={productName} 
          className="w-full h-full object-contain object-center pointer-events-none scale-[0.80] group-hover/thumb:scale-[0.88] transition-transform duration-300 ease-out"
        />
      </motion.div>

      {/* Multi Image Navigation Controls in Registered Order */}
      {imageList.length > 1 && (
        <>
          {/* Prev Arrow */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIdx((prev) => (prev - 1 + imageList.length) % imageList.length);
            }}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/80 text-white p-1.5 rounded-full transition-all opacity-80 hover:opacity-100 z-30 cursor-pointer"
            title="이전 이미지"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Next Arrow */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIdx((prev) => (prev + 1) % imageList.length);
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/80 text-white p-1.5 rounded-full transition-all opacity-80 hover:opacity-100 z-30 cursor-pointer"
            title="다음 이미지"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dots Row */}
          <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5 z-30 px-2 pointer-events-auto">
            {imageList.map((_, imgIdx) => (
              <button
                key={imgIdx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIdx(imgIdx);
                }}
                onMouseEnter={() => {
                  setCurrentIdx(imgIdx);
                }}
                className={`h-1.5 transition-all rounded-full cursor-pointer ${
                  currentIdx === imgIdx ? 'w-5 bg-[#3182F6]' : 'w-1.5 bg-white/70 hover:bg-white'
                }`}
                title={`${imgIdx + 1}번 썸네일 보기`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Fixed package pricing details as requested
const PACKAGE_DATA: Record<string, {
  name: string;
  accountCount: string;
  accountNum: number;
  monthlyPrice: string;
  rentalPrice: string;
  sangjoPrice: string;
  extendPrice: string;
  tabSubtext: string;
  tagColor: string;
}> = {
  '1구좌': {
    name: '1구좌 패키지',
    accountCount: '1구좌',
    accountNum: 1,
    monthlyPrice: '29,900',
    rentalPrice: '26,910',
    sangjoPrice: '2,990',
    extendPrice: '29,900',
    tabSubtext: '가전소유+상조회비 60회 포함',
    tagColor: 'bg-emerald-50 text-emerald-600 border-emerald-200'
  },
  '2구좌': {
    name: '2구좌 패키지',
    accountCount: '2구좌',
    accountNum: 2,
    monthlyPrice: '59,800',
    rentalPrice: '53,820',
    sangjoPrice: '5,980',
    extendPrice: '59,800',
    tabSubtext: '가전소유+상조회비 60회 포함',
    tagColor: 'bg-blue-50 text-blue-600 border-blue-200'
  },
  '3구좌': {
    name: '3구좌 패키지',
    accountCount: '3구좌',
    accountNum: 3,
    monthlyPrice: '89,700',
    rentalPrice: '80,730',
    sangjoPrice: '8,970',
    extendPrice: '89,700',
    tabSubtext: '가전소유+상조회비 60회 포함',
    tagColor: 'bg-purple-50 text-purple-600 border-purple-200'
  },
  '4구좌': {
    name: '4구좌 패키지',
    accountCount: '4구좌',
    accountNum: 4,
    monthlyPrice: '119,600',
    rentalPrice: '107,640',
    sangjoPrice: '11,960',
    extendPrice: '119,600',
    tabSubtext: '가전소유+상조회비 60회 포함',
    tagColor: 'bg-amber-50 text-amber-600 border-amber-200'
  }
};

export default function Package60Page({ channelSubdomain }: Package60PageProps) {
  const allProducts = useQuery(api.products.getVisibleProducts) || [];
  const settings = useQuery(api.settings.get);
  const channel = useQuery(api.channels.getBySubdomain, 
    channelSubdomain ? { subdomain: channelSubdomain } : "skip"
  );
  
  const createInquiry = useMutation(api.inquiries.create);
  const logVisit = useMutation(api.stats.logVisit);

  const [activePackageTab, setActivePackageTab] = useState<'1구좌' | '2구좌' | '3구좌' | '4구좌'>('2구좌');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active thumbnail image index map per product card
  const [activeImageMap, setActiveImageMap] = useState<Record<string, number>>({});

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(true);
  const [selectedProductForInquiry, setSelectedProductForInquiry] = useState<any | null>(null);

  // Modal states
  const [isSangjoModalOpen, setIsSangjoModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [selectedSpecProduct, setSelectedSpecProduct] = useState<any | null>(null);
  const [selectedSpecImageIdx, setSelectedSpecImageIdx] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentHeroIdx, setCurrentHeroIdx] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);

  const heroProducts = useMemo(() => {
    const heroList = allProducts.filter(p => !!p.showOnHero);
    if (heroList.length >= 4) return heroList.slice(0, 4);

    const combined = [...heroList];
    for (const p of allProducts) {
      if (combined.length >= 4) break;
      if (!combined.some(item => item._id === p._id)) {
        combined.push(p);
      }
    }
    return combined.slice(0, 4);
  }, [allProducts]);

  useEffect(() => {
    if (heroProducts.length <= 1 || isHeroHovered) return;
    const timer = setInterval(() => {
      setCurrentHeroIdx((prev) => (prev + 1) % heroProducts.length);
    }, 1500);
    return () => clearInterval(timer);
  }, [heroProducts.length, isHeroHovered]);

  const formRef = useRef<HTMLDivElement>(null);
  const productSectionRef = useRef<HTMLDivElement>(null);

  // Log visit on mount
  useEffect(() => {
    logVisit({
      path: '/package60',
      ip: 'client',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'browser'
    });
  }, [logVisit]);

  // Filter products assigned to /package60
  const package60Products = useMemo(() => {
    return allProducts.filter(p => 
      (p.landingPages && p.landingPages.includes('/package60')) ||
      p.isSmartRegistered === true
    );
  }, [allProducts]);

  // Compute package tabs that actually have registered products in Admin
  const availablePackageTabs = useMemo(() => {
    const ALL_KEYS = ['1구좌', '2구좌', '3구좌', '4구좌'] as const;
    const available = ALL_KEYS.filter(pkgKey => {
      const pkgData = PACKAGE_DATA[pkgKey];
      return package60Products.some(p => {
        const pAccount = p.accountCount ? p.accountCount.replace(/\s/g, '') : `${p.planId}구좌`;
        return pAccount === pkgKey || p.planId === pkgData.accountNum || pAccount.includes(pkgKey);
      });
    });
    return available;
  }, [package60Products]);

  // Auto switch activePackageTab to the first available tab if current active tab has no registered products
  useEffect(() => {
    if (availablePackageTabs.length > 0 && !availablePackageTabs.includes(activePackageTab)) {
      setActivePackageTab(availablePackageTabs[0]);
    }
  }, [availablePackageTabs, activePackageTab]);

  // Current package data
  const currentPkg = PACKAGE_DATA[activePackageTab] || PACKAGE_DATA['1구좌'];

  // Filter products strictly registered for 가전&상조 60패키지
  const filteredProducts = allProducts.filter(p => {
    // 1. Must be explicitly assigned to /package60 OR smart registered
    const isPackage60Product = 
      (p.landingPages && p.landingPages.includes('/package60')) ||
      p.isSmartRegistered === true;

    if (!isPackage60Product) return false;

    // 2. Match package account count (1구좌, 2구좌, 3구좌, 4구좌)
    const pAccount = p.accountCount || `${p.planId}구좌`;
    const matchesPackage = pAccount === activePackageTab || (p.planId === currentPkg.accountNum);
    if (!matchesPackage) return false;

    // 3. Category match
    const matchesCategory = selectedCategory === '전체' || 
      (p.category && p.category.replace(/\s/g, '').includes(selectedCategory.replace(/\s/g, '')));
    if (!matchesCategory) return false;

    // 4. Search query match
    const matchesSearch = !searchQuery.trim() || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Unique categories list
  const categoryOptions = ['전체', '냉장고', '세탁기/건조기', 'TV', '에어컨', '청소기', '주방가전'];

  const scrollToInquiry = (prod?: any) => {
    if (prod) {
      setSelectedProductForInquiry(prod);
    }
    setIsContactModalOpen(true);
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('성함을 입력해 주세요.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 9) {
      alert('올바른 연락처를 입력해 주세요.');
      return;
    }
    if (!agreePrivacy) {
      alert('개인정보 수집 및 이용 동의에 체크해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const prodName = selectedProductForInquiry ? selectedProductForInquiry.name : '가전상조 60패키지 일반 상담';
      const prodModel = selectedProductForInquiry ? selectedProductForInquiry.model : '';
      
      await createInquiry({
        name,
        phone,
        productName: `[${activePackageTab}] ${prodName} (${prodModel})`,
        message: `랜딩페이지: /package60 (${activePackageTab} 선택)\n채널: ${channel?.channelName || '본사'}`,
        channelId: channel?.subdomain
      });

      alert('⚡ 상담 신청이 성공적으로 완료되었습니다!\n담당 전문 상담사가 빠르게 연락드리겠습니다.');
      setName('');
      setPhone('');
      setIsContactModalOpen(false);
      setSelectedProductForInquiry(null);
    } catch (err) {
      console.error('Inquiry submit error:', err);
      alert('상담 신청 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#191F28] font-sans">
      <SEO 
        title="가전상조 60패키지 - 프리미엄 가전 100% 소유 + 효원상조 혜택" 
        description="월 29,900원부터! 60회 만기 시 가전 완납 소유 및 상조 만기 시 가전 렌탈료 100% 전액 환급 지원!" 
        image="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778418168/A_photorealistic_cozy_family_scene_in_a_premium_Ko-1778416838228_lac7jp.png"
      />

      {/* Top Header (Unfixed non-sticky header, Logo Image | Title Text horizontally balanced) */}
      <header className="bg-white border-b border-[#E5E8EB] z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-center relative">
          <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 text-center">
            {/* Left: Partner & Hyowon Logo Images */}
            <div className="flex items-center justify-center gap-1.5 shrink-0">
              <img 
                src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786429410/2024-07-18_14_21_49_%EB%88%84%EB%81%BC_ozsj2h.png" 
                alt="파트너 로고" 
                className="h-5 sm:h-6 w-auto object-contain"
              />
              <span className="text-[11px] font-extrabold text-[#94A3B8]">x</span>
              <img 
                src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786415950/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_opfls9.png" 
                alt="효원상조 로고" 
                className="h-4.5 sm:h-5.5 w-auto object-contain"
              />
            </div>

            {/* Vertical Divider Line */}
            <div className="h-5 sm:h-6 w-[1px] bg-[#D1D6DB] shrink-0"></div>

            {/* Right: Title Text with Blue Gradient on 가전&상조 */}
            <div className="text-[17px] sm:text-[20px] font-black leading-none tracking-tight flex items-center justify-center shrink-0">
              <span className="bg-gradient-to-r from-[#3182F6] via-[#2563EB] to-[#1D4ED8] bg-clip-text text-transparent font-black">
                가전&상조
              </span>
              <span className="text-[#191F28] font-black ml-1">
                60패키지
              </span>
            </div>
          </div>

          {channel?.channelName && (
            <span className="absolute right-4 hidden sm:inline-block text-[11px] font-bold bg-[#F2F4F6] text-[#4E5968] px-2 py-1 rounded-md">
              제휴: {channel.channelName}
            </span>
          )}
        </div>
      </header>

      {/* Hero Section with Solid Blue Background */}
      <section 
        className="relative overflow-hidden pt-10 pb-14 px-4 sm:px-6 shadow-xs bg-[#3182F6] text-white"
      >
        {/* Decorative Graphic Elements */}
        <div className="absolute top-1/4 -left-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 -right-12 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white border border-white px-3.5 py-1.5 rounded-full shadow-md">
                <Sparkles className="w-4 h-4 text-[#3182F6] animate-pulse" />
                <span className="text-[13px] font-extrabold text-[#191F28]">
                  현명한 소비자의 선택! 가전&상조 렌탈 패키지
                </span>
              </div>

              <h1 className="text-[28px] xs:text-[32px] sm:text-4xl lg:text-[44px] font-black text-white leading-[1.28] tracking-tight text-center lg:text-left">
                최신 LG가전을 부담없는 <br className="inline sm:hidden"/>가격으로 렌탈하고,<br />
                <span className="text-yellow-300">
                  상조 만기 시 렌탈료는 <br className="inline sm:hidden"/>전액 지원 받으세요!
                </span>
              </h1>

              <p className="text-[15px] sm:text-[17px] text-white/90 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                월 29,900원부터 시작하는 60패키지! 60회 납입으로 가전은 완전 소유,<br className="hidden xs:inline"/> 
                상조 만기 유지 시 가전 렌탈료 환급 지원 & 가전 맞춤 사은품 혜택까지 모두 챙기세요.
              </p>

              {/* Highlights List (Clean Thin Text Layout) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 pt-2 w-full max-w-2xl mx-auto lg:mx-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-[14px] sm:text-[15px] font-normal text-white">
                  <CheckCircle2 className="w-4 h-4 text-yellow-300 shrink-0" />
                  <span>60회 납입 시 가전 완전 소유</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-[14px] sm:text-[15px] font-normal text-white">
                  <CheckCircle2 className="w-4 h-4 text-yellow-300 shrink-0" />
                  <span>상조 만기 시 렌탈료 100% 지원</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-[14px] sm:text-[15px] font-normal text-white">
                  <CheckCircle2 className="w-4 h-4 text-yellow-300 shrink-0" />
                  <span>크루즈/웨딩/칠팔순 등 전환 이용</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-[14px] sm:text-[15px] font-normal text-yellow-300">
                  <Gift className="w-4 h-4 text-yellow-300 shrink-0" />
                  <span>제품별 맞춤 사은품 증정</span>
                </div>
              </div>
            </div>

            {/* Right Visual Image Card Banner (Linked with Admin Hero Products) */}
            <div className="lg:col-span-5 flex justify-center">
              {heroProducts.length > 0 ? (
                <div 
                  onMouseEnter={() => setIsHeroHovered(true)}
                  onMouseLeave={() => setIsHeroHovered(false)}
                  className="relative w-full max-w-md bg-white rounded-md p-6 shadow-xl border border-[#E5E8EB] transform transition-transform hover:scale-[1.01] flex flex-col justify-between"
                >
                  {(() => {
                    const safeHeroIdx = currentHeroIdx % heroProducts.length;
                    const heroItem = heroProducts[safeHeroIdx] || heroProducts[0];
                    const heroImg = heroItem.image || (heroItem.images && heroItem.images[0]) || 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1778418168/A_photorealistic_cozy_family_scene_in_a_premium_Ko-1778416838228_lac7jp.png';
                    const heroAccount = heroItem.accountCount || `${heroItem.planId || 1}구좌`;

                    return (
                      <>
                        <div 
                          onClick={() => {
                            setSelectedSpecProduct(heroItem);
                            setSelectedSpecImageIdx(0);
                            setIsSpecModalOpen(true);
                          }}
                          className="cursor-pointer group"
                        >
                          <div className="relative aspect-4/3 rounded-sm overflow-hidden bg-[#F8FAFC] border border-[#E2E8F0] mb-4 flex items-center justify-center p-4 sm:p-5">
                            <img 
                              src={heroImg}
                              alt={heroItem.name}
                              className="w-full h-full object-contain object-center transform scale-[0.82] group-hover:scale-90 transition-transform duration-300"
                            />
                            <div className="absolute top-3 left-3 bg-[#191F28]/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-sm flex items-center gap-1.5 shadow-sm">
                              <Sparkles className="w-3.5 h-3.5 text-[#3182F6] fill-current" />
                              상조&가전 패키지
                            </div>
                            <div className="absolute top-3 right-3 bg-[#3182F6] text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-xs shadow-sm">
                              {heroAccount ? heroAccount.replace('지원', '').trim() + ' 전용' : '1구좌 전용'}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-[12px] font-bold text-[#8B95A1]">{heroItem.brand} {heroItem.model || ''}</span>
                              {heroItem.giftText && (
                                <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-600 px-2 py-0.5 rounded-xs text-[11px] font-extrabold truncate max-w-[200px]">
                                  <Gift className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  사은품: {heroItem.giftText}
                                </span>
                              )}
                            </div>
                            <h3 className="font-extrabold text-[18px] text-[#191F28] group-hover:text-[#3182F6] transition-colors line-clamp-1">
                              {heroItem.name} + 효원상조 60회
                            </h3>
                            <div className="pt-2 border-t border-[#F2F4F6] flex justify-between items-baseline">
                              <span className="text-[13px] text-[#4E5968] font-bold">월 납입금</span>
                              <div className="text-right">
                                <span className="text-[22px] font-black text-[#3182F6]">월 {formatNumber(heroItem.price || '29900')}원</span>
                                <span className="text-[12px] text-[#8B95A1] font-bold ml-1">(60회)</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 4 Recommended Products Thumbnail Strip at Bottom of Hero Box */}
                        {heroProducts.length > 0 && (
                          <div className="pt-3 mt-3 border-t border-[#F2F4F6]">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-extrabold text-[#4E5968] flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-[#3182F6] fill-current" />
                                인기 추천 가전 {heroProducts.length}선
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentHeroIdx((prev) => (prev - 1 + heroProducts.length) % heroProducts.length);
                                  }}
                                  className="p-1 rounded bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] transition-colors cursor-pointer"
                                  title="이전 상품"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentHeroIdx((prev) => (prev + 1) % heroProducts.length);
                                  }}
                                  className="p-1 rounded bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] transition-colors cursor-pointer"
                                  title="다음 상품"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* 4 Product Thumbnails Grid */}
                            <div className="grid grid-cols-4 gap-1.5">
                              {heroProducts.map((hProd, hIdx) => {
                                const isSelected = safeHeroIdx === hIdx;
                                const thumbImg = hProd.image || (hProd.images && hProd.images[0]) || 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?q=80&w=400';
                                return (
                                  <button
                                    key={hProd._id || hIdx}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCurrentHeroIdx(hIdx);
                                    }}
                                    className={`relative aspect-square rounded-md border-2 p-0.5 overflow-hidden transition-all bg-[#F8FAFC] cursor-pointer group/thumb ${
                                      isSelected
                                        ? 'border-[#3182F6] ring-2 ring-[#3182F6]/30 shadow-xs opacity-100'
                                        : 'border-[#E2E8F0] opacity-65 hover:opacity-100 hover:border-[#CBD5E1]'
                                    }`}
                                    title={hProd.name}
                                  >
                                    <img 
                                      src={thumbImg} 
                                      alt={hProd.name} 
                                      className="w-full h-full object-cover object-center rounded-xs"
                                    />
                                    {isSelected && (
                                      <div className="absolute inset-0 bg-[#3182F6]/10 pointer-events-none" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="relative w-full max-w-md bg-white rounded-md p-6 shadow-xl border border-[#E5E8EB] transform transition-transform hover:scale-[1.01]">
                  <div className="relative aspect-4/3 rounded-sm overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 mb-4 flex items-center justify-center">
                    <img 
                      src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778418168/A_photorealistic_cozy_family_scene_in_a_premium_Ko-1778416838228_lac7jp.png"
                      alt="가전상조 60패키지"
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute top-3 left-3 bg-[#191F28]/85 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-sm">
                      상조&가전 패키지
                    </div>
                    <div className="absolute top-3 right-3 bg-[#3182F6] text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-xs shadow-sm">
                      1구좌 전용
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[12px] font-bold text-[#8B95A1]">효원상조 X 프리미엄 가전</span>
                      <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-600 px-2 py-0.5 rounded-xs text-[11px] font-extrabold">
                        <Gift className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        사은품: 가전소유+렌탈료 100%환급
                      </span>
                    </div>
                    <h3 className="font-extrabold text-[18px] text-[#191F28]">
                      LG & 삼성 최신 가전 무상 지원 혜택
                    </h3>
                    <div className="pt-2 border-t border-[#F2F4F6] flex justify-between items-baseline">
                      <span className="text-[13px] text-[#4E5968] font-bold">월 납입금</span>
                      <div className="text-right">
                        <span className="text-[22px] font-black text-[#3182F6]">월 29,900원</span>
                        <span className="text-[12px] text-[#8B95A1] font-bold ml-1">(60회)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Package Tabs Section (히어로 섹션 밑 패키지탭) */}
      {availablePackageTabs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-4 relative z-20" ref={productSectionRef}>
          <div className="bg-white rounded-md shadow-md border border-[#E5E8EB] p-3 sm:p-4">
            <div className="text-center mb-3">
              <span className="text-[12px] font-bold text-[#8B95A1] tracking-wider uppercase">SELECT YOUR PACKAGE</span>
              <h2 className="text-[18px] sm:text-[20px] font-black text-[#191F28]">
                원하시는 구좌 패키지를 선택하세요
              </h2>
            </div>

            {/* Registered Package Tabs Only */}
            <div className={`grid gap-2 sm:gap-3 ${
              availablePackageTabs.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
              availablePackageTabs.length === 2 ? 'grid-cols-2 max-w-2xl mx-auto' :
              availablePackageTabs.length === 3 ? 'grid-cols-1 xs:grid-cols-3' :
              'grid-cols-2 sm:grid-cols-4'
            }`}>
              {availablePackageTabs.map((pkgKey) => {
                const item = PACKAGE_DATA[pkgKey];
                const isActive = activePackageTab === pkgKey;
                return (
                  <button
                    key={pkgKey}
                    onClick={() => setActivePackageTab(pkgKey)}
                    className={`p-3.5 sm:p-4 rounded-md border-2 transition-all text-left flex flex-col justify-between relative overflow-hidden ${
                      isActive 
                        ? 'border-[#3182F6] bg-[#F2F8FF] shadow-sm' 
                        : 'border-[#E5E8EB] bg-white hover:border-[#B0D0FF] hover:bg-[#FAF9FA]'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-0 right-0 bg-[#3182F6] text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-sm">
                        선택됨
                      </div>
                    )}
                    <div>
                      <span className="text-[12px] font-bold text-[#8B95A1] block mb-0.5">{item.name}</span>
                      <div className="text-[16px] sm:text-[18px] font-black text-[#191F28]">
                        월 {item.monthlyPrice}원
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-[#E5E8EB]/60 flex items-center justify-between text-[11px]">
                      <span className="text-[#3182F6] font-bold">{item.tabSubtext}</span>
                      <span className="text-[#8B95A1]">60회 납입</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Package Banner Info */}
            {currentPkg && (
              <div className="mt-4 p-4 rounded-md bg-[#F2F4F6] border border-[#E5E8EB] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1.5 text-center md:text-left w-full md:w-auto">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="text-[11px] xs:text-[12px] sm:text-[13px] font-extrabold bg-[#191F28] text-white px-2.5 py-1 rounded-xs whitespace-nowrap">
                      {currentPkg.name} 가격 상세 구성
                    </span>
                    <span className="text-[13px] font-bold text-[#3182F6] whitespace-nowrap">
                      월 {currentPkg.monthlyPrice}원 × 60회
                    </span>
                  </div>
                  <p className="text-[13px] text-[#4E5968] font-medium">
                    가전렌탈료 <strong className="text-[#191F28]">{currentPkg.rentalPrice}원</strong> + 상조회비 <strong className="text-[#191F28]">{currentPkg.sangjoPrice}원</strong> | 상조 61~200회차 유지 시 월 {currentPkg.extendPrice}원
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsSangjoModalOpen(true)}
                    className="bg-white border border-[#D1D6DB] text-[#3182F6] hover:bg-[#E8F3FF] text-[13px] font-bold px-4 py-2 rounded-md transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <HelpCircle className="w-4 h-4" /> 상조 서비스 더 자세히 알기
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Product List Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        
        {/* Category Filters & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
            {categoryOptions.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-md text-[13px] font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#191F28] text-white shadow-xs'
                    : 'bg-white text-[#4E5968] border border-[#E5E8EB] hover:bg-[#F2F4F6]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="제품명 또는 모델명 검색" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#D1D6DB] rounded-md pl-9 pr-4 py-1.5 text-[13px] font-medium focus:outline-none focus:border-[#3182F6] shadow-2xs"
            />
            <Search className="w-4 h-4 text-[#8B95A1] absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>

        {/* Product Cards Grid (3 Columns Desktop, 2 Columns Tablet, 1 Column Mobile) */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-md border border-[#E5E8EB] p-12 text-center my-8">
            <div className="w-12 h-12 bg-[#F2F4F6] rounded-sm flex items-center justify-center mx-auto mb-3 text-[#8B95A1]">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-[#191F28] text-[16px] mb-1">
              [{activePackageTab}] 어드민에 등록된 가전&상조 60패키지 제품이 없습니다.
            </h4>
            <p className="text-[13px] text-[#8B95A1]">
              어드민 [스마트 등록]에서 가전&상조 60패키지 상품을 등록하시면 해당 구좌에 자동 노출됩니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-9 lg:gap-10">
            {filteredProducts.map((p) => {
              const imageList = getProductImageList(p);

              return (
                <div 
                  key={p._id}
                  className="bg-white rounded-md border border-[#E5E8EB] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Auto-Swiping Thumbnail (1.5s interval & Mouse Drag Support) */}
                    <AutoSwipingCardThumbnail 
                      imageList={imageList}
                      productName={p.name}
                      accountCount={currentPkg.accountCount}
                      tagColor={currentPkg.tagColor}
                    />

                    {/* Content Section (Widened Padding) */}
                    <div className="p-5 space-y-4">
                      
                      {/* Gift Badge (Only rendered if giftText exists) */}
                      {p.giftText && (
                        <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-600 px-2.5 py-1 rounded-xs text-[12px] font-extrabold">
                          <Gift className="w-3.5 h-3.5 text-rose-500" />
                          사은품 : {p.giftText}
                        </div>
                      )}

                      {/* Product Name & Model */}
                      <div>
                        <h3 className="font-extrabold text-[16px] text-[#191F28] line-clamp-1 leading-snug">
                          {p.name} + 효원상조 60회
                        </h3>
                        <p className="text-[12px] font-bold text-[#8B95A1] mt-0.5">
                          {p.brand} {p.model} + 효원상조
                        </p>
                      </div>

                      {/* Price Details Block */}
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-sm p-3 space-y-1.5">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[12px] text-[#64748B] font-bold">월 납입금</span>
                          <div className="text-right">
                            <span className="text-[20px] font-black text-[#3182F6]">월 {currentPkg.monthlyPrice}원</span>
                            <span className="text-[12px] text-[#64748B] font-bold ml-1">* 60회</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#E2E8F0] grid grid-cols-2 gap-2 text-[12px]">
                          <div className="bg-white border border-[#E2E8F0] p-1.5 rounded-xs text-center">
                            <span className="text-[#64748B] block text-[10px]">가전 렌탈료</span>
                            <strong className="text-[#1E293B] font-extrabold">{currentPkg.rentalPrice}원</strong>
                          </div>
                          <div className="bg-white border border-[#E2E8F0] p-1.5 rounded-xs text-center">
                            <span className="text-[#64748B] block text-[10px]">상조 회비</span>
                            <strong className="text-[#1E293B] font-extrabold">{currentPkg.sangjoPrice}원</strong>
                          </div>
                        </div>
                      </div>

                      {/* Benefits Bullet Points */}
                      <div className="space-y-1.5 pt-1 text-[12px] text-[#475569] font-medium">
                        <div className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#3182F6] shrink-0 mt-0.5" />
                          <span className="relative inline-block px-1.5 py-0.5 rounded-xs text-[12px] font-black text-[#0F172A] z-10">
                            {/* Yellow Highlighter Marker Pen Sweep from Left to Right, then Pulsing Effect */}
                            <span className="absolute inset-0 bg-yellow-300 -z-10 rounded-xs animate-highlighter-sweep"></span>
                            60회 납입 후 가전 소유, 상조는 유지 여부 결정
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#3182F6] shrink-0 mt-0.5" />
                          <span>상조는 61~200회까지 월 {currentPkg.extendPrice}원</span>
                        </div>
                        <div className="flex items-start gap-1.5 text-[#3182F6] font-bold">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>상조 만기 유지 시 가전렌탈료 전액 환급 지원</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Card Footer Action Buttons */}
                  <div className="p-4 pt-0 space-y-1.5">
                    <button
                      onClick={() => {
                        setSelectedSpecProduct(p);
                        setSelectedSpecImageIdx(0);
                        setIsSpecModalOpen(true);
                      }}
                      className="w-full bg-[#E8F3FF] hover:bg-[#D4E8FF] text-[#1B64DA] border border-[#B0D0FF] text-[13px] font-extrabold py-2 rounded-sm transition-all flex items-center justify-center gap-1.5 shadow-2xs group-hover:bg-[#D4E8FF]"
                    >
                      <FileText className="w-4 h-4 text-[#3182F6]" />
                      가전제품 스펙 상세보기
                    </button>
                    <button
                      onClick={() => setIsSangjoModalOpen(true)}
                      className="w-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] text-[12px] font-bold py-2 rounded-sm transition-colors flex items-center justify-center gap-1"
                    >
                      상조 서비스 더 자세히 알기
                    </button>
                    <button
                      onClick={() => scrollToInquiry(p)}
                      className="w-full bg-[#3182F6] hover:bg-[#1B64DA] text-white text-[14px] font-bold py-2.5 rounded-sm shadow-xs transition-all flex items-center justify-center gap-2 group-hover:bg-[#1B64DA]"
                    >
                      가전상조 60패키지 상담 신청 <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

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
                onClick={() => setIsPrivacyModalOpen(true)}
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

      {/* Product Specification Detail Modal (가전제품 스펙 상세보기 팝업) */}
      <AnimatePresence>
        {isSpecModalOpen && selectedSpecProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-md max-w-2xl w-full overflow-hidden shadow-2xl border border-[#E5E8EB] flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-[#191F28] text-white p-5 sm:p-6 relative shrink-0">
                <button 
                  onClick={() => setIsSpecModalOpen(false)}
                  className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-extrabold bg-[#3182F6] text-white px-2.5 py-0.5 rounded-xs">
                    가전&상조 60패키지
                  </span>
                  <span className="text-[11px] font-bold bg-white/15 text-[#D1D6DB] px-2 py-0.5 rounded-xs">
                    {(selectedSpecProduct.accountCount || activePackageTab).replace('지원', '').trim()} 전용
                  </span>
                </div>
                <h3 className="text-[20px] sm:text-[22px] font-black text-white line-clamp-1">
                  {selectedSpecProduct.name}
                </h3>
                <p className="text-[13px] text-[#A3B1C6] font-medium mt-0.5">
                  {selectedSpecProduct.brand} {selectedSpecProduct.model}
                </p>
              </div>

              {/* Modal Scrollable Content Body */}
              <div className="p-5 sm:p-6 space-y-6 overflow-y-auto grow">

                {/* Top Section: Image Gallery & Price Summary */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-[#F8FAFC] p-4 rounded-md border border-[#E2E8F0]">
                  {/* Gallery Column */}
                  <div className="md:col-span-5 space-y-2">
                    {(() => {
                      const finalImages = getProductImageList(selectedSpecProduct);
                      const safeIdx = (selectedSpecImageIdx >= 0 && selectedSpecImageIdx < finalImages.length) ? selectedSpecImageIdx : 0;
                      const currentImg = finalImages[safeIdx];

                      return (
                        <>
                          {/* Main Preview Box */}
                          <div className="aspect-square bg-[#F8FAFC] rounded-md border border-[#E2E8F0] relative overflow-hidden p-0 shadow-xs">
                            <img 
                              src={currentImg} 
                              alt={selectedSpecProduct.name}
                              className="w-full h-full object-cover object-center"
                              style={{ objectFit: 'cover', objectPosition: 'center' }}
                            />
                            {safeIdx === 0 && (
                              <span className="absolute top-2 left-2 bg-[#3182F6] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-xs shadow-xs z-10">
                                대표 썸네일
                              </span>
                            )}
                          </div>

                          {/* Thumbnail Switcher List (Full list including representative thumbnail 0 without clipping) */}
                          {finalImages.length > 1 && (
                            <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 max-w-full">
                              {finalImages.map((imgUrl: string, idx: number) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setSelectedSpecImageIdx(idx)}
                                  className={`relative w-11 h-11 rounded-md border-2 p-0.5 overflow-hidden transition-all shrink-0 bg-white cursor-pointer ${
                                    safeIdx === idx ? 'border-[#3182F6] ring-2 ring-[#3182F6]/30 shadow-xs opacity-100 scale-105' : 'border-[#E2E8F0] opacity-70 hover:opacity-100'
                                  }`}
                                  title={idx === 0 ? "대표 썸네일 보기" : `${idx + 1}번 상세 이미지 보기`}
                                >
                                  <img src={imgUrl} alt="" className="w-full h-full object-contain object-center" />
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Summary Pricing Column */}
                  <div className="md:col-span-7 space-y-3">
                    <div className="space-y-1">
                      <span className="text-[12px] font-bold text-[#64748B]">납입 수량 및 금액</span>
                      <div className="text-[22px] font-black text-[#3182F6]">
                        월 {currentPkg.monthlyPrice}원 <span className="text-[13px] text-[#64748B] font-bold">(총 60회)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[12px]">
                      <div className="bg-white p-2.5 rounded-sm border border-[#E2E8F0]">
                        <span className="text-[#64748B] block text-[11px] font-bold">가전 렌탈료</span>
                        <strong className="text-[#1E293B] text-[14px] font-extrabold">{currentPkg.rentalPrice}원</strong>
                      </div>
                      <div className="bg-white p-2.5 rounded-sm border border-[#E2E8F0]">
                        <span className="text-[#64748B] block text-[11px] font-bold">상조 회비</span>
                        <strong className="text-[#1E293B] text-[14px] font-extrabold">{currentPkg.sangjoPrice}원</strong>
                      </div>
                    </div>

                    {selectedSpecProduct.giftText && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-sm text-[12px] font-bold flex items-center gap-1.5">
                        <Gift className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>사은품 : {selectedSpecProduct.giftText}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detailed Product Specifications Table (어드민 수집 스펙 표) */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-[16px] text-[#191F28] flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#3182F6]" /> 상세 가전 스펙 정보
                  </h4>

                  {(!selectedSpecProduct.specifications || selectedSpecProduct.specifications.length === 0) ? (
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-sm p-4 text-[13px] text-[#64748B]">
                      <table className="w-full text-left divide-y divide-[#E2E8F0]">
                        <tbody>
                          <tr>
                            <td className="py-2 font-bold text-[#334155] w-1/3">제품명</td>
                            <td className="py-2 text-[#475569]">{selectedSpecProduct.name}</td>
                          </tr>
                          <tr>
                            <td className="py-2 font-bold text-[#334155]">모델명</td>
                            <td className="py-2 text-[#475569]">{selectedSpecProduct.model}</td>
                          </tr>
                          <tr>
                            <td className="py-2 font-bold text-[#334155]">제조사/브랜드</td>
                            <td className="py-2 text-[#475569]">{selectedSpecProduct.brand || 'LG전자'}</td>
                          </tr>
                          <tr>
                            <td className="py-2 font-bold text-[#334155]">카테고리</td>
                            <td className="py-2 text-[#475569]">{selectedSpecProduct.category || '가전'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-white border border-[#E2E8F0] rounded-sm overflow-hidden shadow-xs">
                      <table className="w-full text-left text-[13px] border-collapse">
                        <thead className="bg-[#F1F5F9] border-b border-[#E2E8F0] text-[#334155]">
                          <tr>
                            <th className="py-3 px-4 font-extrabold w-1/3">스펙 분류 / 항목</th>
                            <th className="py-3 px-4 font-extrabold">상세값</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                          {selectedSpecProduct.specifications.map((spec: any, sIdx: number) => (
                            <tr key={sIdx} className="hover:bg-[#F8FAFC]">
                              <td className="py-2.5 px-4 font-bold text-[#334155] bg-[#F8FAFC]">
                                {spec.category ? <span className="text-[11px] text-[#3182F6] block font-bold">{spec.category}</span> : null}
                                {spec.name}
                              </td>
                              <td className="py-2.5 px-4 text-[#475569] font-medium leading-normal">
                                {spec.value}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Bottom Section: 효원상조 서비스 관련 내용 영역 */}
                <div className="bg-[#191F28] text-white p-5 rounded-md space-y-4 shadow-md">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#3182F6] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-xs">
                        HYOWON LIFE
                      </span>
                      <h5 className="font-extrabold text-[15px] text-white">
                        효원상조 60패키지 결합 케어 혜택 안내
                      </h5>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] text-[#CBD5E1] font-medium pt-1">
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#3182F6] shrink-0 mt-0.5" />
                      <span><strong>가전 100% 소유</strong>: 60회 납입 완료 시 가전 완전 소유권 이전</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#3182F6] shrink-0 mt-0.5" />
                      <span><strong>렌탈료 100% 환급</strong>: 상조 만기 유지 시 가전 렌탈료 전액 지원</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#3182F6] shrink-0 mt-0.5" />
                      <span><strong>24시간 긴급 의전</strong>: 전국 장례지도사 즉시 출동 & 전담 도우미 지원</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#3182F6] shrink-0 mt-0.5" />
                      <span><strong>라이프케어 전환</strong>: 웨딩, 크루즈, 칠팔순 등 당사 타 서비스 전환 가능</span>
                    </div>
                  </div>

                  {/* Eye-catching CTA Banner Button for Premium Funeral Services */}
                  <div className="pt-2 border-t border-[#334155]">
                    <button
                      onClick={() => {
                        setIsSpecModalOpen(false);
                        setIsSangjoModalOpen(true);
                      }}
                      className="w-full bg-gradient-to-r from-[#3182F6] via-[#2563EB] to-[#1D4ED8] hover:from-[#2563EB] hover:to-[#1E40AF] text-white font-extrabold py-3 px-4 rounded-md text-[13px] sm:text-[14px] shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-between gap-2 group cursor-pointer border border-[#60A5FA]/30"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
                        <span className="tracking-tight">프리미엄 장례서비스 내용 바로가기</span>
                      </div>
                      <div className="flex items-center gap-1 text-[12px] text-blue-100 group-hover:translate-x-1 transition-transform">
                        <span>자세히 보기</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>
                  </div>
                </div>

              </div>

              {/* Fixed Bottom Modal Action Bar (하단 상시 고정 상담신청 바) */}
              <div className="p-4 bg-white border-t border-[#E2E8F0] flex gap-3 shrink-0 shadow-lg z-20">
                <button
                  onClick={() => setIsSpecModalOpen(false)}
                  className="bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#475569] font-bold px-5 py-3 rounded-md text-[14px] transition-colors"
                >
                  닫기
                </button>
                <button
                  onClick={() => {
                    setIsSpecModalOpen(false);
                    scrollToInquiry(selectedSpecProduct);
                  }}
                  className="grow bg-[#3182F6] hover:bg-[#1B64DA] text-white font-extrabold py-3 rounded-md text-[14px] shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  ⚡ 이 제품으로 60패키지 상담 신청 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Funeral Service Detail Modal (장례 서비스 자세히 보기 팝업) */}
      <FuneralDetailModal
        isOpen={isSangjoModalOpen}
        onClose={() => setIsSangjoModalOpen(false)}
        onConsultationClick={() => scrollToInquiry()}
      />

      {/* Contact Modal (간편 상담 신청 모달) */}
      <AnimatePresence>
        {isContactModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-md max-w-md w-full overflow-hidden shadow-2xl border border-[#E5E8EB]"
            >
              <div className="bg-[#191F28] text-white p-6 relative">
                <button 
                  onClick={() => setIsContactModalOpen(false)}
                  className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 p-1.5 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="text-[11px] font-extrabold bg-[#3182F6] text-white px-2.5 py-0.5 rounded-xs">
                  FAST CONSULTATION
                </span>
                <h3 className="text-[20px] font-black mt-2">
                  가전상조 60패키지 간편 상담
                </h3>
                <p className="text-[13px] text-[#A3B1C6] font-medium mt-1">
                  선택하신 패키지({activePackageTab})의 혜택 및 신용조회 없는 간편 상담을 안내해 드립니다.
                </p>
              </div>

              <form onSubmit={handleInquirySubmit} className="p-6 space-y-4">
                {selectedProductForInquiry && (
                  <div className="bg-[#F2F8FF] border border-[#B0D0FF] p-3 rounded-md flex items-center gap-3">
                    <img 
                      src={selectedProductForInquiry.image || selectedProductForInquiry.images?.[0]} 
                      alt="" 
                      className="w-12 h-12 object-contain bg-white rounded-sm p-1 border border-[#E5E8EB]"
                    />
                    <div>
                      <span className="text-[11px] font-bold text-[#3182F6]">선택 제품</span>
                      <h5 className="text-[13px] font-extrabold text-[#191F28] line-clamp-1">{selectedProductForInquiry.name}</h5>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[12px] font-bold text-[#4E5968] mb-1">성함</label>
                  <input 
                    type="text" 
                    placeholder="홍길동"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#F9FAFB] border border-[#D1D6DB] px-4 py-3 rounded-md text-[14px] font-bold focus:outline-none focus:border-[#3182F6]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#4E5968] mb-1">연락처</label>
                  <input 
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*" 
                    placeholder="010-0000-0000"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                    className="w-full bg-[#F9FAFB] border border-[#D1D6DB] px-4 py-3 rounded-md text-[14px] font-bold focus:outline-none focus:border-[#3182F6]"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setAgreePrivacy(!agreePrivacy)}
                    className="flex items-center gap-2 text-[12px] text-[#4E5968] font-bold cursor-pointer"
                  >
                    {agreePrivacy ? (
                      <CheckSquare className="w-5 h-5 text-[#3182F6]" />
                    ) : (
                      <Square className="w-5 h-5 text-[#D1D6DB]" />
                    )}
                    개인정보 수집 및 이용 동의 (필수)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrivacyModalOpen(true)}
                    className="text-[11px] text-[#8B95A1] hover:text-[#3182F6] underline cursor-pointer font-medium"
                  >
                    전문보기
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#3182F6] hover:bg-[#1B64DA] text-white font-extrabold py-3.5 rounded-md text-[15px] shadow-sm transition-all mt-2"
                >
                  {isSubmitting ? '신청 처리 중...' : '⚡ 무료 상담 신청 완료'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Persistent Floating Bottom Bar (하단 고대비 다크 고품격 상담바) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] border-t-2 border-[#3182F6] shadow-[0_-12px_35px_rgba(0,0,0,0.4)] py-2.5 px-2 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3">
          
          {/* Left Text */}
          <div className="hidden md:flex items-center gap-3">
            <span className="bg-amber-400 text-[#0F172A] text-[12px] font-black px-2.5 py-1 rounded flex items-center gap-1 shadow-sm">
              <Flame className="w-3.5 h-3.5 fill-current text-rose-600" />
              [{activePackageTab}] 월 {currentPkg.monthlyPrice}원
            </span>
            <div className="text-[14px] font-black text-white flex items-center gap-2">
              <span>가전 100% 무상소유</span>
              <span className="text-amber-400 font-extrabold">+</span>
              <span className="text-[#60A5FA]">상조 만기 시 렌탈료 전액환급</span>
            </div>
          </div>

          {/* Quick Input Bar Form (Fits 100% on all mobile viewports without left/right clipping) */}
          <form 
            onSubmit={handleInquirySubmit}
            className="w-full md:w-auto flex flex-row items-center gap-1.5 sm:gap-2 justify-between"
          >
            <input 
              type="text" 
              placeholder="이름 입력"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-[26%] xs:w-28 sm:w-32 bg-white text-[#191F28] placeholder-[#94A3B8] border-2 border-slate-300 focus:border-[#3182F6] px-2 sm:px-3 py-2 rounded-md sm:rounded-lg text-[12px] sm:text-[13px] font-black focus:outline-none shadow-inner shrink-0"
            />
            <input 
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*" 
              placeholder="010-0000-0000"
              value={phone}
              onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              className="flex-1 min-w-0 bg-white text-[#191F28] placeholder-[#94A3B8] border-2 border-slate-300 focus:border-[#3182F6] px-2 sm:px-3 py-2 rounded-md sm:rounded-lg text-[12px] sm:text-[13px] font-black focus:outline-none shadow-inner"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[#3182F6] via-[#2563EB] to-[#1D4ED8] hover:from-[#2563EB] hover:to-[#1E40AF] text-white font-black px-3 sm:px-7 py-2 rounded-md sm:rounded-lg text-[13px] sm:text-[15px] shadow-[0_0_20px_rgba(49,130,246,0.6)] hover:shadow-[0_0_25px_rgba(49,130,246,0.8)] transition-all flex items-center gap-1 whitespace-nowrap active:scale-[0.98] cursor-pointer shrink-0"
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 fill-amber-300 animate-pulse shrink-0" />
              {isSubmitting ? '신청 중' : '빠른 상담신청'}
            </button>
          </form>

        </div>
      </div>

      {/* Privacy Terms Modal */}
      <PrivacyModal 
        isOpen={isPrivacyModalOpen} 
        onClose={() => setIsPrivacyModalOpen(false)} 
      />
    </div>
  );
}
