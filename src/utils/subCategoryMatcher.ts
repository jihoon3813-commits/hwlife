// Single-Classification Mutually Exclusive Subcategory Matcher for LG Care Appliances

export interface ProductSubCategoryDef {
  id: string;
  name: string;
}

/**
 * Categorizes any LG product into exactly ONE mutually-exclusive subcategory.
 */
export function getProductSubCategory(product: {
  category?: string;
  categoryName?: string;
  subCategory?: string;
  subCategoryName?: string;
  name: string;
  model: string;
  specs?: any;
}): string {
  const cleanName = (product.name || '').toLowerCase();
  const cleanModel = (product.model || '').toUpperCase().trim();
  const cat = `${product.category || ''} ${product.categoryName || ''}`.toLowerCase();

  // Helper to check specs
  const getSpecText = (): string => {
    if (!product.specs) return '';
    if (Array.isArray(product.specs)) {
      return product.specs.map((s: any) => `${s.name || ''} ${s.value || ''}`).join(' ').toLowerCase();
    }
    if (typeof product.specs === 'object') {
      return Object.entries(product.specs).map(([k, v]) => `${k} ${v}`).join(' ').toLowerCase();
    }
    return '';
  };
  const specsText = getSpecText();

  // -------------------------------------------------------------
  // 0. 바스에어시스템 (bathair) - MUST BE CHECKED BEFORE GENERAL FRIDGE
  // -------------------------------------------------------------
  if (cat.includes('bath') || cat.includes('바스') || cleanName.includes('바스') || cleanModel.includes('BAS') || cleanModel.startsWith('MX0120') || cleanModel.startsWith('M-X0120')) {
    if (cleanName.includes('듀얼') || cleanModel.includes('BASV') || cleanName.includes('배기팬')) {
      return '프리미엄 듀얼';
    }
    if (cleanName.includes('프리미엄') || cleanModel.includes('BASR')) {
      return '프리미엄';
    }
    return '일반';
  }

  // -------------------------------------------------------------
  // 1. 김치냉장고 (kimchi) - MUST BE CHECKED BEFORE GENERAL FRIDGE
  // -------------------------------------------------------------
  if (cat.includes('kimchi') || cat.includes('김치') || cleanName.includes('김치')) {
    // 1-1. 뚜껑형 (K2, Z2 또는 제품명에 '뚜껑')
    if (cleanModel.startsWith('K2') || cleanModel.startsWith('Z2') || cleanName.includes('뚜껑')) {
      return '뚜껑형';
    }
    // 1-2. 1도어 컨버터블 (K32, 컨버터블, 1도어)
    if (cleanName.includes('컨버터블') || cleanName.includes('1도어') || cleanModel.startsWith('K32') || cleanModel.startsWith('Z32')) {
      return '1도어 (컨버터블)';
    }
    // 1-3. 3도어 스탠드형 (Z33, K33, Z3, K3, 3도어)
    if (cleanModel.startsWith('Z3') || cleanModel.startsWith('K3') || cleanName.includes('3도어')) {
      return '3도어 스탠드형';
    }
    // 1-4. 4도어 스탠드형 (기본 대용량 4도어 김치톡톡)
    return '4도어 스탠드형';
  }

  // -------------------------------------------------------------
  // 2. 냉장고 (fridge) - 5 Mutually Exclusive Types
  // -------------------------------------------------------------
  if (cat.includes('fridge') || cat.includes('냉장고') || cleanName.includes('냉장고')) {
    // 2-1. 일반 냉장고: 제품명에 '일반냉장고' 또는 '일반 냉장고'라고 명시된 것만 일반 냉장고로 분류
    if (cleanName.includes('일반냉장고') || cleanName.includes('일반 냉장고')) {
      return '일반 냉장고';
    }
    // 2-2. STEM / 얼음정수기 냉장고
    if (cleanName.includes('stem') || cleanModel.includes('STEM') || cleanName.includes('얼음정수기') || cleanName.includes('얼음') || cleanModel.startsWith('W82') || cleanModel.startsWith('W83') || specsText.includes('stem') || specsText.includes('얼음정수기')) {
      return 'STEM / 얼음정수기';
    }
    // 2-3. 컨버터블 패키지 (1도어 냉장/냉동)
    if (cleanName.includes('컨버터블') || cleanName.includes('1도어') || cleanModel.startsWith('X3') || cleanModel.startsWith('Y3') || cleanModel.startsWith('A3') || specsText.includes('컨버터블')) {
      return '컨버터블 패키지';
    }
    // 2-4. 양문형 (2도어)
    if (cleanName.includes('양문형') || cleanName.includes('2도어') || cleanModel.startsWith('S8') || cleanModel.startsWith('S6') || cleanModel.startsWith('G8') || specsText.includes('양문형') || specsText.includes('2도어')) {
      return '양문형 (2도어)';
    }
    // 2-5. 4도어 (상냉장) - 기본 디오스 오브제 4도어
    return '4도어 (상냉장)';
  }

  // -------------------------------------------------------------
  // 2. 정수기 (water) - 5 Mutually Exclusive Types
  // -------------------------------------------------------------
  if (cat.includes('water') || cat.includes('정수기') || cleanName.includes('정수기')) {
    if (cleanName.includes('얼음') || cleanModel.startsWith('WD724') || cleanModel.startsWith('W7') || specsText.includes('얼음')) {
      return '얼음정수기';
    }
    if (cleanName.includes('음성인식') || cleanName.includes('맞춤출수') || cleanModel.startsWith('WU924') || cleanModel.startsWith('WU9') || specsText.includes('음성인식')) {
      return '음성인식 맞춤출수';
    }
    if (cleanName.includes('정수전용') || cleanName.includes('직수전용') || cleanModel.startsWith('WD10') || cleanModel.startsWith('WD1') || specsText.includes('정수전용')) {
      return '정수전용';
    }
    if (cleanName.includes('냉정수') || cleanName.includes('냉정') || cleanModel.startsWith('WD323') || cleanModel.startsWith('WD3') || specsText.includes('냉정수')) {
      return '냉정수기';
    }
    return '냉온정수기';
  }

  // -------------------------------------------------------------
  // 3. 에어컨 (aircon) - 3 Mutually Exclusive Types
  // -------------------------------------------------------------
  if (cat.includes('aircon') || cat.includes('에어컨') || cleanName.includes('에어컨')) {
    if (cleanModel.endsWith('2') || cleanModel.includes('2IN1') || cleanName.includes('2in1') || cleanName.includes('투인원')) {
      return '2in1 (투인원)';
    }
    if (cleanModel.startsWith('SQ') || cleanModel.startsWith('SW') || cleanModel.startsWith('SN') || cleanName.includes('벽걸이')) {
      return '벽걸이형';
    }
    return '스탠드형';
  }

  // -------------------------------------------------------------
  // 4. TV (tv) - 4 Mutually Exclusive Types
  // -------------------------------------------------------------
  if (cat.includes('tv') || cat.includes('올레드') || cat.includes('qned') || cleanName.includes('tv') || cleanName.includes('스탠바이미') || cleanModel.startsWith('27LX') || cleanModel.startsWith('32LX')) {
    if (cleanName.includes('스탠바이미') || cleanModel.startsWith('27LX') || cleanModel.startsWith('32LX')) {
      return '스탠바이미';
    }
    if (cleanName.includes('올레드') || cleanName.includes('oled') || cleanModel.includes('OLED')) {
      return '올레드 TV';
    }
    if (cleanName.includes('qned') || cleanModel.includes('QNED')) {
      return 'QNED TV';
    }
    return '울트라HD / 나노셀';
  }

  // -------------------------------------------------------------
  // 5. 세탁기 (washer) - 2 Mutually Exclusive Types
  // -------------------------------------------------------------
  if (cat.includes('washer') || cat.includes('세탁기') || cleanName.includes('세탁기')) {
    // F로 시작하는 모델(FX, FG, F2, F1, FR 등)은 무조건 드럼 세탁기
    if (cleanModel.startsWith('F')) {
      return '드럼 세탁기';
    }
    if (cleanName.includes('통돌이') || cleanModel.startsWith('T')) {
      return '통돌이 세탁기';
    }
    return '드럼 세탁기';
  }

  // -------------------------------------------------------------
  // 6. 워시타워 (washtower) - 2 Mutually Exclusive Types
  // -------------------------------------------------------------
  if (cat.includes('washtower') || cat.includes('워시타워') || cleanName.includes('워시타워')) {
    if (cleanName.includes('컴팩트') || cleanName.includes('compact') || cleanModel.includes('C')) {
      return '워시타워 컴팩트';
    }
    return '워시타워 (대용량)';
  }

  // -------------------------------------------------------------
  // 7. 스타일러 (styler) - 2 Mutually Exclusive Types
  // -------------------------------------------------------------
  if (cat.includes('styler') || cat.includes('스타일러') || cleanName.includes('스타일러')) {
    if (cleanModel.startsWith('SC3') || cleanModel.startsWith('S3') || cleanName.includes('슬림') || cleanName.includes('3벌')) {
      return '슬림 (3벌)';
    }
    return '대용량 (5벌)';
  }

  // -------------------------------------------------------------
  // 8. 식기세척기 (dishwasher) - 2 Mutually Exclusive Types
  // -------------------------------------------------------------
  if (cat.includes('dishwasher') || cat.includes('식기세척기') || cleanName.includes('식기세척기')) {
    if (cleanModel.startsWith('DUBJ2') || cleanModel.startsWith('DUE2') || cleanModel.startsWith('DUB2') || cleanName.includes('12인')) {
      return '12인용';
    }
    return '14인용 대용량';
  }

  // -------------------------------------------------------------
  // 9. 공기청정기 (airpurifier) - 3 Mutually Exclusive Types
  // -------------------------------------------------------------
  if (cat.includes('airpurifier') || cat.includes('aerotower') || cat.includes('공기청정기') || cat.includes('에어로타워') || cleanName.includes('공기청정기') || cleanName.includes('에어로타워')) {
    if (cleanModel.startsWith('FS') || cleanName.includes('에어로타워')) {
      return '에어로타워';
    }
    if (cleanModel.startsWith('AS15') || cleanModel.startsWith('AS18') || cleanName.includes('hit') || cleanName.includes('히트')) {
      return '퓨리케어 Hit';
    }
    return '퓨리케어 360';
  }

  return '기타';
}

/**
 * Checks whether a product matches the selected subcategory tab.
 */
export function matchesSubCategory(
  product: {
    category?: string;
    categoryName?: string;
    subCategory?: string;
    subCategoryName?: string;
    name: string;
    model: string;
    specs?: any;
  },
  subTabId: string,
  subTabName: string
): boolean {
  if (!subTabId || subTabId === 'all' || !subTabName || subTabName === '전체') {
    return true;
  }

  const assignedSubCategory = getProductSubCategory(product);
  const target = subTabName.trim();

  return assignedSubCategory === target || assignedSubCategory.includes(target) || target.includes(assignedSubCategory);
}
