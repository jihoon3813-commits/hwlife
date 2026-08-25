import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Edit2, Trash2, Globe, ExternalLink, ShieldCheck, Check, Sparkles, Copy } from 'lucide-react';

export default function LandingManagement({ userType = 'admin', subdomain }: { userType?: string, subdomain?: string }) {
  const landings = useQuery(api.landings.get) || [];
  const currentChannel = useQuery(api.channels.getBySubdomain, userType === 'channel' && subdomain ? { subdomain } : 'skip');
  
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
  const [formData, setFormData] = useState({
    _id: '',
    name: '',
    path: '',
    description: '',
    thumbnail: '',
    isActive: true
  });

  // Assigned landing paths for channel admin
  const assignedPaths = currentChannel?.landingPages || (currentChannel?.landingPage ? [currentChannel?.landingPage] : []);
  
  const rawLandings = userType === 'admin' 
    ? landings 
    : landings.filter(l => assignedPaths.includes(l.path) && l.isActive);

  const displayLandings = [...rawLandings].sort((a, b) => {
    if (sortOrder === 'latest') {
      return (b._creationTime || 0) - (a._creationTime || 0);
    }
    if (sortOrder === 'oldest') {
      return (a._creationTime || 0) - (b._creationTime || 0);
    }
    if (sortOrder === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    return 0;
  });

  // Seed and Update thumbnails if needed
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
    
    // Auto-generate suggested path
    const baseClean = landing.path === '/' ? '/copy' : `${landing.path}_copy`;
    let suggestedPath = baseClean;
    let counter = 1;
    while (landings.some(l => l.path === suggestedPath)) {
      counter++;
      suggestedPath = `${baseClean}${counter}`;
    }

    setFormData({
      _id: landing._id,
      name: `${landing.name} (복사본)`,
      path: suggestedPath,
      description: landing.description || '',
      thumbnail: landing.thumbnail || '',
      isActive: landing.isActive
    });
    setIsModalOpen(true);
  };

  const handleQuickDuplicate = async (landing: any) => {
    if (userType !== 'admin') return;
    if (!window.confirm(`'${landing.name}' 랜딩페이지를 복제하시겠습니까?`)) {
      return;
    }
    try {
      await duplicateLanding({ id: landing._id as any });
      alert(`'${landing.name}' 복제가 완료되었습니다.`);
    } catch (err) {
      console.error(err);
      alert('복제 중 오류가 발생했습니다.');
    }
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
          isActive: formData.isActive
        });
      } else if (modalMode === 'duplicate') {
        await duplicateLanding({
          id: formData._id as any,
          name: formData.name,
          path: formData.path,
          description: formData.description,
          thumbnail: formData.thumbnail,
          isActive: formData.isActive
        });
      } else {
        await createLanding({
          name: formData.name,
          path: formData.path,
          description: formData.description,
          thumbnail: formData.thumbnail,
          isActive: formData.isActive
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
    // If no subdomain is provided, return the base path
    if (!subdomain) return path;
    
    // For root path, use /subdomain
    if (path === '/') return `/${subdomain}`;
    
    // For subpaths like /living or /special, always use /?subdomain for SNS compatibility
    const cleanPath = path.endsWith('/') ? path : `${path}/`;
    return `${cleanPath}?${subdomain}`;
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-[24px] font-bold text-[#191F28]">
              {userType === 'admin' ? '랜딩페이지 관리' : '내 랜딩페이지 내역'}
            </h1>
            <span className="text-[12px] font-extrabold bg-[#E8F3FF] text-[#3182F6] px-2.5 py-0.5 rounded-full border border-[#3182F6]/20">
              총 {displayLandings.length}개
            </span>
          </div>
          <p className="text-[14px] text-[#8B95A1]">
            {userType === 'admin' 
              ? '채널에 적용할 수 있는 랜딩페이지 리스트입니다.' 
              : '귀하의 채널에 할당된 랜딩페이지 리스트와 전용 주소입니다.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Sort Selection Buttons */}
          <div className="flex items-center bg-white p-1 rounded-[12px] border border-[#E5E8EB] shadow-xs">
            <button
              onClick={() => setSortOrder('latest')}
              className={`px-3.5 py-2 rounded-[8px] text-[13px] font-bold transition-all ${
                sortOrder === 'latest'
                  ? 'bg-[#3182F6] text-white shadow-xs'
                  : 'text-[#4E5968] hover:text-[#191F28] hover:bg-[#F2F4F6]'
              }`}
            >
              최신순
            </button>
            <button
              onClick={() => setSortOrder('oldest')}
              className={`px-3.5 py-2 rounded-[8px] text-[13px] font-bold transition-all ${
                sortOrder === 'oldest'
                  ? 'bg-[#3182F6] text-white shadow-xs'
                  : 'text-[#4E5968] hover:text-[#191F28] hover:bg-[#F2F4F6]'
              }`}
            >
              등록일순
            </button>
            <button
              onClick={() => setSortOrder('name')}
              className={`px-3.5 py-2 rounded-[8px] text-[13px] font-bold transition-all ${
                sortOrder === 'name'
                  ? 'bg-[#3182F6] text-white shadow-xs'
                  : 'text-[#4E5968] hover:text-[#191F28] hover:bg-[#F2F4F6]'
              }`}
            >
              이름순
            </button>
          </div>

          {userType === 'admin' && (
            <button 
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 bg-[#3182F6] text-white px-5 py-2.5 rounded-[12px] font-medium hover:bg-[#1B64DA] transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              신규 랜딩 등록
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayLandings.map((landing) => (
          <div 
            key={landing._id} 
            className="bg-white rounded-[24px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#E5E8EB] flex flex-col hover:shadow-lg transition-shadow"
          >
            <div className="w-full aspect-[4/3] bg-[#F2F4F6] flex items-center justify-center relative group overflow-hidden">
              {landing.thumbnail ? (
                <img 
                  src={landing.thumbnail} 
                  alt={landing.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />


              ) : (
                <Globe className="w-12 h-12 text-[#D1D6DB]" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <a 
                  href={getCustomUrl(landing.path)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white p-3 rounded-full hover:scale-110 transition-transform shadow-lg"
                  title="랜딩페이지 바로가기"
                >
                  <ExternalLink className="w-5 h-5 text-[#191F28]" />
                </a>
                {userType === 'admin' && (
                  <>
                    <button 
                      onClick={() => openEditModal(landing)}
                      className="bg-[#3182F6] p-3 rounded-full hover:scale-110 transition-transform shadow-lg text-white"
                      title="랜딩페이지 수정"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => openDuplicateModal(landing)}
                      className="bg-emerald-500 hover:bg-emerald-600 p-3 rounded-full hover:scale-110 transition-transform shadow-lg text-white"
                      title="랜딩페이지 복제"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              {!landing.isActive && (
                <div className="absolute top-4 left-4 bg-[#FEECEF] text-[#F04452] text-[11px] font-bold px-2.5 py-1 rounded-full border border-[#F04452]/20">
                  사용 안 함
                </div>
              )}
            </div>

            
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-[17px] font-black text-[#191F28]">{landing.name}</h3>
                <span className="text-[12px] font-bold text-[#3182F6] bg-[#E8F3FF] px-2 py-0.5 rounded-md">
                  {getCustomUrl(landing.path)}
                </span>
              </div>
              <p className="text-[14px] text-[#4E5968] leading-relaxed mb-6 flex-1 break-keep">
                {landing.description || '설명이 없습니다.'}
              </p>
              
              <div className="mt-auto flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <a 
                    href={getCustomUrl(landing.path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 bg-[#3182F6] text-white py-2.5 rounded-[12px] font-bold text-[13px] hover:bg-[#1B64DA] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    바로가기
                  </a>
                  {userType === 'admin' ? (
                    <button 
                      onClick={() => openDuplicateModal(landing)}
                      className="flex items-center justify-center gap-1.5 bg-[#F2F4F6] text-[#333D4B] hover:bg-[#E5E8EB] py-2.5 rounded-[12px] font-bold text-[13px] transition-colors cursor-pointer"
                    >
                      <Copy className="w-4 h-4 text-[#4E5968]" />
                      복제하기
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 bg-[#F2F4F6] text-[#6B7684] py-2.5 rounded-[12px] font-medium text-[13px]">
                      공식 랜딩
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-[#F2F4F6]">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#3182F6]" />
                      <span className="text-[12px] font-bold text-[#8B95A1]">효원 공식 랜딩</span>
                    </div>
                    {landing._creationTime && (
                      <span className="text-[11px] font-medium text-[#8B95A1] bg-[#F2F4F6] px-2 py-0.5 rounded-full">
                        {new Date(landing._creationTime).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' })} 등록
                      </span>
                    )}
                  </div>
                  {userType === 'admin' && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => openEditModal(landing)}
                        className="p-2 text-[#8B95A1] hover:text-[#3182F6] hover:bg-[#F2F4F6] rounded-lg transition-colors cursor-pointer"
                        title="수정"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openDuplicateModal(landing)}
                        className="p-2 text-[#8B95A1] hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="복제"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(landing._id)}
                        className="p-2 text-[#8B95A1] hover:text-[#F04452] hover:bg-[#FEECEF] rounded-lg transition-colors cursor-pointer"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}



        {landings.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[24px] border border-dashed border-[#D1D6DB]">
             <p className="text-[#8B95A1] font-medium">등록된 랜딩페이지가 없습니다.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <div className="bg-white rounded-[32px] w-full max-w-[480px] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-[#F2F4F6] flex justify-between items-center">
              <h2 className="text-[18px] font-black text-[#191F28] flex items-center gap-2">
                {modalMode === 'duplicate' && <Copy className="w-5 h-5 text-emerald-600" />}
                {modalMode === 'duplicate' ? '랜딩페이지 복제' : modalMode === 'edit' ? '랜딩페이지 수정' : '신규 랜딩 등록'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center bg-[#F9FAFB] rounded-full hover:bg-[#F2F4F6] transition-colors cursor-pointer"
              >
                <Plus className="w-6 h-6 text-[#8B95A1] rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">랜딩명</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="예: 리빙/생활가전 전용 랜딩"
                    className="w-full bg-[#F2F4F6] px-5 py-4 rounded-[16px] text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[#3182F6]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">접속 경로 (Path)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.path}
                    onChange={(e) => setFormData({...formData, path: e.target.value})}
                    placeholder="예: /living_copy"
                    className="w-full bg-[#F2F4F6] px-5 py-4 rounded-[16px] text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[#3182F6]/20 transition-all"
                  />
                  {modalMode === 'duplicate' && (
                    <p className="text-[11px] text-[#8B95A1] mt-1.5 px-1">
                      ※ 기존 랜딩과 중복되지 않도록 고유한 접속 경로(Path)를 지정해주세요.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">상세 설명</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="랜딩페이지에 대한 간단한 설명을 입력해주세요."
                    className="w-full bg-[#F2F4F6] px-5 py-4 rounded-[16px] text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[#3182F6]/20 transition-all min-h-[80px] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">썸네일 이미지 URL</label>
                  <input 
                    type="text" 
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({...formData, thumbnail: e.target.value})}
                    placeholder="이미지 주소를 입력하세요 (상단 히어로 이미지 권장)"
                    className="w-full bg-[#F2F4F6] px-5 py-4 rounded-[16px] text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[#3182F6]/20 transition-all"
                  />
                </div>


                <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-[20px] border border-[#F2F4F6]">
                  <span className="text-[14px] font-bold text-[#191F28]">활성화 상태</span>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                    className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${formData.isActive ? 'bg-[#3182F6]' : 'bg-[#D1D6DB]'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isActive ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="mt-10">
                <button 
                  type="submit"
                  className={`w-full py-5 text-white font-black rounded-[20px] transition-all shadow-lg active:scale-[0.98] cursor-pointer ${
                    modalMode === 'duplicate' 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' 
                      : 'bg-[#3182F6] hover:bg-[#1B64DA] shadow-[#3182F6]/20'
                  }`}
                >
                  {modalMode === 'duplicate' ? '복제본 생성하기' : modalMode === 'edit' ? '변경사항 저장' : '새 랜딩페이지 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
