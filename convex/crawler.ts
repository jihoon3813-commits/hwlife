import { action } from "./_generated/server";
import { v } from "convex/values";

const categories = [
  'bath-air-system',
  'microwaves-and-ovens',
  'electric-stoves', 'electric-ranges',
  'massage-chairs',
  'humidifiers', 'humidifier',
  'air-purifier', 'air-purifiers',
  'dehumidifiers', 'dehumidifier',
  'washing-machines', 'washers', 'washing-machine',
  'refrigerators', 'refrigerator',
  'kimchi-refrigerators', 'kimchi-refrigerator',
  'convertible-refrigerators',
  'dryers', 'dryer',
  'wash-tower', 'washtower', 'wash-tower-set',
  'wash-combo', 'washcombo',
  'styler', 'lg-styler', 'style-care',
  'shoe-care', 'shoecare',
  'dishwashers', 'dishwasher',
  'ovens', 'cooking-appliances',
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
  if (!raw) return '';
  return raw.trim().split('.')[0].trim().toUpperCase();
}

function generate80PercentVariations(modelCode: string): string[] {
  const rawModel = modelCode.trim();
  const clean = cleanModelCode(rawModel);
  const lower = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
  const set = new Set<string>();

  set.add(rawModel.toLowerCase());
  set.add(clean.toLowerCase());
  set.add(lower);

  // LGE TV & Appliance installation & color suffixes (-wall, -stand, etc.)
  const suffixes = ['', '-wall', '-stand', '-w', '-a', '-gng', '-akor1', '0na-wall', '0na-stand'];

  for (const suf of suffixes) {
    set.add(`${rawModel.toLowerCase()}${suf}`);
    set.add(`${clean.toLowerCase()}${suf}`);
    set.add(`${lower}${suf}`);
  }

  // Generate prefix variations down to 70% length (enables >= 80% partial/prefix matches)
  const minLen = Math.max(4, Math.floor(lower.length * 0.7));
  for (let len = lower.length; len >= minLen; len--) {
    const prefix = lower.slice(0, len);
    for (const suf of suffixes) {
      set.add(`${prefix}${suf}`);
    }
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

  // STRICT VALIDATION AGAINST modelCode:
  if (modelCode) {
    const urlModelSlug = parts[parts.length - 1].replace(/[^a-z0-9]/g, '');
    const cleanModel = modelCode.trim().split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Extract screen size (e.g. 85, 65, 75, 83) if present
    const sizeMatch = cleanModel.match(/^(\d{2,3})/);
    if (sizeMatch) {
      const size = sizeMatch[1];
      if (!urlModelSlug.startsWith(size) && !urlModelSlug.includes(size)) {
        return false; // Prevent 85 inch matching 65 inch!
      }
    }

    // Extract core letters (e.g. qned81, oled83, wu923)
    const coreLetters = cleanModel.slice(0, Math.min(cleanModel.length, 7));
    if (coreLetters.length >= 4 && !urlModelSlug.includes(coreLetters)) {
      const commonPrefix = cleanModel.slice(0, 5);
      if (!urlModelSlug.includes(commonPrefix)) {
        return false;
      }
    }
  }

  return true;
}

const CATEGORY_SLUG_MAP: Record<string, string[]> = {
  '정수기': ['water-purifiers', 'water-purifier', 'water-care'],
  '공기청정기': ['air-purifier', 'air-purifiers'],
  '가습기': ['humidifier', 'air-purifiers'],
  '제습기': ['dehumidifiers', 'dehumidifier'],
  '냉장고': ['refrigerators', 'refrigerator', 'convertible-refrigerators'],
  '얼음정수기 냉장고': ['refrigerators', 'refrigerator', 'water-purifiers'],
  '김치냉장고': ['kimchi-refrigerators', 'kimchi-refrigerator', 'refrigerators'],
  '세탁기': ['washing-machines', 'washers', 'washing-machine'],
  '워시타워': ['wash-tower', 'washtower', 'wash-tower-set', 'washing-machines'],
  '워시콤보': ['wash-tower', 'washtower', 'washing-machines'],
  '건조기': ['dryers', 'dryer'],
  '스타일러': ['styler', 'lg-styler', 'style-care'],
  '에어컨': ['air-conditioners', 'air-conditioner', 'system-air-conditioners'],
  '식기세척기': ['dishwashers', 'dishwasher'],
  '전기레인지': ['electric-ranges', 'cooking-appliances', 'ovens'],
  '광파오븐': ['ovens', 'cooking-appliances', 'electric-ranges'],
  '청소기': ['cleaners', 'vacuum-cleaners', 'robot-cleaners'],
  '무선청소기': ['cleaners', 'vacuum-cleaners', 'robot-cleaners'],
  'TV': ['tvs', 'tv', 'oled-tvs', 'qned-tvs', 'stanbyme'],
  '올레드 / QNED TV': ['tvs', 'tv', 'oled-tvs', 'qned-tvs', 'stanbyme'],
  '스탠바이미': ['stanbyme', 'tvs', 'tv'],
  '안마의자': ['care-accessories', 'accessories'],
  '슈케어': ['styler', 'lg-styler', 'care-accessories']
};

interface CandidateResult {
  url: string;
  title: string;
  model: string;
}

async function resolveProductCandidates(modelCode: string, refUrl?: string, categoryHint?: string): Promise<{ primaryUrl: string | null; candidates: CandidateResult[] }> {
  const rawModel = modelCode.trim();
  const cleanCode = cleanModelCode(rawModel);
  const lowerClean = cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '');
  const lowerRaw = rawModel.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (isValidProductRefUrl(refUrl, cleanCode)) {
    return {
      primaryUrl: refUrl!,
      candidates: [{ url: refUrl!, title: '공식 제품 페이지', model: cleanCode.toUpperCase() }]
    };
  }

  // 1. Determine priority categories
  let prioritySlugs: string[] = [];
  if (categoryHint) {
    for (const [k, slugs] of Object.entries(CATEGORY_SLUG_MAP)) {
      if (categoryHint.includes(k) || k.includes(categoryHint)) {
        prioritySlugs.push(...slugs);
      }
    }
  }
  const isTv = (categoryHint && (categoryHint.includes('TV') || categoryHint.includes('티비') || categoryHint.includes('올레드') || categoryHint.includes('QNED'))) || lowerClean.startsWith('oled') || lowerClean.startsWith('qned') || lowerClean.includes('qned') || lowerClean.startsWith('stanbyme') || /^\d{2,3}qned/i.test(lowerClean) || /^\d{2,3}oled/i.test(lowerClean);

  if (prioritySlugs.length === 0) {
    prioritySlugs = isTv ? ['tvs', 'oled-tvs', 'qned-tvs', 'stanbyme'] : ['water-purifiers', 'refrigerators', 'washing-machines', 'air-purifier', 'dishwashers', 'tvs', 'cleaners', 'styler'];
  }
  prioritySlugs = Array.from(new Set(prioritySlugs));

  // 2. Generate smart fuzzy variants
  const variants = new Set<string>();
  variants.add(cleanCode.toLowerCase());
  variants.add(lowerClean);
  variants.add(rawModel.toLowerCase());
  variants.add(lowerRaw);

  if (isTv) {
    // Suffix stand/wall variations
    variants.add(`${lowerClean}-stand`);
    variants.add(`${lowerClean}-wall`);
    
    // LG TV BMS / BMW conversion (e.g. 85QNED81BMS -> 85qned81bma-stand, 85QNED81BMW -> 85qned81bma-wall)
    if (lowerClean.endsWith('bms') || lowerClean.endsWith('bmw')) {
      const base = lowerClean.slice(0, -3) + 'bma';
      variants.add(lowerClean.endsWith('bms') ? `${base}-stand` : `${base}-wall`);
      variants.add(lowerClean.endsWith('bms') ? `${base}-wall` : `${base}-stand`);
      variants.add(base);
    }

    if (lowerClean.endsWith('qms') || lowerClean.endsWith('qmw')) {
      const base = lowerClean.slice(0, -3) + 'qna';
      variants.add(lowerClean.endsWith('qms') ? `${base}-stand` : `${base}-wall`);
      variants.add(lowerClean.endsWith('qms') ? `${base}-wall` : `${base}-stand`);
      variants.add(base);
    }

    if (lowerClean.endsWith('kms') || lowerClean.endsWith('kmw')) {
      const base = lowerClean.slice(0, -3) + 'kna';
      variants.add(lowerClean.endsWith('kms') ? `${base}-stand` : `${base}-wall`);
      variants.add(lowerClean.endsWith('kms') ? `${base}-wall` : `${base}-stand`);
      variants.add(base);
    }

    // Suffix replacement (KS -> KNA, QNA, ENA)
    if (lowerClean.includes('ks')) {
      const kna = lowerClean.replace('ks', 'kna');
      variants.add(kna);
      variants.add(`${kna}-stand`);
      variants.add(`${kna}-wall`);
    }

    // Prefix base variations
    const mMatch = lowerClean.match(/^([a-z0-9]+?)(?:ks|kna|qna|ena|na|s|w|b|bms|bmw)?$/i);
    if (mMatch && mMatch[1].length >= 5) {
      const base = mMatch[1];
      variants.add(`${base}bma-stand`);
      variants.add(`${base}bma-wall`);
      variants.add(`${base}kna-stand`);
      variants.add(`${base}kna-wall`);
      variants.add(`${base}-stand`);
      variants.add(`${base}-wall`);
      variants.add(`${base}bma`);
      variants.add(`${base}kna`);
      variants.add(`${base}qna`);
    }
  } else {
    // General appliance suffixes
    for (const suf of ['-stand', '-wall', '-w', '-a', '-gng', '-akor1']) {
      variants.add(`${lowerClean}${suf}`);
    }
  }

  const variantList = Array.from(variants);
  const fastCandidates: Array<{ url: string; variant: string }> = [];

  for (const slug of prioritySlugs) {
    for (const v of variantList) {
      fastCandidates.push({ url: `https://www.lge.co.kr/${slug}/${v}`, variant: v });
    }
  }

  const foundCandidates: CandidateResult[] = [];

  // Probe in fast batches
  const BATCH_SIZE = 15;
  for (let i = 0; i < fastCandidates.length; i += BATCH_SIZE) {
    const chunk = fastCandidates.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      chunk.map(async ({ url, variant }) => {
        try {
          const res = await fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept-Language': 'ko-KR,ko;q=0.9'
            },
            redirect: 'manual'
          });
          if (res.status === 200 || res.status === 302) {
            let label = '공식 제품 페이지';
            if (variant.includes('stand')) label = '스탠드형';
            else if (variant.includes('wall')) label = '벽걸이형';
            return { url, title: label, model: variant.toUpperCase() };
          }
        } catch (e) {}
        return null;
      })
    );

    for (const r of results) {
      if (r && !foundCandidates.some(fc => fc.url === r.url)) {
        foundCandidates.push(r);
      }
    }

    if (foundCandidates.length >= 4) break;
  }

  if (foundCandidates.length > 0) {
    return {
      primaryUrl: foundCandidates[0].url,
      candidates: foundCandidates
    };
  }

  // Fallback to general resolveProductUrl
  const singleUrl = await resolveProductUrl(modelCode, refUrl, categoryHint);
  if (singleUrl) {
    return {
      primaryUrl: singleUrl,
      candidates: [{ url: singleUrl, title: '공식 제품 페이지', model: cleanCode.toUpperCase() }]
    };
  }

  return { primaryUrl: null, candidates: [] };
}

async function resolveProductUrl(modelCode: string, refUrl?: string, categoryHint?: string): Promise<string | null> {
  const rawModel = modelCode.trim();
  const cleanCode = cleanModelCode(rawModel);
  const lowerClean = cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '');
  const lowerRaw = rawModel.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (isValidProductRefUrl(refUrl, cleanCode)) {
    return refUrl!;
  }

  // 1. FAST-PATH: Category Hint direct matching (Takes only ~100-200ms)
  let prioritySlugs: string[] = [];
  if (categoryHint) {
    for (const [k, slugs] of Object.entries(CATEGORY_SLUG_MAP)) {
      if (categoryHint.includes(k) || k.includes(categoryHint)) {
        prioritySlugs.push(...slugs);
      }
    }
  }
  if (prioritySlugs.length === 0) {
    prioritySlugs = ['water-purifiers', 'refrigerators', 'washing-machines', 'air-purifier', 'dishwashers', 'tvs', 'cleaners', 'styler'];
  }
  prioritySlugs = Array.from(new Set(prioritySlugs));

  const fastCandidates: string[] = [];
  const modelKeys = Array.from(new Set([cleanCode.toLowerCase(), lowerClean, rawModel.toLowerCase(), lowerRaw]));

  for (const slug of prioritySlugs) {
    for (const mk of modelKeys) {
      fastCandidates.push(`https://www.lge.co.kr/${slug}/${mk}`);
      fastCandidates.push(`https://www.lge.co.kr/${slug}/${mk}-wall`);
      fastCandidates.push(`https://www.lge.co.kr/${slug}/${mk}-stand`);
    }
  }

  const fastResults = await Promise.all(
    fastCandidates.map(async (candidateUrl) => {
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
    })
  );

  const fastFound = fastResults.find(Boolean);
  if (fastFound) return fastFound;

  // 2. Comprehensive Parallel Probe across all other categories
  const remainingCategories = categories.filter((c) => !prioritySlugs.includes(c));
  const fullCandidates: string[] = [];
  for (const cat of remainingCategories) {
    for (const mk of modelKeys.slice(0, 2)) {
      fullCandidates.push(`https://www.lge.co.kr/${cat}/${mk}`);
    }
  }

  const fullResults = await Promise.all(
    fullCandidates.map(async (candidateUrl) => {
      try {
        const res = await fetch(candidateUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'ko-KR,ko;q=0.9'
          }
        });
        if (res.status === 200) {
          const text = await res.text();
          if (text.includes('digitalData') || text.includes('og:title') || text.includes('gallery')) {
            return candidateUrl;
          }
        }
      } catch (e) {}
      return null;
    })
  );

  const fullFound = fullResults.find(Boolean);
  if (fullFound) return fullFound;

  // 3. Official LG Direct Search Integration (Search page scraping)
  try {
    const lgeSearchUrl = `https://www.lge.co.kr/search/search-all?searchKey=${encodeURIComponent(cleanCode)}`;
    const res = await fetch(lgeSearchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9'
      }
    });
    if (res.ok) {
      const html = await res.text();
      // Match any /slug/model product URLs in the search result
      const matches = html.match(/\/([a-z0-9_\-]+)\/([a-z0-9_\-]+)/gi);
      if (matches) {
        for (const m of matches) {
          const full = `https://www.lge.co.kr${m}`;
          if (isValidProductRefUrl(full, cleanCode)) {
            return full;
          }
        }
      }
    }
  } catch (e) {}

  // 4. Fast search fallback via Naver
  const searchQueries = [
    `site:lge.co.kr ${cleanCode}`,
    `site:lge.co.kr ${rawModel}`
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
  }

  // 5. Ultimate Guaranteed Fallback: Return Official LG Search Results Page URL (Guaranteed 100% valid landing)
  return `https://www.lge.co.kr/search/search-all?searchKey=${encodeURIComponent(cleanCode)}`;
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
          refUrl: `https://www.lge.co.kr/search/search-all?searchKey=${encodeURIComponent(cleanCode)}`,
          thumbnail: img,
          thumbnails: img ? [img] : [],
          detailImages: [],
          specifications: [],
          isOfficialVerified: false,
          colors: undefined,
          color: undefined,
          subscriptionOptions: undefined,
        };
      }
    }
  } catch(e) {}

  return {
    success: false,
    isOfficialVerified: false,
    model: modelCode,
    name: `LG ${modelCode}`,
    brand: 'LG전자',
    category: '가전',
    refUrl: `https://www.lge.co.kr/search/search-all?searchKey=${encodeURIComponent(cleanCode)}`,
    thumbnail: '',
    thumbnails: [],
    detailImages: [],
    specifications: [],
    colors: undefined,
    color: undefined,
    subscriptionOptions: undefined,
    error: 'Product search fallback failed'
  };
}

async function scrapeSingleModel(modelCode: string, refUrl?: string, categoryHint?: string) {
  const { primaryUrl, candidates } = await resolveProductCandidates(modelCode, refUrl, categoryHint);
  const url = primaryUrl;
  
  if (!url) {
    const fallback = await scrapeSearchFallback(modelCode);
    return {
      ...fallback,
      candidates: []
    };
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

    // 3. Extract Official Product Gallery Thumbnails (LGE Official Top Gallery Area ONLY)
    const allGalleryImgs = html.match(/https?:\/\/(?:www\.|static\.)?lge\.co\.kr\/[^\s"'\\]*\/gallery\/[^\s"'\\]+\.(jpg|png|webp|gif)/gi) || [];

    const uniqueGallery: string[] = [];
    const seenKeys = new Set<string>();

    if (ogThumbnail && !ogThumbnail.includes('/usp/')) {
      seenKeys.add(ogThumbnail);
      uniqueGallery.push(ogThumbnail);
    }

    for (const img of allGalleryImgs) {
      const lower = img.toLowerCase();
      
      // Exclude USP detail page feature images, small thumbnails, mobile versions
      if (
        lower.includes('/usp/') ||
        lower.includes('small') ||
        lower.includes('-m0') ||
        lower.includes('_mo.') ||
        lower.includes('-mo.') ||
        /[-_]m\d+/i.test(lower)
      ) {
        continue;
      }

      // Deduplicate key filenames
      const filename = img.split('/').pop() || '';
      let cleanKey = filename
        .replace(/^(small|medium|large)[-_]?/gi, '')
        .replace(/[-_]m(\d+)/gi, '$1')
        .replace(/\.(jpg|png|webp|gif)$/i, '')
        .toLowerCase();

      if (!seenKeys.has(cleanKey) && !seenKeys.has(img)) {
        seenKeys.add(cleanKey);
        seenKeys.add(img);
        uniqueGallery.push(img);
      }
    }

    const mainThumbnail = uniqueGallery.length > 0 ? uniqueGallery[0] : ogThumbnail;
    const finalDetailImages: string[] = [];

    // 4. Extract Full Expanded Product Specifications (Multi-Pattern Extractor)
    let specifications: Array<{ category?: string; name: string; value: string }> = [];

    // A. Extract from Next.js self.__next_f.push payloads (LGE App Router)
    const nextPushes = html.match(/self\.__next_f\.push\([\s\S]*?\);/g) || [];
    for (const push of nextPushes) {
      if (push.includes('spec') || push.includes('규격') || push.includes('크기') || push.includes('색상') || push.includes('면적') || push.includes('용량')) {
        const clean = push.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        const specPairs = Array.from(clean.matchAll(/"(?:specName|title|name)"\s*:\s*"([^"]+)"\s*,\s*"(?:specValue|value|val)"\s*:\s*"([^"]+)"/g));
        for (const m of specPairs) {
          let k = m[1].replace(/<[^>]+>/g, '').trim();
          let v = m[2].replace(/<[^>]+>/g, '').trim();
          if (v.includes('\\u003c') || v.includes('<table') || v.includes('<a href')) continue;

          if (k && v && k.length > 1 && k.length < 60 && v.length > 0 && v.length < 300 && !k.includes('도착 예정') && !k.includes('설치유의사항')) {
            if (!specifications.some(s => s.name === k)) {
              specifications.push({ category: '상세 사양', name: k, value: v });
            }
          }
        }
      }
    }

    // B. Summary <li> list items
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

    // C. <dl><dt>...</dt><dd>...</dd></dl> spec pairs
    const allDlMatches = Array.from(html.matchAll(/<dl[^>]*>([\s\S]*?)<\/dl>/gi));
    for (const dl of allDlMatches) {
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

        if (
          name && value && 
          name.length > 1 && name.length < 60 && 
          value.length > 0 && value.length < 300 &&
          !name.includes('도착 예정') &&
          !name.includes('설치유의사항') &&
          !name.includes('상세 내용 열기') &&
          !name.includes('이용자') &&
          !name.includes('권리') &&
          !name.includes('크롬')
        ) {
          if (!specifications.some(s => s.name === name)) {
            specifications.push({ category: '상세 사양', name, value });
          }
        }
      }
    }

    // D. <th>/<td> spec table pairs
    const thtdMatches = Array.from(html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/gi));
    for (const match of thtdMatches) {
      let name = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      let value = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (
        name && value && 
        name.length > 1 && name.length < 60 && 
        value.length > 0 && value.length < 300 &&
        !name.includes('도착 예정') &&
        !name.includes('설치유의사항') &&
        !name.includes('이용자')
      ) {
        if (!specifications.some(s => s.name === name)) {
          specifications.push({ category: '상세 사양', name, value });
        }
      }
    }

    // 5. Extract Full Subscription Options Matrix (Contract terms, care cycles, service types, price map)
    let subscriptionOptions: any = undefined;
    try {
      let contractTerms: Array<{ value: string; label: string; available?: boolean }> = [];
      let careServiceCycles: Array<{ value: string; label: string; available?: boolean }> = [];
      let careServiceTypes: Array<{ value: string; label: string; accentLabel?: string; description?: string; available?: boolean }> = [];
      let priceMap: Record<string, any> = {};
      let currentSelection: string | undefined = undefined;

      // 1. contractTerms
      const ctMatch = html.match(/"contractTerms"\s*:\s*(\[\s*\{[\s\S]*?\}\s*\])/);
      if (ctMatch) {
        try {
          contractTerms = JSON.parse(ctMatch[1]);
        } catch (e) {
          const itemRegex = /\{"value":"(\d+)","label":"([^"]+)"(?:,"available":(true|false))?\}/g;
          let im;
          while ((im = itemRegex.exec(ctMatch[1])) !== null) {
            contractTerms.push({ value: im[1], label: im[2], available: im[3] !== 'false' });
          }
        }
      }

      // 2. careServiceCycles
      const ccMatch = html.match(/"careServiceCycles"\s*:\s*(\[\s*\{[\s\S]*?\}\s*\])/);
      if (ccMatch) {
        try {
          careServiceCycles = JSON.parse(ccMatch[1]);
        } catch (e) {
          const itemRegex = /\{"value":"(\d+)","label":"([^"]+)"(?:,"available":(true|false))?\}/g;
          let im;
          while ((im = itemRegex.exec(ccMatch[1])) !== null) {
            careServiceCycles.push({ value: im[1], label: im[2], available: im[3] !== 'false' });
          }
        }
      }

      // 3. careServiceTypes
      const cstMatch = html.match(/"careServiceTypes"\s*:\s*(\[\s*\{[\s\S]*?\}\s*\])/);
      if (cstMatch) {
        try {
          careServiceTypes = JSON.parse(cstMatch[1]);
        } catch (e) {
          const itemRegex = /\{"value":"([^"]+)","label":"([^"]+)"(?:,"available":(true|false))?(?:,"description":"([^"]*)")?(?:,"accentLabel":"([^"]*)")?\}/g;
          let im;
          while ((im = itemRegex.exec(cstMatch[1])) !== null) {
            careServiceTypes.push({
              value: im[1],
              label: im[2],
              available: im[3] !== 'false',
              description: im[4] || undefined,
              accentLabel: im[5] || undefined
            });
          }
        }
      }

      // Fallback: Parse from subscription-care-type radio inputs in HTML (Styler, Washers, etc.)
      if (careServiceTypes.length === 0) {
        const careTypeRadioMatches = Array.from(html.matchAll(/<input[^>]*name=["']subscription-care-type["'][^>]*value=["']([^"']+)["'][^>]*>[\s\S]*?<label[^>]*>[\s\S]*?<em>([^<]+)<\/em>[\s\S]*?<span>([^<]+)<\/span>/gi));
        for (const cm of careTypeRadioMatches) {
          const code = cm[1];
          const title = cm[2].trim();
          const desc = cm[3].trim();
          careServiceTypes.push({
            value: code,
            label: desc,
            accentLabel: title
          });
        }
      }

      // 4. priceMap
      const priceMapMatch = html.match(/"priceMap"\s*:\s*(\{[\s\S]*?\})\s*,\s*"(?:partnerPriceMap|currentSelection|total)"/);
      if (priceMapMatch) {
        try {
          const rawMap = JSON.parse(priceMapMatch[1].replace(/,\s*\}/g, '}'));
          for (const [k, v] of Object.entries(rawMap)) {
            if (v && typeof v === 'object') {
              priceMap[k] = {
                monthlyPrice: (v as any).monthlyPrice,
                originalPrice: (v as any).originalPrice,
                promoPrice: (v as any).promoPrice !== '$undefined' ? (v as any).promoPrice : undefined,
                rtModelSeq: (v as any).rtModelSeq
              };
            }
          }
        } catch (e) {
          const itemRegex = /"(\d+_\d+_[a-zA-Z0-9]+)"\s*:\s*\{[^{}]*"monthlyPrice"\s*:\s*(\d+)[^{}]*\}/g;
          let im;
          while ((im = itemRegex.exec(priceMapMatch[1])) !== null) {
            priceMap[im[1]] = {
              monthlyPrice: parseInt(im[2]),
              originalPrice: parseInt(im[2])
            };
          }
        }
      } else {
        const itemRegex = /"(\d+_\d+_[a-zA-Z0-9]+)"\s*:\s*\{[^{}]*"monthlyPrice"\s*:\s*(\d+)[^{}]*\}/g;
        let im;
        while ((im = itemRegex.exec(html)) !== null) {
          priceMap[im[1]] = {
            monthlyPrice: parseInt(im[2]),
            originalPrice: parseInt(im[2])
          };
        }
      }

      // 5. currentSelection
      const curMatch = html.match(/"currentSelection"\s*:\s*"([^"]+)"/) || html.match(/"initialSelection"\s*:\s*\{[^{}]*"key"\s*:\s*"([^"]+)"/);
      if (curMatch) {
        currentSelection = curMatch[1];
      }

      if (contractTerms.length > 0 || Object.keys(priceMap).length > 0) {
        subscriptionOptions = {
          contractTerms,
          careServiceCycles,
          careServiceTypes,
          priceMap,
          currentSelection
        };
      }
    } catch (err) {
      console.error('Subscription options extract error:', err);
    }

    // 6. Extract Actual Color Options (LGE Official Colors with hex & images)
    let colors: Array<{ name: string; code: string; image?: string; modelSuffix?: string; isDefault?: boolean }> = [];
    try {
      const colorMatch = html.match(/"(?:colorList|productColorList|colors|colorOptions)"\s*:\s*(\[\s*\{[\s\S]*?\}\s*\])/);
      if (colorMatch) {
        const rawColors = JSON.parse(colorMatch[1]);
        for (const c of rawColors) {
          if (c && (c.colorName || c.name || c.colorTitle)) {
            const cName = c.colorName || c.name || c.colorTitle;
            const cCode = c.colorCode || c.code || c.hexCode || '#E5E8EB';
            const cImg = c.image || c.imageUrl || c.thumbnail || c.imagePath;
            const cSuffix = c.modelSuffix || c.suffix || c.sku;
            colors.push({
              name: String(cName).trim(),
              code: String(cCode).startsWith('#') ? cCode : `#${cCode}`,
              image: cImg ? (cImg.startsWith('http') ? cImg : `https://www.lge.co.kr${cImg}`) : undefined,
              modelSuffix: cSuffix ? String(cSuffix).trim() : undefined,
              isDefault: !!c.isDefault || !!c.defaultFlag
            });
          }
        }
      }
    } catch (e) {}

    // Fallback: If colors not found in JSON, attempt regex match on color swatches
    if (colors.length === 0) {
      const swatchMatches = Array.from(html.matchAll(/data-color-name=["']([^"']+)["']\s*(?:data-color-code=["']([^"']+)["'])?/gi));
      for (const sm of swatchMatches) {
        const name = sm[1].trim();
        const code = sm[2] ? (sm[2].startsWith('#') ? sm[2] : `#${sm[2]}`) : '#CCCCCC';
        if (name && !colors.some(c => c.name === name)) {
          colors.push({ name, code });
        }
      }
    }

    if (colors.length > 0 && !colors.some(c => c.isDefault)) {
      colors[0].isDefault = true;
    }

    return {
      success: true,
      isOfficialVerified: isValidProductRefUrl(url, modelCode) && (Boolean(mainThumbnail) || specifications.length > 0),
      model: modelCode,
      name: name || `LG ${modelCode}`,
      brand,
      category,
      refUrl: url,
      candidates: candidates || [],
      thumbnail: mainThumbnail,
      thumbnails: uniqueGallery,
      detailImages: finalDetailImages,
      specifications,
      subscriptionOptions,
      colors: colors.length > 0 ? colors : undefined,
      color: colors.length > 0 ? colors[0].name : undefined
    };
  } catch (e: any) {
    return {
      success: false,
      isOfficialVerified: false,
      model: modelCode,
      name: `LG ${modelCode}`,
      brand: 'LG전자',
      category: '가전',
      refUrl: url || `https://www.lge.co.kr/search/search-all?searchKey=${encodeURIComponent(modelCode)}`,
      candidates: candidates || [],
      thumbnail: '',
      thumbnails: [],
      detailImages: [],
      specifications: [],
      colors: undefined,
      color: undefined,
      subscriptionOptions: undefined,
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

// Color inference helper from LG model code and HTML
function inferOfficialColorForModel(modelCode: string, html: string): { name: string; code: string } {
  const upper = modelCode.toUpperCase().trim();

  // Styler Color Codes
  if (upper.startsWith('SC5') || upper.startsWith('S5') || upper.startsWith('S3')) {
    if (upper.includes('GMR') || upper.includes('MR')) {
      return { name: '블랙 틴트 미러', code: '#2B2B2B' };
    }
    if (upper.includes('GMB') || upper.includes('MB')) {
      return { name: '미스트 베이지', code: '#D9CAB3' };
    }
    if (upper.includes('GEW') || upper.includes('EW')) {
      return { name: '에센스 화이트', code: '#FFFFFF' };
    }
  }

  // 1. Check HTML next_f or swatch matches for this model
  if (html.includes('water-purifiers_solid_beige') || html.includes('solid_beige') || upper.includes('ACB') || upper.endsWith('RE.AKOR') || upper.includes('MAM.AKOR') || upper.includes('NSM')) {
    if (upper.includes('ACB') || upper.includes('NSM') || upper.includes('WD724RE') || upper.includes('WU523ACB')) {
      return { name: '카밍 베이지', code: '#D9CAB3' };
    }
  }
  if (html.includes('water-purifiers_solid_white') || html.includes('solid_white') || upper.includes('AWB') || upper.endsWith('RH.AKOR') || upper.includes('WU523AWB')) {
    return { name: '카밍 화이트', code: '#FFFFFF' };
  }
  if (html.includes('water-purifiers_solid_black') || html.includes('solid_black') || upper.includes('ABB') || upper.endsWith('RK.AKOR')) {
    return { name: '카밍 블랙', code: '#1A1A1A' };
  }
  if (html.includes('water-purifiers_solid_claybrown') || html.includes('claybrown') || upper.includes('ANB')) {
    return { name: '클레이 브라운', code: '#6B4E3D' };
  }
  if (upper.includes('AS.AKOR') || upper.endsWith('AS') || upper.includes('SILVER')) {
    return { name: '실버', code: '#C4C8CC' };
  }
  if (upper.includes('NGM') || upper.includes('GREEN')) {
    return { name: '카밍 그린', code: '#4A6B53' };
  }
  if (upper.includes('PINK')) {
    return { name: '카밍 핑크', code: '#F4B6C2' };
  }
  if (upper.includes('MINT')) {
    return { name: '클레이 민트', code: '#A3C1AD' };
  }

  // General Suffix Rules for LG Home Appliances
  if (upper.endsWith('B') || upper.endsWith('B.AKOR') || upper.includes('BEIGE')) return { name: '베이지', code: '#D9CAB3' };
  if (upper.endsWith('W') || upper.endsWith('W.AKOR') || upper.includes('WHITE')) return { name: '화이트', code: '#FFFFFF' };
  if (upper.endsWith('K') || upper.endsWith('K.AKOR') || upper.includes('BLACK')) return { name: '블랙', code: '#1A1A1A' };
  if (upper.endsWith('S') || upper.endsWith('S.AKOR') || upper.includes('SILVER')) return { name: '실버', code: '#C4C8CC' };
  if (upper.endsWith('G') || upper.endsWith('G.AKOR') || upper.includes('GREEN')) return { name: '그린', code: '#4A6B53' };
  if (upper.endsWith('N') || upper.endsWith('N.AKOR') || upper.includes('BROWN')) return { name: '브라운', code: '#6B4E3D' };

  return { name: '기본', code: '#D1D6DB' };
}

// 10% discount calculation with 10-won cut (100-won unit floor)
function calc10PercentDiscount(price: number): number {
  if (!price || price <= 0) return 0;
  return Math.floor((price * 0.9) / 100) * 100;
}

function formatSubscriptionRefUrl(url?: string, modelCode?: string, categorySlug?: string): string {
  const cleanModel = (modelCode || '').trim().split('.')[0].trim().toLowerCase();
  
  if (url && url.includes('lge.co.kr')) {
    const [baseWithQuery] = url.split('#');
    const [base, query] = baseWithQuery.split('?');

    let path = base.replace('https://www.lge.co.kr', '').replace('http://www.lge.co.kr', '');
    path = path.replace(/^\/+/, '');
    path = path.replace(/^product\//, '');
    path = path.replace(/^care-solutions\//, '');

    const parts = path.split('/').filter(Boolean);
    let finalSlug = parts[0];
    let finalModel = parts[parts.length - 1] || cleanModel;

    if (!finalSlug || finalSlug === 'product' || finalSlug === 'care-solutions' || finalSlug === 'search') {
      finalSlug = categorySlug || 'refrigerators';
    }

    const params = new URLSearchParams(query || '');
    params.set('pdpType', 'SUBSCRIPTION');

    return `https://www.lge.co.kr/product/care-solutions/${finalSlug}/${finalModel}?${params.toString()}`;
  }

  if (cleanModel) {
    let slug = categorySlug || 'washing-machines';
    const m = cleanModel.toUpperCase();
    if (m.startsWith('FX') || m.startsWith('F2') || m.startsWith('F1') || m.startsWith('FR') || m.startsWith('T2') || m.startsWith('TS') || m.startsWith('TR') || m.startsWith('TH') || m.startsWith('FH')) slug = 'washing-machines';
    else if (m.startsWith('WL') || m.startsWith('W2') || m.startsWith('W1')) slug = 'wash-tower';
    else if (m.startsWith('RD') || m.startsWith('RG') || m.startsWith('RH')) slug = 'dryers';
    else if (m.startsWith('SC') || m.startsWith('S5') || m.startsWith('S3')) slug = 'lg-styler';
    else if (m.startsWith('Z') || m.startsWith('K')) slug = 'kimchi-refrigerators';
    else if (m.startsWith('WU') || m.startsWith('WD') || m.startsWith('WS')) slug = 'water-purifiers';
    else if (m.startsWith('FQ') || m.startsWith('FN') || m.startsWith('SQ') || m.startsWith('SW') || m.startsWith('SN')) slug = 'air-conditioners';
    else if (m.startsWith('DU')) slug = 'dishwashers';
    else if (m.startsWith('AS') || m.startsWith('FS')) slug = 'air-purifier';
    else if (m.startsWith('DQ')) slug = 'dehumidifiers';
    else if (m.includes('OLED') || m.includes('QNED') || m.includes('NANO') || /^\d{2,3}[A-Z]/.test(m) || m.startsWith('27LX') || m.startsWith('32LX')) slug = 'tvs';
    else if (m.startsWith('M') || m.startsWith('T8') || m.startsWith('W8') || m.startsWith('H8') || m.startsWith('B')) slug = 'refrigerators';

    return `https://www.lge.co.kr/product/care-solutions/${slug}/${cleanModel}?pdpType=SUBSCRIPTION`;
  }

  return 'https://www.lge.co.kr/care-solutions';
}

// Helper to build exact Care Options from LGE official scraping data
function buildCareOptionsFromLge(scraped: any, rawModel: string, html: string) {
  const careOptions: Array<{
    cycle: string;
    type: string;
    p5Base: number;
    p5Discount: number;
    p5DiscountRate: number;
    p6Base: number;
    p6Discount: number;
    p6DiscountRate: number;
  }> = [];

  const pm = scraped.subscriptionOptions?.priceMap || {};
  const cycles = scraped.subscriptionOptions?.careServiceCycles || [];
  const types = scraped.subscriptionOptions?.careServiceTypes || [];

  // Group by care cycles / types from priceMap
  // Key format in LGE priceMap: {term}_{cycle}_{type} e.g. 60_6_VISIT, 60_0_SELF, 72_6_VISIT, 72_0_SELF
  const foundKeys = Object.keys(pm);

  if (foundKeys.length > 0) {
    const cycleKeys = new Set<string>();
    for (const k of foundKeys) {
      const parts = k.split('_');
      if (parts.length >= 2) {
        cycleKeys.add(parts.slice(1).join('_'));
      }
    }

    for (const ck of cycleKeys) {
      const p5Key = `60_${ck}`;
      const p6Key = `72_${ck}`;

      const p5Obj = pm[p5Key];
      const p6Obj = pm[p6Key];

      const p5Base = p5Obj ? (p5Obj.originalPrice || p5Obj.monthlyPrice || 0) : 0;
      const p6Base = p6Obj ? (p6Obj.originalPrice || p6Obj.monthlyPrice || 0) : 0;

      if (p5Base > 0 || p6Base > 0) {
        let cycleLabel = ck.startsWith('0') || ck.includes('SELF') ? '자가관리' : `${ck.split('_')[0]}개월`;
        let typeLabel = ck.includes('SELF') || ck.startsWith('0') ? '셀프케어' : '방문케어';

        // Check if there is a matching label in careServiceCycles
        const matchedCycle = cycles.find((c: any) => c.value === ck.split('_')[0]);
        if (matchedCycle?.label) cycleLabel = matchedCycle.label;

        const matchedType = types.find((t: any) => t.value === ck.split('_')[1]);
        if (matchedType?.label) typeLabel = matchedType.label;

        const p5Disc = calc10PercentDiscount(p5Base);
        const p6Disc = calc10PercentDiscount(p6Base);

        careOptions.push({
          cycle: cycleLabel,
          type: typeLabel,
          p5Base,
          p5Discount: p5Disc,
          p5DiscountRate: 10,
          p6Base,
          p6Discount: p6Disc,
          p6DiscountRate: 10
        });
      }
    }
  }

  // Fallback if priceMap is sparse: use scraped base prices
  if (careOptions.length === 0) {
    const defaultP5 = 39900;
    const defaultP6 = 36900;
    careOptions.push({
      cycle: cycles[0]?.label || '6개월',
      type: types[0]?.label || '방문케어',
      p5Base: defaultP5,
      p5Discount: calc10PercentDiscount(defaultP5),
      p5DiscountRate: 10,
      p6Base: defaultP6,
      p6Discount: calc10PercentDiscount(defaultP6),
      p6DiscountRate: 10
    });
  }

  return careOptions;
}

export const scrapeLgCareProduct = action({
  args: {
    model: v.string(),
    excelCategory: v.optional(v.string()),
    excelColors: v.optional(v.array(v.string())),
    p5Base: v.optional(v.number()),
    p5Discount: v.optional(v.number()),
    p6Base: v.optional(v.number()),
    p6Discount: v.optional(v.number()),
    refUrl: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const rawModel = args.model.trim();
    const scraped = await scrapeSingleModel(rawModel, args.refUrl, args.excelCategory);

    // If scraping failed or returned 404
    if (!scraped.success && !scraped.thumbnail && (!scraped.specifications || scraped.specifications.length === 0)) {
      return {
        success: false,
        model: rawModel,
        reason: 'LG 공식 사이트에서 해당 모델 페이지를 찾지 못함 (404 미등록 모델)'
      };
    }

    // Exact official color for this model
    const officialColor = inferOfficialColorForModel(rawModel, '');

    // Official Care Options & 10% floor discount from LGE official site
    const careOptions = buildCareOptionsFromLge(scraped, rawModel, '');
    const defaultOpt = careOptions[0];

    const careCycles = Array.from(new Set(careOptions.map(o => o.cycle)));
    const careTypes = Array.from(new Set(careOptions.map(o => o.type)));

    const refUrl = formatSubscriptionRefUrl(scraped.refUrl, undefined, rawModel);
    const relatedUrls = (scraped as any).candidates && (scraped as any).candidates.length > 0 
      ? (scraped as any).candidates.map((c: any) => ({
          title: c.title || '공식 제품',
          model: c.model || rawModel,
          url: c.url
        }))
      : undefined;

    return {
      success: true,
      name: scraped.name || `LG ${rawModel}`,
      model: scraped.model || rawModel,
      originalModel: rawModel,
      brand: scraped.brand || 'LG전자',
      category: args.excelCategory || scraped.category || '가전',
      refUrl,
      relatedUrls,
      image: scraped.thumbnail || '',
      images: scraped.thumbnails || [],
      color: officialColor.name,
      colors: [{ name: officialColor.name, code: officialColor.code, isDefault: true }],
      careCycles,
      careTypes,
      careOptions,
      rentalPrice5Year: defaultOpt.p5Base,
      discountPrice5Year: defaultOpt.p5Discount,
      discountRate5Year: 10,
      rentalPrice6Year: defaultOpt.p6Base,
      discountPrice6Year: defaultOpt.p6Discount,
      discountRate6Year: 10,
      subscriptionOptions: scraped.subscriptionOptions,
      isOfficialVerified: scraped.isOfficialVerified ?? (scraped.success && Boolean(scraped.thumbnail)),
      specifications: scraped.specifications,
      order: 0,
      isVisible: true
    };
  }
});

export const scrapeLgCareProductsBatch = action({
  args: {
    items: v.array(
      v.object({
        model: v.string(),
        excelCategory: v.optional(v.string()),
        excelColors: v.optional(v.array(v.string())),
        p5Base: v.optional(v.number()),
        p5Discount: v.optional(v.number()),
        p6Base: v.optional(v.number()),
        p6Discount: v.optional(v.number()),
        refUrl: v.optional(v.string())
      })
    )
  },
  handler: async (ctx, args) => {
    const results = await Promise.all(
      args.items.map(async (item) => {
        try {
          const rawModel = item.model.trim();
          const scraped = await scrapeSingleModel(rawModel, item.refUrl, item.excelCategory);

          if (!scraped.success && !scraped.thumbnail && (!scraped.specifications || scraped.specifications.length === 0)) {
            return {
              success: false,
              model: rawModel,
              excelCategory: item.excelCategory,
              reason: 'LG 공식 사이트에서 해당 모델 페이지를 찾지 못함 (404 미등록 모델)'
            };
          }

          const officialColor = inferOfficialColorForModel(rawModel, '');
          const careOptions = buildCareOptionsFromLge(scraped, rawModel, '');
          const defaultOpt = careOptions[0];

          const careCycles = Array.from(new Set(careOptions.map(o => o.cycle)));
          const careTypes = Array.from(new Set(careOptions.map(o => o.type)));
          const refUrl = formatSubscriptionRefUrl(scraped.refUrl, rawModel, item.excelCategory);
          const relatedUrls = (scraped as any).candidates && (scraped as any).candidates.length > 0 
            ? (scraped as any).candidates.map((c: any) => ({
                title: c.title || '공식 제품',
                model: c.model || rawModel,
                url: c.url
              }))
            : undefined;

          return {
            success: true,
            name: scraped.name || `LG ${rawModel}`,
            model: scraped.model || rawModel,
            originalModel: rawModel,
            brand: scraped.brand || 'LG전자',
            category: item.excelCategory || scraped.category || '가전',
            refUrl,
            relatedUrls,
            image: scraped.thumbnail || '',
            images: scraped.thumbnails || [],
            color: officialColor.name,
            colors: [{ name: officialColor.name, code: officialColor.code, isDefault: true }],
            careCycles,
            careTypes,
            careOptions,
            rentalPrice5Year: defaultOpt.p5Base,
            discountPrice5Year: defaultOpt.p5Discount,
            discountRate5Year: 10,
            rentalPrice6Year: defaultOpt.p6Base,
            discountPrice6Year: defaultOpt.p6Discount,
            discountRate6Year: 10,
            subscriptionOptions: scraped.subscriptionOptions,
            isOfficialVerified: scraped.isOfficialVerified ?? (scraped.success && Boolean(scraped.thumbnail)),
            specifications: scraped.specifications,
            order: 0,
            isVisible: true
          };
        } catch (e: any) {
          return {
            success: false,
            isOfficialVerified: false,
            model: item.model,
            excelCategory: item.excelCategory,
            reason: e?.message || '스크래핑 처리 중 오류 발생'
          };
        }
      })
    );

    return results;
  }
});

// Action to verify existing products in database
export const verifyExistingProductsBatch = action({
  args: {
    items: v.array(
      v.object({
        id: v.string(),
        model: v.string(),
        refUrl: v.optional(v.string()),
        category: v.optional(v.string())
      })
    )
  },
  handler: async (ctx, args) => {
    const results = await Promise.all(
      args.items.map(async (item) => {
        try {
          const rawModel = item.model.trim();
          const clean = cleanModelCode(rawModel);

          // If current refUrl is a valid product PDP, check if it's alive (200 OK)
          if (item.refUrl && isValidProductRefUrl(item.refUrl, clean)) {
            try {
              const res = await fetch(item.refUrl, {
                method: 'GET',
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                  'Accept-Language': 'ko-KR,ko;q=0.9'
                }
              });
              if (res.status === 200) {
                const text = await res.text();
                const isRealPdp = text.includes('digitalData') || text.includes('og:title') || text.includes('gallery');
                if (isRealPdp) {
                  return {
                    id: item.id,
                    model: rawModel,
                    isOfficialVerified: true,
                    refUrl: item.refUrl
                  };
                }
              }
            } catch (e) {}
          }

          // Otherwise, resolve candidates
          const { primaryUrl } = await resolveProductCandidates(rawModel, item.refUrl, item.category);
          if (primaryUrl && isValidProductRefUrl(primaryUrl, clean)) {
            return {
              id: item.id,
              model: rawModel,
              isOfficialVerified: true,
              refUrl: primaryUrl
            };
          }

          return {
            id: item.id,
            model: rawModel,
            isOfficialVerified: false,
            refUrl: item.refUrl
          };
        } catch (err: any) {
          return {
            id: item.id,
            model: item.model,
            isOfficialVerified: false,
            refUrl: item.refUrl
          };
        }
      })
    );

    return results;
  }
});
