export type InflowType = 'landing' | 'direct' | 'daangn';

export function getCustomerInflow(customer: any): InflowType {
  if (!customer) return 'landing';
  if (customer.inflow === 'daangn' || customer.source === 'daangn') {
    return 'daangn';
  }
  if (customer.inflow === 'direct' || customer.source === 'direct') {
    return 'direct';
  }
  return 'landing';
}

export const INFLOW_META: Record<InflowType, { label: string; shortLabel: string; badgeClass: string }> = {
  landing: {
    label: '랜딩',
    shortLabel: '랜딩',
    badgeClass: 'bg-[#3182F6]/10 text-[#3182F6] border border-[#3182F6]/20',
  },
  direct: {
    label: '직접',
    shortLabel: '직접',
    badgeClass: 'bg-[#F2F4F6] text-[#4E5968] border border-[#E5E8EB]',
  },
  daangn: {
    label: '당근리드폼',
    shortLabel: '당근',
    badgeClass: 'bg-orange-50 text-orange-600 border border-orange-200',
  },
};

export function getTrafficBadgeClass(channel?: string): string {
  if (!channel) return 'bg-gray-50 text-gray-600 border border-gray-200';
  if (channel.startsWith('kakao')) return 'bg-yellow-50 text-yellow-800 border border-yellow-200';
  if (channel.startsWith('phone') || channel === 'sms') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (channel.startsWith('daangn')) return 'bg-orange-50 text-orange-600 border border-orange-200';
  if (channel.startsWith('instagram')) return 'bg-pink-50 text-pink-600 border border-pink-200';
  if (channel.startsWith('facebook') || channel === 'meta_ad') return 'bg-indigo-50 text-indigo-600 border border-indigo-200';
  if (channel.startsWith('naver')) return 'bg-green-50 text-green-700 border border-green-200';
  if (channel.startsWith('google')) return 'bg-sky-50 text-sky-700 border border-sky-200';
  if (channel === 'youtube') return 'bg-red-50 text-red-600 border border-red-200';
  return 'bg-slate-50 text-slate-600 border border-slate-200';
}

export function getCustomerTrafficDetail(customer: any): {
  channel?: string;
  label?: string;
  badgeClass: string;
  tooltip?: string;
} | null {
  if (!customer) return null;
  const label = customer.trafficLabel as string | undefined;
  const channel = customer.trafficChannel as string | undefined;
  if (!label && !channel) return null;

  // Avoid redundant sub-badge for Daangn lead form when inflow is already 'daangn'
  if (getCustomerInflow(customer) === 'daangn' && (label === '당근 리드폼' || channel === 'daangn_ad')) {
    return null;
  }

  const parts: string[] = [];
  if (customer.utmSource) parts.push(`source: ${customer.utmSource}`);
  if (customer.utmMedium) parts.push(`medium: ${customer.utmMedium}`);
  if (customer.utmCampaign) parts.push(`campaign: ${customer.utmCampaign}`);
  if (customer.referrer) parts.push(`referrer: ${customer.referrer}`);

  return {
    channel,
    label: label || channel,
    badgeClass: getTrafficBadgeClass(channel),
    tooltip: parts.length > 0 ? parts.join(' | ') : undefined,
  };
}
