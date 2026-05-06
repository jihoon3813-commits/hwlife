import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Trash2, MoveVertical, Play, Edit2, Check, X, RefreshCw } from 'lucide-react';
import { Id } from "../../convex/_generated/dataModel";

export default function VideoManagement() {
  const shorts = useQuery((api as any).shorts?.get);
  const createShort = useMutation((api as any).shorts?.create);
  const updateShort = useMutation((api as any).shorts?.update);
  const removeShort = useMutation((api as any).shorts?.remove);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<Id<"shorts"> | null>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    length: '',
    tag: '',
    videoUrl: '',
    thumbnail: '',
    order: 0
  });

  const extractYoutubeId = (url: string) => {
    if (!url) return null;
    const trimmed = url.trim();
    
    // If it's already an 11-char ID
    if (trimmed.length === 11 && !trimmed.includes('/') && !trimmed.includes('.') && !trimmed.includes('?')) {
      return trimmed;
    }
    
    // Pattern for various YouTube URL formats
    const patterns = [
      /(?:v=|\/)([0-9A-Za-z_-]{11}).*/,  // watch?v=ID or /ID
      /shorts\/([0-9A-Za-z_-]{11})/,    // shorts/ID
      /embed\/([0-9A-Za-z_-]{11})/,     // embed/ID
      /youtu.be\/([0-9A-Za-z_-]{11})/   // youtu.be/ID
    ];

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match && match[1]) return match[1];
    }
    
    return null;
  };

  const handleUrlFetch = async (url: string) => {
    const videoId = extractYoutubeId(url);
    if (!videoId) {
      alert('올바른 유튜브 URL 또는 영상 ID를 입력해주세요.');
      return;
    }
    
    setIsFetching(true);
    try {
      const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
      const data = await response.json();
      
      if (data.title) {
        setFormData(prev => ({
          ...prev,
          title: data.title,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`
        }));
      } else {
        alert('영상 정보를 가져오지 못했습니다. URL을 다시 확인해주세요.');
      }
    } catch (e) {
      console.error("Failed to fetch youtube data", e);
      alert('영상 정보를 가져오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleCreate = async () => {
    await createShort({
      title: formData.title,
      length: formData.length,
      tag: formData.tag,
      videoUrl: formData.videoUrl,
      thumbnail: formData.thumbnail,
      order: (shorts?.length || 0) + 1
    });
    setIsAdding(false);
    resetForm();
  };

  const handleUpdate = async (id: Id<"shorts">) => {
    await updateShort({
      id,
      title: formData.title,
      length: formData.length,
      tag: formData.tag,
      videoUrl: formData.videoUrl,
      thumbnail: formData.thumbnail,
      order: formData.order
    });
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      length: '',
      tag: '',
      videoUrl: '',
      thumbnail: '',
      order: 0
    });
  };

  const startEditing = (short: any) => {
    setEditingId(short._id);
    setFormData({
      title: short.title || '',
      length: short.length || '',
      tag: short.tag || '',
      videoUrl: short.videoUrl || '',
      thumbnail: short.thumbnail || '',
      order: short.order || 0
    });
  };

  const onDragStart = (index: number) => setDraggedItemIndex(index);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = async (index: number) => {
    if (draggedItemIndex === null || draggedItemIndex === index || !shorts) return;
    
    const updatedShorts = [...shorts];
    const itemToMove = updatedShorts[draggedItemIndex];
    updatedShorts.splice(draggedItemIndex, 1);
    updatedShorts.splice(index, 0, itemToMove);
    
    // Update order in database for all affected items
    updatedShorts.forEach((short, idx) => {
      if (short.order !== idx + 1) {
        updateShort({ id: short._id, order: idx + 1 });
      }
    });
    
    setDraggedItemIndex(null);
  };

  const getYoutubeEmbedUrl = (url: string) => {
    const videoId = extractYoutubeId(url);
    // Added modestbranding and other params for a cleaner preview
    return videoId ? `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&iv_load_policy=3` : null;
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-[18px] font-bold text-[#191F28]">랜딩 페이지 쇼츠(영상) 관리</h3>
          <p className="text-[13px] text-[#8B95A1] mt-1">영상을 드래그하여 노출 순서를 변경할 수 있습니다.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-[#3182F6] text-white px-4 py-2 rounded-[10px] text-[14px] font-bold flex items-center gap-1 shadow-sm hover:bg-[#1B64DA] transition-colors"
          >
            <Plus className="w-4 h-4"/> 영상 추가
          </button>
        )}
      </div>

      <div className="space-y-4">
        {isAdding && (
          <div className="bg-[#F2F8FF] p-6 rounded-[24px] border border-[#3182F6]/20 space-y-5">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-[#3182F6]">새 영상 추가</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#4E5968] mb-1">유튜브 URL</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={formData.videoUrl}
                      onChange={e => setFormData({...formData, videoUrl: e.target.value})}
                      className="flex-1 bg-white border border-[#D1D6DB] px-4 py-2 rounded-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3182F6]"
                      placeholder="유튜브 영상 주소를 입력하세요"
                    />
                    <button 
                      onClick={() => handleUrlFetch(formData.videoUrl)}
                      disabled={isFetching || !formData.videoUrl}
                      className="bg-[#191F28] text-white px-3 py-2 rounded-[10px] text-[13px] font-bold disabled:opacity-50 flex items-center gap-1"
                    >
                      {isFetching ? <RefreshCw className="w-4 h-4 animate-spin"/> : '정보 불러오기'}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-[12px] font-bold text-[#4E5968] mb-1">제목 (줄바꿈은 \n 사용)</label>
                  <textarea 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-white border border-[#D1D6DB] px-4 py-2 rounded-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3182F6] min-h-[80px]"
                    placeholder="영상 제목을 자유롭게 수정하세요"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-[#4E5968] mb-1">라벨 (태그)</label>
                    <input 
                      type="text" 
                      value={formData.tag}
                      onChange={e => setFormData({...formData, tag: e.target.value})}
                      className="w-full bg-white border border-[#D1D6DB] px-4 py-2 rounded-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3182F6]"
                      placeholder="예: 필수 시청, 팩트 체크"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#4E5968] mb-1">영상 길이</label>
                    <input 
                      type="text" 
                      value={formData.length}
                      onChange={e => setFormData({...formData, length: e.target.value})}
                      className="w-full bg-white border border-[#D1D6DB] px-4 py-2 rounded-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3182F6]"
                      placeholder="예: 0:58"
                    />
                  </div>
                </div>
              </div>
              
              {/* Right Column: Preview */}
              <div>
                <label className="block text-[12px] font-bold text-[#4E5968] mb-1">미리보기</label>
                <div className="w-full aspect-video bg-black rounded-[12px] overflow-hidden flex items-center justify-center relative border border-[#E5E8EB]">
                  {getYoutubeEmbedUrl(formData.videoUrl) ? (
                    <iframe 
                      src={getYoutubeEmbedUrl(formData.videoUrl)!}
                      className="w-full h-full"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="text-[#8B95A1] text-[13px] flex flex-col items-center gap-2">
                      <Play className="w-8 h-8 opacity-50" />
                      URL을 입력하면 미리보기가 표시됩니다
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-2 border-t border-[#3182F6]/10 mt-4">
              <button onClick={() => { setIsAdding(false); resetForm(); }} className="px-4 py-2 text-[14px] font-bold text-[#4E5968] hover:bg-[#E8F3FF] rounded-[8px] transition-colors">취소</button>
              <button onClick={handleCreate} disabled={!formData.videoUrl} className="bg-[#3182F6] text-white px-6 py-2 rounded-[10px] text-[14px] font-bold shadow-md disabled:opacity-50">저장하기</button>
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {shorts?.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((short: any, index: number) => (
            <div 
              key={short._id} 
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(index)}
              className={`flex items-start gap-4 p-4 rounded-[20px] border transition-all cursor-move ${editingId === short._id ? 'border-[#3182F6] bg-[#F2F8FF]' : 'border-[#E5E8EB] bg-white hover:bg-[#F9FAFB]'} ${draggedItemIndex === index ? 'opacity-40' : ''}`}
            >
              <div className="pt-2"><MoveVertical className="w-5 h-5 text-[#D1D6DB] shrink-0 cursor-grab"/></div>
              
              {editingId === short._id ? (
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={formData.videoUrl}
                          onChange={e => setFormData({...formData, videoUrl: e.target.value})}
                          className="flex-1 bg-white border border-[#D1D6DB] px-3 py-1.5 rounded-[8px] text-[13px] focus:ring-1 focus:ring-[#3182F6] outline-none"
                          placeholder="유튜브 URL"
                        />
                        <button onClick={() => handleUrlFetch(formData.videoUrl)} className="bg-[#191F28] text-white px-3 rounded-[8px] text-[12px] font-bold">
                          정보 갱신
                        </button>
                      </div>
                      <textarea 
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-white border border-[#D1D6DB] px-3 py-1.5 rounded-[8px] text-[13px] font-bold focus:ring-1 focus:ring-[#3182F6] outline-none min-h-[60px]"
                        placeholder="제목"
                      />
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={formData.tag}
                          onChange={e => setFormData({...formData, tag: e.target.value})}
                          className="flex-1 bg-white border border-[#D1D6DB] px-3 py-1.5 rounded-[8px] text-[13px] outline-none focus:ring-1 focus:ring-[#3182F6]"
                          placeholder="라벨 (태그)"
                        />
                        <input 
                          type="text" 
                          value={formData.length}
                          onChange={e => setFormData({...formData, length: e.target.value})}
                          className="w-[100px] bg-white border border-[#D1D6DB] px-3 py-1.5 rounded-[8px] text-[13px] outline-none focus:ring-1 focus:ring-[#3182F6]"
                          placeholder="길이 (예: 1:23)"
                        />
                      </div>
                    </div>
                    
                    <div className="w-full aspect-video bg-black rounded-[12px] overflow-hidden border border-[#E5E8EB]">
                      {getYoutubeEmbedUrl(formData.videoUrl) ? (
                        <iframe 
                          src={getYoutubeEmbedUrl(formData.videoUrl)!}
                          className="w-full h-full"
                          allowFullScreen
                        ></iframe>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#8B95A1] text-[11px]">미리보기 없음</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E8EB]">
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-[#4E5968] text-[13px] font-bold bg-[#E5E8EB] rounded-[8px]">취소</button>
                    <button onClick={() => handleUpdate(short._id)} className="px-4 py-1.5 bg-[#3182F6] text-white font-bold text-[13px] rounded-[8px]">완료</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-[80px] h-[142px] bg-[#191F28] rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden relative border border-[#E5E8EB]">
                    {(() => {
                      const videoId = extractYoutubeId(short.videoUrl);
                      const thumbUrl = short.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);
                      
                      return thumbUrl ? (
                        <img 
                          src={thumbUrl} 
                          alt="thumbnail" 
                          className="absolute inset-0 w-full h-full object-cover opacity-80"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : null;
                    })()}
                    <div className="absolute inset-0 bg-black/20"></div>
                    <Play className="w-6 h-6 text-white drop-shadow-md relative z-10" fill="currentColor"/>
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-bold text-[#3182F6] bg-[#E8F3FF] px-2 py-0.5 rounded-[6px]">{short.tag || '라벨 없음'}</span>
                      <span className="text-[12px] font-medium text-[#8B95A1]">{short.length}</span>
                    </div>
                    <h4 className="font-bold text-[15px] text-[#191F28] whitespace-pre-line leading-relaxed">{short.title}</h4>
                    <p className="text-[12px] text-[#8B95A1] mt-2 truncate">{short.videoUrl}</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => startEditing(short)} className="p-2 text-[#4E5968] hover:bg-[#F2F4F6] rounded-lg transition-colors"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={() => { if(window.confirm('정말 삭제하시겠습니까?')) removeShort({ id: short._id }) }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </>
              )}
            </div>
          ))}
          {shorts?.length === 0 && !isAdding && (
            <div className="text-center py-16 bg-[#F9FAFB] rounded-[24px] border-2 border-dashed border-[#E5E8EB]">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Play className="w-6 h-6 text-[#D1D6DB] ml-1" />
              </div>
              <p className="text-[#191F28] font-bold mb-1">등록된 영상이 없습니다</p>
              <p className="text-[#8B95A1] text-[13px]">우측 상단의 '영상 추가' 버튼을 눌러 유튜브 영상을 등록해보세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

