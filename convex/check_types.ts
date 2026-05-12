import { query } from "./_generated/server";

export default query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    if (products.length > 0) {
      return {
        firstProduct: {
          name: products[0].name,
          planId: products[0].planId,
          planIdType: typeof products[0].planId
        }
      };
    }
    return "No products found";
  },
});
