import React, { useState } from 'react';
import { LayoutGrid, Users, Box, BarChart3, Settings as SettingsIcon, LogOut, Menu, X } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  userType?: 'admin' | 'channel';
  userName?: string;
  isProxyMode?: boolean;
  onExitProxy?: () => void;
}

export default function AdminLayout({ children, activeMenu, setActiveMenu, userType = 'admin', userName, isProxyMode, onExitProxy }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const allMenuItems = [
    { id: 'customers', label: '고객관리', icon: Users },
    { id: 'products', label: '제품관리', icon: Box },
    { id: 'channels', label: '채널관리', icon: LayoutGrid },
    { id: 'statistics', label: '통계분석', icon: BarChart3 },
    { id: 'settings', label: '설정', icon: SettingsIcon },
  ];

  const menuItems = allMenuItems.filter(item => {
    if (userType === 'channel') {
      return ['customers', 'statistics'].includes(item.id);
    }
    return true;
  });

  const handleMenuClick = (id: string) => {
    setActiveMenu(id);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#F2F4F6] text-[#191F28] font-sans overflow-hidden relative">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-[#E5E8EB] flex items-center justify-between px-4 z-[40]">
        <h1 className="text-[18px] font-bold tracking-tight">효원 관리자</h1>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-[#F2F4F6] rounded-full">
          <Menu className="w-6 h-6 text-[#4E5968]" />
        </button>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-[50]" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 w-[240px] bg-white border-r border-[#E5E8EB] flex flex-col z-[60] transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-[#E5E8EB] flex items-center justify-between">
          <h1 className="text-[20px] font-bold tracking-tight">효원상조 관리자</h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-[#F2F4F6] rounded-full">
            <X className="w-6 h-6 text-[#8B95A1]" />
          </button>
        </div>
        
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E5E8EB]">
          <div className="w-10 h-10 rounded-full bg-[#3182F6] flex items-center justify-center text-white font-bold">
            {userName?.slice(0, 1) || 'A'}
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#191F28]">{userName || '관리자'}</p>
            <p className="text-[12px] text-[#8B95A1]">
                {isProxyMode ? '채널 대리 관리중' : (userType === 'admin' ? '마스터 권한' : '채널 권한')}
            </p>
          </div>
        </div>

        {isProxyMode && (
          <div className="px-4 mt-4">
            <button 
              onClick={onExitProxy}
              className="w-full bg-[#191F28] text-white text-[13px] font-bold py-2.5 rounded-[10px] flex items-center justify-center gap-2 hover:bg-black transition-colors"
            >
              마스터 관리자로 돌아가기
            </button>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] font-medium transition-colors ${
                  isActive 
                    ? 'bg-[#3182F6] text-white' 
                    : 'text-[#4E5968] hover:bg-[#F2F4F6]'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#E5E8EB]">
          <button 
            className="w-full flex items-center gap-3 px-4 py-3 text-[#8B95A1] hover:text-[#191F28] hover:bg-[#F2F4F6] rounded-[12px] font-medium transition-colors"
            onClick={() => window.location.href = './'}
          >
            <LogOut className="w-5 h-5" />
            사이트로 돌아가기
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#F2F4F6] pt-[60px] lg:pt-0">
        {children}
      </main>
    </div>
  );
}
