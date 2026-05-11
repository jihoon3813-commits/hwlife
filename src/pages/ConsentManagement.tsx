import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ShieldCheck, Send, FileCheck, Search, Download, Eye, RefreshCw, Smartphone } from 'lucide-react';

export default function ConsentManagement({ channelId }: { channelId?: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const inquiries = useQuery(api.inquiries.list, channelId ? { channelId } : {}) || [];
  const updateInquiry = useMutation(api.inquiries.update);

  const handleSendConsent = async (id: any) => {
    try {
      await updateInquiry({
        id,
        consentStatus: '발송완료',
        consentSentDate: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      alert('동의서 링크가 문자로 발송되었습니다.');
    } catch (e) {
      alert('발송 중 오류가 발생했습니다.');
    }
  };

  // Filter for living products only
  const livingInquiries = inquiries.filter(inq => {
    const isLiving = (inq.productName?.toLowerCase().includes('living') || inq.productName?.includes('리빙'));
    const matchesSearch = inq.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         inq.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    return isLiving && matchesSearch;
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case '서명완료':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[12px] font-bold flex items-center gap-1.5 w-fit">
          <FileCheck className="w-3.5 h-3.5" /> 서명완료
        </span>;
      case '발송완료':
        return <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[12px] font-bold flex items-center gap-1.5 w-fit">
          <Send className="w-3.5 h-3.5" /> 발송완료
        </span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-gray-50 text-gray-400 text-[12px] font-bold flex items-center gap-1.5 w-fit">
          <Smartphone className="w-3.5 h-3.5" /> 미발송
        </span>;
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-[24px] font-bold flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[#3182F6]" />
            구매동의 관리
          </h2>
          <p className="text-[#8B95A1] mt-1">신한카드 상품 가입 고객의 구매 동의서 발송 및 서명 현황을 관리합니다.</p>
        </div>

        <div className="flex gap-4">
          <div className="w-[300px] bg-white border border-[#E5E8EB] rounded-[12px] flex items-center px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-[#3182F6]/20 transition-all">
            <Search className="w-4 h-4 text-[#8B95A1] mr-3" />
            <input 
              type="text" 
              placeholder="고객명, 연락처 검색" 
              className="text-[14px] focus:outline-none w-full font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-[#E5E8EB] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#F9FAFB] border-b border-[#E5E8EB]">
            <tr>
              <th className="px-6 py-5 text-[13px] font-bold text-[#4E5968]">접수일</th>
              <th className="px-6 py-5 text-[13px] font-bold text-[#4E5968]">고객명</th>
              <th className="px-6 py-5 text-[13px] font-bold text-[#4E5968]">연락처</th>
              <th className="px-6 py-5 text-[13px] font-bold text-[#4E5968]">신청상품</th>
              <th className="px-6 py-5 text-[13px] font-bold text-[#4E5968]">진행상태</th>
              <th className="px-6 py-5 text-[13px] font-bold text-[#4E5968]">동의일시</th>
              <th className="px-6 py-5 text-[13px] font-bold text-[#4E5968] text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E8EB]">
            {livingInquiries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-32 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-10 h-10 text-[#E5E8EB] animate-spin-slow" />
                    <p className="text-[#8B95A1] text-[15px] font-medium">대상 고객이 없거나 검색 결과가 없습니다.</p>
                  </div>
                </td>
              </tr>
            ) : (
              livingInquiries.map(customer => (
                <tr key={customer._id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-6 py-5 text-[14px] text-[#4E5968] font-medium">
                    {new Date(customer.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[14px] font-bold text-[#191F28]">{customer.name}</span>
                  </td>
                  <td className="px-6 py-5 text-[14px] text-[#4E5968] font-medium">{customer.phone}</td>
                  <td className="px-6 py-5 text-[14px] text-[#4E5968] font-medium">{customer.productName}</td>
                  <td className="px-6 py-5">
                    {getStatusBadge(customer.consentStatus)}
                  </td>
                  <td className="px-6 py-5 text-[14px] text-[#4E5968] font-medium">
                    {customer.purchaseConsentDate || '-'}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center gap-2">
                      {customer.consentStatus === '서명완료' ? (
                        <>
                          <button className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E5E8EB] text-[#4E5968] text-[13px] font-bold flex items-center gap-1.5 hover:bg-[#F9FAFB] transition-all">
                            <Eye className="w-3.5 h-3.5" /> 보기
                          </button>
                          <button className="px-3 py-1.5 rounded-[8px] bg-[#191F28] text-white text-[13px] font-bold flex items-center gap-1.5 hover:bg-black transition-all">
                            <Download className="w-3.5 h-3.5" /> PDF
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => handleSendConsent(customer._id)}
                          className={`px-4 py-2 rounded-[10px] text-[13px] font-bold flex items-center gap-2 transition-all ${
                            customer.consentStatus === '발송완료' 
                            ? 'bg-[#F2F4F6] text-[#8B95A1] cursor-not-allowed'
                            : 'bg-[#3182F6] text-white hover:bg-[#1B64DA] shadow-md shadow-blue-500/10'
                          }`}
                          disabled={customer.consentStatus === '발송완료'}
                        >
                          <Send className="w-3.5 h-3.5" /> 
                          {customer.consentStatus === '발송완료' ? '재발송' : '동의서 발송'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 p-6 bg-blue-50 rounded-[20px] border border-blue-100">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-[#3182F6] text-white rounded-full flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-[#191F28] mb-1">구매동의 관리 안내</h4>
            <ul className="text-[14px] text-[#4E5968] space-y-1 list-disc ml-4">
              <li>신한카드(Living) 상품 가입 고객에게만 발송 가능합니다.</li>
              <li>고객이 동의서 서명을 완료하면 시스템에 자동으로 '구매동의일'이 기록됩니다.</li>
              <li>서명 완료된 문서는 PDF 파일로 보관되며 언제든지 확인 및 다운로드가 가능합니다.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
