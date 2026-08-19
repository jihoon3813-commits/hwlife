import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(buffer).toString("base64");
  }
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

export const fetchImageBase64 = action({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    let targetUrl = (args.url || "").trim();
    if (!targetUrl) {
      return { success: false, error: "Empty URL" };
    }

    // Handle data: URL
    if (targetUrl.startsWith("data:image/")) {
      const parts = targetUrl.split(",");
      const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
      const base64 = parts[1];
      return { success: true, base64, contentType: mime };
    }

    // Handle protocol-relative URL (e.g. //gsc.lge.co.kr/...)
    if (targetUrl.startsWith("//")) {
      targetUrl = "https:" + targetUrl;
    }

    // If it's a storage ID (not starting with http)
    if (!targetUrl.startsWith("http")) {
      try {
        const storageUrl = await ctx.storage.getUrl(targetUrl as any);
        if (storageUrl) {
          targetUrl = storageUrl;
        }
      } catch (e) {
        console.error("Storage ID resolution error:", e);
      }
    }

    if (!targetUrl.startsWith("http")) {
      return { success: false, error: "Invalid URL format: " + targetUrl };
    }

    try {
      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': 'https://www.lge.co.kr/',
          'Origin': 'https://www.lge.co.kr'
        }
      });

      if (!res.ok) {
        console.error(`Fetch image failed with status ${res.status} for URL: ${targetUrl}`);
        return { success: false, error: `HTTP ${res.status}` };
      }

      const contentType = res.headers.get("content-type") || "image/jpeg";
      const arrayBuffer = await res.arrayBuffer();
      const base64 = arrayBufferToBase64(arrayBuffer);

      return {
        success: true,
        base64,
        contentType
      };
    } catch (e: any) {
      console.error(`Fetch image exception for URL: ${targetUrl}`, e);
      return {
        success: false,
        error: e?.message || "Failed to fetch image"
      };
    }
  },
});

