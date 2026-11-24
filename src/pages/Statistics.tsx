import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Users,
  MousePointerClick,
  CheckCircle2,
  RefreshCw,
  Globe,
  Compass,
  Link2,
  Copy,
  Check,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

const UTM_CHANNEL_PRESETS = [
  { id: 'kakao', label: '카카오톡 링크', source: 'kakao', medium: 'chat' },
  { id: 'sms', label: '문자 링크 (SMS)', source: 'sms', medium: 'message' },
  { id: 'daangn', label: '당근 광고', source: 'daangn', medium: 'ad' },
  { id: 'instagram', label: '인스타그램', source: 'instagram', medium: 'social' },
  { id: 'instagram_ad', label: '인스타그램 광고', source: 'instagram', medium: 'paid_social' },
  { id: 'naver_ad', label: '네이버 광고', source: 'naver', medium: 'cpc' },
  { id: 'naver_blog', label: '네이버 블로그', source: 'naver', medium: 'blog' },
  { id: 'naver_cafe', label: '네이버 카페', source: 'naver', medium: 'cafe' },
  { id: 'youtube', label: '유튜브', source: 'youtube', medium: 'video' },
  { id: 'qr', label: 'QR / 오프라인', source: 'qr', medium: 'offline' },
];

const DEFAULT_LANDING_PATHS = [
  { path: '/', name: '메인 랜딩 (/)' },
  { path: '/living', name: '리빙144 (/living)' },
  { path: '/care_new', name: 'LG가전구독(new) (/care_new)' },
  { path: '/lg_new', name: 'LG가전구독(detail) (/lg_new)' },
  { path: '/lg_new2', name: 'LG가전구독(new2) (/lg_new2)' },
  { path: '/care', name: 'LG가전구독 (/care)' },
  { path: '/special', name: '스페셜299 (/special)' },
  { path: '/package60', name: '가전상조 60패키지 (/package60)' },
];

export default function Statistics({ channelId }: { channelId?: string }) {
  const [period, setPeriod] = useState('week');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [showLinkBuilder, setShowLinkBuilder] = useState(false);
  const [detailTab, setDetailTab] = useState<'channels' | 'landings' | 'utm' | 'env'>('channels');

  // Link Builder state
  const [builderPath, setBuilderPath] = useState('/');
  const [builderPreset, setBuilderPreset] = useState(UTM_CHANNEL_PRESETS[0].id);
  const [builderCampaign, setBuilderCampaign] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  const subChannelIds = useQuery(
    api.channels.getSubChannelIds,
    channelId ? { subdomain: channelId } : 'skip'
  );

  const stats = useQuery(
    api.stats.getDashboardStats,
    channelId
      ? subChannelIds
        ? { period, channelIds: subChannelIds }
        : 'skip'
      : { period }
  );

  const generatedUtmUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hyowon-life.com';
    const preset = UTM_CHANNEL_PRESETS.find((p) => p.id === builderPreset) || UTM_CHANNEL_PRESETS[0];
    const cleanPath = builderPath.startsWith('/') ? builderPath : `/${builderPath}`;
    const params = new URLSearchParams();
    params.set('utm_source', preset.source);
    params.set('utm_medium', preset.medium);
    if (builderCampaign.trim()) {
      params.set('utm_campaign', builderCampaign.trim());
    }
    return `${origin}${cleanPath}${cleanPath.includes('?') ? '&' : '?'}${params.toString()}`;
  }, [builderPath, builderPreset, builderCampaign]);

  if (!stats) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <RefreshCw className="w-7 h-7 text-[#295e52] animate-spin mb-3" />
        <p className="text-[13px] font-semibold text-[#45554e]">통계 데이터를 집계하는 중입니다...</p>
      </div>
    );
  }

  const trafficChannels = (stats as any).trafficChannels || [];
  const categorySummary = (stats as any).categorySummary || [];
  const utmCampaigns = (stats as any).utmCampaigns || [];
  const deviceBreakdown = (stats as any).deviceBreakdown || [];
  const browserBreakdown = (stats as any).browserBreakdown || [];
  const botVisitsCount = (stats as any).botVisitsCount || 0;

  const filteredChannels =
    selectedCategory === '전체'
      ? trafficChannels
      : trafficChannels.filter((c: any) => c.category === selectedCategory);

  const landingOptions = (() => {
    const map = new Map<string, string>();
    DEFAULT_LANDING_PATHS.forEach((d) => map.set(d.path, d.name));
    (stats.landingStats || []).forEach((l: any) => {
      if (l.path && !map.has(l.path)) {
        map.set(l.path, l.name || l.path);
      }
    });
    return Array.from(map.entries()).map(([path, name]) => ({ path, name }));
  })();

  const handleCopyUtmUrl = async () => {
    try {
      await navigator.clipboard.writeText(generatedUtmUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // ignore
    }
  };

  const convRate =
    stats.summary.uv > 0
      ? ((stats.summary.inquiries / stats.summary.uv) * 100).toFixed(1)
      : '0.0';

  const dailyList = stats.dailyStats || [];
  const maxDailyPv = Math.max(10, ...dailyList.map((d: any) => Math.max(d.pv || 0, d.uv || 0, d.applies || 0)));

  return (
    <div>
      {/* Page Heading */}
      <div className="adm-page-heading">
        <div>
          <div className="adm-eyebrow">HYOWON SANGJO · STATISTICS</div>
          <h1>통계</h1>
          <p>
            페이지 뷰(PV), 순 방문자(UV), 파트너별 유입 채널(카톡·문자·당근·인스타·네이버) 및 일자별 전환 현황을 분석합니다.
          </p>
        </div>
        <div className="adm-heading-buttons">
          <span className="adm-pill green">● LIVE 실시간 집계</span>
          <button
            type="button"
            onClick={() => setShowLinkBuilder((prev) => !prev)}
            className={`adm-btn ${showLinkBuilder ? 'primary' : 'sage'}`}
          >
            <Link2 />
            <span>추적 링크(UTM) 생성기</span>
          </button>
        </div>
      </div>

      {/* Period Filter Bar Panel */}
      <div className="adm-panel mb-5">
        <div className="adm-filter-bar !border-b-0">
          <div className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-[#45554e] mr-1">
            <Calendar className="w-4 h-4 text-[#295e52]" />
            <span>조회 기간 (KST)</span>
          </div>
          <div className="adm-segmented">
            {[
              { id: 'today', label: '당일 (오늘)' },
              { id: 'week', label: '최근 7일' },
              { id: 'month', label: '최근 1개월' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                className={period === p.id ? 'active' : ''}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {botVisitsCount > 0 && (
            <div className="adm-filter-end">
              <span className="adm-pill gray">
                <ShieldAlert className="w-3.5 h-3.5" />
                검색봇 · 미리보기 {botVisitsCount.toLocaleString()}건 자동 제외됨
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible UTM Link Builder */}
      {showLinkBuilder && (
        <div className="adm-panel mb-5 p-6">
          <div className="adm-section-label !mt-0">
            <span>채널별 추적 링크 생성기 (UTM)</span>
            <span className="text-[11px] font-normal text-[#86918a]">
              리퍼러가 누락되는 문자 · 카톡 · 인앱 환경에서도 유입처를 100% 정확히 판별합니다.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="adm-field">
              <label>랜딩 페이지</label>
              <select
                value={builderPath}
                onChange={(e) => setBuilderPath(e.target.value)}
                className="adm-select"
              >
                {landingOptions.map((opt) => (
                  <option key={opt.path} value={opt.path}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="adm-field">
              <label>유입 매체 프리셋</label>
              <select
                value={builderPreset}
                onChange={(e) => setBuilderPreset(e.target.value)}
                className="adm-select"
              >
                {UTM_CHANNEL_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="adm-field">
              <label>캠페인 식별 메모 (선택)</label>
              <input
                type="text"
                value={builderCampaign}
                onChange={(e) => setBuilderCampaign(e.target.value)}
                placeholder="예: 11월_프로모션, 당근_지역광고"
                className="adm-input"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-[10px] bg-[#f8f9f5] border border-[#e6eae3]">
            <code className="flex-1 text-[12px] text-[#263d36] font-mono break-all px-1.5">
              {generatedUtmUrl}
            </code>
            <button
              type="button"
              onClick={handleCopyUtmUrl}
              className="adm-btn primary shrink-0"
            >
              {copiedUrl ? <Check /> : <Copy />}
              <span>{copiedUrl ? '복사됨' : '추적 링크 복사'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4-Column Metric Cards (Sono Statistics Layout) */}
      <div className="adm-metrics-grid">
        <div className="adm-metric">
          <div className="adm-metric-head">
            <span>전체 페이지 뷰 (PV)</span>
            <div className="adm-metric-icon">
              <MousePointerClick />
            </div>
          </div>
          <div className="adm-metric-value">
            {stats.summary.pv.toLocaleString()}
            <span>건</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">{stats.summary.pvChange}</span>
            <span>조회 기간 누적 조회수</span>
          </div>
        </div>

        <div className="adm-metric">
          <div className="adm-metric-head">
            <span>순 방문자 수 (UV)</span>
            <div className="adm-metric-icon">
              <Users />
            </div>
          </div>
          <div className="adm-metric-value">
            {stats.summary.uv.toLocaleString()}
            <span>명</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">{stats.summary.uvChange}</span>
            <span>고유 방문자 집계</span>
          </div>
        </div>

        <div className="adm-metric">
          <div className="adm-metric-head">
            <span>유입 채널 종류</span>
            <div className="adm-metric-icon">
              <Compass />
            </div>
          </div>
          <div className="adm-metric-value">
            {trafficChannels.length.toLocaleString()}
            <span>개</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">유입 다변화</span>
            <span>감지된 유입 경로 수</span>
          </div>
        </div>

        <div className="adm-metric">
          <div className="adm-metric-head">
            <span>상담 신청 건수 (APPLY)</span>
            <div className="adm-metric-icon">
              <CheckCircle2 />
            </div>
          </div>
          <div className="adm-metric-value">
            {stats.summary.inquiries.toLocaleString()}
            <span>건</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend warning">UV 대비 {convRate}%</span>
            <span>상담 접수 전환 성과</span>
          </div>
        </div>
      </div>

      {/* Daily Performance Bar Chart Panel (Modeled after Sono Statistics) */}
      <div className="adm-panel mb-5">
        <div className="adm-panel-top">
          <div>
            <div className="flex items-center gap-2">
              <h2>일별 성과 추이</h2>
              <span className="adm-pill green">최근 7일 집계</span>
            </div>
            <div className="adm-panel-subtitle">
              일자별 페이지뷰(PV), 순방문자(UV), 상담신청(APPLY) 추이를 비교합니다.
            </div>
          </div>
          <span className="text-[11px] text-[#8f9a8b] font-medium">단위: 건 / 명</span>
        </div>

        <div className="adm-chart-summary">
          <span className="adm-legend-item">
            <i className="adm-legend-dot" />
            PV (페이지뷰)
          </span>
          <span className="adm-legend-item">
            <i className="adm-legend-dot sage" />
            UV (순방문자)
          </span>
          <span className="adm-legend-item">
            <i className="adm-legend-dot gold" />
            APPLY (상담신청)
          </span>
        </div>

        <div className="p-5 overflow-x-auto">
          <div className="min-w-[560px] bg-[#fcfdfb] border border-[#edf0e7] rounded-[12px] p-5">
            <div className="grid grid-cols-7 gap-4 items-end h-[180px] pt-6 border-b border-[#e6eae3]">
              {dailyList.map((d: any, idx: number) => {
                const pvH = Math.max(4, Math.round(((d.pv || 0) / maxDailyPv) * 130));
                const uvH = Math.max(4, Math.round(((d.uv || 0) / maxDailyPv) * 130));
                const appH = Math.max(d.applies > 0 ? 6 : 2, Math.round(((d.applies || 0) / maxDailyPv) * 130));
                return (
                  <div key={idx} className="flex flex-col items-center justify-end h-full">
                    <div className="flex items-end gap-1.5 h-full">
                      <div className="flex flex-col items-center justify-end">
                        <span className="text-[10px] font-bold text-[#263d36] mb-1 tabular-nums">{d.pv}</span>
                        <div
                          className="w-3 rounded-t-[3px] bg-[#295e52] transition-all"
                          style={{ height: `${pvH}px` }}
                          title={`PV: ${d.pv}`}
                        />
                      </div>
                      <div className="flex flex-col items-center justify-end">
                        <span className="text-[10px] font-semibold text-[#6d786c] mb-1 tabular-nums">{d.uv}</span>
                        <div
                          className="w-3 rounded-t-[3px] bg-[#a6b6a1] transition-all"
                          style={{ height: `${uvH}px` }}
                          title={`UV: ${d.uv}`}
                        />
                      </div>
                      <div className="flex flex-col items-center justify-end">
                        {d.applies > 0 && (
                          <span className="text-[10px] font-bold text-[#a97f3f] mb-1 tabular-nums">{d.applies}</span>
                        )}
                        <div
                          className="w-3 rounded-t-[3px] bg-[#b99a61] transition-all"
                          style={{ height: `${appH}px` }}
                          title={`상담신청: ${d.applies}`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-7 gap-4 pt-2.5 text-center">
              {dailyList.map((d: any, idx: number) => (
                <div key={idx} className="text-[11.5px] font-semibold text-[#5c6b5b] tabular-nums">
                  {d.date?.slice(5)?.replace('-', '.') || d.date}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Detailed Analytics Panel */}
      <div className="adm-panel">
        <div className="adm-panel-top !pb-3">
          <div>
            <h2>상세 유입 채널 &amp; 로그 분석</h2>
            <div className="adm-panel-subtitle">
              인앱 브라우저(UA), 광고 클릭ID, UTM 파라미터 및 리퍼러 도메인 기반 상세 성과표입니다.
            </div>
          </div>
        </div>

        <div className="adm-tabs">
          <button
            type="button"
            className={`adm-tab ${detailTab === 'channels' ? 'active' : ''}`}
            onClick={() => setDetailTab('channels')}
          >
            유입 채널 분석
            <span className="adm-tab-count">{trafficChannels.length}</span>
          </button>
          <button
            type="button"
            className={`adm-tab ${detailTab === 'landings' ? 'active' : ''}`}
            onClick={() => setDetailTab('landings')}
          >
            랜딩페이지별 현황
            <span className="adm-tab-count">{stats.landingStats?.length || 0}</span>
          </button>
          <button
            type="button"
            className={`adm-tab ${detailTab === 'utm' ? 'active' : ''}`}
            onClick={() => setDetailTab('utm')}
          >
            UTM 캠페인 성과
            <span className="adm-tab-count">{utmCampaigns.length}</span>
          </button>
          <button
            type="button"
            className={`adm-tab ${detailTab === 'env' ? 'active' : ''}`}
            onClick={() => setDetailTab('env')}
          >
            기기 · 리퍼러 · IP 현황
            <span className="adm-tab-count">{stats.ipLogs?.length || 0}</span>
          </button>
        </div>

        {/* TAB 1: Traffic Channels */}
        {detailTab === 'channels' && (
          <>
            <div className="adm-filter-bar">
              <div className="adm-segmented">
                <button
                  type="button"
                  className={selectedCategory === '전체' ? 'active' : ''}
                  onClick={() => setSelectedCategory('전체')}
                >
                  전체 ({trafficChannels.length})
                </button>
                {categorySummary.map((cat: any) => (
                  <button
                    key={cat.category}
                    type="button"
                    className={selectedCategory === cat.category ? 'active' : ''}
                    onClick={() => setSelectedCategory(cat.category)}
                  >
                    {cat.category} · {cat.pv.toLocaleString()}회 ({cat.share}%)
                  </button>
                ))}
              </div>
            </div>

            <div className="adm-table-scroll">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>유입 채널</th>
                    <th>분류</th>
                    <th>점유 비중</th>
                    <th className="text-right">순방문자 (UV)</th>
                    <th className="text-right">페이지뷰 (PV)</th>
                    <th className="text-right">상담 신청</th>
                    <th className="text-right">전환율</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChannels.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center !py-14 text-[#86918a]">
                        해당 기간에 집계된 유입 채널 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredChannels.map((ch: any) => (
                      <tr key={ch.channel}>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="adm-pill green">{ch.label}</span>
                            {ch.isPaidAd && <span className="adm-pill orange">광고</span>}
                          </div>
                          {ch.matchReasons && ch.matchReasons.length > 0 && (
                            <div className="text-[10.5px] text-[#8e9988] mt-1">
                              판별: {ch.matchReasons.join(', ')}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="adm-pill gray">{ch.category}</span>
                        </td>
                        <td className="w-[180px]">
                          <div className="flex items-center gap-2.5">
                            <div className="adm-bar-track flex-1">
                              <span style={{ width: `${Math.min(100, ch.share)}%` }} />
                            </div>
                            <span className="text-[11.5px] font-bold text-[#263d36] w-10 text-right tabular-nums">
                              {ch.share}%
                            </span>
                          </div>
                        </td>
                        <td className="text-right tabular-nums">{ch.uv.toLocaleString()}명</td>
                        <td className="text-right font-bold text-[#263d36] tabular-nums">{ch.pv.toLocaleString()}회</td>
                        <td className="text-right font-bold text-[#295e52] tabular-nums">{ch.inquiries.toLocaleString()}건</td>
                        <td className="text-right">
                          <span className="adm-pill teal">{ch.conversionRate.toFixed(1)}%</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* TAB 2: Landings */}
        {detailTab === 'landings' && (
          <div className="adm-table-scroll">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>랜딩페이지명</th>
                  <th>접속 경로 (Path)</th>
                  <th className="text-right">순 방문자 (UV)</th>
                  <th className="text-right">페이지 뷰 (PV)</th>
                </tr>
              </thead>
              <tbody>
                {stats.landingStats && stats.landingStats.length > 0 ? (
                  stats.landingStats.map((lStat: any, idx: number) => (
                    <tr key={idx}>
                      <td className="font-bold text-[#263d36]">{lStat.name}</td>
                      <td>
                        <span className="adm-pill gray font-mono">{lStat.path}</span>
                      </td>
                      <td className="text-right tabular-nums">{lStat.uv.toLocaleString()}명</td>
                      <td className="text-right font-bold text-[#295e52] tabular-nums">{lStat.pv.toLocaleString()}회</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center !py-14 text-[#86918a]">
                      집계된 랜딩페이지 유입 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: UTM Campaigns */}
        {detailTab === 'utm' && (
          <div className="adm-table-scroll">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>소스 (utm_source)</th>
                  <th>매체 (utm_medium)</th>
                  <th>캠페인 (utm_campaign)</th>
                  <th className="text-right">순 방문자 (UV)</th>
                  <th className="text-right">페이지 뷰 (PV)</th>
                  <th className="text-right">상담 신청</th>
                </tr>
              </thead>
              <tbody>
                {utmCampaigns.length > 0 ? (
                  utmCampaigns.map((u: any, idx: number) => (
                    <tr key={idx}>
                      <td className="font-bold text-[#263d36]">{u.utmSource}</td>
                      <td>{u.utmMedium}</td>
                      <td>
                        {u.utmCampaign}
                        {u.utmContent !== '-' && (
                          <span className="text-[11px] text-[#86918a] ml-1.5">({u.utmContent})</span>
                        )}
                      </td>
                      <td className="text-right tabular-nums">{u.uv.toLocaleString()}명</td>
                      <td className="text-right font-bold text-[#263d36] tabular-nums">{u.pv.toLocaleString()}회</td>
                      <td className="text-right font-bold text-[#295e52] tabular-nums">{u.inquiries.toLocaleString()}건</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center !py-14 text-[#86918a]">
                      추적 링크(UTM)로 집계된 캠페인 데이터가 없습니다. 우측 상단의 [추적 링크 생성기]를 활용해보세요.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: Environment, Referrers & IP Logs */}
        {detailTab === 'env' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Device & Browser */}
              <div className="adm-note-card !bg-white space-y-4">
                <div className="adm-section-label !mt-0">
                  <span>접속 기기 및 인앱 브라우저 분포</span>
                </div>
                <div className="space-y-3">
                  {deviceBreakdown.map((d: any) => (
                    <div key={d.deviceType}>
                      <div className="flex justify-between text-[12px] mb-1">
                        <span className="font-semibold text-[#263d36]">{d.deviceType}</span>
                        <span className="font-bold text-[#295e52] tabular-nums">
                          {d.count.toLocaleString()}회 ({d.share}%)
                        </span>
                      </div>
                      <div className="adm-bar-track">
                        <span style={{ width: `${Math.min(100, d.share)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {browserBreakdown.length > 0 && (
                  <div className="pt-3 border-t border-[#edf0e7] flex flex-wrap gap-2">
                    {browserBreakdown.map((b: any) => (
                      <span key={b.browser} className="adm-pill gray">
                        {b.browser}: <b className="text-[#263d36]">{b.count}회</b> ({b.share}%)
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Referrers */}
              <div className="adm-note-card !bg-white">
                <div className="adm-section-label !mt-0">
                  <span>상위 리퍼러 출처 (Top 10)</span>
                </div>
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {stats.referrers.length > 0 ? (
                    stats.referrers.map((ref: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-[8px] bg-[#f8f9f5] border border-[#edf0e7]"
                      >
                        <div className="min-w-0 flex-1">
                          {ref.label && <span className="adm-pill green mr-2">{ref.label}</span>}
                          <span className="text-[12px] font-medium text-[#45554e] truncate inline-block max-w-full align-middle" title={ref.url}>
                            {ref.url}
                          </span>
                        </div>
                        <span className="adm-pill teal shrink-0">{ref.count.toLocaleString()}건</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-[#86918a] text-[12px]">리퍼러 데이터가 없습니다.</p>
                  )}
                </div>
              </div>
            </div>

            {/* IP Logs Table */}
            <div>
              <div className="adm-section-label !mt-0">
                <span>최근 접속 IP 현황</span>
              </div>
              <div className="adm-table-scroll border border-[#e6eae3] rounded-[10px]">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>접속 IP 주소</th>
                      <th className="text-center">누적 접속 건수</th>
                      <th className="text-right">최근 접속 일시</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.ipLogs.length > 0 ? (
                      stats.ipLogs.map((log: any, idx: number) => (
                        <tr key={idx}>
                          <td className="font-mono font-semibold text-[#263d36]">{log.ip}</td>
                          <td className="text-center">
                            <span className="adm-pill green">{log.count}회</span>
                          </td>
                          <td className="text-right text-[#86918a] font-mono text-[11.5px]">{log.lastVisit}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center !py-10 text-[#86918a]">
                          최근 접속 IP 기록이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
