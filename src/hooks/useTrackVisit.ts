import { useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

/**
 * Universal Visit Tracking Hook
 * Tracks page views (PV), unique visitors (UV via real IP), referrers, and channel attribution.
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

        const path = customPath || (typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/');
        const referrer = (typeof document !== 'undefined' && document.referrer) ? document.referrer : '직접 유입';
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'browser';
        const finalChannelId = channelId === '본사' ? undefined : (channelId || undefined);

        await logVisit({
          ip,
          userAgent,
          referrer,
          path,
          channelId: finalChannelId,
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
