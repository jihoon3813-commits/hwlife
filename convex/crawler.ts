import { action } from "./_generated/server";
import { v } from "convex/values";

const categories = [
  'refrigerators',
  'kimchi-refrigerators',
  'convertible-refrigerators',
  'washers',
  'dryers',
  'wash-tower',
  'styler',
  'dishwashers',
  'ovens',
  'water-purifiers',
  'cleaners',
  'air-cleaners',
  'air-conditioners',
  'tvs',
  'monitors',
  'laptops'
];

async function resolveProductUrl(modelCode: string, refUrl?: string): Promise<string | null> {
  const cleanCode = modelCode.trim();
  
  if (refUrl && refUrl.includes('lge.co.kr') && !refUrl.endsWith('/home') && refUrl.length > 30) {
    return refUrl;
  }

  const variations: string[] = [];
  const lower = cleanCode.toLowerCase();
  variations.push(lower);

  if (/-[a-z]$/i.test(cleanCode)) {
    const base = lower.replace(/-[a-z]$/i, '');
    variations.push(base + '2');
    variations.push(base + '1');
    variations.push(base + '3');
    variations.push(base);
  } else if (!/\d$/.test(cleanCode)) {
    variations.push(lower + '2');
    variations.push(lower + '1');
  }

  for (const code of variations) {
    for (const cat of categories) {
      const candidateUrl = `https://www.lge.co.kr/${cat}/${code}`;
      try {
        const res = await fetch(candidateUrl, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (res.status === 200) {
          return candidateUrl;
        }
      } catch (e) {}
    }
  }

  try {
    const query = `site:lge.co.kr ${cleanCode}`;
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(ddgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const html = await res.text();
      const matches = html.match(/uddg=https%3A%2F%2Fwww\.lge\.co\.kr%2F([a-zA-Z0-9_-]+)%2F([a-zA-Z0-9_-]+)/gi);
      if (matches) {
        for (const m of matches) {
          const url = decodeURIComponent(m.replace('uddg=', ''));
          if (!url.includes('/search') && !url.includes('/bestshop') && !url.includes('/event')) {
            return url;
          }
        }
      }
    }
  } catch (e) {}

  return null;
}

async function scrapeSingleModel(modelCode: string, refUrl?: string) {
  const url = await resolveProductUrl(modelCode, refUrl);
  if (!url) {
    return {
      success: false,
      model: modelCode,
      name: `LG ${modelCode}`,
      brand: 'LG전자',
      category: '가전',
      thumbnail: '',
      detailImages: [],
      specifications: [],
      error: 'Product page not found'
    };
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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

    // A. 썸네일 리스트 (Thumbnails): 중복 이미지 원천 차단 (모바일 크롭 -m/_mo 제외, 앵글 키 정규화, 인테리어/연출 컷 중복 제거)
    const galleryImgs = rawImgs.filter(img => 
      img.includes('/gallery/') &&
      !img.includes('small') &&
      !img.includes('-m0')
    );

    // 모바일 크롭 버전(-m1, _mo, -mo, _MO_) 제외하고 PC 원본 이미지 우선 선택
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
      // medium 보다 large 해상도 우선
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

      // 인테리어 / 룸 연출 컷 관련 썸네일 중복 방지 (interior, scene 등)
      if (cleanKey.includes('interior') || cleanKey.includes('scene') || cleanKey.includes('gallery_2000x2402')) {
        cleanKey = 'interior_scene_primary';
      }

      if (!seenKeys.has(cleanKey)) {
        seenKeys.add(cleanKey);
        uniqueGallery.push(img);
      }
    }

    const mainThumbnail = uniqueGallery.length > 0 ? uniqueGallery[0] : ogThumbnail;

    // B. 상세 이미지 리스트 (Detail Images): 사용자 직접 등록 요구사항에 따라 크롤링 시 비워둠
    const finalDetailImages: string[] = [];

    // 4. Extract Full Expanded Product Specifications (제품 스펙 더보기 영역) directly from Page HTML
    let specifications: Array<{ category?: string; name: string; value: string }> = [];

    // A. Parse summary list specs (e.g. <li> 전체 용량 (L) : 870 </li>)
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

    // B. Parse full expanded spec sections & dl/dt/dd pairs (제품 스펙 더보기 영역)
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
          // Strip data-* attributes first so data-spec-description tooltips are NOT parsed
          const dtHtmlClean = dtMatch[1].replace(/data-[a-z0-9_-]+=(["'])[\s\S]*?\1/gi, '');
          const ddHtmlClean = ddMatch[1].replace(/data-[a-z0-9_-]+=(["'])[\s\S]*?\1/gi, '');

          let name = dtHtmlClean.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          let value = ddHtmlClean.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

          // Filter out noise explanations
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

    // Dual product handling: Scrape info for both models
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
      // Special Rule: 2가지 제품 결합 시 썸네일은 가져오지 않음 (사용자가 직접 입력)
      thumbnail: '',
      thumbnails: [],
      detailImages: combinedDetailImages,
      specifications: combinedSpecs,
      price: String(args.price || '0').replace(/\D/g, ''),
      isDual: true
    };
  }
});
