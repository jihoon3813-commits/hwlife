import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, Phone, Check, Calendar, Coins, ShieldCheck, 
  ChevronDown, ChevronUp, FileText, Wallet, Sparkles, CreditCard,
  Hotel, HeartPulse, Film
} from 'lucide-react';

export default function LivingPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'1' | '2'>('1');
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
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
            onClick={scrollToForm}
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
            <p className="text-[#3182F6] text-[13px] font-bold mb-1">해피효원라이프 리빙144</p>
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

        <div className="grid grid-cols-2 gap-4">
          {/* 카드 1 */}
          <div className="bg-white/5 border border-white/10 rounded-[24px] p-5 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-white mb-4 overflow-hidden shadow-lg">
              <img src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778475650/3._%ED%94%84%EB%A6%AC%EB%AA%A8_mmmjvf.png" alt="고급 리빙제품" className="w-full h-full object-cover" />
            </div>
            <span className="text-[11px] font-bold text-[#3182F6] mb-1">가입 축하 혜택 1</span>
            <h4 className="text-[14px] font-bold text-white break-keep">고급 리빙제품 증정</h4>
          </div>

          {/* 카드 2 */}
          <div className="bg-white/5 border border-white/10 rounded-[24px] p-5 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-white mb-4 overflow-hidden shadow-lg">
              <img src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778480574/%ED%8F%AC%EC%9D%B8%ED%8A%B8_tj8ujg.png" alt="포인트 보너스" className="w-full h-full object-cover" />
            </div>
            <span className="text-[11px] font-bold text-[#FFAB00] mb-1">가입 축하 혜택 2</span>
            <h4 className="text-[14px] font-bold text-white break-keep">프리미엄몰 특별 보너스 증정</h4>
          </div>

          {/* 카드 3 */}
          <div className="bg-white/5 border border-white/10 rounded-[24px] p-5 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-white mb-4 overflow-hidden shadow-lg">
              <img src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778480399/5%EB%A7%8C%EC%9B%90_2_dnu8n6.png" alt="100% 환급" className="w-full h-full object-cover" />
            </div>
            <span className="text-[11px] font-bold text-[#00C853] mb-1">스마트 혜택</span>
            <h4 className="text-[14px] font-bold text-white break-keep">납부한 금액 100% 환급 보장</h4>
          </div>

          {/* 카드 4 */}
          <div className="bg-white/5 border border-white/10 rounded-[24px] p-5 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-white mb-4 overflow-hidden shadow-lg">
              <img src="https://images.unsplash.com/photo-1548574505-5e239809ee19?w=300&q=80&fit=crop" alt="크루즈" className="w-full h-full object-cover" />
            </div>
            <span className="text-[11px] font-bold text-[#E91E63] mb-1">라이프 케어 혜택</span>
            <h4 className="text-[14px] font-bold text-white break-keep">장례 대신 크루즈 여행 가능</h4>
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
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop" alt="악수" className="w-full h-full object-cover" />
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
              <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80&fit=crop" alt="여행 여권" className="w-full h-full object-cover" />
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
          <h2 className="text-[22px] font-bold text-[#191F28] leading-snug break-keep mb-3">
            리빙제품에 특별 보너스까지!<br/>
            해피효원라이프·리빙 144 상세표
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
              <div className="flex justify-between items-center bg-[#3182F6]/5 p-4 rounded-[16px]">
                <span className="text-[14px] text-[#3182F6] font-bold">만기 시 환급금</span>
                <span className="text-[18px] font-black text-[#3182F6]">{activeTab === '1' ? '5,936,000원' : '11,872,000원'} <span className="text-[13px] font-bold">(100%)</span></span>
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
                    <div className="flex justify-between items-center text-[14px] p-3 bg-[#F9FAFB] rounded-xl border border-dashed border-[#3182F6]/30">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#3182F6]" />
                        <span className="font-bold text-[#3182F6]">캐시백(2회차 시점)</span>
                      </div>
                      <span className="font-black text-[#3182F6]">(-)134,400원 입금</span>
                    </div>
                    
                    <div className="space-y-3 px-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-[#4E5968]">1회차</span>
                        <span className="text-[14px] font-medium text-[#191F28]">원금 35,000원 + 이자 31,142원 = <span className="font-bold">66,142원</span></span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-[#4E5968]">2회차</span>
                        <span className="text-[14px] font-medium text-[#191F28]">원금 35,000원 + 이자 26,968원 = <span className="font-bold">61,968원</span></span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-[#4E5968]">3회차</span>
                        <span className="text-[14px] font-medium text-[#191F28]">원금 35,000원 + 이자 27,412원 = <span className="font-bold">62,412원</span></span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-[#4E5968]">4회차</span>
                        <span className="text-[14px] font-medium text-[#191F28]">원금 35,000원 + 이자 26,948원 = <span className="font-bold">61,948원</span></span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-[#4E5968]">5회차</span>
                        <span className="text-[14px] font-medium text-[#191F28]">원금 35,000원 + 이자 25,638원 = <span className="font-bold">60,638원</span></span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-[#4E5968]">6~48회차</span>
                        <span className="text-[14px] font-bold text-[#3182F6]">원금만 35,000원 (무이자)</span>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-[#191F28] rounded-[16px] flex justify-between items-center text-white">
                      <span className="text-[13px] font-bold text-white/60">총 예상금액</span>
                      <span className="text-[16px] font-black tracking-tight text-white">
                        1,683,708원 <span className="text-[11px] text-[#3182F6] ml-1">(+)3,708원</span>
                      </span>
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
                    <div className="flex justify-between items-center text-[14px] p-3 bg-[#F9FAFB] rounded-xl border border-dashed border-[#3182F6]/30">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#3182F6]" />
                        <span className="font-bold text-[#3182F6]">캐시백(2회차 시점)</span>
                      </div>
                      <span className="font-black text-[#3182F6]">(-)268,800원 입금</span>
                    </div>
                    
                    <div className="space-y-3 px-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-[#4E5968]">1회차</span>
                        <span className="text-[14px] font-medium text-[#191F28]">원금 70,000원 + 이자 62,284원 = <span className="font-bold">132,284원</span></span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-[#4E5968]">2회차</span>
                        <span className="text-[14px] font-medium text-[#191F28]">원금 70,000원 + 이자 53,936원 = <span className="font-bold">123,936원</span></span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-[#4E5968]">3회차</span>
                        <span className="text-[14px] font-medium text-[#191F28]">원금 70,000원 + 이자 54,824원 = <span className="font-bold">124,824원</span></span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-[#4E5968]">4회차</span>
                        <span className="text-[14px] font-medium text-[#191F28]">원금 70,000원 + 이자 53,896원 = <span className="font-bold">123,896원</span></span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-[#4E5968]">5회차</span>
                        <span className="text-[14px] font-medium text-[#191F28]">원금 70,000원 + 이자 51,276원 = <span className="font-bold">121,276원</span></span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-[#4E5968]">6~48회차</span>
                        <span className="text-[14px] font-bold text-[#3182F6]">원금만 70,000원 (무이자)</span>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-[#191F28] rounded-[16px] flex justify-between items-center text-white">
                      <span className="text-[13px] font-bold text-white/60">총 예상금액</span>
                      <span className="text-[16px] font-black tracking-tight text-white">
                        3,367,416원 <span className="text-[11px] text-[#3182F6] ml-1">(+)7,416원</span>
                      </span>
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
          <h2 className="text-[24px] font-bold text-[#191F28] leading-tight break-keep">
            결합 리빙 제품 안내
          </h2>
        </div>

        <div className="space-y-12">
          {/* 1구좌 제품 */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 bg-[#3182F6] text-white text-[11px] font-black rounded-full">1구좌 가입 시</span>
              <span className="text-[13px] font-bold text-[#4E5968]">(택 1)</span>
            </div>
            <div className="space-y-4">
              <div className="bg-[#F9FAFB] rounded-[24px] p-6 border border-[#E5E8EB]">
                <div className="w-full aspect-video rounded-xl bg-white overflow-hidden mb-4 shadow-sm">
                  <img src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80&fit=crop" alt="발마사지기" className="w-full h-full object-cover" />
                </div>
                <h4 className="text-[16px] font-bold text-[#191F28] mb-1">바로온 저주파 발마사지기</h4>
                <p className="text-[13px] text-[#8B95A1]">하루의 피로를 풀어주는 스마트 힐링</p>
              </div>
              <div className="bg-[#F9FAFB] rounded-[24px] p-6 border border-[#E5E8EB]">
                <div className="w-full aspect-video rounded-xl bg-white overflow-hidden mb-4 shadow-sm">
                  <img src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=80&fit=crop" alt="건식족욕기" className="w-full h-full object-cover" />
                </div>
                <h4 className="text-[16px] font-bold text-[#191F28] mb-1">미하나임 건식족욕기</h4>
                <p className="text-[13px] text-[#8B95A1]">언제 어디서나 간편하게 즐기는 따뜻한 휴식</p>
              </div>
            </div>
          </div>

          {/* 2구좌 제품 */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 bg-[#191F28] text-white text-[11px] font-black rounded-full">2구좌 가입 시</span>
              <span className="text-[13px] font-bold text-[#4E5968]">(택 1)</span>
            </div>
            <div className="space-y-4">
              <div className="bg-[#F9FAFB] rounded-[24px] p-6 border border-[#3182F6]/30 bg-gradient-to-br from-[#F2F8FF] to-white">
                <div className="w-full aspect-video rounded-xl bg-white overflow-hidden mb-4 shadow-sm">
                  <img src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80&fit=crop" alt="매트리스" className="w-full h-full object-cover" />
                </div>
                <div className="inline-block px-2 py-0.5 bg-[#3182F6] text-white text-[10px] font-bold rounded mb-2">BEST 2종 결합 세트</div>
                <h4 className="text-[16px] font-bold text-[#191F28] mb-1">프라임 프리미엄 매트리스 (Q/SS)</h4>
                <p className="text-[13px] text-[#4E5968] leading-snug">매트리스 + 저주파 발마사지기 또는 건식족욕기 중 택 1</p>
              </div>
              <div className="bg-[#F9FAFB] rounded-[24px] p-6 border border-[#E5E8EB]">
                <div className="w-full aspect-video rounded-xl bg-white overflow-hidden mb-4 shadow-sm">
                  <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80&fit=crop" alt="공기청정기" className="w-full h-full object-cover" />
                </div>
                <h4 className="text-[16px] font-bold text-[#191F28] mb-1">LG 퓨리케어 360도 공기청정기</h4>
                <p className="text-[13px] text-[#8B95A1]">깨끗한 공기로 완성되는 쾌적한 공간</p>
              </div>
              <div className="bg-[#F2F4F6] rounded-[24px] p-10 border border-dashed border-[#D1D6DB] flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-[#D1D6DB]" />
                </div>
                <h4 className="text-[16px] font-bold text-[#ADB5BD]">Coming Soon</h4>
                <p className="text-[12px] text-[#ADB5BD]">추가 오픈 예정 라인업</p>
              </div>
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-[11px] text-[#8B95A1] px-2">* 본 사은품은 제조사 사정에 따라 예고 없이 변경될 수 있습니다.</p>
      </section>

      {/* Section 10: 라이프 서비스 안내 */}
      <section className="bg-[#F9FAFB] py-16 px-6 my-2">
        <div className="mb-10 text-center">
          <p className="text-[13px] font-bold text-[#3182F6] mb-2">언제든 자유롭게 이용 가능합니다</p>
          <h2 className="text-[24px] font-bold text-[#191F28] leading-tight break-keep">
            라이프 서비스 안내
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { title: '장례', desc: '품격 있는 의전', img: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=300&q=80&fit=crop' },
            { title: '크루즈', desc: '럭셔리 해상 여행', img: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=300&q=80&fit=crop' },
            { title: '해외여행', desc: '꿈꾸던 세계 여행', img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=300&q=80&fit=crop' },
            { title: '웨딩', desc: '아름다운 시작', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=300&q=80&fit=crop' },
            { title: '칠·팔순', desc: '가족의 행복한 연회', img: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=300&q=80&fit=crop' },
            { title: '어학연수', desc: '글로벌 인재 육성', img: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300&q=80&fit=crop' },
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
          <h2 className="text-[24px] font-bold text-[#191F28] leading-tight break-keep">
            다양한 멤버십 서비스
          </h2>
        </div>

        <div className="flex gap-4 overflow-x-auto px-6 pb-6 no-scrollbar snap-x snap-mandatory">
          {[
            { title: '기차여행', desc: 'KTX, SRT 등\n최대 35% 할인', icon: <CreditCard className="w-6 h-6" /> },
            { title: '호텔/리조트', desc: '전국 주요 숙박시설\n최대 80% 할인', icon: <Hotel className="w-6 h-6" /> },
            { title: '건강검진', desc: 'KMI 등 전문기관\n최대 70% 할인', icon: <HeartPulse className="w-6 h-6" /> },
            { title: '영화·공연', desc: 'CGV, 롯데시네마 등\n최대 40% 할인', icon: <Film className="w-6 h-6" /> },
          ].map((item, i) => (
            <div key={i} className="min-w-[160px] snap-center bg-[#F9FAFB] rounded-[24px] p-6 flex flex-col items-center text-center border border-[#E5E8EB]">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm text-[#3182F6]">
                {item.icon}
              </div>
              <h4 className="text-[15px] font-bold text-[#191F28] mb-2">{item.title}</h4>
              <p className="text-[12px] text-[#4E5968] leading-snug whitespace-pre-line">{item.desc}</p>
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
            { title: '황금 수의', desc: '품격을 높이는 최고급 수의', img: 'https://images.unsplash.com/photo-1590736910118-2434524c0846?w=400&q=80&fit=crop' },
            { title: '궁중 염습', desc: '정성을 다하는 궁중 염습', img: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=400&q=80&fit=crop' },
            { title: '링컨 리무진', desc: '최고급 고인 전용 리무진', img: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&q=80&fit=crop' },
            { title: '제단 꽃장식', desc: '풍성한 빈소 제단 장식', img: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=400&q=80&fit=crop' },
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
        <div className="bg-[#E9F4EE] rounded-[32px] overflow-hidden relative mb-4">
          <div className="p-8 pb-0">
            <h4 className="text-[13px] font-bold text-[#006E4E] mb-3">20년간 오직 한 길만 걸어온 정통 상조회사</h4>
            <h2 className="text-[28px] font-black text-[#191F28] leading-tight mb-6">효원상조와 함께하세요!</h2>
          </div>
          <div className="px-6 flex justify-end">
            <img 
              src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80&fit=crop" 
              alt="신뢰감 있는 모델" 
              className="w-[80%] h-auto object-contain [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_80%,rgba(0,0,0,0)_100%)]"
            />
          </div>
        </div>

        <div className="bg-white border border-[#E5E8EB] rounded-[32px] p-8 flex items-center gap-5">
          <div className="w-20 h-20 bg-[#F2F4F6] rounded-full overflow-hidden shrink-0">
            <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&q=80&fit=crop" alt="안내 모델" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-[12px] font-bold text-[#3182F6] block mb-1">바른 소비의 첫걸음</span>
            <p className="text-[15px] font-bold text-[#191F28] leading-relaxed break-keep">
              고객과 함께 발맞춰 걷는<br/>효원상조가 되겠습니다.
            </p>
          </div>
        </div>
      </section>

      {/* Section 16: 가입 절차 안내 및 최종 CTA */}
      <section className="bg-[#0A1128] py-20 px-6 my-2 text-white">
        <div className="mb-12 text-center">
          <h2 className="text-[24px] font-bold mb-10 tracking-tight">해피효원라이프 리빙144 가입절차 안내</h2>
          
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
            <div className="w-12 h-8 bg-gradient-to-br from-[#ADB5BD] to-[#4E5968] rounded shadow-inner"></div>
            <p className="text-[14px] font-bold leading-snug">신한카드 이용 한도 확인 및<br/>이용 한도 상향 방법 안내</p>
          </div>
          <button className="w-full py-3 bg-white/10 rounded-xl text-[13px] font-bold border border-white/20">한도 확인 바로가기</button>
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
      <section ref={formRef} className="bg-[#F2F4F6] py-20 px-6">
        <div className="mb-10 text-center">
          <p className="text-[14px] font-bold text-[#3182F6] mb-3">지금 가장 좋은 타이밍에 준비하세요</p>
          <h2 className="text-[26px] font-black text-[#191F28] leading-snug break-keep">
            [효원상조 X 신한카드]<br/>간편 상담 신청
          </h2>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-gray-200 border border-white">
          <div className="space-y-5 mb-8">
            <div>
              <label className="block text-[13px] font-bold text-[#4E5968] mb-2.5 ml-1">이름</label>
              <input type="text" placeholder="성함을 입력해주세요" className="w-full bg-[#F9FAFB] border border-[#E5E8EB] rounded-[16px] px-5 py-4 text-[16px] focus:ring-2 focus:ring-[#3182F6] focus:border-transparent outline-none transition-all placeholder:text-[#ADB5BD]" />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4E5968] mb-2.5 ml-1">연락처</label>
              <input type="tel" placeholder="010-0000-0000" className="w-full bg-[#F9FAFB] border border-[#E5E8EB] rounded-[16px] px-5 py-4 text-[16px] focus:ring-2 focus:ring-[#3182F6] focus:border-transparent outline-none transition-all placeholder:text-[#ADB5BD]" />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4E5968] mb-2.5 ml-1">생년월일</label>
              <input type="number" placeholder="주민번호 앞 6자리" className="w-full bg-[#F9FAFB] border border-[#E5E8EB] rounded-[16px] px-5 py-4 text-[16px] focus:ring-2 focus:ring-[#3182F6] focus:border-transparent outline-none transition-all placeholder:text-[#ADB5BD]" />
            </div>
            
            <div className="pt-2">
              <label className="flex items-center gap-3 p-4 bg-[#F9FAFB] rounded-[20px] cursor-pointer group">
                <input type="checkbox" className="w-5 h-5 rounded border-[#D1D6DB] text-[#3182F6] focus:ring-[#3182F6] transition-all" defaultChecked />
                <div className="flex-1 flex justify-between items-center">
                  <span className="text-[14px] font-bold text-[#191F28]">개인정보 수집 및 이용 동의</span>
                  <span className="text-[12px] text-[#8B95A1] underline">전문보기</span>
                </div>
              </label>
            </div>
          </div>

          <button className="w-full bg-[#3182F6] text-white font-black text-[18px] py-5 rounded-[20px] hover:bg-[#1B64DA] transition-all shadow-lg shadow-blue-500/30 active:scale-[0.98] flex flex-col items-center gap-1">
            <span className="text-[12px] opacity-80 font-bold">🎁 사은품 혜택받고</span>
            무료 상담 신청하기
          </button>
          
          <p className="mt-6 text-[12px] text-[#8B95A1] text-center leading-relaxed">
            신청 즉시 전문 상담원이 순차적으로<br/>연락을 드려 친절히 안내해 드립니다.
          </p>
        </div>
      </section>

      {/* 푸터 영역 (App.tsx의 디자인 차용) */}

      {/* 푸터 영역 (App.tsx의 디자인 차용) */}
      <footer className="bg-[#191F28] text-[#8B95A1] pt-12 pb-16 px-6 text-[12px] leading-relaxed border-t border-white/5">
        <div className="mb-8">
          <p className="font-bold text-white text-[14px] mb-2">효원상조 (효원프라임)</p>
          <p>대표자: 최혁</p>
          <p>사업자등록번호: 101-86-35071</p>
          <p>통신판매업신고번호: 제 2011-서울영등포-0752호</p>
          <p>본사: 서울특별시 영등포구 양산로 91, 5층 (당산동3가, 인영빌딩)</p>
        </div>
        <div className="flex gap-4 font-bold text-white/80">
          <span>개인정보처리방침</span>
          <span>이용약관</span>
        </div>
      </footer>
    </div>
  );
}
