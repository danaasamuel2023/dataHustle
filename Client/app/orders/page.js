'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, Phone, Database, Clock, Search, Filter, X,
  Activity, TrendingUp, CheckCircle,
  AlertCircle, Calendar, Copy, Check
} from 'lucide-react';

const API_BASE_URL = 'https://api.datahustle.shop/api/v1';

const formatMoney = (amount) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2
  }).format(amount);
};

const networkNames = {
  'YELLO': 'MTN',
  'TELECEL': 'Telecel',
  'AT_PREMIUM': 'AirtelTigo Premium',
  'airteltigo': 'AirtelTigo',
  'at': 'AirtelTigo Standard'
};

export default function DataPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [allPurchases, setAllPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterNetwork, setFilterNetwork] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [copiedRef, setCopiedRef] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const router = useRouter();
  
  const getUserId = () => {
    if (typeof window === 'undefined') return null;
    
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) return null;
    
    try {
      const userData = JSON.parse(userDataStr);
      return userData.id;
    } catch (err) {
      console.error('Error parsing user data:', err);
      return null;
    }
  };

  useEffect(() => {
    const userId = getUserId();
    
    if (!userId) {
      router.push('/SignIn');
      return;
    }
    
    const loadPurchases = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/data/purchase-history/${userId}?page=1&limit=50`);
        const data = await res.json();
        
        if (data.status === 'success') {
          const purchasesData = data.data.purchases;
          setAllPurchases(purchasesData);
          setPurchases(purchasesData);
        } else {
          throw new Error('Failed to fetch purchases');
        }
      } catch (err) {
        console.error('Error fetching purchases:', err);
        setErrorMsg('Failed to load purchase history. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPurchases();
  }, [router]);

  useEffect(() => {
    if (allPurchases.length > 0) {
      let filtered = [...allPurchases];
      
      if (filterStatus !== 'all') {
        filtered = filtered.filter(purchase => purchase.status === filterStatus);
      }
      
      if (filterNetwork !== 'all') {
        filtered = filtered.filter(purchase => purchase.network === filterNetwork);
      }
      
      if (searchTerm.trim() !== '') {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(purchase => 
          purchase.phoneNumber.toLowerCase().includes(searchLower) ||
          purchase.geonetReference?.toLowerCase().includes(searchLower) ||
          networkNames[purchase.network]?.toLowerCase().includes(searchLower)
        );
      }
      
      setPurchases(filtered);
    }
  }, [searchTerm, filterStatus, filterNetwork, allPurchases]);

  const copyToClipboard = (text, purchaseId) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(purchaseId);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDataSize = (capacity) => {
    return capacity >= 1000 ? `${capacity / 1000}MB` : `${capacity}GB`;
  };

  const getUniqueNetworks = () => {
    if (!allPurchases.length) return [];
    return [...new Set(allPurchases.map(p => p.network))].sort();
  };

  const getUniqueStatuses = () => {
    if (!allPurchases.length) return [];
    return [...new Set(allPurchases.map(p => p.status))].sort();
  };

  const stats = {
    total: purchases.length,
    completed: purchases.filter(p => p.status === 'completed').length,
    pending: purchases.filter(p => p.status === 'pending').length,
    processing: purchases.filter(p => ['processing', 'waiting'].includes(p.status)).length,
    failed: purchases.filter(p => p.status === 'failed').length,
    totalAmount: purchases.reduce((sum, p) => sum + p.price, 0)
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { 
          icon: <CheckCircle className="w-4 h-4" />, 
          color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
          text: 'Completed'
        };
      case 'pending':
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
          text: 'Pending'
        };
      case 'processing':
      case 'waiting':
        return {
          icon: <Clock className="w-4 h-4 animate-spin" />,
          color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
          text: 'Processing'
        };
      case 'failed':
        return { 
          icon: <X className="w-4 h-4" />, 
          color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
          text: 'Failed'
        };
      default:
        return { 
          icon: <AlertCircle className="w-4 h-4" />, 
          color: 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600',
          text: status
        };
    }
  };

  const userId = getUserId();
  if (!userId && typeof window !== 'undefined') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center max-w-md w-full">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Login Required
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Please log in to view your purchase history.
          </p>
          <button 
            onClick={() => router.push('/SignIn')}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            Purchase History
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track and manage your data purchases
          </p>
        </div>

        {/* Stats */}
        {!isLoading && !errorMsg && purchases.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.completed}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.pending}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Spent</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatMoney(stats.totalAmount)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {/* Search and Filters */}
          {!isLoading && !errorMsg && purchases.length > 0 && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by phone, reference, or network..."
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    showFilters 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Filter className="w-5 h-5 mr-2" />
                  Filters
                </button>
              </div>
              
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="all">All Statuses</option>
                      {getUniqueStatuses().map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Network</label>
                    <select
                      value={filterNetwork}
                      onChange={(e) => setFilterNetwork(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="all">All Networks</option>
                      {getUniqueNetworks().map(network => (
                        <option key={network} value={network}>
                          {networkNames[network] || network}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading purchases...</p>
              </div>
            ) : errorMsg ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5 mb-2" />
                <p>{errorMsg}</p>
              </div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-20">
                <Database className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No purchases found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchTerm || filterStatus !== 'all' || filterNetwork !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Start purchasing data today!'}
                </p>
                {(searchTerm || filterStatus !== 'all' || filterNetwork !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('all');
                      setFilterNetwork('all');
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {purchases.map((purchase) => {
                  const statusInfo = getStatusInfo(purchase.status);
                  
                  return (
                    <div
                      key={purchase._id}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600/50"
                    >
                      {/* Top row: Bundle + Status + Price */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {formatDataSize(purchase.capacity)}
                          </h3>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                            {networkNames[purchase.network] || purchase.network}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.icon}
                            <span className="ml-1">{statusInfo.text}</span>
                          </span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{formatMoney(purchase.price)}</p>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2">
                          <p className="text-gray-400 dark:text-gray-500 mb-0.5">Phone</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{purchase.phoneNumber}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2">
                          <p className="text-gray-400 dark:text-gray-500 mb-0.5">Date</p>
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(purchase.createdAt)}</p>
                        </div>
                        {purchase.geonetReference && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2">
                            <p className="text-gray-400 dark:text-gray-500 mb-0.5">Reference</p>
                            <div className="flex items-center gap-1">
                              <code className="font-mono font-medium text-gray-900 dark:text-white truncate">{purchase.geonetReference}</code>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(purchase.geonetReference, purchase._id);
                                }}
                                className="hover:text-yellow-600 transition-colors flex-shrink-0"
                              >
                                {copiedRef === purchase._id ? (
                                  <Check className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                        {purchase.trackingId && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2">
                            <p className="text-gray-400 dark:text-gray-500 mb-0.5">Tracking ID</p>
                            <p className="font-mono font-medium text-gray-900 dark:text-white">{purchase.trackingId}</p>
                          </div>
                        )}
                      </div>

                      {/* Delivery info */}
                      {purchase.deliveryInfo && purchase.status === 'completed' && (
                        <div className="mt-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg px-3 py-1.5">
                          <p className="text-xs font-medium text-green-700 dark:text-green-400 whitespace-pre-line">{purchase.deliveryInfo}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Detail Modal */}
      {selectedPurchase && (
        <div
          onClick={() => setSelectedPurchase(null)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Purchase Details</h3>
            
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Data Package</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatDataSize(selectedPurchase.capacity)}</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Phone Number</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedPurchase.phoneNumber}</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Network</p>
                <p className="font-semibold text-gray-900 dark:text-white">{networkNames[selectedPurchase.network] || selectedPurchase.network}</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Status</p>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">{selectedPurchase.status}</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Amount Paid</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatMoney(selectedPurchase.price)}</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Purchase Date</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatDate(selectedPurchase.createdAt)}</p>
              </div>
              
              {selectedPurchase.geonetReference && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Reference</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedPurchase.geonetReference}</p>
                    <button
                      onClick={() => copyToClipboard(selectedPurchase.geonetReference, selectedPurchase._id)}
                      className="text-yellow-600 hover:text-yellow-700"
                    >
                      {copiedRef === selectedPurchase._id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {selectedPurchase.trackingId && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tracking ID</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedPurchase.trackingId}</p>
                </div>
              )}

              {selectedPurchase.deliveryInfo && (
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                  <p className="text-xs text-green-600 dark:text-green-400 mb-1">Delivery Status</p>
                  <p className="text-sm text-green-800 dark:text-green-300 whitespace-pre-line">{selectedPurchase.deliveryInfo}</p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setSelectedPurchase(null)}
              className="mt-4 w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-2 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}