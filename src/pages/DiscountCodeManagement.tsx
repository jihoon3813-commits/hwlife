import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { 
  KeyRound, Plus, Trash2, Copy, Check, Search, User, Phone, 
  Clock, AlertTriangle, Sparkles, CheckCircle2, XCircle, RefreshCw
} from 'lucide-react';

export default function DiscountCodeManagement() {
  const discountCodes = useQuery(api.discountCodes.list) || [];
  const createCode = useMutation(api.discountCodes.create);
  const batchCreateCodes = useMutation(api.discountCodes.batchCreate);
  const removeCode = useMutation(api.discountCodes.remove);
  const batchDeleteCodes = useMutation(api.discountCodes.batchDelete);
  const toggleActive = useMutation(api.discountCodes.toggleActive);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'single' | 'batch'>('single');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Single Form State
  const [singleForm, setSingleForm] = useState({
    code: '',
    customerName: '',
    customerPhone: '',
    memo: '',
    expiryPreset: '30',
    customExpiryDate: '',
    isActive: true,
  });

  // Batch Form State
  const [batchForm, setBatchForm] = useState({
    count: 10,
    prefix: 'LG',
    customerName: '',
    customerPhone: '',
    memo: '',
    expiryPreset: '30',
    customExpiryDate: '',
  });

  // Copy helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  // Filtered Codes
  const filteredCodes = useMemo(() => {
    const now = Date.now();
    return discountCodes.filter((item) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchCode = item.code.toLowerCase().includes(term);
        const matchName = (item.customerName || '').toLowerCase().includes(term);
        const matchPhone = (item.customerPhone || '').includes(term);
        const matchMemo = (item.memo || '').toLowerCase().includes(term);
        if (!matchCode && !matchName && !matchPhone && !matchMemo) return false;
      }
      if (statusFilter === 'active') {
        if (!item.isActive) return false;
        if (item.expiresAt && item.expiresAt < now) return false;
      }
      if (statusFilter === 'expired') {
        if (!item.expiresAt || item.expiresAt >= now) return false;
      }
      return true;
    });
  }, [discountCodes, searchTerm, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const now = Date.now();
    let active = 0;
    let expired = 0;
    for (const c of discountCodes) {
      if (c.expiresAt && c.expiresAt < now) {
        expired++;
      } else if (c.isActive) {
        active++;
      }
    }
    return {
      total: discountCodes.length,
      active,
      expired,
    };
  }, [discountCodes]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredCodes.map((c) => c._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`selected ${selectedIds.length} codes delete?`)) return;
    try {
      await batchDeleteCodes({ ids: selectedIds as any });
      setSelectedIds([]);
      alert('selected discount codes deleted successfully');
    } catch (err) {
      console.error(err);
      alert('error deleting discount codes');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`delete discount code '${code}'?`)) return;
    try {
      await removeCode({ id: id as any });
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err) {
      console.error(err);
      alert('error deleting discount code');
    }
  };
  const calculateExpiry = (preset: string, customDate: string): number | undefined => {
    if (preset === 'unlimited') return undefined;
    if (preset === 'custom') {
      if (!customDate) return undefined;
      return new Date(customDate).getTime();
    }
    const days = parseInt(preset, 10) || 30;
    return Date.now() + days * 24 * 60 * 60 * 1000;
  };

  const handleGenerateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = 'LG-';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSingleForm(prev => ({ ...prev, code: rand }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (createMode === 'single') {
        if (!singleForm.code.trim()) {
          alert('할인코드를 입력해주세요.');
          setIsSubmitting(false);
          return;
        }
        const expiresAt = calculateExpiry(singleForm.expiryPreset, singleForm.customExpiryDate);
        await createCode({
          code: singleForm.code.trim().toUpperCase(),
          customerName: singleForm.customerName.trim() || undefined,
          customerPhone: singleForm.customerPhone.trim() || undefined,
          memo: singleForm.memo.trim() || undefined,
          expiresAt,
          isActive: singleForm.isActive,
        });
        alert(`할인코드 [${singleForm.code.trim().toUpperCase()}]가 등록되었습니다.`);
      } else {
        if (batchForm.count < 1 || batchForm.count > 100) {
          alert('한 번에 생성 가능한 코드는 1~100개입니다.');
          setIsSubmitting(false);
          return;
        }
        const expiresAt = calculateExpiry(batchForm.expiryPreset, batchForm.customExpiryDate);
        const res = await batchCreateCodes({
          count: batchForm.count,
          prefix: batchForm.prefix.trim() || undefined,
          customerName: batchForm.customerName.trim() || undefined,
          customerPhone: batchForm.customerPhone.trim() || undefined,
          memo: batchForm.memo.trim() || undefined,
          expiresAt,
        });
        alert(`${res.count}개의 할인코드가 생성되었습니다.`);
      }
      setIsModalOpen(false);
      setSingleForm({
        code: '',
        customerName: '',
        customerPhone: '',
        memo: '',
        expiryPreset: '30',
        customExpiryDate: '',
        isActive: true,
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || '오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (ts: number) => {
    const d = new Date(ts);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const renderExpireBadge = (expiresAt?: number) => {
    if (!expiresAt) {
      return (
        <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#4E5968] bg-[#F2F4F6] px-2 py-0.5 rounded-md">
          무제한
        </span>
      );
    }

    const now = Date.now();
    const isExpired = expiresAt < now;
    const diffDays = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

    if (isExpired) {
      return (
        <div className="space-y-0.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
            <XCircle className="w-3 h-3 text-rose-500" /> 만료됨
          </span>
          <p className="text-[10.5px] font-mono text-[#8B95A1]">{formatDateTime(expiresAt)}</p>
        </div>
      );
    }

    return (
      <div className="space-y-0.5">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
          <Clock className="w-3 h-3 text-emerald-600" /> D-{diffDays}일 남음
        </span>
        <p className="text-[10.5px] font-mono text-[#4E5968]">{formatDateTime(expiresAt)} 까지</p>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-[#EA1D2C]/10 text-[#EA1D2C] rounded-2xl">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#191F28] tracking-tight">
                할인코드 관리
              </h1>
              <p className="text-[13px] text-[#6B7684] mt-0.5">
                LG 가전 결합 시크릿 특별할인을 잠금 해제할 수 있는 할인코드를 발급하고 관리합니다.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            handleGenerateRandomCode();
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#EA1D2C] hover:bg-[#D41423] text-white font-extrabold text-[13.5px] rounded-xl shadow-sm shadow-[#EA1D2C]/30 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>신규 할인코드 발급</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E8EB] shadow-2xs">
          <div className="flex items-center justify-between text-[#8B95A1] text-[12px] font-bold">
            <span>전체 발급 코드</span>
            <KeyRound className="w-4 h-4 text-[#4E5968]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#191F28] mt-2">
            {stats.total}<span className="text-base font-bold ml-1 text-[#8B95A1]">개</span>
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E8EB] shadow-2xs">
          <div className="flex items-center justify-between text-[#00B074] text-[12px] font-bold">
            <span>사용 가능 (활성)</span>
            <CheckCircle2 className="w-4 h-4 text-[#00B074]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#00B074] mt-2">
            {stats.active}<span className="text-base font-bold ml-1 text-[#8B95A1]">개</span>
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E8EB] shadow-2xs">
          <div className="flex items-center justify-between text-[#F04452] text-[12px] font-bold">
            <span>만료/비활성</span>
            <XCircle className="w-4 h-4 text-[#F04452]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#F04452] mt-2">
            {stats.expired}<span className="text-base font-bold ml-1 text-[#8B95A1]">개</span>
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E8EB] shadow-2xs">
          <div className="flex items-center justify-between text-[#3182F6] text-[12px] font-bold">
            <span>총 발급 이력</span>
            <Sparkles className="w-4 h-4 text-[#3182F6]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#3182F6] mt-2">
            {discountCodes.length}<span className="text-base font-bold ml-1 text-[#8B95A1]">건</span>
          </p>
        </div>
      </div>

      {/* Filter & Action Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E8EB] shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto bg-[#F2F4F6] p-1 rounded-xl">
          {[
            { id: 'all', label: `전체 (${stats.total})` },
            { id: 'active', label: `사용 가능 (${stats.active})` },
            { id: 'expired', label: `만료됨 (${stats.expired})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-bold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white text-[#191F28] shadow-2xs'
                  : 'text-[#6B7684] hover:text-[#191F28]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Bulk Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-[#8B95A1] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="코드, 고객명, 연락처, 메모 검색"
              className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E8EB] rounded-xl text-[13px] focus:bg-white focus:border-[#3182F6] outline-none transition-colors"
            />
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchDelete}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-[12.5px] font-bold border border-rose-200 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{selectedIds.length}개 일괄 삭제</span>
            </button>
          )}
        </div>
      </div>

      {/* Code List Table */}
      <div className="bg-white rounded-2xl border border-[#E5E8EB] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E5E8EB] text-[#6B7684] font-extrabold text-[12px]">
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={filteredCodes.length > 0 && selectedIds.length === filteredCodes.length}
                    onChange={handleSelectAll}
                    className="rounded border-[#D1D6DB] text-[#EA1D2C] focus:ring-[#EA1D2C] cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">할인코드 (클릭 복사)</th>
                <th className="py-3.5 px-4">제공 고객 정보</th>
                <th className="py-3.5 px-4">발급 사유 / 메모</th>
                <th className="py-3.5 px-4">발급 일시</th>
                <th className="py-3.5 px-4">유효기간</th>
                <th className="py-3.5 px-4 text-center">인증 횟수</th>
                <th className="py-3.5 px-4 text-center">상태</th>
                <th className="py-3.5 px-4 text-center w-20">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F4F6]">
              {filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#8B95A1]">
                    <KeyRound className="w-8 h-8 mx-auto text-[#D1D6DB] mb-2" />
                    <p className="font-bold">발급된 할인코드가 없습니다.</p>
                    <p className="text-[12px] text-[#A6ADB8] mt-0.5">상단의 &apos;신규 할인코드 발급&apos; 버튼으로 코드를 만들어보세요.</p>
                  </td>
                </tr>
              ) : (
                filteredCodes.map(code => (
                  <tr key={code._id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(code._id)}
                        onChange={() => handleToggleSelect(code._id)}
                        className="rounded border-[#D1D6DB] text-[#EA1D2C] focus:ring-[#EA1D2C] cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-[#191F28] text-[14px] bg-[#F2F4F6] px-2.5 py-1 rounded-lg border border-[#E5E8EB] tracking-wider">
                          {code.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(code.code)}
                          className="p-1 text-[#8B95A1] hover:text-[#191F28] hover:bg-[#E5E8EB] rounded-md transition-colors cursor-pointer"
                          title="코드 복사"
                        >
                          {copiedCode === code.code ? (
                            <Check className="w-4 h-4 text-[#00B074]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {code.customerName || code.customerPhone ? (
                        <div className="space-y-0.5">
                          {code.customerName && (
                            <div className="flex items-center gap-1 font-bold text-[#191F28]">
                              <User className="w-3.5 h-3.5 text-[#8B95A1]" />
                              <span>{code.customerName}</span>
                            </div>
                          )}
                          {code.customerPhone && (
                            <div className="flex items-center gap-1 text-[11.5px] font-mono text-[#6B7684]">
                              <Phone className="w-3.5 h-3.5 text-[#8B95A1]" />
                              <span>{code.customerPhone}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#8B95A1] text-[12px]">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <p className="text-[12.5px] text-[#4E5968] truncate" title={code.memo}>
                        {code.memo || '-'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[12px] text-[#6B7684]">
                      {formatDateTime(code.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      {renderExpireBadge(code.expiresAt)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#3182F6]">
                      {code.useCount || 0}회
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleActive({ id: code._id, isActive: !code.isActive })}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                          code.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {code.isActive ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDelete(code._id, code.code)}
                        className="p-1.5 text-[#8B95A1] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E5E8EB] shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-[#E5E8EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#EA1D2C]/10 text-[#EA1D2C] rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black text-[#191F28]">
                  할인코드 신규 발급
                </h2>
              </div>
              <div className="flex items-center gap-1 bg-[#F2F4F6] p-1 rounded-xl text-[12px] font-bold">
                <button
                  type="button"
                  onClick={() => setCreateMode('single')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    createMode === 'single'
                      ? 'bg-white text-[#191F28] shadow-2xs'
                      : 'text-[#6B7684]'
                  }`}
                >
                  단건 등록
                </button>
                <button
                  type="button"
                  onClick={() => setCreateMode('batch')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    createMode === 'batch'
                      ? 'bg-white text-[#191F28] shadow-2xs'
                      : 'text-[#6B7684]'
                  }`}
                >
                  대량 자동생성
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {createMode === 'single' ? (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[12.5px] font-bold text-[#191F28]">
                        할인코드 <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateRandomCode}
                        className="text-[11.5px] text-[#3182F6] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        난수 자동생성
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={singleForm.code}
                      onChange={e => setSingleForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="예: VIP-SPECIAL, LGCARE2026"
                      className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E8EB] rounded-xl text-[14px] font-mono font-bold uppercase focus:bg-white focus:border-[#EA1D2C] outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-[#4E5968]">제공 고객명</label>
                      <input
                        type="text"
                        value={singleForm.customerName}
                        onChange={e => setSingleForm(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="홍길동"
                        className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E5E8EB] rounded-xl text-[13px] focus:bg-white focus:border-[#3182F6] outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-[#4E5968]">연락처</label>
                      <input
                        type="text"
                        value={singleForm.customerPhone}
                        onChange={e => setSingleForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                        placeholder="010-1234-5678"
                        className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E5E8EB] rounded-xl text-[13px] focus:bg-white focus:border-[#3182F6] outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#4E5968]">발급 사유 / 메모</label>
                    <input
                      type="text"
                      value={singleForm.memo}
                      onChange={e => setSingleForm(prev => ({ ...prev, memo: e.target.value }))}
                      placeholder="예: VIP 상담 고객 프로모션 전달용"
                      className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E5E8EB] rounded-xl text-[13px] focus:bg-white focus:border-[#3182F6] outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#191F28]">유효기간 설정</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: '7', label: '7일' },
                        { id: '30', label: '30일 (기본)' },
                        { id: '90', label: '90일' },
                        { id: 'unlimited', label: '무제한' },
                      ].map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setSingleForm(prev => ({ ...prev, expiryPreset: preset.id }))}
                          className={`py-2 rounded-xl text-[12px] font-bold border transition-all cursor-pointer ${
                            singleForm.expiryPreset === preset.id
                              ? 'bg-[#EA1D2C]/10 border-[#EA1D2C] text-[#EA1D2C]'
                              : 'bg-white border-[#E5E8EB] text-[#6B7684] hover:border-[#B0B8C1]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[12.5px] font-bold text-[#191F28]">
                        생성 수량 (개) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        required
                        value={batchForm.count}
                        onChange={e => setBatchForm(prev => ({ ...prev, count: parseInt(e.target.value, 10) || 1 }))}
                        className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E8EB] rounded-xl text-[14px] font-bold focus:bg-white focus:border-[#EA1D2C] outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12.5px] font-bold text-[#191F28]">
                        접두사 (Prefix)
                      </label>
                      <input
                        type="text"
                        value={batchForm.prefix}
                        onChange={e => setBatchForm(prev => ({ ...prev, prefix: e.target.value.toUpperCase() }))}
                        placeholder="예: LG, VIP, EVENT"
                        className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E8EB] rounded-xl text-[14px] font-mono font-bold uppercase focus:bg-white focus:border-[#EA1D2C] outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#4E5968]">제공 대상 / 채널명 (선택)</label>
                    <input
                      type="text"
                      value={batchForm.customerName}
                      onChange={e => setBatchForm(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="예: 신세계 제휴채널 배포용, 8월 이벤트"
                      className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E5E8EB] rounded-xl text-[13px] focus:bg-white focus:border-[#3182F6] outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#4E5968]">발급 사유 / 메모</label>
                    <input
                      type="text"
                      value={batchForm.memo}
                      onChange={e => setBatchForm(prev => ({ ...prev, memo: e.target.value }))}
                      placeholder="예: 채널 프로모션 대량 쿠폰"
                      className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E5E8EB] rounded-xl text-[13px] focus:bg-white focus:border-[#3182F6] outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#191F28]">유효기간 설정</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: '7', label: '7일' },
                        { id: '30', label: '30일 (기본)' },
                        { id: '90', label: '90일' },
                        { id: 'unlimited', label: '무제한' },
                      ].map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setBatchForm(prev => ({ ...prev, expiryPreset: preset.id }))}
                          className={`py-2 rounded-xl text-[12px] font-bold border transition-all cursor-pointer ${
                            batchForm.expiryPreset === preset.id
                              ? 'bg-[#EA1D2C]/10 border-[#EA1D2C] text-[#EA1D2C]'
                              : 'bg-white border-[#E5E8EB] text-[#6B7684] hover:border-[#B0B8C1]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <div className="pt-3 flex gap-2 justify-end border-t border-[#E5E8EB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-[#F2F4F6] hover:bg-[#E5E8EB] text-[#4E5968] text-[13px] font-bold rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#EA1D2C] hover:bg-[#D41423] disabled:opacity-50 text-white text-[13px] font-extrabold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {isSubmitting ? '발급 중...' : (createMode === 'single' ? '할인코드 발급하기' : `${batchForm.count}개 대량 생성하기`)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
