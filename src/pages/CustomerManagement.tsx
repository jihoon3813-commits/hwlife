import { useState, useEffect } from 'react';
import { X, Search, Filter, History, RefreshCw, Trash2, Save, Plus, Smartphone, Send, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function CustomerManagement({ channelId }: { channelId?: string }) {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [memo, setMemo] = useState('');
  const [status, setStatus] = useState('대기');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSendingSms, setIsSendingSms] = useState(false);
  
  // Local state for editing details
  const [editData, setEditData] = useState<any>({});
  const [selectedChannelId, setSelectedChannelId] = useState<string>('all');

  // Direct Registration State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerList, setRegisterList] = useState<any[]>([]);
  const [registerForm, setRegisterForm] = useState<any>({
    channelId: '본사',
    name: '',
    phone: '',
    productName: '',
    account: '',
    appliance: '',
    birth: '',
    gender: '',
    address: '',
    detailAddress: ''
  });

  
  const settings = useQuery(api.settings.get);
  const channels = useQuery(api.channels.get);
  
  const subChannelIds = useQuery(api.channels.getSubChannelIds, 
    channelId ? { subdomain: channelId } : 'skip'
  );

  const inquiries = useQuery(api.inquiries.list, 
    channelId 
      ? (subChannelIds ? { channelIds: subChannelIds } : 'skip') 
      : {}
  );

  const updateInquiry = useMutation(api.inquiries.update);
  const removeInquiry = useMutation(api.inquiries.remove);
  const createInquiry = useMutation(api.inquiries.create);
  const allProducts = useQuery(api.products.getAllProducts);
  const sendConsentSms = useAction(api.sms.sendConsentSms);
  const landings = useQuery(api.landings.get);
  const allPlans = useQuery(api.plans.get);


  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (selectedCustomer && allProducts && allPlans) {
      let resolvedCategoryName = selectedCustomer.productName;
      let resolvedAccount = selectedCustomer.account;
      let resolvedAppliance = selectedCustomer.appliance;

      // 1. Try to find if productName is already a Category Name
      const planByName = allPlans.find(p => p.name === selectedCustomer.productName);
      
      if (!planByName) {
        // 2. If not, productName might be the appliance name. Try to find the product.
        const product = allProducts.find(p => {
          const fullName = `${p.brand} ${p.name}`;
          const dbProductName = selectedCustomer.productName || '';
          const dbAppliance = selectedCustomer.appliance || '';
          
          return (
            dbProductName === p.name || 
            dbProductName === fullName ||
            (p.name && dbProductName.includes(p.name)) ||
            (p.model && (dbAppliance.includes(p.model) || dbProductName.includes(p.model)))
          );
        });

        if (product) {
          const plan = allPlans.find(pl => pl.numericId === product.planId);
          if (plan) {
            resolvedCategoryName = plan.name;
            resolvedAccount = plan.accountCount;
            // Show both name and model for clarity
            resolvedAppliance = `${product.name} (${product.model})`;
          }
        }
      } else {
         // It's already a category name, ensure account is sync'd if missing
         if (!resolvedAccount) resolvedAccount = planByName.accountCount;
      }

      setEditData({
        ...selectedCustomer,
        newRegDate: selectedCustomer.newRegDate || new Date(selectedCustomer.createdAt + 9 * 60 * 60 * 1000).toISOString().split('T')[0],
        productName: resolvedCategoryName || selectedCustomer.productName,
        account: resolvedAccount || selectedCustomer.account,
        appliance: resolvedAppliance || selectedCustomer.appliance
      });
      setStatus(selectedCustomer.status);
      setMemo('');
    }
  }, [selectedCustomer, allProducts, allPlans]);

  const openPostcode = () => {
    if (!(window as any).daum || !(window as any).daum.Postcode) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    new (window as any).daum.Postcode({
      oncomplete: function(data: any) {
        let fullAddr = data.roadAddress || data.jibunAddress;
        let extraAddr = '';

        if (data.addressType === 'R') {
          if (data.bname !== '') {
            extraAddr += data.bname;
          }
          if (data.buildingName !== '') {
            extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
          }
          fullAddr += (extraAddr !== '' ? ' (' + extraAddr + ')' : '');
        }

        setEditData((prev: any) => ({
          ...prev,
          address: fullAddr
        }));
      }
    }).open();
  };

  const openRegisterPostcode = () => {
    if (!(window as any).daum || !(window as any).daum.Postcode) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    new (window as any).daum.Postcode({
      oncomplete: function(data: any) {
        let fullAddr = data.roadAddress || data.jibunAddress;
        let extraAddr = '';

        if (data.addressType === 'R') {
          if (data.bname !== '') {
            extraAddr += data.bname;
          }
          if (data.buildingName !== '') {
            extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
          }
          fullAddr += (extraAddr !== '' ? ' (' + extraAddr + ')' : '');
        }

        setRegisterForm((prev: any) => ({
          ...prev,
          address: fullAddr
        }));
      }
    }).open();
  };

  const formatBirthDate = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 4) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 4)}-${numbers.slice(4, 6)}`;
  };

  const handleAddToList = () => {
    if (registerForm.name && registerForm.phone) {
      setRegisterList([...registerList, { ...registerForm, id: Date.now(), source: 'direct' }]);
      setRegisterForm({
        channelId: channelId || '본사',
        name: '',
        phone: '',
        productName: '',
        account: '',
        appliance: '',
        birth: '',
        gender: '',
        address: '',
        detailAddress: ''
      });
    } else {
      alert('고객명과 연락처는 필수 입력 사항입니다.');
    }
  };

  const handleRemoveFromList = (id: number) => {
    setRegisterList(registerList.filter(item => item.id !== id));
  };

  const handleBulkRegister = async () => {
    if (registerList.length === 0) return;
    if (confirm(`${registerList.length}명의 고객을 등록하시겠습니까?`)) {
      try {
        for (const item of registerList) {
          const { id, ...data } = item;
          await createInquiry(data);
        }
        alert('모든 고객이 등록되었습니다.');
        setRegisterList([]);
        setIsRegisterModalOpen(false);
      } catch (e) {
        console.error(e);
        alert('등록 중 오류가 발생했습니다.');
      }
    }
  };

  const handleOpenRegisterModal = () => {
    setRegisterForm((prev: any) => ({
      ...prev,
      channelId: channelId || '본사'
    }));
    setIsRegisterModalOpen(true);
  };

  const handleSendConsent = async () => {
    if (!selectedCustomer) return;
    
    // SMS 설정 확인
    const smsConfig = (settings as any)?.sms;
    if (!smsConfig || !smsConfig.apiKey || !smsConfig.userId || !smsConfig.sender) {
      alert('SMS 설정이 완료되지 않았습니다.\n환경설정 > SMS 설정에서 알리고 API 정보를 먼저 입력해주세요.');
      return;
    }

    if (!window.confirm(`${selectedCustomer.name}님에게 동의서 문자를 발송하시겠습니까?`)) return;

    setIsSendingSms(true);
    try {
      const result = await sendConsentSms({
        inquiryId: selectedCustomer._id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        productName: editData.productName, // Use current edited productName
      });
      alert(result.message || '문자 발송이 완료되었습니다.');
    } catch (e: any) {
      alert(e.message || '발송 중 오류가 발생했습니다.');
    } finally {
      setIsSendingSms(null as any);
      setIsSendingSms(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCustomer) return;
    try {
      // Exclude _id, _creationTime, and non-schema fields to avoid Convex validation errors
      const { _id, _creationTime, createdAt, message, ...validUpdates } = editData;
      
      const updates: any = { ...validUpdates, status };
      
      if (memo.trim()) {
        const newHistory = {
          date: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0],
          status,
          memo: memo.trim()
        };
        updates.memoHistory = [...(selectedCustomer.memoHistory || []), newHistory];
      }
      
      await updateInquiry({ id: selectedCustomer._id, ...updates });
      alert('저장되었습니다.');
      setSelectedCustomer(null);
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    if (confirm('정말로 이 고객 정보를 삭제하시겠습니까?')) {
      await removeInquiry({ id: selectedCustomer._id });
      setSelectedCustomer(null);
      setSelectedIds(prev => prev.filter(id => id !== selectedCustomer._id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`선택한 ${selectedIds.length}명의 고객 정보를 삭제하시겠습니까?`)) {
      for (const id of selectedIds) {
        await removeInquiry({ id: id as any });
      }
      setSelectedIds([]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInquiries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInquiries.map(inq => inq._id));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    }
    if (phoneNumberLength < 11) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
    }
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  const getStatusStyle = (statusName: string) => {
    const statusSetting = settings?.statuses?.find((s: any) => s.name === statusName);
    if (statusSetting && statusSetting.color) {
      const hex = statusSetting.color;
      let textColor = '#4E5968';
      try {
        const color = hex.replace('#', '');
        const r = parseInt(color.substring(0, 2), 16);
        const g = parseInt(color.substring(2, 4), 16);
        const b = parseInt(color.substring(4, 6), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        textColor = brightness > 155 ? '#4E5968' : '#FFFFFF';
      } catch (e) {
        textColor = '#4E5968';
      }
      return { bg: hex, text: textColor };
    }
    return { bg: '#F2F4F6', text: '#4E5968' };
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChannelName = (id?: string) => {
    if (!id || id === '본사' || id === 'default') return '본사';
    if (!channels) return '...';
    return channels?.find(c => c.subdomain === id)?.channelName || id;
  };



  const getInquiryCountsByChannel = () => {
    if (!inquiries || !channels || channelId) return [];
    
    // Create a mapping from subdomain and landingPage to channel subdomain
    const pathMap: { [key: string]: string } = {};
    channels.forEach(c => {
      if (c.landingPage) {
        // Map path (e.g. /living) to subdomain (e.g. bestone)
        pathMap[c.landingPage.replace('/', '')] = c.subdomain;
      }
    });

    const counts: { [key: string]: number } = {};
    inquiries.forEach(inq => {
      let cid = inq.channelId || 'default';
      // If cid is a path (like 'living'), map it to the subdomain
      if (pathMap[cid]) {
        cid = pathMap[cid];
      }
      counts[cid] = (counts[cid] || 0) + 1;
    });
    
    const result = channels.map(c => ({
      name: c.channelName,
      id: c.subdomain,
      count: counts[c.subdomain] || 0
    }));
    
    result.unshift({ name: '본사', id: 'default', count: counts['default'] || counts['본사'] || 0 });
    return result;
  };




  if (!inquiries) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 text-[#3182F6] animate-spin mb-4" />
        <p className="text-[14px] font-bold text-[#4E5968]">고객 데이터를 불러오는 중...</p>
      </div>
    );
  }

  const filteredInquiries = inquiries.filter(inq => {
    // 1. Channel Filter
    if (selectedChannelId !== 'all') {
      const targetCid = (selectedChannelId === 'default' || selectedChannelId === '본사') ? undefined : selectedChannelId;
      const inquiryCid = (!inq.channelId || inq.channelId === '본사' || inq.channelId === 'default') ? undefined : inq.channelId;
      if (inquiryCid !== targetCid) return false;
    }

    
    // 2. Search Query Filter
    const search = searchQuery.toLowerCase();
    return (
      (inq.name || '').toLowerCase().includes(search) || 
      (inq.phone || '').toLowerCase().includes(search) || 
      (inq.productName || '').toLowerCase().includes(search)
    );
  });


  return (
    <div className="p-4 lg:p-8">
      {!channelId && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <div 
            onClick={() => setSelectedChannelId('all')}
            className={`p-4 rounded-[16px] border cursor-pointer transition-all ${selectedChannelId === 'all' ? 'bg-[#3182F6] border-[#3182F6] text-white shadow-lg shadow-blue-500/20' : 'bg-white border-[#E5E8EB] text-[#4E5968] hover:border-[#3182F6]'}`}
          >
            <p className="text-[12px] font-bold opacity-80 mb-1">전체 채널</p>
            <p className="text-[18px] font-black">{inquiries?.length || 0}건</p>
          </div>
          {getInquiryCountsByChannel().filter(c => c.count > 0 || c.id === 'default').map(c => (
            <div 
              key={c.id}
              onClick={() => setSelectedChannelId(c.id === 'default' ? 'default' : c.id)}
              className={`p-4 rounded-[16px] border cursor-pointer transition-all ${((c.id === 'default' && selectedChannelId === 'default') || selectedChannelId === c.id) ? 'bg-[#191F28] border-[#191F28] text-white shadow-lg' : 'bg-white border-[#E5E8EB] text-[#4E5968] hover:border-[#191F28]'}`}
            >
              <p className="text-[12px] font-bold opacity-80 mb-1">{c.name}</p>
              <p className="text-[18px] font-black">{c.count}건</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <h2 className="text-[20px] lg:text-[24px] font-bold">
          고객관리 
          {!channelId && selectedChannelId !== 'all' && (
            <span className="text-[#3182F6] text-[16px] ml-2">
              ({getChannelName(selectedChannelId === 'default' ? undefined : selectedChannelId)})
            </span>
          )}
        </h2>

        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="flex-1 lg:flex-none bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 px-4 py-2 rounded-[8px] flex items-center justify-center gap-2 text-[14px] font-bold transition-colors"
              >
                <Trash2 className="w-4 h-4" /> 삭제 ({selectedIds.length})
              </button>
            )}
            <button 
              onClick={handleOpenRegisterModal}
              className="flex-1 lg:flex-none bg-[#191F28] text-white px-4 py-2 rounded-[8px] flex items-center justify-center gap-2 text-[14px] font-bold hover:bg-[#2D3644] transition-colors"
            >
              <Plus className="w-4 h-4" /> 고객 직접 등록
            </button>
          </div>
          <div className="flex gap-2 w-full lg:w-auto">
            {!channelId && (
              <select 
                value={selectedChannelId} 
                onChange={(e) => setSelectedChannelId(e.target.value)}
                className="bg-white border border-[#E5E8EB] px-4 py-2 rounded-[8px] text-[14px] font-medium shadow-sm outline-none focus:ring-2 focus:ring-[#3182F6]/20"
              >
                <option value="all">모든 채널</option>
                <option value="default">본사</option>
                {channels?.map(c => (
                  <option key={c._id} value={c.subdomain}>{c.channelName}</option>
                ))}
              </select>
            )}
            {channelId && subChannelIds && subChannelIds.length > 1 && (
               <select 
                 value={selectedChannelId} 
                 onChange={(e) => setSelectedChannelId(e.target.value)}
                 className="bg-white border border-[#E5E8EB] px-4 py-2 rounded-[8px] text-[14px] font-medium shadow-sm outline-none focus:ring-2 focus:ring-[#3182F6]/20"
               >
                 <option value="all">내 하위 채널 전체</option>
                 {subChannelIds.map(sid => (
                   <option key={sid} value={sid}>{getChannelName(sid)}</option>
                 ))}
               </select>
            )}

            <div className="flex-1 lg:w-[240px] bg-white border border-[#E5E8EB] rounded-[8px] flex items-center px-3 py-2 shadow-sm">
              <Search className="w-4 h-4 text-[#8B95A1] mr-2" />
              <input 
                type="text" 
                placeholder="고객명, 연락처, 상품 검색" 
                className="text-[14px] focus:outline-none w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[16px] shadow-sm border border-[#E5E8EB] overflow-x-auto hide-scrollbar">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-[#F9FAFB] border-b border-[#E5E8EB]">
            <tr>
              <th className="px-6 py-4 w-12">
                <input 
                  type="checkbox" 
                  checked={filteredInquiries.length > 0 && selectedIds.length === filteredInquiries.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-[#E5E8EB] text-[#3182F6] focus:ring-[#3182F6]"
                />
              </th>
              <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">구분</th>
              <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">등록일시</th>
              <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">채널명</th>

              <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">고객명</th>
              <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">연락처</th>
              <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">신청상품</th>
              <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">결합제품</th>
              <th className="px-6 py-4 text-[13px] font-bold text-[#4E5968]">진행상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E8EB]">
            {filteredInquiries.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-20 text-center text-[#8B95A1] text-[14px]">
                  등록된 고객이 없습니다.
                </td>
              </tr>
            ) : (
              filteredInquiries.map(customer => {
                // 신청상품 & 결합제품 노출 로직
                let displayPlan = customer.productName;
                let displayAppliance = customer.appliance || '-';

                // 결합제품명이 모델명으로만 되어있을 경우 제품명(모델명)으로 변환
                if (displayAppliance !== '-' && allProducts) {
                  const matchedProduct = allProducts.find(p => p.model === displayAppliance);
                  if (matchedProduct) {
                    displayAppliance = `${matchedProduct.name} (${matchedProduct.model})`;
                  }
                }

                // 1. productName이 가전명인 경우 (홈페이지 신청 등) 처리
                const planByName = allPlans?.find(p => p.name === customer.productName);
                if (!planByName && allProducts && allPlans) {
                  const matchedProduct = allProducts.find(p => 
                    p.name === customer.productName || 
                    `${p.brand} ${p.name}` === customer.productName ||
                    (p.model && customer.appliance?.includes(p.model))
                  );
                  if (matchedProduct) {
                    const plan = allPlans.find(pl => pl.numericId === matchedProduct.planId);
                    if (plan) displayPlan = plan.name;
                  }
                } else if (planByName) {
                  displayPlan = planByName.name;
                }

                // 괄호 안에 구좌수 표시 (단, _메인 신청건은 구좌수 표시 제외)
                const isMainSubmission = displayPlan?.endsWith('_메인') || customer.productName?.endsWith('_메인');
                const accountLabel = (customer.account && !isMainSubmission) ? `(${customer.account})` : '';
                const finalPlanDisplay = `${displayPlan}${accountLabel}`;
                
                // 특수 처리: 만약 displayPlan에 이미 (2구좌) 등이 붙어있다면 제거 (중복 방지)
                const cleanedPlanDisplay = finalPlanDisplay.replace(/\s*\(.*구좌\)$/, '');
                const finalOutput = isMainSubmission ? cleanedPlanDisplay : finalPlanDisplay;

                return (
                  <tr 
                    key={customer._id} 
                    className={`hover:bg-[#F9FAFB] cursor-pointer transition-colors ${selectedIds.includes(customer._id) ? 'bg-[#F2F8FF]' : ''}`}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(customer._id)}
                        onChange={(e) => { e.stopPropagation(); toggleSelect(customer._id, e as any); }}
                        className="w-4 h-4 rounded border-[#E5E8EB] text-[#3182F6] focus:ring-[#3182F6] cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${customer.source === 'direct' ? 'bg-[#F2F4F6] text-[#4E5968]' : 'bg-[#3182F6]/10 text-[#3182F6]'}`}>
                        {customer.source === 'direct' ? 'D' : 'H'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[13px] text-[#191F28] font-medium">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-[11px] text-[#8B95A1]">
                        {new Date(customer.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[12px] font-bold px-2 py-1 rounded-md ${(!customer.channelId || customer.channelId === '본사') ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-[#3182F6]'}`}>
                        {getChannelName(customer.channelId)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-[14px] font-bold text-[#191F28]">{customer.name}</td>
                    <td className="px-6 py-4 text-[14px] text-[#4E5968]">{customer.phone}</td>
                    <td className="px-6 py-4 text-[14px] text-[#4E5968] font-medium">{finalOutput}</td>
                    <td className="px-6 py-4 text-[14px] text-[#4E5968] max-w-[200px] truncate">{displayAppliance}</td>
                    <td className="px-6 py-4">
                      <span 
                        className="inline-block text-[12px] font-bold px-2.5 py-1 rounded-full"
                        style={{ 
                          backgroundColor: getStatusStyle(customer.status).bg, 
                          color: getStatusStyle(customer.status).text 
                        }}
                      >
                        {customer.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 lg:p-4">
          <div className="bg-white lg:rounded-[24px] w-full max-w-[800px] h-full lg:h-auto lg:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-[#E5E8EB] flex justify-between items-center bg-white z-10 shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="text-[20px] font-bold">상담 고객 상세정보</h3>
                <span 
                  className="inline-block text-[12px] font-bold px-2.5 py-1 rounded-full"
                  style={{ 
                    backgroundColor: getStatusStyle(status).bg, 
                    color: getStatusStyle(status).text 
                  }}
                >
                  {status}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={handleDelete} className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors" title="삭제">
                  <Trash2 className="w-5 h-5" />
                </button>
                {(selectedCustomer.productName?.toLowerCase().includes('living') || selectedCustomer.productName?.includes('리빙') || editData.productName?.includes('리빙')) && (
                  <button 
                    onClick={handleSendConsent} 
                    disabled={isSendingSms}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-bold transition-all ${isSendingSms ? 'bg-gray-100 text-gray-400' : 'bg-[#3182F6] text-white hover:bg-[#1B64DA] shadow-sm'}`}
                    title="구매동의 문자 발송"
                  >
                    {isSendingSms ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                    구매동의 문자발송
                  </button>
                )}
                <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-[#F2F4F6] rounded-full transition-colors">
                  <X className="w-6 h-6 text-[#4E5968]" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col gap-6 bg-[#F9FAFB] hide-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. 기본 고객 정보 */}
                <section className="bg-white p-5 rounded-[16px] border border-[#E5E8EB]">
                  <h4 className="text-[15px] font-bold mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3182F6]"></span>기본 고객 정보
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">고객명</label>
                      <input type="text" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">연락처</label>
                      <input type="text" value={editData.phone || ''} onChange={e => setEditData({...editData, phone: formatPhoneNumber(e.target.value)})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">성별</label>
                      <select value={editData.gender || ''} onChange={e => setEditData({...editData, gender: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]">
                        <option value="">선택</option>
                        <option>남성</option>
                        <option>여성</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">생년월일 (6자리)</label>
                      <input type="text" value={editData.birth || ''} onChange={e => setEditData({...editData, birth: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" placeholder="YYMMDD" />
                    </div>
                    <div className="col-span-2">
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-[12px] font-medium text-[#8B95A1]">주소</label>
                        <button onClick={openPostcode} className="text-[11px] bg-[#3182F6] text-white px-2.5 py-1 rounded-[4px] font-bold hover:bg-[#1B64DA] transition-colors">주소 검색</button>
                      </div>
                      <input type="text" value={editData.address || ''} readOnly onClick={openPostcode} className="w-full bg-[#F2F4F6] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px] mb-2 cursor-pointer text-[#4E5968]" placeholder="기본 주소 (검색 버튼을 눌러주세요)" />
                      <input type="text" value={editData.detailAddress || ''} onChange={e => setEditData({...editData, detailAddress: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" placeholder="상세 주소 입력" />
                    </div>
                  </div>
                </section>

                {/* 2. 상담/계약 일정 정보 */}
                <section className="bg-white p-5 rounded-[16px] border border-[#E5E8EB]">
                  <h4 className="text-[15px] font-bold mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#BE123C]"></span>상담/계약 일정 정보
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    {/* If product is living (신한카드 144) */}
                    {(selectedCustomer.productName?.toLowerCase().includes('living') || selectedCustomer.productName?.includes('리빙') || editData.productName?.includes('리빙')) ? (
                      <>
                        <div>
                          <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">신규 접수일</label>
                          <input type="date" value={editData.newRegDate || ''} onChange={e => setEditData({...editData, newRegDate: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold text-[#3182F6] mb-1">카드 결제일</label>
                          <input type="date" value={editData.cardPaymentDate || ''} onChange={e => setEditData({...editData, cardPaymentDate: e.target.value})} className="w-full bg-[#F0F7FF] border border-[#3182F6]/30 px-3 py-2 rounded-[8px] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#3182F6]/20" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold text-[#059669] mb-1">구매 동의일 (자동)</label>
                          <input type="date" value={editData.purchaseConsentDate || ''} readOnly className="w-full bg-[#ECFDF5] border border-[#059669]/30 px-3 py-2 rounded-[8px] text-[13px] text-[#059669] cursor-default" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold text-[#D97706] mb-1">상조 계약일</label>
                          <input type="date" value={editData.sangjoContractDate || ''} onChange={e => setEditData({...editData, sangjoContractDate: e.target.value})} className="w-full bg-[#FFFBEB] border border-[#D97706]/30 px-3 py-2 rounded-[8px] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#D97706]/20" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">청약 철회일</label>
                          <input type="date" value={editData.cancelDate || ''} onChange={e => setEditData({...editData, cancelDate: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">계약 해지일</label>
                          <input type="date" value={editData.terminationDate || ''} onChange={e => setEditData({...editData, terminationDate: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">가전 배송일</label>
                          <input type="date" value={editData.deliveryDate || ''} onChange={e => setEditData({...editData, deliveryDate: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">신규 접수일</label>
                          <input type="date" value={editData.newRegDate || ''} onChange={e => setEditData({...editData, newRegDate: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">상조 계약일</label>
                          <input type="date" value={editData.sangjoContractDate || ''} onChange={e => setEditData({...editData, sangjoContractDate: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">렌탈 계약일</label>
                          <input type="date" value={editData.rentalContractDate || ''} onChange={e => setEditData({...editData, rentalContractDate: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">청약 철회일</label>
                          <input type="date" value={editData.cancelDate || ''} onChange={e => setEditData({...editData, cancelDate: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">계약 해지일</label>
                          <input type="date" value={editData.terminationDate || ''} onChange={e => setEditData({...editData, terminationDate: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">가전 배송일</label>
                          <input type="date" value={editData.deliveryDate || ''} onChange={e => setEditData({...editData, deliveryDate: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                        </div>
                      </>
                    )}
                    <div className="col-span-2">
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">특이사항</label>
                      <input type="text" value={editData.note || ''} onChange={e => setEditData({...editData, note: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" />
                    </div>
                  </div>
                </section>
              </div>

              {/* 3. 신청 상품 정보 */}
              <section className="bg-white p-5 rounded-[16px] border border-[#E5E8EB]">
                <h4 className="text-[15px] font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span>신청 상품 정보
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-[#F2F4F6] p-4 rounded-[12px] space-y-3">
                    <div>
                      <label className="block text-[12px] font-bold text-[#8B95A1] mb-1">신청상품 (카테고리)</label>
                      <select 
                        value={editData.productName || ''} 
                        onChange={e => {
                          const plan = allPlans?.find(p => p.name === e.target.value);
                          setEditData({
                            ...editData, 
                            productName: e.target.value,
                            account: plan ? plan.accountCount : '',
                            appliance: ''
                          });
                        }} 
                        className="w-full bg-white border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px] font-bold"
                      >
                        <option value="">카테고리 선택</option>
                        {allPlans?.map(plan => (
                          <option key={plan._id} value={plan.name}>{plan.name}</option>
                        ))}
                      </select>
                    </div>
                    {selectedCustomer.message && (
                      <div className="mt-2 text-[13px] text-[#4E5968] bg-white/50 p-2 rounded border border-[#E5E8EB]">
                        <span className="text-[11px] font-bold text-[#8B95A1] block mb-0.5">고객 문의 메시지</span>
                        {selectedCustomer.message}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">구좌수</label>
                      <input 
                        type="text" 
                        value={editData.account || ''} 
                        readOnly 
                        className="w-full bg-[#F2F4F6] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px] font-bold text-[#4E5968]" 
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">결합 가전명 (제품명, 모델명)</label>
                      <select 
                        value={editData.appliance || ''} 
                        onChange={e => {
                          const model = e.target.value;
                          const product = allProducts?.find(p => p.model === model);
                          setEditData({
                            ...editData, 
                            appliance: product ? `${product.name} (${product.model})` : model,
                          });
                        }}
                        className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]"
                      >
                        <option value="">가전 선택</option>
                        {allProducts?.filter(p => {
                          if (!p.model) return false;
                          if (!editData.productName) return true;
                          const plan = allPlans?.find(pl => pl.name === editData.productName);
                          return plan && p.planId === plan.numericId;
                        }).map(p => (
                          <option key={p._id} value={`${p.name} (${p.model})`}>{p.brand} {p.name} ({p.model})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* 4. 상태 변경 및 메모 */}
              <section className="bg-white p-5 rounded-[16px] border border-[#E5E8EB]">
                <h4 className="text-[15px] font-bold mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#191F28]"></span>상태 변경 및 메모
                </h4>
                <div className="flex flex-col lg:flex-row gap-3">
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-[140px] bg-white border border-[#D1D6DB] px-3 py-2 rounded-[8px] text-[13px] font-bold focus:outline-none"
                    style={{ 
                      backgroundColor: getStatusStyle(status).bg,
                      color: getStatusStyle(status).text
                    }}
                  >
                    {settings?.statuses?.filter((s: any) => s.isUsed).map((s: any) => (
                      <option key={s.name} value={s.name} style={{ backgroundColor: '#ffffff', color: '#191F28' }}>{s.name}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    value={memo} 
                    onChange={(e) => setMemo(e.target.value)} 
                    placeholder="변경 사유 또는 메모를 입력하세요 (선택)" 
                    className="flex-1 bg-[#F9FAFB] border border-[#E5E8EB] px-4 py-2 rounded-[8px] text-[13px] focus:outline-none"
                  />
                  <button onClick={handleUpdate} className="w-full lg:w-auto bg-[#3182F6] text-white px-6 py-3 lg:py-2 rounded-[8px] font-bold text-[14px] lg:text-[13px] flex items-center justify-center gap-2 hover:bg-[#1B64DA] transition-colors shadow-sm">
                    <Save className="w-4 h-4" /> 저장
                  </button>
                </div>

                {selectedCustomer.memoHistory && selectedCustomer.memoHistory.length > 0 && (
                  <div className="mt-5 border-t border-[#E5E8EB] pt-5">
                    <h5 className="text-[13px] font-bold text-[#8B95A1] mb-3 flex items-center gap-1">
                      <History className="w-4 h-4" /> 상태 변경 이력
                    </h5>
                    <div className="space-y-3 bg-[#F9FAFB] p-4 rounded-[12px] max-h-[150px] overflow-y-auto">
                      {selectedCustomer.memoHistory.map((history: any, idx: number) => (
                        <div key={idx} className="flex gap-3 text-[13px]">
                          <span className="text-[#8B95A1] shrink-0 font-medium">{history.date}</span>
                          <span className="font-bold text-[#3182F6] shrink-0 w-[60px]">{history.status}</span>
                          <span className="text-[#4E5968]">{history.memo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 lg:p-4">
          <div className="bg-white lg:rounded-[24px] w-full max-w-[900px] h-full lg:h-auto lg:max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-[#E5E8EB] flex justify-between items-center bg-white z-10 shrink-0">
              <h3 className="text-[20px] font-bold">고객 직접 등록</h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="p-2 hover:bg-[#F2F4F6] rounded-full transition-colors">
                <X className="w-6 h-6 text-[#4E5968]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col lg:flex-row gap-6 bg-[#F9FAFB] hide-scrollbar">
              {/* Left: Input Form */}
              <div className="flex-1 space-y-6">
                <section className="bg-white p-5 rounded-[16px] border border-[#E5E8EB]">
                  <h4 className="text-[15px] font-bold mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3182F6]"></span>고객 정보 입력
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">파트너사</label>
                      <select value={registerForm.channelId} onChange={e => setRegisterForm({...registerForm, channelId: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]">
                        {!channelId ? (
                          <>
                            <option value="본사">본사</option>
                            {channels?.map(c => (
                              <option key={c._id} value={c.subdomain}>{c.channelName}</option>
                            ))}
                          </>
                        ) : (
                          channels?.filter(c => subChannelIds?.includes(c.subdomain)).map(c => (
                            <option key={c._id} value={c.subdomain}>{c.channelName}</option>
                          ))
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">고객명 <span className="text-red-500">*</span></label>
                      <input type="text" value={registerForm.name} onChange={e => setRegisterForm({...registerForm, name: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" placeholder="성함 입력" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">연락처 <span className="text-red-500">*</span></label>
                      <input type="tel" inputMode="numeric" value={registerForm.phone} onChange={e => setRegisterForm({...registerForm, phone: formatPhoneNumber(e.target.value)})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" placeholder="010-0000-0000" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">생년월일 (6자리)</label>
                      <input type="text" inputMode="numeric" value={registerForm.birth} onChange={e => setRegisterForm({...registerForm, birth: formatBirthDate(e.target.value)})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" placeholder="YY-MM-DD" maxLength={8} />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">성별</label>
                      <div className="flex gap-2">
                        {['남성', '여성'].map(g => (
                          <button key={g} onClick={() => setRegisterForm({...registerForm, gender: g})} className={`flex-1 py-2 rounded-[8px] text-[13px] font-bold border transition-all ${registerForm.gender === g ? 'bg-[#191F28] border-[#191F28] text-white' : 'bg-white border-[#E5E8EB] text-[#4E5968] hover:bg-[#F9FAFB]'}`}>{g}</button>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-[12px] font-medium text-[#8B95A1]">주소</label>
                        <button onClick={openRegisterPostcode} className="text-[11px] bg-[#3182F6] text-white px-2.5 py-1 rounded-[4px] font-bold hover:bg-[#1B64DA]">주소 검색</button>
                      </div>
                      <input type="text" value={registerForm.address} readOnly onClick={openRegisterPostcode} className="w-full bg-[#F2F4F6] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px] mb-2 cursor-pointer" placeholder="주소 검색을 클릭해주세요" />
                      <input type="text" value={registerForm.detailAddress} onChange={e => setRegisterForm({...registerForm, detailAddress: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]" placeholder="상세 주소 입력" />
                    </div>
                  </div>
                </section>

                <section className="bg-white p-5 rounded-[16px] border border-[#E5E8EB]">
                  <h4 className="text-[15px] font-bold mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span>상품 정보 입력
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">신청상품 (카테고리)</label>
                      <select 
                        value={registerForm.productName} 
                        onChange={e => {
                          const plan = allPlans?.find(p => p.name === e.target.value);
                          setRegisterForm({
                            ...registerForm, 
                            productName: e.target.value,
                            account: plan ? plan.accountCount : '',
                            appliance: ''
                          });
                        }} 
                        className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px] font-bold"
                      >
                        <option value="">카테고리 선택</option>
                        {allPlans?.map(plan => (
                          <option key={plan._id} value={plan.name}>{plan.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">구좌수</label>
                        <input 
                          type="text" 
                          value={registerForm.account} 
                          readOnly 
                          className="w-full bg-[#F2F4F6] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px] font-bold text-[#4E5968]" 
                          placeholder="카테고리 선택 시 자동 입력"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium text-[#8B95A1] mb-1">결합 가전제품</label>
                        <select 
                          value={registerForm.appliance} 
                          onChange={e => setRegisterForm({...registerForm, appliance: e.target.value})}
                          className="w-full bg-[#F9FAFB] border border-[#E5E8EB] px-3 py-2 rounded-[8px] text-[13px]"
                        >
                          <option value="">가전 선택</option>
                          {allProducts?.filter(p => {
                            if (!p.model) return false;
                            if (!registerForm.productName) return true;
                            const plan = allPlans?.find(pl => pl.name === registerForm.productName);
                            return plan && p.planId === plan.numericId;
                          }).map(p => (
                            <option key={p._id} value={`${p.name} (${p.model})`}>{p.brand} {p.name} ({p.model})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button onClick={handleAddToList} className="w-full bg-[#3182F6] text-white py-3 rounded-[12px] font-bold text-[14px] hover:bg-[#1B64DA] mt-2 shadow-sm transition-all active:scale-[0.98]">등록대기 목록에 추가</button>
                  </div>
                </section>
              </div>

              {/* Right: Wait List */}
              <div className="w-full lg:w-[320px] flex flex-col gap-4">
                <section className="bg-white p-5 rounded-[16px] border border-[#E5E8EB] flex-1 flex flex-col overflow-hidden">
                  <h4 className="text-[15px] font-bold mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#191F28]"></span>등록대기 목록
                    </div>
                    <span className="text-[12px] bg-[#F2F4F6] text-[#4E5968] px-2 py-0.5 rounded-full font-bold">{registerList.length}건</span>
                  </h4>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 hide-scrollbar">
                    {registerList.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-10">
                        <Plus className="w-8 h-8 text-[#E5E8EB] mb-2" />
                        <p className="text-[13px] text-[#8B95A1]">목록이 비어있습니다.<br/>좌측 폼을 입력해 추가해주세요.</p>
                      </div>
                    ) : (
                      registerList.map((item) => (
                        <div key={item.id} className="p-3 bg-[#F9FAFB] rounded-[12px] border border-[#E5E8EB] relative group">
                          <button onClick={() => handleRemoveFromList(item.id)} className="absolute top-2 right-2 p-1 text-[#8B95A1] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-4 h-4" />
                          </button>
                          <div className="text-[14px] font-bold text-[#191F28] mb-1">{item.name}</div>
                          <div className="text-[12px] text-[#4E5968] mb-2">{item.phone}</div>
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[10px] bg-white border border-[#E5E8EB] text-[#8B95A1] px-1.5 py-0.5 rounded">{getChannelName(item.channelId)}</span>
                            {item.productName && <span className="text-[10px] bg-blue-50 text-[#3182F6] px-1.5 py-0.5 rounded">{item.productName}</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button 
                    onClick={handleBulkRegister} 
                    disabled={registerList.length === 0}
                    className={`w-full py-4 rounded-[16px] font-bold text-[15px] mt-6 shadow-lg transition-all active:scale-[0.98] ${registerList.length > 0 ? 'bg-[#191F28] text-white hover:bg-[#2D3644] shadow-black/10' : 'bg-[#E5E8EB] text-[#8B95A1] cursor-not-allowed shadow-none'}`}
                  >
                    총 {registerList.length}명 등록하기
                  </button>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Separate components or inline modals can be added here
// For simplicity and matching the existing pattern, adding the Direct Register Modal below the existing code

