import { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Trash2, Edit, MoveVertical, Eye, EyeOff, Play, Save, X, ExternalLink } from 'lucide-react';

export default function VideoManagement() {
  const shorts = useQuery(api.shorts.get);
  const createShort = useMutation(api.shorts.create);
  const updateShort = useMutation(api.shorts.update);
  const removeShort = useMutation(api.shorts.remove);
  const toggleVisibility = useMutation(api.shorts.toggleVisibility);

  const [isEditing, setIsEditing] = useState(false);
  const [editingShort, setEditingShort] = useState<any>(null);

  const handleAdd = () => {
    setEditingShort({
      title: '',
      youtubeId: '',
      length: '0:00',
      tag: '일반',
      views: '0',
      order: (shorts?.length || 0) + 1,
      isVisible: true,
    });
    setIsEditing(true);
  };

  const handleEdit = (short: any) => {
    setEditingShort({ ...short, id: short._id });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      if (editingShort.id) {
        await updateShort({
          id: editingShort.id,
          title: editingShort.title,
          youtubeId: editingShort.youtubeId,
          length: editingShort.length,
          tag: editingShort.tag,
          views: editingShort.views,
          order: editingShort.order,
          isVisible: editingShort.isVisible,
        });
      } else {
        await createShort({
          title: editingShort.title,
          youtubeId: editingShort.youtubeId,
          length: editingShort.length,
          tag: editingShort.tag,
          views: editingShort.views,
          order: editingShort.order,
          isVisible: editingShort.isVisible,
        });
      }
      setIsEditing(false);
      setEditingShort(null);
    } catch (error) {
      console.error("Failed to save short:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: any) => {
    if (window.confirm("정말 이 영상을 삭제하시겠습니까?")) {
      await removeShort({ id });
    }
  };

  if (shorts === undefined) return <div className="p-8">로딩 중...</div>;

  return (
    <div className="p-8 h-full flex flex-col no-scrollbar overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-[24px] font-bold text-[#191F28]">영상관리</h2>
          <p className="text-[14px] text-[#8B95A1] mt-1">랜딩 페이지의 쇼츠 영상을 관리합니다.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={handleAdd}
            className="bg-[#3182F6] text-white px-5 py-3 rounded-[12px] font-bold text-[14px] flex items-center gap-2 shadow-lg shadow-[#3182F6]/20 transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> 신규 영상 등록
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white rounded-[24px] border border-[#E5E8EB] p-8 shadow-sm max-w-2xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[18px] font-bold">{editingShort.id ? '영상 수정' : '신규 영상 등록'}</h3>
            <button onClick={() => setIsEditing(false)} className="text-[#8B95A1] hover:text-[#191F28]">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">영상 제목 (줄바꿈은 \n 입력)</label>
                <textarea 
                  value={editingShort.title} 
                  onChange={(e) => setEditingShort({...editingShort, title: e.target.value})}
                  className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none min-h-[80px]"
                  placeholder="예: 가전결합상조,\n왜 오해를 받을까?"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">YouTube ID</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={editingShort.youtubeId} 
                    onChange={(e) => setEditingShort({...editingShort, youtubeId: e.target.value})}
                    className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none"
                    placeholder="예: dQw4w9WgXcQ"
                  />
                  {editingShort.youtubeId && (
                    <a 
                      href={`https://youtube.com/shorts/${editingShort.youtubeId}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3182F6] p-1 hover:bg-[#E8F3FF] rounded-md"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">태그 (배지 텍스트)</label>
                <input 
                  type="text" 
                  value={editingShort.tag} 
                  onChange={(e) => setEditingShort({...editingShort, tag: e.target.value})}
                  className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none"
                  placeholder="예: 필수 시청, 팩트 체크"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">영상 길이</label>
                <input 
                  type="text" 
                  value={editingShort.length} 
                  onChange={(e) => setEditingShort({...editingShort, length: e.target.value})}
                  className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none"
                  placeholder="예: 0:58"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">노출 조회수</label>
                <input 
                  type="text" 
                  value={editingShort.views} 
                  onChange={(e) => setEditingShort({...editingShort, views: e.target.value})}
                  className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none"
                  placeholder="예: 2.1만"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">정렬 순서</label>
                <input 
                  type="number" 
                  value={editingShort.order} 
                  onChange={(e) => setEditingShort({...editingShort, order: parseInt(e.target.value)})}
                  className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <button 
                  onClick={() => setEditingShort({...editingShort, isVisible: !editingShort.isVisible})}
                  className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-bold transition-all ${editingShort.isVisible ? 'bg-[#E8F3FF] text-[#1B64DA]' : 'bg-gray-100 text-gray-500'}`}
                >
                  {editingShort.isVisible ? <><Eye className="w-4 h-4"/> 노출 상태</> : <><EyeOff className="w-4 h-4"/> 숨김 상태</>}
                </button>
              </div>
            </div>

            <div className="pt-8 flex gap-4">
              <button onClick={() => setIsEditing(false)} className="flex-1 bg-[#F2F4F6] text-[#4E5968] font-bold py-4 rounded-[20px] transition-all hover:bg-[#E5E8EB]">취소하기</button>
              <button onClick={handleSave} className="flex-[2] bg-[#3182F6] text-white font-bold py-4 rounded-[20px] shadow-lg shadow-[#3182F6]/20 transition-transform active:scale-95 flex items-center justify-center gap-2">
                <Save className="w-5 h-5" /> 정보 저장하기
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[24px] border border-[#E5E8EB] overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E8EB]">
              <tr>
                <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968] w-12 text-center">순서</th>
                <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">제목 / 태그</th>
                <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">영상 정보</th>
                <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968] text-center">노출</th>
                <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968] text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F4F6]">
              {shorts?.map((short: any) => (
                <tr key={short._id} className="hover:bg-[#F9FAFB] transition-colors group">
                  <td className="px-6 py-6 text-[14px] text-[#8B95A1] font-medium text-center">{short.order}</td>
                  <td className="px-6 py-6">
                    <div className="text-[14px] font-bold text-[#191F28] whitespace-pre-line leading-tight mb-1">{short.title}</div>
                    <span className="inline-block px-2 py-0.5 bg-[#F2F4F6] text-[#8B95A1] text-[11px] font-bold rounded-md">{short.tag}</span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-20 aspect-[9/16] bg-[#191F28] rounded-lg overflow-hidden relative flex items-center justify-center border border-[#E5E8EB]">
                        {short.youtubeId ? (
                          <img 
                            src={`https://img.youtube.com/vi/${short.youtubeId}/0.jpg`} 
                            className="w-full h-full object-cover opacity-60" 
                            alt="thumbnail"
                          />
                        ) : (
                          <Play className="w-6 h-6 text-white/20" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="w-5 h-5 text-white/80" fill="currentColor" />
                        </div>
                        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 rounded">{short.length}</div>
                      </div>
                      <div className="text-[13px]">
                        <div className="text-[#4E5968] font-medium truncate w-32">{short.youtubeId}</div>
                        <div className="text-[#8B95A1] text-[12px] mt-0.5">조회수 {short.views}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <button 
                      onClick={() => toggleVisibility({ id: short._id, isVisible: !short.isVisible })}
                      className={`p-2 rounded-full transition-colors ${short.isVisible ? 'bg-[#E8F3FF] text-[#1B64DA]' : 'bg-gray-100 text-gray-400'}`}
                    >
                      {short.isVisible ? <Eye className="w-5 h-5"/> : <EyeOff className="w-5 h-5"/>}
                    </button>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(short)} className="p-2 hover:bg-white rounded-md text-[#4E5968]" title="수정"><Edit className="w-5 h-5"/></button>
                      <button onClick={() => handleDelete(short._id)} className="p-2 hover:bg-white rounded-md text-red-500" title="삭제"><Trash2 className="w-5 h-5"/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {shorts?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-[#8B95A1] text-[15px]">
                    등록된 영상이 없습니다. 새로운 영상을 등록해보세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
