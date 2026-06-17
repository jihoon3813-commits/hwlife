import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, Phone, Check, Calendar, Coins, ShieldCheck, 
  ChevronDown, ChevronUp, ChevronRight, FileText, Wallet, Sparkles, CreditCard, X,
  Home, Star, Gift, ShieldAlert, Award, Clock
} from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import SEO from '../components/SEO';

export default function KccPage({ channelSubdomain }: { channelSubdomain?: string }) {
  const allProducts = useQuery(api.products.getVisibleProducts) || [];
  const competitors = useQuery(api.competitors.get) || [];
  const dbPlans = useQuery(api.plans.get) || [];
  const settings = useQuery(api.settings.get);
  const categories = ["전체", ...(settings?.categories || [])];

  const createInquiry = useMutation(api.inquiries.create);
  const logVisit = useMutation(api.stats.logVisit);

  const formRef = useRef<HTMLDivElement>(null);
  
  // State for inquiry form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [kccStatus, setKccStatus] = useState('KCC홈씨씨 고객');
  const [preferredAppliance, setPreferredAppliance] = useState('가전 미선택 (상담 시 조율)');
  const [agreePrivacy, setAgreePrivacy] = useState(true);
  
  // Modals & UI States
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactProduct, setContactProduct] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const [activeCategory, setActiveCategory] = useState("전체");
  const [isProductFullView, setIsProductFullView] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const filteredProducts = (activeCategory === "전체" 
    ? allProducts 
    : allProducts.filter(p => p.category?.replace(/\s/g, '') === activeCategory.replace(/\s/g, ''))
  ).filter(p => p.planId === 1);

  const mainProducts = allProducts.filter(p => p.planId === 1 && p.showOnMain).length > 0 
    ? allProducts.filter(p => p.planId === 1 && p.showOnMain).slice(0, 8) 
    : allProducts.filter(p => p.planId === 1).slice(0, 8);

  const planInfo = dbPlans.find(p => p.numericId === 1) || { name: '스페셜 299 더블 (프리미엄)', price: 59800 };

  const isFullViewRef = useRef(isProductFullView);

  useEffect(() => {
    isFullViewRef.current = isProductFullView;
  }, [isProductFullView]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (!state || state.view !== 'detail') setSelectedProduct(null);
      if (state?.view === 'full') {
        setIsProductFullView(true);
      } else if (!state) {
        if (isFullViewRef.current) {
          setTimeout(() => {
            const productSection = document.getElementById('product-list');
            if (productSection) productSection.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
        setIsProductFullView(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Browser Back Button Modal Handling
  useEffect(() => {
    const handlePopStateModal = (event: PopStateEvent) => {
      if (isContactModalOpen || isPrivacyModalOpen) {
        event.preventDefault();
        setIsContactModalOpen(false);
        setIsPrivacyModalOpen(false);
      }
    };
    window.addEventListener('popstate', handlePopStateModal);
    if (isContactModalOpen || isPrivacyModalOpen) {
      window.history.pushState({ modal: true }, "");
    }
    return () => {
      window.removeEventListener('popstate', handlePopStateModal);
    };
  }, [isContactModalOpen, isPrivacyModalOpen]);

  const openFullView = () => {
    setIsProductFullView(true);
    window.history.pushState({ view: 'full' }, '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeFullView = () => {
    setIsProductFullView(false);
    window.history.back();
  };

  const openProductDetail = (item: any) => {
    setSelectedProduct(item);
    window.history.pushState({ view: 'detail' }, '');
  };

  const closeProductDetail = () => {
    window.history.back();
  };

  const formatNumber = (val: string | number | undefined) => {
    if (!val) return "0";
    return val.toString().replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const channelId = channelSubdomain || "kcc";

  // Visit tracking
  useEffect(() => {
    const trackVisit = async () => {
      try {
        let ip = "0.0.0.0";
        try {
          const response = await fetch("https://api.ipify.org?format=json");
          const data = await response.json();
          ip = data.ip;
        } catch (e) {}

        await logVisit({
          ip,
          userAgent: navigator.userAgent,
          referrer: document.referrer || "직접 유입",
          path: window.location.pathname + window.location.search,
          channelId: channelId,
        });
      } catch (e) {
        console.error("Visit tracking failed", e);
      }
    };
    trackVisit();
  }, [logVisit, channelId]);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    let formattedValue = '';
    
    if (value.length <= 3) {
      formattedValue = value;
    } else if (value.length <= 7) {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3)}`;
    } else {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
    }
    
    setPhone(formattedValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      alert('성함을 입력해주세요.');
      return;
    }
    if (phone.replace(/[^0-9]/g, '').length < 10) {
      alert('올바른 연락처를 입력해주세요.');
      return;
    }
    if (!agreePrivacy) {
      alert('개인정보 수집 및 이용에 동의해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const productName = "효원상조 X KCC홈씨씨 B2B 결합상품";
      const message = `제휴채널 상태: ${kccStatus} | 희망가전: ${preferredAppliance}`;

      await createInquiry({
        name: name.trim(),
        phone: phone,
        productName: productName,
        account: "2구좌",
        appliance: preferredAppliance,
        message: message,
        channelId: channelId,
        source: 'homepage'
      });

      alert('상담 신청이 정상적으로 접수되었습니다. 담당 상담원이 곧 연락드리겠습니다.');
      setName('');
      setPhone('');
      setIsContactModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('상담 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[430px] sm:max-w-[480px] md:max-w-[540px] mx-auto bg-[#F8F9FA] min-h-screen relative font-sans text-[#191F28] overflow-x-hidden sm:shadow-[0_0_40px_rgba(0,0,0,0.08)] sm:border-x sm:border-[#E5E8EB]">
      <SEO 
        title="KCC홈씨씨-LG전자-효원상조 제휴 결합상품"
        description={`KCC홈씨씨-LG전자-효원상조 제휴 프로모션 안내\nLG가전 최대 30% 저렴하게, 320만원 혜택 지원까지!`}
        image="https://res.cloudinary.com/dx7l09wwu/image/upload/v1779251513/Edit_this_image_to_create_a_professional_KakaoTalk-1779251495541_e6e6hq.png"
      />

      {/* GNB / Header */}
      <header className="sticky top-0 w-full bg-white/95 backdrop-blur-md z-40 px-4 sm:px-6 flex items-center justify-between h-[54px] border-b border-[#F2F4F6] shadow-sm">
        <div className="flex items-center gap-2">
          {/* KCC HomeCC Logo BI */}
          <img 
            src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1779249637/01_full_color_homecc_BI_ebkquo.png" 
            alt="KCC홈씨씨" 
            className="h-[24px] sm:h-[26px] w-auto object-contain"
          />
          <span className="text-gray-300 text-[15px] font-light">×</span>
          <img 
            src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1777895641/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_wnz5aa.png" 
            alt="효원상조" 
            className="h-[17px] sm:h-[18px] w-auto object-contain"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold text-[#0B409C] bg-[#0B409C]/10 px-2 py-0.5 rounded-full">B2B 제휴</span>
        </div>
      </header>

      {/* Section 1: Hero Banner */}
      <section className="relative w-full min-h-[660px] sm:min-h-[740px] flex flex-col justify-between pt-12 pb-16 px-4 overflow-hidden">
        {/* Background Layer with modern interior */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/assets/living/kcc_hero_bg.png" 
            alt="Modern Interior Room" 
            className="w-full h-full object-cover"
          />
          {/* Sleek Gradient Overlay - darker on the left for maximum text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#031533] via-[#031533]/90 to-[#031533]/20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#031533] via-transparent to-transparent"></div>
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
        </div>

        {/* Model Image Cutout - shifted to the far right edge to clear text workspace */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute right-[-35px] bottom-0 z-10 w-[54%] max-w-[240px] pointer-events-none"
        >
          <img 
            src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1779249899/IMG_4054_3_bj9yuo.png" 
            alt="모델" 
            className="w-full h-auto object-contain block select-none"
          />
        </motion.div>

        {/* Top Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-20 self-start"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
            <span className="w-1.5 h-1.5 bg-[#E85C0D] rounded-full animate-ping"></span>
            <span className="text-[11px] font-black text-white tracking-wide">KCC홈씨씨 인테리어 고객 단독 특혜</span>
          </div>
        </motion.div>

        {/* Main Copies */}
        <div className="relative z-20 text-white mt-auto w-full">
          {/* Left-aligned text wrapper constrained to 62% width to avoid overlapping model sign */}
          <div className="max-w-[62%] sm:max-w-full">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-[21px] sm:text-[30px] font-extrabold leading-[1.3] tracking-tight break-keep mb-3"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.85)' }}
            >
              {/* Premium Label Badge */}
              <div className="inline-flex items-center gap-1 bg-gradient-to-r from-[#E85C0D] to-[#FF782C] text-white text-[9.5px] sm:text-[12px] font-black px-2.5 py-0.5 sm:py-1 rounded-[6px] mb-2 shadow-[0_3px_10px_rgba(232,92,13,0.3)] select-none">
                KCC홈씨씨 견적고객 한정
              </div>
              <br />
              LG 최신가전을 <br className="sm:hidden" />
              <span className="text-[#3182F6] font-black">최대 30% 저렴하게,</span><br />
              <span className="inline-flex flex-wrap">
                {Array.from("320만원 혜택 지원까지!").map((char, index) => (
                  <motion.span
                    key={index}
                    animate={{
                      y: [0, -5, 0]
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.06
                    }}
                    className="text-[#FFB300] font-black inline-block origin-bottom"
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/90 text-[12px] sm:text-[14px] leading-relaxed break-keep mb-6"
              style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}
            >
              인테리어 바꿀 때 가전도 함께 바꿀 생각이었다면?<br/>
              손해 없는 <span className="text-white font-bold underline decoration-[#3182F6] underline-offset-4">100% 환급형 제휴 혜택</span>을 절대 놓치지 마세요.
            </motion.p>
          </div>

          <motion.button 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            onClick={() => {
              setContactProduct(null);
              setPreferredAppliance("가전 미선택 (상담 시 조율)");
              setIsContactModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 bg-[#3182F6] hover:bg-[#1B64DA] text-white py-4 rounded-[18px] text-[15px] font-bold shadow-[0_8px_25px_rgba(49,130,246,0.35)] active:scale-95 transition-all"
          >
            한정 특혜 신청하고 혜택 받기 <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </section>

      {/* Section 2: Problem Frame Shift */}
      <section className="bg-white py-14 px-3 sm:px-4 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F2F4F6] rounded-full filter blur-3xl opacity-50"></div>

        <div className="text-center mb-10">
          <span className="text-[12px] font-bold text-[#E85C0D] uppercase tracking-wider block mb-2">프레임 전환</span>
          <h2 className="text-[20px] sm:text-[22px] font-black text-[#191F28] leading-tight break-keep">
            아직도 일반 가전렌탈사에서<br/>
            제값 다 내고 빌려 쓰시나요?
          </h2>
        </div>

        <div className="space-y-4 w-full mx-auto">
          {/* Card 1: Bad Scenario */}
          <div className="bg-[#FAF9F9] border border-[#F2ECEC] rounded-2xl p-5 flex gap-4">
            <div className="w-10 h-10 bg-[#F2ECEC] rounded-full flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-[#E54848]" />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-[#E54848] mb-1">일반 가전 렌탈사 (소멸형)</h4>
              <p className="text-[12px] text-[#8B95A1] leading-relaxed break-keep">
                매월 비싼 렌탈료(월 7~8만원대)를 그대로 납부하고, 계약 만기 시 냈던 금액은 전부 소멸되어 돌려받는 돈이 0원입니다.
              </p>
            </div>
          </div>

          {/* Icon Divider */}
          <div className="flex justify-center my-2 text-gray-300">
            <ChevronDown className="w-6 h-6 animate-bounce" />
          </div>

          {/* Card 2: Good Scenario (Our Plan) */}
          <div className="bg-[#F2F8FF] border border-[#3182F6]/20 rounded-2xl p-5 flex gap-4 shadow-sm relative overflow-hidden">
            {/* Spotlight shimmer effect */}
            <div className="absolute -right-4 -top-4 w-12 h-12 bg-[#3182F6]/10 rounded-full filter blur-xl"></div>
            
            <div className="w-10 h-10 bg-[#3182F6]/15 rounded-full flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#3182F6]" />
            </div>
            <div>
              <h4 className="text-[14px] font-extrabold text-[#3182F6] mb-1 flex items-center gap-1.5">
                효원상조 X KCC B2B 결합상품 
                <span className="text-[9px] bg-[#3182F6] text-white px-1.5 py-0.2 rounded font-normal">이득</span>
              </h4>
              <p className="text-[12px] text-[#333D4B] leading-relaxed break-keep">
                월 59,800원으로 최신 가전을 저렴하게 사용하며, <span className="font-bold">320만원 상당의 무료 라이프 서비스 지원</span>은 물론, <span className="font-black text-[#3182F6]">만기 시 납입금 100% 전액 환급</span>되어 가전을 공짜로 쓴 효과를 누립니다!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Monthly Cost Graph comparison */}
      <section className="bg-[#F2F4F6] py-14 px-3 sm:px-4">
        <div className="text-center mb-8">
          <span className="text-[12px] font-bold text-[#3182F6] uppercase tracking-wider block mb-2">핵심 소구점 1</span>
          <h2 className="text-[20px] sm:text-[22px] font-black text-[#191F28] leading-tight break-keep">
            동일 스펙 기준 월 납입금 비교
          </h2>
          <p className="text-[12px] text-[#8B95A1] mt-1">시중 일반 가전 렌탈사 대비 압도적 우위</p>
        </div>

        {/* Graph Display */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 w-full mx-auto shadow-sm">
          <div className="space-y-6">
            {/* Bar 1: Competitors */}
            <div>
              <div className="flex justify-between items-center text-[12px] mb-2 font-bold text-[#8B95A1]">
                <span>일반 가전 렌탈사</span>
                <span className="line-through">월 75,000원 대</span>
              </div>
              <div className="w-full bg-[#F2F4F6] h-6 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: '90%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="bg-[#A3B1C6] h-full rounded-full flex items-center justify-end px-3"
                >
                  <span className="text-[10px] text-white font-bold">소멸형</span>
                </motion.div>
              </div>
            </div>

            {/* Bar 2: Our Plan */}
            <div>
              <div className="flex justify-between items-center text-[12px] mb-2 font-bold">
                <span className="text-[#191F28]">효원 B2B 제휴 결합상품</span>
                <span className="text-[#3182F6] font-black text-[14px]">월 59,800원</span>
              </div>
              <div className="w-full bg-[#F2F4F6] h-6 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: '70%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className="bg-gradient-to-r from-[#3182F6] to-[#0A2E6E] h-full rounded-full flex items-center justify-between px-3"
                >
                  <span className="text-[9px] text-white font-bold">가전사용 + 상조적립</span>
                  <span className="text-[9px] text-[#FFFF00] font-black">100% 환급</span>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#F2F4F6] text-center">
            <p className="text-[12px] text-[#4E5968] leading-relaxed break-keep">
              제휴 특판가를 통해 <span className="text-[#E85C0D] font-bold">월 10%~30% 저렴한 비용</span>으로 설계되었습니다. 단순 렌탈료 지출이 아니라 상조 부금으로 차곡차곡 적립됩니다.
            </p>
          </div>
        </div>
      </section>

      {/* Product List Section */}
      <section className="bg-white py-14 border-y border-[#F2F4F6]">
        <div className="px-3 sm:px-4 flex flex-col items-center text-center mb-6" id="product-list">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center w-full"
          >
            <span className="inline-block px-2.5 py-1 bg-[#3182F6]/10 text-[#3182F6] text-[11px] font-bold rounded-md mb-2">PRODUCT LIST</span>
            <h2 className="text-[22px] font-black text-[#191F28] leading-tight text-center">
              가전 렌탈료 비교하기
            </h2>
            <p className="text-[12px] text-[#8B95A1] mt-2 mb-4 break-keep font-medium text-center">
              제품을 클릭하면 타렌탈사(상조사)와 가격 비교표를 확인 할 수 있습니다.
            </p>
            <div className="mb-2">
              <motion.span 
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="inline-block bg-[#0B409C] text-white text-[13px] font-extrabold px-4 py-1.5 rounded-full shadow-sm"
              >
                전 제품 균일가 월 59,800원에 제공
              </motion.span>
            </div>
          </motion.div>
        </div>

        {/* Product Card Grid (Fixed 2x4 or visible mainProducts) */}
        <div className="px-3 sm:px-4 pb-2">
          <div className="grid grid-cols-2 gap-3">
            {mainProducts.map((item) => (
              <motion.div
                key={(item as any)._id || (item as any).id}
                onClick={() => openProductDetail(item)}
                layoutId={`product-${(item as any)._id || (item as any).id}`}
                className="bg-white rounded-[24px] border border-[#E5E8EB] overflow-hidden active:scale-95 transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)] flex flex-col h-full"
              >
                <div className="relative h-[120px] bg-white shrink-0">
                  <img src={(item.images && item.images.length > 0) ? item.images[0] : item.image} alt={item.name} className="w-full h-full object-contain p-2" />
                  {item.tag && (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md text-white text-[8px] font-bold rounded-md uppercase tracking-wider">
                      {item.tag}
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div className="mb-2">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[9px] font-bold text-[#3182F6]">{item.brand}</span>
                      <span className="text-[8px] font-bold text-[#4E5968] bg-[#F2F4F6] px-1.5 rounded-[3px]">{item.category}</span>
                    </div>
                    <span className="text-[10px] font-medium text-[#8B95A1] line-clamp-1 leading-tight">{item.model}</span>
                  </div>
                  <div>
                    <h3 className="text-[12px] font-bold text-[#191F28] mb-2 leading-tight line-clamp-2 min-h-[30px] break-keep">
                      {item?.name}
                    </h3>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-[#8B95A1] line-through decoration-[#8B95A1]/40 leading-none">월 {formatNumber(item.price)}원</span>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[14px] font-black text-[#191F28]">월 {formatNumber(item.discountPrice)}원</span>
                        <span className="text-[8px] font-bold text-[#3182F6] bg-[#3182F6]/5 px-1 py-0.5 rounded w-fit">제휴카드 혜택가</span>
                      </div>
                      <span className="text-[9px] font-bold text-[#F04452] block mt-1">상조 만기 시 전액지원</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {!isProductFullView && (
            <button 
              onClick={openFullView}
              className="w-full mt-5 flex items-center justify-center gap-2 bg-[#F9FAFB] border border-[#E5E8EB] py-3.5 rounded-[16px] text-[14px] font-bold text-[#191F28] hover:bg-[#F2F4F6] active:scale-95 transition-all shadow-sm"
            >
              전체 상품 보기 <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="px-3 sm:px-4 mt-4">
          <div className="bg-[#F9FAFB] border border-[#E5E8EB] p-4 rounded-[16px] flex items-center justify-between shadow-sm">
            <p className="text-[11px] text-[#4E5968] font-medium">원하는 상품이 없으신가요?</p>
            <button 
              onClick={() => {
                setContactProduct(null);
                setPreferredAppliance("가전 미선택 (상담 시 조율)");
                setIsContactModalOpen(true);
              }}
              className="text-[11px] text-[#3182F6] font-bold flex items-center gap-1 hover:underline"
            >
              상담 신청 시 요청하기 <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </section>

      {/* Section 4: 320 Million Won Life Service Support */}
      <section className="bg-white py-14 px-3 sm:px-4 overflow-hidden">
        <div className="text-center mb-8">
          <span className="text-[12px] font-bold text-[#3182F6] uppercase tracking-wider block mb-2">핵심 소구점 2</span>
          <h2 className="text-[20px] sm:text-[22px] font-black text-[#191F28] leading-tight break-keep">
            월 6,000원에 누리는<br/>
            320만원 제휴 지원 혜택
          </h2>
        </div>

        {/* Logical explanation box */}
        <div className="bg-[#FAF9F6] border border-[#F2EDE0] rounded-3xl p-5 sm:p-6 mb-8 w-full mx-auto">
          <h4 className="text-[13px] font-extrabold text-[#E85C0D] flex items-center gap-1.5 mb-3">
            <span className="w-1.5 h-1.5 bg-[#E85C0D] rounded-full"></span>
            제휴 특혜 지원의 논리 구조
          </h4>
          <p className="text-[12px] text-[#4E5968] leading-relaxed break-keep">
            "1~60회 결합 구간 동안 고객님께서 부담하시는 실제 상조 회비는 <span className="font-bold text-[#191F28]">월 6,000원</span>에 불과합니다. 하지만 적용받는 서비스는 <span className="font-bold text-[#191F28]">월 59,800원짜리 2구좌(총 1,200만원 상당)</span>입니다. 즉, 가전렌탈 60개월 동안 매월 53,800원씩, <span className="font-black text-[#3182F6] text-[13px]">총 320만원 상당의 상조회비</span>를 KCC 제휴 기념으로 무상 지원받는 효과입니다."
          </p>
        </div>

        {/* Dynamic Transition Services */}
        <div className="w-full mx-auto">
          <h3 className="text-[14px] font-black text-[#191F28] mb-3 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-[#FFAB00] fill-[#FFAB00]" />
            고객 맞춤형 전환 라이프 서비스
          </h3>
          <p className="text-[12px] text-[#8B95A1] leading-relaxed break-keep mb-6">
            장례뿐만 아니라 고객의 라이프스타일에 맞게 필요한 순간 언제든지 다른 프리미엄 서비스로 전환해서 사용할 수 있습니다.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { title: '장례', desc: '품격 있는 의전', img: 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1778482388/fileView_peyuol.jpg' },
              { title: '크루즈', desc: '럭셔리 해상 여행', img: 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1778482393/photo_best02_product09_ratqci.jpg' },
              { title: '해외여행', desc: '꿈꾸던 세계 여행', img: 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1778482785/%EC%A0%9C%EB%AA%A9_%EC%97%86%EB%8A%94_%EB%94%94%EC%9E%90%EC%9D%B8_w9mkhs.png' },
              { title: '웨딩', desc: '아름다운 시작', img: 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1778482894/%EC%A0%9C%EB%AA%A9_%EC%97%86%EB%8A%94_%EB%94%94%EC%9E%90%EC%9D%B8_1_eohmjh.png' },
              { title: '칠·팔순', desc: '가족의 행복한 연회', img: 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1778483177/A_modern_Korean_family_celebrating_a_70th_birthday-1778483158578_ka1tmy.png' },
              { title: '어학연수', desc: '글로벌 인재 육성', img: 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1778483181/%EC%A0%9C%EB%AA%A9_%EC%97%86%EB%8A%94_%EB%94%94%EC%9E%90%EC%9D%B8_2_wrklcr.png' },
            ].map((service, i) => (
              <div key={i} className="relative aspect-square rounded-[20px] overflow-hidden group shadow-sm">
                <img src={service.img} alt={service.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h4 className="text-[15px] font-bold mb-0.5">{service.title}</h4>
                  <p className="text-[11px] opacity-70">{service.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-[11px] text-[#8B95A1] leading-relaxed px-2 break-keep">
            * 본 상품의 서비스는 계약마다 상이하며, 서비스 전환 시 추가 비용이 발생할 수 있습니다. 자세한 내용은 효원상조 홈페이지를 참고하시기 바랍니다.
          </p>
        </div>
      </section>

      {/* Section 4.5: Pricing Plan Section */}
      <section className="bg-white py-14 px-3 sm:px-4 border-b border-[#F2F4F6]">
        <div className="text-center mb-8">
          <span className="inline-block px-2.5 py-1 bg-[#3182F6]/10 text-[#3182F6] text-[11px] font-bold rounded-md mb-2">PRICING PLAN</span>
          <h2 className="text-[20px] sm:text-[22px] font-black text-[#191F28] leading-tight break-keep">
            합리적인 가격 구성으로<br/>
            두 배의 가치를 누리세요
          </h2>
        </div>

        {/* Pricing Card */}
        <div className="w-full bg-[#F8F9FA] rounded-[32px] border border-[#E5E8EB] overflow-hidden shadow-sm">
          {/* Card Header */}
          <div className="bg-[#191F28] text-white p-5 sm:p-6 relative overflow-hidden">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-black tracking-wider text-[#3182F6] uppercase">● BEST SELLER</span>
              <span className="text-[10px] text-white/60 font-medium">Double Account (2구좌)</span>
            </div>
            <h3 className="text-[18px] font-black">스페셜 299 더블</h3>
          </div>

          {/* Card Content */}
          <div className="p-4 sm:p-6 space-y-4">
            {/* Monthly Payment */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-[13px] text-[#4E5968] font-medium">월 납입금 (1회~200회)</span>
                <span className="text-[18px] font-bold text-[#191F28]">59,800원</span>
              </div>
              
              <div className="flex justify-between items-center bg-white rounded-2xl p-4 border border-[#E5E8EB]">
                <span className="text-[12px] text-[#3182F6] font-bold flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  제휴카드 최대 할인 시
                </span>
                <span className="text-[15px] font-black text-[#3182F6]">월 34,800원</span>
              </div>
            </div>

            {/* Detail Box: 60회 납입 상세 구성 */}
            <div className="bg-[#F2F8FF] rounded-[24px] p-4 sm:p-5 border border-[#3182F6]/10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 bg-[#3182F6] rounded-full flex items-center justify-center">
                  <span className="text-white text-[11px] font-black">!</span>
                </div>
                <span className="text-[13px] font-black text-[#191F28]">초기 60회 납입 상세 구성 안내</span>
              </div>
              
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-[12.5px] px-1">
                  <span className="text-[#4E5968] font-medium">상조부금 (월 납입금의 10%)</span>
                  <span className="text-[#191F28] font-bold">5,980원</span>
                </div>
                <div className="flex justify-between items-center text-[12.5px] px-1">
                  <span className="text-[#4E5968] font-medium">가전 렌탈 대금 (기타 90%)</span>
                  <span className="text-[#191F28] font-bold">53,820원</span>
                </div>
                <div className="w-full h-[1px] bg-[#3182F6]/10 my-2"></div>
                <p className="text-[9.5px] text-[#8B95A1] leading-normal break-keep px-1">
                  * 1회부터 60회까지는 상조부금과 가전 렌탈 대금이 구분되어 청구됩니다. 61회~200회까지는 상조부금으로 전액 전환됩니다.
                </p>
              </div>
            </div>

            {/* Total / Refund Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-[#E5E8EB] rounded-2xl p-4 flex flex-col justify-center">
                <span className="text-[10px] text-[#8B95A1] font-bold mb-1">총 상품 금액</span>
                <span className="text-[14px] font-black text-[#191F28]">1,196만원</span>
              </div>
              <div className="bg-[#3182F6] rounded-2xl p-4 flex flex-col justify-center text-white">
                <span className="text-[10px] text-white/70 font-bold mb-1">만기 환급금</span>
                <span className="text-[14px] font-black text-white">1,196만원 (100%)</span>
              </div>
            </div>

            {/* Powerful Service Banner */}
            <div className="bg-[#191F28] text-white rounded-2xl p-4 text-center">
              <p className="text-[11px] text-white/60 font-bold mb-0.5">더블 상품만의 강력한 서비스</p>
              <p className="text-[13px] font-extrabold text-[#3182F6]">
                상조 또는 크루즈 <span className="text-white underline underline-offset-4 decoration-[#3182F6]">2회 이용 가능</span>
              </p>
            </div>
          </div>
        </div>

        {/* JOIN BENEFITS cards style (Image 2 style) */}
        <div className="w-full mt-8 space-y-3">
          <p className="text-[11px] font-black text-[#3182F6] tracking-wider uppercase mb-1 px-1">JOIN BENEFITS</p>
          
          <div className="bg-white border border-[#E5E8EB] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 bg-[#3182F6]/10 rounded-full flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-[#3182F6]" />
            </div>
            <div>
              <h4 className="text-[12.5px] font-black text-[#191F28]">라이프서비스 2회 이용</h4>
              <p className="text-[10px] text-[#8B95A1] mt-0.5">상조 또는 크루즈 여행 중 자유 선택 가능</p>
            </div>
          </div>

          <div className="bg-white border border-[#E5E8EB] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="w-10 h-10 bg-[#E85C0D]/10 rounded-full flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-[#E85C0D]" />
            </div>
            <div>
              <h4 className="text-[12.5px] font-black text-[#191F28]">인기 가전제품 지원</h4>
              <p className="text-[10px] text-[#8B95A1] mt-0.5">가입 고객 전원 인기 대형/생활 가전 증정 효과</p>
            </div>
          </div>

          <div className="bg-white border border-[#E5E8EB] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#FFFF00] text-[#191F28] text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
              POPULAR
            </div>
            <div className="w-10 h-10 bg-[#8B5CF6]/10 rounded-full flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <div>
              <h4 className="text-[12.5px] font-black text-[#191F28]">KCC 제휴 한정 혜택</h4>
              <p className="text-[10px] text-[#8B95A1] mt-0.5">상담 시 실시간 한정 추가 특별 사은품 안내</p>
            </div>
          </div>
        </div>

        {/* Footnote Disclaimers */}
        <div className="w-full mt-6 px-2 space-y-1.5">
          <p className="text-[10.5px] text-[#8B95A1] leading-relaxed break-keep">
            * 본 상품은 2구좌(더블) 결합 상품으로 한 구좌당 상품 금액은 598만원입니다.
          </p>
          <p className="text-[10.5px] text-[#8B95A1] leading-relaxed break-keep">
            * 제휴카드 월 25,000원 할인은 전월 실적 충족 시 1회~60회까지 적용됩니다.
          </p>
        </div>
      </section>

      {/* Section 5: 100% Refund (Maturity Refund) */}
      <section className="bg-[#031533] py-16 px-3 sm:px-4 text-white text-center relative overflow-hidden">
        {/* Glowing visual effect in background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#3182F6] opacity-20 filter blur-[100px] rounded-full"></div>

        <div className="relative z-10 w-full mx-auto">
          <span className="text-[12px] font-bold text-[#3182F6] uppercase tracking-wider block mb-3">핵심 소구점 3</span>
          <h2 className="text-[22px] sm:text-[24px] font-black leading-tight break-keep mb-4">
            가전렌탈료까지 다 돌려받는<br/>
            세상에 없던 <span className="text-yellow-400">리스크 제로 상품</span>
          </h2>
          <p className="text-white/60 text-[12px] sm:text-[13px] leading-relaxed break-keep mb-10">
            200회 만기 유지 시, 앞서 사용하셨던 LG 프리미엄 가전제품 렌탈 비용을 전부 포함하여 납입하신 금액 100% 전액 현금 환급을 보장합니다.
          </p>

          {/* Certificate Styling Box */}
          <motion.div 
            whileInView={{ opacity: 1, scale: 1 }}
            initial={{ opacity: 0, scale: 0.95 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="border-2 border-yellow-500/30 bg-[#051F4B]/80 rounded-3xl p-6 sm:p-8 relative"
          >
            {/* Small Hologram/Stamp Effect */}
            <div className="absolute top-4 right-4 w-12 h-12 border border-yellow-500/20 rounded-full flex items-center justify-center rotate-12">
              <span className="text-[8px] font-black text-yellow-500/50 tracking-tighter">100% REFUND</span>
            </div>

            <div className="flex flex-col items-center">
              <Award className="w-10 h-10 text-yellow-400 mb-3" />
              <h4 className="text-[15px] font-bold text-yellow-400 mb-2">만기 환급 확약서 내용</h4>
              
              <div className="w-full bg-[#031533]/85 rounded-xl p-4 space-y-2.5 text-left border border-white/5">
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-white/60">가전 사용 기간</span>
                  <span className="font-bold">60개월 무상 지원 효과</span>
                </div>
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-white/60">환급 시점</span>
                  <span className="font-bold">200회차 만기 도달 시</span>
                </div>
                <div className="w-full h-[1px] bg-white/10"></div>
                <div className="flex justify-between items-center text-[13px] font-bold">
                  <span className="text-yellow-400">환급율</span>
                  <span className="text-yellow-400 text-[15px]">100% 전액 환급</span>
                </div>
              </div>

              <p className="mt-4 text-[10px] text-white/50 leading-relaxed break-keep">
                * 사용하신 LG 가전제품은 반납하실 필요가 없으며, 고객님 소유로 남은 상태에서 냈던 원금 전액을 돌려받으시는 구조입니다.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Funeral Service Section (메인 랜딩과 동일) */}
      <section id="funeral-service" className="bg-white py-8 sm:py-16 px-3 sm:px-4 rounded-[32px] shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-[#F2F4F6]">
        <div className="mb-10 text-center">
          <span className="inline-block px-2.5 py-1 bg-[#3182F6]/10 text-[#3182F6] text-[11px] font-bold rounded-md mb-2 uppercase tracking-wider">Funeral Services</span>
          <h2 className="text-[24px] font-bold text-[#191F28] leading-tight mb-4">
            정성을 다하는<br />효원의 고품격 장례서비스
          </h2>
          <p className="text-[#8B95A1] text-[15px] leading-relaxed break-keep">
            인력지원부터 물품까지, 마지막 가시는 길<br />부족함 없이 정성으로 모십니다.
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {[
            {
              category: "인력지원",
              items: [
                { label: "장례지도사", value: "1명 (3일간 전담인력 파견, 3일장 기준)" },
                { label: "입관지원", value: "1명 (2일차 입관 시 지원)" },
                { label: "복지사(접객도우미)", value: "4명 (1인 8시간 기준)" }
              ]
            },
            {
              category: "고인용품",
              items: [
                { label: "수의", value: "효원 황금문양수의 세트 특 3호" },
                { label: "입관스페셜", value: "황금문양 孝 전통대렴, 황금문양 대렴염포" },
                { label: "관", value: "오동나무관 (매장/화장 규격관 사용)" },
                { label: "봉안함", value: "효원 고급형 (종교별) / 봉안 시 제공" },
                { label: "부속품", value: "명정, 관보, 혼백, 다라니경, 수시포 등 6종 이상" }
              ]
            },
            {
              category: "장의차량",
              items: [
                { label: "고인운구차", value: "관내 무료 (장례식장 이송 필요 시)" },
                { label: "전용 리무진", value: "전국 무료" },
                { label: "전용 장의버스", value: "전국 무료" }
              ]
            },
            {
              category: "상주/빈소용품",
              items: [
                { label: "상복(전통/현대)", value: "남녀 전통/현대식 상복 제공 및 대여" },
                { label: "제단/헌화", value: "제단 꽃 20만원 지원 + 헌화 20송이" },
                { label: "빈소용품", value: "위패, 향, 초, 부의록, 영정리본 등 일체" },
                { label: "근조기", value: "근조기 설치 서비스" }
              ]
            }
          ].map((section, idx) => (
            <div key={idx} className="bg-[#F8FAFB] rounded-[24px] overflow-hidden border border-[#F2F4F6]">
              <div className="bg-[#191F28] px-5 py-2.5 sm:py-3.5">
                <h3 className="text-white font-bold text-[15px] flex items-center gap-2">
                  <span className="w-1 h-3 bg-[#3182F6] rounded-full"></span>
                  {section.category}
                </h3>
              </div>
              <div className="p-4 sm:p-5 space-y-2.5 sm:space-y-4">
                {section.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex flex-col gap-0.5">
                    <span className="text-[12px] font-bold text-[#8B95A1] uppercase tracking-tight">{item.label}</span>
                    <span className="text-[14px] font-medium text-[#333D4B] leading-snug break-keep">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-[#F8FAFB] rounded-[24px] overflow-hidden border border-[#F2F4F6]">
            <div className="bg-[#191F28] px-5 py-2.5 sm:py-3.5">
              <h3 className="text-white font-bold text-[15px] flex items-center gap-2">
                <span className="w-1 h-3 bg-[#3182F6] rounded-full"></span>
                발인용품
              </h3>
            </div>
            <div className="p-4 sm:p-5 space-y-2.5 sm:space-y-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] font-bold text-[#8B95A1] uppercase tracking-tight">횡대</span>
                <span className="text-[14px] font-medium text-[#333D4B] leading-snug">매장 시 오동나무 횡대 제공</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] font-bold text-[#8B95A1] uppercase tracking-tight">고급차량띠/장갑</span>
                <span className="text-[14px] font-medium text-[#333D4B] leading-snug">선도차 고급차량띠 및 운구용 장갑 제공</span>
              </div>
            </div>
          </div>

          {/* Additional Services Grid */}
          <div className="grid grid-cols-1 gap-3">
            {[
              { title: "부고알림", desc: "모바일 부고알림 서비스 제공 (온라인 장례식장)" },
              { title: "안내서비스", desc: "행정절차 및 장례관련 일체 안내" },
              { title: "수의대체", desc: "황실전통대렴 또는 복지사 2명 中 택 1" }
            ].map((service, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-white border border-[#E5E8EB] p-4 rounded-[20px] shadow-sm">
                <div className="w-10 h-10 bg-[#3182F6]/5 rounded-full flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-[#3182F6]" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-[#191F28]">{service.title}</h4>
                  <p className="text-[12px] text-[#8B95A1]">{service.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 14: 특별함을 더하다 Plus */}
      <section className="bg-[#191F28] py-8 sm:py-20 px-3 sm:px-4 text-white overflow-hidden">
        <div className="mb-10 text-center">
          <h2 className="text-[24px] font-black mb-3">특별함을 더하다 <span className="text-[#3182F6]">Plus</span></h2>
          <p className="text-[14px] text-white/60 leading-relaxed break-keep">
            효원상조는 20년 전통의 노하우를 바탕으로<br/>유족의 슬픔을 함께 나눕니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { title: '황금 수의', desc: '품격을 높이는 최고급 수의', img: 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1778484181/img_mnzkaq.jpg' },
            { title: '궁중 염습', desc: '정성을 다하는 궁중 염습', img: 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1778484273/031_nihilist71_rwwsfl.jpg' },
            { title: '링컨 리무진', desc: '최고급 고인 전용 리무진', img: 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1778484299/4_mpwp2l.jpg' },
            { title: '제단 꽃장식', desc: '풍성한 빈소 제단 장식', img: 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1778484373/8e5d644c-146b-481a-9f57-d71770dd8166_fbug9x.webp' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col">
              <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden mb-3 shadow-2xl">
                <img src={item.img} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-3 left-3">
                  <h4 className="text-[14px] font-bold text-white">{item.title}</h4>
                </div>
              </div>
              <p className="text-[11px] text-white/40 leading-snug px-1 break-keep">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 6: Trust and Stability */}
      <section className="bg-white py-14 px-3 sm:px-4">
        <div className="text-center mb-10">
          <span className="text-[12px] font-bold text-[#3182F6] uppercase tracking-wider block mb-2">안정성 검증</span>
          <h2 className="text-[20px] sm:text-[#22px] font-black text-[#191F28] leading-tight break-keep">
            믿을 수 있는 대기업과의 결합
          </h2>
          <p className="text-[12px] text-[#8B95A1] mt-1">불안감은 없애고 든든함을 더했습니다</p>
        </div>

        <div className="space-y-4 w-full mx-auto">
          {/* Trust 1 */}
          <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-[#E5E8EB] flex items-start gap-4">
            <div className="w-10 h-10 bg-[#3182F6]/10 rounded-full flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-[#3182F6]" />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-[#191F28] mb-1">효원상조의 재정 안정성</h4>
              <p className="text-[12px] text-[#4E5968] leading-relaxed break-keep">
                대한민국 대표 상조 기업으로 공제조합과의 공제 계약을 통해 소비자 피해보상 및 안전한 부금 예치를 제도적으로 완벽 보장합니다.
              </p>
            </div>
          </div>

          {/* Trust 2 */}
          <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-[#E5E8EB] flex items-start gap-4">
            <div className="w-10 h-10 bg-[#E85C0D]/10 rounded-full flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-[#E85C0D]" />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-[#191F28] mb-1">LG전자 본사 100% 정품 직배송</h4>
              <p className="text-[12px] text-[#4E5968] leading-relaxed break-keep">
                모든 가전 사은품 및 렌탈 기기는 LG전자 본사에서 직접 포장 배송 및 무료 설치하며, 정식 본사 무상 A/S가 동일하게 보장됩니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Lead capture CTA Banner (Replaces the static form in page) */}
      <section className="bg-[#FAF9F9] py-16 px-3 sm:px-4 text-center border-t border-[#E5E8EB]">
        <div className="max-w-md mx-auto">
          <div className="inline-flex items-center gap-1 bg-[#3182F6]/10 px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 bg-[#3182F6] rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold text-[#3182F6] tracking-wider uppercase">B2B Partnership</span>
          </div>
          <h2 className="text-[22px] sm:text-[24px] font-black text-[#191F28] leading-tight break-keep mb-3">
            KCC홈씨씨 고객 전용<br/>B2B 제휴 혜택 상담 신청
          </h2>
          <p className="text-[13px] text-[#4E5968] mb-8 leading-relaxed break-keep">
            간단한 정보 입력만으로 320만원 무상 지원 혜택과 100% 만기 환급 특혜를 지금 바로 예약하세요.
          </p>
          <button 
            onClick={() => {
              setContactProduct(null);
              setPreferredAppliance("가전 미선택 (상담 시 조율)");
              setIsContactModalOpen(true);
            }}
            className="w-full bg-[#3182F6] text-white font-extrabold text-[15px] py-4 rounded-2xl hover:bg-[#1B64DA] transition-all shadow-lg shadow-[#3182F6]/20 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            무료 상담 신청하기
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer Area */}
      <footer className="bg-[#111111] pt-14 pb-28 px-6 text-white border-t border-white/5">
        <div className="max-w-[400px] mx-auto">
          <div className="mb-8 opacity-60">
            <img 
              src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1777895641/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_wnz5aa.png" 
              alt="효원상조 로고" 
              className="h-[20px] w-auto object-contain brightness-0 invert"
            />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 mb-8 px-1">
            <a href="#" className="text-[12px] font-bold text-[#D1D6DB] hover:text-white transition-colors">이용약관</a>
            <button 
              onClick={() => setIsPrivacyModalOpen(true)}
              className="text-[12px] font-bold text-white hover:text-white transition-colors underline underline-offset-4 decoration-white/30"
            >
              개인정보처리방침
            </button>
            <a href="#" className="text-[12px] font-bold text-[#D1D6DB] hover:text-white transition-colors">중요정보고시사항</a>
          </div>

          <div className="border-t border-white/5 pt-8">
            <div className="mb-8 px-1">
              <h5 className="text-[12px] font-bold text-white mb-2.5 flex items-center gap-1.5">
                <span className="w-1 h-3 bg-[#3182F6] rounded-full"></span>
                총판사
              </h5>
              <div className="text-[11px] text-[#8B95A1] leading-[1.7] font-medium break-keep">
                <span className="text-white font-bold">(주)라이프앤조이</span> | 대표 : 김지훈<br/>
                경기도 하남시 미사대로 510, 624호(아이에스비즈타워)<br/>
                사업자등록번호: 388-86-02921 | 통신판매신고번호: 2024-경기하남-1853호<br/>
                E-mail: lifenjoy0296@gmail.com | 개인정보보호책임자: 김지훈<br/>
                <span className="text-[10px] text-white/20 mt-1 block uppercase">Copyright(c)2026 LIFE&JOY Co.,Ltd. All Right Reserved.</span>
              </div>
            </div>

            <div className="mb-8 px-1 border-t border-white/5 pt-6">
              <h5 className="text-[12px] font-bold text-white mb-2.5 flex items-center gap-1.5">
                <span className="w-1 h-3 bg-[#A3B1C6] rounded-full"></span>
                상조서비스 주관사
              </h5>
              <div className="text-[11px] text-[#8B95A1] leading-[1.7] font-medium break-keep">
                <span className="text-white font-bold">(주)효원상조</span> 대표이사 : 이선주<br/>
                서울시 강동구 풍성로 38길 9, 바로빌딩 3층<br/>
                사업자등록번호 : 126-81-81624 | 선불식할부거래업등록번호 : 서울-2010-제28<br/>
                <span className="text-[10px] text-white/20 mt-1 block uppercase">COPYRIGHT ⓒ (주)효원상조 Co. All Rights Reserved.</span>
              </div>
            </div>

            <div className="mb-10 px-1 bg-white/5 rounded-2xl p-4 border border-white/5">
              <h5 className="text-[12px] font-bold text-[#3182F6] mb-3">(주)효원상조 고객센터</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#8B95A1]">고객센터</span>
                  <a href="tel:1588-8873" className="text-[16px] font-black text-white hover:text-[#3182F6] transition-colors">1588-8873</a>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#8B95A1]">24시 긴급행사</span>
                    <span className="text-[9px] text-[#3182F6]">(장례접수)</span>
                  </div>
                  <a href="tel:1577-8873" className="text-[16px] font-black text-white hover:text-[#3182F6] transition-colors">1577-8873</a>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1 pt-3 border-t border-white/5">
              <p className="text-[10px] text-white/20 font-medium tracking-tight">© HYOWON. All rights reserved.</p>
              <div className="flex gap-4">
                  <a href="/admin" target="_blank" rel="noopener noreferrer" className="text-[9px] text-white/15 hover:text-[#3182F6] transition-colors font-bold">관리자 페이지</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Application Bar (Sticky Bottom Bar) */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] sm:max-w-[480px] md:max-w-[540px] z-[45] px-4 pb-4 pointer-events-none">
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="bg-[#031533]/95 backdrop-blur-md p-2 rounded-[20px] shadow-[0_15px_30px_rgba(0,0,0,0.25)] border border-white/10 pointer-events-auto flex items-center justify-between gap-3 pl-4 pr-2"
        >
          <div className="flex-1 flex flex-col justify-center">
             <div className="flex items-center gap-1.5 mb-0.5">
               <span className="w-1.5 h-1.5 bg-[#E85C0D] rounded-full animate-pulse"></span>
               <span className="text-[8px] font-black text-[#E85C0D] tracking-wider uppercase">Limited Offer</span>
             </div>
             <p className="text-[12px] font-extrabold text-white leading-none">B2B 제휴 결합상품 가입 신청</p>
          </div>
          <button 
            onClick={() => {
              setContactProduct(null);
              setPreferredAppliance("가전 미선택 (상담 시 조율)");
              setIsContactModalOpen(true);
            }}
            className="bg-[#E85C0D] text-white px-5 py-3 rounded-[15px] font-extrabold text-[12px] flex items-center gap-1.5 hover:bg-[#D44F08] transition-colors shadow-lg shadow-[#E85C0D]/20 active:scale-95 shrink-0"
          >
            신청하기 <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </div>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {isPrivacyModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPrivacyModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              className="relative w-full max-w-[420px] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[75vh] z-20"
            >
              <div className="p-5 border-b border-[#F2F4F6] flex items-center justify-between">
                <h3 className="text-[16px] font-black text-[#191F28]">개인정보 수집 및 이용 동의</h3>
                <button 
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center bg-[#F9FAFB] rounded-full hover:bg-[#F2F4F6] transition-colors"
                >
                  <X className="w-4 h-4 text-[#8B95A1]" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto text-[12px] text-[#4E5968] font-medium leading-relaxed break-keep">
                <p className="mb-4 font-bold text-[#191F28]">
                  (주)효원상조와 (주)라이프앤조이는 귀하의 제휴상담 신청과 관련하여 다음과 같이 개인정보를 수집·이용하고자 합니다.
                </p>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-[#191F28] mb-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#3182F6] rounded-full"></span>
                      1. 수집 항목 및 목적
                    </h4>
                    <ul className="space-y-1.5 pl-3">
                      <li>• 수집 항목: 이름, 연락처(휴대폰 번호), 희망 가전제품, 제휴 채널 정보</li>
                      <li>• 수집 및 이용 목적: B2B 결합상품 안내(상조 및 가전 결합) 및 해피콜, 맞춤 상담 진행</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#191F28] mb-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#3182F6] rounded-full"></span>
                      2. 보유 및 이용 기간
                    </h4>
                    <p className="pl-3">
                      상담이 완료되고 가입 처리가 끝나는 시점 또는 고객이 파기 요청 시 즉시 파기합니다. (최대 1년 보관)
                    </p>
                  </div>
                  <div className="p-3 bg-[#F9FAFB] border border-[#F2F4F6] rounded-xl text-[11px]">
                    귀하는 본 동의를 거부할 권리가 있으나, 거부 시 본 제휴 혜택 상담 서비스 이용이 제한될 수 있습니다.
                  </div>
                </div>
              </div>
              <div className="p-4 bg-[#F9FAFB] border-t border-[#F2F4F6]">
                <button 
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="w-full py-3 bg-[#3182F6] text-white font-bold rounded-xl hover:bg-[#1B64DA] transition-all text-[13px]"
                >
                  동의하고 닫기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Full Screen Immersive Product Viewer --- */}
      <AnimatePresence mode="wait">
        {isProductFullView && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col mx-auto w-full max-w-[430px] sm:max-w-[480px] md:max-w-[540px] sm:shadow-[0_0_40px_rgba(0,0,0,0.05)] sm:border-x sm:border-[#E5E8EB]"
          >
            {/* Full Screen Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 px-6 py-4 flex justify-between items-center border-b border-[#F2F4F6] shrink-0">
              <div>
                <h2 className="text-[16px] font-bold text-[#191F28]">결합 상품 찾기</h2>
                <p className="text-[11px] text-[#8B95A1]">{filteredProducts.length}개의 상품</p>
              </div>
              <button 
                onClick={closeFullView}
                className="p-2 bg-[#F2F4F6] rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-[#4E5968]" />
              </button>
            </div>

            {/* Immersive Category Filter */}
            <div className="bg-white px-6 py-3 overflow-x-auto hide-scrollbar flex gap-2 border-b border-[#F2F4F6] shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-[12px] font-bold transition-all ${
                    activeCategory === cat
                      ? 'bg-[#3182F6] text-white shadow-md'
                      : 'bg-[#F2F4F6] text-[#4E5968]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Immersive Grid View */}
            <div className="flex-1 overflow-y-auto px-6 py-6 bg-[#F9FAFB] hide-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map((item) => (
                  <motion.div
                    key={`full-${(item as any)._id || (item as any).id}`}
                    layoutId={`product-${(item as any)._id || (item as any).id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#F9FAFB] rounded-[20px] border border-[#E5E8EB] overflow-hidden shadow-sm flex flex-col h-full cursor-pointer"
                    onClick={() => {
                      openProductDetail(item);
                    }}
                  >
                    <div className="relative aspect-square bg-white">
                      <img src={(item.images && item.images.length > 0) ? item.images[0] : item.image} alt={item.name} className="w-full h-full object-contain p-4" />
                      {item.tag && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md text-white text-[8px] font-bold rounded-md">
                          {item.tag}
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div className="mb-2">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="text-[9px] font-bold text-[#3182F6]">{item.brand}</span>
                          <span className="text-[8px] font-bold text-[#4E5968] bg-[#F2F4F6] px-1 rounded-[3px]">{item.category}</span>
                        </div>
                        <span className="text-[10px] font-medium text-[#8B95A1] line-clamp-1 leading-tight">{item.model}</span>
                      </div>
                      <div>
                        <h3 className="text-[12px] font-bold text-[#191F28] mb-2 leading-snug">
                          {item.name}
                        </h3>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-[#8B95A1] line-through">월 {formatNumber(item.price)}원</span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[8px] font-bold text-[#3182F6] bg-[#3182F6]/5 px-1.5 py-0.5 rounded w-fit">제휴카드 혜택가</span>
                            <span className="text-[14px] font-black text-[#191F28]">월 {formatNumber(item.discountPrice)}원</span>
                            <span className="text-[9px] font-bold text-[#F04452]">상조 만기 시 전액지원</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-8 text-center pb-12">
                <p className="text-[12px] text-[#8B95A1] mb-4">원하시는 상품을 선택해 무료 상담을 받아보세요</p>
                <button 
                  onClick={closeFullView}
                  className="px-6 py-2.5 bg-[#E5E8EB] text-[#4E5968] font-bold rounded-full text-[13px] hover:bg-gray-300 transition-colors"
                >
                  메인으로 돌아가기
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[110] bg-white flex flex-col mx-auto w-full max-w-[430px] sm:max-w-[480px] md:max-w-[540px] sm:shadow-[0_0_40px_rgba(0,0,0,0.05)] sm:border-x sm:border-[#E5E8EB]"
          >
            {/* Modal Header */}
            <div className="sticky top-0 w-full bg-white/90 backdrop-blur-md z-10 px-5 flex justify-between items-center h-[60px] border-b border-[#F2F4F6] shrink-0">
              <div className="font-bold text-[14px] truncate pr-4">{selectedProduct.name}</div>
              <button onClick={closeProductDetail} className="p-2 -mr-2 text-[#8B95A1] hover:text-[#191F28] bg-[#F2F4F6] rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto pb-[100px] hide-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
              
              {/* Product Info Block */}
              <div className="bg-[#F2F4F6] w-full aspect-square relative">
                <div className="w-full h-full overflow-x-auto flex snap-x snap-mandatory hide-scrollbar bg-white">
                  {((selectedProduct.images && selectedProduct.images.length > 0) ? selectedProduct.images : [selectedProduct.image]).map((img: string, idx: number) => (
                    <img key={idx} src={img} alt={`${selectedProduct.name}-${idx}`} className="w-full h-full object-contain p-6 shrink-0 snap-center" />
                  ))}
                </div>
                <div className="absolute top-4 left-4">
                  {selectedProduct.priceLabel && (
                    <div className={`${selectedProduct.priceLabel?.includes('최저가') ? 'bg-[#3182F6]' : 'bg-[#191F28]'} text-white text-[11px] font-bold px-2.5 py-1 rounded-[6px] shadow-sm inline-block`}>
                      {selectedProduct.priceLabel}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-6 bg-white shrink-0 shadow-sm relative z-10">
                <div className="flex flex-col gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#3182F6] bg-[#E8F3FF] px-2 py-0.5 rounded-[4px]">{selectedProduct.brand}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold text-[#8B95A1]">{selectedProduct.category}</span>
                    <span className="text-[12px] text-[#A3B1C6]">|</span>
                    <span className="text-[12px] font-medium text-[#8B95A1]">{selectedProduct.model}</span>
                  </div>
                </div>
                <h2 className="font-bold text-[18px] text-[#191F28] leading-[1.3] mb-5 break-keep">
                  {selectedProduct.name}
                </h2>

                {selectedProduct.shippingFee && (
                  <div className="bg-[#F2F4F6] rounded-[12px] p-4 flex items-center justify-between mb-2">
                    <span className="text-[13px] text-[#4E5968] font-medium">배송/설치안내</span>
                    <span className="text-[13px] text-[#191F28] font-bold">{selectedProduct.shippingFee}</span>
                  </div>
                )}
                
                <div className="bg-white border border-[#E5E8EB] rounded-[16px] p-0 shadow-sm mt-6 overflow-hidden">
                  <div className="bg-[#F9FAFB] px-5 py-4 border-b border-[#F2F4F6]">
                    <span className="inline-block bg-[#0B409C] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2 tracking-tight">
                      타사 렌탈 리얼 비교
                    </span>
                    <h3 className="font-bold text-[15px] text-[#191F28] leading-snug break-keep">
                      다른 곳과 직접 비교해보세요
                    </h3>
                  </div>
                  
                  <div className="px-3 py-2">
                    <div className="flex text-[10px] font-bold text-[#8B95A1] border-b border-[#F2F4F6] py-3">
                      <div className="flex-1">렌탈사</div>
                      <div className="w-[85px] text-right">월 렌탈료</div>
                      <div className="w-[65px] text-center">납입기간</div>
                    </div>
                    
                    <div className="divide-y divide-[#F2F4F6]">
                      {[
                        {
                          company: "효원상조",
                          price: selectedProduct.price,
                          period: "60개월",
                          isOurs: true,
                          benefit: "만기 시 전액 지원"
                        },
                        ...(selectedProduct.comparisons || []).filter((c: any) => !c.isOurs)
                      ].sort((a, b) => parseInt(a.price) - parseInt(b.price)).map((comp: any, idx: number) => {
                        const partner = competitors.find(c => c.name === comp.company);
                        return (
                          <div key={idx} className={`flex items-center py-3 ${comp.isOurs ? 'bg-[#0B409C] text-white -mx-3 px-3 my-1 rounded-lg shadow-sm' : ''}`}>
                            <div className="flex-1 flex items-center gap-2.5 min-w-0">
                              {comp.isOurs ? (
                                <div className="w-[36px] h-[36px] bg-white rounded-[8px] border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                                  <img src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1777895641/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_wnz5aa.png" className="w-full h-full object-contain p-1" alt="hyowon" />
                                </div>
                              ) : partner?.logo ? (
                                <div className="w-[36px] h-[36px] bg-white rounded-[8px] border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                                  <img src={partner.logo} className="w-full h-full object-contain" alt="logo" />
                                </div>
                              ) : (
                                <span className="bg-gray-100 text-gray-500 font-bold text-[8px] px-1.5 py-0.5 rounded border border-gray-200 uppercase whitespace-nowrap shrink-0">
                                  {comp.company.substring(0, 4)}
                                </span>
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className={`font-bold text-[12px] whitespace-nowrap ${comp.isOurs ? 'text-white' : 'text-[#191F28]'}`}>
                                  {comp.company}
                                </span>
                                {comp.benefit && !comp.isOurs && (
                                  <span className={`text-[9px] font-medium leading-tight text-[#3182F6]`}>{comp.benefit}</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="w-[85px] text-right flex flex-col">
                              <span className={`text-[13px] ${comp.isOurs ? 'font-extrabold text-white' : 'font-bold text-[#191F28]'}`}>
                                월 {formatNumber(comp.price)}원
                              </span>
                              {comp.isOurs && (
                                <span className="text-[8px] font-bold text-white/90 leading-tight">만기 시 전액 지원</span>
                              )}
                            </div>
                            
                            <div className={`w-[65px] text-center text-[10px] ${comp.isOurs ? 'font-bold text-white/90' : 'text-[#4E5968]'}`}>
                              {comp.period}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-[#8B95A1] mt-5 text-center break-keep leading-relaxed bg-[#F2F4F6] p-3 rounded-[10px]">
                  * 위 금액은 참고용 체감 비교 예시로, 제조사 가격 변동이나 당사 프로모션에 따라 실제와 다를 수 있습니다. 정확한 금액은 상담 시 안내됩니다.
                </p>
              </div>

              {/* Detail Image Placeholder */}
              <div className="bg-white px-2 pb-10">
                <div className="w-full h-8 bg-gradient-to-b from-white to-[#F2F4F6] flex items-center justify-center opacity-50 relative z-0">
                </div>
                <div className="space-y-2 mt-4 px-4 pb-8 relative z-10">
                  {((selectedProduct.detailImages && selectedProduct.detailImages.length > 0) ? selectedProduct.detailImages : (selectedProduct.detailImage ? [selectedProduct.detailImage] : [])).map((img: string, idx: number) => (
                    <img key={idx} src={img} alt={`상세-${idx}`} className="w-full rounded-[12px] shadow-sm mb-4" />
                  ))}
                  <div className="h-[250px] bg-[#F2F4F6] rounded-[12px] flex flex-col items-center justify-center text-[#8B95A1] font-medium border border-[#E5E8EB] shadow-xs">
                    <ChevronDown className="w-6 h-6 text-[#D1D6DB] mb-2" />
                    상세페이지 연동 영역
                  </div>
                </div>
              </div>

            </div>

            {/* Sticky Bottom in Modal */}
            <div className="absolute bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-[#F2F4F6] px-5 py-4 pb-6 flex gap-3 shadow-[0_-10px_30px_rgb(0,0,0,0.05)] shrink-0 z-20">
              <button 
                onClick={() => {
                  setContactProduct(selectedProduct);
                  setPreferredAppliance(`${selectedProduct.brand} ${selectedProduct.name}`);
                  setSelectedProduct(null);
                  setIsContactModalOpen(true);
                }} 
                className="w-full bg-[#3182F6] text-white text-center py-[14px] rounded-[12px] text-[15px] font-bold active:bg-[#1B64DA] transition-transform active:scale-[0.98] shadow-md shadow-[#3182F6]/20"
              >
                이 제품으로 무료 상담받기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Counseling Modal */}
      <AnimatePresence>
        {isContactModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContactModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[420px] bg-white rounded-[24px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] z-20"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-[#F2F4F6] flex items-center justify-between shrink-0">
                <div>
                   <h3 className="text-[18px] font-black text-[#191F28] mb-0.5">빠른 제휴상담 신청</h3>
                   <p className="text-[12px] text-[#8B95A1] font-medium">KCC홈씨씨 고객 전용 특별 혜택 신청</p>
                </div>
                <button 
                  onClick={() => setIsContactModalOpen(false)}
                  className="w-9 h-9 flex items-center justify-center bg-[#F9FAFB] rounded-full hover:bg-[#F2F4F6] transition-colors"
                >
                  <X className="w-4 h-4 text-[#8B95A1]" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto hide-scrollbar flex-1 pb-8" style={{ WebkitOverflowScrolling: 'touch' }}>
                {/* Product Name Display if selected */}
                {contactProduct && (
                  <div className="mb-5 p-3.5 bg-[#F2F8FF] border border-[#3182F6]/10 rounded-2xl flex flex-col gap-1.5 shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-[#3182F6] text-white text-[8px] font-bold rounded">선택 제품</span>
                      <span className="text-[10px] font-bold text-[#3182F6] bg-[#3182F6]/10 px-1.5 py-0.5 rounded">{contactProduct.brand}</span>
                    </div>
                    <h4 className="text-[14px] font-black text-[#191F28] leading-tight">{contactProduct.name}</h4>
                    {contactProduct.model && (
                      <p className="text-[11px] text-[#8B95A1] font-medium">{contactProduct.model}</p>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name input */}
                  <div>
                    <label htmlFor="modal-name" className="block text-[11px] font-bold text-[#4E5968] mb-1">이름</label>
                    <input 
                      id="modal-name"
                      type="text" 
                      placeholder="성함을 입력해주세요"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#F9FAFB] border border-[#E5E8EB] rounded-xl px-4 py-3 text-[13px] focus:outline-none focus:border-[#3182F6] font-medium"
                    />
                  </div>

                  {/* Phone input */}
                  <div>
                    <label htmlFor="modal-phone" className="block text-[11px] font-bold text-[#4E5968] mb-1">연락처</label>
                    <input 
                      id="modal-phone"
                      type="text" 
                      placeholder="휴대폰 번호를 입력해주세요"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="w-full bg-[#F9FAFB] border border-[#E5E8EB] rounded-xl px-4 py-3 text-[13px] focus:outline-none focus:border-[#3182F6] font-medium"
                    />
                  </div>

                  {/* Privacy Agreement Checkbox */}
                  <div className="flex items-start gap-2.5 pt-1">
                    <input 
                      id="modal-agree-privacy"
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={(e) => setAgreePrivacy(e.target.checked)}
                      className="mt-1 w-4 h-4 text-[#3182F6] border-gray-300 rounded focus:ring-[#3182F6]"
                    />
                    <label htmlFor="modal-agree-privacy" className="text-[11px] text-[#4E5968] leading-tight cursor-pointer">
                      개인정보 수집 및 제3자 제공 동의 (필수){' '}
                      <button 
                        type="button" 
                        onClick={() => setIsPrivacyModalOpen(true)}
                        className="underline ml-1 font-bold text-[#3182F6]"
                      >
                        [보기]
                      </button>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 rounded-xl text-white font-extrabold text-[15px] transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#E85C0D] hover:bg-[#D44F08] shadow-[0_5px_15px_rgba(232,92,13,0.3)] active:scale-[0.98]'}`}
                  >
                    {isSubmitting ? '접수 중입니다...' : '무료 상담 신청 완료'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Quick Stats Overlay */}
                <div className="mt-4 flex justify-between items-center bg-[#F9FAFB] rounded-xl p-3 border border-[#F2F4F6] text-[10.5px]">
                  <span className="text-[#8B95A1] font-bold">상담 대기 고객</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#00D084] rounded-full animate-ping"></span>
                    <span className="text-[#191F28] font-black">원활 (실시간 접수 중)</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
