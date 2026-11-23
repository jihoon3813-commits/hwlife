import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Trash2,
  MoveVertical,
  ImageIcon,
  Save,
  MessageSquare,
  Send,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Building2,
  Tags,
  Video,
  FileText,
  Smartphone,
  Shield,
  RefreshCw,
  Copy,
  Download,
} from 'lucide-react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import VideoManagement from '../components/VideoManagement';
import { DEFAULT_GUIDE_TEMPLATES, GuideTemplate } from '../constants/guideTemplates';

export default function Settings({ user }: { user?: any }) {
  const [activeTab, setActiveTab] = useState(user?.type === 'channel' ? 'admin' : 'status');

  const userType = user?.type || 'admin';
  const createCompetitor = useMutation(api.competitors.create);
  const updateCompetitor = useMutation(api.competitors.update);
  const removeCompetitor = useMutation(api.competitors.remove);
  const competitors = useQuery(api.competitors.get) || [];

  const settings = useQuery(api.settings.get);
  const updateSettings = useMutation(api.settings.update);
  const sendTestSmsAction = useAction(api.sms.sendTestSms);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const smsInitializedRef = useRef(false);
  const [currentUploadingId, setCurrentUploadingId] = useState<string | null>(null);

  const [localStatuses, setLocalStatuses] = useState<any[]>([]);
  const [localBrands, setLocalBrands] = useState<string[]>([]);
  const [localCategories, setLocalCategories] = useState<string[]>([]);
  const [localFooter, setLocalFooter] = useState<any>(null);
  const [localSms, setLocalSms] = useState<any>({
    provider: 'phone_bridge',
    apiKey: '',
    userId: '',
    sender: '',
    consentMessage: '',
    consentPageUrl: '',
    bridgeSecret: '',
  });
  const [localGuideTemplates, setLocalGuideTemplates] = useState<GuideTemplate[]>(DEFAULT_GUIDE_TEMPLATES);
  const [isSavingGuide, setIsSavingGuide] = useState(false);
  const [guideSaved, setGuideSaved] = useState(false);
  const [isSavingSms, setIsSavingSms] = useState(false);
  const [smsSaved, setSmsSaved] = useState(false);
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
      if ((settings as any).sms && !smsInitializedRef.current) {
        const remoteSms = (settings as any).sms;
        setLocalSms({
          provider: remoteSms.provider || 'aligo',
          apiKey: remoteSms.apiKey || '',
          userId: remoteSms.userId || '',
          sender: remoteSms.sender || '',
          consentMessage: remoteSms.consentMessage || '',
          consentPageUrl: remoteSms.consentPageUrl || '',
          bridgeSecret: remoteSms.bridgeSecret || '',
        });
        smsInitializedRef.current = true;
      }
      if ((settings as any).guideTemplates?.length) {
        setLocalGuideTemplates((settings as any).guideTemplates);
      } else {
        setLocalGuideTemplates(DEFAULT_GUIDE_TEMPLATES);
      }
    }
  }, [settings]);

  const tabs = [
    { id: 'status', label: '진행상태 설정', icon: Sliders },
    { id: 'competitor', label: '타사(렌탈/상조) 설정', icon: Building2 },
    { id: 'category', label: '브랜드 · 카테고리', icon: Tags },
    { id: 'video', label: '랜딩 영상 관리', icon: Video },
    { id: 'guide', label: '안내 문구 설정', icon: MessageSquare },
    { id: 'sms', label: '문자(SMS) 연동 설정', icon: Smartphone },
    { id: 'footer', label: '푸터 사업자 정보', icon: FileText },
    { id: 'admin', label: '계정 · 권한 관리', icon: Shield },
  ].filter((tab) => {
    if (userType === 'channel') return tab.id === 'admin';
    return true;
  });

  const generateUploadUrl = useMutation(api.images.generateUploadUrl);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUploadingId !== null) {
      try {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        const { storageId } = await result.json();
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
    setTimeout(() => {
      setDraggedIndex(idx);
      setDragType(type);
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

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
    if (!hex) return '#263d36';
    try {
      const color = hex.replace('#', '');
      const r = parseInt(color.substring(0, 2), 16);
      const g = parseInt(color.substring(2, 4), 16);
      const b = parseInt(color.substring(4, 6), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 155 ? '#263d36' : '#FFFFFF';
    } catch (e) {
      return '#263d36';
    }
  };

  if (!settings) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <RefreshCw className="w-7 h-7 text-[#295e52] animate-spin mb-3" />
        <p className="text-[13px] font-semibold text-[#45554e]">시스템 설정을 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Heading */}
      <div className="adm-page-heading">
        <div>
          <div className="adm-eyebrow">HYOWON SANGJO · SETTINGS</div>
          <h1>환경설정</h1>
          <p>
            상담 진행상태 배지, 타사 비교표, 브랜드/카테고리, 랜딩 영상, 카톡·SMS 템플릿 및 계정 권한을 관리합니다.
          </p>
        </div>
      </div>

      {/* 2-Column Settings Layout (Modeled after Sono Settings) */}
      <div className="adm-settings-layout">
        {/* Left Vertical Menu */}
        <div className="adm-panel adm-settings-nav">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? 'active' : ''}
              >
                <Icon />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Active Panel */}
        <div className="adm-panel p-6 sm:p-7">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleLogoUpload}
          />

          {/* 1. 진행상태 설정 */}
          {activeTab === 'status' && (
            <div>
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#edf0e7]">
                <div>
                  <h3 className="text-[16px] font-bold text-[#263d36]">진행상태 배지 및 순서 설정</h3>
                  <p className="text-[12px] text-[#86918a] mt-1">
                    드래그하여 순서를 변경할 수 있으며, 색상과 노출 여부가 고객관리 탭에 즉시 반영됩니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newStatuses = [...localStatuses, { name: '새 상태', isUsed: true, color: '#eaf3e8' }];
                    setLocalStatuses(newStatuses);
                    saveSettings({ statuses: newStatuses });
                  }}
                  className="adm-btn primary"
                >
                  <Plus />
                  <span>상태 추가</span>
                </button>
              </div>

              <div className="adm-table-scroll border border-[#e6eae3] rounded-[11px]">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th className="w-10"></th>
                      <th>상태명</th>
                      <th className="text-center">배지 미리보기</th>
                      <th>배지 색상 (HEX)</th>
                      <th className="text-center">사용 여부</th>
                      <th className="text-center w-20">삭제</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localStatuses.map((status, idx) => (
                      <tr
                        key={idx}
                        draggable
                        onDragStart={() => handleDragStart(idx, 'status')}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(idx)}
                        className={draggedIndex === idx && dragType === 'status' ? 'opacity-40' : ''}
                      >
                        <td className="cursor-grab text-[#9ba594]">
                          <MoveVertical className="w-4 h-4" />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={status.name}
                            onChange={(e) => {
                              const newStatuses = [...localStatuses];
                              newStatuses[idx] = { ...newStatuses[idx], name: e.target.value };
                              setLocalStatuses(newStatuses);
                            }}
                            onBlur={() => saveSettings({ statuses: localStatuses })}
                            className="adm-input font-bold w-full max-w-[200px]"
                          />
                        </td>
                        <td className="text-center">
                          <span
                            className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-[5px]"
                            style={{
                              backgroundColor: status.color || '#f0f2ed',
                              color: getContrastColor(status.color || '#f0f2ed'),
                            }}
                          >
                            {status.name || '상태명'}
                          </span>
                        </td>
                        <td>
                          <div className="inline-flex items-center gap-2">
                            <input
                              type="color"
                              value={status.color || '#f0f2ed'}
                              onChange={(e) => {
                                const newStatuses = [...localStatuses];
                                newStatuses[idx] = { ...newStatuses[idx], color: e.target.value };
                                setLocalStatuses(newStatuses);
                              }}
                              onBlur={() => saveSettings({ statuses: localStatuses })}
                              className="w-7 h-7 rounded cursor-pointer border border-[#dfe5d9]"
                            />
                            <input
                              type="text"
                              value={status.color || '#f0f2ed'}
                              onChange={(e) => {
                                const newStatuses = [...localStatuses];
                                newStatuses[idx] = { ...newStatuses[idx], color: e.target.value };
                                setLocalStatuses(newStatuses);
                              }}
                              onBlur={() => saveSettings({ statuses: localStatuses })}
                              className="adm-input w-24 font-mono uppercase"
                            />
                          </div>
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const newStatuses = [...localStatuses];
                              newStatuses[idx] = { ...newStatuses[idx], isUsed: !status.isUsed };
                              setLocalStatuses(newStatuses);
                              saveSettings({ statuses: newStatuses });
                            }}
                            className={`adm-switch mx-auto ${status.isUsed ? 'checked' : ''}`}
                          >
                            <span />
                          </button>
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('정말 삭제하시겠습니까?')) {
                                const newStatuses = localStatuses.filter((_, i) => i !== idx);
                                setLocalStatuses(newStatuses);
                                saveSettings({ statuses: newStatuses });
                              }
                            }}
                            className="adm-icon-btn mx-auto hover:!text-[#a85042]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. 타사 설정 */}
          {activeTab === 'competitor' && (
            <div>
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#edf0e7]">
                <div>
                  <h3 className="text-[16px] font-bold text-[#263d36]">타사(렌탈 · 상조) 비교 업체 설정</h3>
                  <p className="text-[12px] text-[#86918a] mt-1">
                    상품 가격 비교표에 노출되는 자사 및 타사 업체명·약정 개월·로고를 관리합니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => createCompetitor({ name: '신규 업체', months: 60, type: '타사' })}
                  className="adm-btn primary"
                >
                  <Plus />
                  <span>비교 업체 추가</span>
                </button>
              </div>

              <div className="space-y-3">
                {competitors.map((comp) => (
                  <div
                    key={comp._id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-[11px] bg-[#f8f9f5] border border-[#e6eae3]"
                  >
                    <select
                      value={comp.type}
                      onChange={(e) => updateCompetitor({ id: comp._id, type: e.target.value })}
                      className="adm-select w-[90px] font-bold"
                    >
                      <option value="자사">자사</option>
                      <option value="타사">타사</option>
                    </select>

                    <input
                      type="text"
                      placeholder="회사명"
                      defaultValue={comp.name}
                      onBlur={(e) => updateCompetitor({ id: comp._id, name: e.target.value })}
                      className="adm-input font-bold sm:w-[190px]"
                    />

                    <div className="inline-flex items-center gap-1.5">
                      <input
                        type="number"
                        defaultValue={comp.months}
                        onBlur={(e) => updateCompetitor({ id: comp._id, months: parseInt(e.target.value) })}
                        className="adm-input w-[84px] text-right font-mono font-bold"
                      />
                      <span className="text-[12px] text-[#6d786c] font-semibold">개월</span>
                    </div>

                    <div className="flex-1 flex items-center gap-2 min-w-0 w-full">
                      <button
                        type="button"
                        onClick={() => triggerUpload(comp._id)}
                        className="w-9 h-9 bg-white border border-[#dfe5d9] rounded-[8px] flex items-center justify-center overflow-hidden shrink-0 hover:border-[#295e52] cursor-pointer"
                        title="로고 이미지 업로드"
                      >
                        {comp.logo ? (
                          <img src={comp.logo} className="w-full h-full object-contain" alt="logo" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-[#9ba594]" />
                        )}
                      </button>
                      <input
                        type="text"
                        placeholder="로고 URL"
                        value={comp.logo || ''}
                        readOnly
                        className="adm-input flex-1 !bg-white font-mono text-[#86918a]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeCompetitor({ id: comp._id })}
                      className="adm-icon-btn hover:!text-[#a85042]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="adm-section-note mt-5">
                <span>변경사항은 입력 포커스 해제 시 자동 저장됩니다.</span>
              </div>
            </div>
          )}

          {/* 3. 브랜드 / 카테고리 */}
          {activeTab === 'category' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="adm-section-label !mt-0">
                  <span>가전 브랜드 설정</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newBrands = [...localBrands, '새 브랜드'];
                      setLocalBrands(newBrands);
                      saveSettings({ brands: newBrands });
                    }}
                    className="adm-btn sage small"
                  >
                    <Plus /> 추가
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
                      className="flex items-center gap-2 p-2.5 rounded-[9px] bg-[#f8f9f5] border border-[#e6eae3]"
                    >
                      <MoveVertical className="w-4 h-4 text-[#9ba594] cursor-grab shrink-0" />
                      <input
                        type="text"
                        value={brand}
                        onChange={(e) => {
                          const newBrands = [...localBrands];
                          newBrands[idx] = e.target.value;
                          setLocalBrands(newBrands);
                        }}
                        onBlur={() => saveSettings({ brands: localBrands })}
                        className="adm-input flex-1 font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('삭제하시겠습니까?')) {
                            const newBrands = localBrands.filter((_, i) => i !== idx);
                            setLocalBrands(newBrands);
                            saveSettings({ brands: newBrands });
                          }
                        }}
                        className="adm-icon-btn hover:!text-[#a85042]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="adm-section-label !mt-0">
                  <span>제품군 카테고리 설정</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newCategories = [...localCategories, '새 카테고리'];
                      setLocalCategories(newCategories);
                      saveSettings({ categories: newCategories });
                    }}
                    className="adm-btn sage small"
                  >
                    <Plus /> 추가
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
                      className="flex items-center gap-2 p-2.5 rounded-[9px] bg-[#f8f9f5] border border-[#e6eae3]"
                    >
                      <MoveVertical className="w-4 h-4 text-[#9ba594] cursor-grab shrink-0" />
                      <input
                        type="text"
                        value={cat}
                        onChange={(e) => {
                          const newCats = [...localCategories];
                          newCats[idx] = e.target.value;
                          setLocalCategories(newCats);
                        }}
                        onBlur={() => saveSettings({ categories: localCategories })}
                        className="adm-input flex-1 font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('삭제하시겠습니까?')) {
                            const newCats = localCategories.filter((_, i) => i !== idx);
                            setLocalCategories(newCats);
                            saveSettings({ categories: newCats });
                          }
                        }}
                        className="adm-icon-btn hover:!text-[#a85042]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. 랜딩 영상 관리 */}
          {activeTab === 'video' && <VideoManagement />}

          {/* 5. 안내 문구 설정 */}
          {activeTab === 'guide' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#edf0e7]">
                <div>
                  <h3 className="text-[16px] font-bold text-[#263d36]">카톡 · 문자 상품 안내 문구 템플릿</h3>
                  <p className="text-[12px] text-[#86918a] mt-1">
                    LG구독 고객 상세 드로어에서 사용되는 안내 문구 3종입니다.{' '}
                    <strong className="text-[#295e52]">{'{고객명}'}, {'{모델명}'}</strong> 치환자를 지원합니다.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('안내 문구 3종을 기본 추천 문구로 초기화하시겠습니까?')) {
                        setLocalGuideTemplates(DEFAULT_GUIDE_TEMPLATES);
                      }
                    }}
                    className="adm-btn"
                  >
                    기본 문구 초기화
                  </button>
                  <button
                    type="button"
                    disabled={isSavingGuide}
                    onClick={async () => {
                      setIsSavingGuide(true);
                      try {
                        await updateSettings({ guideTemplates: localGuideTemplates });
                        setGuideSaved(true);
                        setTimeout(() => setGuideSaved(false), 2500);
                      } catch {
                        alert('안내 문구 저장 중 오류가 발생했습니다.');
                      } finally {
                        setIsSavingGuide(false);
                      }
                    }}
                    className="adm-btn primary"
                  >
                    {guideSaved ? <CheckCircle2 /> : <Save />}
                    <span>{isSavingGuide ? '저장 중...' : guideSaved ? '저장 완료!' : '템플릿 저장'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {localGuideTemplates.map((tpl, idx) => (
                  <div key={tpl.id || idx} className="adm-note-card !bg-[#f8f9f5] space-y-3">
                    <div className="adm-field">
                      <label>템플릿 {idx + 1} 제목</label>
                      <input
                        type="text"
                        value={tpl.title}
                        onChange={(e) => {
                          const next = [...localGuideTemplates];
                          next[idx] = { ...tpl, title: e.target.value };
                          setLocalGuideTemplates(next);
                        }}
                        className="adm-input font-bold"
                      />
                    </div>
                    <div className="adm-field">
                      <label>안내 본문</label>
                      <textarea
                        rows={7}
                        value={tpl.content}
                        onChange={(e) => {
                          const next = [...localGuideTemplates];
                          next[idx] = { ...tpl, content: e.target.value };
                          setLocalGuideTemplates(next);
                        }}
                        className="adm-textarea"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. 문자(SMS) 연동 설정 */}
          {activeTab === 'sms' && (() => {
            const remoteSms = (settings as any)?.sms || {};
            const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL || '';
            const convexSiteUrl = convexUrl
              ? convexUrl.replace('.convex.cloud', '.convex.site')
              : 'https://<CONVEX_DEPLOYMENT>.convex.site';
            const apkDownloadUrl =
              'https://github.com/jihoon3813-commits/hwlife/releases/latest/download/hyowon-sms-bridge.apk';
            const activeProvider = localSms.provider || 'aligo';
            const lastSeenAt = remoteSms.bridgeLastSeenAt || 0;
            const isBridgeOnline = lastSeenAt > 0 && Date.now() - lastSeenAt < 65_000;
            const generateRandomSecret = () => {
              const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
              let token = 'hw-';
              for (let i = 0; i < 16; i += 1) {
                token += chars[Math.floor(Math.random() * chars.length)];
              }
              setLocalSms({ ...localSms, bridgeSecret: token });
            };
            const buildSmsPayload = () => ({
              provider: (localSms.provider === 'phone_bridge' ? 'phone_bridge' : 'aligo') as
                | 'aligo'
                | 'phone_bridge',
              apiKey: localSms.apiKey || '',
              userId: localSms.userId || '',
              sender: localSms.sender || '',
              consentMessage: localSms.consentMessage || '',
              consentPageUrl: localSms.consentPageUrl || '',
              bridgeSecret: localSms.bridgeSecret || '',
              ...(typeof remoteSms.bridgeLastSeenAt === 'number'
                ? { bridgeLastSeenAt: remoteSms.bridgeLastSeenAt }
                : {}),
              ...(typeof remoteSms.bridgeDeviceName === 'string'
                ? { bridgeDeviceName: remoteSms.bridgeDeviceName }
                : {}),
            });

            const handleSaveSmsSettings = async () => {
              setIsSavingSms(true);
              setSmsSaved(false);
              try {
                await updateSettings({ sms: buildSmsPayload() });
                setSmsSaved(true);
                setTimeout(() => setSmsSaved(false), 3000);
              } catch (err: any) {
                alert(`설정 저장 중 오류가 발생했습니다: ${err?.message || '알 수 없는 오류'}`);
              } finally {
                setIsSavingSms(false);
              }
            };

            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#edf0e7]">
                  <div>
                    <h3 className="text-[16px] font-bold text-[#263d36]">문자(SMS) 발송 · 수신 연동 설정</h3>
                    <p className="text-[12px] text-[#86918a] mt-1">
                      회사 안드로이드폰 양방향 직접 연동 또는 알리고 웹 발송 중 원하는 방식을 선택할 수 있습니다.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {smsSaved && (
                      <span className="adm-pill green !py-1.5 !px-3">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>저장되었습니다!</span>
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={isSavingSms}
                      onClick={handleSaveSmsSettings}
                      className="adm-btn primary"
                    >
                      <Save />
                      <span>{isSavingSms ? '저장 중...' : smsSaved ? '저장 완료!' : '설정 저장하기'}</span>
                    </button>
                  </div>
                </div>

                {/* 발송 방식 선택 스위치 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const nextSecret = localSms.bridgeSecret || (() => {
                        const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
                        let token = 'hw-';
                        for (let i = 0; i < 16; i += 1) token += chars[Math.floor(Math.random() * chars.length)];
                        return token;
                      })();
                      setLocalSms({ ...localSms, provider: 'phone_bridge', bridgeSecret: nextSecret });
                    }}
                    className={`text-left p-4 rounded-[12px] border-2 transition-all ${
                      activeProvider === 'phone_bridge'
                        ? 'border-[#295e52] bg-[#f3f8f6]'
                        : 'border-[#e5e8eb] bg-white hover:bg-[#f9fafb]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[14px] font-bold text-[#263d36]">
                        📱 회사폰 직접 연동 (양방향 · 추천)
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#295e52] text-white">
                        양방향 동기화
                      </span>
                    </div>
                    <p className="text-[12px] text-[#6b7684] leading-relaxed">
                      어드민 발송 문자가 회사폰 문자함에도 남고, 고객 답장 및 회사폰 직접 발신 문자도 어드민 대화창에 자동 기록됩니다.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLocalSms({ ...localSms, provider: 'aligo' })}
                    className={`text-left p-4 rounded-[12px] border-2 transition-all ${
                      activeProvider === 'aligo'
                        ? 'border-[#295e52] bg-[#f3f8f6]'
                        : 'border-[#e5e8eb] bg-white hover:bg-[#f9fafb]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[14px] font-bold text-[#263d36]">
                        ☁️ 알리고 웹 발송 (단방향)
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#f2f4f6] text-[#4e5968]">
                        기존 방식
                      </span>
                    </div>
                    <p className="text-[12px] text-[#6b7684] leading-relaxed">
                      알리고 API 서버를 통해 발송합니다. 회사폰 배터리가 방전되었거나 대량 발송이 필요할 때 전환해 사용하세요.
                    </p>
                  </button>
                </div>

                {activeProvider === 'phone_bridge' ? (
                  <div className="space-y-5">
                    {/* 실시간 연결 상태 표시 */}
                    <div
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[12px] border ${
                        isBridgeOnline
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : 'bg-amber-50/70 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isBridgeOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                          }`}
                        />
                        <div>
                          <div className="text-[13px] font-bold text-[#263d36]">
                            {isBridgeOnline
                              ? `회사폰 실시간 연결됨 (${remoteSms.bridgeDeviceName || 'Android'})`
                              : '회사폰 연결 대기 중'}
                          </div>
                          <div className="text-[11.5px] text-[#6b7684] mt-0.5">
                            {lastSeenAt > 0
                              ? `최근 통신: ${new Date(lastSeenAt).toLocaleString('ko-KR')}`
                              : '아직 회사폰 앱과 연결된 기록이 없습니다. 아래 보안키를 저장한 뒤 앱에서 [연동 시작]을 눌러주세요.'}
                          </div>
                        </div>
                      </div>
                      <a
                        href={apkDownloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#295e52] hover:bg-[#1f493f] text-white text-[12px] font-bold transition-colors shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        효원 문자연동 앱(APK) 다운로드
                      </a>
                    </div>

                    {/* 앱에 입력할 연결 정보 */}
                    <div className="adm-field-grid">
                      <div className="adm-field">
                        <label>앱에 입력할 서버 주소</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={convexSiteUrl}
                            className="adm-input font-mono bg-[#f9fafb]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(convexSiteUrl);
                              alert('서버 주소가 복사되었습니다.');
                            }}
                            className="adm-btn sage shrink-0"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>복사</span>
                          </button>
                        </div>
                      </div>

                      <div className="adm-field">
                        <label>앱 연동 보안키 *</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={localSms.bridgeSecret || ''}
                            onChange={(e) =>
                              setLocalSms({ ...localSms, bridgeSecret: e.target.value.trim() })
                            }
                            placeholder="예: hw-a1b2c3d4..."
                            className="adm-input font-mono"
                          />
                          <button
                            type="button"
                            onClick={generateRandomSecret}
                            className="adm-btn shrink-0"
                            title="새 보안키 생성"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>생성</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!localSms.bridgeSecret) return;
                              navigator.clipboard.writeText(localSms.bridgeSecret);
                              alert('연동 보안키가 복사되었습니다. 꼭 상단의 [설정 저장하기]도 눌러주세요!');
                            }}
                            className="adm-btn sage shrink-0"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>복사</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 갤럭시 최초 1회 설정 안내 */}
                    <div className="adm-section-note">
                      <AlertCircle />
                      <div className="space-y-1 text-[12px] leading-relaxed">
                        <strong className="text-[#263d36] block">
                          갤럭시 회사폰 최초 1회 설정 순서 (중요):
                        </strong>
                        <div>
                          1. 회사폰 기본 <strong>메시지 앱 설정 → 채팅+ 설정 → 채팅+ 기능 끄기</strong> (일반 문자로 송수신되어야 누락 없이 동기화됩니다)
                        </div>
                        <div>
                          2. 위 <strong>APK 다운로드 링크</strong>를 회사폰에서 열어 설치 후 실행합니다. (안드로이드 13 이상에서 SMS 권한 허용이 막혀 있으면 휴대폰 <code>설정 → 애플리케이션 → 효원 문자연동 → 우측 상단 ⋮ → 제한된 설정 허용</code> 후 권한 허용)
                        </div>
                        <div>
                          3. 앱에서 <strong>배터리 최적화 제외(제한 없음)</strong>를 허용한 뒤, 위의 <strong>서버 주소</strong>와 <strong>연동 보안키</strong>를 입력하고 <strong>[연동 시작]</strong>을 누르면 완료됩니다.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="adm-section-note">
                      <AlertCircle />
                      <div>
                        <strong className="text-[#263d36]">알리고 사전 준비사항:</strong>{' '}
                        <a
                          href="https://smartsms.aligo.in/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-bold text-[#295e52]"
                        >
                          알리고 홈페이지
                        </a>
                        에서 API Key 발급 및 발신번호 사전 등록 승인이 완료되어야 정상 발송됩니다.
                      </div>
                    </div>

                    <div className="adm-field-grid">
                      <div className="adm-field">
                        <label>API Key *</label>
                        <input
                          type="password"
                          value={localSms.apiKey || ''}
                          onChange={(e) => setLocalSms({ ...localSms, apiKey: e.target.value })}
                          placeholder="알리고 발급 API Key"
                          className="adm-input font-mono"
                        />
                      </div>
                      <div className="adm-field">
                        <label>알리고 사용자 ID *</label>
                        <input
                          type="text"
                          value={localSms.userId || ''}
                          onChange={(e) => setLocalSms({ ...localSms, userId: e.target.value })}
                          placeholder="알리고 로그인 아이디"
                          className="adm-input font-mono"
                        />
                      </div>
                      <div className="adm-field">
                        <label>승인된 발신번호 *</label>
                        <input
                          type="text"
                          value={localSms.sender || ''}
                          onChange={(e) => setLocalSms({ ...localSms, sender: e.target.value })}
                          placeholder="예: 15880883"
                          className="adm-input font-mono"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* 공통: 전자동의서 URL 및 메시지 템플릿 */}
                <div className="adm-field-grid pt-4 border-t border-[#edf0e7]">
                  <div className="adm-field full">
                    <label>동의서 기본 도메인 URL</label>
                    <input
                      type="text"
                      value={localSms.consentPageUrl || ''}
                      onChange={(e) => setLocalSms({ ...localSms, consentPageUrl: e.target.value })}
                      placeholder="예: https://hyowon-life.com/consent"
                      className="adm-input font-mono"
                    />
                  </div>
                  <div className="adm-field full">
                    <label>구매동의서 발송 메시지 템플릿</label>
                    <textarea
                      value={localSms.consentMessage || ''}
                      onChange={(e) => setLocalSms({ ...localSms, consentMessage: e.target.value })}
                      placeholder={`[효원상조] {고객명}님, 결합제품 구매동의서가 도착했습니다.\n\n아래 링크를 클릭하여 동의서를 확인하고 서명해주세요.\n{동의서링크}\n\n문의: 1588-0883`}
                      className="adm-textarea !min-h-[120px]"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="adm-pill gray">{'{고객명}'} = 고객 성함</span>
                      <span className="adm-pill gray">{'{동의서링크}'} = 전자동의서 URL</span>
                      <span className="adm-pill gray">{'{상품명}'} = 신청 상품명</span>
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-[#edf0e7] space-y-3">
                  <div className="text-[13px] font-bold text-[#263d36]">연동 저장 및 발송 테스트</div>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={smsTestPhone}
                      onChange={(e) => setSmsTestPhone(e.target.value)}
                      placeholder="테스트 수신번호 (예: 010-1234-5678)"
                      className="adm-input flex-1 font-mono"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!smsTestPhone) {
                          alert('테스트 수신번호를 입력해주세요.');
                          return;
                        }
                        await saveSettings({ sms: buildSmsPayload() });
                        try {
                          const result = await sendTestSmsAction({ phone: smsTestPhone });
                          setSmsTestResult(result);
                        } catch (err: any) {
                          setSmsTestResult({
                            success: false,
                            message: err?.message || '테스트 발송 중 오류가 발생했습니다.',
                          });
                        }
                      }}
                      className="adm-btn sage shrink-0"
                    >
                      <Send />
                      <span>설정 저장 · 테스트</span>
                    </button>
                  </div>
                  {smsTestResult && (
                    <div className={`adm-pill ${smsTestResult.success ? 'green' : 'red'} !py-2 !px-3`}>
                      {smsTestResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span>{smsTestResult.message}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 7. 푸터 정보 설정 */}
          {activeTab === 'footer' && localFooter && (
            <div>
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#edf0e7]">
                <div>
                  <h3 className="text-[16px] font-bold text-[#263d36]">랜딩 하단 푸터 사업자 정보</h3>
                  <p className="text-[12px] text-[#86918a] mt-1">
                    공식 랜딩페이지 하단에 공통 노출되는 법인 정보 및 소비자 유의사항 문구입니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => saveSettings({ footer: localFooter })}
                  className="adm-btn primary"
                >
                  <Save />
                  <span>설정 저장하기</span>
                </button>
              </div>

              <div className="adm-field-grid max-w-2xl">
                <div className="adm-field">
                  <label>회사명</label>
                  <input
                    type="text"
                    value={localFooter.companyName}
                    onChange={(e) => setLocalFooter({ ...localFooter, companyName: e.target.value })}
                    className="adm-input font-bold"
                  />
                </div>
                <div className="adm-field">
                  <label>대표자명</label>
                  <input
                    type="text"
                    value={localFooter.representative}
                    onChange={(e) => setLocalFooter({ ...localFooter, representative: e.target.value })}
                    className="adm-input"
                  />
                </div>
                <div className="adm-field">
                  <label>사업자등록번호</label>
                  <input
                    type="text"
                    value={localFooter.businessNumber}
                    onChange={(e) => setLocalFooter({ ...localFooter, businessNumber: e.target.value })}
                    className="adm-input font-mono"
                  />
                </div>
                <div className="adm-field">
                  <label>고객센터 대표번호</label>
                  <input
                    type="text"
                    value={localFooter.phone}
                    onChange={(e) => setLocalFooter({ ...localFooter, phone: e.target.value })}
                    className="adm-input font-mono"
                  />
                </div>
                <div className="adm-field full">
                  <label>사업장 주소</label>
                  <input
                    type="text"
                    value={localFooter.address || ''}
                    onChange={(e) => setLocalFooter({ ...localFooter, address: e.target.value })}
                    className="adm-input"
                  />
                </div>
                <div className="adm-field full">
                  <label>공식 이메일</label>
                  <input
                    type="text"
                    value={localFooter.email || ''}
                    onChange={(e) => setLocalFooter({ ...localFooter, email: e.target.value })}
                    className="adm-input font-mono"
                  />
                </div>
                <div className="adm-field full">
                  <label>하단 소비자 고지 · 유의사항 문구</label>
                  <textarea
                    value={localFooter.notice}
                    onChange={(e) => setLocalFooter({ ...localFooter, notice: e.target.value })}
                    className="adm-textarea !min-h-[110px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 8. 계정 설정 */}
          {activeTab === 'admin' && <AdminAccountSettings user={user} />}
        </div>
      </div>
    </div>
  );
}

function AdminAccountSettings({ user }: { user: any }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [hoPassword, setHoPassword] = useState('');
  const [hoConfirmPassword, setHoConfirmPassword] = useState('');

  const [staffId, setStaffId] = useState('');
  const [staffPw, setStaffPw] = useState('');
  const [staffName, setStaffName] = useState('');

  const updateChannel = useMutation(api.channels.update);
  const updateSettings = useMutation(api.settings.update);
  const addOrUpdateStaff = useMutation(api.settings.addOrUpdateStaffAccount);
  const removeStaff = useMutation(api.settings.removeStaffAccount);
  const settings = useQuery(api.settings.get);
  const channelData = useQuery(
    api.channels.getBySubdomain,
    user?.subdomain ? { subdomain: user.subdomain } : 'skip'
  );

  const handlePasswordChange = async () => {
    if (user.type !== 'channel' && user.type !== ('head_office' as any)) {
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
        });
        alert('비밀번호가 성공적으로 변경되었습니다.');
        setNewPassword('');
        setConfirmPassword('');
      } catch {
        alert('비밀번호 변경 중 오류가 발생했습니다.');
      }
    } else if (user.type === ('head_office' as any)) {
      if (!settings) return;
      try {
        await updateSettings({
          headOfficeAccount: {
            accountId: user.accountId,
            password: newPassword,
          },
        });
        alert('본사 계정 비밀번호가 성공적으로 변경되었습니다.');
        setNewPassword('');
        setConfirmPassword('');
      } catch {
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
          accountId: settings.headOfficeAccount?.accountId || 'hyowon',
          password: hoPassword,
        },
      });
      alert('효원상조 본사 계정 비밀번호가 업데이트되었습니다.');
      setHoPassword('');
      setHoConfirmPassword('');
    } catch {
      alert('비밀번호 업데이트 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-8">
      {(user.type === 'channel' || user.type === ('head_office' as any)) && (
        <section className="space-y-4 max-w-md">
          <div className="adm-section-label !mt-0">
            <span>내 계정 비밀번호 변경</span>
          </div>
          <div className="adm-field">
            <label>새 비밀번호</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호 입력"
              className="adm-input"
            />
          </div>
          <div className="adm-field">
            <label>새 비밀번호 확인</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="새 비밀번호 다시 입력"
              className="adm-input"
            />
          </div>
          <button type="button" onClick={handlePasswordChange} className="adm-btn primary">
            <Save />
            <span>비밀번호 변경 저장</span>
          </button>
        </section>
      )}

      {user.type === 'admin' && (
        <>
          <section className="space-y-4 max-w-md">
            <div className="adm-section-label !mt-0">
              <span>효원상조 본사 전용 계정 (ID: hyowon)</span>
            </div>
            <p className="text-[12px] text-[#86918a]">
              고객관리 메뉴만 접근 가능한 본사 전용 계정의 비밀번호를 설정합니다.
            </p>
            <div className="adm-note-card space-y-3.5">
              <div className="adm-field">
                <label>접속 아이디</label>
                <input
                  type="text"
                  value={settings?.headOfficeAccount?.accountId || 'hyowon'}
                  readOnly
                  className="adm-input !bg-white font-mono font-bold text-[#6d786c]"
                />
              </div>
              <div className="adm-field">
                <label>새 비밀번호</label>
                <input
                  type="password"
                  value={hoPassword}
                  onChange={(e) => setHoPassword(e.target.value)}
                  placeholder="새 비밀번호 입력"
                  className="adm-input"
                />
              </div>
              <div className="adm-field">
                <label>새 비밀번호 확인</label>
                <input
                  type="password"
                  value={hoConfirmPassword}
                  onChange={(e) => setHoConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호 다시 입력"
                  className="adm-input"
                />
              </div>
              <button type="button" onClick={handleHoPasswordUpdate} className="adm-btn primary w-full">
                본사 계정 비밀번호 업데이트
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <div className="adm-section-label">
              <span>실무자 계정 관리 (고객관리 전용 접속)</span>
            </div>

            <div className="adm-table-scroll border border-[#e6eae3] rounded-[10px]">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>아이디</th>
                    <th>실무자 이름 · 라벨</th>
                    <th>비밀번호</th>
                    <th className="text-center w-24">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {((settings as any)?.staffAccounts || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center !py-8 text-[#86918a]">
                        등록된 실무자 계정이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    ((settings as any)?.staffAccounts || []).map((staff: any) => (
                      <tr key={staff.accountId}>
                        <td className="font-mono font-bold text-[#263d36]">{staff.accountId}</td>
                        <td>{staff.name || '실무자'}</td>
                        <td className="font-mono text-[#86918a]">••••••••</td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`'${staff.accountId}' 계정을 삭제하시겠습니까?`)) {
                                await removeStaff({ accountId: staff.accountId });
                                alert('계정이 삭제되었습니다.');
                              }
                            }}
                            className="adm-btn danger small"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="adm-note-card space-y-3">
              <div className="font-bold text-[#263d36] text-[12.5px]">실무자 계정 추가 · 비밀번호 변경</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  placeholder="아이디 (예: tu)"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="adm-input font-mono font-bold"
                />
                <input
                  type="text"
                  placeholder="이름 · 라벨 (예: 실무자(tu))"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="adm-input"
                />
                <input
                  type="password"
                  placeholder="비밀번호"
                  value={staffPw}
                  onChange={(e) => setStaffPw(e.target.value)}
                  className="adm-input"
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!staffId.trim() || !staffPw.trim()) {
                    alert('아이디와 비밀번호를 모두 입력해주세요.');
                    return;
                  }
                  try {
                    await addOrUpdateStaff({
                      accountId: staffId.trim(),
                      password: staffPw.trim(),
                      name: staffName.trim() || `실무자(${staffId.trim()})`,
                      role: 'head_office',
                    });
                    alert(`실무자 계정 '${staffId.trim()}'이(가) 저장되었습니다.`);
                    setStaffId('');
                    setStaffPw('');
                    setStaffName('');
                  } catch (err: any) {
                    alert(err.message || '저장 중 오류가 발생했습니다.');
                  }
                }}
                className="adm-btn primary"
              >
                <Plus />
                <span>실무자 계정 등록 · 업데이트</span>
              </button>
            </div>
          </section>

          <div className="adm-section-note">
            <Shield />
            <span>
              마스터 관리자(admin) 계정의 비밀번호는 시스템 보안 정책에 따라 코드 환경에서 관리됩니다.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
