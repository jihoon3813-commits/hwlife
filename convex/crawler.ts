import { action } from "./_generated/server";
import { v } from "convex/values";

const categories = [
  'air-purifier', 'air-purifiers',
  'dehumidifiers', 'dehumidifier',
  'washing-machines', 'washers', 'washing-machine',
  'refrigerators', 'refrigerator',
  'kimchi-refrigerators', 'kimchi-refrigerator',
  'convertible-refrigerators',
  'dryers', 'dryer',
  'wash-tower', 'washtower', 'wash-tower-set',
  'styler', 'lg-styler', 'style-care',
  'dishwashers', 'dishwasher',
  'ovens', 'cooking-appliances', 'electric-ranges',
  'water-purifiers', 'water-purifier', 'water-care',
  'cleaners', 'vacuum-cleaners', 'robot-cleaners',
  'air-conditioners', 'air-conditioner', 'system-air-conditioners',
  'tvs', 'tv', 'oled-tvs', 'qned-tvs', 'stanbyme',
  'monitors', 'monitor', 'gaming-monitors',
  'laptops', 'notebook', 'notebooks', 'gram',
  'projectors', 'cinebeam',
  'audio', 'soundbars', 'speakers',
  'care-accessories', 'accessories'
];

function cleanModelCode(raw: string): string {
  let cleaned = raw.trim();
  cleaned = cleaned.split('.')[0].split('-')[0];
  return cleaned;
}

function generate80PercentVariations(modelCode: string): string[] {
  const rawModel = modelCode.trim();
  const clean = cleanModelCode(rawModel);
  const lower = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
  const set = new Set<string>();

  set.add(rawModel.toLowerCase());
  set.add(clean.toLowerCase());
  set.add(lower);

  // Generate prefix variations down to 70% length (enables >= 80% partial/prefix matches)
  const minLen = Math.max(4, Math.floor(lower.length * 0.7));
  for (let len = lower.length; len >= minLen; len--) {
    set.add(lower.slice(0, len));
  }

  return Array.from(set);
}

function isValidProductRefUrl(refUrl?: string, modelCode?: string): boolean {
  if (!refUrl || typeof refUrl !== 'string') return false;
  if (!refUrl.includes('lge.co.kr')) return false;
  const lower = refUrl.toLowerCase();
  
  if (
    lower.endsWith('/home') ||
    lower.endsWith('/main') ||
    lower.includes('/care-solutions') ||
    lower.includes('/category') ||
    lower.includes('/search') ||
    lower.includes('/business') ||
    lower.includes('/event') ||
    lower.includes('/support') ||
    lower.includes('/bestshop') ||
    lower.includes('/story') ||
    lower.includes('/company') ||
    lower.includes('/upload') ||
    lower.includes('/ebook') ||
    lower.includes('/cart') ||
    lower.includes('/my-page')
  ) {
    return false;
  }

  const afterDomain = lower.split('lge.co.kr/')[1]?.split('?')[0];
  if (!afterDomain || afterDomain.startsWith('kr/')) return false;

  const parts = afterDomain.split('/').filter(Boolean);
  if (parts.length < 2) return false;

  return true;
}

async function resolveProductUrl(modelCode: string, refUrl?: string): Promise<string | null> {
  const rawModel = modelCode.trim();
  const cleanCode = cleanModelCode(rawModel);
  
  if (isValidProductRefUrl(refUrl, cleanCode)) {
    return refUrl!;
  }

  const variations = generate80PercentVariations(rawModel);

  // 1. Fast parallel probe across categories (10 at a time)
  for (const code of variations) {
    for (let i = 0; i < categories.length; i += 10) {
      const batch = categories.slice(i, i + 10);
      const results = await Promise.all(batch.map(async (cat) => {
        const candidateUrl = `https://www.lge.co.kr/${cat}/${code}`;
        try {
          const res = await fetch(candidateUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept-Language': 'ko-KR,ko;q=0.9'
            }
          });
          if (res.status === 200) {
            const text = await res.text();
            if (text.includes('digitalData') || text.includes('og:title') || text.includes('gallery') || text.includes('productInfo')) {
              return candidateUrl;
            }
          }
        } catch (e) {}
        return null;
      }));

      const found = results.find(Boolean);
      if (found) return found;
    }
  }

  // 2. Search fallback via Naver & Daum site search
  const searchQueries = [
    `site:lge.co.kr ${cleanCode}`,
    `site:lge.co.kr ${codeBase}`
  ];

  for (const q of searchQueries) {
    try {
      const naverUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(q)}`;
      const res = await fetch(naverUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (res.ok) {
        const html = await res.text();
        const matches = html.match(/https?:\/\/(www\.)?lge\.co\.kr\/[a-zA-Z0-9_\-]+\/[a-zA-Z0-9_\-]+/gi);
        if (matches) {
          const valid = Array.from(new Set(matches)).filter(u => isValidProductRefUrl(u, cleanCode));
          if (valid.length > 0) return valid[0];
        }
      }
    } catch(e) {}

    try {
      const daumUrl = `https://search.daum.net/search?w=tot&q=${encodeURIComponent(q)}`;
      const res = await fetch(daumUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (res.ok) {
        const html = await res.text();
        const matches = html.match(/https?:\/\/(www\.)?lge\.co\.kr\/[a-zA-Z0-9_\-]+\/[a-zA-Z0-9_\-]+/gi);
        if (matches) {
          const valid = Array.from(new Set(matches)).filter(u => isValidProductRefUrl(u, cleanCode));
          if (valid.length > 0) return valid[0];
        }
      }
    } catch(e) {}
  }

  return null;
}

async function scrapeSearchFallback(modelCode: string) {
  const cleanCode = cleanModelCode(modelCode);
  const query = `LG전자 ${cleanCode}`;

  try {
    const naverUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(query)}`;
    const res = await fetch(naverUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9'
      }
    });
    if (res.ok) {
      const html = await res.text();
      let name = '';
      let img = '';

      const imgMatch = html.match(/https:\/\/search\.pstatic\.net\/[^"'\s\>\&]+\.(jpg|png|webp|jpeg)/i);
      if (imgMatch) img = imgMatch[0];

      const titleMatch = html.match(/LG\s*[^<\r\n"']*(?:오브제|퓨리케어|트롬|휘센|디오스|통돌이|그램|울트라|올레드|스탠바이미|스타일러|코드제로|워시타워)[^<\r\n"']*/i);
      if (titleMatch) {
        name = titleMatch[0].replace(/<[^>]+>/g, '').replace(/&lt;[^&]+&gt;/g, '').trim();
      }

      if (name || img) {
        return {
          success: true,
          model: modelCode,
          name: name || `LG ${modelCode}`,
          brand: 'LG전자',
          category: '가전',
          thumbnail: img,
          thumbnails: img ? [img] : [],
          detailImages: [],
          specifications: []
        };
      }
    }
  } catch(e) {}

  return {
    success: false,
    model: modelCode,
    name: `LG ${modelCode}`,
    brand: 'LG전자',
    category: '가전',
    thumbnail: '',
    thumbnails: [],
    detailImages: [],
    specifications: [],
    error: 'Product search fallback failed'
  };
}

async function scrapeSingleModel(modelCode: string, refUrl?: string) {
  const url = await resolveProductUrl(modelCode, refUrl);
  if (!url) {
    return await scrapeSearchFallback(modelCode);
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();

    let name = '';
    let category = '가전';
    let brand = 'LG전자';

    // 1. Extract digitalData & productInfo
    const productInfoMatch = html.match(/digitalData\.productInfo\s*=\s*(\{[\s\S]*?\});/);
    if (productInfoMatch) {
      try {
        const infoStr = productInfoMatch[1].replace(/,\s*\}/g, '}');
        const nameM = infoStr.match(/"model_name"\s*:\s*"([^"]+)"/);
        const catM = infoStr.match(/"category"\s*:\s*"([^"]+)"/);
        if (nameM) name = nameM[1];
        if (catM) {
          const parts = catM[1].split('/');
          category = parts[1] || parts[0] || category;
        }
      } catch (e) {}
    }

    if (!name) {
      const ogTitleM = html.match(/property=["']og:title["']\s+content=["']([^"']+)["']/i) || html.match(/content=["']([^"']+)["']\s+property=["']og:title["']/i);
      if (ogTitleM) {
        const parts = ogTitleM[1].split('|').map(s => s.trim());
        name = parts[0] || `LG ${modelCode}`;
        if (parts.length >= 3) category = parts[parts.length - 3] || category;
      }
    }

    // 2. Extract Thumbnail
    const ogImageM = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i) || html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i);
    const ogThumbnail = ogImageM ? ogImageM[1] : '';

    // 3. Extract All Images (relative & absolute paths)
    const relMatches = html.match(/["'](\/(kr|lg5-common)?\/images\/[^\s"'\\]+\.(jpg|png|webp|gif))["']/gi) || [];
    const absMatches = html.match(/https:\/\/www\.lge\.co\.kr\/(kr|lg5-common)?\/images\/[^\s"']+\.(jpg|png|webp|gif)/gi) || [];

    const rawImgs = Array.from(new Set([
      ...relMatches.map(s => s.replace(/["']/g, '')).map(s => s.startsWith('http') ? s : `https://www.lge.co.kr${s}`),
      ...absMatches
    ]));

    // A. 썸네일 리스트 (Thumbnails)
    const galleryImgs = rawImgs.filter(img => 
      img.includes('/gallery/') &&
      !img.includes('small') &&
      !img.includes('-m0')
    );

    const pcOnlyGallery = galleryImgs.filter(img => {
      const lower = img.toLowerCase();
      return !/[-_]m\d+/i.test(lower) && 
             !/[-_]mo[\._]/i.test(lower) &&
             !/[-_]mo_/i.test(lower);
    });

    const candidates = pcOnlyGallery.length > 0 ? pcOnlyGallery : galleryImgs;

    const uniqueGallery: string[] = [];
    const seenKeys = new Set<string>();

    for (const img of candidates) {
      if (img.includes('medium') && candidates.some(c => c.includes(img.replace('medium', 'large')))) {
        continue;
      }

      const filename = img.split('/').pop() || '';
      let cleanKey = filename
        .replace(/^(small|medium|large)[-_]?/gi, '')
        .replace(/[-_]m(\d+)/gi, '$1')
        .replace(/[-_]mo[\._]/gi, '.')
        .replace(/\.(jpg|png|webp|gif)$/i, '')
        .toLowerCase();

      if (cleanKey.includes('interior') || cleanKey.includes('scene') || cleanKey.includes('gallery_2000x2402')) {
        cleanKey = 'interior_scene_primary';
      }

      if (!seenKeys.has(cleanKey)) {
        seenKeys.add(cleanKey);
        uniqueGallery.push(img);
      }
    }

    const mainThumbnail = uniqueGallery.length > 0 ? uniqueGallery[0] : ogThumbnail;
    const finalDetailImages: string[] = [];

    // 4. Extract Full Expanded Product Specifications
    let specifications: Array<{ category?: string; name: string; value: string }> = [];

    const summaryMatches = Array.from(html.matchAll(/<li>\s*([^:]+)\s*:\s*([^<]+)<\/li>/gi));
    for (const m of summaryMatches) {
      const k = m[1].replace(/<[^>]+>/g, '').trim();
      const v = m[2].replace(/<[^>]+>/g, '').trim();
      if (k && v && k.length < 30 && v.length < 100 && !k.includes('이용자') && !k.includes('권리') && !k.includes('크롬')) {
        if (!specifications.some(s => s.name === k)) {
          specifications.push({ category: '스펙 요약', name: k, value: v });
        }
      }
    }

    const specSectionMatches = Array.from(html.matchAll(/<div[^>]*class=["'][^"']*(spec-info-title|tit)[^"']*["'][^>]*>\s*([\s\S]*?)\s*<\/div>\s*<div[^>]*class=["'][^"']*spec-info-list[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi));

    for (const match of specSectionMatches) {
      const categoryRaw = match[2].replace(/<[^>]+>/g, '').trim();
      const category = categoryRaw || '상세 사양';
      const listHtml = match[3];

      const dlMatches = Array.from(listHtml.matchAll(/<dl[^>]*>([\s\S]*?)<\/dl>/gi));
      for (const dl of dlMatches) {
        const dlContent = dl[1];
        const dtMatch = dlContent.match(/<dt[^>]*>([\s\S]*?)<\/dt>/i);
        const ddMatch = dlContent.match(/<dd[^>]*>([\s\S]*?)<\/dd>/i);

        if (dtMatch && ddMatch) {
          const dtHtmlClean = dtMatch[1].replace(/data-[a-z0-9_-]+=(["'])[\s\S]*?\1/gi, '');
          const ddHtmlClean = ddMatch[1].replace(/data-[a-z0-9_-]+=(["'])[\s\S]*?\1/gi, '');

          let name = dtHtmlClean.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          let value = ddHtmlClean.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

          value = value.replace(/본 이미지는 사이즈에 대한 이해를 돕기 위한 것으로[\s\S]*/g, '').trim();
          value = value.replace(/\*\s*소비자의 이해를 돕기 위해[\s\S]*/g, '').trim();

          if (name && value && name.length < 50 && value.length < 300) {
            if (!specifications.some(s => s.name === name)) {
              specifications.push({ category, name, value });
            }
          }
        }
      }
    }

    return {
      success: true,
      model: modelCode,
      name: name || `LG ${modelCode}`,
      brand,
      category,
      thumbnail: mainThumbnail,
      thumbnails: uniqueGallery,
      detailImages: finalDetailImages,
      specifications
    };
  } catch (e: any) {
    return {
      success: false,
      model: modelCode,
      name: `LG ${modelCode}`,
      brand: 'LG전자',
      category: '가전',
      thumbnail: '',
      thumbnails: [],
      detailImages: [],
      specifications: [],
      error: e?.message || 'Scrape failed'
    };
  }
}

export const scrapeProductInfo = action({
  args: {
    model: v.string(),
    price: v.string(),
    refUrl: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const rawModel = args.model.trim();
    const modelParts = rawModel.split(/[\+,\/]/).map(s => s.trim()).filter(Boolean);
    const isDual = modelParts.length > 1;

    if (!isDual) {
      const data = await scrapeSingleModel(modelParts[0], args.refUrl);
      return {
        ...data,
        price: String(args.price || '0').replace(/\D/g, ''),
        isDual: false
      };
    }

    // Dual product handling
    const results = [];
    for (const m of modelParts) {
      results.push(await scrapeSingleModel(m, args.refUrl));
    }

    const combinedName = results.map(r => r.name).join(' + ');
    const combinedModel = results.map(r => r.model).join('+');
    const combinedCategory = results[0]?.category || '가전/패키지';
    const combinedBrand = results[0]?.brand || 'LG전자';
    const combinedDetailImages = Array.from(new Set(results.flatMap(r => r.detailImages)));
    const combinedSpecs = results.flatMap((r, i) => 
      (r.specifications || []).map(s => ({
        ...s,
        category: `[제품 ${i + 1}] ${s.category || '스펙'}`
      }))
    );

    return {
      success: results.some(r => r.success),
      model: combinedModel,
      name: combinedName,
      brand: combinedBrand,
      category: combinedCategory,
      thumbnail: '',
      thumbnails: [],
      detailImages: combinedDetailImages,
      specifications: combinedSpecs,
      price: String(args.price || '0').replace(/\D/g, ''),
      isDual: true
    };
  }
});
