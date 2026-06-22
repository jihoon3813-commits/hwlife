import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Check, Target, Zap, 
  Coins, Heart, Rocket, ShieldCheck, Sparkles,
  CreditCard, Package, Wallet, Globe, Calendar, Phone,
  ArrowRight, HeartPulse, Film, Hotel, ChevronUp, ChevronDown, MousePointer2
} from 'lucide-react';
import DrawingOverlay from '../components/DrawingOverlay';
const amountData = {
  '1': {
    title: '해피효원 리빙144 (1구좌)',
    payAmount: '1,680,000원',
    cashback: '134,400원',
    schedule: [
      { label: '1회차', detail: '원금 35,000원 + 이자 31,142원', total: '66,142원' },
      { label: '2회차', detail: '원금 35,000원 + 이자 26,968원', total: '61,968원' },
      { label: '3회차', detail: '원금 35,000원 + 이자 27,412원', total: '62,412원' },
      { label: '4회차', detail: '원금 35,000원 + 이자 26,948원', total: '61,948원' },
      { label: '5회차', detail: '원금 35,000원 + 이자 25,638원', total: '60,638원' },
      { label: '6~48회차', detail: '원금만 (무이자)', total: '35,000원' },
    ],
    totalExpected: '1,683,708원',
    extraInterest: '+3,708원',
    detailBox: { 
      sangjo: (
        <span className="flex items-center gap-1">
          5,000원 <span className="text-[12px] font-normal text-[#8B95A1]">(총 240,000원)</span>
        </span>
      ), 
      membership: (
        <span className="flex items-center gap-1">
          30,000원 <span className="text-[12px] font-normal text-[#8B95A1]">(총 1,440,000원)</span>
        </span>
      ), 
      total: (
        <span className="flex items-center gap-1">
          35,000원 <span className="text-[14px] font-normal text-[#3182F6]/60">(1,680,000원)</span>
        </span>
      )
    }
  },
  '2': {
    title: '해피효원 리빙144 (2구좌)',
    payAmount: '3,360,000원',
    cashback: '268,800원',
    schedule: [
      { label: '1회차', detail: '원금 70,000원 + 이자 62,284원', total: '132,284원' },
      { label: '2회차', detail: '원금 70,000원 + 이자 53,936원', total: '123,936원' },
      { label: '3회차', detail: '원금 70,000원 + 이자 54,824원', total: '124,824원' },
      { label: '4회차', detail: '원금 70,000원 + 이자 53,896원', total: '123,896원' },
      { label: '5회차', detail: '원금 70,000원 + 이자 51,276원', total: '121,276원' },
      { label: '6~48회차', detail: '원금만 (무이자)', total: '70,000원' },
    ],
    totalExpected: '3,367,416원',
    extraInterest: '+7,416원',
    detailBox: { 
      sangjo: (
        <span className="flex items-center gap-1">
          10,000원 <span className="text-[12px] font-normal text-[#8B95A1]">(총 480,000원)</span>
        </span>
      ), 
      membership: (
        <span className="flex items-center gap-1">
          60,000원 <span className="text-[12px] font-normal text-[#8B95A1]">(총 2,880,000원)</span>
        </span>
      ), 
      total: (
        <span className="flex items-center gap-1">
          70,000원 <span className="text-[14px] font-normal text-[#3182F6]/60">(3,360,000원)</span>
        </span>
      )
    }
  }
};

const PricingGuideSlide = () => {
  const [tab, setTab] = useState<'1' | '2'>('1');
  const data = amountData[tab];
  
  const pricing = {
    '1': {
      title: '해피효원 리빙144 (1구좌)',
      p1: '35,000원',
      t1: '1,680,000원',
      p2: '28,000원',
      t2: '4,256,000원',
      total: '5,936,000원'
    },
    '2': {
      title: '해피효원 리빙144 (2구좌)',
      p1: '70,000원',
      t1: '3,360,000원',
      p2: '56,000원',
      t2: '8,512,000원',
      total: '11,872,000원'
    }
  }[tab];

  return (
    <div className="h-full flex flex-col justify-center px-16">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-xl font-bold text-[#4E5968] mb-2 tracking-tight">리빙 144</h3>
          <h2 className="text-4xl font-black text-[#191F28] tracking-tighter">상품 가격 안내</h2>
        </div>
        <div className="flex p-1.5 bg-[#E5E8EB] rounded-2xl w-fit">
          <button 
            onClick={() => setTab('1')}
            className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all ${tab === '1' ? 'bg-white text-[#3182F6] shadow-md' : 'text-[#8B95A1]'}`}
          >
            1구좌 안내
          </button>
          <button 
            onClick={() => setTab('2')}
            className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all ${tab === '2' ? 'bg-white text-[#3182F6] shadow-md' : 'text-[#8B95A1]'}`}
          >
            2구좌 안내
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-8">
        <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col justify-center">
          <div className="p-10 space-y-8">
            <div className="flex justify-between items-center pb-8 border-b border-gray-100">
              <span className="text-2xl font-bold text-[#4E5968]">총 납입금액</span>
              <span className="text-4xl font-black text-[#191F28]">{pricing.total} <span className="text-xl font-normal text-[#8B95A1]">(총 200회)</span></span>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-[#4E5968]">1~48회 납입</span>
                <span className="text-3xl font-black text-[#3182F6]">{pricing.p1} <span className="text-lg font-normal opacity-60">({pricing.t1})</span></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-[#4E5968]">49~200회 납입</span>
                <span className="text-3xl font-black text-[#191F28]">{pricing.p2} <span className="text-lg font-normal opacity-60">({pricing.t2})</span></span>
              </div>
            </div>

            <div className="mt-4 bg-[#F2F8FF] p-8 rounded-3xl flex justify-between items-center border border-[#3182F6]/10">
              <span className="text-xl font-black text-[#3182F6]">만기 시 환급금</span>
              <span className="text-3xl font-black text-[#3182F6]">{pricing.total} (100%)</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#F2F8FF] rounded-[32px] p-8 border border-[#3182F6]/10 shadow-lg">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-[#3182F6] rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-black italic">!</span>
              </div>
              <span className="text-xl font-black text-[#191F28]">초기 48회 납입 구성</span>
            </div>
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-[#4E5968] font-bold text-lg">상조부금</span>
                <span className="text-[#191F28] font-black text-xl">{data.detailBox.sangjo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#4E5968] font-bold text-lg">멤버십대금</span>
                <span className="text-[#191F28] font-black text-xl">{data.detailBox.membership}</span>
              </div>
              <div className="pt-6 border-t border-[#3182F6]/20 flex justify-between items-center">
                <span className="text-[#3182F6] font-black text-xl">합계</span>
                <span className="text-[#3182F6] font-black text-3xl">{data.detailBox.total}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { title: '라이프서비스 ' + (tab === '1' ? '1회' : '2회') + ' 이용', icon: <HeartPulse className="w-5 h-5" /> },
              { title: '리빙제품 100% 증정', icon: <Package className="w-5 h-5" /> },
              { title: '프리미엄몰 보너스 혜택', icon: <Sparkles className="w-5 h-5" />, isSpecial: true },
            ].map((benefit, i) => (
              <motion.div 
                key={i}
                {...(benefit.isSpecial ? {
                  animate: { 
                    borderColor: ["#E5E8EB", "#A061FF", "#E5E8EB"],
                    boxShadow: ["0 0 0px rgba(160,97,255,0)", "0 0 20px rgba(160,97,255,0.4)", "0 0 0px rgba(160,97,255,0)"]
                  },
                  transition: { duration: 2, repeat: Infinity }
                } : {})}
                className={`relative flex items-center gap-4 p-5 rounded-3xl border ${benefit.isSpecial ? 'bg-gradient-to-br from-[#6366F1] to-[#A061FF] border-[#A061FF]/50 text-white shadow-xl' : 'bg-white border-gray-100 text-[#191F28]'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${benefit.isSpecial ? 'bg-white text-[#A061FF]' : 'bg-[#3182F6]/10 text-[#3182F6]'}`}>
                  {benefit.icon}
                </div>
                <span className="text-base font-black">{benefit.title}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const InteractiveAmountSlide = () => {
  const [tab, setTab] = useState<'1' | '2'>('1');
  const data = amountData[tab];

  return (
    <div className="h-full flex flex-col justify-center px-16">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-xl font-bold text-[#4E5968] mb-2 tracking-tight">신한카드 48개월</h3>
          <h2 className="text-4xl font-black text-[#191F28] tracking-tighter">슬림 할부 예상 금액표</h2>
        </div>
        <div className="flex p-1.5 bg-[#E5E8EB] rounded-2xl w-fit">
          <button 
            onClick={() => setTab('1')}
            className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all ${tab === '1' ? 'bg-white text-[#3182F6] shadow-md' : 'text-[#8B95A1]'}`}
          >
            1구좌 안내
          </button>
          <button 
            onClick={() => setTab('2')}
            className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all ${tab === '2' ? 'bg-white text-[#3182F6] shadow-md' : 'text-[#8B95A1]'}`}
          >
            2구좌 안내
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-fit">
          <div className="p-8 bg-[#F2F8FF] border-b border-[#E5E8EB] flex justify-between items-center">
             <div>
                <p className="text-[#3182F6] font-black text-sm mb-1">{data.title}</p>
                <h4 className="text-2xl font-black text-[#191F28]">결제금액: {data.payAmount}</h4>
             </div>
             <MousePointer2 className="w-6 h-6 text-[#3182F6] animate-pulse" />
          </div>
          
          <div className="p-8 space-y-6">
            <div className="bg-white border-2 border-dashed border-[#3182F6]/30 rounded-2xl p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#3182F6]" />
                <span className="text-[#3182F6] font-black text-lg">캐시백 (2회차 시점)</span>
              </div>
              <span className="text-[#3182F6] font-black text-xl">(-) {data.cashback} 입금</span>
            </div>

            <div className="space-y-2">
              {data.schedule.map((row, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0 px-2">
                  <span className="text-[#8B95A1] font-bold text-sm w-20">{row.label}</span>
                  <div className="flex-1 text-center">
                    <span className="text-[#4E5968] font-medium text-sm">{row.detail}</span>
                  </div>
                  <span className={`text-right font-black w-32 text-lg ${i === 5 ? 'text-[#3182F6]' : 'text-[#191F28]'}`}>
                    {row.total}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-[#191F28] p-6 rounded-[24px] flex justify-between items-center shadow-xl">
              <span className="text-white/60 font-bold text-lg">총 예상금액</span>
              <div className="text-right">
                <span className="text-white font-black text-2xl mr-2">{data.totalExpected}</span>
                <span className="text-[#3182F6] font-black text-lg">({data.extraInterest})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SLIDES = [
  {
    id: 'hero',
    bg: 'bg-[#0A1128]',
    content: (
      <div className="relative h-full w-full flex flex-col justify-end pb-20 px-16 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A1128] via-[#0A1128]/90 to-[#1B305B]/80"></div>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img 
            src="https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674553/IMG_3574_%EC%8B%A0%ED%95%9C%EC%B9%B4%EB%93%9C_rus6ls.png" 
            className="h-[85%] w-auto object-contain object-bottom mt-[-10%] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_85%,rgba(0,0,0,0)_100%)]"
          />
        </div>
        <div className="relative z-10 text-white max-w-2xl">
          <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold text-white mb-6">
            효원상조 x 신한카드 x PREMIUM
          </div>
          <h2 className="text-6xl font-black leading-[1.1] mb-6 tracking-tight">
            해피효원라이프<br/>
            <span className="text-[#3182F6]">리빙144 출시</span>
          </h2>
          <p className="text-white/80 text-xl leading-relaxed mb-8 font-medium break-keep">
            복잡한 가입 조건 없이 신한카드만 있으면 누구나<br/>
            <span className="text-white font-bold">특별한 리빙 제품과 보너스 혜택까지!</span>
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'partnership',
    bg: 'bg-[#0A1128]',
    content: (
      <div className="h-full flex flex-col justify-center items-center px-16 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#3182F6] opacity-10 blur-[150px] rounded-full"></div>
        <div className="relative z-10 mb-12">
          <span className="inline-block px-4 py-1.5 bg-[#3182F6]/20 text-[#3182F6] text-sm font-bold rounded-full mb-6">PREMIUM PARTNERSHIP</span>
          <h3 className="text-4xl font-black leading-tight text-white break-keep">
            효원상조 x 신한카드가 만나<br/>
            <span className="text-[#3182F6]">새로운 혜택이 쏟아집니다</span>
          </h3>
        </div>
        <div className="relative perspective-[1500px] mb-12">
          <motion.div
            animate={{ 
              rotateY: [-10, 10],
              rotateX: [5, -5],
              y: [0, -15, 0]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-[450px] h-[280px] rounded-[24px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)]"
          >
            <img 
              src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=800&auto=format&fit=crop" 
              className="w-full h-full object-cover grayscale brightness-50 contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#1B305B]/80 to-[#0A1128]/90 p-10 flex flex-col justify-between text-left">
              <div className="flex justify-between items-start">
                <div className="text-white/90 font-black text-3xl tracking-tighter italic">Shinhan Card</div>
                <div className="w-16 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-inner opacity-80"></div>
              </div>
              <div className="space-y-2">
                <div className="text-white/40 text-xs tracking-[6px]">PREMIUM LIVING</div>
                <div className="text-white/80 text-2xl font-mono tracking-widest italic">•••• •••• •••• 1440</div>
              </div>
            </div>
            <motion.div 
              animate={{ left: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
              className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg]"
            />
          </motion.div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-64 h-3 bg-[#3182F6] blur-[30px] opacity-40"></div>
        </div>
        <p className="text-white/60 text-lg max-w-xl break-keep">
          신한카드만 있으면 누구나 특별한 혜택을 받을 수 있고, 상조 외 크루즈를 동시에 이용할 수 있습니다!
        </p>
      </div>
    )
  },
  {
    id: 'promotion',
    bg: 'bg-[#191F28]',
    content: (
      <div className="h-full flex flex-col justify-center px-16">
        <div className="mb-12 text-center">
          <p className="text-lg font-bold text-[#3182F6] mb-3">오직 프리미엄몰 회원에게만 드리는</p>
          <h2 className="text-4xl font-black text-white leading-tight">
            효원상조 X 신한카드 단독 프로모션
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-8">
          {[
            { tag: "혜택 1", title: "고급 리빙제품 증정", img: "https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674657/5._%EC%8A%AC%EB%A6%BD%EC%95%A4%EB%B9%84_owqjvp.png", color: "text-[#3182F6]" },
            { tag: "혜택 2", title: "특별 보너스 증정", img: "https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674702/DSfs_cnjzei.png", color: "text-[#FFAB00]" },
            { tag: "혜택 3", title: "100% 환급 보장", img: "https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674767/5%EB%A7%8C%EC%9B%90_u0iplm.png", color: "text-[#00C853]" },
            { tag: "혜택 4", title: "크루즈 전환 가능", img: "https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674775/1ec789bfcdceb_rccp2d.png", color: "text-[#E91E63]" }
          ].map((item, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-[32px] p-8 flex items-center gap-8">
              <div className="w-24 h-24 rounded-full bg-white overflow-hidden shadow-2xl shrink-0">
                <img src={item.img} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className={`text-sm font-black ${item.color} mb-2 block uppercase`}>{item.tag}</span>
                <h4 className="text-xl font-black text-white break-keep">{item.title}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'need',
    bg: 'bg-white',
    isLight: true,
    content: (
      <div className="h-full flex flex-col justify-center px-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-[#191F28] leading-tight mb-4">
            상조, 아직 이르다고 생각하셨나요?
          </h2>
          <p className="text-xl text-[#3182F6] font-black italic">지금이 준비할 가장 좋은 타이밍입니다.</p>
        </div>
        <div className="grid grid-cols-4 gap-6">
          {[
            { title: "안심 케어", img: "https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674803/fileView_2_rjy4wd.jpg", desc: "가족의 슬픔과 짐을 덜어드립니다." },
            { title: "합리적 혜택", img: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&q=80&fit=crop", desc: "부담 없는 금액으로 누리는 혜택" },
            { title: "유연한 전환", img: "https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674852/shutterstock_1225821256_r2rqdf.jpg", desc: "만기 시 전액 환급 또는 크루즈" },
            { title: "스마트 선택", img: "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=400&q=80&fit=crop", desc: "실속까지 챙기는 똑똑한 선택" }
          ].map((item, i) => (
            <div key={i} className="flex flex-col">
              <div className="aspect-[3/4] rounded-3xl bg-[#F2F4F6] overflow-hidden mb-4 shadow-sm border border-gray-100">
                <img src={item.img} className="w-full h-full object-cover" />
              </div>
              <h4 className="font-black text-[#191F28] mb-2">{item.title}</h4>
              <p className="text-sm text-[#4E5968] font-bold break-keep leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'pricing-guide',
    bg: 'bg-white',
    isLight: true,
    content: (
      <PricingGuideSlide />
    )
  },
  {
    id: 'solution',
    bg: 'bg-[#0A1128]',
    content: (
      <div className="h-full flex flex-col justify-center px-16 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#3182F6] opacity-10 blur-[150px] rounded-full"></div>
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-white px-4 py-1.5 rounded-lg shadow-xl">
              <span className="text-xl font-black text-[#0A1128]">48pay</span>
            </div>
            <span className="text-white/20 text-3xl font-light">|</span>
            <span className="text-xl font-bold text-white tracking-widest uppercase">Shinhan Card</span>
          </div>
          <h2 className="text-5xl font-black leading-tight mb-6 italic">
            무이자급 혜택, <span className="text-[#3182F6]">48개월 스마트 할부</span>
          </h2>
          <p className="text-white/60 text-xl font-medium break-keep">이자는 없애고 혜택은 더한 똑똑한 금융 솔루션</p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[
            { icon: <Calendar className="w-10 h-10" />, title: "48개월 슬림할부", desc: "6~48회차 이자 없이 원금만 분할 납부", color: "bg-[#3182F6]" },
            { icon: <Coins className="w-10 h-10" />, title: "8% 캐시백", desc: "결제 금액의 8% 환급으로 이자 부담 제로", color: "bg-[#FFAB00]" },
            { icon: <ShieldCheck className="w-10 h-10" />, title: "중도 상환 Free", desc: "수수료 없이 언제든 자유로운 원금 상환", color: "bg-[#00C853]" }
          ].map((item, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[40px] backdrop-blur-xl">
              <div className={`${item.color} w-20 h-20 rounded-3xl flex items-center justify-center mb-8 shadow-2xl`}>
                {item.icon}
              </div>
              <h4 className="text-2xl font-black mb-4">{item.title}</h4>
              <p className="text-white/60 leading-relaxed font-medium break-keep">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'amount-interactive',
    bg: 'bg-[#F2F4F6]',
    isLight: true,
    content: (
      <InteractiveAmountSlide />
    )
  },
  {
    id: 'products',
    bg: 'bg-white',
    isLight: true,
    content: (
      <div className="h-full flex flex-col justify-center px-16">
        <div className="mb-12 text-center">
          <p className="text-lg font-bold text-[#3182F6] mb-3 uppercase tracking-wider">Premium Lineup</p>
          <h2 className="text-4xl font-black text-[#191F28] leading-tight break-keep">
            결합 리빙 제품 안내
          </h2>
        </div>
        
        <div className="grid grid-cols-2 gap-8">
          {/* 1구좌 제품군 */}
          <div className="bg-[#F9FAFB] rounded-[40px] p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="px-4 py-1.5 bg-[#3182F6] text-white text-sm font-black rounded-full">1구좌 실속형</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               {[
                 { 
                   brand: '바로큐', 
                   category: '헬스케어', 
                   model: 'HBSAZ-001', 
                   name: '바로큐 온열 복부마사지기\n음파진동 안마기', 
                   img: 'https://res.cloudinary.com/dfkntvpmv/image/upload/v1782096596/1._%EB%B0%94%EB%A1%9C%ED%81%90_pbugos.png' 
                 },
                 { 
                   brand: '마하나임', 
                   category: '헬스케어', 
                   model: 'MH-101', 
                   name: '마하나임 건식 족욕기', 
                   img: 'https://res.cloudinary.com/dfkntvpmv/image/upload/v1782096596/2._%EB%A7%88%ED%95%98%EB%82%98%EC%9E%84_%EA%B1%B4%EC%8B%9D%EC%A1%B1%EC%9A%95%EA%B8%B0_cblcxc.png' 
                 }
               ].map((p, i) => (
                 <div key={i} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-start text-left transition-all hover:shadow-xl hover:-translate-y-1">
                   <div className="w-full aspect-square bg-[#F9FAFB] rounded-[24px] overflow-hidden mb-6 relative group">
                     <img src={p.img} className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110" />
                     <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 text-white text-[10px] font-black rounded-lg">
                       1구좌
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-2 mb-2">
                     <span className="text-[#3182F6] font-black text-sm">{p.brand}</span>
                     <span className="px-2 py-0.5 bg-[#F2F4F6] text-[#8B95A1] text-[10px] font-bold rounded-md">{p.category}</span>
                   </div>
                   
                   <p className="text-[11px] font-bold text-[#ADB5BD] mb-2 tracking-tight">{p.model}</p>
                   
                   <p className="text-[15px] font-black text-[#191F28] leading-tight break-keep whitespace-pre-line">
                     {p.name}
                   </p>
                 </div>
               ))}
            </div>
          </div>

          {/* 2구좌 프리미엄 */}
          <div className="bg-[#191F28] rounded-[40px] p-8 border border-white/5">
            <div className="flex items-center gap-3 mb-8">
              <div className="px-4 py-1.5 bg-white text-[#191F28] text-sm font-black rounded-full">2구좌 프리미엄</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               {[
                 { 
                   brand: 'LG전자', 
                   category: '에어컨/에어케어', 
                   model: 'AS156HWWC', 
                   name: 'LG 퓨리케어 360\n공기청정기 Hit(16평형)', 
                   img: 'https://res.cloudinary.com/dfkntvpmv/image/upload/v1782096596/large03_lzc2mq.jpg' 
                 },
                 { 
                   brand: '슬립앤비', 
                   category: '가구', 
                   model: 'SNB330-2_Q', 
                   name: '슬립앤비 캐나다 독립\n포켓스프링 허리에 좋은\n침대 매트리스 Q', 
                   img: 'https://res.cloudinary.com/dfkntvpmv/image/upload/v1782096597/5._%EC%8A%AC%EB%A6%BD%EC%95%A4%EB%B9%84_evz62q.png' 
                 },
                 { 
                   brand: '바로큐+마하나임', 
                   category: '가구', 
                   model: 'HBSAZ-001+MH-101', 
                   name: '바로큐 온열 복부마사지기\n음파진동 안마기 +\n마하나임 건식 족욕기', 
                   img: 'https://res.cloudinary.com/dfkntvpmv/image/upload/v1782096596/4._%EB%B0%94%EB%A1%9C%ED%81%90_%EB%A7%88%ED%95%98%EB%82%98%EC%9E%84_xxag2v.png' 
                 },
                 { 
                   brand: '블리스', 
                   category: '스포츠/취미', 
                   model: 'BLISS_Gold', 
                   name: '블리스 골드 파크골프채 풀\n세트 (감나무 파크골프\n클럽케이스 포함)', 
                   img: 'https://res.cloudinary.com/dfkntvpmv/image/upload/v1782096596/%EB%B8%94%EB%A6%AC%EC%8A%A4%EA%B3%A8%EB%93%9C_wbbkta.jpg' 
                 }
               ].map((p, i) => (
                 <div key={i} className="bg-white p-6 rounded-[32px] shadow-sm border border-white/10 flex flex-col items-start text-left transition-all hover:shadow-xl hover:-translate-y-1">
                   <div className="w-full aspect-square bg-[#F9FAFB] rounded-[24px] overflow-hidden mb-6 relative group">
                     <img src={p.img} className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110" />
                     <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 text-white text-[10px] font-black rounded-lg">
                       2구좌
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-2 mb-2">
                     <span className="text-[#3182F6] font-black text-sm">{p.brand}</span>
                     <span className="px-2 py-0.5 bg-[#F2F4F6] text-[#8B95A1] text-[10px] font-bold rounded-md">{p.category}</span>
                   </div>
                   
                   <p className="text-[11px] font-bold text-[#ADB5BD] mb-2 tracking-tight">{p.model}</p>
                   
                   <p className="text-[15px] font-black text-[#191F28] leading-tight break-keep whitespace-pre-line">
                     {p.name}
                   </p>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'services',
    bg: 'bg-[#F9FAFB]',
    isLight: true,
    content: (
      <div className="h-full flex flex-col justify-center px-16">
        <div className="mb-12 text-center">
          <p className="text-lg font-bold text-[#3182F6] mb-3">언제든 자유롭게 이용 가능합니다</p>
          <h2 className="text-4xl font-black text-[#191F28]">라이프 서비스 포트폴리오</h2>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[
            { title: '장례', desc: '품격 있는 의전', img: 'https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674935/3edba92e79423_jwnpip.png' },
            { title: '크루즈', desc: '럭셔리 해상 여행', img: 'https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674938/f57dcce933490_vlbul4.png' },
            { title: '해외여행', desc: '꿈꾸던 세계 여행', img: 'https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674937/1ebbbfdbe6b9f_vccju1.png' },
            { title: '웨딩', desc: '아름다운 시작', img: 'https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674938/9cb896b8ac3c3_xkcwpx.png' },
            { title: '칠·팔순', desc: '가족의 행복한 연회', img: 'https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674937/af9663c5799c5_loxood.png' },
            { title: '어학연수', desc: '글로벌 인재 육성', img: 'https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674937/49b67816b20d5_ep0ejw.png' },
          ].map((item, i) => (
            <div key={i} className="relative aspect-video rounded-[32px] overflow-hidden group shadow-lg">
              <img src={item.img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h4 className="text-xl font-black mb-1">{item.title}</h4>
                <p className="text-xs opacity-60 font-bold">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'funeral',
    bg: 'bg-white',
    isLight: true,
    content: (
      <div className="h-full flex flex-col justify-center px-16">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-[#3182F6] font-black text-sm mb-2 block uppercase tracking-widest">Premium Service</span>
            <h2 className="text-4xl font-black text-[#191F28] italic">효원의 고품격 장례 의전</h2>
          </div>
          <div className="bg-[#191F28] px-6 py-3 rounded-2xl shadow-xl">
             <span className="text-white font-black">20년 전통의 약속</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {[
            { cat: "인력 지원", items: ["장례지도사 1명 전담 파견", "입관지원 전문인력", "복지사 4명 (접객도우미)"] },
            { cat: "차량 지원", items: ["고인 운구차 관내 무료", "전용 리무진 전국 무료", "전용 장의버스 전국 무료"] },
            { cat: "고인 용품", items: ["황금문양 수의 세트", "오동나무 규격관 제공", "봉안함(유골함) 제공"] },
            { cat: "상주 지원", items: ["현대/전통 상복 대여", "제단 꽃 20만원 지원", "부고 알림 서비스"] }
          ].map((section, i) => (
            <div key={i} className="bg-[#F9FAFB] p-8 rounded-[32px] border border-gray-100">
              <h4 className="text-[#191F28] font-black text-xl mb-4 border-b border-gray-200 pb-3">{section.cat}</h4>
              <ul className="space-y-2">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm font-bold text-[#4E5968]">
                    <div className="w-1.5 h-1.5 bg-[#3182F6] rounded-full shrink-0"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'trust',
    bg: 'bg-[#E9F4EE]',
    isLight: true,
    content: (
      <div className="h-full grid grid-cols-2 gap-16 px-16 items-center">
        <div>
          <span className="text-[#006E4E] font-black text-sm mb-4 block italic uppercase tracking-widest">Brand Reliability</span>
          <h2 className="text-5xl font-black text-[#191F28] leading-tight mb-8 tracking-tighter">
            20년간 오직 한 길,<br />
            정통 상조 브랜드<br />
            <span className="text-[#006E4E]">효원상조</span>
          </h2>
          <div className="space-y-6">
            <div className="bg-white/60 p-6 rounded-[32px] backdrop-blur-md border border-white">
              <p className="text-lg font-bold text-[#191F28] italic">"정직과 신뢰로 보답하겠습니다"</p>
            </div>
            <p className="text-[#4E5968] font-medium leading-relaxed">
              가장 슬픈 순간, 가장 든든한 버팀목이 되겠습니다.<br />
              전속 모델과 함께하는 신뢰의 기업
            </p>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-10 bg-[#006E4E] opacity-5 blur-[100px] rounded-full"></div>
          <img 
            src="https://res.cloudinary.com/dfkntvpmv/image/upload/v1781675786/IMG_4054-1_hdili0.png" 
            className="relative z-10 w-full h-auto object-contain transform hover:scale-105 transition duration-700"
          />
        </div>
      </div>
    )
  },
  {
    id: 'process',
    bg: 'bg-[#0A1128]',
    content: (
      <div className="h-full flex flex-col justify-center items-center px-16 text-white text-center">
        <h2 className="text-4xl font-black mb-16 tracking-tight italic">해피효원라이프 리빙144 가입 절차</h2>
        <div className="grid grid-cols-4 gap-8 w-full max-w-5xl">
          {[
            { s: "01", t: "상담 신청", d: "온라인/전화 접수" },
            { s: "02", t: "해피콜 진행", d: "상품 및 조건 확인" },
            { s: "03", t: "상조 가입", d: "간편 본인 인증" },
            { s: "04", t: "배송 & 확정", d: "가전 배송 및 혜택" }
          ].map((item, i) => (
            <div key={i} className="relative group">
              {i < 3 && <div className="absolute top-1/2 left-full w-full h-px bg-white/10 -translate-y-1/2 z-0 hidden lg:block"></div>}
              <div className="relative z-10 bg-white/5 border border-white/10 p-8 rounded-[40px] group-hover:bg-[#3182F6]/20 transition duration-500">
                <span className="text-sm font-black text-[#3182F6] mb-4 block tracking-[4px]">{item.s}</span>
                <h4 className="text-xl font-black mb-2">{item.t}</h4>
                <p className="text-white/40 text-xs font-bold">{item.d}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-20 bg-white/5 border border-white/10 p-8 rounded-[32px] max-w-3xl flex items-center gap-10">
          <div className="text-left flex-1">
            <h4 className="text-xl font-black mb-2">신한카드 한도 확인</h4>
            <p className="text-white/40 text-sm font-medium">슬림할부 이용을 위한 필수 체크 포인트</p>
          </div>
          <div className="bg-[#3182F6] px-8 py-4 rounded-2xl font-black shadow-2xl">
             바로가기 제공
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'closing',
    bg: 'bg-[#0A1128]',
    content: (
      <div className="relative h-full w-full flex flex-col justify-center items-center px-16 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A1128] via-[#0A1128]/90 to-[#1B305B]/80"></div>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        </div>
        
        <div className="relative z-10 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-block px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-bold text-[#3182F6] mb-8"
          >
            THE BEST CHOICE FOR YOUR LIFE
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-7xl font-black leading-[1.1] mb-10 tracking-tighter"
          >
            경청해 주셔서<br/>
            <span className="text-[#3182F6]">감사합니다</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-white/60 text-xl leading-relaxed mb-12 font-medium break-keep"
          >
            성공적인 영업을 위한 최고의 파트너,<br/>
            <span className="text-white font-bold">효원상조 x 신한카드 리빙144</span>가 함께합니다.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex justify-center"
          >
            <div className="bg-white text-[#0A1128] px-12 py-5 rounded-[24px] text-2xl font-black shadow-[0_20px_40px_rgba(49,130,246,0.3)] border border-white">
              상담 문의 및 가입 진행
            </div>
          </motion.div>
        </div>
        
        <div className="absolute bottom-10 left-10 flex items-center gap-3">
          <img src="https://res.cloudinary.com/dfkntvpmv/image/upload/v1781672825/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_ns9erj.png" className="h-5 brightness-0 invert opacity-30" />
        </div>
      </div>
    )
  }
];

export default function LectureLivingPage() {
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
    <div className="h-screen w-full bg-[#111111] flex items-center justify-center overflow-hidden font-sans select-none relative">
      {/* Dynamic 4:3 Container */}
      <div 
        className="relative bg-white shadow-[0_60px_120px_rgba(0,0,0,0.7)] overflow-hidden"
        style={{ 
          width: 'min(100vw, 133.33vh)', 
          height: 'min(75vw, 100vh)',
          maxHeight: '100vh'
        }}
      >
        <div id="lecture-slide-capture-area" className="absolute inset-0 w-full h-full overflow-hidden">
          <MotionConfig>
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentSlide + '-bg'}
                custom={direction}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 ${slide.bg} transition-colors duration-1000`}
              />
            </AnimatePresence>

            <div className="relative h-full w-full">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentSlide}
                  custom={direction}
                  variants={{
                    enter: (direction: number) => ({
                      x: direction > 0 ? 500 : -500,
                      opacity: 0,
                      scale: 0.9
                    }),
                    center: {
                      x: 0,
                      opacity: 1,
                      scale: 1
                    },
                    exit: (direction: number) => ({
                      x: direction < 0 ? 500 : -500,
                      opacity: 0,
                      scale: 0.9
                    })
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.3 }
                  }}
                  className="h-full w-full"
                >
                  {slide.content}
                </motion.div>
              </AnimatePresence>
            </div>
          </MotionConfig>
        </div>


        {/* Brand Header & Tabs */}
        <div className="absolute top-[4%] left-[5%] right-[5%] flex justify-between items-center z-[110] pointer-events-none">
          <div className={`flex items-center gap-1 p-1 backdrop-blur-md rounded-2xl border transition-all duration-500 pointer-events-auto ${slide.isLight ? 'border-black/5 bg-black/5' : 'border-white/10 bg-white/10'}`}>
            <button 
              onClick={() => window.location.href = '/lecture/living'}
              className={`px-6 py-2 rounded-xl text-[11px] font-black transition-all duration-300 bg-white text-[#3182F6] shadow-[0_4px_12px_rgba(0,0,0,0.1)]`}
            >
              리빙144 (신한카드)
            </button>
            <button 
              onClick={() => window.location.href = '/lecture/special'}
              className={`px-6 py-2 rounded-xl text-[11px] font-black transition-all duration-300 ${slide.isLight ? 'text-black/40 hover:text-black' : 'text-white/40 hover:text-white'}`}
            >
              스페셜299 (BSON)
            </button>
          </div>
          <div className="flex items-center gap-4 pointer-events-auto">
             <button 
               onClick={() => {
                 if (!document.fullscreenElement) {
                   document.documentElement.requestFullscreen();
                 } else {
                   document.exitFullscreen();
                 }
               }}
               className={`backdrop-blur-md px-3 py-2 rounded-xl border text-[10px] font-black transition-all duration-500 ${slide.isLight ? 'bg-black/5 border-black/5 text-black/40 hover:bg-black/10' : 'bg-white/10 border-white/5 text-white/50 hover:bg-white/20'}`}
             >
               FULLSCREEN
             </button>
             <div className={`backdrop-blur-md px-4 py-2 rounded-xl border text-[10px] font-black transition-all duration-500 ${slide.isLight ? 'bg-black/5 border-black/5 text-black/40' : 'bg-black/20 border-white/5 text-white/50'}`}>
                {currentSlide + 1} / {SLIDES.length}
             </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="absolute bottom-[5%] right-[5%] flex gap-4 z-[110]">
          <motion.button
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`w-14 h-14 rounded-[30%] flex items-center justify-center shadow-2xl transition-all duration-500 ${currentSlide === 0 ? (slide.isLight ? 'bg-black/5 text-black/10' : 'bg-white/5 text-white/10') : (slide.isLight ? 'bg-[#191F28] text-white shadow-black/10' : 'bg-white text-[#191F28] hover:shadow-white/20')}`}
          >
            <ChevronLeft className="w-[60%] h-[60%]" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={nextSlide}
            disabled={currentSlide === SLIDES.length - 1}
            className={`w-14 h-14 rounded-[30%] flex items-center justify-center shadow-2xl transition-all duration-500 ${currentSlide === SLIDES.length - 1 ? (slide.isLight ? 'bg-black/5 text-black/10' : 'bg-white/5 text-white/10') : 'bg-[#3182F6] text-white shadow-blue-500/20 hover:shadow-blue-500/40'}`}
          >
            <ChevronRight className="w-[60%] h-[60%]" />
          </motion.button>
        </div>

        <DrawingOverlay currentSlide={currentSlide} />
      </div>

      <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 transition-all duration-500 ${slide.isLight ? 'text-black/10' : 'text-white/20'} text-[10px] font-black tracking-[0.4em] uppercase`}>
        Use arrow keys to navigate the lecture
      </div>
    </div>
  );
}
