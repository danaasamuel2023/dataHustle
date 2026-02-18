'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  Phone,
  Calendar,
  Filter
} from 'lucide-react';

const API_BASE = 'https://datahustle.onrender.com/api/v1';

// Network Icons
const MTNIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <rect width="80" height="80" rx="16" fill="#FFCC00"/>
    <ellipse cx="40" cy="40" rx="30" ry="20" stroke="#000" strokeWidth="3" fill="none"/>
    <text x="40" y="46" textAnchor="middle" fontFamily="Arial Black" fontSize="14" fontWeight="900" fill="#000">MTN</text>
  </svg>
);

const TelecelIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <rect width="80" height="80" rx="16" fill="#E30613"/>
    <circle cx="40" cy="40" r="28" fill="#FFF" fillOpacity="0.15"/>
    <text x="40" y="50" textAnchor="middle" fontFamily="Arial" fontSize="32" fontWeight="700" fill="#FFF">t</text>
  </svg>
);

const ATIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <rect width="80" height="80" rx="16" fill="#0066B3"/>
    <circle cx="30" cy="32" r="5" fill="#FFF"/>
    <circle cx="50" cy="32" r="5" fill="#FFF"/>
    <path d="M24 48 Q40 64 56 48" stroke="#FFF" strokeWidth="5" fill="none" strokeLinecap="round"/>
  </svg>
);

const getNetworkIcon = (network, size = 28) => {
  switch (network) {
    case 'MTN': return <MTNIcon size={size} />;
    case 'TELECEL': return <TelecelIcon size={size} />;
    case 'AT': return <ATIcon size={size} />;
    default: return <MTNIcon size={size} />;
  }
};

export default function OrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  };

  const fetchOrders = async (pageNum = 1) => {
    const token = getAuthToken();
    if (!token) {
      router.push('/SignIn');
      return;
    }

    try {
      // Get store first
      const storeRes = await fetch(`${API_BASE}/agent-store/stores/my-store`, {
        headers: { 'x-auth-token': token }
      });
      const storeData = await storeRes.json();

      if (storeData.status !== 'success' || !storeData.data.store) {
        router.push('/store/create');
        return;
      }

      setStore(storeData.data.store);
      const storeId = storeData.data.store._id;

      // Fetch transactions
      let url = `${API_BASE}/agent-store/stores/${storeId}/transactions?page=${pageNum}&limit=20`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await fetch(url, {
        headers: { 'x-auth-token': token }
      });
      const data = await res.json();

      if (data.status === 'success') {
        setTransactions(data.data.transactions || []);
        setPagination(data.data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page);
  }, [page, statusFilter]);

  const formatCurrency = (amount) => `GH₵${(amount || 0).toFixed(2)}`;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, class: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', label: 'Completed' };
      case 'processing':
      case 'paid':
        return { icon: Clock, class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', label: 'Processing' };
      case 'pending':
        return { icon: Clock, class: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400', label: 'Pending' };
      case 'failed':
        return { icon: XCircle, class: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', label: 'Failed' };
      case 'refunded':
        return { icon: XCircle, class: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400', label: 'Refunded' };
      default:
        return { icon: Clock, class: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400', label: status };
    }
  };

  // Filter by search locally
  const displayedTransactions = searchTerm
    ? transactions.filter(t =>
        t.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.recipientPhone?.includes(searchTerm) ||
        t.customerPhone?.includes(searchTerm) ||
        t.network?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : transactions;

  // Calculate totals
  const totalProfit = transactions.reduce((sum, t) => {
    if (t.orderStatus === 'completed') {
      return sum + ((t.sellingPrice || 0) - (t.basePrice || 0));
    }
    return sum;
  }, 0);

  const totalRevenue = transactions.reduce((sum, t) => {
    if (t.orderStatus === 'completed') {
      return sum + (t.sellingPrice || 0);
    }
    return sum;
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/store"
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {pagination.total} total order{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">This Page Revenue</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">This Page Profit</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalProfit)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Orders</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{pagination.total}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by phone, ID, or network..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Orders List */}
      {displayedTransactions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedTransactions.map((order) => {
            const profit = (order.sellingPrice || 0) - (order.basePrice || 0);
            const statusInfo = getStatusBadge(order.orderStatus);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={order._id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Order Header */}
                <div className="flex items-center gap-3 p-4">
                  {getNetworkIcon(order.network, 36)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {order.network} {order.capacity}{order.capacityUnit || 'GB'}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.class}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                      {order.transactionId}
                    </p>
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-700">
                  <div className="bg-white dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Recipient</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {order.recipientPhone || '—'}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sold For</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatCurrency(order.sellingPrice)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Your Profit</p>
                    <p className={`text-sm font-bold ${profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                      {profit > 0 ? '+' : ''}{formatCurrency(profit)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                    <p className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
