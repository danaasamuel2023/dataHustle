'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  CreditCard, 
  ShoppingCart, 
  Award, 
  Clock, 
  Mail, 
  Phone, 
  Calendar, 
  Wallet,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Percent,
  TrendingUp,
  Activity,
  Target,
  Star,
  ArrowUp,
  DollarSign,
  BarChart3,
  Database
} from 'lucide-react';

const UserStatsPage = () => {
  const router = useRouter();
  
  // State variables
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [userData, setUserData] = useState(null);

  // Get token and user data from localStorage when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      const userDataStr = localStorage.getItem('userData');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      setAuthToken(token);
      
      if (userDataStr) {
        try {
          const parsedUserData = JSON.parse(userDataStr);
          setUserData(parsedUserData);
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

  // Check if user is admin
  const isAdmin = userData?.role === 'admin';

  // Fetch user stats when component mounts
  useEffect(() => {
    if (userData && authToken) {
      fetchUserStats();
    }
  }, [authToken, userData]);

  // Function to fetch user stats
  const fetchUserStats = async () => {
    if (!authToken || !userData) return;
    
    setLoading(true);
    try {
      const userId = userData.id;
      
      const response = await fetch(`https://datahustle.onrender.com/api/v1/user-stats/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUserStats(data.data);
      } else {
        setError('Failed to fetch user statistics');
      }
    } catch (err) {
      if (err.message && err.message.includes('401')) {
        setError('Your session has expired. Please log in again.');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        router.push('/login');
      } else {
        setError('An error occurred while fetching user statistics');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Show loading spinner if data is still loading
  if (!userData || !authToken || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-500 animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading your statistics...</p>
        </div>
      </div>
    );
  }
  
  // Show error message if there was an error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-2xl mx-auto mt-20">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Oops! Something went wrong</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow-sm transition-colors"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                User Statistics
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Track your performance and activity</p>
            </div>
            <button
              onClick={fetchUserStats}
              className="flex items-center justify-center px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow-sm transition-colors"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Refresh Data
            </button>
          </div>
        </div>
        
        {/* User Profile Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Section */}
            <div className="lg:col-span-1">
              <div className="flex flex-col items-center lg:items-start">
                <div className="w-24 h-24 bg-yellow-500 rounded-lg flex items-center justify-center shadow-sm mb-4">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{userStats.userInfo.name}</h2>
                <div className="space-y-2 text-center lg:text-left">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="text-sm">{userStats.userInfo.email}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4 mr-2" />
                    <span className="text-sm">{userStats.userInfo.phoneNumber}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Wallet Balance */}
              <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-green-600" />
                  </div>
                  <ArrowUp className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(userStats.userInfo.walletBalance)}</p>
              </div>
              
              {/* Member Duration */}
              <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <Star className="w-4 h-4 text-yellow-500" />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Membership Duration</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.userInfo.accountAge} days</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Since {formatDate(userStats.userInfo.registrationDate)}</p>
              </div>
              
              {/* Total Deposits */}
              <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-yellow-600" />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Deposited</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(userStats.depositStats.totalAmount)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{userStats.depositStats.numberOfDeposits} transactions</p>
              </div>
              
              {/* Success Rate */}
              <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-yellow-600" />
                  </div>
                  <BarChart3 className="w-4 h-4 text-yellow-600" />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.orderStats.successRate}%</p>
                <div className="mt-3">
                  <div className="bg-gray-200 dark:bg-gray-600 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-yellow-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${userStats.orderStats.successRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Order Statistics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Orders Overview */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mr-3">
                <ShoppingCart className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Order Analytics</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mr-3">
                    <Target className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Total Orders</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{userStats.orderStats.totalOrders}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center mr-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Successful Orders</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{userStats.orderStats.successfulOrders}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Activity Summary */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mr-3">
                <Activity className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Activity Summary</h3>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Performance Score</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round((userStats.orderStats.successRate + (userStats.orderStats.totalOrders / 10)) / 2)}%</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Based on success rate and order volume</div>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Engagement Level</span>
                  <div className="flex items-center">
                    <span className="text-xl font-bold text-gray-900 dark:text-white mr-2">
                      {userStats.orderStats.totalOrders > 50 ? 'High' : userStats.orderStats.totalOrders > 20 ? 'Medium' : 'Growing'}
                    </span>
                    <Activity className={`w-5 h-5 ${userStats.orderStats.totalOrders > 50 ? 'text-green-600' : userStats.orderStats.totalOrders > 20 ? 'text-yellow-600' : 'text-blue-600'}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Admin-only Ranking Section */}
        {isAdmin && userStats.ranking && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mr-3">
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Leaderboard Position</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Administrator view</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-32 h-32 bg-yellow-500 rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-4xl font-bold text-white">#{userStats.ranking.position}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 px-2 py-1 bg-yellow-500 rounded-full text-white text-xs font-bold">
                    Top {userStats.ranking.percentile}%
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Global Ranking</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">Position {userStats.ranking.position} of {userStats.ranking.outOf}</p>
              </div>
              
              <div className="lg:col-span-2 space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <h4 className="text-gray-900 dark:text-white font-bold mb-3">Performance Percentile</h4>
                  <div className="relative">
                    <div className="bg-gray-200 dark:bg-gray-600 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-yellow-500 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${userStats.ranking.percentile}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-yellow-600 font-bold">Top {userStats.ranking.percentile}%</span>
                      <span className="text-gray-600 dark:text-gray-400">Outperforming {100 - userStats.ranking.percentile}% of users</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <h4 className="text-gray-900 dark:text-white font-bold mb-2">Performance Analysis</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {userStats.ranking.position <= 10 ? (
                      "🏆 Elite performer! This user demonstrates exceptional engagement and drives significant value to the platform."
                    ) : userStats.ranking.position <= 50 ? (
                      "⭐ Top-tier user with strong activity patterns. Consistent performance places them well above average."
                    ) : (
                      "📈 Active participant showing growth potential. Continued engagement will improve their standing."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserStatsPage;