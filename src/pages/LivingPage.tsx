import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, Phone, Check, Calendar, Coins, ShieldCheck, 
  ChevronDown, ChevronUp, ChevronRight, FileText, Wallet, Sparkles, CreditCard, X,
  Hotel, HeartPulse, Film, Package
} from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import SEO from '../components/SEO';


export default function LivingPage({ channelSubdomain }: { channelSubdomain?: string }) {
  const landingInfo = useQuery(api.landings.getByPath, { path: "/living" });
  const allProducts = useQuery(api.products.getAllProducts) || [];
  const dbPlans = useQuery(api.plans.get) || [];
  const plan1Products = allProducts.filter(p => p.planId === 1);
  const plan2Products = allProducts.filter(p => p.planId === 2);
  const plan3Products = allProducts.filter(p => p.planId === 3);


  const formRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'1' | '2'>('1');
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const createInquiry = useMutation(api.inquiries.create);


  // Channel Tracking
  // 1. Prioritize explicitly passed channelSubdomain
  // 2. If visiting /living directly, it's Master (본사)
  // 3. If visiting /living/subdomain, use that subdomain
  const segments = window.location.pathname.split('/').filter(Boolean);
  const channelId = channelSubdomain || 
                   (segments.length === 1 && segments[0] === 'living' ? '본사' : 
                   (segments.length >= 2 ? segments[1] : undefined));



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
    
    setPhoneNumber(formattedValue);
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      alert('성함을 입력해주세요.');
      return;
    }
    if (phoneNumber.replace(/[^0-9]/g, '').length < 10) {
      alert('올바른 연락처를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const baseName = landingInfo?.name || '리빙144(신한카드)';
      const plan = selectedProduct ? dbPlans.find(p => p.numericId === selectedProduct.planId) : null;
      const accountType = plan?.accountCount || (activeTab === '1' ? '1구좌' : '2구좌');
      const suffix = accountType.includes('2') || accountType.includes('더블') ? '더블' : '싱글';

      await createInquiry({
        name: name.trim(),
        phone: phoneNumber,
        productName: selectedProduct ? `${baseName} ${suffix}` : `${baseName}_메인`,
        account: accountType,
        appliance: selectedProduct ? `${selectedProduct.name} (${selectedProduct.model})` : undefined,
        channelId: channelId,
        source: 'homepage'
      });
      alert('상담 신청이 접수되었습니다. 빠르게 연락드리겠습니다.');
      setName('');
      setPhoneNumber('');
      setIsContactModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('상담 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatNumber = (val: string | number | undefined) => {
    if (!val) return '0';
    return Number(val).toLocaleString();
  };

  const openProductDetail = (product: any) => {
    setSelectedProduct(product);
    setIsContactModalOpen(true);
  };

  return (
    <div className="w-full max-w-[430px] sm:max-w-[480px] md:max-w-[540px] mx-auto bg-[#F2F4F6] min-h-screen relative font-sans text-[#191F28] overflow-x-hidden sm:shadow-[0_0_40px_rgba(0,0,0,0.05)] sm:border-x sm:border-[#E5E8EB]">
      <SEO 
        title="리빙144(신한카드)"
        description="리빙144(신한카드) | 신한카드만 있으면 누구나 특별한 혜택!"
        image="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778564428/Professional_horizontal_landing_page_hero_banner_d-1778564368252_mko2cd.png"
      />
      
      {/* GNB / 상단 헤더 */}
      <header className="sticky top-0 w-full bg-white/90 backdrop-blur-md z-40 px-5 flex items-center justify-between h-[60px] border-b border-[#F2F4F6]">
        <div className="flex items-center gap-1.5">
          <img 
            src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1777895641/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_wnz5aa.png" 
            alt="효원상조" 
            className="h-[18px] w-auto object-contain"
          />
          <span className="text-[10px] font-black text-[#D1D6DB]">x</span>
          <span className="text-[12px] font-black text-[#1B64DA] tracking-tight">신한카드</span>
          <span className="text-[10px] font-black text-[#D1D6DB]">x</span>
          <span className="text-[12px] font-black tracking-tight bg-gradient-to-r from-[#191F28] to-[#4E5968] bg-clip-text text-transparent">PREMIUM</span>
        </div>
        <a href="tel:1588-0883" className="flex items-center justify-center w-8 h-8 bg-[#F2F4F6] rounded-full hover:bg-[#E5E8EB] transition-colors">
          <Phone className="w-4 h-4 text-[#4E5968]" />
        </a>
      </header>

      {/* Section 1: 메인 히어로 (Hero) */}
      <section className="relative w-full h-[85vh] min-h-[600px] flex flex-col justify-end pb-12 px-6 overflow-hidden">
        {/* 배경 레이어 */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop" 
            alt="비즈니스 배경" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A1128] via-[#0A1128]/90 to-[#1B305B]/80"></div>
          {/* 포인트 그리드 패턴 */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        </div>

        {/* 모델 레이어 (앞에 배치) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img 
            src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778476137/IMG_3574_%EC%8B%A0%ED%95%9C%EC%B9%B4%EB%93%9C_mw4c0e.png" 
            alt="신한카드 모델" 
            className="h-[75%] w-auto object-contain object-bottom mt-[-35%] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_85%,rgba(0,0,0,0)_100%)]"
          />
        </div>

        {/* 상단 바로가기 탭 (Shortcut Tabs) */}
        <div className="absolute top-8 inset-x-0 z-30 flex justify-center px-6">
          <div className="flex bg-black/20 backdrop-blur-md border border-white/10 p-1.5 rounded-full shadow-2xl">
            <a 
              href={`/living${channelId && channelId !== '본사' ? '/' + channelId : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-full text-[13px] font-black transition-all flex items-center gap-2 bg-white text-[#1B64DA] shadow-lg"
            >
              <CreditCard className="w-3.5 h-3.5" />
              신한카드 결합
            </a>
            <a 
              href={`/special${channelId && channelId !== '본사' ? '/' + channelId : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-full text-[13px] font-black text-white/70 hover:text-white transition-all flex items-center gap-2"
            >
              <Package className="w-3.5 h-3.5" />
              BSON 결합
            </a>
          </div>
        </div>

        
        {/* 하단 페이드 그라데이션 */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0A1128] to-transparent z-10"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative z-10 text-white"
        >
          <div className="inline-block px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[11px] font-bold text-white mb-4">
            효원상조 x 신한카드 x PREMIUM
          </div>
          
          <h2 className="text-[38px] font-black leading-[1.2] mb-5 tracking-tight break-keep">
            해피효원라이프<br/>
            <span className="text-[#3182F6]">리빙144 출시</span>
          </h2>

          <p className="text-white/80 text-[16px] leading-[1.6] mb-8 break-keep font-medium">
            복잡한 가입 조건 없이<br/>
            신한카드만 있으면 누구나<br/>
            <span className="text-white font-bold">특별한 리빙 제품과 보너스 혜택까지!</span>
          </p>

          <button 
            onClick={() => {
              setSelectedProduct(null);
              setIsContactModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 bg-[#3182F6] py-4 rounded-[20px] text-[16px] font-bold text-white shadow-[0_8px_20px_rgba(49,130,246,0.4)] hover:bg-[#1B64DA] transition-all active:scale-95"
          >
            단독 혜택받고 무료상담 신청 <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </section>

      {/* Section 2: 프리미엄 실물 카드 부각 섹션 */}
      <section className="relative py-24 px-6 overflow-hidden bg-[#0A1128]">
        {/* 배경 빛 번짐 효과 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#3182F6] opacity-20 blur-[120px] rounded-full"></div>
        
        <div className="relative z-10 text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-3 py-1 bg-[#3182F6]/20 text-[#3182F6] text-[12px] font-bold rounded-full mb-4">PREMIUM PARTNERSHIP</span>
            <h3 className="text-[24px] font-black leading-tight text-white break-keep">
              효원상조 x 신한카드가 만나<br/>
              <span className="text-[#3182F6]">새로운 혜택이 쏟아집니다</span>
            </h3>
          </motion.div>
        </div>

        {/* 3D 실물 카드 레이어 */}
        <div className="relative flex flex-col items-center justify-center perspective-[1000px] mb-16">
          <motion.div
            style={{ rotateY: 15, rotateX: 10 }}
            animate={{ 
              rotateY: [-15, 15],
              rotateX: [10, -10],
              y: [0, -10, 0]
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              repeatType: "mirror",
              ease: "easeInOut"
            }}
            whileHover={{ scale: 1.05, rotateY: 0, rotateX: 0 }}
            className="relative w-[280px] h-[176px] rounded-[14px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-pointer group"
          >
            {/* 카드 실물 이미지 (신한카드 프리미엄 느낌) */}
            <img 
              src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=800&auto=format&fit=crop" 
              alt="신한카드 실물" 
              className="w-full h-full object-cover grayscale brightness-50 contrast-125"
            />
            {/* 카드 위 오버레이 (신한 로고 및 텍스트 느낌) */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1B305B]/80 to-[#0A1128]/90 p-6 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="text-white/90 font-black text-[18px] tracking-tighter italic">Shinhan Card</div>
                <div className="w-10 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-[4px] shadow-inner opacity-80"></div>
              </div>
              <div className="space-y-1">
                <div className="text-white/40 text-[10px] tracking-[4px]">PREMIUM LIVING</div>
                <div className="text-white/80 text-[14px] font-mono tracking-widest">•••• •••• •••• 1440</div>
              </div>
            </div>

            {/* 움직이는 광택(Shine) 효과 */}
            <motion.div 
              animate={{ 
                left: ['-100%', '200%']
              }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                repeatDelay: 0.5,
                ease: "easeInOut"
              }}
              className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg]"
            />
          </motion.div>

          {/* 카드 하단 글로우 및 입자 효과 (반짝임) */}
          <div className="absolute -bottom-4 w-40 h-2 bg-[#3182F6] blur-[20px] opacity-50"></div>
          <motion.div 
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-10 -right-10 text-yellow-400 opacity-60"
          >
            <Sparkles className="w-8 h-8" />
          </motion.div>
        </div>
        <div className="max-w-[320px] mx-auto text-center space-y-6 mt-12">
          <p className="text-white/60 text-[15px] leading-relaxed break-keep">
            신한카드만 있으면 누구나 특별한 혜택을 받을 수 있고, 상조 외 크루즈를 동시에 이용할 수 있습니다!
          </p>
          
          <div className="bg-white/5 backdrop-blur-md rounded-[20px] p-5 border border-white/10 shadow-inner">
            <p className="text-[#3182F6] text-[13px] font-bold mb-1">리빙144(신한카드)</p>
            <p className="text-white/80 text-[14px] font-medium">2구좌 가입 조건</p>
          </div>
        </div>
      </section>

      {/* Section 3: 단독 프로모션 4대 혜택 (Benefits Grid) */}
      <section className="bg-[#191F28] py-14 px-6 my-2 text-white">
        <div className="mb-8 text-center">
          <p className="text-[13px] font-bold text-[#3182F6] mb-2">오직 프리미엄몰 회원에게만 드리는</p>
          <h2 className="text-[22px] font-bold leading-tight break-keep">
            효원상조 X 신한카드<br/>단독 프로모션
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 카드 1 */}
          <div className="bg-white/5 border border-white/10 rounded-[24px] p-4 sm:p-5 flex flex-row sm:flex-col items-center sm:text-center text-left">
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white overflow-hidden shadow-lg shrink-0 mr-4 sm:mr-0 sm:mb-4">
              <img src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778475650/3._%ED%94%84%EB%A6%AC%EB%AA%A8_mmmjvf.png" alt="고급 리빙제품" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#3182F6] mb-1 block">가입 축하 혜택 1</span>
              <h4 className="text-[14px] font-bold text-white break-keep">고급 리빙제품 증정</h4>
            </div>
          </div>

          {/* 카드 2 */}
          <div className="bg-white/5 border border-white/10 rounded-[24px] p-4 sm:p-5 flex flex-row sm:flex-col items-center sm:text-center text-left">
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white overflow-hidden shadow-lg shrink-0 mr-4 sm:mr-0 sm:mb-4">
              <img src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778480574/%ED%8F%AC%EC%9D%B8%ED%8A%B8_tj8ujg.png" alt="포인트 보너스" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#FFAB00] mb-1 block">가입 축하 혜택 2</span>
              <h4 className="text-[14px] font-bold text-white break-keep">프리미엄몰 특별 보너스 증정</h4>
            </div>
          </div>

          {/* 카드 3 */}
          <div className="bg-white/5 border border-white/10 rounded-[24px] p-4 sm:p-5 flex flex-row sm:flex-col items-center sm:text-center text-left">
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white overflow-hidden shadow-lg shrink-0 mr-4 sm:mr-0 sm:mb-4">
              <img src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778480399/5%EB%A7%8C%EC%9B%90_2_dnu8n6.png" alt="100% 환급" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#00C853] mb-1 block">스마트 혜택</span>
              <h4 className="text-[14px] font-bold text-white break-keep">납부한 금액 100% 환급 보장</h4>
            </div>
          </div>

          {/* 카드 4 */}
          <div className="bg-white/5 border border-white/10 rounded-[24px] p-4 sm:p-5 flex flex-row sm:flex-col items-center sm:text-center text-left">
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white overflow-hidden shadow-lg shrink-0 mr-4 sm:mr-0 sm:mb-4">
              <img src="https://images.unsplash.com/photo-1548574505-5e239809ee19?w=300&q=80&fit=crop" alt="크루즈" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#E91E63] mb-1 block">라이프 케어 혜택</span>
              <h4 className="text-[14px] font-bold text-white break-keep">장례 대신 크루즈 여행 가능</h4>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: 가입 필요성 강조 (어필 영역) */}
      <section className="bg-white py-14 px-6 my-2">
        <div className="text-center mb-10">
          <h2 className="text-[22px] font-bold text-[#191F28] leading-snug break-keep mb-3">
            상조, 아직 이르다고<br/>생각하셨나요?
          </h2>
          <p className="text-[15px] text-[#3182F6] font-bold break-keep">
            지금이 준비할 가장 좋은 타이밍입니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 mb-10">
          {/* 포인트 1 */}
          <div className="flex flex-col">
            <div className="w-full aspect-[4/3] rounded-2xl bg-[#F2F4F6] overflow-hidden mb-3">
              <img src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778480713/photo01_qowgk1.jpg" alt="안심 케어" className="w-full h-full object-cover" />
            </div>
            <p className="text-[13px] font-medium text-[#4E5968] leading-snug break-keep">
              <span className="font-bold text-[#191F28] block mb-1">안심 케어</span>
              갑작스러운 상황에 가족의 슬픔과 짐을 덜어드립니다.
            </p>
          </div>
          
          {/* 포인트 2 */}
          <div className="flex flex-col">
            <div className="w-full aspect-[4/3] rounded-2xl bg-[#F2F4F6] overflow-hidden mb-3">
              <img src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&q=80&fit=crop" alt="저금통" className="w-full h-full object-cover" />
            </div>
            <p className="text-[13px] font-medium text-[#4E5968] leading-snug break-keep">
              <span className="font-bold text-[#191F28] block mb-1">합리적인 혜택</span>
              부담 없는 금액으로 합리적인 혜택을 누려보세요.
            </p>
          </div>

          {/* 포인트 3 */}
          <div className="flex flex-col">
            <div className="w-full aspect-[4/3] rounded-2xl bg-[#F2F4F6] overflow-hidden mb-3">
              <img src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778480897/%EC%BD%94%EC%8A%A4%ED%83%80_nbsz5n.png" alt="유연한 전환" className="w-full h-full object-cover" />
            </div>
            <p className="text-[13px] font-medium text-[#4E5968] leading-snug break-keep">
              <span className="font-bold text-[#191F28] block mb-1">유연한 전환</span>
              만기 시 전액 환급 또는 크루즈 여행으로 전환 가능합니다.
            </p>
          </div>

          {/* 포인트 4 */}
          <div className="flex flex-col">
            <div className="w-full aspect-[4/3] rounded-2xl bg-[#F2F4F6] overflow-hidden mb-3">
              <img src="https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=400&q=80&fit=crop" alt="스마트 워킹" className="w-full h-full object-cover" />
            </div>
            <p className="text-[13px] font-medium text-[#4E5968] leading-snug break-keep">
              <span className="font-bold text-[#191F28] block mb-1">스마트한 선택</span>
              실속 있는 혜택까지 챙기는 스마트한 선택입니다.
            </p>
          </div>
        </div>

        <div className="bg-[#F2F4F6] rounded-[16px] py-6 px-4 text-center">
          <p className="text-[16px] font-bold text-[#191F28] leading-relaxed break-keep">
            "상조는 선택이 아닌<br/>미리 준비하는 필수상품입니다."
          </p>
        </div>
      </section>

      {/* Section 6: 상품 금액 및 상세 표 */}
      <section className="bg-white py-14 px-6 my-2 border-t border-[#F2F4F6]">
        <div className="mb-8">
          <h2 className="text-[22px] font-black text-[#191F28] leading-snug break-keep mb-3">
            리빙제품에 특별 보너스까지!<br/>
            리빙144(신한카드) 상세표
          </h2>
          <span className="inline-block px-3 py-1 bg-[#FFFF00] text-[#191F28] text-[11px] font-bold rounded-md shadow-sm">
            오직 프리미엄몰에서만 가입 가능합니다
          </span>
        </div>

        {/* Tab Buttons */}
        <div className="flex p-1 bg-[#F2F4F6] rounded-[16px] mb-6">
          <button 
            onClick={() => setActiveTab('1')}
            className={`flex-1 py-3 rounded-[12px] text-[15px] font-bold transition-all ${activeTab === '1' ? 'bg-white text-[#3182F6] shadow-sm' : 'text-[#8B95A1]'}`}
          >
            1구좌
          </button>
          <button 
            onClick={() => setActiveTab('2')}
            className={`flex-1 py-3 rounded-[12px] text-[15px] font-bold transition-all ${activeTab === '2' ? 'bg-white text-[#3182F6] shadow-sm' : 'text-[#8B95A1]'}`}
          >
            2구좌
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === '1' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === '1' ? 10 : -10 }}
            transition={{ duration: 0.2 }}
            className="bg-[#F9FAFB] rounded-[24px] border border-[#E5E8EB] overflow-hidden"
          >
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[14px] text-[#4E5968] font-medium">총 납입금액</span>
                <span className="text-[18px] font-bold text-[#191F28]">{activeTab === '1' ? '5,936,000원' : '11,872,000원'} <span className="text-[12px] text-[#8B95A1] font-normal">(총 200회)</span></span>
              </div>
              <div className="w-full h-[1px] bg-[#E5E8EB]"></div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-[#4E5968] font-medium">1~48회 납입</span>
                  <span className="text-[16px] font-bold text-[#3182F6]">{activeTab === '1' ? '35,000원' : '70,000원'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-[#4E5968] font-medium">49~200회 납입</span>
                  <span className="text-[16px] font-bold text-[#191F28]">{activeTab === '1' ? '28,000원' : '56,000원'}</span>
                </div>
              </div>
              <div className="w-full h-[1px] bg-[#E5E8EB]"></div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#3182F6]/5 p-4 rounded-[16px] gap-2 sm:gap-0">
                <span className="text-[14px] text-[#3182F6] font-bold whitespace-nowrap">만기 시 환급금</span>
                <span className="text-[18px] font-black text-[#3182F6]">
                  {activeTab === '1' ? '5,936,000원' : '11,872,000원'} 
                  <span className="text-[13px] font-bold ml-1">(100%)</span>
                </span>
              </div>
              <div>
                <span className="text-[13px] font-bold text-[#4E5968] mb-3 block">가입 특전</span>
                <div className="flex flex-wrap gap-2">
                  {['라이프서비스 ' + (activeTab === '1' ? '1회' : '2회'), '리빙제품 증정', '프리미엄몰 보너스'].map((benefit, i) => (
                    <span key={i} className="px-3 py-1.5 bg-white border border-[#E5E8EB] rounded-full text-[12px] font-bold text-[#4E5968] shadow-sm">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-4 px-2 space-y-1">
          <p className="text-[11px] text-[#8B95A1]">* 프리미엄몰 보너스 제품은 상담 시 확인 가능합니다.</p>
          <p className="text-[11px] text-[#8B95A1]">* 1~48회차 회비는 신한카드로 결제 시 48pay 슬림할부(48개월)로 청구됩니다.</p>
        </div>
      </section>

      {/* Section 7: 신한카드 48pay 슬림할부 금융 솔루션 안내 */}
      <section className="bg-[#0A1128] py-16 px-6 my-2 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#3182F6] opacity-10 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFAB00] opacity-5 blur-[100px] rounded-full"></div>
        
        <div className="relative z-10 text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="bg-white px-3 py-1 rounded-md">
              <span className="text-[16px] font-black text-[#0A1128]">48pay</span>
            </div>
            <span className="text-white/40 text-[18px]">|</span>
            <span className="text-[16px] font-bold text-white tracking-tight">신한카드</span>
          </div>
          <h2 className="text-[28px] font-black leading-tight mb-4 break-keep">
            무이자급 혜택,<br/>
            <span className="text-[#3182F6]">48개월 스마트 할부</span>
          </h2>
          <p className="text-white/60 text-[15px] leading-relaxed break-keep">
            이자는 없애고 혜택은 더하고,<br/>
            나눌수록 더해지는 똑똑한 금융결제 솔루션
          </p>
        </div>

        <div className="space-y-6">
          <motion.div 
            whileInView={{ opacity: 1, x: 0 }} initial={{ opacity: 0, x: -20 }} viewport={{ once: true }}
            className="bg-white/5 border border-white/10 p-6 rounded-[24px] backdrop-blur-sm"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#3182F6] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-[18px] font-bold">48개월 슬림할부</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-[#3182F6] rounded-full mt-1.5"></div>
                <p className="text-[14px] text-white/70 leading-relaxed">1~5회차 납부 시 수수료(이자) 발생</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-[#3182F6] rounded-full mt-1.5"></div>
                <p className="text-[14px] text-white/70 leading-relaxed">6~48회차 수수료(이자) 없이 <span className="text-white font-bold">원금만 분할 납부</span></p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileInView={{ opacity: 1, x: 0 }} initial={{ opacity: 0, x: 20 }} viewport={{ once: true }}
            className="bg-white/5 border border-white/10 p-6 rounded-[24px] backdrop-blur-sm"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#FFAB00] rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-[18px] font-bold">캐시백 혜택 (8%)</h4>
            </div>
            <p className="text-[14px] text-white/70 leading-relaxed break-keep">
              결제 금액의 <span className="text-[#FFAB00] font-bold">8%를 캐시백으로 지급</span>하여 1~5회차 이자 부담을 상쇄해 드립니다.
              <span className="block mt-2 text-[12px] opacity-60">* 결제 후 익월 15일 카드사 지급</span>
            </p>
          </motion.div>

          <motion.div 
            whileInView={{ opacity: 1, x: 0 }} initial={{ opacity: 0, x: -20 }} viewport={{ once: true }}
            className="bg-white/5 border border-white/10 p-6 rounded-[24px] backdrop-blur-sm"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#00C853] rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-[18px] font-bold">중도 상환 수수료 Free</h4>
            </div>
            <p className="text-[14px] text-white/70 leading-relaxed">
              남은 할부 원금은 언제라도 중도 상환 가능하며,<br/>신한카드 잔여 한도 내에서 간편하게 결제됩니다.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Section 8: 신한카드 48개월 슬림할부 예상 금액표 (Accordion) */}
      <section className="bg-white py-14 px-6 my-2">
        <div className="mb-8">
          <h2 className="text-[22px] font-bold text-[#191F28] leading-tight break-keep">
            신한카드 48개월<br/>슬림 할부 예상 금액표
          </h2>
        </div>

        <div className="space-y-3">
          {/* Accordion 1 */}
          <div className="border border-[#E5E8EB] rounded-[24px] overflow-hidden transition-all">
            <button 
              onClick={() => toggleAccordion('1q')}
              className={`w-full flex items-center justify-between p-6 transition-colors ${openAccordion === '1q' ? 'bg-[#F2F8FF]' : 'bg-white'}`}
            >
              <div className="text-left">
                <span className="text-[12px] font-bold text-[#3182F6] block mb-1">해피효원 리빙144 (1구좌)</span>
                <span className="text-[16px] font-bold text-[#191F28]">결제금액: 1,680,000원</span>
              </div>
              {openAccordion === '1q' ? <ChevronUp className="w-5 h-5 text-[#8B95A1]" /> : <ChevronDown className="w-5 h-5 text-[#8B95A1]" />}
            </button>
            <AnimatePresence>
              {openAccordion === '1q' && (
                <motion.div 
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="bg-white px-6 overflow-hidden"
                >
                  <div className="pb-6 space-y-4 pt-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-[14px] p-3 bg-[#F9FAFB] rounded-xl border border-dashed border-[#3182F6]/30 gap-1 sm:gap-0">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#3182F6]" />
                        <span className="font-bold text-[#3182F6]">캐시백(2회차 시점)</span>
                      </div>
                      <span className="font-black text-[#3182F6]">(-)134,400원 입금</span>
                    </div>
                    
                    <div className="space-y-3 px-1">
                      {[
                        { label: '1회차', value: '원금 35,000원 + 이자 31,142원 = ', total: '66,142원' },
                        { label: '2회차', value: '원금 35,000원 + 이자 26,968원 = ', total: '61,968원' },
                        { label: '3회차', value: '원금 35,000원 + 이자 27,412원 = ', total: '62,412원' },
                        { label: '4회차', value: '원금 35,000원 + 이자 26,948원 = ', total: '61,948원' },
                        { label: '5회차', value: '원금 35,000원 + 이자 25,638원 = ', total: '60,638원' },
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-50 pb-2 sm:pb-0 sm:border-0">
                          <span className="text-[13px] text-[#4E5968] font-bold sm:font-normal mb-1 sm:mb-0">{item.label}</span>
                          <div className="text-[14px] font-medium text-[#191F28] text-left sm:text-right">
                            <span className="block sm:inline opacity-80 sm:opacity-100">{item.value}</span>
                            <span className="block sm:inline font-bold text-[#191F28] mt-0.5 sm:mt-0 sm:ml-1">{item.total}</span>
                          </div>
                        </div>
                      ))}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-2 sm:pt-0">
                        <span className="text-[13px] text-[#4E5968] font-bold sm:font-normal mb-1 sm:mb-0">6~48회차</span>
                        <span className="text-[14px] font-bold text-[#3182F6]">원금만 35,000원 (무이자)</span>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-[#191F28] rounded-[16px] flex flex-col sm:flex-row sm:justify-between sm:items-center text-white gap-2 sm:gap-0">
                      <span className="text-[13px] font-bold text-white/60">총 예상금액</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[20px] sm:text-[18px] font-black tracking-tight text-white">1,683,708원</span>
                        <span className="text-[11px] text-[#3182F6] font-bold">(+)3,708원</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Accordion 2 */}
          <div className="border border-[#E5E8EB] rounded-[24px] overflow-hidden transition-all">
            <button 
              onClick={() => toggleAccordion('2q')}
              className={`w-full flex items-center justify-between p-6 transition-colors ${openAccordion === '2q' ? 'bg-[#F2F8FF]' : 'bg-white'}`}
            >
              <div className="text-left">
                <span className="text-[12px] font-bold text-[#3182F6] block mb-1">해피효원 리빙144 (2구좌)</span>
                <span className="text-[16px] font-bold text-[#191F28]">결제금액: 3,360,000원</span>
              </div>
              {openAccordion === '2q' ? <ChevronUp className="w-5 h-5 text-[#8B95A1]" /> : <ChevronDown className="w-5 h-5 text-[#8B95A1]" />}
            </button>
            <AnimatePresence>
              {openAccordion === '2q' && (
                <motion.div 
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="bg-white px-6 overflow-hidden"
                >
                  <div className="pb-6 space-y-4 pt-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-[14px] p-3 bg-[#F9FAFB] rounded-xl border border-dashed border-[#3182F6]/30 gap-1 sm:gap-0">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#3182F6]" />
                        <span className="font-bold text-[#3182F6]">캐시백(2회차 시점)</span>
                      </div>
                      <span className="font-black text-[#3182F6]">(-)268,800원 입금</span>
                    </div>
                    
                    <div className="space-y-3 px-1">
                      {[
                        { label: '1회차', value: '원금 70,000원 + 이자 62,284원 = ', total: '132,284원' },
                        { label: '2회차', value: '원금 70,000원 + 이자 53,936원 = ', total: '123,936원' },
                        { label: '3회차', value: '원금 70,000원 + 이자 54,824원 = ', total: '124,824원' },
                        { label: '4회차', value: '원금 70,000원 + 이자 53,896원 = ', total: '123,896원' },
                        { label: '5회차', value: '원금 70,000원 + 이자 51,276원 = ', total: '121,276원' },
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-50 pb-2 sm:pb-0 sm:border-0">
                          <span className="text-[13px] text-[#4E5968] font-bold sm:font-normal mb-1 sm:mb-0">{item.label}</span>
                          <div className="text-[14px] font-medium text-[#191F28] text-left sm:text-right">
                            <span className="block sm:inline opacity-80 sm:opacity-100">{item.value}</span>
                            <span className="block sm:inline font-bold text-[#191F28] mt-0.5 sm:mt-0 sm:ml-1">{item.total}</span>
                          </div>
                        </div>
                      ))}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-2 sm:pt-0">
                        <span className="text-[13px] text-[#4E5968] font-bold sm:font-normal mb-1 sm:mb-0">6~48회차</span>
                        <span className="text-[14px] font-bold text-[#3182F6]">원금만 70,000원 (무이자)</span>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-[#191F28] rounded-[16px] flex flex-col sm:flex-row sm:justify-between sm:items-center text-white gap-2 sm:gap-0">
                      <span className="text-[13px] font-bold text-white/60">총 예상금액</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[20px] sm:text-[18px] font-black tracking-tight text-white">3,367,416원</span>
                        <span className="text-[11px] text-[#3182F6] font-bold">(+)7,416원</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="mt-6 text-[11px] text-[#8B95A1] px-2 text-center break-keep">
          * 예상 금액은 청구월에 따라 일부 차이가 날 수 있습니다.
        </p>
      </section>

      {/* Section 9: 결합 리빙 제품 안내 */}
      <section className="bg-white py-16 px-6 my-2">
        <div className="mb-10 text-center">
          <p className="text-[13px] font-bold text-[#3182F6] mb-2">상조 가입 시 프리미엄 리빙 선물을 제공해 드립니다</p>
          <h2 className="text-[24px] font-black text-[#191F28] leading-tight break-keep">
            결합 리빙 제품 안내
          </h2>
        </div>

        {/* Product Tabs */}
        <div className="flex p-1 bg-[#F2F4F6] rounded-[16px] mb-8">
          <button 
            onClick={() => setActiveTab('1')}
            className={`flex-1 py-3 rounded-[12px] text-[14px] font-bold transition-all flex items-center justify-center gap-2 ${activeTab === '1' ? 'bg-white text-[#3182F6] shadow-sm' : 'text-[#8B95A1]'}`}
          >
            1구좌 제품안내
          </button>
          <button 
            onClick={() => setActiveTab('2')}
            className={`flex-1 py-3 rounded-[12px] text-[14px] font-bold transition-all flex items-center justify-center gap-2 ${activeTab === '2' ? 'bg-white text-[#3182F6] shadow-sm' : 'text-[#8B95A1]'}`}
          >
            2구좌 제품안내
          </button>
        </div>

        {/* Guide Area */}
        <div className="mb-8 p-5 bg-[#F9FAFB] rounded-[20px] border border-[#E5E8EB]">
          {activeTab === '1' ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#3182F6] rounded-full"></span>
                <p className="text-[13px] font-bold text-[#191F28]">실속형 1구좌 혜택</p>
              </div>
              <p className="text-[12px] text-[#4E5968] leading-relaxed break-keep ml-3.5">
                부담 없는 월 납입금으로 상조 준비와 동시에 생활에 꼭 필요한 리빙 제품을 받아보실 수 있는 알뜰한 구성입니다.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#3182F6] rounded-full"></span>
                <p className="text-[13px] font-bold text-[#191F28]">프리미엄 2구좌 혜택</p>
              </div>
              <p className="text-[12px] text-[#4E5968] leading-relaxed break-keep ml-3.5">
                가장 인기 있는 프리미엄 가전 및 리빙 제품 라인업을 선택하실 수 있으며, 만기 시 100% 환급 혜택이 더욱 커집니다.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {(activeTab === '1' ? plan3Products : plan2Products).map((item, idx) => (
            <motion.div
              key={(item as any)._id || (item as any).id}
              onClick={() => openProductDetail(item)}
              layoutId={`product-${(item as any)._id || (item as any).id}`}
              className="bg-white rounded-[28px] border border-[#E5E8EB] overflow-hidden active:scale-95 transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1 flex flex-col w-full"
            >
              <div className="relative aspect-square bg-white shrink-0">
                <img 
                  src={(item.images && item.images.length > 0) ? item.images[0] : item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover" 
                />
                {item.tag && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold rounded-lg uppercase tracking-wider">
                    {item.tag}
                  </div>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[12px] font-bold text-[#3182F6]">{item.brand}</span>
                    <span className="text-[11px] font-bold text-[#4E5968] bg-[#F2F4F6] px-2 py-0.5 rounded-[4px]">{item.category}</span>
                  </div>
                  <span className="text-[13px] font-medium text-[#8B95A1] leading-tight">{item.model || item.modelName}</span>
                </div>
                <h3 className="text-[18px] font-black text-[#191F28] mb-1 leading-tight">
                  {item?.name}
                </h3>
              </div>
            </motion.div>
          ))}
          
          {(activeTab === '1' ? plan3Products : plan2Products).length === 0 && (
            <div className="text-center py-12 bg-[#F9FAFB] rounded-[24px] border border-dashed border-[#E5E8EB] flex flex-col items-center justify-center">
              <Package className="w-10 h-10 text-[#D1D6DB] mb-3" />
              <p className="text-[#8B95A1] text-[14px] font-medium">현재 등록된 {activeTab}구좌 제품이 없습니다.</p>
              <p className="text-[#B0B8C1] text-[12px] mt-1">준비 중인 서비스입니다.</p>
            </div>
          )}
        </div>
        
        <p className="mt-8 text-[11px] text-[#8B95A1] px-2">* 본 사은품은 제조사 사정에 따라 예고 없이 변경될 수 있습니다.</p>
      </section>

      {/* Section 10: 라이프 서비스 안내 */}
      <section className="bg-[#F9FAFB] py-16 px-6 my-2">
        <div className="mb-10 text-center">
          <p className="text-[13px] font-bold text-[#3182F6] mb-2">언제든 자유롭게 이용 가능합니다</p>
          <h2 className="text-[24px] font-black text-[#191F28] leading-tight break-keep">
            라이프 서비스 안내
          </h2>
        </div>

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
                <h4 className="text-[16px] font-bold mb-0.5">{service.title}</h4>
                <p className="text-[11px] opacity-70">{service.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-[11px] text-[#8B95A1] leading-relaxed px-2 break-keep">
          * 본 상품의 서비스는 계약마다 상이하며, 서비스 전환 시 추가 비용이 발생할 수 있습니다. 자세한 내용은 효원상조 홈페이지를 참고하시기 바랍니다.
        </p>
      </section>

      {/* Section 11: 멤버십 혜택 안내 */}
      <section className="bg-white py-16 px-0 my-2 overflow-hidden">
        <div className="px-6 mb-10">
          <p className="text-[13px] font-bold text-[#3182F6] mb-2">효원상조 가입 고객만을 위한</p>
          <h2 className="text-[24px] font-black text-[#191F28] leading-tight break-keep">
            다양한 멤버십 서비스
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 px-6">
          {[
            { title: '기차여행', desc: 'KTX, SRT 등\n최대 35% 할인', img: 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1778483384/%EC%A0%9C%EB%AA%A9%EC%9D%84_%EC%9E%85%EB%A0%A5%ED%95%B4%EC%A3%BC%EC%84%B8%EC%9A%94._4_mko5lm.png' },
            { title: '호텔/리조트', desc: '전국 주요 숙박시설\n최대 80% 할인', img: 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1778483539/%EC%A0%9C%EB%AA%A9%EC%9D%84_%EC%9E%85%EB%A0%A5%ED%95%B4%EC%A3%BC%EC%84%B8%EC%9A%94._5_ownbho.png' },
            { title: '건강검진', desc: 'KMI 등 전문기관\n최대 70% 할인', img: 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1778483641/%EC%A0%9C%EB%AA%A9%EC%9D%84_%EC%9E%85%EB%A0%A5%ED%95%B4%EC%A3%BC%EC%84%B8%EC%9A%94._6_isio8t.png' },
            { title: '영화·공연', desc: 'CGV, 롯데시네마 등\n최대 40% 할인', img: 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1778483644/%EC%A0%9C%EB%AA%A9%EC%9D%84_%EC%9E%85%EB%A0%A5%ED%95%B4%EC%A3%BC%EC%84%B8%EC%9A%94._7_dqdjc4.png' },
          ].map((item, i) => (
            <div key={i} className="relative aspect-square rounded-[24px] overflow-hidden group shadow-md">
              <img src={item.img} alt={item.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10"></div>
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <h4 className="text-[16px] font-bold text-white mb-1.5">{item.title}</h4>
                <p className="text-[11px] text-white/70 leading-snug whitespace-pre-line">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="px-6 text-[11px] text-[#8B95A1]">* 상세 내용은 효원상조 공식 홈페이지를 통해 확인하세요.</p>
      </section>

      {/* Funeral Service Section (메인 랜딩과 동일) */}
      <section id="funeral-service" className="bg-white py-16 px-6 rounded-[32px] my-2 shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-[#F2F4F6]">
        <div className="mb-10 text-center">
          <span className="inline-block px-2.5 py-1 bg-[#3182F6]/10 text-[#3182F6] text-[11px] font-bold rounded-md mb-2 uppercase tracking-wider">Funeral Services</span>
          <h2 className="text-[24px] font-bold text-[#191F28] leading-tight mb-4">
            정성을 다하는<br />효원의 고품격 장례서비스
          </h2>
          <p className="text-[#8B95A1] text-[15px] leading-relaxed break-keep">
            인력지원부터 물품까지, 마지막 가시는 길<br />부족함 없이 정성으로 모십니다.
          </p>
        </div>

        <div className="space-y-6">
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
              <div className="bg-[#191F28] px-5 py-3.5">
                <h3 className="text-white font-bold text-[15px] flex items-center gap-2">
                  <span className="w-1 h-3 bg-[#3182F6] rounded-full"></span>
                  {section.category}
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {section.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex flex-col gap-1">
                    <span className="text-[12px] font-bold text-[#8B95A1] uppercase tracking-tight">{item.label}</span>
                    <span className="text-[14px] font-medium text-[#333D4B] leading-snug break-keep">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-[#F8FAFB] rounded-[24px] overflow-hidden border border-[#F2F4F6]">
            <div className="bg-[#191F28] px-5 py-3.5">
              <h3 className="text-white font-bold text-[15px] flex items-center gap-2">
                <span className="w-1 h-3 bg-[#3182F6] rounded-full"></span>
                발인용품
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#8B95A1] uppercase tracking-tight">횡대</span>
                <span className="text-[14px] font-medium text-[#333D4B] leading-snug">매장 시 오동나무 횡대 제공</span>
              </div>
              <div className="flex flex-col gap-1">
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
      <section className="bg-[#191F28] py-20 px-6 my-2 text-white overflow-hidden">
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

      {/* Section 15: 브랜드 신뢰도 & 모델 영역 (Trust) */}
      <section className="bg-white py-16 px-6 my-2">
        <div className="bg-[#E9F4EE] rounded-[32px] overflow-hidden relative mb-4 shadow-sm">
          <div className="p-8 pb-4">
            <h4 className="text-[11px] sm:text-[13px] font-bold text-[#006E4E] mb-3 whitespace-nowrap">20년간 오직 한 길만 걸어온 정통 상조회사</h4>
            <h2 className="text-[22px] sm:text-[28px] font-black text-[#191F28] leading-tight mb-2 whitespace-nowrap">효원상조와 함께하세요!</h2>
            <p className="text-[14px] text-[#4E5968] font-medium">정직과 신뢰로 보답하겠습니다.</p>
          </div>
          <div className="px-4 flex justify-center">
            <img 
              src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778476138/IMG_3660_l4vlag.png" 
              alt="효원상조 전속모델" 
              className="w-full h-auto object-contain max-h-[320px]"
            />
          </div>
        </div>

        <div className="bg-white border border-[#E5E8EB] rounded-[32px] p-8 flex items-center gap-5 shadow-sm">
          <div className="w-20 h-20 bg-[#F2F4F6] rounded-full overflow-hidden shrink-0 border-2 border-white shadow-inner">
            <img src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778476138/IMG_3660_l4vlag.png" alt="안내 모델" className="w-full h-full object-cover object-top" />
          </div>
          <div>
            <span className="text-[12px] font-bold text-[#3182F6] block mb-1">바른 소비의 첫걸음</span>
            <p className="text-[13px] sm:text-[15px] font-bold text-[#191F28] leading-relaxed break-keep">
              고객과 함께 발맞춰 걷는 효원상조가 되겠습니다.
            </p>
          </div>
        </div>

        {/* 신한카드 이용한도 확인 링크 */}
        <div className="mt-6">
          <a 
            href="https://www.shinhancard.com/pconts/html/bridge/MOBFM052R01.html?crustMenuId=ms560" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-white border border-[#3182F6] rounded-[24px] p-5 transition-all hover:bg-[#F2F8FF] group shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#F2F8FF] rounded-2xl flex items-center justify-center text-[#3182F6]">
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="text-[12px] font-bold text-[#3182F6] block mb-0.5">결제 전 확인해 보세요</span>
                <p className="text-[14px] sm:text-[15px] font-bold text-[#191F28] whitespace-nowrap">신한카드 이용한도 조회하기</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#ADB5BD] group-hover:text-[#3182F6] transition-colors" />
          </a>
        </div>
      </section>

      {/* Section 16: 가입 절차 안내 및 최종 CTA */}
      <section className="bg-[#0A1128] py-20 px-6 my-2 text-white">
        <div className="mb-12 text-center">
          <h2 className="text-[24px] font-bold mb-10 tracking-tight">리빙144(신한카드) 가입절차 안내</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { step: '01', title: '상담신청', desc: '온라인·전화' },
              { step: '02', title: '해피콜 진행', desc: '상품/조건 확인' },
              { step: '03', title: '상조 가입', desc: '본인 인증' },
              { step: '04', title: '상품 배송 & 혜택 확인', desc: '프리미엄몰 혜택', highlight: true },
            ].map((item, i) => (
              <div key={i} className={`p-5 rounded-[24px] border ${item.highlight ? 'border-[#FFFF00] bg-white/5' : 'border-white/10 bg-white/5'}`}>
                <span className={`text-[12px] font-black block mb-2 ${item.highlight ? 'text-[#FFFF00]' : 'text-white/40'}`}>{item.step}</span>
                <h4 className="text-[14px] font-bold mb-1">{item.title}</h4>
                <p className="text-[11px] text-white/40">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#191F28] rounded-[24px] p-6 border border-white/10 mb-10">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-8 bg-gradient-to-br from-[#0046FF] to-[#00227B] rounded-md shadow-inner relative overflow-hidden">
              <div className="absolute top-2 left-2 w-3 h-2 bg-[#FFD700]/80 rounded-[2px]"></div>
              <div className="absolute -right-2 -bottom-2 w-8 h-8 bg-white/5 rounded-full"></div>
            </div>
            <p className="text-[14px] font-bold leading-snug">신한카드 이용 한도 확인 및<br/>이용 한도 상향 방법 안내</p>
          </div>
          <a 
            href="https://www.shinhancard.com/pconts/html/bridge/MOBFM052R01.html?crustMenuId=ms560" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full py-3.5 bg-white/5 rounded-xl text-[14px] font-bold border border-white/10 text-center hover:bg-white/10 transition-colors"
          >
            한도 확인 바로가기
          </a>
        </div>

        <div className="space-y-2 px-2">
          <div className="flex gap-2 text-[11px] text-white/40 leading-relaxed">
            <div className="mt-1 w-1 h-1 bg-white/20 rounded-full shrink-0"></div>
            <p>상담신청 완료 시 1~2일 내에 해피콜이 진행됩니다.</p>
          </div>
          <div className="flex gap-2 text-[11px] text-white/40 leading-relaxed">
            <div className="mt-1 w-1 h-1 bg-white/20 rounded-full shrink-0"></div>
            <p>신한카드가 없으신 경우에도 간편하게 발급 안내를 도와드립니다.</p>
          </div>
        </div>
      </section>

      {/* Section 12: 최종 간편 상담 신청 폼 */}
      <section ref={formRef} className="bg-[#F2F4F6] py-16 sm:py-24 px-6">
        <div className="mb-8 sm:mb-12 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778485617/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_ns2tmp.png" alt="효원상조" className="h-4 sm:h-5 object-contain" />
            <span className="text-[14px] font-medium text-[#ADB5BD]">×</span>
            <img 
              src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778485695/images_k1hjt8.png" 
              alt="신한카드" 
              className="h-4 sm:h-5 object-contain mix-blend-multiply" 
            />
          </div>
          <h2 className="text-[28px] font-black text-[#191F28] leading-tight break-keep mb-3">
            간편 상담 신청
          </h2>
          <p className="text-[14px] text-[#4E5968] font-medium">지금 바로 혜택 상담을 시작하세요</p>
        </div>

        <div className="bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white max-w-[500px] mx-auto">
          <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-10">
            <div className="group">
              <label className="block text-[13px] font-bold text-[#4E5968] mb-2 ml-1 transition-colors group-focus-within:text-[#3182F6]">성함</label>
              <input 
                type="text" 
                placeholder="성함을 입력해주세요" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#F9FAFB] border border-[#E5E8EB] rounded-[20px] px-6 py-3.5 sm:py-4.5 text-[16px] focus:ring-2 focus:ring-[#3182F6]/20 focus:border-[#3182F6] focus:bg-white outline-none transition-all placeholder:text-[#ADB5BD] font-medium" 
              />

            </div>
            <div className="group">
              <label className="block text-[13px] font-bold text-[#4E5968] mb-2 ml-1 transition-colors group-focus-within:text-[#3182F6]">연락처</label>
              <input 
                type="tel" 
                inputMode="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="010-0000-0000" 
                maxLength={13}
                className="w-full bg-[#F9FAFB] border border-[#E5E8EB] rounded-[20px] px-6 py-3.5 sm:py-4.5 text-[16px] focus:ring-2 focus:ring-[#3182F6]/20 focus:border-[#3182F6] focus:bg-white outline-none transition-all placeholder:text-[#ADB5BD] font-medium" 
              />
            </div>
            
            <div className="pt-2">
              <label className="flex items-center gap-3 p-4 sm:p-5 bg-[#F9FAFB] rounded-[24px] cursor-pointer group hover:bg-[#F2F8FF] transition-colors border border-transparent hover:border-[#3182F6]/10">
                <input type="checkbox" className="w-5 h-5 rounded-full border-[#D1D6DB] text-[#3182F6] focus:ring-[#3182F6] transition-all" defaultChecked />
                <div className="flex-1 flex justify-between items-center">
                  <span className="text-[14px] font-bold text-[#191F28]">개인정보 동의</span>
                  <span 
                    onClick={(e) => {
                      e.preventDefault();
                      setIsPrivacyModalOpen(true);
                    }}
                    className="text-[12px] text-[#8B95A1] underline decoration-[#D1D6DB] underline-offset-4 cursor-pointer hover:text-[#3182F6] transition-colors"
                  >
                    전문보기
                  </span>
                </div>
              </label>
            </div>
          </div>

          <button 
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className={`w-full bg-[#3182F6] text-white font-black text-[18px] py-4.5 sm:py-6 rounded-[24px] hover:bg-[#1B64DA] transition-all shadow-[0_10px_30px_rgba(49,130,246,0.3)] active:scale-[0.97] flex flex-col items-center gap-1 group ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <span className="text-[12px] opacity-80 font-bold tracking-wider group-hover:scale-110 transition-transform">
              {isSubmitting ? '접수 중...' : '🎁 특별 혜택 신청하기'}
            </span>
            <div className="flex items-center gap-2">
              {isSubmitting ? '잠시만 기다려주세요' : '무료 상담 예약'}
              {!isSubmitting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </div>
          </button>

          
          <div className="mt-8 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#F9FAFB] rounded-full border border-[#F2F4F6]">
              <div className="w-1.5 h-1.5 bg-[#00D084] rounded-full animate-pulse"></div>
              <span className="text-[11px] font-bold text-[#4E5968]">현재 상담 대기 중</span>
            </div>
            <p className="text-[12px] text-[#8B95A1] text-center leading-relaxed">
              신청 즉시 전문 상담원이 순차적으로<br/>연락을 드려 친절히 안내해 드립니다.
            </p>
          </div>
        </div>
      </section>

      {/* 푸터 영역 */}
      <footer className="bg-[#111111] pt-16 pb-32 px-6 text-white border-t border-white/5">
        <div className="max-w-[400px] mx-auto">
          {/* Logo in Footer */}
          <div className="mb-10 opacity-60">
            <img 
              src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1777895641/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_wnz5aa.png" 
              alt="효원상조 로고" 
              className="h-[22px] w-auto object-contain brightness-0 invert"
            />
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 mb-10 px-1">
            <a href="#" className="text-[13px] font-bold text-[#D1D6DB] hover:text-white transition-colors">이용약관</a>
            <button 
              onClick={() => setIsPrivacyModalOpen(true)}
              className="text-[13px] font-bold text-white hover:text-white transition-colors underline underline-offset-4 decoration-white/30"
            >
              개인정보처리방침
            </button>
            <a href="#" className="text-[13px] font-bold text-[#D1D6DB] hover:text-white transition-colors">중요정보고시사항</a>
          </div>

          <div className="border-t border-white/5 pt-10">
            {/* Distributor Info */}
            <div className="mb-10 px-1">
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
            <div className="mb-10 px-1 border-t border-white/5 pt-8">
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
            <div className="mb-12 px-1 bg-white/5 rounded-2xl p-5 border border-white/5">
              <h5 className="text-[13px] font-bold text-[#3182F6] mb-4">(주)효원상조 고객센터</h5>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-[#8B95A1]">고객센터</span>
                  <a href="tel:1588-8873" className="text-[18px] font-black text-white hover:text-[#3182F6] transition-colors">1588-8873</a>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[12px] text-[#8B95A1]">24시 긴급행사</span>
                    <span className="text-[10px] text-[#3182F6]">(장례접수)</span>
                  </div>
                  <a href="tel:1577-8873" className="text-[18px] font-black text-white hover:text-[#3182F6] transition-colors">1577-8873</a>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1 pt-4 border-t border-white/5">
              <p className="text-[11px] text-white/20 font-medium tracking-tight">© HYOWON. All rights reserved.</p>
              <div className="flex gap-4">
                 {/* 관리자 전용 버튼 */}
                 <a 
                   href="/admin"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="text-[10px] text-white/10 hover:text-[#3182F6] transition-colors font-bold"
                 >
                   ADMIN
                 </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* 개인정보 처리방침 모달 */}
      <AnimatePresence>
        {isPrivacyModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPrivacyModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[500px] bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-[#F2F4F6] flex items-center justify-between">
                <h3 className="text-[18px] font-black text-[#191F28]">개인정보 수집 및 이용 동의</h3>
                <button 
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center bg-[#F9FAFB] rounded-full hover:bg-[#F2F4F6] transition-colors"
                >
                  <X className="w-5 h-5 text-[#8B95A1]" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto text-[14px] text-[#4E5968] leading-relaxed break-keep scrollbar-hide">
                <p className="mb-6 font-bold text-[#191F28]">
                  (주)효원상조와 (주)라이프앤조이는 귀하의 상담 신청과 관련하여 다음과 같이 개인정보를 수집·이용 및 제공하고자 합니다.
                </p>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-black text-[#191F28] mb-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#3182F6] rounded-full"></div>
                      1. 개인정보의 수집·이용에 관한 사항
                    </h4>
                    <ul className="space-y-2 pl-3.5">
                      <li>• <span className="font-bold">수집 항목:</span> 이름, 연락처(휴대폰 번호), 문의 사항</li>
                      <li>• <span className="font-bold">수집 및 이용 목적:</span>
                        <ul className="pl-3 mt-1 space-y-1 text-[13px] opacity-80">
                          <li>- 상담 신청에 따른 본인 확인 및 원활한 의사소통 경로 확보</li>
                          <li>- 상품 안내(상조 및 가전결합 상품) 및 가입 상담</li>
                          <li>- 계약 진행 및 서비스 제공을 위한 기초 자료 활용</li>
                        </ul>
                      </li>
                      <li>• <span className="font-bold">보유 및 이용 기간:</span> 상담 완료 및 목적 달성 시까지 (단, 관련 법령에 따라 보존이 필요한 경우 해당 기간까지 보관)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-black text-[#191F28] mb-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#3182F6] rounded-full"></div>
                      2. 개인정보의 제3자 제공에 관한 사항
                    </h4>
                    <p className="mb-2 pl-3.5">본 상담 서비스 제공을 위해 아래와 같이 개인정보를 제공합니다.</p>
                    <ul className="space-y-2 pl-3.5">
                      <li>• <span className="font-bold">제공받는 자:</span> (주)효원상조, (주)라이프앤조이</li>
                      <li>• <span className="font-bold">제공 목적:</span> 상품 안내, 해피콜, 계약 체결 및 관리</li>
                      <li>• <span className="font-bold">제공 항목:</span> 이름, 연락처, 상담 내용</li>
                      <li>• <span className="font-bold">보유 및 이용 기간:</span> 제공 목적 달성 시까지</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#F2F4F6]">
                    <p className="font-bold text-[#191F28] mb-1">※ 동의 거부 권리 안내</p>
                    <p className="text-[13px] opacity-80">귀하는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 다만, 동의를 거부하실 경우 상담 신청 및 상품 안내 서비스 이용이 제한될 수 있습니다.</p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-[#F9FAFB] border-t border-[#F2F4F6]">
                <button 
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="w-full py-4 bg-[#3182F6] text-white font-bold rounded-2xl hover:bg-[#1B64DA] transition-all"
                >
                  확인했습니다
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* 플로팅 상담 신청 바 (Sticky Bottom Bar) */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] sm:max-w-[480px] md:max-w-[540px] z-[45] px-4 pb-4 pointer-events-none">
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="bg-[#191F28]/95 backdrop-blur-md p-2 rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.3)] border border-white/10 pointer-events-auto flex items-center gap-3"
        >
          <div className="flex-1 flex flex-col justify-center pl-4">
             <div className="flex items-center gap-1.5 mb-1">
               <span className="w-1 h-1 bg-[#3182F6] rounded-full animate-pulse"></span>
               <span className="text-[9px] font-black text-[#3182F6] tracking-tighter uppercase">Special Offer</span>
             </div>
             <p className="text-[13px] font-bold text-white leading-none">리빙144(신한카드) 단독 혜택</p>
          </div>
          <button 
            onClick={() => {
              setSelectedProduct(null);
              setIsContactModalOpen(true);
            }}
            className="bg-[#3182F6] text-white px-5 py-3 rounded-[18px] font-black text-[13px] flex items-center gap-2 hover:bg-[#1B64DA] transition-colors shadow-lg shadow-[#3182F6]/20 active:scale-95 shrink-0"
          >
            상담 신청 <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>

      {/* 상담 신청 모달 */}
      <AnimatePresence>
        {isContactModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
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
              className="relative w-full max-w-[450px] bg-white rounded-[40px] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-[#F2F4F6] flex items-center justify-between">
                <div>
                   <h3 className="text-[20px] font-black text-[#191F28] mb-1">빠른 상담 신청</h3>
                   <p className="text-[13px] text-[#8B95A1] font-medium">상담원이 확인 후 연락드립니다</p>
                </div>
                <button 
                  onClick={() => setIsContactModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center bg-[#F9FAFB] rounded-full hover:bg-[#F2F4F6] transition-colors"
                >
                  <X className="w-5 h-5 text-[#8B95A1]" />
                </button>
              </div>

              <div className="p-8">
                {selectedProduct && (
                  <div className="mb-8 p-4 bg-[#F2F8FF] rounded-[24px] border border-[#3182F6]/10 flex items-center gap-4">
                    <div className="w-20 h-20 bg-white rounded-xl overflow-hidden shrink-0 border border-[#E5E8EB]">
                      <img 
                        src={(selectedProduct.images && selectedProduct.images.length > 0) ? selectedProduct.images[0] : selectedProduct.image} 
                        alt={selectedProduct.name} 
                        className="w-full h-full object-contain p-2" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-[#3182F6] text-white text-[10px] font-bold rounded-md">선택 제품</span>
                        <span className="text-[11px] font-bold text-[#8B95A1]">{selectedProduct.brand}</span>
                      </div>
                      <h4 className="text-[15px] font-black text-[#191F28] truncate leading-tight mb-0.5">{selectedProduct.name}</h4>
                      <p className="text-[12px] text-[#8B95A1] truncate">{selectedProduct.model || selectedProduct.modelName}</p>
                    </div>
                  </div>
                )}
                <div className="space-y-6 mb-10">
                  <div className="group">
                    <label className="block text-[13px] font-bold text-[#4E5968] mb-2.5 ml-1 transition-colors group-focus-within:text-[#3182F6]">성함</label>
                    <input 
                      type="text" 
                      placeholder="성함을 입력해주세요" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#F9FAFB] border border-[#E5E8EB] rounded-[20px] px-6 py-4.5 text-[16px] focus:ring-2 focus:ring-[#3182F6]/20 focus:border-[#3182F6] focus:bg-white outline-none transition-all placeholder:text-[#ADB5BD] font-medium" 
                    />

                  </div>
                  <div className="group">
                    <label className="block text-[13px] font-bold text-[#4E5968] mb-2.5 ml-1 transition-colors group-focus-within:text-[#3182F6]">연락처</label>
                    <input 
                      type="tel" 
                      inputMode="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="010-0000-0000" 
                      maxLength={13}
                      className="w-full bg-[#F9FAFB] border border-[#E5E8EB] rounded-[20px] px-6 py-4.5 text-[16px] focus:ring-2 focus:ring-[#3182F6]/20 focus:border-[#3182F6] focus:bg-white outline-none transition-all placeholder:text-[#ADB5BD] font-medium" 
                    />
                  </div>
                  
                  <div className="pt-2">
                    <label className="flex items-center gap-3 p-5 bg-[#F9FAFB] rounded-[24px] cursor-pointer group hover:bg-[#F2F8FF] transition-colors border border-transparent hover:border-[#3182F6]/10">
                      <input type="checkbox" className="w-5 h-5 rounded-full border-[#D1D6DB] text-[#3182F6] focus:ring-[#3182F6] transition-all" defaultChecked />
                      <div className="flex-1 flex justify-between items-center">
                        <span className="text-[14px] font-bold text-[#191F28]">개인정보 동의</span>
                        <span 
                          onClick={(e) => {
                            e.preventDefault();
                            setIsPrivacyModalOpen(true);
                          }}
                          className="text-[12px] text-[#8B95A1] underline decoration-[#D1D6DB] underline-offset-4 cursor-pointer hover:text-[#3182F6] transition-colors"
                        >
                          전문보기
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <button 
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                  className={`w-full bg-[#3182F6] text-white font-black text-[18px] py-6 rounded-[24px] hover:bg-[#1B64DA] transition-all shadow-[0_10px_30px_rgba(49,130,246,0.3)] active:scale-[0.97] flex flex-col items-center gap-1 group ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <span className="text-[12px] opacity-80 font-bold tracking-wider group-hover:scale-110 transition-transform">
                    {isSubmitting ? '접수 중...' : '🎁 특별 혜택 신청하기'}
                  </span>
                  <div className="flex items-center gap-2">
                    {isSubmitting ? '잠시만 기다려주세요' : '무료 상담 신청 완료'}
                    {!isSubmitting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                  </div>
                </button>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
