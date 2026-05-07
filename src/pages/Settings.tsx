import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, MoveVertical, Upload as UploadIcon, ImageIcon, Save } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import VideoManagement from '../components/VideoManagement';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('status'); // status, competitor, category, admin, footer
  
  const competitors = useQuery(api.competitors.get) || [];
  const createCompetitor = useMutation(api.competitors.create);
  const updateCompetitor = useMutation(api.competitors.update);
  const removeCompetitor = useMutation(api.competitors.remove);

  const settings = useQuery(api.settings.get);
  const updateSettings = useMutation(api.settings.update);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadingId, setCurrentUploadingId] = useState<string | null>(null);

  const [localStatuses, setLocalStatuses] = useState<any[]>([]);
  const [localBrands, setLocalBrands] = useState<string[]>([]);
  const [localCategories, setLocalCategories] = useState<string[]>([]);
  const [localFooter, setLocalFooter] = useState<any>(null);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragType, setDragType] = useState<'status' | 'brand' | 'category' | null>(null);

  useEffect(() => {
    if (settings) {
      setLocalStatuses(settings.statuses || []);
      setLocalBrands(settings.brands || []);
      setLocalCategories(settings.categories || []);
      setLocalFooter(settings.footer || null);
    }
  }, [settings]);

  const tabs = [
    { id: 'status', label: '진행상태 설정' },
    { id: 'competitor', label: '타사(렌탈/상조) 설정' },
    { id: 'category', label: '브랜드/카테고리 설정' },
    { id: 'video', label: '랜딩 영상 관리' },
    { id: 'footer', label: '푸터 정보 설정' },
    { id: 'admin', label: '관리자 계정 설정' },
  ];

  const generateUploadUrl = useMutation(api.images.generateUploadUrl);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUploadingId !== null) {
      try {
        // 1. Generate upload URL
        const postUrl = await generateUploadUrl();
        
        // 2. Upload the file
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json();

        // 3. Update competitor with the storageId
        // Convex usually uses Storage ID, but here we expect a URL string.
        // We'll update the competitor with the storage ID and handle URL resolution if needed, 
        // but for now, we'll just save it.
        // NOTE: The backend needs to handle converting this to a URL or we can do it in the query.
        await updateCompetitor({ id: currentUploadingId as any, logo: storageId });
        
        alert('업로드가 완료되었습니다.');
      } catch (err) {
        console.error(err);
        alert('업로드 중 오류가 발생했습니다.');
      }
    }
  };

  const triggerUpload = (id: string) => {
    setCurrentUploadingId(id);
    fileInputRef.current?.click();
  };

  const saveSettings = async (updates: any) => {
    try {
      await updateSettings(updates);
    } catch (err) {
      alert('설정 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDragStart = (idx: number, type: 'status' | 'brand' | 'category') => {
    // 드래그 고스트 이미지가 흐릿하게 캡처되는 것을 방지하기 위해 스타일 적용을 약간 늦춥니다.
    setTimeout(() => {
      setDraggedIndex(idx);
      setDragType(type);
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragType(null);
  };

  const handleDrop = (idx: number) => {
    if (draggedIndex === null || dragType === null) return;
    if (draggedIndex === idx) return;

    if (dragType === 'status') {
      const newList = [...localStatuses];
      const [movedItem] = newList.splice(draggedIndex, 1);
      newList.splice(idx, 0, movedItem);
      setLocalStatuses(newList);
      saveSettings({ statuses: newList });
    } else if (dragType === 'brand') {
      const newList = [...localBrands];
      const [movedItem] = newList.splice(draggedIndex, 1);
      newList.splice(idx, 0, movedItem);
      setLocalBrands(newList);
      saveSettings({ brands: newList });
    } else if (dragType === 'category') {
      const newList = [...localCategories];
      const [movedItem] = newList.splice(draggedIndex, 1);
      newList.splice(idx, 0, movedItem);
      setLocalCategories(newList);
      saveSettings({ categories: newList });
    }

    handleDragEnd();
  };

  if (!settings) return <div className="p-8">로딩 중...</div>;

  return (
    <div className="p-8 h-full flex flex-col no-scrollbar overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[24px] font-bold text-[#191F28]">환경설정</h2>
      </div>

      <div className="flex gap-2 border-b border-[#E5E8EB] mb-6 overflow-x-auto no-scrollbar pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-[14px] font-bold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-[#3182F6] text-[#3182F6]' : 'border-transparent text-[#4E5968] hover:text-[#191F28]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[24px] border border-[#E5E8EB] p-8 max-w-5xl shadow-sm">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />

        {activeTab === 'status' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[18px] font-bold">진행상태 값 설정</h3>
              <button 
                onClick={() => {
                  const newStatuses = [...localStatuses, { name: '새 상태', isUsed: true }];
                  setLocalStatuses(newStatuses);
                  saveSettings({ statuses: newStatuses });
                }}
                className="bg-[#3182F6] text-white px-4 py-2 rounded-[10px] text-[14px] font-bold flex items-center gap-1 shadow-sm transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4"/> 상태 추가
              </button>
            </div>
            
            <div className="space-y-3">
              {localStatuses.map((status, idx) => (
                <div 
                  key={idx} 
                  draggable
                  onDragStart={() => handleDragStart(idx, 'status')}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(idx)}
                  className={`flex items-center gap-4 bg-[#F9FAFB] p-4 rounded-[16px] border transition-all ${draggedIndex === idx && dragType === 'status' ? 'opacity-20 border-[#3182F6] bg-white' : 'border-[#E5E8EB] hover:border-[#3182F6]/30'}`}
                >
                  <MoveVertical className="w-5 h-5 text-[#D1D6DB] cursor-grab active:cursor-grabbing shrink-0"/>
                  <input 
                    type="text" 
                    value={status.name} 
                    onChange={(e) => {
                      const newStatuses = [...localStatuses];
                      newStatuses[idx] = { ...newStatuses[idx], name: e.target.value };
                      setLocalStatuses(newStatuses);
                    }}
                    onBlur={() => saveSettings({ statuses: localStatuses })}
                    className="flex-1 bg-white border border-[#D1D6DB] px-4 py-2.5 rounded-[10px] text-[14px] font-bold focus:outline-none" 
                  />
                  <select 
                    value={status.isUsed ? 'Y' : 'N'}
                    onChange={(e) => {
                      const newStatuses = [...localStatuses];
                      newStatuses[idx] = { ...newStatuses[idx], isUsed: e.target.value === 'Y' };
                      setLocalStatuses(newStatuses);
                      saveSettings({ statuses: newStatuses });
                    }}
                    className="bg-white border border-[#D1D6DB] px-4 py-2.5 rounded-[10px] text-[13px] font-bold focus:outline-none"
                  >
                    <option value="Y">사용함</option>
                    <option value="N">사용안함</option>
                  </select>
                  <button 
                    onClick={() => {
                      if (window.confirm('정말 삭제하시겠습니까?')) {
                        const newStatuses = localStatuses.filter((_, i) => i !== idx);
                        setLocalStatuses(newStatuses);
                        saveSettings({ statuses: newStatuses });
                      }
                    }}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-[8px]"
                  >
                    <Trash2 className="w-5 h-5"/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'competitor' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[18px] font-bold">타사(렌탈/상조) 정보 설정</h3>
              <button 
                onClick={() => createCompetitor({ name: '신규 업체', months: 60, type: '타사' })}
                className="bg-[#3182F6] text-white px-4 py-2 rounded-[10px] text-[14px] font-bold flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-4 h-4"/> 타사 추가
              </button>
            </div>
            
            <div className="space-y-4">
              {competitors.map((comp) => (
                <div key={comp._id} className="flex items-center gap-4 bg-[#F9FAFB] p-5 rounded-[20px] border border-[#E5E8EB]">
                  <div className="w-[80px] shrink-0">
                    <select 
                      value={comp.type} 
                      onChange={(e) => updateCompetitor({ id: comp._id, type: e.target.value })}
                      className={`text-[12px] font-bold px-2.5 py-1 rounded-full focus:outline-none appearance-none cursor-pointer text-center ${comp.type === '자사' ? 'bg-[#E8F3FF] text-[#1B64DA]' : 'bg-gray-200 text-[#4E5968]'}`}
                    >
                      <option value="자사">자사</option>
                      <option value="타사">타사</option>
                    </select>
                  </div>
                  <div className="w-[180px]">
                    <input 
                      type="text" 
                      placeholder="회사명" 
                      defaultValue={comp.name} 
                      onBlur={(e) => updateCompetitor({ id: comp._id, name: e.target.value })}
                      className="w-full bg-white border border-[#D1D6DB] px-4 py-2.5 rounded-[10px] text-[14px] font-bold focus:outline-none" 
                    />
                  </div>
                  <div className="w-[120px] flex items-center gap-2 bg-white border border-[#D1D6DB] px-4 py-2.5 rounded-[10px] shrink-0">
                    <input 
                      type="number" 
                      defaultValue={comp.months} 
                      onBlur={(e) => updateCompetitor({ id: comp._id, months: parseInt(e.target.value) })}
                      className="w-full text-[14px] font-bold focus:outline-none text-right" 
                    />
                    <span className="text-[13px] text-[#8B95A1] whitespace-nowrap">개월</span>
                  </div>
                  <div className="flex-1 flex gap-3 items-center">
                    <div 
                      onClick={() => triggerUpload(comp._id)}
                      className="w-12 h-12 bg-white border border-[#D1D6DB] rounded-[10px] flex items-center justify-center cursor-pointer hover:border-[#3182F6] transition-colors overflow-hidden shrink-0"
                    >
                      {comp.logo ? (
                        <img src={comp.logo} className="w-full h-full object-contain" alt="logo" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-[#D1D6DB]" />
                      )}
                    </div>
                    <input 
                      type="text" 
                      placeholder="로고 URL" 
                      value={comp.logo || ''} 
                      readOnly
                      className="flex-1 bg-white border border-[#D1D6DB] px-4 py-2.5 rounded-[10px] text-[13px] text-[#8B95A1] focus:outline-none truncate" 
                    />
                    <button 
                      onClick={() => triggerUpload(comp._id)}
                      className="bg-[#333D4B] text-white px-4 py-2.5 rounded-[10px] text-[12px] font-bold whitespace-nowrap active:bg-[#191F28]"
                    >
                      업로드
                    </button>
                  </div>
                  <button 
                    onClick={() => removeCompetitor({ id: comp._id })}
                    className="text-red-500 hover:bg-red-50 p-2.5 rounded-[10px]"
                  >
                    <Trash2 className="w-5 h-5"/>
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 bg-[#F2F4F6] rounded-[16px] text-center">
              <p className="text-[12px] text-[#8B95A1]">변경사항은 입력 즉시 자동으로 저장됩니다.</p>
            </div>
          </div>
        )}

        {activeTab === 'category' && (
          <div className="grid grid-cols-2 gap-8">
            {/* 브랜드 설정 */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[16px] font-bold">브랜드 설정</h3>
                <button 
                  onClick={() => {
                    const newBrands = [...localBrands, '새 브랜드'];
                    setLocalBrands(newBrands);
                    saveSettings({ brands: newBrands });
                  }}
                  className="text-[#3182F6] text-[13px] font-bold flex items-center gap-1 transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4"/> 추가
                </button>
              </div>
              <div className="space-y-2">
                {localBrands.map((brand, idx) => (
                  <div 
                    key={idx} 
                    draggable
                    onDragStart={() => handleDragStart(idx, 'brand')}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(idx)}
                    className={`flex items-center gap-2 bg-[#F9FAFB] p-3 rounded-[12px] border transition-all ${draggedIndex === idx && dragType === 'brand' ? 'opacity-20 border-[#3182F6] bg-white' : 'border-[#E5E8EB] hover:border-[#3182F6]/30'}`}
                  >
                    <MoveVertical className="w-4 h-4 text-[#D1D6DB] cursor-grab shrink-0"/>
                    <input 
                      type="text" 
                      value={brand} 
                      onChange={(e) => {
                        const newBrands = [...localBrands];
                        newBrands[idx] = e.target.value;
                        setLocalBrands(newBrands);
                      }}
                      onBlur={() => saveSettings({ brands: localBrands })}
                      className="flex-1 bg-white border border-[#D1D6DB] px-3 py-1.5 rounded-[8px] text-[13px] font-bold focus:outline-none" 
                    />
                    <button 
                      onClick={() => {
                        if (window.confirm('삭제하시겠습니까?')) {
                          const newBrands = localBrands.filter((_, i) => i !== idx);
                          setLocalBrands(newBrands);
                          saveSettings({ brands: newBrands });
                        }
                      }}
                      className="text-red-500 p-1.5 hover:bg-red-50 rounded-[6px]"
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 카테고리 설정 */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[16px] font-bold">카테고리 설정</h3>
                <button 
                  onClick={() => {
                    const newCategories = [...localCategories, '새 카테고리'];
                    setLocalCategories(newCategories);
                    saveSettings({ categories: newCategories });
                  }}
                  className="text-[#3182F6] text-[13px] font-bold flex items-center gap-1 transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4"/> 추가
                </button>
              </div>
              <div className="space-y-2">
                {localCategories.map((cat, idx) => (
                  <div 
                    key={idx} 
                    draggable
                    onDragStart={() => handleDragStart(idx, 'category')}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(idx)}
                    className={`flex items-center gap-2 bg-[#F9FAFB] p-3 rounded-[12px] border transition-all ${draggedIndex === idx && dragType === 'category' ? 'opacity-20 border-[#3182F6] bg-white' : 'border-[#E5E8EB] hover:border-[#3182F6]/30'}`}
                  >
                    <MoveVertical className="w-4 h-4 text-[#D1D6DB] cursor-grab shrink-0"/>
                    <input 
                      type="text" 
                      value={cat} 
                      onChange={(e) => {
                        const newCats = [...localCategories];
                        newCats[idx] = e.target.value;
                        setLocalCategories(newCats);
                      }}
                      onBlur={() => saveSettings({ categories: localCategories })}
                      className="flex-1 bg-white border border-[#D1D6DB] px-3 py-1.5 rounded-[8px] text-[13px] font-bold focus:outline-none" 
                    />
                    <button 
                      onClick={() => {
                        if (window.confirm('삭제하시겠습니까?')) {
                          const newCats = localCategories.filter((_, i) => i !== idx);
                          setLocalCategories(newCats);
                          saveSettings({ categories: newCats });
                        }
                      }}
                      className="text-red-500 p-1.5 hover:bg-red-50 rounded-[6px]"
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'video' && <VideoManagement />}

        {activeTab === 'footer' && localFooter && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[18px] font-bold">푸터 정보 설정</h3>
              <button 
                onClick={() => saveSettings({ footer: localFooter })}
                className="bg-[#3182F6] text-white px-5 py-2.5 rounded-[12px] text-[14px] font-bold flex items-center gap-2 shadow-lg shadow-[#3182F6]/20 transition-transform active:scale-95"
              >
                <Save className="w-4 h-4" /> 설정 저장하기
              </button>
            </div>
            <div className="space-y-4 max-w-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">회사명</label>
                  <input 
                    type="text" 
                    value={localFooter.companyName} 
                    onChange={(e) => setLocalFooter({ ...localFooter, companyName: e.target.value })}
                    className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none border border-transparent focus:border-[#3182F6] focus:bg-white transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">대표자</label>
                  <input 
                    type="text" 
                    value={localFooter.representative} 
                    onChange={(e) => setLocalFooter({ ...localFooter, representative: e.target.value })}
                    className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none border border-transparent focus:border-[#3182F6] focus:bg-white transition-all" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">사업자등록번호</label>
                <input 
                  type="text" 
                  value={localFooter.businessNumber} 
                  onChange={(e) => setLocalFooter({ ...localFooter, businessNumber: e.target.value })}
                  className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none border border-transparent focus:border-[#3182F6] focus:bg-white transition-all" 
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">고객센터 연락처</label>
                <input 
                  type="text" 
                  value={localFooter.phone} 
                  onChange={(e) => setLocalFooter({ ...localFooter, phone: e.target.value })}
                  className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none border border-transparent focus:border-[#3182F6] focus:bg-white transition-all" 
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">주소</label>
                <input 
                  type="text" 
                  value={localFooter.address || ''} 
                  onChange={(e) => setLocalFooter({ ...localFooter, address: e.target.value })}
                  className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none border border-transparent focus:border-[#3182F6] focus:bg-white transition-all" 
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">이메일</label>
                <input 
                  type="text" 
                  value={localFooter.email || ''} 
                  onChange={(e) => setLocalFooter({ ...localFooter, email: e.target.value })}
                  className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none border border-transparent focus:border-[#3182F6] focus:bg-white transition-all" 
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">안내 문구</label>
                <textarea 
                  value={localFooter.notice} 
                  onChange={(e) => setLocalFooter({ ...localFooter, notice: e.target.value })}
                  className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none min-h-[120px] border border-transparent focus:border-[#3182F6] focus:bg-white transition-all"
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div>
            <h3 className="text-[18px] font-bold mb-6">관리자 계정 비밀번호 변경</h3>
            <div className="space-y-4 max-w-sm">
              <div>
                <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">현재 비밀번호</label>
                <input type="password" placeholder="현재 비밀번호 입력" className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">새 비밀번호</label>
                <input type="password" placeholder="새 비밀번호 입력" className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">새 비밀번호 확인</label>
                <input type="password" placeholder="새 비밀번호 다시 입력" className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none" />
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-[#F2F4F6] flex justify-center">
              <button className="bg-[#3182F6] text-white px-10 py-3.5 rounded-[16px] font-bold shadow-lg shadow-[#3182F6]/20 transition-transform active:scale-95">비밀번호 변경</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
