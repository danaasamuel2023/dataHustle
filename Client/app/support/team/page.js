'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://datahustle.onrender.com'
const getHeaders = () => ({ 'x-auth-token': localStorage.getItem('authToken'), 'Content-Type': 'application/json' })
const fmt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'

export default function TeamRoles() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  const [userData] = useState(() => JSON.parse(localStorage.getItem('userData') || '{}'))
  const isAdmin = userData.role === 'admin'

  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)

  // Add worker
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [changingRole, setChangingRole] = useState(null)

  const card = dark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200 shadow-sm'
  const input = dark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'

  useEffect(() => {
    if (isAdmin) fetchWorkers()
    else setLoading(false)
  }, [])

  const fetchWorkers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/support/workers`, { headers: getHeaders() })
      const data = await res.json()
      if (data.status === 'success') setWorkers(data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const searchUsers = async () => {
    if (!searchQuery || searchQuery.length < 2) return
    setSearching(true)
    try {
      const res = await fetch(`${API}/api/support/search?q=${encodeURIComponent(searchQuery)}`, { headers: getHeaders() })
      const data = await res.json()
      if (data.status === 'success') setSearchResults(data.data || [])
    } catch (err) { console.error(err) }
    finally { setSearching(false) }
  }

  const changeRole = async (userId, newRole) => {
    if (!confirm(`Change this user's role to "${newRole}"?`)) return
    setChangingRole(userId)
    try {
      const res = await fetch(`${API}/api/support/users/${userId}/role`, {
        method: 'PUT', headers: getHeaders(), body: JSON.stringify({ role: newRole })
      })
      const data = await res.json()
      if (data.status === 'success') {
        alert(data.message)
        fetchWorkers()
        // Re-search to update results
        if (searchQuery) searchUsers()
      } else {
        alert(data.message || 'Failed')
      }
    } catch (err) { alert(err.message) }
    finally { setChangingRole(null) }
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <p className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Admin Only</p>
        <p className={`mt-2 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Only admins can manage team roles</p>
      </div>
    )
  }

  const roleColors = {
    admin: 'bg-red-500/20 text-red-400',
    worker: 'bg-blue-500/20 text-blue-400',
    buyer: 'bg-gray-500/20 text-gray-400',
    seller: 'bg-green-500/20 text-green-400',
    Dealer: 'bg-purple-500/20 text-purple-400',
    reporter: 'bg-yellow-500/20 text-yellow-400'
  }

  return (
    <div>
      <h1 className={`text-2xl font-bold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>Team & Roles</h1>
      <p className={`text-sm mb-6 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Manage support team members and assign roles</p>

      {/* Current Workers */}
      <div className={`${card} rounded-xl p-5 mb-6`}>
        <h2 className={`font-bold mb-4 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
          <span className="text-lg">👥</span> Current Support Team ({workers.length})
        </h2>

        {loading ? (
          <div className="p-6 text-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" /></div>
        ) : workers.length === 0 ? (
          <p className={`text-sm text-center py-6 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
            No support team members yet. Search and promote users below.
          </p>
        ) : (
          <div className="space-y-2">
            {workers.map((w) => (
              <div key={w._id} className={`flex items-center justify-between p-4 rounded-xl ${dark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div>
                  <p className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{w.name}</p>
                  <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{w.email} | {w.phoneNumber}</p>
                  <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Last login: {fmt(w.lastLogin?.timestamp)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${roleColors.worker}`}>worker</span>
                  <button
                    onClick={() => changeRole(w._id, 'buyer')}
                    disabled={changingRole === w._id}
                    className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs rounded-lg font-medium disabled:opacity-50"
                  >
                    {changingRole === w._id ? '...' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Worker - Search Users */}
      <div className={`${card} rounded-xl p-5`}>
        <h2 className={`font-bold mb-4 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
          <span className="text-lg">➕</span> Add to Support Team
        </h2>
        <p className={`text-sm mb-4 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
          Search for a user and promote them to worker role
        </p>

        <div className="flex gap-2 mb-4">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            placeholder="Search by name, email, or phone..."
            className={`flex-1 px-4 py-3 rounded-xl border ${input}`}
          />
          <button onClick={searchUsers} disabled={searching} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50">
            {searching ? '...' : 'Search'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((user) => (
              <div key={user._id} className={`flex items-center justify-between p-4 rounded-xl ${dark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div>
                  <p className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                  <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{user.email} | {user.phoneNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${roleColors[user.role] || roleColors.buyer}`}>{user.role}</span>
                  {user.role === 'worker' ? (
                    <button
                      onClick={() => changeRole(user._id, 'buyer')}
                      disabled={changingRole === user._id}
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs rounded-lg font-medium disabled:opacity-50"
                    >
                      {changingRole === user._id ? '...' : 'Demote'}
                    </button>
                  ) : user.role === 'admin' ? (
                    <span className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Admin</span>
                  ) : (
                    <button
                      onClick={() => changeRole(user._id, 'worker')}
                      disabled={changingRole === user._id}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-bold disabled:opacity-50"
                    >
                      {changingRole === user._id ? '...' : 'Make Worker'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
