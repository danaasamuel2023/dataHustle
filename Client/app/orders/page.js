'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronRight, Phone, Database, CreditCard, Clock, Search, Filter, X, Zap, Activity, Sparkles, TrendingUp, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

// API constants
const GEONETTECH_BASE_URL = 'https://testhub.geonettech.site/api/v1/checkOrderStatus/:ref';
const API_KEY = '42|tjhxBxaWWe4mPUpxXN1uIk0KTxypvlSqOIOQWz6K162aa0d6';
const TELCEL_API_URL = 'https://iget.onrender.com/api/developer/orders/reference/:orderRef';
const TELCEL_API_KEY = '4cb6763274e86173d2c22c120493ca67b6185039f826f4aa43bb3057db50f858'; 
const API_BASE_URL = 'https://datahustle.onrender.com/api/v1';

// Format currency as GHS
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2
  }).format(amount);
};

// Network display names mapping
const networkNames = {
  'YELLO': 'MTN',
  'TELECEL': 'Telecel',
  'AT_PREMIUM': 'AirtelTigo Premium',
  'airteltigo': 'AirtelTigo',
  'at': 'AirtelTigo Standard'
};

// Network logo colors
const networkColors = {
  'YELLO': 'from-yellow-500 to-yellow-600',
  'TELECEL': 'from-red-500 to-red-600',
  'AT_PREMIUM': 'from-blue-500 to-blue-600',
  'airteltigo': 'from-blue-500 to-blue-600',
  'at': 'from-blue-500 to-blue-600'
};

// Status badge color mapping
const statusColors = {
  'pending': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
  'completed': 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30',
  'failed': 'bg-red-500/20 text-red-700 border-red-500/30',
  'processing': 'bg-blue-500/20 text-blue-700 border-blue-500/30',
  'refunded': 'bg-purple-500/20 text-purple-700 border-purple-500/30',
  'waiting': 'bg-gray-500/20 text-gray-700 border-gray-500/30'
};

export default function DataPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [allPurchases, setAllPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterNetwork, setFilterNetwork] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState({});
  const [checkedStatuses, setCheckedStatuses] = useState({});

  const router = useRouter();
  
  // Get userId from localStorage userData object
  const getUserId = () => {
    if (typeof window === 'undefined') return null;
    
    const userDataString = localStorage.getItem('userData');
    if (!userDataString) return null;
    
    try {
      const userData = JSON.parse(userDataString);
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
    
    const fetchPurchases = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/data/purchase-history/${userId}`, {
          params: {
            page: 1,
            limit: 50
          }
        });
        
        if (response.data.status === 'success') {
          const purchasesData = response.data.data.purchases;
          setAllPurchases(purchasesData);
          setPurchases(purchasesData);
        } else {
          throw new Error('Failed to fetch purchases');
        }
      } catch (err) {
        console.error('Error fetching purchases:', err);
        setError('Failed to load purchase history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [router]);

  // Apply filters and search
  useEffect(() => {
    if (allPurchases.length > 0) {
      let filteredPurchases = [...allPurchases];
      
      // Apply status filter
      if (filterStatus !== 'all') {
        filteredPurchases = filteredPurchases.filter(purchase => purchase.status === filterStatus);
      }
      
      // Apply network filter
      if (filterNetwork !== 'all') {
        filteredPurchases = filteredPurchases.filter(purchase => purchase.network === filterNetwork);
      }
      
      // Apply search
      if (searchTerm.trim() !== '') {
        const searchLower = searchTerm.toLowerCase();
        filteredPurchases = filteredPurchases.filter(purchase => 
          purchase.phoneNumber.toLowerCase().includes(searchLower) ||
          purchase.geonetReference?.toLowerCase().includes(searchLower) ||
          networkNames[purchase.network]?.toLowerCase().includes(searchLower) ||
          purchase.network.toLowerCase().includes(searchLower)
        );
      }
      
      setPurchases(filteredPurchases);
    }
  }, [searchTerm, filterStatus, filterNetwork, allPurchases]);

  // Check order status for different networks
  const checkOrderStatus = async (purchaseId, geonetReference, network) => {
    if (!geonetReference || network === 'at') {
      return;
    }
    
    setCheckingStatus(prev => ({ ...prev, [purchaseId]: true }));
    
    try {
      let statusResponse;
      let status;
      
      // Use Telcel API for Telecel network
      if (network === 'TELECEL') {
        const telcelUrl = TELCEL_API_URL.replace(':orderRef', geonetReference);
        
        statusResponse = await axios.get(
          telcelUrl,
          {
            headers: {
              'X-API-Key': TELCEL_API_KEY
            }
          }
        );
        
        status = statusResponse.data.data.order.status;
      } else {
        // For other networks, use the original GeoNetTech API
        const url = GEONETTECH_BASE_URL.replace(':ref', geonetReference);
        
        statusResponse = await axios.get(
          url,
          {
            headers: {
              Authorization: `Bearer ${API_KEY}`
            }
          }
        );
        
        status = statusResponse.data.data.status;
      }
      
      // Only update if we got a valid status back
      if (status) {
        // Update status in state
        const updatedPurchases = allPurchases.map(purchase => {
          if (purchase._id === purchaseId) {
            return { ...purchase, status: status };
          }
          return purchase;
        });
        
        setAllPurchases(updatedPurchases);
        
        // Also update the filtered purchases list
        const updatedFilteredPurchases = purchases.map(purchase => {
          if (purchase._id === purchaseId) {
            return { ...purchase, status: status };
          }
          return purchase;
        });
        
        setPurchases(updatedFilteredPurchases);

        // Mark this status as checked
        setCheckedStatuses(prev => ({
          ...prev,
          [purchaseId]: true
        }));
      } else {
        // Mark this status as checked (but don't change the actual status)
        setCheckedStatuses(prev => ({
          ...prev,
          [purchaseId]: true
        }));
      }
      
    } catch (error) {
      console.error(`Failed to fetch status for purchase ${purchaseId}:`, error);
      
      // Mark it as checked so the status badge shows the original status
      setCheckedStatuses(prev => ({
        ...prev,
        [purchaseId]: true
      }));
      
    } finally {
      setCheckingStatus(prev => ({ ...prev, [purchaseId]: false }));
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterNetwork('all');
    setShowFilters(false);
  };

  // Format date string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if user is authenticated
  const userId = getUserId();
  if (!userId && typeof window !== 'undefined') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-transparent bg-clip-text mb-4">
            DATAHUSTLE
          </h2>
          <p className="mb-4 text-white/80 text-sm">You need to be logged in to view your purchases.</p>
          <button 
            onClick={() => router.push('/SignIn')}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-2 px-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 text-sm"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }
  
  // Helper function to get network initials for logo
  const getNetworkInitials = (networkCode) => {
    const name = networkNames[networkCode] || networkCode;
    return name.substring(0, 2).toUpperCase();
  };

  // Format data size
  const formatDataSize = (capacity) => {
    return capacity >= 1000 
      ? `${capacity / 1000}MB` 
      : `${capacity}GB`;
  };

  // Get unique networks for filter dropdown
  const getUniqueNetworks = () => {
    if (!allPurchases.length) return [];
    const networks = [...new Set(allPurchases.map(purchase => purchase.network))];
    return networks.sort();
  };

  // Get unique statuses for filter dropdown
  const getUniqueStatuses = () => {
    if (!allPurchases.length) return [];
    const statuses = [...new Set(allPurchases.map(purchase => purchase.status))];
    return statuses.sort();
  };

  // Calculate purchase stats
  const purchaseStats = {
    total: purchases.length,
    completed: purchases.filter(p => p.status === 'completed').length,
    pending: purchases.filter(p => p.status === 'pending').length,
    totalAmount: purchases.reduce((sum, p) => sum + p.price, 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-400/5 to-teal-400/5 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-purple-400/5 to-pink-400/5 blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        {/* Header - Compact */}
        <div className="mb-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Database className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Purchase History</h1>
                <p className="text-white/70 text-sm">Track your data purchases</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            {!loading && !error && purchases.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-xs text-white/70">Total</p>
                      <p className="text-sm font-bold text-white">{purchaseStats.total}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-xs text-white/70">Completed</p>
                      <p className="text-sm font-bold text-white">{purchaseStats.completed}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    <div>
                      <p className="text-xs text-white/70">Pending</p>
                      <p className="text-sm font-bold text-white">{purchaseStats.pending}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-teal-400" />
                    <div>
                      <p className="text-xs text-white/70">Spent</p>
                      <p className="text-xs font-bold text-white">{formatCurrency(purchaseStats.totalAmount)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden shadow-xl">
          {/* Search and Filter Bar - Compact */}
          {!loading && !error && purchases.length > 0 && (
            <div className="p-4 border-b border-white/10">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-emerald-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by phone number or reference..."
                    className="block w-full pl-10 pr-4 py-2 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 backdrop-blur-sm text-sm"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <X className="h-4 w-4 text-white/50 hover:text-emerald-400" />
                    </button>
                  )}
                </div>
                
                {/* Filter button */}
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center justify-center px-4 py-2 border border-white/20 bg-white/10 rounded-lg text-white hover:bg-white/20 font-medium backdrop-blur-sm text-sm transition-all duration-300"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters {showFilters ? '▲' : '▼'}
                </button>
                
                {/* Reset button */}
                {(searchTerm || filterStatus !== 'all' || filterNetwork !== 'all') && (
                  <button 
                    onClick={resetFilters}
                    className="flex items-center justify-center px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg hover:bg-red-500/30 font-medium text-sm transition-all duration-300"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reset
                  </button>
                )}
              </div>
              
              {/* Expanded filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 p-3 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">Status:</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="block w-full px-3 py-2 border border-white/20 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm backdrop-blur-sm"
                    >
                      <option value="all">All Statuses</option>
                      {getUniqueStatuses().map(status => (
                        <option key={status} value={status} className="bg-gray-800">{status}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">Network:</label>
                    <select
                      value={filterNetwork}
                      onChange={(e) => setFilterNetwork(e.target.value)}
                      className="block w-full px-3 py-2 border border-white/20 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm backdrop-blur-sm"
                    >
                      <option value="all">All Networks</option>
                      {getUniqueNetworks().map(network => (
                        <option key={network} value={network} className="bg-gray-800">
                          {networkNames[network] || network}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Content area */}
          <div className="p-4">
            {/* Loading state */}
            {loading ? (
              <div className="flex flex-col justify-center items-center py-12">
                <div className="relative w-12 h-12 mx-auto mb-4">
                  <div className="w-12 h-12 rounded-full border-3 border-emerald-200/20"></div>
                  <div className="absolute top-0 w-12 h-12 rounded-full border-3 border-transparent border-t-emerald-400 border-r-teal-400 animate-spin"></div>
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 animate-pulse flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <span className="text-white/80 text-sm">Loading purchases...</span>
              </div>
            ) : error ? (
              <div className="bg-red-500/20 border border-red-500/30 p-4 rounded-xl text-red-200 text-sm">
                {error}
              </div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-12 text-white/70">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Database className="h-6 w-6 text-white/50" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No purchases found</h3>
                <p className="text-sm mb-4">Start your DATAHUSTLE journey today!</p>
                {searchTerm || filterStatus !== 'all' || filterNetwork !== 'all' ? (
                  <button 
                    onClick={resetFilters}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    Clear Filters
                  </button>
                ) : null}
              </div>
            ) : (
              /* Card list - Mobile-friendly */
              <div className="space-y-3">
                {purchases.map((purchase) => (
                  <div 
                    key={purchase._id} 
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Network logo */}
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${networkColors[purchase.network] || 'from-gray-500 to-gray-600'} flex items-center justify-center text-white font-bold text-xs shadow-lg`}>
                          {getNetworkInitials(purchase.network)}
                        </div>
                        
                        <div>
                          <div className="font-bold text-white text-sm">
                            {formatDataSize(purchase.capacity)} • {purchase.phoneNumber}
                          </div>
                          <div className="text-xs text-white/70">
                            {formatDate(purchase.createdAt)} • {formatCurrency(purchase.price)}
                          </div>
                          {purchase.geonetReference && (
                            <div className="text-xs text-white/50 truncate max-w-32">
                              Ref: {purchase.geonetReference}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {purchase.geonetReference && purchase.network !== 'at' ? (
                          <button
                            onClick={() => checkOrderStatus(purchase._id, purchase.geonetReference, purchase.network)}
                            disabled={checkingStatus[purchase._id]}
                            className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs rounded-lg flex items-center font-medium shadow-lg transform hover:scale-105 transition-all duration-300"
                          >
                            {checkingStatus[purchase._id] ? (
                              <>
                                <Loader2 className="animate-spin h-3 w-3 mr-1" />
                                Checking
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Check
                              </>
                            )}
                          </button>
                        ) : null}
                        
                        {checkedStatuses[purchase._id] && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-lg border ${statusColors[purchase.status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
                            {purchase.status || "Unknown"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t border-white/10 p-4 text-center text-xs text-white/60">
            <div className="flex items-center justify-center space-x-2">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Having issues? Contact DATAHUSTLE support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}