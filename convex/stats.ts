import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const logVisit = mutation({
  args: {
    ip: v.string(),
    userAgent: v.string(),
    referrer: v.optional(v.string()),
    path: v.string(),
    channelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("visits", {
      ...args,
      timestamp: Date.now(),
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

    // Referrers (Top 10) - based on current period
    const referrerMap = new Map<string, number>();
    currentVisits.forEach(v => {
      const ref = v.referrer || "직접 유입 (Direct)";
      referrerMap.set(ref, (referrerMap.get(ref) || 0) + 1);
    });
    const topReferrers = Array.from(referrerMap.entries())
      .map(([url, count]) => ({ url, count }))
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
        else if (path === '/care' || path.startsWith('/care/')) name = `LG가전구독 (${path})`;
        else if (path === '/care10' || path.startsWith('/care10/')) name = `LG구독 10%할인 (${path})`;
        else if (path === '/care-solutions' || path.startsWith('/care-solutions/')) name = `LG케어솔루션 (${path})`;
        else if (path === '/lgsub' || path.startsWith('/lgsub/')) name = `LG가전구독 (${path})`;
        else if (path === '/lg' || path.startsWith('/lg/')) name = `LG가전 (${path})`;
        else if (path === '/package60' || path.startsWith('/package60/')) name = `가전상조 60패키지 (${path})`;
        else if (path === '/package_up' || path.startsWith('/package_up/')) name = `60패키지 UP가전 (${path})`;
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
      landingStats,
      ipLogs: ipLogs.map(({ip, count, lastVisit}) => ({ ip, count, lastVisit, location: '확인중' })),
      dailyStats
    };
  }
});
