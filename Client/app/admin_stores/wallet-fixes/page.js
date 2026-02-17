'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

const API_BASE = 'https://datahustle.onrender.com/api/v1'

export default function WalletFixesPage() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [storeId, setStoreId] = useState('')
  const [storeSearch, setStoreSearch] = useState('')
  const [storeResults, setStoreResults] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  const [walletData, setWalletData] = useState(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustType, setAdjustType] = useState('add')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const darkMode = mounted && resolvedTheme === 'dark'

  const apiCall = async (endpoint, method = 'GET', body = null) => {
    const token = localStorage.getItem('authToken')
    const config = {
      method,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    }
    if (body) config.body = JSON.stringify(body)
    const res = await fetch(`${API_BASE}/admin/agent-stores${endpoint}`, config)
    return res.json()
  }

  const searchStores = async () => {
    if (!storeSearch) return
    setLoading(true)
    try {
      const data = await apiCall(`/stores?search=${storeSearch}&limit=10`)
      if (data.status === 'success') {
        setStoreResults(data.data.stores || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectStore = async (store) => {
    setSelectedStore(store)
    setStoreId(store._id)
    setStoreResults([])
    setStoreSearch('')

    // Fetch wallet audit data
    try {
      const data = await apiCall(`/wallet/audit/${store._id}`)
      if (data.status === 'success') {
        setWalletData(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleAdjustWallet = async () => {
    if (!adjustAmount || !adjustReason || !selectedStore) {
      alert('Please fill all fields')
      return
    }

    setActionLoading(true)
    try {
      const amount = adjustType === 'add' ? Math.abs(parseFloat(adjustAmount)) : -Math.abs(parseFloat(adjustAmount))
      const data = await apiCall(`/wallet/secure-adjust/${selectedStore._id}`, 'POST', {
        amount,
        reason: adjustReason,
        operation: adjustType === 'add' ? 'admin_credit' : 'admin_debit'
      })

      if (data.status === 'success') {
        alert('Wallet adjusted successfully')
        setAdjustAmount('')
        setAdjustReason('')
        selectStore(selectedStore) // Refresh
      } else {
        alert(data.message || 'Failed to adjust wallet')
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const formatCurrency = (amount) => `GH₵${(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`
  const formatDate = (date) => new Date(date).toLocaleString()

  const cardClass = darkMode
    ? 'bg-gray-900 border border-gray-800 rounded-xl'
    : 'bg-white border border-gray-200 rounded-xl shadow-sm'

  const inputClass = darkMode
    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Wallet Fixes</h1>
        <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Adjust agent wallet balances and fix discrepancies</p>
      </div>

      {/* Store Search */}
      <div className={`${cardClass} p-4`}>
        <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Find Store</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by store name..."
            value={storeSearch}
            onChange={(e) => setStoreSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchStores()}
            className={`px-3 py-2 rounded-lg text-sm border flex-1 ${inputClass}`}
          />
          <button
            onClick={searchStores}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            Search
          </button>
        </div>

        {/* Search Results */}
        {storeResults.length > 0 && (
          <div className={`mt-3 border rounded-lg overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {storeResults.map((store) => (
              <div
                key={store._id}
                onClick={() => selectStore(store)}
                className={`p-3 cursor-pointer ${darkMode ? 'hover:bg-gray-800 border-gray-700' : 'hover:bg-gray-50 border-gray-200'} border-b last:border-b-0`}
              >
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{store.storeName}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{store.storeSlug} - Balance: {formatCurrency(store.wallet?.balance)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Store */}
      {selectedStore && (
        <>
          <div className={cardClass}>
            <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedStore.storeName}</h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{selectedStore.storeSlug}</p>
                </div>
                <button onClick={() => { setSelectedStore(null); setWalletData(null) }} className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Clear
                </button>
              </div>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Current Balance</p>
                <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(walletData?.currentBalance || selectedStore.wallet?.balance)}</p>
              </div>
              <div>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total Earnings</p>
                <p className="text-xl font-bold text-green-500">{formatCurrency(walletData?.totalEarnings || selectedStore.wallet?.totalEarnings)}</p>
              </div>
              <div>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total Withdrawn</p>
                <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(walletData?.totalWithdrawn || selectedStore.wallet?.totalWithdrawn)}</p>
              </div>
              <div>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Pending</p>
                <p className="text-xl font-bold text-yellow-500">{formatCurrency(walletData?.pendingWithdrawal || selectedStore.wallet?.pendingWithdrawal)}</p>
              </div>
            </div>
          </div>

          {/* Wallet Adjustment */}
          <div className={cardClass}>
            <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Adjust Wallet</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Type</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${inputClass}`}
                  >
                    <option value="add">Add Money</option>
                    <option value="deduct">Deduct Money</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Amount (GH₵)</label>
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${inputClass}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Reason</label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Enter reason for adjustment..."
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${inputClass}`}
                />
              </div>

              <button
                onClick={handleAdjustWallet}
                disabled={actionLoading || !adjustAmount || !adjustReason}
                className={`w-full py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
                  adjustType === 'add'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {actionLoading ? 'Processing...' : adjustType === 'add' ? 'Add to Wallet' : 'Deduct from Wallet'}
              </button>
            </div>
          </div>

          {/* Recent Audit Logs */}
          {walletData?.recentLogs?.length > 0 && (
            <div className={cardClass}>
              <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Wallet Activity</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-4 py-2 text-left text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date</th>
                      <th className={`px-4 py-2 text-left text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Operation</th>
                      <th className={`px-4 py-2 text-right text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Amount</th>
                      <th className={`px-4 py-2 text-left text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Description</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
                    {walletData.recentLogs.slice(0, 20).map((log) => (
                      <tr key={log._id} className={darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}>
                        <td className={`px-4 py-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(log.createdAt)}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            log.operation === 'credit' || log.operation === 'admin_credit' ? 'bg-green-100 text-green-700' :
                            log.operation === 'debit' || log.operation === 'admin_debit' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {log.operation}
                          </span>
                        </td>
                        <td className={`px-4 py-2 text-sm text-right font-medium ${log.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {log.amount >= 0 ? '+' : ''}{formatCurrency(log.amount)}
                        </td>
                        <td className={`px-4 py-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{log.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
