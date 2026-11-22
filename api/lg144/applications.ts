import fs from 'node:fs';
import path from 'node:path';

interface CatalogOption {
  months?: number;
  base?: number;
  sale?: number;
  care?: string;
  cycle?: string;
}

interface CatalogProduct {
  id: string;
  model: string;
  name: string;
  category: string;
  base?: number;
  sale?: number;
  options?: CatalogOption[];
}

interface CatalogData {
  asOf?: string;
  products: CatalogProduct[];
}

let cachedCatalog: CatalogData | null = null;

function getCatalog(): CatalogData {
  if (cachedCatalog) return cachedCatalog;
  const catalogPath = path.join(process.cwd(), 'public', 'hyowon-talk', 'catalog.json');
  const raw = fs.readFileSync(catalogPath, 'utf8');
  cachedCatalog = JSON.parse(raw) as CatalogData;
  return cachedCatalog;
}

function resolveConvexSiteUrl(): string {
  if (process.env.VITE_CONVEX_SITE_URL) {
    return process.env.VITE_CONVEX_SITE_URL.replace(/\/$/, '');
  }
  if (process.env.VITE_CONVEX_URL) {
    return process.env.VITE_CONVEX_URL.replace('.convex.cloud', '.convex.site').replace(/\/$/, '');
  }
  return 'https://elated-fish-742.convex.site';
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: '허용되지 않은 요청입니다.' });
  }

  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!contentType.startsWith('application/json')) {
    return res.status(415).json({ error: '요청 형식을 확인해 주세요.' });
  }

  let data: any = req.body;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return res.status(400).json({ error: '신청 내용을 읽을 수 없습니다.' });
    }
  }

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: '신청 내용을 읽을 수 없습니다.' });
  }

  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const phone = typeof data.phone === 'string' ? data.phone.replace(/-/g, '').trim() : '';
  const note = typeof data.note === 'string' ? data.note.trim() : '';
  const key = typeof data.key === 'string' ? data.key.trim() : '';

  if (
    !name ||
    name.length > 40 ||
    !/^01(?:0\d{8}|[16789]\d{7,8})$/.test(phone) ||
    note.length > 300 ||
    data.consent !== true ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)
  ) {
    return res.status(422).json({ error: '이름, 휴대폰 번호와 필수 동의를 확인해 주세요.' });
  }

  let catalog: CatalogData;
  try {
    catalog = getCatalog();
  } catch {
    return res.status(503).json({ error: '상품 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' });
  }

  const item = catalog.products.find((p) => p.id === data.productId);
  const options = item?.options || [];
  const index = data.optionIndex;

  if (
    !item ||
    !Number.isInteger(index) ||
    (options.length ? index < 0 || index >= options.length : index !== -1)
  ) {
    return res.status(422).json({ error: '모델의 구독 조건을 다시 선택해 주세요.' });
  }

  const selectedOption = index >= 0 ? options[index] : undefined;
  const enrichedPayload = {
    ...data,
    name,
    phone,
    note,
    model: item.model,
    applianceName: item.name,
    subscriptionPeriod: selectedOption?.months ? `${selectedOption.months}개월` : undefined,
    careCycle: selectedOption?.cycle || undefined,
    careType: selectedOption?.care || undefined,
    monthlySale: selectedOption?.sale ?? item.sale,
    catalogDate: data.catalogDate || catalog.asOf,
  };

  try {
    const convexResponse = await fetch(`${resolveConvexSiteUrl()}/api/lg144/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrichedPayload),
    });

    const result = await convexResponse.json().catch(() => ({}));
    return res.status(convexResponse.status).json(result);
  } catch {
    return res.status(503).json({ error: '저장이 완료되지 않았습니다. 잠시 후 같은 정보로 다시 시도해 주세요.' });
  }
}
