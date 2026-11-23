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

function jsonReply(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

http.route({
  path: "/api/lg144/applications",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

http.route({
  path: "/api/lg144/applications",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const contentType = req.headers.get("content-type") || "";
      if (!contentType.toLowerCase().startsWith("application/json")) {
        return jsonReply({ error: "요청 형식을 확인해 주세요." }, 415);
      }

      const raw = await req.text();
      if (raw.length > 8000) {
        return jsonReply({ error: "입력 내용을 줄여주세요." }, 413);
      }

      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        return jsonReply({ error: "신청 내용을 읽을 수 없습니다." }, 400);
      }

      const name = typeof data?.name === "string" ? data.name.trim() : "";
      const phone = typeof data?.phone === "string" ? data.phone.replace(/-/g, "").trim() : "";
      const note = typeof data?.note === "string" ? data.note.trim() : "";
      const key = typeof data?.key === "string" ? data.key.trim() : "";
      const productId = typeof data?.productId === "string" ? data.productId.trim() : "";
      const model = typeof data?.model === "string" ? data.model.trim() : "";
      const optionIndex = data?.optionIndex;

      if (
        !name ||
        name.length > 40 ||
        !/^01(?:0\d{8}|[16789]\d{7,8})$/.test(phone) ||
        note.length > 300 ||
        data?.consent !== true ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)
      ) {
        return jsonReply({ error: "이름, 휴대폰 번호와 필수 동의를 확인해 주세요." }, 422);
      }

      if (!productId || !model || !Number.isInteger(optionIndex) || optionIndex < -1) {
        return jsonReply({ error: "모델의 구독 조건을 다시 선택해 주세요." }, 422);
      }

      const encoded = JSON.stringify([name, phone, note, productId, optionIndex, true]);
      const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(encoded));
      const payloadHash = Array.from(new Uint8Array(hashBuffer), (n) =>
        n.toString(16).padStart(2, "0")
      ).join("");

      const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString();
      const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
      const receipt = `HW-${kstNow.slice(0, 10).replace(/-/g, "")}-${randomPart}`;

      const attr = data?.attribution && typeof data.attribution === "object" ? data.attribution : {};

      const result = await ctx.runMutation(internal.inquiries.createLg144Application, {
        name,
        phone,
        note: note || undefined,
        productId,
        model,
        applianceName: typeof data?.applianceName === "string" ? data.applianceName.trim() || undefined : undefined,
        optionIndex,
        subscriptionPeriod: typeof data?.subscriptionPeriod === "string" ? data.subscriptionPeriod.trim() || undefined : undefined,
        careCycle: typeof data?.careCycle === "string" ? data.careCycle.trim() || undefined : undefined,
        careType: typeof data?.careType === "string" ? data.careType.trim() || undefined : undefined,
        monthlySale: typeof data?.monthlySale === "number" ? data.monthlySale : undefined,
        catalogDate: typeof data?.catalogDate === "string" ? data.catalogDate : undefined,
        consentVersion: typeof data?.consentVersion === "string" ? data.consentVersion : undefined,
        requestKey: key,
        payloadHash,
        receipt,
        channelId: typeof attr.ch === "string" ? attr.ch.slice(0, 100) : undefined,
        utmSource: typeof attr.utm_source === "string" ? attr.utm_source.slice(0, 180) : undefined,
        utmMedium: typeof attr.utm_medium === "string" ? attr.utm_medium.slice(0, 180) : undefined,
        utmCampaign: typeof attr.utm_campaign === "string" ? attr.utm_campaign.slice(0, 180) : undefined,
        utmContent: typeof attr.utm_content === "string" ? attr.utm_content.slice(0, 180) : undefined,
        utmTerm: typeof attr.utm_term === "string" ? attr.utm_term.slice(0, 180) : undefined,
      });

      if (!result.ok) {
        return jsonReply({ error: result.error }, result.status);
      }

      return jsonReply({ receipt: result.receipt }, result.status);
    } catch {
      return jsonReply(
        { error: "저장이 완료되지 않았습니다. 잠시 후 같은 정보로 다시 시도해 주세요." },
        503
      );
    }
  }),
});

http.route({
  path: "/api/sms-inbound",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

function pickFirstString(obj: Record<string, any>, keys: string[]): string {
  for (const key of keys) {
    const val = obj?.[key];
    if (typeof val === "string" && val.trim()) return val.trim();
    if (typeof val === "number") return String(val);
  }
  return "";
}

http.route({
  path: "/api/sms-inbound",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const configuredSecret = process.env.SMS_WEBHOOK_SECRET;
      if (configuredSecret) {
        const url = new URL(req.url);
        const headerSecret = req.headers.get("x-webhook-secret") || "";
        const querySecret = url.searchParams.get("secret") || "";
        if (headerSecret !== configuredSecret && querySecret !== configuredSecret) {
          return jsonReply({ ok: false, error: "Unauthorized" }, 401);
        }
      }

      const contentType = (req.headers.get("content-type") || "").toLowerCase();
      let items: Record<string, any>[] = [];

      if (contentType.includes("application/json")) {
        const parsed = await req.json();
        if (Array.isArray(parsed)) {
          items = parsed;
        } else if (Array.isArray(parsed?.messages)) {
          items = parsed.messages;
        } else if (parsed?.data && typeof parsed.data === "object") {
          items = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
        } else if (parsed && typeof parsed === "object") {
          items = [parsed];
        }
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const text = await req.text();
        const params = new URLSearchParams(text);
        const obj: Record<string, string> = {};
        params.forEach((v, k) => {
          obj[k] = v;
        });
        items = [obj];
      } else if (contentType.includes("multipart/form-data")) {
        const form = await req.formData();
        const obj: Record<string, string> = {};
        form.forEach((v, k) => {
          if (typeof v === "string") obj[k] = v;
        });
        items = [obj];
      } else {
        const raw = await req.text();
        try {
          const parsed = JSON.parse(raw);
          items = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          const params = new URLSearchParams(raw);
          const obj: Record<string, string> = {};
          params.forEach((v, k) => {
            obj[k] = v;
          });
          items = [obj];
        }
      }

      const results = [];
      for (const item of items) {
        const senderPhone = pickFirstString(item, [
          "from",
          "sender",
          "senderPhone",
          "phone",
          "caller",
          "발신번호",
        ]);
        const receiverNumber = pickFirstString(item, [
          "to",
          "receiver",
          "receiverNumber",
          "called",
          "수신번호",
        ]);
        const message = pickFirstString(item, [
          "text",
          "msg",
          "message",
          "content",
          "body",
          "내용",
        ]);
        const title = pickFirstString(item, ["subject", "title", "제목"]);

        if (!senderPhone || !message) continue;

        const res = await ctx.runMutation(internal.sms.recordInboundSms, {
          senderPhone,
          receiverNumber: receiverNumber || undefined,
          message,
          title: title || undefined,
        });
        results.push(res);
      }

      return jsonReply({ ok: true, processed: results.length, results }, 200);
    } catch (err: any) {
      return jsonReply({ ok: false, error: err?.message || "Invalid request" }, 400);
    }
  }),
});

export default http;
