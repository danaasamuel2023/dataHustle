'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://datahustle.onrender.com'
const getHeaders = () => ({ 'x-auth-token': localStorage.getItem('authToken'), 'Content-Type': 'application/json' })
const fmt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'

export default function FailedOrders() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [network, setNetwork] = useState('')
  const [days, setDays] = useState(7)

  const card = dark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200 shadow-sm'
  const input = dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'

  useEffect(() => { fetchOrders() }, [page, network, days])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = `page=${page}&limit=30&days=${days}${network ? `&network=${network}` : ''}`
      const res = await fetch(`${API}/api/support/failed-orders?${params}`, { headers: getHeaders() })
      const data = await res.json()
      if (data.status === 'success') {
        setOrders(data.data.orders || [])
        setPages(data.data.pages || 1)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const refund = async (orderId) => {
    if (!confirm('Refund this order?')) return
    try {
      const res = await fetch(`${API}/api/support/order/${orderId}/refund`, { method: 'POST', headers: getHeaders() })
      const data = await res.json()
      alert(data.message || 'Done')
      if (data.status === 'success') fetchOrders()
    } catch (err) { alert(err.message) }
  }

  return (
    <div>
      <h1 className={`text-2xl font-bold mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>Failed Orders</h1>

      {/* Filters */}
      <div className={`${card} rounded-xl p-4 mb-6 flex flex-wrap gap-3`}>
        <select value={network} onChange={(e) => { setNetwork(e.target.value); setPage(1) }} className={`px-4 py-2 rounded-lg border ${input}`}>
          <option value="">All Networks</option>
          <option value="YELLO">YELLO (MTN)</option>
          <option value="TELECEL">TELECEL</option>
          <option value="AT_PREMIUM">AT Premium</option>
          <option value="airteltigo">AirtelTigo</option>
        </select>
        <select value={days} onChange={(e) => { setDays(e.target.value); setPage(1) }} className={`px-4 py-2 rounded-lg border ${input}`}>
          <option value={1}>Today</option>
          <option value={3}>Last 3 days</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
        <button onClick={fetchOrders} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">Refresh</button>
      </div>

      {/* Orders List */}
      <div className={`${card} rounded-xl overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" /></div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center"><p className={dark ? 'text-gray-500' : 'text-gray-400'}>No failed orders found</p></div>
        ) : (
          <>
            {/* Mobile cards / Desktop table */}
            <div className="divide-y divide-gray-800">
              {orders.map((o, i) => (
                <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>
                      {o.userId?.name || 'Unknown'} <span className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>({o.userId?.phoneNumber})</span>
                    </p>
                    <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {o.network} {o.capacity}GB to {o.phoneNumber}
                    </p>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{fmt(o.createdAt)} | {o.gateway} | Ref: {o.geonetReference}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>GH₵{o.price}</span>
                    {o.gateway === 'wallet' && o.status !== 'refunded' && (
                      <button onClick={() => refund(o._id)} className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded-lg font-bold">
                        Refund
                      </button>
                    )}
                    {o.status === 'refunded' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 font-medium">Refunded</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className={`p-4 flex items-center justify-center gap-2 border-t ${dark ? 'border-gray-800' : 'border-gray-200'}`}>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={`px-3 py-1 rounded-lg text-sm ${dark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'} disabled:opacity-50`}>Prev</button>
                <span className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{page} / {pages}</span>
                <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className={`px-3 py-1 rounded-lg text-sm ${dark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'} disabled:opacity-50`}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
