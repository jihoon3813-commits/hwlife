import { useState } from 'react';
import AdminLogin from './components/AdminLogin';
import AdminLayout from './components/AdminLayout';
import CustomerManagement from './pages/CustomerManagement';
import ProductManagement from './pages/ProductManagement';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';

export default function AdminApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeMenu, setActiveMenu] = useState('customers');

  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'customers':
        return <CustomerManagement />;
      case 'products':
        return <ProductManagement />;
      case 'statistics':
        return <Statistics />;
      case 'settings':
        return <Settings />;
      default:
        return <CustomerManagement />;
    }
  };

  return (
    <AdminLayout activeMenu={activeMenu} setActiveMenu={setActiveMenu}>
      {renderContent()}
    </AdminLayout>
  );
}
