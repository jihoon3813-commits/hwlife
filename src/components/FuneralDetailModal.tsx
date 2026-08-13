import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Award, ChevronRight, ChevronLeft, Wrench
} from 'lucide-react';

interface FuneralDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsultationClick?: () => void;
}

export default function FuneralDetailModal({
  isOpen,
  onClose,
  onConsultationClick
}: FuneralDetailModalProps) {
  const [conversionCardIdx, setConversionCardIdx] = useState(0);

  if (!isOpen) return null;

  // Exact 4 Conversion Products: 크루즈 여행, 웨딩 서비스, 어학연수, 칠팔순 잔치
  const conversionCards = [
    {
      title: "럭셔리\n크루즈 여행",
      badge: "회원 전용 혜택",
      badgeBg: "bg-[#3182F6]",
      desc: "세계 명소와 함께하는 크루즈 여행",
      imgUrl: "https://res.cloudinary.com/lyjyvy54/image/upload/v1786423851/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%ED%9B%84_01_49_45_1_z0t551.png"
    },
    {
      title: "고품격\n웨딩 서비스",
      badge: "회원 전용 혜택",
      badgeBg: "bg-[#3182F6]",
      desc: "맞춤형 프라이빗 프리미엄 웨딩",
      imgUrl: "https://res.cloudinary.com/lyjyvy54/image/upload/v1786423846/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%ED%9B%84_01_49_46_2_i4nerm.png"
    },
    {
      title: "글로벌\n어학연수",
      badge: "회원 전용 혜택",
      badgeBg: "bg-[#3182F6]",
      desc: "미국, 캐나다 등 전 세계 어학연수 지원",
      imgUrl: "https://res.cloudinary.com/lyjyvy54/image/upload/v1786427411/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%ED%9B%84_02_49_06_pbczrf.png"
    },
    {
      title: "정성 가득\n칠·팔순 잔치",
      badge: "회원 전용 혜택",
      badgeBg: "bg-[#3182F6]",
      desc: "부모님 감사의 달 칠순·팔순 맞춤 연회",
      imgUrl: "https://res.cloudinary.com/lyjyvy54/image/upload/v1786423846/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%ED%9B%84_01_49_47_3_rlipds.png"
    }
  ];

  return (
    <AnimatePresence>
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
              onClick={onClose}
              className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-md transition-colors"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-[11px] font-extrabold bg-[#3182F6] text-white px-2.5 py-0.5 rounded-xs tracking-wider uppercase">
              HYOWON LIFE
            </span>
            <h3 className="text-[20px] sm:text-[22px] font-black mt-2 leading-tight">
              효원상조 60패키지 서비스 상세 안내
            </h3>
            <p className="text-[13px] text-[#A3B1C6] font-medium mt-1">
              가전 소유 + 100% 만기 환급 혜택의 스마트 결합 라이프케어
            </p>
          </div>

          {/* Modal Body - Scrollable */}
          <div className="p-5 sm:p-8 space-y-12 overflow-y-auto grow custom-scrollbar bg-white">

            {/* TOP: (주)효원상조 회사 소개 & 결합 혜택 요약 */}
            <div className="space-y-6">
              {/* Company Logo & Badges Grid */}
              <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-[#E2E8F0] space-y-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between text-center sm:text-left gap-3 border-b border-[#E2E8F0] pb-4">
                  <div className="text-center sm:text-left">
                    <span className="text-[12px] font-extrabold text-[#3182F6] block">TRUSTED LIFE CARE</span>
                    <h4 className="text-[18px] font-black text-[#191F28]">장례서비스 제공 회사</h4>
                  </div>
                  <img 
                    src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786415950/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_opfls9.png" 
                    alt="(주)효원상조 로고" 
                    className="h-7 object-contain mx-auto sm:mx-0 mix-blend-multiply"
                    style={{ filter: 'brightness(1.08) contrast(1.12)' }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] text-center sm:text-left">
                  <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] flex flex-col items-center sm:items-start text-center sm:text-left">
                    <span className="font-extrabold text-[#3182F6] block mb-1">🏆 20년+ 전통 라이프케어</span>
                    <p className="text-[12px] text-[#475569] leading-relaxed">20년 이상 전통을 이어온 믿을 수 있는 토탈 라이프케어 대표 기업입니다.</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] flex flex-col items-center sm:items-start text-center sm:text-left">
                    <span className="font-extrabold text-[#3182F6] block mb-1">🛡️ 안전한 납입금 보호</span>
                    <p className="text-[12px] text-[#475569] leading-relaxed">상조보증공제조합 등록 & '내상조그대로' 참여로 고객 납입금을 안전하게 보호합니다.</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] flex flex-col items-center sm:items-start text-center sm:text-left">
                    <span className="font-extrabold text-[#3182F6] block mb-1">🏛️ 전문 장례·추모관 운영</span>
                    <p className="text-[12px] text-[#475569] leading-relaxed">전국 전문 장례·추모관 직접 운영으로 품격 있는 추모 환경을 제공합니다.</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] flex flex-col items-center sm:items-start text-center sm:text-left">
                    <span className="font-extrabold text-[#3182F6] block mb-1">🎁 전환 서비스 & 복지몰</span>
                    <p className="text-[12px] text-[#475569] leading-relaxed">크루즈, 해외여행, 웨딩, 칠·팔순 잔치 전환 및 전용 복지몰 혜택을 선사합니다.</p>
                  </div>
                </div>
              </div>

              {/* 핵심 결합 혜택 요약 1, 2, 3 */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-[16px] text-[#191F28] flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
                  <Award className="w-5 h-5 text-[#3182F6]" /> 핵심 결합 혜택 요약
                </h4>
                <div className="space-y-2 text-[13px] text-[#333D4B] font-medium">
                  <div className="flex items-start gap-3 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                    <span className="bg-[#3182F6] text-white text-[12px] font-extrabold w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">1</span>
                    <span className="leading-snug"><strong>60회 납입 완료 시</strong> 프리미엄 가전제품은 100% 본인 소유로 전환됩니다.</span>
                  </div>
                  <div className="flex items-start gap-3 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                    <span className="bg-[#3182F6] text-white text-[12px] font-extrabold w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">2</span>
                    <span className="leading-snug"><strong>60회 이후 상조 서비스</strong>는 자유롭게 유지 여부를 결정하실 수 있습니다. (61~200회 유지)</span>
                  </div>
                  <div className="flex items-start gap-3 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                    <span className="bg-[#3182F6] text-white text-[12px] font-extrabold w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">3</span>
                    <span className="leading-snug"><strong>상조 200회 만기 완납 시</strong>, 그동안 납부하신 가전 렌탈료 전액 환급 지원 혜택을 제공합니다. <span className="text-[#3182F6] font-bold">(상조회비 + 가전렌탈료 전액 환급)</span></span>
                  </div>
                </div>
              </div>
            </div>


            {/* SECTION 1: 만기 시 장례 대신 선택할 수 있는 즐거움 - 전환 상품 패키지 */}
            <div className="space-y-6 pt-4 text-center">
              <div className="space-y-2">
                <h4 className="text-[20px] sm:text-[22px] font-black text-[#191F28] leading-tight">
                  만기 시 장례 대신<br />
                  선택할 수 있는 즐거움
                </h4>
                <div className="flex items-center justify-center gap-1.5 text-[#3182F6] font-black text-[16px] sm:text-[18px]">
                  <Wrench className="w-5 h-5 text-[#3182F6]" />
                  전환 상품 패키지
                </div>
                <p className="text-[13px] sm:text-[14px] text-[#64748B] font-medium leading-relaxed max-w-lg mx-auto">
                  크루즈 여행, 웨딩 서비스, 어학연수, 칠팔순 잔치
                </p>
              </div>

              {/* 4 Conversion Cards Grid */}
              <div className="relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  {conversionCards.map((card, idx) => (
                    <div 
                      key={idx}
                      className="relative rounded-2xl overflow-hidden bg-slate-900 text-white min-h-[200px] p-5 flex flex-col justify-between shadow-md group border border-[#E2E8F0]"
                    >
                      {/* Card Background Image with Gradient Overlay */}
                      <img 
                        src={card.imgUrl} 
                        alt={card.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent z-10"></div>
                      
                      <div className="relative z-20 space-y-2">
                        <span className={`inline-block ${card.badgeBg} text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-2xs`}>
                          {card.badge}
                        </span>
                        <h5 className="font-black text-[17px] leading-snug whitespace-pre-line drop-shadow-md">
                          {card.title}
                        </h5>
                      </div>
                      
                      <p className="relative z-20 text-[12px] text-slate-200 font-medium">
                        {card.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Arrow Controls */}
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button 
                    onClick={() => setConversionCardIdx(prev => Math.max(0, prev - 1))}
                    className="w-9 h-9 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] flex items-center justify-center transition-colors cursor-pointer"
                    title="이전"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setConversionCardIdx(prev => Math.min(conversionCards.length - 1, prev + 1))}
                    className="w-9 h-9 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] flex items-center justify-center transition-colors cursor-pointer"
                    title="다음"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>


            {/* SECTION 2: 효원상조에서 제공하는 장례 서비스 */}
            <div className="space-y-6 pt-6 border-t border-[#F2F4F6]">
              <div className="text-center space-y-1">
                <h4 className="text-[20px] sm:text-[22px] font-black text-[#191F28] leading-tight">
                  효원상조에서 제공하는 장례 서비스
                </h4>
                <p className="text-[13px] text-[#3182F6] font-extrabold">
                  1구좌 당 1회 이용 가능합니다.
                </p>
              </div>

              {/* Main Specification Grey Card Container */}
              <div className="bg-[#F8FAFC] rounded-2xl p-5 sm:p-8 border border-[#E2E8F0] text-left space-y-6 shadow-2xs">
                
                {/* Package Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-4">
                  <span className="font-black text-[17px] text-[#191F28] shrink-0">
                    최고급 프리미엄형
                  </span>
                  <p className="text-[12px] text-[#64748B] font-medium leading-relaxed">
                    최상위 의전 인력과 고품격 용품으로 구성되어, 모든 절차에서 최상의 품격과 편안함을 보장하는 패키지 상품입니다.
                  </p>
                </div>

                {/* Sub-section 1: 장례인력 */}
                <div className="space-y-3">
                  <h5 className="font-black text-[14px] text-[#191F28]">장례인력</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    
                    {/* 장례지도사 */}
                    <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] space-y-2 shadow-2xs">
                      <div className="w-16 h-16 bg-white mx-auto flex items-center justify-center">
                        <img 
                          src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786410333/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%EC%A0%84_10_05_03_1_k32jnr.png" 
                          alt="장례지도사" 
                          className="w-full h-full object-contain mix-blend-multiply"
                          style={{ filter: 'brightness(1.08) contrast(1.15)' }}
                        />
                      </div>
                      <span className="font-extrabold text-[14px] text-[#191F28] block">장례지도사</span>
                      <span className="text-[12px] text-[#64748B] font-semibold block leading-tight">
                        1명<br />
                        <span className="text-[11px] font-normal text-[#94A3B8]">
                          (3일간 전담인력 파견,<br />3일장 기준)
                        </span>
                      </span>
                    </div>

                    {/* 입관보조 */}
                    <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] space-y-2 shadow-2xs">
                      <div className="w-16 h-16 bg-white mx-auto flex items-center justify-center">
                        <img 
                          src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786410334/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%EC%A0%84_10_05_03_2_yobrmb.png" 
                          alt="입관보조" 
                          className="w-full h-full object-contain mix-blend-multiply"
                          style={{ filter: 'brightness(1.08) contrast(1.15)' }}
                        />
                      </div>
                      <span className="font-extrabold text-[14px] text-[#191F28] block">입관보조</span>
                      <span className="text-[12px] text-[#64748B] font-semibold block leading-tight">
                        1명<br />
                        <span className="text-[11px] font-normal text-[#94A3B8]">
                          (2일차 입관 시 지원)
                        </span>
                      </span>
                    </div>

                    {/* 장례도우미 */}
                    <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] space-y-2 shadow-2xs">
                      <div className="w-16 h-16 bg-white mx-auto flex items-center justify-center">
                        <img 
                          src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786422422/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%ED%9B%84_01_25_50_4_i2lagt.png" 
                          alt="장례도우미" 
                          className="w-full h-full object-contain mix-blend-multiply"
                          style={{ filter: 'brightness(1.08) contrast(1.15)' }}
                        />
                      </div>
                      <span className="font-extrabold text-[14px] text-[#191F28] block">장례도우미</span>
                      <span className="text-[12px] text-[#64748B] font-semibold block leading-tight">
                        4명<br />
                        <span className="text-[11px] font-normal text-[#94A3B8]">
                          (1인 8시간 기준)
                        </span>
                      </span>
                    </div>

                  </div>
                </div>

                {/* Sub-section 2: 장례용품 */}
                <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
                  <h5 className="font-black text-[14px] text-[#191F28]">장례용품</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    
                    {/* 관 */}
                    <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] flex flex-col items-center justify-between text-center gap-2 min-h-[140px]">
                      <div className="w-14 h-14 bg-white flex items-center justify-center shrink-0">
                        <img 
                          src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786410335/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%EC%A0%84_10_05_03_3_fvivbc.png" 
                          alt="관" 
                          className="w-full h-full object-contain mix-blend-multiply"
                          style={{ filter: 'brightness(1.08) contrast(1.15)' }}
                        />
                      </div>
                      <div className="text-center w-full">
                        <span className="font-extrabold text-[13px] text-[#191F28] block mb-0.5">관</span>
                        <span className="text-[11px] text-[#64748B] block leading-tight">오동나무관 (매장/화장 규격관 사용)</span>
                      </div>
                    </div>

                    {/* 봉안함 */}
                    <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] flex flex-col items-center justify-between text-center gap-2 min-h-[140px]">
                      <div className="w-14 h-14 bg-white flex items-center justify-center shrink-0">
                        <img 
                          src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786410333/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%EC%A0%84_10_05_04_4_wrovu6.png" 
                          alt="봉안함" 
                          className="w-full h-full object-contain mix-blend-multiply"
                          style={{ filter: 'brightness(1.08) contrast(1.15)' }}
                        />
                      </div>
                      <div className="text-center w-full">
                        <span className="font-extrabold text-[13px] text-[#191F28] block mb-0.5">봉안함</span>
                        <span className="text-[11px] text-[#64748B] block leading-tight">효원 고급형 (종교별) / 봉안 시 제공</span>
                      </div>
                    </div>

                    {/* 수의 */}
                    <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] flex flex-col items-center justify-between text-center gap-2 min-h-[140px]">
                      <div className="w-14 h-14 bg-white flex items-center justify-center shrink-0">
                        <img 
                          src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786410334/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%EC%A0%84_10_05_04_5_hkgfra.png" 
                          alt="수의" 
                          className="w-full h-full object-contain mix-blend-multiply"
                          style={{ filter: 'brightness(1.08) contrast(1.15)' }}
                        />
                      </div>
                      <div className="text-center w-full">
                        <span className="font-extrabold text-[13px] text-[#191F28] block mb-0.5">수의</span>
                        <span className="text-[11px] text-[#64748B] block leading-tight">효원 황금문양수의 세트 특 3호</span>
                      </div>
                    </div>

                    {/* 상복 */}
                    <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] flex flex-col items-center justify-between text-center gap-2 min-h-[140px]">
                      <div className="w-14 h-14 bg-white flex items-center justify-center shrink-0">
                        <img 
                          src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786422423/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%ED%9B%84_01_25_50_1_ncfklm.png" 
                          alt="상복" 
                          className="w-full h-full object-contain mix-blend-multiply"
                          style={{ filter: 'brightness(1.08) contrast(1.15)' }}
                        />
                      </div>
                      <div className="text-center w-full">
                        <span className="font-extrabold text-[13px] text-[#191F28] block mb-0.5">상복</span>
                        <span className="text-[11px] text-[#64748B] block leading-tight">직계 가족 필요 수량(남,여)</span>
                      </div>
                    </div>

                    {/* 의전용품 */}
                    <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] flex flex-col items-center justify-between text-center gap-2 min-h-[140px]">
                      <div className="w-14 h-14 bg-white flex items-center justify-center shrink-0">
                        <img 
                          src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786422422/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%ED%9B%84_01_25_50_2_txjo05.png" 
                          alt="의전용품" 
                          className="w-full h-full object-contain mix-blend-multiply"
                          style={{ filter: 'brightness(1.08) contrast(1.15)' }}
                        />
                      </div>
                      <div className="text-center w-full">
                        <span className="font-extrabold text-[13px] text-[#191F28] block mb-0.5">의전용품</span>
                        <span className="text-[11px] text-[#64748B] block leading-tight">부의록, 축문 등 (12종)</span>
                      </div>
                    </div>

                    {/* 장례차량 */}
                    <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] flex flex-col items-center justify-between text-center gap-2 min-h-[140px]">
                      <div className="w-14 h-14 bg-white flex items-center justify-center shrink-0">
                        <img 
                          src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786410333/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%EC%A0%84_10_05_05_8_qrbt2i.png" 
                          alt="장례차량" 
                          className="w-full h-full object-contain mix-blend-multiply"
                          style={{ filter: 'brightness(1.08) contrast(1.15)' }}
                        />
                      </div>
                      <div className="text-center w-full">
                        <span className="font-extrabold text-[13px] text-[#191F28] block mb-0.5">장례차량</span>
                        <span className="text-[11px] text-[#64748B] block leading-tight">고인전용 리무진, 유족전용 버스 (전국무료)</span>
                      </div>
                    </div>

                    {/* 입관용품 */}
                    <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] flex flex-col items-center justify-between text-center gap-2 min-h-[140px]">
                      <div className="w-14 h-14 bg-white flex items-center justify-center shrink-0">
                        <img 
                          src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786410333/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%EC%A0%84_10_05_04_6_ktyxpv.png" 
                          alt="입관용품" 
                          className="w-full h-full object-contain mix-blend-multiply"
                          style={{ filter: 'brightness(1.08) contrast(1.15)' }}
                        />
                      </div>
                      <div className="text-center w-full">
                        <span className="font-extrabold text-[13px] text-[#191F28] block mb-0.5">입관용품</span>
                        <span className="text-[11px] text-[#64748B] block leading-tight">염포 등 (15종)</span>
                      </div>
                    </div>

                    {/* 고인 이송차량 */}
                    <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] flex flex-col items-center justify-between text-center gap-2 min-h-[140px]">
                      <div className="w-14 h-14 bg-white flex items-center justify-center shrink-0">
                        <img 
                          src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786410333/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%EC%A0%84_10_05_04_7_qvot0g.png" 
                          alt="고인 이송차량" 
                          className="w-full h-full object-contain mix-blend-multiply"
                          style={{ filter: 'brightness(1.08) contrast(1.15)' }}
                        />
                      </div>
                      <div className="text-center w-full">
                        <span className="font-extrabold text-[13px] text-[#191F28] block mb-0.5">고인 이송차량</span>
                        <span className="text-[11px] text-[#64748B] block leading-tight">관내 제공</span>
                      </div>
                    </div>

                    {/* 헌화꽃 */}
                    <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] flex flex-col items-center justify-between text-center gap-2 min-h-[140px]">
                      <div className="w-14 h-14 bg-white flex items-center justify-center shrink-0">
                        <img 
                          src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786422422/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%ED%9B%84_01_25_50_3_bt59am.png" 
                          alt="헌화꽃" 
                          className="w-full h-full object-contain mix-blend-multiply"
                          style={{ filter: 'brightness(1.08) contrast(1.15)' }}
                        />
                      </div>
                      <div className="text-center w-full">
                        <span className="font-extrabold text-[13px] text-[#191F28] block mb-0.5">헌화꽃</span>
                        <span className="text-[11px] text-[#64748B] block leading-tight">20송이</span>
                      </div>
                    </div>

                    {/* 제단꽃 지원비 */}
                    <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-2 sm:col-span-2 min-h-[140px] sm:min-h-0">
                      <div className="w-14 h-14 bg-white flex items-center justify-center shrink-0">
                        <img 
                          src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786422423/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%ED%9B%84_01_25_50_5_yr1g06.png" 
                          alt="제단꽃 지원비" 
                          className="w-full h-full object-contain mix-blend-multiply"
                          style={{ filter: 'brightness(1.08) contrast(1.15)' }}
                        />
                      </div>
                      <div>
                        <span className="font-extrabold text-[13px] text-[#191F28] block mb-0.5">제단꽃 지원비</span>
                        <span className="text-[11px] text-[#64748B] block leading-tight">20만원</span>
                      </div>
                    </div>

                  </div>
                </div>

                <p className="text-[11px] text-[#94A3B8] font-medium text-center pt-2">
                  * 1구좌 당 1회 이용 가능합니다.
                </p>
              </div>
            </div>


            {/* SECTION 3: 제휴카드 할인도 당연히 가능해요. */}
            <div className="space-y-6 pt-6 border-t border-[#F2F4F6]">
              {/* Header with Title */}
              <div className="space-y-1.5">
                <span className="text-[12px] font-extrabold text-[#3182F6] block">PARTNERSHIP CARD</span>
                <h4 className="text-[20px] sm:text-[22px] font-black text-[#191F28] leading-tight">
                  제휴카드 할인도 당연히 가능해요.
                </h4>
                <p className="text-[13px] text-[#64748B] font-medium leading-relaxed">
                  연회비 부담은 덜고, 혜택은 더한<br className="hidden xs:inline" />
                  가장 사랑받는 제휴카드로 합리적인 선택을 완성하세요.
                </p>
              </div>

              {/* Full-width 2 Column Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                
                {/* LOCA X BS Rental 카드 */}
                <div className="bg-[#F8FAFC] p-4 sm:p-5 rounded-xl border border-[#E2E8F0] space-y-3 shadow-2xs flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                      <div>
                        <h5 className="font-extrabold text-[14px] text-[#191F28]">LOCA X BS Rental 카드</h5>
                        <span className="text-[12px] font-bold text-[#3182F6] block">렌탈료 최대 25,000원 할인</span>
                      </div>
                      <img 
                        src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786422584/lotte-card_kg7d8r.avif" 
                        alt="LOCA X BS Rental 카드" 
                        className="h-9 object-contain shrink-0 mix-blend-multiply"
                      />
                    </div>

                    <table className="w-full text-[12px] bg-white rounded-lg overflow-hidden border border-[#E2E8F0]">
                      <thead className="bg-[#F1F5F9] text-[#475569] font-bold">
                        <tr>
                          <th className="py-2 px-3 text-left">전월 실적</th>
                          <th className="py-2 px-3 text-right">할인 금액</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] text-[#333D4B] font-medium">
                        <tr>
                          <td className="py-2 px-3">30만원 이상</td>
                          <td className="py-2 px-3 text-right font-bold text-[#3182F6]">10,000원</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3">70만원 이상</td>
                          <td className="py-2 px-3 text-right font-bold text-[#3182F6]">15,000원</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3">150만원 이상</td>
                          <td className="py-2 px-3 text-right font-bold text-[#3182F6]">25,000원</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <a 
                    href="https://www.lottecard.co.kr/app/LPCDADB_V100.lc?vtCdKndC=P13828-A13828"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#E8F3FF] hover:bg-[#D4E8FF] text-[#3182F6] font-extrabold py-2.5 rounded-lg text-[13px] transition-colors cursor-pointer mt-2 text-center block"
                  >
                    카드 신청하기
                  </a>
                </div>

                {/* BS렌탈 플러스 하나카드 */}
                <div className="bg-[#F8FAFC] p-4 sm:p-5 rounded-xl border border-[#E2E8F0] space-y-3 shadow-2xs flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                      <div>
                        <h5 className="font-extrabold text-[14px] text-[#191F28]">BS렌탈 플러스 하나카드</h5>
                        <span className="text-[12px] font-bold text-[#3182F6] block">렌탈료 최대 23,000원 할인</span>
                      </div>
                      <img 
                        src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786422568/hana-card_tqsj4w.avif" 
                        alt="BS렌탈 플러스 하나카드" 
                        className="h-9 object-contain shrink-0 mix-blend-multiply"
                      />
                    </div>

                    <table className="w-full text-[12px] bg-white rounded-lg overflow-hidden border border-[#E2E8F0]">
                      <thead className="bg-[#F1F5F9] text-[#475569] font-bold">
                        <tr>
                          <th className="py-2 px-3 text-left">전월 실적</th>
                          <th className="py-2 px-3 text-right">할인 금액</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] text-[#333D4B] font-medium">
                        <tr>
                          <td className="py-2 px-3">30만원 이상</td>
                          <td className="py-2 px-3 text-right font-bold text-[#3182F6]">13,000원</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3">120만원 이상</td>
                          <td className="py-2 px-3 text-right font-bold text-[#3182F6]">23,000원</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <a 
                    href="https://www.hanacard.co.kr/OPI42000000D.web?_frame=no&CD_PD_SEQ=8878&bansrc=bsrental&ban_nm=bsrentalplus"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#E8F3FF] hover:bg-[#D4E8FF] text-[#3182F6] font-extrabold py-2.5 rounded-lg text-[13px] transition-colors cursor-pointer mt-2 text-center block"
                  >
                    카드 신청하기
                  </a>
                </div>

              </div>

              {/* Full-width Notice Box at Bottom */}
              <div className="w-full text-[11px] sm:text-[12px] text-[#64748B] space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="font-bold text-[#475569]">카드 발급월 기준 최근 6개월간 롯데카드 결제 이력이 없는 경우 추가 할인이 제공됩니다</p>
                <p className="text-[11px]">* 30만원 이상 : 총 13,000원 할인 | * 70만원 이상 : 총 17,000원 할인</p>
              </div>
            </div>


            {/* SECTION 4: 장례 절차 (All Circles Set to User's Exact Light Blue Swatch #EBF3FC) */}
            <div className="space-y-6 pt-6 border-t border-[#F2F4F6] text-center">
              <h4 className="text-[20px] sm:text-[22px] font-black text-[#191F28]">
                장례 절차
              </h4>

              {/* 5 Step Process Flow (Mobile: Icon Left & Text Right Centered | Desktop: Icon Top Centered) */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
                
                {/* Step 1: 장례접수 */}
                <div className="bg-[#F8FAFC] p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] relative shadow-2xs flex sm:flex-col items-center justify-start sm:justify-center text-left sm:text-center gap-3.5 sm:gap-3">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 bg-[#EBF3FC] border border-[#D0E2F7] rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-2xs sm:mx-auto">
                    <img 
                      src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786422858/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%EC%A0%84_11_34_56_zrriuf.png" 
                      alt="장례접수" 
                      className="w-full h-full object-contain mix-blend-multiply"
                      style={{ filter: 'brightness(1.08) contrast(1.15)' }}
                    />
                  </div>
                  <div className="flex flex-col justify-center text-left sm:text-center gap-0.5 grow">
                    <span className="font-extrabold text-[13px] text-[#191F28] block whitespace-nowrap">장례 접수</span>
                    <span className="text-[11px] text-[#64748B] leading-tight block">24시간 상담 및 장례 접수</span>
                  </div>
                </div>

                {/* Step 2: 장례지도사 출동 */}
                <div className="bg-[#F8FAFC] p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] relative shadow-2xs flex sm:flex-col items-center justify-start sm:justify-center text-left sm:text-center gap-3.5 sm:gap-3">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 bg-[#EBF3FC] border border-[#D0E2F7] rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-2xs sm:mx-auto">
                    <img 
                      src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786422857/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%EC%A0%84_11_35_02_rpsvyg.png" 
                      alt="장례지도사 출동" 
                      className="w-full h-full object-contain mix-blend-multiply"
                      style={{ filter: 'brightness(1.08) contrast(1.15)' }}
                    />
                  </div>
                  <div className="flex flex-col justify-center text-left sm:text-center gap-0.5 grow">
                    <span className="font-extrabold text-[13px] text-[#191F28] block whitespace-nowrap">장례 지도사 출동</span>
                    <span className="text-[11px] text-[#64748B] leading-tight block">전국 네트워크 맞춤 컨설팅</span>
                  </div>
                </div>

                {/* Step 3: 장례 진행 */}
                <div className="bg-[#F8FAFC] p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] relative shadow-2xs flex sm:flex-col items-center justify-start sm:justify-center text-left sm:text-center gap-3.5 sm:gap-3">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 bg-[#EBF3FC] border border-[#D0E2F7] rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-2xs sm:mx-auto">
                    <img 
                      src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786422856/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%EC%A0%84_11_34_59_w3q6vy.png" 
                      alt="장례 진행" 
                      className="w-full h-full object-contain mix-blend-multiply"
                      style={{ filter: 'brightness(1.08) contrast(1.15)' }}
                    />
                  </div>
                  <div className="flex flex-col justify-center text-left sm:text-center gap-0.5 grow">
                    <span className="font-extrabold text-[13px] text-[#191F28] block whitespace-nowrap">장례 진행</span>
                    <span className="text-[11px] text-[#64748B] leading-tight block">지도사 3일 파견, 올인원 서비스</span>
                  </div>
                </div>

                {/* Step 4: 발인 및 장례 종료 */}
                <div className="bg-[#F8FAFC] p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] relative shadow-2xs flex sm:flex-col items-center justify-start sm:justify-center text-left sm:text-center gap-3.5 sm:gap-3">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 bg-[#EBF3FC] border border-[#D0E2F7] rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-2xs sm:mx-auto">
                    <img 
                      src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786422856/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%EC%A0%84_11_35_06_kyvi6i.png" 
                      alt="발인 및 장례 종료" 
                      className="w-full h-full object-contain mix-blend-multiply"
                      style={{ filter: 'brightness(1.08) contrast(1.15)' }}
                    />
                  </div>
                  <div className="flex flex-col justify-center text-left sm:text-center gap-0.5 grow">
                    <span className="font-extrabold text-[13px] text-[#191F28] block whitespace-nowrap">발인 및 장례 종료</span>
                    <span className="text-[11px] text-[#64748B] leading-tight block">비용 정산 및 사후 절차 안내</span>
                  </div>
                </div>

                {/* Step 5: 사후 행정지원 */}
                <div className="bg-[#F8FAFC] p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] relative shadow-2xs flex sm:flex-col items-center justify-start sm:justify-center text-left sm:text-center gap-3.5 sm:gap-3">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 bg-[#EBF3FC] border border-[#D0E2F7] rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-2xs sm:mx-auto">
                    <img 
                      src="https://res.cloudinary.com/lyjyvy54/image/upload/v1786422855/ChatGPT_Image_2026%EB%85%84_8%EC%9B%94_11%EC%9D%BC_%EC%98%A4%EC%A0%84_11_35_09_kkinjd.png" 
                      alt="사후 행정지원" 
                      className="w-full h-full object-contain mix-blend-multiply"
                      style={{ filter: 'brightness(1.08) contrast(1.15)' }}
                    />
                  </div>
                  <div className="flex flex-col justify-center text-left sm:text-center gap-0.5 grow">
                    <span className="font-extrabold text-[13px] text-[#191F28] block whitespace-nowrap">사후 행정 지원</span>
                    <span className="text-[11px] text-[#64748B] leading-tight block">장례 종료 후 각종 행정 절차</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex gap-3 shrink-0 shadow-lg z-20">
            <button
              onClick={onClose}
              className="bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#475569] font-bold px-5 py-3 rounded-xl text-[14px] transition-colors cursor-pointer"
            >
              닫기
            </button>
            <button
              onClick={() => {
                onClose();
                if (onConsultationClick) onConsultationClick();
              }}
              className="grow bg-[#3182F6] hover:bg-[#1B64DA] text-white font-extrabold py-3 rounded-xl text-[14px] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              ⚡ 효원상조 60패키지 상담 신청 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
