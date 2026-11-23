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
    <div className="adm-modal-overlay">
      <div className="adm-modal max-w-[680px]">
        <div className="adm-drawer-head">
          <div>
            <div className="flex items-center gap-2">
              <span className="adm-pill orange">당근 리드폼</span>
              <h2>Google 스프레드시트 외부 웹훅 연동</h2>
            </div>
            <p>당근마켓 광고 리드폼 응답을 워크스페이스 고객 목록으로 실시간 자동 적재합니다.</p>
          </div>
          <button type="button" onClick={onClose} className="adm-icon-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="adm-drawer-scroll space-y-5">
          <div className="adm-note-card">
            <p className="font-bold text-[#263d36] mb-1">
              연동 계정: <span className="text-[#a97f3f]">jihoon3813@gmail.com</span>
            </p>
            <p>
              당근마켓 리드폼에서 <strong>jihoon3813@gmail.com</strong> 구글 스프레드시트로 적재되는 응답을 아래 웹훅으로 전송하면, 고객관리 목록에 <strong>당근리드폼</strong> 유입경로로 자동 등록됩니다.
            </p>
          </div>

          <div className="adm-panel p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-bold text-[#263d36]">1. Webhook 수신 URL (POST)</span>
              <button
                type="button"
                onClick={() => copyText(webhookUrl, 'url')}
                className="adm-btn small"
              >
                {copiedUrl ? <Check className="text-[#295e52]" /> : <Copy />}
                <span>{copiedUrl ? '복사됨' : 'URL 복사'}</span>
              </button>
            </div>
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="adm-input w-full font-mono !bg-[#f8f9f5]"
            />
          </div>

          <div className="adm-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-bold text-[#263d36]">2. Google 스프레드시트 Apps Script</span>
              <button
                type="button"
                onClick={() => copyText(appsScriptCode, 'script')}
                className="adm-btn primary small"
              >
                {copiedScript ? <Check /> : <Copy />}
                <span>{copiedScript ? '복사됨' : '스크립트 복사'}</span>
              </button>
            </div>
            <ol className="text-[12px] text-[#45554e] space-y-1 list-decimal list-inside leading-relaxed">
              <li><strong>jihoon3813@gmail.com</strong> 구글 드라이브에서 당근 리드폼 스프레드시트를 엽니다.</li>
              <li>상단 메뉴 <strong>확장 프로그램 &gt; Apps Script</strong>를 클릭해 아래 코드를 붙여넣고 저장합니다.</li>
              <li>좌측 <strong>트리거(시계 아이콘) &gt; 트리거 추가</strong>에서 이벤트 유형을 <strong>변경 시(On change)</strong> 또는 <strong>양식 제출 시</strong>로 설정합니다.</li>
            </ol>
            <pre className="bg-[#193f39] text-[#e7eee4] p-4 rounded-[10px] text-[11px] overflow-x-auto leading-relaxed max-h-[210px] font-mono">
              {appsScriptCode}
            </pre>
            <div className="flex justify-end">
              <a
                href="https://docs.google.com/spreadsheets/u/0/"
                target="_blank"
                rel="noreferrer"
                className="adm-btn sage small"
              >
                <span>Google 스프레드시트 열기</span>
                <ExternalLink />
              </a>
            </div>
          </div>
        </div>

        <div className="adm-drawer-foot">
          <span className="adm-caption">실시간 웹훅 수신 활성화됨</span>
          <button type="button" onClick={onClose} className="adm-btn primary">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
