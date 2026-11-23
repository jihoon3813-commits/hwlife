export interface VCardCustomer {
  _id?: string;
  name?: string;
  phone?: string;
  productName?: string;
  appliance?: string;
  status?: string;
}

function escapeVCardText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function formatKoreanPhone(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
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

export function downloadCustomersVCard(
  customers: VCardCustomer[],
  filenamePrefix = '효원_고객연락처'
): number {
  const seenPhones = new Set<string>();
  const cards: string[] = [];

  for (const c of customers) {
    const rawPhone = (c.phone || '').trim();
    const digits = rawPhone.replace(/[^0-9]/g, '');
    if (digits.length < 9) continue;
    if (seenPhones.has(digits)) continue;
    seenPhones.add(digits);

    const name = (c.name || '고객').trim() || '고객';
    const formattedPhone = formatKoreanPhone(rawPhone);
    const noteParts = [c.productName, c.appliance, c.status].filter(
      (v) => typeof v === 'string' && v.trim().length > 0
    );

    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN;CHARSET=UTF-8:${escapeVCardText(name)}`,
      `N;CHARSET=UTF-8:;${escapeVCardText(name)};;;`,
      `TEL;TYPE=CELL:${formattedPhone}`,
      'ORG;CHARSET=UTF-8:효원상조 고객',
    ];
    if (noteParts.length > 0) {
      lines.push(`NOTE;CHARSET=UTF-8:${escapeVCardText(noteParts.join(' / '))}`);
    }
    lines.push('END:VCARD');
    cards.push(lines.join('\r\n'));
  }

  if (cards.length === 0) return 0;

  const content = cards.join('\r\n') + '\r\n';
  const blob = new Blob([content], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filenamePrefix}_${today}_${cards.length}명.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return cards.length;
}
