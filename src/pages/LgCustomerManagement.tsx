import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Search, History, RefreshCw, Trash2, Save, Plus, Smartphone, Send, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { LG_OFFICIAL_PRODUCTS } from '../data/lgCareProducts';
import { getCustomerInflow, INFLOW_META, InflowType } from '../utils/inflow';
import DaangnLeadModal from '../components/DaangnLeadModal';

const getFilterDateRange = (filter: string, customStart?: string, customEnd?: string) => {
  const now = new Date();
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = kstTime.getUTCFullYear();
  const month = kstTime.getUTCMonth();
  const date = kstTime.getUTCDate();

  const getKstMs = (y: number, m: number, d: number, hr = 0, min = 0, sec = 0, ms = 0) => {
    return Date.UTC(y, m, d, hr, min, sec, ms) - 9 * 60 * 60 * 1000;
  };

  const todayStart = getKstMs(year, month, date, 0, 0, 0, 0);
  const todayEnd = getKstMs(year, month, date, 23, 59, 59, 999);

  switch (filter) {
    case 'today':
      return { start: todayStart, end: todayEnd };
    case 'yesterday': {
      const yesterdayStart = getKstMs(year, month, date - 1, 0, 0, 0, 0);
      const yesterdayEnd = getKstMs(year, month, date - 1, 23, 59, 59, 999);
      return { start: yesterdayStart, end: yesterdayEnd };
    }
    case '1week': {
      const oneWeekStart = getKstMs(year, month, date - 7 + 1, 0, 0, 0, 0);
      return { start: oneWeekStart, end: todayEnd };
    }
    case 'thisMonth': {
      const thisMonthStart = getKstMs(year, month, 1, 0, 0, 0, 0);
      return { start: thisMonthStart, end: todayEnd };
    }
    case 'lastMonth': {
      const lastMonthStart = getKstMs(year, month - 1, 1, 0, 0, 0, 0);
      const lastMonthEnd = getKstMs(year, month, 0, 23, 59, 59, 999);
      return { start: lastMonthStart, end: lastMonthEnd };
    }
    case '3months': {
      const start = getKstMs(year, month - 3, date, 0, 0, 0, 0);
      return { start, end: todayEnd };
    }
    case '6months': {
      const start = getKstMs(year, month - 6, date, 0, 0, 0, 0);
      return { start, end: todayEnd };
    }
    case 'custom': {
      if (!customStart || !customEnd) return { start: 0, end: Infinity };
      const [sYear, sMonth, sDate] = customStart.split('-').map(Number);
      const [eYear, eMonth, eDate] = customEnd.split('-').map(Number);
      const start = getKstMs(sYear, sMonth - 1, sDate, 0, 0, 0, 0);
      const end = getKstMs(eYear, eMonth - 1, eDate, 23, 59, 59, 999);
      return { start, end };
    }
    default:
      return { start: 0, end: Infinity };
  }
};

export const isLgCareCustomer = (customer: any): boolean => {
  if (!customer) return false;
  return (
    customer.source === 'lg_care' ||
    customer.productName?.includes('LG구독') ||
    customer.productName?.includes('LG가전구독') ||
    customer.productName?.includes('LG가전 구독') ||
    customer.productName?.includes('LG가전 구독 할인 전용') ||
    customer.productName?.includes('할인코드') ||
    customer.appliance?.includes('할인코드') ||
    customer.appliance?.includes('퓨리케어') ||
    customer.appliance?.includes('에어로타워') ||
    (Boolean(customer.productName?.startsWith('LG')) && !customer.productName?.includes('('))
  );
};

interface ResolvedLgOptions {
  periods: string[];
  cycles: string[];
  types: string[];
}

const isOfficialLgApplianceText = (val: string, lgDbProducts?: any[]): boolean => {
  if (!val) return false;
  if (val === '상담 시 제품선택 (전문 상담원 맞춤 추천)') return true;
  if (LG_OFFICIAL_PRODUCTS.some(p => `[${p.categoryName}] ${p.name} (${p.model})` === val || p.model === val)) {
    return true;
  }
  if (lgDbProducts?.some(p => `[${p.category}] ${p.name} (${p.model})` === val || p.model === val)) {
    return true;
  }
  return false;
};

const resolveLgProductOptions = (applianceVal: string, lgDbProducts?: any[]): ResolvedLgOptions | null => {
  if (!applianceVal || applianceVal === '상담 시 제품선택 (전문 상담원 맞춤 추천)') return null;

  const dbMatch = lgDbProducts?.find(
    p => `[${p.category}] ${p.name} (${p.model})` === applianceVal || p.model === applianceVal
  );
  const officialMatch = LG_OFFICIAL_PRODUCTS.find(
    p => `[${p.categoryName}] ${p.name} (${p.model})` === applianceVal || p.model === applianceVal
  );

  const matched: any = dbMatch || officialMatch;
  if (!matched) return null;

  const subOpts = matched.subscriptionOptions;

  const periods: string[] = [];
  if (subOpts?.contractTerms?.length) {
    subOpts.contractTerms.forEach((t: any) => {
      const label = t.label || (t.value === '60' ? '5년' : t.value === '72' ? '6년' : t.value);
      if (label && !periods.includes(label)) periods.push(label);
    });
  }
  if (periods.length === 0) {
    periods.push('5년', '6년');
  }

  const cycles: string[] = [];
  if (subOpts?.careServiceCycles?.length) {
    subOpts.careServiceCycles.forEach((c: any) => {
      const label = c.label || c.value;
      if (label && !cycles.includes(label)) cycles.push(label);
    });
  } else if (matched.careCycles?.length) {
    matched.careCycles.forEach((c: string) => {
      if (c && !cycles.includes(c)) cycles.push(c);
    });
  } else if (matched.careCycle) {
    cycles.push(matched.careCycle);
  }

  const types: string[] = [];
  if (subOpts?.careServiceTypes?.length) {
    subOpts.careServiceTypes.forEach((t: any) => {
      const label = t.accentLabel ? `[${t.accentLabel}] ${t.label}` : (t.label || t.value);
      if (label && !types.includes(label)) types.push(label);
    });
  } else if (matched.careTypes?.length) {
    matched.careTypes.forEach((t: string) => {
      if (t && !types.includes(t)) types.push(t);
    });
  }

  return { periods, cycles, types };
};

interface LgOptionValues {
  appliance: string;
  account: string;
  subscriptionPeriod: string;
  careCycle: string;
  careType: string;
  supplier?: string;
}

interface LgApplianceOptionFieldsProps {
  value: LgOptionValues;
  onChange: (patch: Partial<LgOptionValues>) => void;
  lgProductsByCategory: Record<string, typeof LG_OFFICIAL_PRODUCTS>;
  lgDbProducts?: any[];
  showSupplier?: boolean;
}

const ACCOUNT_PRESETS = ['1구좌', '2구좌', '3구좌', '4구좌'];
const PERIOD_PRESETS = ['5년', '6년'];

function LgApplianceOptionFields({
  value,
  onChange,
  lgProductsByCategory,
  lgDbProducts,
  showSupplier = true,
}: LgApplianceOptionFieldsProps) {
  const isCatalogMatch = isOfficialLgApplianceText(value.appliance, lgDbProducts);
  const [forceDirectAppliance, setForceDirectAppliance] = useState<boolean>(
    () => Boolean(value.appliance) && !isCatalogMatch
  );
  const [forceDirectAccount, setForceDirectAccount] = useState<boolean>(
    () => Boolean(value.account) && !ACCOUNT_PRESETS.includes(value.account)
  );

  // Sync direct mode when switching selectedCustomer
  useEffect(() => {
    const matched = isOfficialLgApplianceText(value.appliance, lgDbProducts);
    setForceDirectAppliance(Boolean(value.appliance) && !matched);
  }, [value.appliance, lgDbProducts]);

  useEffect(() => {
    setForceDirectAccount(Boolean(value.account) && !ACCOUNT_PRESETS.includes(value.account));
  }, [value.account]);

  const resolvedOpts = useMemo(
    () => (forceDirectAppliance ? null : resolveLgProductOptions(value.appliance, lgDbProducts)),
    [forceDirectAppliance, value.appliance, lgDbProducts]
  );

  const handleSelectApplianceChange = (selected: string) => {
    if (selected === '__DIRECT__') {
      setForceDirectAppliance(true);
      onChange({
        appliance: '',
        subscriptionPeriod: value.subscriptionPeriod || '5년',
      });
      return;
    }

    setForceDirectAppliance(false);
    const opts = resolveLgProductOptions(selected, lgDbProducts);
    if (opts) {
      onChange({
        appliance: selected,
        supplier: value.supplier || 'TU',
        subscriptionPeriod: opts.periods[0] || '',
        careCycle: opts.cycles[0] || '',
        careType: opts.types[0] || '',
      });
    } else {
      onChange({
        appliance: selected,
        supplier: value.supplier || 'TU',
      });
    }
  };

  const selectValue = forceDirectAppliance ? '__DIRECT__' : (value.appliance || '');
  const accountSelectValue = forceDirectAccount
    ? '__DIRECT__'
    : (ACCOUNT_PRESETS.includes(value.account) ? value.account : (value.account ? '__DIRECT__' : '1구좌'));

  return (
    <div className="space-y-3">
      {/* 결합 가전명 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[12px] font-medium text-[#8B95A1]">결합 가전명 (제품명, 모델명)</label>
          {forceDirectAppliance && (
            <button
              type="button"
              onClick={() => {
                setForceDirectAppliance(false);
                onChange({ appliance: '' });
              }}
              className="text-[11px] font-bold text-[#3182F6] hover:underline"
            >
              목록에서 선택하기
            </button>
          )}
        </div>
        <select
          value={selectValue}
          onChange={e => handleSelectApplianceChange(e.target.value)}
          className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]"
        >
          <option value="">가전 선택</option>
          <option value="__DIRECT__">✏️ 직접 입력</option>
          <option value="상담 시 제품선택 (전문 상담원 맞춤 추천)">상담 시 제품선택 (전문 상담원 맞춤 추천)</option>
          {Object.entries(lgProductsByCategory).map(([catName, prods]) => (
            <optgroup key={catName} label={`LG 가전구독 - ${catName} (${prods.length})`}>
              {prods.map(p => {
                const itemText = `[${p.categoryName}] ${p.name} (${p.model})`;
                return (
                  <option key={p.id} value={itemText}>
                    {itemText}
                  </option>
                );
              })}
            </optgroup>
          ))}
        </select>

        {forceDirectAppliance && (
          <input
            type="text"
            value={value.appliance || ''}
            onChange={e => onChange({ appliance: e.target.value })}
            placeholder="예: LG 퓨리케어 오브제컬렉션 정수기 (WD507ACB)"
            className="mt-2 w-full bg-white border border-[#3182F6]/40 px-3 py-2 rounded-[8px] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#3182F6]/20"
          />
        )}
      </div>

      {/* 상조 구좌수 / 구독기간(5년/6년) / 공급사 */}
      <div className={`grid grid-cols-1 ${showSupplier ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
        <div>
          <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">상조 구좌수</label>
          <select
            value={accountSelectValue}
            onChange={e => {
              const val = e.target.value;
              if (val === '__DIRECT__') {
                setForceDirectAccount(true);
                onChange({ account: '' });
              } else {
                setForceDirectAccount(false);
                onChange({ account: val });
              }
            }}
            className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px] font-bold text-[#191F28]"
          >
            {ACCOUNT_PRESETS.map(acc => (
              <option key={acc} value={acc}>{acc}</option>
            ))}
            <option value="__DIRECT__">직접 입력</option>
          </select>
          {forceDirectAccount && (
            <input
              type="text"
              value={value.account || ''}
              onChange={e => onChange({ account: e.target.value })}
              placeholder="예: 2구좌"
              className="mt-1.5 w-full bg-white border border-[#3182F6]/40 px-3 py-1.5 rounded-[8px] text-[13px]"
            />
          )}
        </div>

        <div>
          <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">구독 기간 (5년/6년)</label>
          {resolvedOpts && resolvedOpts.periods.length > 0 ? (
            <select
              value={value.subscriptionPeriod || ''}
              onChange={e => onChange({ subscriptionPeriod: e.target.value })}
              className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px] font-bold text-[#191F28]"
            >
              <option value="">기간 선택</option>
              {resolvedOpts.periods.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
              {value.subscriptionPeriod && !resolvedOpts.periods.includes(value.subscriptionPeriod) && (
                <option value={value.subscriptionPeriod}>{value.subscriptionPeriod}</option>
              )}
            </select>
          ) : (
            <div className="space-y-1.5">
              <div className="flex gap-1.5">
                {PERIOD_PRESETS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onChange({ subscriptionPeriod: p })}
                    className={`flex-1 py-1.5 rounded-[8px] text-[12px] font-bold border transition-colors ${
                      value.subscriptionPeriod === p
                        ? 'bg-[#191F28] text-white border-[#191F28]'
                        : 'bg-[#F9FAFB] text-[#4E5968] border-[#E5E8EB] hover:bg-[#F2F4F6]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={value.subscriptionPeriod || ''}
                onChange={e => onChange({ subscriptionPeriod: e.target.value })}
                placeholder="직접 입력 (예: 5년, 6년)"
                className="w-full bg-white border border-[#E5E8EB] px-3 py-1.5 rounded-[8px] text-[12px]"
              />
            </div>
          )}
        </div>

        {showSupplier && (
          <div>
            <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">공급사</label>
            <select
              value={value.supplier || '라이프앤조이'}
              onChange={e => onChange({ supplier: e.target.value })}
              className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px] font-bold text-[#191F28]"
            >
              <option value="TU">TU</option>
              <option value="BSON">BSON</option>
              <option value="신한48">신한48</option>
              <option value="KCC">KCC</option>
              <option value="라이프앤조이">라이프앤조이</option>
              <option value="기타">기타</option>
            </select>
          </div>
        )}
      </div>

      {/* 케어서비스 주기 & 유형 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">케어서비스 주기</label>
          {resolvedOpts && resolvedOpts.cycles.length > 0 ? (
            <select
              value={value.careCycle || ''}
              onChange={e => onChange({ careCycle: e.target.value })}
              className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]"
            >
              <option value="">주기 선택</option>
              {resolvedOpts.cycles.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
              {value.careCycle && !resolvedOpts.cycles.includes(value.careCycle) && (
                <option value={value.careCycle}>{value.careCycle}</option>
              )}
            </select>
          ) : (
            <input
              type="text"
              value={value.careCycle || ''}
              onChange={e => onChange({ careCycle: e.target.value })}
              placeholder="직접 입력 (예: 1회 / 12개월, 방문없음)"
              className="w-full bg-white border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]"
            />
          )}
        </div>

        <div>
          <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">케어서비스 유형</label>
          {resolvedOpts && resolvedOpts.types.length > 0 ? (
            <select
              value={value.careType || ''}
              onChange={e => onChange({ careType: e.target.value })}
              className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]"
            >
              <option value="">유형 선택</option>
              {resolvedOpts.types.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
              {value.careType && !resolvedOpts.types.includes(value.careType) && (
                <option value={value.careType}>{value.careType}</option>
              )}
            </select>
          ) : (
            <input
              type="text"
              value={value.careType || ''}
              onChange={e => onChange({ careType: e.target.value })}
              placeholder="직접 입력 (예: 방문관리, 자가관리)"
              className="w-full bg-white border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function LgCustomerManagement({ channelId }: { channelId?: string }) {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [memo, setMemo] = useState('');
  const [status, setStatus] = useState('대기');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [inflowFilter, setInflowFilter] = useState<'all' | InflowType>('all');
  const [isDaangnModalOpen, setIsDaangnModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSendingSms, setIsSendingSms] = useState(false);

  // Local state for editing details
  const [editData, setEditData] = useState<any>({});
  const [selectedChannelId, setSelectedChannelId] = useState<string>('all');

  // Date filter state
  const getKstTodayStr = () => {
    const d = new Date();
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    return kst.toISOString().split('T')[0];
  };

  const [dateFilter, setDateFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>(getKstTodayStr());
  const [endDate, setEndDate] = useState<string>(getKstTodayStr());

  // Direct Registration State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerList, setRegisterList] = useState<any[]>([]);
  const [registerForm, setRegisterForm] = useState<any>({
    channelId: '본사',
    name: '',
    phone: '',
    productName: 'LG구독할인(new)',
    account: '1구좌',
    appliance: '',
    supplier: '라이프앤조이',
    subscriptionPeriod: '',
    careCycle: '',
    careType: '',
    birth: '',
    gender: '',
    address: '',
    detailAddress: ''
  });

  const settings = useQuery(api.settings.get);
  const channels = useQuery(api.channels.get);

  const subChannelIds = useQuery(
    api.channels.getSubChannelIds,
    channelId ? { subdomain: channelId } : 'skip'
  );

  const inquiries = useQuery(
    api.inquiries.list,
    channelId
      ? (subChannelIds ? { channelIds: subChannelIds } : 'skip')
      : {}
  );

  const updateInquiry = useMutation(api.inquiries.update);
  const removeInquiry = useMutation(api.inquiries.remove);
  const createInquiry = useMutation(api.inquiries.create);
  const allProducts = useQuery(api.products.getAllProducts);
  const lgDbProducts = useQuery(api.lgProducts.getAll);
  const sendConsentSms = useAction(api.sms.sendConsentSms);
  const landings = useQuery(api.landings.get);
  const allPlans = useQuery(api.plans.get);

  // LG구독 고객만 필터링
  const lgInquiries = useMemo(() => {
    if (!inquiries) return undefined;
    return inquiries.filter(isLgCareCustomer);
  }, [inquiries]);

  // Column Resizing Setup
  const DEFAULT_COLUMNS = useMemo(() => [
    { id: 'index', label: '순번', minWidth: 45, defaultWidth: 55, align: 'center' as const },
    { id: 'checkbox', label: '', minWidth: 40, defaultWidth: 45, align: 'center' as const },
    { id: 'source', label: '유입경로', minWidth: 65, defaultWidth: 85, align: 'center' as const },
    { id: 'createdAt', label: '등록일시', minWidth: 100, defaultWidth: 125, align: 'left' as const },
    { id: 'channel', label: '채널명', minWidth: 80, defaultWidth: 100, align: 'left' as const },
    { id: 'name', label: '고객명', minWidth: 70, defaultWidth: 90, align: 'left' as const },
    { id: 'phone', label: '연락처', minWidth: 110, defaultWidth: 125, align: 'left' as const },
    { id: 'address', label: '주소', minWidth: 140, defaultWidth: 200, align: 'left' as const },
    { id: 'productName', label: '신청상품', minWidth: 140, defaultWidth: 220, align: 'left' as const },
    { id: 'appliance', label: '결합제품', minWidth: 160, defaultWidth: 260, align: 'left' as const },
    { id: 'supplier', label: '공급사', minWidth: 70, defaultWidth: 90, align: 'center' as const },
    { id: 'status', label: '진행상태', minWidth: 75, defaultWidth: 95, align: 'center' as const },
  ], []);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('lg_customer_table_column_widths');
      if (saved) {
        const parsed = JSON.parse(saved);
        const initial: Record<string, number> = {};
        [
          { id: 'index', defaultWidth: 55 },
          { id: 'checkbox', defaultWidth: 45 },
          { id: 'source', defaultWidth: 60 },
          { id: 'createdAt', defaultWidth: 125 },
          { id: 'channel', defaultWidth: 100 },
          { id: 'name', defaultWidth: 90 },
          { id: 'phone', defaultWidth: 125 },
          { id: 'address', defaultWidth: 200 },
          { id: 'productName', defaultWidth: 220 },
          { id: 'appliance', defaultWidth: 260 },
          { id: 'supplier', defaultWidth: 90 },
          { id: 'status', defaultWidth: 95 },
        ].forEach(col => {
          initial[col.id] = parsed[col.id] || col.defaultWidth;
        });
        return initial;
      }
    } catch (e) {}
    return {
      index: 55,
      checkbox: 45,
      source: 60,
      createdAt: 125,
      channel: 100,
      name: 90,
      phone: 125,
      address: 200,
      productName: 220,
      appliance: 260,
      supplier: 90,
      status: 95,
    };
  });

  const resizingRef = useRef<{ colId: string; startX: number; startWidth: number; minWidth: number } | null>(null);

  const handleResizeStart = (colId: string, minWidth: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[colId] || 100;
    resizingRef.current = { colId, startX, startWidth, minWidth };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingRef.current) return;
      const { colId: currentColId, startX: cStartX, startWidth: cStartWidth, minWidth: cMinWidth } = resizingRef.current;
      const delta = moveEvent.clientX - cStartX;
      const newWidth = Math.max(cMinWidth, cStartWidth + delta);
      setColumnWidths(prev => ({ ...prev, [currentColId]: newWidth }));
    };

    const handleMouseUp = () => {
      if (resizingRef.current) {
        setColumnWidths(current => {
          try {
            localStorage.setItem('lg_customer_table_column_widths', JSON.stringify(current));
          } catch (e) {}
          return current;
        });
        resizingRef.current = null;
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleResetColumnWidths = () => {
    const defaults = {
      index: 55,
      checkbox: 45,
      source: 60,
      createdAt: 125,
      channel: 100,
      name: 90,
      phone: 125,
      address: 200,
      productName: 220,
      appliance: 260,
      supplier: 90,
      status: 95,
    };
    setColumnWidths(defaults);
    try {
      localStorage.removeItem('lg_customer_table_column_widths');
    } catch (e) {}
  };

  // 공급사 계산 함수
  const getSupplier = (customer: any): string => {
    if (customer.supplier && String(customer.supplier).trim() !== '' && customer.supplier !== '-') {
      return String(customer.supplier).trim();
    }
    return '라이프앤조이';
  };

  // Group LG Official Products by categoryName
  const lgProductsByCategory = useMemo(() => {
    const groups: Record<string, typeof LG_OFFICIAL_PRODUCTS> = {};
    LG_OFFICIAL_PRODUCTS?.forEach(p => {
      const cat = p.categoryName || '기타';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      const resolvedCategoryName = selectedCustomer.productName || 'LG구독할인(new)';
      const resolvedAccount = selectedCustomer.account || '1구좌';
      let initialAppliance = selectedCustomer.appliance || '';
      if (initialAppliance) {
        initialAppliance = initialAppliance.replace(/\s*\[효원상조\s*\d+구좌\s*결합[^\]]*\]/g, '').trim();
      }
      const initialSupplier = selectedCustomer.supplier || getSupplier(selectedCustomer) || '라이프앤조이';

      setEditData({
        ...selectedCustomer,
        newRegDate: selectedCustomer.newRegDate || new Date(selectedCustomer.createdAt + 9 * 60 * 60 * 1000).toISOString().split('T')[0],
        productName: resolvedCategoryName,
        account: resolvedAccount,
        appliance: initialAppliance,
        supplier: initialSupplier,
        subscriptionPeriod: selectedCustomer.subscriptionPeriod || '',
        careCycle: selectedCustomer.careCycle || '',
        careType: selectedCustomer.careType || '',
      });
      setStatus(selectedCustomer.status);
      setMemo('');
    }
  }, [selectedCustomer]);

  const openPostcode = () => {
    if (!(window as any).daum || !(window as any).daum.Postcode) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    new (window as any).daum.Postcode({
      oncomplete: function (data: any) {
        let fullAddr = data.roadAddress || data.jibunAddress;
        let extraAddr = '';

        if (data.addressType === 'R') {
          if (data.bname !== '') {
            extraAddr += data.bname;
          }
          if (data.buildingName !== '') {
            extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
          }
          fullAddr += (extraAddr !== '' ? ' (' + extraAddr + ')' : '');
        }

        setEditData((prev: any) => ({
          ...prev,
          address: fullAddr
        }));
      }
    }).open();
  };

  const openRegisterPostcode = () => {
    if (!(window as any).daum || !(window as any).daum.Postcode) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    new (window as any).daum.Postcode({
      oncomplete: function (data: any) {
        let fullAddr = data.roadAddress || data.jibunAddress;
        let extraAddr = '';

        if (data.addressType === 'R') {
          if (data.bname !== '') {
            extraAddr += data.bname;
          }
          if (data.buildingName !== '') {
            extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
          }
          fullAddr += (extraAddr !== '' ? ' (' + extraAddr + ')' : '');
        }

        setRegisterForm((prev: any) => ({
          ...prev,
          address: fullAddr
        }));
      }
    }).open();
  };

  const formatBirthDate = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 4) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 4)}-${numbers.slice(4, 6)}`;
  };

  const handleAddToList = () => {
    if (registerForm.name && registerForm.phone) {
      setRegisterList([...registerList, { ...registerForm, id: Date.now(), source: 'lg_care', inflow: 'direct' }]);
      setRegisterForm({
        channelId: channelId || '본사',
        name: '',
        phone: '',
        productName: 'LG구독할인(new)',
        account: '1구좌',
        appliance: '',
        supplier: '라이프앤조이',
        subscriptionPeriod: '',
        careCycle: '',
        careType: '',
        birth: '',
        gender: '',
        address: '',
        detailAddress: ''
      });
    } else {
      alert('고객명과 연락처는 필수 입력 사항입니다.');
    }
  };

  const handleRemoveFromList = (id: number) => {
    setRegisterList(registerList.filter(item => item.id !== id));
  };

  const handleBulkRegister = async () => {
    if (registerList.length === 0) return;
    if (confirm(`${registerList.length}명의 LG구독 고객을 등록하시겠습니까?`)) {
      try {
        for (const item of registerList) {
          const { id, ...data } = item;
          await createInquiry(data);
        }
        alert('모든 고객이 등록되었습니다.');
        setRegisterList([]);
        setIsRegisterModalOpen(false);
      } catch (e) {
        console.error(e);
        alert('등록 중 오류가 발생했습니다.');
      }
    }
  };

  const handleOpenRegisterModal = () => {
    setRegisterForm({
      channelId: channelId || '본사',
      name: '',
      phone: '',
      productName: 'LG구독할인(new)',
      account: '1구좌',
      appliance: '',
      supplier: '라이프앤조이',
      subscriptionPeriod: '',
      careCycle: '',
      careType: '',
      birth: '',
      gender: '',
      address: '',
      detailAddress: ''
    });
    setIsRegisterModalOpen(true);
  };

  const handleSendConsent = async () => {
    if (!selectedCustomer) return;

    const smsConfig = (settings as any)?.sms;
    if (!smsConfig || !smsConfig.apiKey || !smsConfig.userId || !smsConfig.sender) {
      alert('SMS 설정이 완료되지 않았습니다.\n환경설정 > SMS 설정에서 알리고 API 정보를 먼저 입력해주세요.');
      return;
    }

    if (!window.confirm(`${selectedCustomer.name}님에게 동의서 문자를 발송하시겠습니까?`)) return;

    setIsSendingSms(true);
    try {
      const result = await sendConsentSms({
        inquiryId: selectedCustomer._id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        productName: editData.productName,
      });
      alert(result.message || '문자 발송이 완료되었습니다.');
    } catch (e: any) {
      alert(e.message || '발송 중 오류가 발생했습니다.');
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCustomer) return;
    try {
      const { _id, _creationTime, createdAt, message, ...validUpdates } = editData;
      const updates: any = { ...validUpdates, status };

      if (memo.trim()) {
        let writerName = '관리자';
        try {
          const savedProxy = sessionStorage.getItem('admin_proxy_user');
          if (savedProxy && savedProxy !== 'null') {
            const user = JSON.parse(savedProxy);
            writerName = user.channelName || user.accountId || '관리자';
          } else {
            const saved = localStorage.getItem('admin_user');
            if (saved && saved !== 'null') {
              const user = JSON.parse(saved);
              writerName = user.channelName || user.accountId || '관리자';
            }
          }
        } catch (e) {
          console.error('Failed to get current user info:', e);
        }

        const newHistory = {
          date: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0],
          status,
          memo: memo.trim(),
          writer: writerName
        };
        updates.memoHistory = [...(selectedCustomer.memoHistory || []), newHistory];
      }

      await updateInquiry({ id: selectedCustomer._id, ...updates });
      alert('저장되었습니다.');
      setSelectedCustomer(null);
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    if (confirm('정말로 이 고객 정보를 삭제하시겠습니까?')) {
      await removeInquiry({ id: selectedCustomer._id });
      setSelectedCustomer(null);
      setSelectedIds(prev => prev.filter(id => id !== selectedCustomer._id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`선택한 ${selectedIds.length}명의 고객 정보를 삭제하시겠습니까?`)) {
      for (const id of selectedIds) {
        await removeInquiry({ id: id as any });
      }
      setSelectedIds([]);
    }
  };

  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    }
    if (phoneNumberLength < 11) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
    }
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  const getStatusStyle = (statusName: string) => {
    const statusSetting = settings?.statuses?.find((s: any) => s.name === statusName);
    if (statusSetting && statusSetting.color) {
      const hex = statusSetting.color;
      let textColor = '#4E5968';
      try {
        const color = hex.replace('#', '');
        const r = parseInt(color.substring(0, 2), 16);
        const g = parseInt(color.substring(2, 4), 16);
        const b = parseInt(color.substring(4, 6), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        textColor = brightness > 155 ? '#4E5968' : '#FFFFFF';
      } catch (e) {
        textColor = '#4E5968';
      }
      return { bg: hex, text: textColor };
    }
    return { bg: '#F2F4F6', text: '#4E5968' };
  };

  const getChannelName = (id?: string) => {
    if (!id || id === '본사' || id === 'default') return '본사';
    if (!channels) return '...';
    return channels?.find(c => c.subdomain === id)?.channelName || id;
  };

  const getInquiryCountsByChannel = () => {
    if (!lgInquiries || !channels || channelId) return [];

    const pathMap: { [key: string]: string } = {};
    channels.forEach(c => {
      if (c.landingPage) {
        pathMap[c.landingPage.replace('/', '')] = c.subdomain;
      }
    });

    const counts: { [key: string]: number } = {};
    lgInquiries.forEach(inq => {
      let cid = (!inq.channelId || inq.channelId === '본사' || inq.channelId === 'default') ? 'default' : inq.channelId;
      if (pathMap[cid]) {
        cid = pathMap[cid];
      }
      counts[cid] = (counts[cid] || 0) + 1;
    });

    const result = channels.map(c => ({
      name: c.channelName,
      id: c.subdomain,
      count: counts[c.subdomain] || 0
    }));

    result.unshift({ name: '본사', id: 'default', count: counts['default'] || 0 });
    return result;
  };

  if (!lgInquiries) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 text-[#3182F6] animate-spin mb-4" />
        <p className="text-[14px] font-bold text-[#4E5968]">LG구독 고객 데이터를 불러오는 중...</p>
      </div>
    );
  }

  const filteredInquiries = lgInquiries.filter(inq => {
    // 1. Channel Filter
    if (selectedChannelId !== 'all') {
      const targetCid = (selectedChannelId === 'default' || selectedChannelId === '본사') ? undefined : selectedChannelId;
      const inquiryCid = (!inq.channelId || inq.channelId === '본사' || inq.channelId === 'default') ? undefined : inq.channelId;
      if (inquiryCid !== targetCid) return false;
    }

    // 2. Status Filter
    if (statusFilter !== 'all' && inq.status !== statusFilter) {
      return false;
    }

    // 2.5 Inflow Filter
    if (inflowFilter !== 'all' && getCustomerInflow(inq) !== inflowFilter) {
      return false;
    }

    // 3. Date Filter
    if (dateFilter !== 'all') {
      const range = getFilterDateRange(dateFilter, startDate, endDate);
      const time = inq.createdAt;
      if (time < range.start || time > range.end) return false;
    }

    // 4. Search Query Filter
    const search = searchQuery.toLowerCase();
    if (!search) return true;
    const sup = getSupplier(inq).toLowerCase();
    return (
      (inq.name || '').toLowerCase().includes(search) ||
      (inq.phone || '').toLowerCase().includes(search) ||
      (inq.address || '').toLowerCase().includes(search) ||
      (inq.detailAddress || '').toLowerCase().includes(search) ||
      (inq.productName || '').toLowerCase().includes(search) ||
      (inq.appliance || '').toLowerCase().includes(search) ||
      (inq.message || '').toLowerCase().includes(search) ||
      sup.includes(search)
    );
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInquiries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInquiries.map(inq => inq._id));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const usedStatuses = settings?.statuses?.filter((s: any) => s.isUsed) || [
    { name: '대기', isUsed: true },
    { name: '상담완료', isUsed: true },
    { name: '거절', isUsed: true },
  ];

  return (
    <div className="p-4 lg:p-8">
      {!channelId && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <div
            onClick={() => setSelectedChannelId('all')}
            className={`p-4 rounded-[16px] border cursor-pointer transition-all ${selectedChannelId === 'all' ? 'bg-[#3182F6] border-[#3182F6] text-white shadow-lg shadow-blue-500/20' : 'bg-white border-[#E5E8EB] text-[#4E5968] hover:border-[#3182F6]'}`}
          >
            <p className="text-[12px] font-bold opacity-80 mb-1">전체 채널 (LG구독)</p>
            <p className="text-[18px] font-black">{lgInquiries.length}건</p>
          </div>
          {getInquiryCountsByChannel().filter(c => c.count > 0 || c.id === 'default').map(c => (
            <div
              key={c.id}
              onClick={() => setSelectedChannelId(c.id === 'default' ? 'default' : c.id)}
              className={`p-4 rounded-[16px] border cursor-pointer transition-all ${((c.id === 'default' && selectedChannelId === 'default') || selectedChannelId === c.id) ? 'bg-[#191F28] border-[#191F28] text-white shadow-lg' : 'bg-white border-[#E5E8EB] text-[#4E5968] hover:border-[#191F28]'}`}
            >
              <p className="text-[12px] font-bold opacity-80 mb-1">{c.name}</p>
              <p className="text-[18px] font-black">{c.count}건</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-[20px] lg:text-[24px] font-bold flex items-center gap-2">
            고객관리(LG구독)
            {!channelId && selectedChannelId !== 'all' && (
              <span className="text-[#3182F6] text-[16px]">
                ({getChannelName(selectedChannelId === 'default' ? undefined : selectedChannelId)})
              </span>
            )}
          </h2>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-bold bg-[#EA1D2C]/10 text-[#EA1D2C]">
            <Sparkles className="w-3.5 h-3.5" />
            총 {filteredInquiries.length}건
          </span>
        </div>

        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex-1 lg:flex-none bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 px-4 py-2 rounded-[8px] flex items-center justify-center gap-2 text-[14px] font-bold transition-colors"
              >
                <Trash2 className="w-4 h-4" /> 삭제 ({selectedIds.length})
              </button>
            )}
            <button
              onClick={() => setIsDaangnModalOpen(true)}
              className="flex-1 lg:flex-none bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 px-3.5 py-2 rounded-[8px] flex items-center justify-center gap-1.5 text-[13px] font-bold transition-colors shrink-0"
            >
              당근 리드폼 연동
            </button>
            <button
              onClick={handleOpenRegisterModal}
              className="flex-1 lg:flex-none bg-[#191F28] text-white px-4 py-2 rounded-[8px] flex items-center justify-center gap-2 text-[14px] font-bold hover:bg-[#2D3644] transition-colors"
            >
              <Plus className="w-4 h-4" /> LG구독 고객 등록
            </button>
          </div>
          <div className="flex gap-2 w-full lg:w-auto">
            {!channelId && (
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                className="bg-white border border-[#E5E8EB] px-4 py-2 rounded-[8px] text-[14px] font-medium shadow-sm outline-none focus:ring-2 focus:ring-[#3182F6]/20"
              >
                <option value="all">모든 채널</option>
                <option value="default">본사</option>
                {channels?.map(c => (
                  <option key={c._id} value={c.subdomain}>{c.channelName}</option>
                ))}
              </select>
            )}
            {channelId && subChannelIds && subChannelIds.length > 1 && (
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                className="bg-white border border-[#E5E8EB] px-4 py-2 rounded-[8px] text-[14px] font-medium shadow-sm outline-none focus:ring-2 focus:ring-[#3182F6]/20"
              >
                <option value="all">내 하위 채널 전체</option>
                {subChannelIds.map(sid => (
                  <option key={sid} value={sid}>{getChannelName(sid)}</option>
                ))}
              </select>
            )}

            <div className="flex-1 lg:w-[240px] bg-white border border-[#E5E8EB] rounded-[8px] flex items-center px-3 py-2 shadow-sm">
              <Search className="w-4 h-4 text-[#8B95A1] mr-2" />
              <input
                type="text"
                placeholder="고객명, 연락처, 가전 검색"
                className="text-[14px] focus:outline-none w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 유입경로 필터 탭 */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
        <span className="text-[12px] font-bold text-[#8B95A1] shrink-0 mr-1">유입경로</span>
        {(['all', 'landing', 'direct', 'daangn'] as const).map((type) => {
          const count = type === 'all'
            ? lgInquiries.length
            : lgInquiries.filter(i => getCustomerInflow(i) === type).length;
          const label = type === 'all' ? '전체' : INFLOW_META[type].label;
          const isActive = inflowFilter === type;
          return (
            <button
              key={type}
              onClick={() => setInflowFilter(type)}
              className={`px-3 py-1 rounded-full text-[12px] font-bold transition-all shrink-0 border ${
                isActive
                  ? type === 'daangn'
                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                    : 'bg-[#191F28] text-white border-[#191F28]'
                  : 'bg-white text-[#4E5968] border-[#E5E8EB] hover:bg-[#F2F4F6]'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* 진행상태 필터 탭 */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all shrink-0 border ${
            statusFilter === 'all'
              ? 'bg-[#191F28] text-white border-[#191F28]'
              : 'bg-white text-[#4E5968] border-[#E5E8EB] hover:bg-[#F2F4F6]'
          }`}
        >
          전체 ({lgInquiries.length})
        </button>
        {usedStatuses.map((s: any) => {
          const count = lgInquiries.filter(i => i.status === s.name).length;
          const isActive = statusFilter === s.name;
          return (
            <button
              key={s.name}
              onClick={() => setStatusFilter(s.name)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all shrink-0 border ${
                isActive
                  ? 'bg-[#3182F6] text-white border-[#3182F6] shadow-sm'
                  : 'bg-white text-[#4E5968] border-[#E5E8EB] hover:bg-[#F2F4F6]'
              }`}
            >
              {s.name} ({count})
            </button>
          );
        })}
      </div>

      {/* 기간 필터링 바 */}
      <div className="bg-white p-4 rounded-[16px] border border-[#E5E8EB] mb-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 w-full overflow-x-auto no-scrollbar py-1">
          <span className="text-[13px] font-bold text-[#4E5968] shrink-0 mr-2">등록기간</span>
          {[
            { label: '전체', value: 'all' },
            { label: '당일', value: 'today' },
            { label: '전일', value: 'yesterday' },
            { label: '1주일', value: '1week' },
            { label: '당월', value: 'thisMonth' },
            { label: '전월', value: 'lastMonth' },
            { label: '3개월', value: '3months' },
            { label: '6개월', value: '6months' },
            { label: '기간선택', value: 'custom' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateFilter(opt.value)}
              className={`px-3 py-1.5 rounded-[8px] text-[13px] font-bold transition-all shrink-0 ${
                dateFilter === opt.value
                  ? 'bg-[#3182F6] text-white shadow-sm'
                  : 'bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border border-[#E5E8EB] px-3 py-1.5 rounded-[8px] text-[13px] font-medium shadow-sm outline-none focus:ring-2 focus:ring-[#3182F6]/20"
            />
            <span className="text-[#8B95A1] text-[13px]">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white border border-[#E5E8EB] px-3 py-1.5 rounded-[8px] text-[13px] font-medium shadow-sm outline-none focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
        )}

        <button
          onClick={handleResetColumnWidths}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-bold text-[#8B95A1] hover:text-[#191F28] hover:bg-[#F2F4F6] transition-colors shrink-0"
          title="테이블 열 너비를 기본값으로 초기화합니다"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          열 너비 초기화
        </button>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-[16px] border border-[#E5E8EB] overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse table-fixed" style={{ minWidth: Object.values(columnWidths).reduce((a: number, b) => a + Number(b), 0) }}>
          <thead className="bg-[#F9FAFB] border-b border-[#E5E8EB]">
            <tr>
              {DEFAULT_COLUMNS.map((col) => (
                <th
                  key={col.id}
                  style={{ width: `${columnWidths[col.id]}px` }}
                  className={`relative px-3 py-3.5 text-[12px] font-bold text-[#4E5968] select-none ${
                    col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {col.id === 'checkbox' ? (
                    <input
                      type="checkbox"
                      checked={filteredInquiries.length > 0 && selectedIds.length === filteredInquiries.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-[#E5E8EB] text-[#3182F6] focus:ring-[#3182F6] cursor-pointer"
                    />
                  ) : (
                    <span className="truncate block">{col.label}</span>
                  )}
                  <div
                    onMouseDown={(e) => handleResizeStart(col.id, col.minWidth, e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-[#3182F6]/40 transition-colors"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E8EB]">
            {filteredInquiries.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-6 py-20 text-center text-[#8B95A1] text-[14px]">
                  등록된 LG구독 고객이 없습니다.
                </td>
              </tr>
            ) : (
              filteredInquiries.map((customer, index) => {
                let displayPlan = customer.productName;
                let displayAppliance = customer.appliance || '-';

                if (displayAppliance !== '-') {
                  displayAppliance = displayAppliance.replace(/\s*\[효원상조\s*\d+구좌\s*결합[^\]]*\]/g, '').trim();
                }

                if (displayAppliance !== '-' && allProducts) {
                  const matchedProduct = allProducts.find(p => p.model === displayAppliance);
                  if (matchedProduct) {
                    displayAppliance = `${matchedProduct.name} (${matchedProduct.model})`;
                  }
                }

                const lgLanding = landings?.find(l => l.path === '/care_new' || l.path === '/care');
                const baseLandingTitle = lgLanding?.name || 'LG가전 구독 할인 전용 (new)';
                if (!customer.productName || customer.productName.startsWith('[')) {
                  displayPlan = baseLandingTitle;
                } else {
                  displayPlan = customer.productName;
                }

                const isMainSubmission = displayPlan?.endsWith('_메인') || customer.productName?.endsWith('_메인');
                let finalOutput = displayPlan;
                if (!isMainSubmission && customer.account) {
                  const accountStr = `(${customer.account})`;
                  if (!displayPlan.includes(accountStr)) {
                    finalOutput = `${displayPlan}${accountStr}`;
                  }
                }

                const supplierName = getSupplier(customer);

                return (
                  <tr
                    key={customer._id}
                    className={`hover:bg-[#F9FAFB] cursor-pointer transition-colors ${selectedIds.includes(customer._id) ? 'bg-[#F2F8FF]' : ''}`}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    {/* 1. 순번 */}
                    <td style={{ width: `${columnWidths.index}px` }} className="px-3 py-3 text-[13px] text-[#4E5968] font-medium text-center truncate">
                      {filteredInquiries.length - index}
                    </td>

                    {/* 2. 체크박스 */}
                    <td style={{ width: `${columnWidths.checkbox}px` }} className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(customer._id)}
                        onChange={(e) => { e.stopPropagation(); toggleSelect(customer._id, e as any); }}
                        className="w-4 h-4 rounded border-[#E5E8EB] text-[#3182F6] focus:ring-[#3182F6] cursor-pointer"
                      />
                    </td>

                    {/* 3. 유입경로 */}
                    <td style={{ width: `${Math.max(columnWidths.source, 70)}px` }} className="px-2 py-3 text-center truncate">
                      {(() => {
                        const inflow = getCustomerInflow(customer);
                        const meta = INFLOW_META[inflow];
                        return (
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${meta.badgeClass}`}>
                            {meta.label}
                          </span>
                        );
                      })()}
                    </td>

                    {/* 4. 등록일시 */}
                    <td style={{ width: `${columnWidths.createdAt}px` }} className="px-3 py-3 truncate">
                      <div className="text-[12px] text-[#191F28] font-medium leading-tight">
                        {new Date(customer.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')}
                      </div>
                      <div className="text-[11px] text-[#8B95A1] leading-tight mt-1">
                        {new Date(customer.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* 5. 채널명 */}
                    <td style={{ width: `${columnWidths.channel}px` }} className="px-3 py-3 truncate">
                      <span className={`inline-block max-w-full truncate text-[12px] font-bold px-2 py-0.5 rounded-md ${(!customer.channelId || customer.channelId === '본사') ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-[#3182F6]'}`} title={getChannelName(customer.channelId)}>
                        {getChannelName(customer.channelId)}
                      </span>
                    </td>

                    {/* 6. 고객명 */}
                    <td style={{ width: `${columnWidths.name}px` }} className="px-3 py-3 text-[13px] font-bold text-[#191F28] truncate" title={customer.name}>
                      {customer.name}
                    </td>

                    {/* 7. 연락처 */}
                    <td style={{ width: `${columnWidths.phone}px` }} className="px-3 py-3 text-[13px] text-[#4E5968] truncate" title={customer.phone}>
                      {customer.phone}
                    </td>

                    {/* 8. 주소 */}
                    <td style={{ width: `${columnWidths.address}px` }} className="px-3 py-3">
                      {customer.address ? (
                        <div className="text-[12px] leading-tight">
                          <div className="truncate text-[#191F28] font-medium" title={customer.address}>
                            {customer.address}
                          </div>
                          <div className="truncate text-[11px] text-[#8B95A1] mt-0.5" title={customer.detailAddress || ''}>
                            {customer.detailAddress || '-'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#8B95A1] text-[12px]">-</span>
                      )}
                    </td>

                    {/* 9. 신청상품 */}
                    <td style={{ width: `${columnWidths.productName}px` }} className="px-3 py-3 text-[13px] text-[#4E5968] font-medium truncate" title={finalOutput}>
                      {finalOutput}
                    </td>

                    {/* 10. 결합제품 */}
                    <td style={{ width: `${columnWidths.appliance}px` }} className="px-3 py-3 text-[13px] text-[#4E5968]">
                      <div
                        className="line-clamp-2 leading-snug break-keep"
                        title={displayAppliance}
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          wordBreak: 'break-all'
                        }}
                      >
                        {displayAppliance}
                      </div>
                      {(customer.subscriptionPeriod || customer.careCycle || customer.careType) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {customer.subscriptionPeriod && (
                            <span className="text-[10px] font-bold bg-[#F2F4F6] text-[#4E5968] px-1.5 py-0.5 rounded">
                              {customer.subscriptionPeriod}
                            </span>
                          )}
                          {customer.careCycle && (
                            <span className="text-[10px] font-medium bg-blue-50 text-[#3182F6] px-1.5 py-0.5 rounded">
                              {customer.careCycle}
                            </span>
                          )}
                          {customer.careType && (
                            <span className="text-[10px] font-medium bg-emerald-50 text-[#059669] px-1.5 py-0.5 rounded truncate max-w-[140px]" title={customer.careType}>
                              {customer.careType}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 11. 공급사 */}
                    <td style={{ width: `${columnWidths.supplier}px` }} className="px-3 py-3 text-center truncate">
                      <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded ${
                        supplierName === 'TU'
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : supplierName !== '-'
                            ? 'bg-blue-50 text-[#3182F6] border border-blue-200'
                            : 'text-[#8B95A1]'
                      }`} title={supplierName}>
                        {supplierName}
                      </span>
                    </td>

                    {/* 12. 진행상태 */}
                    <td style={{ width: `${columnWidths.status}px` }} className="px-3 py-3 text-center truncate">
                      <span
                        className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: getStatusStyle(customer.status).bg,
                          color: getStatusStyle(customer.status).text
                        }}
                      >
                        {customer.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 상세 정보 모달 */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 lg:p-4">
          <div className="bg-white lg:rounded-[24px] w-full max-w-[800px] h-full lg:h-auto lg:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-[#E5E8EB] flex justify-between items-center bg-white z-10 shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="text-[20px] font-bold">LG구독 고객 상세정보</h3>
                <span
                  className="inline-block text-[12px] font-bold px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: getStatusStyle(status).bg,
                    color: getStatusStyle(status).text
                  }}
                >
                  {status}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={handleDelete} className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors" title="삭제">
                  <Trash2 className="w-5 h-5" />
                </button>
                {(selectedCustomer.productName?.toLowerCase().includes('living') || selectedCustomer.productName?.includes('리빙') || editData.productName?.includes('리빙')) && (
                  <button
                    onClick={handleSendConsent}
                    disabled={isSendingSms}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-bold transition-all ${isSendingSms ? 'bg-gray-100 text-gray-400' : 'bg-[#3182F6] text-white hover:bg-[#1B64DA] shadow-sm'}`}
                    title="구매동의 문자 발송"
                  >
                    {isSendingSms ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                    구매동의 문자발송
                  </button>
                )}
                <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-[#F2F4F6] rounded-full transition-colors">
                  <X className="w-6 h-6 text-[#4E5968]" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col gap-6 bg-[#F9FAFB] hide-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. 기본 고객 정보 */}
                <section className="bg-white p-5 rounded-[16px] border border-[#E5E8EB]">
                  <h4 className="text-[15px] font-bold mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3182F6]"></span>기본 고객 정보
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">고객명</label>
                      <input type="text" value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">연락처</label>
                      <input type="text" value={editData.phone || ''} onChange={e => setEditData({ ...editData, phone: formatPhoneNumber(e.target.value) })} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">성별</label>
                      <select value={editData.gender || ''} onChange={e => setEditData({ ...editData, gender: e.target.value })} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]">
                        <option value="">선택</option>
                        <option>남성</option>
                        <option>여성</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">생년월일 (6자리)</label>
                      <input type="text" value={editData.birth || ''} onChange={e => setEditData({ ...editData, birth: e.target.value })} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" placeholder="YYMMDD" />
                    </div>
                    <div className="col-span-2">
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-[12px] font-medium text-[#8B95A1]">주소</label>
                        <button onClick={openPostcode} className="text-[11px] bg-[#3182F6] text-white px-2.5 py-1 rounded-[4px] font-bold hover:bg-[#1B64DA] transition-colors">주소 검색</button>
                      </div>
                      <input type="text" value={editData.address || ''} readOnly onClick={openPostcode} className="w-full bg-[#F2F4F6] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px] mb-2 cursor-pointer text-[#4E5968]" placeholder="기본 주소 (검색 버튼을 눌러주세요)" />
                      <input type="text" value={editData.detailAddress || ''} onChange={e => setEditData({ ...editData, detailAddress: e.target.value })} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" placeholder="상세 주소 입력" />
                    </div>
                  </div>
                </section>

                {/* 2. 상담/계약 일정 정보 */}
                <section className="bg-white p-5 rounded-[16px] border border-[#E5E8EB]">
                  <h4 className="text-[15px] font-bold mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#BE123C]"></span>상담/계약 일정 정보
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">신규 접수일</label>
                      <input type="date" value={editData.newRegDate || ''} onChange={e => setEditData({ ...editData, newRegDate: e.target.value })} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">상조 계약일</label>
                      <input type="date" value={editData.sangjoContractDate || ''} onChange={e => setEditData({ ...editData, sangjoContractDate: e.target.value })} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">구독(렌탈) 계약일</label>
                      <input type="date" value={editData.rentalContractDate || ''} onChange={e => setEditData({ ...editData, rentalContractDate: e.target.value })} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">청약 철회일</label>
                      <input type="date" value={editData.cancelDate || ''} onChange={e => setEditData({ ...editData, cancelDate: e.target.value })} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">계약 해지일</label>
                      <input type="date" value={editData.terminationDate || ''} onChange={e => setEditData({ ...editData, terminationDate: e.target.value })} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">가전 설치/배송일</label>
                      <input type="date" value={editData.deliveryDate || ''} onChange={e => setEditData({ ...editData, deliveryDate: e.target.value })} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">특이사항</label>
                      <input type="text" value={editData.note || ''} onChange={e => setEditData({ ...editData, note: e.target.value })} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                    </div>
                  </div>
                </section>
              </div>

              {/* 3. 신청 상품 정보 */}
              <section className="bg-white p-5 rounded-[16px] border border-[#E5E8EB]">
                <h4 className="text-[15px] font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span>신청 상품 정보
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-[#F2F4F6] p-4 rounded-[12px] space-y-3">
                    <div>
                      <label className="block text-[12px] font-bold text-[#8B95A1] mb-1">신청상품 (카테고리)</label>
                      <select
                        value={editData.productName || ''}
                        onChange={e => {
                          const val = e.target.value;
                          const plan = allPlans?.find(p => p.name === val);
                          let resolvedAcc = plan ? plan.accountCount : '1구좌';
                          if (val === 'LG구독할인(new)' || val.includes('LG구독') || val.includes('LG가전구독')) {
                            resolvedAcc = '1구좌';
                          }
                          setEditData({
                            ...editData,
                            productName: val,
                            account: resolvedAcc,
                          });
                        }}
                        className="w-full bg-white border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px] font-bold"
                      >
                        <option value="LG구독할인(new)">LG구독할인(new)</option>
                        <option value="LG가전구독(new) (1구좌)">LG가전구독(new) (1구좌)</option>
                        {allPlans?.map(plan => (
                          <option key={plan._id} value={plan.name}>{plan.name}</option>
                        ))}
                        {editData.productName &&
                          editData.productName !== 'LG구독할인(new)' &&
                          editData.productName !== 'LG가전구독(new) (1구좌)' &&
                          !allPlans?.some(p => p.name === editData.productName) && (
                            <option value={editData.productName}>{editData.productName}</option>
                          )}
                      </select>
                    </div>
                    {selectedCustomer.message && (
                      <div className="mt-2 text-[13px] text-[#4E5968] bg-white/70 p-3 rounded border border-[#E5E8EB]">
                        <span className="text-[11px] font-bold text-[#8B95A1] block mb-1">고객 문의 메시지 / 견적 조건</span>
                        <p className="whitespace-pre-wrap leading-relaxed">{selectedCustomer.message}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <LgApplianceOptionFields
                      value={{
                        appliance: editData.appliance || '',
                        account: editData.account || '1구좌',
                        subscriptionPeriod: editData.subscriptionPeriod || '',
                        careCycle: editData.careCycle || '',
                        careType: editData.careType || '',
                        supplier: editData.supplier || '라이프앤조이',
                      }}
                      onChange={(patch) => setEditData((prev: any) => ({ ...prev, ...patch }))}
                      lgProductsByCategory={lgProductsByCategory}
                      lgDbProducts={lgDbProducts}
                      showSupplier={true}
                    />
                  </div>
                </div>
              </section>

              {/* 4. 상태 변경 및 메모 */}
              <section className="bg-white p-5 rounded-[16px] border border-[#E5E8EB]">
                <h4 className="text-[15px] font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#191F28]"></span>상태 변경 및 메모
                </h4>
                <div className="flex flex-col lg:flex-row gap-3">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-[140px] bg-white border border-[#D1D6DB] px-3 py-2 rounded-[8px] text-[13px] font-bold focus:outline-none"
                    style={{
                      backgroundColor: getStatusStyle(status).bg,
                      color: getStatusStyle(status).text
                    }}
                  >
                    {usedStatuses.map((s: any) => (
                      <option key={s.name} value={s.name} style={{ backgroundColor: '#ffffff', color: '#191F28' }}>{s.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="변경 사유 또는 메모를 입력하세요 (선택)"
                    className="flex-1 bg-[#F9FAFB] border border-[#E5E8EB] px-4 py-2 rounded-[8px] text-[13px] focus:outline-none"
                  />
                  <button onClick={handleUpdate} className="w-full lg:w-auto bg-[#3182F6] text-white px-6 py-3 lg:py-2 rounded-[8px] font-bold text-[14px] lg:text-[13px] flex items-center justify-center gap-2 hover:bg-[#1B64DA] transition-colors shadow-sm">
                    <Save className="w-4 h-4" /> 저장
                  </button>
                </div>

                {selectedCustomer.memoHistory && selectedCustomer.memoHistory.length > 0 && (
                  <div className="mt-5 border-t border-[#E5E8EB] pt-5">
                    <h5 className="text-[13px] font-bold text-[#8B95A1] mb-3 flex items-center gap-1">
                      <History className="w-4 h-4" /> 상태 변경 이력
                    </h5>
                    <div className="space-y-3 bg-[#F9FAFB] p-4 rounded-[12px] max-h-[150px] overflow-y-auto">
                      {selectedCustomer.memoHistory.map((history: any, idx: number) => (
                        <div key={idx} className="flex gap-3 text-[13px] items-start justify-between">
                          <div className="flex gap-3 flex-1 min-w-0 items-start">
                            <span className="text-[#8B95A1] shrink-0 font-medium">{history.date}</span>
                            <span className="font-bold text-[#3182F6] shrink-0 w-[60px]">{history.status}</span>
                            <span className="text-[#4E5968] break-all">{history.memo}</span>
                          </div>
                          {history.writer && (
                            <span className="text-[#8B95A1] shrink-0 text-[11px] bg-[#E5E8EB]/50 px-1.5 py-0.5 rounded font-medium">
                              {history.writer}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {/* 직접 등록 모달 */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 lg:p-4">
          <div className="bg-white lg:rounded-[24px] w-full max-w-[900px] h-full lg:h-auto lg:max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-[#E5E8EB] flex justify-between items-center bg-white z-10 shrink-0">
              <h3 className="text-[20px] font-bold">LG구독 고객 직접 등록</h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="p-2 hover:bg-[#F2F4F6] rounded-full transition-colors">
                <X className="w-6 h-6 text-[#4E5968]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col lg:flex-row gap-6 bg-[#F9FAFB] hide-scrollbar">
              {/* Left: Input Form */}
              <div className="flex-1 space-y-6">
                <section className="bg-white p-5 rounded-[16px] border border-[#E5E8EB]">
                  <h4 className="text-[15px] font-bold mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3182F6]"></span>고객 정보 입력
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">파트너사</label>
                      <select value={registerForm.channelId} onChange={e => setRegisterForm({ ...registerForm, channelId: e.target.value })} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]">
                        {!channelId ? (
                          <>
                            <option value="본사">본사</option>
                            {channels?.map(c => (
                              <option key={c._id} value={c.subdomain}>{c.channelName}</option>
                            ))}
                          </>
                        ) : (
                          channels?.filter(c => subChannelIds?.includes(c.subdomain)).map(c => (
                            <option key={c._id} value={c.subdomain}>{c.channelName}</option>
                          ))
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">고객명 <span className="text-red-500">*</span></label>
                      <input type="text" value={registerForm.name} onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" placeholder="성함 입력" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">연락처 <span className="text-red-500">*</span></label>
                      <input type="tel" inputMode="numeric" value={registerForm.phone} onChange={e => setRegisterForm({ ...registerForm, phone: formatPhoneNumber(e.target.value) })} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" placeholder="010-0000-0000" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">생년월일 (6자리)</label>
                      <input type="text" inputMode="numeric" value={registerForm.birth} onChange={e => setRegisterForm({ ...registerForm, birth: formatBirthDate(e.target.value) })} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" placeholder="YY-MM-DD" maxLength={8} />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">성별</label>
                      <div className="flex gap-2">
                        {['남성', '여성'].map(g => (
                          <button key={g} onClick={() => setRegisterForm({ ...registerForm, gender: g })} className={`flex-1 py-2 rounded-[8px] text-[13px] font-bold border transition-all ${registerForm.gender === g ? 'bg-[#191F28] border-[#191F28] text-white' : 'bg-white border-[#E5E8EB] text-[#4E5968] hover:bg-[#F9FAFB]'}`}>{g}</button>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-[12px] font-medium text-[#8B95A1]">주소</label>
                        <button onClick={openRegisterPostcode} className="text-[11px] bg-[#3182F6] text-white px-2.5 py-1 rounded-[4px] font-bold hover:bg-[#1B64DA]">주소 검색</button>
                      </div>
                      <input type="text" value={registerForm.address} readOnly onClick={openRegisterPostcode} className="w-full bg-[#F2F4F6] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px] mb-2 cursor-pointer" placeholder="주소 검색을 클릭해주세요" />
                      <input type="text" value={registerForm.detailAddress} onChange={e => setRegisterForm({ ...registerForm, detailAddress: e.target.value })} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" placeholder="상세 주소 입력" />
                    </div>
                  </div>
                </section>

                <section className="bg-white p-5 rounded-[16px] border border-[#E5E8EB]">
                  <h4 className="text-[15px] font-bold mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span>LG구독 상품 정보 입력
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">신청상품 (카테고리)</label>
                      <select
                        value={registerForm.productName}
                        onChange={e => {
                          const val = e.target.value;
                          setRegisterForm({
                            ...registerForm,
                            productName: val,
                            account: '1구좌',
                            supplier: '라이프앤조이',
                          });
                        }}
                        className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px] font-bold"
                      >
                        <option value="LG구독할인(new)">LG구독할인(new)</option>
                        <option value="LG가전구독(new) (1구좌)">LG가전구독(new) (1구좌)</option>
                        <option value="LG전자 가전구독 X 효원라이프 144 (1구좌)">LG전자 가전구독 X 효원라이프 144 (1구좌)</option>
                      </select>
                    </div>
                    <LgApplianceOptionFields
                      value={{
                        appliance: registerForm.appliance || '',
                        account: registerForm.account || '1구좌',
                        subscriptionPeriod: registerForm.subscriptionPeriod || '',
                        careCycle: registerForm.careCycle || '',
                        careType: registerForm.careType || '',
                        supplier: registerForm.supplier || '라이프앤조이',
                      }}
                      onChange={(patch) => setRegisterForm((prev: any) => ({ ...prev, ...patch }))}
                      lgProductsByCategory={lgProductsByCategory}
                      lgDbProducts={lgDbProducts}
                      showSupplier={true}
                    />
                    <button onClick={handleAddToList} className="w-full bg-[#3182F6] text-white py-3 rounded-[12px] font-bold text-[14px] hover:bg-[#1B64DA] mt-2 shadow-sm transition-all active:scale-[0.98]">등록대기 목록에 추가</button>
                  </div>
                </section>
              </div>

              {/* Right: Wait List */}
              <div className="w-full lg:w-[320px] flex flex-col gap-4">
                <section className="bg-white p-5 rounded-[16px] border border-[#E5E8EB] flex-1 flex flex-col overflow-hidden">
                  <h4 className="text-[15px] font-bold mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#191F28]"></span>등록대기 목록
                    </div>
                    <span className="text-[12px] bg-[#F2F4F6] text-[#4E5968] px-2 py-0.5 rounded-full font-bold">{registerList.length}건</span>
                  </h4>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 hide-scrollbar">
                    {registerList.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-10">
                        <Plus className="w-8 h-8 text-[#E5E8EB] mb-2" />
                        <p className="text-[13px] text-[#8B95A1]">목록이 비어있습니다.<br />좌측 폼을 입력해 추가해주세요.</p>
                      </div>
                    ) : (
                      registerList.map((item) => (
                        <div key={item.id} className="p-3 bg-[#F9FAFB] rounded-[12px] border border-[#E5E8EB] relative group">
                          <button onClick={() => handleRemoveFromList(item.id)} className="absolute top-2 right-2 p-1 text-[#8B95A1] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-4 h-4" />
                          </button>
                          <div className="text-[14px] font-bold text-[#191F28] mb-1">{item.name}</div>
                          <div className="text-[12px] text-[#4E5968] mb-2">{item.phone}</div>
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[10px] bg-white border border-[#E5E8EB] text-[#8B95A1] px-1.5 py-0.5 rounded">{getChannelName(item.channelId)}</span>
                            {item.productName && <span className="text-[10px] bg-blue-50 text-[#3182F6] px-1.5 py-0.5 rounded">{item.productName}</span>}
                            {item.account && <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">{item.account}</span>}
                            {item.subscriptionPeriod && <span className="text-[10px] bg-gray-100 text-[#4E5968] px-1.5 py-0.5 rounded">{item.subscriptionPeriod}</span>}
                            {item.careCycle && <span className="text-[10px] bg-blue-50 text-[#3182F6] px-1.5 py-0.5 rounded">{item.careCycle}</span>}
                            {item.careType && <span className="text-[10px] bg-emerald-50 text-[#059669] px-1.5 py-0.5 rounded truncate max-w-[180px]">{item.careType}</span>}
                            {item.appliance && <span className="text-[10px] bg-emerald-50 text-[#059669] px-1.5 py-0.5 rounded truncate max-w-[180px]">{item.appliance}</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={handleBulkRegister}
                    disabled={registerList.length === 0}
                    className={`w-full py-4 rounded-[16px] font-bold text-[15px] mt-6 shadow-lg transition-all active:scale-[0.98] ${registerList.length > 0 ? 'bg-[#191F28] text-white hover:bg-[#2D3644] shadow-black/10' : 'bg-[#E5E8EB] text-[#8B95A1] cursor-not-allowed shadow-none'}`}
                  >
                    총 {registerList.length}명 등록하기
                  </button>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
      <DaangnLeadModal
        isOpen={isDaangnModalOpen}
        onClose={() => setIsDaangnModalOpen(false)}
        defaultIsLgCare={true}
      />
    </div>
  );
}
