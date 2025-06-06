'use client'
import React, { useState, useEffect } from 'react';
import { CreditCard, Package, Database, DollarSign, TrendingUp, Calendar, AlertCircle, PlusCircle,X, User, BarChart2, ChevronDown, ChevronUp, Clock, Eye, Globe, Zap, Activity, Sparkles, ArrowUpRight, Star, Target, Flame, Award, Shield, Info, Timer, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AnimatedCounter, CurrencyCounter } from './Animation'; // Adjust the import path as necessary
import DailySalesChart from '@/app/week/page';

const DashboardPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState({
    balance: 0,
    todayOrders: 0,
    todayGbSold: 0,
    todayRevenue: 0,
    recentTransactions: []
  });
  
  // Add a state to control animation start
  const [animateStats, setAnimateStats] = useState(false);
  // Add state to control sales chart visibility
  const [showSalesChart, setShowSalesChart] = useState(false);
  // Add state for sales chart time period
  const [salesPeriod, setSalesPeriod] = useState('7d');
  // Add state for notice visibility
  const [showNotice, setShowNotice] = useState(true);

  const ViewAll = () => {
    router.push('/orders');
  };

  const navigateToTransactions = () => {
    router.push('/myorders');
  };

  const navigateToTopup = () => {
    router.push('/topup');
  };
  
  const navigateToregisterFriend = () => {
    router.push('/registerFriend');
  }
  
  const navigateToVerificationServices = () => {
    router.push('/verification-services');
  }

  const navigateToNetwork = (network) => {
    switch(network) {
      case 'mtn':
        router.push('/mtnup2u');
        break;
      case 'airteltigo':
        router.push('/at-ishare');
        break;
      case 'telecel':
        router.push('/TELECEL');
        break;
      default:
        router.push('/');
    }
  };

  useEffect(() => {
    // Check if user is authenticated
    // Fetch user data from localStorage
    const userDataString = localStorage.getItem('userData');
    if (!userDataString) {
      router.push('/SignUp');
      return;
    }

    const userData = JSON.parse(userDataString);
    setUserName(userData.name || 'User');
    fetchDashboardData(userData.id);
    
    // Check if user has dismissed the notice before
    const noticeDismissed = localStorage.getItem('dataDeliveryNoticeDismissed');
    if (noticeDismissed === 'true') {
      setShowNotice(false);
    }
  }, [router]);

  // Fetch dashboard data from API
  const fetchDashboardData = async (userId) => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('authToken');
      
      const response = await fetch(`https://datahustle.onrender.com/api/v1/data/user-dashboard/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const responseData = await response.json();
      
      if (responseData.status === 'success') {
        // Map API data to our stats state
        const { userBalance, todayOrders } = responseData.data;
        
        setStats({
          balance: userBalance,
          todayOrders: todayOrders.count,
          todayGbSold: todayOrders.totalGbSold,
          todayRevenue: todayOrders.totalValue,
          recentTransactions: todayOrders.orders.map(order => ({
            id: order._id,
            customer: order.phoneNumber,
            method: order.method,
            amount: order.price,
            gb: formatDataCapacity(order.capacity),
            time: new Date(order.createdAt).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }),
            network: order.network
          }))
        });
        
        // Set loading to false first
        setLoading(false);
        
        // Delay animation start slightly for better UX
        setTimeout(() => {
          setAnimateStats(true);
        }, 300);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // You might want to show an error message to the user
      setLoading(false);
    }
  };

  // Helper function to format data capacity (convert to GB if needed)
  const formatDataCapacity = (capacity) => {
    if (capacity >= 1000) {
      return (capacity / 1000).toFixed(1);
    }
    return capacity;
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Get greeting based on time of day - Ghana time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning'; 
    if (hour < 18) return 'Good afternoon'; 
    return 'Good evening'; 
  };

  // Get English greeting
  const getEnglishGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  // Toggle sales chart visibility
  const toggleSalesChart = () => {
    setShowSalesChart(!showSalesChart);
  };

  // Handle time period change for sales data
  const handleSalesPeriodChange = (period) => {
    setSalesPeriod(period);
  };

  // Dismiss notice handler
  const dismissNotice = () => {
    setShowNotice(false);
    localStorage.setItem('dataDeliveryNoticeDismissed', 'true');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          {/* Epic Loading Animation */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-3 border-emerald-200/20"></div>
            {/* Spinning gradient ring */}
            <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-emerald-400 border-r-teal-400 animate-spin"></div>
            {/* Inner pulsing circle */}
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 animate-pulse flex items-center justify-center">
              <Zap className="w-6 h-6 text-white animate-bounce" strokeWidth={2.5} />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-transparent bg-clip-text animate-pulse">
              DATAHUSTLE
            </h1>
            <div className="flex items-center justify-center space-x-2 text-emerald-300">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Loading your dashboard...</span>
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-400/5 to-teal-400/5 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-purple-400/5 to-pink-400/5 blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4">
        {/* Data Delivery Notice - Important Information */}
        {showNotice && (
          <div className="mb-6 animate-fadeInDown">
            <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 backdrop-blur-xl rounded-2xl p-4 border border-amber-500/30 relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-amber-500/5"></div>
              
              <div className="relative z-10">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 backdrop-blur-sm flex items-center justify-center border border-amber-500/30">
                      <Timer className="w-5 h-5 text-amber-300" strokeWidth={2.5} />
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                          <Info className="w-5 h-5 text-amber-300" />
                          <span>Important: Service Information</span>
                        </h3>
                        
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <p className="text-white/90 text-sm leading-relaxed">
                              Please note that <span className="font-semibold text-amber-300">data bundles are not delivered instantly</span>. 
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Timer className="w-5 h-5 text-amber-300" />
                                  <span className="text-sm font-semibold text-white">Delivery Time</span>
                                </div>
                                <p className="text-amber-300 text-lg font-bold">5 minutes - 4 hour</p>
                                <p className="text-white/70 text-xs mt-1">Depending on network conditions</p>
                              </div>
                              
                              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Clock className="w-5 h-5 text-emerald-300" />
                                  <span className="text-sm font-semibold text-white">Business Hours</span>
                                </div>
                                <p className="text-emerald-300 text-lg font-bold">8:00 AM - 9:00 PM</p>
                                <p className="text-white/70 text-xs mt-1">Orders placed outside hours will be processed next day</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={dismissNotice}
                        className="ml-4 text-white/60 hover:text-white transition-colors"
                        aria-label="Dismiss notice"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section - Compact Design */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-6 relative overflow-hidden shadow-xl">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-black/10">
              <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-4 lg:mb-0">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                      <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white">DATAHUSTLE</h1>
                      <p className="text-white/80 text-sm">Dashboard</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-white">
                      {getGreeting()}, {userName}!
                    </h2>
                    <p className="text-sm text-white/90">
                      Ready to start your hustle?
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons - Compact Layout */}
                <div className="flex space-x-3">
                  <button 
                    onClick={navigateToTopup}
                    className="group bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-medium py-3 px-4 rounded-xl border border-white/30 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span className="text-sm">Top Up</span>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/orders')}
                    className="group bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-medium py-3 px-4 rounded-xl border border-white/30 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                  >
                    <Package className="w-4 h-4" />
                    <span className="text-sm">Orders</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Compact Design */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Balance Card - Featured */}
            <div className="lg:col-span-2 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-3 right-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">Account Balance</p>
                    <p className="text-white text-xs">Available funds</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-white">
                    {animateStats ? 
                      <CurrencyCounter value={stats.balance} duration={1500} /> : 
                      formatCurrency(0)
                    }
                  </div>
                  <button
                    onClick={navigateToTopup}
                    className="inline-flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium py-2 px-4 rounded-lg border border-white/30 transition-all duration-300 transform hover:scale-105"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span className="text-sm">Add Funds</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Orders Today */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 relative overflow-hidden">
              <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-400/20 blur-xl"></div>
              
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <Package className="w-4 h-4 text-white" strokeWidth={2} />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {animateStats ? 
                        <AnimatedCounter value={stats.todayOrders} duration={1200} /> : 
                        "0"
                      }
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-white font-medium text-sm">Orders Today</p>
                  <p className="text-white/70 text-xs">Active transactions</p>
                </div>
              </div>
            </div>

            {/* Revenue Today */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 relative overflow-hidden">
              <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-xl"></div>
              
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" strokeWidth={2} />
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">
                      {animateStats ? 
                        <CurrencyCounter value={stats.todayRevenue} duration={1500} /> : 
                        formatCurrency(0)
                      }
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-white font-medium text-sm">Revenue Today</p>
                  <p className="text-white/70 text-xs">Total earnings</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Network Selection - Compact Grid */}
        <div className="mb-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Quick Order</h2>
                <p className="text-white/70 text-xs">Choose your network</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {/* MTN */}
              <button 
                onClick={() => navigateToNetwork('mtn')}
                className="group bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 rounded-xl p-4 transition-all duration-300 transform hover:scale-105 shadow-lg relative overflow-hidden"
              >
                <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-white/20 blur-lg"></div>
                <div className="relative z-10 text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-sm font-bold text-white">MTN</span>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">MTN Data</p>
                    <p className="text-white/80 text-xs">Fast network</p>
                  </div>
                </div>
              </button>

              {/* AirtelTigo */}
              <button 
                onClick={() => navigateToNetwork('airteltigo')}
                className="group bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 rounded-xl p-4 transition-all duration-300 transform hover:scale-105 shadow-lg relative overflow-hidden"
              >
                <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-white/20 blur-lg"></div>
                <div className="relative z-10 text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-xs font-bold text-white">ATigo</span>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">AirtelTigo</p>
                    <p className="text-white/80 text-xs">Reliable</p>
                  </div>
                </div>
              </button>

              {/* Telecel */}
              <button 
                onClick={() => navigateToNetwork('telecel')}
                className="group bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 rounded-xl p-4 transition-all duration-300 transform hover:scale-105 shadow-lg relative overflow-hidden"
              >
                <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-white/20 blur-lg"></div>
                <div className="relative z-10 text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-sm font-bold text-white">TEL</span>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Telecel</p>
                    <p className="text-white/80 text-xs">Growing</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity - Compact Table */}
        <div className="mb-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Recent Activity</h2>
                    <p className="text-white/70 text-xs">Latest transactions</p>
                  </div>
                </div>
                
                <button 
                  onClick={ViewAll}
                  className="group flex items-center space-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-medium py-2 px-4 rounded-lg border border-white/20 transition-all duration-300 transform hover:scale-105"
                >
                  <span className="text-sm">View All</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {stats.recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentTransactions.slice(0, 5).map((transaction, index) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                          <Database className="w-4 h-4 text-white" strokeWidth={2} />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{transaction.customer}</p>
                          <p className="text-white/70 text-xs">{transaction.gb}GB • {transaction.method}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-white font-medium text-sm">{formatCurrency(transaction.amount)}</p>
                        <p className="text-white/70 text-xs">{transaction.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-white/10 flex items-center justify-center mb-3">
                    <Database className="w-5 h-5 text-white/50" />
                  </div>
                  <p className="text-white/70 text-sm font-medium">No transactions yet</p>
                  <p className="text-white/50 text-xs">Start your hustle journey!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions - Compact Grid */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { icon: Package, label: 'New Order', path: '/datamart', color: 'from-emerald-400 to-teal-500' },
            { icon: BarChart2, label: 'Analytics', path: '/reports', color: 'from-blue-400 to-indigo-500' },
            { icon: Clock, label: 'History', path: '/orders', color: 'from-purple-400 to-pink-500' },
            { icon: CreditCard, label: 'Top Up', onClick: navigateToTopup, color: 'from-yellow-400 to-orange-500' },
            { icon: AlertCircle, label: 'Support', path: '/support', color: 'from-red-400 to-red-500' },
            { icon: User, label: 'Profile', path: '/profile', color: 'from-gray-400 to-gray-500' }
          ].map((action, index) => (
            <button
              key={index}
              onClick={action.onClick || (() => router.push(action.path))}
              className={`group bg-gradient-to-br ${action.color} hover:scale-105 rounded-xl p-4 transition-all duration-300 transform shadow-lg relative overflow-hidden`}
            >
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-white/20 blur-md"></div>
              <div className="relative z-10 text-center space-y-1">
                <action.icon className="w-5 h-5 text-white mx-auto group-hover:scale-110 transition-transform" strokeWidth={2} />
                <p className="text-white font-medium text-xs">{action.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Add fadeInDown animation */}
      <style jsx>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInDown {
          animation: fadeInDown 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;