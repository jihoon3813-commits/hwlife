import { query } from "./_generated/server";

export const testTimezone = query({
  handler: async () => {
    const now = Date.now();
    try {
      const kst = new Date(now).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
      const utc = new Date(now).toLocaleString('en-US', { timeZone: 'UTC' });
      return { kst, utc, supportsTimezone: true };
    } catch (e: any) {
      return { error: e.message, supportsTimezone: false };
    }
  },
});
