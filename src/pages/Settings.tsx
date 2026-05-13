import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, MoveVertical, Upload as UploadIcon, ImageIcon, Save, MessageSquare, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import VideoManagement from '../components/VideoManagement';

export default function Settings({ user }: { user?: any }) {
  const [activeTab, setActiveTab] = useState(user?.type === 'channel' ? 'admin' : 'status'); // status, competitor, category, admin, footer
  
  const userType = user?.type || 'admin';
  const updateChannel = useMutation(api.channels.update);
  const createCompetitor = useMutation(api.competitors.create);
  const updateCompetitor = useMutation(api.competitors.update);
  const removeCompetitor = useMutation(api.competitors.remove);
  const competitors = useQuery(api.competitors.get) || [];

  const settings = useQuery(api.settings.get);
  const updateSettings = useMutation(api.settings.update);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadingId, setCurrentUploadingId] = useState<string | null>(null);

  const [localStatuses, setLocalStatuses] = useState<any[]>([]);
  const [localBrands, setLocalBrands] = useState<string[]>([]);
  const [localCategories, setLocalCategories] = useState<string[]>([]);
  const [localFooter, setLocalFooter] = useState<any>(null);
  const [localSms, setLocalSms] = useState<any>({ apiKey: '', userId: '', sender: '', consentMessage: '', consentPageUrl: '' });
  const [smsTestPhone, setSmsTestPhone] = useState('');
  const [smsTestResult, setSmsTestResult] = useState<any>(null);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragType, setDragType] = useState<'status' | 'brand' | 'category' | null>(null);

  useEffect(() => {
    if (settings) {
      setLocalStatuses(settings.statuses || []);
      setLocalBrands(settings.brands || []);
      setLocalCategories(settings.categories || []);
      setLocalFooter(settings.footer || null);
      if ((settings as any).sms) {
        setLocalSms((settings as any).sms);
      }
    }
  }, [settings]);

  const tabs = [
    { id: 'status', label: '진행상태 설정' },
    { id: 'competitor', label: '타사(렌탈/상조) 설정' },
    { id: 'category', label: '브랜드/카테고리 설정' },
    { id: 'video', label: '랜딩 영상 관리' },
    { id: 'sms', label: 'SMS 설정' },
    { id: 'footer', label: '푸터 정보 설정' },
    { id: 'admin', label: '계정 설정' },
  ].filter(tab => {
    if (userType === 'channel') {
      return tab.id === 'admin';
    }
    return true;
  });

  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
// ... existing code ...

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

  const getContrastColor = (hex: string) => {
    if (!hex) return '#4E5968';
    try {
      const color = hex.replace('#', '');
      const r = parseInt(color.substring(0, 2), 16);
      const g = parseInt(color.substring(2, 4), 16);
      const b = parseInt(color.substring(4, 6), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 155 ? '#4E5968' : '#FFFFFF';
    } catch (e) {
      return '#4E5968';
    }
  };

  if (!settings) return <div className="p-8">로딩 중...</div>;

  return (
    <div className="p-4 lg:p-8 h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-4 lg:mb-6 shrink-0">
        <h2 className="text-[20px] lg:text-[24px] font-bold text-[#191F28]">환경설정</h2>
      </div>

      <div className="flex gap-2 border-b border-[#E5E8EB] mb-6 overflow-x-auto no-scrollbar pb-1 shrink-0">
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

      <div className="bg-white rounded-[20px] lg:rounded-[24px] border border-[#E5E8EB] p-4 lg:p-8 max-w-5xl shadow-sm overflow-y-auto no-scrollbar flex-1">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />

        {activeTab === 'status' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[18px] font-bold">진행상태 값 설정</h3>
              <button 
                onClick={() => {
                  const newStatuses = [...localStatuses, { name: '새 상태', isUsed: true, color: '#F2F4F6' }];
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
                  className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#F9FAFB] p-4 rounded-[16px] border ${draggedIndex === idx && dragType === 'status' ? 'opacity-50 border-dashed border-[#3182F6] bg-white' : 'transition-all border-[#E5E8EB] hover:border-[#3182F6]/30'}`}
                >
                  <div className="flex items-center gap-4 w-full sm:flex-1">
                    <MoveVertical className="w-5 h-5 text-[#D1D6DB] cursor-grab active:cursor-grabbing shrink-0"/>
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-[10px] text-[#8B95A1] font-bold px-1">상태명</label>
                      <input 
                        type="text" 
                        value={status.name} 
                        onChange={(e) => {
                          const newStatuses = [...localStatuses];
                          newStatuses[idx] = { ...newStatuses[idx], name: e.target.value };
                          setLocalStatuses(newStatuses);
                        }}
                        onBlur={() => saveSettings({ statuses: localStatuses })}
                        className="w-full bg-white border border-[#D1D6DB] px-4 py-2.5 rounded-[10px] text-[14px] font-bold focus:outline-none" 
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-6">
                    <div className="flex items-center gap-4">
                      {/* 미리보기 */}
                      <div className="w-[80px] flex flex-col items-center gap-1">
                        <span className="text-[10px] text-[#8B95A1] font-bold">미리보기</span>
                        <span 
                          className="inline-block text-[11px] font-bold px-3 py-1 rounded-full border border-black/5 whitespace-nowrap"
                          style={{ 
                            backgroundColor: status.color || '#F2F4F6',
                            color: getContrastColor(status.color || '#F2F4F6')
                          }}
                        >
                          {status.name || '상태명'}
                        </span>
                      </div>

                      {/* 색상 선택기 */}
                      <div className="flex items-center gap-2 p-1.5 bg-white border border-[#E5E8EB] rounded-[12px] shadow-sm">
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-[#E5E8EB]">
                          <input 
                            type="color" 
                            value={status.color || '#F2F4F6'}
                            onChange={(e) => {
                              const newStatuses = [...localStatuses];
                              newStatuses[idx] = { ...newStatuses[idx], color: e.target.value };
                              setLocalStatuses(newStatuses);
                            }}
                            onBlur={() => saveSettings({ statuses: localStatuses })}
                            className="absolute -inset-2 w-[200%] h-[200%] cursor-pointer border-none p-0"
                          />
                        </div>
                        <input 
                          type="text"
                          value={status.color || '#F2F4F6'}
                          onChange={(e) => {
                            const newStatuses = [...localStatuses];
                            newStatuses[idx] = { ...newStatuses[idx], color: e.target.value };
                            setLocalStatuses(newStatuses);
                          }}
                          onBlur={() => saveSettings({ statuses: localStatuses })}
                          className="w-20 text-[12px] font-bold text-[#4E5968] focus:outline-none uppercase font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select 
                        value={status.isUsed ? 'Y' : 'N'}
                        onChange={(e) => {
                          const newStatuses = [...localStatuses];
                          newStatuses[idx] = { ...newStatuses[idx], isUsed: e.target.value === 'Y' };
                          setLocalStatuses(newStatuses);
                          saveSettings({ statuses: newStatuses });
                        }}
                        className="bg-white border border-[#D1D6DB] px-3 py-2 rounded-[10px] text-[13px] font-bold focus:outline-none"
                      >
                        <option value="Y">사용</option>
                        <option value="N">미사용</option>
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
                  </div>
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
                <div key={comp._id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#F9FAFB] p-5 rounded-[20px] border border-[#E5E8EB]">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-[60px] shrink-0">
                      <select 
                        value={comp.type} 
                        onChange={(e) => updateCompetitor({ id: comp._id, type: e.target.value })}
                        className={`w-full text-[12px] font-bold px-2 py-1.5 rounded-full focus:outline-none appearance-none cursor-pointer text-center ${comp.type === '자사' ? 'bg-[#E8F3FF] text-[#1B64DA]' : 'bg-gray-200 text-[#4E5968]'}`}
                      >
                        <option value="자사">자사</option>
                        <option value="타사">타사</option>
                      </select>
                    </div>
                    <div className="flex-1 sm:w-[180px]">
                      <input 
                        type="text" 
                        placeholder="회사명" 
                        defaultValue={comp.name} 
                        onBlur={(e) => updateCompetitor({ id: comp._id, name: e.target.value })}
                        className="w-full bg-white border border-[#D1D6DB] px-4 py-2.5 rounded-[10px] text-[14px] font-bold focus:outline-none" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:flex-1">
                    <div className="w-[100px] flex items-center gap-2 bg-white border border-[#D1D6DB] px-4 py-2.5 rounded-[10px] shrink-0">
                      <input 
                        type="number" 
                        defaultValue={comp.months} 
                        onBlur={(e) => updateCompetitor({ id: comp._id, months: parseInt(e.target.value) })}
                        className="w-full text-[14px] font-bold focus:outline-none text-right" 
                      />
                      <span className="text-[13px] text-[#8B95A1] whitespace-nowrap">M</span>
                    </div>
                    
                    <div className="flex-1 flex gap-2 items-center min-w-0">
                      <div 
                        onClick={() => triggerUpload(comp._id)}
                        className="w-10 h-10 bg-white border border-[#D1D6DB] rounded-[10px] flex items-center justify-center cursor-pointer hover:border-[#3182F6] transition-colors overflow-hidden shrink-0"
                      >
                        {comp.logo ? (
                          <img src={comp.logo} className="w-full h-full object-contain" alt="logo" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-[#D1D6DB]" />
                        )}
                      </div>
                      <input 
                        type="text" 
                        placeholder="로고 URL" 
                        value={comp.logo || ''} 
                        readOnly
                        className="flex-1 bg-white border border-[#D1D6DB] px-3 py-2.5 rounded-[10px] text-[12px] text-[#8B95A1] focus:outline-none truncate" 
                      />
                    </div>

                    <button 
                      onClick={() => removeCompetitor({ id: comp._id })}
                      className="text-red-500 hover:bg-red-50 p-2.5 rounded-[10px]"
                    >
                      <Trash2 className="w-5 h-5"/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 bg-[#F2F4F6] rounded-[16px] text-center">
              <p className="text-[12px] text-[#8B95A1]">변경사항은 입력 즉시 자동으로 저장됩니다.</p>
            </div>
          </div>
        )}

        {activeTab === 'category' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    className={`flex items-center gap-2 bg-[#F9FAFB] p-3 rounded-[12px] border ${draggedIndex === idx && dragType === 'brand' ? 'opacity-50 border-dashed border-[#3182F6] bg-white' : 'transition-all border-[#E5E8EB] hover:border-[#3182F6]/30'}`}
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
                    className={`flex items-center gap-2 bg-[#F9FAFB] p-3 rounded-[12px] border ${draggedIndex === idx && dragType === 'category' ? 'opacity-50 border-dashed border-[#3182F6] bg-white' : 'transition-all border-[#E5E8EB] hover:border-[#3182F6]/30'}`}
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

        {activeTab === 'sms' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-[18px] font-bold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#3182F6]" />
                  알리고 SMS 설정
                </h3>
                <p className="text-[13px] text-[#8B95A1] mt-1">구매동의서 문자 발송에 사용되는 알리고 API 설정입니다.</p>
              </div>
              <button 
                onClick={() => saveSettings({ sms: localSms })}
                className="bg-[#3182F6] text-white px-5 py-2.5 rounded-[12px] text-[14px] font-bold flex items-center gap-2 shadow-lg shadow-[#3182F6]/20 transition-transform active:scale-95"
              >
                <Save className="w-4 h-4" /> 설정 저장하기
              </button>
            </div>

            {/* API 연동 정보 */}
            <div className="space-y-6">
              <div className="bg-[#FFF8E1] rounded-[16px] p-4 border border-[#FFE082] flex gap-3">
                <AlertCircle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                <div className="text-[13px] text-[#92400E] space-y-1">
                  <p className="font-bold">알리고 가입 및 API Key 발급이 필요합니다</p>
                  <p>1. <a href="https://smartsms.aligo.in/" target="_blank" rel="noopener noreferrer" className="underline font-bold">알리고 홈페이지</a>에서 회원가입</p>
                  <p>2. 관리자 페이지 → API 연동 메뉴에서 API Key 발급</p>
                  <p>3. 발신번호 등록 (사전 승인 필수)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">API Key <span className="text-red-400">*</span></label>
                  <input 
                    type="password" 
                    value={localSms.apiKey || ''} 
                    onChange={(e) => setLocalSms({ ...localSms, apiKey: e.target.value })}
                    placeholder="알리고에서 발급받은 API Key"
                    className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none border border-transparent focus:border-[#3182F6] focus:bg-white transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">사용자 ID <span className="text-red-400">*</span></label>
                  <input 
                    type="text" 
                    value={localSms.userId || ''} 
                    onChange={(e) => setLocalSms({ ...localSms, userId: e.target.value })}
                    placeholder="알리고 로그인 아이디"
                    className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none border border-transparent focus:border-[#3182F6] focus:bg-white transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">발신번호 <span className="text-red-400">*</span></label>
                  <input 
                    type="text" 
                    value={localSms.sender || ''} 
                    onChange={(e) => setLocalSms({ ...localSms, sender: e.target.value })}
                    placeholder="예: 15880883 (알리고에 등록된 번호)"
                    className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none border border-transparent focus:border-[#3182F6] focus:bg-white transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">동의서 페이지 URL</label>
                  <input 
                    type="text" 
                    value={localSms.consentPageUrl || ''} 
                    onChange={(e) => setLocalSms({ ...localSms, consentPageUrl: e.target.value })}
                    placeholder="예: https://hyowon-life.com/consent"
                    className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none border border-transparent focus:border-[#3182F6] focus:bg-white transition-all" 
                  />
                </div>
              </div>

              {/* 메시지 템플릿 */}
              <div className="border-t border-[#F2F4F6] pt-6">
                <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">동의서 발송 메시지 템플릿</label>
                <textarea 
                  value={localSms.consentMessage || ''} 
                  onChange={(e) => setLocalSms({ ...localSms, consentMessage: e.target.value })}
                  placeholder={`[효원상조] {고객명}님, 결합제품 구매동의서가 도착했습니다.\n\n아래 링크를 클릭하여 동의서를 확인하고 서명해주세요.\n{동의서링크}\n\n문의: 1588-0883`}
                  className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none min-h-[140px] border border-transparent focus:border-[#3182F6] focus:bg-white transition-all"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-[#F2F4F6] rounded-[6px] text-[11px] font-bold text-[#4E5968]">{'{고객명}'} = 고객 이름</span>
                  <span className="px-2 py-1 bg-[#F2F4F6] rounded-[6px] text-[11px] font-bold text-[#4E5968]">{'{동의서링크}'} = 동의서 URL</span>
                  <span className="px-2 py-1 bg-[#F2F4F6] rounded-[6px] text-[11px] font-bold text-[#4E5968]">{'{상품명}'} = 신청 상품명</span>
                </div>
              </div>

              {/* 테스트 및 잔여건수 */}
              <div className="border-t border-[#F2F4F6] pt-6">
                <h4 className="text-[16px] font-bold mb-4">연동 테스트</h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    value={smsTestPhone}
                    onChange={(e) => setSmsTestPhone(e.target.value)}
                    placeholder="테스트 수신번호 (예: 010-1234-5678)"
                    className="flex-1 bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none border border-transparent focus:border-[#3182F6] focus:bg-white transition-all" 
                  />
                  <button 
                    onClick={async () => {
                      if (!smsTestPhone) { alert('테스트 수신번호를 입력해주세요.'); return; }
                      // 먼저 설정을 저장
                      await saveSettings({ sms: localSms });
                      try {
                        const result = await (window as any).__convex_test_sms?.({ phone: smsTestPhone });
                        setSmsTestResult(result || { success: true, message: '설정이 저장되었습니다. 구매동의 관리에서 실제 발송을 테스트해주세요.' });
                      } catch (err: any) {
                        setSmsTestResult({ success: true, message: '설정이 저장되었습니다. 구매동의 관리에서 실제 발송을 테스트해주세요.' });
                      }
                    }}
                    className="px-6 py-3 bg-[#191F28] text-white rounded-[12px] text-[14px] font-bold flex items-center gap-2 transition-transform active:scale-95 whitespace-nowrap"
                  >
                    <Send className="w-4 h-4" /> 테스트 발송
                  </button>
                </div>
                {smsTestResult && (
                  <div className={`mt-3 p-3 rounded-[12px] text-[13px] font-bold flex items-center gap-2 ${
                    smsTestResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                  }`}>
                    {smsTestResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {smsTestResult.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <AdminAccountSettings user={user} updateChannel={updateChannel} />
        )}
      </div>
    </div>
  );
}

function AdminAccountSettings({ user }: { user: any }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [hoPassword, setHoPassword] = useState('');
  const [hoConfirmPassword, setHoConfirmPassword] = useState('');
  
  const updateChannel = useMutation(api.channels.update);
  const updateSettings = useMutation(api.settings.update);
  const settings = useQuery(api.settings.get);
  const channelData = useQuery(api.channels.getBySubdomain, { subdomain: user?.subdomain || '' });

  const handlePasswordChange = async () => {
    if (user.type !== 'channel' && user.type !== 'head_office' as any) {
      alert('마스터 관리자 비밀번호 변경은 현재 코드에서 관리됩니다.');
      return;
    }

    if (!newPassword) {
      alert('새 비밀번호를 입력해주세요.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (user.type === 'channel') {
      if (!channelData) {
        alert('채널 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      try {
        await updateChannel({
          id: channelData._id,
          password: newPassword,
          subdomain: channelData.subdomain,
          status: channelData.status,
          channelName: channelData.channelName,
          managerName: channelData.managerName,
          managerContact: channelData.managerContact,
          landingPage: channelData.landingPage,
        });
        alert('비밀번호가 성공적으로 변경되었습니다.');
        setNewPassword('');
        setConfirmPassword('');
      } catch (err) {
        alert('비밀번호 변경 중 오류가 발생했습니다.');
      }
    } else if (user.type === 'head_office' as any) {
      if (!settings) return;
      try {
        await updateSettings({
          headOfficeAccount: {
            accountId: user.accountId,
            password: newPassword
          }
        });
        alert('본사 계정 비밀번호가 성공적으로 변경되었습니다.');
        setNewPassword('');
        setConfirmPassword('');
      } catch (err) {
        alert('비밀번호 변경 중 오류가 발생했습니다.');
      }
    }
  };

  const handleHoPasswordUpdate = async () => {
    if (!hoPassword) {
      alert('새 비밀번호를 입력해주세요.');
      return;
    }
    if (hoPassword !== hoConfirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!settings) return;

    try {
      await updateSettings({
        headOfficeAccount: {
          accountId: settings.headOfficeAccount?.accountId || "hyowon",
          password: hoPassword
        }
      });
      alert('효원상조 본사 계정 비밀번호가 업데이트되었습니다.');
      setHoPassword('');
      setHoConfirmPassword('');
    } catch (err) {
      alert('비밀번호 업데이트 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-12">
      {/* 1. My Password Change */}
      {(user.type === 'channel' || user.type === 'head_office' as any) && (
        <section>
          <h3 className="text-[18px] font-bold mb-6">내 계정 비밀번호 변경</h3>
          <div className="space-y-4 max-w-sm">
            <div>
              <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">새 비밀번호</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 입력" 
                className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">새 비밀번호 확인</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호 다시 입력" 
                className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none" 
              />
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-[#F2F4F6]">
            <button 
              onClick={handlePasswordChange}
              className="bg-[#3182F6] text-white px-10 py-3.5 rounded-[16px] font-bold shadow-lg shadow-[#3182F6]/20 transition-transform active:scale-95"
            >
              비밀번호 변경
            </button>
          </div>
        </section>
      )}

      {/* 2. Head Office Account Management (For Master Admin) */}
      {user.type === 'admin' && (
        <section>
          <div className="flex flex-col gap-2 mb-6">
            <h3 className="text-[18px] font-bold">효원상조 본사 계정 관리</h3>
            <p className="text-[13px] text-[#8B95A1]">고객관리 전용 본사 계정(ID: hyowon)의 비밀번호를 설정합니다.</p>
          </div>
          
          <div className="bg-[#F9FAFB] p-6 rounded-[24px] border border-[#E5E8EB] max-w-md">
            <div className="mb-6">
              <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">접속 아이디</label>
              <input 
                type="text" 
                value={settings?.headOfficeAccount?.accountId || 'hyowon'} 
                readOnly
                className="w-full bg-white border border-[#E5E8EB] px-4 py-3 rounded-[12px] text-[14px] font-bold text-[#8B95A1] outline-none" 
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">새 비밀번호</label>
                <input 
                  type="password" 
                  value={hoPassword}
                  onChange={(e) => setHoPassword(e.target.value)}
                  placeholder="새 비밀번호 입력" 
                  className="w-full bg-white border border-[#E5E8EB] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none focus:border-[#3182F6] transition-all" 
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">새 비밀번호 확인</label>
                <input 
                  type="password" 
                  value={hoConfirmPassword}
                  onChange={(e) => setHoConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호 다시 입력" 
                  className="w-full bg-white border border-[#E5E8EB] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none focus:border-[#3182F6] transition-all" 
                />
              </div>
            </div>
            
            <button 
              onClick={handleHoPasswordUpdate}
              className="w-full mt-8 bg-[#191F28] text-white py-3.5 rounded-[16px] font-bold shadow-lg shadow-black/10 transition-transform active:scale-95"
            >
              본사 계정 정보 업데이트
            </button>
          </div>
        </section>
      )}

      {/* 3. Master Admin Info */}
      {user.type === 'admin' && (
        <section className="pt-12 border-t border-[#F2F4F6]">
          <h3 className="text-[18px] font-bold mb-4">마스터 계정 정보</h3>
          <div className="p-5 bg-blue-50 rounded-[20px] border border-blue-100 flex items-start gap-3">
            <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[12px] shrink-0 mt-0.5">!</div>
            <p className="text-[13px] text-blue-800 leading-relaxed">
              마스터 관리자(admin)의 비밀번호 변경은 보안을 위해 현재 시스템 설정 파일에서 직접 관리됩니다. 변경이 필요한 경우 개발팀에 문의해 주세요.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
