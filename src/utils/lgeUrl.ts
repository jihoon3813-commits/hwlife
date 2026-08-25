// Exact LG Electronics Official PDP URL Generator Utility

/**
 * Normalizes known LG slug typos/variations to official Care Solutions slugs.
 */
export function normalizeLgSlug(rawSlug: string): string {
  const s = (rawSlug || '').toLowerCase().trim();
  if (!s) return '';
  if (s === 'wash_tower' || s === 'washtower') return 'wash-tower';
  if (s === 'wash_combo' || s === 'washcombo') return 'wash-combo';
  if (s === 'washing-machines' || s === 'washer' || s === 'washers' || s === 'washing_machines') return 'washing_machines';
  if (s === 'microwaves_and_ovens' || s === 'microwaves-and-ovens' || s === 'microwave' || s === 'microwaves' || s === 'oven' || s === 'ovens') return 'microwaves-and-ovens';
  if (s === 'electric_stoves' || s === 'electric-stove' || s === 'electric-stoves' || s === 'electric-ranges' || s === 'electric_ranges' || s === 'range' || s === 'electric-range') return 'electric-stoves';
  if (s === 'bath_air_system' || s === 'bath-air' || s === 'bathair' || s === 'bath-air-system') return 'bath-air-system';
  if (s === 'shoe_care' || s === 'shoecare' || s === 'shoe-care') return 'shoe-care';
  if (s === 'lg_styler' || s === 'styler' || s === 'stylers' || s === 'lg-styler') return 'lg-styler';
  if (s === 'air-purifier' || s === 'airpurifier' || s === 'airpurifiers' || s === 'air-purifiers') return 'air-purifiers';
  if (s === 'water-purifier' || s === 'water_purifiers' || s === 'waterpurifier' || s === 'water-purifiers') return 'water-purifiers';
  if (s === 'air-conditioner' || s === 'air_conditioners' || s === 'aircon' || s === 'air-conditioners') return 'air-conditioners';
  if (s === 'vacuum_cleaners' || s === 'cleaner' || s === 'cleaners' || s === 'vacuum-cleaners') return 'vacuum-cleaners';
  if (s === 'humidifier' || s === 'humidifiers' || s === 'hydrotower') return 'humidifiers';
  if (s === 'dehumidifier' || s === 'dehumidifiers') return 'dehumidifiers';
  if (s === 'kimchi_refrigerators' || s === 'kimchirefrigerators' || s === 'kimchi-refrigerators') return 'kimchi-refrigerators';
  if (s === 'dishwasher' || s === 'dishwashers') return 'dishwashers';
  if (s === 'massage_chairs' || s === 'massage-chairs' || s === 'massage_chair' || s === 'massage-chair' || s === 'massage') return 'massage-chairs';
  if (s === 'refrigerator' || s === 'fridges' || s === 'refrigerators') return 'refrigerators';
  if (s === 'tv' || s === 'television' || s === 'tvs') return 'tvs';
  return s;
}

/**
 * Infers the accurate LG official product category slug for product/care-solutions.
 */
export function inferLgeSlugFromModel(modelCode?: string, categoryHint?: string): string {
  const m = (modelCode || '').toUpperCase().trim();
  const cat = (categoryHint || '').toLowerCase();

  // 0. 바스에어시스템 (MX0120, M-X0120, BASV, BASR, BASA 등) - MUST BE CHECKED BEFORE REFRIGERATOR 'M'
  if (cat.includes('bath') || cat.includes('바스') || m.includes('BASV') || m.includes('BASR') || m.includes('BASA') || m.startsWith('MX0120') || m.startsWith('M-X0120')) {
    return 'bath-air-system';
  }

  // 0-1. 안마의자 (MX9, MX7, MX5, MX3, BM, MH 등, MX0120 바스에어 제외) - MUST BE CHECKED BEFORE REFRIGERATOR 'M'
  if (
    cat.includes('massage') || cat.includes('안마') ||
    ((m.startsWith('MX') || m.startsWith('BM') || m.startsWith('MH')) && !m.startsWith('MX0120') && !m.startsWith('M-X0120'))
  ) {
    return 'massage-chairs';
  }

  // 1. 제습기 (DQ, DC, DD, DH 등) - MUST BE CHECKED BEFORE HUMIDIFIER & DISHWASHER
  if (
    cat.includes('dehumidifier') || cat.includes('제습기') ||
    m.startsWith('DQ') || m.startsWith('DC') || m.startsWith('DD') || m.startsWith('DH')
  ) {
    return 'dehumidifiers';
  }

  // 2. 정수가습기 / 하이드로타워 (HY, HW, HU 등) - MUST BE CHECKED BEFORE REFRIGERATOR 'H8'
  if (
    ((cat.includes('humidifier') || cat.includes('humid')) && !cat.includes('dehumid')) || cat.includes('가습기') || cat.includes('하이드로타워') ||
    m.startsWith('HY') || m.startsWith('HW') || m.startsWith('HU')
  ) {
    return 'humidifiers';
  }

  // 3. 광파오븐 / 전자레인지 (ML, MZ, MJ, MW, MC, MA 등) - MUST BE CHECKED BEFORE REFRIGERATOR 'M' & ELECTRIC STOVE
  if (
    cat.includes('광파오븐') || cat.includes('오븐') || cat.includes('전자레인지') || cat.includes('oven') || cat.includes('microwave') ||
    m.startsWith('ML') || m.startsWith('MZ') || m.startsWith('MJ') || m.startsWith('MW') || m.startsWith('MC') || m.startsWith('MA')
  ) {
    return 'microwaves-and-ovens';
  }

  // 4. 전기레인지 / 인덕션 (BEF, BEI, BEY, BD 등) - MUST BE CHECKED BEFORE REFRIGERATOR 'B'
  if (
    cat.includes('range') || cat.includes('stove') || cat.includes('인덕션') || cat.includes('전기레인지') || cat.includes('하이브리드') ||
    m.startsWith('BEF') || m.startsWith('BEI') || m.startsWith('BEY') || m.startsWith('BD')
  ) {
    return 'electric-stoves';
  }

  // 5. 식기세척기 (DE, DU, DF, D1, D2 등, DQ/DC/DD 제습기 제외) - HIGH PRIORITY
  if (
    cat.includes('dishwasher') || cat.includes('식기세척기') || cat.includes('식세') ||
    m.startsWith('DE') || m.startsWith('DU') || m.startsWith('DF') || m.startsWith('D1') || m.startsWith('D2') ||
    (m.startsWith('D') && !m.startsWith('DQ') && !m.startsWith('DC') && !m.startsWith('DD') && !m.startsWith('DH'))
  ) {
    return 'dishwashers';
  }

  // 5. 제습기 (DQ, DH 등) - HIGH PRIORITY
  if (cat.includes('dehumidifier') || cat.includes('제습기') || m.startsWith('DQ') || m.startsWith('DH')) {
    return 'dehumidifiers';
  }

  // 6. 워시콤보 (FC, FH 등)
  if (cat.includes('washcombo') || cat.includes('워시콤보') || m.startsWith('FC') || m.startsWith('FH')) {
    return 'wash-combo';
  }

  // 7. 워시타워 (WA, WL, W2, W1 등)
  if (cat.includes('washtower') || cat.includes('워시타워') || m.startsWith('WA') || m.startsWith('WL') || m.startsWith('W2') || m.startsWith('W1')) {
    return 'wash-tower';
  }

  // 8. 청소기 / 로봇청소기 (AI9, A9, AX9, AU9, R9, RO9 등)
  if (cat.includes('cleaner') || cat.includes('vacuum') || cat.includes('청소기') || m.startsWith('AI9') || m.startsWith('A9') || m.startsWith('AX9') || m.startsWith('AU9') || m.startsWith('R9') || m.startsWith('RO9')) {
    return 'vacuum-cleaners';
  }

  // 9. 세탁기 (FX, F2, F1, FR, FG, TA, TS, TR, TH, TD, T1, T2, T3 등) - MUST BE CHECKED BEFORE REFRIGERATOR
  if (
    cat.includes('washer') || cat.includes('세탁기') ||
    m.startsWith('FX') || m.startsWith('F2') || m.startsWith('F1') || m.startsWith('FR') || m.startsWith('FG') ||
    m.startsWith('TA') || m.startsWith('TS') || m.startsWith('TR') || m.startsWith('TH') || m.startsWith('TD') ||
    m.startsWith('T1') || m.startsWith('T2') || m.startsWith('T3') ||
    (m.startsWith('F') && !m.startsWith('FS') && !m.startsWith('FQ') && !m.startsWith('FN') && !m.startsWith('FC') && !m.startsWith('FH'))
  ) {
    return 'washing_machines';
  }

  // 10. 건조기 (RD, RG, RH, RC 등)
  if (cat.includes('dryer') || cat.includes('건조기') || m.startsWith('RD') || m.startsWith('RG') || m.startsWith('RH') || m.startsWith('RC')) {
    return 'dryers';
  }

  // 11. 슈케어 / 슈케이스 (SS4, SS, SH 등)
  if (cat.includes('shoe') || cat.includes('슈케어') || cat.includes('슈케이스') || m.startsWith('SS4') || m.startsWith('SS') || m.startsWith('SH')) {
    return 'shoe-care';
  }

  // 12. 스타일러 (SC5, SC3, S5, S3 등)
  if (cat.includes('styler') || cat.includes('스타일러') || m.startsWith('SC') || m.startsWith('S5') || m.startsWith('S3')) {
    return 'lg-styler';
  }

  // 13. 김치냉장고 (Z, K 시리즈)
  if (cat.includes('kimchi') || cat.includes('김치') || m.startsWith('Z') || m.startsWith('K')) {
    return 'kimchi-refrigerators';
  }

  // 14. 정수기 (WU, WD, WS 등)
  if (cat.includes('water') || cat.includes('정수기') || m.startsWith('WU') || m.startsWith('WD') || m.startsWith('WS')) {
    return 'water-purifiers';
  }

  // 15. 에어컨 (FQ, FN, SQ, SW, SN 등)
  if (cat.includes('aircon') || cat.includes('에어컨') || m.startsWith('FQ') || m.startsWith('FN') || m.startsWith('SQ') || m.startsWith('SW') || m.startsWith('SN')) {
    return 'air-conditioners';
  }

  // 16. 공기청정기 / 에어로타워 (AS, FS 등)
  if (cat.includes('aircare') || cat.includes('airpurifier') || cat.includes('aerotower') || cat.includes('공기청정기') || cat.includes('에어로타워') || m.startsWith('AS') || m.startsWith('FS')) {
    return 'air-purifiers';
  }

  // 17. TV (OLED, QNED, NANO, 숫자2자리인치, 27LX, 32LX 등)
  if (cat.includes('tv') || cat.includes('티비') || m.includes('OLED') || m.includes('QNED') || m.includes('NANO') || /^\d{2,3}[A-Z]/.test(m) || m.startsWith('27LX') || m.startsWith('32LX')) {
    return 'tvs';
  }

  // 18. 냉장고 (M, T8, W8, H8, B, S8, G8, X3, Y3, A3 등)
  if (
    cat.includes('fridge') || cat.includes('refriger') || cat.includes('냉장고') ||
    m.startsWith('M') || m.startsWith('T8') || m.startsWith('W8') || m.startsWith('H8') ||
    m.startsWith('B') || m.startsWith('S8') || m.startsWith('G8') || m.startsWith('X3') || m.startsWith('Y3') || m.startsWith('A3')
  ) {
    return 'refrigerators';
  }

  return 'dishwashers';
}

/**
 * Builds exact LG official Care Solutions subscription PDP URL:
 * https://www.lge.co.kr/product/care-solutions/{slug}/{modelCode}?modelId={modelId}&pdpType=SUBSCRIPTION
 * Enforces canonical correct slug over any wrong legacy DB URLs.
 */
export function buildLgOfficialPdpUrl(rawUrl?: string, modelCode?: string, categoryHint?: string, modelIdHint?: string): string {
  const cleanModel = (modelCode || '').trim().split('.')[0].trim().toLowerCase();
  const inferredSlug = inferLgeSlugFromModel(modelCode, categoryHint);

  let url = (rawUrl || '').trim();

  // Extract modelId from rawUrl if available
  let existingModelId = modelIdHint;
  let rawPathModel = '';

  if (url && url.startsWith('http')) {
    try {
      const parsed = new URL(url);
      const mId = parsed.searchParams.get('modelId');
      if (mId) existingModelId = mId;

      const parts = parsed.pathname.replace(/^\/+/, '').split('/').filter(Boolean);
      if (parts.length > 0) {
        const lastPart = parts[parts.length - 1];
        if (lastPart && !lastPart.includes('care-solutions') && !lastPart.includes('product')) {
          rawPathModel = lastPart;
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  // Always use the inferredSlug to strictly prevent wrong legacy category URLs (e.g. refrigerators/fx25efe)
  const finalSlug = inferredSlug || 'washing_machines';
  const finalModel = cleanModel || rawPathModel || '';

  const params = new URLSearchParams();
  if (existingModelId) {
    params.set('modelId', existingModelId);
  }
  params.set('pdpType', 'SUBSCRIPTION');

  if (finalModel) {
    return `https://www.lge.co.kr/product/care-solutions/${finalSlug}/${finalModel.toLowerCase()}?${params.toString()}`;
  }

  return 'https://www.lge.co.kr/care-solutions';
}

/**
 * Optimizes image URLs by converting lge.co.kr to static.lge.co.kr
 * to avoid 302 redirects which get blocked by mobile browsers.
 */
export function getOptimizedImageUrl(url?: string): string {
  if (!url) return 'https://static.lge.co.kr/kr/images/common/no-image.jpg';
  let clean = url.trim();
  if (clean.startsWith('//')) {
    clean = 'https:' + clean;
  }
  // Replace www.lge.co.kr/kr/images/ or lge.co.kr/kr/images/ with static.lge.co.kr/kr/images/
  clean = clean.replace(/^https?:\/\/(www\.)?lge\.co\.kr\/kr\/images\//i, 'https://static.lge.co.kr/kr/images/');
  return clean;
}
