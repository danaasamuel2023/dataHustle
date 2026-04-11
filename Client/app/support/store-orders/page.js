'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

const API = 'https://api.datahustle.shop/api/support'

const statusColors = {
  completed: 'bg-green-500/20 text-green-400',
  processing: 'bg-yellow-500/20 text-yellow-400',
  paid: 'bg-blue-500/20 text-blue-400',
  pending: 'bg-gray-500/20 text-gray-400',
  failed: 'bg-red-500/20 text-red-400',
  refunded: 'bg-purple-500/20 text-purple-400',
}

export default function StoreOrdersPage() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [status, setStatus] = useState('processing')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [retrying, setRetrying] = useState(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 20, status })
      if (search) params.set('search', search)

      const res = await fetch(`${API}/store-orders?${params}`, {
        headers: { 'x-auth-token': token }
      })
      const data = await res.json()

      if (data.status === 'success') {
        setOrders(data.data.orders || [])
        setTotal(data.data.total || 0)
        setPages(data.data.pages || 1)
      }
    } catch (err) {
      console.error('Failed to fetch store orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [page, status, search])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const handleRetry = async (transactionId) => {
    if (retrying) return
    if (!confirm(`Verify payment & retry delivery for ${transactionId}?`)) return

    setRetrying(transactionId)
    try {
      const res = await fetch(`${API}/store-orders/${transactionId}/verify-and-retry`, {
        method: 'POST',
        headers: { 'x-auth-token': token, 'Content-Type': 'application/json' }
      })
      const data = await res.json()

      if (data.status === 'success') {
        alert('Order fulfilled successfully!')
        fetchOrders()
      } else if (data.status === 'failed') {
        alert(data.message || 'Delivery failed. Try again shortly.')
      } else {
        alert(data.message || 'Could not process.')
      }
    } catch (err) {
      alert('Network error.')
    } finally {
      setRetrying(null)
    }
  }

  const fmt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Store Orders</h1>
        <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
          Verify payments and retry stuck store orders. {total} order{total !== 1 ? 's' : ''} found.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by transaction ID, phone, name..."
            className={`flex-1 px-4 py-2 rounded-lg border text-sm ${dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Search
          </button>
        </form>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className={`px-4 py-2 rounded-lg border text-sm ${dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
        >
          <option value="all">All Statuses</option>
          <option value="processing">Processing (Stuck)</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Orders */}
      {loading ? (
        <div className={`text-center py-12 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="w-8 h-8 mx-auto mb-3 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      ) : orders.length === 0 ? (
        <div className={`text-center py-12 rounded-xl border ${dark ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-gray-200 text-gray-500'}`}>
          No orders found
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o._id} className={`rounded-xl border overflow-hidden ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              {/* Header */}
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>
                      {o.network} {o.capacity}GB
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[o.orderStatus] || 'bg-gray-500/20 text-gray-400'}`}>
                      {o.orderStatus}
                    </span>
                  </div>
                  <p className={`text-xs font-mono mt-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{o.transactionId}</p>
                  <p className={`text-xs mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Store: {o.storeId?.storeName || 'Unknown'} | Agent: {o.storeId?.owner?.name || '—'} ({o.storeId?.owner?.phoneNumber || '—'})
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>GH₵{(o.sellingPrice || 0).toFixed(2)}</p>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{fmt(o.createdAt)}</p>
                  </div>

                  {(o.orderStatus === 'processing' || o.orderStatus === 'paid') && (
                    <button
                      onClick={() => handleRetry(o.transactionId)}
                      disabled={retrying === o.transactionId}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      {retrying === o.transactionId ? 'Retrying...' : 'Verify & Retry'}
                    </button>
                  )}
                </div>
              </div>

              {/* Details row */}
              <div className={`grid grid-cols-2 sm:grid-cols-5 gap-px border-t ${dark ? 'bg-gray-800 border-gray-800' : 'bg-gray-100 border-gray-100'}`}>
                <div className={`p-3 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
                  <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Recipient</p>
                  <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{o.recipientPhone || '—'}</p>
                </div>
                <div className={`p-3 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
                  <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Customer</p>
                  <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{o.customerPhone || o.customerName || '—'}</p>
                </div>
                <div className={`p-3 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
                  <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Base Price</p>
                  <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>GH₵{(o.basePrice || 0).toFixed(2)}</p>
                </div>
                <div className={`p-3 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
                  <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Agent Profit</p>
                  <p className="text-sm font-medium text-green-400">GH₵{(o.netProfit || 0).toFixed(2)}</p>
                </div>
                <div className={`p-3 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
                  <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Fulfillment</p>
                  <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{o.fulfillmentStatus || '—'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={`px-3 py-1.5 rounded-lg text-sm border disabled:opacity-50 ${dark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className={`px-3 py-1.5 rounded-lg text-sm border disabled:opacity-50 ${dark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
