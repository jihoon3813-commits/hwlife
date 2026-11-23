export interface GoogleContactCustomer {
  _id?: string;
  name?: string;
  phone?: string;
  productName?: string;
  appliance?: string;
  status?: string;
}

export interface GoogleContactsSyncResult {
  totalCandidates: number;
  createdCount: number;
  skippedDuplicateCount: number;
  failedCount: number;
}

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const CONTACTS_SCOPE = 'https://www.googleapis.com/auth/contacts';

let cachedToken: { token: string; expiresAt: number; clientId: string } | null = null;
let gisLoadPromise: Promise<void> | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  if ((window as any).google?.accounts?.oauth2) {
    return Promise.resolve();
  }
  if (gisLoadPromise) return gisLoadPromise;

  gisLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Google 인증 스크립트를 불러오지 못했습니다.')));
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google 인증 스크립트를 불러오지 못했습니다.'));
    document.head.appendChild(script);
  });

  return gisLoadPromise;
}

function normalizeKoreanPhone(raw: string): string {
  const digits = (raw || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('82') && digits.length >= 11) {
    return `0${digits.slice(2)}`;
  }
  return digits;
}

function formatKoreanPhone(raw: string): string {
  const digits = normalizeKoreanPhone(raw);
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    if (digits.startsWith('02')) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw.trim();
}

async function requestGoogleContactsToken(clientId: string): Promise<string> {
  const now = Date.now();
  if (
    cachedToken &&
    cachedToken.clientId === clientId &&
    cachedToken.expiresAt > now + 60_000
  ) {
    return cachedToken.token;
  }

  await loadGoogleIdentityScript();
  const oauth2 = (window as any).google?.accounts?.oauth2;
  if (!oauth2) {
    throw new Error('Google OAuth 모듈을 초기화할 수 없습니다.');
  }

  return new Promise<string>((resolve, reject) => {
    const tokenClient = oauth2.initTokenClient({
      client_id: clientId,
      scope: CONTACTS_SCOPE,
      callback: (resp: any) => {
        if (resp?.error) {
          reject(new Error(resp.error_description || resp.error || '구글 로그인에 실패했습니다.'));
          return;
        }
        if (!resp?.access_token) {
          reject(new Error('구글 인증 토큰을 받지 못했습니다.'));
          return;
        }
        const expiresInSec = Number(resp.expires_in || 3500);
        cachedToken = {
          token: resp.access_token,
          expiresAt: Date.now() + expiresInSec * 1000,
          clientId,
        };
        resolve(resp.access_token);
      },
      error_callback: (err: any) => {
        reject(new Error(err?.message || '구글 로그인 창이 닫혔거나 차단되었습니다.'));
      },
    });
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

async function fetchExistingPhoneSet(accessToken: string): Promise<Set<string>> {
  const existing = new Set<string>();
  let pageToken = '';

  for (let page = 0; page < 20; page += 1) {
    const url = new URL('https://people.googleapis.com/v1/people/me/connections');
    url.searchParams.set('personFields', 'phoneNumbers');
    url.searchParams.set('pageSize', '1000');
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken);
    }

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 401) {
      cachedToken = null;
      throw new Error('구글 인증이 만료되었습니다. 다시 시도해주세요.');
    }
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = errBody?.error?.message || `Google People API 오류 (${res.status})`;
      throw new Error(msg);
    }

    const data = await res.json();
    const connections = Array.isArray(data?.connections) ? data.connections : [];
    for (const person of connections) {
      const phones = Array.isArray(person?.phoneNumbers) ? person.phoneNumbers : [];
      for (const p of phones) {
        const norm = normalizeKoreanPhone(p?.value || p?.canonicalForm || '');
        if (norm.length >= 9) {
          existing.add(norm);
        }
      }
    }

    if (!data?.nextPageToken) break;
    pageToken = data.nextPageToken;
  }

  return existing;
}

export async function syncCustomersToGoogleContacts(
  customers: GoogleContactCustomer[],
  clientId: string
): Promise<GoogleContactsSyncResult> {
  const trimmedClientId = clientId.trim();
  if (!trimmedClientId) {
    throw new Error('Google OAuth 클라이언트 ID가 설정되지 않았습니다.');
  }

  // 목록 내 중복 번호 제거
  const uniqueMap = new Map<string, GoogleContactCustomer>();
  for (const c of customers) {
    const norm = normalizeKoreanPhone(c.phone || '');
    if (norm.length < 9) continue;
    if (!uniqueMap.has(norm)) {
      uniqueMap.set(norm, c);
    }
  }

  const uniqueCustomers = Array.from(uniqueMap.entries());
  if (uniqueCustomers.length === 0) {
    return {
      totalCandidates: 0,
      createdCount: 0,
      skippedDuplicateCount: 0,
      failedCount: 0,
    };
  }

  const accessToken = await requestGoogleContactsToken(trimmedClientId);
  const existingPhones = await fetchExistingPhoneSet(accessToken);

  const toCreate: GoogleContactCustomer[] = [];
  let skippedDuplicateCount = 0;

  for (const [normPhone, customer] of uniqueCustomers) {
    if (existingPhones.has(normPhone)) {
      skippedDuplicateCount += 1;
    } else {
      toCreate.push(customer);
    }
  }

  let createdCount = 0;
  let failedCount = 0;

  // Google People API batchCreateContacts는 1회 최대 200건 지원
  for (let i = 0; i < toCreate.length; i += 200) {
    const chunk = toCreate.slice(i, i + 200);
    const contactsPayload = chunk.map((c) => {
      const name = (c.name || '고객').trim() || '고객';
      const formattedPhone = formatKoreanPhone(c.phone || '');
      const noteParts = [c.productName, c.appliance, c.status].filter(
        (v) => typeof v === 'string' && v.trim().length > 0
      );

      return {
        contactPerson: {
          names: [{ givenName: name }],
          phoneNumbers: [{ value: formattedPhone, type: 'mobile' }],
          organizations: [{ name: '효원상조 고객' }],
          ...(noteParts.length > 0
            ? { biographies: [{ value: noteParts.join(' / '), contentType: 'TEXT_PLAIN' }] }
            : {}),
        },
      };
    });

    const res = await fetch('https://people.googleapis.com/v1/people:batchCreateContacts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contacts: contactsPayload,
        readMask: 'names,phoneNumbers',
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = errBody?.error?.message || `구글 주소록 등록 오류 (${res.status})`;
      throw new Error(msg);
    }

    const result = await res.json();
    const createdList = Array.isArray(result?.createdPeople) ? result.createdPeople : [];
    for (const item of createdList) {
      if (item?.httpStatusCode && item.httpStatusCode >= 400) {
        failedCount += 1;
      } else {
        createdCount += 1;
      }
    }
  }

  return {
    totalCandidates: uniqueCustomers.length,
    createdCount,
    skippedDuplicateCount,
    failedCount,
  };
}
