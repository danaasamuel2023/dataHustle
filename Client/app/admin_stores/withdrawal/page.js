'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

const API_BASE = 'https://datahustle.onrender.com/api/v1'

export default function AdminWithdrawals() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', search: '' })
  const [pagination, setPagination] = useState({ page: 1, limit: 30, total: 0 })
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [stuckWithdrawals, setStuckWithdrawals] = useState([])
  const [providerBalance, setProviderBalance] = useState(null)
  const [actionModal, setActionModal] = useState(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const darkMode = mounted && resolvedTheme === 'dark'

  useEffect(() => {
    fetchWithdrawals()
    fetchStuckWithdrawals()
    fetchProviderBalance()
  }, [pagination.page, filters.status])

  const apiCall = async (endpoint, method = 'GET', body = null) => {
    const token = localStorage.getItem('authToken')
    const config = {
      method,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    }
    if (body) config.body = JSON.stringify(body)
    const res = await fetch(`${API_BASE}/withdrawal${endpoint}`, config)
    return res.json()
  }

  const fetchWithdrawals = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status })
      })
      const data = await apiCall(`/admin/all?${params}`)
      if (data.status === 'success') {
        setWithdrawals(data.data.withdrawals || [])
        setPagination(prev => ({ ...prev, total: data.data.pagination?.total || 0 }))
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStuckWithdrawals = async () => {
    try {
      const data = await apiCall('/admin/stuck-withdrawals')
      if (data.status === 'success') {
        setStuckWithdrawals(data.data.stuckWithdrawals || [])
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchProviderBalance = async () => {
    try {
      const data = await apiCall('/admin/provider-balance')
      if (data.status === 'success') {
        setProviderBalance(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleAction = async (action, withdrawalId, extraData = {}) => {
    setActionLoading(true)
    try {
      let data
      switch (action) {
        case 'approve':
          data = await apiCall(`/admin/approve/${withdrawalId}`, 'POST')
          break
        case 'reject':
          data = await apiCall(`/admin/reject/${withdrawalId}`, 'POST', { reason: extraData.reason || 'Rejected by admin' })
          break
        case 'return':
          data = await apiCall(`/admin/return-to-balance/${withdrawalId}`, 'POST', { reason: extraData.reason || 'Returned by admin' })
          break
        case 'retry':
          data = await apiCall(`/admin/retry/${withdrawalId}`, 'POST', { preferredProvider: extraData.provider || 'moolre' })
          break
        case 'force-complete':
          data = await apiCall(`/admin/force-complete/${withdrawalId}`, 'POST')
          break
      }
      if (data?.status === 'success') {
        alert(`Action successful: ${action}`)
        fetchWithdrawals()
        fetchStuckWithdrawals()
        setActionModal(null)
        setSelectedWithdrawal(null)
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
  const formatDate = (date) => new Date(date).toLocaleString()

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
    pending: darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800',
    processing: darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800',
    queued: darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-800',
    polling: darkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-800',
    completed: darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800',
    rejected: darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800',
    failed: darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800',
    cancelled: darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Withdrawal Management
          </h1>
          <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Approve, reject, and manage agent withdrawals
          </p>
        </div>
        <button
          onClick={() => { fetchWithdrawals(); fetchStuckWithdrawals(); fetchProviderBalance() }}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${btnClass}`}
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pending</p>
          <p className={`text-2xl font-bold text-yellow-500`}>
            {withdrawals.filter(w => w.status === 'pending').length}
          </p>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Processing</p>
          <p className={`text-2xl font-bold text-blue-500`}>
            {withdrawals.filter(w => ['processing', 'queued', 'polling'].includes(w.status)).length}
          </p>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Stuck (24h+)</p>
          <p className={`text-2xl font-bold text-red-500`}>
            {stuckWithdrawals.length}
          </p>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Provider Balance</p>
          <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {providerBalance ? formatCurrency(providerBalance.moolre?.balance || providerBalance.paystack?.balance || 0) : '---'}
          </p>
        </div>
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
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="queued">Queued</option>
            <option value="polling">Polling</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="rejected">Rejected</option>
          </select>

          <input
            type="text"
            placeholder="Search by ID or store name..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className={`px-3 py-2 rounded-lg text-sm border flex-1 min-w-[200px] ${inputClass}`}
          />
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className={cardClass}>
        {loading ? (
          <div className="p-8 text-center">
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Loading withdrawals...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Store</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>MoMo</th>
                  <th className={`px-4 py-3 text-right text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Amount</th>
                  <th className={`px-4 py-3 text-right text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Net</th>
                  <th className={`px-4 py-3 text-center text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                  <th className={`px-4 py-3 text-center text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
                {withdrawals
                  .filter(w => !filters.search ||
                    w.withdrawalId?.toLowerCase().includes(filters.search.toLowerCase()) ||
                    w.storeId?.storeName?.toLowerCase().includes(filters.search.toLowerCase())
                  )
                  .map((wd) => (
                  <tr key={wd._id} className={darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}>
                    <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {formatDate(wd.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {wd.storeId?.storeName || 'N/A'}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {wd.withdrawalId}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {wd.paymentDetails?.momoNumber}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {wd.paymentDetails?.momoNetwork} - {wd.paymentDetails?.momoName}
                      </p>
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(wd.requestedAmount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-green-500">
                      {formatCurrency(wd.netAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[wd.status] || statusColors.pending}`}>
                        {wd.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedWithdrawal(wd)}
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
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Page {pagination.page} - {withdrawals.length} results
          </p>
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
              disabled={withdrawals.length < pagination.limit}
              className={`px-3 py-1.5 rounded text-sm disabled:opacity-50 ${btnClass}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Withdrawal Detail Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${cardClass} max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
            <div className={`sticky top-0 p-4 border-b ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Withdrawal Details
                </h2>
                <button
                  onClick={() => setSelectedWithdrawal(null)}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  X
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>ID</p>
                  <p className={`text-sm font-mono ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedWithdrawal.withdrawalId}</p>
                </div>
                <div>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Status</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[selectedWithdrawal.status]}`}>
                    {selectedWithdrawal.status}
                  </span>
                </div>
                <div>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Store</p>
                  <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedWithdrawal.storeId?.storeName}</p>
                </div>
                <div>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Date</p>
                  <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatDate(selectedWithdrawal.createdAt)}</p>
                </div>
              </div>

              {/* Amount */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Requested</p>
                    <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(selectedWithdrawal.requestedAmount)}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Fee</p>
                    <p className="text-lg font-bold text-red-500">{formatCurrency(selectedWithdrawal.fee)}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Net</p>
                    <p className="text-lg font-bold text-green-500">{formatCurrency(selectedWithdrawal.netAmount)}</p>
                  </div>
                </div>
              </div>

              {/* MoMo Details */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>PAYMENT DETAILS</p>
                <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedWithdrawal.paymentDetails?.momoName}</p>
                <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedWithdrawal.paymentDetails?.momoNumber}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{selectedWithdrawal.paymentDetails?.momoNetwork}</p>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>ACTIONS</p>

                {['pending', 'processing', 'queued', 'polling'].includes(selectedWithdrawal.status) && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAction('approve', selectedWithdrawal.withdrawalId)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : 'Approve & Send'}
                    </button>
                    <button
                      onClick={() => setActionModal({ type: 'reject', withdrawal: selectedWithdrawal })}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => setActionModal({ type: 'return', withdrawal: selectedWithdrawal })}
                      disabled={actionLoading}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${btnClass}`}
                    >
                      Return to Balance
                    </button>
                    <button
                      onClick={() => handleAction('force-complete', selectedWithdrawal.withdrawalId)}
                      disabled={actionLoading}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${btnClass}`}
                    >
                      Force Complete
                    </button>
                  </div>
                )}

                {selectedWithdrawal.status === 'failed' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAction('retry', selectedWithdrawal.withdrawalId, { provider: 'moolre' })}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Retry (Moolre)
                    </button>
                    <button
                      onClick={() => handleAction('retry', selectedWithdrawal.withdrawalId, { provider: 'paystack' })}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Retry (Paystack)
                    </button>
                    <button
                      onClick={() => setActionModal({ type: 'return', withdrawal: selectedWithdrawal })}
                      disabled={actionLoading}
                      className={`px-4 py-2 rounded-lg text-sm font-medium col-span-2 ${btnClass}`}
                    >
                      Return to Balance
                    </button>
                  </div>
                )}

                {selectedWithdrawal.status === 'completed' && (
                  <p className={`text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    This withdrawal has been completed
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal (Reject/Return) */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${cardClass} max-w-md w-full p-6`}>
            <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {actionModal.type === 'reject' ? 'Reject Withdrawal' : 'Return to Balance'}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              const reason = e.target.reason.value
              handleAction(actionModal.type === 'reject' ? 'reject' : 'return', actionModal.withdrawal.withdrawalId, { reason })
            }}>
              <div className="mb-4">
                <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Reason</label>
                <textarea
                  name="reason"
                  rows={3}
                  required
                  className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
                  placeholder="Enter reason..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    actionModal.type === 'reject'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-yellow-600 text-white hover:bg-yellow-700'
                  } disabled:opacity-50`}
                >
                  {actionLoading ? 'Processing...' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${btnClass}`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
