// Set this only to a verified number used for outgoing enrollment calls.
const enrollmentNotice = {
  outboundNumber: window.HyowonLG144?.outboundNumber || '',
  buttonLabel: '가입 절차 보기',
  template() {
    const lines = [
      '#{고객명}님, 라이프앤조이 전문상담센터입니다.',
      'LG 가전구독 × 효원상조 가입 신청을 접수했습니다.',
      '',
      '신청 모델  #{모델명}',
      '접수번호  #{접수번호}',
      '',
      '전문상담사가 신청하신 휴대폰 번호로 전화드립니다. 이 전화에서 선택하신 모델과 최종 월 구독료를 확인해 드리니 꼭 받아주세요.',
      '조건을 확인하신 후 가입 진행 여부를 결정하실 수 있습니다.'
    ];
    if (this.outboundNumber) lines.push('', '상담 전화가 오는 번호  '+this.outboundNumber);
    return lines.join('\n');
  },
  forCustomer(record) {
    const fields = {'고객명': record.customer, '모델명': record.model, '접수번호': record.receipt};
    return this.template().replace(/#\{(고객명|모델명|접수번호)\}/g, (_, key) => fields[key]);
  }
};
