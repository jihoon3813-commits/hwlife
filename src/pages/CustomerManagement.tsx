import { useState, useEffect } from 'react';
import { X, Search, Filter, History, RefreshCw, Trash2, Save } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function CustomerManagement() {
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [memo, setMemo] = useState('');
  const [status, setStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local state for editing details
  const [editData, setEditData] = useState<any>({});
  
  const settings = useQuery(api.settings.get);
  const inquiries = useQuery(api.inquiries.list);
  const updateInquiry = useMutation(api.inquiries.update);
  const removeInquiry = useMutation(api.inquiries.remove);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      setEditData({
        ...selectedCustomer,
        newRegDate: selectedCustomer.newRegDate || new Date(selectedCustomer.createdAt).toISOString().split('T')[0],
        account: selectedCustomer.account || selectedCustomer.productName
      });
      setStatus(selectedCustomer.status);
      setMemo('');
    }
  }, [selectedCustomer]);

  const openPostcode = () => {
    if (!(window as any).daum || !(window as any).daum.Postcode) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    new (window as any).daum.Postcode({
      oncomplete: function(data: any) {
        setEditData((prev: any) => ({
          ...prev,
          address: data.roadAddress || data.jibunAddress
        }));
      }
    }).open();
  };

  const handleUpdate = async () => {
    if (!selectedCustomer) return;
    try {
      const updates: any = { ...editData, status };
      
      if (memo.trim()) {
        const newHistory = {
          date: new Date().toISOString().split('T')[0],
          status,
          memo: memo.trim()
        };
        updates.memoHistory = [...(selectedCustomer.memoHistory || []), newHistory];
      }
      
      await updateInquiry({ id: selectedCustomer._id, ...updates });
      alert('저장되었습니다.');
      setSelectedCustomer(null);
    } catch (e) {
      alert('오류가 발생했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    if (confirm('정말로 이 고객 정보를 삭제하시겠습니까?')) {
      await removeInquiry({ id: selectedCustomer._id });
      setSelectedCustomer(null);
    }
  };

  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    }
    if (phoneNumberLength < 11) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
    }
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!inquiries) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 text-[#3182F6] animate-spin mb-4" />
        <p className="text-[14px] font-bold text-[#4E5968]">고객 데이터를 불러오는 중...</p>
      </div>
    );
  }

  const filteredInquiries = inquiries.filter(inq => 
    inq.name.includes(searchQuery) || inq.phone.includes(searchQuery)
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[24px] font-bold">고객관리</h2>
        <div className="flex gap-2">
          <div className="bg-white border border-[#E5E8EB] rounded-[8px] flex items-center px-3 py-2">
            <Search className="w-4 h-4 text-[#8B95A1] mr-2" />
            <input 
              type="text" 
              placeholder="고객명, 연락처 검색" 
              className="text-[14px] focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="bg-white border border-[#E5E8EB] px-4 py-2 rounded-[8px] flex items-center gap-2 text-[14px] font-medium">
            <Filter className="w-4 h-4" /> 필터
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[16px] shadow-sm border border-[#E5E8EB] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#F9FAFB] border-b border-[#E5E8EB]">
            <tr>
              <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">등록일시</th>
              <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">고객명</th>
              <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">연락처</th>
              <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">신청상품</th>
              <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">진행상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E8EB]">
            {filteredInquiries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-[#8B95A1] text-[14px]">
                  등록된 고객이 없습니다.
                </td>
              </tr>
            ) : (
              filteredInquiries.map(customer => (
                <tr 
                  key={customer._id} 
                  className="hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <td className="px-6 py-4 text-[14px] text-[#4E5968]">{formatDate(customer.createdAt)}</td>
                  <td className="px-6 py-4 text-[14px] font-bold text-[#191F28]">{customer.name}</td>
                  <td className="px-6 py-4 text-[14px] text-[#4E5968]">{customer.phone}</td>
                  <td className="px-6 py-4 text-[14px] text-[#4E5968]">{customer.productName}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block text-[12px] font-bold px-2.5 py-1 rounded-full ${
                      customer.status === '대기' ? 'bg-amber-50 text-amber-600' : 'bg-[#E8F3FF] text-[#1B64DA]'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-[24px] w-full max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-[#E5E8EB] flex justify-between items-center bg-white z-10 shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="text-[20px] font-bold">상담 고객 상세정보</h3>
                <span className={`inline-block text-[12px] font-bold px-2.5 py-1 rounded-full ${
                  status === '대기' ? 'bg-amber-50 text-amber-600' : 'bg-[#E8F3FF] text-[#1B64DA]'
                }`}>
                  {status}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={handleDelete} className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors" title="삭제">
                  <Trash2 className="w-5 h-5" />
                </button>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-[#F2F4F6] rounded-full transition-colors">
                  <X className="w-6 h-6 text-[#4E5968]" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-[#F9FAFB]">
              <div className="grid grid-cols-2 gap-6">
                {/* 1. 기본 고객 정보 */}
                <section className="bg-white p-5 rounded-[16px] border border-[#E5E8EB]">
                  <h4 className="text-[15px] font-bold mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3182F6]"></span>기본 고객 정보
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">고객명</label>
                      <input type="text" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">연락처</label>
                      <input type="text" value={editData.phone || ''} onChange={e => setEditData({...editData, phone: formatPhoneNumber(e.target.value)})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">성별</label>
                      <select value={editData.gender || ''} onChange={e => setEditData({...editData, gender: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]">
                        <option value="">선택</option>
                        <option>남성</option>
                        <option>여성</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">생년월일 (6자리)</label>
                      <input type="text" value={editData.birth || ''} onChange={e => setEditData({...editData, birth: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" placeholder="YYMMDD" />
                    </div>
                    <div className="col-span-2">
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-[12px] font-medium text-[#8B95A1]">주소</label>
                        <button onClick={openPostcode} className="text-[11px] bg-[#3182F6] text-white px-2.5 py-1 rounded-[4px] font-bold hover:bg-[#1B64DA] transition-colors">주소 검색</button>
                      </div>
                      <input type="text" value={editData.address || ''} readOnly onClick={openPostcode} className="w-full bg-[#F2F4F6] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px] mb-2 cursor-pointer text-[#4E5968]" placeholder="기본 주소 (검색 버튼을 눌러주세요)" />
                      <input type="text" value={editData.detailAddress || ''} onChange={e => setEditData({...editData, detailAddress: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" placeholder="상세 주소 입력" />
                    </div>
                  </div>
                </section>

                {/* 2. 상담/계약 일정 정보 */}
                <section className="bg-white p-5 rounded-[16px] border border-[#E5E8EB]">
                  <h4 className="text-[15px] font-bold mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#BE123C]"></span>상담/계약 일정 정보
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">신규 접수일</label>
                      <input type="date" value={editData.newRegDate || ''} onChange={e => setEditData({...editData, newRegDate: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">상조 계약일</label>
                      <input type="date" value={editData.sangjoContractDate || ''} onChange={e => setEditData({...editData, sangjoContractDate: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">렌탈 계약일</label>
                      <input type="date" value={editData.rentalContractDate || ''} onChange={e => setEditData({...editData, rentalContractDate: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">청약 철회일</label>
                      <input type="date" value={editData.cancelDate || ''} onChange={e => setEditData({...editData, cancelDate: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">계약 해지일</label>
                      <input type="date" value={editData.terminationDate || ''} onChange={e => setEditData({...editData, terminationDate: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">가전 배송일</label>
                      <input type="date" value={editData.deliveryDate || ''} onChange={e => setEditData({...editData, deliveryDate: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">특이사항</label>
                      <input type="text" value={editData.note || ''} onChange={e => setEditData({...editData, note: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                    </div>
                  </div>
                </section>
              </div>

              {/* 3. 신청 상품 정보 */}
              <section className="bg-white p-5 rounded-[16px] border border-[#E5E8EB]">
                <h4 className="text-[15px] font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span>신청 상품 정보
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#F2F4F6] p-4 rounded-[12px]">
                    <span className="text-[12px] font-bold text-[#8B95A1] mb-1 block">웹사이트 신청/문의 상품</span>
                    <span className="text-[14px] font-bold text-[#191F28]">{selectedCustomer.productName}</span>
                    {selectedCustomer.message && (
                      <p className="mt-2 text-[13px] text-[#4E5968] bg-white p-2 rounded border border-[#E5E8EB]">{selectedCustomer.message}</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">구좌수/상품</label>
                      <input type="text" value={editData.account || ''} onChange={e => setEditData({...editData, account: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" placeholder="예: 더해피 450 (1구좌)" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">결합 가전명</label>
                      <input type="text" value={editData.appliance || ''} onChange={e => setEditData({...editData, appliance: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" placeholder="예: 삼성 비스포크 냉장고" />
                    </div>
                  </div>
                </div>
              </section>

              {/* 4. 상태 변경 및 메모 */}
              <section className="bg-white p-5 rounded-[16px] border border-[#E5E8EB]">
                <h4 className="text-[15px] font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#191F28]"></span>상태 변경 및 메모
                </h4>
                <div className="flex gap-3">
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-[140px] bg-white border border-[#D1D6DB] px-3 py-2 rounded-[8px] text-[13px] font-bold focus:outline-none"
                  >
                    {settings?.statuses?.filter((s: any) => s.isUsed).map((s: any) => (
                      <option key={s.name}>{s.name}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    value={memo} 
                    onChange={(e) => setMemo(e.target.value)} 
                    placeholder="변경 사유 또는 메모를 입력하세요 (선택)" 
                    className="flex-1 bg-[#F9FAFB] border border-[#E5E8EB] px-4 py-2 rounded-[8px] text-[13px] focus:outline-none"
                  />
                  <button onClick={handleUpdate} className="bg-[#3182F6] text-white px-6 py-2 rounded-[8px] font-bold text-[13px] flex items-center gap-2 hover:bg-[#1B64DA] transition-colors shadow-sm">
                    <Save className="w-4 h-4" /> 저장
                  </button>
                </div>

                {selectedCustomer.memoHistory && selectedCustomer.memoHistory.length > 0 && (
                  <div className="mt-5 border-t border-[#E5E8EB] pt-5">
                    <h5 className="text-[13px] font-bold text-[#8B95A1] mb-3 flex items-center gap-1">
                      <History className="w-4 h-4" /> 상태 변경 이력
                    </h5>
                    <div className="space-y-3 bg-[#F9FAFB] p-4 rounded-[12px] max-h-[150px] overflow-y-auto">
                      {selectedCustomer.memoHistory.map((history: any, idx: number) => (
                        <div key={idx} className="flex gap-3 text-[13px]">
                          <span className="text-[#8B95A1] shrink-0 font-medium">{history.date}</span>
                          <span className="font-bold text-[#3182F6] shrink-0 w-[60px]">{history.status}</span>
                          <span className="text-[#4E5968]">{history.memo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
