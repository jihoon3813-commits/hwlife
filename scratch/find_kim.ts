import { query } from "../convex/_generated/server";

export default query({
  args: {},
  handler: async (ctx) => {
    const inquiries = await ctx.db.query("inquiries").collect();
    const kim = inquiries.find(i => i.name.includes("김정근") || i.phone.includes("5872-6504"));
    return kim || "Not found";
  }
});
