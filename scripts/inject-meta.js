import fs from 'fs';
import path from 'path';

const distPath = path.resolve('dist');
const indexPath = path.join(distPath, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('index.html not found in dist/ folder. Run npm run build first.');
  process.exit(1);
}

const indexHtml = fs.readFileSync(indexPath, 'utf-8');

const pages = [
  {
    name: 'living',
    title: '해피효원라이프 리빙144-신한카드 | 신한카드만 있으면 누구나 특별한 혜택!',
    description: '해피효원라이프 리빙144-신한카드 | 신한카드만 있으면 누구나 특별한 혜택!',
    image: 'https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674844/living144_og_image_f6gghd.png'
  },
  {
    name: 'special',
    title: '해피효원라이프 스페셜299-BSON | 카드 한도 관계없이 신용만으로 특별한 혜택!',
    description: '해피효원라이프 스페셜299-BSON | 카드 한도 관계없이 신용만으로 특별한 혜택!',
    image: 'https://res.cloudinary.com/dfkntvpmv/image/upload/v1781676343/special299_og_image_j7024p.png'
  },
  {
    name: 'living2',
    title: '해피효원라이프 리빙144-신한카드 2 | 신한카드만 있으면 누구나 특별한 혜택!',
    description: '해피효원라이프 리빙144-신한카드 2 | 신한카드만 있으면 누구나 특별한 혜택!',
    image: 'https://res.cloudinary.com/dfkntvpmv/image/upload/v1781674844/living144_og_image_f6gghd.png'
  },
  {
    name: 'special2',
    title: '해피효원라이프 스페셜299-BSON 2 | 카드 한도 관계없이 신용만으로 특별한 혜택!',
    description: '해피효원라이프 스페셜299-BSON 2 | 카드 한도 관계없이 신용만으로 특별한 혜택!',
    image: 'https://res.cloudinary.com/dfkntvpmv/image/upload/v1781676343/special299_og_image_j7024p.png'
  },
  {
    name: 'kcc',
    title: 'KCC홈씨씨-LG전자-효원상조 제휴 결합상품',
    description: 'KCC홈씨씨-LG전자-효원상조 제휴 프로모션 안내\nLG가전 최대 30% 저렴하게, 320만원 혜택 지원까지!',
    image: 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1779251513/Edit_this_image_to_create_a_professional_KakaoTalk-1779251495541_e6e6hq.png'
  },
  {
    name: 'package60',
    title: '가전상조 60패키지 (쇼핑몰) - 프리미엄 가전 100% 소유 + 효원상조 혜택',
    description: '월 29,900원부터! 60회 만기 시 가전 완납 소유 및 상조 만기 시 가전 렌탈료 100% 전액 환급 지원!',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500'
  },
  {
    name: 'package_up',
    title: '가전상조 60패키지 (UP가전) - 프리미엄 가전 100% 소유 + 효원상조 혜택',
    description: '월 29,900원부터! 60회 만기 시 가전 완납 소유 및 상조 만기 시 가전 렌탈료 100% 전액 환급 지원!',
    image: 'https://res.cloudinary.com/dfkntvpmv/image/upload/v1781620540/Professional_hero_section_image_featuring_a_confid-1778653149667_owqlgb.png'
  },
  {
    name: 'care',
    title: '효원상조 X LG가전구독 | 회원 특별할인 & 만기 100% 전액환급',
    description: 'LG전자 공식 가전구독에 효원상조 혜택을 더하다! 회원 특별할인 지원 + 만기 100% 전액환급 & 축하금 지원. 본사 100% 무상 케어 서비스까지.',
    image: 'https://res.cloudinary.com/lyjyvy54/image/upload/v1787663880/%EC%A0%9C%EB%AA%A9%EC%9D%84_%EC%9E%85%EB%A0%A5%ED%95%B4%EC%A3%BC%EC%84%B8%EC%9A%94._14_x1xbix.png'
  },
  {
    name: 'care10',
    title: '효원상조 X LG가전구독 | 매월 10% 추가할인 & 만기 100% 전액환급',
    description: 'LG전자 공식 가전구독에 효원상조 혜택을 더하다! 매월 10% 추가할인 + 만기 100% 전액환급 & 만기축하금 지원. 본사 100% 무상 케어 서비스까지.',
    image: 'https://res.cloudinary.com/lyjyvy54/image/upload/v1787294543/%EC%A0%9C%EB%AA%A9%EC%9D%84_%EC%9E%85%EB%A0%A5%ED%95%B4%EC%A3%BC%EC%84%B8%EC%9A%94._13_crzmtj.png'
  },
  {
    name: 'lgsub',
    title: '효원상조 X LG가전구독 | 회원 특별할인 & 만기 100% 전액환급',
    description: 'LG전자 공식 가전구독에 효원상조 혜택을 더하다! 회원 특별할인 지원 + 만기 100% 전액환급 & 축하금 지원. 본사 100% 무상 케어 서비스까지.',
    image: 'https://res.cloudinary.com/lyjyvy54/image/upload/v1787663880/%EC%A0%9C%EB%AA%A9%EC%9D%84_%EC%9E%85%EB%A0%A5%ED%95%B4%EC%A3%BC%EC%84%B8%EC%9A%94._14_x1xbix.png'
  }
];

pages.forEach(page => {
  let content = indexHtml;
  
  // Replace Title
  content = content.replace(/<title>.*?<\/title>/, `<title>${page.title}</title>`);
  
  // Replace Meta Description & Keywords
  content = content.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${page.description}" />`);
  if (page.keywords) {
    content = content.replace(/<meta name="keywords" content=".*?" \/>/, `<meta name="keywords" content="${page.keywords}" />`);
  }
  
  // Replace OG Tags
  content = content.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${page.title}" />`);
  content = content.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${page.description}" />`);
  content = content.replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${page.image}" />`);
  content = content.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="https://hyowon-life.com/${page.name}" />`);
  
  // Replace itemprop
  content = content.replace(/<meta itemprop="image" content=".*?" \/>/, `<meta itemprop="image" content="${page.image}" />`);

  // Replace Twitter Tags
  content = content.replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${page.title}" />`);
  content = content.replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${page.description}" />`);
  content = content.replace(/<meta name="twitter:image" content=".*?" \/>/, `<meta name="twitter:image" content="${page.image}" />`);

  const pageDir = path.join(distPath, page.name);
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(pageDir, 'index.html'), content);
  console.log(`Generated SEO-friendly HTML for /${page.name}`);
});

// Generate 404.html fallback for client-side routing (Vercel, GitHub Pages, etc.)
const fourOhFourPath = path.join(distPath, '404.html');
fs.writeFileSync(fourOhFourPath, indexHtml);
console.log('Generated 404.html fallback for robust client-side SPA routing.');

