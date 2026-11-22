import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { getInquiryAttribution } from '../utils/attribution';
import { formatPhoneNumber } from '../utils/phone';
import { X, MessageCircle, Phone, ChevronDown, CheckCircle2 } from 'lucide-react';

interface LgCareTalkChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrivacy: () => void;
  onOpenCatalogGuide: () => void;
  selectedAppliance: string;
  months: number;
  price: number;
  discountedPrice: number;
  totalDiscount: number;
  channelSubdomain?: string;
  landingPath?: string;
}

export default function LgCareTalkChoiceModal({
  isOpen,
  onClose,
  onOpenPrivacy,
  onOpenCatalogGuide,
  selectedAppliance,
  months,
  price,
  discountedPrice,
  totalDiscount,
  channelSubdomain,
  landingPath,
}: LgCareTalkChoiceModalProps) {
  const createInquiry = useMutation(api.inquiries.create);

  const [contactMethod, setContactMethod] = useState<'kakao' | 'phone'>('kakao');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [callTime, setCallTime] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [showFeeDetail, setShowFeeDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const won = (n: number) => Math.round(n).toLocaleString('ko-KR') + '원';
  const first48Total = discountedPrice + 5000;
  const isDefaultQuote = selectedAppliance === '아직 고민 중';

  const kakaoChatUrl = (() => {
    try {
      const url = new URL((window as any).HyowonLG144?.kakaoChannelChatURL || '');
      return url.origin === 'https://pf.kakao.com' ? url.href : '';
    } catch {
      return '';
    }
  })();

  const outboundNumber = String((window as any).HyowonLG144?.outboundNumber || '').trim();

  const handleClose = () => {
    setIsSuccess(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      alert('성함을 입력해 주세요.');
      return;
    }
    if (!phone.trim() || phone.replace(/[^0-9]/g, '').length < 10) {
      alert('올바른 휴대폰 번호를 입력해 주세요.');
      return;
    }
    if (contactMethod === 'phone' && !callTime) {
      alert('통화 희망 시간을 선택해 주세요.');
      return;
    }
    if (!privacyAgreed) {
      alert('개인정보 수집 및 이용에 동의해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const methodLabel = contactMethod === 'kakao' ? '카카오톡 안내' : '전화 상담 예약';
      const consultDetails = [
        `[상담유형: ${methodLabel}]`,
        `관심가전: ${selectedAppliance}`,
        `구독기간: ${months}개월`,
        `할인전: ${won(price)} → 10%할인가: ${won(discountedPrice)} (총할인: ${won(totalDiscount)})`,
        `처음48개월 월합계: ${won(first48Total)}`,
        contactMethod === 'phone' && callTime ? `통화 희망 시간: ${callTime}` : '',
        landingPath ? `유입경로: ${landingPath}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      await createInquiry({
        name: name.trim(),
        phone: phone.trim(),
        productName: 'LG가전구독(new) (1구좌)',
        account: '1구좌',
        appliance: selectedAppliance,
        subscriptionPeriod: `${months}개월`,
        callTime: contactMethod === 'phone' && callTime ? callTime : undefined,
        channelId: channelSubdomain || undefined,
        message: consultDetails,
        source: 'lg_care',
        trafficChannel: contactMethod === 'kakao' ? 'kakao_choice' : 'phone_choice',
        trafficLabel: contactMethod === 'kakao' ? '상단 선택형(카카오톡)' : '상단 선택형(전화상담)',
        ...getInquiryAttribution(),
      });
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      alert('상담 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-[22px] w-full max-w-[820px] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[310px_1fr] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: 나의 가전 견적 */}
        <div className="bg-[#173f35] text-white p-7 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-[#c3d3bf] mb-1.5">
              LG 가전구독 × 효원상조
            </p>
            <h3 className="text-[24px] font-extrabold tracking-tight text-white">
              나의 가전 견적
            </h3>
          </div>

          <div className="my-6 flex items-center justify-center">
            <img
              src="/hyowon-talk/assets/appliances.svg"
              alt="LG 가전 일러스트"
              className="w-[210px] h-auto object-contain select-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-[12px] text-[#b8cab6] mb-1.5">
              <span>선택 조건</span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-[11px] text-[#d8e5d5] font-medium">
                {isDefaultQuote ? '계산 예시' : '내 계산 조건'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-[14px] font-bold text-white pb-3.5 border-b border-white/15">
              <span className="truncate">
                {isDefaultQuote ? '가전 선택 전' : selectedAppliance}
              </span>
              <span className="shrink-0 text-[13px] font-medium text-[#d4e2d2]">
                구독 {months}개월
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-3.5">
              <span className="text-[13px] font-semibold text-[#d4e2d2]">
                처음 48개월 월 합계
              </span>
              <strong className="text-[24px] font-black tracking-tight text-[#f7da59]">
                {won(first48Total)}
              </strong>
            </div>

            <button
              type="button"
              onClick={() => setShowFeeDetail((prev) => !prev)}
              className="mt-2.5 inline-flex items-center gap-1 text-[12px] text-[#b8cab6] hover:text-white underline underline-offset-4 transition-colors"
            >
              <span>상조회비와 납입 선택 보기</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${showFeeDetail ? 'rotate-180' : ''}`}
              />
            </button>

            {showFeeDetail && (
              <div className="mt-2.5 p-3 rounded-lg bg-white/10 text-[11.5px] leading-relaxed text-[#e1ece0]">
                1~48회는 상조회비 월 5,000원 + 10% 할인 가전료({won(discountedPrice)})를 납입합니다.
                49회 이후에는 계속 납입 또는 납입 유예를 선택할 수 있습니다.
              </div>
            )}
          </div>
        </div>

        {/* Right: 카톡/전화 2개 선택형 폼 */}
        <div className="p-7 md:p-8 bg-white relative flex flex-col justify-center">
          <button
            type="button"
            onClick={handleClose}
            aria-label="창 닫기"
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#4b5563] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {isSuccess ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-[#eaf3e7] rounded-full flex items-center justify-center mx-auto mb-4 text-[#173f35]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-[22px] font-extrabold text-[#173f35] mb-2">
                {contactMethod === 'kakao'
                  ? '카톡 안내 신청이 접수되었습니다!'
                  : '전화 상담 신청이 접수되었습니다!'}
              </h3>
              <p className="text-[14px] text-[#555] mb-4 leading-relaxed">
                {contactMethod === 'kakao'
                  ? '가전 목록과 월 납입액을 확인하시거나 전문상담사의 안내를 받아보실 수 있습니다.'
                  : '담당 전문상담사가 입력하신 번호로 빠르게 연락드리겠습니다.'}
              </p>
              {outboundNumber && (
                <p className="text-[13px] text-[#374151] bg-[#f3f6f2] rounded-xl py-2.5 px-3.5 mb-5">
                  상담 전화가 오는 번호{' '}
                  <strong className="text-[#173f35] font-extrabold">{outboundNumber}</strong>
                </p>
              )}
              <div className="space-y-2.5">
                {kakaoChatUrl && contactMethod === 'kakao' && (
                  <a
                    href={kakaoChatUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-xl bg-[#FEE500] hover:bg-[#f5dc00] text-[#191919] font-bold text-[14px] flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    카카오톡 채널에서 바로 상담하기
                  </a>
                )}
                <button
                  type="button"
                  onClick={onOpenCatalogGuide}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#173f35] hover:bg-[#235649] text-white font-bold text-[14px] transition-colors"
                >
                  가전 목록 · 가입 절차 보기
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-3 rounded-xl bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#374151] font-semibold text-[13px] transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[12px] font-bold text-[#173f35] flex items-center gap-1.5 mb-1">
                <MessageCircle className="w-3.5 h-3.5 fill-[#173f35]" />
                라이프앤조이 결합상담
              </p>
              <h3 className="text-[24px] font-extrabold tracking-tight text-[#111827] mb-1.5">
                {contactMethod === 'kakao' ? '카톡으로 안내받기' : '전화 상담 예약'}
              </h3>
              <p className="text-[13px] text-[#6b7280] mb-4">
                {contactMethod === 'kakao'
                  ? '가전 목록과 월 납입액을 카카오톡에서 편한 시간에 확인하세요.'
                  : '통화하기 편한 시간대를 남겨주세요. 선택한 가전과 납입 조건을 상담사가 안내해 드려요.'}
              </p>

              {/* 가전 목록과 질문 먼저 보기 (카카오톡 탭에서만 노출) */}
              {contactMethod === 'kakao' && (
                <button
                  type="button"
                  onClick={onOpenCatalogGuide}
                  className="w-full py-3 px-4 rounded-xl bg-[#FEE500] hover:bg-[#f5dc00] text-[#191919] font-bold text-[14px] flex items-center justify-center gap-2 transition-colors shadow-xs mb-5"
                >
                  <MessageCircle className="w-4 h-4 fill-[#191919]" />
                  가전 목록과 질문 먼저 보기
                </button>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* 안내받을 방법 2개 선택형 */}
                <div>
                  <label className="block text-[12px] font-bold text-[#374151] mb-1.5">
                    안내받을 방법
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setContactMethod('kakao')}
                      className={`py-2.5 px-3 rounded-xl border text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                        contactMethod === 'kakao'
                          ? 'bg-[#FFF8D6] border-[#EAB308] text-[#191919]'
                          : 'bg-white border-[#e5e7eb] text-[#4b5563] hover:bg-[#f9fafb]'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4 fill-current" />
                      카카오톡
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactMethod('phone')}
                      className={`py-2.5 px-3 rounded-xl border text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                        contactMethod === 'phone'
                          ? 'bg-[#edf4ec] border-[#173f35] text-[#173f35]'
                          : 'bg-white border-[#e5e7eb] text-[#4b5563] hover:bg-[#f9fafb]'
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                      전화 상담
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#374151] mb-1">
                    이름
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름 입력"
                    maxLength={40}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1d5db] text-[14px] focus:outline-none focus:border-[#173f35]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#374151] mb-1">
                    휴대폰 번호
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                    placeholder="010-0000-0000"
                    maxLength={13}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1d5db] text-[14px] focus:outline-none focus:border-[#173f35]"
                    required
                  />
                </div>

                {contactMethod === 'phone' && (
                  <div>
                    <label className="block text-[12px] font-bold text-[#374151] mb-1">
                      통화 희망 시간
                    </label>
                    <select
                      value={callTime}
                      onChange={(e) => setCallTime(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border border-[#d1d5db] text-[14px] bg-white focus:outline-none focus:border-[#173f35] ${
                        callTime ? 'text-[#111827]' : 'text-[#6b7280]'
                      }`}
                      required
                    >
                      <option value="">시간대를 선택해 주세요</option>
                      <option value="언제나 가능">언제나 가능 (빠른 상담)</option>
                      <option value="오전 (09:00 ~ 12:00)">오전 (09:00 ~ 12:00)</option>
                      <option value="오후 (12:00 ~ 18:00)">오후 (12:00 ~ 18:00)</option>
                      <option value="저녁 (18:00 이후)">저녁 (18:00 이후)</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 text-[12.5px] text-[#374151] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacyAgreed}
                      onChange={(e) => setPrivacyAgreed(e.target.checked)}
                      className="w-4 h-4 accent-[#173f35] rounded"
                    />
                    <span>[필수] 개인정보 수집·이용 동의</span>
                  </label>
                  <button
                    type="button"
                    onClick={onOpenPrivacy}
                    className="text-[12px] text-[#6b7280] hover:text-[#173f35] underline"
                  >
                    내용 보기
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-[#173f35] hover:bg-[#235649] text-white font-bold text-[14px] flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-sm"
                >
                  {contactMethod === 'kakao' && <MessageCircle className="w-4 h-4 fill-white" />}
                  <span>
                    {isSubmitting
                      ? '신청 접수 중...'
                      : contactMethod === 'kakao'
                        ? '카톡으로 안내받기'
                        : '전화 상담 예약하기'}
                  </span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
