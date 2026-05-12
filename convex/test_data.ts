import { v } from "convex/values";
import { query } from "./_generated/server";

export const check = query({
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const plans = await ctx.db.query("plans").collect();
    return {
      productPlanIds: products.map(p => ({ name: p.name, planId: p.planId })),
      plans: plans.map(p => ({ name: p.name, numericId: p.numericId })),
    };
  },
});
