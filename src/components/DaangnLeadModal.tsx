import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';

interface DaangnLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultIsLgCare?: boolean;
}

export default function DaangnLeadModal({ isOpen, onClose, defaultIsLgCare = false }: DaangnLeadModalProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL || '';
  const convexSiteUrl = convexUrl
    ? convexUrl.replace('.convex.cloud', '.convex.site')
    : 'https://<CONVEX_DEPLOYMENT>.convex.site';
  const webhookUrl = `${convexSiteUrl}/api/daangn-lead`;

  const appsScriptCode = `// 당근 리드폼 Google 스프레드시트 -> 효원 어드민 자동 전송 스크립트
const WEBHOOK_URL = "${webhookUrl}";
const DEFAULT_IS_LG_CARE = ${defaultIsLgCare ? 'true' : 'false'};

function onSheetChangeOrFormSubmit(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];

  const payload = { isLgCare: DEFAULT_IS_LG_CARE };
  headers.forEach((h, idx) => {
    const key = String(h || "").trim();
    const val = row[idx] !== undefined && row[idx] !== null ? String(row[idx]).trim() : "";
    if (!val) return;
    if (key.includes("이름") || key.includes("성함") || key.includes("고객")) payload.name = val;
    else if (key.includes("연락처") || key.includes("전화") || key.includes("휴대폰") || key.includes("번호")) payload.phone = val;
    else if (key.includes("상품") || key.includes("제품")) payload.productName = val;
    else if (key.includes("가전")) payload.appliance = val;
    else if (key.includes("주소") || key.includes("지역")) payload.address = val;
    else payload.message = (payload.message ? payload.message + " | " : "") + key + ": " + val;
  });

  if (!payload.name || !payload.phone) return;

  UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
}`;

  const copyText = async (text: string, type: 'url' | 'script') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'url') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedScript(true);
        setTimeout(() => setCopiedScript(false), 2000);
      }
    } catch {
      alert('복사에 실패했습니다. 직접 선택해서 복사해주세요.');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-[24px] w-full max-w-[680px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-[#E5E8EB] flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-full text-[12px] font-bold bg-orange-50 text-orange-600 border border-orange-200">
              당근 리드폼
            </span>
            <h3 className="text-[18px] font-bold text-[#191F28]">Google 시트 외부 연동 설정</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F2F4F6] rounded-full transition-colors">
            <X className="w-5 h-5 text-[#4E5968]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#F9FAFB]">
          <div className="bg-white p-4 rounded-[16px] border border-[#E5E8EB] space-y-2">
            <p className="text-[13px] font-bold text-[#191F28]">
              연동 계정: <span className="text-orange-600">jihoon3813@gmail.com</span>
            </p>
            <p className="text-[13px] text-[#4E5968] leading-relaxed">
              당근마켓 리드폼에서 <strong>jihoon3813@gmail.com</strong> 구글 스프레드시트로 적재되는 응답을 아래 웹훅으로 전송하면, 어드민 고객관리 목록에 <strong>당근리드폼</strong> 유입경로로 자동 등록됩니다.
            </p>
          </div>

          <div className="bg-white p-4 rounded-[16px] border border-[#E5E8EB] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-[#191F28]">1. Webhook 수신 URL (POST)</label>
              <button
                onClick={() => copyText(webhookUrl, 'url')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[12px] font-bold bg-[#F2F4F6] hover:bg-[#E5E8EB] text-[#191F28]"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#059669]" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedUrl ? '복사됨' : 'URL 복사'}
              </button>
            </div>
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[12px] font-mono text-[#4E5968]"
            />
          </div>

          <div className="bg-white p-4 rounded-[16px] border border-[#E5E8EB] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-[#191F28]">2. Google 스프레드시트 Apps Script</label>
              <button
                onClick={() => copyText(appsScriptCode, 'script')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[12px] font-bold bg-orange-500 hover:bg-orange-600 text-white"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedScript ? '복사됨' : '스크립트 복사'}
              </button>
            </div>
            <ol className="text-[12px] text-[#4E5968] space-y-1 list-decimal list-inside leading-relaxed">
              <li><strong>jihoon3813@gmail.com</strong> 구글 드라이브에서 당근 리드폼 스프레드시트를 엽니다.</li>
              <li>상단 메뉴 <strong>확장 프로그램 &gt; Apps Script</strong>를 클릭해 아래 코드를 붙여넣고 저장합니다.</li>
              <li>좌측 <strong>트리거(시계 아이콘) &gt; 트리거 추가</strong>에서 이벤트 유형을 <strong>변경 시(On change)</strong> 또는 <strong>양식 제출 시</strong>로 설정합니다.</li>
            </ol>
            <pre className="bg-[#191F28] text-[#E5E8EB] p-3.5 rounded-[12px] text-[11px] overflow-x-auto leading-relaxed max-h-[220px]">
              {appsScriptCode}
            </pre>
            <div className="flex justify-end">
              <a
                href="https://docs.google.com/spreadsheets/u/0/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-bold text-[#3182F6] hover:underline"
              >
                Google 스프레드시트 열기 <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
