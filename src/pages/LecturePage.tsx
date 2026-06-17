import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Check, Target, Zap, 
  Coins, Heart, Rocket, ShieldCheck, Sparkles,
  CreditCard, Package, Wallet, Globe, Calendar, Phone
} from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    type: 'intro',
    title: '효원라이프 결합상품 강의',
    subtitle: '리빙 144 & 스페셜 299 완전 정복',
    content: (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-8 shadow-2xl"
        >
          <Rocket className="w-12 h-12 text-white" />
        </motion.div>
        <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
          실속은 채우고,<br />부담은 비우다
        </h1>
        <p className="text-xl text-white/70 font-medium break-keep">
          효원상조 파트너스 영업자 교육용 프레젠테이션
        </p>
      </div>
    ),
    bg: 'bg-gradient-to-br from-[#191F28] via-[#0A1128] to-[#1B305B]'
  },
  {
    id: 2,
    type: 'concept',
    title: '가전결합상조의 새로운 패러다임',
    content: (
      <div className="grid grid-cols-2 gap-8 h-full">
        <div className="flex flex-col justify-center">
          <div className="space-y-6">
            <div className="bg-[#F2F4F6] p-6 rounded-2xl border border-[#E5E8EB]">
              <h3 className="text-[#F04452] font-black text-xl mb-2 italic">기존의 문제</h3>
              <p className="text-[#4E5968] font-bold break-keep">높은 월 납입금, 복잡한 가입 조건으로 인한 거부감</p>
            </div>
            <div className="bg-[#3182F6] p-6 rounded-2xl shadow-xl shadow-blue-500/20">
              <h3 className="text-white font-black text-xl mb-2 italic">우리의 혁신</h3>
              <p className="text-white font-bold break-keep text-lg">일반 렌탈료 수준의 저렴한 월 납입금 설계</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-blue-500/10 blur-3xl rounded-full"></div>
            <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-gray-100 relative">
              <div className="space-y-4">
                {[
                  { icon: <Package className="text-blue-500" />, text: "최신 프리미엄 가전" },
                  { icon: <ShieldCheck className="text-blue-500" />, text: "20년 전통 상조 보장" },
                  { icon: <Sparkles className="text-blue-500" />, text: "토탈 멤버십 혜택" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-[#F9FAFB] p-4 rounded-2xl">
                    {item.icon}
                    <span className="font-black text-[#191F28]">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    bg: 'bg-white'
  },
  {
    id: 3,
    type: 'living',
    title: '리빙 144 (신한카드 결합)',
    subtitle: '가장 합리적인 가성비 전략',
    content: (
      <div className="space-y-8">
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-[#0046FF]/5 p-6 rounded-3xl border border-[#0046FF]/10 text-center">
            <CreditCard className="w-10 h-10 text-[#0046FF] mx-auto mb-4" />
            <h4 className="font-black text-[#191F28] mb-2">무이자급 혜택</h4>
            <p className="text-sm text-[#4E5968] font-bold">48개월 스마트 할부</p>
          </div>
          <div className="bg-[#FFAB00]/5 p-6 rounded-3xl border border-[#FFAB00]/10 text-center">
            <Coins className="w-10 h-10 text-[#FFAB00] mx-auto mb-4" />
            <h4 className="font-black text-[#191F28] mb-2">8% 캐시백</h4>
            <p className="text-sm text-[#4E5968] font-bold">이자 부담 전액 상쇄</p>
          </div>
          <div className="bg-[#3182F6]/5 p-6 rounded-3xl border border-[#3182F6]/10 text-center">
            <Target className="w-10 h-10 text-[#3182F6] mx-auto mb-4" />
            <h4 className="font-black text-[#191F28] mb-2">신한카드 보유자</h4>
            <p className="text-sm text-[#4E5968] font-bold">누구나 가입 가능</p>
          </div>
        </div>
        <div className="bg-[#191F28] p-8 rounded-[32px] text-white">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[#3182F6] font-black text-xl italic">핵심 셀링 포인트</span>
            <div className="h-px flex-1 mx-4 bg-white/10"></div>
          </div>
          <p className="text-2xl font-bold leading-relaxed break-keep">
            "카드 한도는 최소로 잡고, <span className="text-[#3182F6]">월 3만원대</span>로<br />
            가전+상조+혜택을 모두 챙기는 스마트한 선택!"
          </p>
        </div>
      </div>
    ),
    bg: 'bg-[#F9FAFB]'
  },
  {
    id: 4,
    type: 'special',
    title: '스페셜 299 (BSON 결합)',
    subtitle: '카드 한도 제약 없는 프리미엄 전략',
    content: (
      <div className="grid grid-cols-2 gap-10 items-center h-full">
        <div>
          <h3 className="text-3xl font-black text-[#191F28] mb-6 tracking-tight italic">
            "카드 없이,<br /><span className="text-[#C5A059]">신용만으로</span> 충분합니다"
          </h3>
          <ul className="space-y-4">
            {[
              "신한카드 미보유자도 즉시 신청 가능",
              "카드 한도를 점유하지 않는 경제적 방식",
              "BSON 렌탈 인프라를 통한 빠른 승인",
              "LG전자 등 최고급 가전 라인업 구성"
            ].map((text, i) => (
              <li key={i} className="flex items-center gap-3 text-lg font-bold text-[#4E5968]">
                <div className="w-6 h-6 bg-[#C5A059]/20 rounded-full flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-[#C5A059]" />
                </div>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-gradient-to-br from-[#191F28] to-[#2D2D30] p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059] opacity-10 blur-3xl"></div>
          <div className="relative z-10">
            <div className="text-[#C5A059] text-sm font-black mb-2 tracking-widest uppercase">Special Advantage</div>
            <div className="text-white text-5xl font-black mb-6">No Card</div>
            <div className="text-white/60 font-medium leading-relaxed">
              카드 한도가 부족한 고객에게도,<br />
              카드를 새로 만들기 싫은 고객에게도<br />
              완벽한 대안이 됩니다.
            </div>
          </div>
        </div>
      </div>
    ),
    bg: 'bg-white'
  },
  {
    id: 5,
    type: 'common',
    title: '강력한 100% 환급 시스템',
    subtitle: '적금보다 강력한 자산 가치',
    content: (
      <div className="flex flex-col h-full justify-between pb-8">
        <div className="grid grid-cols-2 gap-12">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Wallet className="w-8 h-8 text-blue-500" />
                <h4 className="text-2xl font-black text-[#191F28]">사용 시</h4>
              </div>
              <p className="text-lg font-bold text-[#4E5968] leading-relaxed break-keep">
                가전은 고객 소유,<br />고품격 라이프 케어 서비스 제공
              </p>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Coins className="w-8 h-8 text-orange-500" />
                <h4 className="text-2xl font-black text-[#191F28]">미사용 시</h4>
              </div>
              <p className="text-lg font-bold text-[#4E5968] leading-relaxed break-keep">
                가전은 고객 소유,<br /><span className="text-[#F04452]">납입금 100% 전액 환급</span>
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#F2F4F6] p-8 rounded-[32px] text-center">
          <p className="text-2xl font-black text-[#191F28] break-keep">
            "가전은 '공짜'로 얻고, 납입한 원금은 '자산'으로 남는 구조"
          </p>
          <p className="text-[#3182F6] font-bold mt-2">이것이 타사 렌탈과 비교할 수 없는 절대적 차별점입니다.</p>
        </div>
      </div>
    ),
    bg: 'bg-[#F9FAFB]'
  },
  {
    id: 6,
    type: 'services',
    title: '유연한 서비스 전환',
    subtitle: '인생의 모든 순간을 함께합니다',
    content: (
      <div className="grid grid-cols-3 gap-4 h-full py-4">
        {[
          { icon: <Heart className="text-red-500" />, title: "고품격 장례", desc: "20년 노하우 의전" },
          { icon: <Globe className="text-blue-500" />, title: "크루즈 여행", desc: "럭셔리 해상 휴양" },
          { icon: <Sparkles className="text-yellow-500" />, title: "웨딩 서비스", desc: "인생 최고의 시작" },
          { icon: <Calendar className="text-green-500" />, title: "칠순/팔순", desc: "가족의 큰 기쁨" },
          { icon: <Target className="text-indigo-500" />, title: "어학연수", desc: "글로벌 미래 설계" },
          { icon: <Phone className="text-gray-500" />, title: "멤버십 혜택", desc: "철도/숙박 상시 할인" }
        ].map((item, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -5 }}
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center"
          >
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              {item.icon}
            </div>
            <h5 className="font-black text-[#191F28] mb-1">{item.title}</h5>
            <p className="text-xs text-[#8B95A1] font-bold">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    ),
    bg: 'bg-white'
  },
  {
    id: 7,
    type: 'closing',
    title: '상담의 핵심 전략',
    content: (
      <div className="flex flex-col justify-center items-center h-full space-y-12">
        <div className="flex gap-12">
          {[
            { num: "01", title: "렌탈 비교", desc: "일반 렌탈보다\n유리한 자산성" },
            { num: "02", title: "부담 해소", desc: "저렴한 월 납입금\n부담 없는 접근" },
            { num: "03", title: "미래 자산", desc: "언제든 현금화\n가능한 안심 플랜" }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <span className="text-6xl font-black text-blue-500/10 mb-2">{item.num}</span>
              <h4 className="text-xl font-black text-[#191F28] mb-2">{item.title}</h4>
              <p className="text-sm text-[#4E5968] font-bold whitespace-pre-line">{item.desc}</p>
            </div>
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-[#3182F6] px-12 py-6 rounded-full text-white text-2xl font-black shadow-2xl shadow-blue-500/40"
        >
          최고의 성과를 응원합니다!
        </motion.button>
      </div>
    ),
    bg: 'bg-gradient-to-br from-white to-[#F2F4F6]'
  }
];

export default function LecturePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setDirection(1);
      setCurrentSlide(s => s + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(s => s - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const slide = SLIDES[currentSlide];

  return (
    <div className="h-screen w-full bg-[#191F28] flex items-center justify-center overflow-hidden font-sans select-none">
      {/* Container 4:3 Ratio */}
      <div className="relative w-full h-full max-w-[1200px] max-h-[900px] aspect-[4/3] bg-white shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Background Layer */}
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentSlide + '-bg'}
            custom={direction}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 ${slide.bg} transition-colors duration-700`}
          />
        </AnimatePresence>

        {/* Content Layer */}
        <div className="relative h-full w-full flex flex-col p-16">
          {/* Header */}
          <div className="flex justify-between items-start mb-12">
            <motion.div
              key={currentSlide + '-title'}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {slide.type !== 'intro' && (
                <>
                  <h2 className="text-4xl font-black text-[#191F28] tracking-tight mb-2 italic">
                    {slide.title}
                  </h2>
                  <p className="text-lg font-bold text-blue-500">{slide.subtitle}</p>
                </>
              )}
            </motion.div>
            <div className="flex items-center gap-4 bg-gray-50/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200/50">
              <span className="text-sm font-black text-[#191F28]">HYOWON LIFE</span>
              <div className="w-px h-3 bg-gray-300"></div>
              <span className="text-sm font-black text-blue-500">{currentSlide + 1} / {SLIDES.length}</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentSlide}
                custom={direction}
                variants={{
                  enter: (direction: number) => ({
                    x: direction > 0 ? 300 : -300,
                    opacity: 0,
                    scale: 0.95
                  }),
                  center: {
                    x: 0,
                    opacity: 1,
                    scale: 1
                  },
                  exit: (direction: number) => ({
                    x: direction < 0 ? 300 : -300,
                    opacity: 0,
                    scale: 0.95
                  })
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="h-full"
              >
                {slide.content}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Logo/Brand */}
          {slide.type !== 'intro' && (
            <div className="mt-8 flex justify-between items-end opacity-50">
              <div className="text-[10px] font-black tracking-[0.2em] text-gray-400">
                © 2026 HYOWON LIFE PARTNERS ACADEMY
              </div>
              <img 
                src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1777895641/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_wnz5aa.png" 
                className="h-4 grayscale object-contain" 
                alt="logo"
              />
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="absolute bottom-16 right-16 flex gap-4 z-50">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all ${currentSlide === 0 ? 'bg-gray-100 text-gray-300' : 'bg-white text-[#191F28] hover:bg-gray-50'}`}
          >
            <ChevronLeft className="w-8 h-8" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={nextSlide}
            disabled={currentSlide === SLIDES.length - 1}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all ${currentSlide === SLIDES.length - 1 ? 'bg-gray-100 text-gray-300' : 'bg-[#3182F6] text-white hover:bg-[#1B64DA]'}`}
          >
            <ChevronRight className="w-8 h-8" />
          </motion.button>
        </div>
      </div>

      {/* Progress Bar (Bottom) */}
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/10">
        <motion.div 
          className="h-full bg-blue-500"
          initial={false}
          animate={{ width: `${((currentSlide + 1) / SLIDES.length) * 100}%` }}
        />
      </div>

      {/* Helper Text */}
      <div className="absolute top-8 text-white/20 text-xs font-black tracking-widest flex items-center gap-3">
        <span>USE ARROW KEYS TO NAVIGATE</span>
        <div className="w-4 h-px bg-white/20"></div>
        <span>CLICK TO FOCUS</span>
      </div>
    </div>
  );
}
