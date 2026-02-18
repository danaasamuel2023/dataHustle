'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  ShoppingCart,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

const API_BASE = 'https://datahustle.onrender.com/api/v1';

export default function StoreDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  };

  const fetchDashboard = async () => {
    const token = getAuthToken();
    if (!token) {
      router.push('/SignIn');
      return;
    }

    try {
      // Fetch store first
      const storeRes = await fetch(`${API_BASE}/agent-store/stores/my-store`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const storeData = await storeRes.json();

      if (storeData.status !== 'success' || !storeData.data.store) {
        router.push('/store/create');
        return;
      }

      setStore(storeData.data.store);
      const storeId = storeData.data.store._id;

      // Fetch dashboard data
      const dashboardRes = await fetch(`${API_BASE}/agent-store/stores/${storeId}/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dashboardData = await dashboardRes.json();

      if (dashboardData.status === 'success') {
        setDashboard(dashboardData.data);
      }

      // Fetch recent orders
      const ordersRes = await fetch(`${API_BASE}/agent-store/stores/${storeId}/orders?limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordersData = await ordersRes.json();

      if (ordersData.status === 'success') {
        setRecentOrders(ordersData.data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [router]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const copyStoreLink = () => {
    if (store?.storeSlug) {
      navigator.clipboard.writeText(`https://datavendo.shop/${store.storeSlug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCurrency = (amount) => {
    return `GH₵${(amount || 0).toFixed(2)}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const stats = [
    {
      name: 'Available Balance',
      value: formatCurrency(store?.wallet?.availableBalance),
      icon: Wallet,
      color: 'indigo',
      change: store?.wallet?.pendingBalance > 0 ? `+${formatCurrency(store.wallet.pendingBalance)} pending` : null
    },
    {
      name: 'Total Earnings',
      value: formatCurrency(store?.wallet?.totalEarnings),
      icon: TrendingUp,
      color: 'green'
    },
    {
      name: 'Total Orders',
      value: store?.stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'blue'
    },
    {
      name: 'Total Customers',
      value: store?.stats?.totalCustomers || 0,
      icon: Users,
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Welcome back to {store?.storeName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/store/withdrawals"
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Withdraw
          </Link>
        </div>
      </div>

      {/* Store Link */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              Your Store Link
            </p>
            <p className="text-sm text-indigo-600 dark:text-indigo-400 truncate mt-1">
              https://datavendo.shop/{store?.storeSlug}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyStoreLink}
              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-lg"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
            <a
              href={`https://datavendo.shop/${store?.storeSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-lg"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {stat.name}
              </p>
              {stat.change && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  {stat.change}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/store/products"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
        >
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Manage Products</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Add or edit data bundles</p>
          </div>
        </Link>

        <Link
          href="/store/withdrawals"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
        >
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Withdraw Earnings</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Transfer to mobile money</p>
          </div>
        </Link>

        <Link
          href="/store/settings"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
        >
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Store Settings</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Customize your store</p>
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
          <Link
            href="/store/orders"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No orders yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Share your store link to start receiving orders
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentOrders.map((order) => (
              <div key={order._id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {order.productName || 'Data Bundle'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {order.recipientPhone} • {order.network}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(order.sellingPrice)}
                  </p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
