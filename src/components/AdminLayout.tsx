import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  LayoutGrid,
  Users,
  UserCheck,
  Box,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Globe,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  KeyRound,
  Home,
  RefreshCw,
  Search,
  Bell,
  Building2,
  ArrowUpRight,
  RotateCcw,
  Gift,
} from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { isLgCareCustomer } from '../pages/LgCustomerManagement';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  userType?: 'admin' | 'channel' | 'head_office';
  userName?: string;
  isProxyMode?: boolean;
  onExitProxy?: () => void;
  onLogout?: () => void;
  subdomain?: string;
  channelId?: string;
}

interface MenuItem {
  id: string;
  label: string;
  group: string;
  icon: any;
  url?: string;
}

export default function AdminLayout({
  children,
  activeMenu,
  setActiveMenu,
  userType = 'admin',
  userName,
  isProxyMode,
  onExitProxy,
  onLogout,
  subdomain,
  channelId,
}: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const subChannelIds = useQuery(
    api.channels.getSubChannelIds,
    channelId ? { subdomain: channelId } : 'skip'
  );

  const inquiries = useQuery(
    api.inquiries.list,
    channelId ? (subChannelIds ? { channelIds: subChannelIds } : 'skip') : {}
  );

  const channels = useQuery(api.channels.get);
  const unreadSmsCounts = useQuery(api.sms.getUnreadInboundCounts) ?? {};

  const counts = useMemo(() => {
    const list = inquiries || [];
    const nonLgWaiting = list.filter((i) => !isLgCareCustomer(i) && (!i.status || i.status === '대기')).length;
    const lgWaiting = list.filter((i) => isLgCareCustomer(i) && (!i.status || i.status === '대기')).length;

    const lgIdSet = new Set<string>();
    const nonLgIdSet = new Set<string>();
    for (const inq of list) {
      if (isLgCareCustomer(inq)) {
        lgIdSet.add(String(inq._id));
      } else {
        nonLgIdSet.add(String(inq._id));
      }
    }

    let lgUnreadSms = 0;
    let nonLgUnreadSms = 0;
    for (const [id, cnt] of Object.entries(unreadSmsCounts as Record<string, number>)) {
      const n = cnt || 0;
      if (n <= 0) continue;
      if (lgIdSet.has(id)) {
        lgUnreadSms += n;
      } else if (nonLgIdSet.has(id)) {
        nonLgUnreadSms += n;
      }
    }

    const totalUnreadSms = lgUnreadSms + nonLgUnreadSms;
    const channelCount = channels?.length || 0;
    const pendingChannels = (channels || []).filter((c) => c.status === '승인대기').length;

    return {
      nonLgWaiting,
      lgWaiting,
      nonLgUnreadSms,
      lgUnreadSms,
      totalUnreadSms,
      channelCount,
      pendingChannels,
      totalAlerts: nonLgWaiting + lgWaiting + totalUnreadSms + (userType === 'admin' ? pendingChannels : 0),
    };
  }, [inquiries, unreadSmsCounts, channels, userType]);

  const allMenuItems: MenuItem[] = [
    { id: 'dashboard', label: '대시보드', group: 'WORKSPACE', icon: LayoutDashboard },
    { id: 'customers', label: '고객 관리', group: '영업 관리', icon: Users },
    { id: 'lg_customers', label: '고객 관리 (LG구독)', group: '영업 관리', icon: UserCheck },
    { id: 'consent', label: '구매동의 관리', group: '영업 관리', icon: ShieldCheck },
    { id: 'channels', label: '파트너 관리', group: '영업 관리', icon: LayoutGrid },
    { id: 'products', label: '제품 관리', group: '운영 관리', icon: Box },
    { id: 'lg_products', label: 'LG구독 제품관리', group: '운영 관리', icon: Sparkles },
    { id: 'discount_codes', label: '할인코드 관리', group: '운영 관리', icon: KeyRound },
    { id: 'landings', label: '랜딩페이지 관리', group: '운영 관리', icon: Globe },
    { id: 'gifts', label: '사은품 관리', group: '운영 관리', icon: Gift },
    { id: 'statistics', label: '통계분석', group: '운영 관리', icon: BarChart3 },
  ];

  const externalShortcuts = [
    { id: 'home', label: '공식 메인 홈페이지', url: '/' },
    { id: 'shinhan48', label: '신한48 파트너 센터', url: 'https://partner.48mall.co.kr/' },
    { id: 'bson', label: 'BSON 접수 시스템', url: 'https://mob.bs-on.com/origin/hwsj/login' },
    { id: 'sangjo', label: '효원 상조접수 인트라넷', url: 'https://hwsj.kr/intranet/' },
  ];

  const canAccessSettings = userType !== 'head_office';
  const showExternalShortcuts = userType !== 'head_office';

  const visibleMenuItems = allMenuItems.filter((item) => {
    if (userType === 'head_office') {
      return ['customers', 'lg_customers'].includes(item.id);
    }
    if (userType === 'channel') {
      return ['dashboard', 'customers', 'lg_customers', 'consent', 'channels', 'landings', 'statistics'].includes(item.id);
    }
    return true;
  });

  const groupedMenus = useMemo(() => {
    const groups: { name: string; items: MenuItem[] }[] = [];
    for (const item of visibleMenuItems) {
      const existing = groups.find((g) => g.name === item.group);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.push({ name: item.group, items: [item] });
      }
    }
    return groups;
  }, [visibleMenuItems]);

  const activeItemLabel = useMemo(() => {
    if (activeMenu === 'settings') return '환경설정';
    return allMenuItems.find((m) => m.id === activeMenu)?.label || '워크스페이스';
  }, [activeMenu]);

  const handleMenuClick = (id: string) => {
    setActiveMenu(id);
    setIsSidebarOpen(false);
    setIsNotifOpen(false);
  };

  const roleLabel = isProxyMode
    ? '채널 대리 접속중'
    : userType === 'admin'
      ? '본사 통합 어드민'
      : userType === 'head_office'
        ? '본사 실무 워크스페이스'
        : '파트너 워크스페이스';

  const workspaceSubtitle = isProxyMode
    ? `서브도메인: /${subdomain || ''}`
    : userType === 'admin'
      ? '효원상조 통합 어드민'
      : userType === 'head_office'
        ? '상담 · 접수 전용 계정'
        : `채널 경로: /${subdomain || 'partner'}`;

  const roleEn = userType === 'admin' ? 'Administrator' : userType === 'head_office' ? 'Staff Manager' : 'Partner Channel';
  const avatarChar = (userName || '관').trim().slice(0, 1);

  return (
    <div className="sono-admin-theme">
      {/* Mobile Backdrop */}
      <div
        className={`adm-mobile-shade ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Left Deep-Green Sidebar */}
      <aside className={`adm-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="flex items-center justify-between">
          <div
            className="adm-brand flex-1"
            onClick={() => handleMenuClick(userType === 'head_office' ? 'customers' : 'dashboard')}
          >
            <div className="adm-brand-emblem">
              H<span>•</span>
            </div>
            <div>
              <small>HYOWON SANGJO</small>
              <strong>파트너센터</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 text-[#9ab2a6] hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Card */}
        <div className="adm-workspace">
          <div className="adm-workspace-icon">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="adm-workspace-info">
            <b>{userName || '총괄관리자'}</b>
            <small>{workspaceSubtitle}</small>
          </div>
        </div>

        {/* Proxy Return Button */}
        {isProxyMode && (
          <button
            type="button"
            onClick={onExitProxy}
            className="mb-4 w-full py-2 px-3 rounded-[8px] bg-[#faf0df] text-[#8a6022] text-[11.5px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#f5e6cc] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>마스터 관리자로 돌아가기</span>
          </button>
        )}

        {/* Grouped Navigation */}
        <nav className="adm-nav" aria-label="주 메뉴">
          {groupedMenus.map((group) => (
            <React.Fragment key={group.name}>
              <div className="adm-nav-group">{group.name}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.id;

                let badgeNode: React.ReactNode = null;
                if (item.id === 'customers') {
                  if (counts.nonLgUnreadSms > 0) {
                    badgeNode = <span className="adm-nav-count alert">{counts.nonLgUnreadSms}</span>;
                  } else if (counts.nonLgWaiting > 0) {
                    badgeNode = <span className="adm-nav-count">{counts.nonLgWaiting}</span>;
                  }
                } else if (item.id === 'lg_customers') {
                  if (counts.lgUnreadSms > 0) {
                    badgeNode = <span className="adm-nav-count alert">{counts.lgUnreadSms}</span>;
                  } else if (counts.lgWaiting > 0) {
                    badgeNode = <span className="adm-nav-count">{counts.lgWaiting}</span>;
                  }
                } else if (item.id === 'channels' && counts.channelCount > 0 && !channelId) {
                  badgeNode = <span className="adm-nav-count">{counts.channelCount}</span>;
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleMenuClick(item.id)}
                    className={`adm-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon />
                    <span className="truncate">{item.label}</span>
                    {badgeNode}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        {/* Bottom External Links, Settings & Profile */}
        <div className="adm-side-bottom">
          {showExternalShortcuts && (
            <div className="mb-2">
              {externalShortcuts.map((ext) => (
                <a
                  key={ext.id}
                  href={ext.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="adm-landing-link"
                >
                  <ExternalLink />
                  <span className="truncate">{ext.label}</span>
                  <ArrowUpRight />
                </a>
              ))}
            </div>
          )}

          {canAccessSettings && (
            <button
              type="button"
              onClick={() => handleMenuClick('settings')}
              className={`adm-nav-link ${activeMenu === 'settings' ? 'active' : ''}`}
            >
              <SettingsIcon />
              <span>환경설정</span>
            </button>
          )}

          <div className="adm-side-profile">
            <div className="adm-avatar">{avatarChar}</div>
            <div className="adm-side-profile-text">
              <strong>{userName || '관리자'}</strong>
              <small>{roleEn}</small>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="로그아웃"
              className="p-1.5 rounded-lg text-[#9ab2a6] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main App Shell */}
      <div className="adm-app-shell">
        {/* Sticky White Topbar */}
        <header className="adm-topbar">
          <div className="adm-breadcrumb">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="adm-mobile-toggle adm-icon-btn mr-1"
              aria-label="메뉴 열기"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleMenuClick(userType === 'head_office' ? 'customers' : 'dashboard')}
              className="adm-breadcrumb-home"
              title="홈으로 이동"
            >
              <Home className="w-4 h-4" />
            </button>
            <span className="adm-breadcrumb-divider">/</span>
            <span className="text-[#263d36] font-bold text-[13.5px]">{activeItemLabel}</span>
          </div>

          <div className="adm-topbar-actions">
            <span className={`adm-role-badge ${isProxyMode ? 'proxy' : ''}`}>
              <i />
              {roleLabel}
            </span>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="adm-icon-btn"
              title="데이터 새로고침"
            >
              <RefreshCw className="w-[17px] h-[17px]" />
            </button>

            <button
              type="button"
              onClick={() => handleMenuClick('customers')}
              className="adm-icon-btn"
              title="고객 검색 바로가기"
            >
              <Search className="w-[17px] h-[17px]" />
            </button>

            <button
              type="button"
              onClick={() => setIsNotifOpen((prev) => !prev)}
              className="adm-icon-btn"
              title="실시간 알림"
            >
              <Bell className="w-[17px] h-[17px]" />
              {counts.totalAlerts > 0 && <span className="adm-notif-dot" />}
            </button>

            <div className="adm-top-divider" />

            <div className="adm-top-avatar">{avatarChar}</div>
            <span className="adm-top-user">{userName || '관리자'}님</span>

            <button
              type="button"
              onClick={onLogout}
              className="adm-btn small"
            >
              로그아웃
            </button>
          </div>
        </header>

        {/* Notification Popover */}
        {isNotifOpen && (
          <>
            <div
              className="fixed inset-0 z-50"
              onClick={() => setIsNotifOpen(false)}
            />
            <div className="adm-notif-popover">
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#edf0e7]">
                <strong className="text-[13.5px] font-bold text-[#263d36]">실시간 현황 알림</strong>
                <span className="adm-pill green">LIVE</span>
              </div>
              <div className="space-y-2 text-[12px]">
                <button
                  type="button"
                  onClick={() => handleMenuClick('customers')}
                  className="w-full flex items-center justify-between p-2.5 rounded-[9px] hover:bg-[#f6f8f3] transition-colors text-left cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-[#263d36]">신규 상담 대기 / 미확인 문자</div>
                    <div className="text-[11px] text-[#86918a]">대기 {counts.nonLgWaiting}건 · 미확인 답장 {counts.nonLgUnreadSms}건</div>
                  </div>
                  <span className={`adm-pill ${counts.nonLgUnreadSms > 0 ? 'red' : 'green'} font-bold`}>
                    {counts.nonLgWaiting + counts.nonLgUnreadSms}건
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMenuClick('lg_customers')}
                  className="w-full flex items-center justify-between p-2.5 rounded-[9px] hover:bg-[#f6f8f3] transition-colors text-left cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-[#263d36]">LG구독 상담 대기 / 미확인 문자</div>
                    <div className="text-[11px] text-[#86918a]">대기 {counts.lgWaiting}건 · 미확인 답장 {counts.lgUnreadSms}건</div>
                  </div>
                  <span className={`adm-pill ${counts.lgUnreadSms > 0 ? 'red' : 'teal'} font-bold`}>
                    {counts.lgWaiting + counts.lgUnreadSms}건
                  </span>
                </button>

                {userType === 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleMenuClick('channels')}
                    className="w-full flex items-center justify-between p-2.5 rounded-[9px] hover:bg-[#f6f8f3] transition-colors text-left cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-[#263d36]">승인대기 파트너 채널</div>
                      <div className="text-[11px] text-[#86918a]">파트너 계정 검수 및 승인</div>
                    </div>
                    <span className="adm-pill orange font-bold">{counts.pendingChannels}곳</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Main Workspace Content */}
        <main className="adm-main">
          {children}
        </main>

        {/* Bottom Workspace Footer */}
        <footer className="adm-footer">
          <span>© 2026 HYOWON SANGJO · Partner Center</span>
          <span>효원상조 통합 영업관리 워크스페이스</span>
          <span>HYOWON ADMIN SYSTEM</span>
        </footer>
      </div>
    </div>
  );
}
