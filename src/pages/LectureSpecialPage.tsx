import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Check, Target, Zap, 
  Coins, Heart, Rocket, ShieldCheck, Sparkles,
  CreditCard, Package, Wallet, Globe, Calendar, Phone,
  ArrowRight, HeartPulse, Film, Hotel, ChevronUp, ChevronDown, MousePointer2,
  ExternalLink
} from 'lucide-react';
import DrawingOverlay from '../components/DrawingOverlay';
import { useTrackVisit } from '../hooks/useTrackVisit';

const amountData = {
  '1': {
    title: '해피효원 스페셜299 (1구좌 싱글)',
    payAmount: '총 5,980,000원',
    info: '카드 한도 무관 / 신용 기반 할부',
    schedule: [
      { label: '1~60회차', detail: '상조+BSON 할부금', total: '29,900원' },
      { label: '61~200회차', detail: '상조 월 납입금', total: '29,900원' },
      { label: '만기 시', detail: '200회 완납 시', total: '100% 환급' },
    ],
    totalExpected: '5,980,000원',
    extraInterest: '전액 환급 보장',
    detailBox: { sangjo: '2,990원', rental: '26,910원', total: '29,900원' }
  },
  '2': {
    title: '해피효원 스페셜299 (2구좌 더블)',
    payAmount: '총 11,960,000원',
    info: '카드 한도 무관 / 신용 기반 할부',
    schedule: [
      { label: '1~60회차', detail: '상조+BSON 할부금', total: '59,800원' },
      { label: '61~200회차', detail: '상조 월 납입금', total: '59,800원' },
      { label: '만기 시', detail: '200회 완납 시', total: '100% 환급' },
    ],
    totalExpected: '11,960,000원',
    extraInterest: '전액 환급 보장',
    detailBox: { sangjo: '5,980원', rental: '53,820원', total: '59,800원' }
  }
};

const InteractiveAmountSlide = () => {
  const data = amountData['2'];

  return (
    <div className="h-full flex flex-col justify-center px-16 text-white">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h3 className="text-xl font-bold text-[#D4AF37] mb-2 tracking-tight">스페셜 299 (BSON)</h3>
          <h2 className="text-4xl font-black text-white tracking-tighter italic">월 납입 예상 금액표</h2>
        </div>
        <div className="px-6 py-2.5 bg-[#D4AF37] text-white rounded-xl text-sm font-black shadow-lg">
          2구좌 더블 전용 상품
        </div>
      </div>

      <div className="grid grid-cols-[1fr_400px] gap-10">
        <div className="bg-[#1A1A1C] rounded-[40px] border border-white/10 p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] opacity-5 blur-[60px] rounded-full"></div>
          
          <div className="flex justify-between items-start mb-8">
            <span className="text-lg font-bold text-white/40">총 납입금액</span>
            <div className="text-right">
              <span className="text-3xl font-black text-white">{data.totalExpected}</span>
              <p className="text-xs text-white/40 mt-1">(총 200회 납입 기준)</p>
            </div>
          </div>

          <div className="w-full h-px bg-white/5 mb-8"></div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-white/60">1~60회 납입</span>
              <span className="text-2xl font-black text-[#D4AF37]">{data.schedule[0].total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-white/60">61~200회 납입</span>
              <span className="text-2xl font-black text-white">{data.schedule[1].total}</span>
            </div>
          </div>

          <div className="mt-10 bg-[#FAF7F0]/[0.03] rounded-[32px] p-6 border border-[#D4AF37]/10 relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-6 h-6 bg-[#D4AF37] rounded-full flex items-center justify-center">
                <span className="text-[#1A1A1C] text-[10px] font-black italic">i</span>
              </div>
              <span className="text-base font-black text-white">초기 60회 납입 상세 구성 안내</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50 font-medium">상조부금 (월 납입금의 10%)</span>
                <span className="text-[#D4AF37] font-bold">{data.detailBox.sangjo}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50 font-medium">가전 렌탈 대금 (기타 90%)</span>
                <span className="text-[#D4AF37] font-bold">{data.detailBox.rental}</span>
              </div>
              <div className="pt-3 mt-3 border-t border-white/5 flex justify-between items-center">
                <span className="text-white/60 font-bold">합계</span>
                <span className="text-xl font-black text-white">{data.detailBox.total}</span>
              </div>
            </div>
            
            <p className="mt-4 text-[10px] text-white/30 leading-relaxed break-keep">
              * 1회부터 60회까지는 상조부금과 가전 렌탈 대금이 구분되어 청구됩니다. 61회~200회차까지는 상조부금으로 전액 전환됩니다.
            </p>
          </div>

          <div className="mt-8 bg-gradient-to-r from-[#D4AF37]/20 to-transparent p-5 rounded-2xl border border-[#D4AF37]/30 flex justify-between items-center">
             <span className="text-[#D4AF37] font-black">만기 시 환급금</span>
             <div className="text-right">
                <span className="text-2xl font-black text-[#D4AF37]">{data.totalExpected}</span>
                <span className="ml-2 text-xs font-black text-[#D4AF37]/60">(100%)</span>
             </div>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4">
          <span className="text-sm font-black text-[#D4AF37] mb-2 tracking-widest uppercase px-2">Join Benefits</span>
          {[
            { title: '라이프서비스 2회 이용', desc: '상조 또는 크루즈 여행 중 선택 가능', icon: <HeartPulse className="w-5 h-5" /> },
            { title: '특별 사은품 100% 증정', desc: '가입 고객 전원 고급 사은품 혜택', icon: <Package className="w-5 h-5" /> },
            { 
              title: '프리미엄몰 보너스 제품', 
              desc: '상담 시 다양한 보너스 제품 선택', 
              icon: <Sparkles className="w-5 h-5" />,
              isSpecial: true 
            },
          ].map((benefit, i) => (
            <div 
              key={i}
              className={`relative flex items-center gap-4 p-5 rounded-3xl border transition-all ${benefit.isSpecial ? 'bg-gradient-to-br from-[#FF0080] to-[#7928CA] border-none text-white shadow-xl scale-105 z-10' : 'bg-white/5 border-white/10 text-white/90'}`}
            >
              {benefit.isSpecial && (
                <div className="absolute top-0 right-0 px-3 py-1 bg-[#00FFFF] text-[#191F28] text-[9px] font-black rounded-bl-xl shadow-lg">
                  TOP BENEFIT
                </div>
              )}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${benefit.isSpecial ? 'bg-white text-[#FF0080] shadow-lg' : 'bg-white/10 text-[#D4AF37]'}`}>
                {benefit.icon}
              </div>
              <div>
                <h5 className="text-[15px] font-black mb-0.5">{benefit.title}</h5>
                <p className={`text-[11px] ${benefit.isSpecial ? 'text-white/70' : 'text-white/40'} font-medium`}>{benefit.desc}</p>
              </div>
            </div>
          ))}
          
          <div className="mt-4 px-2 space-y-1 opacity-40">
             <p className="text-[10px]">* 프리미엄몰 보너스 제품은 상담 시 확인 가능합니다.</p>
             <p className="text-[10px]">* 1~60회차 회비는 BSON의 렌탈료를 포함합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SLIDES = [
  {
    id: 'hero',
    bg: 'bg-[#0F0F10]',
    content: (
      <div className="relative h-full w-full flex flex-col justify-end pb-20 px-16 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F0F10] via-[#1A1A1C]/95 to-[#2D2D30]/80"></div>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img 
            src="https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674558/IMG_3521-1_v2su84.png" 
            className="h-[85%] w-auto object-contain object-bottom mt-[-10%] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_85%,rgba(0,0,0,0)_100%)]"
          />
        </div>
        <div className="relative z-10 text-white max-w-2xl">
          <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold text-white mb-6 uppercase tracking-widest">
            효원상조 x BSON x PREMIUM
          </div>
          <h2 className="text-6xl font-black leading-[1.1] mb-6 tracking-tight">
            해피효원라이프<br/>
            <span className="text-[#D4AF37]">스페셜299 출시</span>
          </h2>
          <p className="text-white/80 text-xl leading-relaxed mb-8 font-medium break-keep">
            카드 한도 관계 없이 신용만으로 간편 신청!<br/>
            <span className="text-white font-bold text-2xl">특별한 가전 제품과 압도적 혜택까지!</span>
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'safety',
    bg: 'bg-[#0F0F10]',
    content: (
      <div className="h-full flex flex-col justify-center px-16 text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00C853]/5 opacity-10 blur-[150px] rounded-full"></div>
        
        <div className="text-center mb-8 relative z-10">
          <span className="inline-block px-4 py-1.5 bg-[#00C853]/20 text-[#00C853] text-sm font-bold rounded-full mb-3 tracking-wider uppercase">
            Safety & Trust
          </span>
          <h3 className="text-4xl font-black leading-tight text-white mb-3 break-keep">
            상조회사 폐업 걱정 NO! <span className="text-[#D4AF37]">100% 안심 효원상조</span>
          </h3>
          <p className="text-white/70 text-base max-w-2xl mx-auto break-keep">
            최근 늘어나는 상조회사 폐업 소식에 불안하셨나요? 효원상조는 탄탄한 재무 건전성과 공정거래위원회가 공인한 안심 서비스로 완벽히 보호받습니다.
          </p>
        </div>

        <div className="flex flex-col gap-5 relative z-10 w-full max-w-5xl mx-auto">
          {/* Card 1 */}
          <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 flex items-center justify-between gap-8 backdrop-blur-xl hover:border-white/20 transition-all duration-300">
            <div className="flex items-center gap-5 w-[310px] shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[#D4AF37] text-xs font-bold block mb-1">선수금 기준 업계 탑클래스</span>
                <h4 className="text-xl font-black text-white leading-tight">공정위 등록 12위 우량사</h4>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/90 text-[15px] font-medium leading-relaxed break-keep">
                효원상조는 공정거래위원회에 등록된 상조업체 중 선수금 기준 <span className="text-[#D4AF37] font-bold">12위(약 1,200억 원)</span>에 속하는 탄탄하고 건실한 상조회사입니다. 철저한 재무 건전성으로 어떠한 시장 변화에도 소중한 고객의 자산을 안전하게 지킵니다.
              </p>
            </div>
            <a 
              href="https://www.mysangjo.or.kr/web/community/status.do" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#b08e27] text-black py-3.5 px-5 rounded-2xl text-sm font-black transition-all duration-300 pointer-events-auto shrink-0 shadow-lg shadow-[#D4AF37]/10 hover:shadow-[#D4AF37]/30"
            >
              현황 조회 <ExternalLink className="w-4 h-4 text-black" />
            </a>
          </div>

          {/* Card 2 */}
          <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 flex items-center justify-between gap-8 backdrop-blur-xl hover:border-white/20 transition-all duration-300">
            <div className="flex items-center gap-5 w-[310px] shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-[#00C853]/10 flex items-center justify-center text-[#00C853] shrink-0">
                <Check className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[#00C853] text-xs font-bold block mb-1">공정위 지정 안심 제도</span>
                <h4 className="text-xl font-black text-white leading-tight">‘내상조 그대로’ 공식 참여사</h4>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/90 text-[15px] font-medium leading-relaxed break-keep">
                폐업한 상조 회원에게 기존 납입금의 50% 금액으로 온전한 서비스를 보장합니다. 전체 상조사 중 공정위의 엄격한 기준으로 선정된 <span className="text-white font-bold">단 16개사만 참여</span>하고 있어, 참여 자체가 압도적인 기업 안정성을 증명합니다.
              </p>
            </div>
            <a 
              href="https://www.mysangjo.or.kr/web/service/introduce.do" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-center gap-2 bg-[#00C853] hover:bg-[#00a844] text-white py-3.5 px-5 rounded-2xl text-sm font-black transition-all duration-300 pointer-events-auto shrink-0 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/30"
            >
              서비스 안내 <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'partnership',
    bg: 'bg-[#0F0F10]',
    content: (
      <div className="h-full flex flex-col justify-center items-center px-16 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D4AF37] opacity-10 blur-[150px] rounded-full"></div>
        <div className="relative z-10 mb-12">
          <span className="inline-block px-4 py-1.5 bg-[#D4AF37]/20 text-[#D4AF37] text-sm font-bold rounded-full mb-6 uppercase tracking-widest">Premium Partnership</span>
          <h3 className="text-4xl font-black leading-tight text-white break-keep">
            효원상조 x BSON이 만나<br/>
            <span className="text-[#D4AF37]">한계를 넘어서는 혜택</span>
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
              src="https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674657/5._%EC%8A%AC%EB%A6%BD%EC%95%A4%EB%B9%84_owqjvp.png" 
              className="w-full h-full object-cover"
            />
            <motion.div 
              animate={{ left: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
              className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg]"
            />
          </motion.div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-64 h-3 bg-[#D4AF37] blur-[30px] opacity-40"></div>
        </div>
        <p className="text-white/60 text-lg max-w-xl break-keep">
          카드 한도 부족으로 고민하셨나요? 신용만 있다면 누구나 특별한 가전 제품과 상조/크루즈 통합 서비스를 누릴 수 있습니다!
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
          <p className="text-lg font-bold text-[#D4AF37] mb-3">오직 프리미엄몰 회원에게만 드리는</p>
          <h2 className="text-4xl font-black text-white leading-tight">
            효원상조 X BSON 단독 프로모션
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-8">
          {[
            { tag: "혜택 1", title: "가입 축하 사은품 증정", img: "https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674657/5._%EC%8A%AC%EB%A6%BD%EC%95%A4%EB%B9%84_owqjvp.png", color: "text-[#D4AF37]" },
            { tag: "혜택 2", title: "특별 보너스 제품 증정", img: "https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674702/DSfs_cnjzei.png", color: "text-[#FFAB00]" },
            { tag: "혜택 3", title: "100% 환급 보장", img: "https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674767/5%EB%A7%8C%EC%9B%90_u0iplm.png", color: "text-[#00C853]" },
            { tag: "혜택 4", title: "라이프 서비스 전환", img: "https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674775/1ec789bfcdceb_rccp2d.png", color: "text-[#E91E63]" }
          ].map((item, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-[32px] p-8 flex items-center gap-8 shadow-xl">
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
          <p className="text-xl text-[#D4AF37] font-black italic">신용만 있다면 최고의 혜택을 미리 선점할 수 있습니다.</p>
        </div>
        <div className="grid grid-cols-4 gap-6">
          {[
            { title: "안심 케어", img: "https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674803/fileView_2_rjy4wd.jpg", desc: "갑작스러운 상황에도 가족의 곁을 지킵니다." },
            { title: "카드한도 무관", img: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&q=80&fit=crop", desc: "한도 걱정 없이 신용만으로 간편 가입" },
            { title: "유연한 활용", img: "https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674852/shutterstock_1225821256_r2rqdf.jpg", desc: "장례는 기본, 크루즈와 가전 혜택까지" },
            { title: "전액 환급", img: "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=400&q=80&fit=crop", desc: "만기 시 100% 돌려받는 스마트한 저축" }
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
    id: 'amount-interactive',
    bg: 'bg-[#0F0F10]',
    isLight: false,
    content: (
      <InteractiveAmountSlide />
    )
  },
  {
    id: 'combined-product',
    bg: 'bg-white',
    isLight: true,
    content: (
      <div className="h-full flex flex-col justify-center px-16 relative">
        <div className="text-center mb-8">
          <span className="text-[#D4AF37] font-black text-xs uppercase tracking-widest block mb-2">PRODUCT INFORMATION</span>
          <h2 className="text-4xl font-black text-[#191F28] tracking-tight">결합 제품 안내</h2>
        </div>
        
        <div className="flex justify-center items-center">
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-[0_30px_60px_rgba(0,0,0,0.06)] flex flex-col items-start text-left w-[360px] transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="w-full aspect-square bg-[#F9FAFB] rounded-[24px] overflow-hidden mb-5 relative group">
              <img 
                src="https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674657/5._%EC%8A%AC%EB%A6%BD%EC%95%A4%EB%B9%84_owqjvp.png" 
                className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110" 
              />
              <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 text-white text-[10px] font-black rounded-lg">
                2구좌
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#D4AF37] font-black text-sm">슬립앤비</span>
              <span className="px-2 py-0.5 bg-[#F2F4F6] text-[#8B95A1] text-[10px] font-bold rounded-md">가구</span>
            </div>
            
            <p className="text-[11px] font-bold text-[#ADB5BD] mb-2 tracking-tight">SNB330-2_Q</p>
            
            <p className="text-[16px] font-black text-[#191F28] leading-snug break-keep">
              슬립앤비 캐나다 독립<br />
              포켓스프링 허리에 좋은<br />
              침대 매트리스 Q
            </p>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-gray-400 text-[10px] font-medium">* 본 사은품은 제조사 사정에 따라 예고 없이 변경될 수 있습니다.</p>
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
          <p className="text-lg font-bold text-[#D4AF37] mb-3">필요한 시점에 원하는 서비스를 선택하세요</p>
          <h2 className="text-4xl font-black text-[#191F28]">토탈 라이프 케어 포트폴리오</h2>
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
            <span className="text-[#D4AF37] font-black text-sm mb-2 block uppercase tracking-widest">Premium Service</span>
            <h2 className="text-4xl font-black text-[#191F28] italic">효원의 고품격 장례 의전</h2>
          </div>
          <div className="bg-[#191F28] px-6 py-3 rounded-2xl shadow-xl">
             <span className="text-white font-black">20년 전통의 진심</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {[
            { cat: "인력 지원", items: ["장례지도사 1명 전담 파견", "입관지원 전문인력", "복지사 4명 (접객도우미)"] },
            { cat: "차량 지원", items: ["고인 운구차 관내 무료", "전용 리무진 전국 무료", "전용 장의버스 전국 무료"] },
            { cat: "고인 용품", items: ["황금문양 수의 세트", "오동나무 규격관 제공", "봉안함(유골함) 제공"] },
            { cat: "상주 지원", items: ["현대/전통 상복 대여", "제단 꽃 20만원 지원", "부고 알림 서비스"] }
          ].map((section, i) => (
            <div key={i} className="bg-[#FAF7F0] p-8 rounded-[32px] border border-gray-100">
              <h4 className="text-[#191F28] font-black text-xl mb-4 border-b border-gray-200 pb-3">{section.cat}</h4>
              <ul className="space-y-2">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm font-bold text-[#4E5968]">
                    <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full shrink-0"></div>
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
    bg: 'bg-[#FDFBF7]',
    isLight: true,
    content: (
      <div className="h-full grid grid-cols-2 gap-16 px-16 items-center">
        <div>
          <span className="text-[#D4AF37] font-black text-sm mb-4 block italic uppercase tracking-widest">Brand Reliability</span>
          <h2 className="text-5xl font-black text-[#191F28] leading-tight mb-8 tracking-tighter">
            전통 상조의 자부심,<br />
            당신의 미래를 지키는<br />
            <span className="text-[#D4AF37]">효원상조</span>
          </h2>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[32px] shadow-xl border border-gray-100">
              <p className="text-lg font-bold text-[#191F28] italic">"가장 어려운 순간, 가장 큰 힘이 되겠습니다"</p>
            </div>
            <p className="text-[#4E5968] font-medium leading-relaxed break-keep">
              20년 노하우와 탄탄한 재무 구조로 고객의 자산을 안전하게 보호합니다.<br />
              전속 모델과 함께하는 신뢰의 아이콘
            </p>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-10 bg-[#D4AF37] opacity-5 blur-[100px] rounded-full"></div>
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
    bg: 'bg-[#0F0F10]',
    content: (
      <div className="h-full flex flex-col justify-center items-center px-16 text-white text-center">
        <h2 className="text-4xl font-black mb-16 tracking-tight italic">스페셜 299 간편 가입 절차</h2>
        <div className="grid grid-cols-4 gap-8 w-full max-w-5xl">
          {[
            { s: "01", t: "상담 신청", d: "온라인/전화 간편 접수" },
            { s: "02", t: "해피콜 진행", d: "상품 상세 및 신용 확인" },
            { s: "03", t: "모바일 가입", d: "본인 인증 및 전자 계약" },
            { s: "04", t: "제품 배송", d: "가전 배송 및 혜택 확정" }
          ].map((item, i) => (
            <div key={i} className="relative group">
              {i < 3 && <div className="absolute top-1/2 left-full w-full h-px bg-white/10 -translate-y-1/2 z-0 hidden lg:block"></div>}
              <div className="relative z-10 bg-white/5 border border-white/10 p-8 rounded-[40px] group-hover:bg-[#C5A059]/20 transition duration-500">
                <span className="text-sm font-black text-[#C5A059] mb-4 block tracking-[4px]">{item.s}</span>
                <h4 className="text-xl font-black mb-2">{item.t}</h4>
                <p className="text-white/40 text-xs font-bold">{item.d}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-20 bg-white/5 border border-white/10 p-8 rounded-[32px] max-w-3xl flex items-center gap-10">
          <div className="text-left flex-1">
            <h4 className="text-xl font-black mb-2">신용 기반 자동 승인</h4>
            <p className="text-white/40 text-sm font-medium">카드 한도 관계 없이 간편하게 승인됩니다.</p>
          </div>
          <div className="bg-[#C5A059] px-8 py-4 rounded-2xl font-black shadow-2xl">
             승인 가능 여부 확인
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'comparison',
    bg: 'bg-[#0F0F10]',
    content: (
      <div className="h-full flex flex-col justify-center px-16 text-white">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-xl font-bold text-[#D4AF37] mb-2 tracking-tight">Product Comparison</h3>
            <h2 className="text-4xl font-black text-white tracking-tighter italic">리빙144 vs 스페셜299 완벽 비교</h2>
          </div>
          <div className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white/60">
            나에게 가장 알맞은 상품은?
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 items-stretch">
          {/* 리빙 144 Card */}
          <div className="bg-[#111625] rounded-[40px] border border-blue-500/20 p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between group hover:border-blue-500/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-5 blur-[60px] rounded-full"></div>
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold uppercase tracking-wider mb-2 inline-block">
                    신한카드 결합 상품
                  </span>
                  <h4 className="text-3xl font-black text-white mt-1">리빙 144</h4>
                </div>
                <CreditCard className="w-8 h-8 text-blue-400 opacity-80" />
              </div>

              <div className="w-full h-px bg-white/5 mb-6"></div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center py-1">
                  <span className="text-white/40 font-bold">가입 대상/조건</span>
                  <span className="text-white font-black text-right">신한카드 소지자 (한도 필요)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-white/40 font-bold">1구좌 월 납입금</span>
                  <div className="text-right">
                    <span className="text-blue-400 font-black">1~48회: 35,000원</span>
                    <span className="text-white/45 mx-1">/</span>
                    <span className="text-white/80 font-bold">49~200회: 28,000원</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-white/40 font-bold">2구좌 월 납입금</span>
                  <div className="text-right">
                    <span className="text-blue-400 font-black">1~48회: 70,000원</span>
                    <span className="text-white/45 mx-1">/</span>
                    <span className="text-white/80 font-bold">49~200회: 56,000원</span>
                  </div>
                </div>
                <div className="flex justify-between items-start py-1">
                  <span className="text-white/40 font-bold">핵심 혜택</span>
                  <div className="text-right space-y-1">
                    <p className="text-white font-black">결제금액의 8% 캐시백 입금</p>
                    <p className="text-white/60 text-xs font-medium">신한카드 48개월 슬림 무이자급 할부</p>
                  </div>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-white/40 font-bold">가입 제공 사은품</span>
                  <span className="text-white font-black">실속형 리빙 제품 100% 증정</span>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 flex justify-between items-center">
              <span className="text-blue-400 font-black text-sm">만기 완납 시 환급</span>
              <span className="text-lg font-black text-white">100% 전액 환급 보장</span>
            </div>
          </div>

          {/* 스페셜 299 Card */}
          <div className="bg-[#1c1811] rounded-[40px] border border-[#D4AF37]/20 p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between group hover:border-[#D4AF37]/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] opacity-5 blur-[60px] rounded-full"></div>
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-full text-xs font-bold uppercase tracking-wider mb-2 inline-block">
                    BSON 렌탈 결합 상품
                  </span>
                  <h4 className="text-3xl font-black text-white mt-1">스페셜 299</h4>
                </div>
                <Zap className="w-8 h-8 text-[#D4AF37] opacity-80" />
              </div>

              <div className="w-full h-px bg-white/5 mb-6"></div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center py-1">
                  <span className="text-white/40 font-bold">가입 대상/조건</span>
                  <span className="text-[#D4AF37] font-black text-right">카드 한도 무관 (신용 승인)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-white/40 font-bold">1구좌 월 납입금</span>
                  <div className="text-right">
                    <span className="text-[#D4AF37] font-black">1~200회 일관: 29,900원</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-white/40 font-bold">2구좌 월 납입금</span>
                  <div className="text-right">
                    <span className="text-[#D4AF37] font-black">1~200회 일관: 59,800원</span>
                  </div>
                </div>
                <div className="flex justify-between items-start py-1">
                  <span className="text-white/40 font-bold">핵심 혜택</span>
                  <div className="text-right space-y-1">
                    <p className="text-[#D4AF37] font-black">신용 기반 간편 자동 승인</p>
                    <p className="text-white/60 text-xs font-medium">초기 카드 결제 한도 차감 없음</p>
                  </div>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-white/40 font-bold">가입 제공 사은품</span>
                  <span className="text-white font-black">프리미엄 스페셜 가전 100% 증정</span>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-[#D4AF37]/10 p-4 rounded-2xl border border-[#D4AF37]/20 flex justify-between items-center">
              <span className="text-[#D4AF37] font-black text-sm">만기 완납 시 환급</span>
              <span className="text-lg font-black text-white">100% 전액 환급 보장</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-white/30 font-medium">
          ※ 두 상품 모두 장례 의전 서비스 및 크루즈/해외여행 등 라이프 전환 서비스가 100% 동일하게 제공됩니다.
        </div>
      </div>
    )
  },
  {
    id: 'closing',
    bg: 'bg-[#0F0F10]',
    content: (
      <div className="relative h-full w-full flex flex-col justify-center items-center px-16 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F0F10] via-[#1A1A1C]/95 to-[#2D2D30]/80"></div>
        </div>
        
        <div className="relative z-10 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-block px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-bold text-[#D4AF37] mb-8 uppercase tracking-widest"
          >
            Premium Life Partner
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-7xl font-black leading-[1.1] mb-10 tracking-tighter"
          >
            경청해 주셔서<br/>
            <span className="text-[#D4AF37]">감사합니다</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-white/60 text-xl leading-relaxed mb-12 font-medium break-keep"
          >
            한계를 넘어서는 혜택, 당신의 특별한 라이프 스타일을 위한<br/>
            <span className="text-white font-bold text-2xl">효원상조 x BSON 스페셜 299</span>가 정답입니다.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex justify-center"
          >
            <div className="bg-[#C5A059] text-white px-12 py-5 rounded-[24px] text-2xl font-black shadow-[0_20px_40px_rgba(197,160,89,0.3)]">
              상담 신청 및 파트너 가입
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

export default function LectureSpecialPage() {
  useTrackVisit(undefined, '/lecture/special');
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
              className={`px-6 py-2 rounded-xl text-[11px] font-black transition-all duration-300 ${slide.isLight ? 'text-black/40 hover:text-black' : 'text-white/40 hover:text-white'}`}
            >
              리빙144 (신한카드)
            </button>
            <button 
              onClick={() => window.location.href = '/lecture/special'}
              className={`px-6 py-2 rounded-xl text-[11px] font-black transition-all duration-300 bg-white text-[#D4AF37] shadow-[0_4px_12px_rgba(212,175,55,0.3)]`}
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

        <div className="absolute bottom-[5%] right-[5%] flex gap-4 z-[110]">
          <motion.button
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`w-14 h-14 rounded-[30%] flex items-center justify-center shadow-2xl transition-all ${currentSlide === 0 ? 'bg-white/5 text-white/10' : 'bg-white text-[#191F28] hover:shadow-white/20'}`}
          >
            <ChevronLeft className="w-[60%] h-[60%]" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={nextSlide}
            disabled={currentSlide === SLIDES.length - 1}
            className={`w-14 h-14 rounded-[30%] flex items-center justify-center shadow-2xl transition-all ${currentSlide === SLIDES.length - 1 ? 'bg-white/5 text-white/10' : 'bg-[#D4AF37] text-white hover:shadow-yellow-500/40'}`}
          >
            <ChevronRight className="w-[60%] h-[60%]" />
          </motion.button>
        </div>
        <DrawingOverlay currentSlide={currentSlide} />
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/20 text-[10px] font-black tracking-[0.4em] uppercase">
        Use arrow keys to navigate the lecture
      </div>
    </div>
  );
}
