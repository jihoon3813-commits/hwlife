import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const fixOrders = mutation({
  handler: async (ctx) => {
    const plans = await ctx.db.query("plans").collect();
    for (let i = 0; i < plans.length; i++) {
      if (plans[i].order === undefined) {
        await ctx.db.patch(plans[i]._id, { order: i });
      }
    }
  },
});
