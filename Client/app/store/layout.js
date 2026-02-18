'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import {
  Store,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wallet,
  Settings,
  Menu,
  X,
  ExternalLink,
  Loader2,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';

const API_BASE = 'https://datahustle.onrender.com/api/v1';

export default function StoreLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  };

  useEffect(() => {
    const fetchStore = async () => {
      const token = getAuthToken();
      if (!token) {
        router.push('/SignIn');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/agent-store/stores/my-store`, {
          headers: { 'x-auth-token': token }
        });
        const data = await res.json();

        if (data.status === 'success' && data.data.store) {
          setStore(data.data.store);
        }
      } catch (error) {
        console.error('Failed to fetch store:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [router]);

  const navigation = [
    { name: 'Dashboard', href: '/store', icon: LayoutDashboard },
    { name: 'Orders', href: '/store/orders', icon: ShoppingCart },
    { name: 'Products', href: '/store/products', icon: Package },
    { name: 'Withdrawals', href: '/store/withdrawals', icon: Wallet },
    { name: 'Settings', href: '/store/settings', icon: Settings },
  ];

  const isActive = (href) => {
    if (href === '/store') {
      return pathname === '/store';
    }
    return pathname.startsWith(href);
  };

  const cycleTheme = () => {
    if (theme === 'system') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  };

  const getThemeIcon = () => {
    if (!mounted) return <Monitor className="w-5 h-5" />;

    if (theme === 'system') {
      return <Monitor className="w-5 h-5" />;
    } else if (theme === 'light' || (theme === 'system' && resolvedTheme === 'light')) {
      return <Sun className="w-5 h-5" />;
    } else {
      return <Moon className="w-5 h-5" />;
    }
  };

  // Show create page without sidebar
  if (pathname === '/store/create') {
    return children;
  }

  // Show loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Redirect to create if no store
  if (!store && pathname !== '/store/create') {
    router.push('/store/create');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Store className="w-6 h-6 text-indigo-500" />
            <span className="font-semibold text-gray-900 dark:text-white truncate">
              {store?.storeName || 'My Store'}
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Theme toggle & Store link */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {/* Theme Toggle */}
          <button
            onClick={cycleTheme}
            className="flex items-center justify-between w-full px-3 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors"
          >
            <span className="flex items-center gap-2">
              {getThemeIcon()}
              <span className="capitalize">{mounted ? theme : 'system'} Mode</span>
            </span>
          </button>

          {/* Store link */}
          {store?.storeSlug && (
            <a
              href={`https://datavendo.shop/${store.storeSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View My Store
            </a>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:hidden">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="ml-3 font-semibold text-gray-900 dark:text-white">
              {store?.storeName || 'My Store'}
            </span>
          </div>

          {/* Mobile theme toggle */}
          <button
            onClick={cycleTheme}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {getThemeIcon()}
          </button>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
