'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.datahustle.shop'
const getHeaders = () => ({ 'x-auth-token': localStorage.getItem('authToken'), 'Content-Type': 'application/json' })
const fmt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'

export default function Deposits() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [days, setDays] = useState(7)

  const card = dark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200 shadow-sm'
  const input = dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'

  useEffect(() => { fetchDeposits() }, [page, status, days])

  const fetchDeposits = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/support/deposits?status=${status}&page=${page}&days=${days}`, { headers: getHeaders() })
      const data = await res.json()
      if (data.status === 'success') {
        setDeposits(data.data.deposits || [])
        setPages(data.data.pages || 1)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const statusColors = {
    completed: 'bg-green-500/20 text-green-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    failed: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-gray-500/20 text-gray-400'
  }

  return (
    <div>
      <h1 className={`text-2xl font-bold mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>Deposits</h1>

      <div className={`${card} rounded-xl p-4 mb-6 flex flex-wrap gap-3`}>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className={`px-4 py-2 rounded-lg border ${input}`}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <select value={days} onChange={(e) => { setDays(e.target.value); setPage(1) }} className={`px-4 py-2 rounded-lg border ${input}`}>
          <option value={1}>Today</option>
          <option value={3}>Last 3 days</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
        <button onClick={fetchDeposits} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">Refresh</button>
      </div>

      <div className={`${card} rounded-xl overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" /></div>
        ) : deposits.length === 0 ? (
          <div className="p-8 text-center"><p className={dark ? 'text-gray-500' : 'text-gray-400'}>No deposits found</p></div>
        ) : (
          <div className="divide-y divide-gray-800">
            {deposits.map((d, i) => (
              <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>
                    {d.userId?.name || 'Unknown'} <span className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>({d.userId?.phoneNumber})</span>
                  </p>
                  <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{fmt(d.createdAt)} | {d.gateway} | Ref: {d.reference}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-green-400`}>GH₵{d.amount?.toFixed(2)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[d.status] || 'bg-gray-500/20 text-gray-400'}`}>{d.status}</span>
                </div>
              </div>
            ))}
            {pages > 1 && (
              <div className={`p-4 flex items-center justify-center gap-2`}>
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
