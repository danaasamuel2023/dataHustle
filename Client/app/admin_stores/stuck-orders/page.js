'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

const API_BASE = 'https://datahustle.onrender.com/api/v1'

export default function StuckOrdersPage() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState({}) // { transactionId: true/false }
  const [retryingAll, setRetryingAll] = useState(false)
  const [results, setResults] = useState({}) // { transactionId: { status, message } }

  useEffect(() => { setMounted(true) }, [])
  const dark = mounted && resolvedTheme === 'dark'

  const getHeaders = () => ({
    'x-auth-token': localStorage.getItem('authToken'),
    'Content-Type': 'application/json'
  })

  useEffect(() => {
    fetchStuckOrders()
  }, [])

  const fetchStuckOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/agent-stores/orders/stuck-processing?limit=100`, {
        headers: getHeaders()
      })
      const data = await res.json()
      if (data.status === 'success') {
        setOrders(data.orders || [])
      }
    } catch (err) {
      console.error('Error fetching stuck orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const retrySingle = async (transactionId) => {
    setRetrying(prev => ({ ...prev, [transactionId]: true }))
    setResults(prev => ({ ...prev, [transactionId]: null }))
    try {
      const res = await fetch(`${API_BASE}/admin/agent-stores/orders/retry/${transactionId}`, {
        method: 'POST',
        headers: getHeaders()
      })
      const data = await res.json()
      setResults(prev => ({
        ...prev,
        [transactionId]: {
          status: data.status,
          message: data.message,
          datamartResponse: data.data?.datamartResponse
        }
      }))
      // Refresh list after short delay
      setTimeout(fetchStuckOrders, 1500)
    } catch (err) {
      setResults(prev => ({
        ...prev,
        [transactionId]: { status: 'error', message: err.message }
      }))
    } finally {
      setRetrying(prev => ({ ...prev, [transactionId]: false }))
    }
  }

  const retryAll = async () => {
    setRetryingAll(true)
    setResults({})
    try {
      const res = await fetch(`${API_BASE}/admin/agent-stores/orders/retry-all-stuck`, {
        method: 'POST',
        headers: getHeaders()
      })
      const data = await res.json()
      if (data.results) {
        const newResults = {}
        data.results.forEach(r => {
          newResults[r.transactionId] = {
            status: r.status,
            message: r.status === 'completed' ? 'Delivered!' : r.status === 'failed' ? 'DataMart failed' : r.error || r.reason,
            datamartResponse: r.datamartResponse
          }
        })
        setResults(newResults)
      }
      // Refresh list
      setTimeout(fetchStuckOrders, 2000)
    } catch (err) {
      console.error('Retry all error:', err)
    } finally {
      setRetryingAll(false)
    }
  }

  const formatDate = (d) => {
    if (!d) return '-'
    return new Date(d).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className={`animate-spin w-8 h-8 border-4 rounded-full ${dark ? 'border-gray-700 border-t-indigo-400' : 'border-gray-200 border-t-indigo-500'}`} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>
            Stuck Orders
          </h1>
          <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
            {orders.length} order{orders.length !== 1 ? 's' : ''} stuck on processing
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchStuckOrders}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Refresh
          </button>
          {orders.length > 0 && (
            <button
              onClick={retryAll}
              disabled={retryingAll}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                retryingAll
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {retryingAll ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Retrying All...
                </span>
              ) : (
                `Retry All (${orders.length})`
              )}
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {orders.length === 0 && (
        <div className={`text-center py-16 rounded-xl border ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="text-4xl mb-3">✅</div>
          <p className={`text-lg font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>No stuck orders</p>
          <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>All orders are processing normally</p>
        </div>
      )}

      {/* Orders list */}
      {orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => {
            const result = results[order.transactionId]
            const isRetrying = retrying[order.transactionId]

            return (
              <div
                key={order.transactionId}
                className={`rounded-xl border p-4 ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
              >
                {/* Top row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>
                        {order.network} {order.capacity}GB
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 ${dark ? 'bg-amber-900/30 text-amber-400' : ''}`}>
                        processing
                      </span>
                      <span className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <div className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {order.recipientPhone} &middot; GH₵{order.sellingPrice?.toFixed(2)} &middot; Profit: GH₵{order.netProfit?.toFixed(2)}
                    </div>
                    <div className={`text-xs mt-1 font-mono ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {order.transactionId}
                    </div>
                  </div>

                  <button
                    onClick={() => retrySingle(order.transactionId)}
                    disabled={isRetrying || retryingAll}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      isRetrying || retryingAll
                        ? dark ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isRetrying ? 'Retrying...' : 'Retry'}
                  </button>
                </div>

                {/* Fulfillment response */}
                {order.fulfillmentResponse && (
                  <div className={`mt-3 p-3 rounded-lg text-xs font-mono ${dark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-600'}`}>
                    <p className={`text-xs font-sans font-medium mb-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Last DataMart Response:</p>
                    {JSON.stringify(order.fulfillmentResponse, null, 2)}
                  </div>
                )}

                {/* Retry result */}
                {result && (
                  <div className={`mt-3 p-3 rounded-lg text-sm ${
                    result.status === 'success' || result.status === 'completed'
                      ? dark ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : dark ? 'bg-red-900/20 text-red-400 border border-red-800' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <p className="font-medium">
                      {result.status === 'success' || result.status === 'completed' ? '✅ ' : '❌ '}
                      {result.message}
                    </p>
                    {result.datamartResponse && (
                      <pre className="mt-2 text-xs font-mono opacity-75 whitespace-pre-wrap">
                        {JSON.stringify(result.datamartResponse, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
