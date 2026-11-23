import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  KeyRound,
  Plus,
  Trash2,
  Copy,
  Check,
  Search,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { formatPhoneNumber } from '../utils/phone';

export default function DiscountCodeManagement() {
  const discountCodes = useQuery(api.discountCodes.list) || [];
  const createCode = useMutation(api.discountCodes.create);
  const batchCreateCodes = useMutation(api.discountCodes.batchCreate);
  const removeCode = useMutation(api.discountCodes.remove);
  const batchDeleteCodes = useMutation(api.discountCodes.batchDelete);
  const toggleActive = useMutation(api.discountCodes.toggleActive);
  const resetAuth = useMutation(api.discountCodes.resetAuth);
  const batchResetAuth = useMutation(api.discountCodes.batchResetAuth);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'single' | 'batch'>('single');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [singleForm, setSingleForm] = useState({
    code: '',
    customerName: '',
    customerPhone: '',
    memo: '',
    expiryPreset: '30',
    customExpiryDate: '',
    isActive: true,
  });

  const [batchForm, setBatchForm] = useState({
    count: 10,
    prefix: 'LG',
    customerName: '',
    customerPhone: '',
    memo: '',
    expiryPreset: '30',
    customExpiryDate: '',
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

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

  const stats = useMemo(() => {
    const now = Date.now();
    let active = 0;
    let expired = 0;
    let totalUses = 0;
    for (const c of discountCodes) {
      totalUses += c.useCount || 0;
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
      totalUses,
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
    if (!window.confirm(`선택한 ${selectedIds.length}개의 할인코드를 삭제하시겠습니까?`)) return;
    try {
      await batchDeleteCodes({ ids: selectedIds as any });
      setSelectedIds([]);
      alert('선택한 할인코드가 삭제되었습니다.');
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleBatchResetAuth = async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(
        `선택한 ${selectedIds.length}개 할인코드의 모든 사용자 인증을 리셋하시겠습니까?\n\n이 코드로 인증했던 사용자의 화면에서 특가가 즉시 다시 잠깁니다.`
      )
    )
      return;
    try {
      await batchResetAuth({ ids: selectedIds as any });
      alert(`선택한 ${selectedIds.length}개 할인코드의 사용자 인증이 리셋되었습니다.`);
    } catch (err: any) {
      alert(err.message || '인증 리셋 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`할인코드 [${code}]를 삭제하시겠습니까?`)) return;
    try {
      await removeCode({ id: id as any });
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleResetAuth = async (id: any, code: string) => {
    if (
      !window.confirm(
        `할인코드 [${code}]의 사용자 인증을 리셋하시겠습니까?\n\n이 코드로 접속 중이던 사용자의 화면에서 특가가 즉시 다시 잠기며, 코드를 다시 입력해야 합니다.`
      )
    )
      return;
    try {
      await resetAuth({ id });
      alert(`[${code}] 할인코드의 사용자 인증이 리셋되었습니다.\n접속 중인 사용자의 특가가 즉시 잠겼습니다.`);
    } catch (err: any) {
      alert(err.message || '인증 리셋 중 오류가 발생했습니다.');
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
    setSingleForm((prev) => ({ ...prev, code: rand }));
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
      return <span className="adm-pill gray">무제한</span>;
    }

    const now = Date.now();
    const isExpired = expiresAt < now;
    const diffDays = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

    if (isExpired) {
      return (
        <div className="space-y-0.5">
          <span className="adm-pill red">
            <XCircle className="w-3 h-3" /> 만료됨
          </span>
          <p className="text-[10.5px] font-mono text-[#86918a]">{formatDateTime(expiresAt)}</p>
        </div>
      );
    }

    return (
      <div className="space-y-0.5">
        <span className="adm-pill green">
          <Clock className="w-3 h-3" /> D-{diffDays}일 남음
        </span>
        <p className="text-[10.5px] font-mono text-[#6d786c]">{formatDateTime(expiresAt)} 까지</p>
      </div>
    );
  };

  return (
    <div>
      {/* Page Heading */}
      <div className="adm-page-heading">
        <div>
          <div className="adm-eyebrow">OPERATIONS · PROMOTION CODES</div>
          <h1>할인코드 관리</h1>
          <p>
            LG 가전 결합 시크릿 특별할인을 잠금 해제할 수 있는 인증 할인코드를 단건 또는 대량 발급하고 관리합니다.
          </p>
        </div>

        <div className="adm-heading-buttons">
          <button
            type="button"
            onClick={() => {
              handleGenerateRandomCode();
              setIsModalOpen(true);
            }}
            className="adm-btn primary"
          >
            <Plus />
            <span>신규 할인코드 발급</span>
          </button>
        </div>
      </div>

      {/* 4-Column Metric Cards */}
      <div className="adm-metrics-grid">
        <div className="adm-metric clickable" onClick={() => setStatusFilter('all')}>
          <div className="adm-metric-head">
            <span>전체 발급 코드</span>
            <div className="adm-metric-icon"><KeyRound /></div>
          </div>
          <div className="adm-metric-value">
            {stats.total.toLocaleString()}<span>개</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">누적 발급</span>
            <span>시크릿 특가 인증키</span>
          </div>
        </div>

        <div className="adm-metric clickable" onClick={() => setStatusFilter('active')}>
          <div className="adm-metric-head">
            <span>사용 가능 (활성)</span>
            <div className="adm-metric-icon"><CheckCircle2 /></div>
          </div>
          <div className="adm-metric-value">
            {stats.active.toLocaleString()}<span>개</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">즉시 인증 가능</span>
            <span>유효기간 내 코드</span>
          </div>
        </div>

        <div className="adm-metric clickable" onClick={() => setStatusFilter('expired')}>
          <div className="adm-metric-head">
            <span>기간 만료 코드</span>
            <div className="adm-metric-icon"><XCircle /></div>
          </div>
          <div className="adm-metric-value">
            {stats.expired.toLocaleString()}<span>개</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend warning">자동 잠금</span>
            <span>유효기간 경과</span>
          </div>
        </div>

        <div className="adm-metric">
          <div className="adm-metric-head">
            <span>누적 고객 인증 횟수</span>
            <div className="adm-metric-icon"><Sparkles /></div>
          </div>
          <div className="adm-metric-value">
            {stats.totalUses.toLocaleString()}<span>회</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">잠금 해제 이력</span>
            <span>실시간 집계</span>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="adm-bulk-bar">
          <div className="text-[12.5px] font-semibold">
            현재 <strong className="text-white">{selectedIds.length}개</strong>의 할인코드가 선택되었습니다.
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleBatchResetAuth} className="adm-btn sage small">
              <RefreshCw />
              <span>선택 인증 리셋 ({selectedIds.length})</span>
            </button>
            <button type="button" onClick={handleBatchDelete} className="adm-btn danger small">
              <Trash2 />
              <span>선택 삭제 ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Panel */}
      <div className="adm-panel">
        <div className="adm-tabs">
          {[
            { id: 'all', label: '전체 코드', count: stats.total },
            { id: 'active', label: '사용 가능 (활성)', count: stats.active },
            { id: 'expired', label: '만료됨', count: stats.expired },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`adm-tab ${statusFilter === tab.id ? 'active' : ''}`}
            >
              <span>{tab.label}</span>
              <span className="adm-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="adm-filter-bar">
          <div className="adm-search-field">
            <Search />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="할인코드, 제공 고객명, 연락처, 메모 검색..."
            />
          </div>
          <div className="adm-filter-end">
            <span>조회 결과 <b className="text-[#263d36]">{filteredCodes.length}</b>개</span>
          </div>
        </div>

        <div className="adm-table-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th className="w-12 text-center">
                  <input
                    type="checkbox"
                    checked={filteredCodes.length > 0 && selectedIds.length === filteredCodes.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                </th>
                <th>할인코드 (클릭 복사)</th>
                <th>제공 대상 고객</th>
                <th>발급 사유 · 메모</th>
                <th>발급 일시</th>
                <th>유효기간</th>
                <th className="text-center">인증 횟수</th>
                <th className="text-center">활성 토글</th>
                <th className="text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center !py-16 text-[#86918a]">
                    발급된 할인코드가 없거나 검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredCodes.map((code) => (
                  <tr key={code._id}>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(code._id)}
                        onChange={() => handleToggleSelect(code._id)}
                        className="w-4 h-4 rounded cursor-pointer"
                      />
                    </td>
                    <td>
                      <div className="inline-flex items-center gap-2">
                        <span className="font-mono font-bold text-[#263d36] text-[13px] bg-[#f4f7f0] px-2.5 py-1 rounded-[6px] border border-[#dfe5d9] tracking-wider">
                          {code.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(code.code)}
                          className="adm-icon-btn !p-1.5"
                          title="코드 복사"
                        >
                          {copiedCode === code.code ? (
                            <Check className="w-3.5 h-3.5 text-[#295e52]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td>
                      {code.customerName || code.customerPhone ? (
                        <div className="adm-person">
                          <div className="adm-person-circle">
                            {(code.customerName || 'C').slice(0, 1)}
                          </div>
                          <div>
                            <strong>{code.customerName || '대상 미지정'}</strong>
                            {code.customerPhone && <small className="font-mono">{code.customerPhone}</small>}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#9ba594]">-</span>
                      )}
                    </td>
                    <td className="max-w-[220px] truncate" title={code.memo}>
                      {code.memo || '-'}
                    </td>
                    <td className="font-mono text-[11.5px] text-[#6d786c]">
                      {formatDateTime(code.createdAt)}
                    </td>
                    <td>{renderExpireBadge(code.expiresAt)}</td>
                    <td className="text-center">
                      <span className="adm-pill teal">{code.useCount || 0}회</span>
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        onClick={() => toggleActive({ id: code._id, isActive: !code.isActive })}
                        className={`adm-switch mx-auto ${code.isActive ? 'checked' : ''}`}
                        title={code.isActive ? '활성 상태 (클릭 시 비활성)' : '비활성 상태 (클릭 시 활성)'}
                      >
                        <span />
                      </button>
                    </td>
                    <td className="text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleResetAuth(code._id, code.code)}
                          className="adm-btn small"
                          title={
                            code.lastResetAt
                              ? `인증 리셋 (최근: ${formatDateTime(code.lastResetAt)})`
                              : '인증 리셋 (접속자 특가 다시 잠금)'
                          }
                        >
                          <RefreshCw />
                          <span>리셋</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(code._id, code.code)}
                          className="adm-btn danger small"
                          title="삭제"
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="adm-table-foot">
          <span>전체 {stats.total}개 중 {filteredCodes.length}개 표시</span>
          <span>인증 리셋 실행 시 해당 코드로 접속 중인 고객의 특가 화면이 즉시 잠금 상태로 전환됩니다.</span>
        </div>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="adm-modal-overlay">
          <form onSubmit={handleSubmit} className="adm-modal max-w-[520px]">
            <div className="adm-drawer-head">
              <div>
                <h2>할인코드 신규 발급</h2>
                <p>단건 지정 코드 또는 접두사 기반 대량 난수 코드를 생성합니다.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="adm-icon-btn">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="adm-drawer-scroll space-y-4">
              <div className="adm-segmented w-full">
                <button
                  type="button"
                  onClick={() => setCreateMode('single')}
                  className={`flex-1 justify-center ${createMode === 'single' ? 'active' : ''}`}
                >
                  단건 지정 발급
                </button>
                <button
                  type="button"
                  onClick={() => setCreateMode('batch')}
                  className={`flex-1 justify-center ${createMode === 'batch' ? 'active' : ''}`}
                >
                  대량 자동 생성 (최대 100개)
                </button>
              </div>

              {createMode === 'single' ? (
                <>
                  <div className="adm-field">
                    <div className="flex items-center justify-between">
                      <label>할인코드 문자열 *</label>
                      <button
                        type="button"
                        onClick={handleGenerateRandomCode}
                        className="text-[11px] font-bold text-[#295e52] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> 난수 자동생성
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={singleForm.code}
                      onChange={(e) =>
                        setSingleForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                      }
                      placeholder="예: VIP-SPECIAL, LGCARE2026"
                      className="adm-input font-mono font-bold uppercase"
                    />
                  </div>

                  <div className="adm-field-grid">
                    <div className="adm-field">
                      <label>제공 고객명 (선택)</label>
                      <input
                        type="text"
                        value={singleForm.customerName}
                        onChange={(e) => setSingleForm((prev) => ({ ...prev, customerName: e.target.value }))}
                        placeholder="홍길동"
                        className="adm-input"
                      />
                    </div>
                    <div className="adm-field">
                      <label>연락처 (선택)</label>
                      <input
                        type="tel"
                        maxLength={13}
                        value={singleForm.customerPhone}
                        onChange={(e) =>
                          setSingleForm((prev) => ({
                            ...prev,
                            customerPhone: formatPhoneNumber(e.target.value),
                          }))
                        }
                        placeholder="010-1234-5678"
                        className="adm-input font-mono"
                      />
                    </div>
                  </div>

                  <div className="adm-field">
                    <label>발급 사유 · 메모</label>
                    <input
                      type="text"
                      value={singleForm.memo}
                      onChange={(e) => setSingleForm((prev) => ({ ...prev, memo: e.target.value }))}
                      placeholder="예: VIP 상담 고객 프로모션 전달용"
                      className="adm-input"
                    />
                  </div>

                  <div className="adm-field">
                    <label>유효기간 설정</label>
                    <div className="adm-segmented w-full">
                      {[
                        { id: '7', label: '7일' },
                        { id: '30', label: '30일 (기본)' },
                        { id: '90', label: '90일' },
                        { id: 'unlimited', label: '무제한' },
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setSingleForm((prev) => ({ ...prev, expiryPreset: preset.id }))}
                          className={`flex-1 justify-center ${singleForm.expiryPreset === preset.id ? 'active' : ''}`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="adm-field-grid">
                    <div className="adm-field">
                      <label>생성 수량 (1~100개) *</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        required
                        value={batchForm.count}
                        onChange={(e) =>
                          setBatchForm((prev) => ({
                            ...prev,
                            count: parseInt(e.target.value, 10) || 1,
                          }))
                        }
                        className="adm-input font-bold"
                      />
                    </div>
                    <div className="adm-field">
                      <label>접두사 (Prefix)</label>
                      <input
                        type="text"
                        value={batchForm.prefix}
                        onChange={(e) =>
                          setBatchForm((prev) => ({ ...prev, prefix: e.target.value.toUpperCase() }))
                        }
                        placeholder="예: LG, VIP"
                        className="adm-input font-mono font-bold uppercase"
                      />
                    </div>
                  </div>

                  <div className="adm-field">
                    <label>제공 대상 · 파트너 채널명 (선택)</label>
                    <input
                      type="text"
                      value={batchForm.customerName}
                      onChange={(e) => setBatchForm((prev) => ({ ...prev, customerName: e.target.value }))}
                      placeholder="예: 제휴 파트너 배포용"
                      className="adm-input"
                    />
                  </div>

                  <div className="adm-field">
                    <label>발급 사유 · 메모</label>
                    <input
                      type="text"
                      value={batchForm.memo}
                      onChange={(e) => setBatchForm((prev) => ({ ...prev, memo: e.target.value }))}
                      placeholder="예: 채널 프로모션 대량 쿠폰"
                      className="adm-input"
                    />
                  </div>

                  <div className="adm-field">
                    <label>유효기간 설정</label>
                    <div className="adm-segmented w-full">
                      {[
                        { id: '7', label: '7일' },
                        { id: '30', label: '30일 (기본)' },
                        { id: '90', label: '90일' },
                        { id: 'unlimited', label: '무제한' },
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setBatchForm((prev) => ({ ...prev, expiryPreset: preset.id }))}
                          className={`flex-1 justify-center ${batchForm.expiryPreset === preset.id ? 'active' : ''}`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="adm-drawer-foot">
              <button type="button" onClick={() => setIsModalOpen(false)} className="adm-btn">
                취소
              </button>
              <button type="submit" disabled={isSubmitting} className="adm-btn primary">
                {isSubmitting
                  ? '발급 중...'
                  : createMode === 'single'
                    ? '할인코드 발급하기'
                    : `${batchForm.count}개 대량 생성하기`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
