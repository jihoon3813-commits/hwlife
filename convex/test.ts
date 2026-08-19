import { query } from "./_generated/server";

export const testTimezone = query({
  handler: async () => {
    return { ok: true };
  }
});
