import React, { useState, useRef, useMemo } from 'react';
import { 
  Plus, Upload, Download, Trash2, Edit, Copy, Eye, EyeOff, 
  ExternalLink, Search, Sparkles, CheckSquare, Square, 
  MoveVertical, CheckCircle2, AlertTriangle, X, RefreshCw,
  Layers, Tag, Info, ArrowUpRight, HelpCircle, GripVertical,
  PanelLeftClose, PanelLeftOpen, LayoutGrid, List, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import * as XLSX from 'xlsx';
import { LG_OFFICIAL_PRODUCTS } from '../data/lgCareProducts';
import { getProductCapacityInfo } from '../utils/productCapacity';
import { buildLgOfficialPdpUrl } from '../utils/lgeUrl';

// Build in-memory fast index for official products (0ms lookup)
const OFFICIAL_CATALOG_MAP = new Map<string, any>();
for (const p of LG_OFFICIAL_PRODUCTS) {
  const clean = p.model.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  OFFICIAL_CATALOG_MAP.set(clean, p);
  OFFICIAL_CATALOG_MAP.set(p.model.trim().toLowerCase(), p);
}

// Category Definition matching LG Official Care Solutions
export interface LgCategory {
  key: string;
  name: string;
  icon: string;
  group?: 'kitchen' | 'living' | 'air' | 'display' | 'health';
}

export const LG_CATEGORIES: LgCategory[] = [
  { key: 'all', name: '전체 카테고리', icon: '✨' },
  { key: 'water', name: '정수기', icon: '💧', group: 'kitchen' },
  { key: 'fridge', name: '냉장고', icon: '🧊', group: 'kitchen' },
  { key: 'kimchi', name: '김치냉장고', icon: '🥬', group: 'kitchen' },
  { key: 'dishwasher', name: '식기세척기', icon: '🍽️', group: 'kitchen' },
  { key: 'range', name: '전기레인지', icon: '🔥', group: 'kitchen' },
  { key: 'washer', name: '세탁기', icon: '🧺', group: 'living' },
  { key: 'washtower', name: '워시타워', icon: '🏢', group: 'living' },
  { key: 'washcombo', name: '워시콤보', icon: '🔄', group: 'living' },
  { key: 'dryer', name: '의류건조기', icon: '👕', group: 'living' },
  { key: 'styler', name: '스타일러', icon: '👔', group: 'living' },
  { key: 'aircon', name: '에어컨', icon: '❄️', group: 'air' },
  { key: 'airpurifier', name: '공기청정기', icon: '🍃', group: 'air' },
  { key: 'aerotower', name: '에어로타워', icon: '🌪️', group: 'air' },
  { key: 'humidifier', name: '정수가습기', icon: '💨', group: 'air' },
  { key: 'dehumidifier', name: '제습기', icon: '💦', group: 'air' },
  { key: 'tv', name: '올레드 / QNED TV', icon: '📺', group: 'display' },
  { key: 'standby', name: '스탠바이미', icon: '📱', group: 'display' },
  { key: 'vacuum', name: '청소기', icon: '🧹', group: 'living' },
  { key: 'massage', name: '안마의자', icon: '💆', group: 'health' },
  { key: 'shoecare', name: '슈케어', icon: '👟', group: 'living' },
  { key: 'bathair', name: '바스에어시스템', icon: '🛁', group: 'air' },
];

function mapExcelCategoryToKey(rawCat: string): { key: string; name: string } {
  const cat = (rawCat || '').trim();
  const upper = cat.toUpperCase();
  const lower = cat.toLowerCase();

  if (cat.includes('바스') || cat.includes('욕실') || lower.includes('bath') || upper.startsWith('MX0120') || upper.startsWith('M-X0120') || upper.includes('BASV') || upper.includes('BASR') || upper.includes('BASA')) {
    return { key: 'bathair', name: '바스에어시스템' };
  }
  if (cat.includes('정수기') && !cat.includes('얼음정수기 냉장고')) return { key: 'water', name: '정수기' };
  if (cat.includes('얼음정수기 냉장고') || cat.includes('냉장고') || cat.includes('상냉장') || cat.includes('STEM') || cat.includes('일반냉장고') || cat.includes('양문형')) {
    if (cat.includes('김치')) return { key: 'kimchi', name: '김치냉장고' };
    return { key: 'fridge', name: '냉장고' };
  }
  if (cat.includes('김치')) return { key: 'kimchi', name: '김치냉장고' };
  if (cat.includes('식기세척기')) return { key: 'dishwasher', name: '식기세척기' };
  if (cat.includes('광파오븐') || cat.includes('전자레인지') || upper.startsWith('ML') || upper.startsWith('MZ')) return { key: 'range', name: '광파오븐' };
  if (cat.includes('전기레인지') || cat.includes('인덕션') || cat.includes('하이브리드')) return { key: 'range', name: '전기레인지' };
  if (cat.includes('워시콤보')) return { key: 'washcombo', name: '워시콤보' };
  if (cat.includes('워시타워') || cat.includes('워시타워컴팩트')) return { key: 'washtower', name: '워시타워' };
  if (cat.includes('세탁기') || cat.includes('미니워시')) return { key: 'washer', name: '세탁기' };
  if (cat.includes('건조기')) return { key: 'dryer', name: '의류건조기' };
  if (cat.includes('스타일러')) return { key: 'styler', name: '스타일러' };
  if (cat.includes('에어컨') || cat.includes('벽걸이')) return { key: 'aircon', name: '에어컨' };
  if (cat.includes('공기청정기')) return { key: 'airpurifier', name: '공기청정기' };
  if (cat.includes('에어로타워')) return { key: 'aerotower', name: '에어로타워' };
  if (cat.includes('제습기') || upper.startsWith('DQ') || upper.startsWith('DC') || upper.startsWith('DD')) return { key: 'dehumidifier', name: '제습기' };
  if (cat.includes('가습기') || upper.startsWith('HY') || upper.startsWith('HW')) return { key: 'humidifier', name: '정수가습기' };
  if (cat.includes('스탠바이미') || cat.includes('스바미')) return { key: 'standby', name: '스탠바이미' };
  if (cat.includes('TV') || cat.includes('OLED') || cat.includes('QNED') || cat.includes('NANO') || cat.includes('ULTRA') || cat.includes('포제') || cat.includes('플렉스')) return { key: 'tv', name: '올레드 / QNED TV' };
  if (cat.includes('청소기') || cat.includes('로보킹') || cat.includes('로니')) return { key: 'vacuum', name: '청소기' };
  if (cat.includes('안마의자') || ((upper.startsWith('MX') || upper.startsWith('BM')) && !upper.startsWith('MX0120') && !upper.startsWith('M-X0120'))) return { key: 'massage', name: '안마의자' };
  if (cat.includes('슈케어')) return { key: 'shoecare', name: '슈케어' };

  return { key: 'water', name: cat || '가전' };
}

// Helper color hex mapper for LG appliances
const LG_COLOR_HEX_MAP: Record<string, string> = {
  '베이지': '#D9CAB3',
  '화이트': '#FFFFFF',
  '브라운': '#6B4E3D',
  '블랙': '#1A1A1A',
  '실버': '#C4C8CC',
  '그레이': '#8B95A1',
  '핑크': '#F4B6C2',
  '스카이': '#A0C4E2',
  '그린': '#4A6B53',
  '카밍 베이지': '#D9CAB3',
  '카밍 화이트': '#FFFFFF',
  '클레이 브라운': '#6B4E3D',
  '클레이 민트': '#A3C1AD',
  '네이비': '#1B2A4A',
  '스테인리스': '#B8B8B8'
};

function getLgColorHex(colorName: string): string {
  const clean = (colorName || '').trim();
  for (const [k, hex] of Object.entries(LG_COLOR_HEX_MAP)) {
    if (clean.includes(k) || k.includes(clean)) return hex;
  }
  return '#D1D6DB';
}

const CATEGORY_TO_LGE_SLUG: Record<string, string> = {
  water: 'water-purifiers',
  fridge: 'refrigerators',
  kimchi: 'kimchi-refrigerators',
  dishwasher: 'dishwashers',
  range: 'electric-stoves',
  washer: 'washing_machines',
  washtower: 'wash-tower',
  washcombo: 'wash-combo',
  dryer: 'dryers',
  styler: 'lg-styler',
  shoecare: 'shoe-care',
  bathair: 'bath-air-system',
  aircon: 'air-conditioners',
  aircare: 'air-purifiers',
  airpurifier: 'air-purifiers',
  aerotower: 'air-purifiers',
  humidifier: 'humidifiers',
  dehumidifier: 'dehumidifiers',
  tv: 'tvs',
  standby: 'stanbyme',
  vacuum: 'vacuum-cleaners',
  massage: 'massage-chairs',
};

// 10% discount calculation with 10-won cut (100-won unit floor)
function calc10PercentDiscount(price: number): number {
  if (!price || price <= 0) return 0;
  return Math.floor((price * 0.9) / 100) * 100;
}

function inferOfficialColorForModel(modelCode: string): string {
  const upper = (modelCode || '').toUpperCase().trim();

  // Styler Color Codes
  if (upper.startsWith('SC5') || upper.startsWith('S5') || upper.startsWith('S3')) {
    if (upper.includes('GMR') || upper.includes('MR')) return '블랙 틴트 미러';
    if (upper.includes('MBR') || upper.includes('MB')) return '미스트 베이지';
    if (upper.includes('MSR') || upper.includes('SR')) return '미스트 실버';
    if (upper.includes('GNE') || upper.includes('NE')) return '에센스 네이비';
    if (upper.includes('GEW') || upper.includes('EW')) return '에센스 화이트';
  }

  // TV Suffix (S: 스탠드형, W: 벽걸이형)
  if (upper.includes('QNED') || upper.includes('OLED') || upper.includes('MRGB') || upper.includes('NANO') || upper.includes('LX7')) {
    const isWall = upper.endsWith('W') || upper.endsWith('MW') || upper.endsWith('KW') || upper.endsWith('BKW') || upper.endsWith('BMW') || upper.includes('WALL');
    return isWall ? '벽걸이형' : '스탠드형';
  }

  // Water Purifiers & Other Appliances
  if (upper.includes('ACB') || upper.includes('NSM') || upper.includes('WD724RE')) return '카밍 베이지';
  if (upper.includes('AWB') || upper.includes('RH')) return '카밍 화이트';
  if (upper.includes('ABB') || upper.includes('RK')) return '카밍 블랙';
  if (upper.includes('ANB')) return '클레이 브라운';
  if (upper.endsWith('AS') || upper.includes('AS.') || upper.includes('SILVER')) return '실버';
  if (upper.includes('NGM') || upper.includes('GREEN')) return '카밍 그린';
  if (upper.includes('PINK')) return '카밍 핑크';

  return '기본';
}

// Helper to render category icon (supports emoji text or image URL / Data URL)
export function renderCategoryIcon(icon: string, name: string, className = "w-5 h-5 object-contain") {
  if (!icon) return <span className="text-[16px]">📦</span>;
  const isImage = icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('data:image') || icon.startsWith('/');
  if (isImage) {
    return <img src={icon} alt={name} className={className} />;
  }
  return <span className="text-[16px] leading-none">{icon}</span>;
}

function formatSubscriptionRefUrl(url?: string, modelCode?: string, categoryKey?: string): string {
  return buildLgOfficialPdpUrl(url, modelCode, categoryKey);
}

export default function LgProductManagement() {
  // Convex queries & mutations
  const products = useQuery(api.lgProducts.getAll) || [];
  const dbCategories = useQuery(api.lgCategories.getOrdered);
  const updateCategoryOrder = useMutation(api.lgCategories.updateCategoryOrder);
  const updateCategoryDetails = useMutation(api.lgCategories.updateCategoryDetails);
  const setDefaultLandingCategory = useMutation(api.lgCategories.setDefaultLandingCategory);
  const removeCategory = useMutation(api.lgCategories.removeCategory);
  const createProduct = useMutation(api.lgProducts.create);
  const updateProduct = useMutation(api.lgProducts.update);
  const removeProduct = useMutation(api.lgProducts.remove);
  const updateProductOrder = useMutation(api.lgProducts.updateProductOrder);
  const batchDelete = useMutation(api.lgProducts.batchDelete);
  const batchToggleVisibility = useMutation(api.lgProducts.batchToggleVisibility);
  const batchUpsert = useMutation(api.lgProducts.batchUpsert);
  const hideUnverifiedProducts = useMutation(api.lgProducts.hideUnverifiedProducts);
  const batchUpdateVerification = useMutation(api.lgProducts.batchUpdateVerification);
  const scrapeLgCareProductAction = useAction(api.crawler.scrapeLgCareProduct);
  const scrapeLgCareProductsBatchAction = useAction(api.crawler.scrapeLgCareProductsBatch);
  const verifyExistingProductsBatchAction = useAction(api.crawler.verifyExistingProductsBatch);

  // States
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Pagination States for high performance
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(30);

  // Batch Verification State
  const [isBatchVerifying, setIsBatchVerifying] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState<{ current: number; total: number } | null>(null);

  // Quick Custom Link Edit State
  const [linkEditItem, setLinkEditItem] = useState<{ id: any; model: string; name: string; refUrl: string } | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState('');

  // Category Drag & Drop States
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);

  // Category Edit Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ key: string; name: string; icon: string; badge?: string; isDefault?: boolean } | null>(null);

  // Current Default Landing Category Key
  const defaultLandingCategoryKey = useMemo(() => {
    const found = dbCategories?.find((c: any) => c.isDefault);
    return found ? found.key : 'all';
  }, [dbCategories]);

  // Ordered Categories (strictly reflecting DB categories when present)
  const categoriesList = useMemo<LgCategory[]>(() => {
    const staticList = LG_CATEGORIES.filter(c => c.key !== 'all');
    if (!dbCategories || dbCategories.length === 0) {
      return [{ key: 'all', name: '전체 카테고리', icon: '✨' }, ...staticList];
    }

    // Filter out legacy hyphenated keys and deleted categories
    const cleanedDbCats = dbCategories.filter(c => c.key !== 'bath-air' && c.key !== 'bath_air' && !(c as any).isDeleted);

    return [
      { key: 'all', name: '전체 카테고리', icon: '✨' },
      ...cleanedDbCats.map(c => ({
        key: c.key,
        name: c.name,
        icon: c.icon,
        badge: (c as any).badge,
        group: (c as any).group,
        isDefault: (c as any).isDefault
      }))
    ];
  }, [dbCategories]);

  // Category drag handlers
  const handleCategoryDragStart = (e: React.DragEvent, index: number) => {
    if (index === 0) {
      e.preventDefault();
      return;
    }
    setDraggedCategoryIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCategoryDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedCategoryIndex === null || draggedCategoryIndex === targetIndex || targetIndex === 0) {
      setDraggedCategoryIndex(null);
      return;
    }

    const nonAllCats = categoriesList.filter(c => c.key !== 'all');
    const sourceIdxInNonAll = draggedCategoryIndex - 1;
    const targetIdxInNonAll = targetIndex - 1;

    const reordered = [...nonAllCats];
    const [moved] = reordered.splice(sourceIdxInNonAll, 1);
    reordered.splice(targetIdxInNonAll, 0, moved);

    setDraggedCategoryIndex(null);

    try {
      await updateCategoryOrder({
        orderedKeys: reordered.map(c => c.key)
      });
    } catch (err) {
      console.error('Failed to update category order:', err);
    }
  };

  const handleSetDefaultLandingCategory = async (key: string) => {
    try {
      await setDefaultLandingCategory({ key });
    } catch (err) {
      console.error('Failed to set default landing category:', err);
    }
  };

  const handleOpenCategoryEdit = (cat: LgCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory({
      key: cat.key,
      name: cat.name,
      icon: cat.icon,
      badge: (cat as any).badge || '',
      isDefault: (cat as any).isDefault || false,
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategoryEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      await updateCategoryDetails({
        key: editingCategory.key,
        name: editingCategory.name.trim(),
        icon: editingCategory.icon.trim() || '📦',
        badge: editingCategory.badge ? editingCategory.badge.trim() : undefined,
        isDefault: editingCategory.isDefault,
      });
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
    } catch (err) {
      console.error('Failed to save category details:', err);
      alert('카테고리 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteCategory = async (cat: { key: string; name: string }) => {
    if (!window.confirm(`'${cat.name}' 카테고리를 정말 삭제하시겠습니까?\n(등록된 제품은 삭제되지 않으며 언제든 다시 등록할 수 있습니다)`)) {
      return;
    }
    try {
      await removeCategory({ key: cat.key });
      if (selectedCategoryKey === cat.key) {
        setSelectedCategoryKey('all');
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
    } catch (err) {
      console.error('Failed to delete category:', err);
      alert('카테고리 삭제 중 오류가 발생했습니다.');
    }
  };

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isFetchingSingle, setIsFetchingSingle] = useState(false);
  const [choiceModalProduct, setChoiceModalProduct] = useState<any | null>(null);

  const handleOpenOfficialLink = (p: any, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const rels = p.relatedUrls || [];
    if (rels.length > 1) {
      setChoiceModalProduct(p);
    } else {
      const initialUrl = rels.length === 1 && rels[0].url ? rels[0].url : p.refUrl;
      const targetUrl = formatSubscriptionRefUrl(initialUrl, p.categoryKey, p.model);
      window.open(targetUrl, '_blank');
    }
  };

  // Sidebar collapse & responsive view mode states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Upload & Progress States
  const excelFileRef = useRef<HTMLInputElement>(null);
  const [uploadCategoryTarget, setUploadCategoryTarget] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    currentModel: string;
  } | null>(null);

  const [uploadResultModal, setUploadResultModal] = useState<{
    isOpen: boolean;
    totalRows: number;
    successCount: number;
    failCount: number;
    failedList: Array<{ model: string; reason: string; category?: string }>;
  } | null>(null);

  // Helper to get resolved category key for any product record
  const getProductCategoryKey = (p: any): string => {
    if (!p) return 'water';
    const cat = (p.category || '').trim();
    const catKey = (p.categoryKey || '').trim();
    const name = (p.name || '').trim();
    const m = (p.model || '').toUpperCase().trim();

    if (
      catKey === 'bathair' ||
      catKey === 'bath-air-system' ||
      catKey === 'bath' ||
      cat.includes('바스') ||
      cat.includes('욕실') ||
      name.includes('바스') ||
      name.includes('욕실') ||
      m.startsWith('MX0120') ||
      m.startsWith('M-X0120') ||
      m.includes('BASV') ||
      m.includes('BASR') ||
      m.includes('BASA') ||
      m.startsWith('MX01') ||
      m.startsWith('M-X01')
    ) {
      return 'bathair';
    }

    if (catKey && catKey !== 'water' && catKey !== 'fridge') {
      return catKey;
    }
    return mapExcelCategoryToKey(cat || name || m).key;
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    for (const p of products) {
      const key = getProductCategoryKey(p);
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [products]);

  // Verification counts
  const verificationCounts = useMemo(() => {
    let verified = 0;
    let unverified = 0;
    for (const p of products) {
      const isVer = p.isOfficialVerified !== undefined 
        ? p.isOfficialVerified 
        : (Boolean(p.image) && Boolean(p.refUrl) && p.refUrl.includes('lge.co.kr') && !p.refUrl.includes('/search/'));
      if (isVer) verified++;
      else unverified++;
    }
    return { verified, unverified };
  }, [products]);

  // Filtered product list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategoryKey !== 'all') {
        const key = getProductCategoryKey(p);
        if (key !== selectedCategoryKey) {
          return false;
        }
      }
      // Official Verification filter
      if (verificationFilter !== 'all') {
        const isVer = p.isOfficialVerified !== undefined 
          ? p.isOfficialVerified 
          : (Boolean(p.image) && Boolean(p.refUrl) && p.refUrl.includes('lge.co.kr') && !p.refUrl.includes('/search/'));
        if (verificationFilter === 'verified' && !isVer) return false;
        if (verificationFilter === 'unverified' && isVer) return false;
      }
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = (p.name || '').toLowerCase().includes(term);
        const matchModel = (p.model || '').toLowerCase().includes(term);
        const matchCat = (p.category || '').toLowerCase().includes(term);
        const matchColor = (p.color || '').toLowerCase().includes(term);
        if (!matchName && !matchModel && !matchCat && !matchColor) return false;
      }
      return true;
    });
  }, [products, selectedCategoryKey, verificationFilter, searchTerm]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoryKey, verificationFilter, searchTerm]);

  // Paginated product slice for fast rendering
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / (pageSize || 30)));
  const paginatedProducts = useMemo(() => {
    if (pageSize >= 9999) return filteredProducts;
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Handle Hide Unverified Products
  const handleHideUnverified = async () => {
    if (!window.confirm('LG 공식 홈페이지 미등록(미확인) 모델을 모두 비노출(숨김) 처리하시겠습니까?')) {
      return;
    }
    try {
      const res = await hideUnverifiedProducts();
      alert(`공홈 미확인 제품 ${res.hiddenCount}개가 랜딩에서 비노출(숨김) 처리되었습니다.`);
    } catch (err) {
      console.error('Failed to hide unverified products:', err);
      alert('일괄 숨김 처리 중 오류가 발생했습니다.');
    }
  };

  // Handle Full Batch Official Verification
  const handleRunBatchVerification = async () => {
    if (products.length === 0) {
      alert('검증할 등록 제품이 없습니다.');
      return;
    }

    if (!window.confirm(`현재 등록된 ${products.length}개 제품의 LG 공홈 실존 여부를 일괄 재검증하시겠습니까?\n(미등록 제품은 자동으로 숨김 처리됩니다)`)) {
      return;
    }

    setIsBatchVerifying(true);
    const total = products.length;
    setVerifyProgress({ current: 0, total });

    const CHUNK_SIZE = 12;
    let verifiedCount = 0;
    let unverifiedCount = 0;

    try {
      for (let i = 0; i < total; i += CHUNK_SIZE) {
        const chunk = products.slice(i, i + CHUNK_SIZE);
        setVerifyProgress({ current: i, total });

        const results = await verifyExistingProductsBatchAction({
          items: chunk.map((p) => ({
            id: p._id,
            model: p.model,
            refUrl: p.refUrl,
            category: p.category,
          })),
        });

        if (results && results.length > 0) {
          for (const r of results) {
            if (r.isOfficialVerified) verifiedCount++;
            else unverifiedCount++;
          }

          await batchUpdateVerification({
            results: results.map((r: any) => ({
              id: r.id as any,
              isOfficialVerified: r.isOfficialVerified,
              refUrl: r.refUrl,
              autoHideUnverified: true,
            })),
          });
        }
      }

      setVerifyProgress({ current: total, total });
      alert(`LG 공홈 실존 일괄 검증 완료!\n- 공홈 정상 확인: ${verifiedCount}건\n- 공홈 미등록/단종: ${unverifiedCount}건 (비노출 전환 완료)`);
    } catch (err) {
      console.error('Batch verification error:', err);
      alert('일괄 검증 처리 중 오류가 발생했습니다.');
    } finally {
      setIsBatchVerifying(false);
      setVerifyProgress(null);
    }
  };

  // Handle Drag & Drop
  const handleDragStart = (index: number) => {
    setTimeout(() => {
      setDraggedIndex(index);
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newList = [...filteredProducts];
    const [movedItem] = newList.splice(draggedIndex, 1);
    newList.splice(dropIndex, 0, movedItem);

    const orders = newList.map((item, idx) => ({
      id: item._id,
      order: idx,
    }));

    try {
      await updateProductOrder({ orders });
    } catch (e) {
      console.error('Failed to update product order:', e);
    }
    setDraggedIndex(null);
  };

  // Checkbox Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p._id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Batch Actions
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`선택한 ${selectedIds.length}개 제품을 삭제하시겠습니까?`)) {
      await batchDelete({ ids: selectedIds as any });
      setSelectedIds([]);
    }
  };

  const handleBatchToggleVisibility = async (isVisible: boolean) => {
    if (selectedIds.length === 0) return;
    await batchToggleVisibility({ ids: selectedIds as any, isVisible });
    setSelectedIds([]);
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const data = [
      ['카테고리', '색상', '주문 모델명\r\n(+서픽스)', '케어서비스 유형', '케어서비스 주기', '5년 약정 / 5년 계약', null, null, '6년 약정 / 6년 계약'],
      [null, null, null, null, null, '기본\r\n월요금', '월요금', '수수료', '기본\r\n월요금', '월요금', '수수료'],
      ['정수기', '베이지\r\n화이트\r\n브라운\r\n블랙', 'WU923ACB.AKOR\r\nWU923AWB.AKOR\r\nWU923ANB.AKOR\r\nWU923ABB.AKOR', '방문케어', '6개월', 42900, 38600, 209100, 39900, 35900, 233400],
      ['정수기', null, null, '셀프케어', '자가관리', 39900, 35900, 194500, 36900, 33200, 215900],
      ['공기청정기', '베이지\r\n그린', 'AS356NSMAM.AKOR\r\nAS356NGMAM.AKOR', '방문케어', '3개월', 74900, 67400, 202100, 68900, 62000, 226400]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "정리3");
    XLSX.writeFile(wb, "LG구독제품_등록양식.xlsx");
  };

  // Trigger Excel File Selector
  const handleTriggerUpload = (categoryKey?: string) => {
    setUploadCategoryTarget(categoryKey || null);
    if (excelFileRef.current) {
      excelFileRef.current.value = '';
      excelFileRef.current.click();
    }
  };

  // Process Excel File Upload & Crawl (Care Options Matrix + Accurate Color Mapping)
  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheetName = wb.SheetNames.includes('정리3')
        ? '정리3'
        : (wb.SheetNames.find((s) => s.includes('냉장고') || s.includes('정리') || s.includes('제품') || s.includes('가전')) || wb.SheetNames[0]);
      const ws = wb.Sheets[sheetName];
      const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      if (data.length <= 1) {
        alert('엑셀 파일에 유효한 데이터가 없습니다.');
        return;
      }

      // Group rows into Product Blocks (Multiple Care Cycles & Option Rows)
      interface CareOptionItem {
        cycle: string;
        type: string;
        p5Base: number;
        p5Discount: number;
        p5DiscountRate: number;
        p6Base: number;
        p6Discount: number;
        p6DiscountRate: number;
      }

      interface ParsedProductBlock {
        category: string;
        models: string[];
        colors: string[];
        careOptions: CareOptionItem[];
      }

      const blocks: ParsedProductBlock[] = [];
      let currentCategory = '';
      let currentColors: string[] = [];
      let currentModels: string[] = [];
      let currentCareOptions: CareOptionItem[] = [];

      const flushBlock = () => {
        if (currentModels.length > 0) {
          blocks.push({
            category: currentCategory,
            models: [...currentModels],
            colors: [...currentColors],
            careOptions: currentCareOptions.length > 0 ? [...currentCareOptions] : [
              {
                cycle: '12개월',
                type: '방문케어',
                p5Base: 39900,
                p5Discount: 35900,
                p5DiscountRate: 10,
                p6Base: 36900,
                p6Discount: 33200,
                p6DiscountRate: 10,
              }
            ],
          });
        }
        currentCareOptions = [];
      };

      // Detect header row automatically
      let startRow = 2;
      for (let i = 0; i < Math.min(5, data.length); i++) {
        const r = data[i] || [];
        const rowStr = r.join(' ');
        if (rowStr.includes('카테고리') || rowStr.includes('모델') || rowStr.includes('색상') || rowStr.includes('구독료') || rowStr.includes('케어')) {
          startRow = i + 1;
          break;
        }
      }

      for (let r = startRow; r < data.length; r++) {
        const row = data[r];
        if (!row || row.length === 0) continue;

        const rawCat = row[0] ? String(row[0]).trim() : '';
        const rawColors = row[1] ? String(row[1]).split(/[\r\n]+/).map((c) => c.trim()).filter(Boolean) : [];
        const rawModels = row[2] ? String(row[2]).split(/[\r\n]+/).map((m) => m.trim()).filter(Boolean) : [];

        // When a new product row appears (contains model list)
        if (rawModels.length > 0) {
          flushBlock();
          if (rawCat) currentCategory = rawCat;
          currentColors = rawColors;
          currentModels = rawModels;
        }

        const rawCareType = row[3] ? String(row[3]).trim() : '';
        const rawCareCycle = row[4] ? String(row[4]).trim() : '';
        const p5Base = parseInt(String(row[5] || '0').replace(/[^0-9]/g, ''), 10) || 0;
        const p5Discount = parseInt(String(row[6] || '0').replace(/[^0-9]/g, ''), 10) || 0;
        const p6Base = parseInt(String(row[8] || '0').replace(/[^0-9]/g, ''), 10) || 0;
        const p6Discount = parseInt(String(row[9] || '0').replace(/[^0-9]/g, ''), 10) || 0;

        const careCycle = rawCareCycle || (rawCareType.includes('자가') ? '자가관리' : '12개월');
        const careType = rawCareType || (careCycle.includes('자가') ? '셀프케어' : '방문케어');

        if (careCycle || p5Base > 0 || p6Base > 0) {
          currentCareOptions.push({
            cycle: careCycle,
            type: careType,
            p5Base,
            p5Discount: p5Discount || (p5Base > 0 ? Math.round(p5Base * 0.9) : 0),
            p5DiscountRate: p5Base > 0 ? Math.round(((p5Base - (p5Discount || Math.round(p5Base * 0.9))) / p5Base) * 100) : 10,
            p6Base,
            p6Discount: p6Discount || (p6Base > 0 ? Math.round(p6Base * 0.9) : 0),
            p6DiscountRate: p6Base > 0 ? Math.round(((p6Base - (p6Discount || Math.round(p6Base * 0.9))) / p6Base) * 100) : 10,
          });
        }
      }
      flushBlock();

      // Filter by target category if specified, but fallback to all valid blocks if target doesn't match
      let filteredBlocks = uploadCategoryTarget && uploadCategoryTarget !== 'all'
        ? blocks.filter((b) => {
            const catMap = mapExcelCategoryToKey(b.category);
            return catMap.key === uploadCategoryTarget;
          })
        : blocks;

      // If filtered is empty but blocks exist (e.g. user uploaded a general excel while in another category tab), process all blocks
      if (filteredBlocks.length === 0 && blocks.length > 0) {
        filteredBlocks = blocks;
      }

      if (filteredBlocks.length === 0) {
        alert('등록 가능한 제품 행이 엑셀 파일에 없습니다. 엑셀 파일 내용을 확인해 주세요.');
        return;
      }

      // Expand blocks into individual distinct model items with exact color mapping
      interface ItemToProcess {
        modelCode: string;
        modelColor: string;
        blockColors: string[];
        category: string;
        careOptions: CareOptionItem[];
        defaultOption: CareOptionItem;
      }

      const itemsToProcess: ItemToProcess[] = [];
      for (const b of filteredBlocks) {
        for (let i = 0; i < b.models.length; i++) {
          const modelCode = b.models[i];
          const modelColor = b.colors[i] || b.colors[0] || '기본';
          const defaultOpt = b.careOptions[0] || {
            cycle: '12개월',
            type: '방문케어',
            p5Base: 39900,
            p5Discount: 35900,
            p5DiscountRate: 10,
            p6Base: 36900,
            p6Discount: 33200,
            p6DiscountRate: 10,
          };

          itemsToProcess.push({
            modelCode,
            modelColor,
            blockColors: b.colors,
            category: b.category,
            careOptions: b.careOptions,
            defaultOption: defaultOpt,
          });
        }
      }

      const totalCount = itemsToProcess.length;

      setUploadProgress({
        current: 0,
        total: totalCount,
        currentModel: 'LG 공홈 실시간 초고속 정보 매칭 중...',
      });

      const successProducts: any[] = [];
      const failedList: Array<{ model: string; reason: string; category?: string }> = [];
      const unmappedItems: ItemToProcess[] = [];

      // Helper to safely normalize specifications to Array<{ name: string; value: string }>
      const normalizeSpecs = (rawSpecs: any) => {
        if (!rawSpecs) return [];
        if (Array.isArray(rawSpecs)) {
          return rawSpecs.map((s) => ({
            name: String(s.name || ''),
            value: String(s.value || ''),
          }));
        }
        if (typeof rawSpecs === 'object') {
          return Object.entries(rawSpecs).map(([k, v]) => ({
            name: String(k),
            value: String(v),
          }));
        }
        return [];
      };

      // Helper to safely normalize colors array
      const normalizeColors = (rawColors: any[]) => {
        if (!rawColors || !Array.isArray(rawColors)) return [];
        return rawColors.map((c) => ({
          name: String(c.name || '기본'),
          code: String(c.code || '#2B2B2B'),
          image: c.image ? String(c.image) : undefined,
          material: c.material ? String(c.material) : undefined,
          modelSuffix: c.modelSuffix ? String(c.modelSuffix) : undefined,
          isDefault: Boolean(c.isDefault),
        }));
      };

      // Step 1: 0ms Fast Official Catalog Cache Matching
      let processedCount = 0;
      for (const item of itemsToProcess) {
        const cleanKey = item.modelCode.trim().split('.')[0].split('-')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        const exactKey = item.modelCode.trim().toLowerCase();
        const cached = OFFICIAL_CATALOG_MAP.get(cleanKey) || OFFICIAL_CATALOG_MAP.get(exactKey);

        if (cached) {
          const effectiveCat = (uploadCategoryTarget && uploadCategoryTarget !== 'all') ? uploadCategoryTarget : (item.category || item.modelCode || cached.categoryName);
          const catMap = mapExcelCategoryToKey(effectiveCat);
          const r5 = Number(item.defaultOption.p5Base) || Number(cached.rentalPrice) || 0;
          const d5 = Number(item.defaultOption.p5Discount) || (r5 > 0 ? Math.round(r5 * 0.9) : 0);
          const rate5 = Number(item.defaultOption.p5DiscountRate) || (r5 > 0 ? Math.round(((r5 - d5) / r5) * 100) : 10);

          const r6 = Number(item.defaultOption.p6Base) || Number(cached.rentalPrice) || 0;
          const d6 = Number(item.defaultOption.p6Discount) || (r6 > 0 ? Math.round(r6 * 0.9) : 0);
          const rate6 = Number(item.defaultOption.p6DiscountRate) || (r6 > 0 ? Math.round(((r6 - d6) / r6) * 100) : 10);

          const careCycles = item.careOptions.map((o) => o.cycle);
          const careTypes = Array.from(new Set(item.careOptions.map((o) => o.type)));

          const effectiveColor = (!item.modelColor || item.modelColor === '기본')
            ? inferOfficialColorForModel(item.modelCode)
            : item.modelColor;

          // Construct exact colors lineup with current model color highlighted
          const formattedColors = item.blockColors.length > 0
            ? item.blockColors.map((cName) => ({
                name: cName,
                code: getLgColorHex(cName),
                isDefault: cName === effectiveColor,
                image: cached.image,
              }))
            : cached.colors || [{ name: effectiveColor, code: getLgColorHex(effectiveColor), isDefault: true }];

          const refUrl = formatSubscriptionRefUrl(cached.refUrl, item.modelCode, catMap.key);

          successProducts.push({
            name: cached.name,
            model: cached.model || item.modelCode,
            originalModel: item.modelCode,
            brand: 'LG전자',
            category: catMap.name,
            categoryKey: catMap.key,
            group: cached.group || undefined,
            image: cached.image || '',
            images: cached.images || (cached.image ? [cached.image] : []),
            refUrl,
            color: effectiveColor,
            colors: normalizeColors(formattedColors),
            careCycles,
            careTypes,
            careOptions: item.careOptions,
            rentalPrice5Year: r5,
            discountPrice5Year: d5,
            discountRate5Year: rate5,
            rentalPrice6Year: r6,
            discountPrice6Year: d6,
            discountRate6Year: rate6,
            subscriptionOptions: cached.subscriptionOptions,
            specifications: normalizeSpecs(cached.specs),
            isOfficialVerified: true,
            isVisible: true,
          });

          processedCount++;
          if (processedCount % 10 === 0 || processedCount === totalCount) {
            setUploadProgress({
              current: processedCount,
              total: totalCount,
              currentModel: `${item.modelCode} [${effectiveColor}] (공식 카탈로그 매칭 완료)`,
            });
          }
        } else {
          unmappedItems.push(item);
        }
      }

      // Step 2: Ultra-Fast Parallel Batch Scraping for New Unmapped Models
      if (unmappedItems.length > 0) {
        const BATCH_CHUNK = 12;
        for (let i = 0; i < unmappedItems.length; i += BATCH_CHUNK) {
          const chunk = unmappedItems.slice(i, i + BATCH_CHUNK);
          setUploadProgress({
            current: processedCount + i,
            total: totalCount,
            currentModel: `${chunk[0].modelCode} 외 ${chunk.length}개 실시간 공홈 수집 중...`,
          });

          try {
            const batchResults = await scrapeLgCareProductsBatchAction({
              items: chunk.map((c) => ({
                model: c.modelCode,
                excelCategory: c.category,
                excelColors: c.blockColors,
                p5Base: c.defaultOption.p5Base,
                p5Discount: c.defaultOption.p5Discount,
                p6Base: c.defaultOption.p6Base,
                p6Discount: c.defaultOption.p6Discount,
              })),
            });

            for (let j = 0; j < batchResults.length; j++) {
              const res = batchResults[j];
              const src = chunk[j];
              if (res && res.success) {
                const effectiveCat = (uploadCategoryTarget && uploadCategoryTarget !== 'all') ? uploadCategoryTarget : (src.category || src.modelCode || res.category);
                const catMap = mapExcelCategoryToKey(effectiveCat);
                const careCycles = src.careOptions.map((o) => o.cycle);
                const careTypes = Array.from(new Set(src.careOptions.map((o) => o.type)));

                const effectiveColor = (!src.modelColor || src.modelColor === '기본')
                  ? (res.color && res.color !== '기본' ? res.color : inferOfficialColorForModel(src.modelCode))
                  : src.modelColor;

                const formattedColors = src.blockColors.length > 0
                  ? src.blockColors.map((cName) => ({
                      name: cName,
                      code: getLgColorHex(cName),
                      isDefault: cName === effectiveColor,
                      image: res.image,
                    }))
                  : res.colors || [{ name: effectiveColor, code: getLgColorHex(effectiveColor), isDefault: true }];

                const refUrl = formatSubscriptionRefUrl(res.refUrl, src.modelCode, catMap.key);
                const isOfficialVerified = res.isOfficialVerified !== undefined 
                  ? res.isOfficialVerified 
                  : Boolean(res.image && !res.refUrl?.includes('/search/'));

                const r5 = Number(src.defaultOption.p5Base) || Number(res.rentalPrice5Year) || 0;
                const d5 = Number(src.defaultOption.p5Discount) || Number(res.discountPrice5Year) || (r5 > 0 ? Math.round(r5 * 0.9) : 0);
                const rate5 = Number(src.defaultOption.p5DiscountRate) || Number(res.discountRate5Year) || 10;

                const r6 = Number(src.defaultOption.p6Base) || Number(res.rentalPrice6Year) || 0;
                const d6 = Number(src.defaultOption.p6Discount) || Number(res.discountPrice6Year) || (r6 > 0 ? Math.round(r6 * 0.9) : 0);
                const rate6 = Number(src.defaultOption.p6DiscountRate) || Number(res.discountRate6Year) || 10;

                successProducts.push({
                  name: res.name || `LG ${src.modelCode}`,
                  model: res.model || src.modelCode,
                  originalModel: res.originalModel || src.modelCode,
                  brand: res.brand || 'LG전자',
                  category: catMap.name,
                  categoryKey: catMap.key,
                  group: undefined,
                  image: res.image || '',
                  images: res.images || (res.image ? [res.image] : []),
                  refUrl,
                  relatedUrls: res.relatedUrls,
                  color: effectiveColor,
                  colors: normalizeColors(formattedColors),
                  careCycles,
                  careTypes,
                  careOptions: src.careOptions,
                  rentalPrice5Year: r5,
                  discountPrice5Year: d5,
                  discountRate5Year: rate5,
                  rentalPrice6Year: r6,
                  discountPrice6Year: d6,
                  discountRate6Year: rate6,
                  subscriptionOptions: res.subscriptionOptions,
                  specifications: normalizeSpecs(res.specifications),
                  isOfficialVerified,
                  isVisible: isOfficialVerified, // 공홈 인증된 모델만 자동 노출!
                });

                if (!isOfficialVerified) {
                  failedList.push({
                    model: src.modelCode,
                    category: src.category,
                    reason: 'LG 공홈 상세 미확인 (자동 비노출 처리됨)',
                  });
                }
              } else {
                failedList.push({
                  model: src.modelCode,
                  category: src.category,
                  reason: (res as any)?.reason || 'LG 공홈에서 해당 모델을 찾을 수 없음 (404 미등록)',
                });
              }
            }
          } catch (err: any) {
            console.error('Batch scrape error:', err);
            for (const src of chunk) {
              failedList.push({
                model: src.modelCode,
                category: src.category,
                reason: '스크래핑 처리 중 오류 발생',
              });
            }
          }
        }
      }

      // Step 3: Save all success products to DB in batch
      if (successProducts.length > 0) {
        setUploadProgress({
          current: totalCount,
          total: totalCount,
          currentModel: '수집 완료! 데이터베이스 일괄 저장 중...',
        });
        await batchUpsert({ products: successProducts });
      }

      setUploadProgress(null);
      setUploadResultModal({
        isOpen: true,
        totalRows: totalCount,
        successCount: successProducts.length,
        failCount: failedList.length,
        failedList,
      });
    } catch (err) {
      console.error('Excel upload process error:', err);
      alert('엑셀 파일 처리 중 오류가 발생했습니다.');
      setUploadProgress(null);
    }
  };

  // Open Edit/Create Modal
  const handleOpenCreateModal = () => {
    const currentCatObj = LG_CATEGORIES.find((c) => c.key === selectedCategoryKey && c.key !== 'all');
    setEditingItem({
      name: '',
      model: '',
      brand: 'LG전자',
      category: currentCatObj?.name || '정수기',
      categoryKey: currentCatObj?.key || 'water',
      refUrl: 'https://www.lge.co.kr/care-solutions',
      image: '',
      images: [],
      color: '',
      colors: [],
      careCycles: ['6개월', '자가관리'],
      careTypes: ['방문케어', '셀프케어'],
      rentalPrice5Year: 39900,
      discountPrice5Year: 35900,
      discountRate5Year: 10,
      rentalPrice6Year: 36900,
      discountPrice6Year: 33200,
      discountRate6Year: 10,
      isVisible: true,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (product: any) => {
    // Look up official catalog data for exact care cycle and type
    const clean = (product.model || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const official = OFFICIAL_CATALOG_MAP.get(clean) || OFFICIAL_CATALOG_MAP.get((product.model || '').trim().toLowerCase());

    let cycles = product.careCycles || [];
    let types = product.careTypes || [];

    const subOpts = product.subscriptionOptions || official?.subscriptionOptions;
    if (subOpts?.careServiceCycles?.length) {
      cycles = subOpts.careServiceCycles.map((c: any) => c.label || c.value);
    } else if (product.careOptions?.length) {
      cycles = Array.from(new Set(product.careOptions.map((o: any) => o.cycle).filter(Boolean)));
    } else if (official?.careCycle) {
      cycles = [official.careCycle];
    }

    if (subOpts?.careServiceTypes?.length) {
      types = subOpts.careServiceTypes.map((t: any) => t.accentLabel || t.label || t.value);
    } else if (product.careOptions?.length) {
      types = Array.from(new Set(product.careOptions.map((o: any) => o.type).filter(Boolean)));
    } else if (official?.careType) {
      types = [official.careType];
    }

    setEditingItem({
      ...product,
      careCycles: cycles.length > 0 ? cycles : (product.careCycles || ['1회 / 30개월']),
      careTypes: types.length > 0 ? types : (product.careTypes || ['30개월 라이트(구 스탠다드)']),
    });
    setIsEditModalOpen(true);
  };

  // Single Scrape Fetch in Modal
  const handleSingleScrape = async () => {
    if (!editingItem?.model?.trim()) {
      alert('조회할 모델명을 입력해 주세요.');
      return;
    }

    setIsFetchingSingle(true);
    try {
      const res = await scrapeLgCareProductAction({
        model: editingItem.model.trim(),
        excelCategory: editingItem.category,
        p5Base: editingItem.rentalPrice5Year,
        p5Discount: editingItem.discountPrice5Year,
        p6Base: editingItem.rentalPrice6Year,
        p6Discount: editingItem.discountPrice6Year,
      });

      if (res && res.success) {
        const catMap = mapExcelCategoryToKey(res.category || editingItem.category);
        setEditingItem((prev: any) => ({
          ...prev,
          name: res.name || prev.name,
          brand: res.brand || prev.brand,
          category: catMap.name,
          categoryKey: catMap.key,
          refUrl: res.refUrl || prev.refUrl,
          image: res.image || prev.image,
          images: res.images?.length ? res.images : prev.images,
          color: res.color || prev.color,
          colors: res.colors || prev.colors,
          careCycles: res.careCycles?.length ? res.careCycles : prev.careCycles,
          careTypes: res.careTypes?.length ? res.careTypes : prev.careTypes,
          rentalPrice5Year: res.rentalPrice5Year || prev.rentalPrice5Year,
          discountPrice5Year: res.discountPrice5Year || prev.discountPrice5Year,
          discountRate5Year: res.discountRate5Year || prev.discountRate5Year,
          rentalPrice6Year: res.rentalPrice6Year || prev.rentalPrice6Year,
          discountPrice6Year: res.discountPrice6Year || prev.discountPrice6Year,
          discountRate6Year: res.discountRate6Year || prev.discountRate6Year,
          subscriptionOptions: res.subscriptionOptions || prev.subscriptionOptions,
          specifications: res.specifications || prev.specifications,
          isOfficialVerified: res.isOfficialVerified,
          isVisible: res.isOfficialVerified ?? prev.isVisible,
        }));
        alert(`⚡ LG 공홈에서 [${res.name}] 제품 정보를 성공적으로 가져왔습니다!`);
      } else {
        alert(`LG 공홈에서 모델명 [${editingItem.model}]의 정보를 찾지 못했습니다.\n(사유: ${res?.reason || '404 미등록 모델'})`);
      }
    } catch (err) {
      console.error('Single scrape error:', err);
      alert('LG 공홈 실시간 조회 중 오류가 발생했습니다.');
    } finally {
      setIsFetchingSingle(false);
    }
  };

  // Save Modal
  const handleSaveModal = async () => {
    if (!editingItem.name?.trim()) {
      alert('제품명을 입력해 주세요.');
      return;
    }
    if (!editingItem.model?.trim()) {
      alert('모델명을 입력해 주세요.');
      return;
    }

    try {
      let finalKey = editingItem.categoryKey;
      let finalName = editingItem.category;

      if (!finalKey || finalKey === 'all') {
        const catMap = mapExcelCategoryToKey(editingItem.category || editingItem.model);
        finalKey = catMap.key;
        finalName = catMap.name;
      } else {
        const found = LG_CATEGORIES.find((c) => c.key === finalKey);
        if (found) finalName = found.name;
      }

      const isOfficialVerified = editingItem.isOfficialVerified !== undefined
        ? editingItem.isOfficialVerified
        : (Boolean(editingItem.image) && Boolean(editingItem.refUrl) && editingItem.refUrl.includes('lge.co.kr') && !editingItem.refUrl.includes('/search/'));

      const payload = {
        name: editingItem.name.trim(),
        model: editingItem.model.trim(),
        originalModel: editingItem.originalModel || editingItem.model.trim(),
        brand: editingItem.brand || 'LG전자',
        category: finalName,
        categoryKey: finalKey,
        refUrl: editingItem.refUrl || 'https://www.lge.co.kr/care-solutions',
        image: editingItem.image || '',
        images: editingItem.images || [],
        color: editingItem.color || '',
        colors: editingItem.colors || [],
        careCycles: editingItem.careCycles || ['6개월'],
        careTypes: editingItem.careTypes || ['방문케어'],
        rentalPrice5Year: Number(editingItem.rentalPrice5Year) || 0,
        discountPrice5Year: Number(editingItem.discountPrice5Year) || 0,
        discountRate5Year: Number(editingItem.discountRate5Year) || 0,
        rentalPrice6Year: Number(editingItem.rentalPrice6Year) || 0,
        discountPrice6Year: Number(editingItem.discountPrice6Year) || 0,
        discountRate6Year: Number(editingItem.discountRate6Year) || 0,
        subscriptionOptions: editingItem.subscriptionOptions,
        specifications: editingItem.specifications,
        isOfficialVerified,
        isVisible: editingItem.isVisible ?? isOfficialVerified,
      };

      if (editingItem._id) {
        await updateProduct({ id: editingItem._id, ...payload });
      } else {
        await createProduct(payload);
      }

      setIsEditModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Save product error:', err);
      alert('제품 저장 중 오류가 발생했습니다.');
    }
  };

  const handleCopyProduct = async (product: any) => {
    const { _id, _creationTime, ...data } = product;
    await createProduct({
      ...data,
      name: `${data.name} (복사본)`,
      model: `${data.model}_COPY`,
    });
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`[${name}] 제품을 삭제하시겠습니까?`)) {
      await removeProduct({ id: id as any });
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  // Quick Save Custom Official Link
  const handleSaveCustomLink = async () => {
    if (!linkEditItem) return;
    const rawUrl = customUrlInput.trim();
    if (!rawUrl) {
      alert('URL을 입력해 주세요.');
      return;
    }

    try {
      await updateProduct({
        id: linkEditItem.id,
        refUrl: rawUrl,
        isOfficialVerified: true, // 사용자가 직접 유효한 링크를 연결했으므로 공홈 인증 상태로 전환
        isVisible: true,          // 랜딩에도 노출되도록 활성화
      });
      alert(`⚡ [${linkEditItem.model}]의 공홈 링크가 성공적으로 변경되었습니다.\n(공홈 인증 및 랜딩 노출 활성화 완료)`);
      setLinkEditItem(null);
    } catch (err) {
      console.error('Save custom link error:', err);
      alert('링크 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#191F28] overflow-hidden font-sans">
      {/* Hidden File Input for Excel */}
      <input
        type="file"
        ref={excelFileRef}
        onChange={handleExcelFileUpload}
        accept=".xlsx,.xls"
        className="hidden"
      />

      {/* LEFT: Vertical Category Navigation Sidebar (Collapsible for wider content space) */}
      <aside className={`bg-white border-r border-[#E5E8EB] flex flex-col shrink-0 h-full overflow-hidden transition-all duration-200 ${
        isSidebarCollapsed ? 'w-[68px]' : 'w-[260px]'
      }`}>
        {/* Category Header with Collapse Toggle */}
        <div className="p-3 border-b border-[#E5E8EB] flex items-center justify-between bg-[#F8F9FA]/50">
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-2 min-w-0">
              <Layers className="w-5 h-5 text-[#EA1D2C] shrink-0" />
              <h2 className="text-[14px] font-black text-[#191F28] tracking-tight truncate">
                LG 제품 카테고리
              </h2>
            </div>
          ) : (
            <div className="mx-auto">
              <Layers className="w-5 h-5 text-[#EA1D2C]" />
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-[#E5E8EB] text-[#4E5968] hover:text-[#191F28] transition-colors cursor-pointer shrink-0"
            title={isSidebarCollapsed ? "카테고리 사이드바 펼치기" : "카테고리 사이드바 접기 (화면 넓게 보기)"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Default Landing Category Selector Widget (Expanded mode only) */}
        {!isSidebarCollapsed && (
          <div className="p-3 border-b border-[#E5E8EB] bg-[#FFF5F6]/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-black text-[#EA1D2C] flex items-center gap-1">
                <span>⭐ 랜딩 첫 화면 기본 카테고리</span>
              </span>
            </div>
            <select
              value={defaultLandingCategoryKey}
              onChange={(e) => handleSetDefaultLandingCategory(e.target.value)}
              className="w-full bg-white border border-[#EA1D2C]/40 focus:border-[#EA1D2C] rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-[#191F28] outline-none shadow-2xs cursor-pointer"
            >
              <option value="all">✨ 전체 카테고리 (기본값)</option>
              {categoriesList.filter(c => c.key !== 'all').map(c => (
                <option key={c.key} value={c.key}>
                  {c.name} ({categoryCounts[c.key] || 0}개)
                </option>
              ))}
            </select>
            <p className="text-[10px] text-[#8B95A1] mt-1">
              * 고객이 랜딩 접속 시 처음에 열릴 카테고리입니다.
            </p>
          </div>
        )}

        {/* Category Item List (Draggable Ordering) */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {categoriesList.map((cat, idx) => {
            const isActive = selectedCategoryKey === cat.key;
            const count = categoryCounts[cat.key] || 0;
            const isDraggable = cat.key !== 'all';
            const isDragging = draggedCategoryIndex === idx;
            const isLandingDefault = (cat as any).isDefault || (cat.key === 'all' && defaultLandingCategoryKey === 'all');

            if (isSidebarCollapsed) {
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryKey(cat.key);
                    setSelectedIds([]);
                  }}
                  className={`w-full flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all cursor-pointer relative group/collapsed ${
                    isActive
                      ? 'bg-[#EA1D2C] text-white shadow-sm shadow-[#EA1D2C]/30'
                      : 'text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#191F28]'
                  }`}
                  title={`${cat.name} (${count}개)`}
                >
                  <span className="flex items-center justify-center w-5 h-5">
                    {renderCategoryIcon(cat.icon, cat.name, "w-5 h-5 object-contain rounded")}
                  </span>
                  <span className="text-[9px] font-bold mt-0.5 max-w-[50px] truncate">
                    {cat.name.slice(0, 4)}
                  </span>
                  <span className={`text-[8px] font-extrabold px-1 py-0.2 rounded-full absolute -top-1 -right-1 ${
                    isActive ? 'bg-white text-[#EA1D2C]' : 'bg-[#E5E8EB] text-[#4E5968]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            }

            return (
              <div
                key={cat.key}
                draggable={isDraggable}
                onDragStart={(e) => handleCategoryDragStart(e, idx)}
                onDragOver={handleCategoryDragOver}
                onDrop={(e) => handleCategoryDrop(e, idx)}
                className={`flex items-center rounded-xl transition-all group/cat ${
                  isDragging ? 'opacity-30 bg-gray-200 border-2 border-dashed border-[#EA1D2C]' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryKey(cat.key);
                    setSelectedIds([]);
                  }}
                  className={`flex-1 flex items-center justify-between px-2.5 py-2 rounded-xl text-[12.5px] font-bold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#EA1D2C] text-white shadow-sm shadow-[#EA1D2C]/30'
                      : 'text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#191F28]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
                    {isDraggable && (
                      <span className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 opacity-60 hover:opacity-100 shrink-0">
                        <GripVertical className="w-3 h-3" />
                      </span>
                    )}
                    <span className="shrink-0 flex items-center justify-center w-4 h-4">
                      {renderCategoryIcon(cat.icon, cat.name, "w-4 h-4 object-contain rounded")}
                    </span>
                    <span className="truncate">{cat.name}</span>
                    {isLandingDefault && (
                      <span className={`text-[8px] px-1 py-0.2 rounded font-black shrink-0 ${
                        isActive ? 'bg-white text-[#EA1D2C]' : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        ⭐ 기본
                      </span>
                    )}
                    {(cat as any).badge && (
                      <span className={`text-[8.5px] px-1 py-0.2 rounded font-black shrink-0 ${
                        isActive ? 'bg-white text-[#EA1D2C]' : 'bg-[#FEECEF] text-[#EA1D2C]'
                      }`}>
                        {(cat as any).badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {isDraggable && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleOpenCategoryEdit(cat, e)}
                          className={`p-1 rounded hover:bg-black/10 transition-colors cursor-pointer ${
                            isActive ? 'text-white' : 'text-[#8B95A1] hover:text-[#191F28]'
                          }`}
                          title="카테고리 정보 수정"
                        >
                          <Edit className="w-3 h-3" />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(cat);
                          }}
                          className={`p-1 rounded hover:bg-red-500/20 transition-colors cursor-pointer ${
                            isActive ? 'text-white hover:text-red-200' : 'text-[#8B95A1] hover:text-red-600'
                          }`}
                          title="카테고리 삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </span>
                      </div>
                    )}
                    <span
                      className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        isActive ? 'bg-white/25 text-white' : 'bg-[#E5E8EB] text-[#4E5968]'
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Quick Excel Action inside Sidebar */}
        <div className="p-2.5 border-t border-[#E5E8EB] bg-[#F8F9FA]/80">
          <button
            type="button"
            onClick={() => handleTriggerUpload(selectedCategoryKey)}
            className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 text-[#191F28] border border-[#D1D6DB] py-2 rounded-xl text-[11.5px] font-bold shadow-2xs transition-colors cursor-pointer"
            title="엑셀 등록"
          >
            <Upload className="w-3.5 h-3.5 text-[#EA1D2C] shrink-0" />
            {!isSidebarCollapsed && (
              <span className="truncate">
                {selectedCategoryKey === 'all'
                  ? '전체 엑셀 등록'
                  : `[${categoriesList.find((c) => c.key === selectedCategoryKey)?.name}] 엑셀`}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* RIGHT: Main Content & Product List */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F2F4F6]">
        {/* Top Sticky Action Bar */}
        <header className="bg-white border-b border-[#E5E8EB] p-4 sm:px-6 shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Title & Active Category Breadcrumb */}
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EA1D2C]" />
                <h1 className="text-[20px] font-black text-[#191F28] tracking-tight">
                  LG구독제품관리
                </h1>
                <span className="text-[13px] font-bold text-[#EA1D2C] bg-[#FEECEF] px-2.5 py-0.5 rounded-md">
                  {categoriesList.find((c) => c.key === selectedCategoryKey)?.name} ({filteredProducts.length}개)
                </span>
              </div>
              <p className="text-[12px] text-[#6B7684] mt-0.5">
                카테고리 좌측 ⠿ 아이콘을 드래그하여 순서 변경 가능 • 변경된 순서는 랜딩 페이지에 실시간 연동됩니다.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRunBatchVerification}
                disabled={isBatchVerifying}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-[#F2F4F6] text-[#191F28] border border-[#D1D6DB] px-3 py-2 rounded-xl text-[13px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                title="등록된 모든 제품이 LG 공홈에 여전히 존재하는지 일괄 확인하고 미등록 모델을 자동 숨김 처리합니다."
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#3182F6] ${isBatchVerifying ? 'animate-spin' : ''}`} />
                <span>공홈 실존 일괄 재검증</span>
              </button>

              <button
                type="button"
                onClick={handleHideUnverified}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 px-3 py-2 rounded-xl text-[13px] font-bold transition-colors cursor-pointer"
                title="공홈에서 상세 페이지를 찾을 수 없는 모델들을 한 번에 랜딩에서 숨김(비노출) 처리합니다."
              >
                <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                <span>공홈 미확인 일괄 숨김</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-[#F2F4F6] text-[#4E5968] border border-[#D1D6DB] px-3 py-2 rounded-xl text-[13px] font-bold transition-colors cursor-pointer"
                title="엑셀 업로드용 양식 다운로드"
              >
                <Download className="w-3.5 h-3.5 text-[#6B7684]" />
                <span>양식 다운로드</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerUpload('all')}
                className="inline-flex items-center gap-1.5 bg-[#3182F6] hover:bg-[#2272EB] text-white px-3.5 py-2 rounded-xl text-[13px] font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>전체 엑셀 일괄 등록</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 bg-[#EA1D2C] hover:bg-[#C81020] text-white px-3.5 py-2 rounded-xl text-[13px] font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>개별 제품 등록</span>
              </button>
            </div>
          </div>

          {/* Verification Status Filter Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#F2F4F6] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setVerificationFilter('all')}
                className={`px-3 py-1 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                  verificationFilter === 'all'
                    ? 'bg-white text-[#191F28] shadow-2xs'
                    : 'text-[#6B7684] hover:text-[#191F28]'
                }`}
              >
                전체 ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setVerificationFilter('verified')}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                  verificationFilter === 'verified'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-[#6B7684] hover:text-emerald-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>공홈 인증 모델 ({verificationCounts.verified})</span>
              </button>
              <button
                type="button"
                onClick={() => setVerificationFilter('unverified')}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                  verificationFilter === 'unverified'
                    ? 'bg-white text-amber-700 shadow-2xs'
                    : 'text-[#6B7684] hover:text-amber-700'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>공홈 미확인 모델 ({verificationCounts.unverified})</span>
              </button>
            </div>

            {/* Search Input & Multi-Select Controls */}
            <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8B95A1] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="제품명, 모델명(예: WU923, AS356) 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#E5E8EB] rounded-xl pl-9 pr-8 py-1.5 text-[13px] font-medium text-[#191F28] focus:outline-none focus:border-[#EA1D2C] focus:bg-white transition-all"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B95A1] hover:text-[#191F28]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Mode Toggle (Table / Card) */}
              <div className="flex items-center bg-[#F2F4F6] p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded-lg text-[12px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-[#191F28] shadow-2xs' : 'text-[#6B7684] hover:text-[#191F28]'
                  }`}
                  title="테이블 표 형태로 보기"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">표 보기</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('card')}
                  className={`px-2.5 py-1 rounded-lg text-[12px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'card' ? 'bg-white text-[#191F28] shadow-2xs' : 'text-[#6B7684] hover:text-[#191F28]'
                  }`}
                  title="카드 그리드 형태로 보기 (가로가 좁아도 보기 편함)"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-[#EA1D2C]" />
                  <span className="hidden sm:inline">카드 보기</span>
                </button>
              </div>

              {/* Batch Action Toolbar */}
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 bg-[#FEECEF] border border-[#FFD2D9] px-3 py-1.5 rounded-xl text-[12px] font-bold text-[#EA1D2C] animate-fade-in shrink-0">
                  <span>{selectedIds.length}개 선택</span>
                  <div className="h-3 w-[1px] bg-[#FFB8C2]" />
                  <button
                    type="button"
                    onClick={() => handleBatchToggleVisibility(true)}
                    className="hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> 노출
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchToggleVisibility(false)}
                    className="hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" /> 숨김
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchDelete}
                    className="hover:underline flex items-center gap-1 text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> 삭제
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Product Table List Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E8EB] p-12 text-center space-y-4">
              <div className="w-14 h-14 bg-[#F2F4F6] text-[#8B95A1] rounded-full flex items-center justify-center mx-auto text-2xl">
                📦
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#191F28]">등록된 LG 구독 제품이 없습니다.</h3>
                <p className="text-[13px] text-[#8B95A1] mt-1">
                  우측 상단의 [전체 엑셀 일괄 등록] 버튼을 눌러 엑셀 파일을 업로드하거나 개별 등록해 주세요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTriggerUpload('all')}
                className="inline-flex items-center gap-2 bg-[#EA1D2C] hover:bg-[#C81020] text-white px-4 py-2 rounded-xl text-[13px] font-bold transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>엑셀 파일 업로드하기</span>
              </button>
            </div>
          ) : viewMode === 'card' ? (
            /* CARD GRID VIEW (Optimized for narrow/laptop screens) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5">
              {paginatedProducts.map((p, idx) => {
                const globalIdx = (currentPage - 1) * (pageSize >= 9999 ? 0 : pageSize) + idx;
                const isChecked = selectedIds.includes(p._id);
                const isDragging = draggedIndex === globalIdx;
                const capInfo = getProductCapacityInfo(p.model, p.name, p.categoryKey, p.category, p.specifications);
                const isVer = p.isOfficialVerified !== undefined 
                  ? p.isOfficialVerified 
                  : (Boolean(p.image) && Boolean(p.refUrl) && p.refUrl.includes('lge.co.kr') && !p.refUrl.includes('/search/'));

                return (
                  <div
                    key={p._id}
                    draggable
                    onDragStart={() => handleDragStart(globalIdx)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(globalIdx)}
                    className={`bg-white rounded-2xl border transition-all p-3.5 flex flex-col justify-between space-y-3 group hover:shadow-md ${
                      isDragging ? 'opacity-30 bg-gray-100 border-dashed border-[#EA1D2C]' : 'border-[#E5E8EB]'
                    } ${isChecked ? 'ring-2 ring-[#EA1D2C] bg-[#FFF5F6]/40' : ''}`}
                  >
                    {/* Card Header: Drag / Order / Checkbox / Category / Status / Actions */}
                    <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-[#F2F4F6]">
                      <div className="flex items-center gap-1.5">
                        <span className="cursor-grab active:cursor-grabbing text-[#B0B8C1] hover:text-[#191F28]">
                          <MoveVertical className="w-3.5 h-3.5" />
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(p._id)}
                          className="text-[#8B95A1] hover:text-[#191F28] cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#EA1D2C]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <span className="text-[11px] font-mono font-bold text-[#8B95A1] bg-[#F2F4F6] px-1.5 py-0.2 rounded">
                          #{globalIdx + 1}
                        </span>
                        <span className="text-[11px] font-bold text-[#4E5968] bg-[#F2F4F6] px-1.5 py-0.2 rounded">
                          {p.category}
                        </span>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-1">
                        {/* Visibility Toggle */}
                        <button
                          type="button"
                          onClick={() => updateProduct({ id: p._id, isVisible: !p.isVisible })}
                          className={`p-1 rounded-lg transition-colors cursor-pointer ${
                            p.isVisible
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                          title={p.isVisible ? '현재 노출 중 (클릭 시 숨김)' : '현재 숨김 (클릭 시 노출)'}
                        >
                          {p.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1 hover:bg-[#F2F4F6] text-[#4E5968] rounded-lg transition-colors cursor-pointer"
                          title="수정"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyProduct(p)}
                          className="p-1 hover:bg-[#F2F4F6] text-[#4E5968] rounded-lg transition-colors cursor-pointer"
                          title="복사"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p._id, p.name)}
                          className="p-1 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Card Body: Image + Title + Model + Capacity */}
                    <div className="flex gap-3 items-start">
                      <div className="w-16 h-16 rounded-xl bg-[#F8F9FA] border border-[#E5E8EB] overflow-hidden flex items-center justify-center shrink-0 p-1">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-[10px] text-[#8B95A1]">No Img</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-[13px] font-black text-[#191F28] line-clamp-2 leading-snug">
                          {p.name}
                        </p>
                        
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-[#E5E8EB] text-[#333D4B] px-1.5 py-0.2 rounded font-mono text-[11px] font-bold">
                            {p.model}
                          </span>
                          {capInfo && (
                            <span className="inline-flex items-center bg-[#E8F3FF] border border-[#BBDDFF] text-[#1B64DA] text-[10px] font-black px-1.5 py-0.2 rounded shrink-0">
                              {capInfo.label}
                            </span>
                          )}
                          {isVer ? (
                            <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-1 py-0.2 rounded">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> 공홈인증
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[10px] font-extrabold px-1 py-0.2 rounded">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-500" /> 미확인
                            </span>
                          )}
                        </div>

                        {/* Official Link & Edit */}
                        <div className="flex items-center gap-2 pt-0.5 text-[11px]">
                          {(() => {
                            const rels = p.relatedUrls || [];
                            const initialUrl = rels.length === 1 && rels[0].url ? rels[0].url : p.refUrl;
                            const imgMatch = (p.image || '').match(/md(\d{6,10})/i);
                            const modelIdHint = imgMatch ? `MD${imgMatch[1]}` : (p as any)?.modelId;
                            const targetUrl = formatSubscriptionRefUrl(initialUrl, p.model, p.categoryKey || p.category, modelIdHint);

                            if (rels.length > 1) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => setChoiceModalProduct(p)}
                                  className="inline-flex items-center gap-0.5 text-[#3182F6] hover:text-[#1B64DA] font-bold hover:underline cursor-pointer"
                                >
                                  <span>공홈보기</span>
                                  <span className="bg-[#E8F3FF] text-[#1B64DA] text-[9.5px] px-1 py-0.2 rounded font-black">
                                    {rels.length}개
                                  </span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </button>
                              );
                            }

                            return (
                              <a
                                href={targetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-[#3182F6] hover:text-[#1B64DA] font-bold hover:underline cursor-pointer"
                                title="LG 공홈에서 구독 제품 및 요금 확인"
                              >
                                <span>공홈보기</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </a>
                            );
                          })()}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLinkEditItem({
                                id: p._id,
                                model: p.model,
                                name: p.name,
                                refUrl: p.refUrl || '',
                              });
                              setCustomUrlInput(p.refUrl || '');
                            }}
                            className="text-[#6B7684] hover:text-[#3182F6] underline cursor-pointer"
                          >
                            링크수정
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Color & Care Options Meta */}
                    <div className="flex items-center justify-between gap-2 text-[11px] bg-[#F8F9FA] p-2 rounded-xl border border-[#E5E8EB]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: getLgColorHex(p.color || '') }}
                        />
                        <span className="font-bold text-[#191F28] truncate">{p.color || '기본'}</span>
                      </div>
                      <div className="text-[#6B7684] font-medium truncate">
                        {p.careOptions?.[0]?.cycle || '12개월'} • {p.careOptions?.[0]?.type || '방문케어'}
                      </div>
                    </div>

                    {/* Card Footer: 5 Year / 6 Year Pricing Matrix */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#F2F4F6]">
                      {/* 5 Year */}
                      <div className="bg-red-50/40 p-2 rounded-xl border border-red-100">
                        <div className="flex items-center justify-between text-[10px] text-[#8B95A1] mb-0.5">
                          <span>5년 약정</span>
                          <span className="text-[#EA1D2C] font-black">{p.careOptions?.[0]?.p5DiscountRate || p.discountRate5Year || 10}%↓</span>
                        </div>
                        <div className="text-[13px] font-black text-[#191F28]">
                          {(p.careOptions?.[0]?.p5Discount || p.discountPrice5Year || 0).toLocaleString()}
                          <span className="text-[10px] font-normal text-[#6B7684]">원/월</span>
                        </div>
                      </div>

                      {/* 6 Year */}
                      <div className="bg-red-50/70 p-2 rounded-xl border border-red-200">
                        <div className="flex items-center justify-between text-[10px] text-[#8B95A1] mb-0.5">
                          <span>6년 약정</span>
                          <span className="text-[#EA1D2C] font-black">{p.careOptions?.[0]?.p6DiscountRate || p.discountRate6Year || 10}%↓</span>
                        </div>
                        <div className="text-[13px] font-black text-[#EA1D2C]">
                          {(p.careOptions?.[0]?.p6Discount || p.discountPrice6Year || 0).toLocaleString()}
                          <span className="text-[10px] font-normal text-[#6B7684]">원/월</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW (Full details with horizontal scroll) */
            <div className="bg-white rounded-2xl border border-[#E5E8EB] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px] min-w-[1000px]">
                  <thead>
                    <tr className="bg-[#F8F9FA] border-b border-[#E5E8EB] text-[#4E5968] font-bold whitespace-nowrap">
                      <th className="py-2.5 px-2.5 w-10 text-center">
                        <span className="text-[11px] text-[#8B95A1]">순서</span>
                      </th>
                      <th className="py-2.5 px-2.5 w-10 text-center">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className="text-[#8B95A1] hover:text-[#191F28] cursor-pointer"
                        >
                          {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-[#EA1D2C]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-2.5 px-2.5 w-14 text-center">이미지</th>
                      <th className="py-2.5 px-2.5 w-20">카테고리</th>
                      <th className="py-2.5 px-2.5 min-w-[200px]">제품명 / 모델명 / 공홈 링크</th>
                      <th className="py-2.5 px-2.5 min-w-[120px]">색상</th>
                      <th className="py-2.5 px-2.5 w-28">케어서비스</th>
                      <th className="py-2.5 px-2.5 min-w-[120px] bg-red-50/40">5년 구독료 (할인율)</th>
                      <th className="py-2.5 px-2.5 min-w-[120px] bg-red-50/60">6년 구독료 (할인율)</th>
                      <th className="py-2.5 px-2.5 w-14 text-center">노출</th>
                      <th className="py-2.5 px-2.5 w-24 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E8EB]">
                    {paginatedProducts.map((p, idx) => {
                      const globalIdx = (currentPage - 1) * (pageSize >= 9999 ? 0 : pageSize) + idx;
                      const isChecked = selectedIds.includes(p._id);
                      const isDragging = draggedIndex === globalIdx;

                      return (
                        <tr
                          key={p._id}
                          draggable
                          onDragStart={() => handleDragStart(globalIdx)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(globalIdx)}
                          className={`hover:bg-[#F8F9FA] transition-colors group ${
                            isDragging ? 'opacity-30 bg-gray-100' : ''
                          } ${isChecked ? 'bg-[#FEECEF]/30' : ''}`}
                        >
                          {/* Drag Handle */}
                          <td className="py-2.5 px-2 text-center text-[#8B95A1] cursor-grab active:cursor-grabbing">
                            <div className="flex items-center justify-center gap-1">
                              <MoveVertical className="w-3.5 h-3.5 text-[#B0B8C1] group-hover:text-[#191F28]" />
                              <span className="text-[11px] font-mono">{globalIdx + 1}</span>
                            </div>
                          </td>

                          {/* Checkbox */}
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => toggleSelectOne(p._id)}
                              className="text-[#8B95A1] hover:text-[#191F28] cursor-pointer"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-[#EA1D2C]" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* Thumbnail */}
                          <td className="py-2 px-2.5 text-center">
                            <div className="w-11 h-11 rounded-lg bg-[#F2F4F6] border border-[#E5E8EB] overflow-hidden flex items-center justify-center mx-auto">
                              {p.image ? (
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-full h-full object-contain p-0.5"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span className="text-[10px] text-[#8B95A1]">No Img</span>
                              )}
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-2.5 px-2.5 font-bold text-[#4E5968] whitespace-nowrap">
                            <span className="inline-block bg-[#F2F4F6] text-[#4E5968] px-2 py-0.5 rounded text-[11.5px]">
                              {p.category}
                            </span>
                          </td>

                          {/* Product Name / Model / LG Official Link */}
                          <td className="py-2.5 px-2.5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-extrabold text-[#191F28] line-clamp-1 leading-snug">
                                  {p.name}
                                </p>
                                {(() => {
                                  const capInfo = getProductCapacityInfo(p.model, p.name, p.categoryKey, p.category, p.specifications);
                                  return capInfo ? (
                                    <span className="inline-flex items-center bg-[#E8F3FF] border border-[#BBDDFF] text-[#1B64DA] text-[10.5px] font-black px-1.5 py-0.2 rounded shrink-0">
                                      {capInfo.label}
                                    </span>
                                  ) : null;
                                })()}
                                {(() => {
                                  const isVer = p.isOfficialVerified !== undefined 
                                    ? p.isOfficialVerified 
                                    : (Boolean(p.image) && Boolean(p.refUrl) && p.refUrl.includes('lge.co.kr') && !p.refUrl.includes('/search/'));
                                  return isVer ? (
                                    <span className="inline-flex items-center gap-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold px-1.5 py-0.2 rounded shrink-0">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 공홈 인증
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-extrabold px-1.5 py-0.2 rounded shrink-0" title="LG 공홈에서 제품 페이지를 찾을 수 없음 (단종 또는 미등록)">
                                      <AlertTriangle className="w-3 h-3 text-amber-500" /> 공홈 미확인
                                    </span>
                                  );
                                })()}
                              </div>
                              <div className="flex items-center gap-2 text-[11.5px] font-mono text-[#6B7684] flex-wrap">
                                <span className="bg-[#E5E8EB] text-[#333D4B] px-1.5 py-0.2 rounded font-bold">
                                  {p.model}
                                </span>
                                {(() => {
                                  const rels = p.relatedUrls || [];
                                  const initialUrl = rels.length === 1 && rels[0].url ? rels[0].url : p.refUrl;
                                  const imgMatch = (p.image || '').match(/md(\d{6,10})/i);
                                  const modelIdHint = imgMatch ? `MD${imgMatch[1]}` : (p as any)?.modelId;
                                  const targetUrl = formatSubscriptionRefUrl(initialUrl, p.model, p.categoryKey || p.category, modelIdHint);

                                  if (rels.length > 1) {
                                    return (
                                      <button
                                        type="button"
                                        onClick={() => setChoiceModalProduct(p)}
                                        className="inline-flex items-center gap-0.5 text-[#3182F6] hover:text-[#1B64DA] font-bold hover:underline cursor-pointer"
                                      >
                                        <span>공홈 바로가기</span>
                                        <span className="bg-[#E8F3FF] text-[#1B64DA] text-[9.5px] px-1 py-0.2 rounded font-black">
                                          {rels.length}개 옵션
                                        </span>
                                        <ArrowUpRight className="w-3 h-3" />
                                      </button>
                                    );
                                  }

                                  return (
                                    <a
                                      href={targetUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-0.5 text-[#3182F6] hover:text-[#1B64DA] font-bold hover:underline cursor-pointer"
                                      title="LG 공홈에서 구독 제품 및 요금 확인"
                                    >
                                      <span>공홈 바로가기</span>
                                      <ArrowUpRight className="w-3 h-3" />
                                    </a>
                                  );
                                })()}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLinkEditItem({
                                      id: p._id,
                                      model: p.model,
                                      name: p.name,
                                      refUrl: p.refUrl || '',
                                    });
                                    setCustomUrlInput(p.refUrl || '');
                                  }}
                                  className="inline-flex items-center gap-1 text-[10.5px] text-[#4E5968] hover:text-[#3182F6] bg-[#F2F4F6] hover:bg-[#E8F3FF] px-1.5 py-0.2 rounded font-bold cursor-pointer transition-colors border border-[#D1D6DB]"
                                  title="공홈 링크 직접 수정하기 (원하는 URL로 변경)"
                                >
                                  <Edit className="w-2.5 h-2.5 text-[#6B7684]" />
                                  <span>링크 수정</span>
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Colors */}
                          <td className="py-2.5 px-2.5">
                            <div className="space-y-1">
                              {/* Exact Model Color Highlight */}
                              <div className="inline-flex items-center gap-1.5 bg-white border-2 border-red-500 shadow-2xs px-2 py-0.5 rounded-md">
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0 shadow-inner"
                                  style={{ backgroundColor: getLgColorHex(p.color || '') }}
                                />
                                <span className="text-[11.5px] font-black text-[#191F28]">
                                  {p.color || '기본'}
                                </span>
                              </div>

                              {/* Other Colors Lineup */}
                              {p.colors && p.colors.length > 1 && (
                                <div className="flex flex-wrap gap-1 items-center max-w-[160px]">
                                  {p.colors.map((c, i) => (
                                    <span
                                      key={i}
                                      className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-medium ${
                                        c.name === p.color
                                          ? 'bg-red-50 text-[#EA1D2C] border border-red-200 font-bold'
                                          : 'bg-[#F2F4F6] text-[#6B7684] border border-[#E5E8EB]'
                                      }`}
                                    >
                                      <span
                                        className="w-2 h-2 rounded-full border border-black/10 shrink-0"
                                        style={{ backgroundColor: c.code || getLgColorHex(c.name) }}
                                      />
                                      <span className="truncate max-w-[50px]">{c.name}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Care Service & Cycles */}
                          <td className="py-2.5 px-2.5 text-[11.5px]">
                            {p.careOptions && p.careOptions.length > 0 ? (
                              <div className="space-y-1">
                                {p.careOptions.map((opt, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between gap-1 bg-[#F8F9FA] border border-[#E5E8EB] px-1.5 py-0.5 rounded text-[10.5px]"
                                  >
                                    <span className="font-extrabold text-[#191F28]">{opt.cycle}</span>
                                    <span className="text-[9.5px] text-[#6B7684]">{opt.type}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <p className="font-bold text-[#191F28]">
                                  {p.careCycles?.join(', ') || '12개월'}
                                </p>
                                <p className="text-[10.5px] text-[#6B7684] truncate max-w-[110px]">
                                  {p.careTypes?.join(', ') || '전문가 방문'}
                                </p>
                              </div>
                            )}
                          </td>

                          {/* 5 Year Price & Discount Rate */}
                          <td className="py-2.5 px-2.5 bg-red-50/20">
                            {p.careOptions && p.careOptions.length > 0 ? (
                              <div className="space-y-1">
                                {p.careOptions.map((opt, i) => (
                                  <div key={i} className="text-[11.5px] leading-tight">
                                    <div className="flex items-center justify-between text-[9.5px] text-[#8B95A1]">
                                      <span>{opt.cycle}</span>
                                      <span className="line-through">{opt.p5Base?.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="font-black text-[#191F28]">
                                        {opt.p5Discount?.toLocaleString()}원
                                      </span>
                                      <span className="text-[8.5px] font-black text-[#EA1D2C] bg-[#FEECEF] px-1 rounded">
                                        {opt.p5DiscountRate}%↓
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10.5px] line-through text-[#8B95A1]">
                                    {p.rentalPrice5Year?.toLocaleString()}원
                                  </span>
                                  <span className="text-[9.5px] font-black text-[#EA1D2C] bg-[#FEECEF] px-1 rounded">
                                    {p.discountRate5Year || 10}%
                                  </span>
                                </div>
                                <p className="text-[13px] font-black text-[#191F28]">
                                  {p.discountPrice5Year?.toLocaleString()}
                                  <span className="text-[10.5px] font-normal text-[#6B7684]">원/월</span>
                                </p>
                              </div>
                            )}
                          </td>

                          {/* 6 Year Price & Discount Rate */}
                          <td className="py-2.5 px-2.5 bg-red-50/40">
                            {p.careOptions && p.careOptions.length > 0 ? (
                              <div className="space-y-1">
                                {p.careOptions.map((opt, i) => (
                                  <div key={i} className="text-[11.5px] leading-tight">
                                    <div className="flex items-center justify-between text-[9.5px] text-[#8B95A1]">
                                      <span>{opt.cycle}</span>
                                      <span className="line-through">{opt.p6Base?.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="font-black text-[#EA1D2C]">
                                        {opt.p6Discount?.toLocaleString()}원
                                      </span>
                                      <span className="text-[8.5px] font-black text-[#EA1D2C] bg-[#FEECEF] px-1 rounded">
                                        {opt.p6DiscountRate}%↓
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10.5px] line-through text-[#8B95A1]">
                                    {p.rentalPrice6Year?.toLocaleString()}원
                                  </span>
                                  <span className="text-[9.5px] font-black text-[#EA1D2C] bg-[#FEECEF] px-1 rounded">
                                    {p.discountRate6Year || 10}%
                                  </span>
                                </div>
                                <p className="text-[13px] font-black text-[#EA1D2C]">
                                  {p.discountPrice6Year?.toLocaleString()}
                                  <span className="text-[10.5px] font-normal text-[#6B7684]">원/월</span>
                                </p>
                              </div>
                            )}
                          </td>

                          {/* Visibility Toggle */}
                          <td className="py-2.5 px-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => updateProduct({ id: p._id, isVisible: !p.isVisible })}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                p.isVisible
                                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                              title={p.isVisible ? '현재 노출 중 (클릭 시 숨김)' : '현재 숨김 (클릭 시 노출)'}
                            >
                              {p.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-2.5 px-2.5 text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(p)}
                                className="p-1 hover:bg-[#F2F4F6] text-[#4E5968] rounded-lg transition-colors cursor-pointer"
                                title="수정"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyProduct(p)}
                                className="p-1 hover:bg-[#F2F4F6] text-[#4E5968] rounded-lg transition-colors cursor-pointer"
                                title="복사"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p._id, p.name)}
                                className="p-1 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                                title="삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Controls Bar */}
          {filteredProducts.length > 0 && (
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E5E8EB] shadow-2xs">
              {/* Page info & Page size selector */}
              <div className="flex items-center gap-3 text-[12.5px] text-[#4E5968]">
                <span className="font-bold">
                  총 <strong className="text-[#191F28]">{filteredProducts.length}</strong>개 제품 중{' '}
                  <strong className="text-[#EA1D2C]">
                    {Math.min((currentPage - 1) * (pageSize >= 9999 ? filteredProducts.length : pageSize) + 1, filteredProducts.length)}~{Math.min(currentPage * (pageSize >= 9999 ? filteredProducts.length : pageSize), filteredProducts.length)}
                  </strong>
                  개 표시
                </span>
                <div className="flex items-center gap-1.5 border-l border-[#E5E8EB] pl-3">
                  <span className="text-[12px] text-[#8B95A1]">페이지당:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-[#F8F9FA] border border-[#D1D6DB] rounded-lg px-2 py-1 text-[12px] font-bold text-[#191F28] focus:outline-none focus:border-[#EA1D2C] cursor-pointer"
                  >
                    <option value={20}>20개씩</option>
                    <option value={30}>30개씩 (추천)</option>
                    <option value={50}>50개씩</option>
                    <option value={100}>100개씩</option>
                    <option value={9999}>전체 보기</option>
                  </select>
                </div>
              </div>

              {/* Page Navigation Buttons */}
              {totalPages > 1 && pageSize < 9999 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-[#E5E8EB] text-[12px] font-bold text-[#4E5968] hover:bg-[#F2F4F6] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="첫 페이지"
                  >
                    «
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-[#E5E8EB] text-[12px] font-bold text-[#4E5968] hover:bg-[#F2F4F6] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    ‹ 이전
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        const showEllipsis = prev && p - prev > 1;

                        return (
                          <React.Fragment key={p}>
                            {showEllipsis && <span className="px-1 text-gray-400 text-[11px]">...</span>}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(p)}
                              className={`w-8 h-8 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                                currentPage === p
                                  ? 'bg-[#EA1D2C] text-white shadow-xs font-black'
                                  : 'text-[#4E5968] hover:bg-[#F2F4F6] border border-transparent'
                              }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-[#E5E8EB] text-[12px] font-bold text-[#4E5968] hover:bg-[#F2F4F6] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    다음 ›
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 rounded-lg border border-[#E5E8EB] text-[12px] font-bold text-[#4E5968] hover:bg-[#F2F4F6] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="마지막 페이지"
                  >
                    »
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* MODAL 1: Uploading & Crawling Progress Modal */}
      {uploadProgress && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 text-center space-y-5 animate-scale-up">
            <div className="w-16 h-16 bg-[#FEECEF] text-[#EA1D2C] rounded-full flex items-center justify-center mx-auto animate-spin">
              <RefreshCw className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-[18px] font-black text-[#191F28]">
                LG 공홈 실시간 정보 수집 중
              </h3>
              <p className="text-[13px] text-[#6B7684]">
                엑셀 모델명을 기준으로 LG 공홈에서 검증된 제품 정보(제품명, 이미지, 색상, 케어주기)를 실시간으로 가져오고 있습니다.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-[#F2F4F6] h-3 rounded-full overflow-hidden">
                <div
                  className="bg-[#EA1D2C] h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[12px] font-extrabold text-[#4E5968]">
                <span>{uploadProgress.currentModel}</span>
                <span>
                  {uploadProgress.current} / {uploadProgress.total} (
                  {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%)
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#8B95A1]">
              ※ 공홈에 등록되지 않은 모델은 자동으로 건너뛰며 완료 후 리포트가 제공됩니다.
            </p>
          </div>
        </div>
      )}

      {/* MODAL 1-2: Batch Official Verification Progress Modal */}
      {isBatchVerifying && verifyProgress && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 text-center space-y-5 animate-scale-up">
            <div className="w-16 h-16 bg-[#E8F3FF] text-[#3182F6] rounded-full flex items-center justify-center mx-auto animate-spin">
              <RefreshCw className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-[18px] font-black text-[#191F28]">
                LG 공홈 실존 여부 일괄 검증 중
              </h3>
              <p className="text-[13px] text-[#6B7684]">
                등록된 모든 제품이 LG 공식 홈페이지에 정상 등록되어 있는지 확인하고 있습니다. (미등록/단종 모델은 자동 비노출 처리)
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-[#F2F4F6] h-3 rounded-full overflow-hidden">
                <div
                  className="bg-[#3182F6] h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.round((verifyProgress.current / verifyProgress.total) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[12px] font-extrabold text-[#4E5968]">
                <span>실시간 검증 진행 중...</span>
                <span>
                  {verifyProgress.current} / {verifyProgress.total} (
                  {Math.round((verifyProgress.current / verifyProgress.total) * 100)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1-3: Quick Custom Link Edit Modal */}
      {linkEditItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-gray-100 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-[#E5E8EB] pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#3182F6]" />
                <h3 className="text-[17px] font-black text-[#191F28]">
                  공홈 바로가기 링크 직접 수정
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLinkEditItem(null)}
                className="p-1 hover:bg-[#F2F4F6] rounded-full text-[#8B95A1]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Product Info */}
            <div className="bg-[#F8F9FA] p-3.5 rounded-2xl border border-[#E5E8EB] space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-[#191F28] text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded">
                  {linkEditItem.model}
                </span>
                <span className="text-[13px] font-extrabold text-[#191F28] truncate">
                  {linkEditItem.name}
                </span>
              </div>
              <p className="text-[11.5px] text-[#6B7684]">
                연결되지 않는 공식 페이지 대신 연결하고 싶은 LG 공홈 URL(또는 검색/상품 페이지)을 직접 입력하세요.
              </p>
            </div>

            {/* URL Input */}
            <div className="space-y-1.5">
              <label className="block text-[12px] font-bold text-[#4E5968]">
                연결할 공홈 URL (바로가기 링크)
              </label>
              <input
                type="text"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="예: https://www.lge.co.kr/care-solutions/tvs/65qned81bms"
                className="w-full bg-[#F8F9FA] border border-[#D1D6DB] rounded-xl px-3.5 py-2.5 text-[13px] font-mono focus:outline-none focus:border-[#3182F6] focus:bg-white transition-colors"
                autoFocus
              />
              <div className="flex justify-between items-center text-[11px] text-[#8B95A1] pt-1">
                <span>※ 저장 시 자동으로 [공홈 인증] 및 [랜딩 노출 활성화]가 적용됩니다.</span>
                {customUrlInput && (
                  <a
                    href={customUrlInput}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#3182F6] hover:underline font-bold flex items-center gap-0.5 shrink-0"
                  >
                    <span>새창 테스트</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setLinkEditItem(null)}
                className="flex-1 bg-[#F2F4F6] hover:bg-[#E5E8EB] text-[#4E5968] font-bold py-3 rounded-xl text-[13px] transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveCustomLink}
                className="flex-1 bg-[#3182F6] hover:bg-[#1B64DA] text-white font-bold py-3 rounded-xl text-[13px] shadow-sm transition-colors cursor-pointer"
              >
                링크 저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Upload Result Summary Modal */}
      {uploadResultModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-gray-100 space-y-6 animate-scale-up max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E5E8EB] pb-4">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <h3 className="text-[18px] font-black text-[#191F28]">
                  LG 구독 제품 엑셀 등록 완료
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setUploadResultModal(null)}
                className="p-1 hover:bg-[#F2F4F6] rounded-full text-[#8B95A1]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Counts Summary */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#F8F9FA] p-3 rounded-2xl border border-[#E5E8EB]">
                <p className="text-[11px] font-bold text-[#6B7684]">총 검사 모델</p>
                <p className="text-[18px] font-black text-[#191F28]">{uploadResultModal.totalRows}건</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                <p className="text-[11px] font-bold text-emerald-600">공홈 인증 (랜딩 노출)</p>
                <p className="text-[18px] font-black text-emerald-700">{uploadResultModal.successCount}건</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
                <p className="text-[11px] font-bold text-amber-700">공홈 미확인 (자동 비노출)</p>
                <p className="text-[18px] font-black text-amber-800">{uploadResultModal.failCount}건</p>
              </div>
            </div>

            {/* Skipped Models List (if any) */}
            {uploadResultModal.failedList.length > 0 ? (
              <div className="flex-1 overflow-hidden flex flex-col space-y-2">
                <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#4E5968]">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>공홈 미확인으로 랜딩에 비노출된 모델 목록 ({uploadResultModal.failedList.length}건)</span>
                </div>
                <div className="flex-1 overflow-y-auto bg-[#F8F9FA] rounded-2xl p-3 border border-[#E5E8EB] space-y-2 text-[12px]">
                  {uploadResultModal.failedList.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-2.5 rounded-xl border border-[#E5E8EB] flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-[#191F28]">{item.model}</span>
                        {item.category && (
                          <span className="text-[11px] text-[#6B7684] ml-2">[{item.category}]</span>
                        )}
                      </div>
                      <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">{item.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl text-[13px] font-bold text-center">
                🎉 엑셀의 모든 모델이 LG 공홈에서 완벽하게 확인되어 랜딩에 정상 노출됩니다!
              </div>
            )}

            <button
              type="button"
              onClick={() => setUploadResultModal(null)}
              className="w-full bg-[#191F28] hover:bg-black text-white font-bold py-3 rounded-2xl text-[14px] transition-colors cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: Single Product Create / Edit Modal */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-gray-100 space-y-5 animate-scale-up max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E5E8EB] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#EA1D2C]" />
                <h3 className="text-[18px] font-black text-[#191F28]">
                  {editingItem._id ? 'LG 구독 제품 수정' : 'LG 구독 제품 개별 등록'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingItem(null);
                }}
                className="p-1 hover:bg-[#F2F4F6] rounded-full text-[#8B95A1]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Model Search & Live Fetch Area */}
              <div className="bg-[#F8F9FA] p-3.5 rounded-2xl border border-[#E5E8EB] space-y-2">
                <label className="block text-[12px] font-black text-[#191F28]">
                  모델명 (LG 공홈 실시간 조회) <span className="text-[#EA1D2C]">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="예: WU923ACB, AS356NSMAM, H876GBB111"
                    value={editingItem.model}
                    onChange={(e) => setEditingItem({ ...editingItem, model: e.target.value })}
                    className="flex-1 bg-white border border-[#D1D6DB] rounded-xl px-3 py-2 text-[13px] font-mono font-bold focus:outline-none focus:border-[#EA1D2C]"
                  />
                  <button
                    type="button"
                    onClick={handleSingleScrape}
                    disabled={isFetchingSingle}
                    className="bg-[#EA1D2C] hover:bg-[#C81020] disabled:bg-gray-400 text-white px-4 py-2 rounded-xl text-[12px] font-bold shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetchingSingle ? 'animate-spin' : ''}`} />
                    <span>{isFetchingSingle ? '공홈 조회중...' : '공홈 정보 가져오기'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#6B7684]">
                  모델명을 입력하고 버튼을 누르면 제품명, 이미지, 색상 옵션, 스펙, 공홈 URL이 자동으로 채워집니다.
                </p>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-[12px] font-bold text-[#4E5968] mb-1">
                  공식 제품명 <span className="text-[#EA1D2C]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="예: LG 디오스 AI 오브제컬렉션 냉장고 (매직스페이스)"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full bg-[#F8F9FA] border border-[#D1D6DB] rounded-xl px-3 py-2 text-[13px] font-medium focus:outline-none focus:border-[#EA1D2C] focus:bg-white"
                />
              </div>

              {/* Category & Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#4E5968] mb-1">카테고리</label>
                  <select
                    value={editingItem.categoryKey}
                    onChange={(e) => {
                      const found = LG_CATEGORIES.find((c) => c.key === e.target.value);
                      setEditingItem({
                        ...editingItem,
                        categoryKey: e.target.value,
                        category: found?.name || '가전',
                      });
                    }}
                    className="w-full bg-[#F8F9FA] border border-[#D1D6DB] rounded-xl px-3 py-2 text-[13px] font-medium focus:outline-none focus:border-[#EA1D2C]"
                  >
                    {LG_CATEGORIES.filter((c) => c.key !== 'all').map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#4E5968] mb-1">브랜드</label>
                  <input
                    type="text"
                    value={editingItem.brand}
                    onChange={(e) => setEditingItem({ ...editingItem, brand: e.target.value })}
                    className="w-full bg-[#F8F9FA] border border-[#D1D6DB] rounded-xl px-3 py-2 text-[13px] font-medium focus:outline-none focus:border-[#EA1D2C]"
                  />
                </div>
              </div>

              {/* Image URL & Official Page URL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#4E5968] mb-1">대표 이미지 URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editingItem.image}
                    onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                    className="w-full bg-[#F8F9FA] border border-[#D1D6DB] rounded-xl px-3 py-2 text-[12px] font-mono focus:outline-none focus:border-[#EA1D2C]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#4E5968] mb-1">LG 공홈 URL (바로가기)</label>
                  <input
                    type="text"
                    placeholder="https://www.lge.co.kr/..."
                    value={editingItem.refUrl}
                    onChange={(e) => setEditingItem({ ...editingItem, refUrl: e.target.value })}
                    className="w-full bg-[#F8F9FA] border border-[#D1D6DB] rounded-xl px-3 py-2 text-[12px] font-mono focus:outline-none focus:border-[#EA1D2C]"
                  />
                </div>
              </div>

              {/* Pricing Section (5 Years & 6 Years) */}
              <div className="bg-red-50/40 p-4 rounded-2xl border border-red-100 space-y-3">
                <h4 className="text-[13px] font-black text-[#191F28] flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-[#EA1D2C]" />
                  <span>5년 / 6년 구독료 및 할인율 설정</span>
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* 5-Year Pricing */}
                  <div className="bg-white p-3 rounded-xl border border-[#E5E8EB] space-y-2">
                    <p className="text-[12px] font-black text-[#191F28]">5년 약정 구독료</p>
                    <div className="space-y-1.5 text-[12px]">
                      <div>
                        <span className="text-[#6B7684]">공홈 기본 월요금:</span>
                        <input
                          type="number"
                          value={editingItem.rentalPrice5Year}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const discount = editingItem.discountPrice5Year || Math.round(val * 0.9);
                            const rate = val > 0 ? Math.round(((val - discount) / val) * 100) : 10;
                            setEditingItem({
                              ...editingItem,
                              rentalPrice5Year: val,
                              discountPrice5Year: discount,
                              discountRate5Year: rate,
                            });
                          }}
                          className="w-full bg-[#F8F9FA] border border-[#D1D6DB] rounded-lg px-2 py-1 text-[13px] font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[#6B7684]">효원 결합 할인가:</span>
                        <input
                          type="number"
                          value={editingItem.discountPrice5Year}
                          onChange={(e) => {
                            const discount = Number(e.target.value);
                            const base = editingItem.rentalPrice5Year || discount;
                            const rate = base > 0 ? Math.round(((base - discount) / base) * 100) : 0;
                            setEditingItem({
                              ...editingItem,
                              discountPrice5Year: discount,
                              discountRate5Year: rate,
                            });
                          }}
                          className="w-full bg-[#F8F9FA] border border-[#D1D6DB] rounded-lg px-2 py-1 text-[13px] font-black text-[#EA1D2C]"
                        />
                      </div>
                      <div className="text-right text-[11px] font-bold text-[#EA1D2C]">
                        할인율: {editingItem.discountRate5Year || 0}% 할인
                      </div>
                    </div>
                  </div>

                  {/* 6-Year Pricing */}
                  <div className="bg-white p-3 rounded-xl border border-[#E5E8EB] space-y-2">
                    <p className="text-[12px] font-black text-[#191F28]">6년 약정 구독료</p>
                    <div className="space-y-1.5 text-[12px]">
                      <div>
                        <span className="text-[#6B7684]">공홈 기본 월요금:</span>
                        <input
                          type="number"
                          value={editingItem.rentalPrice6Year}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const discount = editingItem.discountPrice6Year || Math.round(val * 0.9);
                            const rate = val > 0 ? Math.round(((val - discount) / val) * 100) : 10;
                            setEditingItem({
                              ...editingItem,
                              rentalPrice6Year: val,
                              discountPrice6Year: discount,
                              discountRate6Year: rate,
                            });
                          }}
                          className="w-full bg-[#F8F9FA] border border-[#D1D6DB] rounded-lg px-2 py-1 text-[13px] font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[#6B7684]">효원 결합 할인가:</span>
                        <input
                          type="number"
                          value={editingItem.discountPrice6Year}
                          onChange={(e) => {
                            const discount = Number(e.target.value);
                            const base = editingItem.rentalPrice6Year || discount;
                            const rate = base > 0 ? Math.round(((base - discount) / base) * 100) : 0;
                            setEditingItem({
                              ...editingItem,
                              discountPrice6Year: discount,
                              discountRate6Year: rate,
                            });
                          }}
                          className="w-full bg-[#F8F9FA] border border-[#D1D6DB] rounded-lg px-2 py-1 text-[13px] font-black text-[#EA1D2C]"
                        />
                      </div>
                      <div className="text-right text-[11px] font-bold text-[#EA1D2C]">
                        할인율: {editingItem.discountRate6Year || 0}% 할인
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Care Cycle & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#4E5968] mb-1">
                    케어서비스 주기 (쉼표 구분)
                  </label>
                  <input
                    type="text"
                    value={editingItem.careCycles?.join(', ')}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        careCycles: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="w-full bg-[#F8F9FA] border border-[#D1D6DB] rounded-xl px-3 py-2 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#4E5968] mb-1">
                    케어서비스 유형 (쉼표 구분)
                  </label>
                  <input
                    type="text"
                    value={editingItem.careTypes?.join(', ')}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        careTypes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="w-full bg-[#F8F9FA] border border-[#D1D6DB] rounded-xl px-3 py-2 text-[13px]"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-[#E5E8EB] pt-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingItem(null);
                }}
                className="px-4 py-2 rounded-xl text-[13px] font-bold text-[#4E5968] hover:bg-[#F2F4F6] cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="bg-[#EA1D2C] hover:bg-[#C81020] text-white px-5 py-2 rounded-xl text-[13px] font-bold shadow-xs cursor-pointer"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Choice Modal for Multiple Matched/Fuzzy Models */}
      {choiceModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[#E5E8EB] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#EA1D2C] bg-red-50 px-2 py-0.5 rounded">
                  공홈 공식 제품 선택
                </span>
                <h3 className="text-[16px] font-black text-[#191F28] mt-1">
                  이동할 제품 페이지를 선택하세요
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setChoiceModalProduct(null)}
                className="text-[#8B95A1] hover:text-[#191F28] p-1 rounded-lg hover:bg-[#F2F4F6] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#F8F9FA] p-3 rounded-xl border border-[#E5E8EB]">
                <p className="text-[12px] font-bold text-[#6B7684]">요청 모델</p>
                <p className="text-[14px] font-black text-[#191F28] font-mono">
                  {choiceModalProduct.model} ({choiceModalProduct.name})
                </p>
                <p className="text-[11px] text-[#8B95A1] mt-1">
                  공홈에서 일치/유사한 제품 옵션이 확인되었습니다. 아래에서 원하는 형태를 클릭하시면 해당 공홈 페이지로 바로 이동합니다:
                </p>
              </div>

              <div className="space-y-2">
                {choiceModalProduct.relatedUrls?.map((rel: any, i: number) => {
                  const safeUrl = formatSubscriptionRefUrl(rel.url, rel.model, choiceModalProduct.categoryKey || choiceModalProduct.category);
                  return (
                    <a
                      key={i}
                      href={safeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setChoiceModalProduct(null)}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-[#E5E8EB] hover:border-[#3182F6] hover:bg-[#F8FAFF] transition-all group cursor-pointer"
                    >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#E8F3FF] text-[#1B64DA] flex items-center justify-center font-bold text-[12px] shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-extrabold bg-[#F2F4F6] group-hover:bg-[#E8F3FF] text-[#333D4B] group-hover:text-[#1B64DA] px-2 py-0.5 rounded">
                            {rel.title}
                          </span>
                          <span className="text-[13px] font-black text-[#191F28] font-mono">
                            {rel.model}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8B95A1] mt-0.5 truncate max-w-[260px]">
                          {rel.url}
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#8B95A1] group-hover:text-[#3182F6] shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  );
                })}

                {/* Direct Search Link Fallback */}
                <a
                  href={`https://www.lge.co.kr/search/search-all?searchKey=${encodeURIComponent(choiceModalProduct.model)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setChoiceModalProduct(null)}
                  className="flex items-center justify-between p-3 rounded-xl border border-dashed border-[#D1D6DB] hover:border-[#4E5968] hover:bg-gray-50 transition-all text-[#6B7684] hover:text-[#191F28] text-[12px] font-bold"
                >
                  <span>🔍 LG 공홈에서 &apos;{choiceModalProduct.model}&apos; 전체 검색결과 보기</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="p-4 bg-[#F8F9FA] border-t border-[#E5E8EB] flex justify-end">
              <button
                type="button"
                onClick={() => setChoiceModalProduct(null)}
                className="px-4 py-2 bg-white border border-[#D1D6DB] hover:bg-[#F2F4F6] text-[#4E5968] text-[13px] font-bold rounded-xl cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Edit Modal */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-[#E5E8EB] animate-scale-up">
            <div className="p-5 border-b border-[#E5E8EB] flex items-center justify-between bg-[#F8F9FA]">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{editingCategory.icon || '📦'}</span>
                <div>
                  <h3 className="text-[16px] font-black text-[#191F28]">카테고리 정보 수정</h3>
                  <p className="text-[12px] text-[#8B95A1]">이름, 아이콘 및 뱃지를 변경할 수 있습니다.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-[#8B95A1] hover:text-[#191F28] p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategoryEdit} className="p-5 space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-[13px] font-bold text-[#333D4B] mb-1.5">
                  카테고리명 <span className="text-[#EA1D2C]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="예: 정수기, 올레드 TV 등"
                  className="w-full bg-[#F8F9FA] border border-[#E5E8EB] focus:border-[#EA1D2C] focus:bg-white rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition-colors outline-none"
                />
              </div>

              {/* Category Icon (Emoji / Image Upload / Image URL) */}
              <div>
                <label className="block text-[13px] font-bold text-[#333D4B] mb-1.5">
                  카테고리 아이콘 <span className="text-[#EA1D2C]">*</span>
                </label>

                {/* Preview & Current Icon */}
                <div className="flex items-center gap-3 p-3 bg-[#F8F9FA] border border-[#E5E8EB] rounded-xl mb-3">
                  <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {renderCategoryIcon(editingCategory.icon, editingCategory.name, "w-8 h-8 object-contain")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-[#191F28] truncate">
                      {editingCategory.icon?.startsWith('data:image') 
                        ? '사용자 업로드 이미지' 
                        : (editingCategory.icon?.startsWith('http') ? '외부 이미지 URL' : `이모지 아이콘 (${editingCategory.icon})`)}
                    </p>
                    <p className="text-[11px] text-[#8B95A1] truncate">
                      사이드바 및 랜딩 상단 퀵 메뉴에 표시됩니다.
                    </p>
                  </div>
                </div>

                {/* Mode Selection & Inputs */}
                <div className="space-y-3">
                  {/* File Upload Option */}
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-dashed border-[#D1D6DB] hover:border-[#EA1D2C] text-[#333D4B] py-2 px-3 rounded-xl text-[12px] font-bold cursor-pointer transition-all">
                      <Upload className="w-4 h-4 text-[#EA1D2C]" />
                      <span>PC에서 이미지 파일 업로드</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              alert('이미지 파일 크기는 2MB 이하여야 합니다.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (loadEvt) => {
                              const result = loadEvt.target?.result as string;
                              if (result) {
                                setEditingCategory({ ...editingCategory, icon: result });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Image URL Direct Input */}
                  <div>
                    <span className="text-[11px] text-[#8B95A1] font-bold block mb-1">이미지 URL 직접 입력:</span>
                    <input
                      type="text"
                      value={editingCategory.icon?.startsWith('http') ? editingCategory.icon : ''}
                      onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                      placeholder="https://... 이미지 웹 주소 입력"
                      className="w-full bg-[#F8F9FA] border border-[#E5E8EB] focus:border-[#EA1D2C] focus:bg-white rounded-xl px-3 py-1.5 text-[12px] font-medium transition-colors outline-none"
                    />
                  </div>

                  {/* Popular Emoji Presets */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-[#8B95A1] font-bold block">또는 이모지 선택:</span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-gray-50 rounded-lg border border-gray-200">
                      {['💧', '🧊', '🥬', '🍽️', '🔥', '🧺', '🏢', '🔄', '👕', '👔', '❄️', '🍃', '🌪️', '💨', '💦', '📺', '📱', '🧹', '💆', '👟', '☕', '✨', '⚡', '📦'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setEditingCategory({ ...editingCategory, icon: emoji })}
                          className={`w-7 h-7 rounded flex items-center justify-center text-[15px] hover:bg-white hover:scale-110 transition-transform ${
                            editingCategory.icon === emoji ? 'bg-white border-2 border-[#EA1D2C] shadow-xs' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Badge */}
              <div>
                <label className="block text-[13px] font-bold text-[#333D4B] mb-1.5">
                  뱃지 (선택 사항)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={editingCategory.badge || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, badge: e.target.value })}
                    placeholder="예: 인기, BEST, HOT, 추천 (비워두면 뱃지 없음)"
                    className="flex-1 bg-[#F8F9FA] border border-[#E5E8EB] focus:border-[#EA1D2C] focus:bg-white rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors outline-none"
                  />
                  {editingCategory.badge && (
                    <button
                      type="button"
                      onClick={() => setEditingCategory({ ...editingCategory, badge: '' })}
                      className="text-[11px] text-[#8B95A1] hover:text-red-500 font-bold px-2 py-1 bg-gray-100 rounded-md"
                    >
                      삭제
                    </button>
                  )}
                </div>

                {/* Badge Presets */}
                <div className="flex items-center gap-1.5">
                  {['인기', 'BEST', 'HOT', '추천', '필수', '품절임박'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditingCategory({ ...editingCategory, badge: preset })}
                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border transition-all ${
                        editingCategory.badge === preset
                          ? 'bg-[#EA1D2C] text-white border-[#EA1D2C]'
                          : 'bg-white text-[#4E5968] border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Landing Default Category Toggle */}
              <div className="p-3 bg-[#FFF5F6] border border-[#EA1D2C]/20 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCategory.isDefault || false}
                    onChange={(e) => setEditingCategory({ ...editingCategory, isDefault: e.target.checked })}
                    className="w-4 h-4 text-[#EA1D2C] rounded border-gray-300 focus:ring-[#EA1D2C]"
                  />
                  <div>
                    <span className="text-[13px] font-black text-[#191F28]">
                      ⭐ 랜딩 첫 화면 기본 카테고리로 지정
                    </span>
                    <p className="text-[11px] text-[#8B95A1] mt-0.5">
                      고객이 랜딩 페이지에 처음 들어왔을 때 이 카테고리가 기본으로 선택되어 열립니다.
                    </p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[#E5E8EB] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(editingCategory)}
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-[#EA1D2C] border border-red-200 text-[12.5px] font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>카테고리 삭제</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-4 py-2 bg-white border border-[#D1D6DB] hover:bg-[#F2F4F6] text-[#4E5968] text-[13px] font-bold rounded-xl cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#EA1D2C] hover:bg-[#C81020] text-white text-[13px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    저장하기
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
