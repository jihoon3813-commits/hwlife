import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

http.route({
  path: "/api/daangn-lead",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

http.route({
  path: "/api/daangn-lead",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();
      const items = Array.isArray(body) ? body : [body];
      const createdIds: string[] = [];

      for (const item of items) {
        const name = String(item.name || item.고객명 || item.성함 || "").trim();
        const phone = String(item.phone || item.연락처 || item.전화번호 || item.휴대폰 || "").trim();
        if (!name || !phone) continue;

        const id = await ctx.runMutation(internal.inquiries.createDaangnLead, {
          name,
          phone,
          productName: item.productName || item.신청상품 || item.상품명 || undefined,
          appliance: item.appliance || item.결합제품 || item.관심가전 || item.가전 || undefined,
          account: item.account || item.구좌수 || undefined,
          supplier: item.supplier || item.공급사 || undefined,
          subscriptionPeriod: item.subscriptionPeriod || item.구독기간 || undefined,
          careCycle: item.careCycle || item.케어주기 || undefined,
          careType: item.careType || item.케어유형 || undefined,
          address: item.address || item.주소 || undefined,
          detailAddress: item.detailAddress || item.상세주소 || undefined,
          message: item.message || item.문의내용 || item.메모 || item.리드폼명 || undefined,
          channelId: item.channelId || item.채널 || undefined,
          isLgCare: item.isLgCare !== undefined ? Boolean(item.isLgCare) : undefined,
        });
        createdIds.push(id);
      }

      return new Response(
        JSON.stringify({ ok: true, count: createdIds.length, ids: createdIds }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ ok: false, error: err?.message || "Invalid request" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }),
});

export default http;
