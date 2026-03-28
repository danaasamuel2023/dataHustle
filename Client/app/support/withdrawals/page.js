'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://datahustle.onrender.com'
const getHeaders = () => ({ 'x-auth-token': localStorage.getItem('authToken'), 'Content-Type': 'application/json' })
const fmt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'

export default function Withdrawals() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const card = dark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200 shadow-sm'
  const input = dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'

  useEffect(() => { fetchWithdrawals() }, [page, status])

  const fetchWithdrawals = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/support/withdrawals?status=${status}&page=${page}`, { headers: getHeaders() })
      const data = await res.json()
      if (data.status === 'success') {
        setWithdrawals(data.data.withdrawals || [])
        setPages(data.data.pages || 1)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const statusColors = {
    completed: 'bg-green-500/20 text-green-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    processing: 'bg-blue-500/20 text-blue-400',
    queued: 'bg-purple-500/20 text-purple-400',
    polling: 'bg-cyan-500/20 text-cyan-400',
    failed: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-gray-500/20 text-gray-400'
  }

  return (
    <div>
      <h1 className={`text-2xl font-bold mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>Agent Withdrawals</h1>

      <div className={`${card} rounded-xl p-4 mb-6 flex flex-wrap gap-2`}>
        {['all', 'pending', 'processing', 'queued', 'completed', 'failed'].map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1) }} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
            status === s ? 'bg-blue-600 text-white' : dark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>{s}</button>
        ))}
      </div>

      <div className={`${card} rounded-xl overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" /></div>
        ) : withdrawals.length === 0 ? (
          <div className="p-8 text-center"><p className={dark ? 'text-gray-500' : 'text-gray-400'}>No withdrawals found</p></div>
        ) : (
          <div className="divide-y divide-gray-800">
            {withdrawals.map((w, i) => (
              <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>
                    {w.storeId?.storeName || 'Unknown Store'}
                  </p>
                  <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {w.storeId?.owner?.name} ({w.storeId?.owner?.phoneNumber})
                  </p>
                  <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {fmt(w.createdAt)} | To: {w.momoNumber || w.accountNumber || 'N/A'} | {w.provider || w.gateway || 'N/A'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>GH₵{(w.amount || 0).toFixed(2)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[w.status] || 'bg-gray-500/20 text-gray-400'}`}>{w.status}</span>
                </div>
              </div>
            ))}
            {pages > 1 && (
              <div className="p-4 flex items-center justify-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={`px-3 py-1 rounded-lg text-sm ${dark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'} disabled:opacity-50`}>Prev</button>
                <span className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{page} / {pages}</span>
                <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className={`px-3 py-1 rounded-lg text-sm ${dark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'} disabled:opacity-50`}>Next</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
