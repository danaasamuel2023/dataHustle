'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://datahustle.onrender.com'
const getHeaders = () => ({ 'x-auth-token': localStorage.getItem('authToken'), 'Content-Type': 'application/json' })

export default function SupportDashboard() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
    const interval = setInterval(fetchDashboard, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API}/api/support/dashboard`, { headers: getHeaders() })
      const data = await res.json()
      if (data.status === 'success') setStats(data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const card = dark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200 shadow-sm'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers?.toLocaleString() || '0', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: "Today's Orders", value: stats?.todayOrders || 0, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Failed Orders', value: stats?.todayFailedOrders || 0, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Pending Deposits', value: stats?.pendingDeposits || 0, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Pending Reports', value: stats?.pendingReports || 0, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: "Today's Revenue", value: `GH₵${(stats?.todayRevenue || 0).toFixed(2)}`, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Pending Withdrawals', value: stats?.pendingWithdrawals || 0, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ]

  return (
    <div>
      <h1 className={`text-2xl font-bold mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>Support Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {statCards.map((s, i) => (
          <div key={i} className={`${card} rounded-xl p-4`}>
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <span className={`text-2xl font-bold ${s.color}`}>{typeof s.value === 'number' ? s.value : ''}</span>
            </div>
            <p className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{s.value}</p>
            <p className={`text-xs mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Failed Orders */}
      {stats?.recentFailedOrders?.length > 0 && (
        <div className={`${card} rounded-xl p-5`}>
          <h2 className={`text-lg font-bold mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>Recent Failed Orders</h2>
          <div className="space-y-2">
            {stats.recentFailedOrders.map((order, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${dark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div>
                  <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>
                    {order.userId?.name || 'Unknown'} - {order.phoneNumber}
                  </p>
                  <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {order.network} {order.capacity}GB - GH₵{order.price}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 font-medium">Failed</span>
                  <p className={`text-xs mt-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {new Date(order.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
