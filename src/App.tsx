import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, X, ChevronDown, ArrowRight, Play, Info, LayoutGrid, List
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('12');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("전체");
  const [isGridView, setIsGridView] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const simulationData: Record<string, { subtitle: string, title: string, desc: string, point1: string, point2: string }> = {
    '12': { 
      subtitle: '초기 유지 구간',
      title: '가전과 상조의 동시 시작', 
      desc: '가전 렌탈과 상조 납입이 시작되는 초기 구간입니다. 중도 해지 시 불리할 수 있어 지속적인 유지가 필요해요.',
      point1: '상조 해약환급금이 발생하지 않거나 적어요.',
      point2: '가전 중도 해지 시 위약금 및 잔여 대금이 발생해요.'
    },
    '36': { 
      subtitle: '중반 유지 구간',
      title: '혜택이 쌓이기 시작해요', 
      desc: '가전을 안정적으로 이용하며 상조 납입액이 쌓이는 시기입니다. 환급금이 조금씩 발생하기 시작해요.',
      point1: '상조 해약환급금이 점점 쌓이는 시점이에요.',
      point2: '여전히 가전 위약금 조건이 있어 유지를 권장해요.'
    },
    '60': { 
      subtitle: '핵심 전환점',
      title: '가전 납입이 끝났어요', 
      desc: '가전 렌탈 할부 납입이 종료되는 핵심 시점입니다. 이제 온전한 내 가전이 되며, 상조 납입만 남게 됩니다.',
      point1: '가전 관련 추가 월 납입이 완전히 사라져요.',
      point2: '상조를 계속 유지할지 스스로 판단할 수 있는 시기예요.'
    },
    '만기': { 
      subtitle: '상조 만기 달성',
      title: '환급 또는 든든한 보장', 
      desc: '상조 상품 만기 납입을 모두 완료했어요. 약관에 따른 환급을 받거나 미래를 위한 보장으로 남겨둘 수 있어요.',
      point1: '상품 예시 기준 100% 등 유리한 환급 혜택이 있어요.',
      point2: '크루즈, 웨딩 등 다른 제휴 서비스로도 전환이 가능해요.'
    }
  };

  const planInfo = {
    name: "스페셜 299 더블 (프리미엄)",
    desc: "LG기사님이 직접 무료 배송/설치해 드립니다.",
    price: "월 59,800원 ~"
  };

  const categories = ["전체", "TV/시청각", "냉장고/김치냉장고", "세탁기/건조기", "안마의자/건강", "기타"];

  const productList = [
    {
      id: 1,
      category: "TV/시청각",
      brand: "삼성전자",
      model: "KQ75QCE1AFXKR",
      name: "75형 QLED 4K TV",
      price: "59,800원",
      discountPrice: "29,800원",
      image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=400",
      tag: "최고 인기",
      priceLabel: "최저가 보장",
      shippingFee: "전국 무료설치",
      comparisons: [
        { company: "효원상조", target: "효원상조 설계", price: "59,800원", period: "60개월", isOurs: true, benefit: "만기시 100% 환급" },
        { company: "BS ON", target: "스마트렌탈", price: "60,200원", period: "60개월", isOurs: false },
        { company: "현대유버스", target: "BS ON", price: "63,500원", period: "60개월", isOurs: false },
        { company: "KG 이니렌탈", target: "현대유버스", price: "68,400원", period: "60개월", isOurs: false },
        { company: "KT가전구독", target: "KT가전구독", price: "63,600원", period: "60개월", isOurs: false }
      ],
      detailImage: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: 2,
      category: "냉장고/김치냉장고",
      brand: "LG전자",
      model: "W822GBBR152",
      name: "LG 디오스 오브제컬렉션 노크온",
      price: "59,000원",
      discountPrice: "29,000원",
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400",
      priceLabel: "일반 렌탈과 비슷해요",
      shippingFee: "기본 설치비 무료",
      comparisons: [
        { company: "BS ON", target: "BS ON", price: "58,500원", period: "60개월", isOurs: false },
        { company: "효원상조", target: "효원상조 설계", price: "59,000원", period: "60개월", isOurs: true, benefit: "만기시 100% 환급" },
        { company: "KG 이니렌탈", target: "KG 이니렌탈", price: "61,000원", period: "60개월", isOurs: false },
      ],
      detailImage: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: 3,
      category: "세탁기/건조기",
      brand: "LG전자",
      model: "FX23WNA",
      name: "LG 트롬 워시타워 프리미엄",
      price: "62,000원",
      discountPrice: "32,000원",
      image: "https://images.unsplash.com/photo-1626808642875-0aa545482dfb?auto=format&fit=crop&q=80&w=400",
      tag: "신모델",
      priceLabel: "최저가",
      shippingFee: "전국 무료설치",
      comparisons: [
        { company: "효원상조", target: "효원상조 설계", price: "62,000원", period: "60개월", isOurs: true, benefit: "만기시 100% 환급" },
        { company: "현대유버스", target: "현대유버스", price: "66,000원", period: "60개월", isOurs: false },
        { company: "스마트렌탈", target: "스마트렌탈", price: "75,000원", period: "60개월", isOurs: false },
      ],
      detailImage: "https://images.unsplash.com/photo-1626808642875-0aa545482dfb?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: 4,
      category: "안마의자/건강",
      brand: "바디프랜드",
      model: "BF-2024",
      name: "파라오 2024년형 메디컬 안마의자",
      price: "65,000원",
      discountPrice: "35,000원",
      image: "https://images.unsplash.com/photo-1593025219500-2f3b9c7cf6df?auto=format&fit=crop&q=80&w=400",
      priceLabel: "최저가 보장",
      shippingFee: "전국 무료설치 / 폐가전 수거",
      comparisons: [
        { company: "효원상조", target: "효원상조 설계", price: "65,000원", period: "60개월", isOurs: true, benefit: "만기시 100% 환급" },
        { company: "BS ON", target: "BS ON", price: "72,000원", period: "60개월", isOurs: false },
        { company: "KG 이니렌탈", target: "KG 이니렌탈", price: "89,000원", period: "60개월", isOurs: false },
      ],
      detailImage: "https://images.unsplash.com/photo-1593025219500-2f3b9c7cf6df?auto=format&fit=crop&q=80&w=600"
    }
  ];

  const filteredProducts = activeCategory === "전체" ? productList : productList.filter(p => p.category === activeCategory);

  const shorts = [
    { id: '1', title: '가전결합상조,\n왜 오해를 받을까?', length: '0:58', tag: '필수 시청', views: '2.1만' },
    { id: '2', title: '공짜 가전이\n아닌 확실한 이유', length: '1:12', tag: '팩트 체크', views: '1.5만' },
    { id: '3', title: '일반 렌탈과\n비교하면 뭐가 다를까?', length: '0:45', tag: '비교 분석', views: '3.4만' },
    { id: '4', title: '60개월 이후\n달라지는 엄청난 차이', length: '1:05', tag: '핵심 혜택', views: '4.2만' },
  ];

  return (
    <div className="max-w-[430px] mx-auto bg-[#F2F4F6] min-h-screen relative font-sans text-[#191F28] overflow-x-hidden">
      
      {/* Header */}
      <header className="sticky top-0 w-full bg-white/90 backdrop-blur-md z-40 px-5 flex justify-between items-center h-[60px]">
        <div className="font-bold text-[18px] tracking-tight">효원상조</div>
        <a href="tel:1588-0000" className="text-[13px] font-semibold text-[#4E5968] bg-[#F2F4F6] px-3 py-1.5 rounded-full hover:bg-[#E5E8EB] transition-colors">
          상담 1588-0000
        </a>
      </header>

      {/* 1. Hero Section (Toss Style Focus on Typography) */}
      <section className="bg-white px-6 pt-10 pb-12 rounded-b-[32px]">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h2 className="text-[28px] font-bold leading-[1.3] mb-4 tracking-tight break-keep text-[#191F28]">
            렌탈료 그대로<br/>
            가전도 쓰고,<br/>
            <span className="text-[#3182F6]">상조 혜택까지.</span>
          </h2>
          <p className="text-[#4E5968] text-[16px] leading-[1.5] mb-8 break-keep">
            가전 계약과 상조 계약은 별도예요.<br/>투명하게 설명해드릴 테니, 내게 맞는지 먼저 확인해보세요.
          </p>

          <img 
            src="https://images.unsplash.com/photo-1626808642875-0aa545482dfb?q=80&w=800&auto=format&fit=crop" 
            alt="프리미엄 가전 인테리어" 
            className="w-full h-[200px] object-cover rounded-2xl mb-8 lazyload"
          />

          <div className="space-y-4 mb-8 text-[15px] font-medium text-[#333D4B]">
            <div className="flex items-center gap-3">
              <div className="bg-[#1B64DA] p-1.5 rounded-full"><Check className="w-4 h-4 text-white" strokeWidth={3} /></div>
              <span>일반 렌탈과 비슷한 월 납입 구조</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-[#1B64DA] p-1.5 rounded-full"><Check className="w-4 h-4 text-white" strokeWidth={3} /></div>
              <span>가입 전 모든 해지 조건을 미리 안내</span>
            </div>
          </div>
        </motion.div>

        {/* Hero Form Section */}
        <div className="bg-[#191F28] -mx-6 px-6 py-10 mt-8 rounded-t-[32px] rounded-b-[0] text-center text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-[#3182F6]/20 blur-[60px] rounded-full pointer-events-none"></div>
           <div className="absolute bottom-0 left-0 w-[150px] h-[150px] bg-[#3182F6]/10 blur-[60px] rounded-full pointer-events-none"></div>
           
           <div className="relative z-10">
             <div className="inline-block bg-[#3182F6]/20 text-[#3182F6] text-[12px] font-bold px-3 py-1.5 rounded-full mb-4">
                무료 비교 진단
             </div>
             <h3 className="text-[24px] font-bold mb-3 leading-snug">
               내 상황에 맞는지<br/>상담 전 핵심 비교표 받기
             </h3>
             <p className="text-[#A3B1C6] text-[15px] mb-8 leading-relaxed break-keep">
                연락처를 남겨주시면, 일반 렌탈과 비교 가능한 형태로 정리해서 제일 먼저 안내해 드립니다.
             </p>

             <form className="space-y-3" onSubmit={(e) => {
                 e.preventDefault();
                 document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
             }}>
                <div className="flex bg-white rounded-[16px] overflow-hidden p-1">
                  <input 
                    type="tel" 
                    placeholder="휴대폰 번호만 남겨주세요" 
                    className="flex-1 bg-transparent px-4 py-3 text-[15px] text-[#191F28] font-medium focus:outline-none placeholder:text-[#8B95A1] min-w-0" 
                  />
                  <button type="submit" className="bg-[#3182F6] hover:bg-[#1B64DA] text-white font-bold text-[15px] px-5 py-3 rounded-[12px] whitespace-nowrap shrink-0 transition-colors">
                    비교표 받기
                  </button>
                </div>
                <div className="text-left px-2">
                   <p className="text-[12px] text-[#8B95A1]">
                     * 상담 전 단순 비교 자료 제공 목적입니다.
                   </p>
                </div>
             </form>
           </div>
        </div>
      </section>

      {/* 2. 10 Second Understanding */}
      <section className="bg-white py-12 px-6 rounded-[32px] my-2">
        <h2 className="text-[22px] font-bold mb-3 leading-snug break-keep text-center">
          이 상품은 <span className="text-[#3182F6]">'가전을 공짜로'</span><br/>주는 상품이 아닙니다
        </h2>
        <p className="text-[#4E5968] text-[15px] mb-10 leading-relaxed break-keep text-center">
          일반 렌탈과 비슷한 월 납입 수준에서<br/>상조 유지에 따른 환급 가능성을 함께 설계한 결합상품입니다.
        </p>

        <div className="flex justify-between items-center px-4 mb-10 relative">
          <div className="absolute top-1/2 left-8 right-8 h-[2px] bg-[#F2F4F6] -translate-y-1/2 z-0"></div>
          
          <div className="relative z-10 flex flex-col items-center bg-white">
            <div className="w-16 h-16 bg-[#F2F4F6] rounded-full border-[4px] border-white flex items-center justify-center mb-3 shadow-[0_4px_12px_rgb(0,0,0,0.05)]">
               <span className="text-[24px]">📺</span>
            </div>
            <div className="font-bold text-[14px] text-[#191F28] text-center leading-snug">가전<br/>계약</div>
          </div>
          
          <div className="relative z-10 flex flex-col items-center bg-white">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
               <span className="text-[16px] text-[#8B95A1] font-bold">+</span>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center bg-white">
            <div className="w-16 h-16 bg-[#1B64DA] rounded-full border-[4px] border-white flex items-center justify-center mb-3 shadow-[0_4px_12px_rgb(0,0,0,0.05)]">
               <span className="text-[24px]">🤝</span>
            </div>
            <div className="font-bold text-[14px] text-[#1B64DA] text-center leading-snug">상조<br/>계약</div>
          </div>
          
          <div className="relative z-10 flex flex-col items-center bg-white">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
               <ArrowRight className="w-5 h-5 text-[#8B95A1]" />
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center bg-white">
            <div className="w-16 h-16 bg-[#191F28] rounded-full border-[4px] border-white flex items-center justify-center mb-3 shadow-[0_4px_12px_rgb(0,0,0,0.05)]">
               <span className="text-[24px]">⚖️</span>
            </div>
            <div className="font-bold text-[14px] text-[#191F28] text-center leading-snug">만기 시<br/>선택</div>
          </div>
        </div>

        <div className="bg-[#F2F4F6] rounded-[16px] p-4 text-center">
          <p className="text-[12px] text-[#8B95A1] leading-relaxed break-keep font-medium">
             "공정위·소비자원도 결합상품 가입 시 '별도 계약 여부'와 '해약환급금 구조'를 반드시 확인하라고 안내합니다."
          </p>
        </div>
      </section>

      {/* 2-1. Shorts Trust Section */}
      <section className="py-12 px-0 bg-[#F2F4F6]">
        <div className="px-6 mb-5">
          <h2 className="text-[22px] font-bold mb-2">무엇이 다른지,<br/>영상으로 먼저 확인하세요</h2>
          <p className="text-[#4E5968] text-[15px]">우측으로 넘겨가며 순서대로 시청해보세요</p>
        </div>
        
        <div className="flex overflow-x-auto gap-4 pb-6 px-6 snap-x hide-scrollbar">
          {shorts.map((short, idx) => (
            <motion.div 
              whileTap={{ scale: 0.96 }}
              key={short.id} 
              onClick={() => setActiveVideo(short.title)}
              className="relative shrink-0 w-[150px] aspect-[9/16] snap-center cursor-pointer rounded-2xl overflow-hidden shadow-[0_4px_16px_rgb(0,0,0,0.06)] bg-[#191F28]"
            >
              <img 
                src={`https://images.unsplash.com/photo-${1500000000000 + idx}?w=300&q=80&auto=format&fit=crop`} 
                alt="영상 썸네일" 
                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                  <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                </div>
              </div>

              <div className="absolute top-3 left-3 bg-[#3182F6] text-white text-[11px] font-bold px-2 py-1 rounded-[6px]">
                {short.tag}
              </div>
              
              <div className="absolute bottom-3 left-3 right-3">
                <p className="font-bold text-white text-[14px] leading-[1.3] mb-1.5 whitespace-pre-line">{short.title}</p>
                <p className="text-[11px] text-white/70 font-medium">{short.views}회 시청 • {short.length}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. Why Market Distrusts */}
      <section className="bg-[#191F28] py-12 px-6 rounded-[32px] my-2 text-white">
        <h2 className="text-[22px] font-bold mb-3 leading-snug break-keep text-[#3182F6]">
          왜 많은 분들이 가전결합상조를 의심할까요?
        </h2>
        <p className="text-[#A3B1C6] text-[15px] mb-8 leading-relaxed break-keep">
          시장의 문제점을 먼저 인정합니다. 결합상품 시장에서 고객 불만은 늘 비슷한 곳에서 발생했습니다.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/10 rounded-[16px] p-4">
            <h3 className="font-bold text-[15px] text-white mb-2">고지 부족</h3>
            <p className="text-[#A3B1C6] text-[13px] leading-relaxed break-keep">가전 계약과 상조 계약이 별도라는 사실을 숨김</p>
          </div>
          <div className="bg-white/10 rounded-[16px] p-4">
            <h3 className="font-bold text-[15px] text-white mb-2">과도한 납입액</h3>
            <p className="text-[#A3B1C6] text-[13px] leading-relaxed break-keep">일반 가전 렌탈보다 비정상적으로 높은 월 납입 조건</p>
          </div>
          <div className="bg-white/10 rounded-[16px] p-4">
            <h3 className="font-bold text-[15px] text-white mb-2">해약 구조</h3>
            <p className="text-[#A3B1C6] text-[13px] leading-relaxed break-keep">중도 해지 시 불리한 위약금 구조 설명 누락</p>
          </div>
          <div className="bg-white/10 rounded-[16px] p-4">
            <h3 className="font-bold text-[15px] text-white mb-2">오해 유발</h3>
            <p className="text-[#A3B1C6] text-[13px] leading-relaxed break-keep">'사은품', '적금형' 등 위험한 표현 사용</p>
          </div>
        </div>

        <div className="bg-[#3182F6]/20 rounded-[16px] p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#3182F6] shrink-0 mt-0.5" />
          <p className="text-[13px] text-[#A3B1C6] leading-relaxed break-keep">
            <strong className="text-white">효원상조는 숨기지 않습니다.</strong><br/>
            이중 계약 구조, 위약금 발생 가능성을 계약 전에 먼저 투명하게 안내합니다.
          </p>
        </div>
      </section>

      {/* 4. Products & Accounts Section */}
      <section className="bg-white py-12 px-0 rounded-[32px] mb-2 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
        <div className="px-6 mb-6">
          <div className="inline-block bg-[#1B64DA] text-white text-[11px] font-bold px-2.5 py-1 rounded-full mb-3 shadow-sm">
            {planInfo.name}
          </div>
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-[22px] font-bold leading-snug">일반 렌탈가전과<br/>가격비교 해보세요! 자신있습니다.</h2>
            <div className="flex bg-[#F2F4F6] p-1 rounded-lg">
              <button 
                onClick={() => setIsGridView(false)} 
                className={`p-1.5 rounded-md ${!isGridView ? 'bg-white shadow-sm text-[#191F28]' : 'text-[#8B95A1]'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsGridView(true)} 
                className={`p-1.5 rounded-md ${isGridView ? 'bg-white shadow-sm text-[#191F28]' : 'text-[#8B95A1]'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-[#4E5968] text-[15px]">{planInfo.desc}</p>
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto gap-2 px-6 pb-2 hide-scrollbar mb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-[14px] font-bold transition-all ${activeCategory === cat ? 'bg-[#333D4B] text-white shadow-md' : 'bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product List */}
        <div className={`${isGridView ? 'px-6 space-y-4' : 'flex overflow-x-auto gap-4 px-6 pb-6 snap-x hide-scrollbar'}`}>
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((item) => (
              <motion.div 
                key={item.id}
                layout
                onClick={() => setSelectedProduct(item)}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`cursor-pointer ${isGridView ? 'w-full' : 'shrink-0 w-[260px] snap-center'} bg-white rounded-[20px] overflow-hidden flex ${isGridView ? 'flex-row gap-4 border border-[#F2F4F6] p-3 shadow-sm' : 'flex-col border border-[#F2F4F6] shadow-sm'}`}
              >
                <div className={`relative ${isGridView ? 'w-[100px] h-[100px] shrink-0 rounded-[12px] overflow-hidden bg-[#F2F4F6]' : 'w-full h-[180px] bg-[#F2F4F6]'}`}>
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start">
                    {item.tag && (
                      <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-[4px] leading-tight">
                        {item.tag}
                      </div>
                    )}
                    <div className={`${item.priceLabel.includes('최저가') ? 'bg-[#3182F6]' : 'bg-[#191F28]'} text-white text-[10.5px] font-bold px-2 py-1 rounded-[6px] shadow-sm leading-tight inline-block`}>
                      {item.priceLabel}
                    </div>
                  </div>
                </div>
                
                <div className={`flex flex-col justify-between ${isGridView ? 'py-1 pr-1' : 'p-5'}`}>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[11px] font-bold text-[#8B95A1]">{item.brand}</span>
                      <span className="text-[11px] text-[#A3B1C6]">|</span>
                      <span className="text-[11px] font-medium text-[#8B95A1]">{item.model}</span>
                    </div>
                    <h3 className={`font-bold text-[#191F28] mb-3 leading-snug line-clamp-2 ${isGridView ? 'text-[15px]' : 'text-[16px]'}`}>{item.name}</h3>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center bg-[#333D4B] px-2.5 py-1.5 rounded-[8px] mb-1">
                      <span className="text-[12px] text-white/80 font-medium">월 납입금</span>
                      <span className="text-[13px] text-white font-bold">{item.price}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#BE123C] px-2.5 py-1.5 rounded-[8px]">
                      <span className="text-[12px] text-white/90 font-medium">제휴카드 혜택가</span>
                      <span className="text-[13px] text-white font-bold">{item.discountPrice}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <p className="text-[13px] text-[#8B95A1] mt-2 text-center px-4 break-keep">
          * 실제 렌탈료는 모델 및 제휴카드 사용 실적에 따라 달라질 수 있습니다.
        </p>
      </section>

      {/* 5. What makes us different */}
      <section id="comparison" className="bg-white py-12 px-6 rounded-[32px] mt-2 mb-2">
        <h2 className="text-[22px] font-bold mb-3 leading-snug break-keep text-center">
          효원상조는 '<span className="text-[#3182F6]">비싸게 묶는 상품</span>'이<br/>아닙니다
        </h2>
        <p className="text-[#4E5968] text-[15px] mb-8 leading-relaxed break-keep text-center">
          단순히 혜택만 강조하지 않고,<br/>'비교 가능한 월 납입 구조'를 지향합니다.
        </p>

        <div className="space-y-3 mb-8">
          {[
            "일반 렌탈과 비교 가능한 월 납입 구조",
            "가전/상조 별도 계약 구조를 먼저 설명",
            "렌탈 종료 시점 이후 선택 구조 명확히 안내",
            "계약 전 시점별 시나리오 투명하게 공개"
          ].map((item, idx) => (
             <div key={idx} className="flex items-center gap-3 bg-[#191F28] text-white p-4 rounded-[16px] shadow-sm">
               <div className="bg-[#1B64DA] p-1 rounded-full shrink-0 shadow-sm"><Check className="w-4 h-4 text-white" strokeWidth={3} /></div>
               <span className="text-[15px] font-bold text-white leading-snug">{item}</span>
             </div>
          ))}
        </div>

        <div className="flex gap-3 items-stretch">
          <div className="flex-1 bg-[#F2F4F6] rounded-[20px] p-5 border border-[#E5E8EB]">
            <h3 className="text-[#8B95A1] font-bold text-[15px] mb-4 text-center">일반 가전 렌탈</h3>
            <div className="space-y-4 pt-2">
              <div className="text-center">
                <div className="text-[13px] text-[#8B95A1] mb-1">납입 종료 시</div>
                <div className="text-[15px] font-bold text-[#333D4B]">제품 소유만</div>
              </div>
              <div className="w-[30px] h-[1px] bg-[#D1D6DB] mx-auto"></div>
              <div className="text-center">
                <div className="text-[13px] text-[#8B95A1] mb-1">상담 방식</div>
                <div className="text-[15px] font-bold text-[#333D4B]">가전 스펙 위주</div>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-[#1B64DA] text-white rounded-[20px] p-5 shadow-[0_8px_16px_rgb(27,100,218,0.2)] relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#191F28] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm whitespace-nowrap border border-white/10">
              효원상조 설계
            </div>
            <h3 className="text-white font-bold text-[15px] mb-4 text-center mt-1">가전 + 상조 결합</h3>
            <div className="space-y-4 pt-2">
              <div className="text-center">
                <div className="text-[13px] text-white/80 mb-1">납입 종료 시</div>
                <div className="text-[15px] font-bold text-white break-keep">제품 소유<br/>+ 만기 환급 혜택</div>
              </div>
              <div className="w-[30px] h-[1px] bg-white/30 mx-auto"></div>
              <div className="text-center">
                 <div className="text-[13px] text-white/80 mb-1">상담 방식</div>
                 <div className="text-[15px] font-bold text-white break-keep">해지 조건<br/>이중계약 투명안내</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Warning / Honesty */}
      <section className="bg-[#191F28] py-12 px-6 rounded-[32px] text-white my-2">
        <h2 className="text-[22px] font-bold mb-3 break-keep">무조건 다 좋은<br/>상품은 없습니다.</h2>
        <p className="text-[#8B95A1] text-[15px] mb-8 leading-relaxed break-keep">
          이 상품은 두 개의 계약(가전/상조)이 동시에 진행됩니다. 중간에 해지하면 손해를 볼 수 있습니다.
        </p>

        <div className="bg-white/10 rounded-[20px] p-5 space-y-4">
          <div className="flex items-start gap-3">
            <X className="w-5 h-5 text-red-400 mt-1 shrink-0" />
            <div>
              <div className="font-bold text-[16px] text-white mb-1">할부 기간을 채우기 어렵다면</div>
              <div className="text-[#A3B1C6] text-[14px]">렌탈 위약금과 결합 할인 혜택이 취소되어 손실이 큽니다. 일반 렌탈이 낫습니다.</div>
            </div>
          </div>
          <div className="w-full h-[1px] bg-white/10"></div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[#3182F6] mt-1 shrink-0" strokeWidth={3}/>
            <div>
              <div className="font-bold text-[16px] text-white mb-1">꾸준히 유지할 수 있다면</div>
              <div className="text-[#A3B1C6] text-[14px]">가전 잔여 대금이 끝난 후(상조 납입 지속), 만기 시 혜택까지 받아 훨씬 유리합니다.</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Step-by-Step Process */}
      <section className="bg-white py-12 px-6 rounded-[32px] my-2 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
        <h2 className="text-[22px] font-bold mb-3 leading-snug break-keep text-center">
          가입부터 선택까지,<br/>구조는 이렇게 진행됩니다
        </h2>
        <p className="text-[#4E5968] text-[15px] mb-8 leading-relaxed break-keep text-center">
          어느 시점에 어떤 선택을 할 수 있는지<br/>미리 확인하세요.
        </p>

        <div className="relative border-l-2 border-[#F2F4F6] ml-4 space-y-6">
          <div className="relative pl-6">
            <div className="absolute w-4 h-4 bg-[#3182F6] rounded-full -left-[9px] top-1"></div>
            <h3 className="font-bold text-[16px] text-[#191F28] mb-1">1. 비교 판단 및 상담</h3>
            <p className="text-[14px] text-[#4E5968] leading-relaxed break-keep">
              가입 전, 당사의 시뮬레이션과 일반 렌탈 조건을 상세히 비교해보고 나에게 맞는지 먼저 판단합니다.
            </p>
          </div>
          
          <div className="relative pl-6">
            <div className="absolute w-3 h-3 bg-[#D1D6DB] rounded-full -left-[7px] top-1.5"></div>
            <h3 className="font-bold text-[16px] text-[#191F28] mb-1">2. 계약 체결 및 납입 시작</h3>
            <p className="text-[14px] text-[#4E5968] leading-relaxed break-keep">
              충분히 이해하셨다면 가전+상조 결합 혜택으로 납입을 시작합니다. (중도 해지 시 불리할 수 있음)
            </p>
          </div>

          <div className="relative pl-6">
            <div className="absolute w-3 h-3 bg-[#D1D6DB] rounded-full -left-[7px] top-1.5"></div>
            <h3 className="font-bold text-[16px] text-[#191F28] mb-1">3. 가전 할부 종료 (보통 60개월)</h3>
            <p className="text-[14px] text-[#4E5968] leading-relaxed break-keep">
              가전 할부 납부액이 끝나고, 가전은 완전한 고객님의 소유가 됩니다. 상조 납입액은 계속 누적됩니다.
            </p>
          </div>

          <div className="relative pl-6">
            <div className="absolute w-4 h-4 bg-[#3182F6] rounded-full -left-[9px] top-1"></div>
            <div className="absolute top-[5px] -left-[5px] w-2 h-2 bg-white rounded-full"></div>
            <h3 className="font-bold text-[16px] text-[#191F28] mb-1">4. 상조 만기 달성</h3>
            <p className="text-[14px] text-[#4E5968] leading-relaxed break-keep">
              환급을 받거나 크루즈/웨딩 등 상조 서비스로 활용하는 것을 선택합니다.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Temporal Simulation */}
      <section className="bg-white py-12 px-6 rounded-[32px] my-2">
        <h2 className="text-[22px] font-bold mb-6">시점별 상황 알아보기</h2>

        <div className="bg-[#F2F4F6] p-1.5 flex rounded-[16px] mb-6 relative">
          {Object.keys(simulationData).map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex-1 py-3 text-[14px] font-bold rounded-[12px] transition-colors z-10 ${activeTab === tab ? 'text-[#191F28]' : 'text-[#8B95A1]'}`}
            >
              {activeTab === tab && (
                <motion.div 
                  layoutId="simTabBg" 
                  className="absolute inset-0 bg-white rounded-[12px] shadow-[0_2px_8px_rgb(0,0,0,0.06)]" 
                  style={{ zIndex: -1 }}
                />
              )}
              {tab === '만기' ? tab : `${tab}개월`}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="bg-[#1B64DA] rounded-[24px] p-6 shadow-lg"
          >
            <div className="text-white/80 font-bold text-[13px] mb-2">{simulationData[activeTab].subtitle}</div>
            <h3 className="font-bold text-[20px] text-white mb-3">{simulationData[activeTab].title}</h3>
            <p className="text-white/90 text-[15px] mb-6 leading-[1.6] break-keep">{simulationData[activeTab].desc}</p>
            
            <div className="bg-white rounded-[16px] p-5 space-y-3 shadow-sm">
              <div className="flex items-start gap-2.5 text-[14px] text-[#333D4B] font-medium leading-[1.5]">
                <span className="text-[#3182F6] text-[18px] leading-none mt-0.5">•</span>
                <span>{simulationData[activeTab].point1}</span>
              </div>
              <div className="flex items-start gap-2.5 text-[14px] text-[#333D4B] font-medium leading-[1.5]">
                <span className="text-[#3182F6] text-[18px] leading-none mt-0.5">•</span>
                <span>{simulationData[activeTab].point2}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* 8. Target Audience / Fit */}
      <section className="bg-white py-12 px-6 rounded-[32px] my-2">
        <h2 className="text-[22px] font-bold mb-6 leading-snug break-keep text-center">
          이런 분께는 맞고,<br/>이런 분께는 맞지 않습니다
        </h2>
        
        <div className="space-y-4">
          <div className="bg-[#1B64DA] rounded-[24px] p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-white text-[#1B64DA] p-1 rounded-full"><Check className="w-4 h-4" strokeWidth={3} /></div>
              <h3 className="font-bold text-[18px] text-white">이런 분께 추천해요</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-[15px] font-medium text-white/90 break-keep leading-relaxed">
                <span className="text-white text-[18px] leading-none mt-0.5">•</span>
                원래 가전 렌탈을 알아보고 계셨던 분
              </li>
              <li className="flex items-start gap-2.5 text-[15px] font-medium text-white/90 break-keep leading-relaxed">
                <span className="text-white text-[18px] leading-none mt-0.5">•</span>
                상조 결합 구조를 충분히 이해하고 활용하려는 분
              </li>
              <li className="flex items-start gap-2.5 text-[15px] font-medium text-white/90 break-keep leading-relaxed">
                <span className="text-white text-[18px] leading-none mt-0.5">•</span>
                만기까지 장기 유지가 충분히 가능하신 분
              </li>
            </ul>
          </div>

          <div className="bg-[#BE123C] rounded-[24px] p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-white text-[#BE123C] p-1 rounded-full"><X className="w-4 h-4" strokeWidth={3} /></div>
              <h3 className="font-bold text-[18px] text-white">이런 분은 피해주세요</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-[15px] font-medium text-white/90 break-keep leading-relaxed">
                <span className="text-white text-[18px] leading-none mt-0.5">•</span>
                상조나 결합 구조 설명 없이 혜택만 원하시는 분
              </li>
              <li className="flex items-start gap-2.5 text-[15px] font-medium text-white/90 break-keep leading-relaxed">
                <span className="text-white text-[18px] leading-none mt-0.5">•</span>
                단기 사용 후 빠른 해지를 생각하시는 분
              </li>
              <li className="flex items-start gap-2.5 text-[15px] font-medium text-white/90 break-keep leading-relaxed">
                <span className="text-white text-[18px] leading-none mt-0.5">•</span>
                조건 비교 없이 바로 결정하고 싶으신 분
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 9. Trust / Procedure */}
      <section className="bg-[#191F28] py-12 px-6 rounded-[32px] my-2 text-white">
        <h2 className="text-[22px] font-bold mb-3 leading-snug break-keep">
          효원상조는 이렇게 설명하고,<br/>이렇게 계약합니다
        </h2>
        <p className="text-[#A3B1C6] text-[15px] mb-8 leading-relaxed break-keep">
          숨기는 것 없이, 가입 전 모든 것을 투명하게 공개하고 설명합니다.
        </p>

        <div className="space-y-4">
          <div className="bg-white/10 rounded-[20px] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-[#3182F6] text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-[13px]">1</div>
              <h3 className="font-bold text-[16px]">무료 사전 상담</h3>
            </div>
            <p className="text-[#A3B1C6] text-[14px] leading-relaxed pl-9">
              고객님의 예산과 원하시는 가전을 바탕으로, 일반 렌탈과 당사 결합 상품의 <strong className="text-white">실제 월 납입금을 투명하게 비교</strong>해 드립니다.
            </p>
          </div>
          
          <div className="bg-white/10 rounded-[20px] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-[#3182F6] text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-[13px]">2</div>
              <h3 className="font-bold text-[16px]">구조 및 조건 안내</h3>
            </div>
            <p className="text-[#A3B1C6] text-[14px] leading-relaxed pl-9">
              이중 계약(가전+상조) 구조, 렌탈 기간, 만기 조건 등 꼭 알아야 할 핵심 정보를 숨김없이 설명합니다.
            </p>
          </div>

          <div className="bg-white/10 rounded-[20px] p-5 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-[#3182F6]/20 blur-[40px] rounded-full pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <div className="bg-[#3182F6] text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-[13px]">3</div>
              <h3 className="font-bold text-[16px]">해피콜 최종 확인</h3>
            </div>
            <p className="text-[#A3B1C6] text-[14px] leading-relaxed pl-9 relative z-10">
              전자 계약 전 전문 상담원이 다시 한번 모든 조건을 크로스 체크합니다. <strong className="text-[#3182F6]">조건이 안 맞으면 이 단계에서 얼마든지 취소</strong>하실 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 10. FAQ */}
      <section className="bg-white py-12 px-6 rounded-[32px] my-2">
         <h2 className="text-[22px] font-bold mb-6">자주 묻는 질문</h2>
         <div className="space-y-4">
           {[{
              q: "가전제품이 진짜 공짜인가요?",
              a: "아닙니다. 가전 계약과 상조 계약은 별도로 체결됩니다. 가전 할부 대금을 상조 납입금에 묶어 할인 혜택을 주는 결합 구조입니다."
            }, {
              q: "일반 렌탈이랑 뭐가 다르죠?",
              a: "월 납입금은 비슷할 수 있으나, 만기 유지 시 상조의 다양한 혜택(환급, 웨딩, 크루즈 전환 등)을 받을 수 있다는 점이 가장 큰 차이입니다."
            }, {
              q: "가입할지 말지는 언제 결정하나요?",
              a: "상담을 통해 약관, 위약금 구조, 해약환급금 등을 꼼꼼히 들어보시고 나중에 결정하시면 됩니다. 상담 신청만으로 가입되지 않습니다."
            }].map((faq, idx) => (
             <div key={idx} className="bg-[#191F28] rounded-[20px] overflow-hidden shadow-sm">
               <button 
                 onClick={() => toggleFaq(idx)}
                 className="w-full text-left px-5 py-5 flex justify-between items-center font-bold text-[16px] text-white"
               >
                 <span className="pr-4 leading-snug">{faq.q}</span>
                 <motion.div animate={{ rotate: openFaq === idx ? 180 : 0 }}>
                   <ChevronDown className="w-5 h-5 text-white/50" />
                 </motion.div>
               </button>
               <AnimatePresence>
                 {openFaq === idx && (
                   <motion.div 
                     initial={{ height: 0, opacity: 0 }} 
                     animate={{ height: 'auto', opacity: 1 }} 
                     exit={{ height: 0, opacity: 0 }}
                   >
                     <div className="px-5 pb-5 text-[15px] text-white/80 leading-[1.6] break-keep">
                       {faq.a}
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
           ))}
         </div>
      </section>

      {/* 11. Contact Form */}
      <section id="contact" className="bg-white py-12 px-6 rounded-t-[32px] mt-2 relative pb-28 text-[#191F28]">
        <div className="mb-8">
          <h2 className="text-[26px] font-bold mb-3">설명 먼저 듣기</h2>
          <p className="text-[#4E5968] text-[15px] leading-relaxed break-keep">
            담당자가 가입을 강요하지 않습니다. 투명하게 구조를 설명하고 비교를 도와드립니다.
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">이름</label>
            <input type="text" placeholder="이름을 입력해주세요" className="w-full bg-[#F2F4F6] px-5 py-4 rounded-[16px] text-[16px] font-medium focus:outline-none focus:ring-2 focus:ring-[#3182F6]/50 placeholder:text-[#8B95A1]" />
          </div>
          <div>
            <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">연락처</label>
            <input type="tel" placeholder="010-0000-0000" className="w-full bg-[#F2F4F6] px-5 py-4 rounded-[16px] text-[16px] font-medium focus:outline-none focus:ring-2 focus:ring-[#3182F6]/50 placeholder:text-[#8B95A1]" />
          </div>
          <div>
             <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">문의 사항</label>
             <div className="relative">
               <select className="w-full bg-[#F2F4F6] px-5 py-4 rounded-[16px] text-[16px] font-medium focus:outline-none focus:ring-2 focus:ring-[#3182F6]/50 appearance-none text-[#191F28]">
                 <option>원하는 구좌나 가전이 있어요</option>
                 <option>일반 렌탈과 비교해보고 싶어요</option>
                 <option>만기 조건에 대해 알고 싶어요</option>
               </select>
               <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B95A1] pointer-events-none" />
             </div>
          </div>
          
          <div className="pt-4 pb-2">
            <label className="flex items-start gap-3 cursor-pointer group px-1">
              <div className="relative flex items-center justify-center w-[22px] h-[22px] rounded-[6px] bg-[#F2F4F6] border border-[#D1D6DB] group-hover:border-[#3182F6] transition-colors shrink-0">
                <input type="checkbox" className="opacity-0 absolute" defaultChecked />
                <Check className="w-3.5 h-3.5 text-[#3182F6]" strokeWidth={4} />
              </div>
              <span className="text-[13px] text-[#4E5968] leading-[1.6]">
                [필수] 개인정보 수집·이용 및 제공에 동의합니다.
              </span>
            </label>
          </div>
          
          <button type="submit" className="w-full bg-[#3182F6] hover:bg-[#1B64DA] active:bg-[#1B64DA] text-white font-bold text-[16px] py-4 rounded-[16px] transition-colors mt-2">
            무료 상담 신청하기
          </button>
        </form>

        {/* Footer Disclaimers */}
        <div className="mt-16 pt-8 border-t border-[#F2F4F6]">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-[#8B95A1]" />
            <h4 className="font-bold text-[#8B95A1] text-[13px]">가입 전 꼭 확인하세요</h4>
          </div>
          <ul className="space-y-2 text-[12px] text-[#8B95A1] leading-[1.6] mb-8 break-keep px-1">
            <li>• 가전 계약(렌탈/할부)과 상조 계약은 별도의 독립된 계약입니다.</li>
            <li>• 해약환급금은 납입 기간 및 회차에 따라 상이하며, 중도 해지 시 납입한 금액보다 적거나 없을 수 있습니다.</li>
            <li>• 가전 대금 납입 중 해지 시, 가전 잔여 할부금 및 위약금이 일시 청구될 수 있습니다.</li>
            <li>• 반드시 상품 설명서 및 계약 약관을 확인하시기 바랍니다.</li>
          </ul>
          <p className="text-[12px] text-[#8B95A1] font-medium px-1">
            주식회사 효원상조 | 대표자 OOO<br/>사업자등록번호 000-00-00000 | 고객센터 1588-0000
          </p>
        </div>
      </section>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 w-full max-w-[430px] bg-white border-t border-[#F2F4F6] px-5 py-4 pb-6 flex gap-3 z-40">
        <a href="tel:1588-0000" className="flex-1 bg-[#F2F4F6] text-[#333D4B] text-center py-[15px] rounded-[16px] text-[16px] font-bold active:bg-[#D1D6DB] transition-colors">
          전화하기
        </a>
        <a href="#contact" className="flex-[2] bg-[#3182F6] text-white text-center py-[15px] rounded-[16px] text-[16px] font-bold active:bg-[#1B64DA] transition-colors">
          상담 신청하기
        </a>
      </div>

      {/* Shorts Modal */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[60] flex flex-col justify-center items-center px-4"
          >
            <button 
              onClick={() => setActiveVideo(null)}
              className="absolute top-5 right-5 text-white/50 hover:text-white p-2"
            >
               <X className="w-8 h-8" />
            </button>
            <motion.div 
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-[340px] aspect-[9/16] bg-[#191F28] rounded-[24px] flex items-center justify-center flex-col p-6 text-center border border-white/10"
            >
               <div className="w-16 h-16 bg-[#3182F6]/20 rounded-full flex items-center justify-center mb-6">
                 <Play className="w-8 h-8 text-[#3182F6] ml-1" fill="currentColor" />
               </div>
               <h3 className="text-white font-bold text-[20px] mb-3 leading-snug whitespace-pre-line">{activeVideo}</h3>
               <p className="text-white/50 text-[14px] leading-relaxed">
                 (이곳에 유튜브 쇼츠 iframe이 들어갑니다)
               </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-white flex flex-col mx-auto w-full max-w-[430px]"
          >
            {/* Modal Header */}
            <div className="sticky top-0 w-full bg-white/90 backdrop-blur-md z-10 px-5 flex justify-between items-center h-[60px] border-b border-[#F2F4F6] shrink-0">
              <div className="font-bold text-[16px] truncate pr-4">{selectedProduct.name}</div>
              <button onClick={() => setSelectedProduct(null)} className="p-2 -mr-2 text-[#8B95A1] hover:text-[#191F28] bg-[#F2F4F6] rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto pb-[100px] hide-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
              
              {/* Product Info Block */}
              <div className="bg-[#F2F4F6] w-full aspect-square relative">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4">
                  <div className={`${selectedProduct.priceLabel.includes('최저가') ? 'bg-[#3182F6]' : 'bg-[#191F28]'} text-white text-[12px] font-bold px-3 py-1.5 rounded-[8px] shadow-sm inline-block`}>
                    {selectedProduct.priceLabel}
                  </div>
                </div>
              </div>

              <div className="px-6 py-6 bg-white shrink-0 shadow-sm relative z-10">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[13px] font-bold text-[#8B95A1]">{selectedProduct.brand}</span>
                  <span className="text-[13px] text-[#A3B1C6]">|</span>
                  <span className="text-[13px] font-medium text-[#8B95A1]">{selectedProduct.model}</span>
                </div>
                <h2 className="font-bold text-[22px] text-[#191F28] leading-[1.3] mb-5 break-keep">
                  {selectedProduct.name}
                </h2>

                <div className="bg-[#F2F4F6] rounded-[16px] p-4 flex items-center justify-between mb-2">
                  <span className="text-[14px] text-[#4E5968] font-medium">배송/설치안내</span>
                  <span className="text-[14px] text-[#191F28] font-bold">{selectedProduct.shippingFee}</span>
                </div>
                
                <div className="bg-white border rounded-[20px] p-0 shadow-sm mt-6 overflow-hidden">
                  <div className="bg-[#F9FAFB] px-5 py-4 border-b border-[#F2F4F6]">
                    <span className="inline-block bg-[#1B64DA] text-white text-[12px] font-bold px-3 py-1 rounded-full mb-3 tracking-tight">
                      타사 렌탈 리얼 비교
                    </span>
                    <h3 className="font-bold text-[18px] text-[#191F28] leading-snug break-keep">
                      다른 곳과 직접 비교해보세요
                    </h3>
                  </div>
                  
                  <div className="px-5 py-2">
                    <div className="flex text-[12px] font-bold text-[#8B95A1] border-b border-[#F2F4F6] py-3">
                      <div className="flex-1">렌탈사</div>
                      <div className="w-[100px] text-right">월 렌탈료</div>
                      <div className="w-[80px] text-center">납입기간</div>
                    </div>
                    
                    <div className="divide-y divide-[#F2F4F6]">
                      {selectedProduct.comparisons?.map((comp: any, idx: number) => (
                        <div key={idx} className={`flex items-center py-4 ${comp.isOurs ? 'bg-[#1B64DA] text-white -mx-5 px-5 my-1 rounded-lg shadow-md' : ''}`}>
                          <div className="flex-1 flex flex-col">
                            {/* Dummy logo representations */}
                            <div className="flex items-center gap-2 mb-1">
                              {!comp.isOurs ? (
                                <span className="bg-gray-100 text-gray-500 font-bold text-[10px] px-1.5 py-0.5 rounded border border-gray-200 uppercase whitespace-nowrap">
                                  {comp.company.substring(0, 4)}
                                </span>
                              ) : (
                                <span className="bg-white text-[#1B64DA] font-bold text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap shadow-sm">
                                  효원
                                </span>
                              )}
                              <span className={`font-bold text-[14px] ${comp.isOurs ? 'text-white' : 'text-[#333D4B]'}`}>
                                {comp.company}
                              </span>
                            </div>
                            {comp.benefit && (
                              <span className={`text-[11px] font-medium ${comp.isOurs ? 'text-white/80' : 'text-[#3182F6]'}`}>{comp.benefit}</span>
                            )}
                          </div>
                          
                          <div className={`w-[100px] text-right text-[15px] ${comp.isOurs ? 'font-extrabold text-white' : 'font-bold text-[#191F28]'}`}>
                            월 {comp.price}
                          </div>
                          
                          <div className={`w-[80px] text-center text-[13px] ${comp.isOurs ? 'font-bold text-white/90' : 'text-[#4E5968]'}`}>
                            {comp.period}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-[12px] text-[#8B95A1] mt-5 text-center break-keep leading-relaxed bg-[#F2F4F6] p-3 rounded-[12px]">
                  * 위 금액은 참고용 체감 비교 예시로, 제조사 가격 변동이나 당사 프로모션에 따라 실제와 다를 수 있습니다. 정확한 금액은 상담 시 안내됩니다.
                </p>
              </div>

              {/* Detail Image Placeholder */}
              <div className="bg-white px-2 pb-10">
                <div className="w-full h-8 bg-gradient-to-b from-white to-[#F2F4F6] flex items-center justify-center opacity-50 relative z-0">
                </div>
                {/* Fake long product detail string */}
                <div className="space-y-2 mt-4 px-4 pb-8 relative z-10">
                  <img src={selectedProduct.detailImage} alt="상세1" className="w-full rounded-[16px] shadow-sm mb-4" />
                  <div className="h-[400px] bg-[#F2F4F6] rounded-[16px] flex flex-col items-center justify-center text-[#8B95A1] font-medium border border-[#E5E8EB] shadow-sm">
                    <ChevronDown className="w-8 h-8 text-[#D1D6DB] mb-2" />
                    상세페이지 연동 영역
                  </div>
                </div>
              </div>

            </div>

            {/* Sticky Bottom in Modal */}
            <div className="absolute bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-[#F2F4F6] px-5 py-4 pb-6 flex gap-3 shadow-[0_-10px_30px_rgb(0,0,0,0.05)] shrink-0 z-20">
              <button 
                onClick={() => {
                  setSelectedProduct(null);
                  setTimeout(() => {
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                  }, 400);
                }} 
                className="w-full bg-[#3182F6] text-white text-center py-[16px] rounded-[16px] text-[16px] font-bold active:bg-[#1B64DA] transition-transform active:scale-[0.98] shadow-lg shadow-[#3182F6]/20"
              >
                이 제품으로 무료 상담받기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}