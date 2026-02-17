'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'

const API_BASE = 'https://datahustle.onrender.com/api/v1'

export default function InvestigationPage() {
  const { resolvedTheme } = useTheme()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [storeId, setStoreId] = useState(searchParams.get('storeId') || '')
  const [storeData, setStoreData] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [auditLogs, setAuditLogs] = useState([])

  useEffect(() => {
    setMounted(true)
    if (searchParams.get('storeId')) {
      setStoreId(searchParams.get('storeId'))
      fetchStoreData(searchParams.get('storeId'))
    }
  }, [searchParams])

  const darkMode = mounted && resolvedTheme === 'dark'

  const apiCall = async (endpoint) => {
    const token = localStorage.getItem('authToken')
    const res = await fetch(`${API_BASE}/admin/agent-stores${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return res.json()
  }

  const fetchStoreData = async (id) => {
    setLoading(true)
    try {
      const [detailsRes, txRes, wdRes, auditRes] = await Promise.all([
        apiCall(`/agents/${id}/full-details`),
        apiCall(`/agents/${id}/transactions?limit=50`),
        apiCall(`/agents/${id}/withdrawals?limit=20`),
        apiCall(`/wallet/detailed-logs/${id}?limit=50`)
      ])

      if (detailsRes.status === 'success') setStoreData(detailsRes.data)
      if (txRes.status === 'success') setTransactions(txRes.data.transactions || [])
      if (wdRes.status === 'success') setWithdrawals(wdRes.data.withdrawals || [])
      if (auditRes.status === 'success') setAuditLogs(auditRes.data.logs || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (storeId) fetchStoreData(storeId)
  }

  const formatCurrency = (amount) => `GH₵${(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`
  const formatDate = (date) => new Date(date).toLocaleString()

  const cardClass = darkMode
    ? 'bg-gray-900 border border-gray-800 rounded-xl'
    : 'bg-white border border-gray-200 rounded-xl shadow-sm'

  const inputClass = darkMode
    ? 'bg-gray-800 border-gray-700 text-white'
    : 'bg-white border-gray-300 text-gray-900'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Store Investigation</h1>
        <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Investigate agent store transactions and activity</p>
      </div>

      {/* Search */}
      <div className={`${cardClass} p-4`}>
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            placeholder="Enter Store ID..."
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className={`px-3 py-2 rounded-lg text-sm border flex-1 ${inputClass}`}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Investigate'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Loading store data...</p>
        </div>
      )}

      {storeData && (
        <>
          {/* Store Overview */}
          <div className={cardClass}>
            <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{storeData.store?.storeName}</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{storeData.store?.storeSlug}</p>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Balance</p>
                <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(storeData.store?.wallet?.balance)}</p>
              </div>
              <div>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total Earnings</p>
                <p className="text-lg font-bold text-green-500">{formatCurrency(storeData.store?.wallet?.totalEarnings)}</p>
              </div>
              <div>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total Withdrawn</p>
                <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(storeData.store?.wallet?.totalWithdrawn)}</p>
              </div>
              <div>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Pending</p>
                <p className="text-lg font-bold text-yellow-500">{formatCurrency(storeData.store?.wallet?.pendingWithdrawal)}</p>
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className={cardClass}>
            <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Transactions ({transactions.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-4 py-2 text-left text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date</th>
                    <th className={`px-4 py-2 text-left text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Details</th>
                    <th className={`px-4 py-2 text-right text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Amount</th>
                    <th className={`px-4 py-2 text-right text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Profit</th>
                    <th className={`px-4 py-2 text-center text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
                  {transactions.slice(0, 20).map((tx) => (
                    <tr key={tx._id} className={darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}>
                      <td className={`px-4 py-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(tx.createdAt)}</td>
                      <td className="px-4 py-2">
                        <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{tx.network} {tx.capacity}GB</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{tx.phoneNumber}</p>
                      </td>
                      <td className={`px-4 py-2 text-sm text-right ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(tx.amount)}</td>
                      <td className="px-4 py-2 text-sm text-right text-green-500">{formatCurrency(tx.agentProfit)}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Withdrawals */}
          <div className={cardClass}>
            <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Withdrawals ({withdrawals.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-4 py-2 text-left text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date</th>
                    <th className={`px-4 py-2 text-left text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>ID</th>
                    <th className={`px-4 py-2 text-right text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Amount</th>
                    <th className={`px-4 py-2 text-center text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
                  {withdrawals.map((wd) => (
                    <tr key={wd._id} className={darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}>
                      <td className={`px-4 py-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(wd.createdAt)}</td>
                      <td className={`px-4 py-2 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{wd.withdrawalId}</td>
                      <td className={`px-4 py-2 text-sm text-right ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(wd.requestedAmount)}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          wd.status === 'completed' ? 'bg-green-100 text-green-700' :
                          wd.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {wd.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Logs */}
          <div className={cardClass}>
            <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Wallet Audit Logs ({auditLogs.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-4 py-2 text-left text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date</th>
                    <th className={`px-4 py-2 text-left text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Operation</th>
                    <th className={`px-4 py-2 text-right text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Amount</th>
                    <th className={`px-4 py-2 text-right text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Balance</th>
                    <th className={`px-4 py-2 text-left text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Description</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
                  {auditLogs.slice(0, 30).map((log) => (
                    <tr key={log._id} className={darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}>
                      <td className={`px-4 py-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(log.createdAt)}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          log.operation === 'credit' ? 'bg-green-100 text-green-700' :
                          log.operation === 'debit' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {log.operation}
                        </span>
                      </td>
                      <td className={`px-4 py-2 text-sm text-right font-medium ${log.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {log.amount >= 0 ? '+' : ''}{formatCurrency(log.amount)}
                      </td>
                      <td className={`px-4 py-2 text-sm text-right ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(log.balanceAfter)}</td>
                      <td className={`px-4 py-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
