'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.datahustle.shop'

const NETWORK_COLORS = {
  YELLO: 'bg-yellow-500 text-black',
  AT_PREMIUM: 'bg-purple-600 text-white',
  TELECEL: 'bg-red-600 text-white',
  at: 'bg-purple-500 text-white',
  airteltigo: 'bg-orange-500 text-white',
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  processing: 'bg-blue-100 text-blue-800 border-blue-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  failed: 'bg-red-100 text-red-800 border-red-300',
  refunded: 'bg-orange-100 text-orange-800 border-orange-300',
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-300',
}

function timeAgo(date) {
  if (!date) return '-'
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function StatCard({ label, value, sub, color = 'bg-white dark:bg-gray-800', textColor = 'text-gray-900 dark:text-white' }) {
  return (
    <div className={`${color} rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm`}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${textColor}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function ProcessorDashboard() {
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  const getHeaders = () => {
    const token = localStorage.getItem('authToken')
    return { 'x-auth-token': token, 'Content-Type': 'application/json' }
  }

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/admin/processor-dashboard`, { headers: getHeaders() })
      const json = await res.json()
      if (json.status === 'success') {
        setData(json.data)
        setError(null)
        setLastRefresh(new Date())
      } else {
        setError(json.message)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('userData') || '{}')
    if (user.role !== 'admin') {
      router.push('/')
      return
    }
    fetchDashboard()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchDashboard, 10000) // every 10s
    return () => clearInterval(interval)
  }, [autoRefresh, fetchDashboard])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading processor dashboard...</p>
        </div>
      </div>
    )
  }

  const w = data?.wallet || {}
  const g = data?.guest || {}
  const wAll = w.all || {}
  const wToday = w.today || {}
  const w1h = w.last1h || {}
  const gAll = g.all || {}
  const gToday = g.today || {}

  // Calculate totals
  const walletPending = (wAll.pending || 0)
  const walletProcessing = (wAll.processing || 0)
  const walletCompleted = (wAll.completed || 0)
  const walletFailed = (wAll.failed || 0)

  const guestPaidPending = (gAll.paid_pending || 0)
  const guestPaidProcessing = (gAll.paid_processing || 0)
  const guestPaidCompleted = (gAll.paid_completed || 0)
  const guestPaidFailed = (gAll.paid_failed || 0)
  const guestUnpaid = (gAll.pending_pending || 0)

  const totalPending = walletPending + guestPaidPending
  const totalProcessing = walletProcessing + guestPaidProcessing
  const totalStuck = (w.stuck?.length || 0) + (g.stuck?.length || 0)

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Processor</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Live view of order processing pipeline
              {lastRefresh && <span className="ml-2">- Updated {timeAgo(lastRefresh)}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                autoRefresh
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
              {autoRefresh ? 'Live' : 'Paused'}
            </button>
            <button
              onClick={fetchDashboard}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Pipeline Overview */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">Processing Pipeline</h2>
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex-1 min-w-[120px] text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-300 dark:border-yellow-700">
              <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{totalPending}</p>
              <p className="text-xs font-medium text-yellow-600 dark:text-yellow-500">Pending</p>
            </div>
            <div className="text-gray-300 dark:text-gray-600 text-2xl">→</div>
            <div className="flex-1 min-w-[120px] text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-300 dark:border-blue-700">
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{totalProcessing}</p>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-500">Processing</p>
            </div>
            <div className="text-gray-300 dark:text-gray-600 text-2xl">→</div>
            <div className="flex-1 min-w-[120px] text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-300 dark:border-green-700">
              <p className="text-3xl font-bold text-green-700 dark:text-green-400">{walletCompleted + guestPaidCompleted}</p>
              <p className="text-xs font-medium text-green-600 dark:text-green-500">Completed</p>
            </div>
            <div className="text-gray-300 dark:text-gray-600 text-xl ml-2">|</div>
            <div className="flex-1 min-w-[120px] text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-300 dark:border-red-700">
              <p className="text-3xl font-bold text-red-700 dark:text-red-400">{walletFailed + guestPaidFailed}</p>
              <p className="text-xs font-medium text-red-600 dark:text-red-500">Failed</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <StatCard label="Wallet Pending" value={walletPending} sub={`${w1h.pending || 0} last hour`} />
          <StatCard label="Wallet Processing" value={walletProcessing} sub={`${w1h.processing || 0} last hour`} />
          <StatCard label="Wallet Completed Today" value={wToday.completed || 0} sub={`${walletCompleted} all time`} />
          <StatCard label="Guest Paid Pending" value={guestPaidPending} sub="Waiting for processor" />
          <StatCard label="Guest Processing" value={guestPaidProcessing} sub="Sent to DataMart" />
          <StatCard label="Guest Unpaid" value={guestUnpaid} sub="Awaiting payment" />
        </div>

        {/* Stuck Orders Alert */}
        {totalStuck > 0 && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              <h2 className="text-sm font-bold text-red-800 dark:text-red-400 uppercase">
                {totalStuck} Stuck Orders (Pending {'>'}5 min)
              </h2>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mb-3">These orders have been pending for more than 5 minutes. DataMart may be rejecting them or the processor may have issues.</p>
            <div className="space-y-2">
              {(w.stuck || []).map((order, i) => (
                <div key={`w-${i}`} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded font-medium">WALLET</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${NETWORK_COLORS[order.network] || 'bg-gray-200'}`}>{order.network}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{order.capacity}GB</span>
                    <span className="text-gray-500">{order.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono">{order.geonetReference?.substring(0, 15)}...</span>
                    <span className="text-xs text-red-500 font-medium">{timeAgo(order.createdAt)}</span>
                  </div>
                </div>
              ))}
              {(g.stuck || []).map((order, i) => (
                <div key={`g-${i}`} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded font-medium">GUEST</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${NETWORK_COLORS[order.network] || 'bg-gray-200'}`}>{order.network}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{order.capacity}GB</span>
                    <span className="text-gray-500">{order.recipientPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono">{order.reference?.substring(0, 15)}...</span>
                    <span className="text-xs text-red-500 font-medium">{timeAgo(order.paidAt || order.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
          {['overview', 'wallet', 'guest', 'inventory'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Network Breakdown */}
        {(activeTab === 'overview' || activeTab === 'wallet') && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase">Pending by Network (Wallet)</h3>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(w.pendingByNetwork || {}).map(([net, count]) => (
                <div key={net} className={`px-4 py-2 rounded-lg ${NETWORK_COLORS[net] || 'bg-gray-200 text-gray-800'} font-medium text-sm`}>
                  {net}: {count}
                </div>
              ))}
              {Object.keys(w.pendingByNetwork || {}).length === 0 && (
                <p className="text-sm text-gray-400">No pending wallet orders</p>
              )}
            </div>
          </div>
        )}

        {(activeTab === 'overview' || activeTab === 'guest') && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase">Pending by Network (Guest)</h3>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(g.pendingByNetwork || {}).map(([net, count]) => (
                <div key={net} className={`px-4 py-2 rounded-lg ${NETWORK_COLORS[net] || 'bg-gray-200 text-gray-800'} font-medium text-sm`}>
                  {net}: {count}
                </div>
              ))}
              {Object.keys(g.pendingByNetwork || {}).length === 0 && (
                <p className="text-sm text-gray-400">No pending guest orders</p>
              )}
            </div>
          </div>
        )}

        {/* Recent Orders Table */}
        {(activeTab === 'overview' || activeTab === 'wallet') && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Wallet Orders</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 uppercase">
                    <th className="px-3 py-2 text-left">Phone</th>
                    <th className="px-3 py-2 text-left">Network</th>
                    <th className="px-3 py-2 text-left">Bundle</th>
                    <th className="px-3 py-2 text-left">Price</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Reference</th>
                    <th className="px-3 py-2 text-left">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {(w.recent || []).map((order, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-3 py-2 text-gray-900 dark:text-white font-medium">{order.phoneNumber}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${NETWORK_COLORS[order.network] || 'bg-gray-200'}`}>{order.network}</span>
                      </td>
                      <td className="px-3 py-2 text-gray-900 dark:text-white font-bold">{order.capacity}GB</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">GH₵{order.price?.toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>{order.status}</span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-400 font-mono">{order.geonetReference?.substring(0, 20)}</td>
                      <td className="px-3 py-2 text-xs text-gray-400">{timeAgo(order.createdAt)}</td>
                    </tr>
                  ))}
                  {(w.recent || []).length === 0 && (
                    <tr><td colSpan="7" className="px-3 py-6 text-center text-gray-400">No recent wallet orders</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(activeTab === 'overview' || activeTab === 'guest') && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Guest Orders</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 uppercase">
                    <th className="px-3 py-2 text-left">Phone</th>
                    <th className="px-3 py-2 text-left">Network</th>
                    <th className="px-3 py-2 text-left">Bundle</th>
                    <th className="px-3 py-2 text-left">Price</th>
                    <th className="px-3 py-2 text-left">Payment</th>
                    <th className="px-3 py-2 text-left">Order</th>
                    <th className="px-3 py-2 text-left">Reference</th>
                    <th className="px-3 py-2 text-left">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {(g.recent || []).map((order, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-3 py-2 text-gray-900 dark:text-white font-medium">{order.recipientPhone}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${NETWORK_COLORS[order.network] || 'bg-gray-200'}`}>{order.network}</span>
                      </td>
                      <td className="px-3 py-2 text-gray-900 dark:text-white font-bold">{order.capacity}GB</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">GH₵{order.price?.toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[order.paymentStatus] || 'bg-gray-100 text-gray-700'}`}>{order.paymentStatus}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-700'}`}>{order.orderStatus}</span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-400 font-mono">{order.reference?.substring(0, 18)}</td>
                      <td className="px-3 py-2 text-xs text-gray-400">{timeAgo(order.createdAt)}</td>
                    </tr>
                  ))}
                  {(g.recent || []).length === 0 && (
                    <tr><td colSpan="8" className="px-3 py-6 text-center text-gray-400">No guest orders yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Network Inventory Status</h3>
            </div>
            <div className="p-4 space-y-3">
              {(data?.inventory || []).map((inv, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded font-medium ${NETWORK_COLORS[inv.network] || 'bg-gray-200'}`}>{inv.network}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${inv.inStock ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{inv.inStock ? 'In Stock' : 'Out of Stock'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${inv.skipGeonettech ? 'bg-yellow-500' : 'bg-blue-500'}`}></span>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{inv.skipGeonettech ? 'Manual' : 'Auto (DataMart)'}</span>
                    </div>
                  </div>
                </div>
              ))}
              {(data?.inventory || []).length === 0 && (
                <p className="text-center text-gray-400 py-4">No inventory data</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
