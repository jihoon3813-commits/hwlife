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
  Loader2,
  RotateCcw,
  Users,
  Clock,
  CheckCircle2,
  Calendar,
  MessageCircle,
  Send,
} from 'lucide-react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { LG_OFFICIAL_PRODUCTS } from '../data/lgCareProducts';
import { getCustomerInflow, getCustomerTrafficDetail, INFLOW_META, InflowType } from '../utils/inflow';
import DaangnLeadModal from '../components/DaangnLeadModal';
import {
  syncCustomersToGoogleContacts,
  syncSingleCustomerWithPrompt,
  getCachedGoogleContactPhones,
  normalizeKoreanPhone,
} from '../utils/googleContacts';
import { isLgCareCustomer } from './LgCustomerManagement';
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

export default function CustomerManagement({ channelId }: { channelId?: string }) {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [drawerTab, setDrawerTab] = useState<'info' | 'sms' | 'history'>('info');
  const [memo, setMemo] = useState('');
  const [status, setStatus] = useState('대기');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inflowFilter, setInflowFilter] = useState<'all' | InflowType>('all');
  const [isDaangnModalOpen, setIsDaangnModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [isSyncingGoogleContacts, setIsSyncingGoogleContacts] = useState(false);
  const [googleContactsProgress, setGoogleContactsProgress] = useState('');
  const [cachedGooglePhones, setCachedGooglePhones] = useState<Set<string>>(() => getCachedGoogleContactPhones());

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

  // Direct Registration State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerList, setRegisterList] = useState<any[]>([]);
  const [registerForm, setRegisterForm] = useState<any>({
    channelId: '본사',
    name: '',
    phone: '',
    productName: '',
    account: '',
    appliance: '',
    supplier: 'BSON',
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

  const nonLgInquiries = useMemo(() => {
    if (!inquiries) return undefined;
    return inquiries.filter((inq) => !isLgCareCustomer(inq));
  }, [inquiries]);

  const updateInquiry = useMutation(api.inquiries.update);
  const removeInquiry = useMutation(api.inquiries.remove);
  const createInquiry = useMutation(api.inquiries.create);
  const markGoogleContactsSynced = useMutation(api.inquiries.markGoogleContactsSynced);
  const allProducts = useQuery(api.products.getAllProducts);
  const sendConsentSms = useAction(api.sms.sendConsentSms);
  const sendCustomGuideSms = useAction(api.sms.sendCustomGuideSms);
  const markInboundRead = useMutation(api.sms.markInboundRead);
  const unreadSmsCounts = useQuery(api.sms.getUnreadInboundCounts) ?? {};
  const latestSmsMap = (useQuery(api.sms.getLatestSmsByInquiry) ?? {}) as Record<string, LatestSmsSummary>;
  const landings = useQuery(api.landings.get);
  const allPlans = useQuery(api.plans.get);

  const [quickReplyDraft, setQuickReplyDraft] = useState('');
  const [isSendingQuickReply, setIsSendingQuickReply] = useState(false);
  const [expandedSmsLogId, setExpandedSmsLogId] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const smsLogs = useQuery(
    api.sms.listByInquiry,
    selectedCustomer?._id ? { inquiryId: selectedCustomer._id } : 'skip'
  );

  useEffect(() => {
    setQuickReplyDraft('');
    setExpandedSmsLogId(null);
  }, [selectedCustomer?._id]);

  useEffect(() => {
    if (!selectedCustomer?._id) return;
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

  const handleSendQuickReply = async () => {
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
    const trimmed = quickReplyDraft.trim();
    if (!trimmed) return;
    setIsSendingQuickReply(true);
    try {
      const result = await sendCustomGuideSms({
        inquiryId: selectedCustomer._id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        title: '[효원상조] 상담 안내',
        message: trimmed,
        smsType: '자유문자',
        senderName: channelId || '본사 관리자',
      });
      if (result.success) {
        setQuickReplyDraft('');
      } else {
        alert(result.message || '문자 발송에 실패했습니다.');
      }
    } catch (err: any) {
      alert('문자 발송 중 오류가 발생했습니다: ' + (err?.message || ''));
    } finally {
      setIsSendingQuickReply(false);
    }
  };

  // Column Resizing Setup
  const DEFAULT_COLUMNS = useMemo(
    () => [
      { id: 'index', label: '순번', minWidth: 45, defaultWidth: 55, align: 'center' as const },
      { id: 'checkbox', label: '', minWidth: 40, defaultWidth: 45, align: 'center' as const },
      { id: 'source', label: '유입경로', minWidth: 65, defaultWidth: 85, align: 'center' as const },
      { id: 'createdAt', label: '등록일시', minWidth: 100, defaultWidth: 125, align: 'left' as const },
      { id: 'channel', label: '채널명', minWidth: 80, defaultWidth: 100, align: 'left' as const },
      { id: 'name', label: '고객명', minWidth: 90, defaultWidth: 115, align: 'left' as const },
      { id: 'phone', label: '연락처', minWidth: 110, defaultWidth: 125, align: 'left' as const },
      { id: 'address', label: '주소', minWidth: 140, defaultWidth: 200, align: 'left' as const },
      { id: 'productName', label: '신청상품', minWidth: 140, defaultWidth: 220, align: 'left' as const },
      { id: 'appliance', label: '결합제품', minWidth: 160, defaultWidth: 260, align: 'left' as const },
      { id: 'supplier', label: '공급사', minWidth: 70, defaultWidth: 90, align: 'center' as const },
      { id: 'recentSms', label: '최근 문자', minWidth: 150, defaultWidth: 190, align: 'left' as const },
      { id: 'status', label: '진행상태', minWidth: 75, defaultWidth: 95, align: 'center' as const },
    ],
    []
  );

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('customer_table_column_widths');
      if (saved) {
        const parsed = JSON.parse(saved);
        const initial: Record<string, number> = {};
        [
          { id: 'index', defaultWidth: 55 },
          { id: 'checkbox', defaultWidth: 45 },
          { id: 'source', defaultWidth: 80 },
          { id: 'createdAt', defaultWidth: 125 },
          { id: 'channel', defaultWidth: 100 },
          { id: 'name', defaultWidth: 115 },
          { id: 'phone', defaultWidth: 125 },
          { id: 'address', defaultWidth: 200 },
          { id: 'productName', defaultWidth: 220 },
          { id: 'appliance', defaultWidth: 260 },
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
      source: 80,
      createdAt: 125,
      channel: 100,
      name: 115,
      phone: 125,
      address: 200,
      productName: 220,
      appliance: 260,
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
            localStorage.setItem('customer_table_column_widths', JSON.stringify(current));
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
      source: 80,
      createdAt: 125,
      channel: 100,
      name: 115,
      phone: 125,
      address: 200,
      productName: 220,
      appliance: 260,
      supplier: 90,
      recentSms: 190,
      status: 95,
    };
    setColumnWidths(defaults);
    try {
      localStorage.removeItem('customer_table_column_widths');
    } catch (e) {}
  };

  const getSupplier = (customer: any): string => {
    if (customer.supplier && String(customer.supplier).trim() !== '' && customer.supplier !== '-') {
      return String(customer.supplier).trim();
    }

    const isLgCare =
      customer.source === 'lg_care' ||
      customer.productName?.includes('LG구독') ||
      customer.productName?.includes('LG가전구독') ||
      customer.productName?.includes('LG가전 구독') ||
      customer.productName?.includes('LG가전 구독 할인 전용') ||
      customer.productName?.includes('할인코드') ||
      customer.appliance?.includes('할인코드') ||
      customer.appliance?.includes('퓨리케어') ||
      customer.appliance?.includes('에어로타워');

    const applianceText = customer.appliance && customer.appliance !== '-' ? customer.appliance.trim() : '';
    const productNameText = customer.productName && customer.productName !== '-' ? customer.productName.trim() : '';
    const combinedText = `${applianceText} ${productNameText}`.trim();

    if (allProducts && allProducts.length > 0 && combinedText) {
      const cleanCombined = combinedText.toUpperCase().replace(/\s+/g, '');

      let matched = allProducts.find((p) => {
        if (!p.model) return false;
        const cleanModel = p.model.toUpperCase().replace(/\s+/g, '');
        return cleanModel.length >= 3 && cleanCombined.includes(cleanModel);
      });

      if (!matched) {
        matched = allProducts.find((p) => {
          if (!p.name) return false;
          const cleanName = p.name.trim();
          return cleanName.length >= 3 && (combinedText.includes(cleanName) || cleanName.includes(combinedText));
        });
      }

      if (!matched) {
        matched = allProducts.find((p) => {
          const fullTitle = `${p.brand} ${p.name}`.trim();
          return fullTitle.length >= 3 && (combinedText.includes(fullTitle) || fullTitle.includes(combinedText));
        });
      }

      if (matched) {
        const supplierValue = (matched as any).supplier || matched.supplyPrice;
        if (supplierValue && String(supplierValue).trim()) {
          return String(supplierValue).trim();
        }
      }
    }

    if (isLgCare || (productNameText && productNameText.startsWith('LG') && !productNameText.includes('('))) {
      return 'TU';
    }

    if (
      productNameText.includes('BSON') ||
      productNameText.includes('60패키지') ||
      productNameText.includes('UP가전') ||
      productNameText.includes('스페셜299')
    ) {
      return 'BSON';
    }
    if (productNameText.includes('리빙144') || productNameText.includes('신한')) {
      return '신한48';
    }
    if (productNameText.includes('KCC')) {
      return 'KCC';
    }

    return '-';
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
    if (selectedCustomer && allProducts && allPlans) {
      let resolvedCategoryName = selectedCustomer.productName;
      let resolvedAccount = selectedCustomer.account;
      let resolvedAppliance = selectedCustomer.appliance;

      const isStandardized =
        selectedCustomer.productName?.startsWith('리빙144') ||
        selectedCustomer.productName?.startsWith('스페셜299');

      if (!isStandardized) {
        const planByName = allPlans.find((p) => p.name === selectedCustomer.productName);

        if (!planByName) {
          const product = allProducts.find((p) => {
            const fullName = `${p.brand} ${p.name}`;
            const dbProductName = selectedCustomer.productName || '';
            const dbAppliance = selectedCustomer.appliance || '';

            return (
              dbProductName === p.name ||
              dbProductName === fullName ||
              (p.name && dbProductName.includes(p.name)) ||
              (p.model && (dbAppliance.includes(p.model) || dbProductName.includes(p.model)))
            );
          });

          if (product) {
            const plan = allPlans.find((pl) => pl.numericId === product.planId);
            if (plan) {
              resolvedCategoryName = plan.name;
              resolvedAccount = plan.accountCount;
              resolvedAppliance = `${product.name} (${product.model})`;
            }
          }
        } else {
          if (!resolvedAccount) resolvedAccount = planByName.accountCount;
        }
      }

      if (
        !resolvedAccount &&
        (resolvedCategoryName === 'LG구독할인(new)' ||
          resolvedCategoryName?.includes('LG') ||
          resolvedCategoryName?.includes('구독'))
      ) {
        resolvedAccount = '1구좌';
      }

      let initialAppliance = resolvedAppliance || selectedCustomer.appliance || '';
      if (initialAppliance) {
        initialAppliance = initialAppliance.replace(/\s*\[효원상조\s*\d+구좌\s*결합[^\]]*\]/g, '').trim();
      }

      const autoSupplier = getSupplier({
        ...selectedCustomer,
        productName: resolvedCategoryName || selectedCustomer.productName,
        appliance: initialAppliance,
      });
      const initialSupplier = selectedCustomer.supplier || (autoSupplier !== '-' ? autoSupplier : 'BSON');

      setEditData({
        ...selectedCustomer,
        phone: formatPhoneNumber(selectedCustomer.phone || ''),
        newRegDate:
          selectedCustomer.newRegDate ||
          new Date(selectedCustomer.createdAt + 9 * 60 * 60 * 1000).toISOString().split('T')[0],
        productName: resolvedCategoryName || selectedCustomer.productName,
        account: resolvedAccount || selectedCustomer.account,
        appliance: initialAppliance,
        supplier: initialSupplier,
      });
      setStatus(selectedCustomer.status || '대기');
      setMemo('');
      setDrawerTab('info');
    }
  }, [selectedCustomer, allProducts, allPlans]);

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

        setEditData((prev: any) => ({
          ...prev,
          address: fullAddr,
        }));
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

        setRegisterForm((prev: any) => ({
          ...prev,
          address: fullAddr,
        }));
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
      setRegisterList([...registerList, { ...registerForm, id: Date.now(), source: 'direct', inflow: 'direct' }]);
      setRegisterForm({
        channelId: channelId || '본사',
        name: '',
        phone: '',
        productName: '',
        account: '',
        appliance: '',
        supplier: 'BSON',
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
    if (confirm(`${registerList.length}명의 고객을 등록하시겠습니까?`)) {
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
    setRegisterForm((prev: any) => ({
      ...prev,
      channelId: channelId || '본사',
    }));
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
    if (!nonLgInquiries || !channels || channelId) return [];

    const pathMap: { [key: string]: string } = {};
    channels.forEach((c) => {
      if (c.landingPage) {
        pathMap[c.landingPage.replace('/', '')] = c.subdomain;
      }
    });

    const counts: { [key: string]: number } = {};
    nonLgInquiries.forEach((inq) => {
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

  const usedStatuses = settings?.statuses?.filter((s: any) => s.isUsed) || [
    { name: '대기', isUsed: true },
    { name: '상담완료', isUsed: true },
    { name: '거절', isUsed: true },
  ];

  const summaryStats = useMemo(() => {
    const list = nonLgInquiries || [];
    const todayRange = getFilterDateRange('today');
    const todayCount = list.filter((i) => i.createdAt >= todayRange.start && i.createdAt <= todayRange.end).length;
    const waitingCount = list.filter((i) => !i.status || i.status === '대기').length;
    const completedCount = list.filter((i) => (i.status || '').includes('완료') || (i.status || '').includes('계약')).length;
    return { total: list.length, todayCount, waitingCount, completedCount };
  }, [nonLgInquiries]);

  if (!nonLgInquiries) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <RefreshCw className="w-7 h-7 text-[#295e52] animate-spin mb-3" />
        <p className="text-[13px] font-semibold text-[#45554e]">고객 데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  const filteredInquiries = nonLgInquiries.filter((inq) => {
    if (selectedChannelId !== 'all') {
      const targetCid = selectedChannelId === 'default' || selectedChannelId === '본사' ? undefined : selectedChannelId;
      const inquiryCid = !inq.channelId || inq.channelId === '본사' || inq.channelId === 'default' ? undefined : inq.channelId;
      if (inquiryCid !== targetCid) return false;
    }

    if (statusFilter !== 'all' && (inq.status || '대기') !== statusFilter) {
      return false;
    }

    if (dateFilter !== 'all') {
      const range = getFilterDateRange(dateFilter, startDate, endDate);
      const time = inq.createdAt;
      if (time < range.start || time > range.end) return false;
    }

    if (inflowFilter !== 'all' && getCustomerInflow(inq) !== inflowFilter) {
      return false;
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

  return (
    <div>
      {/* Page Heading */}
      <div className="adm-page-heading">
        <div>
          <div className="adm-eyebrow">HYOWON SANGJO · CUSTOMERS</div>
          <h1>
            고객 관리
            {!channelId && selectedChannelId !== 'all' && (
              <span className="text-[#295e52] text-[17px] ml-2 font-bold">
                · {getChannelName(selectedChannelId === 'default' ? undefined : selectedChannelId)}
              </span>
            )}
          </h1>
          <p>
            스페셜299 · 리빙144 등 가전결합상조 상담 접수 고객을 조회하고 계약 일정을 관리합니다. (검색 결과{' '}
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
            <span>고객 직접 등록</span>
          </button>
        </div>
      </div>

      {/* 4-Column Metric Cards */}
      <div className="adm-metrics-grid">
        <div className="adm-metric clickable" onClick={() => { setStatusFilter('all'); setDateFilter('all'); }}>
          <div className="adm-metric-head">
            <span>전체 누적 고객</span>
            <div className="adm-metric-icon"><Users /></div>
          </div>
          <div className="adm-metric-value">
            {summaryStats.total.toLocaleString()}<span>명</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">일반 결합상품</span>
            <span>전체 누적 DB</span>
          </div>
        </div>

        <div className="adm-metric clickable" onClick={() => setDateFilter('today')}>
          <div className="adm-metric-head">
            <span>당일 신규 접수</span>
            <div className="adm-metric-icon"><Calendar /></div>
          </div>
          <div className="adm-metric-value">
            {summaryStats.todayCount.toLocaleString()}<span>명</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">KST 오늘 기준</span>
            <span>실시간 인입</span>
          </div>
        </div>

        <div className="adm-metric clickable" onClick={() => setStatusFilter('대기')}>
          <div className="adm-metric-head">
            <span>상담 대기 고객</span>
            <div className="adm-metric-icon"><Clock /></div>
          </div>
          <div className="adm-metric-value">
            {summaryStats.waitingCount.toLocaleString()}<span>명</span>
          </div>
          <div className="adm-metric-foot">
            <span className={`adm-metric-trend ${summaryStats.waitingCount > 0 ? 'warning' : ''}`}>
              {summaryStats.waitingCount > 0 ? '해피콜 필요' : '대기 없음'}
            </span>
            <span>우선 상담 대상</span>
          </div>
        </div>

        <div className="adm-metric">
          <div className="adm-metric-head">
            <span>상담 · 계약 완료</span>
            <div className="adm-metric-icon"><CheckCircle2 /></div>
          </div>
          <div className="adm-metric-value">
            {summaryStats.completedCount.toLocaleString()}<span>명</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">누적 성과</span>
            <span>정상 진행 건</span>
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
              전체 채널 ({nonLgInquiries.length})
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
            현재 <strong className="text-white">{selectedIds.length}명</strong>의 고객이 선택되었습니다.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="adm-btn small"
            >
              선택 해제
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="adm-btn danger small"
            >
              <Trash2 />
              <span>선택 삭제 ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Panel: Tabs + Filter Bar + Table */}
      <div className="adm-panel">
        {/* Status Tabs */}
        <div className="adm-tabs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`adm-tab ${statusFilter === 'all' ? 'active' : ''}`}
          >
            <span>전체 상태</span>
            <span className="adm-tab-count">{nonLgInquiries.length}</span>
          </button>
          {usedStatuses.map((s: any) => {
            const cnt = nonLgInquiries.filter((i) => (i.status || '대기') === s.name).length;
            return (
              <button
                key={s.name}
                type="button"
                onClick={() => setStatusFilter(s.name)}
                className={`adm-tab ${statusFilter === s.name ? 'active' : ''}`}
              >
                <span>{s.name}</span>
                <span className="adm-tab-count">{cnt}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Row 1: Search + Channel Select + Inflow Segmented */}
        <div className="adm-filter-bar">
          <div className="adm-search-field">
            <Search />
            <input
              type="text"
              placeholder="고객명, 연락처, 주소, 상품, 공급사 검색..."
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

          <div className="adm-segmented">
            {(['all', 'landing', 'direct', 'daangn'] as const).map((type) => {
              const count =
                type === 'all'
                  ? nonLgInquiries.length
                  : nonLgInquiries.filter((i) => getCustomerInflow(i) === type).length;
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

        {/* Filter Row 2: Date Range Segmented + Column Reset */}
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
              title="열 너비를 기본값으로 초기화합니다"
            >
              <RotateCcw />
              <span>열 간격 초기화</span>
            </button>
          </div>
        </div>

        {/* Resizable Data Table */}
        <div className="adm-table-scroll custom-scrollbar">
          <table
            className="adm-table table-fixed min-w-full"
            style={{
              width: `${DEFAULT_COLUMNS.reduce((sum, col) => sum + (columnWidths[col.id] || col.defaultWidth), 0)}px`,
            }}
          >
            <thead className="select-none">
              <tr>
                {DEFAULT_COLUMNS.map((col) => {
                  const width = columnWidths[col.id] || col.defaultWidth;
                  return (
                    <th
                      key={col.id}
                      style={{ width: `${width}px`, minWidth: `${col.minWidth}px` }}
                      className={`relative group ${col.align === 'center' ? 'text-center' : 'text-left'}`}
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
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize select-none flex items-center justify-center hover:bg-[#295e52]/15 transition-colors z-10"
                        title="드래그하여 열 너비 조절"
                      >
                        <div className="w-[1px] h-3.5 bg-[#dce2d8]" />
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center !py-20 text-[#86918a]">
                    조건에 일치하는 고객 데이터가 없습니다.
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

                  if ((!customer.appliance || customer.appliance === '-') && customer.productName?.startsWith('[')) {
                    const bracketMatch = customer.productName.match(/^\[(.*?)\]\s*(.*)$/);
                    if (bracketMatch) {
                      const acc = bracketMatch[1];
                      const rest = bracketMatch[2];
                      displayPlan = `가전상조 60패키지 (${acc})`;
                      displayAppliance = rest;
                    }
                  }

                  if (
                    customer.source === 'lg_care' ||
                    customer.productName?.includes('LG구독') ||
                    customer.productName?.includes('LG가전구독') ||
                    customer.productName?.startsWith('LG')
                  ) {
                    const lgLanding = landings?.find((l) => l.path === '/care_new' || l.path === '/care');
                    const baseLandingTitle = lgLanding?.name || 'LG가전 구독 할인 전용 (new)';
                    if (!customer.productName || customer.productName.startsWith('[')) {
                      displayPlan = baseLandingTitle;
                    } else {
                      displayPlan = customer.productName;
                    }
                  } else {
                    const isStandardized =
                      customer.productName?.startsWith('리빙144') ||
                      customer.productName?.startsWith('스페셜299');

                    if (isStandardized) {
                      displayPlan = customer.productName;
                    } else {
                      const planByName = allPlans?.find((p) => p.name === customer.productName);
                      if (!planByName && allProducts && allPlans) {
                        const matchedProduct = allProducts.find(
                          (p) =>
                            p.name === customer.productName ||
                            `${p.brand} ${p.name}` === customer.productName ||
                            (p.model && customer.appliance?.includes(p.model))
                        );
                        if (matchedProduct) {
                          const plan = allPlans.find((pl) => pl.numericId === matchedProduct.planId);
                          if (plan) displayPlan = plan.name;
                        }
                      } else if (planByName) {
                        displayPlan = planByName.name;
                      }
                    }
                  }

                  const isMainSubmission =
                    displayPlan?.endsWith('_메인') || customer.productName?.endsWith('_메인');
                  let finalOutput = displayPlan;

                  if (!isMainSubmission && customer.account) {
                    const accountStr = `(${customer.account})`;
                    if (displayPlan && !displayPlan.includes(accountStr)) {
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

                      <td style={{ width: `${Math.max(columnWidths.source, 70)}px` }} className="text-center truncate">
                        {(() => {
                          const inflow = getCustomerInflow(customer);
                          const meta = INFLOW_META[inflow];
                          const detail = getCustomerTrafficDetail(customer);
                          const pillColor = inflow === 'daangn' ? 'orange' : inflow === 'direct' ? 'gray' : 'green';
                          return (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`adm-pill ${pillColor}`}>{meta.label}</span>
                              {detail && (
                                <span
                                  title={detail.tooltip}
                                  className="text-[10px] font-medium text-[#7d8879] max-w-full truncate"
                                >
                                  {detail.label}
                                </span>
                              )}
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
                          <div className="adm-person-circle">{(customer.name || '고').slice(0, 1)}</div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <strong className="truncate">{customer.name}</strong>
                            {unreadSmsCount > 0 && (
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
                        <div
                          className="line-clamp-2 text-[12px] text-[#45554e] leading-snug break-keep"
                          title={displayAppliance}
                        >
                          {displayAppliance}
                        </div>
                      </td>

                      <td style={{ width: `${columnWidths.supplier}px` }} className="text-center truncate">
                        {supplierName !== '-' ? (
                          <span className={`adm-pill ${supplierName === 'TU' ? 'orange' : 'blue'}`}>
                            {supplierName}
                          </span>
                        ) : (
                          <span className="text-[#9ba594]">-</span>
                        )}
                      </td>

                      <td style={{ width: `${columnWidths.recentSms}px` }} className="truncate">
                        <RecentSmsCell
                          latestSms={latestSmsMap[String(customer._id)]}
                          unreadCount={unreadSmsCount}
                        />
                      </td>

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
            전체 {nonLgInquiries.length}명 중 검색 결과 <strong className="text-[#263d36]">{filteredInquiries.length}</strong>명
          </span>
          <span>행을 클릭하면 우측 상세 슬라이드 패널에서 수정할 수 있습니다.</span>
        </div>
      </div>

      {/* Slide-over Customer Detail Drawer (Sono Partner Center Style) */}
      {selectedCustomer && (
        <div className="adm-drawer-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="adm-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="adm-drawer-head">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2>고객 상세 정보</h2>
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
                    title="구매동의 문자 발송"
                  >
                    {isSendingSms ? <Loader2 className="animate-spin" /> : <Smartphone />}
                    <span>구매동의 발송</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDelete}
                  className="adm-btn danger small"
                  title="고객 삭제"
                >
                  <Trash2 />
                  <span>삭제</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="adm-icon-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="adm-drawer-tabs">
              <button
                type="button"
                onClick={() => setDrawerTab('info')}
                className={`adm-drawer-tab ${drawerTab === 'info' ? 'active' : ''}`}
              >
                고객 · 계약 정보
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('sms')}
                className={`adm-drawer-tab ${drawerTab === 'sms' ? 'active' : ''}`}
              >
                문자 대화
                <span className="adm-tab-count">{smsLogs?.length || 0}</span>
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('history')}
                className={`adm-drawer-tab ${drawerTab === 'history' ? 'active' : ''}`}
              >
                상담 · 상태 이력
                <span className="adm-tab-count">{selectedCustomer.memoHistory?.length || 0}</span>
              </button>
            </div>

            <div className="adm-drawer-scroll space-y-5">
              {/* Customer Header Summary & Progress Flow */}
              <div className="flex items-center gap-3.5 p-4 rounded-[12px] bg-white border border-[#e6eae3]">
                <div className="w-11 h-11 rounded-full bg-[#eaf0e4] text-[#295e52] font-bold text-[15px] grid place-items-center shrink-0">
                  {(editData.name || selectedCustomer.name || '고').slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold text-[#263d36]">
                    {editData.name || selectedCustomer.name}{' '}
                    <span className="text-[12.5px] font-mono font-medium text-[#6d786c] ml-1">
                      {formatPhoneNumber(editData.phone || selectedCustomer.phone || '')}
                    </span>
                  </div>
                  <div className="text-[12px] text-[#7d877f] truncate mt-0.5">
                    {editData.productName || '-'} {editData.appliance ? `· ${editData.appliance}` : ''}
                  </div>
                </div>
              </div>

              <div className="adm-flow-mini">
                <span className="done">✓ 1. 상담 접수</span>
                <span className={status !== '대기' ? 'done' : ''}>
                  {status !== '대기' ? '✓' : '•'} 2. 해피콜 · 상담진행
                </span>
                <span className={editData.purchaseConsentDate || editData.rentalContractDate ? 'done' : ''}>
                  {editData.purchaseConsentDate || editData.rentalContractDate ? '✓' : '•'} 3. 동의 · 가전접수
                </span>
                <span className={editData.sangjoContractDate || status.includes('완료') ? 'done' : ''}>
                  {editData.sangjoContractDate || status.includes('완료') ? '✓' : '•'} 4. 정상 계약
                </span>
              </div>

              {/* Quick Status & Memo Update Card */}
              <div className="adm-note-card space-y-3">
                <div className="text-[12px] font-bold text-[#263d36]">진행상태 변경 및 상담 메모 기록</div>
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
                    placeholder="상담 내용 또는 상태 변경 사유를 입력하세요 (저장 시 이력에 기록됨)"
                    className="adm-input flex-1"
                  />
                </div>
              </div>

              {drawerTab === 'info' ? (
                <>
                  {/* 1. 기본 고객 정보 */}
                  <div>
                    <div className="adm-section-label">
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
                          <label>배송지 주소</label>
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
                          placeholder="우편번호 검색을 클릭해 기본 주소를 선택하세요"
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

                  {/* 2. 상담/계약 일정 정보 */}
                  <div>
                    <div className="adm-section-label">
                      <span>상담 · 계약 일정 관리</span>
                    </div>
                    <div className="adm-field-grid">
                      {selectedCustomer.productName?.toLowerCase().includes('living') ||
                      selectedCustomer.productName?.includes('리빙') ||
                      editData.productName?.includes('리빙') ? (
                        <>
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
                            <label>카드 결제일 (신한48)</label>
                            <input
                              type="date"
                              value={editData.cardPaymentDate || ''}
                              onChange={(e) => setEditData({ ...editData, cardPaymentDate: e.target.value })}
                              className="adm-input"
                            />
                          </div>
                          <div className="adm-field">
                            <label>구매 동의일 (자동 기록)</label>
                            <input
                              type="date"
                              value={editData.purchaseConsentDate || ''}
                              readOnly
                              className="adm-input !bg-[#edf3e8] text-[#295e52] font-bold"
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
                          <div className="adm-field">
                            <label>가전 배송일</label>
                            <input
                              type="date"
                              value={editData.deliveryDate || ''}
                              onChange={(e) => setEditData({ ...editData, deliveryDate: e.target.value })}
                              className="adm-input"
                            />
                          </div>
                        </>
                      ) : (
                        <>
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
                            <label>렌탈 계약일</label>
                            <input
                              type="date"
                              value={editData.rentalContractDate || ''}
                              onChange={(e) => setEditData({ ...editData, rentalContractDate: e.target.value })}
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
                          <div className="adm-field">
                            <label>가전 배송일</label>
                            <input
                              type="date"
                              value={editData.deliveryDate || ''}
                              onChange={(e) => setEditData({ ...editData, deliveryDate: e.target.value })}
                              className="adm-input"
                            />
                          </div>
                        </>
                      )}
                      <div className="adm-field full">
                        <label>특이사항 메모</label>
                        <input
                          type="text"
                          value={editData.note || ''}
                          onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                          className="adm-input"
                          placeholder="해피콜 가능 시간대 등 참고사항 기록"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. 신청 상품 정보 */}
                  <div>
                    <div className="adm-section-label">
                      <span>신청 상품 및 결합가전 정보</span>
                    </div>
                    <div className="adm-field-grid">
                      <div className="adm-field">
                        <label>신청상품 (플랜 카테고리)</label>
                        <select
                          value={editData.productName || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const plan = allPlans?.find((p) => p.name === val);
                            let resolvedAcc = plan ? plan.accountCount : '';
                            if (val === 'LG구독할인(new)' || val.includes('LG구독') || val.includes('LG가전구독')) {
                              resolvedAcc = '1구좌';
                            }
                            setEditData({
                              ...editData,
                              productName: val,
                              account: resolvedAcc,
                              appliance: '',
                            });
                          }}
                          className="adm-select font-bold"
                        >
                          <option value="">카테고리 선택</option>
                          {allPlans?.map((plan) => (
                            <option key={plan._id} value={plan.name}>
                              {plan.name}
                            </option>
                          ))}
                          <option value="LG구독할인(new)">LG구독할인(new)</option>
                          {editData.productName &&
                            editData.productName !== 'LG구독할인(new)' &&
                            !allPlans?.some((p) => p.name === editData.productName) && (
                              <option value={editData.productName}>{editData.productName}</option>
                            )}
                        </select>
                      </div>

                      <div className="adm-field">
                        <label>구좌수</label>
                        <input
                          type="text"
                          value={editData.account || ''}
                          readOnly
                          className="adm-input !bg-[#f8f9f5] font-bold"
                        />
                      </div>

                      <div className="adm-field">
                        <label>결합 가전명 (제품명 · 모델명)</label>
                        <select
                          value={editData.appliance || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            let newSupplier = editData.supplier;
                            if (val) {
                              const found = allProducts?.find(
                                (p) =>
                                  `${p.name} (${p.model})` === val ||
                                  p.model === val ||
                                  `${p.brand} ${p.name} (${p.model})` === val
                              );
                              if (found) {
                                const supp = (found as any).supplier || found.supplyPrice;
                                if (supp) newSupplier = String(supp).trim();
                              } else if (val.includes('LG') || editData.productName?.includes('LG')) {
                                newSupplier = 'TU';
                              }
                            }
                            setEditData({
                              ...editData,
                              appliance: val,
                              supplier: newSupplier,
                            });
                          }}
                          className="adm-select"
                        >
                          <option value="">가전 선택</option>
                          {editData.appliance &&
                            !allProducts?.some(
                              (p) =>
                                `${p.name} (${p.model})` === editData.appliance ||
                                p.model === editData.appliance ||
                                `${p.brand} ${p.name} (${p.model})` === editData.appliance
                            ) &&
                            !LG_OFFICIAL_PRODUCTS?.some(
                              (p) => `[${p.categoryName}] ${p.name} (${p.model})` === editData.appliance || p.model === editData.appliance
                            ) && <option value={editData.appliance}>{editData.appliance} (랜딩페이지 접수 가전)</option>}

                          {(selectedCustomer?.source === 'lg_care' ||
                            editData.productName?.includes('LG') ||
                            editData.productName?.includes('가전구독') ||
                            editData.productName?.includes('구독')) && (
                            <>
                              <option value="상담 시 제품선택 (전문 상담원 맞춤 추천)">상담 시 제품선택 (전문 상담원 맞춤 추천)</option>
                              {Object.entries(lgProductsByCategory).map(([catName, prods]: [string, any]) => (
                                <optgroup key={catName} label={`LG 가전구독 - ${catName} (${prods.length})`}>
                                  {prods.map((p: any) => {
                                    const itemText = `[${p.categoryName}] ${p.name} (${p.model})`;
                                    return (
                                      <option key={p.id} value={itemText}>
                                        {itemText}
                                      </option>
                                    );
                                  })}
                                </optgroup>
                              ))}
                            </>
                          )}

                          <optgroup label="결합 가전 상품 목록">
                            {allProducts
                              ?.filter((p) => {
                                if (!p.model) return false;
                                if (!editData.productName) return true;
                                const plan = allPlans?.find((pl) => pl.name === editData.productName);
                                if (plan) return p.planId === plan.numericId;
                                if (editData.productName.includes('리빙144')) {
                                  const targetId =
                                    editData.productName.includes('2구좌') || editData.productName.includes('더블') ? 2 : 3;
                                  return p.planId === targetId;
                                }
                                if (editData.productName.includes('스페셜299')) {
                                  const targetId = editData.productName.includes('BSON') ? 1 : 4;
                                  return p.planId === targetId;
                                }
                                return true;
                              })
                              .map((p) => (
                                <option key={p._id} value={`${p.name} (${p.model})`}>
                                  {p.brand} {p.name} ({p.model})
                                </option>
                              ))}
                          </optgroup>
                        </select>
                      </div>

                      <div className="adm-field">
                        <label>공급사</label>
                        <select
                          value={editData.supplier || 'BSON'}
                          onChange={(e) => setEditData({ ...editData, supplier: e.target.value })}
                          className="adm-select font-bold"
                        >
                          <option value="BSON">BSON</option>
                          <option value="TU">TU</option>
                          <option value="신한48">신한48</option>
                          <option value="KCC">KCC</option>
                          <option value="라이프앤조이">라이프앤조이</option>
                          <option value="기타">기타</option>
                        </select>
                      </div>

                      {selectedCustomer.message && (
                        <div className="adm-field full">
                          <label>고객 접수 문의 메시지</label>
                          <div className="adm-note-card">{selectedCustomer.message}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : drawerTab === 'sms' ? (
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
                      className="space-y-2.5 max-h-[320px] overflow-y-auto p-3.5 rounded-[10px] bg-[#f5f6f3] border border-[#e6eae3]"
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
                      <MessageCircle className="w-6 h-6 mx-auto mb-2 opacity-40" />
                      아직 이 고객과 주고받은 문자 내역이 없습니다.
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#edf0e7]">
                    <label className="block text-[11.5px] font-semibold text-[#5c6b5b] mb-1.5">
                      빠른 답장 보내기
                    </label>
                    <div className="flex items-end gap-2">
                      <textarea
                        rows={2}
                        value={quickReplyDraft}
                        onChange={(e) => setQuickReplyDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                            e.preventDefault();
                            handleSendQuickReply();
                          }
                        }}
                        placeholder="고객에게 바로 보낼 답장 내용을 입력하세요... (Ctrl+Enter 발송)"
                        className="adm-textarea flex-1 !min-h-[54px] text-[12.5px] resize-none"
                      />
                      <button
                        type="button"
                        onClick={handleSendQuickReply}
                        disabled={isSendingQuickReply || !quickReplyDraft.trim()}
                        className="adm-btn primary shrink-0 h-[54px] px-4"
                      >
                        {isSendingQuickReply ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span>답장 발송</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="adm-section-label !mt-0">
                    <span>상담 및 상태 변경 이력</span>
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
              <span className="adm-caption">변경사항은 저장하기 버튼을 누르면 즉시 반영됩니다.</span>
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

      {/* Direct Customer Registration Modal */}
      {isRegisterModalOpen && (
        <div className="adm-modal-overlay">
          <div className="adm-modal max-w-[920px]">
            <div className="adm-drawer-head">
              <div>
                <h2>신규 고객 직접 등록</h2>
                <p>수기 접수 고객을 단일 또는 복수 대기열에 담아 일괄 등록할 수 있습니다.</p>
              </div>
              <button type="button" onClick={() => setIsRegisterModalOpen(false)} className="adm-icon-btn">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="adm-drawer-scroll flex flex-col lg:flex-row gap-6">
              {/* Left Form */}
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
                        <label>주소</label>
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
                        placeholder="주소 검색 버튼을 클릭해주세요"
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
                    <span>상품 및 가전 선택</span>
                  </div>
                  <div className="adm-field-grid">
                    <div className="adm-field full">
                      <label>신청상품 (카테고리)</label>
                      <select
                        value={registerForm.productName}
                        onChange={(e) => {
                          const val = e.target.value;
                          const plan = allPlans?.find((p) => p.name === val);
                          let resolvedAccount = plan ? plan.accountCount : '';
                          if (val === 'LG구독할인(new)' || val.includes('LG구독') || val.includes('LG가전구독')) {
                            resolvedAccount = '1구좌';
                          }
                          let defaultSupplier = 'BSON';
                          if (val === 'LG구독할인(new)' || val.includes('LG구독') || val.includes('LG가전구독') || val.includes('LG')) {
                            defaultSupplier = 'TU';
                          } else if (val.includes('리빙144') || val.includes('신한')) {
                            defaultSupplier = '신한48';
                          } else if (val.includes('KCC')) {
                            defaultSupplier = 'KCC';
                          }
                          setRegisterForm({
                            ...registerForm,
                            productName: val,
                            account: resolvedAccount,
                            supplier: defaultSupplier,
                            appliance: '',
                          });
                        }}
                        className="adm-select font-bold"
                      >
                        <option value="">카테고리 선택</option>
                        {allPlans?.map((plan) => (
                          <option key={plan._id} value={plan.name}>
                            {plan.name}
                          </option>
                        ))}
                        <option value="LG구독할인(new)">LG구독할인(new)</option>
                      </select>
                    </div>

                    <div className="adm-field">
                      <label>구좌수</label>
                      <input
                        type="text"
                        value={registerForm.account}
                        readOnly
                        className="adm-input !bg-[#f8f9f5] font-bold"
                        placeholder="자동 입력"
                      />
                    </div>

                    <div className="adm-field">
                      <label>공급사</label>
                      <select
                        value={registerForm.supplier || 'BSON'}
                        onChange={(e) => setRegisterForm({ ...registerForm, supplier: e.target.value })}
                        className="adm-select font-bold"
                      >
                        <option value="BSON">BSON</option>
                        <option value="TU">TU</option>
                        <option value="신한48">신한48</option>
                        <option value="KCC">KCC</option>
                        <option value="라이프앤조이">라이프앤조이</option>
                        <option value="기타">기타</option>
                      </select>
                    </div>

                    <div className="adm-field full">
                      <label>결합 가전제품</label>
                      <select
                        value={registerForm.appliance}
                        onChange={(e) => {
                          const appVal = e.target.value;
                          let newSupplier = registerForm.supplier;
                          if (appVal) {
                            const found = allProducts?.find(
                              (p) =>
                                `${p.name} (${p.model})` === appVal ||
                                p.model === appVal ||
                                `${p.brand} ${p.name} (${p.model})` === appVal
                            );
                            if (found) {
                              const supp = (found as any).supplier || found.supplyPrice;
                              if (supp) newSupplier = String(supp).trim();
                            } else if (appVal.includes('LG') || registerForm.productName?.includes('LG')) {
                              newSupplier = 'TU';
                            }
                          }
                          setRegisterForm({ ...registerForm, appliance: appVal, supplier: newSupplier });
                        }}
                        className="adm-select"
                      >
                        <option value="">가전 선택</option>
                        {registerForm.productName === 'LG구독할인(new)' ||
                        registerForm.productName?.includes('LG') ||
                        registerForm.productName?.includes('구독') ? (
                          <>
                            <option value="상담 시 제품선택 (전문 상담원 맞춤 추천)">상담 시 제품선택 (전문 상담원 맞춤 추천)</option>
                            {Object.entries(lgProductsByCategory).map(([catName, prods]: [string, any]) => (
                              <optgroup key={catName} label={`LG 가전구독 - ${catName} (${prods.length})`}>
                                {prods.map((p: any) => {
                                  const itemText = `[${p.categoryName}] ${p.name} (${p.model})`;
                                  return (
                                    <option key={p.id} value={itemText}>
                                      {itemText}
                                    </option>
                                  );
                                })}
                              </optgroup>
                            ))}
                          </>
                        ) : (
                          allProducts
                            ?.filter((p) => {
                              if (!p.model) return false;
                              if (!registerForm.productName) return true;
                              const plan = allPlans?.find((pl) => pl.name === registerForm.productName);
                              return plan && p.planId === plan.numericId;
                            })
                            .map((p) => (
                              <option key={p._id} value={`${p.name} (${p.model})`}>
                                {p.brand} {p.name} ({p.model})
                              </option>
                            ))
                        )}
                      </select>
                    </div>
                  </div>

                  <button type="button" onClick={handleAddToList} className="adm-btn sage w-full">
                    <Plus />
                    <span>등록대기 목록에 추가</span>
                  </button>
                </div>
              </div>

              {/* Right Wait List */}
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
                        <div key={item.id} className="adm-note-card relative group">
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
                            {item.productName && <span className="adm-pill green">{item.productName}</span>}
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
        defaultIsLgCare={false}
      />
    </div>
  );
}
