import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, X, ChevronDown, ArrowRight, Play, Info, LayoutGrid, List,
  ShieldAlert, Coins, LockKeyhole, Megaphone,
  Search, FileText, Smartphone, Gift
} from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export default function App() {
  const [activeTab, setActiveTab] = useState('12');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("전체");
  const [isGridView, setIsGridView] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [inquiryType, setInquiryType] = useState('');
  const [message, setMessage] = useState('');
  const [isProductFullView, setIsProductFullView] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [lastViewedSection, setLastViewedSection] = useState<string | null>(null);

  // --- Browser Back Button Support ---
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      
      if (!state) {
        // Back to landing
        setSelectedProduct(null);
        setIsProductFullView(false);
        // Scroll to product list section on landing page
        setTimeout(() => {
          const productSection = document.getElementById('product-list');
          if (productSection) productSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return;
      }

      if (state.view === 'full') {
        setSelectedProduct(null);
        setIsProductFullView(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle View Changes
  const openFullView = () => {
    setIsProductFullView(true);
    window.history.pushState({ view: 'full' }, '');
  };

  const closeFullView = () => {
    window.history.back();
  };

  const openProductDetail = (item: any) => {
    setSelectedProduct(item);
    window.history.pushState({ view: 'detail' }, '');
  };

  const closeProductDetail = () => {
    window.history.back();
  };

  const createInquiry = useMutation(api.inquiries.create);

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

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const simulationData: Record<string, { subtitle: string, title: string, desc: string, point1: string, point2: string }> = {
    '12': { 
      subtitle: '초기 유지 구간',
      title: '가전과 상조의 동시 시작', 
      desc: '가전 렌탈과 상조 납입이 시작되는 초기 구간입니다. 중도 해지 시 불리할 수 있어 지속적인 유지가 필요해요.',
      point1: '상조 해약환급금이 발생하지 않아요.',
      point2: '가전 중도해지 시 잔여 렌탈료를 일시 상환해야 해요.'
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
    },
    {
      id: 5,
      category: "TV/시청각",
      brand: "LG전자",
      model: "OLED65C3KNA",
      name: "65형 올레드 evo C3",
      price: "57,000원",
      discountPrice: "27,000원",
      image: "https://images.unsplash.com/photo-1593784991095-a205039470b6?auto=format&fit=crop&q=80&w=400",
      tag: "최고 화질",
      priceLabel: "초특가",
      shippingFee: "전국 무료설치",
      comparisons: [
        { company: "효원상조", target: "효원상조 설계", price: "57,000원", period: "60개월", isOurs: true, benefit: "만기시 100% 환급" },
        { company: "현대유버스", target: "현대유버스", price: "61,200원", period: "60개월", isOurs: false },
      ],
      detailImage: "https://images.unsplash.com/photo-1593784991095-a205039470b6?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: 6,
      category: "냉장고/김치냉장고",
      brand: "삼성전자",
      model: "RF85C9001AP",
      name: "비스포크 4도어 키친핏",
      price: "58,200원",
      discountPrice: "28,200원",
      image: "https://images.unsplash.com/photo-1571175432270-ef0260ca7302?auto=format&fit=crop&q=80&w=400",
      priceLabel: "인기 모델",
      shippingFee: "기본 설치비 무료",
      comparisons: [
        { company: "효원상조", target: "효원상조 설계", price: "58,200원", period: "60개월", isOurs: true, benefit: "만기시 100% 환급" },
        { company: "스마트렌탈", target: "스마트렌탈", price: "62,500원", period: "60개월", isOurs: false },
      ],
      detailImage: "https://images.unsplash.com/photo-1571175432270-ef0260ca7302?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: 7,
      category: "세탁기/건조기",
      brand: "삼성전자",
      model: "WF24B9600KP",
      name: "비스포크 그랑데 AI 세탁기",
      price: "55,000원",
      discountPrice: "25,000원",
      image: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&q=80&w=400",
      tag: "베스트",
      priceLabel: "최저가",
      shippingFee: "전국 무료설치",
      comparisons: [
        { company: "효원상조", target: "효원상조 설계", price: "55,000원", period: "60개월", isOurs: true, benefit: "만기시 100% 환급" },
        { company: "KG 이니렌탈", target: "KG 이니렌탈", price: "59,800원", period: "60개월", isOurs: false },
      ],
      detailImage: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: 8,
      category: "안마의자/건강",
      brand: "코지마",
      model: "CMC-A305",
      name: "코지마 뉴트로 안마의자",
      price: "56,900원",
      discountPrice: "26,900원",
      image: "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=400",
      priceLabel: "가성비 추천",
      shippingFee: "전국 무료설치",
      comparisons: [
        { company: "효원상조", target: "효원상조 설계", price: "56,900원", period: "60개월", isOurs: true, benefit: "만기시 100% 환급" },
        { company: "BS ON", target: "BS ON", price: "64,000원", period: "60개월", isOurs: false },
      ],
      detailImage: "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=600"
    }
  ];

  const convexProducts = useQuery(api.products.getVisibleProducts);
  const products = (convexProducts && convexProducts.length > 0) ? convexProducts : productList;
  const filteredProducts = activeCategory === "전체" ? products : products.filter(p => p.category === activeCategory);

  const shorts = [
    { id: '1', title: '가전결합상조,\n왜 오해를 받을까?', length: '0:58', tag: '필수 시청', views: '2.1만' },
    { id: '2', title: '공짜 가전이\n아닌 확실한 이유', length: '1:12', tag: '팩트 체크', views: '1.5만' },
    { id: '3', title: '일반 렌탈과\n비교하면 뭐가 다를까?', length: '0:45', tag: '비교 분석', views: '3.4만' },
    { id: '4', title: '60개월 이후\n달라지는 엄청난 차이', length: '1:05', tag: '핵심 혜택', views: '4.2만' },
  ];

  return (
    <div className="w-full max-w-[430px] sm:max-w-[480px] md:max-w-[540px] mx-auto bg-[#F2F4F6] min-h-screen relative font-sans text-[#191F28] overflow-x-hidden sm:shadow-[0_0_40px_rgba(0,0,0,0.05)] sm:border-x sm:border-[#E5E8EB]">
      
      {/* Header */}
      <header className="sticky top-0 w-full bg-white/90 backdrop-blur-md z-40 px-5 flex justify-between items-center h-[60px]">
        <img 
          src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1777895641/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_wnz5aa.png" 
          alt="효원상조 로고" 
          className="h-[24px] w-auto object-contain"
        />
        <a href="tel:1588-8873" className="text-[13px] font-semibold text-[#4E5968] bg-[#F2F4F6] px-3 py-1.5 rounded-full hover:bg-[#E5E8EB] transition-colors">
          상담 1588-8873
        </a>
      </header>

      {/* 1. Hero Section (Toss Style Focus on Typography) */}
      <section className="bg-white px-6 pt-10 pb-12 rounded-b-[32px]">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h2 className="text-[30px] font-bold leading-[1.2] mb-5 tracking-tight break-keep text-[#191F28]">
            가전결합상조는 비싸다?<br/>
            그 인식을 바꾸기 위해<br/>
            <span className="text-[#3182F6] text-[38px] mt-1 block">다시 설계했습니다.</span>
          </h2>

          <p className="text-[#4E5968] text-[16px] leading-[1.6] mb-8 break-keep">
            기존 가전결합상조는 만기 혜택은 분명했지만, 월 납입금 부담이 컸습니다. 
            효원상조는 그 혜택은 유지하면서도, <strong className="text-[#191F28]">일반 렌탈과 비슷하거나 더 저렴한 상품</strong>을 새롭게 출시했습니다.
          </p>

          <img 
            src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1777896370/Generated_Image_May_04_2026_-_9_04PM_l3o3ph.jpg" 
            alt="프리미엄 가전 결합 서비스" 
            className="w-full aspect-[4/3] object-cover rounded-2xl mb-8 shadow-lg"
          />
          <div className="space-y-4 mb-10">
            <h3 className="text-[18px] font-bold text-[#191F28] px-1 mb-4">효원상조 가전결합상조는</h3>
            <div className="grid gap-3">
              <div className="bg-[#191F28] p-5 rounded-[24px] shadow-lg shadow-blue-900/10 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-[#3182F6]/20 p-1 rounded-lg">
                    <Check className="w-4 h-4 text-[#3182F6]" strokeWidth={3} />
                  </div>
                  <span className="font-bold text-[16px] text-white">결합구조</span>
                </div>
                <p className="text-[14px] text-[#A3B1C6] leading-relaxed break-keep font-medium">가전 렌탈과 상조 계약을 동시에 진행하는 결합 구조입니다.</p>
              </div>

              <div className="bg-[#191F28] p-5 rounded-[24px] shadow-lg shadow-blue-900/10 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-[#3182F6]/20 p-1 rounded-lg">
                    <Check className="w-4 h-4 text-[#3182F6]" strokeWidth={3} />
                  </div>
                  <span className="font-bold text-[16px] text-white">합리적 월 납입금</span>
                </div>
                <p className="text-[14px] text-[#A3B1C6] leading-relaxed break-keep font-medium">그런데도 월 납입금은 일반 가전 렌탈과 비슷하거나 더 부담 없게 구성했습니다.</p>
              </div>

              <div className="bg-[#191F28] p-5 rounded-[24px] shadow-lg shadow-blue-900/10 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-[#3182F6]/20 p-1 rounded-lg">
                    <Check className="w-4 h-4 text-[#3182F6]" strokeWidth={3} />
                  </div>
                  <span className="font-bold text-[16px] text-white">만기 환급 혜택</span>
                </div>
                <p className="text-[14px] text-[#A3B1C6] leading-relaxed break-keep font-medium">여기에 상조 만기 시에는 가전 렌탈료 전액 환급 지원 혜택까지 받을 수 있습니다.</p>
              </div>

              <div className="bg-[#FFF5F5] p-5 rounded-[24px] border border-[#FFEBEB]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-[#FF4D4F]/10 p-1 rounded-lg">
                    <Info className="w-4 h-4 text-[#FF4D4F]" strokeWidth={3} />
                  </div>
                  <span className="font-bold text-[16px] text-[#FF4D4F]">선택 가능 품목 안내</span>
                </div>
                <p className="text-[14px] text-[#4E5968] leading-relaxed break-keep">단, 가전제품은 지정된 품목에 한해 선택 가능하니 아래 리스트를 꼭 확인해 주세요.</p>
              </div>
            </div>
          </div>
        </motion.div>

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
          <div className="bg-white/5 border border-white/10 rounded-[20px] p-5">
            <div className="w-10 h-10 bg-red-400/10 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="font-bold text-[16px] text-white mb-2">고지 부족</h3>
            <p className="text-[#A3B1C6] text-[13px] leading-relaxed break-keep">가전 계약과 상조 계약이 별도라는 사실을 숨김</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[20px] p-5">
            <div className="w-10 h-10 bg-red-400/10 rounded-full flex items-center justify-center mb-4">
              <Coins className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="font-bold text-[16px] text-white mb-2">과도한 납입액</h3>
            <p className="text-[#A3B1C6] text-[13px] leading-relaxed break-keep">일반 가전 렌탈보다 비정상적으로 높은 월 납입 조건</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[20px] p-5">
            <div className="w-10 h-10 bg-red-400/10 rounded-full flex items-center justify-center mb-4">
              <LockKeyhole className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="font-bold text-[16px] text-white mb-2">해약 구조</h3>
            <p className="text-[#A3B1C6] text-[13px] leading-relaxed break-keep">중도 해지 시 불리한 위약금 구조 설명 누락</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[20px] p-5">
            <div className="w-10 h-10 bg-red-400/10 rounded-full flex items-center justify-center mb-4">
              <Megaphone className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="font-bold text-[16px] text-white mb-2">오해 유발</h3>
            <p className="text-[#A3B1C6] text-[13px] leading-relaxed break-keep">'사은품', '적금형' 등 위험한 표현 사용</p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative mt-8 p-0.5 rounded-[22px] overflow-hidden bg-gradient-to-r from-[#3182F6] via-[#A3B1C6] to-[#3182F6] bg-[length:200%_auto] animate-gradient-x shadow-[0_0_20px_rgba(49,130,246,0.3)]"
        >
          <div className="bg-[#191F28] rounded-[21px] p-6 flex flex-col items-center text-center">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="bg-[#3182F6]/20 p-2 rounded-full mb-4"
            >
              <Check className="w-6 h-6 text-[#3182F6]" strokeWidth={3} />
            </motion.div>
            
            <h3 className="text-[20px] font-bold text-white mb-2 tracking-tight">
              효원상조는 <span className="text-[#3182F6]">숨기지 않습니다.</span>
            </h3>
            
            <p className="text-[#A3B1C6] text-[15px] leading-relaxed break-keep">
              결합 계약 구조, 위약금 발생 가능성을<br/>
              <span className="text-white font-semibold">계약 전 시점별 시나리오</span>를 통해<br/>
              가장 투명하게 먼저 안내해 드립니다.
            </p>
          </div>
        </motion.div>
      </section>

      {/* 4. Products & Accounts Section */}
      <section className="bg-white pt-10 pb-6 px-0 rounded-[32px] mb-2 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
        <div className="px-6 mb-6">
          <div className="inline-block bg-[#1B64DA] text-white text-[11px] font-bold px-2.5 py-1 rounded-full mb-3 shadow-sm">
            {planInfo.name}
          </div>
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-[22px] font-bold leading-snug">일반 렌탈가전과<br/>가격비교 해보세요! 자신있습니다.</h2>
          </div>
          <p className="text-[#4E5968] text-[15px]">{planInfo.desc}</p>
        </div>

        {/* Categories & Product Focus View Trigger */}
        <div className="px-6 flex justify-between items-end mb-6" id="product-list">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-2.5 py-1 bg-[#3182F6]/10 text-[#3182F6] text-[11px] font-bold rounded-md mb-2">PRODUCT LIST</span>
            <h2 className="text-[22px] font-bold text-[#191F28] leading-tight">
              나에게 딱 맞는<br />결합 상품 찾기
            </h2>
          </motion.div>
          {!isProductFullView && (
            <button 
              onClick={openFullView}
              className="relative overflow-visible group"
            >
              <div className="absolute inset-0 bg-[#3182F6] blur-md opacity-40 animate-neon rounded-full group-hover:opacity-60 transition-opacity"></div>
              <div className="relative text-white text-[14px] font-extrabold flex items-center gap-1.5 px-5 py-2.5 bg-[#3182F6] rounded-full shadow-[0_4px_15px_rgba(49,130,246,0.4)] active:scale-95 transition-transform">
                전체보기 <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          )}
        </div>

        {/* Category Tabs (Horizontal Scroll) */}
        <div className="px-6 mb-6 overflow-x-auto hide-scrollbar flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                activeCategory === cat
                  ? 'bg-[#191F28] text-white shadow-md'
                  : 'bg-[#F2F4F6] text-[#4E5968]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Card List (Horizontal Scroll in Section) */}
        <div 
          className="grid grid-rows-2 grid-flow-col auto-cols-max gap-3 px-6 pb-2 overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-px-6"
        >
          {filteredProducts.map((item) => (
            <motion.div
              key={item.id}
              onClick={() => openProductDetail(item)}
              layoutId={`product-${item.id}`}
              className="w-[200px] bg-white rounded-[24px] border border-[#F2F4F6] overflow-hidden snap-start flex-shrink-0 active:scale-95 transition-transform cursor-pointer"
            >
              <div className="relative h-[125px]">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                {item.tag && (
                  <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
                    {item.tag}
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[11px] font-bold text-[#3182F6]">{item.brand}</span>
                  <div className="w-[1px] h-2 bg-[#E5E8EB]" />
                  <span className="text-[11px] font-medium text-[#8B95A1] truncate">{item.model}</span>
                </div>
                <h3 className="text-[14px] font-bold text-[#191F28] mb-3 line-clamp-2 h-10 leading-tight">
                  {item.name}
                </h3>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-[#8B95A1] line-through decoration-[#8B95A1]/40">월 {item.price}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[16px] font-bold text-[#191F28]">월 {item.discountPrice}</span>
                    <span className="text-[11px] font-bold text-[#F04452]">0원</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="px-6 mt-4">
          <div className="bg-[#F9FAFB] p-4 rounded-[20px] flex items-center justify-between">
            <p className="text-[12px] text-[#4E5968] font-medium">원하는 상품이 없으신가요?</p>
            <button 
              onClick={() => setIsContactModalOpen(true)}
              className="text-[12px] text-[#3182F6] font-bold flex items-center gap-1"
            >
              상담원에게 물어보기 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. Price & Benefit Section */}
      <section className="bg-white py-14 px-6 rounded-[32px] my-2 shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-[#F2F4F6]">
        <div className="mb-8">
          <span className="inline-block px-2.5 py-1 bg-[#3182F6]/10 text-[#3182F6] text-[11px] font-bold rounded-md mb-2 uppercase tracking-wider">Pricing Plan</span>
          <h2 className="text-[22px] font-bold text-[#191F28] leading-tight">
            합리적인 가격 구성으로<br />두 배의 가치를 누리세요
          </h2>
        </div>

        {/* Product Card */}
        <div className="bg-[#F8FAFB] rounded-[32px] border border-[#F2F4F6] overflow-hidden shadow-sm">
          {/* Product Header */}
          <div className="bg-[#191F28] px-7 py-6 text-white">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#3182F6] rounded-full animate-pulse"></span>
                <span className="text-[12px] text-[#3182F6] font-bold">BEST SELLER</span>
              </div>
              <span className="text-[12px] text-white/40 font-medium">Double Account (2구좌)</span>
            </div>
            <h3 className="text-[21px] font-bold">스페셜 299 더블</h3>
          </div>

          {/* Pricing Info */}
          <div className="p-7 space-y-6">
            {/* Main Price Display */}
            <div className="bg-white p-6 rounded-[24px] border border-[#E5E8EB]">
              <div className="flex flex-col gap-5">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-[#8B95A1] font-medium leading-tight">
                    월 납입금<br className="sm:hidden" /> (1회~200회)
                  </span>
                  <div className="text-[24px] font-black text-[#191F28] whitespace-nowrap">59,800원</div>
                </div>
                <div className="w-full h-[1px] bg-[#F2F4F6]"></div>
                <div className="flex justify-between items-center">
                  <div className="text-[12px] text-[#3182F6] font-bold flex items-center gap-1 leading-tight">
                    <Coins className="w-3.5 h-3.5 shrink-0" />
                    <span>제휴카드<br className="sm:hidden" /> 최대 할인 시</span>
                  </div>
                  <div className="text-[18px] font-black text-[#3182F6] whitespace-nowrap">월 34,800원</div>
                </div>
              </div>
            </div>

            {/* Important Breakdown: 1-60 Months */}
            <div className="bg-[#F2F8FF] rounded-[24px] p-5 border border-[#3182F6]/10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-3 opacity-10">
                 <Info className="w-12 h-12 text-[#3182F6]" />
               </div>
               <div className="relative z-10">
                 <div className="text-[14px] font-bold text-[#191F28] mb-4 flex items-center gap-2">
                   <div className="w-5 h-5 bg-[#3182F6] text-white rounded-full flex items-center justify-center text-[10px]">!</div>
                   초기 60회 납입 상세 구성 안내
                 </div>
                 <div className="space-y-5">
                   <div className="flex justify-between items-center">
                     <span className="text-[13px] text-[#4E5968] leading-tight">
                       상조부금<br className="sm:hidden" /> (월 납입금의 10%)
                     </span>
                     <span className="font-bold text-[#191F28] whitespace-nowrap text-[15px]">5,980원</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-[13px] text-[#4E5968] leading-tight">
                       가전 렌탈 대금<br className="sm:hidden" /> (기타 90%)
                     </span>
                     <span className="font-bold text-[#3182F6] whitespace-nowrap text-[15px]">53,820원</span>
                   </div>
                   <div className="pt-4 mt-1 border-t border-[#3182F6]/10 text-[11px] text-[#4E5968]/70 leading-relaxed break-keep">
                     * 1회부터 60회까지는 상조부금과 가전 렌탈 대금이 구분되어 청구됩니다. 61회부터는 상조부금으로 전액 전환됩니다.
                   </div>
                 </div>
               </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-white p-5 rounded-[24px] border border-[#E5E8EB]">
                 <div className="text-[12px] text-[#8B95A1] mb-1">총 상품 금액</div>
                 <div className="text-[16px] font-bold text-[#191F28]">1,196만 원</div>
               </div>
               <div className="bg-[#3182F6] p-5 rounded-[24px] shadow-md shadow-[#3182F6]/20">
                 <div className="text-[12px] text-white/70 mb-1">만기 환급금</div>
                 <div className="text-[16px] font-bold text-white">1,196만 원 (100%)</div>
               </div>
            </div>

            {/* Service Benefit */}
            <div className="bg-[#191F28] p-5 rounded-[24px] text-center border border-white/5">
              <div className="text-[12px] text-white/50 mb-1">더블 상품만의 강력한 서비스</div>
              <div className="text-[16px] font-bold text-white">
                상조 또는 크루즈 <span className="text-[#3182F6]">2회 이용 가능</span>
              </div>
            </div>

            {/* Extra Disclaimer */}
            <div className="pt-2 px-1">
              <p className="text-[11px] text-[#8B95A1] leading-relaxed break-keep text-center">
                본 상품은 2구좌(더블) 결합 상품으로 한 구좌당 금액은 598만 원입니다.<br />
                제휴카드 월 25,000원 할인은 전월 실적 충족 시 1회~60회까지 적용됩니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Full Screen Immersive Product Viewer --- */}
      <AnimatePresence mode="wait">
        {isProductFullView && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col mx-auto w-full max-w-[430px] sm:max-w-[480px] md:max-w-[540px] sm:shadow-[0_0_40px_rgba(0,0,0,0.05)] sm:border-x sm:border-[#E5E8EB]"
          >
            {/* Full Screen Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 px-6 py-4 flex justify-between items-center border-b border-[#F2F4F6]">
              <div>
                <h2 className="text-[18px] font-bold text-[#191F28]">결합 상품 찾기</h2>
                <p className="text-[12px] text-[#8B95A1]">{filteredProducts.length}개의 상품</p>
              </div>
              <button 
                onClick={closeFullView}
                className="p-2 bg-[#F2F4F6] rounded-full"
              >
                <X className="w-5 h-5 text-[#4E5968]" />
              </button>
            </div>

            {/* Immersive Category Filter */}
            <div className="bg-white px-6 py-3 overflow-x-auto hide-scrollbar flex gap-2 border-b border-[#F2F4F6]">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                    activeCategory === cat
                      ? 'bg-[#3182F6] text-white shadow-lg shadow-[#3182F6]/20'
                      : 'bg-[#F2F4F6] text-[#4E5968]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Immersive Grid View */}
            <div className="flex-1 overflow-y-auto px-6 py-6 bg-[#F9FAFB] hide-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map((item) => (
                  <motion.div
                    key={`full-${item.id}`}
                    layoutId={`product-${item.id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[24px] border border-[#E5E8EB] overflow-hidden shadow-sm flex flex-col h-full"
                    onClick={() => {
                      openProductDetail(item);
                    }}
                  >
                    <div className="relative aspect-square">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      {item.tag && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold rounded-md">
                          {item.tag}
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                      <span className="text-[10px] font-bold text-[#3182F6] mb-1">{item.brand}</span>
                      <h3 className="text-[13px] font-bold text-[#191F28] mb-2 line-clamp-2 leading-snug flex-1">
                        {item.name}
                      </h3>
                      <div className="mt-auto">
                        <span className="text-[10px] text-[#8B95A1] line-through">월 {item.price}</span>
                        <div className="flex items-baseline justify-between">
                          <span className="text-[15px] font-bold text-[#191F28]">월 {item.discountPrice}</span>
                          <span className="text-[10px] font-bold text-[#F04452]">0원</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-8 text-center pb-12">
                <p className="text-[13px] text-[#8B95A1] mb-4">원하시는 상품을 선택해 무료 상담을 받아보세요</p>
                <button 
                  onClick={closeFullView}
                  className="px-6 py-3 bg-[#E5E8EB] text-[#4E5968] font-bold rounded-full text-[14px]"
                >
                  메인으로 돌아가기
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. What makes us different */}
      <section id="comparison" className="bg-white py-16 px-6 rounded-[32px] mt-2 mb-2">
        <h2 className="text-[22px] font-bold mb-3 leading-tight break-keep text-center text-[#191F28]">
          효원의 결합상조는 단순히<br/>
          ‘가전 혜택을 내세워 상조를 <span className="text-[#3182F6]">비싸게 묶는 상품</span>’이 아닙니다.
        </h2>
        <p className="text-[#4E5968] text-[15px] mb-10 leading-relaxed break-keep text-center">
          단순한 혜택 강조보다,<br/>
          일반 렌탈과도 비교해볼 수 있는 월 납입 구조와<br/>
          <span className="text-[#191F28] font-semibold">투명한 설명을 먼저 생각했습니다.</span>
        </p>

        <div className="space-y-3 mb-10">
          {[
            "일반 렌탈과 비교 가능한 월 납입 구조",
            "가전 계약과 상조 계약을 분리해 투명하게 설명",
            "렌탈 종료 이후 유지·해지 선택 구조를 명확히 안내",
            "계약 전 시점별 흐름과 조건을 투명하게 공개"
          ].map((text, idx) => (
            <div key={idx} className="bg-[#191F28] py-4 px-6 rounded-[16px] flex items-center gap-4 shadow-sm">
              <div className="bg-[#3182F6] p-1 rounded-full shrink-0">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
              <span className="text-white font-bold text-[15px] break-keep">{text}</span>
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
                <div className="text-[13px] text-[#8B95A1] mb-1">주요 안내</div>
                <div className="text-[15px] font-bold text-[#333D4B]">가전 스펙 위주</div>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-[#1B64DA] text-white rounded-[20px] p-5 shadow-[0_8px_16px_rgb(27,100,218,0.2)] relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#191F28] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm whitespace-nowrap border border-white/10">
              효원상조 가전결합
            </div>
            <h3 className="text-white font-bold text-[15px] mb-4 text-center mt-1">가전 + 상조 결합</h3>
            <div className="space-y-4 pt-2">
              <div className="text-center">
                <div className="text-[13px] text-white/80 mb-1">납입 종료 시</div>
                <div className="text-[15px] font-bold text-white break-keep">제품 소유<br/>+ 만기 환급 혜택</div>
              </div>
              <div className="w-[30px] h-[1px] bg-white/30 mx-auto"></div>
              <div className="text-center">
                 <div className="text-[13px] text-white/80 mb-1">주요 안내</div>
                 <div className="text-[15px] font-bold text-white break-keep">해지 조건<br/>결합계약 투명안내</div>
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
              <div className="font-bold text-[16px] text-white mb-1">렌탈 기간을 채우기 어렵다면</div>
              <div className="text-[#A3B1C6] text-[14px]">잔여 렌탈료를 일시 완납을 해야하기 때문에 일반 가전렌탈과 마찬가지로 중도해약에 대한 부담이 있습니다.</div>
            </div>
          </div>
          <div className="w-full h-[1px] bg-white/10"></div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[#3182F6] mt-1 shrink-0" strokeWidth={3}/>
            <div>
              <div className="font-bold text-[16px] text-white mb-1">꾸준히 유지할 수 있다면</div>
              <div className="text-[#A3B1C6] text-[14px]">가전 렌탈 기간이 끝난 후(상조 납입 지속), 상조 만기 시 가전 렌탈료 전액을 지원받아 훨씬 유리합니다.</div>
            </div>
          </div>
        </div>

        {/* New Neon Highlight Box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-8 p-[2px] rounded-[24px] bg-gradient-to-r from-[#3182F6] via-[#A78BFA] to-[#3182F6] bg-[length:200%_200%] animate-gradient-x shadow-[0_0_20px_rgba(49,130,246,0.3)]"
        >
          <div className="bg-[#191F28] rounded-[22px] p-6">
            <div className="inline-block bg-[#3182F6] text-white text-[12px] font-bold px-3 py-1 rounded-full mb-4 animate-pulse">
              그런데!
            </div>
            <p className="text-[15px] leading-[1.7] break-keep font-medium text-white/95">
              가전 렌탈로만 비교해도, <span className="text-[#3182F6] font-bold text-[16px]">효원상조 가전결합 상품은 일반 가전 렌탈과 비슷한 수준</span>의 월 납입금으로 이용할 수 있습니다. 
              <br/><br/>
              여기에 렌탈 종료 후 상조를 계속 유지할지 결정할 수 있어, 고객은 부담 없이 시작하면서도 <span className="text-white font-extrabold underline underline-offset-4 decoration-[#3182F6]">만기 유지 시 가전 렌탈료 지원 혜택</span>을 받을 수 있는 가능성까지 확보할 수 있습니다.
            </p>
          </div>
        </motion.div>
      </section>

      {/* 7. Step-by-Step Process - Infographic Version */}
      <section className="bg-[#F8FAFB] py-16 px-6 rounded-[40px] my-4 shadow-sm border border-[#F2F4F6]">
        <div className="text-center mb-12">
          <h2 className="text-[24px] font-bold mb-3 leading-tight text-[#191F28] break-keep">
            가입부터 선택까지,<br/>이렇게 진행됩니다
          </h2>
          <p className="text-[#8B95A1] text-[15px] leading-relaxed break-keep">
            어느 시점에 어떤 선택을 할 수 있는지 미리 확인하세요.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              step: "01",
              title: "비교 판단 및 상담",
              desc: "가입 전, 효원상조 상품과 일반 렌탈 상품을 상세히 비교해보고 나에게 맞는지 먼저 판단합니다.",
              icon: <Search className="w-6 h-6 text-[#3182F6]" />,
              color: "bg-[#3182F6]/10"
            },
            {
              step: "02",
              title: "계약 체결 및 납입 시작",
              desc: "충분히 이해하셨다면 가전+상조 결합 혜택으로 납입을 시작합니다. (중도 해지 시 일시 완납 부담이 있을 수 있음)",
              icon: <FileText className="w-6 h-6 text-[#1B64DA]" />,
              color: "bg-[#1B64DA]/10"
            },
            {
              step: "03",
              title: "가전 렌탈 종료 (60개월)",
              desc: "가전 렌탈료 납입이 끝나고 가전은 완전히 고객님 소유가 됩니다. 상조 납입액은 계속 누적됩니다.",
              icon: <Smartphone className="w-6 h-6 text-[#191F28]" />,
              color: "bg-[#191F28]/10"
            },
            {
              step: "04",
              title: "상조 만기 달성",
              desc: "100% 환급(상품별 상이)을 받거나 크루즈, 웨딩 등 프리미엄 상조 서비스로 전환하여 활용합니다.",
              icon: <Gift className="w-6 h-6 text-[#3182F6]" />,
              color: "bg-[#3182F6]/10"
            }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#F2F4F6] flex gap-5 items-start relative overflow-hidden"
            >
              <div className={`w-12 h-12 ${item.color} rounded-[16px] flex items-center justify-center shrink-0`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#3182F6] font-bold text-[12px] tracking-wider uppercase">Step {item.step}</span>
                  </div>
                  <h3 className="font-bold text-[17px] text-[#191F28] leading-tight break-keep">{item.title}</h3>
                </div>
                <p className="text-[14px] text-[#4E5968] leading-[1.6] break-keep font-medium">
                  {item.desc}
                </p>
              </div>
              {idx < 3 && (
                <div className="absolute bottom-0 left-[36px] w-[2px] h-4 bg-gradient-to-b from-[#F2F4F6] to-transparent translate-y-full"></div>
              )}
            </motion.div>
          ))}
        </div>
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
              결합 계약(가전+상조) 구조, 렌탈 기간, 만기 조건 등 꼭 알아야 할 핵심 정보를 숨김없이 설명합니다.
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
              a: "아닙니다. 가전 계약과 상조 계약은 별도로 체결됩니다. 다만, 상조가 만기되면 가전 대금까지 포함해서 전액 환급을 해드립니다."
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

      {/* 11. Footer Consultation Form */}
      <section id="contact" className="bg-[#191F28] py-16 px-6 rounded-[40px] my-4 text-white">
        <div className="max-w-[400px] mx-auto">
          <div className="mb-10 text-center">
            <span className="inline-block px-3 py-1 bg-[#3182F6] text-white text-[11px] font-bold rounded-full mb-4 animate-pulse">
              QUICK CONSULTATION
            </span>
            <h2 className="text-[26px] font-bold mb-3">무료 상담 신청하기</h2>
            <p className="text-[#A3B1C6] text-[15px] leading-relaxed break-keep">
              가입 전 궁금한 점이 있으신가요?<br/>
              전담 상담원이 친절하고 투명하게 안내해 드립니다.
            </p>
          </div>

          <form className="space-y-5" onSubmit={async (e) => {
            e.preventDefault();
            try {
              const finalMessage = inquiryType === '직접 입력하기' ? message : inquiryType;
              await createInquiry({
                name,
                phone,
                productName: "랜딩 하단 상담",
                message: finalMessage || undefined
              });
              alert('상담 신청이 접수되었습니다.');
              setName('');
              setPhone('');
              setInquiryType('');
              setMessage('');
            } catch (err) {
              alert('상담 신청 중 오류가 발생했습니다.');
            }
          }}>
            <div>
              <label className="block text-[13px] font-bold text-[#A3B1C6] mb-2 px-1">이름</label>
              <input 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력해주세요" 
                className="w-full bg-white/10 px-5 py-4 rounded-[18px] text-[16px] font-medium focus:outline-none focus:ring-2 focus:ring-[#3182F6] placeholder:text-white/20 border border-white/5" 
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#A3B1C6] mb-2 px-1">연락처</label>
              <input 
                type="tel" 
                required
                value={phone}
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                placeholder="010-0000-0000" 
                className="w-full bg-white/10 px-5 py-4 rounded-[18px] text-[16px] font-medium focus:outline-none focus:ring-2 focus:ring-[#3182F6] placeholder:text-white/20 border border-white/5" 
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#A3B1C6] mb-2 px-1">문의 사항</label>
              <div className="relative mb-3">
                <select 
                  required
                  value={inquiryType}
                  onChange={(e) => setInquiryType(e.target.value)}
                  className="w-full bg-white/10 px-5 py-4 rounded-[18px] text-[16px] font-medium focus:outline-none focus:ring-2 focus:ring-[#3182F6] appearance-none text-white border border-white/5"
                >
                  <option value="" disabled className="bg-[#191F28]">선택하세요</option>
                  <option className="bg-[#191F28]">원하는 구좌나 가전이 있어요</option>
                  <option className="bg-[#191F28]">일반 렌탈과 비교해보고 싶어요</option>
                  <option className="bg-[#191F28]">만기 조건에 대해 알고 싶어요</option>
                  <option className="bg-[#191F28]">직접 입력하기</option>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none" />
              </div>
              {inquiryType === '직접 입력하기' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                >
                  <textarea 
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="문의 내용을 상세히 입력해주세요"
                    className="w-full bg-white/10 px-5 py-4 rounded-[18px] text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[#3182F6] placeholder:text-white/20 min-h-[120px] border border-white/5"
                  ></textarea>
                </motion.div>
              )}
            </div>
            
            <div className="pt-3 pb-2">
              <label className="flex items-start gap-3 cursor-pointer group px-1">
                <div className="relative flex items-center justify-center w-[22px] h-[22px] rounded-[6px] bg-white/10 border border-white/10 group-hover:border-[#3182F6] transition-colors shrink-0 mt-0.5">
                  <input type="checkbox" required className="opacity-0 absolute" defaultChecked />
                  <Check className="w-3.5 h-3.5 text-[#3182F6]" strokeWidth={4} />
                </div>
                <span className="text-[13px] text-[#8B95A1] leading-[1.6]">
                  [필수] 개인정보 수집·이용 및 제공에 동의합니다.
                </span>
              </label>
            </div>
            
            <button type="submit" className="w-full bg-[#3182F6] hover:bg-[#1B64DA] text-white font-black text-[17px] py-5 rounded-[20px] transition-all mt-4 shadow-[0_8px_20px_rgba(49,130,246,0.3)] active:scale-[0.98]">
              상담 신청 완료
            </button>
          </form>

        </div>
      </section>

      {/* 11-1. Important Notice */}
      <section className="px-6 mb-2">
        <div className="bg-white border border-[#E5E8EB] rounded-[32px] p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Info className="w-5 h-5 text-[#3182F6]" />
            <h4 className="font-bold text-[#191F28] text-[16px]">가입 전 꼭 확인하세요</h4>
          </div>
          <ul className="space-y-4 text-[13px] text-[#4E5968] leading-[1.6] break-keep">
            <li className="flex gap-2">
              <span className="text-[#3182F6] font-bold">•</span>
              <span>가전 계약(렌탈/할부)과 상조 계약은 별도의 독립된 계약입니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#3182F6] font-bold">•</span>
              <span>해약환급금은 납입 기간 및 회차에 따라 상이하며, 중도 해지 시 납입한 금액보다 적거나 없을 수 있습니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#3182F6] font-bold">•</span>
              <span>가전 대금 납입 중 해지 시, 가전 잔여 할부금 및 위약금이 일시 청구될 수 있습니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#3182F6] font-bold">•</span>
              <span>반드시 상품 설명서 및 계약 약관을 확인하시기 바랍니다.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* 12. Footer */}
      <footer className="bg-[#111111] pt-16 pb-32 px-6 text-white border-t border-white/5">
        <div className="max-w-[400px] mx-auto">
          {/* Logo in Footer */}
          <div className="mb-10 opacity-60">
            <img 
              src="https://res.cloudinary.com/dx7l09wwu/image/upload/v1777895641/%ED%9A%A8%EC%9B%90%EC%83%81%EC%A1%B0_%EB%A1%9C%EA%B3%A0_%EA%B0%80%EB%A1%9C_wnz5aa.png" 
              alt="효원상조 로고" 
              className="h-[22px] w-auto object-contain brightness-0 invert"
            />
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 mb-10 px-1">
            <a href="#" className="text-[13px] font-bold text-[#D1D6DB] hover:text-white transition-colors">이용약관</a>
            <a href="#" className="text-[13px] font-bold text-white hover:text-white transition-colors underline underline-offset-4 decoration-white/30">개인정보처리방침</a>
            <button 
              onClick={() => setIsNoticeModalOpen(true)}
              className="text-[13px] font-bold text-[#D1D6DB] hover:text-white transition-colors"
            >
              중요정보고시사항
            </button>
          </div>

          <div className="border-t border-white/5 pt-10">
            {/* Distributor Info */}
            <div className="mb-10 px-1">
              <h5 className="text-[13px] font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-1 h-3 bg-[#3182F6] rounded-full"></span>
                총판사
              </h5>
              <div className="text-[12px] text-[#8B95A1] leading-[1.8] font-medium break-keep">
                <span className="text-white font-bold">(주)라이프앤조이</span> | 대표 : 김지훈<br/>
                경기도 하남시 미사대로 510, 624호(아이에스비즈타워)<br/>
                사업자등록번호: 388-86-02921 | 통신판매신고번호: 2024-경기하남-1853호<br/>
                E-mail: lifenjoy0296@gmail.com | 개인정보보호책임자: 김지훈(lifenjoy0296@gmail.co.kr)<br/>
                <span className="text-[11px] text-white/20 mt-1 block uppercase">Copyright(c)2026 LIFE&JOY Co.,Ltd. All Right Reserved.</span>
              </div>
            </div>

            {/* Service Provider Info */}
            <div className="mb-10 px-1 border-t border-white/5 pt-8">
              <h5 className="text-[13px] font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-1 h-3 bg-[#A3B1C6] rounded-full"></span>
                상조서비스 주관사
              </h5>
              <div className="text-[12px] text-[#8B95A1] leading-[1.8] font-medium break-keep">
                <span className="text-white font-bold">(주)효원상조</span> 대표이사 : 이선주<br/>
                서울시 강동구 풍성로 38길 9, 바로빌딩 3층<br/>
                사업자등록번호 : 126-81-81624 | 선불식할부거래업등록번호 : 서울-2010-제28<br/>
                <span className="text-[11px] text-white/20 mt-1 block uppercase">COPYRIGHT ⓒ (주)효원상조 Co. All Rights Reserved.</span>
              </div>
            </div>

            {/* Customer Center Info */}
            <div className="mb-12 px-1 bg-white/5 rounded-2xl p-5 border border-white/5">
              <h5 className="text-[13px] font-bold text-[#3182F6] mb-4">(주)효원상조 고객센터</h5>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-[#8B95A1]">고객센터</span>
                  <a href="tel:1588-8873" className="text-[18px] font-black text-white hover:text-[#3182F6] transition-colors">1588-8873</a>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[12px] text-[#8B95A1]">24시 긴급행사</span>
                    <span className="text-[10px] text-[#3182F6]">(장례접수)</span>
                  </div>
                  <a href="tel:1577-8873" className="text-[18px] font-black text-white hover:text-[#3182F6] transition-colors">1577-8873</a>
                </div>
              </div>
            </div>
            
            <div className="mb-10 px-1">
              <a 
                href="admin" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-[#3182F6] hover:text-white text-[#A3B1C6] text-[13px] font-bold rounded-xl border border-white/10 transition-all group"
              >
                <LayoutGrid className="w-4 h-4" />
                관리자 전용 페이지
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </a>
            </div>

            <div className="flex items-center justify-between px-1 pt-4 border-t border-white/5">
              <p className="text-[11px] text-white/20 font-medium tracking-tight">© HYOWON. All rights reserved.</p>
              <div className="flex gap-4">
                 <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                   <div className="w-2 h-2 bg-white/10 rounded-full"></div>
                 </div>
                 <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                   <div className="w-2 h-2 bg-white/10 rounded-full"></div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 w-full max-w-[430px] sm:max-w-[480px] md:max-w-[540px] bg-white border-t border-[#F2F4F6] px-5 py-4 pb-6 flex gap-3 z-40 sm:border-x sm:border-[#E5E8EB]">
        <a href="tel:1588-8873" className="flex-1 bg-[#F2F4F6] text-[#333D4B] text-center py-[15px] rounded-[16px] text-[16px] font-bold active:bg-[#D1D6DB] transition-colors">
          전화하기
        </a>
        <button 
          onClick={() => setIsContactModalOpen(true)}
          className="flex-[2] bg-[#3182F6] text-white text-center py-[15px] rounded-[16px] text-[16px] font-bold active:bg-[#1B64DA] transition-colors"
        >
          상담 신청하기
        </button>
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
            className="fixed inset-0 z-[110] bg-white flex flex-col mx-auto w-full max-w-[430px] sm:max-w-[480px] md:max-w-[540px] sm:shadow-[0_0_40px_rgba(0,0,0,0.05)] sm:border-x sm:border-[#E5E8EB]"
          >
            {/* Modal Header */}
            <div className="sticky top-0 w-full bg-white/90 backdrop-blur-md z-10 px-5 flex justify-between items-center h-[60px] border-b border-[#F2F4F6] shrink-0">
              <div className="font-bold text-[16px] truncate pr-4">{selectedProduct.name}</div>
              <button onClick={closeProductDetail} className="p-2 -mr-2 text-[#8B95A1] hover:text-[#191F28] bg-[#F2F4F6] rounded-full transition-colors">
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
                  closeProductDetail();
                  setTimeout(() => {
                    setIsContactModalOpen(true);
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

      {/* Consultation Request Modal */}
      <AnimatePresence>
        {isContactModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[24px] w-full max-w-[400px] overflow-hidden shadow-2xl relative no-scrollbar"
            >
              <button 
                onClick={() => setIsContactModalOpen(false)} 
                className="absolute top-4 right-4 p-2 hover:bg-[#F2F4F6] rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5 text-[#8B95A1]" />
              </button>

              <div className="p-6 pt-10">
                <div className="mb-6">
                  <h2 className="text-[22px] font-bold mb-2">무료 상담 신청</h2>
                  <p className="text-[#4E5968] text-[14px] leading-relaxed break-keep">
                    담당자가 구조를 투명하게 설명해 드립니다.<br/>부담 없이 신청해 보세요.
                  </p>
                </div>

                <form className="space-y-4" onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const finalMessage = inquiryType === '직접 입력하기' ? message : inquiryType;
                    await createInquiry({
                      name,
                      phone,
                      productName: selectedProduct?.name || "전체 상담",
                      message: finalMessage || undefined
                    });
                    alert('상담 신청이 접수되었습니다.');
                    setName('');
                    setPhone('');
                    setInquiryType('');
                    setMessage('');
                    setIsContactModalOpen(false);
                  } catch (err) {
                    alert('상담 신청 중 오류가 발생했습니다.');
                  }
                }}>
                  <div>
                    <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">이름</label>
                    <input 
                      type="text" 
                      required 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="이름을 입력해주세요" 
                      className="w-full bg-[#F2F4F6] px-4 py-3.5 rounded-[16px] text-[16px] font-medium focus:outline-none focus:ring-2 focus:ring-[#3182F6]/50 placeholder:text-[#8B95A1]" 
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">연락처</label>
                    <input 
                      type="tel" 
                      required
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                      placeholder="010-0000-0000" 
                      className="w-full bg-[#F2F4F6] px-4 py-3.5 rounded-[16px] text-[16px] font-medium focus:outline-none focus:ring-2 focus:ring-[#3182F6]/50 placeholder:text-[#8B95A1]" 
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">문의 사항</label>
                    <div className="relative mb-3">
                      <select 
                        required
                        value={inquiryType}
                        onChange={(e) => setInquiryType(e.target.value)}
                        className="w-full bg-[#F2F4F6] px-4 py-3.5 rounded-[16px] text-[16px] font-medium focus:outline-none focus:ring-2 focus:ring-[#3182F6]/50 appearance-none text-[#191F28]"
                      >
                        <option value="" disabled>선택하세요</option>
                        <option>원하는 구좌나 가전이 있어요</option>
                        <option>일반 렌탈과 비교해보고 싶어요</option>
                        <option>만기 조건에 대해 알고 싶어요</option>
                        <option>직접 입력하기</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B95A1] pointer-events-none" />
                    </div>
                    {inquiryType === '직접 입력하기' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                      >
                        <textarea 
                          required
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="문의 내용을 입력해주세요"
                          className="w-full bg-[#F2F4F6] px-4 py-3.5 rounded-[16px] text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[#3182F6]/50 placeholder:text-[#8B95A1] min-h-[100px]"
                        ></textarea>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="pt-2 pb-1">
                    <label className="flex items-start gap-3 cursor-pointer group px-1">
                      <div className="relative flex items-center justify-center w-[20px] h-[20px] rounded-[5px] bg-[#F2F4F6] border border-[#D1D6DB] group-hover:border-[#3182F6] transition-colors shrink-0 mt-0.5">
                        <input type="checkbox" required className="opacity-0 absolute" defaultChecked />
                        <Check className="w-3 h-3 text-[#3182F6]" strokeWidth={4} />
                      </div>
                      <span className="text-[12px] text-[#8B95A1] leading-[1.6]">
                        [필수] 개인정보 수집·이용 및 제공에 동의합니다.
                      </span>
                    </label>
                  </div>
                  
                  <button type="submit" className="w-full bg-[#3182F6] hover:bg-[#1B64DA] text-white font-bold text-[16px] py-4 rounded-[16px] transition-colors mt-2 shadow-lg shadow-[#3182F6]/20">
                    신청 완료
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Important Notice Modal */}
      <AnimatePresence>
        {isNoticeModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[70] flex items-end sm:items-center justify-center"
            onClick={() => setIsNoticeModalOpen(false)}
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-[430px] sm:max-w-[480px] bg-white rounded-t-[32px] sm:rounded-[32px] max-h-[90vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-[#F2F4F6] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-[18px] font-bold">중요정보고시사항</h3>
                <button 
                  onClick={() => setIsNoticeModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F2F4F6] flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-[#8B95A1]" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-8 pb-20 custom-scrollbar">
                <div className="space-y-3">
                  <h4 className="text-[15px] font-bold text-[#1B64DA] flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    중도 해약환급금 및 환급시기
                  </h4>
                  <div className="bg-[#F9FAFB] rounded-2xl p-4 text-[13px] leading-[1.6] text-[#4E5968] space-y-2">
                    <p>• <span className="font-bold">환급기준:</span> 공정거래위원회 상조업 표준약관에 따라 환급 가능</p>
                    <p>• <span className="font-bold">환급시기:</span> 해약신청 후 3영업일 이내 지급</p>
                    <p>• <span className="font-bold">분쟁해결:</span> 공정거래위원회 소비자분쟁해결기준에 따름</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[15px] font-bold text-[#1B64DA] flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    주요 제공물품 및 서비스 내용
                  </h4>
                  <div className="space-y-4">
                    <div className="border-l-2 border-[#F2F4F6] pl-4 space-y-2">
                      <p className="text-[13px] font-bold text-[#191F28]">가. 수의 원단 및 제조 방법</p>
                      <p className="text-[12px] text-[#8B95A1] leading-[1.6]">
                        저마(모시) 90%, 자연섬유 10% (중국산) / 기계직 제조
                      </p>
                    </div>
                    <div className="border-l-2 border-[#F2F4F6] pl-4 space-y-2">
                      <p className="text-[13px] font-bold text-[#191F28]">나. 관의 재질 및 두께 (중국산)</p>
                      <p className="text-[12px] text-[#8B95A1] leading-[1.6]">
                        매장 시: 오동나무 (4.3~4.5cm) / 화장 시: 오동나무 (1.6~1.8cm)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[15px] font-bold text-[#1B64DA] flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    재무 현황 및 고객불입금 관리
                  </h4>
                  <div className="bg-[#191F28] rounded-2xl p-5 text-white space-y-3">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <span className="text-[12px] text-white/60">총 고객 환급 의무액</span>
                      <span className="text-[15px] font-bold">88,468,030,000원</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <span className="text-[12px] text-white/60">선수금 보전 기관</span>
                      <span className="text-[14px] font-bold">상조보증공제조합</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] text-white/60">선수금 보전 비율</span>
                      <span className="text-[14px] font-bold text-[#3182F6]">50% (법정 기준)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F2F4F6]">
                  <p className="text-[11px] text-[#8B95A1] leading-[1.8] text-center break-keep">
                    주식회사 효원상조는 관련 법률을 엄격히 준수하며 고객님의 소중한 자산을 안전하게 보호합니다.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}