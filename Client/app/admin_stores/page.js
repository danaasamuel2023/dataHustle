'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'

const API_BASE = 'https://datahustle.onrender.com/api/v1'

export default function AdminStoresDashboard() {
  const { resolvedTheme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [topEarners, setTopEarners] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const darkMode = mounted && resolvedTheme === 'dark'

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

      const [summaryRes, topRes, activityRes] = await Promise.all([
        fetch(`${API_BASE}/admin/agent-stores/investigation/summary`, { headers }),
        fetch(`${API_BASE}/admin/agent-stores/agents/top-earners?limit=5&period=today`, { headers }),
        fetch(`${API_BASE}/admin/agent-stores/agents/recent-activity?limit=10`, { headers })
      ])

      const [summaryData, topData, activityData] = await Promise.all([
        summaryRes.json(),
        topRes.json(),
        activityRes.json()
      ])

      if (summaryData.status === 'success') setSummary(summaryData.data)
      if (topData.status === 'success') setTopEarners(topData.data.topEarners || [])
      if (activityData.status === 'success') setRecentActivity(activityData.data.activities || [])
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => `GH₵${(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading dashboard...</div>
      </div>
    )
  }

  const cardClass = darkMode
    ? 'bg-gray-900 border border-gray-800 rounded-xl p-6'
    : 'bg-white border border-gray-200 rounded-xl p-6 shadow-sm'

  const statCardClass = darkMode
    ? 'bg-gray-800 rounded-xl p-5'
    : 'bg-gray-50 rounded-xl p-5'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Store Admin Dashboard
          </h1>
          <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Overview of agent stores and transactions
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            darkMode
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={statCardClass}>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Today's Transactions</p>
          <p className={`text-3xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {summary?.today?.transactions?.count || 0}
          </p>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {formatCurrency(summary?.today?.transactions?.totalAmount)}
          </p>
        </div>

        <div className={statCardClass}>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Today's Profit</p>
          <p className={`text-3xl font-bold mt-2 text-green-500`}>
            {formatCurrency(summary?.today?.transactions?.totalProfit)}
          </p>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Agent earnings
          </p>
        </div>

        <div className={statCardClass}>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pending Withdrawals</p>
          <p className={`text-3xl font-bold mt-2 text-yellow-500`}>
            {summary?.pending?.withdrawals?.count || 0}
          </p>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {formatCurrency(summary?.pending?.withdrawals?.totalAmount)}
          </p>
        </div>

        <div className={statCardClass}>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Active Stores</p>
          <p className={`text-3xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {summary?.stores?.total || 0}
          </p>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Total balance: {formatCurrency(summary?.stores?.totalBalance)}
          </p>
        </div>
      </div>

      {/* Store Status */}
      <div className={cardClass}>
        <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Store Status Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summary?.stores?.byStatus?.map((status) => (
            <div key={status._id} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <p className={`text-sm capitalize ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {status._id || 'Unknown'}
              </p>
              <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {status.count}
              </p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Balance: {formatCurrency(status.totalBalance)}
              </p>
            </div>
          )) || (
            <div className={`col-span-4 text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              No store data available
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Earners Today */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Top Earners Today
            </h2>
            <Link
              href="/admin_stores/agents"
              className={`text-sm ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}
            >
              View All
            </Link>
          </div>

          {topEarners.length === 0 ? (
            <p className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              No transactions today
            </p>
          ) : (
            <div className="space-y-3">
              {topEarners.map((agent, index) => (
                <div
                  key={agent.storeId}
                  className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {agent.rank}
                    </span>
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {agent.storeName}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {agent.orderCount} orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-500">
                      {formatCurrency(agent.totalProfit)}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      profit
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Recent Activity
            </h2>
            <Link
              href="/admin_stores/investigation"
              className={`text-sm ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}
            >
              View All
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <p className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              No recent activity
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
                >
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {activity.storeName || 'Unknown Store'}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {activity.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      activity.type === 'transaction'
                        ? darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                        : activity.status === 'completed'
                          ? darkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-700'
                          : darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {activity.type === 'transaction' ? 'Sale' : activity.status}
                    </span>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {formatCurrency(activity.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className={cardClass}>
        <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/admin_stores/agents"
            className={`p-4 rounded-lg text-center transition-colors ${
              darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>View All Agents</p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Balances & Details</p>
          </Link>
          <Link
            href="/admin_stores/withdrawal"
            className={`p-4 rounded-lg text-center transition-colors ${
              darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Manage Withdrawals</p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Approve & Process</p>
          </Link>
          <Link
            href="/admin_stores/investigation"
            className={`p-4 rounded-lg text-center transition-colors ${
              darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Investigation</p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Suspicious Activity</p>
          </Link>
          <Link
            href="/admin_stores/manage"
            className={`p-4 rounded-lg text-center transition-colors ${
              darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Store Management</p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Approve & Suspend</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
