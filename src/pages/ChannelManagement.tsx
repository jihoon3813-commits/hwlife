import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  Plus,
  Search,
  Trash2,
  Eye,
  EyeOff,
  X,
  ExternalLink,
  LayoutGrid,
  CheckCircle2,
  Clock,
  Ban,
  Save,
} from 'lucide-react';

export default function ChannelManagement({
  currentChannelId,
  onLoginAsChannel,
}: {
  currentChannelId?: string;
  onLoginAsChannel?: (channel: any) => void;
}) {
  const channels = useQuery(api.channels.get) || [];
  const createChannel = useMutation(api.channels.create);
  const updateChannel = useMutation(api.channels.update);
  const removeChannel = useMutation(api.channels.remove);
  const landings = useQuery(api.landings.get) || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | '정상' | '승인대기' | '정지'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const initialFormState = {
    _id: '',
    accountId: '',
    password: '',
    subdomain: '',
    status: '승인대기',
    channelName: '',
    managerName: '',
    managerContact: '',
    landingPage: '',
    landingPages: [] as string[],
    parentChannelId: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    if (phoneNumberLength < 11) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
    }
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, managerContact: formatPhoneNumber(e.target.value) });
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setFormData(initialFormState);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (channel: any) => {
    setIsEditing(true);
    setFormData({
      ...channel,
      password: '',
      landingPages: channel.landingPages || (channel.landingPage ? [channel.landingPage] : []),
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const updates: any = {
          id: formData._id as any,
          subdomain: formData.subdomain,
          status: formData.status,
          channelName: formData.channelName,
          managerName: formData.managerName,
          managerContact: formData.managerContact,
          landingPage: formData.landingPage,
          landingPages: formData.landingPages,
          parentChannelId: formData.parentChannelId || undefined,
        };
        if (formData.password) {
          updates.password = formData.password;
        }
        await updateChannel(updates);
      } else {
        await createChannel({
          accountId: formData.accountId,
          password: formData.password,
          subdomain: formData.subdomain,
          status: formData.status,
          channelName: formData.channelName,
          managerName: formData.managerName,
          managerContact: formData.managerContact,
          landingPage: formData.landingPage,
          landingPages: formData.landingPages,
          parentChannelId: formData.parentChannelId || undefined,
        });
      }
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.message || '오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('정말 이 채널을 삭제하시겠습니까?')) {
      await removeChannel({ id: id as any });
      setIsModalOpen(false);
    }
  };

  // Scope channels by permission first
  const scopedChannels = useMemo(() => {
    if (!currentChannelId) return channels;
    return channels.filter(
      (c) => c.subdomain === currentChannelId || c.parentChannelId === currentChannelId
    );
  }, [channels, currentChannelId]);

  const counts = useMemo(() => {
    const active = scopedChannels.filter((c) => c.status === '정상').length;
    const pending = scopedChannels.filter((c) => c.status === '승인대기').length;
    const stopped = scopedChannels.filter((c) => c.status === '정지').length;
    return {
      total: scopedChannels.length,
      active,
      pending,
      stopped,
    };
  }, [scopedChannels]);

  const filteredChannels = useMemo(() => {
    return scopedChannels.filter((channel) => {
      if (statusFilter !== 'all' && channel.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          channel.channelName.toLowerCase().includes(q) ||
          channel.managerName.toLowerCase().includes(q) ||
          channel.accountId.toLowerCase().includes(q) ||
          channel.subdomain.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [scopedChannels, statusFilter, searchTerm]);

  return (
    <div>
      {/* Page Heading */}
      <div className="adm-page-heading">
        <div>
          <div className="adm-eyebrow">HYOWON SANGJO · PARTNERS</div>
          <h1>파트너 관리</h1>
          <p>
            제휴 파트너 채널 계정, 전용 서브도메인 경로 및 상위·하위 파트너 계층을 운영합니다.
          </p>
        </div>
        <div className="adm-heading-buttons">
          <button type="button" onClick={openCreateModal} className="adm-btn primary">
            <Plus />
            <span>파트너 신규 등록</span>
          </button>
        </div>
      </div>

      {/* 4-Column Metric Cards */}
      <div className="adm-metrics-grid">
        <div className="adm-metric clickable" onClick={() => setStatusFilter('all')}>
          <div className="adm-metric-head">
            <span>전체 파트너 채널</span>
            <div className="adm-metric-icon"><LayoutGrid /></div>
          </div>
          <div className="adm-metric-value">
            {counts.total.toLocaleString()}<span>곳</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">등록 파트너</span>
            <span>통합 관리 대상</span>
          </div>
        </div>

        <div className="adm-metric clickable" onClick={() => setStatusFilter('정상')}>
          <div className="adm-metric-head">
            <span>정상 운영 파트너</span>
            <div className="adm-metric-icon"><CheckCircle2 /></div>
          </div>
          <div className="adm-metric-value">
            {counts.active.toLocaleString()}<span>곳</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">정상 영업중</span>
            <span>전용 랜딩 활성화</span>
          </div>
        </div>

        <div className="adm-metric clickable" onClick={() => setStatusFilter('승인대기')}>
          <div className="adm-metric-head">
            <span>승인대기 파트너</span>
            <div className="adm-metric-icon"><Clock /></div>
          </div>
          <div className="adm-metric-value">
            {counts.pending.toLocaleString()}<span>곳</span>
          </div>
          <div className="adm-metric-foot">
            <span className={`adm-metric-trend ${counts.pending > 0 ? 'warning' : ''}`}>
              {counts.pending > 0 ? '승인 검토 필요' : '대기 없음'}
            </span>
            <span>신규 신청 건</span>
          </div>
        </div>

        <div className="adm-metric clickable" onClick={() => setStatusFilter('정지')}>
          <div className="adm-metric-head">
            <span>정지 · 휴면 파트너</span>
            <div className="adm-metric-icon"><Ban /></div>
          </div>
          <div className="adm-metric-value">
            {counts.stopped.toLocaleString()}<span>곳</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">이용 제한</span>
            <span>접속 비활성화</span>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="adm-panel">
        <div className="adm-tabs">
          {[
            { id: 'all', label: '전체 파트너', count: counts.total },
            { id: '정상', label: '정상 운영', count: counts.active },
            { id: '승인대기', label: '승인대기', count: counts.pending },
            { id: '정지', label: '정지', count: counts.stopped },
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
              placeholder="채널명, 담당자명, 아이디, 경로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="adm-filter-end">
            <span>조회 결과 <b className="text-[#263d36]">{filteredChannels.length}</b>곳</span>
          </div>
        </div>

        <div className="adm-table-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>파트너 채널명 · 아이디</th>
                <th>전용 경로 (Subdomain)</th>
                <th>담당자명</th>
                <th>담당자 연락처</th>
                <th>상위 채널</th>
                <th>상태</th>
                <th className="text-center">대리 접속</th>
              </tr>
            </thead>
            <tbody>
              {filteredChannels.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center !py-16 text-[#86918a]">
                    조건에 일치하는 파트너 채널이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredChannels.map((channel) => (
                  <tr
                    key={channel._id}
                    onClick={() => openEditModal(channel)}
                    className="adm-clickable-row"
                  >
                    <td>
                      <div className="adm-person">
                        <div className="adm-person-circle">
                          {(channel.channelName || 'P').slice(0, 1)}
                        </div>
                        <div>
                          <strong>{channel.channelName}</strong>
                          <small className="font-mono">ID: {channel.accountId}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="adm-pill gray font-mono">/{channel.subdomain}</span>
                    </td>
                    <td className="font-semibold text-[#263d36]">{channel.managerName}</td>
                    <td className="font-mono text-[12px] text-[#45554e]">{channel.managerContact}</td>
                    <td>
                      {channel.parentChannelId ? (
                        <span className="adm-pill teal">
                          {channels.find((c) => c.subdomain === channel.parentChannelId)?.channelName ||
                            channel.parentChannelId}
                        </span>
                      ) : (
                        <span className="text-[#9ba594] text-[12px]">최상위 채널</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`adm-pill ${
                          channel.status === '정상'
                            ? 'green'
                            : channel.status === '승인대기'
                              ? 'orange'
                              : 'red'
                        }`}
                      >
                        {channel.status}
                      </span>
                    </td>
                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onLoginAsChannel?.(channel)}
                        className="adm-btn sage small"
                        title="채널 어드민 워크스페이스 새창 열기"
                      >
                        <span>어드민 접속</span>
                        <ExternalLink />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="adm-table-foot">
          <span>전체 {counts.total}곳 중 {filteredChannels.length}곳 표시</span>
          <span>행을 클릭하면 파트너 정보 및 할당 랜딩페이지를 수정할 수 있습니다.</span>
        </div>
      </div>

      {/* Slide-over Drawer for Create / Edit Channel */}
      {isModalOpen && (
        <div className="adm-drawer-overlay" onClick={() => setIsModalOpen(false)}>
          <form
            onSubmit={handleSubmit}
            className="adm-drawer !max-w-[560px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adm-drawer-head">
              <div>
                <h2>{isEditing ? '파트너 채널 정보 수정' : '파트너 신규 등록'}</h2>
                <p>파트너 계정 로그인 정보, 서브도메인 및 할당 랜딩페이지를 설정합니다.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="adm-icon-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="adm-drawer-scroll space-y-5">
              <div>
                <div className="adm-section-label !mt-0">
                  <span>접속 계정 및 경로 설정</span>
                </div>
                <div className="adm-field-grid">
                  <div className="adm-field">
                    <label>접속 아이디 *</label>
                    <input
                      type="text"
                      required
                      disabled={isEditing}
                      value={formData.accountId}
                      onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                      autoComplete="off"
                      className="adm-input font-mono"
                      placeholder="채널 아이디 입력"
                    />
                  </div>

                  <div className="adm-field">
                    <label>비밀번호 {isEditing ? '(변경 시 입력)' : '*'}</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!isEditing}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        autoComplete="new-password"
                        className="adm-input w-full pr-9"
                        placeholder="비밀번호 입력"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86918a] hover:text-[#263d36]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="adm-field full">
                    <label>전용 접속 경로 (Subdomain) *</label>
                    <div className="flex items-center">
                      <span className="px-3 py-2 bg-[#f3f5ef] border border-r-0 border-[#dfe5d9] rounded-l-[7px] text-[12px] font-mono text-[#6d786c] min-h-[36px] flex items-center">
                        hyowon-life.com/living/?
                      </span>
                      <input
                        type="text"
                        required
                        value={formData.subdomain}
                        onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                        className="adm-input !rounded-l-none flex-1 font-mono"
                        placeholder="예: partner01"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="adm-section-label">
                  <span>파트너사 및 담당자 정보</span>
                </div>
                <div className="adm-field-grid">
                  <div className="adm-field full">
                    <label>채널명 (파트너사명) *</label>
                    <input
                      type="text"
                      required
                      value={formData.channelName}
                      onChange={(e) => setFormData({ ...formData, channelName: e.target.value })}
                      className="adm-input font-bold"
                      placeholder="파트너사명 입력"
                    />
                  </div>

                  <div className="adm-field">
                    <label>담당자명 *</label>
                    <input
                      type="text"
                      required
                      value={formData.managerName}
                      onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                      className="adm-input"
                      placeholder="이름 입력"
                    />
                  </div>

                  <div className="adm-field">
                    <label>담당자 연락처 *</label>
                    <input
                      type="text"
                      required
                      value={formData.managerContact}
                      onChange={handleContactChange}
                      className="adm-input font-mono"
                      placeholder="010-0000-0000"
                      maxLength={13}
                    />
                  </div>

                  <div className="adm-field full">
                    <label>상위 채널 (계층 설정 · 선택)</label>
                    <select
                      value={formData.parentChannelId}
                      onChange={(e) => setFormData({ ...formData, parentChannelId: e.target.value })}
                      className="adm-select"
                    >
                      <option value="">없음 (최상위 파트너 채널)</option>
                      {channels
                        .filter((c) => c.status === '정상' && c._id !== formData._id)
                        .map((channel) => (
                          <option key={channel._id} value={channel.subdomain}>
                            {channel.channelName} ({channel.subdomain})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="adm-field full">
                    <label>파트너 운영 상태 *</label>
                    <div className="adm-segmented w-full">
                      {['승인대기', '정상', '정지'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          disabled={!!currentChannelId}
                          onClick={() => setFormData({ ...formData, status: s })}
                          className={`flex-1 justify-center ${formData.status === s ? 'active' : ''}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {!currentChannelId && (
                <div>
                  <div className="adm-section-label">
                    <span>할당 랜딩페이지 (복수 선택 가능)</span>
                  </div>
                  <div className="adm-note-card !bg-white space-y-2 max-h-[220px] overflow-y-auto">
                    <label className="flex items-center gap-2.5 p-2 rounded-[7px] hover:bg-[#f6f8f3] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.landingPages.includes('/') || formData.landingPage === '/'}
                        onChange={(e) => {
                          const val = '/';
                          const current = formData.landingPages;
                          setFormData({
                            ...formData,
                            landingPages: e.target.checked
                              ? [...current, val]
                              : current.filter((v) => v !== val),
                          });
                        }}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-[12.5px] font-semibold text-[#263d36]">메인 페이지 (/)</span>
                    </label>
                    {landings
                      .filter((l) => l.isActive && l.path !== '/')
                      .map((landing) => (
                        <label
                          key={landing._id}
                          className="flex items-center justify-between gap-2.5 p-2 rounded-[7px] hover:bg-[#f6f8f3] cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={
                                formData.landingPages.includes(landing.path) ||
                                formData.landingPage === landing.path
                              }
                              onChange={(e) => {
                                const val = landing.path;
                                const current = formData.landingPages;
                                setFormData({
                                  ...formData,
                                  landingPages: e.target.checked
                                    ? [...current, val]
                                    : current.filter((v) => v !== val),
                                });
                              }}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-[12.5px] font-semibold text-[#263d36] truncate">
                              {landing.name}
                            </span>
                          </div>
                          <span className="adm-pill gray font-mono">{landing.path}</span>
                        </label>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="adm-drawer-foot">
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => handleDelete(formData._id as string)}
                  className="adm-btn danger mr-auto"
                >
                  <Trash2 />
                  <span>채널 삭제</span>
                </button>
              ) : (
                <span className="adm-caption">등록 즉시 파트너 계정 로그인이 가능합니다.</span>
              )}
              <button type="button" onClick={() => setIsModalOpen(false)} className="adm-btn">
                취소
              </button>
              <button type="submit" className="adm-btn primary">
                <Save />
                <span>{isEditing ? '수정 완료' : '파트너 등록'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
