// Comprehensive LG Appliance Capacity / Size / Area Spec Extraction Utility

export interface ProductCapacityInfo {
  category: string;
  label: string; // e.g. "18평형 (58.5㎡)", "870L", "세탁 25kg + 건조 22kg", "65인치 (163cm)"
  shortLabel: string; // e.g. "18평형", "870L", "25kg", "65인치"
  type?: 'area' | 'volume' | 'weight' | 'person' | 'size' | 'clothes';
}

// 1. Air Conditioner Area Map
const AIRCON_AREA_MAP: Record<string, { pyeong: number; sqm: number }> = {
  '30': { pyeong: 30, sqm: 99.2 },
  '27': { pyeong: 27, sqm: 89.1 },
  '25': { pyeong: 25, sqm: 81.8 },
  '23': { pyeong: 23, sqm: 75.5 },
  '22': { pyeong: 22, sqm: 72.5 },
  '21': { pyeong: 21, sqm: 69.3 },
  '20': { pyeong: 20, sqm: 65.9 },
  '19': { pyeong: 19, sqm: 62.8 },
  '18': { pyeong: 18, sqm: 58.5 },
  '17': { pyeong: 17, sqm: 56.9 },
  '16': { pyeong: 16, sqm: 52.8 },
  '15': { pyeong: 15, sqm: 48.8 },
  '14': { pyeong: 14, sqm: 45.6 },
  '13': { pyeong: 13, sqm: 42.3 },
  '11': { pyeong: 11, sqm: 38.2 },
  '10': { pyeong: 10, sqm: 32.5 },
  '09': { pyeong: 9, sqm: 29.3 },
  '08': { pyeong: 8, sqm: 26.0 },
  '07': { pyeong: 7, sqm: 22.8 },
  '06': { pyeong: 6, sqm: 18.7 },
};

// 2. Air Purifier Area Map
const AIR_PURIFIER_AREA_MAP: Record<string, { pyeong: number; sqm: number }> = {
  '40': { pyeong: 40, sqm: 132 },
  '35': { pyeong: 35, sqm: 114 },
  '34': { pyeong: 34, sqm: 112 },
  '30': { pyeong: 30, sqm: 100 },
  '28': { pyeong: 28, sqm: 92.4 },
  '24': { pyeong: 24, sqm: 79.2 },
  '21': { pyeong: 21, sqm: 69.3 },
  '20': { pyeong: 20, sqm: 66 },
  '19': { pyeong: 19, sqm: 62.7 },
  '18': { pyeong: 18, sqm: 59.4 },
  '16': { pyeong: 16, sqm: 52.8 },
  '15': { pyeong: 15, sqm: 49.5 },
  '12': { pyeong: 12, sqm: 39.6 },
  '06': { pyeong: 6, sqm: 19.8 },
};

// 3. TV Size Map
const TV_SIZE_MAP: Record<string, { inch: number; cm: number }> = {
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

/**
 * Main function to extract capacity/size/area info from any LG product
 */
export function getProductCapacityInfo(
  model?: string,
  name?: string,
  categoryKey?: string,
  categoryName?: string,
  specs?: any
): ProductCapacityInfo | null {
  const cleanModel = (model || '').trim().toUpperCase();
  const cleanName = (name || '').trim();
  const cat = `${categoryKey || ''} ${categoryName || ''}`.toLowerCase();

  // Helper to extract value from specs array or object
  const getSpecValue = (keywords: string[]): string | undefined => {
    if (!specs) return undefined;
    const specList = Array.isArray(specs)
      ? specs
      : Object.entries(specs).map(([k, v]) => ({ name: k, value: String(v) }));

    for (const item of specList) {
      const itemName = (item.name || '').toLowerCase();
      if (keywords.some(k => itemName.includes(k.toLowerCase()))) {
        return item.value;
      }
    }
    return undefined;
  };

  // -------------------------------------------------------------
  // 1. TV / Display / StandbyMe (화면 크기: 인치 + cm)
  // -------------------------------------------------------------
  if (cat.includes('tv') || cat.includes('올레드') || cat.includes('qned') || cleanName.includes('TV') || cleanName.includes('스탠바이미') || cleanModel.startsWith('27LX') || cleanModel.startsWith('32LX') || cleanModel.includes('OLED') || cleanModel.includes('QNED') || cleanModel.includes('NANO')) {
    // 1. Check specs
    const sizeSpec = getSpecValue(['화면 크기', '화면크기', '화면사이즈', '화면 사이즈']);
    if (sizeSpec) {
      const cmM = sizeSpec.match(/(\d{2,3})\s*cm/i);
      const inchM = sizeSpec.match(/(\d{2,3})\s*(?:인치|형|inch)/i);
      let inch = inchM ? parseInt(inchM[1]) : undefined;
      let cm = cmM ? parseInt(cmM[1]) : undefined;

      if (inch && !cm && TV_SIZE_MAP[String(inch)]) {
        cm = TV_SIZE_MAP[String(inch)].cm;
      } else if (inch && !cm) {
        cm = Math.round(inch * 2.54);
      }
      if (cm && !inch) {
        for (const [, val] of Object.entries(TV_SIZE_MAP)) {
          if (Math.abs(val.cm - cm) <= 2) {
            inch = val.inch;
            break;
          }
        }
        if (!inch) inch = Math.round(cm / 2.54);
      }

      if (inch && cm) {
        return {
          category: 'tv',
          label: `${inch}인치 (${cm}cm)`,
          shortLabel: `${inch}인치`,
          type: 'size',
        };
      }
    }

    // 2. Check model code
    const tvMatch = cleanModel.match(/^(\d{2,3})[A-Z]/) || cleanModel.match(/(?:OLED|QNED|NANO|TV|LX)(\d{2,3})/);
    if (tvMatch) {
      const sizeStr = tvMatch[1];
      if (TV_SIZE_MAP[sizeStr]) {
        const { inch, cm } = TV_SIZE_MAP[sizeStr];
        return {
          category: 'tv',
          label: `${inch}인치 (${cm}cm)`,
          shortLabel: `${inch}인치`,
          type: 'size',
        };
      }
      const num = parseInt(sizeStr);
      if (num >= 24 && num <= 120) {
        const cm = Math.round(num * 2.54);
        return {
          category: 'tv',
          label: `${num}인치 (${cm}cm)`,
          shortLabel: `${num}인치`,
          type: 'size',
        };
      }
    }

    // 3. Check name
    const cmMatch = cleanName.match(/(\d{2,3})\s*cm/i);
    if (cmMatch) {
      const cm = parseInt(cmMatch[1]);
      const match = Object.values(TV_SIZE_MAP).find(v => Math.abs(v.cm - cm) <= 2);
      const inch = match ? match.inch : Math.round(cm / 2.54);
      return {
        category: 'tv',
        label: `${inch}인치 (${cm}cm)`,
        shortLabel: `${inch}인치`,
        type: 'size',
      };
    }
    const inchMatch = cleanName.match(/(\d{2,3})\s*(?:인치|형|inch)/i);
    if (inchMatch) {
      const inch = parseInt(inchMatch[1]);
      const cm = TV_SIZE_MAP[String(inch)]?.cm || Math.round(inch * 2.54);
      return {
        category: 'tv',
        label: `${inch}인치 (${cm}cm)`,
        shortLabel: `${inch}인치`,
        type: 'size',
      };
    }
  }

  // -------------------------------------------------------------
  // 2. 에어컨 (냉방 면적 / 평수 + ㎡)
  // -------------------------------------------------------------
  if (cat.includes('aircon') || cat.includes('에어컨') || cleanName.includes('에어컨') || cleanModel.startsWith('FQ') || cleanModel.startsWith('SQ') || cleanModel.startsWith('SW') || cleanModel.startsWith('FN') || cleanModel.startsWith('SN')) {
    // 1. Check specs
    const areaSpec = getSpecValue(['냉방면적', '냉방 면적', '사용면적', '면적', '평형']);
    if (areaSpec) {
      const sqmM = areaSpec.match(/(\d+(?:\.\d+)?)\s*(?:㎡|m²)/i);
      const pyeongM = areaSpec.match(/(\d+(?:\.\d+)?)\s*(?:평|형)/i);
      if (pyeongM && sqmM) {
        return {
          category: 'aircon',
          label: `${pyeongM[1]}평형 (${sqmM[1]}㎡)`,
          shortLabel: `${pyeongM[1]}평형`,
          type: 'area',
        };
      }
      if (sqmM) {
        const pyeong = Math.round(parseFloat(sqmM[1]) / 3.3058);
        return {
          category: 'aircon',
          label: `${pyeong}평형 (${sqmM[1]}㎡)`,
          shortLabel: `${pyeong}평형`,
          type: 'area',
        };
      }
      if (pyeongM) {
        const pyeong = pyeongM[1];
        const map = AIRCON_AREA_MAP[pyeong.padStart(2, '0')];
        const sqm = map ? map.sqm : Math.round(parseFloat(pyeong) * 3.3 * 10) / 10;
        return {
          category: 'aircon',
          label: `${pyeong}평형 (${sqm}㎡)`,
          shortLabel: `${pyeong}평형`,
          type: 'area',
        };
      }
    }

    // 2. Check model code (e.g. FQ25, FQ18, FQ17, SQ07, SQ06, FQ20...)
    const airconMatch = cleanModel.match(/^[A-Z]{2}(\d{2})/);
    if (airconMatch) {
      const numStr = airconMatch[1];
      const pyeongNum = parseInt(numStr);
      if (pyeongNum >= 5 && pyeongNum <= 40) {
        const { pyeong, sqm } = AIRCON_AREA_MAP[numStr] || {
          pyeong: pyeongNum,
          sqm: Math.round(pyeongNum * 3.27 * 10) / 10,
        };
        const is2in1 = cleanModel.endsWith('2') || cleanModel.includes('2IN1') || cleanName.includes('2in1') || cleanName.includes('투인원');
        return {
          category: 'aircon',
          label: is2in1 ? `${pyeong}+6평형 (${sqm}+18.7㎡)` : `${pyeong}평형 (${sqm}㎡)`,
          shortLabel: is2in1 ? `${pyeong}+6평형` : `${pyeong}평형`,
          type: 'area',
        };
      }
    }

    // 3. Check name
    const pyeongNameM = cleanName.match(/(\d{1,2})\s*(?:평형|평)/);
    if (pyeongNameM) {
      const p = pyeongNameM[1];
      const map = AIRCON_AREA_MAP[p.padStart(2, '0')];
      const sqm = map ? map.sqm : Math.round(parseInt(p) * 3.3 * 10) / 10;
      return {
        category: 'aircon',
        label: `${p}평형 (${sqm}㎡)`,
        shortLabel: `${p}평형`,
        type: 'area',
      };
    }
  }

  // -------------------------------------------------------------
  // 3. 공기청정기 / 에어로타워 / 제습기 / 가습기 (사용면적 / 용량)
  // -------------------------------------------------------------
  if (cat.includes('airpurifier') || cat.includes('aerotower') || cat.includes('공기청정기') || cat.includes('에어로타워') || cleanName.includes('공기청정기') || cleanName.includes('에어로타워') || cleanModel.startsWith('AS') || cleanModel.startsWith('FS')) {
    // 1. Check specs
    const areaSpec = getSpecValue(['사용면적', '청정면적', '청정 면적', '사용 면적']);
    if (areaSpec) {
      const sqmM = areaSpec.match(/(\d+(?:\.\d+)?)\s*(?:㎡|m²)/i);
      const pyeongM = areaSpec.match(/(\d+(?:\.\d+)?)\s*(?:평|형)/i);
      if (pyeongM && sqmM) {
        return {
          category: 'airpurifier',
          label: `${pyeongM[1]}평형 (${sqmM[1]}㎡)`,
          shortLabel: `${pyeongM[1]}평형`,
          type: 'area',
        };
      }
      if (sqmM) {
        const pyeong = Math.round(parseFloat(sqmM[1]) / 3.3);
        return {
          category: 'airpurifier',
          label: `${pyeong}평형 (${sqmM[1]}㎡)`,
          shortLabel: `${pyeong}평형`,
          type: 'area',
        };
      }
    }

    // 2. Check model code (e.g. AS35, AS30, AS20, AS18, FS06...)
    const apMatch = cleanModel.match(/^[A-Z]{2}(\d{2})/);
    if (apMatch) {
      const numStr = apMatch[1];
      const pNum = parseInt(numStr);
      if (pNum >= 5 && pNum <= 50) {
        const { pyeong, sqm } = AIR_PURIFIER_AREA_MAP[numStr] || {
          pyeong: pNum,
          sqm: Math.round(pNum * 3.3 * 10) / 10,
        };
        return {
          category: 'airpurifier',
          label: `${pyeong}평형 (${sqm}㎡)`,
          shortLabel: `${pyeong}평형`,
          type: 'area',
        };
      }
    }

    const namePyeong = cleanName.match(/(\d{1,2})\s*(?:평형|평)/);
    if (namePyeong) {
      const p = namePyeong[1];
      const map = AIR_PURIFIER_AREA_MAP[p.padStart(2, '0')];
      const sqm = map ? map.sqm : Math.round(parseInt(p) * 3.3);
      return {
        category: 'airpurifier',
        label: `${p}평형 (${sqm}㎡)`,
        shortLabel: `${p}평형`,
        type: 'area',
      };
    }
  }

  // -------------------------------------------------------------
  // 4. 워시타워 / 워시콤보 (세탁 + 건조 복합 용량)
  // -------------------------------------------------------------
  if (cat.includes('washtower') || cat.includes('washcombo') || cat.includes('워시타워') || cat.includes('워시콤보') || cleanName.includes('워시타워') || cleanName.includes('워시콤보') || cleanModel.startsWith('WL') || cleanModel.startsWith('W2') || cleanModel.startsWith('FH25')) {
    const comboM = cleanName.match(/세탁\s*(\d{2})kg.*?건조\s*(\d{2})kg/i) || cleanName.match(/(\d{2})kg.*?(\d{2})kg/);
    if (comboM) {
      return {
        category: 'washtower',
        label: `세탁 ${comboM[1]}kg + 건조 ${comboM[2]}kg`,
        shortLabel: `${comboM[1]}+${comboM[2]}kg`,
        type: 'weight',
      };
    }

    if (cleanModel.startsWith('WL22') || cleanModel.startsWith('W22')) {
      return {
        category: 'washtower',
        label: '세탁 25kg + 건조 22kg',
        shortLabel: '25+22kg',
        type: 'weight',
      };
    }
    if (cleanModel.startsWith('WL20') || cleanModel.startsWith('W20')) {
      return {
        category: 'washtower',
        label: '세탁 25kg + 건조 20kg',
        shortLabel: '25+20kg',
        type: 'weight',
      };
    }
    if (cleanModel.startsWith('FH25') || cleanName.includes('워시콤보')) {
      return {
        category: 'washcombo',
        label: '세탁 25kg + 건조 15kg (올인원)',
        shortLabel: '25+15kg',
        type: 'weight',
      };
    }
  }

  // -------------------------------------------------------------
  // 5. 세탁기 (세탁 용량 kg)
  // -------------------------------------------------------------
  if (cat.includes('washer') || cat.includes('세탁기') || cleanName.includes('세탁기') || cleanModel.startsWith('FX') || cleanModel.startsWith('F2') || cleanModel.startsWith('F1') || cleanModel.startsWith('T2')) {
    const specCap = getSpecValue(['세탁용량', '세탁 용량', '용량']);
    if (specCap) {
      const kgM = specCap.match(/(\d{1,2})\s*kg/i);
      if (kgM) {
        return {
          category: 'washer',
          label: `세탁 ${kgM[1]}kg`,
          shortLabel: `${kgM[1]}kg`,
          type: 'weight',
        };
      }
    }

    const mKg = cleanModel.match(/^[A-Z]{1,2}(\d{2})/);
    if (mKg) {
      const num = parseInt(mKg[1]);
      if (num >= 9 && num <= 30) {
        return {
          category: 'washer',
          label: `세탁 ${num}kg`,
          shortLabel: `${num}kg`,
          type: 'weight',
        };
      }
    }

    const nKg = cleanName.match(/(\d{1,2})\s*kg/i);
    if (nKg) {
      return {
        category: 'washer',
        label: `세탁 ${nKg[1]}kg`,
        shortLabel: `${nKg[1]}kg`,
        type: 'weight',
      };
    }
  }

  // -------------------------------------------------------------
  // 6. 건조기 (건조 용량 kg)
  // -------------------------------------------------------------
  if (cat.includes('dryer') || cat.includes('건조기') || cleanName.includes('건조기') || cleanModel.startsWith('RD') || cleanModel.startsWith('RG') || cleanModel.startsWith('RH')) {
    const specCap = getSpecValue(['건조용량', '건조 용량', '용량']);
    if (specCap) {
      const kgM = specCap.match(/(\d{1,2})\s*kg/i);
      if (kgM) {
        return {
          category: 'dryer',
          label: `건조 ${kgM[1]}kg`,
          shortLabel: `${kgM[1]}kg`,
          type: 'weight',
        };
      }
    }

    const mKg = cleanModel.match(/^[A-Z]{2}(\d{2})/);
    if (mKg) {
      const num = parseInt(mKg[1]);
      if (num >= 9 && num <= 30) {
        return {
          category: 'dryer',
          label: `건조 ${num}kg`,
          shortLabel: `${num}kg`,
          type: 'weight',
        };
      }
    }

    const nKg = cleanName.match(/(\d{1,2})\s*kg/i);
    if (nKg) {
      return {
        category: 'dryer',
        label: `건조 ${nKg[1]}kg`,
        shortLabel: `${nKg[1]}kg`,
        type: 'weight',
      };
    }
  }

  // -------------------------------------------------------------
  // 7. 냉장고 / 김치냉장고 (전체 용량 L)
  // -------------------------------------------------------------
  if (cat.includes('fridge') || cat.includes('kimchi') || cat.includes('냉장고') || cleanName.includes('냉장고') || cleanModel.startsWith('M8') || cleanModel.startsWith('T8') || cleanModel.startsWith('H8') || cleanModel.startsWith('W8') || cleanModel.startsWith('Z4') || cleanModel.startsWith('Z3') || cleanModel.startsWith('K4') || cleanModel.startsWith('K3')) {
    const specCap = getSpecValue(['전체용량', '전체 용량', '용량']);
    if (specCap) {
      const literM = specCap.match(/(\d{2,4})\s*(?:L|리터)/i);
      if (literM) {
        return {
          category: 'fridge',
          label: `${literM[1]}L`,
          shortLabel: `${literM[1]}L`,
          type: 'volume',
        };
      }
    }

    const nLiter = cleanName.match(/(\d{2,4})\s*(?:L|리터)/i);
    if (nLiter) {
      return {
        category: 'fridge',
        label: `${nLiter[1]}L`,
        shortLabel: `${nLiter[1]}L`,
        type: 'volume',
      };
    }

    if (cleanModel.match(/^[MTHW]87/)) {
      return { category: 'fridge', label: '870L 대용량', shortLabel: '870L', type: 'volume' };
    }
    if (cleanModel.match(/^[MTHW]83/)) {
      return { category: 'fridge', label: '832L', shortLabel: '832L', type: 'volume' };
    }
    if (cleanModel.match(/^[MTHW]82/)) {
      return { category: 'fridge', label: '820L', shortLabel: '820L', type: 'volume' };
    }
    if (cleanModel.match(/^[MTHW]60/)) {
      return { category: 'fridge', label: '600L', shortLabel: '600L', type: 'volume' };
    }
    if (cleanModel.match(/^[ZK]49/)) {
      return { category: 'kimchi', label: '491L 스탠드형', shortLabel: '491L', type: 'volume' };
    }
    if (cleanModel.match(/^[ZK]40/)) {
      return { category: 'kimchi', label: '402L 스탠드형', shortLabel: '402L', type: 'volume' };
    }
    if (cleanModel.match(/^[ZK]32/)) {
      return { category: 'kimchi', label: '327L 스탠드형', shortLabel: '327L', type: 'volume' };
    }
  }

  // -------------------------------------------------------------
  // 8. 식기세척기 (인용)
  // -------------------------------------------------------------
  if (cat.includes('dishwasher') || cat.includes('식기세척기') || cleanName.includes('식기세척기') || cleanModel.startsWith('DU')) {
    const specCap = getSpecValue(['용량', '수납용량', '인용']);
    if (specCap) {
      const personM = specCap.match(/(\d{1,2})\s*인용/i);
      if (personM) {
        return {
          category: 'dishwasher',
          label: `${personM[1]}인용`,
          shortLabel: `${personM[1]}인용`,
          type: 'person',
        };
      }
    }

    const nPerson = cleanName.match(/(\d{1,2})\s*인용/i);
    if (nPerson) {
      return {
        category: 'dishwasher',
        label: `${nPerson[1]}인용`,
        shortLabel: `${nPerson[1]}인용`,
        type: 'person',
      };
    }

    if (cleanModel.startsWith('DUBJ4') || cleanModel.startsWith('DUE4') || cleanModel.startsWith('DUB4')) {
      return { category: 'dishwasher', label: '14인용 대용량', shortLabel: '14인용', type: 'person' };
    }
    if (cleanModel.startsWith('DUBJ2') || cleanModel.startsWith('DUE2') || cleanModel.startsWith('DUB2')) {
      return { category: 'dishwasher', label: '12인용', shortLabel: '12인용', type: 'person' };
    }
  }

  // -------------------------------------------------------------
  // 9. 제습기 (일일 제습용량 L)
  // -------------------------------------------------------------
  if (cat.includes('dehumidifier') || cat.includes('제습기') || cleanName.includes('제습기') || cleanModel.startsWith('DQ')) {
    const specCap = getSpecValue(['일일제습용량', '제습용량', '제습 용량', '용량']);
    if (specCap) {
      const lM = specCap.match(/(\d{1,2})\s*L/i);
      if (lM) {
        return {
          category: 'dehumidifier',
          label: `일일 제습 ${lM[1]}L`,
          shortLabel: `${lM[1]}L`,
          type: 'volume',
        };
      }
    }

    const mDehum = cleanModel.match(/^DQ(\d{2})/);
    if (mDehum) {
      return {
        category: 'dehumidifier',
        label: `일일 제습 ${mDehum[1]}L`,
        shortLabel: `${mDehum[1]}L`,
        type: 'volume',
      };
    }

    const nL = cleanName.match(/(\d{1,2})\s*L/i);
    if (nL) {
      return {
        category: 'dehumidifier',
        label: `일일 제습 ${nL[1]}L`,
        shortLabel: `${nL[1]}L`,
        type: 'volume',
      };
    }
  }

  // -------------------------------------------------------------
  // 10. 스타일러 (벌수 대용량)
  // -------------------------------------------------------------
  if (cat.includes('styler') || cat.includes('스타일러') || cleanName.includes('스타일러') || cleanModel.startsWith('SC5') || cleanModel.startsWith('S5') || cleanModel.startsWith('SC3') || cleanModel.startsWith('S3')) {
    if (cleanModel.startsWith('SC5') || cleanModel.startsWith('S5') || cleanName.includes('대용량') || cleanName.includes('5벌')) {
      return {
        category: 'styler',
        label: '5벌+바지1벌 (대용량)',
        shortLabel: '대용량 (5벌)',
        type: 'clothes',
      };
    }
    if (cleanModel.startsWith('SC3') || cleanModel.startsWith('S3') || cleanName.includes('3벌')) {
      return {
        category: 'styler',
        label: '3벌+바지1벌 (슬림형)',
        shortLabel: '슬림형 (3벌)',
        type: 'clothes',
      };
    }
  }

  // -------------------------------------------------------------
  // 11. 정수기 (핵심 기능 / 맞춤출수 / 얼음)
  // -------------------------------------------------------------
  if (cat.includes('water') || cat.includes('정수기') || cleanName.includes('정수기') || cleanModel.startsWith('WU') || cleanModel.startsWith('WD')) {
    if (cleanName.includes('얼음') || cleanModel.startsWith('WD724')) {
      return { category: 'water', label: '얼음정수 (냉온정수)', shortLabel: '얼음정수', type: 'volume' };
    }
    if (cleanName.includes('음성인식') || cleanModel.startsWith('WU924')) {
      return { category: 'water', label: '음성인식 맞춤출수 (냉온정수)', shortLabel: '음성인식', type: 'volume' };
    }
    if (cleanName.includes('냉온') || cleanModel.startsWith('WU923') || cleanModel.startsWith('WD523')) {
      return { category: 'water', label: '냉온정수 (고온살균)', shortLabel: '냉온정수', type: 'volume' };
    }
    if (cleanName.includes('냉정수')) {
      return { category: 'water', label: '냉정수 (직수형)', shortLabel: '냉정수', type: 'volume' };
    }
  }

  return null;
}
