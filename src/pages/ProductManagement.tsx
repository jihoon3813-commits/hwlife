import React, { useState, useRef } from 'react';
import { Plus, Download, Upload, Copy, Trash2, Edit, MoveVertical, Eye, EyeOff, ChevronRight, Settings2, ImageIcon, CheckSquare, Square, Link, X, Star } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import * as XLSX from 'xlsx';

interface Plan {
  id: number;
  name: string;
  basePrice: string;
  benefitPrice: string;
  mainCount: number;
  isMainActive: boolean;
}

export default function ProductManagement() {
  const [plans, setPlans] = useState<Plan[]>([
    { id: 1, name: '스페셜 299 더블', basePrice: '59,800', benefitPrice: '29,800', mainCount: 4, isMainActive: true },
    { id: 2, name: '스페셜 399 실속', basePrice: '69,800', benefitPrice: '39,800', mainCount: 4, isMainActive: false },
  ]);

  const allProducts = useQuery(api.products.getAllProducts) || [];
  const competitors = useQuery(api.competitors.get) || [];
  const settings = useQuery(api.settings.get);
  
  const updateProduct = useMutation(api.products.update);
  const createProduct = useMutation(api.products.create);
  const deleteProductMutation = useMutation(api.products.remove);

  const [selectedPlanId, setSelectedPlanId] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'list' | 'edit_plan' | 'edit_product'>('list');
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [sortConfig, setSortConfig] = useState<{ key: 'brand' | 'category' | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

  const thumbInputRef = useRef<HTMLInputElement>(null);
  const detailInputRef = useRef<HTMLInputElement>(null);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

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
            headers: { "Content-Type": file.type },
            body: file,
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
            headers: { "Content-Type": file.type },
            body: file,
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
      tag: '',
      image: '',
      images: [],
      detailImage: '',
      detailImages: [],
      comparisons: [] 
    });
    setViewMode('edit_product');
  };

  const toggleSort = (key: 'brand' | 'category') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleVisibility = async (id: string, current: boolean) => {
    await updateProduct({ id: id as any, isVisible: !current });
  };

  const toggleMainExposure = async (id: string, current: boolean) => {
    if (!current) {
      const mainCount = allProducts.filter(p => p.showOnMain).length;
      if (mainCount >= 8) {
        alert('메인 노출은 최대 8개까지만 가능합니다.');
        return;
      }
    }
    await updateProduct({ id: id as any, showOnMain: !current });
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

  const handleBatchToggleVisibility = async (visible: boolean) => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await updateProduct({ id: id as any, isVisible: visible });
    }
    setSelectedIds([]);
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

  const onDragStart = (index: number) => setDraggedItemIndex(index);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (index: number) => {
    // 순서 변경 로직은 order 필드가 스키마에 추가되면 구현 가능
    setDraggedItemIndex(null);
  };

  const filteredProducts = allProducts
    .filter(p => p.planId === selectedPlanId)
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aVal = (a as any)[sortConfig.key] || "";
      const bVal = (b as any)[sortConfig.key] || "";
      if (sortConfig.direction === 'asc') return aVal.localeCompare(bVal);
      return bVal.localeCompare(aVal);
    });

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
              comparisons,
              images: thumbnailUrl ? [thumbnailUrl] : [],
              detailImages: detailUrls
            });
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
    <div className="p-8 h-full flex flex-col no-scrollbar overflow-y-auto relative">
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

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[24px] font-bold text-[#191F28]">제품관리</h2>
        <div className="text-[14px] text-[#8B95A1]">드래그로 순서 변경, 일괄 복사/삭제가 가능합니다.</div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
        {/* Left: Plan List */}
        <div className="w-[260px] flex flex-col bg-white rounded-[24px] border border-[#E5E8EB] overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#F2F4F6] bg-[#F9FAFB] flex justify-between items-center">
            <h3 className="font-bold text-[14px] text-[#4E5968]">구좌 선택</h3>
            <button className="p-1 bg-[#3182F6] text-white rounded-[6px]"><Plus className="w-4 h-4"/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
            {plans.map(plan => (
              <div 
                key={plan.id}
                onClick={() => { setSelectedPlanId(plan.id); setViewMode('list'); setSelectedIds([]); }}
                className={`p-4 rounded-[16px] cursor-pointer border transition-all ${
                  selectedPlanId === plan.id ? 'bg-[#3182F6] text-white shadow-md border-[#3182F6]' : 'bg-white border-transparent hover:bg-[#F2F4F6]'
                }`}
              >
                <div className="text-[14px] font-bold truncate">{plan.name}</div>
                <div className={`text-[11px] mt-1 ${selectedPlanId === plan.id ? 'text-white/70' : 'text-[#8B95A1]'}`}>{formatNumber(plan.basePrice)}원</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Product List */}
        <div className="flex-1 flex flex-col bg-white rounded-[24px] border border-[#E5E8EB] overflow-hidden shadow-sm">
          {viewMode === 'list' && selectedPlan ? (
            <>
              <div className="p-6 border-b border-[#F2F4F6] bg-[#F9FAFB] flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-[18px] mb-2">{selectedPlan.name} 리스트</h3>
                  <div className="flex gap-2">
                    <button onClick={() => toggleSort('brand')} className={`px-3 py-1.5 border rounded-[8px] text-[12px] font-bold transition-all ${sortConfig.key === 'brand' ? 'bg-[#3182F6] text-white border-[#3182F6]' : 'bg-white text-[#4E5968] border-[#E5E8EB]'}`}>
                      브랜드 {sortConfig.key === 'brand' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </button>
                    <button onClick={() => toggleSort('category')} className={`px-3 py-1.5 border rounded-[8px] text-[12px] font-bold transition-all ${sortConfig.key === 'category' ? 'bg-[#3182F6] text-white border-[#3182F6]' : 'bg-white text-[#4E5968] border-[#E5E8EB]'}`}>
                      카테고리 {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    ref={excelInputRef} 
                    className="hidden" 
                    accept=".xlsx, .xls" 
                    onChange={handleExcelUpload} 
                  />
                  <button 
                    onClick={downloadTemplate}
                    className="bg-white border border-[#E5E8EB] text-[#4E5968] px-4 py-2.5 rounded-[12px] text-[14px] font-bold flex items-center gap-2 hover:bg-[#F9FAFB] transition-colors"
                  >
                    <Download className="w-4 h-4" /> 양식 다운로드
                  </button>
                  <button 
                    onClick={() => excelInputRef.current?.click()}
                    className="bg-white border border-[#E5E8EB] text-[#3182F6] px-4 py-2.5 rounded-[12px] text-[14px] font-bold flex items-center gap-2 hover:bg-[#F9FAFB] transition-colors"
                  >
                    <Upload className="w-4 h-4" /> 엑셀 일괄등록
                  </button>
                  <button onClick={handleAddProduct} className="bg-[#3182F6] text-white px-5 py-3 rounded-[12px] font-bold text-[14px] flex items-center gap-2 shadow-lg shadow-[#3182F6]/20 transition-transform active:scale-95">
                    <Plus className="w-4 h-4" /> 신규 제품 등록
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
                  <div className="flex gap-2">
                    <button onClick={handleBatchCopy} className="p-1.5 hover:bg-white rounded-md text-[#3182F6] transition-colors" title="선택 복사"><Copy className="w-4 h-4"/></button>
                    <button onClick={() => handleBatchToggleVisibility(true)} className="p-1.5 hover:bg-white rounded-md text-[#1B64DA] transition-colors" title="선택 노출"><Eye className="w-4 h-4"/></button>
                    <button onClick={() => handleBatchToggleVisibility(false)} className="p-1.5 hover:bg-white rounded-md text-[#8B95A1] transition-colors" title="선택 숨김"><EyeOff className="w-4 h-4"/></button>
                    <button onClick={handleBatchDelete} className="p-1.5 hover:bg-white rounded-md text-red-500 transition-colors" title="선택 삭제"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
                <div className="text-[12px] text-[#8B95A1]">목록에서 개별 관리도 가능합니다.</div>
              </div>

              <div className="flex-1 overflow-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
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
                      <th className="px-4 py-4 w-32 text-[13px] font-bold text-[#4E5968] whitespace-nowrap">카테고리</th>
                      <th className="px-4 py-4 text-[13px] font-bold text-[#4E5968] whitespace-nowrap">제품명 / 모델명</th>
                      <th className="px-4 py-4 w-32 text-[13px] font-bold text-[#4E5968] text-right whitespace-nowrap">월납입금</th>
                      <th className="px-4 py-4 w-20 text-[13px] font-bold text-[#4E5968] text-center whitespace-nowrap">노출</th>
                      <th className="px-4 py-4 w-20 text-[13px] font-bold text-[#4E5968] text-center whitespace-nowrap">메인</th>
                      <th className="px-4 py-4 w-28 text-[13px] font-bold text-[#4E5968] text-right whitespace-nowrap">개별관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2F4F6]">
                    {filteredProducts.map((p, index) => (
                      <tr 
                        key={p._id} 
                        draggable
                        onDragStart={() => onDragStart(index)}
                        onDragOver={onDragOver}
                        onDrop={() => onDrop(index)}
                        className={`hover:bg-[#F9FAFB] transition-colors cursor-move group ${draggedItemIndex === index ? 'opacity-40' : ''} ${selectedIds.includes(p._id) ? 'bg-[#E8F3FF]/30' : ''}`}
                      >
                        <td className="px-4 py-4 text-center">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedIds(prev => prev.includes(p._id) ? prev.filter(i => i !== p._id) : [...prev, p._id]); }}>
                            {selectedIds.includes(p._id) ? <CheckSquare className="w-5 h-5 text-[#3182F6]"/> : <Square className="w-5 h-5 text-[#D1D6DB]"/>}
                          </button>
                        </td>
                        <td className="px-2 py-4 text-[#D1D6DB] group-hover:text-[#3182F6]"><MoveVertical className="w-5 h-5" /></td>
                        <td className="px-2 py-4">
                          <div className="w-12 h-12 bg-white border border-[#F2F4F6] rounded-lg overflow-hidden flex items-center justify-center">
                            {(p.images && p.images.length > 0) ? (
                              <img src={p.images[0]} className="w-full h-full object-contain" alt="thumb" />
                            ) : p.image ? (
                              <img src={p.image} className="w-full h-full object-contain" alt="thumb" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-[#D1D6DB]" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[14px] text-[#4E5968] font-bold">{p.brand}</td>
                        <td className="px-4 py-4 text-[13px] text-[#8B95A1] font-medium">{p.category}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 mb-1">
                            {p.tag && <span className="text-[10px] font-bold bg-[#3182F6] text-white px-1.5 py-0.5 rounded">{p.tag}</span>}
                            <div className="text-[14px] font-bold text-[#191F28]">{p.name}</div>
                          </div>
                          <div className="text-[12px] text-[#A3B1C6]">{p.model}</div>
                        </td>
                        <td className="px-4 py-4 text-[14px] font-bold text-right text-[#3182F6]">{formatNumber(p.price)}원</td>
                        <td className="px-4 py-4 text-center">
                          <button onClick={(e) => { e.stopPropagation(); toggleVisibility(p._id, p.isVisible); }} className={`p-1.5 rounded-full transition-colors ${p.isVisible ? 'bg-[#E8F3FF] text-[#1B64DA]' : 'bg-gray-100 text-gray-400'}`}>
                            {p.isVisible ? <Eye className="w-4 h-4"/> : <EyeOff className="w-4 h-4"/>}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button onClick={(e) => { e.stopPropagation(); toggleMainExposure(p._id, p.showOnMain); }} className={`p-1.5 rounded-full transition-colors ${p.showOnMain ? 'bg-[#FFF2F2] text-[#F04452]' : 'bg-gray-100 text-gray-400'}`}>
                            {p.showOnMain ? <Star className="w-4 h-4 fill-current"/> : <Star className="w-4 h-4"/>}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); copyProduct(p._id); }} className="p-1.5 hover:bg-white rounded-md text-[#3182F6]" title="복사"><Copy className="w-4 h-4"/></button>
                            <button onClick={(e) => { e.stopPropagation(); setEditingProduct(p); setViewMode('edit_product'); }} className="p-1.5 hover:bg-white rounded-md text-[#4E5968]" title="수정"><Edit className="w-4 h-4"/></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteProduct(p._id); }} className="p-1.5 hover:bg-white rounded-md text-red-500" title="삭제"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : viewMode === 'edit_product' && editingProduct ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="px-8 py-6 border-b border-[#F2F4F6] flex justify-between items-center shrink-0 bg-[#F9FAFB]">
                <div>
                  <h3 className="font-bold text-[20px] mb-1">제품 세부 정보 관리</h3>
                  <p className="text-[13px] text-[#8B95A1]">제품의 기본 정보와 노출 상태를 설정합니다.</p>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={() => { toggleVisibility(editingProduct._id, editingProduct.isVisible); setEditingProduct({...editingProduct, isVisible: !editingProduct.isVisible}); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-bold transition-all ${editingProduct.isVisible ? 'bg-[#E8F3FF] text-[#1B64DA]' : 'bg-gray-100 text-gray-500'}`}
                   >
                     {editingProduct.isVisible ? <><Eye className="w-4 h-4"/> 노출중</> : <><EyeOff className="w-4 h-4"/> 숨김상태</>}
                   </button>
                   <button 
                    onClick={() => { toggleMainExposure(editingProduct._id, editingProduct.showOnMain); setEditingProduct({...editingProduct, showOnMain: !editingProduct.showOnMain}); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-bold transition-all ${editingProduct.showOnMain ? 'bg-[#FFF2F2] text-[#F04452]' : 'bg-gray-100 text-gray-500'}`}
                   >
                     {editingProduct.showOnMain ? <><Star className="w-4 h-4 fill-current"/> 메인 노출중</> : <><Star className="w-4 h-4"/> 메인 미노출</>}
                   </button>
                   <button 
                    onClick={() => { deleteProduct(editingProduct._id); setViewMode('list'); }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-[10px] text-[13px] font-bold"
                   >
                     <Trash2 className="w-4 h-4"/> 삭제
                   </button>
                   <div className="w-4"></div>
                   <button onClick={() => setViewMode('list')} className="text-[#8B95A1] font-bold text-[14px] hover:text-[#191F28]">닫기</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                <div className="max-w-3xl space-y-8 pb-10">
                  <div className="grid grid-cols-2 gap-6">
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
                      <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">모델명</label>
                      <input type="text" value={editingProduct.model} onChange={(e) => setEditingProduct({...editingProduct, model: e.target.value})} className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none" />
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

                  {/* 타사 비교 정보 편집 */}
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
                      <div className="grid grid-cols-4 gap-4">
                        {(editingProduct.images || []).map((img: string, idx: number) => (
                          <div key={idx} className="aspect-square bg-[#F9FAFB] border border-[#E5E8EB] rounded-[16px] overflow-hidden relative group">
                            <img src={img} className="w-full h-full object-cover" />
                            <button 
                              onClick={() => removeImage('images', idx)}
                              className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3"/>
                            </button>
                            {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-[#3182F6]/80 text-white text-[10px] text-center py-0.5 font-bold">대표</div>}
                          </div>
                        ))}
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
                      <div className="grid grid-cols-4 gap-4">
                        {(editingProduct.detailImages || []).map((img: string, idx: number) => (
                          <div key={idx} className="aspect-square bg-[#F9FAFB] border border-[#E5E8EB] rounded-[16px] overflow-hidden relative group">
                            <img src={img} className="w-full h-full object-cover" />
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
                            const { _id, _creationTime, ...data } = productData;
                            await updateProduct({ id: _id, ...data });
                          } else {
                            await createProduct(productData);
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
        </div>
      </div>
    </div>
  );
}
