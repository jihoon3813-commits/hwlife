import React, { useState, useRef } from 'react';
import { Plus, Download, Upload, Copy, Trash2, Edit, MoveVertical, Eye, EyeOff, ChevronRight, Settings2, ImageIcon, CheckSquare, Square, Link, X, Star, Zap, Sparkles } from 'lucide-react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import * as XLSX from 'xlsx';

interface Plan {
  mainCount: number;
  isMainActive: boolean;
  accountCount?: string;
}

function PreviewImage({ src, className }: { src: string, className?: string }) {
  const isStorageId = src && !src.startsWith('http') && !src.startsWith('blob') && !src.startsWith('data');
  const imageUrl = useQuery(api.images.getImageUrl, isStorageId ? { storageId: src as any } : "skip");

  const displayUrl = isStorageId ? imageUrl : src;

  if (isStorageId && imageUrl === undefined) {
    return <div className={`${className} flex items-center justify-center bg-gray-50`}><div className="w-4 h-4 border-2 border-[#3182F6] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return <img src={displayUrl || ''} className={className} alt="" />;
}

export default function ProductManagement() {
  const dbPlans = useQuery(api.plans.get);
  const createPlan = useMutation(api.plans.create);
  const updatePlan = useMutation(api.plans.update);
  const deletePlan = useMutation(api.plans.remove);
  const updatePlanOrder = useMutation(api.plans.updateOrder);

  const plans = (dbPlans || []).map(p => ({
    id: p.numericId,
    _id: p._id,
    name: p.name,
    basePrice: p.basePrice,
    benefitPrice: p.benefitPrice,
    mainCount: p.mainCount,
    isMainActive: p.isMainActive,
    accountCount: p.accountCount
  }));

  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  const allProducts = useQuery(api.products.getAllProducts);
  const competitors = useQuery(api.competitors.get) || [];
  const settings = useQuery(api.settings.get);
  
  const updateProduct = useMutation(api.products.update);
  const createProduct = useMutation(api.products.create);
  const deleteProductMutation = useMutation(api.products.remove);
  const updateProductOrder = useMutation(api.products.updateProductOrder);

  const [selectedPlanId, setSelectedPlanId] = useState<number | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'list' | 'edit_plan' | 'edit_product'>('list');
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [sortConfig, setSortConfig] = useState<{ key: 'brand' | 'category' | 'supplyPrice' | 'price' | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

  const thumbInputRef = useRef<HTMLInputElement>(null);
  const detailInputRef = useRef<HTMLInputElement>(null);
  const smartExcelInputRef = useRef<HTMLInputElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const scrapeProductInfoAction = useAction(api.crawler.scrapeProductInfo);
  const [smartProgress, setSmartProgress] = useState<{ current: number; total: number; currentModel: string } | null>(null);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const [isSmartModalOpen, setIsSmartModalOpen] = useState(false);
  const [directModelsText, setDirectModelsText] = useState('');
  const [isDirectRegistering, setIsDirectRegistering] = useState(false);

  const handleDirectSmartRegister = async () => {
    const rawInput = directModelsText.trim();
    if (!rawInput) {
      alert("등록할 모델명을 입력해 주세요.");
      return;
    }

    const modelList = rawInput
      .split(/[\n,;]/)
      .map(s => s.trim())
      .filter(Boolean);

    if (modelList.length === 0) {
      alert("유효한 모델명이 입력되지 않았습니다.");
      return;
    }

    setIsDirectRegistering(true);
    setSmartProgress({ current: 0, total: modelList.length, currentModel: '시작 중...' });

    let successCount = 0;
    let failCount = 0;

    const currentPlan = plans.find(p => p.id === selectedPlanId) || selectedPlan;
    const planPrice = currentPlan?.basePrice ? String(currentPlan.basePrice).replace(/\D/g, '') : "59800";
    const planBenefitPrice = currentPlan?.benefitPrice ? String(currentPlan.benefitPrice).replace(/\D/g, '') : "34800";
    const planAccount = currentPlan?.accountCount || (selectedPlanId + "구좌");

    for (let i = 0; i < modelList.length; i++) {
      const rawModel = modelList[i];
      setSmartProgress({ current: i + 1, total: modelList.length, currentModel: rawModel });

      try {
        const scraped = await scrapeProductInfoAction({
          model: rawModel,
          price: '0'
        });

        const existingProduct = allProducts?.find(
          p => p.planId === selectedPlanId && p.model?.trim().toLowerCase() === rawModel.toLowerCase()
        );

        const scrapedName = (scraped.name && scraped.name !== `LG ${rawModel}`) ? scraped.name : rawModel;
        const scrapedThumb = scraped.thumbnail || undefined;
        const scrapedThumbs = scraped.thumbnails && scraped.thumbnails.length > 0 ? scraped.thumbnails : (scraped.thumbnail ? [scraped.thumbnail] : []);

        if (existingProduct) {
          await updateProduct({
            id: existingProduct._id,
            brand: scraped.brand || existingProduct.brand || 'LG전자',
            category: scraped.category || existingProduct.category || '가전',
            model: scraped.model || rawModel,
            name: scrapedName !== rawModel ? scrapedName : (existingProduct.name || rawModel),
            image: scrapedThumb || existingProduct.image || undefined,
            images: scrapedThumbs.length > 0 ? scrapedThumbs : (existingProduct.images || []),
            detailImage: scraped.detailImages?.[0] || existingProduct.detailImage || undefined,
            detailImages: scraped.detailImages || existingProduct.detailImages || [],
            specifications: scraped.specifications && scraped.specifications.length > 0 ? scraped.specifications : (existingProduct.specifications || []),
            isSmartRegistered: true,
            isVisible: true,
            accountCount: planAccount
          });
        } else {
          await createProduct({
            planId: selectedPlanId,
            brand: scraped.brand || 'LG전자',
            category: scraped.category || '가전',
            model: scraped.model || rawModel,
            name: scrapedName,
            price: planPrice,
            discountPrice: planBenefitPrice,
            image: scrapedThumb,
            images: scrapedThumbs,
            detailImage: scraped.detailImages?.[0] || undefined,
            detailImages: scraped.detailImages || [],
            specifications: scraped.specifications || [],
            isSmartRegistered: true,
            isVisible: true,
            showOnMain: false,
            landingPages: ['/package60'],
            comparisons: [],
            accountCount: planAccount
          });
        }
        successCount++;
      } catch (err) {
        console.error(`Direct smart register error for ${rawModel}:`, err);
        failCount++;
      }
    }

    setSmartProgress(null);
    setIsDirectRegistering(false);
    setIsSmartModalOpen(false);
    setDirectModelsText('');

    alert(`⚡ 스마트 모델명 입력 등록이 완료되었습니다.\n(성공: ${successCount}건, 실패: ${failCount}건)`);
  };

  // When mounting or navigating to ProductManagement, select the top plan (plans[0]) and show list view
  React.useEffect(() => {
    if (plans.length > 0 && isInitialMount.current) {
      setSelectedPlanId(plans[0].id);
      setViewMode('list');
      setEditingProduct(null);
      isInitialMount.current = false;
    }
  }, [plans]);

  // Scroll to top on plan selection or view change
  React.useEffect(() => {
    window.scrollTo(0, 0);
    if (mainContainerRef.current) mainContainerRef.current.scrollTop = 0;
    if (tableContainerRef.current) tableContainerRef.current.scrollTop = 0;
  }, [selectedPlanId, viewMode]);

  const activePlanId = selectedPlanId ?? plans[0]?.id;

  const filteredProducts = (allProducts || [])
    .filter(p => p.planId === activePlanId)
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      if (sortConfig.key === 'supplyPrice' || sortConfig.key === 'price') {
        const aNum = parseInt(String((a as any)[sortConfig.key] || '0').replace(/\D/g, ''), 10);
        const bNum = parseInt(String((b as any)[sortConfig.key] || '0').replace(/\D/g, ''), 10);
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      const aVal = (a as any)[sortConfig.key] || "";
      const bVal = (b as any)[sortConfig.key] || "";
      if (sortConfig.direction === 'asc') return aVal.localeCompare(bVal);
      return bVal.localeCompare(aVal);
    });

  const formatNumber = (val: string) => {
    if (!val) return "0";
    return val.toString().replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const generateUploadUrl = useMutation(api.images.generateUploadUrl);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && editingProduct) {
      try {
        const uploadedUrls = [];
        for (const file of Array.from(files)) {
          const postUrl = await generateUploadUrl();
          const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": (file as any).type },
            body: file as any,
          });
          const { storageId } = await result.json();
          uploadedUrls.push(storageId);
        }
        setEditingProduct({ 
          ...editingProduct, 
          images: [...(editingProduct.images || []), ...uploadedUrls] 
        });
      } catch (err) {
        console.error(err);
        alert('이미지 업로드 중 오류가 발생했습니다.');
      }
    }
  };

  const handleDetailImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && editingProduct) {
      try {
        const uploadedUrls = [];
        for (const file of Array.from(files)) {
          const postUrl = await generateUploadUrl();
          const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": (file as any).type },
            body: file as any,
          });
          const { storageId } = await result.json();
          uploadedUrls.push(storageId);
        }
        setEditingProduct({ 
          ...editingProduct, 
          detailImages: [...(editingProduct.detailImages || []), ...uploadedUrls] 
        });
      } catch (err) {
        console.error(err);
        alert('상세 이미지 업로드 중 오류가 발생했습니다.');
      }
    }
  };

  const addImageUrl = (type: 'images' | 'detailImages') => {
    const url = window.prompt('이미지 URL을 입력해주세요.');
    if (url) {
      setEditingProduct({
        ...editingProduct,
        [type]: [...(editingProduct[type] || []), url]
      });
    }
  };

  const removeImage = (type: 'images' | 'detailImages', index: number) => {
    const updated = [...(editingProduct[type] || [])];
    updated.splice(index, 1);
    setEditingProduct({ ...editingProduct, [type]: updated });
  };

  const handleAddProduct = () => {
    setEditingProduct({ 
      planId: selectedPlanId, 
      brand: '삼성전자', 
      category: 'TV/시청각', 
      name: '', 
      model: '', 
      price: '0', 
      discountPrice: '0',
      isVisible: true,
      image: '',
      images: [],
      detailImage: '',
      detailImages: [],
      comparisons: [] 
    });
    setViewMode('edit_product');
  };

  const toggleSort = (key: 'brand' | 'category' | 'supplyPrice' | 'price') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleVisibility = async (id: string, current: boolean) => {
    await updateProduct({ id: id as any, isVisible: !current });
  };

  const toggleMainExposure = async (id: string, current: boolean | undefined) => {
    const isCurrentlyMain = !!current;
    if (!isCurrentlyMain) {
      const mainCount = allProducts.filter(p => !!p.showOnMain).length;
      if (mainCount >= 8) {
        alert('메인 노출은 최대 8개까지만 가능합니다.');
        return;
      }
    }
    await updateProduct({ id: id as any, showOnMain: !isCurrentlyMain });
  };

  const toggleHeroExposure = async (id: string, current: boolean | undefined) => {
    const isCurrentlyHero = !!current;
    if (!isCurrentlyHero) {
      const heroCount = allProducts.filter(p => !!p.showOnHero).length;
      if (heroCount >= 4) {
        alert('히어로 노출은 최대 4개까지만 가능합니다.');
        return;
      }
    }
    await updateProduct({ id: id as any, showOnHero: !isCurrentlyHero });
  };

  const deleteProduct = async (id: string) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      await deleteProductMutation({ id: id as any });
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const copyProduct = async (id: string) => {
    const target = allProducts.find(p => p._id === id);
    if (target) {
      const { _id, _creationTime, ...data } = target;
      await createProduct({ ...data, name: `${data.name} (복사본)` });
    }
  };

  // Batch Actions
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`${selectedIds.length}개의 항목을 삭제하시겠습니까?`)) {
      for (const id of selectedIds) {
        await deleteProductMutation({ id: id as any });
      }
      setSelectedIds([]);
    }
  };

  const handleBatchSetRepresentativeIndex = async (targetIdx: number) => {
    if (selectedIds.length === 0) {
      alert("선택된 제품이 없습니다.");
      return;
    }
    let updatedCount = 0;
    for (const id of selectedIds) {
      const prod = allProducts?.find(p => p._id === id);
      if (prod && prod.images && prod.images[targetIdx]) {
        await updateProduct({ id: id as any, image: prod.images[targetIdx] });
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      alert(`선택한 ${updatedCount}개 제품의 대표 썸네일이 ${targetIdx + 1}번 이미지로 설정되었습니다.`);
    } else {
      alert(`선택한 제품들 중 ${targetIdx + 1}번째 썸네일 이미지가 존재하는 제품이 없습니다.`);
    }
  };

  const handleBatchToggleVisibility = async (visible: boolean) => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await updateProduct({ id: id as any, isVisible: visible });
    }
    setSelectedIds([]);
  };

  const [isSingleFetching, setIsSingleFetching] = useState(false);

  const handleSingleSmartFetch = async () => {
    if (!editingProduct?.model?.trim()) {
      alert("스마트 수집할 모델명을 입력해 주세요.");
      return;
    }
    setIsSingleFetching(true);
    try {
      const scraped = await scrapeProductInfoAction({
        model: editingProduct.model.trim(),
        price: String(editingProduct.price || '0').replace(/\D/g, '')
      });

      if (!scraped.success && !scraped.thumbnail && (!scraped.specifications || scraped.specifications.length === 0)) {
        alert(`모델명 [${editingProduct.model}]의 스마트 정보 수집에 실패했거나 제품 페이지를 찾을 수 없습니다.`);
        return;
      }

      setEditingProduct((prev: any) => ({
        ...prev,
        name: scraped.name || prev.name,
        brand: scraped.brand || prev.brand || 'LG전자',
        category: scraped.category || prev.category || '가전',
        image: scraped.thumbnail || prev.image,
        images: scraped.thumbnails && scraped.thumbnails.length > 0 ? scraped.thumbnails : (scraped.thumbnail ? [scraped.thumbnail] : prev.images),
        specifications: scraped.specifications && scraped.specifications.length > 0 ? scraped.specifications : prev.specifications
      }));

      alert(`⚡ 모델명 [${editingProduct.model}]의 스마트 정보(제품명: ${scraped.name}, 썸네일 ${scraped.thumbnails?.length || 0}개, 스펙 ${scraped.specifications?.length || 0}개)를 성공적으로 수집했습니다!`);
    } catch (err: any) {
      console.error(err);
      alert("스마트 정보 수집 중 오류가 발생했습니다.");
    } finally {
      setIsSingleFetching(false);
    }
  };

  const handleBatchSmartFetch = async () => {
    const targets = selectedIds.length > 0
      ? filteredProducts.filter(p => selectedIds.includes(p._id))
      : filteredProducts;

    if (targets.length === 0) {
      alert("동기화할 제품이 없습니다.");
      return;
    }

    if (!window.confirm(`${targets.length}개 제품의 모델명을 기준으로 스마트 정보(제품명, 이미지, 스펙)를 일괄 자동 수집하시겠습니까?`)) {
      return;
    }

    setSmartProgress({ current: 0, total: targets.length, currentModel: '시작 중...' });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < targets.length; i++) {
      const prod = targets[i];
      if (!prod.model) continue;

      setSmartProgress({ current: i + 1, total: targets.length, currentModel: `${prod.name || ''} (${prod.model})` });

      try {
        const scraped = await scrapeProductInfoAction({
          model: prod.model,
          price: String(prod.price || '0').replace(/\D/g, '')
        });

        if (scraped.success || scraped.thumbnail || (scraped.specifications && scraped.specifications.length > 0)) {
          const isRealName = scraped.name && scraped.name !== `LG ${prod.model}`;
          const finalName = isRealName ? scraped.name : prod.name;
          const finalThumb = scraped.thumbnail || prod.image || undefined;
          const finalThumbs = (scraped.thumbnails && scraped.thumbnails.length > 0) ? scraped.thumbnails : (scraped.thumbnail ? [scraped.thumbnail] : (prod.images || []));

          await updateProduct({
            id: prod._id,
            name: finalName,
            brand: scraped.brand || prod.brand || 'LG전자',
            category: scraped.category || prod.category || '가전',
            image: finalThumb,
            images: finalThumbs,
            specifications: (scraped.specifications && scraped.specifications.length > 0) ? scraped.specifications : (prod.specifications || [])
          });
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(err);
        failCount++;
      }
    }

    setSmartProgress(null);
    alert(`⚡ 스마트 정보 일괄 수집 완료!\n성공: ${successCount}개 / 실패: ${failCount}개`);
  };

  const handleBatchCopy = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      const target = allProducts.find(p => p._id === id);
      if (target) {
        const { _id, _creationTime, ...data } = target;
        await createProduct({ ...data, name: `${data.name} (복사본)` });
      }
    }
    setSelectedIds([]);
  };

  const onDragStart = (index: number) => {
    // 드래그 고스트 이미지가 흐릿하게 캡처되는 것을 방지하기 위해 스타일 적용을 약간 늦춥니다.
    setTimeout(() => {
      setDraggedItemIndex(index);
    }, 0);
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = async (dropIndex: number) => {
    if (draggedItemIndex === null || draggedItemIndex === dropIndex) {
      setDraggedItemIndex(null);
      return;
    }

    const newList = [...filteredProducts];
    const [movedItem] = newList.splice(draggedItemIndex, 1);
    newList.splice(dropIndex, 0, movedItem);

    const orders = newList.map((item, index) => ({
      id: item._id,
      order: index,
    }));

    try {
      await updateProductOrder({ orders });
    } catch (e) {
      console.error('Failed to update product order:', e);
    }

    setDraggedItemIndex(null);
  };

  const [draggedPlanIndex, setDraggedPlanIndex] = useState<number | null>(null);
  const handlePlanDragStart = (idx: number) => {
    setTimeout(() => {
      setDraggedPlanIndex(idx);
    }, 0);
  };
  const handlePlanDrop = async (idx: number) => {
    if (draggedPlanIndex === null || draggedPlanIndex === idx) {
      setDraggedPlanIndex(null);
      return;
    }

    const newList = [...plans];
    const [movedItem] = newList.splice(draggedPlanIndex, 1);
    newList.splice(idx, 0, movedItem);

    const orders = newList.map((item, index) => ({
      id: (item as any)._id,
      order: index,
    }));

    try {
      await updatePlanOrder({ orders });
    } catch (e) {
      console.error(e);
    }
    setDraggedPlanIndex(null);
  };


  const downloadTemplate = () => {
    const compHeaders = [];
    for (let i = 1; i <= 10; i++) {
      compHeaders.push(`타사${i}명`, `타사${i}금액`);
    }
    const headers = [
      ['구좌', '브랜드', '카테고리', '제품명', '모델명', '월납입금', '제휴카드혜택가', '라벨', ...compHeaders, '썸네일url', '상세이미지 url(쉼표 구분)']
    ];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "제품등록양식");
    XLSX.writeFile(wb, "제품등록양식.xlsx");
  };

  const downloadSmartTemplate = () => {
    const data = [
      ['모델명', '공급가', '사은품', '참고 URL'],
      ['H875GBB012', '1,910,000', '현금 30만원', 'https://www.lge.co.kr/home'],
      ['M876GBB28-B + H875GBB012', '3,750,000', '신세계 상품권 40만원', 'https://www.lge.co.kr/home']
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "스마트등록양식");
    XLSX.writeFile(wb, "스마트등록_양식.xlsx");
  };

  const handleSmartExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const excelData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (!excelData || excelData.length <= 1) {
          alert("등록할 데이터가 없습니다.");
          return;
        }

        const headers = (excelData[0] || []).map(h => String(h || '').trim());
        let modelIdx = headers.findIndex(h => h.includes('모델'));
        let priceIdx = headers.findIndex(h => h.includes('공급') || h.includes('가격') || h.includes('금액'));
        let giftIdx = headers.findIndex(h => h.includes('사은품') || h.includes('혜택') || h.includes('지원'));
        let urlIdx = headers.findIndex(h => h.includes('URL') || h.includes('url') || h.includes('링크'));

        if (modelIdx === -1) modelIdx = 0;
        if (priceIdx === -1) priceIdx = 1;
        if (giftIdx === -1) giftIdx = (headers.length >= 3 && !String(headers[2] || '').toLowerCase().includes('http')) ? 2 : -1;
        if (urlIdx === -1) urlIdx = giftIdx === 2 ? 3 : (headers.length >= 3 ? 2 : -1);

        const rows = excelData.slice(1);
        const validRows = rows.filter(r => r && r[modelIdx]);

        if (validRows.length === 0) {
          alert("엑셀 파일에 유효한 모델명이 작성된 행이 없습니다.");
          return;
        }

        setSmartProgress({ current: 0, total: validRows.length, currentModel: '시작 중...' });

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < validRows.length; i++) {
          const row = validRows[i];
          const rawModel = String(row[modelIdx] || '').trim();
          const rawPrice = String(row[priceIdx] || '0').replace(/\D/g, '');
          const rawGift = giftIdx !== -1 ? String(row[giftIdx] || '').trim() : '';
          const refUrl = urlIdx !== -1 ? String(row[urlIdx] || '').trim() : '';

          if (!rawModel) continue;

          setSmartProgress({ current: i + 1, total: validRows.length, currentModel: rawModel });

          try {
            const scraped = await scrapeProductInfoAction({
              model: rawModel,
              price: rawPrice,
              refUrl
            });

            const currentPlan = plans.find(p => p.id === selectedPlanId) || selectedPlan;
            const planPrice = currentPlan?.basePrice ? String(currentPlan.basePrice).replace(/\D/g, '') : "59800";
            const planBenefitPrice = currentPlan?.benefitPrice ? String(currentPlan.benefitPrice).replace(/\D/g, '') : "34800";
            const planAccount = currentPlan?.accountCount || (selectedPlanId + "구좌");

            const existingProduct = allProducts?.find(
              p => p.planId === selectedPlanId && p.model?.trim().toLowerCase() === rawModel.toLowerCase()
            );

            const scrapedName = (scraped.name && scraped.name !== `LG ${rawModel}`) ? scraped.name : rawModel;
            const scrapedThumb = scraped.thumbnail || undefined;
            const scrapedThumbs = scraped.thumbnails && scraped.thumbnails.length > 0 ? scraped.thumbnails : (scraped.thumbnail ? [scraped.thumbnail] : []);

            if (existingProduct) {
              await updateProduct({
                id: existingProduct._id,
                brand: scraped.brand || existingProduct.brand || 'LG전자',
                category: scraped.category || existingProduct.category || '가전',
                model: scraped.model || rawModel,
                name: scrapedName !== rawModel ? scrapedName : (existingProduct.name || rawModel),
                image: scrapedThumb || existingProduct.image || undefined,
                images: scrapedThumbs.length > 0 ? scrapedThumbs : (existingProduct.images || []),
                detailImage: scraped.detailImages?.[0] || existingProduct.detailImage || undefined,
                detailImages: scraped.detailImages || existingProduct.detailImages || [],
                specifications: scraped.specifications && scraped.specifications.length > 0 ? scraped.specifications : (existingProduct.specifications || []),
                isSmartRegistered: true,
                isVisible: true,
                accountCount: planAccount,
                supplyPrice: rawPrice || existingProduct.supplyPrice || undefined,
                giftText: rawGift || existingProduct.giftText || undefined
              });
            } else {
              await createProduct({
                planId: selectedPlanId,
                brand: scraped.brand || 'LG전자',
                category: scraped.category || '가전',
                model: scraped.model || rawModel,
                name: scrapedName,
                price: planPrice,
                discountPrice: planBenefitPrice,
                image: scrapedThumb,
                images: scrapedThumbs,
                detailImage: scraped.detailImages?.[0] || undefined,
                detailImages: scraped.detailImages || [],
                specifications: scraped.specifications || [],
                isSmartRegistered: true,
                isVisible: true,
                showOnMain: false,
                landingPages: ['/package60'],
                comparisons: [],
                accountCount: planAccount,
                supplyPrice: rawPrice,
                giftText: rawGift || undefined
              });
            }

            successCount++;
          } catch (err) {
            console.error(`Smart register error for ${rawModel}:`, err);
            failCount++;
          }
        }

        setSmartProgress(null);
        alert(`⚡ 스마트 자동 등록이 완료되었습니다.\n(성공: ${successCount}건, 실패: ${failCount}건)`);
      } catch (err) {
        console.error("Smart excel process error:", err);
        setSmartProgress(null);
        alert("엑셀 파일 처리 중 오류가 발생했습니다.");
      } finally {
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const excelData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        const rows = excelData.slice(1);
        if (rows.length === 0) {
          alert("등록할 데이터가 없습니다.");
          return;
        }

        setIsUploading(true);
        setUploadProgress({ current: 0, total: rows.length });

        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < rows.length; i++) {
          setUploadProgress(prev => ({ ...prev, current: i + 1 }));
          const row = rows[i];
          try {
            if (!row || !row[3]) continue; 

            let planId = 1;
            const planVal = String(row[0] || '').trim();
            if (/^\d+$/.test(planVal)) {
              planId = parseInt(planVal);
            } else if (planVal) {
              const matchedPlan = plans.find(p => p.name.includes(planVal));
              if (matchedPlan) planId = matchedPlan.id;
            }

            const brand = String(row[1] || '').trim();
            const category = String(row[2] || '').trim();
            const name = String(row[3] || '').trim();
            const model = String(row[4] || '').trim();
            const price = String(row[5] || '0').replace(/\D/g, '');
            const discountPrice = String(row[6] || '0').replace(/\D/g, '');
            const tag = String(row[7] || '').trim();
            const accountCount = planVal; // Mapping '구좌' column value to accountCount
            
            const comparisons = [];
            for (let j = 0; j < 10; j++) {
              const baseIdx = 8 + (j * 2);
              const compName = String(row[baseIdx] || '').trim();
              const compPrice = String(row[baseIdx + 1] || '0').replace(/\D/g, '');
              
              if (compName) {
                const partner = competitors.find(c => c.name === compName);
                comparisons.push({
                  company: compName,
                  target: '', 
                  price: compPrice,
                  period: (partner?.months || 60) + '개월',
                  isOurs: partner?.type === '자사'
                });
              }
            }
            
            comparisons.sort((a, b) => (parseInt(a.price) || 0) - (parseInt(b.price) || 0));

            const thumbnailUrl = String(row[28] || '').trim();
            const detailUrls = row[29] ? String(row[29]).split(',').map(s => s.trim()).filter(s => s) : [];

            await createProduct({
              planId,
              brand,
              category,
              name,
              model,
              price,
              discountPrice,
              tag,
              isVisible: true,
              accountCount,
              comparisons,
              images: thumbnailUrl ? [thumbnailUrl] : [],
              detailImages: detailUrls
            } as any);
            successCount++;
          } catch (rowErr) {
            console.error(`Row ${i + 2} processing error:`, rowErr, row);
            failCount++;
          }
        }
        alert(`일괄 등록 완료\n성공: ${successCount}건\n실패: ${failCount}건`);
      } catch (err) {
        console.error("Excel upload general error:", err);
        alert("엑셀 파일 처리 중 오류가 발생했습니다. 양식을 다시 확인해 주세요.");
      } finally {
        setIsUploading(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div ref={mainContainerRef} className="p-8 h-full flex flex-col no-scrollbar overflow-y-auto relative">
      {/* Upload Loading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 rounded-[32px] shadow-2xl flex flex-col items-center max-w-[300px] w-full mx-4">
            <div className="w-12 h-12 border-4 border-[#3182F6] border-t-transparent rounded-full animate-spin mb-6"></div>
            <h3 className="font-bold text-[18px] text-[#191F28] mb-2">제품 등록 중...</h3>
            <p className="text-[#8B95A1] text-[14px] mb-6">잠시만 기다려 주세요.</p>
            <div className="w-full bg-[#F2F4F6] h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#3182F6] h-full transition-all duration-300"
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              ></div>
            </div>
            <div className="mt-3 text-[13px] font-bold text-[#4E5968]">
              {uploadProgress.current} / {uploadProgress.total}
            </div>
          </div>
        </div>
      )}

      {/* Smart Registration Progress Overlay */}
      {smartProgress && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 rounded-[32px] shadow-2xl flex flex-col items-center max-w-[360px] w-full mx-4 text-center border border-[#E5E8EB]">
            <div className="relative mb-5">
              <div className="w-16 h-16 border-4 border-[#3182F6] border-t-transparent rounded-full animate-spin"></div>
              <Sparkles className="w-7 h-7 text-[#3182F6] absolute inset-0 m-auto animate-pulse" />
            </div>
            <h3 className="font-bold text-[19px] text-[#191F28] mb-1">⚡ 스마트 자동 등록 중...</h3>
            <p className="text-[#3182F6] font-bold text-[14px] mb-2 truncate max-w-full px-2">
              {smartProgress.currentModel}
            </p>
            <p className="text-[#8B95A1] text-[13px] mb-6 leading-relaxed">
              참고 URL에서 썸네일, 제품명, 카테고리,<br />상세페이지 정보를 수집하여 매칭 중입니다.
            </p>
            <div className="w-full bg-[#F2F4F6] h-3 rounded-full overflow-hidden mb-2">
              <div 
                className="bg-gradient-to-r from-[#3182F6] to-[#1B64DA] h-full transition-all duration-300"
                style={{ width: `${(smartProgress.current / smartProgress.total) * 100}%` }}
              ></div>
            </div>
            <div className="text-[13px] font-bold text-[#4E5968]">
              {smartProgress.current} / {smartProgress.total} 건 진행 중
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-[20px] lg:text-[24px] font-bold text-[#191F28]">제품관리</h2>
          <span className="text-[13px] font-extrabold bg-[#E8F3FF] text-[#3182F6] px-3 py-1 rounded-full border border-[#3182F6]/20">
            총 등록 제품 <strong className="text-[14px] font-black">{allProducts?.length || 0}</strong>개
          </span>
        </div>
        <div className="text-[13px] text-[#8B95A1] lg:block hidden">드래그로 순서 변경, 일괄 복사/삭제가 가능합니다.</div>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
        {/* Left: Plan List */}
        <div className="w-full lg:w-[260px] flex flex-col bg-white rounded-[24px] border border-[#E5E8EB] overflow-hidden shadow-sm shrink-0">
          <div className="p-4 lg:p-5 border-b border-[#F2F4F6] bg-[#F9FAFB] flex justify-between items-center">
            <h3 className="font-bold text-[14px] text-[#4E5968]">구좌 선택</h3>
             <button 
              onClick={() => {
                setEditingPlan({ name: '', basePrice: '', benefitPrice: '', mainCount: 4, isMainActive: true, accountCount: '1구좌', numericId: (plans[plans.length-1]?.id || 0) + 1 });
                setViewMode('edit_plan');
              }}
              className="p-1.5 bg-[#3182F6] text-white rounded-[8px] hover:bg-[#1B64DA] transition-colors"
            >
              <Plus className="w-4 h-4"/>
            </button>
          </div>
           <div className="flex lg:flex-col overflow-x-auto lg:overflow-y-auto p-3 gap-2 no-scrollbar">
            {plans.map((plan, idx) => (
              <div 
                key={plan._id || plan.id}
                draggable
                onDragStart={() => handlePlanDragStart(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handlePlanDrop(idx)}
                onDragEnd={() => setDraggedPlanIndex(null)}
                onClick={() => { setSelectedPlanId(plan.id); setViewMode('list'); setSelectedIds([]); }}
                className={`flex-none lg:w-full p-4 rounded-[16px] cursor-pointer border transition-all whitespace-nowrap lg:whitespace-normal flex flex-col gap-1 ${
                  selectedPlanId === plan.id ? 'bg-[#3182F6] text-white shadow-md border-[#3182F6]' : 'bg-white border-transparent hover:bg-[#F2F4F6]'
                } ${draggedPlanIndex === idx ? 'opacity-50 border-dashed border-[#3182F6]' : ''}`}
              >
                 <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MoveVertical className={`w-3.5 h-3.5 shrink-0 ${selectedPlanId === plan.id ? 'text-white/50' : 'text-[#D1D6DB]'}`} />
                    <div className="text-[14px] font-bold truncate">{plan.name}</div>
                  </div>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setEditingPlan({ ...plan, numericId: plan.id }); 
                      setViewMode('edit_plan'); 
                    }}
                    className={`p-1 rounded-md transition-colors shrink-0 ${selectedPlanId === plan.id ? 'hover:bg-white/20' : 'hover:bg-[#E5E8EB]'}`}
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className={selectedPlanId === plan.id ? 'text-white/70' : 'text-[#8B95A1]'}>
                    {formatNumber(plan.basePrice)}원
                    {plan.accountCount && ` · ${plan.accountCount}`}
                  </span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    selectedPlanId === plan.id ? 'bg-white/20 text-white' : 'bg-[#E8F3FF] text-[#3182F6]'
                  }`}>
                    {allProducts?.filter(p => p.planId === plan.id).length || 0}개
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Product List */}
        <div className="flex-1 flex flex-col bg-white rounded-[24px] border border-[#E5E8EB] overflow-hidden shadow-sm">
          {viewMode === 'list' && selectedPlan ? (
            <>
              <div className="p-4 lg:p-6 border-b border-[#F2F4F6] bg-[#F9FAFB] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="w-full sm:w-auto">
                  <div className="flex items-center gap-2.5 mb-2">
                    <h3 className="font-bold text-[16px] lg:text-[18px]">{selectedPlan.name} 리스트</h3>
                    <span className="text-[12px] font-extrabold bg-[#E8F3FF] text-[#3182F6] px-2.5 py-0.5 rounded-full border border-[#3182F6]/20">
                      등록 {filteredProducts.length}개
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleSort('brand')} className={`flex-1 sm:flex-none px-3 py-2 border rounded-[8px] text-[12px] font-bold transition-all ${sortConfig.key === 'brand' ? 'bg-[#3182F6] text-white border-[#3182F6]' : 'bg-white text-[#4E5968] border-[#E5E8EB]'}`}>
                      브랜드 {sortConfig.key === 'brand' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </button>
                    <button onClick={() => toggleSort('category')} className={`flex-1 sm:flex-none px-3 py-2 border rounded-[8px] text-[12px] font-bold transition-all ${sortConfig.key === 'category' ? 'bg-[#3182F6] text-white border-[#3182F6]' : 'bg-white text-[#4E5968] border-[#E5E8EB]'}`}>
                      카테고리 {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </button>
                    <button onClick={() => toggleSort('supplyPrice')} className={`flex-1 sm:flex-none px-3 py-2 border rounded-[8px] text-[12px] font-bold transition-all ${sortConfig.key === 'supplyPrice' ? 'bg-[#3182F6] text-white border-[#3182F6]' : 'bg-white text-[#4E5968] border-[#E5E8EB]'}`}>
                      공급가 {sortConfig.key === 'supplyPrice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <input 
                    type="file" 
                    ref={smartExcelInputRef} 
                    className="hidden" 
                    accept=".xlsx, .xls" 
                    onChange={handleSmartExcelUpload} 
                  />
                  <input 
                    type="file" 
                    ref={excelInputRef} 
                    className="hidden" 
                    accept=".xlsx, .xls" 
                    onChange={handleExcelUpload} 
                  />
                  <button 
                    onClick={downloadSmartTemplate}
                    className="flex-1 sm:flex-none bg-[#F2F8FF] border border-[#3182F6]/30 text-[#3182F6] px-3 py-2.5 rounded-[10px] text-[13px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#E5F0FF] transition-all"
                  >
                    <Zap className="w-4 h-4" /> 스마트양식
                  </button>
                  <button 
                    onClick={() => setIsSmartModalOpen(true)}
                    className="flex-1 sm:flex-none bg-gradient-to-r from-[#3182F6] to-[#1B64DA] text-white px-3.5 py-2.5 rounded-[10px] text-[13px] font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#3182F6]/20 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" /> 스마트 등록
                  </button>
                  <button 
                    onClick={downloadTemplate}
                    className="flex-1 sm:flex-none bg-white border border-[#E5E8EB] text-[#4E5968] px-3 py-2.5 rounded-[10px] text-[13px] font-bold flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> 양식
                  </button>
                  <button 
                    onClick={() => excelInputRef.current?.click()}
                    className="flex-1 sm:flex-none bg-white border border-[#E5E8EB] text-[#3182F6] px-3 py-2.5 rounded-[10px] text-[13px] font-bold flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> 엑셀
                  </button>
                  <button onClick={handleAddProduct} className="w-full sm:w-auto bg-[#3182F6] text-white px-5 py-3 rounded-[12px] font-bold text-[14px] flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> 등록
                  </button>
                </div>
              </div>

              {/* Batch Actions Bar */}
              <div className="px-6 py-3 bg-[#F2F4F6] border-b border-[#E5E8EB] flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-[13px] font-bold text-[#4E5968]">
                    <span className="text-[#3182F6]">{selectedIds.length}</span>개 선택됨
                  </div>
                  <div className="h-4 w-[1px] bg-[#D1D6DB]"></div>
                  <div className="flex gap-2 items-center">
                    <button onClick={handleBatchCopy} className="p-1.5 hover:bg-white rounded-md text-[#3182F6] transition-colors" title="선택 복사"><Copy className="w-4 h-4"/></button>
                    <button onClick={() => handleBatchToggleVisibility(true)} className="p-1.5 hover:bg-white rounded-md text-[#1B64DA] transition-colors" title="선택 노출"><Eye className="w-4 h-4"/></button>
                    <button onClick={() => handleBatchToggleVisibility(false)} className="p-1.5 hover:bg-white rounded-md text-[#8B95A1] transition-colors" title="선택 숨김"><EyeOff className="w-4 h-4"/></button>
                    <button onClick={handleBatchDelete} className="p-1.5 hover:bg-white rounded-md text-red-500 transition-colors" title="선택 삭제"><Trash2 className="w-4 h-4"/></button>

                    <div className="h-4 w-[1px] bg-[#D1D6DB] mx-1"></div>
                    <span className="text-[11px] font-bold text-[#4E5968]">대표 썸네일:</span>
                    <select 
                      onChange={(e) => {
                        if (e.target.value !== "") {
                          handleBatchSetRepresentativeIndex(parseInt(e.target.value, 10));
                          e.target.value = "";
                        }
                      }}
                      className="text-[11px] font-bold bg-white border border-[#D1D6DB] rounded-[6px] px-2 py-1 text-[#3182F6] focus:outline-none cursor-pointer"
                    >
                      <option value="">순번 선택 ▾</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <option key={n} value={n - 1}>{n}번 이미지로 설정</option>
                      ))}
                    </select>
                    <div className="h-4 w-[1px] bg-[#D1D6DB] mx-1"></div>
                    <button 
                      onClick={handleBatchSmartFetch}
                      className="px-3 py-1 bg-[#3182F6] hover:bg-[#1B64DA] text-white text-[11px] font-extrabold rounded-[6px] transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="선택 항목 또는 전체 항목의 스마트 정보(이미지, 스펙)를 모델명으로 일괄 수집합니다"
                    >
                      <Zap className="w-3.5 h-3.5" /> 스마트 정보 일괄 수집
                    </button>
                  </div>
                </div>
            <div className="text-[12px] text-[#8B95A1]">목록에서 개별 관리도 가능합니다.</div>
              </div>

              <div ref={tableContainerRef} className="flex-1 overflow-auto no-scrollbar hide-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead className="sticky top-0 bg-[#F9FAFB] border-b border-[#E5E8EB] z-10">
                    <tr>
                      <th className="px-4 py-4 w-12 text-center">
                        <button onClick={() => setSelectedIds(selectedIds.length === filteredProducts.length ? [] : filteredProducts.map(p => p._id))}>
                          {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? <CheckSquare className="w-5 h-5 text-[#3182F6]"/> : <Square className="w-5 h-5 text-[#D1D6DB]"/>}
                        </button>
                      </th>
                      <th className="px-4 py-4 w-10"></th>
                      <th className="px-4 py-4 w-20 text-[13px] font-bold text-[#4E5968] whitespace-nowrap">이미지</th>
                      <th className="px-4 py-4 w-24 text-[13px] font-bold text-[#4E5968] whitespace-nowrap">브랜드</th>
                      <th className="px-4 py-4 w-28 text-[13px] font-bold text-[#4E5968] whitespace-nowrap">카테고리</th>
                      <th className="px-4 py-4 text-[13px] font-bold text-[#4E5968] whitespace-nowrap">제품명 / 모델명</th>
                      <th className="px-4 py-4 w-32 text-[13px] font-bold text-[#4E5968] text-right whitespace-nowrap">공급가</th>
                      <th className="px-4 py-4 w-32 text-[13px] font-bold text-[#4E5968] text-right whitespace-nowrap">월납입금</th>
                      <th className="px-4 py-4 w-20 text-[13px] font-bold text-[#4E5968] text-center whitespace-nowrap">노출</th>
                      <th className="px-4 py-4 w-20 text-[13px] font-bold text-[#4E5968] text-center whitespace-nowrap">메인</th>
                      <th className="px-4 py-4 w-20 text-[13px] font-bold text-[#4E5968] text-center whitespace-nowrap">히어로</th>
                      <th className="px-4 py-4 w-28 text-[13px] font-bold text-[#4E5968] text-right whitespace-nowrap">개별관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2F4F6]">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="px-4 py-20 text-center text-[#8B95A1] text-[14px]">
                          등록된 제품이 없습니다. '등록' 버튼을 눌러 제품을 추가해 주세요.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p, index) => (
                        <tr 
                          key={p._id} 
                          draggable
                          onDragStart={() => onDragStart(index)}
                          onDragOver={onDragOver}
                          onDrop={() => onDrop(index)}
                          className={`hover:bg-[#F9FAFB] cursor-move group ${draggedItemIndex === index ? 'opacity-50 border-dashed border-[#3182F6] bg-[#F2F4F6]' : 'transition-colors'} ${selectedIds.includes(p._id) ? 'bg-[#E8F3FF]/30' : ''}`}
                        >
                          <td className="px-4 py-4 text-center">
                            <button onClick={(e) => { e.stopPropagation(); setSelectedIds(prev => prev.includes(p._id) ? prev.filter(i => i !== p._id) : [...prev, p._id]); }}>
                              {selectedIds.includes(p._id) ? <CheckSquare className="w-5 h-5 text-[#3182F6]"/> : <Square className="w-5 h-5 text-[#D1D6DB]"/>}
                            </button>
                          </td>
                          <td className="px-2 py-4 text-[#D1D6DB] group-hover:text-[#3182F6]"><MoveVertical className="w-5 h-5" /></td>
                          <td className="px-2 py-4">
                            <div className="flex flex-col items-center gap-1.5">
                              <div className="w-12 h-12 bg-white border border-[#F2F4F6] rounded-lg overflow-hidden flex items-center justify-center shadow-xs">
                                {(p.image || (p.images && p.images.length > 0)) ? (
                                  <img src={p.image || p.images[0]} className="w-full h-full object-contain" alt="thumb" />
                                ) : (
                                  <ImageIcon className="w-5 h-5 text-[#D1D6DB]" />
                                )}
                              </div>
                              {p.images && p.images.length > 0 && (
                                <select
                                  value={(() => {
                                    const idx = p.images.indexOf(p.image);
                                    return idx >= 0 ? idx : 0;
                                  })()}
                                  onChange={(e) => {
                                    const selectedIdx = parseInt(e.target.value, 10);
                                    const newRep = p.images[selectedIdx];
                                    if (newRep) {
                                      updateProduct({ id: p._id, image: newRep });
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[10px] font-bold bg-[#F2F4F6] border border-[#D1D6DB] rounded px-1 py-0.5 w-16 text-center text-[#191F28] focus:outline-none hover:border-[#3182F6] cursor-pointer"
                                  title="대표 썸네일 순번 선택"
                                >
                                  {p.images.map((_: string, imgIdx: number) => (
                                    <option key={imgIdx} value={imgIdx}>
                                      {imgIdx + 1}번 썸네일
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-[14px] text-[#4E5968] font-bold">{p.brand}</td>
                          <td className="px-4 py-4 text-[13px] text-[#8B95A1] font-medium">{p.category}</td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 mb-1">
                              {(selectedPlan?.accountCount || p.accountCount) && <span className="text-[10px] font-bold bg-[#191F28] text-white px-1.5 py-0.5 rounded">{selectedPlan?.accountCount || p.accountCount}</span>}
                              {p.tag && <span className="text-[10px] font-bold bg-[#3182F6] text-white px-1.5 py-0.5 rounded">{p.tag}</span>}
                              <div className="text-[14px] font-bold text-[#191F28]">{p.name}</div>
                            </div>
                            <div className="text-[12px] text-[#A3B1C6]">{p.model}</div>
                          </td>
                          <td className="px-4 py-4 text-[14px] font-bold text-right text-[#191F28]">{p.supplyPrice ? formatNumber(p.supplyPrice) + '원' : '-'}</td>
                          <td className="px-4 py-4 text-[14px] font-bold text-right text-[#3182F6]">{formatNumber(selectedPlan?.basePrice || p.price)}원</td>
                          <td className="px-4 py-4 text-center">
                            <button onClick={(e) => { e.stopPropagation(); toggleVisibility(p._id, p.isVisible); }} className={`p-1.5 rounded-full transition-colors ${p.isVisible ? 'bg-[#E8F3FF] text-[#1B64DA]' : 'bg-gray-100 text-gray-400'}`}>
                              {p.isVisible ? <Eye className="w-4 h-4"/> : <EyeOff className="w-4 h-4"/>}
                            </button>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button onClick={(e) => { e.stopPropagation(); toggleMainExposure(p._id, p.showOnMain); }} className={`p-1.5 rounded-full transition-colors ${p.showOnMain ? 'bg-[#FFF2F2] text-[#F04452]' : 'bg-gray-100 text-gray-400'}`} title="메인 노출 (최대 8개)">
                              {p.showOnMain ? <Star className="w-4 h-4 fill-current"/> : <Star className="w-4 h-4"/>}
                            </button>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button onClick={(e) => { e.stopPropagation(); toggleHeroExposure(p._id, p.showOnHero); }} className={`p-1.5 rounded-full transition-colors ${p.showOnHero ? 'bg-[#E8F3FF] text-[#3182F6]' : 'bg-gray-100 text-gray-400'}`} title="히어로 노출 (최대 4개)">
                              {p.showOnHero ? <Sparkles className="w-4 h-4 fill-current"/> : <Sparkles className="w-4 h-4"/>}
                            </button>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={(e) => { e.stopPropagation(); copyProduct(p._id); }} className="p-1.5 hover:bg-white rounded-md text-[#3182F6]" title="복사"><Copy className="w-4 h-4"/></button>
                              <button onClick={(e) => { e.stopPropagation(); setEditingProduct(p); setViewMode('edit_product'); }} className="p-1.5 hover:bg-white rounded-md text-[#4E5968]" title="수정"><Edit className="w-4 h-4"/></button>
                              <button onClick={(e) => { e.stopPropagation(); deleteProduct(p._id); }} className="p-1.5 hover:bg-white rounded-md text-red-500" title="삭제"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : viewMode === 'list' && dbPlans === undefined ? (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-[#8B95A1]">
              <div className="w-12 h-12 border-4 border-[#3182F6] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-[14px] font-bold">상품 정보를 불러오는 중입니다...</p>
            </div>
          ) : viewMode === 'list' && plans.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
              <Settings2 className="w-12 h-12 text-[#D1D6DB] mb-4" />
              <h3 className="text-[18px] font-bold text-[#191F28] mb-2">설정된 구좌 정보가 없습니다.</h3>
              <p className="text-[#8B95A1] text-[14px] mb-6">먼저 왼쪽의 '+' 버튼을 눌러 구좌(Plan)를 생성하거나<br/>초기 데이터를 생성해 주세요.</p>
              <button 
                onClick={async () => {
                  if (window.confirm('기본 구좌 데이터(리빙144, 스페셜299 등)를 생성하시겠습니까?')) {
                    await createPlan({ numericId: 1, name: '스페셜299-UP가전', basePrice: '59,800', benefitPrice: '29,800', mainCount: 4, isMainActive: true, accountCount: '2구좌' });
                    await createPlan({ numericId: 2, name: '리빙144(신한카드)-2구좌', basePrice: '70,000', benefitPrice: '0', mainCount: 4, isMainActive: true, accountCount: '2구좌' });
                    await createPlan({ numericId: 3, name: '리빙144(신한카드)-1구좌', basePrice: '35,000', benefitPrice: '0', mainCount: 4, isMainActive: true, accountCount: '1구좌' });
                  }
                }}
                className="bg-[#3182F6] text-white px-6 py-3 rounded-[12px] font-bold text-[14px]"
              >
                초기 데이터 생성하기
              </button>
            </div>
          ) : viewMode === 'list' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-[#8B95A1]">
              <p className="text-[14px] font-bold">구좌를 선택해 주세요.</p>
            </div>
          ) : viewMode === 'edit_product' && editingProduct ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="px-4 lg:px-8 py-6 border-b border-[#F2F4F6] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 bg-[#F9FAFB]">
                <div>
                  <h3 className="font-bold text-[18px] lg:text-[20px] mb-1">제품 정보 관리</h3>
                  <p className="text-[12px] lg:text-[13px] text-[#8B95A1]">제품 정보와 노출 상태를 설정합니다.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                   <button 
                    onClick={() => { toggleVisibility(editingProduct._id, editingProduct.isVisible); setEditingProduct({...editingProduct, isVisible: !editingProduct.isVisible}); }}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 rounded-[10px] text-[12px] font-bold transition-all ${editingProduct.isVisible ? 'bg-[#E8F3FF] text-[#1B64DA]' : 'bg-gray-100 text-gray-500'}`}
                   >
                     {editingProduct.isVisible ? <><Eye className="w-4 h-4"/> 노출</> : <><EyeOff className="w-4 h-4"/> 숨김</>}
                   </button>
                   <button 
                    onClick={() => { 
                      const nextState = !editingProduct.showOnMain;
                      if (nextState) {
                        const mainCount = allProducts.filter(p => !!p.showOnMain).length;
                        if (mainCount >= 8) {
                          alert('메인 노출은 최대 8개까지만 가능합니다.');
                          return;
                        }
                      }
                      toggleMainExposure(editingProduct._id, editingProduct.showOnMain); 
                      setEditingProduct({...editingProduct, showOnMain: nextState}); 
                    }}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 rounded-[10px] text-[12px] font-bold transition-all ${editingProduct.showOnMain ? 'bg-[#FFF2F2] text-[#F04452]' : 'bg-gray-100 text-gray-500'}`}
                   >
                     {editingProduct.showOnMain ? <><Star className="w-4 h-4 fill-current"/> 메인</> : <><Star className="w-4 h-4"/> 메인</>}
                   </button>
                   <button 
                    onClick={() => { 
                      const nextState = !editingProduct.showOnHero;
                      if (nextState) {
                        const heroCount = allProducts.filter(p => !!p.showOnHero).length;
                        if (heroCount >= 4) {
                          alert('히어로 노출은 최대 4개까지만 가능합니다.');
                          return;
                        }
                      }
                      toggleHeroExposure(editingProduct._id, editingProduct.showOnHero); 
                      setEditingProduct({...editingProduct, showOnHero: nextState}); 
                    }}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 rounded-[10px] text-[12px] font-bold transition-all ${editingProduct.showOnHero ? 'bg-[#E8F3FF] text-[#3182F6]' : 'bg-gray-100 text-gray-500'}`}
                   >
                     {editingProduct.showOnHero ? <><Sparkles className="w-4 h-4 fill-current"/> 히어로</> : <><Sparkles className="w-4 h-4"/> 히어로</>}
                   </button>
                   <button 
                    onClick={() => { deleteProduct(editingProduct._id); setViewMode('list'); }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 bg-red-50 text-red-500 rounded-[10px] text-[12px] font-bold"
                   >
                     <Trash2 className="w-4 h-4"/> 삭제
                   </button>
                   <button onClick={() => setViewMode('list')} className="flex-1 sm:flex-none bg-[#F2F4F6] text-[#4E5968] font-bold text-[12px] px-3 py-2.5 rounded-[10px]">닫기</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                <div className="max-w-3xl space-y-8 pb-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">브랜드</label>
                      <select value={editingProduct.brand} onChange={(e) => setEditingProduct({...editingProduct, brand: e.target.value})} className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none font-bold">
                        {settings?.brands?.map((brand: string) => <option key={brand}>{brand}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">카테고리</label>
                      <select value={editingProduct.category} onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none font-bold">
                        {settings?.categories?.map((cat: string) => <option key={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">제품명</label>
                      <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none font-bold" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2 px-1">
                        <label className="block text-[13px] font-bold text-[#4E5968]">모델명</label>
                        <button
                          type="button"
                          onClick={handleSingleSmartFetch}
                          disabled={isSingleFetching}
                          className="text-[11px] font-extrabold text-[#3182F6] hover:text-[#1B64DA] bg-[#E8F3FF] hover:bg-[#D4E8FF] px-2.5 py-1 rounded-[6px] transition-colors flex items-center gap-1 cursor-pointer"
                          title="입력한 모델명으로 LG전자 공식 웹사이트에서 이미지, 제품명, 스펙 정보를 가져옵니다"
                        >
                          <Zap className="w-3 h-3" />
                          {isSingleFetching ? '수집 중...' : '스마트 수집'}
                        </button>
                      </div>
                      <input type="text" value={editingProduct.model} onChange={(e) => setEditingProduct({...editingProduct, model: e.target.value})} className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none" placeholder="예: AS195DWWA" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">공급가</label>
                      <input type="text" value={formatNumber(editingProduct.supplyPrice || '')} onChange={(e) => setEditingProduct({...editingProduct, supplyPrice: e.target.value.replace(/\D/g, '')})} className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] font-bold text-[#191F28] text-right" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">사은품 내역</label>
                      <input type="text" value={editingProduct.giftText || ''} onChange={(e) => setEditingProduct({...editingProduct, giftText: e.target.value})} className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] font-bold text-[#191F28]" placeholder="예: 현금 30만원 지원, 상품권 등" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">월 납입금</label>
                      <input type="text" value={formatNumber(editingProduct.price)} onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value.replace(/\D/g, '')})} className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] font-bold text-[#3182F6] text-right" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">제휴카드 혜택가</label>
                      <input type="text" value={formatNumber(editingProduct.discountPrice)} onChange={(e) => setEditingProduct({...editingProduct, discountPrice: e.target.value.replace(/\D/g, '')})} className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] font-bold text-[#F04452] text-right" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">라벨 (태그)</label>
                      <input type="text" value={editingProduct.tag || ''} onChange={(e) => setEditingProduct({...editingProduct, tag: e.target.value})} className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none" placeholder="예: BEST, HOT, 특가" />
                    </div>
                  </div>

                  {/* 제품 스펙 정보 설정 (표 형태) */}
                  <div className="pt-8 border-t border-[#F2F4F6]">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-bold text-[18px] text-[#191F28] flex items-center gap-2">
                          <Zap className="w-5 h-5 text-[#3182F6]" /> 제품 스펙 정보 (표 형태)
                        </h3>
                        <p className="text-[12px] text-[#8B95A1] mt-0.5">스마트 등록 시 자동 수집된 상세 스펙 정보 표입니다.</p>
                      </div>
                      <button 
                        onClick={() => {
                          const updated = [...(editingProduct.specifications || []), { category: '주요스펙', name: '', value: '' }];
                          setEditingProduct({ ...editingProduct, specifications: updated });
                        }}
                        className="bg-[#3182F6] text-white px-3.5 py-2 rounded-[10px] text-[12px] font-bold flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-4 h-4"/> 스펙 항목 추가
                      </button>
                    </div>

                    {(!editingProduct.specifications || editingProduct.specifications.length === 0) ? (
                      <div className="bg-[#F9FAFB] p-6 rounded-[20px] border border-[#E5E8EB] text-center text-[#8B95A1] text-[13px]">
                        등록된 상세 스펙 정보가 없습니다. [스펙 항목 추가] 버튼을 눌러 스펙 항목을 작성해 주세요.
                      </div>
                    ) : (
                      <div className="bg-[#F9FAFB] rounded-[20px] border border-[#E5E8EB] overflow-hidden shadow-sm">
                        <div className="max-h-[420px] overflow-y-auto hide-scrollbar">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-[#F2F4F6] sticky top-0 border-b border-[#E5E8EB] z-10">
                              <tr>
                                <th className="px-4 py-3 text-[12px] font-bold text-[#4E5968] w-[140px]">분류 (카테고리)</th>
                                <th className="px-4 py-3 text-[12px] font-bold text-[#4E5968] w-[200px]">스펙 항목명</th>
                                <th className="px-4 py-3 text-[12px] font-bold text-[#4E5968]">상세값</th>
                                <th className="px-4 py-3 text-[12px] font-bold text-[#4E5968] w-12 text-center">삭제</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E8EB] bg-white">
                              {editingProduct.specifications.map((spec: any, sIdx: number) => (
                                <tr key={sIdx} className="hover:bg-[#F9FAFB] transition-colors">
                                  <td className="px-3 py-2">
                                    <input 
                                      type="text"
                                      value={spec.category || ''}
                                      onChange={(e) => {
                                        const updated = [...editingProduct.specifications];
                                        updated[sIdx] = { ...updated[sIdx], category: e.target.value };
                                        setEditingProduct({ ...editingProduct, specifications: updated });
                                      }}
                                      className="w-full bg-[#F2F4F6] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px] font-bold text-[#3182F6]"
                                      placeholder="예: 크기, 용량"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input 
                                      type="text"
                                      value={spec.name || ''}
                                      onChange={(e) => {
                                        const updated = [...editingProduct.specifications];
                                        updated[sIdx] = { ...updated[sIdx], name: e.target.value };
                                        setEditingProduct({ ...editingProduct, specifications: updated });
                                      }}
                                      className="w-full bg-[#F2F4F6] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px] font-bold text-[#191F28]"
                                      placeholder="예: 전체 용량"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input 
                                      type="text"
                                      value={spec.value || ''}
                                      onChange={(e) => {
                                        const updated = [...editingProduct.specifications];
                                        updated[sIdx] = { ...updated[sIdx], value: e.target.value };
                                        setEditingProduct({ ...editingProduct, specifications: updated });
                                      }}
                                      className="w-full bg-[#F2F4F6] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px] text-[#4E5968]"
                                      placeholder="예: 870L"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <button 
                                      onClick={() => {
                                        const updated = [...editingProduct.specifications];
                                        updated.splice(sIdx, 1);
                                        setEditingProduct({ ...editingProduct, specifications: updated });
                                      }}
                                      className="text-red-500 hover:bg-red-50 p-1.5 rounded-[6px] transition-colors"
                                      title="스펙 항목 삭제"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 타사 비교 정보 편집 (스마트 등록이 아니거나 수동 설정 시) */}
                  {(!editingProduct.isSmartRegistered || editingProduct.showCompetitors) && (
                    <div className="pt-8 border-t border-[#F2F4F6]">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-[18px]">타사 비교 정보 설정</h3>
                        <button 
                          onClick={() => {
                            const defaultPartner = competitors[0] || { name: '타사', months: 60, type: '타사' };
                            const newComp = {
                              company: defaultPartner.name,
                              target: '',
                              price: '0',
                              period: (defaultPartner.months || 60) + '개월',
                              isOurs: defaultPartner.type === '자사',
                              benefit: ''
                            };
                            setEditingProduct({
                              ...editingProduct,
                              comparisons: [...(editingProduct.comparisons || []), newComp]
                            });
                          }}
                          className="bg-[#3182F6] text-white px-4 py-2 rounded-[10px] text-[13px] font-bold flex items-center gap-1 shadow-sm"
                        >
                          <Plus className="w-4 h-4"/> 비교 대상 추가
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {editingProduct.comparisons?.map((comp: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-4 bg-[#F9FAFB] p-5 rounded-[20px] border border-[#E5E8EB]">
                            <div className="w-[180px]">
                              <label className="block text-[11px] font-bold text-[#8B95A1] mb-1 px-1">비교 업체</label>
                              <select 
                                value={comp.company} 
                                onChange={(e) => {
                                  const partner = competitors.find(c => c.name === e.target.value);
                                  const updated = [...editingProduct.comparisons];
                                  updated[idx] = { 
                                    ...updated[idx], 
                                    company: e.target.value,
                                    isOurs: partner?.type === '자사',
                                    period: (partner?.months || 60) + '개월'
                                  };
                                  setEditingProduct({ ...editingProduct, comparisons: updated });
                                }}
                                className="w-full bg-white border border-[#D1D6DB] px-4 py-2.5 rounded-[10px] text-[14px] font-bold focus:outline-none"
                              >
                                {competitors.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                              </select>
                            </div>
                            <div className="w-[140px]">
                              <label className="block text-[11px] font-bold text-[#8B95A1] mb-1 px-1">월 납입금</label>
                              <input 
                                type="text" 
                                value={formatNumber(comp.price)} 
                                onChange={(e) => {
                                  const updated = [...editingProduct.comparisons];
                                  updated[idx] = { ...updated[idx], price: e.target.value.replace(/\D/g, '') };
                                  setEditingProduct({ ...editingProduct, comparisons: updated });
                                }}
                                className="w-full bg-white border border-[#D1D6DB] px-4 py-2.5 rounded-[10px] text-[14px] font-bold focus:outline-none text-right" 
                              />
                            </div>
                            <button 
                              onClick={() => {
                                const updated = [...editingProduct.comparisons];
                                updated.splice(idx, 1);
                                setEditingProduct({ ...editingProduct, comparisons: updated });
                              }}
                              className="text-red-500 hover:bg-red-50 p-2.5 rounded-[10px] mt-4"
                            >
                              <Trash2 className="w-5 h-5"/>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {editingProduct.isSmartRegistered && !editingProduct.showCompetitors && (
                    <div className="pt-4 text-center">
                      <button 
                        onClick={() => setEditingProduct({ ...editingProduct, showCompetitors: true })}
                        className="text-[12px] font-bold text-[#8B95A1] hover:text-[#3182F6] underline"
                      >
                        + 타사 비교 정보 설정 펼치기
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-8 pt-8">
                    {/* Thumbnail Images */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <label className="block text-[13px] font-bold text-[#4E5968]">썸네일 리스트 (여러 개 등록 가능)</label>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => addImageUrl('images')}
                            className="text-[12px] font-bold text-[#3182F6] flex items-center gap-1 hover:underline"
                          >
                            <Link className="w-3 h-3"/> URL 추가
                          </button>
                          <button 
                            onClick={() => thumbInputRef.current?.click()}
                            className="text-[12px] font-bold text-[#3182F6] flex items-center gap-1 hover:underline"
                          >
                            <Upload className="w-3 h-3"/> 이미지 업로드
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                         {(editingProduct.images || []).map((img: string, idx: number) => {
                          const isRepresentative = (editingProduct.image ? editingProduct.image === img : idx === 0);
                          return (
                            <div 
                              key={idx} 
                              onClick={() => setEditingProduct({ ...editingProduct, image: img })}
                              className={`aspect-square bg-[#F9FAFB] border rounded-[16px] overflow-hidden relative group cursor-pointer transition-all ${isRepresentative ? 'border-2 border-[#3182F6] shadow-sm' : 'border-[#E5E8EB] hover:border-[#3182F6]'}`}
                            >
                              <PreviewImage src={img} className="w-full h-full object-cover" />
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeImage('images', idx); }}
                                className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                title="이미지 삭제"
                              >
                                <X className="w-3 h-3"/>
                              </button>
                              <div className={`absolute bottom-0 left-0 right-0 text-[10px] text-center py-0.5 font-bold ${isRepresentative ? 'bg-[#3182F6] text-white' : 'bg-black/40 text-white/90 group-hover:bg-[#3182F6]/80'}`}>
                                {idx + 1}번 {isRepresentative ? '(대표)' : '지정'}
                              </div>
                            </div>
                          );
                        })}
                        <div 
                          onClick={() => thumbInputRef.current?.click()}
                          className="aspect-square bg-[#F9FAFB] border-2 border-dashed border-[#E5E8EB] rounded-[16px] flex flex-col items-center justify-center cursor-pointer hover:border-[#3182F6] hover:bg-[#F2F4F6] transition-all group"
                        >
                          <Plus className="w-6 h-6 text-[#D1D6DB] group-hover:text-[#3182F6] mb-1" />
                          <span className="text-[11px] text-[#8B95A1] group-hover:text-[#3182F6]">추가하기</span>
                        </div>
                      </div>
                    </div>

                    {/* Detail Images */}
                    <div className="space-y-4 pt-4 border-t border-[#F2F4F6]">
                      <div className="flex justify-between items-center px-1">
                        <label className="block text-[13px] font-bold text-[#4E5968]">상세 이미지 리스트 (여러 개 등록 가능)</label>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => addImageUrl('detailImages')}
                            className="text-[12px] font-bold text-[#3182F6] flex items-center gap-1 hover:underline"
                          >
                            <Link className="w-3 h-3"/> URL 추가
                          </button>
                          <button 
                            onClick={() => detailInputRef.current?.click()}
                            className="text-[12px] font-bold text-[#3182F6] flex items-center gap-1 hover:underline"
                          >
                            <Upload className="w-3 h-3"/> 이미지 업로드
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                         {(editingProduct.detailImages || []).map((img: string, idx: number) => (
                          <div key={idx} className="aspect-square bg-[#F9FAFB] border border-[#E5E8EB] rounded-[16px] overflow-hidden relative group">
                            <PreviewImage src={img} className="w-full h-full object-cover" />
                            <button 
                              onClick={() => removeImage('detailImages', idx)}
                              className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3"/>
                            </button>
                          </div>
                        ))}
                        <div 
                          onClick={() => detailInputRef.current?.click()}
                          className="aspect-square bg-[#F9FAFB] border-2 border-dashed border-[#E5E8EB] rounded-[16px] flex flex-col items-center justify-center cursor-pointer hover:border-[#3182F6] hover:bg-[#F2F4F6] transition-all group"
                        >
                          <Plus className="w-6 h-6 text-[#D1D6DB] group-hover:text-[#3182F6] mb-1" />
                          <span className="text-[11px] text-[#8B95A1] group-hover:text-[#3182F6]">추가하기</span>
                        </div>
                      </div>
                    </div>
                  </div>

<div className="pt-8 flex gap-4">
                    <button onClick={() => { setViewMode('list'); setEditingProduct(null); }} className="flex-1 bg-[#F2F4F6] text-[#4E5968] font-bold py-4 rounded-[20px] transition-all hover:bg-[#E5E8EB]">취소하기</button>
                    <button 
                      onClick={async () => {
                        if (!editingProduct) return;
                        try {
                          const sortedComparisons = [...(editingProduct.comparisons || [])].sort((a: any, b: any) => parseInt(a.price) - parseInt(b.price));
                          const productData = { ...editingProduct, comparisons: sortedComparisons };

                          if (editingProduct._id) {
                            const { _id, _creationTime, id, ...data } = productData;
                            await updateProduct({ id: _id, ...data });
                          } else {
                            const { _id, _creationTime, id, ...data } = productData;
                            await createProduct(data);
                          }
                          setViewMode('list');
                          setEditingProduct(null);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="flex-[2] bg-[#3182F6] text-white font-bold py-4 rounded-[20px] shadow-lg shadow-[#3182F6]/20 transition-transform active:scale-95"
                    >
                      정보 저장하기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : viewMode === 'edit_plan' && editingPlan ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="px-4 lg:px-8 py-6 border-b border-[#F2F4F6] flex justify-between items-center bg-[#F9FAFB]">
                <div>
                  <h3 className="font-bold text-[18px] lg:text-[20px] mb-1">구좌(상품군) 관리</h3>
                  <p className="text-[12px] text-[#8B95A1]">상품군별 명칭과 기본 가격을 설정합니다.</p>
                </div>
                <button onClick={() => setViewMode('list')} className="p-2 hover:bg-[#F2F4F6] rounded-full transition-colors">
                  <X className="w-6 h-6 text-[#4E5968]" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 bg-white no-scrollbar">
                <div className="max-w-xl mx-auto space-y-6">
                  <div>
                    <label className="block text-[13px] font-bold text-[#4E5968] mb-2">구좌 고유 ID (숫자)</label>
                    <input 
                      type="number" 
                      value={editingPlan.numericId} 
                      onChange={(e) => setEditingPlan({...editingPlan, numericId: parseInt(e.target.value)})} 
                      className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none font-bold"
                    />
                    <p className="mt-1 text-[11px] text-[#8B95A1]">이 숫자는 제품 등록 시 '구좌 ID'로 사용됩니다.</p>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-[#4E5968] mb-2">구좌명</label>
                    <input 
                      type="text" 
                      value={editingPlan.name} 
                      onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})} 
                      className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none font-bold"
                      placeholder="예: 스페셜 299 더블"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-bold text-[#4E5968] mb-2">기본 월납입금</label>
                      <input 
                        type="text" 
                        value={editingPlan.basePrice} 
                        onChange={(e) => setEditingPlan({...editingPlan, basePrice: formatNumber(e.target.value)})} 
                        className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#4E5968] mb-2">제휴카드 혜택가</label>
                      <input 
                        type="text" 
                        value={editingPlan.benefitPrice} 
                        onChange={(e) => setEditingPlan({...editingPlan, benefitPrice: formatNumber(e.target.value)})} 
                        className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none font-bold"
                      />
                    </div>
                    </div>
                  <div>
                    <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1 text-[#3182F6]">기본 구좌수 설정</label>
                    <input 
                      type="text" 
                      value={editingPlan.accountCount || ''} 
                      onChange={(e) => setEditingPlan({...editingPlan, accountCount: e.target.value})} 
                      className="w-full bg-[#F0F7FF] border border-[#3182F6]/20 px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none font-bold"
                      placeholder="예: 1구좌, 2구좌"
                    />
                    <p className="mt-1 text-[11px] text-[#8B95A1]">이 구좌수 정보는 해당 카테고리 모든 제품의 기본 정보로 활용됩니다.</p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-[16px]">
                    <div className="text-[14px] font-bold text-[#4E5968]">메인 페이지 노출 활성화</div>
                    <button 
                      onClick={() => setEditingPlan({...editingPlan, isMainActive: !editingPlan.isMainActive})}
                      className={`w-12 h-6 rounded-full transition-all relative ${editingPlan.isMainActive ? 'bg-[#3182F6]' : 'bg-[#D1D6DB]'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingPlan.isMainActive ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                  
                  <div className="pt-10 flex gap-4">
                    {editingPlan._id && (
                      <button 
                        onClick={async () => {
                          if (window.confirm('정말 이 구좌를 삭제하시겠습니까? 연결된 제품들이 표시되지 않을 수 있습니다.')) {
                            await deletePlan({ id: editingPlan._id });
                            setViewMode('list');
                          }
                        }}
                        className="flex-1 bg-red-50 text-red-500 font-bold py-4 rounded-[20px] hover:bg-red-100 transition-all"
                      >
                        삭제하기
                      </button>
                    )}
                    <button 
                      onClick={async () => {
                        if (!editingPlan.name) return alert('구좌명을 입력해주세요.');
                        try {
                          const { id, _id, ...rest } = editingPlan;
                          if (editingPlan._id) {
                            await updatePlan({ id: _id, ...rest });
                          } else {
                            await createPlan(rest);
                          }
                          setViewMode('list');
                        } catch (e) {
                          console.error(e);
                          alert('저장 중 오류가 발생했습니다.');
                        }
                      }}
                      className="flex-[2] bg-[#3182F6] text-white font-bold py-4 rounded-[20px] shadow-lg shadow-[#3182F6]/20 active:scale-95 transition-all"
                    >
                      저장하기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <input 
            type="file" 
            ref={thumbInputRef} 
            className="hidden" 
            accept="image/*" 
            multiple
            onChange={handleImageUpload} 
          />
          <input 
            type="file" 
            ref={detailInputRef} 
            className="hidden" 
            accept="image/*" 
            multiple
            onChange={handleDetailImageUpload} 
          />
          {/* 스마트 등록 선택 모달 (개별 모델명 직접 입력 또는 엑셀 업로드) */}
          {isSmartModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className="bg-white w-full max-w-lg rounded-[28px] p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-[#F2F4F6]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-[14px] bg-[#E8F3FF] text-[#3182F6] flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[18px] text-[#191F28]">스마트 제품 수집 등록</h3>
                      <p className="text-[12px] text-[#8B95A1]">개별 모델명 직접 입력 또는 엑셀 파일로 수집합니다.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsSmartModalOpen(false)}
                    className="p-2 hover:bg-[#F2F4F6] rounded-full text-[#8B95A1] transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5"/>
                  </button>
                </div>

                {/* 1. 개별 모델명 직접 입력 영역 */}
                <div className="space-y-3">
                  <label className="block text-[13px] font-bold text-[#4E5968] flex justify-between items-center">
                    <span>⚡ 개별 모델명 직접 입력</span>
                    <span className="text-[11px] font-normal text-[#8B95A1]">여러 개 입력 시 쉼표(,)나 줄바꿈 구분</span>
                  </label>
                  <textarea
                    rows={4}
                    value={directModelsText}
                    onChange={(e) => setDirectModelsText(e.target.value)}
                    placeholder="예시:&#10;AS195DWWA&#10;AS186LSAA, T18MX7, M344MB14&#10;FX23VVE + RD20WVE"
                    className="w-full bg-[#F9FAFB] border border-[#E5E8EB] focus:border-[#3182F6] p-4 rounded-[16px] text-[14px] font-mono focus:outline-none resize-none"
                  />
                  <button
                    onClick={handleDirectSmartRegister}
                    disabled={isDirectRegistering || !directModelsText.trim()}
                    className="w-full bg-gradient-to-r from-[#3182F6] to-[#1B64DA] disabled:opacity-50 text-white font-bold py-3.5 rounded-[16px] text-[14px] flex items-center justify-center gap-2 shadow-md shadow-[#3182F6]/20 transition-all cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    {isDirectRegistering ? '스마트 수집 등록 중...' : '입력한 모델명으로 스마트 등록 시작'}
                  </button>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-[#E5E8EB]"></div>
                  <span className="flex-shrink mx-4 text-[12px] font-bold text-[#8B95A1]">또는</span>
                  <div className="flex-grow border-t border-[#E5E8EB]"></div>
                </div>

                {/* 2. 엑셀 파일 업로드 & 양식 다운로드 */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={downloadSmartTemplate}
                    className="bg-[#F2F8FF] border border-[#3182F6]/30 text-[#3182F6] py-3 rounded-[14px] text-[13px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#E5F0FF] transition-all cursor-pointer"
                  >
                    <Zap className="w-4 h-4" /> 스마트 엑셀 양식
                  </button>
                  <button 
                    onClick={() => {
                      setIsSmartModalOpen(false);
                      smartExcelInputRef.current?.click();
                    }}
                    className="bg-white border border-[#E5E8EB] text-[#4E5968] hover:text-[#3182F6] hover:border-[#3182F6] py-3 rounded-[14px] text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4" /> 엑셀 파일 업로드
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
