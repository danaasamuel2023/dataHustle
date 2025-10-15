"use client";

import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, ArrowUp, ArrowDown, Database, Users, Activity, RefreshCw, TrendingUp, Award, DollarSign, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Fetch dashboard data
const getDashboardData = async (date) => {
  try {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch(`https://datahustle.onrender.com/api/daily-summary?date=${date}`, {
      headers: {
        'x-auth-token': authToken
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData || userData.role !== 'admin') {
          throw new Error('unauthorized-redirect');
        }
      }
      throw new Error(`Failed to fetch dashboard data: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.user) {
      localStorage.setItem('userData', JSON.stringify({
        id: data.user._id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role
      }));
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

const DailyDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDepositor, setExpandedDepositor] = useState(null);
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const router = useRouter();
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDateTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-GH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      day: '2-digit',
      month: 'short'
    });
  };
  
  const refreshData = async () => {
    setRefreshing(true);
    try {
      const dashboardData = await getDashboardData(selectedDate);
      setData(dashboardData);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh data:', err);
      if (err.message === 'unauthorized-redirect') {
        router.push('/');
      } else {
        setError(err.message);
      }
    } finally {
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const dashboardData = await getDashboardData(selectedDate);
        setData(dashboardData);
        setError(null);
      } catch (err) {
        if (err.message === 'unauthorized-redirect') {
          router.push('/');
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedDate, router]);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  const STATUS_COLORS = {
    'completed': '#4ade80',
    'pending': '#f97316',
    'processing': '#3b82f6',
    'failed': '#ef4444',
    'waiting': '#a855f7',
    'delivered': '#14b8a6'
  };

  const getGatewayBadgeColor = (gateway) => {
    switch(gateway?.toLowerCase()) {
      case 'paystack':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'admin-deposit':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'wallet-refund':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };
  
  if (loading) return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 p-6 rounded-lg h-28"></div>
        ))}
      </div>
    </div>
  );
  
  if (error) return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h3 className="text-lg font-medium">Error loading dashboard data</h3>
        </div>
        <p className="mt-2 text-sm">{error}</p>
        <div className="mt-4">
          <button 
            onClick={refreshData}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </button>
        </div>
      </div>
    </div>
  );
  
  if (!data) return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-400 rounded-lg p-4">
        No data available. Please try another date.
      </div>
    </div>
  );
  
  const prepareCapacityBreakdown = () => {
    const capacityGroups = {};
    data.capacityDetails.forEach(item => {
      if (!capacityGroups[item.capacity]) {
        capacityGroups[item.capacity] = {
          capacity: `${item.capacity}GB`,
          count: 0
        };
      }
      capacityGroups[item.capacity].count += item.count;
    });
    
    return Object.values(capacityGroups).sort((a, b) => 
      parseInt(a.capacity) - parseInt(b.capacity)
    );
  };
  
  const capacityBreakdown = prepareCapacityBreakdown();
  
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Daily Business Summary</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            View your daily metrics, sales, and performance indicators
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-2">
            <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm focus:outline-none bg-transparent dark:text-white"
              aria-label="Select date"
            />
          </div>
          
          <button 
            onClick={refreshData} 
            disabled={refreshing}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg ${
              refreshing 
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-yellow-500 text-white hover:bg-yellow-600'
            } transition-colors duration-200 shadow-sm`}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 transition-all duration-200 hover:shadow-md">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Orders</h3>
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Activity className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{data.summary.totalOrders}</p>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{data.date}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 transition-all duration-200 hover:shadow-md">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Revenue</h3>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{formatCurrency(data.summary.totalRevenue)}</p>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{data.date}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 transition-all duration-200 hover:shadow-md">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Deposits</h3>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <ArrowDown className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{formatCurrency(data.summary.totalDeposits)}</p>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{data.date}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 transition-all duration-200 hover:shadow-md">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm text-gray-500 dark:text-gray-400 font-medium">Paystack</h3>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{formatCurrency(data.summary.paystackDeposits.amount)}</p>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{data.summary.paystackDeposits.count} deposits</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 transition-all duration-200 hover:shadow-md">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm text-gray-500 dark:text-gray-400 font-medium">Data Sold</h3>
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Database className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{data.summary.totalCapacityGB} <span className="text-sm font-normal">GB</span></p>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{data.date}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 transition-all duration-200 hover:shadow-md">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm text-gray-500 dark:text-gray-400 font-medium">Unique Customers</h3>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{data.summary.uniqueCustomers}</p>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{data.date}</div>
        </div>
      </div>
      
      {/* Top Performers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Depositors */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg mr-3">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Top 5 Depositors</h2>
          </div>
          <div className="space-y-3">
            {data.topDepositors && data.topDepositors.length > 0 ? (
              data.topDepositors.map((depositor, index) => (
                <div key={depositor.userId} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {/* Main Row */}
                  <div 
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => setExpandedDepositor(expandedDepositor === depositor.userId ? null : depositor.userId)}
                  >
                    <div className="flex items-center flex-1">
                      <div className="text-2xl mr-3">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && <span className="text-sm font-bold text-gray-500">{index + 1}</span>}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{depositor.userName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{depositor.userPhone}</div>
                      </div>
                    </div>
                    <div className="text-right mr-4">
                      <div className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(depositor.totalDeposited)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{depositor.depositCount} deposits</div>
                    </div>
                    {expandedDepositor === depositor.userId ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedDepositor === depositor.userId && depositor.deposits && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase">Deposit Transactions</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {depositor.deposits.map((deposit, idx) => (
                          <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getGatewayBadgeColor(deposit.gateway)}`}>
                                  {deposit.gateway}
                                </span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(deposit.amount)}</span>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(deposit.timestamp)}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{deposit.reference}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                No deposits today
              </div>
            )}
          </div>
        </div>
        
        {/* Top Customers by Orders */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mr-3">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Top 5 Customers by Orders</h2>
          </div>
          <div className="space-y-3">
            {data.topCustomersByOrders && data.topCustomersByOrders.length > 0 ? (
              data.topCustomersByOrders.map((customer, index) => (
                <div key={customer.userId} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {/* Main Row */}
                  <div 
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => setExpandedCustomer(expandedCustomer === customer.userId ? null : customer.userId)}
                  >
                    <div className="flex items-center flex-1">
                      <div className="text-2xl mr-3">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && <span className="text-sm font-bold text-gray-500">{index + 1}</span>}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{customer.userName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{customer.userPhone}</div>
                      </div>
                    </div>
                    <div className="text-right mr-4">
                      <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{customer.orderCount} orders</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(customer.totalSpent)}</div>
                    </div>
                    {expandedCustomer === customer.userId ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedCustomer === customer.userId && customer.orders && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase">Order History</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {customer.orders.map((order, idx) => (
                          <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{order.capacity}GB</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{order.network}</span>
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                  order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                  order.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(order.price)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{order.reference}</span>
                              <span>{formatDateTime(order.timestamp)}</span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              To: {order.phoneNumber}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                No orders today
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Network Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 transition-all duration-200 hover:shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Network Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider rounded-tl-lg">Network</th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data (GB)</th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider rounded-tr-lg">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.networkSummary.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{item.network}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">{item.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">{item.totalGB}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white text-right">{formatCurrency(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 transition-all duration-200 hover:shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Network Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.networkSummary}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="network"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {data.networkSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value} orders`, props.payload.network]} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Data Capacity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 transition-all duration-200 hover:shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Data Package Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capacityBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="capacity" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} orders`, 'Orders']}
                  labelFormatter={(value) => `Package Size: ${value}`}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: '1px solid #f0f0f0' }}
                />
                <Legend />
                <Bar dataKey="count" name="Number of Orders" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 transition-all duration-200 hover:shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Order Status Summary</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.statusSummary} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} orders`, 'Count']}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: '1px solid #f0f0f0' }}
                />
                <Legend />
                <Bar dataKey="count" name="Orders" radius={[4, 4, 0, 0]}>
                  {data.statusSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#82ca9d'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-8">
        <p>Data last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default DailyDashboard;