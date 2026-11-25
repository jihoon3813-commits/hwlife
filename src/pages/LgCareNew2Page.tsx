import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useTrackVisit } from '../hooks/useTrackVisit';
import { getInquiryAttribution } from '../utils/attribution';
import SEO from '../components/SEO';
import PrivacyModal from '../components/PrivacyModal';
import { formatPhoneNumber } from '../utils/phone';
import { X, CheckCircle2, ArrowUpRight, Phone, Sparkles } from 'lucide-react';
import LgCareCatalogModal, { SelectedProductPlan } from '../components/LgCareCatalogModal';
import {
  escapeGiftHtml,
  FloatingGiftWidget,
  formatGiftPeriodText,
  getGiftThumbnails,
  GiftConsultModal,
  GiftDetailModal,
  LandingGiftSection,
  useLandingGiftState,
} from '../components/LandingGiftOverlay';

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
  const [iframeReady, setIframeReady] = useState(false);

  const {
    giftEvent,
    gifts: giftList,
    config: giftConfig,
    selectedGiftId,
    detailModalGift,
    setDetailModalGift,
    consultGift,
    setConsultGift,
    handleSelectGift,
    handleApplyWithGift,
  } = useLandingGiftState(landingPath);

  // Inquiry Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [selectedCatalogPlan, setSelectedCatalogPlan] = useState<SelectedProductPlan | null>(null);
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

  // 중간(iframe 내부 #hyowon-gift-mid) 사은품 증정 이벤트 섹션 렌더링
  useEffect(() => {
    if (!iframeReady) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    let doc: Document | null = null;
    try {
      doc = iframe.contentDocument || iframe.contentWindow?.document || null;
    } catch {
      doc = null;
    }
    if (!doc) return;

    let midEl = doc.getElementById('hyowon-gift-mid');
    if (!midEl) {
      const anchor = doc.getElementById('s09') || doc.getElementById('s10');
      if (!anchor || !anchor.parentNode) return;
      midEl = doc.createElement('div');
      midEl.id = 'hyowon-gift-mid';
      anchor.parentNode.insertBefore(midEl, anchor.nextSibling);
    }

    if (!giftEvent?.isEventActive || !giftConfig || giftList.length === 0) {
      midEl.style.display = 'none';
      midEl.innerHTML = '';
      return;
    }

    const periodText = formatGiftPeriodText(giftConfig.startDate, giftConfig.endDate);
    const badgeText = escapeGiftHtml(
      giftConfig.badgeText || 'SPECIAL GIFT EVENT · 사은품 증정 이벤트 진행중'
    );
    const rawTitle = giftConfig.title || '지금 상담·가입 시 특별 사은품 증정!';
    const titleHtml =
      rawTitle === '지금 상담·가입 시 특별 사은품 증정!'
        ? '지금 상담·가입 시<br class="hg-mob-br" /> 특별 사은품 증정!'
        : escapeGiftHtml(rawTitle);
    const subtitleText = giftConfig.subtitle ? escapeGiftHtml(giftConfig.subtitle) : '';
    const pcCols = giftList.length === 2 ? 2 : giftList.length === 3 ? 3 : 4;

    const buildSliderHtml = (g: (typeof giftList)[number], extraOverlayHtml: string) => {
      const thumbs = getGiftThumbnails(g);
      const imgsHtml = thumbs
        .map(
          (src, idx) =>
            `<img src="${escapeGiftHtml(src)}" alt="${escapeGiftHtml(g.name)} ${idx + 1}" class="hg-slide-img" />`
        )
        .join('');
      const thumbsStrip =
        thumbs.length > 1
          ? `<div class="hg-thumb-strip">${thumbs
              .map(
                (src, idx) =>
                  `<button type="button" class="hg-thumb-btn${idx === 0 ? ' is-active' : ''}" data-thumb-idx="${idx}"><img src="${escapeGiftHtml(src)}" alt="" /></button>`
              )
              .join('')}</div>`
          : '';
      const navBtns =
        thumbs.length > 1
          ? `<button type="button" class="hg-nav hg-prev" aria-label="이전">‹</button><button type="button" class="hg-nav hg-next" aria-label="다음">›</button>`
          : '';
      return `
        <div class="hg-slider-wrap" data-count="${thumbs.length}">
          <div class="hg-slider-stage">
            <div class="hg-slides">${imgsHtml}</div>
            ${extraOverlayHtml}
            ${navBtns}
          </div>
          ${thumbsStrip}
        </div>
      `;
    };

    const cardsHtml =
      giftList.length === 1
        ? (() => {
            const g = giftList[0];
            const hasDetail = Boolean(g.resolvedDetailImageUrl || g.detailImageUrl);
            const gPeriod =
              g.startDate || g.endDate
                ? formatGiftPeriodText(g.startDate, g.endDate)
                : periodText;
            return `
              <div class="hg-single">
                <div class="hg-single-media">
                  ${buildSliderHtml(g, '<span class="hg-tag">증정 사은품</span>')}
                </div>
                <div class="hg-single-body">
                  <div>
                    <div class="hg-period">행사기간 · ${escapeGiftHtml(gPeriod)}</div>
                    <h3 class="hg-name">${escapeGiftHtml(g.name)}</h3>
                    ${
                      g.notice
                        ? `<div class="hg-notice"><strong>※ 사은품 유의사항</strong><div>${escapeGiftHtml(g.notice).replace(/\n/g, '<br>')}</div></div>`
                        : ''
                    }
                  </div>
                  <div class="hg-actions">
                    ${
                      hasDetail
                        ? `<button type="button" class="hg-btn-sec" data-action="detail" data-gift-id="${escapeGiftHtml(g._id)}">상세이미지 보기</button>`
                        : ''
                    }
                    <button type="button" class="hg-btn-pri" data-action="apply" data-gift-id="${escapeGiftHtml(g._id)}">이 사은품으로 상담 신청하기 →</button>
                  </div>
                </div>
              </div>
            `;
          })()
        : `<div class="hg-grid hg-cols-${pcCols}">
            ${giftList
              .map((g, idx) => {
                const hasDetail = Boolean(g.resolvedDetailImageUrl || g.detailImageUrl);
                return `
                  <article class="hg-card">
                    <div class="hg-card-media">
                      ${buildSliderHtml(g, `<span class="hg-tag">혜택 ${String(idx + 1).padStart(2, '0')}</span>`)}
                    </div>
                    <div class="hg-card-body">
                      <div>
                        <h3 class="hg-card-name">${escapeGiftHtml(g.name)}</h3>
                        ${g.notice ? `<p class="hg-card-notice">${escapeGiftHtml(g.notice)}</p>` : ''}
                      </div>
                      <div class="hg-card-actions">
                        ${
                          hasDetail
                            ? `<button type="button" class="hg-btn-sec" data-action="detail" data-gift-id="${escapeGiftHtml(g._id)}">상세이미지 / 유의사항</button>`
                            : ''
                        }
                        <button type="button" class="hg-btn-pri" data-action="apply" data-gift-id="${escapeGiftHtml(g._id)}">선택하고 상담신청 →</button>
                      </div>
                    </div>
                  </article>
                `;
              })
              .join('')}
          </div>`;

    midEl.style.display = 'block';
    midEl.innerHTML = `
      <style>
        #hyowon-gift-mid { padding: 36px 20px; background: #e9dfd1; font-family: 'Pretendard', -apple-system, sans-serif; }
        #hyowon-gift-mid .hg-box { max-width: 820px; margin: 0 auto; border-radius: 22px; border: 2px solid #b98a6a; background: linear-gradient(135deg, #2b2119 0%, #36281e 55%, #241b14 100%); color: #faf5ef; padding: 28px 24px; box-shadow: 0 18px 42px rgba(43,33,25,0.25); }
        #hyowon-gift-mid .hg-head { text-align: center; margin-bottom: 22px; }
        #hyowon-gift-mid .hg-badges { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-bottom: 10px; }
        #hyowon-gift-mid .hg-badge { display: inline-block; padding: 5px 14px; border-radius: 999px; background: #b98a6a; color: #1a130e; font-weight: 800; font-size: 11px; }
        #hyowon-gift-mid .hg-date { display: inline-block; padding: 5px 12px; border-radius: 999px; background: rgba(255,255,255,0.1); border: 1px solid rgba(185,138,106,0.4); color: #f3dcc9; font-weight: 700; font-size: 11px; }
        #hyowon-gift-mid .hg-title { margin: 0; font-size: 24px; font-weight: 800; color: #fff9f2; line-height: 1.3; }
        #hyowon-gift-mid .hg-sub { margin: 6px 0 0; font-size: 13px; color: #d9cbbd; }
        #hyowon-gift-mid .hg-single { display: grid; grid-template-columns: 5fr 7fr; background: #fbf6ee; color: #2b2119; border-radius: 16px; overflow: hidden; border: 1px solid #dccfbc; }
        #hyowon-gift-mid .hg-single-media { position: relative; background: #efe5d7; min-height: 240px; }
        #hyowon-gift-mid .hg-single-body { padding: 22px; display: flex; flex-direction: column; justify-content: space-between; gap: 14px; }
        #hyowon-gift-mid .hg-period { font-size: 11px; font-weight: 700; color: #8a5d3b; margin-bottom: 6px; }
        #hyowon-gift-mid .hg-name { margin: 0; font-size: 21px; font-weight: 900; color: #2b2119; line-height: 1.3; }
        #hyowon-gift-mid .hg-notice { margin-top: 12px; padding: 12px; border-radius: 12px; background: #f3eadc; border: 1px solid #e2d4c0; font-size: 12px; color: #5e4f42; line-height: 1.5; }
        #hyowon-gift-mid .hg-notice strong { display: block; color: #2b2119; margin-bottom: 4px; }
        #hyowon-gift-mid .hg-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        #hyowon-gift-mid .hg-grid { display: grid; gap: 14px; }
        #hyowon-gift-mid .hg-cols-2 { grid-template-columns: repeat(2, 1fr); }
        #hyowon-gift-mid .hg-cols-3 { grid-template-columns: repeat(3, 1fr); }
        #hyowon-gift-mid .hg-cols-4 { grid-template-columns: repeat(4, 1fr); }
        #hyowon-gift-mid .hg-card { background: #fbf6ee; color: #2b2119; border-radius: 16px; overflow: hidden; border: 1px solid #dccfbc; display: flex; flex-direction: column; }
        #hyowon-gift-mid .hg-card-media { position: relative; aspect-ratio: 4/3; background: #efe5d7; }
        #hyowon-gift-mid .hg-card-body { padding: 14px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; }
        #hyowon-gift-mid .hg-card-name { margin: 0; font-size: 14px; font-weight: 800; color: #2b2119; line-height: 1.35; }
        #hyowon-gift-mid .hg-card-notice { margin: 6px 0 0; font-size: 11px; color: #6d5c4e; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        #hyowon-gift-mid .hg-card-actions { display: flex; flex-direction: column; gap: 6px; }
        #hyowon-gift-mid .hg-slider-wrap { display: flex; flex-direction: column; width: 100%; height: 100%; }
        #hyowon-gift-mid .hg-slider-stage { position: relative; flex: 1; min-height: 0; overflow: hidden; }
        #hyowon-gift-mid .hg-slides { display: flex; width: 100%; height: 100%; transition: transform 0.3s ease; }
        #hyowon-gift-mid .hg-slide-img { width: 100%; height: 100%; object-fit: cover; flex-shrink: 0; }
        #hyowon-gift-mid .hg-tag { position: absolute; top: 10px; left: 10px; padding: 4px 10px; border-radius: 999px; background: rgba(43,33,25,0.85); color: #f6efe4; font-size: 10px; font-weight: 700; z-index: 2; }
        #hyowon-gift-mid .hg-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; border-radius: 50%; border: none; background: rgba(0,0,0,0.55); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; z-index: 2; }
        #hyowon-gift-mid .hg-prev { left: 6px; }
        #hyowon-gift-mid .hg-next { right: 6px; }
        #hyowon-gift-mid .hg-thumb-strip { display: flex; gap: 6px; padding: 6px 8px; background: #e8dccb; border-top: 1px solid #dccfbc; overflow-x: auto; }
        #hyowon-gift-mid .hg-thumb-btn { width: 38px; height: 30px; padding: 0; border-radius: 6px; overflow: hidden; border: 1px solid #cbb9a4; opacity: 0.65; cursor: pointer; flex-shrink: 0; background: #fff; }
        #hyowon-gift-mid .hg-thumb-btn.is-active { border-color: #2b2119; box-shadow: 0 0 0 2px #b98a6a; opacity: 1; }
        #hyowon-gift-mid .hg-thumb-btn img { width: 100%; height: 100%; object-fit: cover; display: block; }
        #hyowon-gift-mid .hg-btn-sec { padding: 9px 12px; border-radius: 10px; border: 1px solid #cbb9a4; background: #fff; color: #2b2119; font-weight: 700; font-size: 12px; cursor: pointer; }
        #hyowon-gift-mid .hg-btn-pri { flex: 1; padding: 10px 14px; border-radius: 10px; border: none; background: #2b2119; color: #faf5ef; font-weight: 800; font-size: 12px; cursor: pointer; }
        #hyowon-gift-mid .hg-common { margin-top: 16px; padding: 12px 14px; border-radius: 12px; background: rgba(0,0,0,0.25); border: 1px solid rgba(185,138,106,0.3); font-size: 11.5px; color: #dfd2c3; line-height: 1.5; }
        #hyowon-gift-mid .hg-mob-br { display: none; }
        #hyowon-gift-mid .hg-common strong { display: block; color: #f3dcc9; margin-bottom: 4px; }
        @media (max-width: 680px) {
          #hyowon-gift-mid { padding: 18px 12px; word-break: keep-all; }
          #hyowon-gift-mid .hg-mob-br { display: inline; }
          #hyowon-gift-mid .hg-box { padding: 16px 12px; border-radius: 18px; }
          #hyowon-gift-mid .hg-head { margin-bottom: 14px; }
          #hyowon-gift-mid .hg-badges { flex-direction: column; align-items: center; gap: 6px; margin-bottom: 8px; }
          #hyowon-gift-mid .hg-badge { font-size: 10px; padding: 4px 10px; white-space: nowrap; }
          #hyowon-gift-mid .hg-date { font-size: 10px; padding: 4px 10px; white-space: nowrap; }
          #hyowon-gift-mid .hg-title { font-size: 18px; word-break: keep-all; }
          #hyowon-gift-mid .hg-sub { font-size: 11px; max-width: 260px; margin: 6px auto 0; word-break: keep-all; }
          #hyowon-gift-mid .hg-single { grid-template-columns: 1fr; }
          #hyowon-gift-mid .hg-single-media { min-height: 180px; }
          #hyowon-gift-mid .hg-single-body { padding: 14px; gap: 10px; }
          #hyowon-gift-mid .hg-name { font-size: 17px; word-break: keep-all; }
          #hyowon-gift-mid .hg-notice { margin-top: 8px; padding: 10px; font-size: 11px; line-height: 1.4; word-break: keep-all; }
          #hyowon-gift-mid .hg-actions { flex-wrap: wrap; gap: 6px; }
          #hyowon-gift-mid .hg-btn-sec { padding: 8px 10px; font-size: 11px; white-space: nowrap; }
          #hyowon-gift-mid .hg-btn-pri { min-width: 140px; padding: 8px 10px; font-size: 11px; white-space: normal; word-break: keep-all; text-align: center; }
          #hyowon-gift-mid .hg-common { margin-top: 10px; padding: 10px 12px; font-size: 11px; line-height: 1.45; word-break: keep-all; }
          #hyowon-gift-mid .hg-cols-2, #hyowon-gift-mid .hg-cols-3, #hyowon-gift-mid .hg-cols-4 { grid-template-columns: repeat(2, 1fr); }
        }
      </style>
      <div class="hg-box">
        <div class="hg-head">
          <div class="hg-badges">
            <span class="hg-badge">${badgeText}</span>
            <span class="hg-date">📅 ${escapeGiftHtml(periodText)}</span>
          </div>
          <h2 class="hg-title">${titleHtml}</h2>
          ${subtitleText ? `<p class="hg-sub">${subtitleText}</p>` : ''}
        </div>
        ${cardsHtml}
        ${
          giftConfig.commonNotice
            ? `<div class="hg-common"><strong>[이벤트 유의사항]</strong><div>${escapeGiftHtml(giftConfig.commonNotice).replace(/\n/g, '<br>')}</div></div>`
            : ''
        }
      </div>
    `;

    // 슬라이더 & 버튼 이벤트 연결
    const intervalMs =
      typeof giftConfig.slideIntervalMs === 'number' && giftConfig.slideIntervalMs >= 300
        ? giftConfig.slideIntervalMs
        : 1500;
    const timers: ReturnType<typeof setInterval>[] = [];

    midEl.querySelectorAll<HTMLElement>('.hg-slider-wrap').forEach((wrap) => {
      const count = Number(wrap.dataset.count || '1');
      if (count <= 1) return;
      let idx = 0;
      const slides = wrap.querySelector<HTMLElement>('.hg-slides');
      const thumbBtns = Array.from(wrap.querySelectorAll<HTMLElement>('.hg-thumb-btn'));
      const renderSlide = (nextIdx: number) => {
        idx = (nextIdx + count) % count;
        if (slides) slides.style.transform = `translateX(-${idx * 100}%)`;
        thumbBtns.forEach((b, bi) => b.classList.toggle('is-active', bi === idx));
      };
      wrap.querySelector('.hg-prev')?.addEventListener('click', (e) => {
        e.stopPropagation();
        renderSlide(idx - 1);
      });
      wrap.querySelector('.hg-next')?.addEventListener('click', (e) => {
        e.stopPropagation();
        renderSlide(idx + 1);
      });
      thumbBtns.forEach((btn, bi) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          renderSlide(bi);
        });
      });
      timers.push(setInterval(() => renderSlide(idx + 1), intervalMs));
    });

    const onMidClick = (e: Event) => {
      const target = (e.target as HTMLElement)?.closest<HTMLElement>('[data-action]');
      if (!target) return;
      const giftId = target.dataset.giftId;
      const action = target.dataset.action;
      const found = giftList.find((g) => g._id === giftId);
      if (!found) return;
      if (action === 'detail') setDetailModalGift(found);
      if (action === 'apply') handleApplyWithGift(found);
    };
    midEl.addEventListener('click', onMidClick);

    const fitEl = doc.getElementById('fit');
    if (fitEl) {
      const h = Math.ceil(fitEl.getBoundingClientRect().height);
      if (h > 200) setIframeHeight(h);
    }

    return () => {
      timers.forEach((t) => clearInterval(t));
      midEl?.removeEventListener('click', onMidClick);
    };
  }, [iframeReady, giftEvent, giftConfig, giftList, handleApplyWithGift, setDetailModalGift]);

  const handleSelectCatalogPlan = (plan: SelectedProductPlan) => {
    setSelectedCatalogPlan(plan);
    setSelectedAppliance(`[${plan.product.model}] ${plan.product.name} (${plan.optionSummary})`);
    setIsCatalogModalOpen(false);
    setIsModalOpen(true);
  };

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
        selectedCatalogPlan
          ? `구독기간: ${selectedCatalogPlan.term}개월 | 할인전: ${selectedCatalogPlan.originalPrice.toLocaleString()}원 → 10%할인가: ${selectedCatalogPlan.discountedPrice.toLocaleString()}원`
          : null,
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

      {/* 상단 사은품 증정 이벤트 섹션 */}
      {giftConfig && giftList.length > 0 && (
        <LandingGiftSection
          position="top"
          config={giftConfig}
          gifts={giftList}
          selectedGiftId={selectedGiftId}
          onSelectGift={handleSelectGift}
          onOpenDetail={setDetailModalGift}
          onApplyWithGift={handleApplyWithGift}
        />
      )}

      {/* Detail HTML Iframe */}
      <div className="w-full flex justify-center">
        <iframe
          ref={iframeRef}
          src="/lg_new2/detail.html"
          title="LG가전 구독 매월 10% 할인 (feat. 효원상조)"
          scrolling="no"
          onLoad={() => setIframeReady(true)}
          style={{
            width: '100%',
            height: `${iframeHeight}px`,
            border: 'none',
            display: 'block',
            overflow: 'hidden',
          }}
        />
      </div>

      {/* 하단 사은품 증정 이벤트 섹션 (푸터 위, 본문과 동일 배경) */}
      {giftConfig && giftList.length > 0 && (
        <LandingGiftSection
          position="bottom"
          config={giftConfig}
          gifts={giftList}
          selectedGiftId={selectedGiftId}
          onSelectGift={handleSelectGift}
          onOpenDetail={setDetailModalGift}
          onApplyWithGift={handleApplyWithGift}
        />
      )}

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
        <div className="w-full max-w-[860px] bg-[#fbf6ee]/95 backdrop-blur-md border-t border-[#dccfbc] px-4 sm:px-5 py-3 flex items-center justify-between gap-2 sm:gap-4 shadow-[0_-4px_20px_rgba(43,33,25,0.1)] pointer-events-auto">
          <div className="hidden sm:block">
            <small className="block text-[11px] text-[#76675a]">LG 구독료 결합 할인</small>
            <strong className="text-[18px] sm:text-[20px] font-extrabold text-[#40593e]">
              매월 10% 할인
            </strong>
          </div>
          <div className="w-full sm:w-auto flex items-center gap-2">
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
              onClick={() => setIsCatalogModalOpen(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-3 rounded-full border border-[#40593e]/30 bg-white hover:bg-[#f6efe4] text-[#40593e] text-[12.5px] sm:text-[13px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              10%할인 가전 목록 보기
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-[#6f9a6b] hover:bg-[#5c8458] text-[#0c0d0c] py-3 px-4 sm:px-6 rounded-full font-extrabold text-[13px] sm:text-[14px] shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              상담 신청하기
              <ArrowUpRight className="w-4 h-4 shrink-0" />
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
                      {!APPLIANCE_OPTIONS.includes(selectedAppliance) && (
                        <option value={selectedAppliance}>{selectedAppliance}</option>
                      )}
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

      {/* Appliance Catalog Modal */}
      <LgCareCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        initialCategory="all"
        onApplyToCalculator={handleSelectCatalogPlan}
        onDirectConsult={handleSelectCatalogPlan}
      />

      {/* Privacy Modal */}
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />

      {/* 사은품 플로팅 위젯 & 모달 */}
      {giftConfig && giftList.length > 0 && (
        <>
          <FloatingGiftWidget
            config={giftConfig}
            gifts={giftList}
            selectedGiftId={selectedGiftId}
            onSelectGift={handleSelectGift}
            onOpenDetail={setDetailModalGift}
            onApplyWithGift={handleApplyWithGift}
          />
          <GiftDetailModal
            gift={detailModalGift}
            commonNotice={giftConfig.commonNotice}
            onClose={() => setDetailModalGift(null)}
            onApplyWithGift={handleApplyWithGift}
          />
          <GiftConsultModal
            gift={consultGift}
            landingKey={landingPath}
            channelSubdomain={channelSubdomain}
            onClose={() => setConsultGift(null)}
          />
        </>
      )}
    </div>
  );
}
