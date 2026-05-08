import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";
import * as dotenv from "dotenv";

dotenv.config();

const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL || "");

async function checkInquiries() {
  try {
    const list = await convex.query(api.inquiries.list);
    console.log(`Total Inquiries: ${list.length}`);
    console.log('Recent 5:', list.slice(0, 5));
  } catch (err) {
    console.error('Error fetching inquiries:', err);
  }
}

checkInquiries();
