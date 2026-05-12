import { query } from "./_generated/server";

export default query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const plans = await ctx.db.query("plans").collect();
    
    const stats: Record<string, number> = {};
    products.forEach(p => {
      const key = `planId_${p.planId}`;
      stats[key] = (stats[key] || 0) + 1;
    });
    
    return {
      productCount: products.length,
      planCount: plans.length,
      stats,
      plans: plans.map(p => ({ id: p.numericId, name: p.name }))
    };
  },
});
