'use client'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

const API = 'https://datahustle.onrender.com/api/support'

export default function PendingUsersPage() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [actionLoading, setActionLoading] = useState(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  const headers = { 'x-auth-token': token, 'Content-Type': 'application/json' }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/pending-users?page=${page}&limit=30`, { headers })
      const data = await res.json()
      if (data.status === 'success') {
        setUsers(data.data.users || [])
        setTotal(data.data.total || 0)
        setPages(data.data.pages || 1)
      }
    } catch (e) {} finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [page])

  const handleAction = async (userId, action) => {
    const reason = action === 'reject' ? prompt('Rejection reason:') : null
    if (action === 'reject' && reason === null) return

    setActionLoading(userId)
    try {
      await fetch(`${API}/users/${userId}/${action}`, {
        method: 'POST', headers, body: JSON.stringify({ reason })
      })
      fetchUsers()
    } catch (e) {}
    finally { setActionLoading(null) }
  }

  const fmt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  return (
    <div className="space-y-4">
      <div>
        <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Pending Users</h1>
        <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{total} users awaiting approval</p>
      </div>

      {loading ? (
        <div className={`text-center py-12 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Loading...</div>
      ) : users.length === 0 ? (
        <div className={`text-center py-12 rounded-xl border ${dark ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-gray-200 text-gray-500'}`}>
          No pending users
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u._id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div>
                <p className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{u.name}</p>
                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{u.email} | {u.phoneNumber}</p>
                <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Joined {fmt(u.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(u._id, 'approve')}
                  disabled={actionLoading === u._id}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white text-xs font-medium rounded-lg"
                >
                  {actionLoading === u._id ? '...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleAction(u._id, 'reject')}
                  disabled={actionLoading === u._id}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white text-xs font-medium rounded-lg"
                >
                  Reject
                </button>
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
