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
    image: 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1778564428/Professional_horizontal_landing_page_hero_banner_d-1778564368252_mko2cd.png'
  },
  {
    name: 'special',
    title: '해피효원라이프 스페셜299-BSON | 카드 한도 관계없이 신용만으로 특별한 혜택!',
    description: '해피효원라이프 스페셜299-BSON | 카드 한도 관계없이 신용만으로 특별한 혜택!',
    image: 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1778564428/Professional_horizontal_web_banner_design_for_Kore-1778564383659_rwnzkq.png'
  },
  {
    name: 'living2',
    title: '해피효원라이프 리빙144-신한카드 2 | 신한카드만 있으면 누구나 특별한 혜택!',
    description: '해피효원라이프 리빙144-신한카드 2 | 신한카드만 있으면 누구나 특별한 혜택!',
    image: 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1778564428/Professional_horizontal_landing_page_hero_banner_d-1778564368252_mko2cd.png'
  },
  {
    name: 'special2',
    title: '해피효원라이프 스페셜299-BSON 2 | 카드 한도 관계없이 신용만으로 특별한 혜택!',
    description: '해피효원라이프 스페셜299-BSON 2 | 카드 한도 관계없이 신용만으로 특별한 혜택!',
    image: 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1778564428/Professional_horizontal_web_banner_design_for_Kore-1778564383659_rwnzkq.png'
  }
];

pages.forEach(page => {
  let content = indexHtml;
  
  // Replace Title
  content = content.replace(/<title>.*?<\/title>/, `<title>${page.title}</title>`);
  
  // Replace Meta Description
  content = content.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${page.description}" />`);
  
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
