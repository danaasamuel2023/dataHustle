'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

const API_BASE = 'https://datahustle.onrender.com/api/v1'

export default function ManageStores() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', search: '' })
  const [pagination, setPagination] = useState({ page: 1, limit: 30 })
  const [selectedStore, setSelectedStore] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const darkMode = mounted && resolvedTheme === 'dark'

  useEffect(() => {
    fetchStores()
  }, [pagination.page, filters.status])

  const apiCall = async (endpoint, method = 'GET', body = null) => {
    const token = localStorage.getItem('authToken')
    const config = {
      method,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    }
    if (body) config.body = JSON.stringify(body)
    const res = await fetch(`${API_BASE}/admin/agent-stores${endpoint}`, config)
    return res.json()
  }

  const fetchStores = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status })
      })
      const data = await apiCall(`/stores?${params}`)
      if (data.status === 'success') {
        setStores(data.data.stores || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action, storeId) => {
    setActionLoading(true)
    try {
      let data
      switch (action) {
        case 'approve':
          data = await apiCall(`/stores/${storeId}/approve`, 'POST')
          break
        case 'suspend':
          data = await apiCall(`/stores/${storeId}/suspend`, 'POST')
          break
        case 'unsuspend':
          data = await apiCall(`/stores/${storeId}/unsuspend`, 'POST')
          break
        case 'close':
          data = await apiCall(`/stores/${storeId}/close`, 'POST')
          break
      }
      if (data?.status === 'success') {
        alert(`Action successful: ${action}`)
        fetchStores()
        setSelectedStore(null)
      } else {
        alert(data?.message || 'Action failed')
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const formatCurrency = (amount) => `GH₵${(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`
  const formatDate = (date) => new Date(date).toLocaleDateString()

  const cardClass = darkMode
    ? 'bg-gray-900 border border-gray-800 rounded-xl'
    : 'bg-white border border-gray-200 rounded-xl shadow-sm'

  const btnClass = darkMode
    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'

  const inputClass = darkMode
    ? 'bg-gray-800 border-gray-700 text-white'
    : 'bg-white border-gray-300 text-gray-900'

  const statusColors = {
    active: darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700',
    suspended: darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700',
    pending_approval: darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700',
    closed: darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Store Management
          </h1>
          <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Approve, suspend, and manage agent stores
          </p>
        </div>
        <button onClick={fetchStores} className={`px-4 py-2 rounded-lg text-sm font-medium ${btnClass}`}>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className={`${cardClass} p-4`}>
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.status}
            onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPagination(p => ({ ...p, page: 1 })) }}
            className={`px-3 py-2 rounded-lg text-sm border ${inputClass}`}
          >
            <option value="">All Status</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="closed">Closed</option>
          </select>

          <input
            type="text"
            placeholder="Search by name or slug..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className={`px-3 py-2 rounded-lg text-sm border flex-1 min-w-[200px] ${inputClass}`}
          />
        </div>
      </div>

      {/* Stores Table */}
      <div className={cardClass}>
        {loading ? (
          <div className="p-8 text-center">
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Loading stores...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Store</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Agent</th>
                  <th className={`px-4 py-3 text-right text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Balance</th>
                  <th className={`px-4 py-3 text-center text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Orders</th>
                  <th className={`px-4 py-3 text-center text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                  <th className={`px-4 py-3 text-center text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Created</th>
                  <th className={`px-4 py-3 text-center text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
                {stores
                  .filter(s => !filters.search ||
                    s.storeName?.toLowerCase().includes(filters.search.toLowerCase()) ||
                    s.storeSlug?.toLowerCase().includes(filters.search.toLowerCase())
                  )
                  .map((store) => (
                  <tr key={store._id} className={darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3">
                      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{store.storeName}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{store.storeSlug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{store.owner?.name || store.agentId?.name || 'N/A'}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{store.owner?.email || store.agentId?.email}</p>
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(store.wallet?.balance)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {store.metrics?.totalOrders || 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[store.status] || statusColors.pending_approval}`}>
                        {store.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatDate(store.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedStore(store)}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className={`px-4 py-3 flex items-center justify-between border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Page {pagination.page}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
              className={`px-3 py-1.5 rounded text-sm disabled:opacity-50 ${btnClass}`}
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={stores.length < pagination.limit}
              className={`px-3 py-1.5 rounded text-sm disabled:opacity-50 ${btnClass}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Store Detail Modal */}
      {selectedStore && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${cardClass} max-w-lg w-full`}>
            <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Manage Store</h2>
                <button onClick={() => setSelectedStore(null)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>X</button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedStore.storeName}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{selectedStore.storeSlug}</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Balance</p>
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(selectedStore.wallet?.balance)}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Status</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[selectedStore.status]}`}>{selectedStore.status}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>ACTIONS</p>

                {selectedStore.status === 'pending_approval' && (
                  <button
                    onClick={() => handleAction('approve', selectedStore._id)}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Approve Store'}
                  </button>
                )}

                {selectedStore.status === 'active' && (
                  <button
                    onClick={() => handleAction('suspend', selectedStore._id)}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Suspend Store'}
                  </button>
                )}

                {selectedStore.status === 'suspended' && (
                  <button
                    onClick={() => handleAction('unsuspend', selectedStore._id)}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Unsuspend Store'}
                  </button>
                )}

                {selectedStore.status !== 'closed' && (
                  <button
                    onClick={() => handleAction('close', selectedStore._id)}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Close Store'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
