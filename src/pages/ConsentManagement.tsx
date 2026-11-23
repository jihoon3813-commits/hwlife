import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  ShieldCheck,
  Send,
  FileCheck,
  Search,
  Download,
  Eye,
  Smartphone,
  X,
  CheckCircle2,
  Loader2,
  Users,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatPhoneNumber } from '../utils/phone';

export default function ConsentManagement({ channelId }: { channelId?: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | '서명완료' | '발송완료' | '미발송'>('all');
  const [previewCustomer, setPreviewCustomer] = useState<any | null>(null);
  const [downloadCustomer, setDownloadCustomer] = useState<any | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  const channels = useQuery(api.channels.get) || [];

  const subChannelIds = useQuery(
    api.channels.getSubChannelIds,
    channelId ? { subdomain: channelId } : 'skip'
  );

  const inquiries =
    useQuery(
      api.inquiries.list,
      channelId ? (subChannelIds ? { channelIds: subChannelIds } : 'skip') : {}
    ) || [];

  const updateInquiry = useMutation(api.inquiries.update);
  const sendConsentSms = useAction(api.sms.sendConsentSms);
  const settings = useQuery(api.settings.get);
  const smsConfig = (settings as any)?.sms;

  const handleSendConsent = async (customer: any) => {
    const isSmsReady =
      smsConfig?.provider === 'phone_bridge'
        ? Boolean(smsConfig?.bridgeSecret)
        : Boolean(smsConfig?.apiKey && smsConfig?.userId && smsConfig?.sender);
    if (!isSmsReady) {
      alert('SMS 설정이 완료되지 않았습니다.\n환경설정 > 문자(SMS) 연동 설정을 먼저 확인해주세요.');
      return;
    }

    const isLiving =
      customer.productName?.includes('리빙') ||
      customer.productName?.toLowerCase().includes('living') ||
      customer.productName?.includes('신한카드');
    const isSpecial =
      customer.productName?.includes('스페셜') ||
      customer.productName?.toLowerCase().includes('special');

    if (!isLiving || isSpecial) {
      alert('구매동의서 문자는 리빙144(신한카드) 상품 가입 고객에게만 발송 가능합니다.');
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
          },
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

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

        pdf.save(
          `구매동의서_${customer.name}_${customer.purchaseConsentDate?.split(' ')[0] || new Date().toISOString().split('T')[0]}.pdf`
        );
      } catch (e) {
        console.error(e);
        alert('PDF 다운로드 중 오류가 발생했습니다.');
      } finally {
        setIsDownloading(null);
        setDownloadCustomer(null);
      }
    }, 1000);
  };

  // All eligible Living 144 inquiries
  const allLivingInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      const isSpecial =
        inq.productName?.includes('스페셜') ||
        inq.productName?.toLowerCase().includes('special');
      if (isSpecial) return false;
      const isLiving =
        inq.productName?.includes('리빙') ||
        inq.productName?.toLowerCase().includes('living') ||
        inq.productName?.includes('신한카드');
      return Boolean(isLiving);
    });
  }, [inquiries]);

  const counts = useMemo(() => {
    const signed = allLivingInquiries.filter((i) => i.consentStatus === '서명완료').length;
    const sent = allLivingInquiries.filter((i) => i.consentStatus === '발송완료').length;
    const unsent = allLivingInquiries.length - signed - sent;
    return {
      total: allLivingInquiries.length,
      signed,
      sent,
      unsent,
    };
  }, [allLivingInquiries]);

  const livingInquiries = useMemo(() => {
    return allLivingInquiries.filter((inq) => {
      const normalizedStatus = inq.consentStatus || '미발송';
      if (statusTab !== 'all' && normalizedStatus !== statusTab) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          inq.name?.toLowerCase().includes(q) || inq.phone?.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [allLivingInquiries, statusTab, searchQuery]);

  const getChannelName = (id?: string) => {
    if (!id || id === '본사' || id === 'default') return '본사';
    return channels.find((c) => c.subdomain === id)?.channelName || id;
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case '서명완료':
        return (
          <span className="adm-pill green">
            <FileCheck className="w-3.5 h-3.5" /> 서명완료
          </span>
        );
      case '발송완료':
        return (
          <span className="adm-pill blue">
            <Send className="w-3.5 h-3.5" /> 발송완료
          </span>
        );
      default:
        return (
          <span className="adm-pill gray">
            <Smartphone className="w-3.5 h-3.5" /> 미발송
          </span>
        );
    }
  };

  return (
    <div>
      {/* Page Heading */}
      <div className="adm-page-heading">
        <div>
          <div className="adm-eyebrow">SHINHAN 48 · ELECTRONIC CONSENT</div>
          <h1>구매동의 관리</h1>
          <p>
            리빙144(신한카드) 결합상품 가입 고객의 모바일 구매동의서 발송, 서명 일시 및 PDF 원본 문서를 관리합니다.
          </p>
        </div>
        <div className="adm-heading-buttons">
          <span className="adm-pill green">대상 고객 {counts.total}명</span>
        </div>
      </div>

      {/* 4-Column Metric Cards */}
      <div className="adm-metrics-grid">
        <div className="adm-metric">
          <div className="adm-metric-head">
            <span>리빙144 전체 대상</span>
            <div className="adm-metric-icon">
              <Users />
            </div>
          </div>
          <div className="adm-metric-value">
            {counts.total.toLocaleString()}
            <span>명</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">신한카드 결합</span>
            <span>동의서 관리 대상</span>
          </div>
        </div>

        <div className="adm-metric">
          <div className="adm-metric-head">
            <span>전자서명 완료</span>
            <div className="adm-metric-icon">
              <FileCheck />
            </div>
          </div>
          <div className="adm-metric-value">
            {counts.signed.toLocaleString()}
            <span>건</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend">PDF 보관중</span>
            <span>즉시 다운로드 가능</span>
          </div>
        </div>

        <div className="adm-metric">
          <div className="adm-metric-head">
            <span>문자 발송 완료 (서명대기)</span>
            <div className="adm-metric-icon">
              <Send />
            </div>
          </div>
          <div className="adm-metric-value">
            {counts.sent.toLocaleString()}
            <span>건</span>
          </div>
          <div className="adm-metric-foot">
            <span className="adm-metric-trend warning">서명 대기중</span>
            <span>재발송 가능</span>
          </div>
        </div>

        <div className="adm-metric">
          <div className="adm-metric-head">
            <span>동의서 미발송</span>
            <div className="adm-metric-icon">
              <Clock />
            </div>
          </div>
          <div className="adm-metric-value">
            {counts.unsent.toLocaleString()}
            <span>건</span>
          </div>
          <div className="adm-metric-foot">
            <span className={`adm-metric-trend ${counts.unsent > 0 ? 'warning' : ''}`}>
              {counts.unsent > 0 ? '발송 필요' : '전건 발송됨'}
            </span>
            <span>알리고 SMS 연동</span>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="adm-section-note mb-5">
        <ShieldCheck />
        <div>
          <strong className="text-[#263d36] mr-2">구매동의서 운영 기준:</strong>
          리빙144(신한카드) 상품 가입 고객에게만 발송되며, 고객이 모바일 서명을 완료하면 자동으로 &apos;구매동의일&apos;이 기록되고 A4 규격 PDF 문서로 영구 보관됩니다.
        </div>
      </div>

      {/* Main Panel */}
      <div className="adm-panel">
        <div className="adm-tabs">
          {[
            { id: 'all', label: '전체 대상', count: counts.total },
            { id: '서명완료', label: '서명완료', count: counts.signed },
            { id: '발송완료', label: '발송완료 (대기)', count: counts.sent },
            { id: '미발송', label: '미발송', count: counts.unsent },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusTab(tab.id as any)}
              className={`adm-tab ${statusTab === tab.id ? 'active' : ''}`}
            >
              <span>{tab.label}</span>
              <span className="adm-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="adm-filter-bar">
          <div className="adm-search-field">
            <Search />
            <input
              type="text"
              placeholder="고객명 또는 연락처 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="adm-filter-end">
            <span>조회 결과 <b className="text-[#263d36]">{livingInquiries.length}</b>명</span>
          </div>
        </div>

        <div className="adm-table-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>접수일</th>
                <th>채널</th>
                <th>고객 정보</th>
                <th>신청상품 / 결합가전</th>
                <th>동의 상태</th>
                <th>동의 완료 일시</th>
                <th className="text-center">문서 · 발송 관리</th>
              </tr>
            </thead>
            <tbody>
              {livingInquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center !py-20 text-[#86918a]">
                    조건에 해당하는 리빙144 대상 고객이 없습니다.
                  </td>
                </tr>
              ) : (
                livingInquiries.map((customer) => (
                  <tr key={customer._id}>
                    <td className="font-mono text-[12px] text-[#6d786c]">
                      {new Date(customer.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td>
                      <span
                        className={`adm-pill ${
                          !customer.channelId || customer.channelId === '본사' ? 'gray' : 'teal'
                        }`}
                      >
                        {getChannelName(customer.channelId)}
                      </span>
                    </td>
                    <td>
                      <div className="adm-person">
                        <div className="adm-person-circle">
                          {(customer.name || '고').slice(0, 1)}
                        </div>
                        <div>
                          <strong>{customer.name}</strong>
                          <small>{formatPhoneNumber(customer.phone || '')}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold text-[#263d36]">{customer.productName}</div>
                      {customer.appliance && customer.appliance !== '-' && (
                        <div className="text-[11px] text-[#86918a] truncate max-w-[260px]">
                          {customer.appliance}
                        </div>
                      )}
                    </td>
                    <td>{getStatusBadge(customer.consentStatus)}</td>
                    <td className="font-mono text-[12px] text-[#45554e]">
                      {customer.purchaseConsentDate || '-'}
                    </td>
                    <td className="text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewCustomer(customer)}
                          className="adm-btn small"
                        >
                          <Eye />
                          <span>미리보기</span>
                        </button>

                        {customer.consentStatus === '서명완료' ? (
                          <button
                            type="button"
                            onClick={() => handleDownloadPDF(customer)}
                            disabled={isDownloading === customer._id}
                            className="adm-btn primary small"
                          >
                            {isDownloading === customer._id ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <Download />
                            )}
                            <span>PDF 다운로드</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendConsent(customer)}
                            disabled={sendingId === customer._id}
                            className={`adm-btn small ${
                              customer.consentStatus === '발송완료' ? 'sage' : 'primary'
                            }`}
                          >
                            {sendingId === customer._id ? (
                              <>
                                <Loader2 className="animate-spin" />
                                <span>발송중</span>
                              </>
                            ) : customer.consentStatus === '발송완료' ? (
                              <>
                                <Send />
                                <span>재발송</span>
                              </>
                            ) : (
                              <>
                                <Send />
                                <span>동의서 발송</span>
                              </>
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

        <div className="adm-table-foot">
          <span>전체 대상 {counts.total}명 중 {livingInquiries.length}명 표시</span>
          <span>서명 완료 건은 PDF 원본으로 즉시 저장할 수 있습니다.</span>
        </div>
      </div>

      {/* Consent Preview Modal (Simulating Customer Mobile View) */}
      <AnimatePresence>
        {previewCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewCustomer(null)}
              className="absolute inset-0 bg-[#19312b]/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative w-full max-w-[460px] h-[88vh] bg-white rounded-[18px] border border-[#e6eae3] overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="bg-white px-5 py-4 flex justify-between items-center border-b border-[#e6eae3]">
                <div>
                  <span className="text-[13.5px] font-bold text-[#263d36]">모바일 전자동의서 미리보기</span>
                  <p className="text-[11px] text-[#86918a]">{previewCustomer.name} 고객님 발송 화면</p>
                </div>
                <button
                  onClick={() => setPreviewCustomer(null)}
                  className="adm-icon-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Customer Consent Simulation */}
              <div className="flex-1 overflow-y-auto bg-white p-0">
                <div className="max-w-[430px] mx-auto min-h-full flex flex-col">
                  <div className="pt-8 pb-5 text-center bg-white">
                    <img
                      src="https://res.cloudinary.com/dfkntvpmv/image/upload/v1781672825/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_ns9erj.png"
                      alt="Hyowon Life"
                      className="h-9 mx-auto mb-5 object-contain"
                    />
                    <h2 className="text-[20px] font-black text-[#263d36] tracking-tight leading-[1.25]">
                      결합제품 구매 및 상조회비 선결제,<br />
                      이용 동의서
                    </h2>
                    <div className="w-10 h-1 bg-[#295e52] mx-auto mt-3.5 rounded-full" />
                  </div>

                  <div className="px-6 py-5 space-y-4">
                    <div className="bg-[#f8f9f5] rounded-[14px] border border-[#e6eae3] overflow-hidden">
                      <div className="divide-y divide-[#e6eae3]">
                        <div className="px-5 py-3.5 flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold text-[#295e52]">성명</span>
                          <span className="text-[15px] font-bold text-[#263d36]">{previewCustomer.name}</span>
                        </div>
                        <div className="px-5 py-3.5 flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold text-[#295e52]">연락처</span>
                          <span className="text-[15px] font-bold text-[#263d36]">{previewCustomer.phone}</span>
                        </div>
                        <div className="px-5 py-3.5 flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold text-[#295e52]">가입상품</span>
                          <span className="text-[15px] font-bold text-[#263d36]">{previewCustomer.productName}</span>
                        </div>
                        {previewCustomer.appliance && (
                          <div className="px-5 py-3.5 flex flex-col gap-0.5">
                            <span className="text-[11px] font-bold text-[#295e52]">결합가전</span>
                            <span className="text-[15px] font-bold text-[#263d36]">{previewCustomer.appliance}</span>
                          </div>
                        )}
                        <div className="px-5 py-3.5 flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold text-[#295e52]">결제금액</span>
                          <span className="text-[19px] font-black text-[#263d36] leading-tight">
                            {previewCustomer.productName?.includes('2구좌') ||
                            previewCustomer.productName?.includes('더블') ||
                            previewCustomer.productName?.toLowerCase().includes('double')
                              ? '3,360,000원'
                              : '1,680,000원'}
                          </span>
                          <span className="text-[11.5px] text-[#86918a] font-semibold">
                            {previewCustomer.productName?.includes('2구좌') ||
                            previewCustomer.productName?.includes('더블') ||
                            previewCustomer.productName?.toLowerCase().includes('double')
                              ? '(제품 288만, 상조 48만)'
                              : '(제품 144만, 상조 24만)'}
                          </span>
                        </div>
                        <div className="px-5 py-3.5 flex flex-col gap-1.5">
                          <span className="text-[11px] font-bold text-[#295e52]">비고</span>
                          <p className="text-[12.5px] text-[#45554e] leading-relaxed break-keep">
                            {previewCustomer.productName?.includes('2구좌') ||
                            previewCustomer.productName?.includes('더블') ||
                            previewCustomer.productName?.toLowerCase().includes('double')
                              ? '1~48회 상조회비 24만원x2구좌는 별도로 신한 48pay 결제가 각각 한번씩 총 두번 더 이루어집니다.'
                              : '1~48회 상조회비 24만원은 별도로 신한 48pay 결제가 한번 더 이루어집니다.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-6 bg-[#f5f6f3]">
                    <div className="mb-6">
                      <h3 className="text-[16px] font-bold text-[#263d36] mb-3.5 flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-[#295e52] rounded-full" />
                        주요 안내 사항
                      </h3>
                      <ul className="space-y-2.5">
                        {[
                          <>
                            본 내용은 리빙제품 결합상조 상품 <span className="whitespace-nowrap">&lt;리빙144(신한카드)&gt;</span> 가입과 동시에 이루어지는 결합제품 결제 내역입니다.
                          </>,
                          '구매 제품은 택배를 통해 배송되며, 제품 수령 및 포장 훼손 등의 실 사용 시에는 환불은 불가합니다.',
                          '본 결제 금액은 결합제품 대금 전액과 1~48회까지의 상조 회비(월 5,000원)를 포함한 총액입니다. (1구좌 기준)',
                          '따라서 상조회비는 자동으로 48회까지 완납으로 처리되며, 49회부터는 효원상조에서 청구합니다.',
                          '본 결제 총액은 상조상품 만기 시 효원상조로부터 전액을 환급받을 수 있으며 자세한 내용은 효원상조 해피콜 시 안내해 드립니다.',
                        ].map((item, i) => (
                          <li key={i} className="flex gap-2 text-[12.5px] text-[#45554e] leading-relaxed break-keep">
                            <CheckCircle2 className="w-4 h-4 text-[#295e52] shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white rounded-[14px] p-5 text-center border border-[#e6eae3]">
                      <p className="text-[14px] font-bold text-[#263d36] mb-6">위 사항을 확인 하였으며 이에 동의합니다.</p>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-[#edf0e7]">
                          <span className="text-[12px] font-semibold text-[#86918a]">결제일</span>
                          <span className="text-[14px] font-bold text-[#263d36]">{new Date().toLocaleDateString('ko-KR')}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-[#edf0e7]">
                          <span className="text-[12px] font-semibold text-[#86918a]">성명</span>
                          <span className="text-[14px] font-bold text-[#263d36]">{previewCustomer.name}</span>
                        </div>
                        <div className="pt-2">
                          <div className="text-[11.5px] font-semibold text-[#86918a] mb-2 text-left">서명 (인)</div>
                          <div className="aspect-[2/1] bg-[#f8f9f5] rounded-[10px] border border-dashed border-[#cbd5c6] flex items-center justify-center overflow-hidden">
                            {previewCustomer.consentFileUrl ? (
                              <img
                                src={previewCustomer.consentFileUrl}
                                alt="고객 서명"
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <span className="text-[#9ba594] text-[12px]">모바일 서명 영역</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-white px-5 py-4 border-t border-[#e6eae3] flex justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewCustomer(null)}
                  className="adm-btn primary w-full"
                >
                  미리보기 닫기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden A4 PDF Print Template (Preserved 100% for html2canvas) */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0', overflow: 'visible' }}>
        {downloadCustomer && (
          <div
            ref={pdfRef}
            data-pdf-template
            style={{ width: '210mm', height: '297mm', backgroundColor: 'white', padding: '10mm 20mm', position: 'relative' }}
            className="flex flex-col font-sans"
          >
            <div className="text-center mb-10">
              <img
                src="https://res.cloudinary.com/dfkntvpmv/image/upload/v1781672825/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_ns9erj.png"
                alt="Logo"
                className="h-10 mx-auto mb-6"
              />
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
                        {downloadCustomer.productName?.includes('2구좌') ||
                        downloadCustomer.productName?.includes('더블') ||
                        downloadCustomer.productName?.toLowerCase().includes('double')
                          ? '3,360,000원'
                          : '1,680,000원'}
                      </div>
                      <div className="text-[11px] text-[#8B95A1] font-bold">
                        {downloadCustomer.productName?.includes('2구좌') ||
                        downloadCustomer.productName?.includes('더블') ||
                        downloadCustomer.productName?.toLowerCase().includes('double')
                          ? '(제품 288만, 상조 48만)'
                          : '(제품 144만, 상조 24만)'}
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
                  '본 결제 총액은 상조상품 만기 시 효원상조로부터 전액을 환급받을 수 있으며 자세한 내용은 효원상조 해피콜 시 안내해 드립니다.',
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
                <img
                  src="https://res.cloudinary.com/dfkntvpmv/image/upload/v1781672825/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_ns9erj.png"
                  alt="Logo"
                  className="h-7 mx-auto opacity-50"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
