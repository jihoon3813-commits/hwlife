import { useState, useRef } from 'react';
import { Plus, Trash2, MoveVertical, Upload as UploadIcon, ImageIcon } from 'lucide-react';

interface Competitor {
  id: number;
  name: string;
  months: number;
  type: string;
  logo?: string;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('status'); // status, competitor, category, admin, footer
  
  const [competitors, setCompetitors] = useState<Competitor[]>([
    { id: 1, name: '효원상조', months: 60, type: '자사' },
    { id: 2, name: 'BS ON', months: 60, type: '타사' },
    { id: 3, name: 'KG 이니렌탈', months: 60, type: '타사' }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadingId, setCurrentUploadingId] = useState<number | null>(null);

  const tabs = [
    { id: 'status', label: '진행상태 설정' },
    { id: 'competitor', label: '타사(렌탈/상조) 설정' },
    { id: 'category', label: '브랜드/카테고리 설정' },
    { id: 'footer', label: '푸터 정보 설정' },
    { id: 'admin', label: '관리자 계정 설정' },
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUploadingId !== null) {
      const url = URL.createObjectURL(file);
      setCompetitors(prev => prev.map(c => c.id === currentUploadingId ? { ...c, logo: url } : c));
    }
  };

  const triggerUpload = (id: number) => {
    setCurrentUploadingId(id);
    fileInputRef.current?.click();
  };

  return (
    <div className="p-8 h-full flex flex-col no-scrollbar overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[24px] font-bold">환경설정</h2>
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
              <button className="bg-[#3182F6] text-white px-4 py-2 rounded-[10px] text-[14px] font-bold flex items-center gap-1 shadow-sm">
                <Plus className="w-4 h-4"/> 상태 추가
              </button>
            </div>
            
            <div className="space-y-3">
              {['신규신청', '부재중', '상담완료', '가입완료', '보류', '취소'].map((status, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-[#F9FAFB] p-4 rounded-[16px] border border-[#E5E8EB]">
                  <MoveVertical className="w-5 h-5 text-[#D1D6DB] cursor-grab"/>
                  <input type="text" defaultValue={status} className="flex-1 bg-white border border-[#D1D6DB] px-4 py-2.5 rounded-[10px] text-[14px] font-bold focus:outline-none" />
                  <select className="bg-white border border-[#D1D6DB] px-4 py-2.5 rounded-[10px] text-[13px] font-bold focus:outline-none">
                    <option value="Y">사용함</option>
                    <option value="N">사용안함</option>
                  </select>
                  <button className="text-red-500 hover:bg-red-50 p-2 rounded-[8px]"><Trash2 className="w-5 h-5"/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'competitor' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[18px] font-bold">타사(렌탈/상조) 정보 설정</h3>
              <button className="bg-[#3182F6] text-white px-4 py-2 rounded-[10px] text-[14px] font-bold flex items-center gap-1 shadow-sm">
                <Plus className="w-4 h-4"/> 타사 추가
              </button>
            </div>
            
            <div className="space-y-4">
              {competitors.map((comp) => (
                <div key={comp.id} className="flex items-center gap-4 bg-[#F9FAFB] p-5 rounded-[20px] border border-[#E5E8EB]">
                  <div className="w-[80px] shrink-0">
                    <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${comp.type === '자사' ? 'bg-[#E8F3FF] text-[#1B64DA]' : 'bg-gray-200 text-[#4E5968]'}`}>{comp.type}</span>
                  </div>
                  <div className="w-[180px]">
                    <input type="text" placeholder="회사명" defaultValue={comp.name} className="w-full bg-white border border-[#D1D6DB] px-4 py-2.5 rounded-[10px] text-[14px] font-bold focus:outline-none" />
                  </div>
                  <div className="w-[120px] flex items-center gap-2 bg-white border border-[#D1D6DB] px-4 py-2.5 rounded-[10px] shrink-0">
                    <input type="number" defaultValue={comp.months} className="w-full text-[14px] font-bold focus:outline-none text-right" />
                    <span className="text-[13px] text-[#8B95A1] whitespace-nowrap">개월</span>
                  </div>
                  <div className="flex-1 flex gap-3 items-center">
                    <div 
                      onClick={() => triggerUpload(comp.id)}
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
                      onClick={() => triggerUpload(comp.id)}
                      className="bg-[#333D4B] text-white px-4 py-2.5 rounded-[10px] text-[12px] font-bold whitespace-nowrap active:bg-[#191F28]"
                    >
                      업로드
                    </button>
                  </div>
                  <button className="text-red-500 hover:bg-red-50 p-2.5 rounded-[10px]"><Trash2 className="w-5 h-5"/></button>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <button className="bg-[#191F28] text-white px-10 py-3.5 rounded-[16px] font-bold shadow-lg transition-transform active:scale-95">설정 저장하기</button>
            </div>
          </div>
        )}

        {activeTab === 'category' && (
          <div className="grid grid-cols-2 gap-8">
            {/* 브랜드 설정 */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[16px] font-bold">브랜드 설정</h3>
                <button className="text-[#3182F6] text-[13px] font-bold flex items-center gap-1"><Plus className="w-4 h-4"/> 추가</button>
              </div>
              <div className="space-y-2">
                {['삼성전자', 'LG전자', '바디프랜드', '코웨이', '캐리어'].map((brand, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[#F9FAFB] p-3 rounded-[12px] border border-[#E5E8EB]">
                    <MoveVertical className="w-4 h-4 text-[#D1D6DB] cursor-grab"/>
                    <input type="text" defaultValue={brand} className="flex-1 bg-white border border-[#D1D6DB] px-3 py-1.5 rounded-[8px] text-[13px] font-bold focus:outline-none" />
                    <button className="text-red-500 p-1.5"><Trash2 className="w-4 h-4"/></button>
                  </div>
                ))}
              </div>
            </div>

            {/* 카테고리 설정 */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[16px] font-bold">카테고리 설정</h3>
                <button className="text-[#3182F6] text-[13px] font-bold flex items-center gap-1"><Plus className="w-4 h-4"/> 추가</button>
              </div>
              <div className="space-y-2">
                {['TV/시청각', '냉장고/김치냉장고', '세탁기/건조기', '안마의자/건강', '기타'].map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[#F9FAFB] p-3 rounded-[12px] border border-[#E5E8EB]">
                    <MoveVertical className="w-4 h-4 text-[#D1D6DB] cursor-grab"/>
                    <input type="text" defaultValue={cat} className="flex-1 bg-white border border-[#D1D6DB] px-3 py-1.5 rounded-[8px] text-[13px] font-bold focus:outline-none" />
                    <button className="text-red-500 p-1.5"><Trash2 className="w-4 h-4"/></button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="col-span-2 mt-6 flex justify-center pt-6 border-t border-[#F2F4F6]">
              <button className="bg-[#191F28] text-white px-10 py-3.5 rounded-[16px] font-bold">설정 저장하기</button>
            </div>
          </div>
        )}

        {activeTab === 'footer' && (
          <div>
            <h3 className="text-[18px] font-bold mb-6">푸터 정보 설정</h3>
            <div className="space-y-4 max-w-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">회사명</label>
                  <input type="text" defaultValue="주식회사 효원상조" className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">대표자</label>
                  <input type="text" defaultValue="OOO" className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">사업자등록번호</label>
                <input type="text" defaultValue="000-00-00000" className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">고객센터 연락처</label>
                <input type="text" defaultValue="1588-0000" className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">안내 문구</label>
                <textarea className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[12px] text-[14px] font-bold focus:outline-none min-h-[120px]" defaultValue="가전 계약(렌탈/할부)과 상조 계약은 별도의 독립된 계약입니다..."></textarea>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-[#F2F4F6] flex justify-center">
              <button className="bg-[#3182F6] text-white px-10 py-3.5 rounded-[16px] font-bold shadow-lg shadow-[#3182F6]/20">푸터 정보 저장</button>
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
              <button className="bg-[#3182F6] text-white px-10 py-3.5 rounded-[16px] font-bold shadow-lg shadow-[#3182F6]/20">비밀번호 변경</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
