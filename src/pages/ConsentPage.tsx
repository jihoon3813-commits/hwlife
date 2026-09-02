import React, { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import type { Id } from '../../convex/_generated/dataModel';
import { useTrackVisit } from '../hooks/useTrackVisit';

export default function ConsentPage() {
  useTrackVisit(undefined, '/consent');
  const params = new URLSearchParams(window.location.search);
  const inquiryId = params.get('id') as Id<"inquiries"> | null;
  
  const inquiry = useQuery(api.inquiries.getById, inquiryId ? { id: inquiryId } : "skip");
  const completeConsent = useMutation(api.inquiries.completeConsent);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas resolution for retina displays
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#191F28';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [inquiry]);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const endDraw = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    if (!inquiryId || !agreed || !hasSignature) return;
    setIsSubmitting(true);
    try {
      const signatureData = canvasRef.current?.toDataURL('image/png');
      await completeConsent({
        id: inquiryId,
        signatureData: signatureData,
      });
      setIsComplete(true);
    } catch (err) {
      alert('서명 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Error states
  if (!inquiryId) {
    return (
      <div className="min-h-screen bg-[#F2F4F6] flex items-center justify-center p-6">
        <div className="bg-white rounded-[24px] p-8 text-center shadow-sm max-w-sm">
          <p className="text-[16px] font-bold text-[#191F28]">잘못된 접근입니다.</p>
          <p className="text-[14px] text-[#8B95A1] mt-2">유효한 동의서 링크를 통해 접속해주세요.</p>
        </div>
      </div>
    );
  }

  if (inquiry === undefined) {
    return (
      <div className="min-h-screen bg-[#F2F4F6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#3182F6] animate-spin" />
          <p className="text-[14px] font-bold text-[#8B95A1]">동의서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (inquiry === null) {
    return (
      <div className="min-h-screen bg-[#F2F4F6] flex items-center justify-center p-6">
        <div className="bg-white rounded-[24px] p-8 text-center shadow-sm max-w-sm">
          <p className="text-[16px] font-bold text-[#191F28]">동의서를 찾을 수 없습니다.</p>
          <p className="text-[14px] text-[#8B95A1] mt-2">유효하지 않은 링크입니다.</p>
        </div>
      </div>
    );
  }

  // Already signed
  if (inquiry.consentStatus === '서명완료' || isComplete) {
    return (
      <div className="min-h-screen bg-[#F2F4F6] flex items-center justify-center p-6">
        <div className="bg-white rounded-[24px] p-10 text-center shadow-sm max-w-sm w-full">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-[20px] font-black text-[#191F28] mb-2">서명이 완료되었습니다</h2>
          <p className="text-[14px] text-[#8B95A1] leading-relaxed">
            {inquiry.name}님의 구매동의서 서명이<br />정상적으로 처리되었습니다.
          </p>
          {inquiry.purchaseConsentDate && (
            <p className="text-[13px] text-[#3182F6] font-bold mt-4">
              동의일: {inquiry.purchaseConsentDate}
            </p>
          )}
          <div className="mt-8 pt-6 border-t border-[#F2F4F6]">
            <img 
              src="https://res.cloudinary.com/dfkntvpmv/image/upload/v1781672825/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_ns9erj.png" 
              alt="효원상조" 
              className="h-5 mx-auto opacity-30 grayscale object-contain" 
            />
          </div>
        </div>
      </div>
    );
  }

  const is2Account = inquiry.productName?.includes('2구좌') || inquiry.account?.includes('2');

  return (
    <div className="min-h-screen bg-[#F2F4F6]">
      <div className="max-w-[430px] mx-auto min-h-screen bg-white flex flex-col">
        
        {/* Logo & Title */}
        <div className="pt-10 pb-6 text-center bg-white px-6">
          <img 
            src="https://res.cloudinary.com/dfkntvpmv/image/upload/v1781672825/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_ns9erj.png" 
            alt="효원상조" 
            className="h-10 mx-auto mb-6 object-contain" 
          />
          <h1 className="text-[22px] font-black text-[#191F28] tracking-tight leading-[1.2]">
            결합제품 구매 및 상조회비 선결제,<br />
            이용 동의서
          </h1>
          <div className="w-12 h-1 bg-[#3182F6] mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Customer & Product Info */}
        <div className="px-6 py-6 space-y-4">
          <div className="bg-[#F9FAFB] rounded-[24px] border border-[#E5E8EB] overflow-hidden">
            <div className="divide-y divide-[#E5E8EB]">
              <div className="px-5 py-4 flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#3182F6] uppercase tracking-wider">성명</span>
                <span className="text-[16px] font-bold text-[#191F28]">{inquiry.name}</span>
              </div>
              <div className="px-5 py-4 flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#3182F6] uppercase tracking-wider">연락처</span>
                <span className="text-[16px] font-bold text-[#191F28]">{inquiry.phone}</span>
              </div>
              <div className="px-5 py-4 flex flex-col gap-1">
                <span className="text-[12px] font-bold text-[#3182F6] uppercase tracking-wider">가입상품</span>
                <span className="text-[16px] font-bold text-[#191F28]">{inquiry.productName}</span>
              </div>
              {inquiry.appliance && (
                <div className="px-5 py-4 flex flex-col gap-1">
                  <span className="text-[12px] font-bold text-[#3182F6] uppercase tracking-wider">결합가전</span>
                  <span className="text-[16px] font-bold text-[#191F28]">{inquiry.appliance}</span>
                </div>
              )}
              <div className="px-5 py-4 flex flex-col gap-0.5">
                <span className="text-[12px] font-bold text-[#3182F6] uppercase tracking-wider mb-0.5">결제금액</span>
                <span className="text-[20px] font-black text-[#191F28] leading-tight">
                  {is2Account ? '3,360,000원' : '1,680,000원'}
                </span>
                <span className="text-[12px] text-[#8B95A1] font-bold">
                  {is2Account ? '(제품 288만, 상조 48만)' : '(제품 144만, 상조 24만)'}
                </span>
              </div>
              <div className="px-5 py-4 flex flex-col gap-2">
                <span className="text-[12px] font-bold text-[#3182F6] uppercase tracking-wider">비고</span>
                <p className="text-[13px] text-[#4E5968] leading-relaxed break-keep font-medium">
                  {is2Account 
                    ? '1~48회 상조회비 24만원x2구좌는 별도로 신한 48pay 결제가 각각 한번씩 총 두번 더 이루어집니다.'
                    : '1~48회 상조회비 24만원은 별도로 신한 48pay 결제가 한번 더 이루어집니다.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Notice */}
        <div className="px-6 py-6 bg-[#F2F4F6] flex-1">
          <div className="mb-8">
            <h3 className="text-[18px] font-black text-[#191F28] mb-4 flex items-center gap-2">
              <div className="w-1.5 h-5 bg-[#3182F6] rounded-full"></div>
              주요 안내 사항
            </h3>
            <ul className="space-y-3">
                {[
                <>본 내용은 리빙제품 결합상조 상품 <span className="whitespace-nowrap">&lt;리빙144(신한카드)&gt;</span> 가입과 동시에 이루어지는 결합제품 결제 내역입니다.</>,
                '구매 제품은 택배를 통해 배송되며, 제품 수령 및 포장 훼손 등의 실 사용 시에는 환불은 불가합니다.',
                '본 결제 금액은 결합제품 대금 전액과 1~48회까지의 상조 회비(월 5,000원)를 포함한 총액입니다. (1구좌 기준)',
                '따라서 상조회비는 자동으로 48회까지 완납으로 처리되며, 49회부터는 효원상조에서 청구합니다.',
                '본 결제 총액은 상조상품 만기 시 효원상조로부터 전액을 환급받을 수 있으며 자세한 내용은 효원상조 해피콜 시 안내해 드립니다.'
              ].map((item, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] text-[#4E5968] leading-relaxed break-keep">
                  <CheckCircle2 className="w-4 h-4 text-[#3182F6] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Agreement & Signature */}
          <div className="bg-white rounded-[24px] p-6 border border-[#E5E8EB] shadow-sm">
            <p className="text-[15px] font-bold text-[#191F28] text-center mb-6">
              위 사항을 확인 하였으며 이에 동의합니다.
            </p>
            
            <div className="space-y-5">
              <div className="flex justify-between items-center py-2 border-b border-[#F2F4F6]">
                <span className="text-[13px] font-bold text-[#8B95A1]">결제일</span>
                <span className="text-[15px] font-bold text-[#191F28]">
                  {new Date(Date.now() + 9 * 60 * 60 * 1000).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#F2F4F6]">
                <span className="text-[13px] font-bold text-[#8B95A1]">성명</span>
                <span className="text-[15px] font-bold text-[#191F28]">{inquiry.name}</span>
              </div>

              {/* Signature Canvas */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[12px] font-bold text-[#8B95A1]">서명 (인)</span>
                  {hasSignature && (
                    <button 
                      onClick={clearSignature}
                      className="text-[12px] font-bold text-[#3182F6] hover:underline"
                    >
                      다시 그리기
                    </button>
                  )}
                </div>
                <canvas
                  ref={canvasRef}
                  className="w-full aspect-[2/1] bg-[#F9FAFB] rounded-[16px] border-2 border-dashed border-[#D1D6DB] touch-none cursor-crosshair"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={endDraw}
                />
                {!hasSignature && (
                  <p className="text-[12px] text-[#B0B8C1] text-center mt-2 italic">
                    위 영역에 손가락으로 서명해주세요
                  </p>
                )}
              </div>

              {/* Agreement Checkbox */}
              <label className="flex items-start gap-3 p-4 bg-[#F9FAFB] rounded-[16px] cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-5 h-5 rounded-[6px] border-2 border-[#D1D6DB] text-[#3182F6] focus:ring-[#3182F6] mt-0.5 shrink-0 accent-[#3182F6]"
                />
                <span className="text-[13px] text-[#4E5968] leading-relaxed break-keep font-medium">
                  본인은 위 내용을 충분히 이해하였으며, 결합제품 구매 및 상조회비 선결제에 동의합니다.
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 mb-10">
            <button
              onClick={handleSubmit}
              disabled={!agreed || !hasSignature || isSubmitting}
              className={`w-full py-4 rounded-[16px] font-bold text-[16px] transition-all ${
                agreed && hasSignature && !isSubmitting
                  ? 'bg-[#3182F6] text-white shadow-lg shadow-blue-500/20 active:scale-[0.98]'
                  : 'bg-[#E5E8EB] text-[#B0B8C1] cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> 처리 중...
                </span>
              ) : (
                '동의하고 서명 제출'
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="text-center pb-8">
            <img 
              src="https://res.cloudinary.com/dfkntvpmv/image/upload/v1781672825/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_ns9erj.png" 
              alt="효원상조" 
              className="h-5 mx-auto opacity-30 grayscale object-contain" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
