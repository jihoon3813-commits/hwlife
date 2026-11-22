import { useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { captureVisitAttribution } from '../utils/attribution';

/**
 * Universal Visit Tracking Hook
 * Tracks page views (PV), unique visitors (UV via real IP), referrers,
 * UTM/ad click attribution, in-app browsers, and channel attribution.
 *
 * @param channelId Optional channel / partner identifier (subdomain or channel name)
 * @param customPath Optional explicit path (defaults to window.location.pathname + search)
 */
export function useTrackVisit(channelId?: string, customPath?: string) {
  const logVisit = useMutation(api.stats.logVisit);

  useEffect(() => {
    let isMounted = true;

    const track = async () => {
      try {
        let ip = '0.0.0.0';
        try {
          const response = await fetch('https://api.ipify.org?format=json');
          if (response.ok) {
            const data = await response.json();
            if (data && data.ip) {
              ip = data.ip;
            }
          }
        } catch {
          // Fallback if public IP service is unavailable
        }

        if (!isMounted) return;

        const search = typeof window !== 'undefined' ? window.location.search : '';
        const resolvedPath = customPath
          ? (customPath.includes('?') || !search ? customPath : `${customPath}${search}`)
          : undefined;

        const { classified, path, referrer, userAgent } = captureVisitAttribution(resolvedPath);
        const finalChannelId = channelId === '본사' ? undefined : (channelId || undefined);

        await logVisit({
          ip,
          userAgent,
          referrer,
          path,
          channelId: finalChannelId,
          trafficChannel: classified.channel,
          trafficLabel: classified.label,
          utmSource: classified.utmSource,
          utmMedium: classified.utmMedium,
          utmCampaign: classified.utmCampaign,
          utmContent: classified.utmContent,
          utmTerm: classified.utmTerm,
          deviceType: classified.deviceType,
        });
      } catch (e) {
        console.error('Visit tracking failed:', e);
      }
    };

    track();

    return () => {
      isMounted = false;
    };
  }, [logVisit, channelId, customPath]);
}
