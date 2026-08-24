// LG TV Model & Specification Size (Inch & cm) Mapping Utility

export const TV_SIZE_MAP: Record<string, { inch: number; cm: number }> = {
  '97': { inch: 97, cm: 245 },
  '86': { inch: 86, cm: 217 },
  '85': { inch: 85, cm: 215 },
  '83': { inch: 83, cm: 210 },
  '77': { inch: 77, cm: 195 },
  '75': { inch: 75, cm: 189 },
  '65': { inch: 65, cm: 163 },
  '55': { inch: 55, cm: 139 },
  '50': { inch: 50, cm: 127 },
  '48': { inch: 48, cm: 121 },
  '43': { inch: 43, cm: 108 },
  '42': { inch: 42, cm: 105 },
  '32': { inch: 32, cm: 80 },
  '27': { inch: 27, cm: 68 },
};

export interface TvSizeInfo {
  inch: number;
  cm: number;
  label: string; // e.g. "65인치 (163cm)"
  shortLabel: string; // e.g. "65인치"
  cmLabel: string; // e.g. "163cm"
}

export function getTvSizeInfo(model?: string, name?: string, specs?: any): TvSizeInfo | null {
  // 1. Check specs if available
  if (specs) {
    const specList = Array.isArray(specs)
      ? specs
      : Object.entries(specs).map(([k, v]) => ({ name: k, value: String(v) }));

    const sizeSpec = specList.find((s: any) =>
      s.name?.includes('화면 크기') ||
      s.name?.includes('화면크기') ||
      s.name?.includes('화면사이즈') ||
      s.name?.includes('화면 사이즈')
    );

    if (sizeSpec && sizeSpec.value) {
      const cmM = sizeSpec.value.match(/(\d{2,3})\s*cm/i);
      const inchM = sizeSpec.value.match(/(\d{2,3})\s*(?:인치|형|inch)/i);

      let inch = inchM ? parseInt(inchM[1]) : undefined;
      let cm = cmM ? parseInt(cmM[1]) : undefined;

      if (inch && !cm && TV_SIZE_MAP[String(inch)]) {
        cm = TV_SIZE_MAP[String(inch)].cm;
      } else if (inch && !cm) {
        cm = Math.round(inch * 2.54);
      }

      if (cm && !inch) {
        for (const [, val] of Object.entries(TV_SIZE_MAP)) {
          if (val.cm === cm || Math.abs(val.cm - cm) <= 2) {
            inch = val.inch;
            break;
          }
        }
        if (!inch) inch = Math.round(cm / 2.54);
      }

      if (inch && cm) {
        return {
          inch,
          cm,
          label: `${inch}인치 (${cm}cm)`,
          shortLabel: `${inch}인치`,
          cmLabel: `${cm}cm`,
        };
      }
    }
  }

  // 2. Extract from model code (e.g. 65QNED81BMS, 75QNED86BKW, 86MRGB86, OLED83C4, 50NANO90...)
  const cleanModel = (model || '').trim().toUpperCase();
  const mMatch = cleanModel.match(/^(\d{2,3})[A-Z]/) || cleanModel.match(/(?:OLED|QNED|NANO|TV)(\d{2,3})/);
  if (mMatch) {
    const sizeStr = mMatch[1];
    if (TV_SIZE_MAP[sizeStr]) {
      const { inch, cm } = TV_SIZE_MAP[sizeStr];
      return {
        inch,
        cm,
        label: `${inch}인치 (${cm}cm)`,
        shortLabel: `${inch}인치`,
        cmLabel: `${cm}cm`,
      };
    }
    const num = parseInt(sizeStr);
    if (num >= 24 && num <= 120) {
      const cm = Math.round(num * 2.54);
      return {
        inch: num,
        cm,
        label: `${num}인치 (${cm}cm)`,
        shortLabel: `${num}인치`,
        cmLabel: `${cm}cm`,
      };
    }
  }

  // 3. Extract from name (e.g. "LG QNED 65형", "LG OLED 163cm", "75인치 QNED...")
  const cleanName = (name || '').trim();
  const cmMatch = cleanName.match(/(\d{2,3})\s*cm/i);
  if (cmMatch) {
    const cm = parseInt(cmMatch[1]);
    for (const [, val] of Object.entries(TV_SIZE_MAP)) {
      if (val.cm === cm || Math.abs(val.cm - cm) <= 2) {
        return {
          inch: val.inch,
          cm,
          label: `${val.inch}인치 (${cm}cm)`,
          shortLabel: `${val.inch}인치`,
          cmLabel: `${cm}cm`,
        };
      }
    }
    const inch = Math.round(cm / 2.54);
    return {
      inch,
      cm,
      label: `${inch}인치 (${cm}cm)`,
      shortLabel: `${inch}인치`,
      cmLabel: `${cm}cm`,
    };
  }

  const inchMatch = cleanName.match(/(\d{2,3})\s*(?:인치|형|inch)/i);
  if (inchMatch) {
    const inch = parseInt(inchMatch[1]);
    if (TV_SIZE_MAP[String(inch)]) {
      const { cm } = TV_SIZE_MAP[String(inch)];
      return {
        inch,
        cm,
        label: `${inch}인치 (${cm}cm)`,
        shortLabel: `${inch}인치`,
        cmLabel: `${cm}cm`,
      };
    }
    const cm = Math.round(inch * 2.54);
    return {
      inch,
      cm,
      label: `${inch}인치 (${cm}cm)`,
      shortLabel: `${inch}인치`,
      cmLabel: `${cm}cm`,
    };
  }

  return null;
}
