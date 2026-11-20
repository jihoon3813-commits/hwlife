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
