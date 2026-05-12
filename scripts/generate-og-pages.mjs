/**
 * Post-build script to generate route-specific HTML files
 * with correct Open Graph meta tags for SNS sharing.
 * 
 * SNS crawlers (KakaoTalk, Facebook, etc.) don't execute JavaScript,
 * so they need static HTML with the correct OG tags at each URL path.
 */
import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const baseHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

const routes = [
  {
    path: 'living',
    title: '해피효원라이프 리빙144-신한카드 | 신한카드만 있으면 누구나 특별한 혜택!',
    description: '해피효원라이프 리빙144-신한카드 | 신한카드만 있으면 누구나 특별한 혜택!',
    image: 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1778564428/Professional_horizontal_landing_page_hero_banner_d-1778564368252_mko2cd.png',
    url: 'https://hyowon-life.com/living',
  },
  {
    path: 'special',
    title: '해피효원라이프 스페셜299-BSON | 카드 한도 관계없이 신용만으로 특별한 혜택!',
    description: '해피효원라이프 스페셜299-BSON | 카드 한도 관계없이 신용만으로 특별한 혜택!',
    image: 'https://res.cloudinary.com/dx7l09wwu/image/upload/v1778564428/Professional_horizontal_web_banner_design_for_Kore-1778564383659_rwnzkq.png',
    url: 'https://hyowon-life.com/special',
  },
];

for (const route of routes) {
  let html = baseHtml;

  // Replace <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`);

  // Replace meta description
  html = html.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${route.description}$2`
  );

  // Replace OG tags
  html = html.replace(
    /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
    `$1${route.title}$2`
  );
  html = html.replace(
    /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
    `$1${route.description}$2`
  );
  html = html.replace(
    /(<meta\s+property="og:image"\s+content=")[^"]*(")/,
    `$1${route.image}$2`
  );
  html = html.replace(
    /(<meta\s+property="og:url"\s+content=")[^"]*(")/,
    `$1${route.url}$2`
  );

  // Replace Twitter tags
  html = html.replace(
    /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/,
    `$1${route.title}$2`
  );
  html = html.replace(
    /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/,
    `$1${route.description}$2`
  );
  html = html.replace(
    /(<meta\s+name="twitter:image"\s+content=")[^"]*(")/,
    `$1${route.image}$2`
  );

  // Replace itemprop image
  html = html.replace(
    /(<meta\s+itemprop="image"\s+content=")[^"]*(")/,
    `$1${route.image}$2`
  );

  // Replace canonical URL
  html = html.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
    `$1${route.url}$2`
  );

  // Write to dist/{route}/index.html
  const routeDir = path.join(distDir, route.path);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, 'index.html'), html, 'utf-8');
  console.log(`✅ Generated: dist/${route.path}/index.html`);
}

console.log('🎉 All SNS OG pages generated successfully!');
