import { useState } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ShieldCheck, Send, FileCheck, Search, Download, Eye, RefreshCw, Smartphone, X, CheckCircle2, Loader2, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useRef } from 'react';

export default function ConsentManagement({ channelId }: { channelId?: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [previewCustomer, setPreviewCustomer] = useState<any | null>(null);
  const [downloadCustomer, setDownloadCustomer] = useState<any | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const inquiries = useQuery(api.inquiries.list, channelId ? { channelId } : {}) || [];
  const updateInquiry = useMutation(api.inquiries.update);
  const sendConsentSms = useAction(api.sms.sendConsentSms);
  const settings = useQuery(api.settings.get);
  const smsConfig = (settings as any)?.sms;
  const allProducts = useQuery(api.products.getAllProducts) || [];
  const allPlans = useQuery(api.plans.get) || [];

  const handleSendConsent = async (customer: any) => {
    // SMS 설정 확인
    if (!smsConfig || !smsConfig.apiKey || !smsConfig.userId || !smsConfig.sender) {
      alert('SMS 설정이 완료되지 않았습니다.\n환경설정 > SMS 설정에서 알리고 API 정보를 먼저 입력해주세요.');
      return;
    }

    if (!window.confirm(`${customer.name}님에게 동의서 문자를 발송하시겠습니까?`)) return;

    setSendingId(customer._id);
    try {
      const result = await sendConsentSms({
        inquiryId: customer._id,
        customerName: customer.name,
        customerPhone: customer.phone,
        productName: customer.productName,
      });
      alert(result.message || '문자 발송이 완료되었습니다.');
    } catch (e: any) {
      alert(e.message || '발송 중 오류가 발생했습니다.');
    } finally {
      setSendingId(null);
    }
  };

  const handleDownloadPDF = async (customer: any) => {
    if (!customer || isDownloading) return;
    setIsDownloading(customer._id);
    setDownloadCustomer(customer);
    
    // Wait for template to render (increased timeout for image loading)
    setTimeout(async () => {
      try {
        const element = pdfRef.current;
        if (!element) throw new Error('PDF template not found');

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            const el = clonedDoc.querySelector('[data-pdf-template]') as HTMLElement;
            if (el) {
              el.style.position = 'relative';
              el.style.left = '0';
              el.style.top = '0';
            }
          }
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        // Handle multi-page: if content exceeds one page, split it
        if (imgHeight <= pdfHeight) {
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        } else {
          let yOffset = 0;
          let page = 0;
          while (yOffset < imgHeight) {
            if (page > 0) pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, -yOffset, imgWidth, imgHeight);
            yOffset += pdfHeight;
            page++;
          }
        }

        pdf.save(`구매동의서_${customer.name}_${customer.purchaseConsentDate?.split(' ')[0] || new Date().toISOString().split('T')[0]}.pdf`);
      } catch (e) {
        console.error(e);
        alert('PDF 다운로드 중 오류가 발생했습니다.');
      } finally {
        setIsDownloading(null);
        setDownloadCustomer(null);
      }
    }, 1000);
  };

  // Filter for living products only
  const livingInquiries = inquiries.filter(inq => {
    const isLivingByName = (inq.productName?.toLowerCase().includes('living') || inq.productName?.includes('리빙') || inq.productName?.includes('신한카드'));
    
    // Check if the productName matches any product belonging to a living plan
    let isLivingByProduct = false;
    if (!isLivingByName) {
      // Find product by name or appliance model
      const product = allProducts.find(p => 
        p.name === inq.productName || 
        inq.appliance?.includes(p.name) || 
        (p.model && inq.appliance?.includes(p.model)) ||
        (p.model && inq.productName?.includes(p.model))
      );
      
      if (product) {
        const plan = allPlans.find(pl => pl.numericId === product.planId);
        if (plan && (plan.name.includes('리빙') || plan.name.toLowerCase().includes('living') || plan.name.includes('신한카드'))) {
          isLivingByProduct = true;
        }
      }
    }

    const isLiving = isLivingByName || isLivingByProduct;
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E8EB]">
              <tr>
                <th className="px-6 py-5 text-[13px] font-bold text-[#4E5968] whitespace-nowrap">접수일</th>
                <th className="px-6 py-5 text-[13px] font-bold text-[#4E5968] whitespace-nowrap">고객명</th>
                <th className="px-6 py-5 text-[13px] font-bold text-[#4E5968] whitespace-nowrap">연락처</th>
                <th className="px-6 py-5 text-[13px] font-bold text-[#4E5968] whitespace-nowrap">신청상품</th>
                <th className="px-6 py-5 text-[13px] font-bold text-[#4E5968] whitespace-nowrap">진행상태</th>
                <th className="px-6 py-5 text-[13px] font-bold text-[#4E5968] whitespace-nowrap">동의일시</th>
                <th className="px-6 py-5 text-[13px] font-bold text-[#4E5968] text-center whitespace-nowrap">관리</th>
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
                    <td className="px-6 py-5 text-[14px] text-[#4E5968] font-medium whitespace-nowrap">
                      {new Date(customer.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-[14px] font-bold text-[#191F28]">{customer.name}</span>
                    </td>
                    <td className="px-6 py-5 text-[14px] text-[#4E5968] font-medium whitespace-nowrap">{customer.phone}</td>
                    <td className="px-6 py-5 text-[14px] text-[#4E5968] font-medium whitespace-nowrap">{customer.productName}</td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      {getStatusBadge(customer.consentStatus)}
                    </td>
                    <td className="px-6 py-5 text-[14px] text-[#4E5968] font-medium whitespace-nowrap">
                      {customer.purchaseConsentDate || '-'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => setPreviewCustomer(customer)}
                          className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E5E8EB] text-[#4E5968] text-[13px] font-bold flex items-center gap-1.5 hover:bg-[#F9FAFB] transition-all whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5" /> 미리보기
                        </button>
  
                        {customer.consentStatus === '서명완료' ? (
                          <button 
                            onClick={() => handleDownloadPDF(customer)}
                            disabled={isDownloading === customer._id}
                            className={`px-3 py-1.5 rounded-[8px] bg-[#191F28] text-white text-[13px] font-bold flex items-center gap-1.5 hover:bg-black transition-all whitespace-nowrap ${isDownloading === customer._id ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            {isDownloading === customer._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            PDF
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleSendConsent(customer)}
                            className={`px-4 py-2 rounded-[10px] text-[13px] font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                              sendingId === customer._id
                              ? 'bg-[#F2F4F6] text-[#8B95A1] cursor-wait'
                              : customer.consentStatus === '발송완료' 
                                ? 'bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]'
                                : 'bg-[#3182F6] text-white hover:bg-[#1B64DA] shadow-md shadow-blue-500/10'
                            }`}
                            disabled={sendingId === customer._id}
                          >
                            {sendingId === customer._id ? (
                              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 발송중...</>
                            ) : customer.consentStatus === '발송완료' ? (
                              <><Send className="w-3.5 h-3.5" /> 재발송</>
                            ) : (
                              <><Send className="w-3.5 h-3.5" /> 동의서 발송</>
                            )}
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
      </div>
      
      <div className="mt-6 p-6 bg-blue-50 rounded-[20px] border border-blue-100">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-[#3182F6] text-white rounded-full flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-[#191F28] mb-1">구매동의 관리 안내</h4>
            <ul className="text-[14px] text-[#4E5968] space-y-1 list-disc ml-4">
              <li>리빙144(신한카드) 상품 가입 고객에게만 발송 가능합니다.</li>
              <li>고객이 동의서 서명을 완료하면 시스템에 자동으로 '구매동의일'이 기록됩니다.</li>
              <li>서명 완료된 문서는 PDF 파일로 보관되며 언제든지 확인 및 다운로드가 가능합니다.</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Terms & Notice Section within Preview should also be checked if needed */}

      {/* Consent Preview Modal */}
      <AnimatePresence>
        {previewCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewCustomer(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[480px] h-[90vh] bg-[#F2F4F6] rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-[#E5E8EB]">
                <span className="text-[14px] font-bold text-[#191F28]">동의서 미리보기 (모바일용)</span>
                <button 
                  onClick={() => setPreviewCustomer(null)}
                  className="p-2 hover:bg-[#F2F4F6] rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-[#8B95A1]" />
                </button>
              </div>

              {/* Scrollable Content (Simulating Mobile View) */}
              <div className="flex-1 overflow-y-auto bg-white p-0">
                <div className="max-w-[430px] mx-auto min-h-full flex flex-col">
                  {/* Form Logo & Title */}
                  <div className="pt-10 pb-6 text-center bg-white">
                    <img src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778485617/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_ns2tmp.png" alt="Hyowon Life" className="h-10 mx-auto mb-6 object-contain" />
                    <h1 className="text-[22px] font-black text-[#191F28] tracking-tight leading-[1.2]">
                      결합제품 구매 및 상조회비 선결제,<br />
                      이용 동의서
                    </h1>
                    <div className="w-12 h-1 bg-[#3182F6] mx-auto mt-4 rounded-full"></div>
                  </div>

                  {/* Customer & Product Info Table */}
                  <div className="px-6 py-6 space-y-4">
                    <div className="bg-[#F9FAFB] rounded-[24px] border border-[#E5E8EB] overflow-hidden">
                      <div className="divide-y divide-[#E5E8EB]">
                        <div className="px-5 py-4 flex flex-col gap-1">
                          <span className="text-[12px] font-bold text-[#3182F6] uppercase tracking-wider">성명</span>
                          <span className="text-[16px] font-bold text-[#191F28]">{previewCustomer.name}</span>
                        </div>
                        <div className="px-5 py-4 flex flex-col gap-1">
                          <span className="text-[12px] font-bold text-[#3182F6] uppercase tracking-wider">연락처</span>
                          <span className="text-[16px] font-bold text-[#191F28]">{previewCustomer.phone}</span>
                        </div>
                        <div className="px-5 py-4 flex flex-col gap-1">
                          <span className="text-[12px] font-bold text-[#3182F6] uppercase tracking-wider">가입상품</span>
                          <span className="text-[16px] font-bold text-[#191F28]">{previewCustomer.productName}</span>
                        </div>
                        {previewCustomer.appliance && (
                          <div className="px-5 py-4 flex flex-col gap-1">
                            <span className="text-[12px] font-bold text-[#3182F6] uppercase tracking-wider">결합가전</span>
                            <span className="text-[16px] font-bold text-[#191F28]">{previewCustomer.appliance}</span>
                          </div>
                        )}
                        <div className="px-5 py-4 flex flex-col gap-0.5">
                          <span className="text-[12px] font-bold text-[#3182F6] uppercase tracking-wider mb-0.5">결제금액</span>
                          <span className="text-[20px] font-black text-[#191F28] leading-tight">
                            {(previewCustomer.productName?.includes('2구좌') || previewCustomer.productName?.includes('더블') || previewCustomer.productName?.toLowerCase().includes('double')) ? '3,360,000원' : '1,680,000원'}
                          </span>
                          <span className="text-[12px] text-[#8B95A1] font-bold">
                            {(previewCustomer.productName?.includes('2구좌') || previewCustomer.productName?.includes('더블') || previewCustomer.productName?.toLowerCase().includes('double')) ? '(제품 288만, 상조 48만)' : '(제품 144만, 상조 24만)'}
                          </span>
                        </div>
                        <div className="px-5 py-4 flex flex-col gap-2">
                          <span className="text-[12px] font-bold text-[#3182F6] uppercase tracking-wider">비고</span>
                          <p className="text-[13px] text-[#4E5968] leading-relaxed break-keep font-medium">
                            {(previewCustomer.productName?.includes('2구좌') || previewCustomer.productName?.includes('더블') || previewCustomer.productName?.toLowerCase().includes('double'))
                              ? '1~48회 상조회비 24만원x2구좌는 별도로 신한 48pay 결제가 각각 한번씩 총 두번 더 이루어집니다.'
                              : '1~48회 상조회비 24만원은 별도로 신한 48pay 결제가 한번 더 이루어집니다.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Terms & Notice Section */}
                  <div className="px-6 py-6 bg-[#F2F4F6]">
                    <div className="mb-8">
                      <h3 className="text-[18px] font-black text-[#191F28] mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-5 bg-[#3182F6] rounded-full"></div>
                        주요 안내 사항
                      </h3>
                      <ul className="space-y-3">
                        {[
                          <>본 내용은 리빙제품 결합상조 상품 <span className="whitespace-nowrap">&lt;리빙144(신한카드)&gt;</span> 가입과 동시에 이루어지는 결합제품 결제 내역입니다.</>,
                          '구매 제품은 택배를 통해 배송되며, 제품 수령 및 포장 훼손 등의 실 사용 시에는 환불은 불가합니다.',
                          '본 결제 금액은 결합제품 대금 전액과 1~48회까지의 상조 회비(월 5,000원)를 포함한 총액입니다. (1구좌 기준)',
                          '따라서 상조회비는 자동으로 48회까지 완납으로 처리되며, 49회부터는 효원상조에서 청구합니다.',
                          '본 결제 총액은 상조상품 만기 시 효원상조로부터 전액을 환급받을 수 있으며 자세한 내용은 효원상조 해피콜 시 안내해 드립니다.'
                        ].map((item, i) => (
                          <li key={i} className="flex gap-2.5 text-[13px] text-[#4E5968] leading-relaxed break-keep">
                            <CheckCircle2 className="w-4 h-4 text-[#3182F6] shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white rounded-[24px] p-6 text-center border border-[#E5E8EB] shadow-sm">
                      <p className="text-[15px] font-bold text-[#191F28] mb-8">위 사항을 확인 하였으며 이에 동의합니다.</p>
                      
                      <div className="space-y-6">
                        <div className="flex justify-between items-center py-2 border-b border-[#F2F4F6]">
                          <span className="text-[13px] font-bold text-[#8B95A1]">결제일</span>
                          <span className="text-[15px] font-bold text-[#191F28]">{new Date().toLocaleDateString('ko-KR')}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-[#F2F4F6]">
                          <span className="text-[13px] font-bold text-[#8B95A1]">성명</span>
                          <span className="text-[15px] font-bold text-[#191F28]">{previewCustomer.name}</span>
                        </div>
                        <div className="pt-4">
                          <div className="text-[12px] font-bold text-[#8B95A1] mb-2 text-left">서명 (인)</div>
                          <div className="aspect-[2/1] bg-[#F9FAFB] rounded-[16px] border border-dashed border-[#D1D6DB] flex items-center justify-center text-[#B0B8C1] text-[13px] italic">
                            모바일 서명 영역
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 mb-6 text-center">
                      <img src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778485617/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_ns2tmp.png" alt="Logo" className="h-6 mx-auto opacity-30 grayscale object-contain" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Button (Just for Preview) */}
              <div className="bg-white px-6 py-5 border-t border-[#E5E8EB]">
                <button 
                  onClick={() => setPreviewCustomer(null)}
                  className="w-full py-4 bg-[#3182F6] text-white rounded-[16px] font-bold text-[16px] shadow-lg shadow-blue-500/20"
                >
                  미리보기 닫기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden PDF Template */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0', overflow: 'visible' }}>
        {downloadCustomer && (
          <div 
            ref={pdfRef}
            data-pdf-template
            style={{ width: '210mm', height: '297mm', backgroundColor: 'white', padding: '10mm 20mm', position: 'relative' }}
            className="flex flex-col font-sans"
          >
            <div className="text-center mb-10">
              <img src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778485617/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_ns2tmp.png" alt="Logo" className="h-10 mx-auto mb-6" />
              <h1 className="text-[26px] font-black text-[#191F28] border-b-2 border-[#3182F6] pb-3 inline-block">
                결합제품 구매 및 상조회비 선결제 이용 동의서
              </h1>
            </div>

            <div className="border-2 border-[#E5E8EB] rounded-[16px] overflow-hidden mb-8">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b border-[#E5E8EB]">
                    <th className="w-1/4 bg-[#F9FAFB] p-3.5 text-left text-[14px] font-bold text-[#3182F6]">성명</th>
                    <td className="p-3.5 text-[15px] font-bold text-[#191F28]">{downloadCustomer.name}</td>
                  </tr>
                  <tr className="border-b border-[#E5E8EB]">
                    <th className="bg-[#F9FAFB] p-3.5 text-left text-[14px] font-bold text-[#3182F6]">연락처</th>
                    <td className="p-3.5 text-[15px] font-bold text-[#191F28]">{downloadCustomer.phone}</td>
                  </tr>
                  <tr className="border-b border-[#E5E8EB]">
                    <th className="bg-[#F9FAFB] p-3.5 text-left text-[14px] font-bold text-[#3182F6]">가입상품</th>
                    <td className="p-3.5 text-[15px] font-bold text-[#191F28]">{downloadCustomer.productName}</td>
                  </tr>
                  {downloadCustomer.appliance && (
                    <tr className="border-b border-[#E5E8EB]">
                      <th className="bg-[#F9FAFB] p-3.5 text-left text-[14px] font-bold text-[#3182F6]">결합가전</th>
                      <td className="p-3.5 text-[15px] font-bold text-[#191F28]">{downloadCustomer.appliance}</td>
                    </tr>
                  )}
                  <tr className="border-b border-[#E5E8EB]">
                    <th className="bg-[#F9FAFB] p-3.5 text-left text-[14px] font-bold text-[#3182F6]">결제금액</th>
                    <td className="p-3.5">
                      <div className="text-[18px] font-black text-[#191F28]">
                        {(downloadCustomer.productName?.includes('2구좌') || downloadCustomer.productName?.includes('더블') || downloadCustomer.productName?.toLowerCase().includes('double')) ? '3,360,000원' : '1,680,000원'}
                      </div>
                      <div className="text-[11px] text-[#8B95A1] font-bold">
                        {(downloadCustomer.productName?.includes('2구좌') || downloadCustomer.productName?.includes('더블') || downloadCustomer.productName?.toLowerCase().includes('double')) ? '(제품 288만, 상조 48만)' : '(제품 144만, 상조 24만)'}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th className="bg-[#F9FAFB] p-3.5 text-left text-[14px] font-bold text-[#3182F6]">동의일시</th>
                    <td className="p-3.5 text-[15px] font-bold text-[#191F28]">{downloadCustomer.purchaseConsentDate}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-[#F2F4F6] p-7 rounded-[16px] mb-8">
              <h3 className="text-[17px] font-bold text-[#191F28] mb-3">주요 안내 사항</h3>
              <ul className="space-y-2.5">
                {[
                  '본 내용은 리빙제품 결합상조 상품 <리빙144(신한카드)> 가입과 동시에 이루어지는 결합제품 결제 내역입니다.',
                  '구매 제품은 택배를 통해 배송되며, 제품 수령 및 포장 훼손 등의 실 사용 시에는 환불은 불가합니다.',
                  '본 결제 금액은 결합제품 대금 전액과 1~48회까지의 상조 회비(월 5,000원)를 포함한 총액입니다. (1구좌 기준)',
                  '따라서 상조회비는 자동으로 48회까지 완납으로 처리되며, 49회부터는 효원상조에서 청구합니다.',
                  '본 결제 총액은 상조상품 만기 시 효원상조로부터 전액을 환급받을 수 있으며 자세한 내용은 효원상조 해피콜 시 안내해 드립니다.'
                ].map((item, i) => (
                  <li key={i} className="text-[12.5px] text-[#4E5968] leading-relaxed flex gap-2">
                    <span className="shrink-0">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8 text-center border-t border-[#E5E8EB] mt-auto">
              <p className="text-[16px] font-bold text-[#191F28] mb-8">위 사항을 확인 하였으며 이에 동의합니다.</p>
              
              <div className="flex justify-center gap-24 items-center px-10">
                <div className="flex flex-col items-center">
                  <p className="text-[13px] text-[#8B95A1] font-bold mb-2">성명</p>
                  <div className="h-16 flex items-center">
                    <p className="text-[20px] font-bold text-[#191F28]">{downloadCustomer.name}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-[13px] text-[#8B95A1] font-bold mb-2">서명 (인)</p>
                  <div className="w-40 h-20 border border-[#E5E8EB] rounded-[12px] flex items-center justify-center overflow-hidden bg-white shadow-sm">
                    {downloadCustomer.consentFileUrl ? (
                      <img 
                        src={downloadCustomer.consentFileUrl} 
                        alt="Signature" 
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                      />
                    ) : (
                      <span className="text-[#B0B8C1] text-[11px] italic font-medium">서명 없음</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-12 mb-4">
                <img src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1778485617/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_ns2tmp.png" alt="Logo" className="h-7 mx-auto opacity-50" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
