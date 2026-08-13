import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E2E8F0] flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="bg-[#191F28] text-white p-5 relative shrink-0 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold bg-[#3182F6] text-white px-2 py-0.5 rounded-xs tracking-wider uppercase block mb-1">
                HYOWON & LIFE N JOY
              </span>
              <h3 className="text-[17px] font-extrabold leading-tight">개인정보 수집·이용 및 제3자 제공 동의</h3>
            </div>
            <button 
              onClick={onClose}
              className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 space-y-5 text-[13px] text-[#333D4B] overflow-y-auto grow custom-scrollbar leading-relaxed">
            <p className="font-bold text-[#191F28] bg-[#F1F5F9] p-3.5 rounded-xl border border-[#E2E8F0]">
              (주)효원상조와 (주)라이프앤조이는 귀하의 상담 신청과 관련하여 다음과 같이 개인정보를 수집·이용 및 제공하고자 합니다.
            </p>

            {/* Section 1 */}
            <div className="space-y-2 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
              <h4 className="font-black text-[14px] text-[#3182F6]">1. 개인정보의 수집·이용에 관한 사항</h4>
              <ul className="space-y-1.5 text-[12px] text-[#475569]">
                <li>• <strong className="text-[#191F28]">수집 항목:</strong> 이름, 연락처(휴대폰 번호), 문의 사항</li>
                <li className="pt-1">• <strong className="text-[#191F28]">수집 및 이용 목적:</strong></li>
                <li className="pl-3.5 text-[#333D4B]">- 상담 신청에 따른 본인 확인 및 원활한 의사소통 경로 확보</li>
                <li className="pl-3.5 text-[#333D4B]">- 상품 안내(상조 및 가전결합 상품) 및 가입 상담</li>
                <li className="pl-3.5 text-[#333D4B]">- 계약 진행 및 서비스 제공을 위한 기초 자료 활용</li>
                <li className="pt-1">• <strong className="text-[#191F28]">보유 및 이용 기간:</strong> 상담 완료 및 목적 달성 시까지 (단, 관련 법령에 따라 보존이 필요한 경우 해당 기간까지 보관)</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="space-y-2 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
              <h4 className="font-black text-[14px] text-[#3182F6]">2. 개인정보의 제3자 제공에 관한 사항</h4>
              <p className="text-[12px] text-[#475569]">본 상담 서비스 제공을 위해 아래와 같이 개인정보를 제공합니다.</p>
              <ul className="space-y-1 text-[12px] text-[#475569] pt-1">
                <li>• <strong className="text-[#191F28]">제공받는 자:</strong> (주)효원상조, (주)라이프앤조이</li>
                <li>• <strong className="text-[#191F28]">제공 목적:</strong> 상품 안내, 해피콜, 계약 체결 및 관리</li>
                <li>• <strong className="text-[#191F28]">제공 항목:</strong> 이름, 연락처, 상담 내용</li>
                <li>• <strong className="text-[#191F28]">보유 및 이용 기간:</strong> 제공 목적 달성 시까지</li>
              </ul>
            </div>

            {/* Notice Box */}
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-[12px] space-y-1">
              <p className="font-bold text-[13px] text-amber-950">※ 동의 거부 권리 안내</p>
              <p className="text-amber-800 leading-relaxed">
                귀하는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 다만, 동의를 거부하실 경우 상담 신청 및 상품 안내 서비스 이용이 제한될 수 있습니다.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] shrink-0">
            <button
              onClick={onClose}
              className="w-full bg-[#3182F6] hover:bg-[#1B64DA] text-white font-extrabold py-3 rounded-xl text-[14px] transition-colors shadow-sm cursor-pointer"
            >
              확인 및 닫기
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
