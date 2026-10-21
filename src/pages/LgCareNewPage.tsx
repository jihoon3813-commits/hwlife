import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useTrackVisit } from '../hooks/useTrackVisit';
import SEO from '../components/SEO';
import PrivacyModal from '../components/PrivacyModal';
import LgCareCatalogModal, { SelectedProductPlan } from '../components/LgCareCatalogModal';
import { formatPhoneNumber } from '../utils/phone';
import { Check, X, Phone, User, CheckCircle2, ChevronRight, Copy, ArrowUpRight, Sparkles, SlidersHorizontal } from 'lucide-react';

interface LgCareNewPageProps {
  channelSubdomain?: string;
  landingPath?: string;
}

const DRAWINGS = [
  // 0: 냉장고
  (
    <g>
      <rect x="38" y="10" width="64" height="110" rx="5" fill="#d9d6cb" />
      <path d="M70 10V120M38 72H102" stroke="#8e9588" />
      <path d="M65 31V52M75 31V52" stroke="#899080" strokeWidth="2" />
    </g>
  ),
  // 1: 세탁·건조기
  (
    <g>
      <rect x="43" y="6" width="54" height="117" rx="5" fill="#839482" />
      <circle cx="70" cy="38" r="20" fill="#263c34" />
      <circle cx="70" cy="92" r="20" fill="#263c34" />
      <path d="M43 63H97" stroke="#b6c1ad" strokeWidth="5" />
    </g>
  ),
  // 2: 정수기
  (
    <g>
      <rect x="42" y="30" width="56" height="83" rx="7" fill="#d3d7ca" />
      <rect x="49" y="58" width="43" height="44" rx="5" fill="#657666" />
      <path d="M65 56H79V66" fill="none" stroke="#243c32" strokeWidth="5" />
      <rect x="63" y="82" width="18" height="20" rx="3" fill="#f3f3ea" />
    </g>
  ),
  // 3: 주방가전
  (
    <g>
      <rect x="28" y="37" width="84" height="76" rx="4" fill="#d5d8cb" />
      <rect x="28" y="37" width="84" height="13" fill="#66735d" />
      <path d="M40 57H100" stroke="#77846a" strokeWidth="3" />
      <circle cx="101" cy="43" r="2" fill="#e9edde" />
    </g>
  ),
  // 4: 스타일러
  (
    <g>
      <rect x="44" y="9" width="53" height="113" rx="3" fill="#b4bba9" />
      <rect x="48" y="13" width="45" height="105" fill="#cdd4c5" />
      <path d="M83 51V75" stroke="#79886e" strokeWidth="3" />
    </g>
  ),
  // 5: 공기·냉방가전
  (
    <g>
      <rect x="45" y="36" width="51" height="77" rx="21" fill="#e2e3d6" />
      <ellipse cx="70" cy="40" rx="25" ry="8" fill="#92a180" />
      <ellipse cx="70" cy="40" rx="18" ry="4" fill="#4c6247" />
      <path d="M56 62V99M63 62V104M70 62V105M77 62V104M84 62V99" stroke="#b5c0a7" />
    </g>
  )
];

const APPLIANCE_NAMES = ['냉장고', '세탁·건조기', '정수기', '주방가전', '스타일러', '공기·냉방가전'];

const APPLIANCE_CATEGORY_MAP: Record<number, string> = {
  0: 'fridge',      // 냉장고
  1: 'washer',      // 세탁·건조기
  2: 'water',       // 정수기
  3: 'dishwasher',  // 주방가전
  4: 'styler',      // 스타일러
  5: 'aircon',      // 공기·냉방가전
};

const FAQS = [
  {
    q: '월 5,000원만 내면 가전을 사용할 수 있나요?',
    a: '월 5,000원은 상조 1구좌의 초기 1~48회 회비입니다. LG 구독료는 별도이며 대상 제품에 10% 할인이 적용됩니다. 상조회비는 49~200회 회당 28,000원입니다. 48개월 이후 바로 이어 납부하지 않아도 가입 상태는 유지됩니다.'
  },
  {
    q: '가전 구독이 끝나면 상조 납입도 끝나나요?',
    a: '두 계약은 별도입니다. 가전 구독은 60~72개월, 상조는 총 200회 납입 구조입니다. 48개월 이후 곧바로 월 28,000원씩 납부하지 않아도 상조 가입 상태는 유지됩니다. 잔여 납입금이 면제되는 것은 아니며, 만기 환급·축하금은 200회 완납 등 조건 충족 후 적용됩니다.'
  },
  {
    q: '만기축하금 144만원은 언제 받나요?',
    a: '200회 완납 및 라이프서비스 미사용 등 약관 조건을 충족한 후 환급 신청 시 지급됩니다. 매월 연속 납입 시 16년 8개월이며, 납입 일정에 따라 완납 시점이 달라집니다. 가입 즉시 또는 가전 구독 종료 시 받는 금액이 아닙니다.'
  },
  {
    q: '서비스를 이용해도 만기 지급액을 받나요?',
    a: '안내된 만기 총 지급액은 라이프서비스 미사용 등을 조건으로 합니다. 서비스 이용 시 잔여 납입금 정산과 환급·축하금 처리 조건은 별도로 확인해야 합니다.'
  },
  {
    q: '중간에 해지하면 어떻게 되나요?',
    a: '각 계약의 해지 조건이 적용됩니다. 상조 해약환급금은 납입 회차와 약관에 따라 납입액보다 적거나 없을 수 있습니다. 가전 구독 해지 정산 및 할인 처리 조건도 가입 전에 확인해주세요.'
  },
  {
    q: '제휴카드를 반드시 만들어야 하나요?',
    a: '제휴카드는 선택 사항입니다. 카드 없이 적용되는 견적과 전월 실적 등을 충족했을 때의 혜택을 나누어 안내받을 수 있습니다.'
  },
  {
    q: '기존에 이용 중인 LG 구독에도 적용되나요?',
    a: '기존 계약 전환 가능 여부는 계약 상태와 대상 조건 확인이 필요합니다. 이용 중인 모델과 계약 정보를 상담 시 알려주세요.'
  },
  {
    q: '이 페이지에서 바로 상담이 접수되나요?',
    a: '이 페이지에서는 원하는 조건을 계산하고 간편하게 맞춤 상담을 신청할 수 있습니다. 상단 또는 하단 상담 신청 버튼을 통해 담당 매니저의 친절한 유선 안내를 받으실 수 있습니다.'
  }
];

export default function LgCareNewPage({ channelSubdomain, landingPath = '/care_new' }: LgCareNewPageProps) {
  // Real-time visit analytics tracking
  useTrackVisit(channelSubdomain, landingPath);

  // Queries & Mutations
  const channel = useQuery(api.channels.getBySubdomain, channelSubdomain ? { subdomain: channelSubdomain } : "skip");
  const createInquiry = useMutation(api.inquiries.create);

  // Calculator State
  const [selectedAppliance, setSelectedAppliance] = useState<string>('아직 고민 중');
  const [selectedApplianceIndex, setSelectedApplianceIndex] = useState<number | null>(null);
  const [price, setPrice] = useState<number>(100000);
  const [months, setMonths] = useState<number>(72);
  const [exampleTier, setExampleTier] = useState<50000 | 100000>(100000);
  const [copyStatus, setCopyStatus] = useState<string>('');

  // Appliance Catalog Modal State
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogInitialCategory, setCatalogInitialCategory] = useState<string>('all');

  // Inquiry Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [callTime, setCallTime] = useState('언제나 가능');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Calculations
  const discountedPrice = useMemo(() => Math.round(price * 0.9), [price]);
  const monthlyDiscount = useMemo(() => Math.round(price * 0.1), [price]);
  const totalDiscount = useMemo(() => Math.round(price * 0.1 * months), [price, months]);

  const won = (n: number) => Math.round(n).toLocaleString('ko-KR') + '원';

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    if (rawVal === '') {
      setPrice(0);
      return;
    }
    const val = Number(rawVal);
    if (!isNaN(val)) {
      if (val > 10000000) return;
      setPrice(val);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(Number(e.target.value));
  };

  const handleSelectAppliance = (index: number) => {
    setSelectedApplianceIndex(index);
    setSelectedAppliance(APPLIANCE_NAMES[index]);
    const targetCat = APPLIANCE_CATEGORY_MAP[index] || 'all';
    setCatalogInitialCategory(targetCat);
    setIsCatalogModalOpen(true);
  };

  const handleOpenFullCatalog = () => {
    setCatalogInitialCategory('all');
    setIsCatalogModalOpen(true);
  };

  const handleApplyCatalogPlan = (plan: SelectedProductPlan) => {
    setSelectedApplianceIndex(null);
    setSelectedAppliance(`[${plan.product.model}] ${plan.product.name} (${plan.optionSummary})`);
    setPrice(plan.originalPrice);
    setMonths(plan.term === '60' ? 60 : 72);
    setIsCatalogModalOpen(false);
    setTimeout(() => {
      const calcEl = document.getElementById('calculator');
      if (calcEl) {
        calcEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleDirectConsultCatalogPlan = (plan: SelectedProductPlan) => {
    setSelectedApplianceIndex(null);
    setSelectedAppliance(`[${plan.product.model}] ${plan.product.name} (${plan.optionSummary})`);
    setPrice(plan.originalPrice);
    setMonths(plan.term === '60' ? 60 : 72);
    setIsCatalogModalOpen(false);
    setIsModalOpen(true);
  };

  const quoteText = useMemo(() => {
    return `[효원상조 × LG 가전구독 상담 희망]
• 관심 가전: ${selectedAppliance}
• 할인 전 월 구독료(계산용): ${won(price)}
• 10% 할인 적용 가전 구독료: ${won(discountedPrice)} / ${months}개월
• 상조 1구좌: 1~48회 회당 5,000원 / 49~200회 회당 28,000원
※ 48개월 이후 즉시 납입을 이어가지 않아도 가입 상태 유지. 잔여 납입금 면제는 아니며 만기 혜택은 200회 완납 등 조건 충족 시 적용.
실제 적용 제품, 납입 재개 및 계약 조건 확인을 요청합니다.`;
  }, [selectedAppliance, price, discountedPrice, months]);

  const handleCopyQuote = async () => {
    try {
      await navigator.clipboard.writeText(quoteText);
      setCopyStatus('선택 조건이 클립보드에 복사되었습니다.');
      setTimeout(() => setCopyStatus(''), 4000);
    } catch {
      setCopyStatus('복사 기능을 지원하지 않는 브라우저입니다.');
    }
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('성함을 입력해 주세요.');
      return;
    }
    if (!phone.trim() || phone.replace(/[^0-9]/g, '').length < 10) {
      alert('올바른 연락처를 입력해 주세요.');
      return;
    }
    if (!privacyAgreed) {
      alert('개인정보 수집 및 이용에 동의해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createInquiry({
        name: name.trim(),
        phone: phone.trim(),
        subdomain: channelSubdomain,
        productName: `LG가전구독(new) [${selectedAppliance}] 월 ${won(price)} → 할인가 ${won(discountedPrice)} (${months}개월)`,
        callTime: callTime,
        landingPath: landingPath,
        memo: `[상담견적] 관심가전: ${selectedAppliance} | 구독기간: ${months}개월 | 할인전: ${won(price)} | 10%할인가: ${won(discountedPrice)} | 총할인: ${won(totalDiscount)}`,
        status: 'pending'
      });
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      alert('상담 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="lg-care-new-page min-h-screen bg-white text-[#222c27] font-['Pretendard',-apple-system,BlinkMacSystemFont,sans-serif] leading-relaxed selection:bg-[#d6e8b2] selection:text-[#173f35]">
      <SEO 
        title="효원상조 × LG 가전구독 | 매일의 여유, 매월 10% 할인"
        description="LG 가전 구독료 10% 결합 할인. 상조회비를 포함한 기간별 월 납입액을 직접 비교하고 맞춤 상담을 받아보세요."
        image="/assets/lg-care/original-0.png"
      />

      <style>{`
        .lg-care-new-page {
          --green: #173f35;
          --lime: #d6e8b2;
          --ink: #222c27;
          --muted: #6b746d;
          --line: #dce1d9;
          --cream: #f5f6f0;
          word-break: keep-all;
        }
        .lg-care-new-page em {
          font-style: normal;
          color: #457052;
        }
        .lg-care-new-page .discount-badge {
          transform: rotate(7deg);
          box-shadow: 0 10px 30px rgba(23, 63, 53, 0.15);
        }
        .lg-care-new-page .product-card:hover {
          transform: translateY(-4px);
          border-color: #173f35;
        }
        .lg-care-new-page .product-card.active {
          border: 2px solid #173f35;
          background-color: #eaf0e1;
        }
        .lg-care-new-page details summary::-webkit-details-marker {
          display: none;
        }
        .lg-care-new-page details[open] summary .plus-icon {
          transform: rotate(45deg);
        }
        @media (max-width: 800px) {
          .lg-care-new-page .mobile-scene {
            height: 350px;
            max-width: 440px;
          }
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-40 h-[82px] max-[800px]:h-[66px] flex items-center justify-between px-6 md:px-12 bg-white border-b border-[#e8ebe5] transition-all">
        <div className="flex items-center gap-3.5 max-[800px]:gap-2">
          <img 
            src="/assets/lg-care/original-3.png" 
            alt="효원상조" 
            className="w-[98px] h-[33px] max-[800px]:w-[78px] max-[800px]:h-[28px] object-contain" 
          />
          <span className="text-[#aaa] font-light">×</span>
          <img 
            src="/assets/lg-care/original-2.png" 
            alt="LG전자" 
            className="w-[91px] h-[33px] max-[800px]:w-[72px] max-[800px]:h-[28px] object-contain" 
          />
        </div>
        <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-[#444]">
          <a href="#benefit" className="hover:text-[#173f35] transition-colors">결합 혜택</a>
          <a href="#calculator" className="hover:text-[#173f35] transition-colors">월 납입 계산</a>
          <a href="#faq" className="hover:text-[#173f35] transition-colors">자주 묻는 질문</a>
        </nav>
        <button 
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-[13px] max-[800px]:text-[11px] bg-[#173f35] text-white rounded-[5px] px-[18px] py-[10px] max-[800px]:px-3 max-[800px]:py-2 font-semibold hover:bg-[#285447] transition-all flex items-center gap-1 shadow-sm active:scale-95"
        >
          맞춤 상담 <span className="text-[14px]">↗</span>
        </button>
      </header>

      {/* Hero Section */}
      <section className="bg-[#f2f3eb] overflow-hidden">
        <div className="max-w-[1120px] mx-auto px-6 py-12 md:py-20 grid grid-cols-1 md:grid-cols-2 items-center min-h-[610px] gap-8">
          <div className="text-left max-[800px]:text-center">
            <p className="text-[11px] max-[800px]:text-[10px] font-bold tracking-[2px] text-[#173f35] mb-6 flex items-center max-[800px]:justify-center">
              <span className="inline-block bg-[#173f35] w-[7px] h-[7px] rounded-full mr-2"></span> 
              LG 가전구독 × 효원상조
            </p>
            <h1 className="text-[35px] md:text-[43px] lg:text-[47px] font-[750] leading-[1.3] tracking-[-2px] mb-6 text-[#173f35]">
              좋은 가전이 만드는 일상,<br />
              구독료는 <em className="text-[#457052]">10% 가볍게.</em>
            </h1>
            <p className="text-[#5c685f] text-[15px] md:text-[16px] leading-[1.8] mb-8">
              마음에 둔 LG 가전에 효원 결합 혜택을 더하세요.<br />
              상조는 초기 48개월 월 5,000원으로 시작합니다.
            </p>
            <div className="flex flex-col sm:flex-row items-center max-[800px]:justify-center gap-4">
              <a 
                href="#calculator" 
                className="w-full sm:w-auto min-h-[54px] bg-[#173f35] hover:bg-[#285447] text-white px-7 py-4 rounded-[6px] font-semibold text-[15px] flex items-center justify-between gap-5 transition-all shadow-md active:scale-95"
              >
                <span>내 가전 월 지출 계산하기</span>
                <span className="text-xl">↗</span>
              </a>
            </div>
            <p className="text-[11px] max-[800px]:text-[10px] text-[#758071] mt-5 leading-normal">
              상조 1구좌 · 49~200회 회당 28,000원<br />
              상조 총납입 4,496,000원 · LG 구독료 별도
            </p>
          </div>

          {/* Hero Scene with Vector Illustrations */}
          <div className="relative h-[480px] max-[800px]:h-[350px] w-full max-w-[480px] mx-auto rounded-3xl bg-[radial-gradient(ellipse_at_50%_45%,#e9eddf_0,#e1e6d5_45%,transparent_70%)] flex items-center justify-center p-4">
            <div className="absolute left-6 top-6 max-[800px]:left-3 max-[800px]:top-3 text-[10px] max-[800px]:text-[8px] tracking-[3px] text-[#7f8a75] font-semibold">
              A BETTER EVERYDAY
            </div>

            {/* Discount Badge */}
            <div className="discount-badge absolute right-2 top-6 z-10 bg-[#173f35] text-[#e2edc9] w-[120px] h-[120px] max-[800px]:w-[88px] max-[800px]:h-[88px] rounded-full flex flex-col items-center justify-center text-center">
              <strong className="text-[44px] max-[800px]:text-[32px] font-black leading-none tracking-[-3px]">
                10<span className="text-[24px] max-[800px]:text-[18px]">%</span>
              </strong>
              <small className="text-[10px] max-[800px]:text-[8px] mt-1 font-medium">대상 가전 구독료 할인</small>
            </div>

            {/* Appliances SVG */}
            <svg 
              className="w-full h-full overflow-visible" 
              viewBox="0 0 600 520" 
              role="img" 
              aria-label="냉장고와 세탁건조기, 공기청정기를 표현한 가전 일러스트"
            >
              <defs>
                <linearGradient id="f" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop stopColor="#e8e4da" />
                  <stop offset="1" stopColor="#c3c0b7" />
                </linearGradient>
                <linearGradient id="w" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop stopColor="#a2a99f" />
                  <stop offset="1" stopColor="#6b786d" />
                </linearGradient>
                <radialGradient id="glass" cx="50%" cy="50%" r="50%">
                  <stop stopColor="#485454" />
                  <stop offset="55%" stopColor="#202c2c" />
                  <stop offset="100%" stopColor="#101c1e" />
                </radialGradient>
                <filter id="shadow">
                  <feGaussianBlur stdDeviation="12" />
                </filter>
              </defs>
              <ellipse cx="315" cy="472" rx="245" ry="22" fill="#536252" opacity=".18" filter="url(#shadow)" />
              {/* Refrigerator */}
              <path d="M80 447V154Q80 143 92 143H278V447Z" fill="url(#f)" />
              <path d="M278 143L296 158V443L278 447Z" fill="#9d9f93" />
              <path d="M178 144V447M80 323H278" stroke="#8b8e84" strokeWidth="3" />
              <path d="M166 185V247M188 185V247" stroke="#777d73" strokeWidth="4" strokeLinecap="round" />
              {/* WashTower */}
              <rect x="309" y="96" width="160" height="351" rx="9" fill="url(#w)" />
              <rect x="320" y="108" width="138" height="23" rx="4" fill="#899587" />
              <text x="330" y="123" fill="#e2e6dd" fontSize="9" fontWeight="bold">LG</text>
              <circle cx="389" cy="197" r="55" fill="#616d63" />
              <circle cx="389" cy="197" r="46" fill="url(#glass)" />
              <path d="M358 174Q383 153 412 172" fill="none" stroke="#728380" strokeWidth="5" opacity=".6" />
              <rect x="310" y="264" width="158" height="25" fill="#394a40" />
              <circle cx="388" cy="276" r="5" fill="#9aa99c" />
              <circle cx="389" cy="363" r="55" fill="#616d63" />
              <circle cx="389" cy="363" r="46" fill="url(#glass)" />
              <path d="M358 340Q383 319 412 338" fill="none" stroke="#728380" strokeWidth="5" opacity=".6" />
              {/* Air Purifier & Plant */}
              <rect x="22" y="348" width="80" height="109" rx="34" fill="#edece4" />
              <ellipse cx="62" cy="350" rx="40" ry="13" fill="#d5d9cc" />
              <ellipse cx="62" cy="350" rx="30" ry="8" fill="#748173" />
              <path d="M37 380V431M47 380V437M57 380V440M67 380V440M77 380V437M87 380V431" stroke="#d1d6c9" strokeWidth="2" />
              <path d="M518 421V290" stroke="#6c7650" strokeWidth="5" />
              <path d="M519 335Q465 308 487 277Q527 287 519 335M520 366Q573 334 558 309Q514 327 520 366M519 302Q537 252 518 242Q492 266 519 302" fill="#73835d" />
              <path d="M488 401H552L541 461H500Z" fill="#c4b6a0" />
            </svg>

            <div className="absolute bottom-3 left-6 right-6 flex justify-between text-[11px] max-[800px]:text-[9px] text-[#67735e] border-t border-[#bac4af] pt-3">
              <span>나에게 맞는 가전, 부담을 덜어낸 선택.</span>
              <span className="font-mono">01 — 03</span>
            </div>
            <small className="absolute -bottom-4 right-4 text-[9px] max-[800px]:text-[8px] text-[#8d9685]">
              이해를 돕기 위한 가전 일러스트
            </small>
          </div>
        </div>
      </section>

      {/* Value Strip */}
      <div className="bg-[#173f35] text-[#dbe4d6] py-5 border-y border-[#285447]">
        <div className="max-w-[1120px] mx-auto px-6 flex flex-row items-center justify-between text-center gap-3">
          <div className="flex-1">
            <b className="text-[20px] md:text-[23px] text-[#e3edce] font-black mr-2 max-[800px]:block max-[800px]:mr-0">10%</b>
            <span className="text-[12px] md:text-[14px]">매월 구독료 할인</span>
          </div>
          <div className="h-6 w-px bg-white/20"></div>
          <div className="flex-1">
            <b className="text-[20px] md:text-[23px] text-[#e3edce] font-black mr-2 max-[800px]:block max-[800px]:mr-0">5,000원</b>
            <span className="text-[12px] md:text-[14px]">초기 월 상조회비</span>
          </div>
          <div className="h-6 w-px bg-white/20"></div>
          <div className="flex-1">
            <b className="text-[20px] md:text-[23px] text-[#e3edce] font-black mr-2 max-[800px]:block max-[800px]:mr-0">144만원</b>
            <span className="text-[12px] md:text-[14px]">조건 충족 시 만기축하금</span>
          </div>
        </div>
      </div>

      {/* 01 / SMART COMBINATION */}
      <section id="benefit" className="py-20 max-[800px]:py-14 max-w-[1120px] mx-auto px-6">
        <div className="text-center mb-8">
          <p className="text-[11px] font-bold tracking-[2px] text-[#173f35] mb-3">01 / SMART COMBINATION</p>
          <h2 className="text-[28px] md:text-[36px] font-[750] tracking-[-1.4px] leading-[1.35] text-[#173f35] mb-4">
            첫 4년, 같은 월 지출로<br />상조까지 함께 준비하세요.
          </h2>
          <p className="text-[14px] md:text-[15px] text-[#6b746d]">
            {exampleTier === 50000 
              ? '월 5만원 LG 가전 기준, 할인받는 금액만큼 초기 상조회비를 더하는 스마트 구성입니다.'
              : '월 10만원 LG 가전 기준, 10% 할인받고 상조를 더해도 단독 구독보다 매달 저렴한 스마트 구성입니다.'}
          </p>

          {/* 10만원 / 5만원 예시 탭 */}
          <div className="inline-flex p-1 bg-[#e7ebe3] rounded-xl mt-6">
            <button
              type="button"
              onClick={() => setExampleTier(100000)}
              className={`px-5 py-2.5 rounded-lg text-[13px] md:text-[14px] font-bold transition-all cursor-pointer ${
                exampleTier === 100000
                  ? 'bg-[#173f35] text-white shadow-sm'
                  : 'text-[#4e5b52] hover:text-[#173f35]'
              }`}
            >
              월 10만원 구독 예시 (기본)
            </button>
            <button
              type="button"
              onClick={() => setExampleTier(50000)}
              className={`px-5 py-2.5 rounded-lg text-[13px] md:text-[14px] font-bold transition-all cursor-pointer ${
                exampleTier === 50000
                  ? 'bg-[#173f35] text-white shadow-sm'
                  : 'text-[#4e5b52] hover:text-[#173f35]'
              }`}
            >
              월 5만원 구독 예시
            </button>
          </div>
        </div>

        {exampleTier === 50000 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[820px] mx-auto">
            {/* Card 1 */}
            <article className="bg-[#f6f7f3] border border-[#dce1d9] p-8 max-[800px]:p-6 rounded-2xl relative shadow-sm">
              <span className="block text-[16px] max-[800px]:text-[14px] font-bold text-[#222c27] mb-6">LG 가전 단독 구독</span>
              <div className="flex justify-between items-center text-[14px] max-[800px]:text-[13px] my-3">
                <span className="text-[#6b746d]">월 가전 구독료</span>
                <b className="font-semibold text-[#222c27]">50,000원</b>
              </div>
              <div className="flex justify-between items-center text-[14px] max-[800px]:text-[13px] my-3">
                <span className="text-[#6b746d]">상조회비</span>
                <b className="font-semibold text-[#888]">—</b>
              </div>
              <div className="border-t border-[#dce1d9] pt-5 mt-6">
                <span className="block text-[12px] text-[#6b746d] mb-1">월 총지출</span>
                <strong className="text-[32px] md:text-[36px] font-extrabold text-[#173f35] tracking-[-1px]">
                  50,000<small className="text-[18px] font-medium ml-1">원</small>
                </strong>
              </div>
            </article>

            {/* Card 2 Featured */}
            <article className="bg-[#edf2e6] border-2 border-[#8fa57b] p-8 max-[800px]:p-6 rounded-2xl relative shadow-md">
              <div className="absolute -top-3.5 right-6 text-[11px] bg-[#173f35] text-white px-3.5 py-1 rounded-full font-bold shadow-sm">
                효원 결합 혜택 (1구좌)
              </div>
              <span className="block text-[16px] max-[800px]:text-[14px] font-bold text-[#173f35] mb-6">LG 가전 + 효원상조</span>
              <div className="flex justify-between items-center text-[14px] max-[800px]:text-[13px] my-3">
                <span className="text-[#6b746d]">10% 할인 후 구독료</span>
                <b className="font-semibold text-[#173f35]">45,000원</b>
              </div>
              <div className="flex justify-between items-center text-[14px] max-[800px]:text-[13px] my-3">
                <span className="text-[#6b746d]">초기 월 상조회비</span>
                <b className="font-semibold text-[#173f35]">+ 5,000원</b>
              </div>
              <div className="border-t border-[#8fa57b]/50 pt-5 mt-6">
                <span className="block text-[12px] text-[#6b746d] mb-1">초기 48개월 월 총지출</span>
                <strong className="text-[32px] md:text-[36px] font-extrabold text-[#173f35] tracking-[-1px]">
                  50,000<small className="text-[18px] font-medium ml-1">원</small>
                </strong>
              </div>
            </article>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[820px] mx-auto">
            {/* Card 1 */}
            <article className="bg-[#f6f7f3] border border-[#dce1d9] p-8 max-[800px]:p-6 rounded-2xl relative shadow-sm">
              <span className="block text-[16px] max-[800px]:text-[14px] font-bold text-[#222c27] mb-6">LG 가전 단독 구독</span>
              <div className="flex justify-between items-center text-[14px] max-[800px]:text-[13px] my-3">
                <span className="text-[#6b746d]">월 가전 구독료</span>
                <b className="font-semibold text-[#222c27]">100,000원</b>
              </div>
              <div className="flex justify-between items-center text-[14px] max-[800px]:text-[13px] my-3">
                <span className="text-[#6b746d]">상조회비</span>
                <b className="font-semibold text-[#888]">—</b>
              </div>
              <div className="border-t border-[#dce1d9] pt-5 mt-6">
                <span className="block text-[12px] text-[#6b746d] mb-1">월 총지출</span>
                <strong className="text-[32px] md:text-[36px] font-extrabold text-[#173f35] tracking-[-1px]">
                  100,000<small className="text-[18px] font-medium ml-1">원</small>
                </strong>
              </div>
            </article>

            {/* Card 2 Featured */}
            <article className="bg-[#edf2e6] border-2 border-[#8fa57b] p-8 max-[800px]:p-6 rounded-2xl relative shadow-md">
              <div className="absolute -top-3.5 right-6 text-[11px] bg-[#173f35] text-white px-3.5 py-1 rounded-full font-bold shadow-sm">
                효원 결합 혜택 (1구좌)
              </div>
              <span className="block text-[16px] max-[800px]:text-[14px] font-bold text-[#173f35] mb-6">LG 가전 + 효원상조</span>
              <div className="flex justify-between items-center text-[14px] max-[800px]:text-[13px] my-3">
                <span className="text-[#6b746d]">10% 할인 후 구독료</span>
                <b className="font-semibold text-[#173f35]">90,000원 <span className="text-[12px] font-normal text-[#457052]">(-10,000원)</span></b>
              </div>
              <div className="flex justify-between items-center text-[14px] max-[800px]:text-[13px] my-3">
                <span className="text-[#6b746d]">초기 월 상조회비</span>
                <b className="font-semibold text-[#173f35]">+ 5,000원</b>
              </div>
              <div className="border-t border-[#8fa57b]/50 pt-5 mt-6">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[12px] text-[#6b746d]">초기 48개월 월 총지출</span>
                  <span className="text-[11px] font-bold text-[#235835] bg-[#d9e6d0] px-2 py-0.5 rounded">월 5,000원 절감</span>
                </div>
                <strong className="text-[32px] md:text-[36px] font-extrabold text-[#173f35] tracking-[-1px]">
                  95,000<small className="text-[18px] font-medium ml-1">원</small>
                </strong>
              </div>
            </article>
          </div>
        )}

        <p className="text-[12px] max-[800px]:text-[11px] text-[#778075] leading-[1.8] max-w-[820px] mx-auto mt-6 text-center">
          {exampleTier === 50000 ? (
            <>
              상조 1구좌·72개월 구독·제휴카드 제외 예시. 상조 납입을 연속으로 이어갈 경우 49~72개월 월 합계 73,000원, 구독 종료 후 상조회비 월 28,000원. 48개월 이후 상조 납입을 바로 이어가지 않아도 가입 상태는 유지됩니다. 대상 제품 및 결합 유지 조건 적용.
            </>
          ) : (
            <>
              상조 1구좌·72개월 구독·제휴카드 제외 예시. 10% 가전 할인(-10,000원)으로 상조 1구좌(+5,000원)를 가입해도 단독 구독 대비 매달 5,000원이 절감됩니다. (49~72개월 월 합계 118,000원, 구독 종료 후 월 28,000원 / 2구좌 결합 시 월 100,000원으로 상조 2구좌 동시 준비 가능). 대상 제품 및 결합 유지 조건 적용.
            </>
          )}
        </p>
      </section>

      {/* 02 / FIND YOUR EVERYDAY (Products Selection) */}
      <section className="bg-[#f7f7f3] py-20 max-[800px]:py-14 border-y border-[#e8ebe5]">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold tracking-[2px] text-[#173f35] mb-3">02 / FIND YOUR EVERYDAY</p>
            <h2 className="text-[28px] md:text-[36px] font-[750] tracking-[-1.4px] text-[#173f35] mb-4">
              어떤 일상을 바꾸고 싶으세요?
            </h2>
            <p className="text-[14px] md:text-[15px] text-[#6b746d]">
              가전 아이콘을 선택하면 <strong className="text-[#173f35]">인기 구독 모델 리스트</strong>를 확인하고 견적을 바로 적용할 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
            {APPLIANCE_NAMES.map((name, i) => {
              const isSelected = selectedApplianceIndex === i;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelectAppliance(i)}
                  className={`product-card border rounded-xl bg-white p-4 max-[800px]:p-3 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-between ${
                    isSelected ? 'active border-2 border-[#173f35] bg-[#eaf0e1] shadow-md scale-[1.02]' : 'border-[#e4e7de] hover:border-[#173f35]'
                  }`}
                  aria-pressed={isSelected}
                >
                  <svg viewBox="0 0 140 130" className="w-full h-[100px] max-[800px]:h-[80px] mb-2" aria-hidden="true">
                    <ellipse cx="70" cy="122" rx="43" ry="5" fill="#e6e9df" />
                    {DRAWINGS[i]}
                  </svg>
                  <div>
                    <strong className="block text-[14px] max-[800px]:text-[13px] font-bold text-[#222c27] mb-1">{name}</strong>
                    <span className="text-[11px] max-[800px]:text-[10px] text-[#173f35] font-semibold flex items-center justify-center gap-0.5">
                      인기 모델 보기 ↗
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Direct Full Catalog Button */}
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleOpenFullCatalog}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white border border-[#dce1d9] hover:border-[#173f35] text-[#173f35] text-[13px] sm:text-[14px] font-bold shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              <Sparkles className="w-4 h-4 text-[#457052] group-hover:rotate-12 transition-transform" />
              <span>전체 카테고리 인기 가전 구독 모델 한번에 보기</span>
              <ChevronRight className="w-4 h-4 text-[#778075] group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <p className="text-[12px] max-[800px]:text-[11px] text-[#778075] text-center mt-6">
            ※ 가전 아이콘을 누르면 LG 공식 가전구독 라인업과 10% 할인가, 세부 스펙을 상세하게 확인하실 수 있습니다.
          </p>
        </div>
      </section>

      {/* 03 / YOUR MONTHLY PLAN (Interactive Calculator) */}
      <section id="calculator" className="py-20 max-[800px]:py-14 max-w-[1120px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Controls */}
          <div>
            <p className="text-[11px] font-bold tracking-[2px] text-[#173f35] mb-3">03 / YOUR MONTHLY PLAN</p>
            <h2 className="text-[28px] md:text-[36px] font-[750] tracking-[-1.4px] leading-[1.3] text-[#173f35] mb-4">
              할인액보다 중요한 건,<br />
              <em className="text-[#457052]">실제로 내는 금액.</em>
            </h2>
            <p className="text-[14px] md:text-[15px] text-[#6b746d] mb-8">
              구독료를 입력하면 할인 적용 가전 구독료와<br />상조 납입금을 나란히 확인할 수 있습니다.
            </p>

            <div className="flex justify-between items-center border-b border-[#dce1d9] pb-3 mb-6 text-[14px] text-[#6b746d]">
              <span>선택 가전</span>
              <b className="text-[#173f35] text-[15px] font-bold">{selectedAppliance}</b>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="price-input" className="block text-[13px] font-bold text-[#444]">
                  할인 전 LG 월 구독료
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#6b746d]">예시 적용:</span>
                  <button
                    type="button"
                    onClick={() => setPrice(100000)}
                    className={`text-[11px] px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      price === 100000
                        ? 'bg-[#173f35] text-white shadow-xs'
                        : 'bg-[#e7ebe3] text-[#4d5c50] hover:bg-[#d8e0cf]'
                    }`}
                  >
                    10만원
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrice(50000)}
                    className={`text-[11px] px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      price === 50000
                        ? 'bg-[#173f35] text-white shadow-xs'
                        : 'bg-[#e7ebe3] text-[#4d5c50] hover:bg-[#d8e0cf]'
                    }`}
                  >
                    5만원
                  </button>
                </div>
              </div>
              <div className="flex items-center border-b-2 border-[#173f35] pb-2 mb-3">
                <input 
                  id="price-input"
                  type="text"
                  value={price ? price.toLocaleString('ko-KR') : ''}
                  onChange={handlePriceChange}
                  placeholder="0"
                  inputMode="numeric"
                  className="w-full text-[32px] font-bold text-[#173f35] bg-transparent outline-none"
                />
                <span className="text-[15px] font-semibold text-[#6b746d] whitespace-nowrap ml-2">원 / 월</span>
              </div>
              <input 
                type="range"
                min="10000"
                max="200000"
                step="1000"
                value={Math.min(Math.max(price, 10000), 200000)}
                onChange={handleSliderChange}
                className="w-full h-2 bg-[#dce1d9] rounded-lg appearance-none cursor-pointer accent-[#173f35]"
              />
              <div className="flex justify-between text-[11px] text-[#6b746d] mt-1">
                <span>1만원</span>
                <span>20만원</span>
              </div>
            </div>

            <fieldset className="border-0 p-0 mb-6">
              <legend className="text-[13px] font-bold text-[#444] mb-2.5">가전 구독기간</legend>
              <div className="flex gap-3">
                <label className={`flex-1 py-3 px-4 rounded-lg border text-center font-semibold text-[14px] cursor-pointer transition-all ${
                  months === 60 ? 'bg-[#173f35] text-white border-[#173f35] shadow-sm' : 'bg-[#f2f4ed] text-[#444] border-transparent hover:border-[#173f35]'
                }`}>
                  <input 
                    type="radio" 
                    name="months" 
                    value="60" 
                    checked={months === 60} 
                    onChange={() => setMonths(60)}
                    className="sr-only" 
                  />
                  60개월
                </label>
                <label className={`flex-1 py-3 px-4 rounded-lg border text-center font-semibold text-[14px] cursor-pointer transition-all ${
                  months === 72 ? 'bg-[#173f35] text-white border-[#173f35] shadow-sm' : 'bg-[#f2f4ed] text-[#444] border-transparent hover:border-[#173f35]'
                }`}>
                  <input 
                    type="radio" 
                    name="months" 
                    value="72" 
                    checked={months === 72} 
                    onChange={() => setMonths(72)}
                    className="sr-only" 
                  />
                  72개월
                </label>
              </div>
            </fieldset>

            <p className="text-[12px] text-[#778075] leading-relaxed">
              ※ 상조 1구좌 기준. 카드 할인·별도 설치비 제외.<br />
              입력 금액은 계산용이며 실제 제품 견적이 아닙니다.
            </p>
          </div>

          {/* Result Card */}
          <div className="bg-[#f5f6f0] border border-[#e3e7da] rounded-2xl p-7 max-[800px]:p-5 shadow-sm">
            <div className="flex justify-between items-center pb-4 border-b border-[#dce1d9] mb-4">
              <span className="text-[14px] font-medium text-[#444]">매달 줄어드는 구독료</span>
              <strong className="text-[26px] font-extrabold text-[#47714c]">
                −{won(monthlyDiscount)}
              </strong>
            </div>

            <div className="flex justify-between items-center mb-3">
              <p className="text-[13px] text-[#6b746d] font-medium">
                가전 구독료와 상조 납입금을 따로 확인하세요.
              </p>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => setPrice(100000)}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    price === 100000
                      ? 'bg-[#173f35] text-white shadow-xs'
                      : 'bg-[#e4e8dc] text-[#556358] hover:bg-[#d8e0cf]'
                  }`}
                >
                  10만원 예시 표
                </button>
                <button
                  type="button"
                  onClick={() => setPrice(50000)}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    price === 50000
                      ? 'bg-[#173f35] text-white shadow-xs'
                      : 'bg-[#e4e8dc] text-[#556358] hover:bg-[#d8e0cf]'
                  }`}
                >
                  5만원 예시 표
                </button>
              </div>
            </div>

            {/* Parallel Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right table-fixed border-collapse">
                <thead>
                  <tr className="border-b border-[#dce1d9]">
                    <th scope="col" className="text-left w-[28%] py-3 text-[12px] text-[#173f35] font-bold">기간</th>
                    <th scope="col" className="py-3 text-[12px] text-[#173f35] font-bold">
                      가전 구독료
                      <span className="block text-[10px] font-normal text-[#47714c] mt-0.5">10% 할인 적용</span>
                    </th>
                    <th scope="col" className="py-3 text-[12px] text-[#173f35] font-bold">
                      상조 납입금
                      <small className="block text-[10px] font-normal text-[#6b746d] mt-0.5">1구좌 기준</small>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dce1d9]">
                  <tr>
                    <th scope="row" className="text-left py-4 text-[12px] font-medium text-[#222c27]">1~48개월</th>
                    <td className="py-4">
                      <del className="block text-[11px] text-[#899183]">{won(price)}</del>
                      <strong className="text-[19px] max-[800px]:text-[17px] font-extrabold text-[#173f35]">{won(discountedPrice)}</strong>
                    </td>
                    <td className="py-4">
                      <strong className="text-[19px] max-[800px]:text-[17px] font-extrabold text-[#222c27]">5,000원</strong>
                      <small className="block text-[10px] text-[#6b746d]">1~48회</small>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="text-left py-4 text-[12px] font-medium text-[#222c27]">49~{months}개월</th>
                    <td className="py-4">
                      <del className="block text-[11px] text-[#899183]">{won(price)}</del>
                      <strong className="text-[19px] max-[800px]:text-[17px] font-extrabold text-[#173f35]">{won(discountedPrice)}</strong>
                    </td>
                    <td className="py-4">
                      <strong className="text-[19px] max-[800px]:text-[17px] font-extrabold text-[#222c27]">28,000원</strong>
                      <small className="block text-[10px] text-[#6b746d]">납입을 이어갈 경우</small>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="text-left py-4 text-[12px] font-medium text-[#222c27]">
                      {months + 1}개월~ / 구독 종료 후
                    </th>
                    <td className="py-4">
                      <strong className="text-[17px] font-bold text-[#888]">납입 종료</strong>
                    </td>
                    <td className="py-4">
                      <strong className="text-[19px] max-[800px]:text-[17px] font-extrabold text-[#222c27]">28,000원</strong>
                      <small className="block text-[10px] text-[#6b746d]">잔여 회차 납입 시</small>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Membership Note */}
            <div className="bg-[#e5eddc] border-l-[3px] border-[#769365] rounded-r-lg p-4 my-5">
              <b className="block text-[14px] max-[800px]:text-[13px] text-[#173f35] leading-snug mb-1.5">
                48개월 이후, 상조 납입을 바로 이어가지 않아도<br />가입 상태는 유지됩니다.
              </b>
              <p className="text-[12px] text-[#52634c] leading-relaxed mb-1.5">
                49회차부터 월 28,000원을 곧바로 납부해야만 가입이 유지되는 것은 아닙니다. 상조 가입 유지와 회비 납입은 구분해서 확인하세요.
              </p>
              <small className="block text-[11px] text-[#6d7a65] leading-normal">
                ※ 납입금 면제를 뜻하지 않습니다. 만기 환급·축하금은 200회 완납 및 미사용 등 조건 충족 후 적용됩니다. 납입 재개, 서비스 이용 시 정산 및 구독 할인 적용 조건은 상담 시 확인해주세요.
              </small>
            </div>

            {/* Calculation Bottom Summary */}
            <div className="border-t border-[#dce1d9] pt-4 text-[13px]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#555]">계약기간 총 구독 할인액</span>
                <b className="text-[16px] text-[#173f35] font-bold">{won(totalDiscount)}</b>
              </div>
              <p className="text-[12px] text-[#6b746d] leading-relaxed">
                상조 200회 완납 총액 <b>4,496,000원</b><br />
                매월 연속 납입 시 16년 8개월 · 납입 일정에 따라 완납 시점 변동
              </p>
            </div>

            <button 
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full mt-5 bg-[#173f35] hover:bg-[#285447] text-white py-4 px-6 rounded-lg font-bold text-[15px] flex items-center justify-between transition-all shadow-md active:scale-98"
            >
              <span>이 조건으로 맞춤 상담 신청하기</span>
              <span className="text-xl">↗</span>
            </button>
          </div>
        </div>
      </section>

      {/* 04 / FOR YOUR TOMORROW (Maturity benefits) */}
      <section className="bg-[#173f35] text-white py-20 max-[800px]:py-14">
        <div className="max-w-[1120px] mx-auto px-6">
          <p className="text-[11px] font-bold tracking-[2px] text-[#bacda9] mb-3">04 / FOR YOUR TOMORROW</p>
          <h2 className="text-[28px] md:text-[36px] font-[750] tracking-[-1.4px] leading-[1.3] mb-10 text-white">
            오늘의 할인에,<br />미래를 위한 선택을 더하다.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
            {/* Choice 01 */}
            <article className="border-t border-white/20 pt-6">
              <span className="text-[11px] text-[#becdb4] font-bold tracking-wider">선택 01</span>
              <h3 className="text-[24px] md:text-[28px] font-bold my-4 leading-snug">
                필요할 때,<br />라이프서비스로.
              </h3>
              <p className="text-[15px] text-[#c7d3c6] leading-relaxed mb-4">
                장례 · 크루즈 · 웨딩 · 해외여행<br />칠순·팔순 행사 등
              </p>
              <p className="text-[12px] text-[#9db099] leading-relaxed">
                ※ 이용 범위, 추가 비용, 잔여 납입금 정산 조건은 서비스별로 확인합니다. 서비스 이용 시 만기 환급·축하금 처리 조건은 약관에 따릅니다.
              </p>
            </article>

            {/* Choice 02 Refund */}
            <article className="bg-[#f0f2e6] text-[#173f35] p-8 max-[800px]:p-6 rounded-2xl shadow-lg">
              <span className="text-[11px] text-[#68785c] font-bold tracking-wider">
                선택 02 · 미사용 & 만기 조건 충족
              </span>
              <h3 className="text-[24px] md:text-[28px] font-bold my-4 leading-snug">
                만기에는 환급과<br />축하금을 함께.
              </h3>
              <div className="flex justify-between items-center text-[14px] my-3">
                <span className="text-[#555]">실납입금 환급</span>
                <b className="font-bold text-[16px]">4,496,000원</b>
              </div>
              <div className="flex justify-between items-center text-[14px] my-3">
                <span className="text-[#555]">만기축하금</span>
                <b className="font-bold text-[16px] text-[#47714c]">+ 1,440,000원</b>
              </div>
              <div className="border-t border-[#cdd5c1] mt-5 pt-4">
                <small className="block text-[12px] text-[#68785c] mb-1">만기 총 지급액</small>
                <strong className="text-[34px] md:text-[39px] font-extrabold text-[#173f35] tracking-[-1px]">
                  5,936,000<span className="text-[20px] font-medium ml-1">원</span>
                </strong>
              </div>
            </article>
          </div>

          <p className="text-[12px] text-[#b3c2b1] leading-relaxed mt-10 max-w-[900px]">
            ※ 1구좌 기준. 200회 완납 및 라이프서비스 미사용 등 약관 조건 충족 후 환급 신청 시 지급됩니다. 가입 즉시 받는 금액이 아니며, LG 가전 구독료 전액을 환급하는 혜택은 아닙니다.
          </p>
        </div>
      </section>

      {/* 05 / SIMPLE & CLEAR (Step by Step & Card Tip) */}
      <section className="py-20 max-[800px]:py-14 max-w-[1120px] mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold tracking-[2px] text-[#173f35] mb-3">05 / SIMPLE & CLEAR</p>
          <h2 className="text-[28px] md:text-[36px] font-[750] tracking-[-1.4px] text-[#173f35]">
            선택부터 계약까지,<br />차근차근 안내합니다.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <article className="border-t-2 border-[#173f35] pt-5">
            <b className="text-[12px] font-mono text-[#85967a]">01</b>
            <h3 className="text-[18px] font-bold text-[#173f35] my-2">가전 선택</h3>
            <p className="text-[13px] text-[#6b746d] leading-relaxed">
              원하는 제품이나 필요한 가전 종류를 알려주세요.
            </p>
          </article>

          <article className="border-t-2 border-[#173f35] pt-5">
            <b className="text-[12px] font-mono text-[#85967a]">02</b>
            <h3 className="text-[18px] font-bold text-[#173f35] my-2">월 납입 비교</h3>
            <p className="text-[13px] text-[#6b746d] leading-relaxed">
              할인액과 상조회비를 합산한 기간별 금액을 투명하게 확인합니다.
            </p>
          </article>

          <article className="border-t-2 border-[#173f35] pt-5">
            <b className="text-[12px] font-mono text-[#85967a]">03</b>
            <h3 className="text-[18px] font-bold text-[#173f35] my-2">각 계약 확인</h3>
            <p className="text-[13px] text-[#6b746d] leading-relaxed">
              LG 가전구독과 효원상조의 계약을 안전하게 각각 진행합니다.
            </p>
          </article>

          <article className="border-t-2 border-[#173f35] pt-5">
            <b className="text-[12px] font-mono text-[#85967a]">04</b>
            <h3 className="text-[18px] font-bold text-[#173f35] my-2">배송·혜택 안내</h3>
            <p className="text-[13px] text-[#6b746d] leading-relaxed">
              LG 공식 전문 기사님의 배송 일정과 할인 적용 내용을 최종 확인합니다.
            </p>
          </article>
        </div>

        {/* Affiliate Card Banner */}
        <div className="bg-[#f3f5ed] p-7 md:p-8 rounded-2xl mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#769365] uppercase">OPTIONAL BENEFIT</span>
            <h3 className="text-[19px] md:text-[21px] font-bold text-[#173f35] my-2">
              제휴카드 혜택도 함께 비교해보세요.
            </h3>
            <p className="text-[13px] text-[#6b746d] leading-relaxed m-0">
              카드 없이 받는 견적부터, 실적 충족 시 추가 혜택까지.<br className="hidden sm:inline" />
              전월 실적·연회비·적용기간을 구분해 꼼꼼히 안내해 드립니다.
            </p>
          </div>
          <span className="text-[60px] md:text-[80px] text-[#aab695] leading-none select-none" aria-hidden="true">
            ▰
          </span>
        </div>
        <p className="text-[12px] text-[#778075] mt-4">
          ※ 제휴카드 발급은 선택입니다. 카드사별 혜택과 청구할인 조건은 상이할 수 있습니다.
        </p>
      </section>

      {/* 06 / FAQ */}
      <section id="faq" className="bg-[#f7f7f3] py-20 max-[800px]:py-14 border-y border-[#e8ebe5]">
        <div className="max-w-[850px] mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold tracking-[2px] text-[#173f35] mb-3">06 / FAQ</p>
            <h2 className="text-[28px] md:text-[36px] font-[750] tracking-[-1.4px] text-[#173f35]">
              궁금한 점을 먼저 확인하세요.
            </h2>
          </div>

          <div className="divide-y divide-[#dce1d9] border-t border-[#dce1d9]">
            {FAQS.map((faq, index) => (
              <details key={index} className="group py-5 transition-all">
                <summary className="flex justify-between items-center gap-4 cursor-pointer text-[15px] font-bold text-[#222c27] select-none hover:text-[#173f35]">
                  <span>{faq.q}</span>
                  <span className="plus-icon text-[20px] font-light text-[#7f8f75] transition-transform duration-200">
                    ＋
                  </span>
                </summary>
                <p className="text-[14px] text-[#6b746d] leading-[1.85] mt-4 pl-1">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 07 / CONSULTATION & INQUIRY */}
      <section id="consult" className="py-20 max-[800px]:py-14 max-w-[1120px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className="text-[11px] font-bold tracking-[2px] text-[#173f35] mb-3">LET’S FIND YOUR PLAN</p>
            <h2 className="text-[28px] md:text-[36px] font-[750] tracking-[-1.4px] leading-[1.3] text-[#173f35] mb-4">
              내가 원하는 가전,<br />얼마인지 알아볼까요?
            </h2>
            <p className="text-[15px] text-[#5c685f] leading-relaxed mb-6">
              선택한 조건을 확인하고 맞춤 상담을 신청해 보세요.<br />
              전문 상담사가 가전 구독료와 최적의 결합 혜택을 안내해 드립니다.
            </p>

            <ul className="space-y-3 text-[14px] text-[#444] mb-6">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-[#173f35] flex-shrink-0" />
                <span>가전 구독료와 상조회비를 함께 비교 안내</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-[#173f35] flex-shrink-0" />
                <span>초기·후반 월 납입액을 투명하게 구분해 안내</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-[#173f35] flex-shrink-0" />
                <span>만기 지급 및 라이프서비스 이용 조건 상세 확인</span>
              </li>
            </ul>

            {channel?.phone && (
              <div className="bg-[#f5f6f0] p-4 rounded-xl flex items-center gap-3 border border-[#e3e7da]">
                <Phone className="w-5 h-5 text-[#173f35]" />
                <span className="text-[14px] font-semibold text-[#222c27]">
                  유선 상담: <a href={`tel:${channel.phone}`} className="text-[#173f35] underline font-bold">{channel.phone}</a>
                </span>
              </div>
            )}
          </div>

          {/* Quote Card */}
          <div className="border border-[#dce1d9] bg-white rounded-2xl p-7 max-[800px]:p-5 shadow-sm">
            <span className="block text-[13px] font-bold text-[#888] uppercase tracking-wider mb-3">나의 상담 준비 내용</span>
            <div className="bg-[#f9faf6] border border-[#e8ebe5] rounded-xl p-4 text-[14px] leading-relaxed text-[#555] mb-5">
              <div className="mb-1.5">관심 가전: <strong className="text-[#173f35] font-bold">{selectedAppliance}</strong></div>
              <div className="mb-1.5">10% 할인 가전 구독료: <strong className="text-[#173f35] font-bold">{won(discountedPrice)}</strong> · {months}개월</div>
              <div className="mb-1.5">상조 1~48회: <strong className="text-[#222c27] font-bold">회당 5,000원</strong></div>
              <div className="mb-1.5">상조 49~200회: <strong className="text-[#222c27] font-bold">회당 28,000원</strong></div>
              <small className="block text-[11px] text-[#778075] mt-2">
                ※ 48개월 이후 즉시 납입하지 않아도 가입 유지 · 만기 혜택은 완납 조건
              </small>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                type="button"
                onClick={handleCopyQuote}
                className="w-full min-h-[48px] bg-[#eff2e8] hover:bg-[#e2e9d7] text-[#173f35] rounded-lg font-bold text-[14px] flex items-center justify-center gap-2 transition-all"
              >
                <Copy className="w-4 h-4" />
                <span>선택 조건 복사하기</span>
              </button>

              <button 
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full min-h-[52px] bg-[#173f35] hover:bg-[#285447] text-white rounded-lg font-bold text-[15px] flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
              >
                <span>간편 맞춤 상담 신청하기</span>
                <ArrowUpRight className="w-5 h-5" />
              </button>

              <a 
                href="https://hyowon-life.com/care10" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-center text-[12px] text-[#6b746d] underline hover:text-[#173f35] py-1"
              >
                기존 공식 판매 페이지로 이동하기 ↗
              </a>
            </div>

            {copyStatus && (
              <p className="text-[12px] text-center text-[#173f35] font-medium mt-3 animate-fade-in" role="status">
                ✓ {copyStatus}
              </p>
            )}

            <p className="text-[11px] text-[#888] text-center mt-4">
              상담 신청만으로 계약이 체결되지는 않으며, 전문 상담사의 유선 안내 후 결정하실 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* Legal Disclosures Accordion */}
      <section className="max-w-[1120px] mx-auto px-6 pb-12">
        <details className="border-t border-b border-[#dce1d9] py-4">
          <summary className="text-[13px] font-bold text-[#6b746d] cursor-pointer flex justify-between items-center select-none hover:text-[#173f35]">
            <span>가입 전 꼭 확인해주세요</span>
            <span className="plus-icon text-lg">＋</span>
          </summary>
          <div className="text-[12px] text-[#6b746d] leading-relaxed space-y-3 mt-4">
            <p>
              LG 가전 구독과 효원상조는 별도로 체결되는 계약입니다. 상조 1구좌는 1~48회 회당 5,000원, 49~200회 회당 28,000원으로 완납 총액 4,496,000원이며 LG 구독료는 별도입니다. 48개월 이후 상조회비를 바로 이어 납입하지 않아도 가입 상태는 유지됩니다. 이는 잔여 납입금 면제가 아니며, 만기 혜택은 완납 등 조건 충족 시 적용됩니다.
            </p>
            <p>
              10% 할인은 대상 제품 및 결합 유지 등 조건에 따라 적용됩니다. 만기 5,936,000원은 실납입금과 축하금의 합계이며, 200회 완납·라이프서비스 미사용 등 약관 조건 충족 후 신청 시 지급됩니다.
            </p>
            <p>
              중도 해지 시 상조 해약환급금은 납입 회차와 약관에 따라 납입액보다 적거나 없을 수 있습니다. 가전 해지 정산과 할인 처리도 각 계약에 따릅니다. 서비스별 추가 비용과 잔여금 정산 조건을 확인해주세요.
            </p>
            <p>
              가격 계산은 예시이며 카드 할인과 별도 설치 비용은 포함하지 않습니다. 실제 제품·케어·A/S·할인 조건은 계약 전에 확인합니다.
            </p>
          </div>
        </details>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#dce1d9] pt-8 pb-28 max-[800px]:pb-32 max-w-[1120px] mx-auto px-6 text-[#6b746d] text-[12px]">
        <div className="flex items-center gap-3 mb-4">
          <img src="/assets/lg-care/original-3.png" alt="효원상조" className="w-[85px] h-[26px] object-contain" />
          <span className="text-[#aaa]">×</span>
          <img src="/assets/lg-care/original-2.png" alt="LG전자" className="w-[78px] h-[26px] object-contain" />
        </div>
        <p className="leading-relaxed">
          결합상품 상담 · 라이프앤조이 | 상조서비스 · 효원상조
        </p>
        {channel?.companyName && (
          <p className="mt-1">
            제휴 파트너: {channel.companyName} | 담당 문의: {channel.phone || '상담 문의'}
          </p>
        )}
        <div className="flex gap-4 mt-3">
          <button 
            type="button"
            onClick={() => setIsPrivacyOpen(true)}
            className="text-[11px] underline hover:text-[#173f35] cursor-pointer"
          >
            개인정보처리방침
          </button>
          <a 
            href="https://hyowon-life.com/care10" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[11px] underline hover:text-[#173f35]"
          >
            사업자 정보 및 약관 안내 ↗
          </a>
        </div>
        <small className="block text-[10px] text-[#95a08e] mt-4">
          매일의 여유를 더하는 선택. © Hyowon Life & LG Electronics Subscription.
        </small>
      </footer>

      {/* Mobile Sticky Floating Bottom CTA (<= 800px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#e1e5d9] px-5 py-3 flex items-center justify-between gap-4 shadow-[0_-3px_18px_rgba(23,63,53,0.08)]">
        <div>
          <small className="block text-[10px] text-[#6b746d]">LG 구독료 결합 할인</small>
          <strong className="text-[19px] font-extrabold text-[#173f35]">매월 10%</strong>
        </div>
        <button 
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex-1 max-w-[240px] bg-[#173f35] hover:bg-[#285447] text-white py-3.5 px-4 rounded-lg font-bold text-[13px] text-center shadow-md active:scale-95"
        >
          내 가전 할인 견적 받기 ↗
        </button>
      </div>

      {/* Inquiry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-[460px] p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setIsSuccess(false);
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {isSuccess ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-16 h-16 text-[#173f35] mx-auto mb-4" />
                <h3 className="text-[22px] font-bold text-[#173f35] mb-2">상담 신청이 완료되었습니다!</h3>
                <p className="text-[14px] text-[#6b746d] leading-relaxed mb-6">
                  선택하신 <strong className="text-[#173f35]">[{selectedAppliance}]</strong> 가전의 10% 할인 혜택 및 결합 조건을 검토하여 전문 상담사가 빠른 시일 내에 연락드리겠습니다.
                </p>
                <div className="bg-[#f5f6f0] p-4 rounded-xl text-left text-[13px] text-[#444] mb-6">
                  <div>• 신청자: {name}</div>
                  <div>• 연락처: {phone}</div>
                  <div>• 희망시간: {callTime}</div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsSuccess(false);
                  }}
                  className="w-full py-3.5 bg-[#173f35] text-white rounded-lg font-bold text-[15px]"
                >
                  확인
                </button>
              </div>
            ) : (
              <div>
                <span className="text-[11px] font-bold tracking-widest text-[#769365] uppercase">SPECIAL CONSULTATION</span>
                <h3 className="text-[22px] font-bold text-[#173f35] mt-1 mb-2">
                  LG가전 10% 결합할인 맞춤 상담
                </h3>
                <p className="text-[13px] text-[#6b746d] mb-5">
                  관심 가전과 연락처를 남겨주시면 가전 구독 매니저가 친절히 안내해 드립니다.
                </p>

                {/* Selected Quote Summary */}
                <div className="bg-[#f5f6f0] border border-[#e3e7da] rounded-xl p-3.5 mb-5 text-[13px] text-[#444]">
                  <div className="flex justify-between items-center mb-1">
                    <span>관심 가전:</span>
                    <strong className="text-[#173f35] font-bold">{selectedAppliance}</strong>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span>월 예상 구독료:</span>
                    <strong className="text-[#173f35] font-bold">{won(discountedPrice)} (10% 할인)</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>초기 월 상조회비:</span>
                    <strong className="text-[#222c27] font-bold">5,000원 (1~48회)</strong>
                  </div>
                </div>

                <form onSubmit={handleSubmitInquiry} className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-bold text-[#444] mb-1">성함</label>
                    <div className="relative">
                      <input 
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="성함을 입력해 주세요"
                        className="w-full px-3.5 py-3 border border-[#dce1d9] rounded-lg text-[14px] focus:outline-none focus:border-[#173f35]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[#444] mb-1">연락처</label>
                    <input 
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                      placeholder="010-0000-0000"
                      maxLength={13}
                      className="w-full px-3.5 py-3 border border-[#dce1d9] rounded-lg text-[14px] focus:outline-none focus:border-[#173f35]"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[#444] mb-1">상담 희망 시간</label>
                    <select
                      value={callTime}
                      onChange={(e) => setCallTime(e.target.value)}
                      className="w-full px-3.5 py-3 border border-[#dce1d9] rounded-lg text-[14px] bg-white focus:outline-none focus:border-[#173f35]"
                    >
                      <option value="언제나 가능">언제나 가능 (빠른 상담)</option>
                      <option value="오전 (09:00 ~ 12:00)">오전 (09:00 ~ 12:00)</option>
                      <option value="오후 (12:00 ~ 18:00)">오후 (12:00 ~ 18:00)</option>
                      <option value="저녁 (18:00 이후)">저녁 (18:00 이후)</option>
                    </select>
                  </div>

                  <div className="pt-1">
                    <label className="flex items-start gap-2 text-[12px] text-[#555] cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={privacyAgreed}
                        onChange={(e) => setPrivacyAgreed(e.target.checked)}
                        className="mt-0.5 accent-[#173f35]"
                      />
                      <span>
                        [필수] 개인정보 수집 및 이용에 동의합니다.{' '}
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.preventDefault();
                            setIsPrivacyOpen(true);
                          }}
                          className="text-[#173f35] underline ml-1 font-semibold"
                        >
                          전문보기
                        </button>
                      </span>
                    </label>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#173f35] hover:bg-[#285447] text-white rounded-lg font-bold text-[15px] transition-all shadow-md active:scale-98 disabled:opacity-60"
                  >
                    {isSubmitting ? '신청 접수 중...' : '무료 상담 신청 완료 ↗'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appliance Catalog Modal */}
      <LgCareCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        initialCategory={catalogInitialCategory}
        onApplyToCalculator={handleApplyCatalogPlan}
        onDirectConsult={handleDirectConsultCatalogPlan}
      />

      {/* Privacy Modal */}
      <PrivacyModal 
        isOpen={isPrivacyOpen} 
        onClose={() => setIsPrivacyOpen(false)} 
      />
    </div>
  );
}
