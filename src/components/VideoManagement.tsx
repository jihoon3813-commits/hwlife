import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Plus, Trash2, MoveVertical, Play, Edit2, RefreshCw } from 'lucide-react';
import { Id } from '../../convex/_generated/dataModel';

export default function VideoManagement() {
  const shorts = useQuery((api as any).shorts?.get);
  const createShort = useMutation((api as any).shorts?.create);
  const updateShort = useMutation((api as any).shorts?.update);
  const removeShort = useMutation((api as any).shorts?.remove);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<Id<'shorts'> | null>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    length: '',
    tag: '',
    videoUrl: '',
    thumbnail: '',
    order: 0,
  });

  const extractYoutubeId = (url: string) => {
    if (!url) return null;
    const trimmed = url.trim();
    if (trimmed.length === 11 && !trimmed.includes('/') && !trimmed.includes('.') && !trimmed.includes('?')) {
      return trimmed;
    }
    const patterns = [
      /(?:v=|\/)([0-9A-Za-z_-]{11}).*/,
      /shorts\/([0-9A-Za-z_-]{11})/,
      /embed\/([0-9A-Za-z_-]{11})/,
      /youtu.be\/([0-9A-Za-z_-]{11})/,
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
        setFormData((prev) => ({
          ...prev,
          title: data.title,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        }));
      } else {
        alert('영상 정보를 가져오지 못했습니다. URL을 다시 확인해주세요.');
      }
    } catch (e) {
      console.error('Failed to fetch youtube data', e);
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
      order: (shorts?.length || 0) + 1,
    });
    setIsAdding(false);
    resetForm();
  };

  const handleUpdate = async (id: Id<'shorts'>) => {
    await updateShort({
      id,
      title: formData.title,
      length: formData.length,
      tag: formData.tag,
      videoUrl: formData.videoUrl,
      thumbnail: formData.thumbnail,
      order: formData.order,
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
      order: 0,
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
      order: short.order || 0,
    });
  };

  const onDragStart = (index: number) => {
    setTimeout(() => {
      setDraggedItemIndex(index);
    }, 0);
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = async (index: number) => {
    if (draggedItemIndex === null || draggedItemIndex === index || !shorts) return;

    const updatedShorts = [...shorts];
    const itemToMove = updatedShorts[draggedItemIndex];
    updatedShorts.splice(draggedItemIndex, 1);
    updatedShorts.splice(index, 0, itemToMove);

    updatedShorts.forEach((short, idx) => {
      if (short.order !== idx + 1) {
        updateShort({ id: short._id, order: idx + 1 });
      }
    });

    setDraggedItemIndex(null);
  };

  const getYoutubeEmbedUrl = (url: string) => {
    const videoId = extractYoutubeId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&iv_load_policy=3` : null;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-[#edf0e7]">
        <div>
          <h3 className="text-[16px] font-bold text-[#263d36]">랜딩페이지 쇼츠(영상) 관리</h3>
          <p className="text-[12px] text-[#86918a] mt-1">영상을 드래그하여 메인 랜딩 노출 순서를 변경할 수 있습니다.</p>
        </div>
        {!isAdding && (
          <button type="button" onClick={() => setIsAdding(true)} className="adm-btn primary">
            <Plus />
            <span>영상 추가</span>
          </button>
        )}
      </div>

      {isAdding && (
        <div className="adm-note-card !bg-[#f8f9f5] space-y-4">
          <div className="adm-section-label !mt-0">
            <span>새 유튜브 영상 추가</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3.5">
              <div className="adm-field">
                <label>유튜브 URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="adm-input flex-1"
                    placeholder="유튜브 영상 주소를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => handleUrlFetch(formData.videoUrl)}
                    disabled={isFetching || !formData.videoUrl}
                    className="adm-btn sage shrink-0"
                  >
                    {isFetching ? <RefreshCw className="animate-spin" /> : <span>정보 불러오기</span>}
                  </button>
                </div>
              </div>

              <div className="adm-field">
                <label>제목 (줄바꿈 지원)</label>
                <textarea
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="adm-textarea"
                  placeholder="영상 제목 입력"
                />
              </div>

              <div className="adm-field-grid">
                <div className="adm-field">
                  <label>라벨 (태그)</label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    className="adm-input"
                    placeholder="예: 필수 시청, 팩트 체크"
                  />
                </div>
                <div className="adm-field">
                  <label>영상 길이</label>
                  <input
                    type="text"
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                    className="adm-input font-mono"
                    placeholder="예: 0:58"
                  />
                </div>
              </div>
            </div>

            <div className="adm-field">
              <label>미리보기</label>
              <div className="w-full aspect-video bg-[#193f39] rounded-[10px] overflow-hidden flex items-center justify-center relative border border-[#e6eae3]">
                {getYoutubeEmbedUrl(formData.videoUrl) ? (
                  <iframe src={getYoutubeEmbedUrl(formData.videoUrl)!} className="w-full h-full" allowFullScreen />
                ) : (
                  <div className="text-[#c1cec8] text-[12px] flex flex-col items-center gap-2">
                    <Play className="w-7 h-7 opacity-60" />
                    <span>URL을 입력하면 미리보기가 표시됩니다</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#e6eae3]">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                resetForm();
              }}
              className="adm-btn"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!formData.videoUrl}
              className="adm-btn primary"
            >
              영상 저장하기
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {shorts
          ?.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
          .map((short: any, index: number) => (
            <div
              key={short._id}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(index)}
              className={`flex items-start gap-3.5 p-4 rounded-[12px] border cursor-move transition-all ${
                editingId === short._id
                  ? 'border-[#295e52] bg-[#f8f9f5]'
                  : 'border-[#e6eae3] bg-white hover:bg-[#fbfcf8]'
              } ${draggedItemIndex === index ? 'opacity-40 border-dashed border-[#295e52]' : ''}`}
            >
              <div className="pt-2">
                <MoveVertical className="w-4 h-4 text-[#9ba594] shrink-0 cursor-grab" />
              </div>

              {editingId === short._id ? (
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.videoUrl}
                          onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                          className="adm-input flex-1"
                          placeholder="유튜브 URL"
                        />
                        <button
                          type="button"
                          onClick={() => handleUrlFetch(formData.videoUrl)}
                          className="adm-btn sage small"
                        >
                          정보 갱신
                        </button>
                      </div>
                      <textarea
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="adm-textarea !min-h-[64px]"
                        placeholder="제목"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.tag}
                          onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                          className="adm-input flex-1"
                          placeholder="라벨 (태그)"
                        />
                        <input
                          type="text"
                          value={formData.length}
                          onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                          className="adm-input w-[110px] font-mono"
                          placeholder="길이 (예: 1:23)"
                        />
                      </div>
                    </div>

                    <div className="w-full aspect-video bg-[#193f39] rounded-[10px] overflow-hidden border border-[#e6eae3]">
                      {getYoutubeEmbedUrl(formData.videoUrl) ? (
                        <iframe src={getYoutubeEmbedUrl(formData.videoUrl)!} className="w-full h-full" allowFullScreen />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#c1cec8] text-[11px]">
                          미리보기 없음
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-[#edf0e7]">
                    <button type="button" onClick={() => setEditingId(null)} className="adm-btn small">
                      취소
                    </button>
                    <button type="button" onClick={() => handleUpdate(short._id)} className="adm-btn primary small">
                      수정 완료
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-[72px] h-[126px] bg-[#193f39] rounded-[9px] flex items-center justify-center shrink-0 overflow-hidden relative border border-[#e6eae3]">
                    {(() => {
                      const videoId = extractYoutubeId(short.videoUrl);
                      const thumbUrl =
                        short.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);
                      return thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt="thumbnail"
                          className="absolute inset-0 w-full h-full object-cover opacity-85"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : null;
                    })()}
                    <div className="absolute inset-0 bg-black/20" />
                    <Play className="w-5 h-5 text-white drop-shadow-md relative z-10" fill="currentColor" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="adm-pill green">{short.tag || '라벨 없음'}</span>
                      <span className="text-[11.5px] font-mono text-[#86918a]">{short.length}</span>
                    </div>
                    <h4 className="font-bold text-[14px] text-[#263d36] whitespace-pre-line leading-snug">
                      {short.title}
                    </h4>
                    <p className="text-[11.5px] font-mono text-[#86918a] mt-1.5 truncate">{short.videoUrl}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => startEditing(short)} className="adm-icon-btn">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('정말 삭제하시겠습니까?')) removeShort({ id: short._id });
                      }}
                      className="adm-icon-btn hover:!text-[#a85042]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

        {shorts?.length === 0 && !isAdding && (
          <div className="adm-note-card text-center py-14">
            <Play className="w-6 h-6 text-[#9ba594] mx-auto mb-2" />
            <p className="font-bold text-[#263d36]">등록된 쇼츠 영상이 없습니다.</p>
            <p className="text-[12px] text-[#86918a] mt-1">우측 상단의 [영상 추가] 버튼으로 유튜브 영상을 등록해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
