import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { adminAuth } from '@/services/adminAuth';
import { adminData } from '@/services/adminData';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await adminAuth.getCurrentUser();
      setUser(userData);
      if (!userData) navigate('/admin/login');
    } catch (error) {
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminAuth.signOut();
      navigate('/');
    } catch {}
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard', mobileLabel: 'Dashboard' },
    { path: '/admin/products', icon: '📦', label: 'Produtos', mobileLabel: 'Produtos' },
    { path: '/admin/categories', icon: '🗂', label: 'Categorias', mobileLabel: 'Categorias' },
    { path: '/admin/collections', icon: '✨', label: 'Coleções', mobileLabel: 'Coleções' },
    { path: '/admin/carousel', icon: '🎞', label: 'Carrossel Novidades', mobileLabel: 'Carrossel' },
    { path: '/admin/users', icon: '👥', label: 'Usuários', mobileLabel: 'Usuários' },
    { path: '/admin/settings', icon: '⚙', label: 'Configurações', mobileLabel: 'Ajustes' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        {/* Sidebar Header */}
        <div className="flex flex-col items-center justify-center py-6 bg-slate-900 border-b border-slate-700">
          <h1 className="font-serif text-2xl tracking-wider text-white">
            <span className="text-amber-400">R</span>AVIC
            <span className="block text-[8px] tracking-[0.4em] text-slate-400 font-sans font-light -mt-1 uppercase text-center">
              Joias
            </span>
          </h1>
        </div>

        {/* Navigation */}
        <nav className="mt-6">
          <ul className="space-y-2 px-4">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium text-sm sm:text-base">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Logout */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
            >
              <span className="text-lg">🚪</span>
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Topbar */}
        <header className="bg-slate-800 border-b border-slate-700 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-slate-300 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Page Title */}
              <h1 className="text-lg sm:text-xl font-semibold text-white truncate">{title}</h1>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white">{user?.name || user?.email}</p>
                <p className="text-xs text-slate-400">{user?.role || 'admin'}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-slate-900">
                  {(user?.name?.charAt(0) || user?.email?.charAt(0) || 'A').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
