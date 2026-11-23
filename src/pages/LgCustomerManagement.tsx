import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Search,
  History,
  RefreshCw,
  Trash2,
  Save,
  Plus,
  Smartphone,
  Send,
  Loader2,
  RotateCcw,
  Sparkles,
  Copy,
  MessageCircle,
  Users,
  Phone,
} from 'lucide-react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { LG_OFFICIAL_PRODUCTS } from '../data/lgCareProducts';
import { getCustomerInflow, getCustomerTrafficDetail, INFLOW_META, InflowType } from '../utils/inflow';
import DaangnLeadModal from '../components/DaangnLeadModal';
import { DEFAULT_GUIDE_TEMPLATES, formatGuideMessage, GuideTemplate } from '../constants/guideTemplates';
import {
  syncCustomersToGoogleContacts,
  syncSingleCustomerWithPrompt,
  getCachedGoogleContactPhones,
  normalizeKoreanPhone,
} from '../utils/googleContacts';
import { RecentSmsCell, LatestSmsSummary } from '../components/RecentSmsCell';
import { formatPhoneNumber } from '../utils/phone';

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

const getLgConsultType = (customer: any): 'kakao' | 'phone' => {
  const tc = String(customer?.trafficChannel || '');
  const tl = String(customer?.trafficLabel || '');
  const msg = String(customer?.message || '');
  if (
    tc.startsWith('kakao') ||
    tl.includes('카톡') ||
    msg.includes('[카톡안내창]') ||
    msg.includes('카카오톡 안내')
  ) {
    return 'kakao';
  }
  return 'phone';
};

interface ResolvedLgOptions {
  periods: string[];
  cycles: string[];
  types: string[];
}

const isOfficialLgApplianceText = (val: string, lgDbProducts?: any[]): boolean => {
  if (!val) return false;
  if (val === '상담 시 제품선택 (전문 상담원 맞춤 추천)') return true;
  if (LG_OFFICIAL_PRODUCTS.some((p) => `[${p.categoryName}] ${p.name} (${p.model})` === val || p.model === val)) {
    return true;
  }
  if (lgDbProducts?.some((p) => `[${p.category}] ${p.name} (${p.model})` === val || p.model === val)) {
    return true;
  }
  return false;
};

const resolveLgProductOptions = (applianceVal: string, lgDbProducts?: any[]): ResolvedLgOptions | null => {
  if (!applianceVal || applianceVal === '상담 시 제품선택 (전문 상담원 맞춤 추천)') return null;

  const dbMatch = lgDbProducts?.find(
    (p) => `[${p.category}] ${p.name} (${p.model})` === applianceVal || p.model === applianceVal
  );
  const officialMatch = LG_OFFICIAL_PRODUCTS.find(
    (p) => `[${p.categoryName}] ${p.name} (${p.model})` === applianceVal || p.model === applianceVal
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
      const label = t.accentLabel ? `[${t.accentLabel}] ${t.label}` : t.label || t.value;
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

  const selectValue = forceDirectAppliance ? '__DIRECT__' : value.appliance || '';
  const accountSelectValue = forceDirectAccount
    ? '__DIRECT__'
    : ACCOUNT_PRESETS.includes(value.account)
      ? value.account
      : value.account
        ? '__DIRECT__'
        : '1구좌';

  return (
    <div className="space-y-3.5">
      <div className="adm-field">
        <div className="flex items-center justify-between">
          <label>결합 가전명 (제품명 · 모델명)</label>
          {forceDirectAppliance && (
            <button
              type="button"
              onClick={() => {
                setForceDirectAppliance(false);
                onChange({ appliance: '' });
              }}
              className="text-[11px] font-bold text-[#295e52] hover:underline"
            >
              카탈로그 목록에서 선택
            </button>
          )}
        </div>
        <select
          value={selectValue}
          onChange={(e) => handleSelectApplianceChange(e.target.value)}
          className="adm-select"
        >
          <option value="">가전 선택</option>
          <option value="__DIRECT__">✏️ 직접 입력</option>
          <option value="상담 시 제품선택 (전문 상담원 맞춤 추천)">상담 시 제품선택 (전문 상담원 맞춤 추천)</option>
          {Object.entries(lgProductsByCategory).map(([catName, prods]) => (
            <optgroup key={catName} label={`LG 가전구독 - ${catName} (${prods.length})`}>
              {prods.map((p) => {
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
            onChange={(e) => onChange({ appliance: e.target.value })}
            placeholder="예: LG 퓨리케어 오브제컬렉션 정수기 (WD507ACB)"
            className="adm-input"
          />
        )}
      </div>

      <div className={`grid grid-cols-1 ${showSupplier ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
        <div className="adm-field">
          <label>상조 구좌수</label>
          <select
            value={accountSelectValue}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '__DIRECT__') {
                setForceDirectAccount(true);
                onChange({ account: '' });
              } else {
                setForceDirectAccount(false);
                onChange({ account: val });
              }
            }}
            className="adm-select font-bold"
          >
            {ACCOUNT_PRESETS.map((acc) => (
              <option key={acc} value={acc}>
                {acc}
              </option>
            ))}
            <option value="__DIRECT__">직접 입력</option>
          </select>
          {forceDirectAccount && (
            <input
              type="text"
              value={value.account || ''}
              onChange={(e) => onChange({ account: e.target.value })}
              placeholder="예: 2구좌"
              className="adm-input"
            />
          )}
        </div>

        <div className="adm-field">
          <label>구독 기간 (5년/6년)</label>
          {resolvedOpts && resolvedOpts.periods.length > 0 ? (
            <select
              value={value.subscriptionPeriod || ''}
              onChange={(e) => onChange({ subscriptionPeriod: e.target.value })}
              className="adm-select font-bold"
            >
              <option value="">기간 선택</option>
              {resolvedOpts.periods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              {value.subscriptionPeriod && !resolvedOpts.periods.includes(value.subscriptionPeriod) && (
                <option value={value.subscriptionPeriod}>{value.subscriptionPeriod}</option>
              )}
            </select>
          ) : (
            <div className="space-y-1.5">
              <div className="adm-segmented w-full">
                {PERIOD_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onChange({ subscriptionPeriod: p })}
                    className={`flex-1 justify-center ${value.subscriptionPeriod === p ? 'active' : ''}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={value.subscriptionPeriod || ''}
                onChange={(e) => onChange({ subscriptionPeriod: e.target.value })}
                placeholder="직접 입력 (예: 5년, 6년)"
                className="adm-input"
              />
            </div>
          )}
        </div>

        {showSupplier && (
          <div className="adm-field">
            <label>공급사</label>
            <select
              value={value.supplier || '라이프앤조이'}
              onChange={(e) => onChange({ supplier: e.target.value })}
              className="adm-select font-bold"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="adm-field">
          <label>케어서비스 주기</label>
          {resolvedOpts && resolvedOpts.cycles.length > 0 ? (
            <select
              value={value.careCycle || ''}
              onChange={(e) => onChange({ careCycle: e.target.value })}
              className="adm-select"
            >
              <option value="">주기 선택</option>
              {resolvedOpts.cycles.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              {value.careCycle && !resolvedOpts.cycles.includes(value.careCycle) && (
                <option value={value.careCycle}>{value.careCycle}</option>
              )}
            </select>
          ) : (
            <input
              type="text"
              value={value.careCycle || ''}
              onChange={(e) => onChange({ careCycle: e.target.value })}
              placeholder="직접 입력 (예: 1회 / 12개월, 방문없음)"
              className="adm-input"
            />
          )}
        </div>

        <div className="adm-field">
          <label>케어서비스 유형</label>
          {resolvedOpts && resolvedOpts.types.length > 0 ? (
            <select
              value={value.careType || ''}
              onChange={(e) => onChange({ careType: e.target.value })}
              className="adm-select"
            >
              <option value="">유형 선택</option>
              {resolvedOpts.types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              {value.careType && !resolvedOpts.types.includes(value.careType) && (
                <option value={value.careType}>{value.careType}</option>
              )}
            </select>
          ) : (
            <input
              type="text"
              value={value.careType || ''}
              onChange={(e) => onChange({ careType: e.target.value })}
              placeholder="직접 입력 (예: 방문관리, 자가관리)"
              className="adm-input"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function LgCustomerManagement({
  channelId,
  userType = 'admin',
}: {
  channelId?: string;
  userType?: string;
}) {
  const isMasterAdmin = userType === 'admin';
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [drawerTab, setDrawerTab] = useState<'sms' | 'info' | 'history'>(isMasterAdmin ? 'sms' : 'info');
  const [memo, setMemo] = useState('');
  const [status, setStatus] = useState('대기');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [inflowFilter, setInflowFilter] = useState<'all' | InflowType>('all');
  const [consultTypeFilter, setConsultTypeFilter] = useState<'all' | 'kakao' | 'phone'>('all');
  const [isDaangnModalOpen, setIsDaangnModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSendingSms, setIsSendingSms] = useState(false);

  const [editData, setEditData] = useState<any>({});
  const [selectedChannelId, setSelectedChannelId] = useState<string>('all');

  const getKstTodayStr = () => {
    const d = new Date();
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    return kst.toISOString().split('T')[0];
  };

  const [dateFilter, setDateFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>(getKstTodayStr());
  const [endDate, setEndDate] = useState<string>(getKstTodayStr());

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
    detailAddress: '',
  });

  const settings = useQuery(api.settings.get);
  const channels = useQuery(api.channels.get);

  const subChannelIds = useQuery(
    api.channels.getSubChannelIds,
    channelId ? { subdomain: channelId } : 'skip'
  );

  const inquiries = useQuery(
    api.inquiries.list,
    channelId ? (subChannelIds ? { channelIds: subChannelIds } : 'skip') : {}
  );

  const updateInquiry = useMutation(api.inquiries.update);
  const removeInquiry = useMutation(api.inquiries.remove);
  const createInquiry = useMutation(api.inquiries.create);
  const markGoogleContactsSynced = useMutation(api.inquiries.markGoogleContactsSynced);
  const allProducts = useQuery(api.products.getAllProducts);
  const lgDbProducts = useQuery(api.lgProducts.getAll);
  const sendConsentSms = useAction(api.sms.sendConsentSms);
  const sendCustomGuideSms = useAction(api.sms.sendCustomGuideSms);
  const markInboundRead = useMutation(api.sms.markInboundRead);
  const unreadSmsCounts = useQuery(api.sms.getUnreadInboundCounts, isMasterAdmin ? {} : 'skip') ?? {};
  const latestSmsMap = (useQuery(api.sms.getLatestSmsByInquiry, isMasterAdmin ? {} : 'skip') ?? {}) as Record<string, LatestSmsSummary>;
  const landings = useQuery(api.landings.get);
  const allPlans = useQuery(api.plans.get);

  const guideTemplates: GuideTemplate[] = (settings as any)?.guideTemplates?.length
    ? (settings as any).guideTemplates
    : DEFAULT_GUIDE_TEMPLATES;
  const [selectedGuideIdx, setSelectedGuideIdx] = useState(0);
  const [guideDraft, setGuideDraft] = useState('');
  const [customSmsTitle, setCustomSmsTitle] = useState('[효원상조 × LG가전구독] 안내');
  const [customSmsDraft, setCustomSmsDraft] = useState('');
  const [quickReplyDraft, setQuickReplyDraft] = useState('');
  const [isSendingQuickReply, setIsSendingQuickReply] = useState(false);
  const [isSyncingGoogleContacts, setIsSyncingGoogleContacts] = useState(false);
  const [googleContactsProgress, setGoogleContactsProgress] = useState('');
  const [cachedGooglePhones, setCachedGooglePhones] = useState<Set<string>>(() => getCachedGoogleContactPhones());
  const [guideCopied, setGuideCopied] = useState(false);
  const [isSendingGuideSms, setIsSendingGuideSms] = useState(false);
  const [expandedSmsLogId, setExpandedSmsLogId] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const smsLogs = useQuery(
    api.sms.listByInquiry,
    isMasterAdmin && selectedCustomer?._id ? { inquiryId: selectedCustomer._id } : 'skip'
  );

  useEffect(() => {
    setCustomSmsDraft('');
    setQuickReplyDraft('');
    setExpandedSmsLogId(null);
    setDrawerTab(isMasterAdmin ? 'sms' : 'info');
  }, [selectedCustomer?._id, isMasterAdmin]);

  useEffect(() => {
    if (!isMasterAdmin || !selectedCustomer?._id) return;
    const hasUnread =
      (unreadSmsCounts[String(selectedCustomer._id)] ?? 0) > 0 ||
      Boolean(smsLogs?.some((log: any) => log.direction === 'inbound' && log.isRead !== true));
    if (hasUnread) {
      markInboundRead({ inquiryId: selectedCustomer._id }).catch((err) =>
        console.error('Failed to mark inbound SMS as read:', err)
      );
    }
  }, [selectedCustomer?._id, smsLogs, unreadSmsCounts, markInboundRead]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [smsLogs?.length, selectedCustomer?._id, drawerTab]);

  useEffect(() => {
    if (!selectedCustomer || selectedGuideIdx < 0) return;
    const tpl = guideTemplates[selectedGuideIdx] || guideTemplates[0];
    if (tpl) {
      setGuideDraft(formatGuideMessage(tpl.content, selectedCustomer.name, selectedCustomer.appliance));
    }
  }, [selectedCustomer?._id, selectedGuideIdx, (settings as any)?.guideTemplates]);

  const lgInquiries = useMemo(() => {
    if (!inquiries) return undefined;
    return inquiries.filter(isLgCareCustomer);
  }, [inquiries]);

  const DEFAULT_COLUMNS = useMemo(
    () => [
      { id: 'index', label: '순번', minWidth: 45, defaultWidth: 55, align: 'center' as const },
      { id: 'checkbox', label: '', minWidth: 40, defaultWidth: 45, align: 'center' as const },
      { id: 'source', label: '유입 · 방식', minWidth: 75, defaultWidth: 95, align: 'center' as const },
      { id: 'createdAt', label: '등록일시', minWidth: 100, defaultWidth: 125, align: 'left' as const },
      { id: 'channel', label: '채널명', minWidth: 80, defaultWidth: 100, align: 'left' as const },
      { id: 'name', label: '고객명', minWidth: 95, defaultWidth: 125, align: 'left' as const },
      { id: 'phone', label: '연락처', minWidth: 110, defaultWidth: 125, align: 'left' as const },
      { id: 'address', label: '주소', minWidth: 140, defaultWidth: 200, align: 'left' as const },
      { id: 'productName', label: '신청상품', minWidth: 140, defaultWidth: 220, align: 'left' as const },
      { id: 'appliance', label: '결합제품 · 조건', minWidth: 170, defaultWidth: 270, align: 'left' as const },
      { id: 'supplier', label: '공급사', minWidth: 70, defaultWidth: 90, align: 'center' as const },
      ...(isMasterAdmin
        ? [{ id: 'recentSms', label: '최근 문자', minWidth: 150, defaultWidth: 190, align: 'left' as const }]
        : []),
      { id: 'status', label: '진행상태', minWidth: 75, defaultWidth: 95, align: 'center' as const },
    ],
    [isMasterAdmin]
  );

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('lg_customer_table_column_widths');
      if (saved) {
        const parsed = JSON.parse(saved);
        const initial: Record<string, number> = {};
        [
          { id: 'index', defaultWidth: 55 },
          { id: 'checkbox', defaultWidth: 45 },
          { id: 'source', defaultWidth: 95 },
          { id: 'createdAt', defaultWidth: 125 },
          { id: 'channel', defaultWidth: 100 },
          { id: 'name', defaultWidth: 125 },
          { id: 'phone', defaultWidth: 125 },
          { id: 'address', defaultWidth: 200 },
          { id: 'productName', defaultWidth: 220 },
          { id: 'appliance', defaultWidth: 270 },
          { id: 'supplier', defaultWidth: 90 },
          { id: 'recentSms', defaultWidth: 190 },
          { id: 'status', defaultWidth: 95 },
        ].forEach((col) => {
          initial[col.id] = parsed[col.id] || col.defaultWidth;
        });
        return initial;
      }
    } catch (e) {}
    return {
      index: 55,
      checkbox: 45,
      source: 95,
      createdAt: 125,
      channel: 100,
      name: 125,
      phone: 125,
      address: 200,
      productName: 220,
      appliance: 270,
      supplier: 90,
      recentSms: 190,
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
      setColumnWidths((prev) => ({ ...prev, [currentColId]: newWidth }));
    };

    const handleMouseUp = () => {
      if (resizingRef.current) {
        setColumnWidths((current) => {
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
      source: 95,
      createdAt: 125,
      channel: 100,
      name: 125,
      phone: 125,
      address: 200,
      productName: 220,
      appliance: 270,
      supplier: 90,
      recentSms: 190,
      status: 95,
    };
    setColumnWidths(defaults);
    try {
      localStorage.removeItem('lg_customer_table_column_widths');
    } catch (e) {}
  };

  const getSupplier = (customer: any): string => {
    if (customer.supplier && String(customer.supplier).trim() !== '' && customer.supplier !== '-') {
      return String(customer.supplier).trim();
    }
    return '라이프앤조이';
  };

  const lgProductsByCategory = useMemo(() => {
    const groups: Record<string, typeof LG_OFFICIAL_PRODUCTS> = {};
    LG_OFFICIAL_PRODUCTS?.forEach((p) => {
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
        phone: formatPhoneNumber(selectedCustomer.phone || ''),
        newRegDate:
          selectedCustomer.newRegDate ||
          new Date(selectedCustomer.createdAt + 9 * 60 * 60 * 1000).toISOString().split('T')[0],
        productName: resolvedCategoryName,
        account: resolvedAccount,
        appliance: initialAppliance,
        supplier: initialSupplier,
        subscriptionPeriod: selectedCustomer.subscriptionPeriod || '',
        careCycle: selectedCustomer.careCycle || '',
        careType: selectedCustomer.careType || '',
      });
      setStatus(selectedCustomer.status || '대기');
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
          if (data.bname !== '') extraAddr += data.bname;
          if (data.buildingName !== '') {
            extraAddr += extraAddr !== '' ? ', ' + data.buildingName : data.buildingName;
          }
          fullAddr += extraAddr !== '' ? ' (' + extraAddr + ')' : '';
        }
        setEditData((prev: any) => ({ ...prev, address: fullAddr }));
      },
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
          if (data.bname !== '') extraAddr += data.bname;
          if (data.buildingName !== '') {
            extraAddr += extraAddr !== '' ? ', ' + data.buildingName : data.buildingName;
          }
          fullAddr += extraAddr !== '' ? ' (' + extraAddr + ')' : '';
        }
        setRegisterForm((prev: any) => ({ ...prev, address: fullAddr }));
      },
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
        detailAddress: '',
      });
    } else {
      alert('고객명과 연락처는 필수 입력 사항입니다.');
    }
  };

  const handleRemoveFromList = (id: number) => {
    setRegisterList(registerList.filter((item) => item.id !== id));
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
      detailAddress: '',
    });
    setIsRegisterModalOpen(true);
  };

  const handleSendConsent = async () => {
    if (!selectedCustomer) return;
    const smsConfig = (settings as any)?.sms;
    const isSmsReady =
      smsConfig?.provider === 'phone_bridge'
        ? Boolean(smsConfig?.bridgeSecret)
        : Boolean(smsConfig?.apiKey && smsConfig?.userId && smsConfig?.sender);
    if (!isSmsReady) {
      alert('SMS 설정이 완료되지 않았습니다.\n환경설정 > 문자(SMS) 연동 설정을 먼저 확인해주세요.');
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

  const getCurrentWriterName = () => {
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
    return writerName;
  };

  const handleUpdate = async () => {
    if (!selectedCustomer) return;
    try {
      const allowedFields = [
        'name', 'phone', 'gender', 'birth', 'address', 'detailAddress',
        'newRegDate', 'cardPaymentDate', 'purchaseConsentDate', 'sangjoContractDate',
        'rentalContractDate', 'cancelDate', 'terminationDate', 'deliveryDate',
        'consentStatus', 'consentFileUrl', 'consentSentDate', 'note',
        'account', 'appliance', 'supplier', 'subscriptionPeriod', 'careCycle', 'careType',
        'memoHistory', 'productName', 'channelId', 'source', 'inflow',
      ];
      const updates: Record<string, any> = { status };
      for (const key of allowedFields) {
        if (editData[key] !== undefined && editData[key] !== null) {
          updates[key] = editData[key];
        }
      }

      if (memo.trim()) {
        const writerName = getCurrentWriterName();
        const newHistory = {
          date: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0],
          status,
          memo: memo.trim(),
          writer: writerName,
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
      setSelectedIds((prev) => prev.filter((id) => id !== selectedCustomer._id));
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

  const getStatusStyle = (statusName: string) => {
    const statusSetting = settings?.statuses?.find((s: any) => s.name === statusName);
    if (statusSetting && statusSetting.color) {
      const hex = statusSetting.color;
      let textColor = '#263d36';
      try {
        const color = hex.replace('#', '');
        const r = parseInt(color.substring(0, 2), 16);
        const g = parseInt(color.substring(2, 4), 16);
        const b = parseInt(color.substring(4, 6), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        textColor = brightness > 155 ? '#263d36' : '#FFFFFF';
      } catch (e) {
        textColor = '#263d36';
      }
      return { bg: hex, text: textColor };
    }
    return { bg: '#f0f2ed', text: '#5c6b5b' };
  };

  const getChannelName = (id?: string) => {
    if (!id || id === '본사' || id === 'default') return '본사';
    if (!channels) return '...';
    return channels?.find((c) => c.subdomain === id)?.channelName || id;
  };

  const getInquiryCountsByChannel = () => {
    if (!lgInquiries || !channels || channelId) return [];

    const pathMap: { [key: string]: string } = {};
    channels.forEach((c) => {
      if (c.landingPage) {
        pathMap[c.landingPage.replace('/', '')] = c.subdomain;
      }
    });

    const counts: { [key: string]: number } = {};
    lgInquiries.forEach((inq) => {
      let cid = !inq.channelId || inq.channelId === '본사' || inq.channelId === 'default' ? 'default' : inq.channelId;
      if (pathMap[cid]) cid = pathMap[cid];
      counts[cid] = (counts[cid] || 0) + 1;
    });

    const result = channels.map((c) => ({
      name: c.channelName,
      id: c.subdomain,
      count: counts[c.subdomain] || 0,
    }));

    result.unshift({ name: '본사', id: 'default', count: counts['default'] || 0 });
    return result;
  };

  const lgSummary = useMemo(() => {
    const list = lgInquiries || [];
    const kakaoCount = list.filter((i) => getLgConsultType(i) === 'kakao').length;
    const phoneCount = list.filter((i) => getLgConsultType(i) === 'phone').length;
    const totalUnread = (Object.entries(unreadSmsCounts) as [string, number][]).reduce((acc, [id, cnt]) => {
      if (list.some((i) => String(i._id) === id)) return acc + (cnt || 0);
      return acc;
    }, 0);
    return {
      total: list.length,
      kakaoCount,
      phoneCount,
      totalUnread,
    };
  }, [lgInquiries, unreadSmsCounts]);

  if (!lgInquiries) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <RefreshCw className="w-7 h-7 text-[#295e52] animate-spin mb-3" />
        <p className="text-[13px] font-semibold text-[#45554e]">LG구독 고객 데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  const filteredInquiries = lgInquiries.filter((inq) => {
    if (selectedChannelId !== 'all') {
      const targetCid = selectedChannelId === 'default' || selectedChannelId === '본사' ? undefined : selectedChannelId;
      const inquiryCid = !inq.channelId || inq.channelId === '본사' || inq.channelId === 'default' ? undefined : inq.channelId;
      if (inquiryCid !== targetCid) return false;
    }

    if (statusFilter !== 'all' && (inq.status || '대기') !== statusFilter) {
      return false;
    }

    if (inflowFilter !== 'all' && getCustomerInflow(inq) !== inflowFilter) {
      return false;
    }

    if (consultTypeFilter !== 'all' && getLgConsultType(inq) !== consultTypeFilter) {
      return false;
    }

    if (dateFilter !== 'all') {
      const range = getFilterDateRange(dateFilter, startDate, endDate);
      const time = inq.createdAt;
      if (time < range.start || time > range.end) return false;
    }

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
      setSelectedIds(filteredInquiries.map((inq) => inq._id));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const usedStatuses = settings?.statuses?.filter((s: any) => s.isUsed) || [
    { name: '대기', isUsed: true },
    { name: '상담완료', isUsed: true },
    { name: '거절', isUsed: true },
  ];

  return (
    <div>
      {/* Page Heading */}
      <div className="adm-page-heading">
        <div>
          <div className="adm-eyebrow">LG CARE SOLUTIONS · CUSTOMERS</div>
          <h1>
            고객 관리 (LG구독)
            {!channelId && selectedChannelId !== 'all' && (
              <span className="text-[#295e52] text-[17px] ml-2 font-bold">
                · {getChannelName(selectedChannelId === 'default' ? undefined : selectedChannelId)}
              </span>
            )}
          </h1>
          <p>
            {isMasterAdmin
              ? 'LG가전 구독 결합 고객의 카톡 · 문자 안내 발송, 양방향 답장 내역 및 구독 조건을 관리합니다.'
              : 'LG가전 구독 결합 고객의 상담 현황 및 구독 조건을 관리합니다.'}{' '}
            (검색 결과{' '}
            <strong className="text-[#263d36]">{filteredInquiries.length}</strong>명)
          </p>
        </div>

        <div className="adm-heading-buttons">
          <button
            type="button"
            disabled={isSyncingGoogleContacts}
            onClick={async () => {
              const clientId = (settings as any)?.googleContacts?.clientId || '';
              if (!clientId) {
                alert(
                  'Google OAuth 클라이언트 ID가 아직 설정되지 않았습니다.\n환경설정 > 문자(SMS) 연동 설정 > [구글 주소록 자동 등록 연동]에 클라이언트 ID를 먼저 입력해주세요.'
                );
                return;
              }
              const targets =
                selectedIds.length > 0
                  ? filteredInquiries.filter((c: any) => selectedIds.includes(c._id))
                  : filteredInquiries;
              if (targets.length === 0) {
                alert('등록할 고객이 없습니다.');
                return;
              }
              if (
                !confirm(
                  `${
                    selectedIds.length > 0 ? `선택한 ${targets.length}명` : `현재 목록 ${targets.length}명`
                  }을 구글 주소록에 자동 등록하시겠습니까?\n(이미 등록된 번호는 자동으로 건너뜁니다)`
                )
              ) {
                return;
              }
              setIsSyncingGoogleContacts(true);
              setGoogleContactsProgress('구글 주소록 준비 중...');
              try {
                const res = await syncCustomersToGoogleContacts(targets, clientId, {
                  onProgress: setGoogleContactsProgress,
                });
                setCachedGooglePhones(getCachedGoogleContactPhones());
                if (res.syncedCustomerIds.length > 0) {
                  try {
                    await markGoogleContactsSynced({ ids: res.syncedCustomerIds as any });
                  } catch {
                    // 백엔드 스키마 미반영 시 로컬 캐시만 유지
                  }
                }
                alert(
                  `구글 주소록 동기화가 완료되었습니다!\n\n` +
                    `• 신규 등록: ${res.createdCount}명\n` +
                    `• 이미 등록됨(건너뜀): ${res.skippedDuplicateCount}명` +
                    (res.failedCount > 0 ? `\n• 실패: ${res.failedCount}명` : '') +
                    `\n\n잠시 후 회사폰 연락처에 자동으로 반영됩니다.`
                );
              } catch (err: any) {
                alert(`구글 주소록 등록 실패: ${err?.message || '알 수 없는 오류'}`);
              } finally {
                setIsSyncingGoogleContacts(false);
                setGoogleContactsProgress('');
              }
            }}
            className="adm-btn sage"
          >
            {isSyncingGoogleContacts ? <Loader2 className="animate-spin" /> : <Smartphone />}
            <span>
              {isSyncingGoogleContacts
                ? googleContactsProgress || '구글 주소록 등록 중...'
                : selectedIds.length > 0
                  ? `구글 주소록 등록 (${selectedIds.length}명)`
                  : '구글 주소록 자동 등록'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setIsDaangnModalOpen(true)}
            className="adm-btn sage"
          >
            <span>당근 리드폼 연동</span>
          </button>
          <button
            type="button"
            onClick={handleOpenRegisterModal}
            className="adm-btn primary"
          >
            <Plus />
            <span>LG구독 고객 등록</span>
          </button>
        </div>
      </div>

      {/* 4-Column Metric Cards */}
      <div className="adm-metrics-grid">
        <div className="adm-metric clickable" onClick={() => { setConsultTypeFilter('all'); setStatusFilter('all'); }}>
          <div className="adm-metric-head">
            <span>LG구독 누적 접수</span>
            <div className="adm-metric-icon"><Users /></div>
          </div>
          <div className="adm-metric-value">
            {lgSummary.total.toLocaleString()}<span>건</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">LG 케어솔루션</span>
            <span>전용 결합 고객</span>
          </div>
        </div>

        <div className="adm-metric clickable" onClick={() => setConsultTypeFilter('kakao')}>
          <div className="adm-metric-head">
            <span>카톡 안내 신청</span>
            <div className="adm-metric-icon"><Sparkles /></div>
          </div>
          <div className="adm-metric-value">
            {lgSummary.kakaoCount.toLocaleString()}<span>건</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">문구 발송 대상</span>
            <span>비대면 견적 요청</span>
          </div>
        </div>

        <div className="adm-metric clickable" onClick={() => setConsultTypeFilter('phone')}>
          <div className="adm-metric-head">
            <span>전문 전화 상담</span>
            <div className="adm-metric-icon"><Phone /></div>
          </div>
          <div className="adm-metric-value">
            {lgSummary.phoneCount.toLocaleString()}<span>건</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">유선 상담 희망</span>
            <span>해피콜 진행 대상</span>
          </div>
        </div>

        <div className="adm-metric">
          <div className="adm-metric-head">
            <span>미확인 고객 답장</span>
            <div className="adm-metric-icon"><MessageCircle /></div>
          </div>
          <div className="adm-metric-value">
            {lgSummary.totalUnread.toLocaleString()}<span>건</span>
          </div>
          <div className="adm-metric-foot">
            <span className={`adm-metric-trend ${lgSummary.totalUnread > 0 ? 'warning' : ''}`}>
              {lgSummary.totalUnread > 0 ? '답장 확인 필요' : '전건 확인됨'}
            </span>
            <span>양방향 문자 수신</span>
          </div>
        </div>
      </div>

      {/* Master Admin Quick Channel Strip */}
      {!channelId && (
        <div className="adm-panel p-3.5 mb-5">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            <span className="text-[11.5px] font-bold text-[#6d786c] shrink-0 px-2">채널별 현황</span>
            <button
              type="button"
              onClick={() => setSelectedChannelId('all')}
              className={`adm-btn small ${selectedChannelId === 'all' ? 'primary' : ''}`}
            >
              전체 채널 ({lgInquiries.length})
            </button>
            {getInquiryCountsByChannel()
              .filter((c) => c.count > 0 || c.id === 'default')
              .map((c) => {
                const targetVal = c.id === 'default' ? 'default' : c.id;
                const isActive = selectedChannelId === targetVal;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedChannelId(targetVal)}
                    className={`adm-btn small ${isActive ? 'primary' : ''}`}
                  >
                    <span>{c.name}</span>
                    <span className="opacity-75 font-mono">({c.count})</span>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="adm-bulk-bar">
          <div className="text-[12.5px] font-semibold">
            현재 <strong className="text-white">{selectedIds.length}명</strong>의 LG구독 고객이 선택되었습니다.
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSelectedIds([])} className="adm-btn small">
              선택 해제
            </button>
            <button type="button" onClick={handleBulkDelete} className="adm-btn danger small">
              <Trash2 />
              <span>선택 삭제 ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Panel */}
      <div className="adm-panel">
        {/* Status Tabs */}
        <div className="adm-tabs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`adm-tab ${statusFilter === 'all' ? 'active' : ''}`}
          >
            <span>전체 상태</span>
            <span className="adm-tab-count">{lgInquiries.length}</span>
          </button>
          {usedStatuses.map((s: any) => {
            const count = lgInquiries.filter((i) => (i.status || '대기') === s.name).length;
            return (
              <button
                key={s.name}
                type="button"
                onClick={() => setStatusFilter(s.name)}
                className={`adm-tab ${statusFilter === s.name ? 'active' : ''}`}
              >
                <span>{s.name}</span>
                <span className="adm-tab-count">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Row 1 */}
        <div className="adm-filter-bar">
          <div className="adm-search-field">
            <Search />
            <input
              type="text"
              placeholder="고객명, 연락처, 가전 모델명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {!channelId && (
            <select
              value={selectedChannelId}
              onChange={(e) => setSelectedChannelId(e.target.value)}
              className="adm-select"
            >
              <option value="all">모든 파트너 채널</option>
              <option value="default">본사 직접유입</option>
              {channels?.map((c) => (
                <option key={c._id} value={c.subdomain}>
                  {c.channelName}
                </option>
              ))}
            </select>
          )}

          {channelId && subChannelIds && subChannelIds.length > 1 && (
            <select
              value={selectedChannelId}
              onChange={(e) => setSelectedChannelId(e.target.value)}
              className="adm-select"
            >
              <option value="all">내 하위 채널 전체</option>
              {subChannelIds.map((sid) => (
                <option key={sid} value={sid}>
                  {getChannelName(sid)}
                </option>
              ))}
            </select>
          )}

          {/* Consult Type Segmented */}
          <div className="adm-segmented">
            {(
              [
                { id: 'all', label: '방식 전체' },
                { id: 'kakao', label: '카톡 안내' },
                { id: 'phone', label: '전화 상담' },
              ] as const
            ).map((item) => {
              const count =
                item.id === 'all'
                  ? lgInquiries.length
                  : lgInquiries.filter((i) => getLgConsultType(i) === item.id).length;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setConsultTypeFilter(item.id)}
                  className={consultTypeFilter === item.id ? 'active' : ''}
                >
                  {item.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Inflow Segmented */}
          <div className="adm-segmented">
            {(['all', 'landing', 'direct', 'daangn'] as const).map((type) => {
              const count =
                type === 'all'
                  ? lgInquiries.length
                  : lgInquiries.filter((i) => getCustomerInflow(i) === type).length;
              const label = type === 'all' ? '유입 전체' : INFLOW_META[type].label;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setInflowFilter(type)}
                  className={inflowFilter === type ? 'active' : ''}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Row 2: Date Range */}
        <div className="adm-filter-bar">
          <span className="text-[11.5px] font-semibold text-[#6d786c]">접수 기간</span>
          <div className="adm-segmented">
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
                type="button"
                onClick={() => setDateFilter(opt.value)}
                className={dateFilter === opt.value ? 'active' : ''}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {dateFilter === 'custom' && (
            <div className="inline-flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="adm-input"
              />
              <span className="text-[#86918a] text-[12px]">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="adm-input"
              />
            </div>
          )}

          <div className="adm-filter-end">
            <button
              type="button"
              onClick={handleResetColumnWidths}
              className="adm-btn small"
            >
              <RotateCcw />
              <span>열 간격 초기화</span>
            </button>
          </div>
        </div>

        {/* Resizable Table */}
        <div className="adm-table-scroll custom-scrollbar">
          <table
            className="adm-table table-fixed"
            style={{ minWidth: Object.values(columnWidths).reduce((a: number, b) => a + Number(b), 0) }}
          >
            <thead className="select-none">
              <tr>
                {DEFAULT_COLUMNS.map((col) => (
                  <th
                    key={col.id}
                    style={{ width: `${columnWidths[col.id]}px` }}
                    className={`relative ${col.align === 'center' ? 'text-center' : 'text-left'}`}
                  >
                    {col.id === 'checkbox' ? (
                      <input
                        type="checkbox"
                        checked={filteredInquiries.length > 0 && selectedIds.length === filteredInquiries.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded cursor-pointer"
                      />
                    ) : (
                      <span className="truncate block">{col.label}</span>
                    )}
                    <div
                      onMouseDown={(e) => handleResizeStart(col.id, col.minWidth, e)}
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-[#295e52]/15 transition-colors"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={DEFAULT_COLUMNS.length} className="text-center !py-20 text-[#86918a]">
                    조건에 일치하는 LG구독 고객이 없습니다.
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
                    const matchedProduct = allProducts.find((p) => p.model === displayAppliance);
                    if (matchedProduct) {
                      displayAppliance = `${matchedProduct.name} (${matchedProduct.model})`;
                    }
                  }

                  const lgLanding = landings?.find((l) => l.path === '/care_new' || l.path === '/care');
                  const baseLandingTitle = lgLanding?.name || 'LG가전 구독 할인 전용 (new)';
                  if (!customer.productName || customer.productName.startsWith('[')) {
                    displayPlan = baseLandingTitle;
                  } else {
                    displayPlan = customer.productName;
                  }

                  const isMainSubmission =
                    displayPlan?.endsWith('_메인') || customer.productName?.endsWith('_메인');
                  let finalOutput = displayPlan;
                  if (!isMainSubmission && customer.account) {
                    const accountStr = `(${customer.account})`;
                    if (!displayPlan.includes(accountStr)) {
                      finalOutput = `${displayPlan}${accountStr}`;
                    }
                  }

                  const supplierName = getSupplier(customer);
                  const unreadSmsCount = unreadSmsCounts[String(customer._id)] || 0;
                  const isRowSelected = selectedIds.includes(customer._id);

                  return (
                    <tr
                      key={customer._id}
                      className={`adm-clickable-row ${
                        isRowSelected ? '!bg-[#f2f6ef]' : unreadSmsCount > 0 ? '!bg-[#fdf5f3]' : ''
                      }`}
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <td style={{ width: `${columnWidths.index}px` }} className="text-center font-mono text-[11.5px] text-[#7d8879] truncate">
                        {filteredInquiries.length - index}
                      </td>

                      <td style={{ width: `${columnWidths.checkbox}px` }} className="text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelect(customer._id, e as any);
                          }}
                          className="w-4 h-4 rounded cursor-pointer"
                        />
                      </td>

                      <td style={{ width: `${Math.max(columnWidths.source, 85)}px` }} className="text-center truncate">
                        {(() => {
                          const inflow = getCustomerInflow(customer);
                          const meta = INFLOW_META[inflow];
                          const detail = getCustomerTrafficDetail(customer);
                          const consultType = getLgConsultType(customer);
                          return (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`adm-pill ${consultType === 'kakao' ? 'orange' : 'green'}`}>
                                {consultType === 'kakao' ? '카톡 안내' : '전화 상담'}
                              </span>
                              <span className="text-[10px] font-medium text-[#7d8879]">
                                {meta.label}
                                {detail && !detail.label?.includes('카톡') && !detail.label?.includes('전화') ? ` · ${detail.label}` : ''}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      <td style={{ width: `${columnWidths.createdAt}px` }} className="truncate">
                        <div className="text-[12px] text-[#263d36] font-semibold font-mono leading-tight">
                          {new Date(customer.createdAt)
                            .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
                            .replace(/\. /g, '.')
                            .replace(/\.$/, '')}
                        </div>
                        <div className="text-[10.5px] text-[#86918a] font-mono leading-tight mt-0.5">
                          {new Date(customer.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td style={{ width: `${columnWidths.channel}px` }} className="truncate">
                        <span
                          className={`adm-pill ${!customer.channelId || customer.channelId === '본사' ? 'gray' : 'teal'} max-w-full truncate`}
                          title={getChannelName(customer.channelId)}
                        >
                          {getChannelName(customer.channelId)}
                        </span>
                      </td>

                      <td style={{ width: `${columnWidths.name}px` }} className="truncate" title={customer.name}>
                        <div className="adm-person">
                          <div className="adm-person-circle alt">{(customer.name || '고').slice(0, 1)}</div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <strong className="truncate">{customer.name}</strong>
                            {isMasterAdmin && unreadSmsCount > 0 && (
                              <span
                                title={`읽지 않은 고객 답장 ${unreadSmsCount}건`}
                                className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#c96453] text-white text-[10px] font-bold leading-none shrink-0"
                              >
                                {unreadSmsCount > 99 ? '99+' : unreadSmsCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ width: `${columnWidths.phone}px` }} className="font-mono text-[12px] text-[#45554e]" title={formatPhoneNumber(customer.phone || '')}>
                        <div className="truncate">{formatPhoneNumber(customer.phone || '')}</div>
                        {(() => {
                          const isSynced =
                            Boolean((customer as any).googleContactsSyncedAt) ||
                            cachedGooglePhones.has(normalizeKoreanPhone(customer.phone || ''));
                          return isSynced ? (
                            <span
                              className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded bg-[#e8f4ee] text-[#295e52] text-[10px] font-sans font-semibold leading-none"
                              title="구글 주소록에 연동된 번호입니다"
                            >
                              ● 구글연동
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center mt-0.5 px-1.5 py-0.5 rounded bg-[#f1f3ef] text-[#7d8879] text-[10px] font-sans font-medium leading-none"
                              title="구글 주소록에 아직 등록되지 않았습니다"
                            >
                              미연동
                            </span>
                          );
                        })()}
                      </td>

                      <td style={{ width: `${columnWidths.address}px` }}>
                        {customer.address ? (
                          <div className="text-[12px] leading-tight">
                            <div className="truncate text-[#263d36] font-medium" title={customer.address}>
                              {customer.address}
                            </div>
                            <div className="truncate text-[10.5px] text-[#86918a] mt-0.5" title={customer.detailAddress || ''}>
                              {customer.detailAddress || '-'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#9ba594] text-[12px]">-</span>
                        )}
                      </td>

                      <td style={{ width: `${columnWidths.productName}px` }} className="font-semibold text-[#263d36] truncate" title={finalOutput}>
                        {finalOutput}
                      </td>

                      <td style={{ width: `${columnWidths.appliance}px` }} className="whitespace-normal">
                        <div className="line-clamp-2 text-[12px] text-[#45554e] leading-snug break-keep" title={displayAppliance}>
                          {displayAppliance}
                        </div>
                        {(customer.subscriptionPeriod || customer.careCycle || customer.careType) && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {customer.subscriptionPeriod && (
                              <span className="adm-pill gray">{customer.subscriptionPeriod}</span>
                            )}
                            {customer.careCycle && <span className="adm-pill blue">{customer.careCycle}</span>}
                            {customer.careType && (
                              <span className="adm-pill teal truncate max-w-[130px]" title={customer.careType}>
                                {customer.careType}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td style={{ width: `${columnWidths.supplier}px` }} className="text-center truncate">
                        <span className={`adm-pill ${supplierName === 'TU' ? 'orange' : 'blue'}`}>
                          {supplierName}
                        </span>
                      </td>

                      {isMasterAdmin && (
                        <td style={{ width: `${columnWidths.recentSms}px` }} className="truncate">
                          <RecentSmsCell
                            latestSms={latestSmsMap[String(customer._id)]}
                            unreadCount={unreadSmsCount}
                          />
                        </td>
                      )}

                      <td style={{ width: `${columnWidths.status}px` }} className="text-center truncate">
                        <span
                          className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-[5px]"
                          style={{
                            backgroundColor: getStatusStyle(customer.status).bg,
                            color: getStatusStyle(customer.status).text,
                          }}
                        >
                          {customer.status || '대기'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="adm-table-foot">
          <span>
            전체 {lgInquiries.length}건 중 검색 결과 <strong className="text-[#263d36]">{filteredInquiries.length}</strong>건
          </span>
          <span>
            {isMasterAdmin
              ? '행을 클릭하면 우측 드로어에서 카톡 · 문자 안내 및 구독 조건을 관리할 수 있습니다.'
              : '행을 클릭하면 우측 드로어에서 고객 정보 및 구독 조건을 관리할 수 있습니다.'}
          </span>
        </div>
      </div>

      {/* Slide-over LG Customer Detail Drawer */}
      {selectedCustomer && (
        <div className="adm-drawer-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="adm-drawer !max-w-[820px]" onClick={(e) => e.stopPropagation()}>
            <div className="adm-drawer-head">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2>LG구독 고객 상세 관리</h2>
                  <span
                    className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-[5px]"
                    style={{
                      backgroundColor: getStatusStyle(status).bg,
                      color: getStatusStyle(status).text,
                    }}
                  >
                    {status}
                  </span>
                </div>
                <p>
                  {getChannelName(selectedCustomer.channelId)} · 접수일시{' '}
                  {new Date(selectedCustomer.createdAt).toLocaleString('ko-KR')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSyncingGoogleContacts}
                  onClick={async () => {
                    const clientId = (settings as any)?.googleContacts?.clientId || '';
                    setIsSyncingGoogleContacts(true);
                    try {
                      await syncSingleCustomerWithPrompt(
                        {
                          _id: selectedCustomer._id,
                          name: editData.name || selectedCustomer.name,
                          phone: editData.phone || selectedCustomer.phone,
                          productName: editData.productName || selectedCustomer.productName,
                          appliance: editData.appliance || selectedCustomer.appliance,
                          status: status || selectedCustomer.status,
                        },
                        clientId
                      );
                    } finally {
                      setIsSyncingGoogleContacts(false);
                    }
                  }}
                  className="adm-btn sage small"
                  title="이 고객을 구글 주소록에 저장"
                >
                  {isSyncingGoogleContacts ? <Loader2 className="animate-spin" /> : <Smartphone />}
                  <span>{isSyncingGoogleContacts ? '주소록 저장 중...' : '주소록 저장'}</span>
                </button>
                {(selectedCustomer.productName?.toLowerCase().includes('living') ||
                  selectedCustomer.productName?.includes('리빙') ||
                  editData.productName?.includes('리빙')) && (
                  <button
                    type="button"
                    onClick={handleSendConsent}
                    disabled={isSendingSms}
                    className="adm-btn sage small"
                  >
                    {isSendingSms ? <Loader2 className="animate-spin" /> : <Smartphone />}
                    <span>구매동의 발송</span>
                  </button>
                )}
                <button type="button" onClick={handleDelete} className="adm-btn danger small">
                  <Trash2 />
                  <span>삭제</span>
                </button>
                <button type="button" onClick={() => setSelectedCustomer(null)} className="adm-icon-btn">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="adm-drawer-tabs">
              {isMasterAdmin && (
                <button
                  type="button"
                  onClick={() => setDrawerTab('sms')}
                  className={`adm-drawer-tab ${drawerTab === 'sms' ? 'active' : ''}`}
                >
                  카톡 · 문자 안내 &amp; 대화창
                  <span className="adm-tab-count">{smsLogs?.length || 0}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setDrawerTab('info')}
                className={`adm-drawer-tab ${drawerTab === 'info' ? 'active' : ''}`}
              >
                고객 · LG구독 상품 정보
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('history')}
                className={`adm-drawer-tab ${drawerTab === 'history' ? 'active' : ''}`}
              >
                상태 변경 이력
                <span className="adm-tab-count">{selectedCustomer.memoHistory?.length || 0}</span>
              </button>
            </div>

            <div className="adm-drawer-scroll space-y-5">
              {/* Customer Header Card */}
              <div className="flex items-center gap-3.5 p-4 rounded-[12px] bg-white border border-[#e6eae3]">
                <div className="w-11 h-11 rounded-full bg-[#f2ede3] text-[#8a7957] font-bold text-[15px] grid place-items-center shrink-0">
                  {(editData.name || selectedCustomer.name || '고').slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] font-bold text-[#263d36]">
                      {editData.name || selectedCustomer.name}
                    </span>
                    <span className="text-[12.5px] font-mono font-medium text-[#6d786c]">
                      {formatPhoneNumber(editData.phone || selectedCustomer.phone || '')}
                    </span>
                    <span className={`adm-pill ${getLgConsultType(selectedCustomer) === 'kakao' ? 'orange' : 'green'}`}>
                      {getLgConsultType(selectedCustomer) === 'kakao' ? '카톡 안내 희망' : '전화 상담 희망'}
                    </span>
                  </div>
                  <div className="text-[12px] text-[#7d877f] truncate mt-0.5">
                    {editData.appliance || '결합가전 미지정'} · {editData.account || '1구좌'}
                  </div>
                </div>
              </div>

              {/* Quick Status & Memo Update */}
              <div className="adm-note-card space-y-3">
                <div className="text-[12px] font-bold text-[#263d36]">진행상태 변경 및 상담 메모</div>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="adm-select sm:w-[160px] font-bold"
                  >
                    {usedStatuses.map((s: any) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="변경 사유 또는 메모 입력 (우측 하단 저장 시 반영)"
                    className="adm-input flex-1"
                  />
                </div>
              </div>

              {isMasterAdmin && drawerTab === 'sms' && (
                <div className="space-y-5">
                  {/* Template & Free SMS Sender */}
                  <div className="adm-panel p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#edf0e7]">
                      <div>
                        <h3 className="text-[14px] font-bold text-[#263d36]">카톡 · 문자 안내 발송</h3>
                        <p className="text-[11.5px] text-[#86918a]">
                          템플릿 문구를 카카오톡용으로 복사하거나 LMS 문자로 즉시 발송합니다.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            const textToCopy = selectedGuideIdx === -1 ? customSmsDraft : guideDraft;
                            if (!textToCopy.trim()) {
                              alert('복사할 내용이 없습니다.');
                              return;
                            }
                            try {
                              await navigator.clipboard.writeText(textToCopy);
                              setGuideCopied(true);
                              setTimeout(() => setGuideCopied(false), 2000);
                            } catch {
                              alert('복사에 실패했습니다. 직접 드래그해 복사해 주세요.');
                            }
                          }}
                          className="adm-btn sage small"
                        >
                          <Copy />
                          <span>{guideCopied ? '복사됨!' : '문구 복사 (카톡용)'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={isSendingGuideSms}
                          onClick={async () => {
                            const targetPhone = editData.phone || selectedCustomer.phone;
                            if (!targetPhone) {
                              alert('고객 연락처가 없습니다.');
                              return;
                            }
                            const isCustomMode = selectedGuideIdx === -1;
                            const activeMessage = isCustomMode ? customSmsDraft : guideDraft;
                            if (!activeMessage.trim()) {
                              alert('발송할 문자 내용을 입력해주세요.');
                              return;
                            }
                            if (
                              !confirm(
                                `${selectedCustomer.name}님(${targetPhone})에게 ${
                                  isCustomMode ? '자유문자' : '안내 문자'
                                }를 발송하시겠습니까?`
                              )
                            )
                              return;
                            setIsSendingGuideSms(true);
                            try {
                              const res = await sendCustomGuideSms({
                                inquiryId: selectedCustomer._id,
                                customerName: selectedCustomer.name,
                                customerPhone: targetPhone,
                                smsType: isCustomMode ? '자유문자' : '상품안내',
                                senderName: getCurrentWriterName(),
                                title: isCustomMode
                                  ? customSmsTitle.trim() || '[효원상조 × LG가전구독] 안내'
                                  : '[효원상조 × LG가전구독] 상품 안내',
                                message: activeMessage,
                              });
                              if (isCustomMode) setCustomSmsDraft('');
                              alert(res?.message || '문자 발송이 완료되었습니다.');
                            } catch (err: any) {
                              alert(err?.message || '문자 발송에 실패했습니다.');
                            } finally {
                              setIsSendingGuideSms(false);
                            }
                          }}
                          className="adm-btn primary small"
                        >
                          {isSendingGuideSms ? <Loader2 className="animate-spin" /> : <MessageCircle />}
                          <span>LMS 문자 발송</span>
                        </button>
                      </div>
                    </div>

                    <div className="adm-segmented">
                      {guideTemplates.map((tpl, idx) => (
                        <button
                          key={tpl.id || idx}
                          type="button"
                          onClick={() => setSelectedGuideIdx(idx)}
                          className={selectedGuideIdx === idx ? 'active' : ''}
                        >
                          {tpl.title}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setSelectedGuideIdx(-1)}
                        className={selectedGuideIdx === -1 ? 'active' : ''}
                      >
                        ✏️ 자유문자 직접 작성
                      </button>
                    </div>

                    {selectedGuideIdx === -1 ? (
                      <div className="space-y-3">
                        <div className="adm-field">
                          <label>문자 제목 (LMS)</label>
                          <input
                            type="text"
                            value={customSmsTitle}
                            onChange={(e) => setCustomSmsTitle(e.target.value)}
                            placeholder="[효원상조 × LG가전구독] 안내"
                            className="adm-input"
                          />
                        </div>
                        <div className="adm-field">
                          <div className="flex items-center justify-between">
                            <label>자유문자 본문</label>
                            <span className="text-[11px] text-[#86918a]">{customSmsDraft.length}자 (LMS)</span>
                          </div>
                          <textarea
                            rows={5}
                            value={customSmsDraft}
                            onChange={(e) => setCustomSmsDraft(e.target.value)}
                            placeholder="고객님께 발송할 자유 문자 내용을 입력하세요..."
                            className="adm-textarea"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="adm-field">
                        <div className="flex justify-end">
                          <span className="text-[11px] text-[#86918a]">{guideDraft.length}자 (LMS)</span>
                        </div>
                        <textarea
                          rows={6}
                          value={guideDraft}
                          onChange={(e) => setGuideDraft(e.target.value)}
                          className="adm-textarea"
                        />
                      </div>
                    )}
                  </div>

                  {/* Two-way SMS Chat History */}
                  <div className="adm-panel p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-[#295e52]" />
                        <strong className="text-[13.5px] font-bold text-[#263d36]">양방향 문자 대화 내역</strong>
                        <span className="adm-pill green">{smsLogs ? `${smsLogs.length}건` : '조회중...'}</span>
                      </div>
                      <span className="text-[11px] text-[#86918a]">좌측: 고객 답장 · 우측: 발신 문자</span>
                    </div>

                    {smsLogs && smsLogs.length > 0 ? (
                      <div
                        ref={chatScrollRef}
                        className="space-y-2.5 max-h-[280px] overflow-y-auto p-3.5 rounded-[10px] bg-[#f5f6f3] border border-[#e6eae3]"
                      >
                        {[...smsLogs].reverse().map((log: any) => {
                          const isInbound = log.direction === 'inbound';
                          const isExpanded = expandedSmsLogId === log._id;
                          const isLongMessage =
                            (log.message?.length || 0) > 160 || (log.message?.split('\n').length || 0) > 4;
                          const kst = new Date(log.createdAt + 9 * 60 * 60 * 1000);
                          const formattedDate = `${String(kst.getUTCMonth() + 1).padStart(2, '0')}.${String(
                            kst.getUTCDate()
                          ).padStart(2, '0')} ${String(kst.getUTCHours()).padStart(2, '0')}:${String(
                            kst.getUTCMinutes()
                          ).padStart(2, '0')}`;

                          return (
                            <div
                              key={log._id}
                              className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-[11px] px-3.5 py-2.5 text-[12px] border ${
                                  isInbound
                                    ? 'bg-white border-[#e6eae3] text-[#263d36] rounded-tl-[3px]'
                                    : log.status === '실패'
                                      ? 'bg-[#faeae5] border-[#ead5cf] text-[#263d36] rounded-tr-[3px]'
                                      : 'bg-[#edf3e8] border-[#cfe0c7] text-[#263d36] rounded-tr-[3px]'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={`adm-pill ${
                                        isInbound
                                          ? 'teal'
                                          : log.status === '발송대기'
                                            ? 'orange'
                                            : log.status === '성공'
                                              ? log.smsType === '휴대폰발신'
                                                ? 'blue'
                                                : 'green'
                                              : 'red'
                                      }`}
                                    >
                                      {isInbound
                                        ? '고객 답장'
                                        : log.status === '발송대기'
                                          ? `${log.smsType || '발신'} (회사폰 전송중)`
                                          : log.smsType || '발신'}
                                    </span>
                                    {!isInbound && log.senderName && (
                                      <span className="text-[10.5px] text-[#5c6b5b] font-semibold">
                                        {log.senderName}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-mono text-[#86918a] shrink-0">
                                    {formattedDate}
                                  </span>
                                </div>
                                {log.title && !isInbound && (
                                  <div className="text-[11px] font-bold text-[#263d36] mb-1 truncate">
                                    {log.title}
                                  </div>
                                )}
                                <p
                                  className={`text-[#45554e] whitespace-pre-wrap break-words leading-relaxed ${
                                    isLongMessage && !isExpanded ? 'line-clamp-4' : ''
                                  }`}
                                >
                                  {log.message}
                                </p>
                                {isLongMessage && (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedSmsLogId(isExpanded ? null : log._id)}
                                    className="mt-1 text-[11px] font-bold text-[#295e52] hover:underline"
                                  >
                                    {isExpanded ? '접기' : '전체보기'}
                                  </button>
                                )}
                                {log.status === '실패' && log.errorMessage && (
                                  <div className="mt-1.5 text-[11px] text-[#a85042] bg-white/70 px-2 py-1 rounded">
                                    실패 사유: {log.errorMessage}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="adm-note-card text-center py-8 text-[#86918a]">
                        {smsLogs ? '아직 주고받은 문자 내역이 없습니다.' : '문자 내역을 불러오는 중입니다...'}
                      </div>
                    )}

                    {/* Quick Reply Input */}
                    <div className="flex items-end gap-2 pt-1">
                      <textarea
                        rows={2}
                        value={quickReplyDraft}
                        onChange={(e) => setQuickReplyDraft(e.target.value)}
                        placeholder="고객에게 바로 보낼 빠른 답장 내용을 입력하세요..."
                        className="adm-textarea !min-h-[54px] flex-1"
                      />
                      <button
                        type="button"
                        disabled={isSendingQuickReply || !quickReplyDraft.trim()}
                        onClick={async () => {
                          const targetPhone = editData.phone || selectedCustomer.phone;
                          if (!targetPhone) {
                            alert('고객 연락처가 없습니다.');
                            return;
                          }
                          if (!quickReplyDraft.trim()) return;
                          if (!confirm(`${selectedCustomer.name}님(${targetPhone})에게 문자를 발송하시겠습니까?`)) return;
                          setIsSendingQuickReply(true);
                          try {
                            await sendCustomGuideSms({
                              inquiryId: selectedCustomer._id,
                              customerName: selectedCustomer.name,
                              customerPhone: targetPhone,
                              smsType: '자유문자',
                              senderName: getCurrentWriterName(),
                              title: '[효원상조 × LG가전구독] 안내',
                              message: quickReplyDraft.trim(),
                            });
                            setQuickReplyDraft('');
                          } catch (err: any) {
                            alert(err?.message || '문자 발송에 실패했습니다.');
                          } finally {
                            setIsSendingQuickReply(false);
                          }
                        }}
                        className="adm-btn primary !h-[54px] shrink-0"
                      >
                        {isSendingQuickReply ? <Loader2 className="animate-spin" /> : <Send />}
                        <span>답장 전송</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 'info' && (
                <div className="space-y-5">
                  <div>
                    <div className="adm-section-label !mt-0">
                      <span>기본 고객 정보</span>
                    </div>
                    <div className="adm-field-grid">
                      <div className="adm-field">
                        <label>고객명</label>
                        <input
                          type="text"
                          value={editData.name || ''}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="adm-input"
                        />
                      </div>
                      <div className="adm-field">
                        <label>연락처</label>
                        <input
                          type="text"
                          value={editData.phone || ''}
                          onChange={(e) => setEditData({ ...editData, phone: formatPhoneNumber(e.target.value) })}
                          className="adm-input font-mono"
                        />
                      </div>
                      <div className="adm-field">
                        <label>성별</label>
                        <select
                          value={editData.gender || ''}
                          onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                          className="adm-select"
                        >
                          <option value="">선택</option>
                          <option>남성</option>
                          <option>여성</option>
                        </select>
                      </div>
                      <div className="adm-field">
                        <label>생년월일 (6자리)</label>
                        <input
                          type="text"
                          value={editData.birth || ''}
                          onChange={(e) => setEditData({ ...editData, birth: e.target.value })}
                          className="adm-input font-mono"
                          placeholder="YYMMDD"
                        />
                      </div>
                      <div className="adm-field full">
                        <div className="flex items-center justify-between">
                          <label>설치 주소</label>
                          <button type="button" onClick={openPostcode} className="adm-btn sage small">
                            우편번호 검색
                          </button>
                        </div>
                        <input
                          type="text"
                          value={editData.address || ''}
                          readOnly
                          onClick={openPostcode}
                          className="adm-input cursor-pointer !bg-[#f8f9f5]"
                          placeholder="기본 주소 (우편번호 검색)"
                        />
                        <input
                          type="text"
                          value={editData.detailAddress || ''}
                          onChange={(e) => setEditData({ ...editData, detailAddress: e.target.value })}
                          className="adm-input"
                          placeholder="상세 주소 입력"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="adm-section-label">
                      <span>상담 · 구독 계약 일정</span>
                    </div>
                    <div className="adm-field-grid">
                      <div className="adm-field">
                        <label>신규 접수일</label>
                        <input
                          type="date"
                          value={editData.newRegDate || ''}
                          onChange={(e) => setEditData({ ...editData, newRegDate: e.target.value })}
                          className="adm-input"
                        />
                      </div>
                      <div className="adm-field">
                        <label>상조 계약일</label>
                        <input
                          type="date"
                          value={editData.sangjoContractDate || ''}
                          onChange={(e) => setEditData({ ...editData, sangjoContractDate: e.target.value })}
                          className="adm-input"
                        />
                      </div>
                      <div className="adm-field">
                        <label>구독(렌탈) 계약일</label>
                        <input
                          type="date"
                          value={editData.rentalContractDate || ''}
                          onChange={(e) => setEditData({ ...editData, rentalContractDate: e.target.value })}
                          className="adm-input"
                        />
                      </div>
                      <div className="adm-field">
                        <label>가전 설치/배송일</label>
                        <input
                          type="date"
                          value={editData.deliveryDate || ''}
                          onChange={(e) => setEditData({ ...editData, deliveryDate: e.target.value })}
                          className="adm-input"
                        />
                      </div>
                      <div className="adm-field">
                        <label>청약 철회일</label>
                        <input
                          type="date"
                          value={editData.cancelDate || ''}
                          onChange={(e) => setEditData({ ...editData, cancelDate: e.target.value })}
                          className="adm-input"
                        />
                      </div>
                      <div className="adm-field">
                        <label>계약 해지일</label>
                        <input
                          type="date"
                          value={editData.terminationDate || ''}
                          onChange={(e) => setEditData({ ...editData, terminationDate: e.target.value })}
                          className="adm-input"
                        />
                      </div>
                      <div className="adm-field full">
                        <label>특이사항</label>
                        <input
                          type="text"
                          value={editData.note || ''}
                          onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                          className="adm-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="adm-section-label">
                      <span>LG구독 상품 및 케어서비스 설정</span>
                    </div>
                    <div className="space-y-4">
                      <div className="adm-field">
                        <label>신청상품 (카테고리)</label>
                        <select
                          value={editData.productName || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const plan = allPlans?.find((p) => p.name === val);
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
                          className="adm-select font-bold"
                        >
                          <option value="LG구독할인(new)">LG구독할인(new)</option>
                          <option value="LG가전구독(new) (1구좌)">LG가전구독(new) (1구좌)</option>
                          {allPlans?.map((plan) => (
                            <option key={plan._id} value={plan.name}>
                              {plan.name}
                            </option>
                          ))}
                          {editData.productName &&
                            editData.productName !== 'LG구독할인(new)' &&
                            editData.productName !== 'LG가전구독(new) (1구좌)' &&
                            !allPlans?.some((p) => p.name === editData.productName) && (
                              <option value={editData.productName}>{editData.productName}</option>
                            )}
                        </select>
                      </div>

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

                      {selectedCustomer.message && (
                        <div className="adm-field">
                          <label>고객 문의 메시지 · 견적 조건</label>
                          <div className="adm-note-card whitespace-pre-wrap">{selectedCustomer.message}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 'history' && (
                <div>
                  <div className="adm-section-label !mt-0">
                    <span>상태 변경 및 상담 이력</span>
                  </div>
                  {selectedCustomer.memoHistory && selectedCustomer.memoHistory.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedCustomer.memoHistory.map((history: any, idx: number) => (
                        <div key={idx} className="adm-note-card !bg-white flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="adm-pill green">{history.status}</span>
                              <span className="font-mono text-[11px] text-[#86918a]">{history.date}</span>
                            </div>
                            <p className="text-[12.5px] text-[#263d36] break-all">{history.memo}</p>
                          </div>
                          {history.writer && <span className="adm-pill gray shrink-0">{history.writer}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="adm-note-card text-center py-12 text-[#86918a]">
                      <History className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      기록된 상담/상태 변경 이력이 없습니다.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="adm-drawer-foot">
              <span className="adm-caption">고객 정보 및 진행상태 변경 후 저장하기를 눌러주세요.</span>
              <button type="button" onClick={() => setSelectedCustomer(null)} className="adm-btn">
                닫기
              </button>
              <button type="button" onClick={handleUpdate} className="adm-btn primary">
                <Save />
                <span>수정사항 저장하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Registration Modal */}
      {isRegisterModalOpen && (
        <div className="adm-modal-overlay">
          <div className="adm-modal max-w-[920px]">
            <div className="adm-drawer-head">
              <div>
                <h2>LG구독 고객 직접 등록</h2>
                <p>수기 상담 고객을 대기 목록에 담아 일괄 등록합니다.</p>
              </div>
              <button type="button" onClick={() => setIsRegisterModalOpen(false)} className="adm-icon-btn">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="adm-drawer-scroll flex flex-col lg:flex-row gap-6">
              <div className="flex-1 space-y-5">
                <div className="adm-panel p-5">
                  <div className="adm-section-label !mt-0">
                    <span>고객 기본 정보</span>
                  </div>
                  <div className="adm-field-grid">
                    <div className="adm-field">
                      <label>파트너 채널</label>
                      <select
                        value={registerForm.channelId}
                        onChange={(e) => setRegisterForm({ ...registerForm, channelId: e.target.value })}
                        className="adm-select"
                      >
                        {!channelId ? (
                          <>
                            <option value="본사">본사</option>
                            {channels?.map((c) => (
                              <option key={c._id} value={c.subdomain}>
                                {c.channelName}
                              </option>
                            ))}
                          </>
                        ) : (
                          channels
                            ?.filter((c) => subChannelIds?.includes(c.subdomain))
                            .map((c) => (
                              <option key={c._id} value={c.subdomain}>
                                {c.channelName}
                              </option>
                            ))
                        )}
                      </select>
                    </div>

                    <div className="adm-field">
                      <label>고객명 *</label>
                      <input
                        type="text"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        className="adm-input"
                        placeholder="성함 입력"
                      />
                    </div>

                    <div className="adm-field">
                      <label>연락처 *</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone: formatPhoneNumber(e.target.value) })}
                        className="adm-input font-mono"
                        placeholder="010-0000-0000"
                      />
                    </div>

                    <div className="adm-field">
                      <label>생년월일 (6자리)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={registerForm.birth}
                        onChange={(e) => setRegisterForm({ ...registerForm, birth: formatBirthDate(e.target.value) })}
                        className="adm-input font-mono"
                        placeholder="YY-MM-DD"
                        maxLength={8}
                      />
                    </div>

                    <div className="adm-field full">
                      <label>성별</label>
                      <div className="adm-segmented w-fit">
                        {['남성', '여성'].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setRegisterForm({ ...registerForm, gender: g })}
                            className={registerForm.gender === g ? 'active' : ''}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="adm-field full">
                      <div className="flex items-center justify-between">
                        <label>설치 주소</label>
                        <button type="button" onClick={openRegisterPostcode} className="adm-btn sage small">
                          주소 검색
                        </button>
                      </div>
                      <input
                        type="text"
                        value={registerForm.address}
                        readOnly
                        onClick={openRegisterPostcode}
                        className="adm-input cursor-pointer !bg-[#f8f9f5]"
                        placeholder="주소 검색을 클릭해주세요"
                      />
                      <input
                        type="text"
                        value={registerForm.detailAddress}
                        onChange={(e) => setRegisterForm({ ...registerForm, detailAddress: e.target.value })}
                        className="adm-input"
                        placeholder="상세 주소 입력"
                      />
                    </div>
                  </div>
                </div>

                <div className="adm-panel p-5 space-y-4">
                  <div className="adm-section-label !mt-0">
                    <span>LG구독 상품 옵션</span>
                  </div>
                  <div className="adm-field">
                    <label>신청상품 (카테고리)</label>
                    <select
                      value={registerForm.productName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRegisterForm({
                          ...registerForm,
                          productName: val,
                          account: '1구좌',
                          supplier: '라이프앤조이',
                        });
                      }}
                      className="adm-select font-bold"
                    >
                      <option value="LG구독할인(new)">LG구독할인(new)</option>
                      <option value="LG가전구독(new) (1구좌)">LG가전구독(new) (1구좌)</option>
                      <option value="LG전자 가전구독 X 효원라이프 144 (1구좌)">
                        LG전자 가전구독 X 효원라이프 144 (1구좌)
                      </option>
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

                  <button type="button" onClick={handleAddToList} className="adm-btn sage w-full">
                    <Plus />
                    <span>등록대기 목록에 추가</span>
                  </button>
                </div>
              </div>

              <div className="w-full lg:w-[300px] flex flex-col">
                <div className="adm-panel p-5 flex-1 flex flex-col">
                  <div className="adm-section-label !mt-0">
                    <span>등록대기 목록</span>
                    <span className="adm-pill green">{registerList.length}건</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[420px]">
                    {registerList.length === 0 ? (
                      <div className="py-16 text-center text-[#86918a] text-[12px]">
                        대기 목록이 비어있습니다.<br />좌측 폼을 입력해 추가해 주세요.
                      </div>
                    ) : (
                      registerList.map((item) => (
                        <div key={item.id} className="adm-note-card relative">
                          <button
                            type="button"
                            onClick={() => handleRemoveFromList(item.id)}
                            className="absolute top-2.5 right-2.5 text-[#86918a] hover:text-[#a85042]"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="font-bold text-[#263d36]">{item.name}</div>
                          <div className="font-mono text-[11.5px] text-[#6d786c] mb-2">{item.phone}</div>
                          <div className="flex flex-wrap gap-1">
                            <span className="adm-pill gray">{getChannelName(item.channelId)}</span>
                            {item.account && <span className="adm-pill green">{item.account}</span>}
                            {item.subscriptionPeriod && (
                              <span className="adm-pill blue">{item.subscriptionPeriod}</span>
                            )}
                            {item.appliance && (
                              <span className="adm-pill teal truncate max-w-[180px]">{item.appliance}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleBulkRegister}
                    disabled={registerList.length === 0}
                    className="adm-btn primary w-full mt-5"
                  >
                    총 {registerList.length}명 최종 등록하기
                  </button>
                </div>
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
