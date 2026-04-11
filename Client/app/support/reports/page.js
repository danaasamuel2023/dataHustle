'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.datahustle.shop'
const getHeaders = () => ({ 'x-auth-token': localStorage.getItem('authToken'), 'Content-Type': 'application/json' })
const fmt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'

export default function Reports() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [selected, setSelected] = useState(null)
  const [notes, setNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  const card = dark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200 shadow-sm'
  const input = dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'

  useEffect(() => { fetchReports() }, [page, status])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/support/reports?status=${status}&page=${page}`, { headers: getHeaders() })
      const data = await res.json()
      if (data.status === 'success') {
        setReports(data.data.reports || [])
        setPages(data.data.pages || 1)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const updateReport = async (id, newStatus, resolution = null) => {
    setUpdating(true)
    try {
      const body = { status: newStatus, adminNotes: notes }
      if (resolution) body.resolution = resolution
      const res = await fetch(`${API}/api/support/reports/${id}`, {
        method: 'PUT', headers: getHeaders(), body: JSON.stringify(body)
      })
      const data = await res.json()
      if (data.status === 'success') {
        alert('Report updated')
        setSelected(null)
        setNotes('')
        fetchReports()
      } else { alert(data.message) }
    } catch (err) { alert(err.message) }
    finally { setUpdating(false) }
  }

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    investigating: 'bg-blue-500/20 text-blue-400',
    resolved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400'
  }

  return (
    <div>
      <h1 className={`text-2xl font-bold mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>Reports & Tickets</h1>

      <div className={`${card} rounded-xl p-4 mb-6 flex flex-wrap gap-3`}>
        {['pending', 'investigating', 'resolved', 'rejected', 'all'].map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1) }} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
            status === s
              ? 'bg-blue-600 text-white'
              : dark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>{s}</button>
        ))}
      </div>

      <div className={`${card} rounded-xl overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" /></div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center"><p className={dark ? 'text-gray-500' : 'text-gray-400'}>No reports found</p></div>
        ) : (
          <div className="divide-y divide-gray-800">
            {reports.map((r, i) => (
              <div key={i} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <p className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>
                      {r.userId?.name || 'Unknown'} <span className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>({r.userId?.phoneNumber})</span>
                    </p>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{fmt(r.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[r.status] || ''}`}>{r.status}</span>
                    {r.resolution && <span className={`text-xs px-2 py-0.5 rounded-full ${dark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{r.resolution}</span>}
                  </div>
                </div>
                <p className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{r.reason}</p>
                {r.purchaseId && (
                  <p className={`text-xs mt-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Order: {r.purchaseId.network} {r.purchaseId.capacity}GB - GH₵{r.purchaseId.price} ({r.purchaseId.status})
                  </p>
                )}
                {r.adminNotes && <p className={`text-xs mt-1 italic ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Notes: {r.adminNotes}</p>}

                {/* Actions */}
                {r.status !== 'resolved' && r.status !== 'rejected' && (
                  <div className="mt-3">
                    {selected === r._id ? (
                      <div className="space-y-2">
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes..." rows={2} className={`w-full px-3 py-2 rounded-lg border text-sm ${input}`} />
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => updateReport(r._id, 'investigating')} disabled={updating} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg font-medium disabled:opacity-50">Investigating</button>
                          <button onClick={() => updateReport(r._id, 'resolved', 'refund')} disabled={updating} className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg font-medium disabled:opacity-50">Resolve (Refund)</button>
                          <button onClick={() => updateReport(r._id, 'resolved', 'resend')} disabled={updating} className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg font-medium disabled:opacity-50">Resolve (Resend)</button>
                          <button onClick={() => updateReport(r._id, 'rejected')} disabled={updating} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg font-medium disabled:opacity-50">Reject</button>
                          <button onClick={() => { setSelected(null); setNotes('') }} className={`px-3 py-1.5 text-xs rounded-lg ${dark ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setSelected(r._id)} className={`text-xs font-medium ${dark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                        Take Action
                      </button>
                    )}
                  </div>
                )}
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
