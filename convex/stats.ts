import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { classifyTrafficSource } from "./trafficSource";

export const logVisit = mutation({
  args: {
    ip: v.string(),
    userAgent: v.string(),
    referrer: v.optional(v.string()),
    path: v.string(),
    channelId: v.optional(v.string()),
    trafficChannel: v.optional(v.string()),
    trafficLabel: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
    deviceType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const classified = classifyTrafficSource({
      path: args.path,
      referrer: args.referrer,
      userAgent: args.userAgent,
    });

    await ctx.db.insert("visits", {
      ip: args.ip,
      userAgent: args.userAgent,
      referrer: args.referrer,
      path: args.path,
      channelId: args.channelId,
      timestamp: Date.now(),
      trafficChannel: args.trafficChannel || classified.channel,
      trafficLabel: args.trafficLabel || classified.label,
      utmSource: args.utmSource || classified.utmSource,
      utmMedium: args.utmMedium || classified.utmMedium,
      utmCampaign: args.utmCampaign || classified.utmCampaign,
      utmContent: args.utmContent || classified.utmContent,
      utmTerm: args.utmTerm || classified.utmTerm,
      deviceType: args.deviceType || classified.deviceType,
    });
  },
});

export const getDashboardStats = query({
  args: {
    period: v.optional(v.string()), // "today", "week", "month"
    channelId: v.optional(v.string()),
    channelIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const period = args.period || "today";
    const now = Date.now();
    
    // 대한민국 시간(KST, UTC+9) 기준으로 오늘 시작 시간 계산
    const KST_OFFSET = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now + KST_OFFSET);
    const todayStart = new Date(now + KST_OFFSET);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayStartTime = todayStart.getTime() - KST_OFFSET; // 다시 UTC 타임스탬프로 변환하여 쿼리에 사용


    let currentStartTime = todayStartTime;
    let previousStartTime = todayStartTime - 24 * 60 * 60 * 1000;
    let previousEndTime = todayStartTime;

    if (period === "week") {
      currentStartTime = todayStartTime - 6 * 24 * 60 * 60 * 1000;
      previousStartTime = currentStartTime - 7 * 24 * 60 * 60 * 1000;
      previousEndTime = currentStartTime;
    } else if (period === "month") {
      currentStartTime = todayStartTime - 29 * 24 * 60 * 60 * 1000;
      previousStartTime = currentStartTime - 30 * 24 * 60 * 60 * 1000;
      previousEndTime = currentStartTime;
    }

    const filterByChannels = (q: any) => {
        if (args.channelIds && args.channelIds.length > 0) {
            const conditions = args.channelIds.map(id => {
                if (id === 'default' || id === '본사') {
                    return q.or(
                        q.eq(q.field("channelId"), id),
                        q.eq(q.field("channelId"), undefined)
                    );
                }
                return q.eq(q.field("channelId"), id);
            });
            return q.or(...conditions);
        }
        if (args.channelId) {
            if (args.channelId === 'default' || args.channelId === '본사') {
                return q.or(
                    q.eq(q.field("channelId"), "default"),
                    q.eq(q.field("channelId"), "본사"),
                    q.eq(q.field("channelId"), undefined)
                );
            }
            return q.eq(q.field("channelId"), args.channelId);
        }
        return q;
    };

    // Current period stats
    let currentVisitsQuery = ctx.db
      .query("visits")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", currentStartTime));
    
    if (args.channelIds || args.channelId) {
        currentVisitsQuery = currentVisitsQuery.filter(filterByChannels);
    }
    const currentVisits = await currentVisitsQuery.collect();

    let inquiriesQuery = ctx.db.query("inquiries");
    if (args.channelIds || args.channelId) {
        inquiriesQuery = inquiriesQuery.filter(filterByChannels);
    }
    const allInquiries = await inquiriesQuery.collect();

    
    const currentInquiriesFiltered = allInquiries.filter(i => i.createdAt >= currentStartTime);

    // Previous period stats for comparison
    let previousVisitsQuery = ctx.db
      .query("visits")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", previousStartTime).lt("timestamp", previousEndTime));
    
    if (args.channelIds || args.channelId) {
        previousVisitsQuery = previousVisitsQuery.filter(filterByChannels);
    }

    const previousVisits = await previousVisitsQuery.collect();

    const previousInquiriesFiltered = allInquiries.filter(i => i.createdAt >= previousStartTime && i.createdAt < previousEndTime);

    // UV Calculation
    const getUV = (visits: any[]) => new Set(visits.map(v => v.ip)).size;
    const currentUV = getUV(currentVisits);
    const currentPV = currentVisits.length;
    
    const previousUV = getUV(previousVisits);
    const previousPV = previousVisits.length;

    // Changes
    const getChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? "+100%" : "0%";
      const change = ((current - previous) / previous) * 100;
      return (change >= 0 ? "+" : "") + change.toFixed(0) + "%";
    };

    // Classify every visit in current period
    const channelStatsMap = new Map<string, {
      channel: string;
      label: string;
      category: string;
      isPaidAd: boolean;
      ips: Set<string>;
      pv: number;
      inquiries: number;
      matchReasons: Set<string>;
    }>();

    const categoryStatsMap = new Map<string, {
      category: string;
      ips: Set<string>;
      pv: number;
      inquiries: number;
    }>();

    const utmMap = new Map<string, {
      utmSource: string;
      utmMedium: string;
      utmCampaign: string;
      utmContent: string;
      ips: Set<string>;
      pv: number;
      inquiries: number;
    }>();

    const deviceMap = new Map<string, number>();
    const browserMap = new Map<string, number>();
    const referrerMap = new Map<string, { count: number; channel: string; label: string; category: string }>();

    let botVisitsCount = 0;
    let realUserPV = 0;

    currentVisits.forEach(v => {
      const classified = classifyTrafficSource({
        path: v.path,
        referrer: v.referrer,
        userAgent: v.userAgent,
      });

      const chKey = v.trafficChannel || classified.channel;
      const chLabel = v.trafficLabel || classified.label;
      const category = classified.category;

      if (chKey === 'bot' || classified.deviceType === '봇') {
        botVisitsCount += 1;
        return;
      }

      realUserPV += 1;

      // Channel stats
      if (!channelStatsMap.has(chKey)) {
        channelStatsMap.set(chKey, {
          channel: chKey,
          label: chLabel,
          category,
          isPaidAd: classified.isPaidAd,
          ips: new Set(),
          pv: 0,
          inquiries: 0,
          matchReasons: new Set(),
        });
      }
      const chEntry = channelStatsMap.get(chKey)!;
      chEntry.ips.add(v.ip);
      chEntry.pv += 1;
      chEntry.matchReasons.add(classified.matchReason);

      // Category stats
      if (!categoryStatsMap.has(category)) {
        categoryStatsMap.set(category, {
          category,
          ips: new Set(),
          pv: 0,
          inquiries: 0,
        });
      }
      const catEntry = categoryStatsMap.get(category)!;
      catEntry.ips.add(v.ip);
      catEntry.pv += 1;

      // UTM campaign stats
      const uSource = v.utmSource || classified.utmSource;
      const uMedium = v.utmMedium || classified.utmMedium;
      const uCampaign = v.utmCampaign || classified.utmCampaign;
      const uContent = v.utmContent || classified.utmContent;
      if (uSource || uCampaign) {
        const utmKey = `${uSource || '-'}|${uMedium || '-'}|${uCampaign || '-'}|${uContent || '-'}`;
        if (!utmMap.has(utmKey)) {
          utmMap.set(utmKey, {
            utmSource: uSource || '-',
            utmMedium: uMedium || '-',
            utmCampaign: uCampaign || '-',
            utmContent: uContent || '-',
            ips: new Set(),
            pv: 0,
            inquiries: 0,
          });
        }
        const utmEntry = utmMap.get(utmKey)!;
        utmEntry.ips.add(v.ip);
        utmEntry.pv += 1;
      }

      // Device & Browser
      const dev = v.deviceType || classified.deviceType;
      deviceMap.set(dev, (deviceMap.get(dev) || 0) + 1);
      browserMap.set(classified.browser, (browserMap.get(classified.browser) || 0) + 1);

      // Referrer Top 10
      const refUrl = v.referrer && v.referrer !== '직접 유입' ? v.referrer : '직접 유입 (Direct)';
      const existingRef = referrerMap.get(refUrl);
      if (existingRef) {
        existingRef.count += 1;
      } else {
        referrerMap.set(refUrl, {
          count: 1,
          channel: chKey,
          label: chLabel,
          category,
        });
      }
    });

    // Attribute inquiries in current period to channels/categories/UTM
    currentInquiriesFiltered.forEach(inq => {
      let chKey = inq.trafficChannel;
      let chLabel = inq.trafficLabel;
      let category = '직접/기타';

      if (!chKey) {
        if (inq.inflow === 'daangn' || inq.source === 'daangn') {
          chKey = 'daangn_ad';
          chLabel = '당근 광고';
          category = '당근';
        } else if (inq.inflow === 'direct' || inq.source === 'direct') {
          chKey = 'direct_admin';
          chLabel = '관리자 직접등록';
          category = '직접/기타';
        } else {
          chKey = 'landing_untracked';
          chLabel = '랜딩 (경로 미식별)';
          category = '직접/기타';
        }
      } else {
        const mapped = channelStatsMap.get(chKey);
        if (mapped) {
          category = mapped.category;
        } else if (chKey.startsWith('kakao') || chKey === 'sms' || chKey === 'line') {
          category = '메신저/문자';
        } else if (chKey.startsWith('daangn')) {
          category = '당근';
        } else if (chKey.startsWith('naver')) {
          category = '네이버';
        } else if (['instagram', 'instagram_ad', 'facebook', 'meta_ad', 'youtube', 'band', 'threads', 'tiktok', 'x'].includes(chKey)) {
          category = 'SNS';
        } else if (chKey.startsWith('google') || chKey === 'daum') {
          category = '구글/포털';
        }
      }

      if (!channelStatsMap.has(chKey)) {
        channelStatsMap.set(chKey, {
          channel: chKey,
          label: chLabel || chKey,
          category,
          isPaidAd: chKey.includes('_ad'),
          ips: new Set(),
          pv: 0,
          inquiries: 0,
          matchReasons: new Set(['상담 신청']),
        });
      }
      channelStatsMap.get(chKey)!.inquiries += 1;

      if (!categoryStatsMap.has(category)) {
        categoryStatsMap.set(category, { category, ips: new Set(), pv: 0, inquiries: 0 });
      }
      categoryStatsMap.get(category)!.inquiries += 1;

      if (inq.utmSource || inq.utmCampaign) {
        const utmKey = `${inq.utmSource || '-'}|${inq.utmMedium || '-'}|${inq.utmCampaign || '-'}|${inq.utmContent || '-'}`;
        if (!utmMap.has(utmKey)) {
          utmMap.set(utmKey, {
            utmSource: inq.utmSource || '-',
            utmMedium: inq.utmMedium || '-',
            utmCampaign: inq.utmCampaign || '-',
            utmContent: inq.utmContent || '-',
            ips: new Set(),
            pv: 0,
            inquiries: 0,
          });
        }
        utmMap.get(utmKey)!.inquiries += 1;
      }
    });

    const trafficChannels = Array.from(channelStatsMap.values())
      .map(item => {
        const uv = item.ips.size;
        return {
          channel: item.channel,
          label: item.label,
          category: item.category,
          isPaidAd: item.isPaidAd,
          uv,
          pv: item.pv,
          inquiries: item.inquiries,
          conversionRate: uv > 0 ? Number(((item.inquiries / uv) * 100).toFixed(1)) : 0,
          share: realUserPV > 0 ? Number(((item.pv / realUserPV) * 100).toFixed(1)) : 0,
          matchReasons: Array.from(item.matchReasons),
        };
      })
      .sort((a, b) => (b.pv - a.pv) || (b.inquiries - a.inquiries));

    const categorySummary = Array.from(categoryStatsMap.values())
      .map(item => ({
        category: item.category,
        uv: item.ips.size,
        pv: item.pv,
        inquiries: item.inquiries,
        share: realUserPV > 0 ? Number(((item.pv / realUserPV) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => (b.pv - a.pv) || (b.inquiries - a.inquiries));

    const utmCampaigns = Array.from(utmMap.values())
      .map(item => ({
        utmSource: item.utmSource,
        utmMedium: item.utmMedium,
        utmCampaign: item.utmCampaign,
        utmContent: item.utmContent,
        uv: item.ips.size,
        pv: item.pv,
        inquiries: item.inquiries,
      }))
      .sort((a, b) => (b.pv - a.pv) || (b.inquiries - a.inquiries))
      .slice(0, 20);

    const deviceBreakdown = Array.from(deviceMap.entries())
      .map(([deviceType, count]) => ({
        deviceType,
        count,
        share: realUserPV > 0 ? Number(((count / realUserPV) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const browserBreakdown = Array.from(browserMap.entries())
      .map(([browser, count]) => ({
        browser,
        count,
        share: realUserPV > 0 ? Number(((count / realUserPV) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const topReferrers = Array.from(referrerMap.entries())
      .map(([url, data]) => ({
        url,
        count: data.count,
        channel: data.channel,
        label: data.label,
        category: data.category,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Landing Page Stats (Top paths)
    const pathMap = new Map<string, { pv: number; ips: Set<string> }>();
    currentVisits.forEach(v => {
      const path = v.path || "/";
      const cleanPath = path.split('?')[0].toLowerCase();
      if (!pathMap.has(cleanPath)) {
        pathMap.set(cleanPath, { pv: 0, ips: new Set() });
      }
      const data = pathMap.get(cleanPath)!;
      data.pv += 1;
      data.ips.add(v.ip);
    });

    const allLandings = await ctx.db.query("landings").collect();
    const landingNameMap = new Map<string, string>();
    allLandings.forEach(l => {
      if (l.path) {
        landingNameMap.set(l.path.toLowerCase().split('?')[0], l.name);
      }
    });

    const landingStats = Array.from(pathMap.entries()).map(([path, data]) => {
      let name = landingNameMap.get(path);
      if (!name) {
        if (path === '/') name = '메인 랜딩 (/)';
        else if (path === '/care_new' || path.startsWith('/care_new/') || path === '/care-new' || path.startsWith('/care-new/')) name = `LG가전구독(new) (${path})`;
        else if (path === '/care' || path.startsWith('/care/')) name = `LG가전구독 (${path})`;
        else if (path === '/care10' || path.startsWith('/care10/')) name = `LG구독 10%할인 (${path})`;
        else if (path === '/care-solutions' || path.startsWith('/care-solutions/')) name = `LG케어솔루션 (${path})`;
        else if (path === '/lgsub' || path.startsWith('/lgsub/')) name = `LG가전구독 (${path})`;
        else if (path === '/lg' || path.startsWith('/lg/')) name = `LG가전 (${path})`;
        else if (path === '/package60' || path.startsWith('/package60/')) name = `가전상조 60패키지 (${path})`;
        else if (path === '/package_up' || path.startsWith('/package_up/')) name = `60패키지 UP가전 (${path})`;
        else if (path === '/special60' || path.startsWith('/special60/')) name = `가전상조 60패키지(new) (${path})`;
        else if (path === '/living') name = '리빙144 (/living)';
        else if (path.startsWith('/living/')) name = `리빙144 (${path})`;
        else if (path === '/living2') name = '리빙144 v2 (/living2)';
        else if (path.startsWith('/living2/')) name = `리빙144 v2 (${path})`;
        else if (path === '/special') name = '스페셜299 (/special)';
        else if (path.startsWith('/special/')) name = `스페셜299 (${path})`;
        else if (path === '/special2') name = '스페셜299 v2 (/special2)';
        else if (path.startsWith('/special2/')) name = `스페셜299 v2 (${path})`;
        else if (path === '/kcc') name = 'KCC홈씨씨 (/kcc)';
        else if (path.startsWith('/kcc/')) name = `KCC홈씨씨 (${path})`;
        else if (path === '/lecture' || path.startsWith('/lecture/')) name = `영업자 교육자료 (${path})`;
        else if (path === '/consent' || path.startsWith('/consent/')) name = `동의서 서명 (${path})`;
        else name = path;
      }
      
      return {
        path,
        name,
        uv: data.ips.size,
        pv: data.pv
      };
    }).sort((a, b) => b.pv - a.pv);

    // IP Logs (Recent 20)
    const ipLogsMap = new Map<string, any>();
    currentVisits.forEach(v => {
      const existing = ipLogsMap.get(v.ip);
      if (!existing || v.timestamp > existing.timestamp) {
        const date = new Date(v.timestamp + 9 * 60 * 60 * 1000);
        const y = date.getUTCFullYear();
        const m = date.getUTCMonth() + 1;
        const d = date.getUTCDate();
        const h = date.getUTCHours();
        const ampm = h >= 12 ? '오후' : '오전';
        const h12 = h % 12 || 12;
        const min = String(date.getUTCMinutes()).padStart(2, '0');
        const s = String(date.getUTCSeconds()).padStart(2, '0');
        const kstString = `${y}. ${m}. ${d}. ${ampm} ${h12}:${min}:${s}`;

        ipLogsMap.set(v.ip, {
          ip: v.ip,
          count: (existing?.count || 0) + 1,
          lastVisit: kstString,
          timestamp: v.timestamp
        });
      } else {
        existing.count += 1;
      }
    });
    const ipLogs = Array.from(ipLogsMap.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20)
      .map(log => ({
        ...log,
        lastVisit: log.lastVisit // It's already formatted
      }));

    // Daily Stats for last 7 days (Always show 7 days)
    const dailyStats = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(todayStartTime - i * 24 * 60 * 60 * 1000);
      const start = d.getTime();
      const end = start + 24 * 60 * 60 * 1000;
      
      let dayVisitsQuery = ctx.db
        .query("visits")
        .withIndex("by_timestamp", (q) => q.gte("timestamp", start).lt("timestamp", end));
      
      if (args.channelIds || args.channelId) {
        dayVisitsQuery = dayVisitsQuery.filter(filterByChannels);
      }

      const dayVisits = await dayVisitsQuery.collect();
      
      const dayInquiries = allInquiries.filter(inq => inq.createdAt >= start && inq.createdAt < end);
      
      // KST 날짜 문자열 생성
      const kstDateStr = new Date(start + KST_OFFSET).toISOString().split('T')[0];
      
      dailyStats.push({
        date: kstDateStr,
        uv: new Set(dayVisits.map(v => v.ip)).size,
        pv: dayVisits.length,
        applies: dayInquiries.length
      });
    }

    return {
      summary: {
        uv: currentUV,
        pv: currentPV,
        inquiries: currentInquiriesFiltered.length,
        uvChange: getChange(currentUV, previousUV),
        pvChange: getChange(currentPV, previousPV),
        inquiryChange: getChange(currentInquiriesFiltered.length, previousInquiriesFiltered.length),
      },
      referrers: topReferrers,
      trafficChannels,
      categorySummary,
      utmCampaigns,
      deviceBreakdown,
      browserBreakdown,
      botVisitsCount,
      landingStats,
      ipLogs: ipLogs.map(({ip, count, lastVisit}) => ({ ip, count, lastVisit, location: '확인중' })),
      dailyStats
    };
  }
});
