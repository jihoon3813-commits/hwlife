import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, X, ExternalLink } from 'lucide-react';

export default function ChannelManagement({ 
  currentChannelId,
  onLoginAsChannel 
}: { 
  currentChannelId?: string;
  onLoginAsChannel?: (channel: any) => void 
}) {
  const channels = useQuery(api.channels.get) || [];
  const createChannel = useMutation(api.channels.create);
  const updateChannel = useMutation(api.channels.update);
  const removeChannel = useMutation(api.channels.remove);
  const landings = useQuery(api.landings.get) || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  const initialFormState = {
    _id: '',
    accountId: '',
    password: '',
    subdomain: '',

    status: '승인대기',
    channelName: '',
    managerName: '',
    managerContact: '',
    landingPage: '',
    landingPages: [] as string[],
    parentChannelId: '',
  };



  const [formData, setFormData] = useState(initialFormState);

  const formatPhoneNumber = (value: string) => {
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

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, managerContact: formatPhoneNumber(e.target.value) });
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setFormData(initialFormState);
    setShowPassword(false);
    setIsModalOpen(true);

  };

  const openEditModal = (channel: any) => {
    setIsEditing(true);
    setFormData({
      ...channel,
      password: '',

      landingPages: channel.landingPages || (channel.landingPage ? [channel.landingPage] : []),
    });

    setShowPassword(false);
    setIsModalOpen(true);

  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {

      if (isEditing) {
        const updates: any = {
          id: formData._id as any,
          subdomain: formData.subdomain,
          status: formData.status,
          channelName: formData.channelName,
          managerName: formData.managerName,
          managerContact: formData.managerContact,
          landingPage: formData.landingPage,
          landingPages: formData.landingPages,
          parentChannelId: formData.parentChannelId || undefined,
        };


        if (formData.password) {
          updates.password = formData.password;
        }
        await updateChannel(updates);
      } else {
        await createChannel({
          accountId: formData.accountId,
          password: formData.password,
          subdomain: formData.subdomain,
          status: formData.status,
          channelName: formData.channelName,
          managerName: formData.managerName,
          managerContact: formData.managerContact,
          landingPage: formData.landingPage,
          landingPages: formData.landingPages,
          parentChannelId: formData.parentChannelId || undefined,
        });


      }
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.message || '오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('정말 이 채널을 삭제하시겠습니까?')) {
      await removeChannel({ id: id as any });
      setIsModalOpen(false);
    }
  };

  const filteredChannels = channels.filter(channel => {
    // 1. Basic search filter
    const matchesSearch = channel.channelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         channel.managerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         channel.accountId.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // 2. Hierarchical permission filter
    if (!currentChannelId) return true; // Master admin sees everything

    // Channel admin sees themselves and their direct sub-channels
    const isSelf = channel.subdomain === currentChannelId;
    const isSub = channel.parentChannelId === currentChannelId;
    
    return isSelf || isSub;
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-[24px] font-bold text-[#191F28] mb-1">채널 관리</h1>
          <p className="text-[14px] text-[#8B95A1]">파트너 채널을 등록하고 관리할 수 있습니다.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#3182F6] text-white px-5 py-2.5 rounded-[12px] font-medium hover:bg-[#1B64DA] transition-colors"
        >
          <Plus className="w-5 h-5" />
          신규 채널 등록
        </button>
      </div>

      <div className="bg-white rounded-[20px] p-4 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)] mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B95A1]" />
          <input 
            type="text" 
            placeholder="채널명, 담당자명 또는 아이디로 검색" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F2F4F6] pl-11 pr-5 py-3.5 rounded-[14px] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3182F6]/20 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E8EB]">
                <th className="py-4 px-6 text-[13px] font-semibold text-[#8B95A1]">아이디</th>
                <th className="py-4 px-6 text-[13px] font-semibold text-[#8B95A1]">채널명</th>
                <th className="py-4 px-6 text-[13px] font-semibold text-[#8B95A1]">담당자</th>
                <th className="py-4 px-6 text-[13px] font-semibold text-[#8B95A1]">연락처</th>
                <th className="py-4 px-6 text-[13px] font-semibold text-[#8B95A1]">상위 채널</th>
                <th className="py-4 px-6 text-[13px] font-semibold text-[#8B95A1]">상태</th>

                <th className="py-4 px-6 text-[13px] font-semibold text-[#8B95A1] text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredChannels.length > 0 ? (
                filteredChannels.map((channel) => (
                  <tr 
                    key={channel._id} 
                    onClick={() => openEditModal(channel)}
                    className="border-b border-[#E5E8EB] last:border-0 hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-6 text-[14px] font-medium text-[#191F28]">{channel.accountId}</td>
                    <td className="py-4 px-6 text-[14px] font-bold text-[#191F28]">{channel.channelName}</td>
                    <td className="py-4 px-6 text-[14px] font-medium text-[#191F28]">{channel.managerName}</td>
                    <td className="py-4 px-6 text-[14px] text-[#4E5968]">{channel.managerContact}</td>
                    <td className="py-4 px-6 text-[13px] text-[#8B95A1]">
                      {channel.parentChannelId ? (
                        <span className="font-medium text-[#191F28]">{channels.find(c => c.subdomain === channel.parentChannelId)?.channelName || channel.parentChannelId}</span>
                      ) : '-'}
                    </td>
                    <td className="py-4 px-6">

                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[12px] font-bold ${
                        channel.status === '정상' ? 'bg-[#E8F3FF] text-[#1B64DA]' :
                        channel.status === '승인대기' ? 'bg-[#FFF3E1] text-[#F9A825]' :
                        'bg-[#FEECEF] text-[#F04452]'
                      }`}>
                        {channel.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => onLoginAsChannel?.(channel)}
                        className="p-2 text-[#3182F6] hover:bg-[#E8F3FF] rounded-lg transition-colors group"
                        title="채널 어드민 바로가기"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8B95A1] text-[14px]">
                    등록된 채널이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[#E5E8EB] flex justify-between items-center shrink-0">
              <h2 className="text-[18px] font-bold text-[#191F28]">
                {isEditing ? '채널 수정' : '신규 채널 등록'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-[#8B95A1] hover:bg-[#F2F4F6] rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              <div className="space-y-5">
                {/* ID */}
                <div>
                  <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">아이디 <span className="text-[#F04452]">*</span></label>
                  <input 
                    type="text" 
                    required
                    disabled={isEditing}
                    value={formData.accountId}
                    onChange={(e) => setFormData({...formData, accountId: e.target.value})}
                    autoComplete="off"
                    className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3182F6]/20 disabled:opacity-60 disabled:cursor-not-allowed" 
                    placeholder="채널 아이디 입력" 
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">
                    비밀번호 {isEditing ? '(변경시에만 입력)' : <span className="text-[#F04452]">*</span>}
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      required={!isEditing}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      autoComplete="new-password"
                      className="w-full bg-[#F2F4F6] pl-5 pr-12 py-3.5 rounded-[16px] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3182F6]/20" 
                      placeholder="비밀번호 입력" 
                    />

                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B95A1] hover:text-[#4E5968]"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>



                {/* Subdomain */}
                <div>
                  <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">접속 경로 <span className="text-[#F04452]">*</span></label>
                  <div className="flex items-center">
                    <span className="bg-[#E5E8EB] text-[#4E5968] px-4 py-3.5 rounded-l-[16px] text-[15px] font-medium border-r border-[#D1D6DB]">
                      hyowon-life.com/living/?
                    </span>
                    <input 
                      type="text" 
                      required
                      value={formData.subdomain}
                      onChange={(e) => setFormData({...formData, subdomain: e.target.value})}
                      className="flex-1 bg-[#F2F4F6] px-5 py-3.5 rounded-r-[16px] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3182F6]/20" 
                      placeholder="예: partner" 
                    />
                  </div>
                </div>

                {/* Channel Name */}
                <div>
                  <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">채널명 (파트너사명) <span className="text-[#F04452]">*</span></label>
                  <input 
                    type="text" 
                    required
                    value={formData.channelName}
                    onChange={(e) => setFormData({...formData, channelName: e.target.value})}
                    className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3182F6]/20" 
                    placeholder="채널명 입력" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Manager Name */}
                  <div>
                    <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">담당자명 <span className="text-[#F04452]">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={formData.managerName}
                      onChange={(e) => setFormData({...formData, managerName: e.target.value})}
                      className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3182F6]/20" 
                      placeholder="이름 입력" 
                    />
                  </div>
                  {/* Manager Contact */}
                  <div>
                    <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">담당자 연락처 <span className="text-[#F04452]">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={formData.managerContact}
                      onChange={handleContactChange}
                      className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3182F6]/20" 
                      placeholder="010-0000-0000" 
                      maxLength={13}
                    />
                  </div>
                </div>

                {/* Landing Page Selection (Multiple) */}
                {!currentChannelId && (
                  <div>
                    <label className="block text-[13px] font-bold text-[#4E5968] mb-3 px-1">적용 랜딩페이지 (복수 선택)</label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto p-4 bg-[#F2F4F6] rounded-[16px]">
                      <label className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors group">
                        <input 
                          type="checkbox"
                          checked={formData.landingPages.includes('/') || formData.landingPage === '/'}
                          onChange={(e) => {
                            const val = '/';
                            const current = formData.landingPages;
                            setFormData({
                              ...formData,
                              landingPages: e.target.checked ? [...current, val] : current.filter(v => v !== val)
                            });
                          }}
                          className="w-5 h-5 rounded border-[#D1D6DB] text-[#3182F6] focus:ring-[#3182F6]"
                        />
                        <span className="text-[14px] font-medium text-[#191F28]">메인 페이지 (/)</span>
                      </label>
                      {landings.filter(l => l.isActive && l.path !== '/').map(landing => (
                        <label key={landing._id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors group">
                          <input 
                            type="checkbox"
                            checked={formData.landingPages.includes(landing.path) || formData.landingPage === landing.path}
                            onChange={(e) => {
                              const val = landing.path;
                              const current = formData.landingPages;
                              setFormData({
                                ...formData,
                                landingPages: e.target.checked ? [...current, val] : current.filter(v => v !== val)
                              });
                            }}
                            className="w-5 h-5 rounded border-[#D1D6DB] text-[#3182F6] focus:ring-[#3182F6]"
                          />
                          <div className="flex flex-col">
                            <span className="text-[14px] font-medium text-[#191F28]">{landing.name}</span>
                            <span className="text-[11px] text-[#8B95A1]">{landing.path}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}


                {/* Parent Channel Selection */}
                <div>
                  <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">상위 채널 (선택 사항)</label>
                  <select 
                    value={formData.parentChannelId}
                    onChange={(e) => setFormData({...formData, parentChannelId: e.target.value})}
                    className="w-full bg-[#F2F4F6] px-5 py-3.5 rounded-[16px] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3182F6]/20 appearance-none cursor-pointer"
                  >
                    <option value="">없음 (최상위 채널)</option>
                    {channels
                      .filter(c => c.status === '정상' && c._id !== formData._id)
                      .map(channel => (
                        <option key={channel._id} value={channel.subdomain}>
                          {channel.channelName} ({channel.subdomain})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[13px] font-bold text-[#4E5968] mb-2 px-1">파트너 상태 <span className="text-[#F04452]">*</span></label>
                  <div className="flex gap-2">
                    {['승인대기', '정상', '정지'].map(status => (
                      <label key={status} className={`flex-1 flex items-center justify-center py-3 rounded-[12px] font-medium text-[14px] transition-colors border ${
                        formData.status === status 
                          ? 'border-[#3182F6] bg-[#E8F3FF] text-[#3182F6]' 
                          : 'border-[#E5E8EB] bg-white text-[#4E5968]'
                      } ${!!currentChannelId ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-[#F9FAFB]'}`}>
                        <input 
                          type="radio" 
                          name="status"
                          value={status}
                          disabled={!!currentChannelId}
                          checked={formData.status === status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                          className="hidden" 
                        />
                        {status}
                      </label>
                    ))}
                  </div>
                </div>

              </div>

              <div className="mt-8 flex gap-3">
                {isEditing && (
                  <button 
                    type="button"
                    onClick={() => handleDelete(formData._id as string)}
                    className="flex-1 bg-white border border-[#E5E8EB] text-[#F04452] py-4 rounded-[16px] font-bold text-[16px] hover:bg-[#FEECEF] hover:border-[#F04452] transition-colors"
                  >
                    삭제
                  </button>
                )}
                <button 
                  type="submit"
                  className={`${isEditing ? 'flex-[2]' : 'w-full'} bg-[#3182F6] text-white py-4 rounded-[16px] font-bold text-[16px] hover:bg-[#1B64DA] transition-colors`}
                >
                  {isEditing ? '수정 완료' : '등록 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
