'use client'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

const API = 'https://datahustle.onrender.com/api/support'

const actionColors = {
  DEPOSIT_CREDITED: 'text-green-400',
  WALLET_DEDUCTED: 'text-red-400',
  USER_DISABLED: 'text-red-400',
  USER_ENABLED: 'text-green-400',
  USER_APPROVED: 'text-green-400',
  USER_REJECTED: 'text-red-400',
  ROLE_CHANGED: 'text-yellow-400',
  BULK_REFUND: 'text-purple-400',
  ORDER_COMPLETED_MANUAL: 'text-blue-400',
  SMS_SENT: 'text-indigo-400',
  SUPPORT_RETRY_SUCCESS: 'text-green-400',
}

export default function AuditLogsPage() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [actionFilter, setActionFilter] = useState('')

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  const headers = { 'x-auth-token': token }

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 50 })
      if (actionFilter) params.set('action', actionFilter)
      const res = await fetch(`${API}/audit-logs?${params}`, { headers })
      const data = await res.json()
      if (data.status === 'success') {
        setLogs(data.data.logs || [])
        setTotal(data.data.total || 0)
        setPages(data.data.pages || 1)
      }
    } catch (e) {} finally { setLoading(false) }
  }

  useEffect(() => { fetchLogs() }, [page, actionFilter])

  const fmt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <div className="space-y-4">
      <div>
        <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Audit Logs</h1>
        <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{total} actions logged</p>
      </div>

      <div className="flex gap-2">
        <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
          className={`px-3 py-2 rounded-lg border text-sm ${dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
          <option value="">All Actions</option>
          <option value="DEPOSIT">Deposits</option>
          <option value="WALLET">Wallet</option>
          <option value="USER">User Management</option>
          <option value="REFUND">Refunds</option>
          <option value="ORDER">Orders</option>
          <option value="SMS">SMS</option>
          <option value="ROLE">Role Changes</option>
          <option value="RETRY">Retries</option>
        </select>
      </div>

      {loading ? (
        <div className={`text-center py-12 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Loading...</div>
      ) : logs.length === 0 ? (
        <div className={`text-center py-12 rounded-xl border ${dark ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-gray-200 text-gray-500'}`}>
          No audit logs found
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log._id} className={`p-3 rounded-lg border ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-mono font-bold ${actionColors[log.action] || (dark ? 'text-gray-300' : 'text-gray-700')}`}>
                      {log.action}
                    </span>
                    <span className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                      by {log.workerId?.name || log.workerName || 'Unknown'}
                    </span>
                  </div>
                  {/* Show key details from the action */}
                  <div className={`mt-1 text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {log.details?.targetName && <span>User: {log.details.targetName} </span>}
                    {log.details?.targetEmail && <span>({log.details.targetEmail}) </span>}
                    {log.details?.amount && <span>| Amount: GH₵{log.details.amount} </span>}
                    {log.details?.reason && <span>| Reason: {log.details.reason} </span>}
                    {log.details?.reference && <span>| Ref: {log.details.reference} </span>}
                    {log.details?.to && <span>| To: {log.details.to} </span>}
                    {log.details?.balanceBefore !== undefined && (
                      <span>| Balance: ₵{log.details.balanceBefore?.toFixed(2)} → ₵{log.details.balanceAfter?.toFixed(2)} </span>
                    )}
                  </div>
                </div>
                <span className={`text-xs whitespace-nowrap ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {fmt(log.createdAt)}
                </span>
              </div>
            </div>
          ))}
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
