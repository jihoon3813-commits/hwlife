import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useTrackVisit } from '../hooks/useTrackVisit';
import { getInquiryAttribution } from '../utils/attribution';
import SEO from '../components/SEO';
import PrivacyModal from '../components/PrivacyModal';
import { formatPhoneNumber } from '../utils/phone';
import { X, CheckCircle2, ArrowUpRight, Phone } from 'lucide-react';

interface LgCareNew2PageProps {
  channelSubdomain?: string;
  landingPath?: string;
}

const APPLIANCE_OPTIONS = [
  '아직 고민 중 (상담 후 결정)',
  '냉장고 / 김치냉장고',
  '세탁기 / 건조기 / 워시타워',
  '정수기 / 얼음정수기',
  '스타일러 / 의류관리기',
  '에어컨 / 공기청정기',
  'TV / 주방가전 / 기타',
];

export default function LgCareNew2Page({
  channelSubdomain,
  landingPath = '/lg_new',
}: LgCareNew2PageProps) {
  useTrackVisit(channelSubdomain, landingPath);

  useEffect(() => {
    if (!document.querySelector('link[href="/hyowon-talk/trigger.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/hyowon-talk/trigger.css';
      document.head.appendChild(link);
    }
    if (!document.querySelector('script[src="/hyowon-talk/settings.js"]')) {
      const settingsScript = document.createElement('script');
      settingsScript.src = '/hyowon-talk/settings.js';
      settingsScript.defer = true;
      document.body.appendChild(settingsScript);
    }
    if (!document.querySelector('script[src="/hyowon-talk/trigger.js"]')) {
      const script = document.createElement('script');
      script.src = '/hyowon-talk/trigger.js';
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const channel = useQuery(
    api.channels.getBySubdomain,
    channelSubdomain ? { subdomain: channelSubdomain } : 'skip'
  );
  const createInquiry = useMutation(api.inquiries.create);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(12000);

  // Inquiry Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [selectedAppliance, setSelectedAppliance] = useState<string>(APPLIANCE_OPTIONS[0]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [callTime, setCallTime] = useState('언제나 가능');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      if (event.data.type === 'LG_NEW2_HEIGHT' && typeof event.data.height === 'number') {
        if (event.data.height > 200) {
          setIframeHeight(event.data.height);
        }
      } else if (event.data.type === 'LG_NEW2_OPEN_CONSULT') {
        setIsModalOpen(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('성함을 입력해 주세요.');
      return;
    }
    if (!phone.trim() || phone.replace(/[^0-9]/g, '').length < 10) {
      alert('올바른 연락처를 입력해 주세요.');
      return;
    }
    if (!privacyAgreed) {
      alert('개인정보 수집 및 이용에 동의해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const consultDetails = [
        `[LG가전구독 detail] 관심가전: ${selectedAppliance}`,
        `상담 희망시간: ${callTime}`,
        `유입경로: ${landingPath}`,
      ]
        .filter(Boolean)
        .join(' | ');

      await createInquiry({
        name: name.trim(),
        phone: phone.trim(),
        productName: 'LG가전구독(new2) (1구좌)',
        account: '1구좌',
        appliance: selectedAppliance,
        channelId: channel?.subdomain || channelSubdomain || undefined,
        message: consultDetails,
        source: 'lg_care',
        status: '대기',
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
    <div className="min-h-screen bg-[#e9dfd1] text-[#2b2119] font-['Pretendard',-apple-system,BlinkMacSystemFont,sans-serif] flex flex-col items-center">
      <SEO
        title="LG가전 구독 매월 10% 할인 (feat. 효원상조)"
        description="LG 가전 구독료 매월 10% 결합 할인! 효원상조 결합 혜택을 확인하고 맞춤 상담을 받아보세요."
        image="/assets/lg-care/original-0.png"
      />

      {/* Detail HTML Iframe */}
      <div className="w-full flex justify-center">
        <iframe
          ref={iframeRef}
          src="/lg_new2/detail.html"
          title="LG가전 구독 매월 10% 할인 (feat. 효원상조)"
          scrolling="no"
          style={{
            width: '100%',
            height: `${iframeHeight}px`,
            border: 'none',
            display: 'block',
            overflow: 'hidden',
          }}
        />
      </div>

      {/* Footer */}
      <footer className="w-full max-w-[860px] mx-auto px-6 pt-8 pb-28 text-[#76675a] text-[12px] border-t border-[#dccfbc]">
        <div className="flex items-center gap-3 mb-4">
          <img
            src="/assets/lg-care/original-3.png"
            alt="효원상조"
            className="w-[85px] h-[26px] object-contain"
          />
          <span className="text-[#9a8a7a]">×</span>
          <img
            src="/assets/lg-care/original-2.png"
            alt="LG전자"
            className="w-[78px] h-[26px] object-contain"
          />
        </div>
        <p className="leading-relaxed">결합상품 상담 · 라이프앤조이 | 상조서비스 · 효원상조</p>
        {channel?.channelName && (
          <p className="mt-1">
            제휴 파트너: {channel.channelName} | 담당 문의:{' '}
            {channel.managerContact ? (
              <a
                href={`tel:${channel.managerContact}`}
                className="underline font-semibold text-[#40593e]"
              >
                {channel.managerContact}
              </a>
            ) : (
              '상담 문의'
            )}
          </p>
        )}
        <div className="flex gap-4 mt-3">
          <button
            type="button"
            onClick={() => setIsPrivacyOpen(true)}
            className="text-[11px] underline hover:text-[#2b2119] cursor-pointer"
          >
            개인정보처리방침
          </button>
          <a
            href="https://hyowon-life.com/care10"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] underline hover:text-[#2b2119]"
          >
            사업자 정보 및 약관 안내 ↗
          </a>
        </div>
        <small className="block text-[10px] text-[#9a8a7a] mt-4">
          매일의 여유를 더하는 선택. © Hyowon Life &amp; LG Electronics Subscription.
        </small>
      </footer>

      {/* Sticky Floating Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center pointer-events-none">
        <div className="w-full max-w-[860px] bg-[#fbf6ee]/95 backdrop-blur-md border-t border-[#dccfbc] px-5 py-3 flex items-center justify-between gap-4 shadow-[0_-4px_20px_rgba(43,33,25,0.1)] pointer-events-auto">
          <div>
            <small className="block text-[11px] text-[#76675a]">LG 구독료 결합 할인</small>
            <strong className="text-[18px] sm:text-[20px] font-extrabold text-[#40593e]">
              매월 10% 할인
            </strong>
          </div>
          <div className="flex items-center gap-2">
            {channel?.managerContact && (
              <a
                href={`tel:${channel.managerContact}`}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-3 rounded-full border border-[#dccfbc] bg-white text-[#2b2119] text-[13px] font-bold hover:bg-[#f6efe4] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#40593e]" />
                전화 상담
              </a>
            )}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 bg-[#6f9a6b] hover:bg-[#5c8458] text-[#0c0d0c] py-3 px-6 rounded-full font-extrabold text-[14px] shadow-md active:scale-95 transition-all cursor-pointer"
            >
              상담 신청하기
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#fbf6ee] border border-[#dccfbc] rounded-2xl w-full max-w-[460px] p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto text-[#2b2119]">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setIsSuccess(false);
              }}
              className="absolute top-5 right-5 text-[#76675a] hover:text-[#2b2119] p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {isSuccess ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-16 h-16 text-[#40593e] mx-auto mb-4" />
                <h3 className="text-[22px] font-bold text-[#2b2119] mb-2">
                  상담 신청이 완료되었습니다!
                </h3>
                <p className="text-[14px] text-[#76675a] leading-relaxed mb-6">
                  선택하신 <strong className="text-[#40593e]">[{selectedAppliance}]</strong> 가전의
                  10% 할인 혜택 및 결합 조건을 검토하여 전문 상담사가 빠른 시일 내에 연락드리겠습니다.
                </p>
                <div className="bg-[#eee3d3] p-4 rounded-xl text-left text-[13px] text-[#2b2119] mb-6 space-y-1">
                  <div>• 신청자: {name}</div>
                  <div>• 연락처: {phone}</div>
                  <div>• 희망시간: {callTime}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsSuccess(false);
                  }}
                  className="w-full py-3.5 bg-[#6f9a6b] text-[#0c0d0c] rounded-full font-extrabold text-[15px] cursor-pointer"
                >
                  확인
                </button>
              </div>
            ) : (
              <div>
                <span className="text-[11px] font-bold tracking-widest text-[#40593e] uppercase">
                  SPECIAL CONSULTATION
                </span>
                <h3 className="text-[22px] font-bold text-[#2b2119] mt-1 mb-2">
                  LG가전 10% 결합할인 맞춤 상담
                </h3>
                <p className="text-[13px] text-[#76675a] mb-5">
                  관심 가전과 연락처를 남겨주시면 가전 구독 매니저가 친절히 안내해 드립니다.
                </p>

                <form onSubmit={handleSubmitInquiry} className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-bold text-[#2b2119] mb-1">
                      관심 가전
                    </label>
                    <select
                      value={selectedAppliance}
                      onChange={(e) => setSelectedAppliance(e.target.value)}
                      className="w-full px-3.5 py-3 border border-[#dccfbc] rounded-lg text-[14px] bg-white focus:outline-none focus:border-[#40593e]"
                    >
                      {APPLIANCE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[#2b2119] mb-1">성함</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="성함을 입력해 주세요"
                      className="w-full px-3.5 py-3 border border-[#dccfbc] rounded-lg text-[14px] bg-white focus:outline-none focus:border-[#40593e]"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[#2b2119] mb-1">
                      연락처
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                      placeholder="010-0000-0000"
                      maxLength={13}
                      className="w-full px-3.5 py-3 border border-[#dccfbc] rounded-lg text-[14px] bg-white focus:outline-none focus:border-[#40593e]"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[#2b2119] mb-1">
                      상담 희망 시간
                    </label>
                    <select
                      value={callTime}
                      onChange={(e) => setCallTime(e.target.value)}
                      className="w-full px-3.5 py-3 border border-[#dccfbc] rounded-lg text-[14px] bg-white focus:outline-none focus:border-[#40593e]"
                    >
                      <option value="언제나 가능">언제나 가능 (빠른 상담)</option>
                      <option value="오전 (09:00 ~ 12:00)">오전 (09:00 ~ 12:00)</option>
                      <option value="오후 (12:00 ~ 18:00)">오후 (12:00 ~ 18:00)</option>
                      <option value="저녁 (18:00 이후)">저녁 (18:00 이후)</option>
                    </select>
                  </div>

                  <div className="pt-1">
                    <label className="flex items-start gap-2 text-[12px] text-[#76675a] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacyAgreed}
                        onChange={(e) => setPrivacyAgreed(e.target.checked)}
                        className="mt-0.5 accent-[#40593e]"
                      />
                      <span>
                        [필수] 개인정보 수집 및 이용에 동의합니다.{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsPrivacyOpen(true);
                          }}
                          className="text-[#40593e] underline ml-1 font-semibold cursor-pointer"
                        >
                          전문보기
                        </button>
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#6f9a6b] hover:bg-[#5c8458] text-[#0c0d0c] rounded-full font-extrabold text-[15px] transition-all shadow-md active:scale-98 disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? '신청 접수 중...' : '무료 상담 신청 완료 →'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </div>
  );
}
