import { useState } from 'react';
import { X, Search, Filter, History, RefreshCw } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function CustomerManagement() {
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [memo, setMemo] = useState('');
  const [status, setStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const settings = useQuery(api.settings.get);
  const inquiries = useQuery(api.inquiries.list);

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
              <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">문의사항</th>
              <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">진행상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E8EB]">
            {filteredInquiries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-[#8B95A1] text-[14px]">
                  등록된 고객이 없습니다.
                </td>
              </tr>
            ) : (
              filteredInquiries.map(customer => (
                <tr 
                  key={customer._id} 
                  className="hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setStatus(customer.status);
                  }}
                >
                  <td className="px-6 py-4 text-[14px] text-[#4E5968]">{formatDate(customer.createdAt)}</td>
                  <td className="px-6 py-4 text-[14px] font-bold text-[#191F28]">{customer.name}</td>
                  <td className="px-6 py-4 text-[14px] text-[#4E5968]">{customer.phone}</td>
                  <td className="px-6 py-4 text-[14px] text-[#4E5968]">{customer.productName}</td>
                  <td className="px-6 py-4 text-[14px] text-[#4E5968] truncate max-w-[200px]">{customer.message || '-'}</td>
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

      {/* Customer Detail Popup */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-[24px] w-full max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-[#E5E8EB] flex justify-between items-center bg-white z-10 shrink-0">
              <h3 className="text-[20px] font-bold">상담 신청 상세</h3>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-[#F2F4F6] rounded-full transition-colors">
                <X className="w-6 h-6 text-[#4E5968]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-[#F9FAFB]">
              <section className="bg-white p-6 rounded-[16px] border border-[#E5E8EB]">
                <h4 className="text-[16px] font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3182F6]"></span>
                  기본 정보
                </h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">고객명</label>
                    <div className="w-full bg-[#F2F4F6] px-4 py-2.5 rounded-[8px] text-[14px]">{selectedCustomer.name}</div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">연락처</label>
                    <div className="w-full bg-[#F2F4F6] px-4 py-2.5 rounded-[8px] text-[14px]">{selectedCustomer.phone}</div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">신청 상품</label>
                    <div className="w-full bg-[#F2F4F6] px-4 py-2.5 rounded-[8px] text-[14px]">{selectedCustomer.productName}</div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">신청 일시</label>
                    <div className="w-full bg-[#F2F4F6] px-4 py-2.5 rounded-[8px] text-[14px]">{formatDate(selectedCustomer.createdAt)}</div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">문의 내용</label>
                    <div className="w-full bg-[#F2F4F6] px-4 py-3 rounded-[8px] text-[14px] min-h-[100px] whitespace-pre-wrap">{selectedCustomer.message || '내용 없음'}</div>
                  </div>
                </div>
              </section>

              <section className="bg-white p-6 rounded-[16px] border border-[#E5E8EB]">
                <h4 className="text-[16px] font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BE123C]"></span>
                  진행 상태 관리
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#8B95A1] mb-1.5">상태 변경</label>
                    <select 
                      value={status} 
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-white border border-[#D1D6DB] px-4 py-2.5 rounded-[8px] text-[14px] font-bold focus:outline-none focus:ring-1 focus:ring-[#3182F6]"
                    >
                      {settings?.statuses?.filter((s: any) => s.isUsed).map((s: any) => (
                        <option key={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <button className="w-full bg-[#3182F6] text-white py-3.5 rounded-[12px] font-bold transition-colors hover:bg-[#1B64DA] shadow-lg shadow-[#3182F6]/20">
                    상태 업데이트
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
