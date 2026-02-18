'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

const API_BASE = 'https://datahustle.onrender.com/api/v1'

export default function AuditLogsPage() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 })
  const [filters, setFilters] = useState({
    operation: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const darkMode = mounted && resolvedTheme === 'dark'

  useEffect(() => {
    fetchLogs()
  }, [pagination.page, filters])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.operation && { operation: filters.operation }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      })

      const res = await fetch(`${API_BASE}/admin/agent-stores/audit/all?${params}`, {
        headers: { 'x-auth-token': token }
      })
      const data = await res.json()

      if (data.status === 'success') {
        setLogs(data.data.logs || [])
        setPagination(prev => ({ ...prev, total: data.data.pagination?.total || 0 }))
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => `GH₵${(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`
  const formatDate = (date) => new Date(date).toLocaleString()

  const cardClass = darkMode
    ? 'bg-gray-900 border border-gray-800 rounded-xl'
    : 'bg-white border border-gray-200 rounded-xl shadow-sm'

  const inputClass = darkMode
    ? 'bg-gray-800 border-gray-700 text-white'
    : 'bg-white border-gray-300 text-gray-900'

  const btnClass = darkMode
    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'

  const operationColors = {
    credit: darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700',
    debit: darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700',
    admin_credit: darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700',
    admin_debit: darkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-700',
    withdrawal_hold: darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700',
    withdrawal_complete: darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700',
    correction: darkMode ? 'bg-pink-900/30 text-pink-400' : 'bg-pink-100 text-pink-700'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Audit Logs</h1>
          <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>View all wallet audit logs across stores</p>
        </div>
        <button onClick={fetchLogs} className={`px-4 py-2 rounded-lg text-sm font-medium ${btnClass}`}>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className={`${cardClass} p-4`}>
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.operation}
            onChange={(e) => { setFilters({ ...filters, operation: e.target.value }); setPagination(p => ({ ...p, page: 1 })) }}
            className={`px-3 py-2 rounded-lg text-sm border ${inputClass}`}
          >
            <option value="">All Operations</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
            <option value="admin_credit">Admin Credit</option>
            <option value="admin_debit">Admin Debit</option>
            <option value="withdrawal_hold">Withdrawal Hold</option>
            <option value="withdrawal_complete">Withdrawal Complete</option>
            <option value="correction">Correction</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className={`px-3 py-2 rounded-lg text-sm border ${inputClass}`}
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className={`px-3 py-2 rounded-lg text-sm border ${inputClass}`}
          />

          <button
            onClick={() => { setFilters({ operation: '', startDate: '', endDate: '' }); setPagination(p => ({ ...p, page: 1 })) }}
            className={`px-3 py-2 rounded-lg text-sm ${btnClass}`}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className={cardClass}>
        {loading ? (
          <div className="p-8 text-center">
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Loading logs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Store</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Operation</th>
                  <th className={`px-4 py-3 text-right text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Amount</th>
                  <th className={`px-4 py-3 text-right text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Balance After</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Description</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
                {logs.map((log) => (
                  <tr key={log._id} className={darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}>
                    <td className={`px-4 py-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{log.storeId?.storeName || 'Unknown'}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{log.storeId?.storeSlug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${operationColors[log.operation] || operationColors.credit}`}>
                        {log.operation?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${log.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {log.amount >= 0 ? '+' : ''}{formatCurrency(log.amount)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(log.balanceAfter)}
                    </td>
                    <td className={`px-4 py-3 text-xs max-w-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {log.description}
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
            Page {pagination.page} - {logs.length} results
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
              disabled={logs.length < pagination.limit}
              className={`px-3 py-1.5 rounded text-sm disabled:opacity-50 ${btnClass}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
