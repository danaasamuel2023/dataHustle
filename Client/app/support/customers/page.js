'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.datahustle.shop'
const getHeaders = () => ({ 'x-auth-token': localStorage.getItem('authToken'), 'Content-Type': 'application/json' })

const fmt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'

export default function CustomerSearch() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Wallet actions
  const [showWallet, setShowWallet] = useState(false)
  const [walletAction, setWalletAction] = useState('credit')
  const [walletAmount, setWalletAmount] = useState('')
  const [walletReason, setWalletReason] = useState('')
  const [walletLoading, setWalletLoading] = useState(false)

  const card = dark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200 shadow-sm'
  const input = dark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'

  const search = async () => {
    if (!query || query.length < 2) return
    setSearching(true)
    setSelected(null)
    setDetail(null)
    try {
      const res = await fetch(`${API}/api/support/search?q=${encodeURIComponent(query)}`, { headers: getHeaders() })
      const data = await res.json()
      if (data.status === 'success') setResults(data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setSearching(false)
    }
  }

  const viewCustomer = async (userId) => {
    setDetailLoading(true)
    setSelected(userId)
    try {
      const res = await fetch(`${API}/api/support/customer/${userId}`, { headers: getHeaders() })
      const data = await res.json()
      if (data.status === 'success') setDetail(data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleWalletAction = async () => {
    if (!walletAmount || parseFloat(walletAmount) <= 0 || walletReason.length < 10) return
    setWalletLoading(true)
    try {
      const endpoint = walletAction === 'credit' ? 'credit' : 'deduct'
      const res = await fetch(`${API}/api/support/wallet/${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId: selected, amount: parseFloat(walletAmount), reason: walletReason })
      })
      const data = await res.json()
      if (data.status === 'success') {
        alert(data.message)
        setShowWallet(false)
        setWalletAmount('')
        setWalletReason('')
        viewCustomer(selected)
      } else {
        alert(data.message || 'Failed')
      }
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setWalletLoading(false)
    }
  }

  const refundOrder = async (orderId) => {
    if (!confirm('Refund this order to the user wallet?')) return
    try {
      const res = await fetch(`${API}/api/support/order/${orderId}/refund`, {
        method: 'POST',
        headers: getHeaders()
      })
      const data = await res.json()
      alert(data.message || 'Done')
      if (data.status === 'success') viewCustomer(selected)
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  return (
    <div>
      <h1 className={`text-2xl font-bold mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>Customer Search</h1>

      {/* Search */}
      <div className={`${card} rounded-xl p-4 mb-6`}>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Search by name, email, or phone..."
            className={`flex-1 px-4 py-3 rounded-xl border ${input}`}
          />
          <button onClick={search} disabled={searching} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50">
            {searching ? '...' : 'Search'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Results List */}
        <div className={`${card} rounded-xl p-4 ${detail ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
          <h2 className={`font-bold mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>
            Results ({results.length})
          </h2>
          {results.length === 0 ? (
            <p className={`text-sm text-center py-8 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
              {query ? 'No customers found' : 'Search for a customer'}
            </p>
          ) : (
            <div className="space-y-1 max-h-[70vh] overflow-y-auto">
              {results.map((user) => (
                <div
                  key={user._id}
                  onClick={() => viewCustomer(user._id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selected === user._id
                      ? dark ? 'bg-blue-600/20 border border-blue-500' : 'bg-blue-50 border border-blue-300'
                      : dark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                  }`}
                >
                  <p className={`font-medium text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                  <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{user.email} | {user.phoneNumber}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      user.isDisabled ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {user.isDisabled ? 'Disabled' : 'Active'}
                    </span>
                    <span className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                      GH₵{(user.walletBalance || 0).toFixed(2)}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${dark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Detail */}
        {selected && (
          <div className="lg:col-span-2 space-y-4">
            {detailLoading ? (
              <div className={`${card} rounded-xl p-8 text-center`}>
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : detail ? (
              <>
                {/* Profile Card */}
                <div className={`${card} rounded-xl p-5`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{detail.user.name}</h2>
                      <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{detail.user.email}</p>
                      <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{detail.user.phoneNumber}</p>
                    </div>
                    <button
                      onClick={() => setShowWallet(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium"
                    >
                      Wallet Action
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className={`p-3 rounded-lg ${dark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Balance</p>
                      <p className={`text-lg font-bold ${dark ? 'text-green-400' : 'text-green-600'}`}>GH₵{(detail.user.walletBalance || 0).toFixed(2)}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${dark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Total Orders</p>
                      <p className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{detail.stats.totalOrders}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${dark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Total Spent</p>
                      <p className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>GH₵{detail.stats.totalSpent.toFixed(2)}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${dark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Failed</p>
                      <p className="text-lg font-bold text-red-400">{detail.stats.failedOrders}</p>
                    </div>
                  </div>
                </div>

                {/* Orders */}
                <div className={`${card} rounded-xl p-5`}>
                  <h3 className={`font-bold mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>Recent Orders ({detail.orders.length})</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {detail.orders.map((o, i) => {
                      const statusColors = {
                        completed: 'bg-green-500/20 text-green-400', delivered: 'bg-green-500/20 text-green-400',
                        failed: 'bg-red-500/20 text-red-400', refunded: 'bg-blue-500/20 text-blue-400',
                        pending: 'bg-yellow-500/20 text-yellow-400', processing: 'bg-blue-500/20 text-blue-400'
                      }
                      return (
                        <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${dark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                          <div>
                            <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>
                              {o.network} {o.capacity}GB - {o.phoneNumber}
                            </p>
                            <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{fmt(o.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>GH₵{o.price}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[o.status] || 'bg-gray-500/20 text-gray-400'}`}>{o.status}</span>
                            {o.status === 'failed' && o.gateway === 'wallet' && (
                              <button onClick={() => refundOrder(o._id)} className="text-xs px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium">
                                Refund
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Transactions */}
                <div className={`${card} rounded-xl p-5`}>
                  <h3 className={`font-bold mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>Recent Transactions ({detail.transactions.length})</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {detail.transactions.map((t, i) => (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${dark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <div>
                          <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{t.type} - {t.gateway}</p>
                          <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{fmt(t.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${['deposit', 'refund'].includes(t.type) ? 'text-green-400' : 'text-red-400'}`}>
                            {['deposit', 'refund'].includes(t.type) ? '+' : '-'}GH₵{t.amount?.toFixed(2)}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{t.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Store info if exists */}
                {detail.store && (
                  <div className={`${card} rounded-xl p-5`}>
                    <h3 className={`font-bold mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>Agent Store</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded-lg ${dark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Store Name</p>
                        <p className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{detail.store.storeName}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${dark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Wallet</p>
                        <p className={`font-bold text-green-400`}>GH₵{(detail.store.wallet?.availableBalance || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Wallet Action Modal */}
      {showWallet && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`${card} rounded-xl p-5 w-full max-w-md`}>
            <h3 className={`text-lg font-bold mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>Wallet Action</h3>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setWalletAction('credit')} className={`flex-1 py-2 rounded-lg font-medium ${walletAction === 'credit' ? 'bg-green-600 text-white' : dark ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                + Credit
              </button>
              <button onClick={() => setWalletAction('deduct')} className={`flex-1 py-2 rounded-lg font-medium ${walletAction === 'deduct' ? 'bg-red-600 text-white' : dark ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                - Deduct
              </button>
            </div>
            <input type="number" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} placeholder="Amount" step="0.01" className={`w-full px-3 py-2 rounded-lg border mb-3 ${input}`} />
            <textarea value={walletReason} onChange={(e) => setWalletReason(e.target.value)} placeholder="Reason (min 10 chars)..." rows={2} className={`w-full px-3 py-2 rounded-lg border mb-4 ${input}`} />
            <div className="flex gap-2">
              <button onClick={() => { setShowWallet(false); setWalletAmount(''); setWalletReason('') }} className={`flex-1 py-2 rounded-lg ${dark ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'}`}>Cancel</button>
              <button onClick={handleWalletAction} disabled={walletLoading || !walletAmount || walletReason.length < 10} className={`flex-1 py-2 rounded-lg font-bold text-white disabled:opacity-50 ${walletAction === 'credit' ? 'bg-green-600' : 'bg-red-600'}`}>
                {walletLoading ? '...' : walletAction === 'credit' ? 'Credit' : 'Deduct'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
