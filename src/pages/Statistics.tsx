import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Users,
  MousePointerClick,
  TrendingUp,
  RefreshCw,
  Globe,
  Compass,
  Smartphone,
  Link2,
  Copy,
  Check,
  Tag,
  ShieldAlert,
} from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { getTrafficBadgeClass } from '../utils/inflow';

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
  { path: '/care', name: 'LG가전구독 (/care)' },
  { path: '/special', name: '스페셜299 (/special)' },
  { path: '/package60', name: '가전상조 60패키지 (/package60)' },
];

export default function Statistics({ channelId }: { channelId?: string }) {
  const [period, setPeriod] = useState('today');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [showLinkBuilder, setShowLinkBuilder] = useState(false);

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
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hyowon.co.kr';
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
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 text-[#3182F6] animate-spin mb-4" />
        <p className="text-[14px] font-bold text-[#4E5968]">통계 데이터를 불러오는 중...</p>
      </div>
    );
  }

  const periodLabel = period === 'today' ? '오늘' : period === 'week' ? '최근 1주일' : '최근 1개월';

  const statCards = [
    {
      label: `${periodLabel} 유입 인원 (UV)`,
      value: stats.summary.uv.toLocaleString(),
      change: stats.summary.uvChange,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      label: `${periodLabel} 페이지 뷰 (PV)`,
      value: stats.summary.pv.toLocaleString(),
      change: stats.summary.pvChange,
      icon: MousePointerClick,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
    {
      label: `${periodLabel} 상담 신청`,
      value: stats.summary.inquiries.toLocaleString(),
      change: stats.summary.inquiryChange,
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
  ];

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
      // Fallback
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 overflow-y-auto no-scrollbar pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h2 className="text-[20px] lg:text-[24px] font-bold text-[#191F28]">통계분석</h2>
          <p className="text-[12px] lg:text-[13px] text-[#8B95A1] mt-1 break-keep">
            실시간 방문자, 상세 유입경로(카톡·문자·당근·인스타·네이버 등) 및 전환 현황을 확인합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => setShowLinkBuilder((prev) => !prev)}
            className={`px-4 py-2.5 rounded-[12px] text-[12px] lg:text-[13px] font-bold flex items-center gap-1.5 border transition-all ${
              showLinkBuilder
                ? 'bg-[#3182F6] text-white border-[#3182F6] shadow-sm'
                : 'bg-white text-[#191F28] border-[#E5E8EB] hover:bg-[#F9FAFB]'
            }`}
          >
            <Link2 className="w-4 h-4" />
            추적 링크 생성기
          </button>
          <div className="flex flex-1 lg:flex-none bg-white rounded-[12px] border border-[#E5E8EB] overflow-hidden p-1 shadow-sm overflow-x-auto">
            {['today', 'week', 'month'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 lg:flex-none px-4 lg:px-5 py-2 text-[12px] lg:text-[13px] font-bold rounded-[8px] transition-all whitespace-nowrap ${
                  period === p ? 'bg-[#F2F4F6] text-[#191F28]' : 'text-[#4E5968] hover:bg-[#F9FAFB]'
                }`}
              >
                {p === 'today' ? '오늘' : p === 'week' ? '1주일' : '1개월'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 추적 링크(UTM) 생성기 */}
      {showLinkBuilder && (
        <div className="bg-white p-5 lg:p-7 rounded-[20px] lg:rounded-[24px] border border-[#3182F6]/30 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-[16px] lg:text-[18px] font-bold flex items-center gap-2 text-[#191F28]">
                <Link2 className="w-5 h-5 text-[#3182F6]" /> 채널별 추적 링크 생성기 (UTM)
              </h3>
              <p className="text-[12px] text-[#8B95A1] mt-1">
                문자(SMS)·카톡·당근·인스타·네이버 등에 아래 생성된 링크를 사용하면 리퍼러가 누락되는 환경에서도 100% 정확히 집계됩니다.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-[#4E5968] mb-1.5">랜딩 페이지</label>
              <select
                value={builderPath}
                onChange={(e) => setBuilderPath(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#E5E8EB] text-[13px] font-medium text-[#191F28] bg-[#F9FAFB] focus:outline-none focus:border-[#3182F6]"
              >
                {landingOptions.map((opt) => (
                  <option key={opt.path} value={opt.path}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#4E5968] mb-1.5">유입 채널</label>
              <select
                value={builderPreset}
                onChange={(e) => setBuilderPreset(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#E5E8EB] text-[13px] font-medium text-[#191F28] bg-[#F9FAFB] focus:outline-none focus:border-[#3182F6]"
              >
                {UTM_CHANNEL_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#4E5968] mb-1.5">캠페인 / 메모 (선택)</label>
              <input
                type="text"
                value={builderCampaign}
                onChange={(e) => setBuilderCampaign(e.target.value)}
                placeholder="예: 11월_공동구매, 당근_동네홍보"
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#E5E8EB] text-[13px] font-medium text-[#191F28] bg-[#F9FAFB] focus:outline-none focus:border-[#3182F6]"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#F2F4F6] p-3 rounded-[14px] border border-[#E5E8EB]">
            <code className="flex-1 text-[12px] text-[#191F28] font-mono break-all px-2">
              {generatedUtmUrl}
            </code>
            <button
              onClick={handleCopyUtmUrl}
              className="shrink-0 px-4 py-2 rounded-[10px] bg-[#3182F6] hover:bg-[#1B64DA] text-white text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedUrl ? '복사됨' : '링크 복사'}
            </button>
          </div>
        </div>
      )}

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          const isPositive = card.change.startsWith('+');
          const isNeutral = card.change === '0%';
          return (
            <div
              key={idx}
              className="bg-white p-5 lg:p-7 rounded-[20px] lg:rounded-[24px] border border-[#E5E8EB] shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4 lg:mb-5">
                <div className={`p-3 lg:p-3.5 rounded-[12px] lg:rounded-[16px] ${card.bg}`}>
                  <Icon className={`w-5 h-5 lg:w-6 lg:h-6 ${card.color}`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-[12px] lg:text-[13px] font-bold px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-full ${
                    isNeutral
                      ? 'bg-gray-50 text-gray-400'
                      : isPositive
                      ? 'bg-green-50 text-green-500'
                      : 'bg-red-50 text-red-500'
                  }`}
                >
                  {isNeutral ? '' : isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                  {card.change}
                </div>
              </div>
              <p className="text-[13px] lg:text-[14px] font-bold text-[#4E5968] mb-1">{card.label}</p>
              <h3 className="text-[24px] lg:text-[32px] font-black text-[#191F28]">{card.value}</h3>
            </div>
          );
        })}
      </div>

      {/* 상세 유입 경로 분석 (카톡/문자/당근/인스타/네이버 등) */}
      <div className="bg-white p-5 lg:p-8 rounded-[20px] lg:rounded-[24px] border border-[#E5E8EB] shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-5">
          <div>
            <h3 className="text-[16px] lg:text-[18px] font-bold flex items-center gap-2 text-[#191F28]">
              <Compass className="w-5 h-5 text-[#3182F6]" /> 유입 채널별 상세 분석
            </h3>
            <p className="text-[12px] text-[#8B95A1] mt-1">
              인앱 브라우저(UA), 광고 클릭ID(fbclid·n_media·gclid), UTM 파라미터, 리퍼러 도메인을 종합 판별합니다.
            </p>
          </div>
          {botVisitsCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#4E5968] bg-[#F2F4F6] px-3 py-1.5 rounded-full">
              <ShieldAlert className="w-3.5 h-3.5 text-[#8B95A1]" />
              검색봇·미리보기 {botVisitsCount.toLocaleString()}건 분리됨
            </span>
          )}
        </div>

        {/* 카테고리 요약 필터 */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setSelectedCategory('전체')}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-all ${
              selectedCategory === '전체'
                ? 'bg-[#191F28] text-white border-[#191F28]'
                : 'bg-[#F9FAFB] text-[#4E5968] border-[#E5E8EB] hover:bg-[#F2F4F6]'
            }`}
          >
            전체 ({trafficChannels.length})
          </button>
          {categorySummary.map((cat: any) => (
            <button
              key={cat.category}
              onClick={() => setSelectedCategory(cat.category)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-all ${
                selectedCategory === cat.category
                  ? 'bg-[#3182F6] text-white border-[#3182F6]'
                  : 'bg-[#F9FAFB] text-[#4E5968] border-[#E5E8EB] hover:bg-[#F2F4F6]'
              }`}
            >
              {cat.category} · {cat.pv.toLocaleString()}회 ({cat.share}%)
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-[16px] border border-[#F2F4F6] hide-scrollbar">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E8EB]">
              <tr>
                <th className="px-5 py-3.5 text-[13px] font-bold text-[#4E5968]">유입 채널</th>
                <th className="px-4 py-3.5 text-[13px] font-bold text-[#4E5968]">카테고리</th>
                <th className="px-4 py-3.5 text-[13px] font-bold text-[#4E5968]">비중</th>
                <th className="px-4 py-3.5 text-[13px] font-bold text-[#4E5968] text-right">유입 (UV)</th>
                <th className="px-4 py-3.5 text-[13px] font-bold text-[#4E5968] text-right">조회 (PV)</th>
                <th className="px-4 py-3.5 text-[13px] font-bold text-[#4E5968] text-right">상담 신청</th>
                <th className="px-5 py-3.5 text-[13px] font-bold text-[#4E5968] text-right">전환율</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F4F6]">
              {filteredChannels.length > 0 ? (
                filteredChannels.map((ch: any) => (
                  <tr key={ch.channel} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-block px-2.5 py-1 rounded-[8px] text-[12px] font-bold ${getTrafficBadgeClass(ch.channel)}`}>
                          {ch.label}
                        </span>
                        {ch.isPaidAd && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold">
                            광고
                          </span>
                        )}
                      </div>
                      {ch.matchReasons && ch.matchReasons.length > 0 && (
                        <div className="text-[11px] text-[#8B95A1] mt-1">
                          판별: {ch.matchReasons.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-medium text-[#4E5968]">{ch.category}</td>
                    <td className="px-4 py-3.5 w-[150px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[#F2F4F6] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#3182F6] rounded-full"
                            style={{ width: `${Math.min(100, ch.share)}%` }}
                          />
                        </div>
                        <span className="text-[12px] font-bold text-[#191F28] w-11 text-right">{ch.share}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[14px] text-[#4E5968] text-right font-medium">
                      {ch.uv.toLocaleString()}명
                    </td>
                    <td className="px-4 py-3.5 text-[14px] text-[#191F28] text-right font-bold">
                      {ch.pv.toLocaleString()}회
                    </td>
                    <td className="px-4 py-3.5 text-[14px] text-[#3182F6] text-right font-black">
                      {ch.inquiries.toLocaleString()}건
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-[13px] font-bold text-[#191F28] bg-[#F2F4F6] px-2.5 py-1 rounded-full">
                        {ch.conversionRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[#8B95A1] text-[13px]">
                    해당 기간의 유입 데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* UTM 캠페인별 상세 (데이터가 있을 때 표시) */}
      {utmCampaigns.length > 0 && (
        <div className="bg-white p-5 lg:p-8 rounded-[20px] lg:rounded-[24px] border border-[#E5E8EB] shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
            <h3 className="text-[16px] lg:text-[18px] font-bold flex items-center gap-2 text-[#191F28]">
              <Tag className="w-5 h-5 text-[#3182F6]" /> 캠페인(UTM)별 유입 및 전환
            </h3>
            <span className="text-[11px] lg:text-[12px] text-[#8B95A1] font-medium">
              추적 링크(UTM)가 포함된 유입 성과입니다.
            </span>
          </div>
          <div className="overflow-x-auto rounded-[16px] border border-[#F2F4F6] hide-scrollbar">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E8EB]">
                <tr>
                  <th className="px-5 py-3.5 text-[13px] font-bold text-[#4E5968]">소스 (utm_source)</th>
                  <th className="px-4 py-3.5 text-[13px] font-bold text-[#4E5968]">매체 (utm_medium)</th>
                  <th className="px-4 py-3.5 text-[13px] font-bold text-[#4E5968]">캠페인 (utm_campaign)</th>
                  <th className="px-4 py-3.5 text-[13px] font-bold text-[#4E5968] text-right">유입 (UV)</th>
                  <th className="px-4 py-3.5 text-[13px] font-bold text-[#4E5968] text-right">조회 (PV)</th>
                  <th className="px-5 py-3.5 text-[13px] font-bold text-[#4E5968] text-right">상담 신청</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F4F6]">
                {utmCampaigns.map((u: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-5 py-3.5 text-[13px] font-bold text-[#191F28]">{u.utmSource}</td>
                    <td className="px-4 py-3.5 text-[13px] text-[#4E5968]">{u.utmMedium}</td>
                    <td className="px-4 py-3.5 text-[13px] text-[#4E5968]">
                      {u.utmCampaign}
                      {u.utmContent !== '-' && <span className="text-[11px] text-[#8B95A1] ml-1.5">({u.utmContent})</span>}
                    </td>
                    <td className="px-4 py-3.5 text-[14px] text-[#4E5968] text-right font-medium">{u.uv.toLocaleString()}명</td>
                    <td className="px-4 py-3.5 text-[14px] text-[#191F28] text-right font-bold">{u.pv.toLocaleString()}회</td>
                    <td className="px-5 py-3.5 text-[14px] text-[#3182F6] text-right font-black">{u.inquiries.toLocaleString()}건</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 접속 기기 & 브라우저(인앱) 환경 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 lg:p-8 rounded-[20px] lg:rounded-[24px] border border-[#E5E8EB] shadow-sm">
          <h3 className="text-[16px] lg:text-[17px] font-bold mb-5 text-[#191F28] flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#3182F6]" /> 접속 기기 분포
          </h3>
          <div className="space-y-3">
            {deviceBreakdown.length > 0 ? (
              deviceBreakdown.map((d: any) => (
                <div key={d.deviceType} className="bg-[#F9FAFB] p-4 rounded-[14px] border border-[#F2F4F6]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[13px] font-bold text-[#191F28]">{d.deviceType}</span>
                    <span className="text-[13px] font-bold text-[#3182F6]">
                      {d.count.toLocaleString()}회 ({d.share}%)
                    </span>
                  </div>
                  <div className="h-2 bg-[#E5E8EB] rounded-full overflow-hidden">
                    <div className="h-full bg-[#3182F6] rounded-full" style={{ width: `${Math.min(100, d.share)}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-[#8B95A1] text-[13px]">데이터가 없습니다.</div>
            )}
          </div>
        </div>

        <div className="bg-white p-5 lg:p-8 rounded-[20px] lg:rounded-[24px] border border-[#E5E8EB] shadow-sm">
          <h3 className="text-[16px] lg:text-[17px] font-bold mb-5 text-[#191F28] flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#3182F6]" /> 브라우저 / 인앱 환경
          </h3>
          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
            {browserBreakdown.length > 0 ? (
              browserBreakdown.map((b: any) => (
                <div
                  key={b.browser}
                  className="flex justify-between items-center bg-[#F9FAFB] px-4 py-3 rounded-[12px] border border-[#F2F4F6]"
                >
                  <span className="text-[13px] font-bold text-[#191F28]">{b.browser}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-[#8B95A1] font-medium">{b.share}%</span>
                    <span className="text-[13px] font-black text-[#191F28] bg-white px-2.5 py-0.5 rounded-[8px] border border-[#E5E8EB]">
                      {b.count.toLocaleString()}회
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-[#8B95A1] text-[13px]">데이터가 없습니다.</div>
            )}
          </div>
        </div>
      </div>

      {/* 최근 7일 통계 */}
      <div className="bg-white p-5 lg:p-8 rounded-[20px] lg:rounded-[24px] border border-[#E5E8EB] shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <h3 className="text-[16px] lg:text-[18px] font-bold flex items-center gap-2 text-[#191F28]">
            <BarChart3 className="w-5 h-5 text-[#3182F6]" /> 최근 7일 통계
          </h3>
          <span className="text-[11px] lg:text-[12px] text-[#8B95A1] font-medium">최근 일주일간의 데이터입니다.</span>
        </div>
        <div className="overflow-x-auto rounded-[16px] border border-[#F2F4F6] hide-scrollbar">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E8EB]">
              <tr>
                <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">일자</th>
                <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968] text-right">유입 인원 (UV)</th>
                <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968] text-right">페이지 뷰 (PV)</th>
                <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968] text-right">상담 신청</th>
                <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968] text-right">전환율</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F4F6]">
              {stats.dailyStats.map((stat, idx) => (
                <tr key={idx} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-6 py-4 text-[14px] font-bold text-[#191F28]">{stat.date}</td>
                  <td className="px-6 py-4 text-[14px] text-[#4E5968] text-right font-medium">{stat.uv.toLocaleString()}명</td>
                  <td className="px-6 py-4 text-[14px] text-[#4E5968] text-right font-medium">{stat.pv.toLocaleString()}회</td>
                  <td className="px-6 py-4 text-[14px] font-black text-[#3182F6] text-right">{stat.applies.toLocaleString()}건</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[14px] font-bold text-[#191F28] bg-[#F2F4F6] px-3 py-1 rounded-full">
                      {stat.uv > 0 ? ((stat.applies / stat.uv) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 랜딩페이지별 유입 현황 */}
      <div className="bg-white p-5 lg:p-8 rounded-[20px] lg:rounded-[24px] border border-[#E5E8EB] shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <h3 className="text-[16px] lg:text-[18px] font-bold flex items-center gap-2 text-[#191F28]">
            <Globe className="w-5 h-5 text-[#3182F6]" /> 랜딩페이지별 유입 현황
          </h3>
          <span className="text-[11px] lg:text-[12px] text-[#8B95A1] font-medium">접속 경로별 실시간 유입 분석입니다.</span>
        </div>
        <div className="overflow-x-auto rounded-[16px] border border-[#F2F4F6] hide-scrollbar">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E8EB]">
              <tr>
                <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">랜딩페이지명</th>
                <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">접속 경로 (Path)</th>
                <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968] text-right">유입 인원 (UV)</th>
                <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968] text-right">페이지 뷰 (PV)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F4F6]">
              {stats.landingStats && stats.landingStats.length > 0 ? (
                stats.landingStats.map((lStat: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-6 py-4 text-[14px] font-bold text-[#191F28]">{lStat.name}</td>
                    <td className="px-6 py-4 text-[13px] text-[#4E5968] font-mono">{lStat.path}</td>
                    <td className="px-6 py-4 text-[14px] text-[#4E5968] text-right font-medium">{lStat.uv.toLocaleString()}명</td>
                    <td className="px-6 py-4 text-[14px] text-[#3182F6] text-right font-black">{lStat.pv.toLocaleString()}회</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-[#8B95A1] text-[13px]">데이터가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 유입 경로 (Top 10 Referrer) & 최근 접속 IP 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 lg:p-8 rounded-[20px] lg:rounded-[24px] border border-[#E5E8EB] shadow-sm">
          <h3 className="text-[16px] lg:text-[17px] font-bold mb-6 text-[#191F28]">유입 경로 (Top 10 Referrer)</h3>
          <div className="space-y-3">
            {stats.referrers.length > 0 ? (
              stats.referrers.map((ref: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-center gap-3 bg-[#F9FAFB] p-4 rounded-[16px] border border-[#F2F4F6] hover:border-[#3182F6]/30 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    {ref.label && (
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold mb-1 ${getTrafficBadgeClass(ref.channel)}`}>
                        {ref.label}
                      </span>
                    )}
                    <div className="text-[13px] font-bold text-[#4E5968] truncate" title={ref.url}>
                      {ref.url}
                    </div>
                  </div>
                  <div className="shrink-0 text-[14px] font-black text-[#191F28] bg-white px-3 py-1 rounded-[8px] shadow-sm border border-[#E5E8EB]">
                    {ref.count.toLocaleString()}건
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-[#8B95A1] text-[13px]">데이터가 없습니다.</div>
            )}
          </div>
        </div>

        <div className="bg-white p-5 lg:p-8 rounded-[20px] lg:rounded-[24px] border border-[#E5E8EB] shadow-sm">
          <h3 className="text-[16px] lg:text-[17px] font-bold mb-6 text-[#191F28]">최근 접속 IP 현황</h3>
          <div className="overflow-x-auto rounded-[16px] border border-[#F2F4F6] hide-scrollbar">
            <table className="w-full text-left min-w-[300px]">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E8EB]">
                <tr>
                  <th className="px-4 py-3 text-[12px] font-bold text-[#4E5968]">IP 주소</th>
                  <th className="px-4 py-3 text-[12px] font-bold text-[#4E5968] text-center">건수</th>
                  <th className="px-4 py-3 text-[12px] font-bold text-[#4E5968] text-right">최근 접속</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F4F6]">
                {stats.ipLogs.length > 0 ? (
                  stats.ipLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-[#F9FAFB]">
                      <td className="px-4 py-3 text-[13px] text-[#191F28] font-bold">{log.ip}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[12px] font-bold text-[#3182F6] bg-[#E8F3FF] px-2 py-0.5 rounded-md">
                          {log.count}회
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#8B95A1] text-right font-medium">{log.lastVisit}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-10 text-[#8B95A1] text-[13px]">데이터가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
