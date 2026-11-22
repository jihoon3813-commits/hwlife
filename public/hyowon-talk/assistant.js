(() => {
  const el = id => document.getElementById(id);
  const area = el('assistant-body');
  const config = window.HyowonLG144 || {};
  const live = config.mode === 'live';
  const preview = config.mode === 'preview' && ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  const sentReceipts = new Set();

  function submissionURL() {
    if (preview) return '/__preview/lg144/applications';
    if (!live || !config.consentText?.trim() || !config.consentVersion?.trim() || !config.applicationEndpoint) return '';
    try {
      const url = new URL(config.applicationEndpoint, location.origin);
      return url.origin === location.origin && !url.pathname.startsWith('/__preview/') ? url.href : '';
    } catch { return ''; }
  }
  function channelURL() {
    try {
      const url = new URL(config.kakaoChannelChatURL);
      return url.origin === 'https://pf.kakao.com' && /^\/_[A-Za-z0-9]+\/chat\/?$/.test(url.pathname) ? url.href : '';
    } catch { return ''; }
  }
  function attribution() {
    let url = new URL(location.href);
    try {
      if (parent !== window && parent.location.origin === location.origin) url = new URL(parent.location.href);
    } catch { /* Standalone webview uses its own landing URL. */ }
    const values = {};
    for (const key of ['ch','utm_source','utm_medium','utm_campaign','utm_content','utm_term']) {
      const value = url.searchParams.get(key);
      if (value) values[key] = value.slice(0,180);
    }
    return values;
  }
  function reportSaved(receipt) {
    if (!live || sentReceipts.has(receipt)) return;
    sentReceipts.add(receipt);
    if (parent !== window) parent.postMessage({type:'hyowon-lg144-receipt',receipt},location.origin);
    else window.dispatchEvent(new CustomEvent('hyowon-lg144:application-saved',{detail:{receipt}}));
  }
  const fmt = n => n.toLocaleString('ko-KR')+'원';
  const formatPhone = v => {
    const d = String(v || '').replace(/\D/g, '').slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 7) return d.slice(0, 3) + '-' + d.slice(3);
    if (d.length <= 10) return d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
    return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
  };
  const clean = value => String(value ?? '').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const flat = s => s.toLowerCase().replace(/[\s·.,\-]/g,'');
  const button = (label,action,kind='') => '<button type="button" class="act '+kind+'" data-action="'+clean(action)+'">'+clean(label)+'</button>';
  const askLink = (label,action) => '<button class="assist-link back" type="button" data-action="'+clean(action)+'">'+clean(label)+'</button>';
  const groupOrder = ['냉장고','워시타워','정수기','공기청정기','세탁기','스타일러'];
  let items=[],selectedCatalogDate='',loading,selected=null,variant=-1,query='',group='',limit=9,step='',name='',phone='',question='',note='',sending=false,initialChoice='',lastReceipt=null,pendingKey='',pendingPayload='';
  const faq = [
    ['cost','매달 얼마 내나요?',['금액','얼마','월납','가격','비용','견적','납입액','부담','계산','요금']],
    ['fee','월 5,000원에 가전도 포함되나요?',['5000','5,000','5천','오천','상조회비','오천원']],
    ['after','48개월 뒤에도 납입해야 하나요?',['48','49','4년뒤','4년후','28000','2만8천','강제','쉬어','쉬어도','끝나','끝난','끝나면','납입유예','납입중지','미루','유예','구독종료','몇년','몇개월']],
    ['benefit','10% 할인은 어떤 조건인가요?',['할인','10%','혜택','10프로','결합유지']],
    ['bonus','만기축하금과 환급은 언제 받나요?',['144','환급','축하','만기','돌려','서비스사용','미사용']],
    ['cancel','중간에 해지하면 어떻게 되나요?',['해지','해약','취소','위약','철회']],
    ['card','제휴카드를 만들어야 하나요?',['카드','전월실적','연회비']],
    ['care','방문관리·자가관리 차이는 뭔가요?',['관리','방문','케어','소모품','필터','자가','정기']],
    ['install','설치일과 추가 설치비는 어떻게 확인하나요?',['설치','사다리차','배관','배송','재고','언제와','출고','공사']],
    ['existing','기존 LG 구독에도 적용되나요?',['기존','이미','구독중','이미구독','이용중','쓰고있','사용중']],
    ['sign','가입 신청 후 어떤 절차가 남나요?',['가입','신청','계약','녹취','해피콜','전화','서명','청약']],
    ['who','가전과 상조는 누구와 계약하나요?',['누구','누가','운영','라이프앤조이','각각','두계약']]
  ];
  function choice(){return selected?.options?.[variant] || null;}
  function optionLabel(o){
    const cycle=o.cycle&&o.cycle!==o.care?(/^\d+개월$/.test(o.cycle)?'관리 주기 '+o.cycle:o.cycle):'';
    return ['약정 '+o.months+'개월',o.care,cycle,o.color].filter(Boolean).join(' · ').replaceAll('고가혁_세척','세척');
  }
  function answer(id){
    const o=choice();
    const regular={
      ...productAnswers,
      card:'제휴카드는 선택입니다. 여기에서 보는 금액은 카드 할인 전 기준이에요. 카드를 이용할 경우 전월 실적·연회비·할인 적용 기간을 별도로 확인합니다.',
      care:o?'선택한 옵션은 '+optionLabel(o)+'입니다. 같은 모델이라도 방문 주기나 자가관리 선택에 따라 월요금이 달라질 수 있어요. 모델 상세의 ‘구독 조건’에서 확인된 옵션을 비교해 보세요.':'방문형은 약정된 주기에 담당자가 관리하고, 자가관리는 고객이 직접 관리하는 방식입니다. 방문 주기와 관리 범위, 소모품 제공 여부는 모델·약정에 따라 달라요. 모델을 선택하면 확인된 선택지를 보여드려요.',
    };
    if(id==='cost'){
      const appliance=o
        ? '선택하신 '+selected.model+'의 할인 적용 가전 구독료는 월 '+fmt(o.sale)+'입니다.'
        : selected
          ? '선택하신 '+selected.model+'의 목록 기준 결합 구독료는 월 '+fmt(selected.sale)+'입니다. 정확한 모델과 요금은 신청 후 전문상담사가 전화로 확인해 드려요.'
          : '결합 대상 가전을 효원상조와 동시에 신규 가입하시면 가전 구독료를 매월 10% 할인받으실 수 있어요.';
      return appliance+' 처음 4년 동안은 여기에 상조회비 월 5,000원(1구좌)을 내시면 상조 회원 자격을 유지하실 수 있어요. 48회 납입 후에는 회비를 계속 내거나 유예하실 수 있습니다.\n\n200회를 완납하고 라이프서비스 미사용 등 약관 조건을 충족해 만기 환급을 신청하시면, 만기 다음 달에 효원상조가 상조 실납입금을 돌려드리고 가전 구독료 일부를 지원하는 만기축하금 144만원을 함께 드립니다.';
    }
    return regular[id];
  }
  function body(key,heading,html){
    step=key;el('chat-title').textContent=heading;area.innerHTML=html;
    window.scrollTo(0,0);el('chat-title').focus({preventScroll:true});
  }
  function welcome(){
    const channel = channelURL();
    const kakao = channel ? '<a class="channel-action" href="'+clean(channel)+'" target="_blank" rel="noopener">카카오톡 채널에서 상담하기</a>' : '';
    body('home','카톡 상담 안내','<div class="welcome"><div class="welcome-main with-art"><img aria-hidden="true" src="assets/appliances.svg" alt=""><span class="eyelabel">LG 가전구독 × 효원상조</span><h3>어떤 가전을 찾으세요?</h3><p>모델을 고르면 가전 구독료와 상조회비를 함께 확인할 수 있어요.</p>'+button('가전 목록 보기','catalog','primary')+'</div><div class="welcome-faq"><h4>먼저 궁금한 점이 있나요?</h4>'+['cost','fee','after','sign'].map(id=>'<button data-action="ask:'+id+'">'+faq.find(f=>f[0]===id)[1]+'</button>').join('')+'</div></div><div class="assist-line">'+kakao+button('자주하는 질문','faq')+(selected?button('선택한 '+selected.model+' 보기','detail'):'')+'</div>');}
  async function loadProducts(){
    if(items.length)return;
    if(!loading)loading=fetch('catalog.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{items=data.products;selectedCatalogDate=data.asOf;if(!items.length)throw Error();}).finally(()=>{loading=null;});
    return loading;
  }
  function catalog(){
    body('catalog','가전 목록','<p role="status">가전 목록을 불러오는 중입니다.</p>');
    loadProducts().then(()=>{if(step!=='catalog')return;
      const groups=[...new Set([...groupOrder,...items.map(p=>p.category)])];
      area.innerHTML='<div class="filters"><input type="search" id="model-search" aria-label="가전 이름 또는 모델명" placeholder="가전 이름 또는 모델명 검색"><select id="group-search" aria-label="가전 분류"><option value="">전체 분류</option>'+groups.map(g=>'<option>'+clean(g)+'</option>').join('')+'</select></div><div id="result-count" role="status"></div><div class="products-grid" id="product-results"></div><div id="more-control"></div>';
      el('model-search').value=query;el('group-search').value=group;
      el('model-search').oninput=e=>{query=e.target.value;limit=9;results();};el('group-search').onchange=e=>{group=e.target.value;limit=9;results();};results();
    }).catch(()=>{if(step==='catalog')area.innerHTML='<p role="alert">상품 목록을 불러오지 못했습니다.</p>'+button('다시 불러오기','catalog');});
  }
  function photo(p,lazy=true){return '<div class="photo"><img '+(lazy?'loading="lazy" ':'')+'referrerpolicy="no-referrer" src="'+clean(p.image)+'" alt="'+clean(p.name)+'"><span hidden>'+clean(p.category)+'</span></div>';}
  function results(){const words=flat(query.trim());const matches=items.filter(p=>(!group||p.category===group)&&(!words||flat([p.category,p.name,p.model,p.spec].join(' ')).includes(words)));
    if(!group&&!words){
      const orderedGroups=[...new Set([...groupOrder,...items.map(p=>p.category)])];
      const order=new Map(orderedGroups.map((g,i)=>[g,i]));
      const seen=new Map(),rank=new Map();
      for(const p of matches){const index=seen.get(p.category)||0;rank.set(p.id,index*orderedGroups.length+order.get(p.category));seen.set(p.category,index+1);}
      matches.sort((a,b)=>rank.get(a.id)-rank.get(b.id));
    }
    el('result-count').textContent=matches.length+'개 모델'+(query?' · 검색 결과':'');
    el('product-results').innerHTML=matches.slice(0,limit).map(p=>'<button type="button" class="product-item" data-action="choose:'+p.id+'">'+photo(p)+'<span><span class="sku">'+clean(p.model)+'</span><b>'+clean(p.name)+'</b><span class="card-price">가전 월 '+fmt(p.sale)+'</span></span></button>').join('')||'<p>맞는 모델이 없습니다. 모델명의 일부나 다른 분류로 찾아보세요.</p>';
    el('more-control').innerHTML=matches.length>limit?button('모델 더 보기 ('+Math.min(limit,matches.length)+' / '+matches.length+')','more','more'):'';
  }
  function choose(p){
    if(selected?.id!==p.id){selected=p;variant=p.options?.findIndex(o=>o.base===p.base&&o.sale===p.sale)??-1;lastReceipt=null;}
    detail();
  }
  function quoteHtml(){
    const p=selected,o=choice(),sale=o?o.sale:p.sale,base=o?o.base:p.base;
    const applianceLabel=o?'할인 적용 가전 구독료':'목록 기준 결합 구독료';
    const initial=o?'<p><strong>처음 4년 월 합계 '+fmt(sale+5000)+'</strong></p>':'<p>약정과 관리 옵션별 최종 월 구독료는 전문상담사가 전화로 확인해 드립니다.</p>';
    return '<div class="chosen-rate"><p>'+applianceLabel+' <strong>월 '+fmt(sale)+'</strong> <small>기본료 '+fmt(base)+'</small></p><p>처음 4년 상조회비 · 1구좌 월 5,000원</p>'+initial+
      '<p>48회를 납입한 뒤에는 상조회비를 계속 내거나 유예하실 수 있어요.</p>'+
      '<details class="info-disclosure"><summary>49회 이후 회비와 만기 조건 보기</summary><p>납입을 이어가시면 49~200회 상조회비는 회당 28,000원이며, 200회 총납입금은 4,496,000원입니다. 유예한 회차는 남아 있고 만기도 그만큼 늦어집니다.</p><p>'+clean(productAnswers.bonus)+'</p></details></div>';
  }
  function detail(){
    if(!selected){catalog();return;}const p=selected;
    const opts=p.options?.length?'<label class="form-field">구독 조건<select id="rate-option">'+p.options.map((o,i)=>'<option value="'+i+'"'+(i===variant?' selected':'')+'>'+clean(optionLabel(o))+' · 가전 월 '+fmt(o.sale)+'</option>').join('')+'</select></label>':'';
    body('detail','모델과 납입액',askLink('가전 목록으로','catalog')+'<div class="product-detail">'+photo(p,false)+'<div><div class="model-no">'+clean(p.category)+' · '+clean(p.model)+'</div><h3>'+clean(p.name)+'</h3><p>'+clean(p.spec)+'</p></div></div>'+opts+'<div id="quote-content">'+quoteHtml()+'</div><div class="assist-line">'+button('자주하는 질문','faq')+button(p.options?.length?'이 모델로 가입 신청':'조건 확인 후 가입 신청','apply','primary')+'</div><p class="note">판매 목록 '+clean(selectedCatalogDate.replaceAll('-','.'))+' 기준'+(p.tariffDate?' · 옵션 요금표 '+clean(p.tariffDate):'')+'. 최종 요금과 설치 가능 여부는 계약 전 확인합니다.'+(p.needsCheck?' 이 항목의 정확한 모델번호도 함께 확인합니다.':'')+'</p>');
    if(opts)el('rate-option').onchange=e=>{variant=Number(e.target.value);lastReceipt=null;el('quote-content').innerHTML=quoteHtml();};
  }
  function questions(ids=[],unknown=false){const picks=ids.map(id=>faq.find(f=>f[0]===id)).filter(Boolean);
    let top=selected?'<div class="context"><b>'+clean(selected.model)+'</b>'+askLink('내 모델 보기','detail')+'</div>':'';
    body('faq','자주하는 질문',top+'<form id="question-form" class="question-box"><input id="question-input" aria-label="질문 검색" placeholder="키워드 검색 (예: 48개월, 해지, 제휴카드)" maxlength="180"><button class="act" type="submit">검색</button></form>'+
    (picks.length?picks.map(f=>'<div class="answer"><b>'+clean(f[1])+'</b><p>'+clean(answer(f[0]))+'</p>'+(['benefit','fee','existing'].includes(f[0])?button('할인 대상 가전 목록 보기','catalog'):'')+'</div>').join(''):'')+
    (unknown?'<div class="answer"><b>일치하는 자주하는 질문이 없어요.</b><p>가전을 선택해 가입 신청하시거나 카카오톡 채널로 문의해 주시면 전문상담사가 자세히 안내해 드립니다.</p></div>':'')+
    '<div class="faq-list">'+faq.map(f=>'<button data-action="ask:'+f[0]+'">'+clean(f[1])+'</button>').join('')+'</div><div class="assist-line">'+button(selected?'선택한 모델로 가입 신청':'가전 고르기',selected?'apply':'catalog','primary')+'</div>');
    el('question-form').onsubmit=e=>{e.preventDefault();question=el('question-input').value.trim();if(!question)return;const term=flat(question);const scores=faq.map(([id,,tags])=>[id,tags.reduce((n,t)=>n+(term.includes(flat(t))?1:0),0)]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]);const ids=scores.slice(0,2).map(x=>x[0]);if(ids.length===2&&ids.includes('cost')&&(ids.includes('after')||ids.includes('install')||ids.includes('bonus')))ids.splice(ids.indexOf('cost'),1);questions(ids,!ids.length);el('question-input').value=question;};
  }
  function apply(){
    if (!submissionURL()) {
      body('unavailable','가입 신청','<p role="status">현재 가입 신청을 준비 중입니다.</p>'+button('가전 목록 보기','catalog')+' '+button('자주하는 질문','faq'));
      return;
    }
    if(!selected){catalog();return;}const p=selected,o=choice();
    body('apply','가입 신청',askLink('선택 조건 다시 보기','detail')+'<h3>'+clean(p.name)+'</h3><p class="model-no">'+clean(p.model)+' · '+(o?clean(optionLabel(o)):'약정·관리 조건 확인 요청')+'</p>'+quoteHtml()+
    '<form id="application-form"><p>가입 신청 후 전문상담사의 안내 전화를 꼭 받아주세요. 전화로 모델과 최종 월 구독료를 확인해 드립니다. 이후 효원상조 모바일 청약과 LG전자 고객센터 전화 녹취 계약을 각각 진행합니다.</p>'+(preview?'<p class="note">개발용 신청서입니다. 가상의 이름과 전화번호로 테스트해 주세요. 상담 전화와 알림톡은 발송하지 않습니다.</p>':'')+
    '<label class="form-field">신청자 이름<input id="app-name" autocomplete="off" maxlength="40" placeholder="이름" required></label><label class="form-field">휴대폰 번호<input id="app-phone" type="tel" inputmode="numeric" pattern="[0-9-]*" autocomplete="tel" maxlength="13" placeholder="010-0000-0000" required></label><label class="form-field">추가 문의 (선택)<textarea id="app-note" rows="2" maxlength="300" placeholder="예: 설치 가능일이 궁금해요"></textarea></label>'+
    '<details class="info-disclosure"><summary>접수 정보 이용 안내</summary><p class="privacy-copy">'+clean(preview?'입력한 테스트 정보는 이 컴퓨터의 미리보기 서버 메모리에만 저장되며 서버를 종료하면 지워집니다.':config.consentText)+'</p></details>'+
    '<label class="agree"><input id="app-agree" type="checkbox" required><span>[필수] 가입 상담을 위한 개인정보 수집·이용에 동의하며, 가전 구독과 상조가 별도 계약임을 확인했습니다.</span></label><p id="app-error" class="error" role="alert"></p><button type="submit" class="act primary" id="send-application">가입 신청 접수하기</button></form>');
    el('app-name').value=name;el('app-phone').value=formatPhone(phone);el('app-note').value=note;
    el('app-phone').addEventListener('input',()=>{el('app-phone').value=formatPhone(el('app-phone').value);});
    el('application-form').oninput=()=>{name=el('app-name').value;phone=el('app-phone').value;note=el('app-note').value;};
    el('application-form').onsubmit=submit;
  }
  const receiptExample = Object.freeze({
    customer:'김고객', phone:'01000000000', product:'LG QNED evo AI (스탠드형)',
    model:'65QNED81BMS', receipt:'HW-EXAMPLE-001'
  });

  function receiptView(record, isExample=false, showNotice=false){
    const phoneDigits=record.phone.replace(/\D/g,'');
    const contact=phoneDigits.slice(0,3)+'-****-'+phoneDigits.slice(-4);
    const caller=enrollmentNotice.outboundNumber
      ? '<p class="caller-number">상담 전화가 오는 번호 <b>'+clean(enrollmentNotice.outboundNumber)+'</b></p>' : '';
    const summary='<dl class="application-summary">'+[
      ['선택한 가전',record.product+' · '+record.model],['전화받을 번호',contact],['접수번호',record.receipt]
    ].map(([label,value])=>'<div><dt>'+clean(label)+'</dt><dd>'+clean(value)+'</dd></div>').join('')+'</dl>';
    const message='<details class="notice-preview"'+(showNotice?' open':'')+'><summary>첫 알림톡 미리보기</summary>'+
      '<section class="notice-card" aria-label="알림톡 문안 예시"><div class="notice-head">라이프앤조이 <span>알림톡</span></div>'+
      '<h4>가입 신청 접수 안내</h4><p class="notice-text">'+clean(enrollmentNotice.forCustomer(record))+'</p>'+
      button(enrollmentNotice.buttonLabel,'ask:sign','notice-cta')+'</section></details>';
    body('done','가입 신청 완료',
      (live?'':'<p class="receipt-preview-note">'+(isExample?'화면 예시 · 가상의 신청 내역입니다.':'개발용 접수 · 실제 전화와 알림톡 발송은 진행하지 않습니다.')+'</p>')+
      '<section class="call-receipt"><div class="receipt-state"><span aria-hidden="true">✓</span> 가입 신청을 접수했습니다</div>'+
      '<h3>전문상담사의 안내 전화를<br>꼭 받아주세요.</h3><p>라이프앤조이 전문상담센터에서 신청하신 번호로 전화드립니다. 선택하신 모델과 최종 월 구독료를 확인한 뒤 가입 진행 여부를 결정하실 수 있어요.</p>'+caller+'</section>'+
      '<section class="receipt-summary"><h4>내 신청 내용</h4>'+summary+'</section>'+
      '<div class="receipt-next"><p><b>가입을 진행하시면</b><br>효원상조는 모바일 청약으로, LG 가전구독은 LG전자 고객센터의 전화 녹취로 계약합니다.</p>'+
      button(enrollmentNotice.buttonLabel,'ask:sign')+'</div>'+(live?'':message));
  }

  async function submit(event){
    event.preventDefault();if(sending)return;
    name=el('app-name').value.trim();phone=el('app-phone').value.trim();note=el('app-note').value.trim();
    if(!name||!/^01(?:0\d{8}|[16789]\d{7,8})$/.test(phone.replace(/-/g,''))){el('app-error').textContent='이름과 휴대폰 번호를 확인해 주세요.';return;}
    const submittedProduct=selected;
    const endpoint=submissionURL();
    if(!endpoint){el('app-error').textContent='현재 가입 신청을 접수할 수 없습니다.';return;}
    const data={name,phone:phone.replace(/-/g,''),note,productId:selected.id,model:selected.model,optionIndex:variant,consent:el('app-agree').checked,
      catalogDate:selectedCatalogDate,consentVersion:live?config.consentVersion:'preview',source:'lg144-kakao-guide',attribution:attribution()};
    const signature=JSON.stringify(data);if(pendingPayload!==signature){pendingPayload=signature;pendingKey=crypto.randomUUID();}
    sending=true;el('send-application').disabled=true;el('send-application').textContent='접수 중…';el('app-error').textContent='';
    try{
      const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,key:pendingKey})});
      const saved=await res.json();if(!res.ok||typeof saved.receipt!=='string'||!saved.receipt.trim())throw Error(saved.error||'접수 결과를 확인할 수 없습니다. 같은 정보로 다시 시도해 주세요.');
      lastReceipt=saved.receipt;reportSaved(saved.receipt);
      receiptView({customer:data.name,phone:data.phone,product:submittedProduct.name,model:submittedProduct.model,receipt:saved.receipt});
    }catch(error){if(el('app-error'))el('app-error').textContent=error.message||'접수에 실패했습니다. 다시 시도해 주세요.';}
    finally{sending=false;if(el('send-application')){el('send-application').disabled=false;el('send-application').textContent='가입 신청 접수하기';}}
  }
  area.addEventListener('error',e=>{if(e.target.tagName==='IMG'){e.target.hidden=true;e.target.nextElementSibling.hidden=false;}},true);
  area.addEventListener('click',e=>{const a=e.target.closest('button[data-action]');if(!a||sending)return;const action=a.dataset.action;
    if(action==='catalog')catalog();else if(action==='more'){limit+=18;results();}else if(action.startsWith('choose:'))choose(items.find(p=>p.id===action.slice(7)));else if(action==='detail')detail();else if(action==='faq')questions();else if(action.startsWith('ask:')){question=faq.find(f=>f[0]===action.slice(4))?.[1]||'';questions([action.slice(4)]);}else if(action==='apply')apply();else if(action==='savenote'){note=[note,question].filter(Boolean).join(' / ').slice(0,300);if(selected)apply();else{catalog();}}
  });
  el('consult-home').onclick=()=>{if(!sending)welcome();};
  window.startProductAssistant = (info,initialTopic)=>{
    name=info.name||name;phone=info.phone||phone;
    if(info.choice!==initialChoice){initialChoice=info.choice;group={'세탁·건조기':'워시타워','공기·냉방가전':'공기청정기','주방가전':'식기세척기'}[info.choice]||(['냉장고','정수기','스타일러'].includes(info.choice)?info.choice:'');query='';limit=9;}
    if(initialTopic==='catalog'){catalog();return;}
    if(initialTopic==='faq'){questions();return;}
    if(!live && (initialTopic==='receipt-preview'||initialTopic==='notice-preview')){
      receiptView(receiptExample,true,initialTopic==='notice-preview');return;
    }
    const initialFaq=faq.find(f=>f[0]===initialTopic);
    if(initialFaq){question=initialFaq[1];questions([initialTopic]);}else welcome();
  };
})();
