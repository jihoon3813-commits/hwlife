import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, ArrowUpRight, Plus, X, Heart, HeartHandshake, ShieldCheck, 
  Truck, Refrigerator, WashingMachine, Tv, Wind, Stethoscope, CalendarCheck, 
  Hospital, CreditCard, Sparkles, ImagePlus, Flower2, Ship, Gem, BadgeCheck, 
  CircleCheck, Menu, ArrowUp, Info, Check, Loader2, PhoneCall,
  FileText, Gift, CheckCircle2, ChevronRight, ChevronLeft, Zap, Eye
} from 'lucide-react';
import { useMutation, useQuery, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useTrackVisit } from '../hooks/useTrackVisit';
import { formatPhoneNumber } from '../utils/phone';
import { getOptimizedImageUrl } from '../utils/lgeUrl';
import SEO from '../components/SEO';
import './LivonCarePage.css';

interface LivonCarePageProps {
  channelSubdomain?: string;
  landingPath?: string;
}

const getProductImageList = (p: any): string[] => {
  if (!p) return ['https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?q=80&w=400'];
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
  if (list.length === 0) {
    list.push('https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?q=80&w=400');
  }
  return list;
};

const products = [
  { name: "프리미엄 냉장고", sub: "주방의 일상을 더 새롭게", icon: Refrigerator },
  { name: "세탁기 · 건조기", sub: "매일의 집안일을 더 가볍게", icon: WashingMachine },
  { name: "대형 TV", sub: "가족이 함께하는 시간을 더 크게", icon: Tv },
  { name: "에어컨", sub: "사계절을 더 쾌적하게", icon: Wind }
];

const healthServices = [
  {
    tab: "평상시 건강관리",
    lead: "작은 궁금증부터,\n진료를 준비하는 순간까지.",
    desc: "혼자 검색하고 고민하던 건강 문제. 필요한 정보를 상담하고 병원 방문을 차근차근 준비하세요.",
    image: "간호사와 건강상담하는 모습",
    src: "https://res.cloudinary.com/lyjyvy54/image/upload/v1794286339/%EB%94%B0%EB%9C%BB%ED%95%9C_%EA%B0%84%ED%98%B8%EC%82%AC%EC%9D%98_%EA%B1%B4%EA%B0%95_%EC%83%81%EB%8B%B4-2_q16uey.png",
    list: [
      ["간호사 건강상담", "건강에 대한 궁금증을 임상 경험을 갖춘 간호사와 상담합니다."],
      ["병원·의료진 정보 안내", "질환에 맞는 진료기관과 의료진 정보를 안내합니다."],
      ["진료 예약 지원", "진료협력센터를 통한 진료 일정 예약을 돕습니다."],
      ["예약 일정 안내", "예약 후 안내를 통해 병원 방문 준비를 돕습니다."]
    ]
  },
  {
    tab: "가족건강관리",
    lead: "우리 가족에게 맞는\n건강관리의 시작.",
    desc: "부모님부터 배우자까지. 어떤 검진을 받아야 할지, 어디로 가야 할지 함께 살펴봅니다.",
    image: "가족 건강검진 상담 모습",
    src: "https://res.cloudinary.com/lyjyvy54/image/upload/v1794286340/%EA%B0%80%EC%A1%B1_%EB%A7%9E%EC%B6%A4_%EA%B1%B4%EA%B0%95%EA%B2%80%EC%A7%84_%EC%83%81%EB%8B%B4-3_r2thnd.png",
    list: [
      ["건강검진 맞춤 상담", "가족의 상황에 맞춰 필요한 검진 항목을 상담합니다."],
      ["제휴 검진 우대혜택", "제휴 기관의 검진 패키지와 우대혜택을 안내합니다."],
      ["검진기관 예약 연계", "전국 제휴 병원·검진센터의 예약을 도와드립니다."],
      ["검진 결과 관련 상담", "검진 후 결과에 관해 궁금한 내용을 상담합니다."]
    ]
  },
  {
    tab: "주요질병 치료지원",
    lead: "중요한 진료 앞에서,\n든든한 동행이 있도록.",
    desc: "낯선 병원, 어려운 설명, 길게 느껴지는 치료 과정. 도움이 필요한 순간에 케어를 연결합니다.",
    image: "간호사가 부모님과 병원에 동행하는 모습",
    src: "https://res.cloudinary.com/lyjyvy54/image/upload/v1794286340/%EC%95%88%EC%8B%AC%EC%9D%84_%EC%A0%84%ED%95%98%EB%8A%94_%EB%B3%91%EC%9B%90_%EB%8F%99%ED%96%89-1_pgfgvd.png",
    list: [
      ["간호사 외래 진료 동행", "대상 질병·이용 조건에 따라 간호사가 진료에 동행합니다."],
      ["치료 과정 이해 지원", "진료·수술·관리 과정에서 필요한 안내를 돕습니다."],
      ["지속적인 건강상담", "진료 이후에도 건강에 관한 상담을 이어갑니다."],
      ["정서적 지지", "치료 과정에서 마음의 부담을 덜 수 있도록 돕습니다."]
    ]
  }
];

const faqs = [
  ["가전과 멤버십을 받으려면 어떤 상품에 가입하나요?", "효원상조 가전&상조 60패키지 3구좌 가입 고객에게 리본케어 PREMIUM 멤버십을 함께 제공하는 구성입니다. 기준 월 납입금은 89,700원이며, 200회 완납 총액은 17,940,000원입니다. 가전은 3구좌 대상 지정 품목에서 선택하며 실제 모델·구성은 상담 시 확인합니다."],
  ["‘추가 비용 없음’은 어떤 의미인가요?", "정해진 효원상조 3구좌 납입금 외에, 이 결합 혜택에 대한 리본케어 프리미엄 멤버십의 별도 가입비가 없다는 의미입니다. 상조·가전 납입금 자체가 무료라는 뜻은 아닙니다. 간병 지원 한도 초과, 대상 외 서비스, 특수 설치, 라이프서비스 옵션 등은 별도 비용이 발생할 수 있습니다."],
  ["간병서비스는 언제, 얼마나 이용할 수 있나요?", "가입 후 2년 경과 시점부터 6년간 이용할 수 있습니다. 가입 시 사전 지정한 대상자에게 전체 서비스 기간 중 총 1회, 최대 30일을 지원합니다. 한 번의 이용이 끝나면 남은 지원일은 소멸하고 분할·이월·양도되지 않습니다. 최대 지원일 초과분은 별도 부담하며 지역·1일 시간·배정 조건을 확인해야 합니다."],
  ["간병을 이용해도 만기 환급금을 받을 수 있나요?", "본 결합안은 간병·헬스케어 이용과 상조 만기 환급을 분리하는 구성입니다. 간병·헬스케어를 이용했더라도 라이프서비스를 사용하지 않은 구좌는 200회 완납 등 약관 조건을 충족하면 가전 렌탈료를 포함한 납입금 전액 환급 대상이 됩니다. 장례·크루즈·웨딩 이용 구좌의 정산 및 환급 처리는 별도로 적용됩니다."],
  ["장례·크루즈·웨딩은 어떻게 선택하나요?", "3구좌 기준으로 1구좌당 1회, 총 3회의 라이프서비스를 선택할 수 있으며 같은 종류의 중복 선택도 가능합니다. 각 구좌의 서비스 이용 또는 미사용 만기 환급 중 선택하는 구조입니다. 서비스 전환가·제공 범위·잔여 부금 정산·추가 옵션 비용은 계약 조건에 따릅니다."],
  ["중도 해지하거나 가입 심사에서 제한될 수도 있나요?", "개인의 신용 상태와 BSON 렌탈 심사 결과에 따라 가입이 제한될 수 있습니다. 가전 렌탈과 상조는 별도 계약이며, 중도 해지 시 상조 해약환급금은 납입액보다 적거나 없을 수 있습니다. 가전 잔여 렌탈대금 및 위약금이 일시 청구될 수 있고 멤버십 처리도 결합 계약 조건을 확인해야 합니다."]
];

const notices = [
  ["가입 및 계약", "본 페이지는 효원상조 3구좌 가입 시 리본케어 프리미엄 멤버십을 추가 제공하는 결합 구성안입니다. 가전 렌탈·상조·멤버십은 제공 주체와 적용 약관이 다릅니다. 개인 신용점수 및 BSON 렌탈 심사에 따라 가입이 제한될 수 있습니다. 최종 계약서의 적용 상품명·조건을 확인해야 합니다."],
  ["납입 조건", "가전&상조 60패키지 3구좌 기준 월 89,700원, 200회 완납 총액 17,940,000원입니다. 1~60회는 가전 렌탈료 월 80,730원과 상조부금 월 8,970원, 61~200회는 상조부금 월 89,700원으로 구성됩니다. 60회는 가전 렌탈 납입기간이며 상조 만기와 다릅니다. ‘추가 가입비 0원’은 멤버십의 추가 가입비에 한합니다."],
  ["만기 환급", "200회 완납 및 해당 구좌의 라이프서비스 미사용 등 약관 조건을 충족한 경우 가전 렌탈료를 포함한 납입금 100% 환급을 적용하는 구성입니다. 간병·헬스케어 이용과는 분리됩니다. 장례·크루즈·웨딩을 이용한 구좌는 서비스 정산 조건이 적용되어 미사용 만기 환급과 중복되지 않습니다. 지급 시점·신청 절차는 최종 약관에 따릅니다. 국가 또는 공제조합의 전액 현금 지급 보증이 아닙니다."],
  ["중도 해지", "상조 해약환급금은 납입 회차·기간·약관에 따라 납입금보다 적거나 없을 수 있습니다. 가전 렌탈 계약 해지 시 잔여 렌탈대금 및 위약금이 일시 청구될 수 있습니다. 상조 해지가 가전 계약의 자동 해지를 의미하지 않으며, 제공된 멤버십의 종료·환수 등 처리는 결합 계약 기준 확인이 필요합니다."],
  ["간병 지원", "서비스는 가입 후 2년 경과 시점부터 6년간 제공됩니다. 최초 2년은 미제공 기간입니다. 가입 시 사전 지정한 대상자에게 전체 서비스 기간 중 총 1회, 최대 30일 지원합니다. 한 번의 간병 이용 종료 시 잔여일은 소멸하며 분할·이월·양도되지 않습니다. 최대 지원일 초과분은 별도 부담합니다. 제공 지역, 1일 기준 시간, 이용 대상, 신청·배정 기준은 최종 안내와 가입 조건에 따릅니다."],
  ["헬스케어", "평상시 건강관리·가족건강관리·주요질병 치료지원은 교보다솜케어 제휴 예정 구성입니다. 실제 항목·대상 질병·가족 범위·횟수·지역·예약 및 비용 부담은 최종 제휴 조건에 따릅니다. 병원 예약은 확정을 보장하지 않으며, 검진 우대혜택이 검진비 전액 무료를 의미하지 않습니다."],
  ["라이프서비스", "3구좌 기준 1구좌당 1회, 장례·크루즈·웨딩 중 총 3회 선택할 수 있으며 중복 선택이 가능합니다. 실제 서비스 범위, 전환 기준, 예약, 잔여 부금 정산, 차액·추가 옵션 비용은 서비스별 약관을 따릅니다."],
  ["가전 배송·A/S", "가전은 3구좌 대상 지정 LG·삼성 정품 중 선택합니다. 가입·승인 후 통상 1~2주 내 배송·기본 설치 및 대상 폐가전 수거를 안내하되, 제품 재고·지역·일정·현장 조건에 따라 달라질 수 있습니다. 특수 설치·추가 자재·이전 설치 등은 별도 비용이 발생할 수 있으며, 수거 대상과 A/S 범위·무상 기간은 제조사 및 공급사 기준을 적용합니다."],
  ["제휴카드", "BSON 제휴카드 청구할인은 카드 발급·자동납부·전월 실적 등 조건 충족 시 적용되며 카드별 할인액·한도·기간·연회비·제외 항목이 다릅니다. 발급과 할인은 카드사 심사 및 정책을 따릅니다. 카드 발급은 선택입니다. 기본 월 납입금 89,700원은 할인 전 금액이며, 월 65,000원은 제휴카드 할인 조건을 충족한 경우의 적용가로 별도 표시했습니다."]
];

function PhotoSlot({
  label, 
  ratio = "4:3", 
  className = "", 
  id, 
  src
}: { 
  label: string; 
  ratio?: string; 
  className?: string; 
  id: string; 
  src?: string;
}) {
  return (
    <div 
      className={`photo-slot ${className}`} 
      data-image-slot={id} 
      role="img" 
      aria-label={`${label} 이미지`}
    >
      {src ? (
        <img src={src} alt={label} loading="lazy" />
      ) : (
        <>
          <span className="slot-corner tl" />
          <span className="slot-corner tr" />
          <span className="slot-corner bl" />
          <span className="slot-corner br" />
          <div className="slot-content">
            <ImagePlus strokeWidth={1} size={32} />
            <strong>{label}</strong>
            <small>IMAGE AREA · {ratio}</small>
          </div>
        </>
      )}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

function BenefitSticker({ 
  step, 
  text, 
  variant = "coral",
  rotate = -2 
}: { 
  step: string; 
  text: string; 
  variant?: "coral" | "forest" | "mint";
  rotate?: number; 
}) {
  return (
    <div 
      className={`benefit-sticker sticker-${variant}`} 
      style={{ '--sticker-rotate': `${rotate}deg` } as React.CSSProperties}
    >
      <span className="sticker-pin">STEP {step}</span>
      <strong className="sticker-text">{text}</strong>
      <Sparkles className="sticker-sparkle" size={13} />
    </div>
  );
}

const LIVON_LOGO_URL = "https://res.cloudinary.com/lyjyvy54/image/upload/v1794282248/%ED%95%B4%ED%94%BC%ED%9A%A8%EC%9B%90_%ED%8A%B8%EB%A6%AC%ED%94%8C%EC%BC%80%EC%96%B4_%ED%95%98%EC%9A%B0%EC%8A%A4_%EB%A1%9C%EA%B3%A0_1_1_ujkwhi.png";

function Brand() {
  return (
    <a href="#" className="brand" aria-label="해피효원 트리플케어 하우스 홈">
      <img
        src={LIVON_LOGO_URL}
        alt="해피효원 트리플케어 하우스"
        className="brand-logo-img"
      />
    </a>
  );
}

export default function LivonCarePage({ 
  channelSubdomain, 
  landingPath = "/triplecare" 
}: LivonCarePageProps) {
  // Track visits Universal Hook
  useTrackVisit(channelSubdomain, landingPath);

  // Convex Queries & Mutations
  const allProducts = useQuery(api.products.getVisibleProducts);
  const dbPlans = useQuery(api.plans.get);
  const createInquiry = useMutation(api.inquiries.create);

  // 플랜 매칭: 가전&상조 60패키지(트리플) / 3구좌 대상 플랜
  const triplePlan = useMemo(() => {
    return dbPlans?.find(p => 
      (p.name?.includes('60패키지') && (p.name?.includes('트리플') || p.accountCount === '3구좌')) ||
      p.accountCount === '3구좌' ||
      p.numericId === 7
    );
  }, [dbPlans]);

  // 어드민 > 제품관리 > 가전&상조 60패키지(트리플) 리스트에 있는 제품 실시간 필터링
  const tripleProducts = useMemo(() => {
    if (!allProducts) return [];
    const targetPlanId = triplePlan?.numericId ?? 7;
    return allProducts.filter(p => {
      // 1) 플랜 ID 일치 (7번 등)
      if (p.planId === targetPlanId) return true;
      // 2) 3구좌로 등록된 가전
      if (p.accountCount === '3구좌') return true;
      // 3) 트리플 플랜의 numericId 일치
      if (triplePlan && p.planId === triplePlan.numericId) return true;
      return false;
    });
  }, [allProducts, triplePlan]);

  // States
  const [brand, setBrand] = useState<"전체" | "LG전자" | "삼성전자">("전체");

  const brandCounts = useMemo(() => {
    const lg = tripleProducts.filter(p => {
      const b = (p.brand || '').toLowerCase();
      const n = (p.name || '').toLowerCase();
      return b.includes('lg') || n.includes('lg') || b.includes('엘지');
    }).length;
    const samsung = tripleProducts.filter(p => {
      const b = (p.brand || '').toLowerCase();
      const n = (p.name || '').toLowerCase();
      return b.includes('삼성') || n.includes('삼성') || b.includes('samsung');
    }).length;
    return {
      all: tripleProducts.length,
      lg,
      samsung,
    };
  }, [tripleProducts]);

  const displayProducts = useMemo(() => {
    if (brand === "전체") return tripleProducts;
    return tripleProducts.filter(p => {
      const b = (p.brand || '').toLowerCase();
      const n = (p.name || '').toLowerCase();
      if (brand === "LG전자") {
        return b.includes('lg') || n.includes('lg') || b.includes('엘지');
      }
      if (brand === "삼성전자") {
        return b.includes('삼성') || n.includes('삼성') || b.includes('samsung');
      }
      return true;
    });
  }, [tripleProducts, brand]);

  const [health, setHealth] = useState(0);
  const [combo, setCombo] = useState(0);
  const [menu, setMenu] = useState(false);
  const [interest, setInterest] = useState("전체 혜택 상담");
  
  // Modal states
  const [isConsultOpen, setIsConsultOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [selectedSpecProduct, setSelectedSpecProduct] = useState<any | null>(null);
  const [selectedSpecImageIdx, setSelectedSpecImageIdx] = useState(0);

  const scrapeProductInfoAction = useAction(api.crawler.scrapeProductInfo);
  const [isScrapingSpec, setIsScrapingSpec] = useState(false);

  const openSpecModal = async (product: any) => {
    setSelectedSpecProduct(product);
    setSelectedSpecImageIdx(0);
    setIsSpecModalOpen(true);

    // 만약 DB에 specifications가 없거나 비어있는 경우 온라인에서 실시간 크롤링 시도
    if ((!product.specifications || product.specifications.length === 0) && product.model) {
      try {
        setIsScrapingSpec(true);
        const scraped = await scrapeProductInfoAction({
          model: product.model.trim(),
          brand: product.brand,
          category: product.category,
        });
        if (scraped && scraped.success && scraped.specifications && scraped.specifications.length > 0) {
          setSelectedSpecProduct((prev: any) => {
            if (!prev || prev._id !== product._id) return prev;
            return {
              ...prev,
              specifications: scraped.specifications,
              images: scraped.images && scraped.images.length > 0 ? scraped.images : prev.images,
            };
          });
        }
      } catch (err) {
        console.warn("실시간 온라인 스펙 조회 중 안내 (기본 스펙 유지):", err);
      } finally {
        setIsScrapingSpec(false);
      }
    }
  };

  const closeSpecModal = () => {
    setIsSpecModalOpen(false);
  };

  const thumbScrollRef = useRef<HTMLDivElement>(null);
  const scrollThumb = (dir: 'left' | 'right') => {
    if (thumbScrollRef.current) {
      thumbScrollRef.current.scrollBy({
        left: dir === 'left' ? -120 : 120,
        behavior: 'smooth'
      });
    }
  };

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [time, setTime] = useState("가능한 빠른 시간");
  const [isAgreed, setIsAgreed] = useState(true);

  // Benefits section highlight animation
  const benefitsRef = useRef<HTMLDivElement>(null);
  const [benefitsVisible, setBenefitsVisible] = useState(false);
  const isPopStateCloseRef = useRef(false);

  // Mobile Back Button PopState Handling for Modals
  useEffect(() => {
    const isAnyModalOpen = isSpecModalOpen || isConsultOpen || isPrivacyOpen;

    const handlePopState = () => {
      if (isSpecModalOpen || isConsultOpen || isPrivacyOpen) {
        isPopStateCloseRef.current = true;
        if (isSpecModalOpen) {
          setIsSpecModalOpen(false);
        } else if (isPrivacyOpen) {
          setIsPrivacyOpen(false);
        } else if (isConsultOpen) {
          setIsConsultOpen(false);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    if (isAnyModalOpen) {
      if (!isPopStateCloseRef.current) {
        window.history.pushState({ modalOpen: true }, '');
      }
      isPopStateCloseRef.current = false;
    } else {
      if (!isPopStateCloseRef.current && window.history.state?.modalOpen) {
        window.history.back();
      }
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isSpecModalOpen, isConsultOpen, isPrivacyOpen]);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      setBenefitsVisible(true);
      return;
    }
    const el = benefitsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setBenefitsVisible(true);
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);


  const combinations = [
    ["장례", "장례", "장례"],
    ["장례", "장례", "크루즈"],
    ["장례", "크루즈", "웨딩"]
  ];

  const openConsult = (item = "전체 혜택 상담") => {
    setInterest(item);
    setSubmitted(false);
    setIsConsultOpen(true);
    setMenu(false);
  };

  const closeConsult = () => {
    setIsConsultOpen(false);
  };

  const openPrivacy = () => {
    setIsPrivacyOpen(true);
  };

  const closePrivacy = () => {
    setIsPrivacyOpen(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("성함을 입력해 주세요.");
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      alert("올바른 연락처 번호를 입력해 주세요.");
      return;
    }
    if (!isAgreed) {
      alert("개인정보 수집 및 이용에 동의해 주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createInquiry({
        name: name.trim(),
        phone: phone.trim(),
        productName: `효원상조 트리플케어 (${interest})`,
        account: "3구좌",
        callTime: time,
        landingPath: landingPath,
        channelId: channelSubdomain || undefined,
        message: `[효원상조 트리플케어 신청]\n관심혜택: ${interest}\n상담희망시간: ${time}`,
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Consultation submit error:", err);
      alert("상담 접수 중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hs = healthServices[health];

  return (
    <div className="livon-page-wrapper">
      <SEO 
        title="효원상조 트리플케어 | 최신가전 & 최대 1개월 간병/헬스케어"
        description="LG·삼성 대형가전 교체, 간병인 지원 최장 1개월, 프리미엄 헬스케어까지! 효원상조 3구좌 가입 특별 결합 상품 트리플케어."
        image="https://res.cloudinary.com/lyjyvy54/image/upload/v1794287243/%EA%B0%80%EC%A0%84_%EB%8F%8C%EB%B4%84_%EA%B1%B4%EA%B0%95%EC%9D%84_%EC%9E%87%EB%8A%94_%EA%B0%80%EC%A1%B1_%EC%BC%80%EC%96%B4_klpbh5.png"
      />
      <a className="skip" href="#main">본문 바로가기</a>
      
      {/* Top Banner */}
      <div className="top-banner">
        효원상조 3구좌 가입 특별 혜택 
        <span>
          리본케어 PREMIUM 멤버십 추가 가입비 0원 
          <ArrowUpRight size={14} />
        </span>
      </div>

      {/* Navigation Header */}
      <header className="header">
        <div className="container nav-inner">
          <Brand />
          <nav className={menu ? "nav open" : "nav"} aria-label="주 메뉴">
            {[
              ["benefits", "특별 혜택"],
              ["appliances", "가전 라인업"],
              ["care", "간병·헬스케어"],
              ["payment", "납입·환급"],
              ["faq", "자주 묻는 질문"],
            ].map(([id, label]) => (
              <a 
                key={id} 
                href={`#${id}`} 
                onClick={() => setMenu(false)}
              >
                {label}
              </a>
            ))}
          </nav>
          <button className="button small" onClick={() => openConsult("전체 혜택 상담")}>
            혜택 상담받기 <ArrowUpRight size={16} />
          </button>
          <button 
            className="menu-toggle" 
            aria-label={menu ? "메뉴 닫기" : "메뉴 열기"} 
            aria-expanded={menu} 
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main id="main">
        {/* Hero Section */}
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="hero-tag">
                <span /> 효원상조 트리플케어
              </div>
              <h1>
                가전은 지금.<br />
                부모님 돌봄은<br />
                <em>더 든든하게.</em>
              </h1>
              <p className="hero-desc">
                LG·삼성 대형가전에, <b>최대 1개월 간병</b>과<br />
                프리미엄 헬스케어까지 한 번에 준비하세요.
              </p>
              <div className="hero-chips">
                <span><Check size={16} /> 3구좌 가입 특별 구성</span>
                <span><Check size={16} /> 멤버십 추가 가입비 0원</span>
              </div>
              <button 
                className="button coral large" 
                onClick={() => openConsult("우리 가족 프리미엄 혜택")}
              >
                우리 가족 프리미엄 혜택 확인하기 <ArrowRight size={20} />
              </button>
              <p className="hero-price">
                3구좌 기준 월 <strong>89,700원</strong> <span>· 200회 총 17,940,000원</span>
              </p>
              <p className="fine">
                간병·헬스케어는 가입 2년 경과 후 6년간 제공됩니다.<br />
                간병은 지정 대상자 총 1회·최대 30일, 세부 이용 조건 적용.
              </p>
            </div>
            
            <div className="hero-art">
              <div className="orb orb-one" />
              <div className="orb orb-two" />
              <PhotoSlot 
                id="hero" 
                className="hero-photo" 
                label="부모님과 함께하는 따뜻한 일상" 
                ratio="4:5" 
                src="https://res.cloudinary.com/lyjyvy54/image/upload/v1794287378/%EB%94%B0%EB%9C%BB%ED%95%9C_%EA%B0%80%EC%A1%B1_%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84_%ED%99%88%EC%BC%80%EC%96%B4_%EA%B3%B5%EA%B0%84_ux3ghm.png"
              />
              <div className="care-float">
                <span className="round-icon">
                  <HeartHandshake size={23} />
                </span>
                <div>
                  <small>꼭 필요한 순간을 위해</small>
                  <strong>간병인 지원 최대 <b>30일</b></strong>
                </div>
              </div>
              <div className="membership-card">
                <img 
                  src="https://res.cloudinary.com/lyjyvy54/image/upload/v1794290632/LivOn_%EB%94%A5_%ED%94%8C%EB%9F%BC_%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84_%EC%B9%B4%EB%93%9C_dkk9yc.png" 
                  alt="LivOn Care Membership Premium 카드" 
                  className="membership-card-img" 
                  loading="eager"
                />
              </div>
              <div className="hero-art-caption">EVERYDAY COMFORT. LIFELONG CARE.</div>
            </div>
          </div>
        </section>

        {/* Benefits Summary Section */}
        <section id="benefits" className="benefits section">
          <div className="container">
            <div className="section-head centered">
              <Eyebrow>ONE CHOICE, MORE CARE</Eyebrow>
              <h2>
                가전을 바꾸는 선택에,<br />
                <em>가족을 위한 케어</em>를 더했습니다.
              </h2>
              <p>효원상조 트리플케어 3구좌 가입으로 만나는 세 가지 프리미엄 혜택</p>
            </div>
            <div ref={benefitsRef} className={`benefit-grid ${benefitsVisible ? 'is-visible' : ''}`}>
              <article>
                <span className="number">01</span>
                <Refrigerator />
                <h3>LG·삼성 대형가전</h3>
                <p>매일 사용하는 가전을<br />공식 정품으로 새롭게.</p>
                <span className="benefit-bottom">
                  3구좌 대상 품목 선택 <ArrowUpRight size={18} />
                </span>
              </article>
              <div className="plus-sign"><Plus /></div>
              <article className="featured-benefit">
                <span className="number">02</span>
                <HeartHandshake />
                <h3>최대 1개월 간병 지원</h3>
                <p>가족에게 돌봄이 필요한 순간,<br />리본케어가 곁에서.</p>
                <span className="benefit-bottom">
                  지정 대상자 1회 · 최대 30일 <ArrowUpRight size={18} />
                </span>
              </article>
              <div className="plus-sign"><Plus /></div>
              <article>
                <span className="number">03</span>
                <Stethoscope />
                <h3>프리미엄 헬스케어</h3>
                <p>건강상담·병원 예약부터<br />간호사 동행까지.</p>
                <span className="benefit-bottom">
                  교보다솜케어 제휴 예정 구성 <ArrowUpRight size={18} />
                </span>
              </article>
            </div>
            <div className="benefit-note">
              <ShieldCheck size={21} />
              <p>간병·헬스케어를 이용해도, <strong>상조 만기 환급 조건은 별도로 적용됩니다.</strong></p>
              <a href="#refund">환급 조건 보기 <ArrowRight size={16} /></a>
            </div>
          </div>
        </section>

        {/* Appliances Section */}
        <section id="appliances" className="section appliances">
          <div className="container">
            <div className="section-head horizontal">
              <div>
                <BenefitSticker step="01" text="최신가전으로 바꾸고" variant="coral" rotate={-3.5} />
                <Eyebrow>BENEFIT 01 / PREMIUM APPLIANCES</Eyebrow>
                <h2>매일 쓰는 가전부터,<br /><em>기분 좋은 변화.</em></h2>
              </div>
              <div>
                <p>부모님 댁에도, 우리 집에도.<br />LG·삼성의 대형가전을 만나보세요.</p>
                <div className="brand-tabs" role="group" aria-label="가전 브랜드">
                  {(["전체", "LG전자", "삼성전자"] as const).map((x) => {
                    const count = x === "전체" ? brandCounts.all : x === "LG전자" ? brandCounts.lg : brandCounts.samsung;
                    return (
                      <button 
                        key={x} 
                        className={brand === x ? "active" : ""} 
                        aria-pressed={brand === x} 
                        onClick={() => setBrand(x)}
                      >
                        {x}
                        <span className="brand-count-badge">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {allProducts === undefined ? (
              <div className="product-grid">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="product-skeleton-card">
                    <div className="product-skeleton-visual animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-1/3 mt-3 animate-pulse" />
                    <div className="h-5 bg-gray-200 rounded w-3/4 mt-2 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 mt-2 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : displayProducts.length === 0 ? (
              <div className="product-empty-state">
                <p>선택하신 브랜드에 등록된 가전이 없습니다.</p>
                <button onClick={() => setBrand("전체")} className="button outline text-sm mt-3">
                  전체 가전 보기
                </button>
              </div>
            ) : (
              <div className="product-grid">
                {displayProducts.map((p) => {
                  const cardImg = p.image || (p.images && p.images[0]);
                  const optImg = cardImg ? getOptimizedImageUrl(cardImg, 'thumb') : 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?q=80&w=400';
                  const brandName = p.brand || (p.name.includes('LG') ? 'LG전자' : p.name.includes('삼성') ? '삼성전자' : 'LG전자');

                  return (
                    <article 
                      className="product livon-product-card group cursor-pointer h-full flex flex-col" 
                      key={p._id}
                      onClick={() => openSpecModal(p)}
                    >
                      <div className="product-visual relative overflow-hidden">
                        <span className="product-brand">{brandName}</span>
                        {p.model && (
                          <span className="product-model-chip">
                            {p.model}
                          </span>
                        )}
                        <div className="product-img-box">
                          <img 
                            src={optImg} 
                            alt={p.name}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?q=80&w=400';
                            }}
                          />
                        </div>
                        <div className="product-hover-overlay">
                          <span className="spec-view-pill">
                            <Eye size={14} /> 상세 스펙 보기
                          </span>
                        </div>
                      </div>

                      <div className="product-info-wrap flex-1 flex flex-col">
                        <small className="product-cat-label">{p.category || '가전'}</small>
                        <h3 
                          className="product-name-title" 
                          title={p.name}
                          style={{ fontSize: '15px', lineHeight: 1.45, minHeight: '66px' }}
                        >
                          {p.name}
                        </h3>

                        <div className="product-action-row mt-auto" onClick={(e) => e.stopPropagation()}>
                          <button 
                            type="button"
                            className="product-spec-btn" 
                            onClick={() => openSpecModal(p)}
                            title="상세 스펙 보기"
                          >
                            <FileText size={13} /> 스펙 보기
                          </button>
                          <button 
                            type="button"
                            className="product-consult-btn" 
                            onClick={() => openConsult(`${brandName} ${p.name}`)}
                          >
                            상담 신청 <ArrowUpRight size={13} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <p className="fine">
              위 가전 리스트는 가전&상조 60패키지 3구좌 가입 대상 지정 모델입니다. 제품을 클릭하시면 제조사 공식 상세 스펙을 실시간으로 확인하실 수 있으며, 모델·수량·재고·설치 환경에 따라 상세 조건이 달라질 수 있습니다.
            </p>

            <div className="delivery-row">
              <div>
                <BadgeCheck />
                <span>
                  <b>LG·삼성 공식 정품</b>
                  <small>제조사 정식 A/S 적용</small>
                </span>
              </div>
              <div>
                <Truck />
                <span>
                  <b>무료 배송·기본 설치</b>
                  <small>가입·승인 후 통상 1~2주</small>
                </span>
              </div>
              <div>
                <Refrigerator />
                <span>
                  <b>폐가전 무료 수거</b>
                  <small>대상 품목·수거 조건 적용</small>
                </span>
              </div>
            </div>

            <p className="fine">
              배송 일정은 승인·재고·지역에 따라 달라지며, 특수 설치 등 추가 작업 비용과 A/S 무상 기간은 제품별 기준이 적용됩니다.
            </p>
          </div>
        </section>

        {/* Caregiving Section */}
        <section id="care" className="section caregiving">
          <div className="container care-layout">
            <div className="care-photo-wrap">
              <PhotoSlot 
                id="caregiving" 
                label="부모님의 곁을 지키는 간병인" 
                ratio="4:5" 
                src="https://res.cloudinary.com/lyjyvy54/image/upload/v1794286341/%EC%86%90%EC%9D%84_%EB%A7%9E%EC%9E%A1%EC%9D%80_%EB%94%B0%EB%9C%BB%ED%95%9C_%EB%8F%99%ED%96%89_vczc9t.png"
              />
              <div className="care-quote">
                <Heart size={20} />
                <span>대신할 수 없는 마음에,<br /><strong>곁을 지키는 돌봄을 더합니다.</strong></span>
              </div>
            </div>

            <div className="care-copy">
              <BenefitSticker step="02" text="간병인 지원도 받고" variant="forest" rotate={3} />
              <Eyebrow>BENEFIT 02 / LIVON CARE</Eyebrow>
              <h2>가족에게 꼭 필요한 순간,<br />한 달의 든든함.</h2>
              <div className="big-days">
                <span>간병인 지원 최대</span>
                <div>
                  <strong>30</strong>
                  <b>일</b>
                  <span className="day-seal">PREMIUM<br />MEMBERSHIP</span>
                </div>
              </div>
              <p className="body-copy">
                부모님이 입원하셨을 때, 가족의 일상이 멈추지 않도록.<br />
                리본케어의 간병서비스로 돌봄의 부담을 덜어드립니다.
              </p>
              <div className="care-checks">
                <p><CircleCheck /> 리본케어가 직접 제공하는 전문 간병서비스</p>
                <p><CircleCheck /> 프리미엄 멤버십으로 최대 1개월(30일) 지원</p>
                <p><CircleCheck /> 정해진 지원 범위 내 간병 이용료 추가 부담 없음</p>
              </div>
              <div className="care-terms">
                <CalendarCheck size={19} />
                <p>
                  <strong>가입 2년 경과 후부터 6년간</strong><br />
                  사전 지정 대상자에게 총 1회, 최대 30일 지원.<br />
                  이용 종료 시 잔여일 소멸·지원 한도 초과분 별도 부담.
                </p>
              </div>
              <a className="text-button" href="#notices">
                간병 이용 조건 자세히 보기 <ArrowRight size={17} />
              </a>
            </div>
          </div>
        </section>

        {/* Healthcare Section */}
        <section id="health" className="section health">
          <div className="container">
            <div className="section-head centered">
              <BenefitSticker step="03" text="가족건강 관리도 받고" variant="mint" rotate={-2.5} />
              <Eyebrow>BENEFIT 03 / PREMIUM HEALTHCARE</Eyebrow>
              <h2>아프기 전에도, 치료 중에도.<br /><em>가족의 건강을 더 가까이.</em></h2>
              <p>건강상담부터 병원 예약, 간호사 동행까지 이어지는 케어</p>
              <span className="partner-label">
                교보다솜케어 제휴 예정 · 실제 제공 범위는 최종 제휴 조건 적용
              </span>
            </div>

            <div className="health-tabs" role="tablist" aria-label="헬스케어 서비스">
              {healthServices.map((x, i) => (
                <button 
                  role="tab" 
                  aria-selected={health === i} 
                  aria-controls={`health-panel-${i}`} 
                  id={`health-tab-${i}`} 
                  key={x.tab} 
                  onClick={() => setHealth(i)} 
                  className={health === i ? "active" : ""}
                >
                  <span>0{i + 1}</span>
                  {x.tab}
                  <ArrowUpRight size={18} />
                </button>
              ))}
            </div>

            <div 
              className="health-panel" 
              role="tabpanel" 
              id={`health-panel-${health}`} 
              aria-labelledby={`health-tab-${health}`}
            >
              <div className="health-intro">
                <span className="mini-label">{hs.tab}</span>
                <h3>{hs.lead}</h3>
                <p>{hs.desc}</p>
                <PhotoSlot 
                  id={`health-${health + 1}`} 
                  label={hs.image} 
                  ratio="16:9" 
                  src={hs.src}
                />
              </div>
              <div className="health-details">
                {hs.list.map(([t, d], i) => {
                  const Icon = [Stethoscope, Hospital, CalendarCheck, Heart][i];
                  return (
                    <article key={t}>
                      <span><Icon size={23} /></span>
                      <div>
                        <h4>{t}</h4>
                        <p>{d}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <p className="fine">
              건강관리·치료지원은 의료 진단이나 치료 자체를 대신하지 않습니다. 이용 대상·대상 질병·지역·횟수 및 검진 비용은 세부 조건에 따라 적용됩니다.
            </p>
          </div>
        </section>

        {/* Payment & Terms Section */}
        <section id="payment" className="section payment">
          <div className="container">
            <div className="section-head horizontal">
              <div>
                <Eyebrow>MORE BENEFITS, CLEARER PAYMENT</Eyebrow>
                <h2>혜택은 더하고,<br />납입은 한눈에.</h2>
              </div>
              <p>
                상조 3구좌의 정해진 납입금 그대로.<br />
                <strong>리본케어 프리미엄 멤버십 추가 가입비 0원.</strong>
              </p>
            </div>

            <div className="payment-layout">
              <div className="price-box">
                <span className="pill">가전&상조 60패키지 · 3구좌 기준</span>
                <p className="monthly"><small>월</small> 89,700<span>원</span></p>
                <div className="price-line">
                  <span>200회 완납 총액</span>
                  <strong>17,940,000원</strong>
                </div>
                <div className="price-line accent">
                  <span>프리미엄 멤버십 추가 가입비</span>
                  <strong>0원</strong>
                </div>
                <p className="fine">제휴카드 할인 전 기준. 제품 선택 및 최종 계약 조건 확인.</p>
              </div>

              <div className="timeline">
                <div className="timeline-item">
                  <span className="timeline-dot" />
                  <div>
                    <span className="timeline-tag">1~60회</span>
                    <h3>가전 렌탈료 + 상조부금</h3>
                    <div className="payment-split">
                      <span>가전 월 <b>80,730원</b></span>
                      <Plus size={15} />
                      <span>상조 월 <b>8,970원</b></span>
                    </div>
                    <p>60회 납입 완료 시 가전 소유권 이전 조건 적용</p>
                  </div>
                </div>

                <div className="timeline-item">
                  <span className="timeline-dot" />
                  <div>
                    <span className="timeline-tag">61~200회</span>
                    <h3>상조부금 월 89,700원</h3>
                    <p>가전 렌탈 납입 종료 후 상조 납입 지속</p>
                  </div>
                </div>

                <div className="timeline-item">
                  <span className="timeline-dot" />
                  <div>
                    <span className="timeline-tag">200회 완납 · 라이프서비스 미사용</span>
                    <h3>약관 조건 충족 후 만기 환급</h3>
                    <p>가전 렌탈료 포함 납입금 전액 100% 환급</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="credit-banner">
              <div className="credit-art" aria-hidden="true">
                <span>BSON</span>
                <CreditCard size={25} />
                <small>PARTNER CARD</small>
              </div>
              <div>
                <span className="mini-label">매월 부담을 더 가볍게</span>
                <h3>BSON 제휴카드 청구할인도 함께.</h3>
                <p>
                  카드 없이 내는 금액과, 할인 적용 금액을 나누어 확인하세요.<br />
                  카드 발급·자동납부·전월 실적 등 조건 충족 시 적용됩니다.
                </p>
                <small>할인액·한도·기간·연회비는 카드사 최신 상품 안내 기준</small>
              </div>
              <button 
                className="button outline" 
                onClick={() => openConsult("BSON 제휴카드 할인")}
              >
                할인 조건 상담 <ArrowUpRight size={17} />
              </button>
            </div>
          </div>
        </section>

        {/* Refund Section */}
        <section id="refund" className="section refund">
          <div className="container refund-layout">
            <div>
              <Eyebrow>CARE TODAY, VALUE TOMORROW</Eyebrow>
              <h2>돌봄의 혜택을 누려도,<br />만기 환급은 그대로.</h2>
              <p>
                간병·헬스케어 이용과 관계없이,<br />
                상조 만기 조건 충족 시 가전 렌탈료를 포함한<br />
                납입금 전액을 돌려받는 구성입니다.
              </p>
              <div className="refund-number">
                <strong>100</strong>
                <span>%<small>만기 환급</small></span>
              </div>
              <p className="refund-note">
                200회 완납·해당 구좌 라이프서비스 미사용 등 약관 조건 충족 시.<br />
                만기 환급은 효원상조 계약에 따른 혜택이며, 국가·공제조합의 전액 현금 보증을 의미하지 않습니다.
              </p>
            </div>

            <div className="refund-receipt">
              <div className="receipt-head">
                <ShieldCheck />
                <span>3구좌 모두 미사용 · 만기 기준</span>
              </div>
              <h3>우리 가족의 만기 혜택</h3>
              <dl>
                <div>
                  <dt>상조부금</dt>
                  <dd>환급 포함 <Check size={16} /></dd>
                </div>
                <div>
                  <dt>가전 렌탈료</dt>
                  <dd>환급 포함 <Check size={16} /></dd>
                </div>
                <div>
                  <dt>간병·헬스케어 이용</dt>
                  <dd>만기 환급과 별개</dd>
                </div>
              </dl>
              <div className="receipt-total">
                <span>만기 환급 기준 금액</span>
                <strong>17,940,000<small>원</small></strong>
              </div>
              <p>
                라이프서비스를 이용한 구좌는 서비스 정산 조건이 적용됩니다. 이용과 환급이 같은 구좌에 중복 제공되는 것은 아닙니다.
              </p>
            </div>
          </div>
        </section>

        {/* Life Services Section */}
        <section id="life" className="section life">
          <div className="container">
            <div className="section-head centered">
              <Eyebrow>THREE ACCOUNTS, YOUR CHOICE</Eyebrow>
              <h2>우리 가족의 중요한 순간,<br />원하는 라이프서비스 <em>총 3회.</em></h2>
              <p>
                장례·크루즈·웨딩 중 가족에게 필요한 서비스를 선택하세요.<br />
                1구좌당 1회, 같은 서비스도 중복 선택할 수 있습니다.
              </p>
            </div>

            <div className="life-grid">
              {[
                { 
                  name: "품격 있는 장례", 
                  tag: "FUNERAL", 
                  icon: Flower2, 
                  id: "funeral", 
                  desc: "마지막 배웅을 정성스럽게",
                  image: "https://res.cloudinary.com/lyjyvy54/image/upload/v1794287243/%EC%95%84%EC%9D%B4%EB%B3%B4%EB%A6%AC_%EA%B5%AD%ED%99%94%EC%99%80_%EC%B4%9B%EB%B6%88%EC%9D%98_%EC%B6%94%EB%AA%A8_%EA%B3%B5%EA%B0%84-3_znbbhk.png"
                },
                { 
                  name: "설레는 크루즈", 
                  tag: "CRUISE", 
                  icon: Ship, 
                  id: "cruise", 
                  desc: "소중한 사람과 특별한 추억",
                  image: "https://res.cloudinary.com/lyjyvy54/image/upload/v1794287243/%EB%94%B0%EB%9C%BB%ED%95%9C_%ED%96%87%EC%82%B4_%EC%86%8D_%EC%A7%80%EC%A4%91%ED%95%B4_%ED%81%AC%EB%A3%A8%EC%A6%88-1_worf8c.png"
                },
                { 
                  name: "빛나는 웨딩", 
                  tag: "WEDDING", 
                  icon: Gem, 
                  id: "wedding", 
                  desc: "새로운 시작을 아름답게",
                  image: "https://res.cloudinary.com/lyjyvy54/image/upload/v1794287242/%ED%96%87%EC%82%B4_%EA%B0%80%EB%93%9D%ED%95%9C_%EC%A0%95%EC%9B%90_%EC%86%8D_%EC%8B%A0%ED%98%BC%EC%9D%98_%EB%AF%B8%EC%86%8C-2_ovetix.png"
                }
              ].map((x) => (
                <article key={x.id}>
                  <PhotoSlot id={x.id} label={`${x.name} 이미지`} ratio="4:3" src={x.image} />
                  <div className="life-caption">
                    <x.icon size={22} />
                    <small>{x.tag}</small>
                    <h3>{x.name}</h3>
                    <p>{x.desc}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="combination">
              <div>
                <strong>우리 가족에게 맞는 선택 예시</strong>
                <p>원하는 조합을 눌러보세요.</p>
              </div>
              <div className="combo-options">
                {["장례 중심", "장례 + 여행", "다양한 서비스"].map((x, i) => (
                  <button 
                    key={x} 
                    onClick={() => setCombo(i)} 
                    aria-pressed={combo === i} 
                    className={combo === i ? "active" : ""}
                  >
                    {x}
                  </button>
                ))}
              </div>
              <div className="combo-result" aria-live="polite">
                {combinations[combo].map((x, i) => (
                  <span key={i}>
                    <small>{i + 1}구좌</small>
                    {x}
                  </span>
                ))}
                <b>= 총 3회</b>
              </div>
            </div>

            <p className="fine">
              서비스별 제공 범위·전환가·예약 가능 여부·잔여 납입금 정산 및 추가 옵션 비용은 약관에 따릅니다. 라이프서비스 이용 구좌에는 미사용 만기 환급이 중복 적용되지 않습니다.
            </p>
          </div>
        </section>

        {/* Trust Section */}
        <section id="trust" className="section trust">
          <div className="container">
            <div className="section-head centered">
              <Eyebrow>TRUST, IN EVERY PART</Eyebrow>
              <h2>누가 제공하는지까지,<br /><em>확실히 확인하세요.</em></h2>
              <p>상조·간병·헬스케어, 각 분야의 제공 역할을 명확하게.</p>
            </div>

            <div className="trust-grid">
              <article>
                <span className="trust-role">상조 · 라이프서비스</span>
                <h3 className="trust-brand">
                  <img 
                    src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786415950/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_opfls9.png" 
                    alt="효원상조" 
                    className="trust-brand-img"
                  />
                </h3>
                <strong>20년 이상 이어온 경험</strong>
                <ul>
                  <li><Check /> 선불식 할부거래업 등록</li>
                  <li><Check /> 상조보증공제조합 보전기관</li>
                  <li><Check /> ‘내상조그대로’ 참여업체</li>
                </ul>
                <a href="https://www.kmaca.or.kr/mysangjo/guide.do" target="_blank" rel="noreferrer">
                  참여업체 안내 확인 <ArrowUpRight size={15} />
                </a>
              </article>

              <article>
                <span className="trust-role">간병서비스 직접 제공</span>
                <h3 className="trust-brand">
                  <img 
                    src="https://res.cloudinary.com/lyjyvy54/image/upload/v1792052606/LivOn_1_rptk5n.png" 
                    alt="리본케어 LivOn" 
                    className="trust-brand-img"
                  />
                </h3>
                <strong>보험사 간병서비스 협력 경험</strong>
                <ul>
                  <li><Check /> 현대해상 간병서비스 운영</li>
                  <li><Check /> 삼성화재 간병서비스 파트너*</li>
                  <li><Check /> 실제 간병인 연계·운영 지원</li>
                </ul>
                <a href="https://www.hankyung.com/article/202604061504O" target="_blank" rel="noreferrer">
                  현대해상 협력 기사 보기 <ArrowUpRight size={15} />
                </a>
              </article>

              <article>
                <span className="trust-role">건강관리 · 치료지원</span>
                <h3 className="trust-brand">
                  <img 
                    src="https://res.cloudinary.com/lyjyvy54/image/upload/v1794286941/logo-dasomcare_1_ayi1iz.png" 
                    alt="교보다솜케어" 
                    className="trust-brand-img"
                  />
                </h3>
                <strong>건강상담부터 진료 동행까지</strong>
                <ul>
                  <li><Check /> 평상시 건강관리</li>
                  <li><Check /> 가족건강관리</li>
                  <li><Check /> 주요질병 치료지원</li>
                </ul>
                <span className="status-chip">제휴 예정 · 세부 범위 확정 후 적용</span>
              </article>
            </div>

            <p className="fine">
              * 삼성화재 협력은 제공받은 사업 안내 기준입니다. 보험사 협력 이력은 본 결합상품에 대한 보험사의 보증이나 보험 보장을 뜻하지 않습니다. ‘내상조그대로’는 정해진 조건의 상조서비스 보장제도입니다.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="section faq">
          <div className="container faq-grid">
            <div className="section-head">
              <Eyebrow>GOOD TO KNOW</Eyebrow>
              <h2>가입 전 궁금한 점,<br />먼저 확인하세요.</h2>
              <p>큰 혜택만큼,<br />이용 조건도 알기 쉽게.</p>
              <HeartHandshake size={72} strokeWidth={1} />
            </div>
            <div className="faq-list">
              {faqs.map(([q, a], i) => (
                <details key={q}>
                  <summary>
                    <span>Q{i + 1}.</span>
                    <h3>{q}</h3>
                    <Plus size={19} />
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Closing Offer & Consultation Section */}
        <section id="consult" className="section closing">
          <div className="container">
            <div className="closing-top">
              <div className="closing-copy">
                <Eyebrow>ALL THE BENEFITS, ONE PLAN</Eyebrow>
                <h2>이 모든 혜택을,<br />월 <em>89,700원</em>에.</h2>
                <ul className="closing-benefits">
                  <li>
                    <Refrigerator aria-hidden="true" />
                    <span>최신 <strong>LG·삼성 대형가전 교체</strong></span>
                  </li>
                  <li>
                    <HeartHandshake aria-hidden="true" />
                    <span>간병인 지원 <strong>최장 1개월</strong></span>
                  </li>
                  <li>
                    <Stethoscope aria-hidden="true" />
                    <span>가족을 위한 <strong>프리미엄 헬스케어</strong></span>
                  </li>
                </ul>

                <div className="closing-card-price">
                  <div className="closing-card-label">
                    <CreditCard size={19} aria-hidden="true" />
                    <span>BSON 제휴카드 할인까지 받으면</span>
                  </div>
                  <div className="closing-discount">
                    <span>월</span>
                    <strong>65,000</strong>
                    <span>원</span>
                    <small>청구할인 적용가</small>
                  </div>
                </div>

                <div className="closing-price-terms">
                  3구좌 기준 · 카드별 전월 실적·자동납부·할인기간 등 조건 충족 시 적용.<br />
                  할인 전 월 89,700원 × 200회, 총 납입금 17,940,000원.
                </div>
                <div className="closing-care-terms">
                  간병·헬스케어는 가입 2년 후부터 제공됩니다.<br />
                  간병은 지정 대상자 총 1회, 최대 30일이며 세부 이용 조건이 적용됩니다.
                </div>

                <button className="button coral large" onClick={() => openConsult("전체 혜택 상담")}>
                  이 모든 혜택, 지금 상담받기 <ArrowUpRight size={21} />
                </button>
                <small>상담만으로 가입되지 않습니다. 조건 확인 후 결정하세요.</small>
              </div>

              <div className="closing-visual">
                <PhotoSlot 
                  id="closing-family" 
                  label="부모님과 자녀의 따뜻한 순간" 
                  ratio="4:3" 
                  src="https://res.cloudinary.com/lyjyvy54/image/upload/v1794287243/%EA%B0%80%EC%A0%84_%EB%8F%8C%EB%B4%84_%EA%B1%B4%EA%B0%95%EC%9D%84_%EC%9E%87%EB%8A%94_%EA%B0%80%EC%A1%B1_%EC%BC%80%EC%96%B4_klpbh5.png"
                />
                <span className="closing-seal">
                  <Heart />CARE FOR<br />YOUR FAMILY
                </span>
              </div>
            </div>

            <div className="steps">
              {[
                ["01", "간편 상담", "관심 가전과 혜택 확인"],
                ["02", "조건 확인", "총 납입·이용 조건 안내"],
                ["03", "계약·심사", "상조·렌탈 계약 각각 확인"],
                ["04", "가전 배송", "설치 일정 및 멤버십 안내"]
              ].map(([n, t, d]) => (
                <div key={n}>
                  <span>{n}</span>
                  <strong>{t}</strong>
                  <p>{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Notices Section */}
        <section id="notices" className="notices">
          <div className="container">
            <div className="notice-heading">
              <Info size={21} />
              <h2>가입 전 꼭 확인해 주세요</h2>
            </div>
            <p className="notice-intro">
              효원상조 가전&상조 60패키지 및 리본케어 프리미엄 안내 기준 · 2026.11.09 확인
            </p>
            <dl>
              {notices.map(([title, text]) => (
                <div key={title}>
                  <dt>{title}</dt>
                  <dd>{text}</dd>
                </div>
              ))}
            </dl>
            <div className="source-links">
              <span>기준 상품 안내</span>
              <a href="https://hyowon-life.com/package60" target="_blank" rel="noreferrer">
                효원상조 가전결합 <ArrowUpRight size={14} />
              </a>
              <a href="https://livon-members.vercel.app/2" target="_blank" rel="noreferrer">
                리본케어 멤버십 <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-top">
            <Brand />
            <button className="to-top" aria-label="맨 위로" onClick={scrollToTop}>
              <ArrowUp size={19} />
            </button>
          </div>
          <p>상조·라이프서비스: 효원상조 · 간병서비스: 리본케어 · 헬스케어: 교보다솜케어 제휴 예정</p>
          <p>본 상품은 효원상조 트리플케어 3구좌 결합 상품입니다. 전문 상담원을 통해 상세 조건을 확인하세요.</p>
          <div className="footer-bottom">
            <span>© HYOWON × LIVON CARE. ALL RIGHTS RESERVED.</span>
            <a href="#notices">상품 이용 안내</a>
          </div>
        </div>
      </footer>

      {/* Sticky Bottom Bar */}
      <div className="sticky-cta">
        <div className="container">
          <div>
            <small>효원상조 3구좌 특별 구성</small>
            <strong>가전 + 최대 30일 간병 + 프리미엄 헬스케어</strong>
          </div>
          <button className="button coral" onClick={() => openConsult("하단 고정 상담 신청")}>
            혜택 상담받기 <ArrowUpRight size={18} />
          </button>
        </div>
      </div>

      {/* Consultation Modal */}
      {isConsultOpen && (
        <div 
          className="livon-modal-backdrop" 
          onClick={(e) => {
            if (e.target === e.currentTarget) closeConsult();
          }}
        >
          <div className="livon-modal-container" role="dialog" aria-labelledby="consult-title">
            <button 
              className="livon-modal-close" 
              onClick={closeConsult} 
              aria-label="상담 창 닫기"
            >
              <X size={20} />
            </button>

            {submitted ? (
              <div className="form-result">
                <CircleCheck size={56} />
                <h2 id="consult-title">무료 상담 신청 완료</h2>
                <p>
                  <strong>{name}</strong> 고객님의 상담 신청이 정상 접수되었습니다.<br />
                  전문 상담사가 확인 후 빠른 시일 내에 연락드리겠습니다.
                </p>
                <button className="button large coral" onClick={closeConsult} style={{ width: '100%' }}>
                  확인 <ArrowRight size={17} />
                </button>
              </div>
            ) : (
              <>
                <Eyebrow>PREMIUM BENEFIT CONSULTATION</Eyebrow>
                <h2 id="consult-title">
                  우리 가족에게 맞는<br />
                  혜택을 확인하세요.
                </h2>
                <p className="livon-modal-description">
                  선택 가전부터 납입 조건, 간병·헬스케어 이용까지 전문 상담원이 상세히 안내해 드립니다.
                </p>

                <form onSubmit={handleSubmit}>
                  <label htmlFor="interest">관심 혜택</label>
                  <select 
                    id="interest" 
                    value={interest} 
                    onChange={(e) => setInterest(e.target.value)}
                  >
                    {Array.from(new Set([
                      interest,
                      "전체 혜택 상담",
                      "LG전자 대형가전",
                      "삼성전자 대형가전",
                      "부모님 간병·헬스케어",
                      "납입·환급 조건",
                      "BSON 제휴카드 할인"
                    ])).map((x) => (
                      <option key={x} value={x}>{x}</option>
                    ))}
                  </select>

                  <div className="form-row">
                    <div>
                      <label htmlFor="name">이름</label>
                      <input 
                        id="name" 
                        name="name" 
                        placeholder="성함" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required 
                        autoComplete="name" 
                        maxLength={30} 
                      />
                    </div>
                    <div>
                      <label htmlFor="phone">연락처</label>
                      <input 
                        id="phone" 
                        name="phone" 
                        type="tel" 
                        placeholder="010-0000-0000" 
                        value={phone}
                        onChange={handlePhoneChange}
                        required 
                        autoComplete="tel" 
                        maxLength={14} 
                      />
                    </div>
                  </div>

                  <label htmlFor="time">상담 희망 시간</label>
                  <select 
                    id="time" 
                    value={time} 
                    onChange={(e) => setTime(e.target.value)}
                  >
                    <option value="가능한 빠른 시간">가능한 빠른 시간</option>
                    <option value="오전 9시~12시">오전 9시~12시</option>
                    <option value="오후 12시~6시">오후 12시~6시</option>
                    <option value="저녁 6시 이후">저녁 6시 이후</option>
                  </select>

                  <div className="consent">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={isAgreed}
                        onChange={(e) => setIsAgreed(e.target.checked)}
                        required 
                      /> 
                      [필수] 개인정보 수집 및 이용 동의
                    </label>
                    <button type="button" onClick={openPrivacy}>
                      내용 보기
                    </button>
                  </div>

                  <button 
                    className="button coral form-submit large" 
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        상담 신청 접수 중...
                      </>
                    ) : (
                      <>
                        <PhoneCall size={18} />
                        무료 상담 신청하기
                      </>
                    )}
                  </button>

                  <p className="fine">
                    신청 시 전문 상담원이 친절히 상담을 도와드리며, 상담 신청만으로 가입되지 않습니다.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Privacy Notice Modal */}
      {isPrivacyOpen && (
        <div 
          className="livon-modal-backdrop" 
          onClick={(e) => {
            if (e.target === e.currentTarget) closePrivacy();
          }}
        >
          <div className="livon-modal-container" role="dialog" aria-labelledby="privacy-title">
            <button 
              className="livon-modal-close" 
              onClick={closePrivacy} 
              aria-label="개인정보 안내 닫기"
            >
              <X size={20} />
            </button>
            <h2 id="privacy-title">개인정보 수집 및 이용 안내</h2>
            <div style={{ fontSize: '13px', lineHeight: 1.8, color: '#556358', margin: '20px 0' }}>
              <p style={{ marginBottom: '12px' }}>
                <strong>1. 수집하는 개인정보 항목</strong><br />
                - 필수항목: 성명, 휴대전화번호, 상담 희망시간, 관심 품목
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>2. 개인정보 수집 및 이용 목적</strong><br />
                - 효원상조 트리플케어 상품 가입 상담 및 혜택 안내, 본인 확인
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>3. 개인정보 보유 및 이용 기간</strong><br />
                - 상담 신청일로부터 6개월 간 보관 후 안전하게 파기 (관련 법령에 따라 보존할 필요가 있는 경우 해당 법정 기간 동안 보관)
              </p>
              <p>
                * 귀하는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있으나, 동의를 거부하실 경우 상담 및 가입 안내가 제한될 수 있습니다.
              </p>
            </div>
            <button className="button" onClick={closePrivacy} style={{ width: '100%' }}>
              확인
            </button>
          </div>
        </div>
      )}

      {/* Product Specification Detail Modal (리본케어 디자인 스타일의 60패키지 실시간 상세 스펙 팝업) */}
      <AnimatePresence>
        {isSpecModalOpen && selectedSpecProduct && (
          <div 
            className="livon-spec-modal-backdrop"
            onClick={closeSpecModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ duration: 0.2 }}
              className="livon-spec-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Scrollable Container (헤더 + 본문 스크롤) */}
              <div className="livon-spec-scroll-container">
                {/* Modal Header */}
                <div className="livon-spec-header">
                  <button 
                    type="button"
                    onClick={closeSpecModal}
                    className="livon-spec-close-btn"
                    title="닫기"
                    aria-label="닫기"
                  >
                    <X size={20} />
                  </button>

                  <div className="livon-spec-badges">
                    <span className="spec-badge-brand">
                      가전&상조 60패키지
                    </span>
                    <span className="spec-badge-account">
                      3구좌 전용 (트리플)
                    </span>
                  </div>

                  <h3 className="livon-spec-title">
                    {selectedSpecProduct.name}
                  </h3>
                  <p className="livon-spec-subtitle">
                    {selectedSpecProduct.brand || 'LG전자'} {selectedSpecProduct.model}
                  </p>
                </div>

                {/* Modal Body */}
                <div className="livon-spec-body">
                  {/* Top: Image Gallery & Pricing Summary */}
                  <div className="livon-spec-summary-card">
                    {/* Left: Gallery Column */}
                    <div className="livon-spec-gallery">
                      {(() => {
                        const finalImages = getProductImageList(selectedSpecProduct);
                        const safeIdx = (selectedSpecImageIdx >= 0 && selectedSpecImageIdx < finalImages.length) ? selectedSpecImageIdx : 0;
                        const currentImg = finalImages[safeIdx];

                        return (
                          <>
                            {/* Main Preview Box */}
                            <div className="livon-spec-main-preview">
                              <div className="livon-spec-img-inner">
                                <img 
                                  src={currentImg} 
                                  alt={selectedSpecProduct.name}
                                  referrerPolicy="no-referrer"
                                  decoding="async"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?q=80&w=400';
                                  }}
                                />
                              </div>
                              {safeIdx === 0 && (
                                <span className="livon-spec-thumb-tag">
                                  대표 썸네일
                                </span>
                              )}
                            </div>

                            {/* Thumbnail Switcher List */}
                            {finalImages.length > 1 && (
                              <div className="livon-spec-thumb-wrapper">
                                {finalImages.length > 4 && (
                                  <button
                                    type="button"
                                    onClick={() => scrollThumb('left')}
                                    className="livon-spec-thumb-nav-btn prev"
                                    title="이전 이미지"
                                    aria-label="이전 이미지"
                                  >
                                    <ChevronLeft size={16} />
                                  </button>
                                )}
                                <div ref={thumbScrollRef} className="livon-spec-thumb-list">
                                  {finalImages.map((imgUrl: string, idx: number) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setSelectedSpecImageIdx(idx)}
                                      className={`livon-spec-thumb-btn ${safeIdx === idx ? 'active' : ''}`}
                                      title={idx === 0 ? "대표 썸네일 보기" : `${idx + 1}번 상세 이미지 보기`}
                                    >
                                      <img 
                                        src={imgUrl} 
                                        alt="" 
                                        referrerPolicy="no-referrer" 
                                        decoding="async"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.onerror = null;
                                          target.src = 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?q=80&w=400';
                                        }}
                                      />
                                    </button>
                                  ))}
                                </div>
                                {finalImages.length > 4 && (
                                  <button
                                    type="button"
                                    onClick={() => scrollThumb('right')}
                                    className="livon-spec-thumb-nav-btn next"
                                    title="다음 이미지"
                                    aria-label="다음 이미지"
                                  >
                                    <ChevronRight size={16} />
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Right: Pricing Column */}
                    <div className="livon-spec-pricing">
                      <div className="livon-price-title-wrap">
                        <span className="livon-price-label">납입 수량 및 금액</span>
                        <div className="livon-price-value-row">
                          <strong className="livon-price-main">
                            월 89,700원
                          </strong>
                          <span className="livon-price-sub">
                            (총 60회)
                          </span>
                        </div>
                      </div>

                      <div className="livon-price-breakdown">
                        <div className="livon-breakdown-card">
                          <span className="breakdown-label">가전 렌탈료</span>
                          <strong className="breakdown-val">80,730원</strong>
                        </div>
                        <div className="livon-breakdown-card">
                          <span className="breakdown-label">상조 회비</span>
                          <strong className="breakdown-val">8,970원</strong>
                        </div>
                      </div>

                      {selectedSpecProduct.giftText && (
                        <div className="livon-gift-box">
                          <Gift size={16} />
                          <span>사은품: {selectedSpecProduct.giftText}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detailed Product Specifications Table */}
                  <div className="livon-spec-section">
                    <div className="flex items-center justify-between">
                      <h4 className="livon-spec-section-title">
                        <FileText size={18} /> 상세 가전 스펙 정보
                      </h4>
                      {isScrapingSpec && (
                        <div className="flex items-center gap-1.5 text-xs text-[#eb6b58] font-bold">
                          <Loader2 size={13} className="animate-spin" />
                          <span>온라인 최신 스펙 불러오는 중...</span>
                        </div>
                      )}
                    </div>

                    {(!selectedSpecProduct.specifications || selectedSpecProduct.specifications.length === 0) ? (
                      <div className="livon-spec-table-empty">
                        <table className="livon-spec-table">
                          <tbody>
                            <tr>
                              <td className="spec-label-col">제품명</td>
                              <td>{selectedSpecProduct.name}</td>
                            </tr>
                            <tr>
                              <td className="spec-label-col">모델명</td>
                              <td>{selectedSpecProduct.model}</td>
                            </tr>
                            <tr>
                              <td className="spec-label-col">제조사/브랜드</td>
                              <td>{selectedSpecProduct.brand || 'LG전자'}</td>
                            </tr>
                            <tr>
                              <td className="spec-label-col">카테고리</td>
                              <td>{selectedSpecProduct.category || '가전'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="livon-spec-table-wrapper">
                        <table className="livon-spec-table">
                          <thead>
                            <tr>
                              <th style={{ width: '35%' }}>스펙 분류 / 항목</th>
                              <th>상세값</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedSpecProduct.specifications.map((spec: any, sIdx: number) => (
                              <tr key={sIdx}>
                                <td className="spec-label-col">
                                  {spec.category && (
                                    <span className="spec-category-tag">{spec.category}</span>
                                  )}
                                  <span className="spec-name-text">{spec.name}</span>
                                </td>
                                <td className="spec-value-col">
                                  {spec.value}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Combination Benefit Care Card */}
                  <div className="livon-spec-benefit-card">
                    <div className="spec-benefit-head">
                      <span className="spec-benefit-badge">
                        HYOWON × LIVON CARE
                      </span>
                      <h5>
                        효원상조 60패키지 3구좌 결합 케어 혜택 안내
                      </h5>
                    </div>

                    <div className="spec-benefit-list">
                      <div>
                        <CheckCircle2 size={16} />
                        <span><strong>가전 100% 소유</strong>: 60회 납입 완료 시 가전 완전 소유권 이전</span>
                      </div>
                      <div>
                        <CheckCircle2 size={16} />
                        <span><strong>렌탈료 100% 환급</strong>: 200회 완납 및 상조 만기 유지 시 가전 렌탈료 전액 지원</span>
                      </div>
                      <div>
                        <CheckCircle2 size={16} />
                        <span><strong>최대 30일 전문 간병 지원</strong>: 가입 2년 경과 시부터 전문 간병인 파견 케어</span>
                      </div>
                      <div>
                        <CheckCircle2 size={16} />
                        <span><strong>라이프케어 전환 & 24시간 의전</strong>: 장례, 크루즈, 웨딩 등 당사 타 서비스로 100% 전환 가능</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Bottom Modal Action Bar */}
              <div className="livon-spec-footer">
                <button
                  type="button"
                  onClick={closeSpecModal}
                  className="livon-spec-btn-close"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeSpecModal();
                    openConsult(`${selectedSpecProduct.brand || ''} ${selectedSpecProduct.name}`.trim());
                  }}
                  className="livon-spec-btn-consult"
                >
                  <Zap size={16} className="fill-current" />
                  <span>혜택 상담 신청하기</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
