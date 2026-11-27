import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  Plus,
  Edit2,
  Trash2,
  Globe,
  ExternalLink,
  ShieldCheck,
  Copy,
  CheckCircle2,
  Ban,
  X,
  Save,
  Search,
} from 'lucide-react';

export default function LandingManagement({
  userType = 'admin',
  subdomain,
}: {
  userType?: string;
  subdomain?: string;
}) {
  const landings = useQuery(api.landings.get) || [];
  const currentChannel = useQuery(
    api.channels.getBySubdomain,
    userType === 'channel' && subdomain ? { subdomain } : 'skip'
  );

  const createLanding = useMutation(api.landings.create);
  const updateLanding = useMutation(api.landings.update);
  const removeLanding = useMutation(api.landings.remove);
  const duplicateLanding = useMutation(api.landings.duplicate);
  const seedLandings = useMutation(api.landings.seed);
  const updateDefaultThumbnails = useMutation(api.landings.updateDefaultThumbnails);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [hasChecked, setHasChecked] = useState(false);
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest' | 'name'>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    _id: '',
    name: '',
    path: '',
    description: '',
    thumbnail: '',
    isActive: true,
  });

  const assignedPaths =
    currentChannel?.landingPages || (currentChannel?.landingPage ? [currentChannel?.landingPage] : []);

  const rawLandings =
    userType === 'admin'
      ? landings
      : landings.filter((l) => assignedPaths.includes(l.path) && l.isActive);

  const displayLandings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? rawLandings.filter(
          (l) =>
            (l.name || '').toLowerCase().includes(q) ||
            (l.path || '').toLowerCase().includes(q) ||
            (l.description || '').toLowerCase().includes(q)
        )
      : rawLandings;

    return [...filtered].sort((a, b) => {
      if (sortOrder === 'latest') return (b._creationTime || 0) - (a._creationTime || 0);
      if (sortOrder === 'oldest') return (a._creationTime || 0) - (b._creationTime || 0);
      if (sortOrder === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });
  }, [rawLandings, sortOrder, searchQuery]);

  const counts = useMemo(() => {
    const active = rawLandings.filter((l) => l.isActive).length;
    const inactive = rawLandings.length - active;
    return { total: rawLandings.length, active, inactive };
  }, [rawLandings]);

  useEffect(() => {
    if (userType === 'admin') {
      if (landings.length === 0) {
        seedLandings();
      } else if (!hasChecked) {
        updateDefaultThumbnails();
        setHasChecked(true);
      }
    }
  }, [landings, seedLandings, updateDefaultThumbnails, userType, hasChecked]);

  const openCreateModal = () => {
    if (userType !== 'admin') return;
    setModalMode('create');
    setFormData({ _id: '', name: '', path: '', description: '', thumbnail: '', isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (landing: any) => {
    if (userType !== 'admin') return;
    setModalMode('edit');
    setFormData({ ...landing });
    setIsModalOpen(true);
  };

  const openDuplicateModal = (landing: any) => {
    if (userType !== 'admin') return;
    setModalMode('duplicate');

    const baseClean = landing.path === '/' ? '/copy' : `${landing.path}_copy`;
    let suggestedPath = baseClean;
    let counter = 1;
    while (landings.some((l) => l.path === suggestedPath)) {
      counter++;
      suggestedPath = `${baseClean}${counter}`;
    }

    setFormData({
      _id: landing._id,
      name: `${landing.name} (복사본)`,
      path: suggestedPath,
      description: landing.description || '',
      thumbnail: landing.thumbnail || '',
      isActive: landing.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userType !== 'admin') return;
    try {
      if (modalMode === 'edit') {
        await updateLanding({
          id: formData._id as any,
          name: formData.name,
          path: formData.path,
          description: formData.description,
          thumbnail: formData.thumbnail,
          isActive: formData.isActive,
        });
      } else if (modalMode === 'duplicate') {
        await duplicateLanding({
          id: formData._id as any,
          name: formData.name,
          path: formData.path,
          description: formData.description,
          thumbnail: formData.thumbnail,
          isActive: formData.isActive,
        });
      } else {
        await createLanding({
          name: formData.name,
          path: formData.path,
          description: formData.description,
          thumbnail: formData.thumbnail,
          isActive: formData.isActive,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (userType !== 'admin') return;
    if (window.confirm('정말 삭제하시겠습니까?')) {
      await removeLanding({ id: id as any });
    }
  };

  const getCustomUrl = (path: string) => {
    if (!subdomain) return path;
    if (path === '/') return `/${subdomain}`;
    const cleanPath = path.endsWith('/') ? path : `${path}/`;
    return `${cleanPath}?${subdomain}`;
  };

  return (
    <div>
      {/* Page Heading */}
      <div className="adm-page-heading">
        <div>
          <div className="adm-eyebrow">OPERATIONS · LANDING PAGES</div>
          <h1>{userType === 'admin' ? '랜딩페이지 관리' : '내 랜딩페이지 내역'}</h1>
          <p>
            {userType === 'admin'
              ? '파트너 채널에 할당 가능한 공식 결합상품 랜딩페이지 템플릿과 접속 주소를 관리합니다.'
              : '귀하의 파트너 채널에 할당된 전용 랜딩페이지 주소 목록입니다.'}
          </p>
        </div>

        <div className="adm-heading-buttons">
          <div className="adm-segmented">
            <button
              type="button"
              onClick={() => setSortOrder('latest')}
              className={sortOrder === 'latest' ? 'active' : ''}
            >
              최신순
            </button>
            <button
              type="button"
              onClick={() => setSortOrder('oldest')}
              className={sortOrder === 'oldest' ? 'active' : ''}
            >
              등록일순
            </button>
            <button
              type="button"
              onClick={() => setSortOrder('name')}
              className={sortOrder === 'name' ? 'active' : ''}
            >
              이름순
            </button>
          </div>

          {userType === 'admin' && (
            <button type="button" onClick={openCreateModal} className="adm-btn primary">
              <Plus />
              <span>신규 랜딩 등록</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="adm-metrics-grid">
        <div className="adm-metric">
          <div className="adm-metric-head">
            <span>전체 랜딩페이지</span>
            <div className="adm-metric-icon"><Globe /></div>
          </div>
          <div className="adm-metric-value">
            {counts.total}<span>개</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">등록 템플릿</span>
            <span>통합 라우팅 연동</span>
          </div>
        </div>

        <div className="adm-metric">
          <div className="adm-metric-head">
            <span>활성 랜딩페이지</span>
            <div className="adm-metric-icon"><CheckCircle2 /></div>
          </div>
          <div className="adm-metric-value">
            {counts.active}<span>개</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">정상 접속</span>
            <span>채널 배정 가능</span>
          </div>
        </div>

        <div className="adm-metric">
          <div className="adm-metric-head">
            <span>비활성 보관</span>
            <div className="adm-metric-icon"><Ban /></div>
          </div>
          <div className="adm-metric-value">
            {counts.inactive}<span>개</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">비노출</span>
            <span>보관 상태</span>
          </div>
        </div>

        <div className="adm-metric">
          <div className="adm-metric-head">
            <span>접속 도메인 모드</span>
            <div className="adm-metric-icon"><ShieldCheck /></div>
          </div>
          <div className="adm-metric-value !text-[21px]">
            {subdomain ? `/${subdomain}` : '본사 기본'}
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">자동 트래킹</span>
            <span>유입 채널 자동 귀속</span>
          </div>
        </div>
      </div>

      {/* 1-Column List */}
      <div className="adm-panel overflow-hidden">
        <div className="adm-panel-top flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <h2>랜딩페이지 목록</h2>
            <span className="adm-pill teal font-mono">{displayLandings.length}개</span>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-[#8c9686] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="랜딩명, 경로, 설명 검색..."
              className="adm-input !pl-8 !py-1.5 !text-[12.5px] w-full"
            />
          </div>
        </div>

        <div className="divide-y divide-[#eef1e8]">
          {displayLandings.map((landing) => (
            <div
              key={landing._id}
              className="px-5 py-3.5 flex flex-col md:flex-row md:items-center gap-4 hover:bg-[#fbfcf8] transition-colors"
            >
              {/* Thumbnail */}
              <a
                href={getCustomUrl(landing.path)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-24 h-36 md:h-15 rounded-lg bg-[#f3f5ef] border border-[#edf0e7] flex items-center justify-center overflow-hidden shrink-0 group"
                title="새창에서 랜딩페이지 열기"
              >
                {landing.thumbnail ? (
                  <img
                    src={landing.thumbnail}
                    alt={landing.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <Globe className="w-6 h-6 text-[#b7c2b0]" />
                )}
              </a>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {landing.isActive ? (
                    <span className="adm-pill green">활성 운영중</span>
                  ) : (
                    <span className="adm-pill red">사용 안 함</span>
                  )}
                  <h3 className="text-[14.5px] font-bold text-[#263d36] leading-snug truncate">
                    {landing.name}
                  </h3>
                  <span className="adm-pill teal font-mono shrink-0">{getCustomUrl(landing.path)}</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#6d786c]">
                  <p className="truncate max-w-2xl">
                    {landing.description || '등록된 상세 설명이 없습니다.'}
                  </p>
                  <span className="text-[11px] text-[#86918a] flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#295e52]" />
                    <span>효원 공식 랜딩</span>
                    {landing._creationTime && (
                      <span className="font-mono">
                        ·{' '}
                        {new Date(landing._creationTime).toLocaleDateString('ko-KR', {
                          year: '2-digit',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0 pt-1 md:pt-0">
                <a
                  href={getCustomUrl(landing.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="adm-btn primary small"
                  title="새창에서 랜딩페이지 열기"
                >
                  <ExternalLink />
                  <span>바로가기</span>
                </a>
                {userType === 'admin' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => openDuplicateModal(landing)}
                      className="adm-btn sage small"
                      title="복제하기"
                    >
                      <Copy />
                      <span>복제</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(landing)}
                      className="adm-icon-btn !p-2"
                      title="수정"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(landing._id)}
                      className="adm-icon-btn !p-2 hover:!text-[#a85042]"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <span className="adm-btn small cursor-default">공식 할당 랜딩</span>
                )}
              </div>
            </div>
          ))}

          {displayLandings.length === 0 && (
            <div className="py-16 text-center text-[#86918a] text-[13px]">
              {searchQuery.trim()
                ? '검색 조건에 일치하는 랜딩페이지가 없습니다.'
                : '등록된 랜딩페이지가 없습니다.'}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit / Duplicate Modal */}
      {isModalOpen && (
        <div className="adm-modal-overlay">
          <form onSubmit={handleSubmit} className="adm-modal max-w-[500px]">
            <div className="adm-drawer-head">
              <div>
                <h2>
                  {modalMode === 'duplicate'
                    ? '랜딩페이지 복제 생성'
                    : modalMode === 'edit'
                      ? '랜딩페이지 정보 수정'
                      : '신규 랜딩페이지 등록'}
                </h2>
                <p>랜딩명, 접속 경로(Path), 설명 및 대표 썸네일을 설정합니다.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="adm-icon-btn">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="adm-drawer-scroll space-y-4">
              <div className="adm-field">
                <label>랜딩페이지 명칭 *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 리빙144 신한카드 전용 랜딩"
                  className="adm-input font-bold"
                />
              </div>

              <div className="adm-field">
                <label>접속 경로 (Path) *</label>
                <input
                  type="text"
                  required
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  placeholder="예: /living_new"
                  className="adm-input font-mono"
                />
                {modalMode === 'duplicate' && (
                  <small>※ 기존 랜딩과 중복되지 않는 고유 접속 경로(Path)를 지정해주세요.</small>
                )}
              </div>

              <div className="adm-field">
                <label>상세 설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="랜딩페이지의 주요 구성과 타겟 상품을 설명해주세요."
                  className="adm-textarea"
                />
              </div>

              <div className="adm-field">
                <label>대표 썸네일 이미지 URL</label>
                <input
                  type="text"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  placeholder="https://..."
                  className="adm-input font-mono"
                />
              </div>

              <div className="adm-note-card flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#263d36]">랜딩 활성화 상태</div>
                  <div className="text-[11px] text-[#86918a]">비활성화 시 파트너 채널 배정 목록에서 제외됩니다.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`adm-switch ${formData.isActive ? 'checked' : ''}`}
                >
                  <span />
                </button>
              </div>
            </div>

            <div className="adm-drawer-foot">
              <button type="button" onClick={() => setIsModalOpen(false)} className="adm-btn">
                취소
              </button>
              <button type="submit" className="adm-btn primary">
                <Save />
                <span>
                  {modalMode === 'duplicate'
                    ? '복제본 생성하기'
                    : modalMode === 'edit'
                      ? '변경사항 저장'
                      : '랜딩페이지 등록'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
