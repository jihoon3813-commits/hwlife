import { useState } from 'react';
import { X, Search, Filter, History } from 'lucide-react';

interface Customer {
  id: string;
  regDate: string;
  name: string;
  phone: string;
  product: string;
  inquiry: string;
  status: string;
  // Detail info
  schedule: {
    newRegDate: string;
    sangjoContractDate: string;
    rentalContractDate: string;
    cancelDate: string;
    terminationDate: string;
    deliveryDate: string;
    note: string;
  };
  info: {
    gender: string;
    birth: string;
    address: string;
    detailAddress: string;
  };
  applyProduct: {
    account: string;
    appliance: string;
  };
  memoHistory: { date: string; status: string; memo: string }[];
}

const mockCustomers: Customer[] = [
  {
    id: '1',
    regDate: '2026-05-02 10:30',
    name: '홍길동',
    phone: '010-1234-5678',
    product: 'LG 디오스 오브제컬렉션 노크온',
    inquiry: '일반 렌탈과 비교해보고 싶어요',
    status: '신규신청',
    schedule: {
      newRegDate: '2026-05-02',
      sangjoContractDate: '',
      rentalContractDate: '',
      cancelDate: '',
      terminationDate: '',
      deliveryDate: '',
      note: ''
    },
    info: {
      gender: 'M',
      birth: '1980-01-01',
      address: '서울시 강남구 테헤란로',
      detailAddress: '123-45'
    },
    applyProduct: {
      account: '스페셜 299 더블',
      appliance: 'LG 디오스 오브제컬렉션 노크온'
    },
    memoHistory: [
      { date: '2026-05-02 10:30', status: '신규신청', memo: '온라인 신청 접수' }
    ]
  }
];

export default function CustomerManagement() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [memo, setMemo] = useState('');
  const [status, setStatus] = useState('');

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

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[24px] font-bold">고객관리</h2>
        <div className="flex gap-2">
          <div className="bg-white border border-[#E5E8EB] rounded-[8px] flex items-center px-3 py-2">
            <Search className="w-4 h-4 text-[#8B95A1] mr-2" />
            <input type="text" placeholder="고객명, 연락처 검색" className="text-[14px] focus:outline-none" />
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
              <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">가전제품</th>
              <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">문의사항</th>
              <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">진행상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E8EB]">
            {mockCustomers.map(customer => (
              <tr 
                key={customer.id} 
                className="hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedCustomer(customer);
                  setStatus(customer.status);
                }}
              >
                <td className="px-6 py-4 text-[14px] text-[#4E5968]">{customer.regDate}</td>
                <td className="px-6 py-4 text-[14px] font-bold text-[#191F28]">{customer.name}</td>
                <td className="px-6 py-4 text-[14px] text-[#4E5968]">{customer.phone}</td>
                <td className="px-6 py-4 text-[14px] text-[#4E5968]">{customer.product}</td>
                <td className="px-6 py-4 text-[14px] text-[#4E5968] truncate max-w-[200px]">{customer.inquiry}</td>
                <td className="px-6 py-4">
                  <span className="inline-block bg-[#E8F3FF] text-[#1B64DA] text-[12px] font-bold px-2.5 py-1 rounded-full">
                    {customer.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Detail Popup */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-[24px] w-full max-w-[1000px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-[#E5E8EB] flex justify-between items-center bg-white z-10 shrink-0">
              <h3 className="text-[20px] font-bold">고객 세부 정보</h3>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-[#F2F4F6] rounded-full transition-colors">
                <X className="w-6 h-6 text-[#4E5968]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex gap-6 bg-[#F9FAFB] no-scrollbar">
              {/* Left Column: Form Info */}
              <div className="flex-[2] space-y-6">
                
                {/* 1. 기본 고객 정보 */}
                <section className="bg-white p-6 rounded-[16px] border border-[#E5E8EB]">
                  <h4 className="text-[16px] font-bold mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3182F6]"></span>
                    기본 고객 정보
                  </h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">고객명</label>
                      <input type="text" defaultValue={selectedCustomer.name} className="w-full bg-[#F2F4F6] px-4 py-2.5 rounded-[8px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3182F6]" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">연락처</label>
                      <input 
                        type="text" 
                        defaultValue={selectedCustomer.phone} 
                        onChange={(e) => e.target.value = formatPhoneNumber(e.target.value)}
                        className="w-full bg-[#F2F4F6] px-4 py-2.5 rounded-[8px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3182F6]" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">성별</label>
                      <select defaultValue={selectedCustomer.info.gender} className="w-full bg-[#F2F4F6] px-4 py-2.5 rounded-[8px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3182F6]">
                        <option value="">선택</option>
                        <option value="M">남성</option>
                        <option value="F">여성</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">생년월일 (YYYY-MM-DD)</label>
                      <input type="text" defaultValue={selectedCustomer.info.birth} className="w-full bg-[#F2F4F6] px-4 py-2.5 rounded-[8px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3182F6]" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">주소</label>
                      <div className="flex gap-2 mb-2">
                        <input type="text" defaultValue={selectedCustomer.info.address} readOnly className="flex-1 bg-[#F2F4F6] px-4 py-2.5 rounded-[8px] text-[14px] focus:outline-none" />
                        <button 
                          onClick={() => alert('주소 검색 팝업이 구현될 예정입니다.')}
                          className="bg-[#333D4B] text-white px-4 py-2.5 rounded-[8px] text-[14px] font-bold whitespace-nowrap active:bg-[#191F28] transition-colors"
                        >
                          주소검색
                        </button>
                      </div>
                      <input type="text" defaultValue={selectedCustomer.info.detailAddress} placeholder="상세주소 입력" className="w-full bg-[#F2F4F6] px-4 py-2.5 rounded-[8px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3182F6]" />
                    </div>
                  </div>
                </section>

                {/* 2. 상담/계약 일정 정보 */}
                <section className="bg-white p-6 rounded-[16px] border border-[#E5E8EB]">
                  <h4 className="text-[16px] font-bold mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3182F6]"></span>
                    상담/계약 일정 정보
                  </h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">신규등록일</label>
                      <input type="date" defaultValue={selectedCustomer.schedule.newRegDate} className="w-full bg-[#F2F4F6] px-4 py-2.5 rounded-[8px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3182F6]" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">상조계약일</label>
                      <input type="date" defaultValue={selectedCustomer.schedule.sangjoContractDate} className="w-full bg-[#F2F4F6] px-4 py-2.5 rounded-[8px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3182F6]" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">렌탈계약일</label>
                      <input type="date" defaultValue={selectedCustomer.schedule.rentalContractDate} className="w-full bg-[#F2F4F6] px-4 py-2.5 rounded-[8px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3182F6]" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">청약철회일</label>
                      <input type="date" defaultValue={selectedCustomer.schedule.cancelDate} className="w-full bg-[#F2F4F6] px-4 py-2.5 rounded-[8px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3182F6]" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">해약처리일</label>
                      <input type="date" defaultValue={selectedCustomer.schedule.terminationDate} className="w-full bg-[#F2F4F6] px-4 py-2.5 rounded-[8px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3182F6]" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">배송완료일</label>
                      <input type="date" defaultValue={selectedCustomer.schedule.deliveryDate} className="w-full bg-[#F2F4F6] px-4 py-2.5 rounded-[8px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3182F6]" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">비고</label>
                      <textarea className="w-full bg-[#F2F4F6] px-4 py-2.5 rounded-[8px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3182F6] min-h-[80px]"></textarea>
                    </div>
                  </div>
                </section>

                {/* 3. 신청 상품 정보 */}
                <section className="bg-white p-6 rounded-[16px] border border-[#E5E8EB]">
                  <h4 className="text-[16px] font-bold mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3182F6]"></span>
                    신청 상품 정보
                  </h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">구좌 선택</label>
                      <select defaultValue={selectedCustomer.applyProduct.account} className="w-full bg-[#F2F4F6] px-4 py-2.5 rounded-[8px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3182F6]">
                        <option>스페셜 299 더블</option>
                        <option>기타 구좌</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">가전제품</label>
                      <input type="text" defaultValue={selectedCustomer.applyProduct.appliance} className="w-full bg-[#F2F4F6] px-4 py-2.5 rounded-[8px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3182F6]" />
                    </div>
                  </div>
                </section>
                
                <div className="flex justify-center gap-2 pt-4">
                  <button className="bg-[#3182F6] text-white px-10 py-3.5 rounded-[16px] font-bold shadow-lg shadow-[#3182F6]/20 transition-transform active:scale-95">저장하기</button>
                </div>
              </div>

              {/* Right Column: Status Change & History */}
              <div className="flex-1 flex flex-col gap-6">
                <section className="bg-white p-6 rounded-[16px] border border-[#E5E8EB] shrink-0">
                  <h4 className="text-[16px] font-bold mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#BE123C]"></span>
                    상태 변경 및 메모
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">진행상태</label>
                      <select 
                        value={status} 
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full bg-white border border-[#D1D6DB] px-4 py-2.5 rounded-[8px] text-[14px] font-bold focus:outline-none focus:ring-1 focus:ring-[#3182F6]"
                      >
                        <option>신규신청</option>
                        <option>부재중</option>
                        <option>상담완료</option>
                        <option>가입완료</option>
                        <option>보류</option>
                        <option>취소</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">상태 변경 메모</label>
                      <textarea 
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        placeholder="메모를 입력하세요..."
                        className="w-full bg-[#F2F4F6] px-4 py-2.5 rounded-[8px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#3182F6] min-h-[100px]"
                      ></textarea>
                    </div>
                    <button className="w-full bg-[#333D4B] text-white py-3 rounded-[8px] font-bold transition-colors hover:bg-[#191F28]">
                      상태 및 메모 등록
                    </button>
                  </div>
                </section>

                <section className="bg-white p-6 rounded-[16px] border border-[#E5E8EB] flex-1 overflow-hidden flex flex-col">
                  <h4 className="text-[16px] font-bold mb-4 flex items-center gap-2">
                    <History className="w-4 h-4 text-[#8B95A1]" />
                    상태 변경 이력
                  </h4>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
                    {selectedCustomer.memoHistory.map((history, idx) => (
                      <div key={idx} className="relative pl-4 pb-4 border-l border-[#E5E8EB] last:border-0 last:pb-0">
                        <div className="absolute w-2 h-2 bg-[#D1D6DB] rounded-full -left-[4.5px] top-1"></div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[12px] font-bold text-[#8B95A1]">{history.date}</span>
                          <span className="text-[11px] font-bold bg-[#E8F3FF] text-[#1B64DA] px-2 py-0.5 rounded-full">{history.status}</span>
                        </div>
                        <p className="text-[14px] text-[#4E5968] leading-relaxed break-keep">{history.memo}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
