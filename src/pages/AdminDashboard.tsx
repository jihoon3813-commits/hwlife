import React, { useMemo, useState } from 'react';
import {
  Users,
  UserCheck,
  ShieldCheck,
  LayoutGrid,
  ArrowRight,
  Clock,
  MessageCircle,
  CheckCircle2,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { isLgCareCustomer } from './LgCustomerManagement';
import { getCustomerInflow, INFLOW_META } from '../utils/inflow';

interface AdminDashboardProps {
  channelId?: string;
  userType?: string;
  onNavigate: (menu: string) => void;
}

export default function AdminDashboard({ channelId, userType = 'admin', onNavigate }: AdminDashboardProps) {
  const [chartRange, setChartRange] = useState<'7d' | '14d'>('7d');

  const subChannelIds = useQuery(
    api.channels.getSubChannelIds,
    channelId ? { subdomain: channelId } : 'skip'
  );

  const inquiries = useQuery(
    api.inquiries.list,
    channelId ? (subChannelIds ? { channelIds: subChannelIds } : 'skip') : {}
  );

  const channels = useQuery(api.channels.get) || [];
  const settings = useQuery(api.settings.get);
  const unreadSmsCounts = useQuery(api.sms.getUnreadInboundCounts) ?? {};

  const metrics = useMemo(() => {
    const list = inquiries || [];
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const y = kstNow.getUTCFullYear();
    const m = kstNow.getUTCMonth();
    const d = kstNow.getUTCDate();
    const todayStart = Date.UTC(y, m, d, 0, 0, 0, 0) - 9 * 60 * 60 * 1000;

    const nonLg = list.filter((i) => !isLgCareCustomer(i));
    const lg = list.filter((i) => isLgCareCustomer(i));

    const todayTotal = list.filter((i) => i.createdAt >= todayStart).length;
    const waitingGeneral = nonLg.filter((i) => !i.status || i.status === '대기').length;
    const waitingLg = lg.filter((i) => !i.status || i.status === '대기').length;
    const totalWaiting = waitingGeneral + waitingLg;

    const livingNeedConsent = nonLg.filter((i) => {
      const isSpecial = i.productName?.includes('스페셜') || i.productName?.toLowerCase().includes('special');
      if (isSpecial) return false;
      const isLiving = i.productName?.includes('리빙') || i.productName?.toLowerCase().includes('living') || i.productName?.includes('신한카드');
      return isLiving && i.consentStatus !== '서명완료';
    }).length;

    const unreadSms = (Object.values(unreadSmsCounts) as number[]).reduce((acc, v) => acc + (v || 0), 0);

    const visibleChannels = channelId
      ? channels.filter((c) => c.subdomain === channelId || c.parentChannelId === channelId)
      : channels;
    const activeChannels = visibleChannels.filter((c) => c.status === '정상').length;
    const pendingChannels = visibleChannels.filter((c) => c.status === '승인대기').length;

    return {
      total: list.length,
      nonLgCount: nonLg.length,
      lgCount: lg.length,
      todayTotal,
      waitingGeneral,
      waitingLg,
      totalWaiting,
      livingNeedConsent,
      unreadSms,
      activeChannels,
      totalChannels: visibleChannels.length,
      pendingChannels,
    };
  }, [inquiries, channels, channelId, unreadSmsCounts]);

  const chartSeries = useMemo(() => {
    const days = chartRange === '7d' ? 7 : 14;
    const list = inquiries || [];
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const y = kstNow.getUTCFullYear();
    const m = kstNow.getUTCMonth();
    const d = kstNow.getUTCDate();

    const buckets: { label: string; general: number; lg: number }[] = [];
    for (let offset = days - 1; offset >= 0; offset--) {
      const start = Date.UTC(y, m, d - offset, 0, 0, 0, 0) - 9 * 60 * 60 * 1000;
      const end = Date.UTC(y, m, d - offset, 23, 59, 59, 999) - 9 * 60 * 60 * 1000;
      const dt = new Date(start + 9 * 60 * 60 * 1000);
      const label = `${String(dt.getUTCMonth() + 1).padStart(2, '0')}.${String(dt.getUTCDate()).padStart(2, '0')}`;

      let general = 0;
      let lg = 0;
      for (const item of list) {
        if (item.createdAt >= start && item.createdAt <= end) {
          if (isLgCareCustomer(item)) lg++;
          else general++;
        }
      }
      buckets.push({ label, general, lg });
    }
    return buckets;
  }, [inquiries, chartRange]);

  const getChannelName = (id?: string) => {
    if (!id || id === '본사' || id === 'default') return '본사';
    return channels.find((c) => c.subdomain === id)?.channelName || id;
  };

  const getStatusPillClass = (statusName?: string) => {
    const s = statusName || '대기';
    if (s.includes('완료') || s.includes('정상') || s.includes('설치')) return 'green';
    if (s.includes('거절') || s.includes('취소') || s.includes('해지') || s.includes('철회')) return 'red';
    if (s.includes('대기') || s.includes('보류')) return 'orange';
    if (s.includes('진행') || s.includes('접수')) return 'teal';
    return 'gray';
  };

  // SVG Chart Geometry
  const svgWidth = 680;
  const svgHeight = 195;
  const padLeft = 34;
  const padRight = 18;
  const padTop = 18;
  const padBottom = 28;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const maxVal = Math.max(
    4,
    ...chartSeries.map((b) => Math.max(b.general, b.lg))
  );

  const buildPath = (key: 'general' | 'lg') => {
    if (chartSeries.length === 0) return '';
    return chartSeries
      .map((pt, idx) => {
        const x = padLeft + (chartSeries.length === 1 ? plotW / 2 : (idx / (chartSeries.length - 1)) * plotW);
        const y = padTop + plotH - (pt[key] / maxVal) * plotH;
        return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const recentInquiries = useMemo(() => {
    return (inquiries || []).slice(0, 8);
  }, [inquiries]);

  return (
    <div>
      {/* Page Heading */}
      <div className="adm-page-heading">
        <div>
          <div className="adm-eyebrow">HYOWON SANGJO · WORKSPACE</div>
          <h1>통합 영업 대시보드</h1>
          <p>
            가전결합상조(스페셜299 · 리빙144) 및 LG가전구독 상담 접수, 구매동의, 파트너 채널 현황을 한눈에 확인합니다.
          </p>
        </div>
        <div className="adm-heading-buttons">
          <span className="adm-pill green">● LIVE 실시간 연동</span>
          <button
            type="button"
            onClick={() => onNavigate('statistics')}
            className="adm-btn"
          >
            <BarChart3 />
            <span>유입 통계 분석</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('customers')}
            className="adm-btn primary"
          >
            <span>고객 관리 바로가기</span>
            <ArrowRight />
          </button>
        </div>
      </div>

      {/* 4-Column Metrics Grid */}
      <div className="adm-metrics-grid">
        <div className="adm-metric clickable" onClick={() => onNavigate('customers')}>
          <div className="adm-metric-head">
            <span>전체 누적 상담 접수</span>
            <div className="adm-metric-icon">
              <Users />
            </div>
          </div>
          <div className="adm-metric-value">
            {metrics.total.toLocaleString()}
            <span>건</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">오늘 +{metrics.todayTotal}건</span>
            <span>일반 {metrics.nonLgCount} · LG구독 {metrics.lgCount}</span>
          </div>
        </div>

        <div className="adm-metric clickable" onClick={() => onNavigate('customers')}>
          <div className="adm-metric-head">
            <span>신규 상담 대기</span>
            <div className="adm-metric-icon">
              <Clock />
            </div>
          </div>
          <div className="adm-metric-value">
            {metrics.totalWaiting.toLocaleString()}
            <span>명</span>
          </div>
          <div className="adm-metric-foot">
            <span className={`adm-metric-trend ${metrics.totalWaiting > 0 ? 'warning' : ''}`}>
              {metrics.totalWaiting > 0 ? '확인 필요' : '전건 처리완료'}
            </span>
            <span>일반 {metrics.waitingGeneral} · LG구독 {metrics.waitingLg}</span>
          </div>
        </div>

        <div className="adm-metric clickable" onClick={() => onNavigate('lg_customers')}>
          <div className="adm-metric-head">
            <span>LG가전구독 결합 접수</span>
            <div className="adm-metric-icon">
              <Sparkles />
            </div>
          </div>
          <div className="adm-metric-value">
            {metrics.lgCount.toLocaleString()}
            <span>건</span>
          </div>
          <div className="adm-metric-foot">
            <span className={`adm-metric-trend ${metrics.unreadSms > 0 ? 'warning' : ''}`}>
              미확인 답장 {metrics.unreadSms}건
            </span>
            <span>카톡 · 문자 안내 대상</span>
          </div>
        </div>

        <div className="adm-metric clickable" onClick={() => onNavigate('channels')}>
          <div className="adm-metric-head">
            <span>운영 파트너 채널</span>
            <div className="adm-metric-icon">
              <LayoutGrid />
            </div>
          </div>
          <div className="adm-metric-value">
            {metrics.activeChannels.toLocaleString()}
            <span>곳</span>
          </div>
          <div className="adm-metric-foot">
            <span className={`adm-metric-trend ${metrics.pendingChannels > 0 ? 'warning' : ''}`}>
              승인대기 {metrics.pendingChannels}곳
            </span>
            <span>전체 등록 {metrics.totalChannels}개 채널</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Line Chart + Today's Checkpoints */}
      <div className="adm-dashboard-middle">
        {/* Left: SVG Trend Chart */}
        <div className="adm-panel">
          <div className="adm-panel-top">
            <div>
              <h2>일별 상담 접수 추이</h2>
              <div className="adm-panel-subtitle">
                최근 {chartRange === '7d' ? '7일' : '14일'}간 가전결합상조 및 LG가전구독 신규 인입 건수 비교
              </div>
            </div>
            <div className="adm-segmented">
              <button
                type="button"
                className={chartRange === '7d' ? 'active' : ''}
                onClick={() => setChartRange('7d')}
              >
                주간 (7일)
              </button>
              <button
                type="button"
                className={chartRange === '14d' ? 'active' : ''}
                onClick={() => setChartRange('14d')}
              >
                최근 2주 (14일)
              </button>
            </div>
          </div>

          <div className="adm-chart-summary">
            <span className="adm-legend-item">
              <i className="adm-legend-dot" />
              일반 결합상품 (스페셜299 · 리빙144)
            </span>
            <span className="adm-legend-item">
              <i className="adm-legend-dot sage" />
              LG가전구독 결합상품
            </span>
          </div>

          <div className="adm-chart-wrap">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="adm-line-chart">
              {[0, 0.5, 1].map((ratio, idx) => {
                const y = padTop + plotH - ratio * plotH;
                const val = Math.round(ratio * maxVal);
                return (
                  <g key={idx}>
                    <line x1={padLeft} y1={y} x2={svgWidth - padRight} y2={y} className="grid" />
                    <text x={padLeft - 8} y={y + 3} textAnchor="end">
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Secondary Line (LG Care) */}
              <path d={buildPath('lg')} className="chart-secondary" />
              {/* Main Line (General) */}
              <path d={buildPath('general')} className="chart-main" />

              {chartSeries.map((pt, idx) => {
                const x = padLeft + (chartSeries.length === 1 ? plotW / 2 : (idx / (chartSeries.length - 1)) * plotW);
                const yGen = padTop + plotH - (pt.general / maxVal) * plotH;
                const yLg = padTop + plotH - (pt.lg / maxVal) * plotH;
                const showLabel = chartRange === '7d' || idx % 2 === 0 || idx === chartSeries.length - 1;
                return (
                  <g key={pt.label}>
                    <circle cx={x} cy={yLg} r={3} fill="#a6b6a1" />
                    <circle cx={x} cy={yGen} r={3.8} fill="#295e52" />
                    {showLabel && (
                      <text x={x} y={svgHeight - 6} textAnchor="middle">
                        {pt.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right: Today's Checkpoints */}
        <div className="adm-panel adm-task-panel">
          <div className="adm-task-title">
            <h2>오늘의 체크포인트</h2>
            <span className="adm-pill green">TO DO</span>
          </div>

          <div>
            <button type="button" className="adm-task-row" onClick={() => onNavigate('customers')}>
              <div className="adm-task-icon">
                <Users />
              </div>
              <div>
                <strong>일반 결합 신규 대기</strong>
                <small>해피콜 및 상품 안내 필요</small>
              </div>
              <b>{metrics.waitingGeneral}</b>
            </button>

            <button type="button" className="adm-task-row" onClick={() => onNavigate('lg_customers')}>
              <div className="adm-task-icon">
                <UserCheck />
              </div>
              <div>
                <strong>LG구독 신규 대기</strong>
                <small>카톡 · 문자 안내 발송 대상</small>
              </div>
              <b>{metrics.waitingLg}</b>
            </button>

            <button type="button" className="adm-task-row" onClick={() => onNavigate('lg_customers')}>
              <div className="adm-task-icon">
                <MessageCircle />
              </div>
              <div>
                <strong>미확인 고객 문자 답장</strong>
                <small>양방향 채팅방 확인 필요</small>
              </div>
              <b>{metrics.unreadSms}</b>
            </button>

            <button type="button" className="adm-task-row" onClick={() => onNavigate('consent')}>
              <div className="adm-task-icon">
                <ShieldCheck />
              </div>
              <div>
                <strong>구매동의 서명 미완료</strong>
                <small>리빙144(신한카드) 동의서 관리</small>
              </div>
              <b>{metrics.livingNeedConsent}</b>
            </button>
          </div>

          <div className="adm-task-foot">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#295e52]" />
            <span>항목을 클릭하면 해당 관리 페이지로 즉시 이동합니다.</span>
          </div>
        </div>
      </div>

      {/* Bottom Panel: Recent Inquiries */}
      <div className="adm-panel">
        <div className="adm-panel-top !pb-4 border-b border-[#edf0e7]">
          <div>
            <h2>최근 접수 고객 현황</h2>
            <div className="adm-panel-subtitle">
              가장 최근에 인입된 상담 신청 내역 8건입니다.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onNavigate('customers')} className="adm-btn small">
              일반 고객 전체보기
            </button>
            <button type="button" onClick={() => onNavigate('lg_customers')} className="adm-btn sage small">
              LG구독 고객 전체보기
            </button>
          </div>
        </div>

        <div className="adm-table-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>접수일시</th>
                <th>고객 정보</th>
                <th>유입 구분</th>
                <th>파트너 채널</th>
                <th>신청 상품 / 결합 가전</th>
                <th className="text-center">진행상태</th>
              </tr>
            </thead>
            <tbody>
              {recentInquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center !py-14 text-[#86918a]">
                    최근 접수된 상담 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                recentInquiries.map((item) => {
                  const isLg = isLgCareCustomer(item);
                  const inflow = getCustomerInflow(item);
                  const inflowMeta = INFLOW_META[inflow];
                  return (
                    <tr
                      key={item._id}
                      className="adm-clickable-row"
                      onClick={() => onNavigate(isLg ? 'lg_customers' : 'customers')}
                    >
                      <td className="text-[#6d786c] font-mono text-[11.5px]">
                        {new Date(item.createdAt).toLocaleString('ko-KR', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td>
                        <div className="adm-person">
                          <div className={`adm-person-circle ${isLg ? 'alt' : ''}`}>
                            {(item.name || '고').slice(0, 1)}
                          </div>
                          <div>
                            <strong>{item.name}</strong>
                            <small>{item.phone}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span className={`adm-pill ${isLg ? 'teal' : 'green'}`}>
                            {isLg ? 'LG구독' : '일반결합'}
                          </span>
                          <span className="adm-pill gray">{inflowMeta.label}</span>
                        </div>
                      </td>
                      <td>
                        <span className="adm-pill blue">{getChannelName(item.channelId)}</span>
                      </td>
                      <td className="max-w-[340px]">
                        <div className="font-semibold text-[#263d36] truncate">
                          {item.productName || '-'}
                        </div>
                        {item.appliance && item.appliance !== '-' && (
                          <div className="text-[11px] text-[#86918a] truncate mt-0.5">
                            {item.appliance}
                          </div>
                        )}
                      </td>
                      <td className="text-center">
                        <span className={`adm-pill ${getStatusPillClass(item.status)}`}>
                          {item.status || '대기'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
