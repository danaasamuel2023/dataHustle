'use client'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

const API = 'https://api.datahustle.shop/api/support'
const statusColors = {
  completed: 'bg-green-500/20 text-green-400',
  processing: 'bg-yellow-500/20 text-yellow-400',
  pending: 'bg-blue-500/20 text-blue-400',
  failed: 'bg-red-500/20 text-red-400',
  refunded: 'bg-purple-500/20 text-purple-400',
}

export default function AllOrdersPage() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [status, setStatus] = useState('all')
  const [network, setNetwork] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [refunding, setRefunding] = useState(false)
  const [msg, setMsg] = useState('')

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  const headers = { 'x-auth-token': token, 'Content-Type': 'application/json' }

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 30, status })
      if (network) params.set('network', network)
      if (search) params.set('search', search)
      const res = await fetch(`${API}/all-orders?${params}`, { headers })
      const data = await res.json()
      if (data.status === 'success') {
        setOrders(data.data.orders || [])
        setTotal(data.data.total || 0)
        setPages(data.data.pages || 1)
      }
    } catch (e) {} finally { setLoading(false) }
  }

  useEffect(() => { fetchOrders() }, [page, status, network, search])

  const handleSearch = (e) => { e.preventDefault(); setPage(1); setSearch(searchInput) }

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleBulkRefund = async () => {
    if (!selectedIds.length || refunding) return
    if (!confirm(`Refund ${selectedIds.length} order(s)?`)) return
    setRefunding(true)
    try {
      const res = await fetch(`${API}/orders/bulk-refund`, {
        method: 'POST', headers, body: JSON.stringify({ orderIds: selectedIds })
      })
      const data = await res.json()
      setMsg(data.message || 'Done')
      setSelectedIds([])
      fetchOrders()
    } catch (e) { setMsg('Refund failed') }
    finally { setRefunding(false) }
  }

  const handleComplete = async (id) => {
    if (!confirm('Mark this order as completed?')) return
    await fetch(`${API}/orders/${id}/complete`, { method: 'POST', headers })
    fetchOrders()
  }

  const handleRefundOne = async (id) => {
    if (!confirm('Refund this order?')) return
    await fetch(`${API}/orders/bulk-refund`, {
      method: 'POST', headers, body: JSON.stringify({ orderIds: [id] })
    })
    fetchOrders()
  }

  const fmt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>All Orders</h1>
          <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{total} orders total</p>
        </div>
        {selectedIds.length > 0 && (
          <button onClick={handleBulkRefund} disabled={refunding}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white text-sm font-medium rounded-lg">
            {refunding ? 'Refunding...' : `Refund ${selectedIds.length} Selected`}
          </button>
        )}
      </div>

      {msg && <div className={`p-2 rounded-lg text-sm ${dark ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-600'}`}>{msg}</div>}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Phone, reference..."
            className={`flex-1 px-3 py-2 rounded-lg border text-sm ${dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`} />
          <button type="submit" className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm">Search</button>
        </form>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className={`px-3 py-2 rounded-lg border text-sm ${dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select value={network} onChange={(e) => { setNetwork(e.target.value); setPage(1) }}
          className={`px-3 py-2 rounded-lg border text-sm ${dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
          <option value="">All Networks</option>
          <option value="YELLO">MTN</option>
          <option value="TELECEL">Telecel</option>
          <option value="AT_PREMIUM">AirtelTigo</option>
        </select>
      </div>

      {/* Orders */}
      {loading ? (
        <div className={`text-center py-12 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Loading...</div>
      ) : (
        <div className={`rounded-xl border overflow-hidden ${dark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={dark ? 'bg-gray-800' : 'bg-gray-50'}>
                <tr>
                  <th className="p-3 text-left"><input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? orders.map(o => o._id) : [])} /></th>
                  <th className={`p-3 text-left font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>User</th>
                  <th className={`p-3 text-left font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Phone</th>
                  <th className={`p-3 text-left font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Bundle</th>
                  <th className={`p-3 text-left font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Price</th>
                  <th className={`p-3 text-left font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                  <th className={`p-3 text-left font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Date</th>
                  <th className={`p-3 text-left font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dark ? 'divide-gray-800' : 'divide-gray-100'}`}>
                {orders.map(o => (
                  <tr key={o._id} className={dark ? 'bg-gray-900' : 'bg-white'}>
                    <td className="p-3"><input type="checkbox" checked={selectedIds.includes(o._id)} onChange={() => toggleSelect(o._id)} /></td>
                    <td className={`p-3 ${dark ? 'text-white' : 'text-gray-900'}`}>{o.userId?.name || '—'}</td>
                    <td className={`p-3 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{o.phoneNumber}</td>
                    <td className={`p-3 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{o.network} {o.capacity}GB</td>
                    <td className={`p-3 font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>₵{(o.price || 0).toFixed(2)}</td>
                    <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[o.status] || 'bg-gray-500/20 text-gray-400'}`}>{o.status}</span></td>
                    <td className={`p-3 text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{fmt(o.createdAt)}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {(o.status === 'failed' || o.status === 'pending') && (
                          <button onClick={() => handleRefundOne(o._id)} className="px-2 py-1 text-xs bg-red-500/10 text-red-400 rounded">Refund</button>
                        )}
                        {(o.status === 'pending' || o.status === 'processing') && (
                          <button onClick={() => handleComplete(o._id)} className="px-2 py-1 text-xs bg-green-500/10 text-green-400 rounded">Complete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Page {page}/{pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className={`px-3 py-1.5 rounded-lg text-sm border disabled:opacity-50 ${dark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200'}`}>Prev</button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}
              className={`px-3 py-1.5 rounded-lg text-sm border disabled:opacity-50 ${dark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200'}`}>Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
