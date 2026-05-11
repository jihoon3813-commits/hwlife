import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, Phone, Check, Calendar, Coins, ShieldCheck, 
  ChevronDown, ChevronUp, ChevronRight, FileText, Wallet, Sparkles, CreditCard, X,
  Hotel, HeartPulse, Film, Package, CheckCircle
} from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';


export default function SpecialPage({ channelSubdomain }: { channelSubdomain?: string }) {
  const landingInfo = useQuery(api.landings.getByPath, { path: "/special" });


  const formRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'1' | '2'>('1');
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createInquiry = useMutation(api.inquiries.create);


  // Channel Tracking
  // 1. Prioritize explicitly passed channelSubdomain
  // 2. If visiting /special directly, it's Master (본사)
  // 3. If visiting /special/subdomain, use that subdomain
  const segments = window.location.pathname.split('/').filter(Boolean);
  const channelId = channelSubdomain || 
                   (segments.length === 1 && segments[0] === 'special' ? '본사' : 
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
      await createInquiry({
        name: name.trim(),
        phone: phoneNumber,
        productName: landingInfo?.name || '신한카드 스페셜144',
        channelId: channelId
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


  return (
    <div className="w-full max-w-[430px] sm:max-w-[480px] md:max-w-[540px] mx-auto bg-[#F2F4F6] min-h-screen relative font-sans text-[#191F28] overflow-x-hidden sm:shadow-[0_0_40px_rgba(0,0,0,0.05)] sm:border-x sm:border-[#E5E8EB]">
      
      {/* GNB / 상단 헤더 */}
      <header className="sticky top-0 w-full bg-white/90 backdrop-blur-md z-40 px-5 flex items-center justify-between h-[60px] border-b border-[#F2F4F6]">
        <div className="flex items-center gap-1.5">
          <img 
            src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1777895641/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_wnz5aa.png" 
            alt="효원상조" 
            className="h-[18px] w-auto object-contain"
          />
          <span className="text-[10px] font-black text-[#D1D6DB]">x</span>
          <img 
            src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778509015/bson_%EB%A1%9C%EA%B3%A0_u08pw7.png" 
            alt="BSON" 
            className="h-[22px] w-auto object-contain"
          />
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
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F0F10] via-[#1A1A1C]/95 to-[#2D2D30]/80"></div>
          {/* 포인트 그리드 패턴 */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        </div>

        {/* 모델 레이어 (앞에 배치) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img 
            src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778509099/IMG_3521-1_k6wd0u.png" 
            alt="모델" 
            className="h-[75%] w-auto object-contain object-bottom mt-[-35%] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_85%,rgba(0,0,0,0)_100%)]"
          />
        </div>
        
        {/* 하단 페이드 그라데이션 */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0F0F10] to-transparent z-10"></div>


        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative z-10 text-white"
        >
          <div className="inline-block px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[11px] font-bold text-white mb-4">
            효원상조 x BSON x PREMIUM
          </div>
          
          <h2 className="text-[38px] font-black leading-[1.2] mb-5 tracking-tight break-keep">
            해피효원라이프<br/>
            <span className="text-[#C5A059]">스페셜299 출시</span>
          </h2>

          <p className="text-white/80 text-[16px] leading-[1.6] mb-8 break-keep font-medium">
            카드 한도 관계없이<br/>
            신용만으로 신청 가능!<br/>
            <span className="text-white font-bold">특별한 제품과 보너스 혜택까지!</span>
          </p>


          <button 
            onClick={() => setIsContactModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#C5A059] py-4 rounded-[20px] text-[16px] font-bold text-white shadow-[0_8px_20px_rgba(197,160,89,0.3)] hover:bg-[#B38E46] transition-all active:scale-95"
          >
            단독 혜택받고 무료상담 신청 <ArrowRight className="w-5 h-5" />
          </button>

        </motion.div>
      </section>

      {/* Section 2: 프리미엄 실물 카드 부각 섹션 */}
      <section className="relative py-24 px-6 overflow-hidden bg-[#0F0F10]">
        {/* 배경 빛 번짐 효과 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#C5A059] opacity-10 blur-[120px] rounded-full"></div>
        
        <div className="relative z-10 text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-3 py-1 bg-[#C5A059]/20 text-[#C5A059] text-[12px] font-bold rounded-full mb-4">PREMIUM PARTNERSHIP</span>
            <h3 className="text-[24px] font-black leading-tight text-white break-keep">
              효원상조 x BSON이 만나<br/>
              <span className="text-[#C5A059]">새로운 혜택이 쏟아집니다</span>
            </h3>

          </motion.div>
        </div>


        {/* 실물 카드 레이어 */}
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
            className="relative w-[300px] aspect-[1.6/1] rounded-[14px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-pointer group"
          >
            <img 
              src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778509874/%EC%A0%9C%EB%AA%A9_%EC%97%86%EB%8A%94_%EB%94%94%EC%9E%90%EC%9D%B8_3_l0uzfy.png" 
              alt="BSON 카드" 
              className="w-full h-full object-cover"
            />
            
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
          <div className="absolute -bottom-4 w-40 h-2 bg-[#C5A059] blur-[20px] opacity-50"></div>
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
            신용만 있으면 누구나 특별한 혜택을 받을 수 있고, 상조 외 크루즈를 동시에 이용할 수 있습니다!
          </p>
          
          <div className="bg-white/5 backdrop-blur-md rounded-[20px] p-5 border border-white/10 shadow-inner">
            <p className="text-[#C5A059] text-[13px] font-bold mb-1">해피효원라이프 스페셜299</p>
            <p className="text-white/80 text-[14px] font-medium">2구좌 가입 조건</p>
          </div>
        </div>

      </section>

      {/* Section 3: 단독 프로모션 4대 혜택 (Benefits Grid) */}
      <section className="bg-[#191F28] py-14 px-6 my-2 text-white">
        <div className="mb-8 text-center">
          <p className="text-[13px] font-bold text-[#C5A059] mb-2">오직 프리미엄몰 회원에게만 드리는</p>
          <h2 className="text-[22px] font-bold leading-tight break-keep">
            효원상조 X BSON<br/>단독 프로모션
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 카드 1 */}
          <div className="bg-white/5 border border-white/10 rounded-[24px] p-4 sm:p-5 flex flex-row sm:flex-col items-center sm:text-center text-left">
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white overflow-hidden shadow-lg shrink-0 mr-4 sm:mr-0 sm:mb-4">
              <img src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778475650/3._%ED%94%84%EB%A6%AC%EB%AA%A8_mmmjvf.png" alt="고급 제품" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#C5A059] mb-1 block">가입 축하 혜택 1</span>
              <h4 className="text-[14px] font-bold text-white break-keep">고급 사은품 증정</h4>
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
          <p className="text-[15px] text-[#C5A059] font-bold break-keep">
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
      <section className="bg-[#0F0F10] py-20 px-6 my-2">
        <div className="mb-10 text-center">
          <h2 className="text-[26px] font-black text-white leading-tight break-keep mb-4">
            특별 보너스 혜택까지!<br/>
            <span className="text-[#C5A059]">해피효원라이프·스페셜 299</span> 상세표
          </h2>
          <span className="inline-block px-4 py-1.5 bg-[#FFFF00] text-[#191F28] text-[12px] font-black rounded-lg shadow-lg">
            오직 프리미엄몰에서만 가입 가능합니다
          </span>
        </div>

        {/* Account selection box (Fixed to 2 accounts) */}
        <div className="flex p-1 bg-white/5 rounded-[20px] mb-8 max-w-[500px] mx-auto border border-white/10">
          <div className="flex-1 py-4 bg-[#C5A059] rounded-[16px] text-[16px] font-black text-white shadow-lg text-center tracking-wider">
            2구좌 가입
          </div>
        </div>

        {/* Tab Content (Fixed to 2 accounts) - Dark Card */}
        <div className="bg-[#1A1A1C] rounded-[32px] border border-white/10 overflow-hidden shadow-2xl max-w-[500px] mx-auto">
          <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
              <span className="text-[15px] text-white/50 font-bold">총 납입금액</span>
              <div className="text-right">
                <span className="text-[22px] font-black text-white block">11,960,000원</span>
                <span className="text-[12px] text-white/30 font-bold">(총 200회 납입 기준)</span>
              </div>
            </div>
            
            <div className="w-full h-[1px] bg-white/5"></div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="text-[14px] text-white/60 font-bold">1~60회 납입</span>
                <span className="text-[18px] font-black text-[#C5A059]">59,800원</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="text-[14px] text-white/60 font-bold">61~200회 납입</span>
                <span className="text-[18px] font-black text-white">59,800원</span>
              </div>
            </div>

            <div className="w-full h-[1px] bg-white/5"></div>

            <div className="bg-gradient-to-br from-[#C5A059]/20 to-[#C5A059]/5 p-6 rounded-[24px] border border-[#C5A059]/20">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[14px] text-[#C5A059] font-black">만기 시 환급금</span>
                <span className="text-[20px] font-black text-[#C5A059]">100% 환급</span>
              </div>
              <p className="text-[24px] font-black text-white">11,960,000원</p>
              <p className="text-[11px] text-[#C5A059]/60 mt-2">* 만기 납입 완료 시 해약환급금 100% 보장</p>
            </div>

            <div>
              <span className="text-[13px] font-bold text-white/40 mb-4 block uppercase tracking-widest">Membership Benefits</span>
              <div className="flex flex-wrap gap-2">
                {['라이프서비스 2회', '특별 사은품 증정', '프리미엄몰 보너스'].map((benefit, i) => (
                  <span key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[12px] font-bold text-white/70 shadow-inner">
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 px-2 space-y-1">
          <p className="text-[11px] text-[#8B95A1]">* 프리미엄몰 보너스 제품은 상담 시 확인 가능합니다.</p>
          <p className="text-[11px] text-[#8B95A1]">* 1~60회차 회비는 BSON의 렌탈료를 포함합니다.</p>
        </div>

      </section>


      {/* Section 9: 결합 리빙 제품 안내 */}
      <section className="bg-white py-20 px-6 my-2">
        <div className="mb-12 text-center">
          <p className="text-[13px] font-bold text-[#C5A059] mb-3 uppercase tracking-wider">Product Information</p>
          <h2 className="text-[28px] font-black text-[#191F28] leading-tight break-keep">
            결합 제품 안내
          </h2>
        </div>

        <div className="max-w-[500px] mx-auto">
          {/* 2구좌 전용 결합 제품 */}
          <div className="bg-[#F8FAFB] rounded-[32px] p-8 border border-[#E5E8EB] shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 bg-[#191F28] text-white text-[11px] font-black rounded-full">2구좌 가입 시 제공</span>
            </div>
            
            <div className="w-full aspect-[4/3] rounded-2xl bg-white overflow-hidden mb-6 shadow-inner relative group">
              <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-[#C5A059] text-white text-[10px] font-black rounded-lg">
                BEST SELLER
              </div>
              <img 
                src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778475650/3._%ED%94%84%EB%A6%AC%EB%AA%A8_mmmjvf.png" 
                alt="프리모 매트리스" 
                className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110" 
              />
            </div>
            
            <div className="space-y-3">
              <h4 className="text-[18px] font-bold text-[#191F28] leading-snug">프리모 캐나다 독립 포켓스프링 매트리스 (K/Q 선택)</h4>
              <p className="text-[14px] text-[#4E5968] leading-relaxed break-keep">
                캐나다 기술력으로 완성된 독립 포켓스프링이 최적의 수면 환경을 제공합니다. (빠른 배송 서비스 제공)
              </p>
              <div className="flex items-center gap-3 pt-2">
                <span className="text-[12px] font-bold text-[#8B95A1] bg-[#F2F4F6] px-2 py-1 rounded">모델명: PR330-1</span>
                <span className="text-[12px] font-bold text-[#C5A059] bg-[#C5A059]/10 px-2 py-1 rounded">프리미엄 라인</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="bg-white border border-[#C5A059] rounded-[24px] p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#1A1A1C] rounded-2xl flex items-center justify-center text-[#C5A059]">
                <Package className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="text-[12px] font-bold text-[#C5A059] block mb-0.5">BSON 렌탈 서비스</span>
                <p className="text-[15px] font-bold text-[#191F28]">복잡한 서류 없이 간편하게!</p>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Section 16: 가입 절차 안내 및 최종 CTA */}
      <section className="bg-[#0F0F10] py-20 px-6 my-2 text-white">
        <div className="mb-12 text-center">
          <h2 className="text-[24px] font-bold mb-10 tracking-tight">해피효원라이프 스페셜299 가입절차 안내</h2>
          
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
            <div className="w-12 h-12 bg-[#C5A059]/10 rounded-2xl flex items-center justify-center text-[#C5A059]">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="text-[14px] font-bold leading-snug">BSON 렌탈은<br/>누구나 간편하게 신청 가능합니다</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 bg-[#C5A059] rounded-full mt-1.5 shrink-0"></div>
              <p className="text-[13px] text-white/70">복잡한 증빙서류 NO</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 bg-[#C5A059] rounded-full mt-1.5 shrink-0"></div>
              <p className="text-[13px] text-white/70">만 25세 ~ 만 75세 누구나 신청 가능</p>
            </div>
          </div>
        </div>


        <div className="space-y-2 px-2">
          <div className="flex gap-2 text-[11px] text-white/40 leading-relaxed">
            <div className="mt-1 w-1 h-1 bg-white/20 rounded-full shrink-0"></div>
            <p>상담신청 완료 시 1~2일 내에 해피콜이 진행됩니다.</p>
          </div>
          <div className="flex gap-2 text-[11px] text-white/40 leading-relaxed">
            <div className="mt-1 w-1 h-1 bg-white/20 rounded-full shrink-0"></div>
            <p>BSON 렌탈 심사 결과에 따라 가입이 제한될 수 있습니다.</p>
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
              src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778509015/bson_%EB%A1%9C%EA%B3%A0_u08pw7.png" 
              alt="BSON" 
              className="h-5 sm:h-6 object-contain" 
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
              <label className="block text-[13px] font-bold text-[#4E5968] mb-2 ml-1 transition-colors group-focus-within:text-[#C5A059]">성함</label>
              <input 
                type="text" 
                placeholder="성함을 입력해주세요" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#F9FAFB] border border-[#E5E8EB] rounded-[20px] px-6 py-3.5 sm:py-4.5 text-[16px] focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:bg-white outline-none transition-all placeholder:text-[#ADB5BD] font-medium" 
              />

            </div>
            <div className="group">
              <label className="block text-[13px] font-bold text-[#4E5968] mb-2 ml-1 transition-colors group-focus-within:text-[#C5A059]">연락처</label>
              <input 
                type="tel" 
                inputMode="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="010-0000-0000" 
                maxLength={13}
                className="w-full bg-[#F9FAFB] border border-[#E5E8EB] rounded-[20px] px-6 py-4.5 text-[16px] focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:bg-white outline-none transition-all placeholder:text-[#ADB5BD] font-medium" 
              />
            </div>
            
            <div className="pt-2">
              <label className="flex items-center gap-3 p-5 bg-[#F9FAFB] rounded-[24px] cursor-pointer group hover:bg-[#1A1A1C] transition-colors border border-transparent hover:border-[#C5A059]/10">
                <input type="checkbox" className="w-5 h-5 rounded-full border-[#D1D6DB] text-[#C5A059] focus:ring-[#C5A059] transition-all" defaultChecked />
                <div className="flex-1 flex justify-between items-center">
                  <span className="text-[14px] font-bold text-[#191F28]">개인정보 수집 및 이용 동의</span>
                  <span 
                    onClick={(e) => {
                      e.preventDefault();
                      setIsPrivacyModalOpen(true);
                    }}
                    className="text-[12px] text-[#8B95A1] underline decoration-[#D1D6DB] underline-offset-4 cursor-pointer hover:text-[#C5A059] transition-colors"
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
            className={`w-full bg-[#C5A059] text-white font-black text-[18px] py-6 rounded-[24px] hover:bg-[#B38E46] transition-all shadow-[0_10px_30px_rgba(49,130,246,0.3)] active:scale-[0.97] flex flex-col items-center gap-1 group ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                <span className="w-1 h-3 bg-[#C5A059] rounded-full"></span>
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
              <h5 className="text-[13px] font-bold text-[#C5A059] mb-4">(주)효원상조 고객센터</h5>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-[#8B95A1]">고객센터</span>
                  <a href="tel:1588-8873" className="text-[18px] font-black text-white hover:text-[#C5A059] transition-colors">1588-8873</a>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[12px] text-[#8B95A1]">24시 긴급행사</span>
                    <span className="text-[10px] text-[#C5A059]">(장례접수)</span>
                  </div>
                  <a href="tel:1577-8873" className="text-[18px] font-black text-white hover:text-[#C5A059] transition-colors">1577-8873</a>
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
                   className="text-[10px] text-white/10 hover:text-[#C5A059] transition-colors font-bold"
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
                      <div className="w-1.5 h-1.5 bg-[#C5A059] rounded-full"></div>
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
                      <div className="w-1.5 h-1.5 bg-[#C5A059] rounded-full"></div>
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
                  className="w-full py-4 bg-[#C5A059] text-white font-bold rounded-2xl hover:bg-[#B38E46] transition-all"
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
               <span className="w-1 h-1 bg-[#C5A059] rounded-full animate-pulse"></span>
               <span className="text-[9px] font-black text-[#C5A059] tracking-tighter uppercase">Special Offer</span>
             </div>
             <p className="text-[13px] font-bold text-white leading-none">스페셜 299 단독 혜택</p>
          </div>
          <button 
            onClick={() => setIsContactModalOpen(true)}
            className="bg-[#C5A059] text-white px-5 py-3 rounded-[18px] font-black text-[13px] flex items-center gap-2 hover:bg-[#B38E46] transition-colors shadow-lg shadow-[#C5A059]/20 active:scale-95 shrink-0"
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
                <div className="space-y-6 mb-10">
                  <div className="group">
                    <label className="block text-[13px] font-bold text-[#4E5968] mb-2.5 ml-1 transition-colors group-focus-within:text-[#C5A059]">성함</label>
                    <input 
                      type="text" 
                      placeholder="성함을 입력해주세요" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#F9FAFB] border border-[#E5E8EB] rounded-[20px] px-6 py-4.5 text-[16px] focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:bg-white outline-none transition-all placeholder:text-[#ADB5BD] font-medium" 
                    />

                  </div>
                  <div className="group">
                    <label className="block text-[13px] font-bold text-[#4E5968] mb-2.5 ml-1 transition-colors group-focus-within:text-[#C5A059]">연락처</label>
                    <input 
                      type="tel" 
                      inputMode="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="010-0000-0000" 
                      maxLength={13}
                      className="w-full bg-[#F9FAFB] border border-[#E5E8EB] rounded-[20px] px-6 py-4.5 text-[16px] focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:bg-white outline-none transition-all placeholder:text-[#ADB5BD] font-medium" 
                    />
                  </div>
                  
                  <div className="pt-2">
                    <label className="flex items-center gap-3 p-5 bg-[#F9FAFB] rounded-[24px] cursor-pointer group hover:bg-[#1A1A1C] transition-colors border border-transparent hover:border-[#C5A059]/10">
                      <input type="checkbox" className="w-5 h-5 rounded-full border-[#D1D6DB] text-[#C5A059] focus:ring-[#C5A059] transition-all" defaultChecked />
                      <div className="flex-1 flex justify-between items-center">
                        <span className="text-[14px] font-bold text-[#191F28]">개인정보 동의</span>
                        <span 
                          onClick={(e) => {
                            e.preventDefault();
                            setIsPrivacyModalOpen(true);
                          }}
                          className="text-[12px] text-[#8B95A1] underline decoration-[#D1D6DB] underline-offset-4 cursor-pointer hover:text-[#C5A059] transition-colors"
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
                  className={`w-full bg-[#C5A059] text-white font-black text-[18px] py-6 rounded-[24px] hover:bg-[#B38E46] transition-all shadow-[0_10px_30px_rgba(49,130,246,0.3)] active:scale-[0.97] flex flex-col items-center gap-1 group ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
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
