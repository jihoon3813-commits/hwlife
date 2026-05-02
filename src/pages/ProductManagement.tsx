import { useState, useRef } from 'react';
import { Plus, Download, Upload, Copy, Trash2, Edit, MoveVertical, Eye, EyeOff, ChevronRight, Settings2, ImageIcon, CheckSquare, Square } from 'lucide-react';

interface Plan {
  id: number;
  name: string;
  basePrice: string;
  benefitPrice: string;
  mainCount: number;
  isMainActive: boolean;
}

interface Product {
  id: number;
  planId: number;
  brand: string;
  category: string;
  name: string;
  model: string;
  price: string;
  isVisible: boolean;
  thumbnail?: string;
  detailImage?: string;
  comparisons?: { name: string; price: string; months: number }[];
}

export default function ProductManagement() {
  const [plans, setPlans] = useState<Plan[]>([
    { id: 1, name: '스페셜 299 더블', basePrice: '59,800', benefitPrice: '29,800', mainCount: 4, isMainActive: true },
    { id: 2, name: '스페셜 399 실속', basePrice: '69,800', benefitPrice: '39,800', mainCount: 4, isMainActive: false },
  ]);

  const [products, setProducts] = useState<Product[]>([
    { id: 1, planId: 1, brand: 'LG전자', category: '냉장고/김치냉장고', name: 'LG 디오스 오브제컬렉션 노크온', model: 'W822GBBR152', price: '59000', isVisible: true },
    { id: 2, planId: 1, brand: '삼성전자', category: 'TV/시청각', name: '75형 QLED 4K TV', model: 'KQ75QCE1AFXKR', price: '59800', isVisible: true },
    { id: 3, planId: 1, brand: '바디프랜드', category: '안마의자', name: '팬텀 로보', model: 'PHANTOM-ROBO', price: '69800', isVisible: true },
  ]);

  const [selectedPlanId, setSelectedPlanId] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'list' | 'edit_plan' | 'edit_product'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: 'brand' | 'category' | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

  const thumbInputRef = useRef<HTMLInputElement>(null);
  const detailInputRef = useRef<HTMLInputElement>(null);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const formatNumber = (val: string) => {
    if (!val) return "0";
    return val.toString().replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleAddProduct = () => {
    const newId = Date.now();
    setEditingProduct({ 
      id: newId, 
      planId: selectedPlanId, 
      brand: '삼성전자', 
      category: '냉장고/김치냉장고', 
      name: '', 
      model: '', 
      price: '', 
      isVisible: true,
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
    
    const sorted = [...products].sort((a, b) => {
      if (direction === 'asc') return a[key].localeCompare(b[key]);
      return b[key].localeCompare(a[key]);
    });
    setProducts(sorted);
  };

  const toggleVisibility = (id: number) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isVisible: !p.isVisible } : p));
  };

  const deleteProduct = (id: number) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const copyProduct = (id: number) => {
    const target = products.find(p => p.id === id);
    if (target) {
      const copy = { ...target, id: Date.now(), name: `${target.name} (복사본)` };
      setProducts(prev => [...prev, copy]);
    }
  };

  // Batch Actions
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`${selectedIds.length}개의 항목을 삭제하시겠습니까?`)) {
      setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
    }
  };

  const handleBatchToggleVisibility = (visible: boolean) => {
    if (selectedIds.length === 0) return;
    setProducts(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, isVisible: visible } : p));
    setSelectedIds([]);
  };

  const handleBatchCopy = () => {
    if (selectedIds.length === 0) return;
    const copies = products
      .filter(p => selectedIds.includes(p.id))
      .map((p, idx) => ({ ...p, id: Date.now() + idx, name: `${p.name} (복사본)` }));
    setProducts(prev => [...prev, ...copies]);
    setSelectedIds([]);
  };

  const onDragStart = (index: number) => setDraggedItemIndex(index);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (index: number) => {
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    const updatedProducts = [...products];
    const filteredByPlan = updatedProducts.filter(p => p.planId === selectedPlanId);
    const otherProducts = updatedProducts.filter(p => p.planId !== selectedPlanId);
    const itemToMove = filteredByPlan[draggedItemIndex];
    filteredByPlan.splice(draggedItemIndex, 1);
    filteredByPlan.splice(index, 0, itemToMove);
    setProducts([...filteredByPlan, ...otherProducts]);
    setDraggedItemIndex(null);
  };

  const filteredProducts = products.filter(p => p.planId === selectedPlanId);

  return (
    <div className="p-8 h-full flex flex-col no-scrollbar overflow-y-auto">
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
                onClick={() => setSelectedPlanId(plan.id)}
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
                <button onClick={handleAddProduct} className="bg-[#3182F6] text-white px-5 py-3 rounded-[12px] font-bold text-[14px] flex items-center gap-2 shadow-lg shadow-[#3182F6]/20 transition-transform active:scale-95">
                  <Plus className="w-4 h-4" /> 신규 제품 등록
                </button>
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
                        <button onClick={() => setSelectedIds(selectedIds.length === filteredProducts.length ? [] : filteredProducts.map(p => p.id))}>
                          {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? <CheckSquare className="w-5 h-5 text-[#3182F6]"/> : <Square className="w-5 h-5 text-[#D1D6DB]"/>}
                        </button>
                      </th>
                      <th className="px-4 py-4 w-10"></th>
                      <th className="px-4 py-4 text-[13px] font-bold text-[#4E5968]">브랜드</th>
                      <th className="px-4 py-4 text-[13px] font-bold text-[#4E5968]">제품명 / 모델명</th>
                      <th className="px-4 py-4 text-[13px] font-bold text-[#4E5968] text-right">월납입금</th>
                      <th className="px-4 py-4 text-[13px] font-bold text-[#4E5968] text-center">노출</th>
                      <th className="px-4 py-4 text-[13px] font-bold text-[#4E5968] text-right">개별관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2F4F6]">
                    {filteredProducts.map((p, index) => (
                      <tr 
                        key={p.id} 
                        draggable
                        onDragStart={() => onDragStart(index)}
                        onDragOver={onDragOver}
                        onDrop={() => onDrop(index)}
                        className={`hover:bg-[#F9FAFB] transition-colors cursor-move group ${draggedItemIndex === index ? 'opacity-40' : ''} ${selectedIds.includes(p.id) ? 'bg-[#E8F3FF]/30' : ''}`}
                      >
                        <td className="px-4 py-4 text-center">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedIds(prev => prev.includes(p.id) ? prev.filter(i => i !== p.id) : [...prev, p.id]); }}>
                            {selectedIds.includes(p.id) ? <CheckSquare className="w-5 h-5 text-[#3182F6]"/> : <Square className="w-5 h-5 text-[#D1D6DB]"/>}
                          </button>
                        </td>
                        <td className="px-2 py-4 text-[#D1D6DB] group-hover:text-[#3182F6]"><MoveVertical className="w-5 h-5" /></td>
                        <td className="px-4 py-4 text-[14px] text-[#4E5968] font-bold">{p.brand}</td>
                        <td className="px-4 py-4">
                          <div className="text-[14px] font-bold text-[#191F28]">{p.name}</div>
                          <div className="text-[12px] text-[#A3B1C6]">{p.model}</div>
                        </td>
                        <td className="px-4 py-4 text-[14px] font-bold text-right text-[#3182F6]">{formatNumber(p.price)}원</td>
                        <td className="px-4 py-4 text-center">
                          <button onClick={(e) => { e.stopPropagation(); toggleVisibility(p.id); }} className={`p-1.5 rounded-full transition-colors ${p.isVisible ? 'bg-[#E8F3FF] text-[#1B64DA]' : 'bg-gray-100 text-gray-400'}`}>
                            {p.isVisible ? <Eye className="w-4 h-4"/> : <EyeOff className="w-4 h-4"/>}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); copyProduct(p.id); }} className="p-1.5 hover:bg-white rounded-md text-[#3182F6]" title="복사"><Copy className="w-4 h-4"/></button>
                            <button onClick={(e) => { e.stopPropagation(); setEditingProduct(p); setViewMode('edit_product'); }} className="p-1.5 hover:bg-white rounded-md text-[#4E5968]" title="수정"><Edit className="w-4 h-4"/></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteProduct(p.id); }} className="p-1.5 hover:bg-white rounded-md text-red-500" title="삭제"><Trash2 className="w-4 h-4"/></button>
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
                    onClick={() => { toggleVisibility(editingProduct.id); setEditingProduct({...editingProduct, isVisible: !editingProduct.isVisible}); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-bold transition-all ${editingProduct.isVisible ? 'bg-[#E8F3FF] text-[#1B64DA]' : 'bg-gray-100 text-gray-500'}`}
                   >
                     {editingProduct.isVisible ? <><Eye className="w-4 h-4"/> 현재 노출중</> : <><EyeOff className="w-4 h-4"/> 현재 숨김상태</>}
                   </button>
                   <button 
                    onClick={() => { deleteProduct(editingProduct.id); setViewMode('list'); }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-[10px] text-[13px] font-bold"
                   >
                     <Trash2 className="w-4 h-4"/> 삭제하기
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
                      <select value={editingProduct.brand} onChange={(e) => setEditingProduct({...editingProduct, brand: e.target.value})} className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none">
                        <option>삼성전자</option><option>LG전자</option><option>바디프랜드</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">카테고리</label>
                      <select value={editingProduct.category} onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none">
                        <option>TV/시청각</option><option>냉장고/김치냉장고</option><option>안마의자</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">제품명</label>
                      <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">모델명</label>
                      <input type="text" value={editingProduct.model} onChange={(e) => setEditingProduct({...editingProduct, model: e.target.value})} className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">월 납입금</label>
                      <input type="text" value={formatNumber(editingProduct.price)} onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value.replace(/\D/g, '')})} className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] font-bold text-[#3182F6] text-right" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-[13px] font-bold text-[#4E5968] px-1">썸네일</label>
                      <div onClick={() => thumbInputRef.current?.click()} className="aspect-square bg-[#F9FAFB] border-2 border-dashed border-[#E5E8EB] rounded-[24px] flex items-center justify-center cursor-pointer overflow-hidden relative group transition-all hover:border-[#3182F6]">
                        {editingProduct.thumbnail ? <img src={editingProduct.thumbnail} className="w-full h-full object-cover" /> : <Plus className="w-10 h-10 text-[#D1D6DB] group-hover:text-[#3182F6]" />}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[14px] font-bold">이미지 변경</div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[13px] font-bold text-[#4E5968] px-1">상세 이미지</label>
                      <div onClick={() => detailInputRef.current?.click()} className="aspect-square bg-[#F9FAFB] border-2 border-dashed border-[#E5E8EB] rounded-[24px] flex items-center justify-center cursor-pointer overflow-hidden relative group transition-all hover:border-[#3182F6]">
                        {editingProduct.detailImage ? <img src={editingProduct.detailImage} className="w-full h-full object-cover" /> : <Plus className="w-10 h-10 text-[#D1D6DB] group-hover:text-[#3182F6]" />}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[14px] font-bold">이미지 변경</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 flex gap-4">
                    <button onClick={() => setViewMode('list')} className="flex-1 bg-[#F2F4F6] text-[#4E5968] font-bold py-4 rounded-[20px] transition-all hover:bg-[#E5E8EB]">취소하기</button>
                    <button onClick={() => setViewMode('list')} className="flex-[2] bg-[#3182F6] text-white font-bold py-4 rounded-[20px] shadow-lg shadow-[#3182F6]/20 transition-transform active:scale-95">정보 저장하기</button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
