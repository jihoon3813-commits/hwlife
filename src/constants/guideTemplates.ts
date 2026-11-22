export interface GuideTemplate {
  id: string;
  title: string;
  content: string;
}

export const DEFAULT_GUIDE_TEMPLATES: GuideTemplate[] = [
  {
    id: 'guide-catalog',
    title: '① 가전 목록 · 월 구독료 먼저 안내 (카톡/문자용)',
    content: `안녕하세요, {고객명}님! 라이프앤조이 × 효원상조 전문상담센터입니다.
신청해 주신 {모델명} 결합 상담 안내드립니다.

▶ LG 가전구독 10% 결합할인 모델 & 월 납입액 보기
https://hyowon-life.com/hyowon-talk/index.html#catalog

▶ 카카오톡 1:1 채팅 상담하기
https://pf.kakao.com/_dMfvX/chat

편하신 시간에 확인 후 답장 또는 010-2666-0883으로 연락 주시면 상세 조건 안내드리겠습니다!`,
  },
  {
    id: 'guide-benefit',
    title: '② 10% 결합할인 · 상조회비 5,000원 요약 안내',
    content: `{고객명}님, 라이프앤조이 전문상담센터입니다.
문의하신 {모델명} 결합 혜택을 간단히 정리해 드립니다.

• LG 가전 구독료 매월 10% 결합 할인
• 처음 48회 효원상조 회비 월 5,000원(1구좌)
• 49회 이후 계속 납입 또는 납입 유예 선택 가능

▶ 가입 절차 한눈에 보기
https://hyowon-life.com/hyowon-talk/index.html#sign

자세한 견적은 010-2666-0883 또는 카톡(https://pf.kakao.com/_dMfvX/chat)으로 편하게 문의해 주세요.`,
  },
  {
    id: 'guide-followup',
    title: '③ 통화 전 사전 안내 / 부재중 팔로업',
    content: `{고객명}님 안녕하세요, 효원상조 × LG가전구독 상담센터(010-2666-0883)입니다.
접수해 주신 {모델명} 상담 관련하여 안내드립니다.

통화가 어려우시다면 아래 카톡 채널로 편하신 통화 시간이나 궁금한 점을 남겨주시면 바로 확인해 드리겠습니다.

▶ 카톡 채널 상담하기
https://pf.kakao.com/_dMfvX/chat
▶ 자주하는 질문 보기
https://hyowon-life.com/hyowon-talk/index.html#faq`,
  },
];

export function formatGuideMessage(template: string, customerName?: string, modelName?: string): string {
  const safeName = (customerName || '고객').trim() || '고객';
  const safeModel =
    modelName && modelName !== '아직 고민 중'
      ? modelName.trim()
      : 'LG 가전구독 결합상품';
  return template
    .replaceAll('{고객명}', safeName)
    .replaceAll('{모델명}', safeModel);
}
