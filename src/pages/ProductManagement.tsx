import React, { useState, useRef } from 'react';
import { Plus, Download, Upload, Copy, Trash2, Edit, MoveVertical, GripVertical, Eye, EyeOff, ChevronRight, Settings2, ImageIcon, CheckSquare, Square, Link, X, Star, Zap, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

interface Plan {
  mainCount: number;
  isMainActive: boolean;
  accountCount?: string;
}

interface SmartRegisterResult {
  model: string;
  success: boolean;
  name?: string;
  thumbnail?: string;
  specCount?: number;
  reason?: string;
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
  const dbLandings = useQuery(api.landings.get) || [];
  
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
  const [sortConfig, setSortConfig] = useState<{ 
    key: 'createdAt' | 'brand' | 'category' | 'supplyPrice' | 'price' | 'order' | null; 
    direction: 'asc' | 'desc'; 
  }>({ key: 'order', direction: 'asc' });

  const thumbInputRef = useRef<HTMLInputElement>(null);
  const detailInputRef = useRef<HTMLInputElement>(null);
  const smartExcelInputRef = useRef<HTMLInputElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const scrapeProductInfoAction = useAction(api.crawler.scrapeProductInfo);
  const fetchImageBase64Action = useAction(api.images.fetchImageBase64);
  const [smartProgress, setSmartProgress] = useState<{ current: number; total: number; currentModel: string } | null>(null);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [draggedThumbIdx, setDraggedThumbIdx] = useState<number | null>(null);
  const [dragOverThumbIdx, setDragOverThumbIdx] = useState<number | null>(null);
  const [draggedDetailIdx, setDraggedDetailIdx] = useState<number | null>(null);
  const [dragOverDetailIdx, setDragOverDetailIdx] = useState<number | null>(null);

  const [isSmartModalOpen, setIsSmartModalOpen] = useState(false);
  const [directModelsText, setDirectModelsText] = useState('');
  const [isDirectRegistering, setIsDirectRegistering] = useState(false);
  const [smartResultModal, setSmartResultModal] = useState<{
    isOpen: boolean;
    total: number;
    successCount: number;
    failCount: number;
    results: SmartRegisterResult[];
  } | null>(null);

  const [downloadProgress, setDownloadProgress] = useState<{
    current: number;
    total: number;
    message: string;
  } | null>(null);

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
    const smartResults: SmartRegisterResult[] = [];

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

        if (!scraped.success && !scraped.thumbnail && (!scraped.specifications || scraped.specifications.length === 0)) {
          failCount++;
          smartResults.push({
            model: rawModel,
            success: false,
            reason: 'LG 공식 사이트에서 해당 모델 페이지를 찾지 못했거나 정보를 가져오지 못함 (404 미등록 모델)'
          });
          continue;
        }

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
            landingPages: ['/package60', '/special_new'],
            comparisons: [],
            accountCount: planAccount
          });
        }

        successCount++;
        smartResults.push({
          model: rawModel,
          success: true,
          name: scrapedName,
          thumbnail: scrapedThumb,
          specCount: scraped.specifications?.length || 0
        });
      } catch (err) {
        console.error(`Direct smart register error for ${rawModel}:`, err);
        failCount++;
        smartResults.push({
          model: rawModel,
          success: false,
          reason: '수집 처리 중 네트워크/서버 오류 발생'
        });
      }
    }

    setSmartProgress(null);
    setIsDirectRegistering(false);
    setIsSmartModalOpen(false);
    setDirectModelsText('');

    setSmartResultModal({
      isOpen: true,
      total: modelList.length,
      successCount,
      failCount,
      results: smartResults
    });
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
      if (sortConfig.key === 'createdAt') {
        const aTime = a._creationTime || 0;
        const bTime = b._creationTime || 0;
        return sortConfig.direction === 'desc' ? bTime - aTime : aTime - bTime;
      }
      if (sortConfig.key === 'order') {
        const orderDiff = (a.order ?? 99999) - (b.order ?? 99999);
        if (orderDiff !== 0) return orderDiff;
        return (b._creationTime || 0) - (a._creationTime || 0);
      }
      if (sortConfig.key === 'price') {
        const aNum = parseInt(String((a as any)[sortConfig.key] || '0').replace(/\D/g, ''), 10);
        const bNum = parseInt(String((b as any)[sortConfig.key] || '0').replace(/\D/g, ''), 10);
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      if (sortConfig.key === 'supplyPrice') {
        const aVal = (a as any).supplier || (a as any).supplyPrice || "";
        const bVal = (b as any).supplier || (b as any).supplyPrice || "";
        if (sortConfig.direction === 'asc') return aVal.localeCompare(bVal);
        return bVal.localeCompare(aVal);
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
        const nextImages = [...(editingProduct.images || []), ...uploadedUrls];
        const nextMainImage = (!editingProduct.image || editingProduct.image.trim() === '')
          ? (nextImages[0] || '')
          : editingProduct.image;
        setEditingProduct({ 
          ...editingProduct, 
          images: nextImages,
          image: nextMainImage
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
      const nextList = [...(editingProduct[type] || []), url];
      const nextMainImage = (type === 'images' && (!editingProduct.image || editingProduct.image.trim() === ''))
        ? (nextList[0] || '')
        : editingProduct.image;
      setEditingProduct({
        ...editingProduct,
        [type]: nextList,
        ...(type === 'images' ? { image: nextMainImage } : {})
      });
    }
  };

  const handleThumbDrop = (targetIdx: number) => {
    if (draggedThumbIdx === null || draggedThumbIdx === targetIdx || !editingProduct) {
      setDraggedThumbIdx(null);
      setDragOverThumbIdx(null);
      return;
    }
    const list = [...(editingProduct.images || [])];
    const [moved] = list.splice(draggedThumbIdx, 1);
    list.splice(targetIdx, 0, moved);

    // 1번 위치(0번 인덱스) 이미지가 자동으로 대표 썸네일(editingProduct.image)이 되도록 설정
    setEditingProduct({
      ...editingProduct,
      images: list,
      image: list[0] || ''
    });
    setDraggedThumbIdx(null);
    setDragOverThumbIdx(null);
  };

  const handleDetailDrop = (targetIdx: number) => {
    if (draggedDetailIdx === null || draggedDetailIdx === targetIdx || !editingProduct) {
      setDraggedDetailIdx(null);
      setDragOverDetailIdx(null);
      return;
    }
    const list = [...(editingProduct.detailImages || [])];
    const [moved] = list.splice(draggedDetailIdx, 1);
    list.splice(targetIdx, 0, moved);

    setEditingProduct({
      ...editingProduct,
      detailImages: list
    });
    setDraggedDetailIdx(null);
    setDragOverDetailIdx(null);
  };

  const removeImage = (type: 'images' | 'detailImages', index: number) => {
    const updated = [...(editingProduct[type] || [])];
    const removedItem = updated[index];
    updated.splice(index, 1);

    let newMainImage = editingProduct.image;
    if (type === 'images') {
      if (editingProduct.image === removedItem || !updated.includes(editingProduct.image)) {
        newMainImage = updated[0] || '';
      }
    }

    setEditingProduct({ 
      ...editingProduct, 
      [type]: updated,
      ...(type === 'images' ? { image: newMainImage } : {})
    });
  };

  const handleAddProduct = () => {
    const curPlan = plans.find(p => p.id === selectedPlanId) || selectedPlan;
    const planAccount = curPlan?.accountCount || (selectedPlanId ? `${selectedPlanId}구좌` : '1구좌');
    const is60 = [5, 6, 7, 8].includes(selectedPlanId ?? 0) || (curPlan?.name && curPlan.name.includes('60패키지'));
    
    let defaultLandings = ['/package60', '/package_up', '/special60', '/careplus', '/triplecare', '/special_new'];
    if (!is60) {
      if (curPlan?.name?.includes('리빙')) {
        defaultLandings = ['/living', '/living2'];
      } else if (curPlan?.name?.includes('스페셜')) {
        defaultLandings = ['/special', '/special2', '/'];
      } else {
        defaultLandings = ['/'];
      }
    }

    setEditingProduct({ 
      planId: selectedPlanId, 
      accountCount: planAccount,
      brand: '삼성전자', 
      category: 'TV/시청각', 
      name: '', 
      model: '', 
      price: curPlan?.basePrice ? String(curPlan.basePrice).replace(/\D/g, '') : '0', 
      discountPrice: curPlan?.benefitPrice ? String(curPlan.benefitPrice).replace(/\D/g, '') : '0',
      isVisible: true,
      image: '',
      images: [],
      detailImage: '',
      detailImages: [],
      landingPages: defaultLandings,
      comparisons: [] 
    });
    setViewMode('edit_product');
  };

  const toggleSort = (key: 'createdAt' | 'brand' | 'category' | 'supplyPrice' | 'price' | 'order') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (key === 'createdAt') {
      direction = (sortConfig.key === 'createdAt' && sortConfig.direction === 'desc') ? 'asc' : 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'asc') {
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
    const smartResults: SmartRegisterResult[] = [];

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
          smartResults.push({
            model: prod.model,
            success: true,
            name: finalName,
            thumbnail: finalThumb,
            specCount: scraped.specifications?.length || 0
          });
        } else {
          failCount++;
          smartResults.push({
            model: prod.model,
            success: false,
            reason: 'LG 공식 사이트에서 수집 가능한 상세 스펙 또는 썸네일 정보를 찾지 못함'
          });
        }
      } catch (err) {
        console.error(err);
        failCount++;
        smartResults.push({
          model: prod.model,
          success: false,
          reason: '스마트 정보 동기화 중 오류 발생'
        });
      }
    }

    setSmartProgress(null);
    setSmartResultModal({
      isOpen: true,
      total: targets.length,
      successCount,
      failCount,
      results: smartResults
    });
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

    setDraggedItemIndex(null);
    setSortConfig({ key: 'order', direction: 'asc' });

    try {
      await updateProductOrder({ orders });
    } catch (e) {
      console.error('Failed to update product order:', e);
    }
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
      ['구좌', '브랜드', '카테고리', '모델명1', '제품명1', '모델명2', '제품명2', '참고 URL'],
      ['1구좌', 'LG전자', '냉장고', 'H875GBB012', 'LG 디오스 오브제컬렉션 냉장고', '', '', 'https://www.lge.co.kr/refrigerators/h875gbb012'],
      ['2구좌', 'LG전자', '세탁기/건조기', 'FX23VVE', 'LG 트롬 세탁기', 'RD20WVE', 'LG 트롬 건조기', 'https://www.lge.co.kr/washers/fx23vve']
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "스마트등록양식");
    XLSX.writeFile(wb, "스마트등록_양식.xlsx");
  };

  const handleDownloadSelectedProducts = async () => {
    if (selectedIds.length === 0) {
      alert("다운로드할 제품을 먼저 선택해 주세요.");
      return;
    }

    const orderedSelectedProducts = [
      ...filteredProducts.filter(p => selectedIds.includes(p._id)),
      ...(allProducts || []).filter(p => selectedIds.includes(p._id) && !filteredProducts.some(fp => fp._id === p._id))
    ];

    if (orderedSelectedProducts.length === 0) {
      alert("다운로드할 제품 데이터를 찾을 수 없습니다.");
      return;
    }

    const sanitizeFileName = (str: string) => {
      return (str || '')
        .replace(/[\\/:*?"<>|\r\n\t]/g, '_')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const getAccountText = (product: any) => {
      if (product.accountCount && product.accountCount.trim()) return product.accountCount.trim();
      const plan = plans.find(p => p.id === product.planId);
      if (plan?.accountCount && plan.accountCount.trim()) return plan.accountCount.trim();
      if (plan?.name && plan.name.trim()) return plan.name.trim();
      return `${product.planId}구좌`;
    };

    setDownloadProgress({ 
      current: 0, 
      total: orderedSelectedProducts.length, 
      message: "선택한 제품 정보 및 이미지 다운로드 준비 중..." 
    });

    try {
      const zip = new JSZip();
      const rows: any[][] = [];

      for (let i = 0; i < orderedSelectedProducts.length; i++) {
        const product = orderedSelectedProducts[i];
        const no = i + 1;
        const accountText = getAccountText(product);
        const brand = product.brand || '';
        const category = product.category || '';
        const productName = product.name || '';
        const model = product.model || '';

        const rawImageUrl = product.image || (product.images && product.images[0]) || '';
        let imageFileName = '(이미지 없음)';

        if (rawImageUrl) {
          try {
            setDownloadProgress({
              current: i + 1,
              total: orderedSelectedProducts.length,
              message: `썸네일 이미지 다운로드 중... (${i + 1}/${orderedSelectedProducts.length})`
            });

            // 1. Convex Action을 통해 서버 사이드 다운로드 (CORS 완벽 해결)
            let base64Data: string | null = null;
            let ext = '.jpg';

            try {
              const res = await fetchImageBase64Action({ url: rawImageUrl });
              if (res.success && res.base64) {
                base64Data = res.base64;
                const contentType = res.contentType || '';
                if (contentType.includes('png')) ext = '.png';
                else if (contentType.includes('webp')) ext = '.webp';
                else if (contentType.includes('gif')) ext = '.gif';
                else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
                else {
                  const match = rawImageUrl.split('?')[0].match(/\.(jpg|jpeg|png|webp|gif)$/i);
                  if (match) ext = `.${match[1].toLowerCase()}`;
                }
              } else {
                console.warn(`[1차 서버 액션 실패] ${productName}:`, res.error);
              }
            } catch (actionErr) {
              console.warn(`[1차 서버 액션 에러] ${productName}:`, actionErr);
            }

            // 2. 만약 서버 액션 실패 시 브라우저 직접 fetch 시도
            if (!base64Data) {
              try {
                const response = await fetch(rawImageUrl, { mode: 'cors' });
                if (response.ok) {
                  const blob = await response.blob();
                  const contentType = response.headers.get('content-type') || '';
                  if (contentType.includes('png')) ext = '.png';
                  else if (contentType.includes('webp')) ext = '.webp';
                  else if (contentType.includes('gif')) ext = '.gif';
                  else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
                  else {
                    const match = rawImageUrl.split('?')[0].match(/\.(jpg|jpeg|png|webp|gif)$/i);
                    if (match) ext = `.${match[1].toLowerCase()}`;
                  }
                  const safeAccount = sanitizeFileName(accountText) || `${product.planId}구좌`;
                  const safeName = sanitizeFileName(productName) || '제품명';
                  const safeModel = sanitizeFileName(model) || '모델명';
                  imageFileName = `${no}_${safeAccount}_${safeName}_${safeModel}${ext}`;
                  zip.file(imageFileName, blob);
                }
              } catch (fetchErr) {
                console.warn(`[2차 브라우저 fetch 실패] ${productName}:`, fetchErr);
              }
            }

            // 3. 브라우저 Image/Canvas 렌더링 fallback 시도
            if (!imageFileName || imageFileName === '(이미지 없음)' || imageFileName === '(다운로드 실패)') {
              if (base64Data) {
                const safeAccount = sanitizeFileName(accountText) || `${product.planId}구좌`;
                const safeName = sanitizeFileName(productName) || '제품명';
                const safeModel = sanitizeFileName(model) || '모델명';
                imageFileName = `${no}_${safeAccount}_${safeName}_${safeModel}${ext}`;
                zip.file(imageFileName, base64Data, { base64: true });
              } else {
                try {
                  const canvasResult = await new Promise<{ base64: string; ext: string } | null>((resolve) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                      try {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth || 400;
                        canvas.height = img.naturalHeight || 400;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return resolve(null);
                        ctx.drawImage(img, 0, 0);
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                        resolve({ base64: dataUrl.split(',')[1], ext: '.jpg' });
                      } catch (e) {
                        resolve(null);
                      }
                    };
                    img.onerror = () => resolve(null);
                    img.src = rawImageUrl;
                    // Timeout 3초
                    setTimeout(() => resolve(null), 3000);
                  });

                  if (canvasResult) {
                    const safeAccount = sanitizeFileName(accountText) || `${product.planId}구좌`;
                    const safeName = sanitizeFileName(productName) || '제품명';
                    const safeModel = sanitizeFileName(model) || '모델명';
                    imageFileName = `${no}_${safeAccount}_${safeName}_${safeModel}${canvasResult.ext}`;
                    zip.file(imageFileName, canvasResult.base64, { base64: true });
                  } else {
                    imageFileName = '(다운로드 실패)';
                  }
                } catch (e) {
                  imageFileName = '(다운로드 실패)';
                }
              }
            }
          } catch (err) {
            console.error(`썸네일 다운로드 최종 실패 (${productName}):`, err);
            imageFileName = '(다운로드 실패)';
          }
        }

        // 1. 제품리스트(엑셀) - 썸네일 / 구좌 / 브랜드 / 카테고리 / 제품명 / 모델명
        rows.push([
          imageFileName,
          accountText,
          brand,
          category,
          productName,
          model
        ]);
      }

      setDownloadProgress({
        current: orderedSelectedProducts.length,
        total: orderedSelectedProducts.length,
        message: "엑셀 파일 및 압축 파일(ZIP) 생성 중..."
      });

      const headers = ['썸네일', '구좌', '브랜드', '카테고리', '제품명', '모델명'];
      const wsData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [
        { wch: 35 },
        { wch: 12 },
        { wch: 15 },
        { wch: 18 },
        { wch: 35 },
        { wch: 25 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "선택제품리스트");
      const excelArrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

      zip.file(`제품리스트_${dateStr}.xlsx`, excelArrayBuffer);

      const zipContent = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        setDownloadProgress({
          current: orderedSelectedProducts.length,
          total: orderedSelectedProducts.length,
          message: `ZIP 압축 중... (${Math.round(metadata.percent)}%)`
        });
      });

      const downloadUrl = URL.createObjectURL(zipContent);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `제품정보_선택_${dateStr}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error("다운로드 에러:", err);
      alert("다운로드 중 오류가 발생했습니다: " + (err?.message || ""));
    } finally {
      setDownloadProgress(null);
    }
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
        let accountIdx = headers.findIndex(h => h.includes('구좌') || h.includes('플랜'));
        let brandIdx = headers.findIndex(h => h.includes('브랜드') || h.includes('제조사'));
        let categoryIdx = headers.findIndex(h => h.includes('카테고리') || h.includes('분류'));
        let model1Idx = headers.findIndex(h => h === '모델명1' || h === '모델1' || h.includes('모델명1'));
        let name1Idx = headers.findIndex(h => h === '제품명1' || h === '상품명1' || h.includes('제품명1'));
        let model2Idx = headers.findIndex(h => h === '모델명2' || h === '모델2' || h.includes('모델명2'));
        let name2Idx = headers.findIndex(h => h === '제품명2' || h === '상품명2' || h.includes('제품명2'));
        let urlIdx = headers.findIndex(h => h.includes('URL') || h.includes('url') || h.includes('참고') || h.includes('링크'));

        // 레거시 양식 또는 헤더명 fallback
        if (model1Idx === -1) {
          model1Idx = headers.findIndex(h => h.includes('모델'));
        }
        if (headers.length >= 8) {
          if (accountIdx === -1) accountIdx = 0;
          if (brandIdx === -1) brandIdx = 1;
          if (categoryIdx === -1) categoryIdx = 2;
          if (model1Idx === -1) model1Idx = 3;
          if (name1Idx === -1) name1Idx = 4;
          if (model2Idx === -1) model2Idx = 5;
          if (name2Idx === -1) name2Idx = 6;
          if (urlIdx === -1) urlIdx = 7;
        } else {
          if (accountIdx === -1 && headers.length > 0 && headers[0].includes('구좌')) accountIdx = 0;
          if (urlIdx === -1) urlIdx = headers.findIndex(h => h.toLowerCase().includes('http') || h.includes('url') || h.includes('URL'));
        }

        const rows = excelData.slice(1);
        const validRows = rows.filter(r => {
          if (!r) return false;
          const m1 = model1Idx !== -1 ? String(r[model1Idx] || '').trim() : '';
          const m2 = model2Idx !== -1 ? String(r[model2Idx] || '').trim() : '';
          return Boolean(m1 || m2);
        });

        if (validRows.length === 0) {
          alert("엑셀 파일에 유효한 모델명이 작성된 행이 없습니다.");
          return;
        }

        setSmartProgress({ current: 0, total: validRows.length, currentModel: '시작 중...' });

        let successCount = 0;
        let failCount = 0;
        const smartResults: SmartRegisterResult[] = [];

        for (let i = 0; i < validRows.length; i++) {
          const row = validRows[i];
          const rawAccount = accountIdx !== -1 ? String(row[accountIdx] || '').trim() : '';
          const rawBrand = brandIdx !== -1 ? String(row[brandIdx] || '').trim() : '';
          const rawCategory = categoryIdx !== -1 ? String(row[categoryIdx] || '').trim() : '';
          const rawModel1 = model1Idx !== -1 ? String(row[model1Idx] || '').trim() : '';
          const rawName1 = name1Idx !== -1 ? String(row[name1Idx] || '').trim() : '';
          const rawModel2 = model2Idx !== -1 ? String(row[model2Idx] || '').trim() : '';
          const rawName2 = name2Idx !== -1 ? String(row[name2Idx] || '').trim() : '';
          const refUrl = urlIdx !== -1 ? String(row[urlIdx] || '').trim() : '';

          let combinedModel = '';
          if (rawModel1 && rawModel2) {
            combinedModel = `${rawModel1} + ${rawModel2}`;
          } else {
            combinedModel = rawModel1 || rawModel2;
          }

          if (!combinedModel) continue;

          setSmartProgress({ current: i + 1, total: validRows.length, currentModel: combinedModel });

          // 플랜 매핑 (사용자가 현재 선택한 구좌 탭에 기본 등록, 플랜명이 명시된 경우만 이동)
          let targetPlan = selectedPlan;
          if (rawAccount) {
            // 플랜 고유 이름(예: '스페셜299-UP가전', '리빙144')이 정확히 적힌 경우만 해당 플랜으로 매칭
            const matchedByName = plans.find(p => p.name === rawAccount || (rawAccount.length >= 5 && p.name?.toLowerCase() === rawAccount.toLowerCase()));
            if (matchedByName) {
              targetPlan = matchedByName;
            } else {
              // '1구좌', '2구좌', '3구좌', '4구좌' 등은 현재 선택된 플랜(selectedPlan)에 등록!
              targetPlan = selectedPlan;
            }
          }

          const targetPlanId = targetPlan?.id ?? (selectedPlanId ?? plans[0]?.id);
          const rawAccountNum = parseInt(rawAccount.replace(/\D/g, '') || '1', 10);
          const planBaseNum = parseInt(String(targetPlan?.basePrice || '29900').replace(/\D/g, '') || '29900', 10);
          const planBenefitNum = parseInt(String(targetPlan?.benefitPrice || '0').replace(/\D/g, '') || '0', 10);

          // 만약 1구좌 플랜인데 2구좌, 3구좌 상품인 경우 구좌 수량에 맞춰 자동 계산
          const isSingleAccountPlan = targetPlan?.accountCount === '1구좌';
          const calculatedPrice = isSingleAccountPlan && rawAccountNum > 1 ? String(planBaseNum * rawAccountNum) : String(planBaseNum);
          const calculatedBenefitPrice = isSingleAccountPlan && rawAccountNum > 1 ? String(planBenefitNum * rawAccountNum) : String(planBenefitNum);

          const planPrice = calculatedPrice;
          const planBenefitPrice = calculatedBenefitPrice;
          const planAccount = rawAccount ? (rawAccount.includes('구좌') ? rawAccount : `${rawAccount}구좌`) : (targetPlan?.accountCount || (targetPlanId + "구좌"));

          try {
            const scraped = await scrapeProductInfoAction({
              model: combinedModel,
              price: planPrice,
              refUrl
            });

            const hasScrapedInfo = Boolean(scraped.success || scraped.thumbnail || (scraped.specifications && scraped.specifications.length > 0));
            const hasUserProvidedInfo = Boolean(rawName1 || rawName2 || rawBrand || rawCategory);

            if (!hasScrapedInfo && !hasUserProvidedInfo) {
              failCount++;
              smartResults.push({
                model: combinedModel,
                success: false,
                reason: `${rawBrand || '공식'} 제품 페이지를 찾지 못했거나 참고 URL 수집에 실패했습니다 (URL 형식 또는 모델명 확인 필요)`
              });
              continue;
            }

            // 제품명 결정 (엑셀에서 입력한 제품명이 있으면 최우선 반영)
            let finalName = '';
            if (rawModel1 && rawModel2) {
              if (rawName1 && rawName2) {
                finalName = `${rawName1} + ${rawName2}`;
              } else if (rawName1 && !rawName2) {
                const scraped2 = (scraped as any).modelResults?.[1]?.name || (scraped.name?.split('+')[1]?.trim()) || rawModel2;
                finalName = `${rawName1} + ${scraped2}`;
              } else if (!rawName1 && rawName2) {
                const scraped1 = (scraped as any).modelResults?.[0]?.name || (scraped.name?.split('+')[0]?.trim()) || rawModel1;
                finalName = `${scraped1} + ${rawName2}`;
              } else {
                finalName = scraped.name || combinedModel;
              }
            } else {
              const inputName = rawName1 || rawName2;
              if (inputName) {
                finalName = inputName;
              } else {
                finalName = scraped.name || combinedModel;
              }
            }

            const finalBrand = rawBrand || scraped.brand || 'LG전자';
            const finalCategory = rawCategory || scraped.category || '가전';
            const scrapedThumb = scraped.thumbnail || undefined;
            const scrapedThumbs = scraped.thumbnails && scraped.thumbnails.length > 0 ? scraped.thumbnails : (scraped.thumbnail ? [scraped.thumbnail] : []);

            const existingProduct = allProducts?.find(
              p => p.planId === targetPlanId && p.model?.trim().toLowerCase() === combinedModel.toLowerCase()
            );

            if (existingProduct) {
              await updateProduct({
                id: existingProduct._id,
                brand: finalBrand,
                category: finalCategory,
                model: scraped.model || combinedModel,
                name: finalName || existingProduct.name || combinedModel,
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
                planId: targetPlanId,
                brand: finalBrand,
                category: finalCategory,
                model: scraped.model || combinedModel,
                name: finalName || combinedModel,
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
            smartResults.push({
              model: combinedModel,
              success: true,
              name: finalName,
              thumbnail: scrapedThumb,
              specCount: scraped.specifications?.length || 0
            });
          } catch (err) {
            console.error(`Smart register error for ${combinedModel}:`, err);
            failCount++;
            smartResults.push({
              model: combinedModel,
              success: false,
              reason: '수집 처리 중 네트워크/서버 오류 발생'
            });
          }
        }

        setSmartProgress(null);
        setSmartResultModal({
          isOpen: true,
          total: validRows.length,
          successCount,
          failCount,
          results: smartResults
        });
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
        const excelResults: SmartRegisterResult[] = [];
        
        for (let i = 0; i < rows.length; i++) {
          setUploadProgress(prev => ({ ...prev, current: i + 1 }));
          const row = rows[i];
          const modelName = String(row[4] || row[3] || `엑셀 ${i + 2}행`).trim();
          try {
            if (!row || !row[3]) {
              failCount++;
              excelResults.push({
                model: modelName,
                success: false,
                reason: `엑셀 ${i + 2}행에 필수 항목(제품명)이 누락되었습니다.`
              });
              continue; 
            }

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
            const accountCount = planVal;
            
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
            excelResults.push({
              model: model || name,
              success: true,
              name,
              thumbnail: thumbnailUrl
            });
          } catch (rowErr) {
            console.error(`Row ${i + 2} processing error:`, rowErr, row);
            failCount++;
            excelResults.push({
              model: modelName,
              success: false,
              reason: `엑셀 ${i + 2}행 데이터 처리 및 저장 실패`
            });
          }
        }

        setIsUploading(false);
        setSmartResultModal({
          isOpen: true,
          total: rows.length,
          successCount,
          failCount,
          results: excelResults
        });
      } catch (err) {
        console.error("Excel upload general error:", err);
        setIsUploading(false);
        alert("엑셀 파일 처리 중 오류가 발생했습니다. 양식을 다시 확인해 주세요.");
      } finally {
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div ref={mainContainerRef} className="relative">
      {/* Upload Loading Overlay */}
      {isUploading && (
        <div className="adm-modal-overlay !z-[1000]">
          <div className="adm-modal p-8 flex flex-col items-center max-w-[320px] text-center">
            <div className="w-10 h-10 border-[3px] border-[#295e52] border-t-transparent rounded-full animate-spin mb-5"></div>
            <h3 className="font-bold text-[17px] text-[#263d36] mb-1">제품 일괄 등록 중...</h3>
            <p className="text-[#86918a] text-[12.5px] mb-5">잠시만 기다려 주세요.</p>
            <div className="adm-bar-track w-full">
              <span style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }} />
            </div>
            <div className="mt-2.5 text-[12px] font-bold font-mono text-[#45554e]">
              {uploadProgress.current} / {uploadProgress.total}
            </div>
          </div>
        </div>
      )}

      {/* Smart Registration Progress Overlay */}
      {smartProgress && (
        <div className="adm-modal-overlay !z-[1000]">
          <div className="adm-modal p-8 flex flex-col items-center max-w-[360px] text-center">
            <div className="relative mb-4">
              <div className="w-14 h-14 border-[3px] border-[#295e52] border-t-transparent rounded-full animate-spin"></div>
              <Sparkles className="w-6 h-6 text-[#295e52] absolute inset-0 m-auto animate-pulse" />
            </div>
            <h3 className="font-bold text-[17px] text-[#263d36] mb-1">스마트 자동 수집 등록 중...</h3>
            <p className="text-[#295e52] font-bold font-mono text-[13px] mb-2 truncate max-w-full px-2">
              {smartProgress.currentModel}
            </p>
            <p className="text-[#86918a] text-[12px] mb-5 leading-relaxed">
              공식 사이트에서 썸네일, 제품명, 카테고리,<br />상세 스펙 정보를 수집하여 매칭하고 있습니다.
            </p>
            <div className="adm-bar-track w-full mb-2">
              <span style={{ width: `${(smartProgress.current / smartProgress.total) * 100}%` }} />
            </div>
            <div className="text-[12px] font-bold font-mono text-[#45554e]">
              {smartProgress.current} / {smartProgress.total} 건 진행 중
            </div>
          </div>
        </div>
      )}

      {/* Page Heading */}
      <div className="adm-page-heading">
        <div>
          <div className="adm-eyebrow">OPERATIONS · PRODUCTS</div>
          <h1>제품 관리</h1>
          <p>
            구좌(상품군)별 결합 가전 라인업, 노출 순서, 대표 썸네일 및 상세 스펙을 통합 관리합니다. (총 등록 제품{' '}
            <strong className="text-[#263d36]">{allProducts?.length || 0}</strong>개)
          </p>
        </div>

        <div className="adm-heading-buttons">
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
          <button type="button" onClick={downloadSmartTemplate} className="adm-btn">
            <Zap />
            <span>스마트 양식</span>
          </button>
          <button type="button" onClick={() => setIsSmartModalOpen(true)} className="adm-btn sage">
            <Sparkles />
            <span>스마트 수집 등록</span>
          </button>
          <button type="button" onClick={downloadTemplate} className="adm-btn">
            <Download />
            <span>기본 양식</span>
          </button>
          <button type="button" onClick={() => excelInputRef.current?.click()} className="adm-btn">
            <Upload />
            <span>엑셀 업로드</span>
          </button>
          <button type="button" onClick={handleAddProduct} className="adm-btn primary">
            <Plus />
            <span>개별 제품 등록</span>
          </button>
        </div>
      </div>

      {/* 2-Column Layout: Left Plan Nav + Right Product Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-5 items-start">
        {/* Left: Plan List */}
        <div className="adm-panel">
          <div className="p-4 border-b border-[#edf0e7] bg-[#f8f9f5] flex justify-between items-center">
            <div>
              <h3 className="font-bold text-[13.5px] text-[#263d36]">구좌 · 상품군 목록</h3>
              <p className="text-[11px] text-[#86918a] mt-0.5">드래그하여 순서 변경</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingPlan({
                  name: '',
                  basePrice: '',
                  benefitPrice: '',
                  mainCount: 4,
                  isMainActive: true,
                  accountCount: '1구좌',
                  numericId: (plans[plans.length - 1]?.id || 0) + 1,
                });
                setViewMode('edit_plan');
              }}
              className="adm-btn primary small !px-2.5"
              title="구좌 추가"
            >
              <Plus />
            </button>
          </div>

          <div className="flex lg:flex-col overflow-x-auto lg:overflow-y-auto p-2.5 gap-1.5 hide-scrollbar">
            {plans.map((plan, idx) => {
              const isSelected = activePlanId === plan.id;
              return (
                <div
                  key={plan._id || plan.id}
                  draggable
                  onDragStart={() => handlePlanDragStart(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handlePlanDrop(idx)}
                  onDragEnd={() => setDraggedPlanIndex(null)}
                  onClick={() => {
                    setSelectedPlanId(plan.id);
                    setViewMode('list');
                    setSelectedIds([]);
                  }}
                  className={`flex-none lg:w-full p-3 rounded-[9px] cursor-pointer border transition-all whitespace-nowrap lg:whitespace-normal flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-[#eaf1e4] text-[#295e52] border-[#cfe0c7]'
                      : 'bg-white border-transparent hover:bg-[#f6f8f3] text-[#45554e]'
                  } ${draggedPlanIndex === idx ? 'opacity-40 border-dashed border-[#295e52]' : ''}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <MoveVertical className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#295e52]/60' : 'text-[#b7c2b0]'}`} />
                      <div className={`text-[13px] truncate ${isSelected ? 'font-bold text-[#263d36]' : 'font-semibold'}`}>
                        {plan.name}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPlan({ ...plan, numericId: plan.id });
                        setViewMode('edit_plan');
                      }}
                      className="p-1 rounded hover:bg-black/5 text-[#6d786c] shrink-0"
                      title="구좌 정보 수정"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-[11px] pl-5">
                    <span className="text-[#7d877f] font-mono">
                      {formatNumber(plan.basePrice)}원{plan.accountCount && ` · ${plan.accountCount}`}
                    </span>
                    <span className={`adm-pill ${isSelected ? 'green' : 'gray'}`}>
                      {allProducts?.filter((p) => p.planId === plan.id).length || 0}개
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Product List / Editor */}
        <div className="adm-panel">
          {viewMode === 'list' && selectedPlan ? (
            <>
              <div className="adm-panel-top !pb-4 border-b border-[#edf0e7]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2>{selectedPlan.name}</h2>
                    <span className="adm-pill green">등록 {filteredProducts.length}개</span>
                  </div>
                  <div className="adm-panel-subtitle">
                    항목을 드래그해 랜딩 노출 순서를 변경하거나 체크박스로 일괄 작업할 수 있습니다.
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleBatchSmartFetch}
                    className="adm-btn sage small"
                    title="선택 항목 또는 전체 항목의 스마트 정보를 모델명으로 일괄 수집합니다"
                  >
                    <Zap />
                    <span>스마트 정보 일괄 동기화</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSelectedProducts}
                    className={`adm-btn small ${selectedIds.length > 0 ? 'primary' : ''}`}
                  >
                    <Download />
                    <span>제품정보 ZIP 다운로드 {selectedIds.length > 0 && `(${selectedIds.length})`}</span>
                  </button>
                </div>
              </div>

              {/* Sort Filter Bar */}
              <div className="adm-filter-bar">
                <span className="text-[11.5px] font-semibold text-[#6d786c]">정렬 기준</span>
                <div className="adm-segmented">
                  <button
                    type="button"
                    onClick={() => setSortConfig({ key: 'order', direction: 'asc' })}
                    className={sortConfig.key === 'order' ? 'active' : ''}
                  >
                    노출순
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortConfig({ key: 'createdAt', direction: 'desc' })}
                    className={sortConfig.key === 'createdAt' && sortConfig.direction === 'desc' ? 'active' : ''}
                  >
                    최신순
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortConfig({ key: 'createdAt', direction: 'asc' })}
                    className={sortConfig.key === 'createdAt' && sortConfig.direction === 'asc' ? 'active' : ''}
                  >
                    등록일순
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSort('brand')}
                    className={sortConfig.key === 'brand' ? 'active' : ''}
                  >
                    브랜드 {sortConfig.key === 'brand' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSort('category')}
                    className={sortConfig.key === 'category' ? 'active' : ''}
                  >
                    카테고리 {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSort('supplyPrice')}
                    className={sortConfig.key === 'supplyPrice' ? 'active' : ''}
                  >
                    공급사 {sortConfig.key === 'supplyPrice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </button>
                </div>

                <div className="adm-filter-end">
                  <span className="text-[11.5px] text-[#6d786c]">대표 썸네일 일괄 지정:</span>
                  <select
                    onChange={(e) => {
                      if (e.target.value !== '') {
                        handleBatchSetRepresentativeIndex(parseInt(e.target.value, 10));
                        e.target.value = '';
                      }
                    }}
                    className="adm-select !min-h-[30px] !py-1 !text-[11.5px]"
                  >
                    <option value="">순번 선택 ▾</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n - 1}>
                        {n}번 이미지로 설정
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bulk Actions Bar when Selected */}
              {selectedIds.length > 0 && (
                <div className="px-5 py-2.5 bg-[#193f39] text-[#edf2e9] flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[12px] font-semibold">
                    <strong>{selectedIds.length}개</strong> 제품 선택됨
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button type="button" onClick={handleBatchCopy} className="adm-btn small">
                      <Copy /> 복사
                    </button>
                    <button type="button" onClick={() => handleBatchToggleVisibility(true)} className="adm-btn sage small">
                      <Eye /> 노출 전환
                    </button>
                    <button type="button" onClick={() => handleBatchToggleVisibility(false)} className="adm-btn small">
                      <EyeOff /> 숨김 전환
                    </button>
                    <button type="button" onClick={handleBatchDelete} className="adm-btn danger small">
                      <Trash2 /> 선택 삭제
                    </button>
                  </div>
                </div>
              )}

              <div ref={tableContainerRef} className="adm-table-scroll">
                <table className="adm-table min-w-[980px]">
                  <thead>
                    <tr>
                      <th className="w-11 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedIds(
                              selectedIds.length === filteredProducts.length
                                ? []
                                : filteredProducts.map((p) => p._id)
                            )
                          }
                        >
                          {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-[#295e52]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#b7c2b0]" />
                          )}
                        </button>
                      </th>
                      <th className="w-9"></th>
                      <th className="w-20 text-center">썸네일</th>
                      <th className="w-24">브랜드</th>
                      <th className="w-28">카테고리</th>
                      <th>제품명 · 모델명</th>
                      <th className="w-24 text-center">공급사</th>
                      <th className="w-32 text-right">월납입금</th>
                      <th className="w-16 text-center">노출</th>
                      <th className="w-16 text-center">메인</th>
                      <th className="w-16 text-center">히어로</th>
                      <th className="w-28 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="text-center !py-20 text-[#86918a]">
                          등록된 제품이 없습니다. 우측 상단의 [개별 제품 등록] 또는 [스마트 수집 등록]을 이용해 주세요.
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
                          onDragEnd={() => setDraggedItemIndex(null)}
                          className={`cursor-move group ${
                            draggedItemIndex === index ? 'opacity-40 bg-[#f3f5ef]' : ''
                          } ${selectedIds.includes(p._id) ? '!bg-[#f2f6ef]' : ''}`}
                        >
                          <td className="text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIds((prev) =>
                                  prev.includes(p._id) ? prev.filter((i) => i !== p._id) : [...prev, p._id]
                                );
                              }}
                            >
                              {selectedIds.includes(p._id) ? (
                                <CheckSquare className="w-4 h-4 text-[#295e52]" />
                              ) : (
                                <Square className="w-4 h-4 text-[#b7c2b0]" />
                              )}
                            </button>
                          </td>
                          <td className="text-[#b7c2b0] group-hover:text-[#295e52]">
                            <MoveVertical className="w-4 h-4" />
                          </td>
                          <td>
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-11 h-11 bg-[#f8f9f5] border border-[#e6eae3] rounded-[8px] overflow-hidden flex items-center justify-center">
                                {p.image || (p.images && p.images.length > 0) ? (
                                  <img
                                    src={p.image || p.images[0]}
                                    className="w-full h-full object-contain p-0.5"
                                    alt="thumb"
                                  />
                                ) : (
                                  <ImageIcon className="w-4 h-4 text-[#b7c2b0]" />
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
                                  className="text-[10px] font-semibold bg-[#f4f5f0] border border-[#dfe5d9] rounded px-1 py-0.5 w-14 text-center text-[#263d36] cursor-pointer"
                                  title="대표 썸네일 순번 선택"
                                >
                                  {p.images.map((_: string, imgIdx: number) => (
                                    <option key={imgIdx} value={imgIdx}>
                                      {imgIdx + 1}번
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </td>
                          <td className="font-bold text-[#263d36]">{p.brand}</td>
                          <td>
                            <span className="adm-pill gray">{p.category}</span>
                          </td>
                          <td className="whitespace-normal min-w-[240px]">
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                              {(selectedPlan?.accountCount || p.accountCount) && (
                                <span className="adm-pill green">
                                  {selectedPlan?.accountCount || p.accountCount}
                                </span>
                              )}
                              {p.tag && <span className="adm-pill orange">{p.tag}</span>}
                              <span className="font-bold text-[#263d36]">{p.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-mono text-[#86918a]">
                              <span>{p.model}</span>
                              {p._creationTime && (
                                <span>
                                  ·{' '}
                                  {new Date(p._creationTime).toLocaleDateString('ko-KR', {
                                    year: '2-digit',
                                    month: '2-digit',
                                    day: '2-digit',
                                  })}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="text-center font-semibold text-[#263d36]">
                            {p.supplier || p.supplyPrice ? (
                              <span className="adm-pill teal">{p.supplier || p.supplyPrice}</span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="text-right font-bold font-mono text-[#295e52]">
                            {formatNumber(selectedPlan?.basePrice || p.price)}원
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleVisibility(p._id, p.isVisible);
                              }}
                              className={`adm-icon-btn mx-auto ${
                                p.isVisible ? '!text-[#295e52] !bg-[#edf3e8]' : 'opacity-45'
                              }`}
                            >
                              {p.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMainExposure(p._id, p.showOnMain);
                              }}
                              className={`adm-icon-btn mx-auto ${
                                p.showOnMain ? '!text-[#a97f3f] !bg-[#faf0df]' : 'opacity-45'
                              }`}
                              title="메인 노출 (최대 8개)"
                            >
                              <Star className={`w-4 h-4 ${p.showOnMain ? 'fill-current' : ''}`} />
                            </button>
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleHeroExposure(p._id, p.showOnHero);
                              }}
                              className={`adm-icon-btn mx-auto ${
                                p.showOnHero ? '!text-[#295e52] !bg-[#eaf3e8]' : 'opacity-45'
                              }`}
                              title="히어로 노출 (최대 4개)"
                            >
                              <Sparkles className={`w-4 h-4 ${p.showOnHero ? 'fill-current' : ''}`} />
                            </button>
                          </td>
                          <td className="text-right">
                            <div className="inline-flex items-center justify-end gap-0.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyProduct(p._id);
                                }}
                                className="adm-icon-btn !p-1.5"
                                title="복사"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProduct(p);
                                  setViewMode('edit_product');
                                }}
                                className="adm-icon-btn !p-1.5"
                                title="수정"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteProduct(p._id);
                                }}
                                className="adm-icon-btn !p-1.5 hover:!text-[#a85042]"
                                title="삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="adm-table-foot">
                <span>{selectedPlan.name} 구좌 총 {filteredProducts.length}개 제품</span>
                <span>메인 노출 최대 8개 · 히어로 노출 최대 4개 지원</span>
              </div>
            </>
          ) : viewMode === 'list' && dbPlans === undefined ? (
            <div className="py-24 flex flex-col items-center justify-center text-[#86918a]">
              <div className="w-8 h-8 border-[3px] border-[#295e52] border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-[13px] font-semibold">상품 정보를 불러오는 중입니다...</p>
            </div>
          ) : viewMode === 'list' && plans.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center px-6">
              <Settings2 className="w-10 h-10 text-[#b7c2b0] mb-3" />
              <h3 className="text-[16px] font-bold text-[#263d36] mb-1.5">설정된 구좌 정보가 없습니다.</h3>
              <p className="text-[#86918a] text-[12.5px] mb-5">
                좌측의 [+] 버튼을 눌러 구좌(Plan)를 생성하거나 초기 데이터를 생성해 주세요.
              </p>
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('기본 구좌 데이터(리빙144, 스페셜299 등)를 생성하시겠습니까?')) {
                    await createPlan({ numericId: 1, name: '스페셜299-UP가전', basePrice: '59,800', benefitPrice: '29,800', mainCount: 4, isMainActive: true, accountCount: '2구좌' });
                    await createPlan({ numericId: 2, name: '리빙144(신한카드)-2구좌', basePrice: '70,000', benefitPrice: '0', mainCount: 4, isMainActive: true, accountCount: '2구좌' });
                    await createPlan({ numericId: 3, name: '리빙144(신한카드)-1구좌', basePrice: '35,000', benefitPrice: '0', mainCount: 4, isMainActive: true, accountCount: '1구좌' });
                  }
                }}
                className="adm-btn primary"
              >
                초기 구좌 데이터 생성하기
              </button>
            </div>
          ) : viewMode === 'list' ? (
            <div className="py-20 text-center text-[#86918a] text-[13px]">좌측에서 구좌를 선택해 주세요.</div>
          ) : viewMode === 'edit_product' && editingProduct ? (
            <div className="flex flex-col">
              <div className="adm-panel-top" style={{ padding: '18px 24px', background: '#fafbf9' }}>
                <div>
                  <span className="adm-eyebrow">PRODUCT EDITOR</span>
                  <h3 className="adm-panel-title" style={{ fontSize: 18 }}>제품 정보 관리</h3>
                  <p className="adm-panel-sub">제품 정보, 상세 스펙 및 메인/히어로 노출 상태를 설정합니다.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      toggleVisibility(editingProduct._id, editingProduct.isVisible);
                      setEditingProduct({ ...editingProduct, isVisible: !editingProduct.isVisible });
                    }}
                    className={`adm-btn sm ${editingProduct.isVisible ? 'sage' : ''}`}
                  >
                    {editingProduct.isVisible ? <><Eye className="w-3.5 h-3.5" /> 노출</> : <><EyeOff className="w-3.5 h-3.5" /> 숨김</>}
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
                      setEditingProduct({ ...editingProduct, showOnMain: nextState });
                    }}
                    className={`adm-btn sm ${editingProduct.showOnMain ? 'sage' : ''}`}
                    style={editingProduct.showOnMain ? { background: '#faf5ea', color: '#8f6d2c', borderColor: '#eadbc0' } : undefined}
                  >
                    {editingProduct.showOnMain ? <><Star className="w-3.5 h-3.5 fill-current" /> 메인</> : <><Star className="w-3.5 h-3.5" /> 메인</>}
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
                      setEditingProduct({ ...editingProduct, showOnHero: nextState });
                    }}
                    className={`adm-btn sm ${editingProduct.showOnHero ? 'sage' : ''}`}
                  >
                    {editingProduct.showOnHero ? <><Sparkles className="w-3.5 h-3.5 fill-current" /> 히어로</> : <><Sparkles className="w-3.5 h-3.5" /> 히어로</>}
                  </button>
                  {editingProduct._id && (
                    <button
                      onClick={() => { deleteProduct(editingProduct._id); setViewMode('list'); }}
                      className="adm-btn sm danger"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 삭제
                    </button>
                  )}
                  <button onClick={() => setViewMode('list')} className="adm-btn sm">닫기</button>
                </div>
              </div>

              <div className="p-6 lg:p-8">
                <div className="max-w-3xl space-y-8 pb-6">
                  <div>
                    <div className="adm-section-label">기본 상품 및 납입 정보</div>
                    <div className="adm-field-grid">
                      <div className="adm-field">
                        <label>브랜드</label>
                        <select value={editingProduct.brand} onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })} className="adm-select">
                          {settings?.brands?.map((brand: string) => <option key={brand}>{brand}</option>)}
                        </select>
                      </div>
                      <div className="adm-field">
                        <label>카테고리</label>
                        <select value={editingProduct.category} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} className="adm-select">
                          {settings?.categories?.map((cat: string) => <option key={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div className="adm-field full">
                        <label>제품명</label>
                        <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className="adm-input font-semibold" />
                      </div>
                      <div className="adm-field">
                        <div className="flex justify-between items-center">
                          <label>모델명</label>
                          <button
                            type="button"
                            onClick={handleSingleSmartFetch}
                            disabled={isSingleFetching}
                            className="adm-btn xs sage"
                            title="입력한 모델명으로 LG전자 공식 웹사이트에서 이미지, 제품명, 스펙 정보를 가져옵니다"
                          >
                            <Zap className="w-3 h-3" />
                            {isSingleFetching ? '수집 중...' : '스마트 수집'}
                          </button>
                        </div>
                        <input type="text" value={editingProduct.model} onChange={(e) => setEditingProduct({ ...editingProduct, model: e.target.value })} className="adm-input font-mono" placeholder="예: AS195DWWA" />
                      </div>
                      <div className="adm-field">
                        <label>공급사</label>
                        <input
                          type="text"
                          value={editingProduct.supplier ?? editingProduct.supplyPrice ?? ''}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct,
                            supplier: e.target.value,
                            supplyPrice: e.target.value,
                          })}
                          className="adm-input"
                          placeholder="예: TU, 쿠쿠, 위니아 등 공급사명 입력"
                        />
                      </div>
                      <div className="adm-field">
                        <label>사은품 내역</label>
                        <input type="text" value={editingProduct.giftText || ''} onChange={(e) => setEditingProduct({ ...editingProduct, giftText: e.target.value })} className="adm-input" placeholder="예: 현금 30만원 지원, 상품권 등" />
                      </div>
                      <div className="adm-field">
                        <label>월 납입금</label>
                        <input type="text" value={formatNumber(editingProduct.price)} onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value.replace(/\D/g, '') })} className="adm-input font-bold text-[#263d36] text-right" />
                      </div>
                      <div className="adm-field">
                        <label>제휴카드 혜택가</label>
                        <input type="text" value={formatNumber(editingProduct.discountPrice)} onChange={(e) => setEditingProduct({ ...editingProduct, discountPrice: e.target.value.replace(/\D/g, '') })} className="adm-input font-bold text-[#295e52] text-right" />
                      </div>
                      <div className="adm-field">
                        <label>라벨 (태그)</label>
                        <input type="text" value={editingProduct.tag || ''} onChange={(e) => setEditingProduct({ ...editingProduct, tag: e.target.value })} className="adm-input" placeholder="예: BEST, HOT, 특가" />
                      </div>
                      <div className="adm-field">
                        <label>구좌 구분</label>
                        <select
                          value={editingProduct.accountCount || (plans.find(p => p.id === editingProduct.planId)?.accountCount) || '1구좌'}
                          onChange={(e) => setEditingProduct({ ...editingProduct, accountCount: e.target.value })}
                          className="adm-select"
                        >
                          <option value="1구좌">1구좌 (싱글)</option>
                          <option value="2구좌">2구좌 (더블)</option>
                          <option value="3구좌">3구좌 (트리플)</option>
                          <option value="4구좌">4구좌 (쿼드)</option>
                        </select>
                      </div>
                      <div className="adm-field full">
                        <label>노출 랜딩페이지</label>
                        <div className="flex flex-wrap gap-2 p-3 bg-[#f9faf7] border border-[#e6eae3] rounded-[12px]">
                          {dbLandings.filter(l => l.isActive).map(landing => {
                            const currentLandingPages = editingProduct.landingPages || [];
                            const isChecked = currentLandingPages.includes(landing.path);
                            return (
                              <label
                                key={landing._id}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold cursor-pointer transition-colors select-none border ${
                                  isChecked ? 'bg-[#295e52] text-white border-[#295e52]' : 'bg-white text-[#526058] hover:bg-[#f2f5f0] border-[#e6eae3]'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const updated = e.target.checked
                                      ? [...currentLandingPages, landing.path]
                                      : currentLandingPages.filter((p: string) => p !== landing.path);
                                    setEditingProduct({ ...editingProduct, landingPages: updated });
                                  }}
                                />
                                <span>{landing.name}</span>
                                <span className={`text-[10.5px] font-mono ${isChecked ? 'text-[#cfe0cb]' : 'text-[#86918a]'}`}>({landing.path})</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 제품 스펙 정보 설정 (표 형태) */}
                  <div className="pt-6 border-t border-[#e6eae3]">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h3 className="font-bold text-[15px] text-[#263d36] flex items-center gap-2">
                          <Zap className="w-4 h-4 text-[#295e52]" /> 제품 스펙 정보 (표 형태)
                        </h3>
                        <p className="text-[12px] text-[#86918a] mt-0.5">스마트 등록 시 자동 수집된 상세 스펙 정보 표입니다.</p>
                      </div>
                      <button
                        onClick={() => {
                          const updated = [...(editingProduct.specifications || []), { category: '주요스펙', name: '', value: '' }];
                          setEditingProduct({ ...editingProduct, specifications: updated });
                        }}
                        className="adm-btn sm sage"
                      >
                        <Plus className="w-3.5 h-3.5" /> 스펙 항목 추가
                      </button>
                    </div>

                    {(!editingProduct.specifications || editingProduct.specifications.length === 0) ? (
                      <div className="adm-note-card text-center py-6 text-[#86918a] text-[13px]">
                        등록된 상세 스펙 정보가 없습니다. [스펙 항목 추가] 버튼을 눌러 스펙 항목을 작성해 주세요.
                      </div>
                    ) : (
                      <div className="rounded-[12px] border border-[#e6eae3] overflow-hidden">
                        <div className="max-h-[420px] overflow-y-auto">
                          <table className="adm-table">
                            <thead>
                              <tr>
                                <th className="w-[140px]">분류 (카테고리)</th>
                                <th className="w-[200px]">스펙 항목명</th>
                                <th>상세값</th>
                                <th className="w-12 text-center">삭제</th>
                              </tr>
                            </thead>
                            <tbody>
                              {editingProduct.specifications.map((spec: any, sIdx: number) => (
                                <tr key={sIdx}>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      value={spec.category || ''}
                                      onChange={(e) => {
                                        const updated = [...editingProduct.specifications];
                                        updated[sIdx] = { ...updated[sIdx], category: e.target.value };
                                        setEditingProduct({ ...editingProduct, specifications: updated });
                                      }}
                                      className="adm-input font-semibold text-[#295e52]"
                                      style={{ height: 34 }}
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
                                      className="adm-input font-semibold"
                                      style={{ height: 34 }}
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
                                      className="adm-input"
                                      style={{ height: 34 }}
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
                                      className="adm-btn icon-only sm danger"
                                      title="스펙 항목 삭제"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
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

                  {/* 타사 비교 정보 편집 */}
                  {(!editingProduct.isSmartRegistered || editingProduct.showCompetitors) && (
                    <div className="pt-6 border-t border-[#e6eae3]">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-[15px] text-[#263d36]">타사 비교 정보 설정</h3>
                        <button
                          onClick={() => {
                            const defaultPartner = competitors[0] || { name: '타사', months: 60, type: '타사' };
                            const newComp = {
                              company: defaultPartner.name,
                              target: '',
                              price: '0',
                              period: (defaultPartner.months || 60) + '개월',
                              isOurs: defaultPartner.type === '자사',
                              benefit: '',
                            };
                            setEditingProduct({
                              ...editingProduct,
                              comparisons: [...(editingProduct.comparisons || []), newComp],
                            });
                          }}
                          className="adm-btn sm sage"
                        >
                          <Plus className="w-3.5 h-3.5" /> 비교 대상 추가
                        </button>
                      </div>

                      <div className="space-y-3">
                        {editingProduct.comparisons?.map((comp: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 bg-[#f9faf7] p-4 rounded-[12px] border border-[#e6eae3]">
                            <div className="w-[180px]">
                              <label className="block text-[11px] font-semibold text-[#86918a] mb-1">비교 업체</label>
                              <select
                                value={comp.company}
                                onChange={(e) => {
                                  const partner = competitors.find(c => c.name === e.target.value);
                                  const updated = [...editingProduct.comparisons];
                                  updated[idx] = {
                                    ...updated[idx],
                                    company: e.target.value,
                                    isOurs: partner?.type === '자사',
                                    period: (partner?.months || 60) + '개월',
                                  };
                                  setEditingProduct({ ...editingProduct, comparisons: updated });
                                }}
                                className="adm-select"
                              >
                                {competitors.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                              </select>
                            </div>
                            <div className="w-[160px]">
                              <label className="block text-[11px] font-semibold text-[#86918a] mb-1">월 납입금</label>
                              <input
                                type="text"
                                value={formatNumber(comp.price)}
                                onChange={(e) => {
                                  const updated = [...editingProduct.comparisons];
                                  updated[idx] = { ...updated[idx], price: e.target.value.replace(/\D/g, '') };
                                  setEditingProduct({ ...editingProduct, comparisons: updated });
                                }}
                                className="adm-input font-semibold text-right"
                              />
                            </div>
                            <button
                              onClick={() => {
                                const updated = [...editingProduct.comparisons];
                                updated.splice(idx, 1);
                                setEditingProduct({ ...editingProduct, comparisons: updated });
                              }}
                              className="adm-btn icon-only sm danger mt-5"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {editingProduct.isSmartRegistered && !editingProduct.showCompetitors && (
                    <div className="pt-2 text-center">
                      <button
                        onClick={() => setEditingProduct({ ...editingProduct, showCompetitors: true })}
                        className="text-[12px] font-semibold text-[#6b7870] hover:text-[#295e52] underline cursor-pointer"
                      >
                        + 타사 비교 정보 설정 펼치기
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-8 pt-6 border-t border-[#e6eae3]">
                    {/* Thumbnail Images */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="block text-[13px] font-bold text-[#263d36]">썸네일 리스트 (여러 개 등록 가능)</label>
                          <span className="adm-pill active" style={{ fontSize: 10.5, padding: '2px 8px' }}>
                            드래그하여 순서 변경 (1번이 대표)
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => addImageUrl('images')} className="adm-btn xs">
                            <Link className="w-3 h-3" /> URL 추가
                          </button>
                          <button onClick={() => thumbInputRef.current?.click()} className="adm-btn xs sage">
                            <Upload className="w-3 h-3" /> 이미지 업로드
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                        {(editingProduct.images || []).map((img: string, idx: number) => {
                          const isRepresentative = (editingProduct.image ? editingProduct.image === img : idx === 0);
                          const isDragging = draggedThumbIdx === idx;
                          const isDragOver = dragOverThumbIdx === idx;

                          return (
                            <div
                              key={idx}
                              draggable
                              onDragStart={(e) => {
                                setDraggedThumbIdx(idx);
                                e.dataTransfer.setData('text/plain', String(idx));
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                                if (dragOverThumbIdx !== idx) setDragOverThumbIdx(idx);
                              }}
                              onDragLeave={() => {
                                if (dragOverThumbIdx === idx) setDragOverThumbIdx(null);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                handleThumbDrop(idx);
                              }}
                              onDragEnd={() => {
                                setDraggedThumbIdx(null);
                                setDragOverThumbIdx(null);
                              }}
                              onClick={() => setEditingProduct({ ...editingProduct, image: img })}
                              className={`aspect-square bg-[#f9faf7] border rounded-[12px] overflow-hidden relative group cursor-grab active:cursor-grabbing transition-all select-none ${
                                isDragging ? 'opacity-30 scale-95 border-dashed border-[#295e52]' :
                                isDragOver ? 'border-2 border-[#295e52] ring-4 ring-[#295e52]/15 scale-105' :
                                isRepresentative ? 'border-2 border-[#295e52]' : 'border-[#e6eae3] hover:border-[#295e52]'
                              }`}
                              title="드래그하여 위치 변경, 클릭 시 대표 썸네일 지정"
                            >
                              <PreviewImage src={img} className="w-full h-full object-cover pointer-events-none" />
                              <div className="absolute top-1.5 left-1.5 bg-black/45 text-white/90 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <GripVertical className="w-3.5 h-3.5" />
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeImage('images', idx); }}
                                className="absolute top-1.5 right-1.5 bg-black/55 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-black/80"
                                title="이미지 삭제"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <div className={`absolute bottom-0 left-0 right-0 text-[10px] text-center py-0.5 font-bold ${isRepresentative ? 'bg-[#295e52] text-white' : 'bg-black/45 text-white/90 group-hover:bg-[#295e52]/85'}`}>
                                {idx + 1}번 {isRepresentative ? '(대표)' : '지정'}
                              </div>
                            </div>
                          );
                        })}
                        <div
                          onClick={() => thumbInputRef.current?.click()}
                          className="aspect-square bg-[#f9faf7] border-2 border-dashed border-[#dce2d8] rounded-[12px] flex flex-col items-center justify-center cursor-pointer hover:border-[#295e52] hover:bg-[#f2f5f0] transition-all group"
                        >
                          <Plus className="w-6 h-6 text-[#9aa89f] group-hover:text-[#295e52] mb-1" />
                          <span className="text-[11px] text-[#86918a] group-hover:text-[#295e52] font-semibold">추가하기</span>
                        </div>
                      </div>
                    </div>

                    {/* Detail Images */}
                    <div className="space-y-3 pt-4 border-t border-[#e6eae3]">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="block text-[13px] font-bold text-[#263d36]">상세 이미지 리스트 (여러 개 등록 가능)</label>
                          <span className="adm-pill neutral" style={{ fontSize: 10.5, padding: '2px 8px' }}>
                            드래그하여 순서 변경
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => addImageUrl('detailImages')} className="adm-btn xs">
                            <Link className="w-3 h-3" /> URL 추가
                          </button>
                          <button onClick={() => detailInputRef.current?.click()} className="adm-btn xs sage">
                            <Upload className="w-3 h-3" /> 이미지 업로드
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                        {(editingProduct.detailImages || []).map((img: string, idx: number) => {
                          const isDragging = draggedDetailIdx === idx;
                          const isDragOver = dragOverDetailIdx === idx;

                          return (
                            <div
                              key={idx}
                              draggable
                              onDragStart={(e) => {
                                setDraggedDetailIdx(idx);
                                e.dataTransfer.setData('text/plain', String(idx));
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                                if (dragOverDetailIdx !== idx) setDragOverDetailIdx(idx);
                              }}
                              onDragLeave={() => {
                                if (dragOverDetailIdx === idx) setDragOverDetailIdx(null);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                handleDetailDrop(idx);
                              }}
                              onDragEnd={() => {
                                setDraggedDetailIdx(null);
                                setDragOverThumbIdx(null);
                                setDragOverDetailIdx(null);
                              }}
                              className={`aspect-square bg-[#f9faf7] border rounded-[12px] overflow-hidden relative group cursor-grab active:cursor-grabbing transition-all select-none ${
                                isDragging ? 'opacity-30 scale-95 border-dashed border-[#295e52]' :
                                isDragOver ? 'border-2 border-[#295e52] ring-4 ring-[#295e52]/15 scale-105' :
                                'border-[#e6eae3] hover:border-[#295e52]'
                              }`}
                              title="드래그하여 위치 변경"
                            >
                              <PreviewImage src={img} className="w-full h-full object-cover pointer-events-none" />
                              <div className="absolute top-1.5 left-1.5 bg-black/45 text-white/90 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <GripVertical className="w-3.5 h-3.5" />
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeImage('detailImages', idx); }}
                                className="absolute top-1.5 right-1.5 bg-black/55 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-black/80"
                                title="이미지 삭제"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <div className="absolute bottom-0 left-0 right-0 text-[10px] text-center py-0.5 font-bold bg-black/45 text-white/90">
                                {idx + 1}번 상세이미지
                              </div>
                            </div>
                          );
                        })}
                        <div
                          onClick={() => detailInputRef.current?.click()}
                          className="aspect-square bg-[#f9faf7] border-2 border-dashed border-[#dce2d8] rounded-[12px] flex flex-col items-center justify-center cursor-pointer hover:border-[#295e52] hover:bg-[#f2f5f0] transition-all group"
                        >
                          <Plus className="w-6 h-6 text-[#9aa89f] group-hover:text-[#295e52] mb-1" />
                          <span className="text-[11px] text-[#86918a] group-hover:text-[#295e52] font-semibold">추가하기</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[#e6eae3] flex justify-end gap-2.5">
                    <button onClick={() => { setViewMode('list'); setEditingProduct(null); }} className="adm-btn lg">취소하기</button>
                    <button
                      onClick={async () => {
                        if (!editingProduct) return;
                        try {
                          const curPlan = plans.find(p => p.id === editingProduct.planId) || selectedPlan;
                          const planAccount = editingProduct.accountCount || curPlan?.accountCount || (editingProduct.planId ? `${editingProduct.planId}구좌` : '1구좌');
                          const is60 = [5, 6, 7, 8].includes(editingProduct.planId ?? 0) || (curPlan?.name && curPlan.name.includes('60패키지'));

                          let defaultLandings = editingProduct.landingPages;
                          if (!defaultLandings || defaultLandings.length === 0) {
                            if (is60) {
                              defaultLandings = ['/package60', '/package_up', '/special60', '/careplus', '/triplecare', '/special_new'];
                            } else if (curPlan?.name?.includes('리빙')) {
                              defaultLandings = ['/living', '/living2'];
                            } else if (curPlan?.name?.includes('스페셜')) {
                              defaultLandings = ['/special', '/special2', '/'];
                            } else {
                              defaultLandings = ['/'];
                            }
                          }

                          const images = editingProduct.images || [];
                          const primaryImg = (editingProduct.image && editingProduct.image.trim() !== '')
                            ? editingProduct.image
                            : (images.length > 0 ? images[0] : '');

                          const sortedComparisons = [...(editingProduct.comparisons || [])].sort((a: any, b: any) => parseInt(a.price) - parseInt(b.price));
                          const productData = {
                            ...editingProduct,
                            accountCount: planAccount,
                            landingPages: defaultLandings,
                            image: primaryImg,
                            comparisons: sortedComparisons,
                          };

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
                      className="adm-btn primary lg"
                      style={{ minWidth: 180 }}
                    >
                      정보 저장하기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : viewMode === 'edit_plan' && editingPlan ? (
            <div className="flex flex-col">
              <div className="adm-panel-top" style={{ padding: '18px 24px', background: '#fafbf9' }}>
                <div>
                  <span className="adm-eyebrow">PLAN CATEGORY</span>
                  <h3 className="adm-panel-title" style={{ fontSize: 18 }}>구좌(상품군) 관리</h3>
                  <p className="adm-panel-sub">상품군별 명칭과 기본 납입 가격을 설정합니다.</p>
                </div>
                <button onClick={() => setViewMode('list')} className="adm-btn icon-only sm">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 lg:p-8">
                <div className="max-w-xl space-y-5">
                  <div className="adm-field">
                    <label>구좌 고유 ID (숫자)</label>
                    <input
                      type="number"
                      value={editingPlan.numericId}
                      onChange={(e) => setEditingPlan({ ...editingPlan, numericId: parseInt(e.target.value) })}
                      className="adm-input font-semibold"
                    />
                    <span className="adm-field-hint">이 숫자는 제품 등록 시 &apos;구좌 ID&apos;로 사용됩니다.</span>
                  </div>
                  <div className="adm-field">
                    <label>구좌명</label>
                    <input
                      type="text"
                      value={editingPlan.name}
                      onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                      className="adm-input font-semibold"
                      placeholder="예: 스페셜 299 더블"
                    />
                  </div>
                  <div className="adm-field-grid">
                    <div className="adm-field">
                      <label>기본 월납입금</label>
                      <input
                        type="text"
                        value={editingPlan.basePrice}
                        onChange={(e) => setEditingPlan({ ...editingPlan, basePrice: formatNumber(e.target.value) })}
                        className="adm-input font-semibold"
                      />
                    </div>
                    <div className="adm-field">
                      <label>제휴카드 혜택가</label>
                      <input
                        type="text"
                        value={editingPlan.benefitPrice}
                        onChange={(e) => setEditingPlan({ ...editingPlan, benefitPrice: formatNumber(e.target.value) })}
                        className="adm-input font-semibold text-[#295e52]"
                      />
                    </div>
                  </div>
                  <div className="adm-field">
                    <label>기본 구좌수 설정</label>
                    <input
                      type="text"
                      value={editingPlan.accountCount || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, accountCount: e.target.value })}
                      className="adm-input font-semibold"
                      placeholder="예: 1구좌, 2구좌"
                    />
                    <span className="adm-field-hint">이 구좌수 정보는 해당 카테고리 모든 제품의 기본 정보로 활용됩니다.</span>
                  </div>
                  <div className="adm-setting-row" style={{ border: '1px solid #e6eae3', borderRadius: 12, padding: '14px 16px', background: '#f9faf7' }}>
                    <div className="adm-setting-meta">
                      <strong>메인 페이지 노출 활성화</strong>
                      <span>고객 메인 상품군 탭에 이 구좌를 표시합니다.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingPlan({ ...editingPlan, isMainActive: !editingPlan.isMainActive })}
                      className={`adm-switch ${editingPlan.isMainActive ? 'on' : ''}`}
                    />
                  </div>

                  <div className="pt-6 border-t border-[#e6eae3] flex justify-end gap-2.5">
                    {editingPlan._id && (
                      <button
                        onClick={async () => {
                          if (window.confirm('정말 이 구좌를 삭제하시겠습니까? 연결된 제품들이 표시되지 않을 수 있습니다.')) {
                            await deletePlan({ id: editingPlan._id });
                            setViewMode('list');
                          }
                        }}
                        className="adm-btn danger lg"
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
                      className="adm-btn primary lg"
                      style={{ minWidth: 160 }}
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

          {/* 스마트 등록 선택 모달 */}
          {isSmartModalOpen && (
            <div className="adm-modal-overlay">
              <div className="adm-modal">
                <div className="adm-modal-head">
                  <div>
                    <span className="adm-eyebrow">SMART CRAWLER</span>
                    <h3 className="adm-modal-title">스마트 제품 수집 등록</h3>
                    <p className="text-[12px] text-[#86918a] mt-0.5">개별 모델명 직접 입력 또는 엑셀 파일로 수집합니다.</p>
                  </div>
                  <button onClick={() => setIsSmartModalOpen(false)} className="adm-btn icon-only sm">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="adm-modal-body space-y-5">
                  <div className="adm-field">
                    <div className="flex justify-between items-center">
                      <label>개별 모델명 직접 입력</label>
                      <span className="text-[11px] text-[#86918a]">쉼표(,) 또는 줄바꿈 구분</span>
                    </div>
                    <textarea
                      rows={4}
                      value={directModelsText}
                      onChange={(e) => setDirectModelsText(e.target.value)}
                      placeholder="예시:&#10;AS195DWWA&#10;AS186LSAA, T18MX7, M344MB14&#10;FX23VVE + RD20WVE"
                      className="adm-textarea font-mono"
                    />
                    <button
                      onClick={handleDirectSmartRegister}
                      disabled={isDirectRegistering || !directModelsText.trim()}
                      className="adm-btn primary lg w-full mt-2"
                    >
                      <Zap className="w-4 h-4" />
                      {isDirectRegistering ? '스마트 수집 등록 중...' : '입력한 모델명으로 스마트 등록 시작'}
                    </button>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-[#e6eae3]" />
                    <span className="flex-shrink mx-4 text-[11.5px] font-semibold text-[#86918a]">또는 엑셀 일괄 업로드</span>
                    <div className="flex-grow border-t border-[#e6eae3]" />
                  </div>

                  <div className="space-y-3">
                    <div className="adm-note-card space-y-1.5">
                      <div className="font-bold text-[#263d36] flex items-center gap-1.5 text-[12.5px]">
                        <Sparkles className="w-3.5 h-3.5 text-[#295e52]" /> 스마트 등록 엑셀 양식 컬럼 안내
                      </div>
                      <div className="font-mono text-[11px] text-[#295e52] font-semibold bg-white p-2 rounded-[8px] border border-[#e6eae3] break-all">
                        구좌 | 브랜드 | 카테고리 | 모델명1 | 제품명1 | 모델명2 | 제품명2 | 참고 URL
                      </div>
                      <p className="text-[11px] text-[#6b7870] leading-relaxed">
                        • 단일 제품은 모델명1만 입력하고, 결합 제품은 모델명1·모델명2를 함께 입력합니다.<br />
                        • 제품명을 비워두면 LG전자 공식 제품명으로 자동 수집됩니다.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button onClick={downloadSmartTemplate} className="adm-btn sage lg w-full">
                        <Zap className="w-4 h-4" /> 스마트 엑셀 양식 다운
                      </button>
                      <button
                        onClick={() => {
                          setIsSmartModalOpen(false);
                          smartExcelInputRef.current?.click();
                        }}
                        className="adm-btn primary lg w-full"
                      >
                        <Upload className="w-4 h-4" /> 엑셀 파일 업로드
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 스마트 수집 등록 처리 결과 모달 */}
          {smartResultModal?.isOpen && (
            <div className="adm-modal-overlay">
              <div className="adm-modal lg">
                <div className="adm-modal-head">
                  <div>
                    <span className="adm-eyebrow">SMART IMPORT REPORT</span>
                    <h3 className="adm-modal-title">스마트 수집 등록 결과</h3>
                    <p className="text-[12px] text-[#86918a] mt-0.5">
                      총 {smartResultModal.total}건 중 성공 {smartResultModal.successCount}건 / 실패 {smartResultModal.failCount}건
                    </p>
                  </div>
                  <button onClick={() => setSmartResultModal(null)} className="adm-btn icon-only sm">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="adm-modal-body space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="adm-note-card text-center">
                      <div className="text-[11.5px] font-semibold text-[#86918a]">전체 시도</div>
                      <div className="text-[20px] font-extrabold text-[#263d36] mt-0.5">{smartResultModal.total}건</div>
                    </div>
                    <div className="adm-note-card text-center" style={{ background: '#eaf1e4', borderColor: '#d4e2cb' }}>
                      <div className="text-[11.5px] font-semibold text-[#295e52]">수집 성공</div>
                      <div className="text-[20px] font-extrabold text-[#295e52] mt-0.5">{smartResultModal.successCount}건</div>
                    </div>
                    <div className="adm-note-card text-center" style={{ background: '#faecea', borderColor: '#f0d2cd' }}>
                      <div className="text-[11.5px] font-semibold text-[#b8473a]">수집 실패</div>
                      <div className="text-[20px] font-extrabold text-[#b8473a] mt-0.5">{smartResultModal.failCount}건</div>
                    </div>
                  </div>

                  {smartResultModal.failCount > 0 && (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12.5px] font-bold text-[#b8473a] bg-[#faecea] px-3.5 py-2.5 rounded-[10px] border border-[#f0d2cd]">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>등록 실패한 모델 목록 ({smartResultModal.failCount}건)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const failedStr = smartResultModal.results.filter(r => !r.success).map(r => r.model).join('\n');
                              navigator.clipboard.writeText(failedStr);
                              alert(`실패한 ${smartResultModal.failCount}개 모델명이 클립보드에 복사되었습니다!`);
                            }}
                            className="adm-btn xs"
                          >
                            <Copy className="w-3 h-3" /> 실패 모델명 복사
                          </button>
                          <button
                            onClick={() => {
                              const failedStr = smartResultModal.results.filter(r => !r.success).map(r => r.model).join('\n');
                              setDirectModelsText(failedStr);
                              setSmartResultModal(null);
                              setIsSmartModalOpen(true);
                            }}
                            className="adm-btn xs danger"
                          >
                            <Zap className="w-3 h-3" /> 실패 모델 재시도
                          </button>
                        </div>
                      </div>
                      <div className="divide-y divide-[#eef1ec] border border-[#e6eae3] rounded-[12px] overflow-hidden bg-white">
                        {smartResultModal.results.filter(r => !r.success).map((r, idx) => (
                          <div key={idx} className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="flex items-center gap-3">
                              <span className="adm-pill danger">실패</span>
                              <div>
                                <div className="font-mono font-bold text-[13.5px] text-[#263d36]">{r.model}</div>
                                <div className="text-[12px] text-[#b8473a]">{r.reason || 'LG 공식 사이트에서 제품 페이지를 찾을 수 없음'}</div>
                              </div>
                            </div>
                            <span className="adm-pill neutral">모델명 확인 필요</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {smartResultModal.successCount > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[12.5px] font-bold text-[#295e52] bg-[#eaf1e4] px-3.5 py-2 rounded-[10px]">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>등록 성공한 모델 목록 ({smartResultModal.successCount}건)</span>
                      </div>
                      <div className="divide-y divide-[#eef1ec] border border-[#e6eae3] rounded-[12px] overflow-hidden bg-white">
                        {smartResultModal.results.filter(r => r.success).map((r, idx) => (
                          <div key={idx} className="p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 overflow-hidden">
                              {r.thumbnail ? (
                                <img src={r.thumbnail} className="w-10 h-10 object-contain rounded-[8px] border border-[#e6eae3] shrink-0" alt="thumb" />
                              ) : (
                                <div className="w-10 h-10 bg-[#f9faf7] rounded-[8px] border border-[#e6eae3] flex items-center justify-center shrink-0 text-[#86918a] text-[10px]">No Img</div>
                              )}
                              <div className="truncate">
                                <div className="font-semibold text-[13px] text-[#263d36] truncate">{r.name || r.model}</div>
                                <div className="font-mono text-[11px] text-[#86918a]">{r.model}</div>
                              </div>
                            </div>
                            <span className="adm-pill active shrink-0">스펙 {r.specCount || 0}개 수집</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="adm-modal-foot">
                  <button onClick={() => setSmartResultModal(null)} className="adm-btn primary">
                    확인 완료
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Download Progress Modal */}
          {downloadProgress && (
            <div className="adm-modal-overlay">
              <div className="adm-modal sm">
                <div className="adm-modal-body text-center space-y-4 py-7">
                  <div className="w-14 h-14 rounded-full bg-[#eaf1e4] text-[#295e52] flex items-center justify-center mx-auto">
                    <Download className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-[#263d36]">제품 정보 다운로드 중</h3>
                    <p className="text-[12.5px] text-[#6b7870] mt-1 break-keep">{downloadProgress.message}</p>
                  </div>
                  <div className="w-full bg-[#eef1ec] rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#295e52] h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${downloadProgress.total > 0 ? Math.min(100, Math.round((downloadProgress.current / downloadProgress.total) * 100)) : 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between w-full text-[12px] text-[#86918a] font-semibold">
                    <span>진행률</span>
                    <span>{downloadProgress.current} / {downloadProgress.total}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
