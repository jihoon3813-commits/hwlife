import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const logVisit = mutation({
  args: {
    ip: v.string(),
    userAgent: v.string(),
    referrer: v.optional(v.string()),
    path: v.string(),
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

    // Current period stats
    const currentVisits = await ctx.db
      .query("visits")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", currentStartTime))
      .collect();

    const allInquiries = await ctx.db
      .query("inquiries")
      .collect();
    
    const currentInquiriesFiltered = allInquiries.filter(i => i.createdAt >= currentStartTime);

    // Previous period stats for comparison
    const previousVisits = await ctx.db
      .query("visits")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", previousStartTime).lt("timestamp", previousEndTime))
      .collect();

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

    // IP Logs (Recent 20)
    const ipLogsMap = new Map<string, any>();
    currentVisits.forEach(v => {
      const existing = ipLogsMap.get(v.ip);
      if (!existing || v.timestamp > existing.timestamp) {
        ipLogsMap.set(v.ip, {
          ip: v.ip,
          count: (existing?.count || 0) + 1,
          lastVisit: new Date(v.timestamp + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').split('.')[0].substring(5), // "MM-DD HH:mm:ss"
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
      
      const dayVisits = await ctx.db
        .query("visits")
        .withIndex("by_timestamp", (q) => q.gte("timestamp", start).lt("timestamp", end))
        .collect();
      
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
      ipLogs: ipLogs.map(({ip, count, lastVisit}) => ({ ip, count, lastVisit, location: '확인중' })),
      dailyStats
    };
  }
});
