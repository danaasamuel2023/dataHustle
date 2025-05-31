// pages/user-stats.js
'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
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
  Moon,
  Sun,
  Activity,
  Target,
  Star
} from 'lucide-react';

const UserStatsPage = () => {
  const router = useRouter();
  
  // State variables
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Get token and user data from localStorage when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      const userDataStr = localStorage.getItem('userData');
      
      // Check for system dark mode preference or saved preference
      const savedDarkMode = localStorage.getItem('darkMode');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      setDarkMode(savedDarkMode === 'true' || (savedDarkMode === null && prefersDark));
      
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

  // Listen for system dark mode changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Only change if user hasn't explicitly set a preference
      if (localStorage.getItem('darkMode') === null) {
        setDarkMode(e.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save preference
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

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
      
      // Using GET request with userId in URL params
      const response = await axios.get(`https://datahustle.onrender.com/api/v1/user-stats/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.data.success) {
        setUserStats(response.data.data);
      } else {
        setError('Failed to fetch user statistics');
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        // Handle token expiration
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

  // Get status color and style
  const getStatusStyle = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700';
      case 'pending':
        return 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700';
      case 'rejected':
        return 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700';
      default:
        return 'bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/30 dark:to-slate-700/30 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600';
    }
  };

  // Show loading spinner if data is still loading
  if (!userData || !authToken || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 dark:border-blue-400 absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-slate-600 dark:text-slate-300 font-medium">Loading your statistics...</p>
        </div>
      </div>
    );
  }
  
  // Show error message if there was an error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
        <div className="max-w-2xl mx-auto mt-20">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/30 p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">Oops! Something went wrong</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-8">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/30 p-8 mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 dark:from-blue-400/5 dark:to-indigo-400/5"></div>
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center mb-3">
                <div className="w-3 h-3 bg-emerald-400 rounded-full mr-3 animate-pulse"></div>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live Dashboard</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                Account Overview
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-2 text-lg">Track your performance and activity metrics</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="flex items-center justify-center w-12 h-12 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={fetchUserStats}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Refresh Data
              </button>
            </div>
          </div>
        </div>
        
        {/* User Profile Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/30 p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
            {/* Profile Avatar & Info */}
            <div className="flex items-center mb-6 md:mb-0">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="ml-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{userStats.userInfo.name}</h2>
                <div className="flex items-center text-slate-600 dark:text-slate-300 mt-1">
                  <Mail className="w-4 h-4 mr-2" />
                  <span className="text-sm">{userStats.userInfo.email}</span>
                </div>
                <div className="flex items-center text-slate-600 dark:text-slate-300 mt-1">
                  <Phone className="w-4 h-4 mr-2" />
                  <span className="text-sm">{userStats.userInfo.phoneNumber}</span>
                </div>
              </div>
            </div>
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              {/* Account Status */}
              <div className="group">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-600/50 rounded-xl p-5 border border-slate-200/50 dark:border-slate-600/30 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">Account Status</p>
                  <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold inline-block capitalize ${getStatusStyle(userStats.userInfo.accountStatus)}`}>
                    {userStats.userInfo.accountStatus}
                  </div>
                </div>
              </div>
              
              {/* Wallet Balance */}
              <div className="group">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-600/50 rounded-xl p-5 border border-slate-200/50 dark:border-slate-600/30 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">Wallet Balance</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(userStats.userInfo.walletBalance)}</p>
                </div>
              </div>
              
              {/* Account Age */}
              <div className="group">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-600/50 rounded-xl p-5 border border-slate-200/50 dark:border-slate-600/30 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">Member Since</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{userStats.userInfo.accountAge} days</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formatDate(userStats.userInfo.registrationDate)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Deposit Statistics */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/30 p-8">
            <div className="flex items-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                <CreditCard className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Deposit Activity</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">Your funding history</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-emerald-200/50 dark:border-emerald-700/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-700 dark:text-emerald-300 text-sm font-semibold mb-1">Total Deposited</p>
                    <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">{formatCurrency(userStats.depositStats.totalAmount)}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-200 dark:bg-emerald-800 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-700/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-700 dark:text-blue-300 text-sm font-semibold mb-1">Total Transactions</p>
                    <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">{userStats.depositStats.numberOfDeposits}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-blue-700 dark:text-blue-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Order Statistics */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/30 p-8">
            <div className="flex items-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                <ShoppingCart className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Order Performance</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">Your purchase statistics</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-600/50 rounded-xl p-5 border border-slate-200/50 dark:border-slate-600/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-600 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{userStats.orderStats.totalOrders}</p>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl p-5 border border-emerald-200/50 dark:border-emerald-700/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-emerald-200 dark:bg-emerald-700 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                  </div>
                </div>
                <p className="text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-1">Successful</p>
                <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">{userStats.orderStats.successfulOrders}</p>
              </div>
              
              <div className="md:col-span-2">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200/50 dark:border-purple-700/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-700 dark:text-purple-300 text-sm font-semibold mb-2">Success Rate</p>
                      <div className="flex items-center">
                        <span className="text-3xl font-bold text-purple-800 dark:text-purple-200 mr-2">{userStats.orderStats.successRate}%</span>
                        <Star className="w-6 h-6 text-yellow-500" />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-16 h-16 relative">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-purple-200 dark:text-purple-800"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${(userStats.orderStats.successRate / 100) * 175.93} 175.93`}
                            className="text-purple-600 dark:text-purple-400"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Admin-only Ranking Section */}
        {isAdmin && userStats.ranking && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/30 p-8">
            <div className="flex items-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                <Award className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">User Rankings</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">Admin view: Community standings</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <Award className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    #{userStats.ranking.position}
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">Current Position</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">#{userStats.ranking.position} of {userStats.ranking.outOf}</p>
              </div>
              
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200/50 dark:border-purple-700/30">
                  <h4 className="text-purple-800 dark:text-purple-200 font-semibold mb-4">Percentile Ranking</h4>
                  <div className="relative">
                    <div className="bg-purple-200 dark:bg-purple-800 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${userStats.ranking.percentile}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-3 text-sm">
                      <span className="text-purple-700 dark:text-purple-300 font-medium">Top {userStats.ranking.percentile}%</span>
                      <span className="text-slate-600 dark:text-slate-300">Better than {100 - userStats.ranking.percentile}% of users</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-700/30">
                  <h4 className="text-blue-800 dark:text-blue-200 font-semibold mb-3">Performance Insights</h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
                    {userStats.ranking.position <= 10 ? (
                      "🏆 Outstanding performance! This user is among our top performers and significantly contributes to platform growth."
                    ) : userStats.ranking.position <= 50 ? (
                      "⭐ Excellent user engagement. This member shows consistent activity and good platform utilization."
                    ) : (
                      "📈 Growing user with potential. Encouraging more activity could improve their ranking and engagement."
                    )}
                  </p>
                  <div className="mt-4 flex items-center text-sm text-blue-600 dark:text-blue-400">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    <span className="font-medium">Admin Analytics: Track user progression patterns</span>
                  </div>
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