import { useState, useEffect } from 'react';
import './styles/admin-theme.css';
import AdminLogin from './components/AdminLogin';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import CustomerManagement from './pages/CustomerManagement';
import LgCustomerManagement from './pages/LgCustomerManagement';
import ProductManagement from './pages/ProductManagement';
import ChannelManagement from './pages/ChannelManagement';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import LandingManagement from './pages/LandingManagement';
import ConsentManagement from './pages/ConsentManagement';
import LgProductManagement from './pages/LgProductManagement';
import DiscountCodeManagement from './pages/DiscountCodeManagement';

export default function AdminApp() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const proxySubdomain = params.get('proxy');
      const proxyName = params.get('name');

      // 1. Check for URL Proxy params
      if (proxySubdomain && proxyName) {
        const sessionUser = {
          type: 'channel',
          accountId: 'proxy',
          channelName: proxyName,
          subdomain: proxySubdomain,
          isProxy: true,
        };
        sessionStorage.setItem('admin_proxy_user', JSON.stringify(sessionUser));
        setUser(sessionUser);
        setActiveMenu('dashboard');
        setIsInitialized(true);
        return;
      }

      // 2. Check for existing Proxy Session
      const savedProxy = sessionStorage.getItem('admin_proxy_user');
      if (savedProxy && savedProxy !== 'null') {
        const parsedProxy = JSON.parse(savedProxy);
        setUser(parsedProxy);
        setActiveMenu(parsedProxy?.type === 'head_office' ? 'customers' : 'dashboard');
        setIsInitialized(true);
        return;
      }

      // 3. Check for Master Admin / Staff Session
      const saved = localStorage.getItem('admin_user');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsedUser = JSON.parse(saved);
        setUser(parsedUser);
        setActiveMenu(parsedUser?.type === 'head_office' ? 'customers' : 'dashboard');
      }
      setIsInitialized(true);
    } catch (e) {
      console.error('Admin session initialization error:', e);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (user) {
      if (!user.isProxy) {
        localStorage.setItem('admin_user', JSON.stringify(user));
      }
    } else {
      localStorage.removeItem('admin_user');
      sessionStorage.removeItem('admin_proxy_user');
    }
  }, [user]);

  if (!isInitialized) {
    return (
      <div className="sono-admin-theme h-screen flex flex-col items-center justify-center bg-[#f5f6f3]">
        <div className="w-9 h-9 border-[3px] border-[#295e52] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[#45554e] text-[13px] font-semibold">워크스페이스 세션을 확인하고 있습니다...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <AdminLogin
        onLogin={(userData) => {
          setUser(userData);
          setActiveMenu(userData?.type === 'head_office' ? 'customers' : 'dashboard');
        }}
      />
    );
  }

  const channelScopeId = user.type === 'channel' ? (user.subdomain || user.accountId) : undefined;

  const renderContent = () => {
    if (!user) return null;

    switch (activeMenu) {
      case 'dashboard':
        if (user.type === 'head_office') {
          return <CustomerManagement channelId={undefined} />;
        }
        return (
          <AdminDashboard
            channelId={channelScopeId}
            userType={user.type}
            onNavigate={(menu) => setActiveMenu(menu)}
          />
        );
      case 'customers':
        return <CustomerManagement channelId={channelScopeId} />;
      case 'lg_customers':
        return <LgCustomerManagement channelId={channelScopeId} />;
      case 'consent':
        return <ConsentManagement channelId={channelScopeId} />;
      case 'products':
        return <ProductManagement key="products" />;
      case 'lg_products':
        return (
          <LgProductManagement
            onOpenLandingSetting={() => {
              setActiveMenu('landings');
            }}
          />
        );
      case 'discount_codes':
        return <DiscountCodeManagement />;
      case 'channels':
        return (
          <ChannelManagement
            currentChannelId={channelScopeId}
            onLoginAsChannel={(channel) => {
              const url = `${window.location.origin}/admin?proxy=${channel.subdomain}&name=${encodeURIComponent(channel.channelName)}`;
              window.open(url, '_blank');
            }}
          />
        );
      case 'landings':
        return <LandingManagement userType={user.type} subdomain={user.subdomain} />;
      case 'statistics':
        return <Statistics channelId={channelScopeId} />;
      case 'settings':
        if (user.type === ('head_office' as any)) return <CustomerManagement channelId={undefined} />;
        return <Settings user={user} />;
      default:
        return <CustomerManagement channelId={channelScopeId} />;
    }
  };

  try {
    return (
      <AdminLayout
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        userType={user?.type || 'admin'}
        userName={user?.channelName || '관리자'}
        isProxyMode={!!user?.isProxy}
        onExitProxy={() => {
          if (user?.isProxy) {
            window.close();
          } else {
            setUser(null);
            localStorage.removeItem('admin_user');
            sessionStorage.removeItem('admin_proxy_user');
          }
        }}
        onLogout={() => {
          setUser(null);
          localStorage.removeItem('admin_user');
          sessionStorage.removeItem('admin_proxy_user');
        }}
        subdomain={user?.subdomain}
        channelId={channelScopeId}
      >
        {renderContent()}
      </AdminLayout>
    );
  } catch (e) {
    console.error('AdminApp Render Error:', e);
    return (
      <div className="sono-admin-theme min-h-screen flex items-center justify-center p-8">
        <div className="adm-panel p-10 text-center max-w-md w-full">
          <h1 className="text-[18px] font-bold text-[#263d36] mb-3">
            관리자 화면을 불러오는 중 오류가 발생했습니다.
          </h1>
          <p className="text-[#86918a] text-[12.5px] mb-6">
            {e instanceof Error ? e.message : String(e)}
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('admin_user');
              sessionStorage.removeItem('admin_proxy_user');
              window.location.href = window.location.pathname;
            }}
            className="adm-btn primary w-full"
          >
            세션 초기화 후 재시도
          </button>
        </div>
      </div>
    );
  }
}
