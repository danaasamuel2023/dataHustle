'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  AlertCircle,
  DollarSign,
  Calendar,
  Search,
  Activity,
  TrendingUp
} from 'lucide-react';

const TransactionsPage = () => {
  const router = useRouter();
  
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 100,
    pages: 0
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authToken = localStorage.getItem('authToken');
      const userDataStr = localStorage.getItem('userData');
      
      if (!authToken) {
        router.push('/login');
        return;
      }
      
      setToken(authToken);
      
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          setUser(userData);
        } catch (err) {
          console.error('Error parsing user data:', err);
          localStorage.removeItem('userData');
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    }
  }, [router]);

  useEffect(() => {
    if (user && token) {
      loadTransactions();
    }
  }, [token, user, pagination.page, statusFilter]);

  const loadTransactions = async () => {
    if (!token || !user) return;
    
    setIsLoading(true);
    try {
      const userId = user.id;
      let url = `https://datahustle.onrender.com/api/v1/user-transactions/${userId}?page=${pagination.page}&limit=${pagination.limit}`;
      
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      
      if (data.success) {
        setTransactions(data.data.transactions);
        setPagination(data.data.pagination);
      } else {
        setErrorMsg('Failed to fetch transactions');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        showNotification('Session expired. Please log in again.', 'error');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        router.push('/login');
      } else {
        setErrorMsg('An error occurred while fetching transactions');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTransaction = async (transactionId, createdAt) => {
    if (!token || !user) return;
    
    const transactionTime = new Date(createdAt);
    const currentTime = new Date();
    const hoursDiff = (currentTime - transactionTime) / (1000 * 60 * 60);
    
    if (hoursDiff > 5) {
      showNotification('Cannot verify. Transaction is older than 5 hours. Contact admin.', 'error');
      return;
    }
    
    setVerifyingId(transactionId);
    try {
      const res = await fetch(`https://datamartbackened.onrender.com/api/v1/verify-pending-transaction/${transactionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      
      if (data.success) {
        showNotification('Transaction verified successfully!', 'success');
        setTransactions(prevTransactions => 
          prevTransactions.map(t => 
            t._id === transactionId ? { ...t, status: 'completed' } : t
          )
        );
      } else {
        showNotification(data.message || 'Verification failed', 'error');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        showNotification('Session expired. Please log in again.', 'error');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        router.push('/login');
      } else {
        showNotification('An error occurred during verification', 'error');
        console.error(err);
      }
    } finally {
      setVerifyingId(null);
    }
  };

  const isExpired = (createdAt) => {
    const transactionTime = new Date(createdAt);
    const currentTime = new Date();
    const hoursDiff = (currentTime - transactionTime) / (1000 * 60 * 60);
    return hoursDiff > 5;
  };

  const changePage = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination({ ...pagination, page: newPage });
    }
  };

  const changeFilter = (e) => {
    setStatusFilter(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount);
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
      case 'failed':
        return { 
          icon: <XCircle className="w-4 h-4" />, 
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

  const stats = {
    total: transactions.length,
    completed: transactions.filter(t => t.status === 'completed').length,
    pending: transactions.filter(t => t.status === 'pending').length,
    totalAmount: transactions.reduce((sum, t) => sum + (t.status === 'completed' ? t.amount : 0), 0)
  };

  const TransactionCard = ({ transaction }) => {
    const status = getStatusInfo(transaction.status);
    const expired = transaction.status === 'pending' && isExpired(transaction.createdAt);
    
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg mb-3">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="font-semibold text-gray-900 dark:text-white capitalize">{transaction.type}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(transaction.createdAt)}
            </div>
          </div>
          <div className={`flex items-center px-2 py-1 rounded-lg text-xs font-medium ${status.color}`}>
            {status.icon}
            <span className="ml-1">{status.text}</span>
            {expired && <span className="ml-1 text-red-600">(Expired)</span>}
          </div>
        </div>
        
        <div className="mb-3">
          <div className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {formatMoney(transaction.amount)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded break-all">
            Ref: {transaction.reference}
          </div>
        </div>
        
        {transaction.status === 'pending' && (
          <button
            className={`w-full flex justify-center items-center py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              expired 
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' 
                : verifyingId === transaction._id 
                  ? 'bg-yellow-500 text-white'
                  : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
            disabled={verifyingId === transaction._id || expired}
            onClick={() => expired 
              ? showNotification('Cannot verify. Transaction expired. Contact admin.', 'error')
              : verifyTransaction(transaction._id, transaction.createdAt)
            }
          >
            {verifyingId === transaction._id ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : expired ? (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Contact Admin
              </>
            ) : (
              'Verify Transaction'
            )}
          </button>
        )}
      </div>
    );
  };

  if (!user || !token || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-500 animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading transactions...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            Transaction History
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            View and manage your transactions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatMoney(stats.totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                className="border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                value={statusFilter}
                onChange={changeFilter}
              >
                <option value="">All Transactions</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            <button 
              onClick={loadTransactions} 
              className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
        
        {/* Notification */}
        {notification.show && (
          <div className={`mb-6 p-3 rounded-lg flex items-center text-sm ${
            notification.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            <span>{notification.message}</span>
          </div>
        )}
        
        {/* Error */}
        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg flex items-center text-sm border border-red-200 dark:border-red-800">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{errorMsg}</span>
          </div>
        )}
        
        {/* Mobile view */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
            </div>
          ) : (
            transactions.map(transaction => <TransactionCard key={transaction._id} transaction={transaction} />)
          )}
        </div>
        
        {/* Desktop view */}
        <div className="hidden md:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => {
                  const status = getStatusInfo(transaction.status);
                  const expired = transaction.status === 'pending' && isExpired(transaction.createdAt);
                  
                  return (
                    <tr key={transaction._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 capitalize font-medium">
                        {transaction.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-semibold">
                        {formatMoney(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="max-w-[150px] overflow-hidden text-ellipsis">
                          {transaction.reference}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${status.color}`}>
                          {status.icon}
                          <span className="ml-1">{status.text}</span>
                          {expired && <span className="ml-1 text-red-600">(Expired)</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {transaction.status === 'pending' && (
                          <button
                            className={`inline-flex items-center px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                              expired 
                                ? 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700' 
                                : 'border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 disabled:opacity-50'
                            }`}
                            disabled={verifyingId === transaction._id || expired}
                            onClick={() => expired 
                              ? showNotification('Cannot verify. Transaction expired. Contact admin.', 'error')
                              : verifyTransaction(transaction._id, transaction.createdAt)
                            }
                          >
                            {verifyingId === transaction._id ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                                Verifying...
                              </>
                            ) : expired ? (
                              <>
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Contact Admin
                              </>
                            ) : (
                              'Verify'
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center mt-6 gap-4">
            <button
              onClick={() => changePage(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-sm text-gray-700 dark:text-gray-300 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              Page {pagination.page} of {pagination.pages}
            </div>
            
            <button
              onClick={() => changePage(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;