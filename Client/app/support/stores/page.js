'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://datahustle.onrender.com'
const getHeaders = () => ({ 'x-auth-token': localStorage.getItem('authToken'), 'Content-Type': 'application/json' })

export default function AgentStores() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const card = dark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200 shadow-sm'
  const input = dark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'

  useEffect(() => { fetchStores() }, [page])

  const fetchStores = async (searchQuery) => {
    setLoading(true)
    try {
      const q = searchQuery !== undefined ? searchQuery : query
      const res = await fetch(`${API}/api/support/stores?page=${page}&limit=20${q ? `&q=${encodeURIComponent(q)}` : ''}`, { headers: getHeaders() })
      const data = await res.json()
      if (data.status === 'success') {
        setStores(data.data.stores || [])
        setPages(data.data.pages || 1)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const search = () => { setPage(1); fetchStores(query) }

  return (
    <div>
      <h1 className={`text-2xl font-bold mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>Agent Stores</h1>

      <div className={`${card} rounded-xl p-4 mb-6`}>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Search store name..."
            className={`flex-1 px-4 py-2.5 rounded-xl border ${input}`}
          />
          <button onClick={search} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">Search</button>
        </div>
      </div>

      <div className={`${card} rounded-xl overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" /></div>
        ) : stores.length === 0 ? (
          <div className="p-8 text-center"><p className={dark ? 'text-gray-500' : 'text-gray-400'}>No stores found</p></div>
        ) : (
          <div className="divide-y divide-gray-800">
            {stores.map((s, i) => (
              <div key={i} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{s.storeName}</p>
                    <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Owner: {s.owner?.name} ({s.owner?.phoneNumber || s.owner?.email})
                    </p>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Slug: {s.storeSlug} | Status: {s.status || 'active'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className={`px-4 py-2 rounded-lg ${dark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Wallet</p>
                      <p className="text-sm font-bold text-green-400">GH₵{(s.wallet?.availableBalance || 0).toFixed(2)}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg ${dark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Total Sales</p>
                      <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{s.totalSales || 0}</p>
                    </div>
                  </div>
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
