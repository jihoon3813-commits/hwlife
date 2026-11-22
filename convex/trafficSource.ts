export interface TrafficSignalInput {
  path?: string;
  referrer?: string;
  userAgent?: string;
  currentHost?: string;
}

export interface ClassifiedTrafficSource {
  channel: string;
  label: string;
  category: '메신저/문자' | '당근' | 'SNS' | '네이버' | '구글/포털' | '직접/기타' | '봇';
  isPaidAd: boolean;
  deviceType: '모바일' | 'PC' | '태블릿' | '봇';
  browser: string;
  os: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrerHost?: string;
  matchReason: string;
}

const BOT_PATTERN =
  /bot|crawler|spider|slurp|yeti|daumoa|bingbot|googlebot|kakaotalk-scrap|facebookexternalhit|facebot|twitterbot|slackbot|discordbot|telegrambot|whatsapp|petalbot|semrushbot|ahrefsbot|mj12bot|bytespider|headlesschrome|lighthouse|pingdom|uptimerobot/i;

const PAID_MEDIUMS = new Set([
  'cpc',
  'ppc',
  'ad',
  'ads',
  'paid',
  'paidsocial',
  'paid_social',
  'display',
  'banner',
  'sa',
  'gfa',
  'moment',
  'powerlink',
  'cpm',
  'da',
]);

function parseQueryParams(path?: string): URLSearchParams {
  if (!path) return new URLSearchParams();
  const qIdx = path.indexOf('?');
  if (qIdx === -1) return new URLSearchParams();
  const hashIdx = path.indexOf('#', qIdx);
  const queryStr = hashIdx === -1 ? path.slice(qIdx + 1) : path.slice(qIdx + 1, hashIdx);
  return new URLSearchParams(queryStr);
}

function extractHostname(url?: string): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed || trimmed === '직접 유입' || trimmed === '직접 유입 (Direct)' || trimmed === 'direct') {
    return undefined;
  }
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    return parsed.hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

function isInternalReferrer(refHost: string, currentHost?: string): boolean {
  if (currentHost && refHost === currentHost.toLowerCase()) return true;
  if (
    refHost === 'localhost' ||
    refHost === '127.0.0.1' ||
    refHost.endsWith('.localhost')
  ) {
    return true;
  }
  return false;
}

export function detectDeviceAndEnv(userAgent = ''): {
  isBot: boolean;
  deviceType: '모바일' | 'PC' | '태블릿' | '봇';
  browser: string;
  os: string;
} {
  const ua = userAgent || '';

  if (BOT_PATTERN.test(ua)) {
    return { isBot: true, deviceType: '봇', browser: '봇/크롤러', os: '기타' };
  }

  let os = '기타';
  if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  let deviceType: '모바일' | 'PC' | '태블릿' | '봇' = 'PC';
  if (/ipad|tablet|playbook|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) {
    deviceType = '태블릿';
  } else if (/iphone|ipod|android.*mobile|mobile|blackberry|iemobile|opera mini/i.test(ua)) {
    deviceType = '모바일';
  }

  let browser = '기타';
  if (/kakaotalk/i.test(ua)) browser = '카카오톡 인앱';
  else if (/instagram/i.test(ua)) browser = '인스타그램 인앱';
  else if (/daangn|karrot/i.test(ua)) browser = '당근 인앱';
  else if (/naver\(/i.test(ua)) browser = '네이버 앱';
  else if (/fban|fbav|fb_iab/i.test(ua)) browser = '페이스북 인앱';
  else if (/band\//i.test(ua)) browser = '네이버 밴드 인앱';
  else if (/barcelona/i.test(ua)) browser = '스레드 인앱';
  else if (/line\//i.test(ua)) browser = '라인 인앱';
  else if (/bytedancewebview|tiktok|musical_ly/i.test(ua)) browser = '틱톡 인앱';
  else if (/samsungbrowser/i.test(ua)) browser = '삼성 인터넷';
  else if (/whale/i.test(ua)) browser = '웨일';
  else if (/edg/i.test(ua)) browser = '엣지';
  else if (/crios|chrome/i.test(ua)) browser = '크롬';
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = '사파리';

  return { isBot: false, deviceType, browser, os };
}

export function classifyTrafficSource(input: TrafficSignalInput): ClassifiedTrafficSource {
  const { path, referrer, userAgent = '', currentHost } = input;
  const env = detectDeviceAndEnv(userAgent);
  const params = parseQueryParams(path);

  const utmSourceRaw =
    params.get('utm_source') ||
    params.get('source') ||
    params.get('src') ||
    params.get('inflow') ||
    params.get('ref') ||
    '';
  const utmSource = utmSourceRaw.trim().toLowerCase() || undefined;
  const utmMedium = (params.get('utm_medium') || params.get('medium') || '').trim().toLowerCase() || undefined;
  const utmCampaign = (params.get('utm_campaign') || params.get('campaign') || '').trim() || undefined;
  const utmContent = (params.get('utm_content') || '').trim() || undefined;
  const utmTerm = (params.get('utm_term') || params.get('n_keyword') || '').trim() || undefined;

  const refHost = extractHostname(referrer);
  const validRefHost = refHost && !isInternalReferrer(refHost, currentHost) ? refHost : undefined;

  const baseEnv = {
    deviceType: env.deviceType,
    browser: env.browser,
    os: env.os,
    utmSource: utmSourceRaw.trim() || undefined,
    utmMedium: (params.get('utm_medium') || params.get('medium') || '').trim() || undefined,
    utmCampaign,
    utmContent,
    utmTerm,
    referrerHost: validRefHost,
  };

  if (env.isBot) {
    return {
      ...baseEnv,
      channel: 'bot',
      label: '검색봇/미리보기',
      category: '봇',
      isPaidAd: false,
      matchReason: '봇 User-Agent',
    };
  }

  const ua = userAgent.toLowerCase();
  const isPaidMedium = Boolean(utmMedium && PAID_MEDIUMS.has(utmMedium));

  const hasNaverAdClickId =
    params.has('n_media') ||
    params.has('n_query') ||
    params.has('n_rank') ||
    params.has('n_ad_group') ||
    params.has('n_ad') ||
    params.has('n_campaign_type') ||
    params.has('NaPm');
  const hasGoogleAdClickId =
    params.has('gclid') || params.has('gbraid') || params.has('wbraid') || params.has('gad_source');
  const hasMetaClickId = params.has('fbclid');
  const hasInstaShareId = params.has('igshid') || params.has('igsh');
  const hasKakaoClickId = params.has('kclid') || params.has('kakao_campaign') || params.has('kakao_adgrp');
  const hasDaangnParam = params.has('daangn_ad') || params.has('karrot_ad');
  const hasTiktokClickId = params.has('ttclid');

  // 1. Explicit UTM Source / Medium / Custom Source Param
  if (utmSource || utmMedium) {
    const s = utmSource || '';
    const m = utmMedium || '';

    if (['sms', 'mms', 'lms', '문자', 'message', 'text', 'msg_sms'].includes(s) || ['sms', 'mms', 'lms', '문자'].includes(m)) {
      return { ...baseEnv, channel: 'sms', label: '문자 링크', category: '메신저/문자', isPaidAd: false, matchReason: 'UTM/파라미터' };
    }
    if (['daangn', 'karrot', '당근', '당근마켓', '당근광고', 'daangn_ad'].includes(s)) {
      return { ...baseEnv, channel: 'daangn_ad', label: '당근 광고', category: '당근', isPaidAd: true, matchReason: 'UTM/파라미터' };
    }
    if (['alimtalk', 'friendtalk', '알림톡', '친구톡', 'kakao_channel', 'pf_kakao'].includes(s) || ['alimtalk', 'friendtalk', '알림톡', '친구톡'].includes(m)) {
      return { ...baseEnv, channel: 'kakao_channel', label: '카카오 알림톡/채널', category: '메신저/문자', isPaidAd: false, matchReason: 'UTM/파라미터' };
    }
    if (['kakao', 'kakaotalk', 'kakao_talk', '카톡', '카카오', '카카오톡', 'kakao_ad'].includes(s)) {
      if (isPaidMedium || s === 'kakao_ad' || hasKakaoClickId) {
        return { ...baseEnv, channel: 'kakao_ad', label: '카카오 광고', category: '메신저/문자', isPaidAd: true, matchReason: 'UTM/광고ID' };
      }
      return { ...baseEnv, channel: 'kakao', label: '카카오톡 링크', category: '메신저/문자', isPaidAd: false, matchReason: 'UTM/파라미터' };
    }
    if (['instagram', 'insta', 'ig', '인스타', '인스타그램'].includes(s)) {
      if (isPaidMedium || hasMetaClickId) {
        return { ...baseEnv, channel: 'instagram_ad', label: '인스타그램 광고', category: 'SNS', isPaidAd: true, matchReason: 'UTM/광고ID' };
      }
      return { ...baseEnv, channel: 'instagram', label: '인스타그램', category: 'SNS', isPaidAd: false, matchReason: 'UTM/파라미터' };
    }
    if (['facebook', 'fb', '페이스북', 'meta', '메타'].includes(s)) {
      if (isPaidMedium || hasMetaClickId || s === 'meta' || s === '메타') {
        return { ...baseEnv, channel: 'meta_ad', label: '메타/페이스북 광고', category: 'SNS', isPaidAd: true, matchReason: 'UTM/광고ID' };
      }
      return { ...baseEnv, channel: 'facebook', label: '페이스북', category: 'SNS', isPaidAd: false, matchReason: 'UTM/파라미터' };
    }
    if (['naver', '네이버', 'naver_sa', 'naver_gfa', 'powerlink'].includes(s)) {
      if (isPaidMedium || hasNaverAdClickId || ['naver_sa', 'naver_gfa', 'powerlink'].includes(s)) {
        return { ...baseEnv, channel: 'naver_ad', label: '네이버 광고', category: '네이버', isPaidAd: true, matchReason: 'UTM/광고ID' };
      }
      if (m === 'blog' || m === '블로그') {
        return { ...baseEnv, channel: 'naver_blog', label: '네이버 블로그', category: '네이버', isPaidAd: false, matchReason: 'UTM/파라미터' };
      }
      if (m === 'cafe' || m === '카페') {
        return { ...baseEnv, channel: 'naver_cafe', label: '네이버 카페', category: '네이버', isPaidAd: false, matchReason: 'UTM/파라미터' };
      }
      return { ...baseEnv, channel: 'naver', label: '네이버', category: '네이버', isPaidAd: false, matchReason: 'UTM/파라미터' };
    }
    if (['google', '구글'].includes(s)) {
      if (isPaidMedium || hasGoogleAdClickId) {
        return { ...baseEnv, channel: 'google_ad', label: '구글 광고', category: '구글/포털', isPaidAd: true, matchReason: 'UTM/광고ID' };
      }
      return { ...baseEnv, channel: 'google', label: '구글 검색', category: '구글/포털', isPaidAd: false, matchReason: 'UTM/파라미터' };
    }
    if (['youtube', 'yt', '유튜브'].includes(s)) {
      return { ...baseEnv, channel: 'youtube', label: '유튜브', category: 'SNS', isPaidAd: isPaidMedium, matchReason: 'UTM/파라미터' };
    }
    if (['band', '밴드'].includes(s)) {
      return { ...baseEnv, channel: 'band', label: '네이버 밴드', category: 'SNS', isPaidAd: isPaidMedium, matchReason: 'UTM/파라미터' };
    }
    if (['threads', '스레드'].includes(s)) {
      return { ...baseEnv, channel: 'threads', label: '스레드', category: 'SNS', isPaidAd: isPaidMedium, matchReason: 'UTM/파라미터' };
    }
    if (['tiktok', '틱톡'].includes(s)) {
      return { ...baseEnv, channel: 'tiktok', label: '틱톡', category: 'SNS', isPaidAd: isPaidMedium || hasTiktokClickId, matchReason: 'UTM/파라미터' };
    }
    if (['daum', '다음'].includes(s)) {
      return { ...baseEnv, channel: 'daum', label: '다음', category: '구글/포털', isPaidAd: isPaidMedium, matchReason: 'UTM/파라미터' };
    }
    if (['qr', 'qrcode', 'offline', 'leaflet', '전단지', '명함'].includes(s) || ['qr', 'offline'].includes(m)) {
      return { ...baseEnv, channel: 'qr_offline', label: 'QR/오프라인', category: '직접/기타', isPaidAd: false, matchReason: 'UTM/파라미터' };
    }
  }

  // 2. Ad Click IDs (when UTM wasn't explicitly set)
  if (hasNaverAdClickId) {
    return { ...baseEnv, channel: 'naver_ad', label: '네이버 광고', category: '네이버', isPaidAd: true, matchReason: '네이버 광고 클릭ID' };
  }
  if (hasDaangnParam) {
    return { ...baseEnv, channel: 'daangn_ad', label: '당근 광고', category: '당근', isPaidAd: true, matchReason: '당근 광고 파라미터' };
  }
  if (hasKakaoClickId) {
    return { ...baseEnv, channel: 'kakao_ad', label: '카카오 광고', category: '메신저/문자', isPaidAd: true, matchReason: '카카오 광고 클릭ID' };
  }
  if (hasGoogleAdClickId) {
    return { ...baseEnv, channel: 'google_ad', label: '구글 광고', category: '구글/포털', isPaidAd: true, matchReason: '구글 광고 클릭ID' };
  }
  if (hasMetaClickId) {
    if (ua.includes('instagram') || (validRefHost && validRefHost.includes('instagram'))) {
      return { ...baseEnv, channel: 'instagram_ad', label: '인스타그램 광고', category: 'SNS', isPaidAd: true, matchReason: '메타 광고 클릭ID(인스타)' };
    }
    return { ...baseEnv, channel: 'meta_ad', label: '메타/페이스북 광고', category: 'SNS', isPaidAd: true, matchReason: '메타 광고 클릭ID' };
  }
  if (hasInstaShareId) {
    return { ...baseEnv, channel: 'instagram', label: '인스타그램', category: 'SNS', isPaidAd: false, matchReason: '인스타 공유 파라미터' };
  }
  if (hasTiktokClickId) {
    return { ...baseEnv, channel: 'tiktok', label: '틱톡 광고', category: 'SNS', isPaidAd: true, matchReason: '틱톡 광고 클릭ID' };
  }

  // 3. Referrer Domain
  if (validRefHost) {
    if (validRefHost.includes('daangn.com') || validRefHost.includes('karrotmarket.com')) {
      return { ...baseEnv, channel: 'daangn_ad', label: '당근 광고', category: '당근', isPaidAd: true, matchReason: '리퍼러 도메인' };
    }
    if (validRefHost === 'ad.naver.com' || validRefHost === 'sa.naver.com' || validRefHost === 'adcr.naver.com') {
      return { ...baseEnv, channel: 'naver_ad', label: '네이버 광고', category: '네이버', isPaidAd: true, matchReason: '리퍼러 도메인' };
    }
    if (validRefHost.includes('search.naver.com')) {
      return { ...baseEnv, channel: 'naver_search', label: '네이버 검색', category: '네이버', isPaidAd: false, matchReason: '리퍼러 도메인' };
    }
    if (validRefHost.includes('blog.naver.com')) {
      return { ...baseEnv, channel: 'naver_blog', label: '네이버 블로그', category: '네이버', isPaidAd: false, matchReason: '리퍼러 도메인' };
    }
    if (validRefHost.includes('cafe.naver.com')) {
      return { ...baseEnv, channel: 'naver_cafe', label: '네이버 카페', category: '네이버', isPaidAd: false, matchReason: '리퍼러 도메인' };
    }
    if (validRefHost.includes('kin.naver.com')) {
      return { ...baseEnv, channel: 'naver_kin', label: '네이버 지식iN', category: '네이버', isPaidAd: false, matchReason: '리퍼러 도메인' };
    }
    if (validRefHost.endsWith('naver.com')) {
      return { ...baseEnv, channel: 'naver', label: '네이버', category: '네이버', isPaidAd: false, matchReason: '리퍼러 도메인' };
    }
    if (validRefHost.includes('googleadservices.com') || validRefHost.includes('doubleclick.net') || validRefHost.includes('googlesyndication.com')) {
      return { ...baseEnv, channel: 'google_ad', label: '구글 광고', category: '구글/포털', isPaidAd: true, matchReason: '리퍼러 도메인' };
    }
    if (validRefHost.includes('google.')) {
      return { ...baseEnv, channel: 'google', label: '구글 검색', category: '구글/포털', isPaidAd: false, matchReason: '리퍼러 도메인' };
    }
    if (validRefHost.includes('instagram.com')) {
      return { ...baseEnv, channel: 'instagram', label: '인스타그램', category: 'SNS', isPaidAd: false, matchReason: '리퍼러 도메인' };
    }
    if (validRefHost.includes('facebook.com') || validRefHost === 'fb.com') {
      return { ...baseEnv, channel: 'facebook', label: '페이스북', category: 'SNS', isPaidAd: false, matchReason: '리퍼러 도메인' };
    }
    if (validRefHost.includes('kakao.com')) {
      return { ...baseEnv, channel: 'kakao', label: '카카오톡 링크', category: '메신저/문자', isPaidAd: false, matchReason: '리퍼러 도메인' };
    }
    if (validRefHost.includes('daum.net')) {
      return { ...baseEnv, channel: 'daum', label: '다음', category: '구글/포털', isPaidAd: false, matchReason: '리퍼러 도메인' };
    }
    if (validRefHost.includes('youtube.com') || validRefHost === 'youtu.be') {
      return { ...baseEnv, channel: 'youtube', label: '유튜브', category: 'SNS', isPaidAd: false, matchReason: '리퍼러 도메인' };
    }
    if (validRefHost.includes('band.us')) {
      return { ...baseEnv, channel: 'band', label: '네이버 밴드', category: 'SNS', isPaidAd: false, matchReason: '리퍼러 도메인' };
    }
    if (validRefHost.includes('threads.net')) {
      return { ...baseEnv, channel: 'threads', label: '스레드', category: 'SNS', isPaidAd: false, matchReason: '리퍼러 도메인' };
    }
    if (validRefHost.includes('tiktok.com')) {
      return { ...baseEnv, channel: 'tiktok', label: '틱톡', category: 'SNS', isPaidAd: false, matchReason: '리퍼러 도메인' };
    }
    if (validRefHost === 't.co' || validRefHost.includes('twitter.com') || validRefHost.includes('x.com')) {
      return { ...baseEnv, channel: 'x', label: 'X (트위터)', category: 'SNS', isPaidAd: false, matchReason: '리퍼러 도메인' };
    }
    return { ...baseEnv, channel: 'external', label: `외부링크 (${validRefHost})`, category: '직접/기타', isPaidAd: false, matchReason: '리퍼러 도메인' };
  }

  // 4. In-App Browser User-Agent (crucial when referrer is stripped)
  if (ua.includes('kakaotalk')) {
    return { ...baseEnv, channel: 'kakao', label: '카카오톡 링크', category: '메신저/문자', isPaidAd: false, matchReason: '인앱 브라우저(UA)' };
  }
  if (ua.includes('instagram')) {
    return { ...baseEnv, channel: 'instagram', label: '인스타그램', category: 'SNS', isPaidAd: false, matchReason: '인앱 브라우저(UA)' };
  }
  if (ua.includes('daangn') || ua.includes('karrot')) {
    return { ...baseEnv, channel: 'daangn_ad', label: '당근 광고', category: '당근', isPaidAd: true, matchReason: '인앱 브라우저(UA)' };
  }
  if (ua.includes('naver(')) {
    return { ...baseEnv, channel: 'naver_app', label: '네이버 앱', category: '네이버', isPaidAd: false, matchReason: '인앱 브라우저(UA)' };
  }
  if (ua.includes('fban') || ua.includes('fbav') || ua.includes('fb_iab')) {
    return { ...baseEnv, channel: 'facebook', label: '페이스북', category: 'SNS', isPaidAd: false, matchReason: '인앱 브라우저(UA)' };
  }
  if (ua.includes('band/')) {
    return { ...baseEnv, channel: 'band', label: '네이버 밴드', category: 'SNS', isPaidAd: false, matchReason: '인앱 브라우저(UA)' };
  }
  if (ua.includes('barcelona')) {
    return { ...baseEnv, channel: 'threads', label: '스레드', category: 'SNS', isPaidAd: false, matchReason: '인앱 브라우저(UA)' };
  }
  if (ua.includes('line/')) {
    return { ...baseEnv, channel: 'line', label: '라인', category: '메신저/문자', isPaidAd: false, matchReason: '인앱 브라우저(UA)' };
  }
  if (ua.includes('bytedancewebview') || ua.includes('tiktok') || ua.includes('musical_ly')) {
    return { ...baseEnv, channel: 'tiktok', label: '틱톡', category: 'SNS', isPaidAd: false, matchReason: '인앱 브라우저(UA)' };
  }

  // 5. Direct Traffic (split by Mobile/Tablet vs PC)
  if (env.deviceType === '모바일' || env.deviceType === '태블릿') {
    return { ...baseEnv, channel: 'direct_mobile', label: '직접 유입 (모바일)', category: '직접/기타', isPaidAd: false, matchReason: '직접 접속(모바일)' };
  }
  return { ...baseEnv, channel: 'direct_pc', label: '직접 유입 (PC)', category: '직접/기타', isPaidAd: false, matchReason: '직접 접속(PC)' };
}
