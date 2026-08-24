import { useState, useEffect } from 'react';
import AdminLogin from './components/AdminLogin';
import AdminLayout from './components/AdminLayout';
import CustomerManagement from './pages/CustomerManagement';
import ProductManagement from './pages/ProductManagement';
import ChannelManagement from './pages/ChannelManagement';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import LandingManagement from './pages/LandingManagement';
import ConsentManagement from './pages/ConsentManagement';
import LgProductManagement from './pages/LgProductManagement';

export default function AdminApp() {
  console.log('AdminApp Mounting...');
  const [activeMenu, setActiveMenu] = useState('customers');
  const [user, setUser] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('AdminApp Initialization Effect - Start');
    try {
      const params = new URLSearchParams(window.location.search);
      const proxySubdomain = params.get('proxy');
      const proxyName = params.get('name');
      
      console.log('AdminApp Init - Search Params:', { proxySubdomain, proxyName });
      
      // 1. Check for URL Proxy params
      if (proxySubdomain && proxyName) {
        console.log('AdminApp Init - Found Proxy in URL');
        const sessionUser = {
          type: 'channel',
          accountId: 'proxy',
          channelName: proxyName,
          subdomain: proxySubdomain,
          isProxy: true
        };
        sessionStorage.setItem('admin_proxy_user', JSON.stringify(sessionUser));
        setUser(sessionUser);
        setIsInitialized(true);
        return;
      }

      // 2. Check for existing Proxy Session
      const savedProxy = sessionStorage.getItem('admin_proxy_user');
      if (savedProxy && savedProxy !== 'null') {
        console.log('AdminApp Init - Found Proxy in SessionStorage');
        setUser(JSON.parse(savedProxy));
        setIsInitialized(true);
        return;
      }
      
      // 3. Check for Master Admin Session
      const saved = localStorage.getItem('admin_user');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        console.log('AdminApp Init - Found Master Admin in LocalStorage');
        setUser(JSON.parse(saved));
      } else {
        console.log('AdminApp Init - No user found anywhere');
      }
      setIsInitialized(true);
    } catch (e) {
      console.error('Admin session initialization error:', e);
      setIsInitialized(true); // Still mark as initialized to show login screen
    }
  }, []);

  useEffect(() => {
    console.log('AdminApp Effect - User Change:', user);
    if (user) {
      if (!user.isProxy) {
        localStorage.setItem('admin_user', JSON.stringify(user));
      }
    } else {
      localStorage.removeItem('admin_user');
      sessionStorage.removeItem('admin_proxy_user');
    }
  }, [user]);

  // URL Cleanup is removed to keep proxy context visible in the URL
  // and prevent confusion with master admin tabs.
  useEffect(() => {
    console.log('AdminApp Effect - Active User:', user?.accountId, user?.type);
  }, [user]);

  if (!isInitialized) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#F2F4F6]">
        <div className="w-10 h-10 border-4 border-[#3182F6] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[#4E5968] font-bold">관리자 세션 초기화 중...</p>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin onLogin={(userData) => {
        setUser(userData);
        setActiveMenu('customers');
    }} />;
  }

  const renderContent = () => {
    if (!user) return null;
    
    switch (activeMenu) {
      case 'customers':
        return <CustomerManagement channelId={user.type === 'channel' ? (user.subdomain || user.accountId) : undefined} />;
      case 'consent':
        return <ConsentManagement channelId={user.type === 'channel' ? (user.subdomain || user.accountId) : undefined} />;
      case 'products':
        return <ProductManagement key="products" />;
      case 'lg_products':
        return <LgProductManagement key="lg_products" />;
      case 'channels':
        return <ChannelManagement 
            currentChannelId={user.type === 'channel' ? (user.subdomain || user.accountId) : undefined}
            onLoginAsChannel={(channel) => {
                const url = `${window.location.origin}/admin?proxy=${channel.subdomain}&name=${encodeURIComponent(channel.channelName)}`;
                window.open(url, '_blank');
            }} 
        />;

      case 'landings':
        return <LandingManagement userType={user.type} subdomain={user.subdomain} />;

      case 'statistics':
        return <Statistics channelId={user.type === 'channel' ? (user.subdomain || user.accountId) : undefined} />;
      case 'settings':
        if (user.type === 'head_office' as any) return <CustomerManagement channelId={undefined} />;
        return <Settings user={user} />;
      default:
        return <CustomerManagement channelId={user.type === 'channel' ? (user.subdomain || user.accountId) : undefined} />;
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
      >

        {renderContent()}
      </AdminLayout>
    );
  } catch (e) {
    console.error('AdminApp Render Error:', e);
    return (
      <div className="p-20 text-center">
        <h1 className="text-2xl font-bold mb-4">관리자 화면을 불러오는 중 오류가 발생했습니다.</h1>
        <p className="text-[#8B95A1] mb-8">{e instanceof Error ? e.message : String(e)}</p>
        <button 
          onClick={() => { 
            localStorage.removeItem('admin_user'); 
            sessionStorage.removeItem('admin_proxy_user');
            window.location.href = window.location.pathname; 
          }}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg"
        >
          세션 초기화 후 재시도
        </button>
      </div>
    );
  }
}
