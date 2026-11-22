import { classifyTrafficSource, ClassifiedTrafficSource } from '../../convex/trafficSource';

const STORAGE_KEY = 'hyowon_traffic_attribution_v1';
const ATTRIBUTION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface StoredAttribution {
  channel: string;
  label: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  deviceType?: string;
  capturedAt: number;
}

function isDirectChannel(channel: string): boolean {
  return channel === 'direct_mobile' || channel === 'direct_pc';
}

export function readStoredAttribution(): StoredAttribution | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAttribution;
    if (!parsed || !parsed.channel) return null;
    if (Date.now() - parsed.capturedAt > ATTRIBUTION_TTL_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function captureVisitAttribution(customPath?: string): {
  classified: ClassifiedTrafficSource;
  path: string;
  referrer: string;
  userAgent: string;
} {
  const path =
    customPath ||
    (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/');
  const referrer =
    typeof document !== 'undefined' && document.referrer ? document.referrer : '직접 유입';
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'browser';
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : undefined;

  const classified = classifyTrafficSource({
    path,
    referrer,
    userAgent,
    currentHost,
  });

  if (typeof window !== 'undefined' && classified.channel !== 'bot') {
    const existing = readStoredAttribution();
    // Save if no existing attribution, or if new visit is non-direct (external/UTM/in-app) while existing was direct,
    // or if new visit has explicit UTM/Ad Click ID
    const hasExplicitCampaign = Boolean(classified.utmSource || classified.utmCampaign || classified.isPaidAd);
    const shouldOverwrite =
      !existing ||
      hasExplicitCampaign ||
      (isDirectChannel(existing.channel) && !isDirectChannel(classified.channel));

    if (shouldOverwrite) {
      const payload: StoredAttribution = {
        channel: classified.channel,
        label: classified.label,
        utmSource: classified.utmSource,
        utmMedium: classified.utmMedium,
        utmCampaign: classified.utmCampaign,
        utmContent: classified.utmContent,
        utmTerm: classified.utmTerm,
        referrer: referrer !== '직접 유입' ? referrer : undefined,
        deviceType: classified.deviceType,
        capturedAt: Date.now(),
      };
      try {
        const serialized = JSON.stringify(payload);
        window.sessionStorage.setItem(STORAGE_KEY, serialized);
        window.localStorage.setItem(STORAGE_KEY, serialized);
      } catch {
        // Ignore storage quota / privacy mode errors
      }
    }
  }

  return { classified, path, referrer, userAgent };
}

export function getInquiryAttribution(): {
  trafficChannel?: string;
  trafficLabel?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  deviceType?: string;
} {
  const stored = readStoredAttribution();
  if (stored) {
    return {
      trafficChannel: stored.channel,
      trafficLabel: stored.label,
      utmSource: stored.utmSource,
      utmMedium: stored.utmMedium,
      utmCampaign: stored.utmCampaign,
      utmContent: stored.utmContent,
      utmTerm: stored.utmTerm,
      referrer: stored.referrer,
      deviceType: stored.deviceType,
    };
  }

  const { classified, referrer } = captureVisitAttribution();
  return {
    trafficChannel: classified.channel,
    trafficLabel: classified.label,
    utmSource: classified.utmSource,
    utmMedium: classified.utmMedium,
    utmCampaign: classified.utmCampaign,
    utmContent: classified.utmContent,
    utmTerm: classified.utmTerm,
    referrer: referrer !== '직접 유입' ? referrer : undefined,
    deviceType: classified.deviceType,
  };
}
