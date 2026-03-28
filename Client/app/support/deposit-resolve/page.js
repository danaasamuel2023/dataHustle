'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'

const API = 'https://datahustle.onrender.com/api/support'

export default function DepositResolvePage() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'

  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [crediting, setCrediting] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [notes, setNotes] = useState('')

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  const headers = { 'x-auth-token': token, 'Content-Type': 'application/json' }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!reference.trim()) return
    setLoading(true)
    setError('')
    setSuccess('')
    setResults(null)

    try {
      const res = await fetch(`${API}/deposit/search/${reference.trim()}`, { headers })
      const data = await res.json()
      if (data.status === 'success') {
        setResults(data.data)
      } else {
        setError(data.message || 'Not found')
      }
    } catch (err) {
      setError('Search failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCredit = async (userId, amount, type) => {
    if (crediting) return
    if (!confirm(`Credit GH₵${amount.toFixed(2)} to user via ${type}?`)) return
    setCrediting(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`${API}/deposit/credit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, reference: reference.trim(), amount, type, notes })
      })
      const data = await res.json()
      if (data.status === 'success') {
        setSuccess(data.message)
        setResults(null)
      } else {
        setError(data.message || 'Credit failed')
      }
    } catch (err) {
      setError('Credit failed. Try again.')
    } finally {
      setCrediting(false)
    }
  }

  const fmt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Resolve Deposits</h1>
        <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
          Search by Paystack reference or MoMo Transaction ID. Verify and credit user wallets.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Paystack reference or MoMo TrxId..."
          className={`flex-1 px-4 py-2.5 rounded-lg border text-sm ${dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
        />
        <button
          type="submit"
          disabled={loading || !reference.trim()}
          className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400 text-white rounded-lg text-sm font-medium"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className={`p-3 rounded-lg text-sm ${dark ? 'bg-red-900/20 text-red-400 border border-red-800' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className={`p-3 rounded-lg text-sm ${dark ? 'bg-green-900/20 text-green-400 border border-green-800' : 'bg-green-50 text-green-600 border border-green-200'}`}>
          {success}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {/* Local Transaction */}
          {results.local && (
            <div className={`rounded-xl border overflow-hidden ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className={`px-4 py-2.5 border-b ${dark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                <h3 className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Local Transaction Found</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>User</p>
                    <p className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>
                      {results.local.userId?.name || '—'} ({results.local.userId?.email})
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Amount</p>
                    <p className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>GH₵{(results.local.amount || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Status</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      results.local.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      results.local.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>{results.local.status}</span>
                  </div>
                  <div>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Gateway</p>
                    <p className={dark ? 'text-gray-300' : 'text-gray-700'}>{results.local.gateway}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Reference</p>
                    <p className={`font-mono text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{results.local.reference}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Date</p>
                    <p className={dark ? 'text-gray-300' : 'text-gray-700'}>{fmt(results.local.createdAt)}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Wallet Balance</p>
                    <p className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>GH₵{(results.local.userId?.walletBalance || 0).toFixed(2)}</p>
                  </div>
                </div>
                {results.local.status === 'completed' && (
                  <div className={`mt-2 p-2 rounded-lg text-xs ${dark ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-600'}`}>
                    This deposit was already credited.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paystack Result */}
          {results.paystack && (
            <div className={`rounded-xl border overflow-hidden ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className={`px-4 py-2.5 border-b ${dark ? 'bg-blue-900/30 border-gray-700' : 'bg-blue-50 border-blue-100'}`}>
                <h3 className={`text-sm font-semibold ${dark ? 'text-blue-300' : 'text-blue-800'}`}>Paystack Payment</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Amount</p>
                    <p className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>GH₵{results.paystack.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Status</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      results.paystack.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>{results.paystack.status}</span>
                  </div>
                  <div>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Channel</p>
                    <p className={dark ? 'text-gray-300' : 'text-gray-700'}>{results.paystack.channel}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Email</p>
                    <p className={dark ? 'text-gray-300' : 'text-gray-700'}>{results.paystack.customerEmail}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Paid At</p>
                    <p className={dark ? 'text-gray-300' : 'text-gray-700'}>{fmt(results.paystack.paidAt)}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Response</p>
                    <p className={dark ? 'text-gray-300' : 'text-gray-700'}>{results.paystack.gatewayResponse}</p>
                  </div>
                </div>

                {/* Credit action for Paystack */}
                {results.paystack.status === 'success' && (!results.local || results.local.status !== 'completed') && (
                  <div className={`mt-4 p-3 rounded-lg border ${dark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-xs font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>Credit this to a user's wallet:</p>
                    {results.local?.userId ? (
                      <div className="space-y-2">
                        <p className={`text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>
                          User: <strong>{results.local.userId.name}</strong> ({results.local.userId.email})
                        </p>
                        <input
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Notes (optional)"
                          className={`w-full px-3 py-1.5 rounded-md border text-xs ${dark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                        />
                        <button
                          onClick={() => handleCredit(results.local.userId._id, results.paystack.amount, 'paystack')}
                          disabled={crediting}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white text-xs font-medium rounded-lg"
                        >
                          {crediting ? 'Crediting...' : `Credit GH₵${results.paystack.amount.toFixed(2)} to ${results.local.userId.name}`}
                        </button>
                      </div>
                    ) : (
                      <p className={`text-xs ${dark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                        No local transaction found for this reference. Search by the user's email to find them, then use manual credit.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MoMo Result */}
          {results.momo && (
            <div className={`rounded-xl border overflow-hidden ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className={`px-4 py-2.5 border-b ${dark ? 'bg-emerald-900/30 border-gray-700' : 'bg-emerald-50 border-emerald-100'}`}>
                <h3 className={`text-sm font-semibold ${dark ? 'text-emerald-300' : 'text-emerald-800'}`}>MoMo Payment (DataMart Pool)</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Amount</p>
                    <p className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>GH₵{(results.momo.amount || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Status</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      results.momo.claimable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>{results.momo.status} {results.momo.claimable ? '(claimable)' : ''}</span>
                  </div>
                  <div>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Sender</p>
                    <p className={dark ? 'text-gray-300' : 'text-gray-700'}>{results.momo.senderName || '—'}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Phone</p>
                    <p className={dark ? 'text-gray-300' : 'text-gray-700'}>{results.momo.senderPhone || '—'}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Network</p>
                    <p className={dark ? 'text-gray-300' : 'text-gray-700'}>{results.momo.network || '—'}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Received</p>
                    <p className={dark ? 'text-gray-300' : 'text-gray-700'}>{fmt(results.momo.receivedAt)}</p>
                  </div>
                </div>

                {/* Credit action for MoMo — need to select which user */}
                {results.momo.claimable && (
                  <MomoCreditForm
                    dark={dark}
                    amount={results.momo.amount}
                    reference={reference}
                    notes={notes}
                    setNotes={setNotes}
                    crediting={crediting}
                    onCredit={handleCredit}
                    headers={headers}
                  />
                )}
              </div>
            </div>
          )}

          {/* Nothing found from any source */}
          {!results.local && !results.paystack && !results.momo && (
            <div className={`text-center py-8 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
              No results found for this reference.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Sub-component: MoMo credit needs user lookup
function MomoCreditForm({ dark, amount, reference, notes, setNotes, crediting, onCredit, headers }) {
  const [searchEmail, setSearchEmail] = useState('')
  const [foundUser, setFoundUser] = useState(null)
  const [searching, setSearching] = useState(false)
  const API_BASE = 'https://datahustle.onrender.com/api/support'

  const searchUser = async () => {
    if (!searchEmail.trim()) return
    setSearching(true)
    setFoundUser(null)
    try {
      const res = await fetch(`${API_BASE}/customers?q=${encodeURIComponent(searchEmail.trim())}&page=1&limit=5`, { headers })
      const data = await res.json()
      if (data.status === 'success' && data.data?.users?.length > 0) {
        setFoundUser(data.data.users[0])
      }
    } catch (e) {}
    setSearching(false)
  }

  return (
    <div className={`mt-4 p-3 rounded-lg border ${dark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
      <p className={`text-xs font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
        Claim from MoMo pool and credit to user:
      </p>
      <div className="flex gap-2 mb-2">
        <input
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          placeholder="Search user by email or phone..."
          className={`flex-1 px-3 py-1.5 rounded-md border text-xs ${dark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
          onKeyDown={(e) => e.key === 'Enter' && searchUser()}
        />
        <button onClick={searchUser} disabled={searching} className="px-3 py-1.5 bg-indigo-500 text-white text-xs rounded-md">
          {searching ? '...' : 'Find'}
        </button>
      </div>
      {foundUser && (
        <div className="space-y-2">
          <div className={`p-2 rounded-md ${dark ? 'bg-gray-700' : 'bg-white'}`}>
            <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{foundUser.name}</p>
            <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{foundUser.email} | {foundUser.phoneNumber}</p>
            <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Balance: GH₵{(foundUser.walletBalance || 0).toFixed(2)}</p>
          </div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className={`w-full px-3 py-1.5 rounded-md border text-xs ${dark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
          />
          <button
            onClick={() => onCredit(foundUser._id, amount, 'momo')}
            disabled={crediting}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white text-xs font-medium rounded-lg"
          >
            {crediting ? 'Crediting...' : `Claim & Credit GH₵${amount.toFixed(2)} to ${foundUser.name}`}
          </button>
        </div>
      )}
    </div>
  )
}
