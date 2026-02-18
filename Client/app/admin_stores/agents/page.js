'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'

const API_BASE = 'https://datahustle.onrender.com/api/v1'

export default function AgentsBalancesPage() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState([])
  const [totals, setTotals] = useState({})
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 })
  const [filters, setFilters] = useState({ sortBy: 'balance', sortOrder: 'desc', status: '', minBalance: '' })
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [agentDetails, setAgentDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const darkMode = mounted && resolvedTheme === 'dark'

  useEffect(() => {
    fetchAgents()
  }, [pagination.page, filters])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.status && { status: filters.status }),
        ...(filters.minBalance && { minBalance: filters.minBalance })
      })

      const res = await fetch(`${API_BASE}/admin/agent-stores/agents/balances?${params}`, {
        headers: { 'x-auth-token': token }
      })
      const data = await res.json()

      if (data.status === 'success') {
        setAgents(data.data.agents || [])
        setTotals(data.data.totals || {})
        setPagination(prev => ({ ...prev, total: data.data.pagination?.total || 0 }))
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAgentDetails = async (storeId) => {
    try {
      setDetailsLoading(true)
      const token = localStorage.getItem('authToken')
      const res = await fetch(`${API_BASE}/admin/agent-stores/agents/${storeId}/full-details`, {
        headers: { 'x-auth-token': token }
      })
      const data = await res.json()
      if (data.status === 'success') {
        setAgentDetails(data.data)
      }
    } catch (error) {
      console.error('Error fetching details:', error)
    } finally {
      setDetailsLoading(false)
    }
  }

  const formatCurrency = (amount) => `GH₵${(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`

  const cardClass = darkMode
    ? 'bg-gray-900 border border-gray-800 rounded-xl'
    : 'bg-white border border-gray-200 rounded-xl shadow-sm'

  const inputClass = darkMode
    ? 'bg-gray-800 border-gray-700 text-white'
    : 'bg-gray-50 border-gray-200 text-gray-900'

  const statusColors = {
    active: darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700',
    suspended: darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700',
    pending_approval: darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Agents & Balances
          </h1>
          <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            View all agent stores and their wallet balances
          </p>
        </div>
        <button
          onClick={fetchAgents}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Refresh
        </button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Balance</p>
          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(totals.totalBalance)}
          </p>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pending Withdrawal</p>
          <p className={`text-2xl font-bold mt-1 text-yellow-500`}>
            {formatCurrency(totals.totalPending)}
          </p>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Earnings</p>
          <p className={`text-2xl font-bold mt-1 text-green-500`}>
            {formatCurrency(totals.totalEarnings)}
          </p>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Withdrawn</p>
          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(totals.totalWithdrawn)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className={`${cardClass} p-4`}>
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            className={`px-3 py-2 rounded-lg text-sm border ${inputClass}`}
          >
            <option value="balance">Sort by Balance</option>
            <option value="totalEarnings">Sort by Earnings</option>
            <option value="pendingWithdrawal">Sort by Pending</option>
            <option value="createdAt">Sort by Date</option>
          </select>

          <select
            value={filters.sortOrder}
            onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
            className={`px-3 py-2 rounded-lg text-sm border ${inputClass}`}
          >
            <option value="desc">Highest First</option>
            <option value="asc">Lowest First</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className={`px-3 py-2 rounded-lg text-sm border ${inputClass}`}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending_approval">Pending</option>
          </select>

          <input
            type="number"
            placeholder="Min Balance"
            value={filters.minBalance}
            onChange={(e) => setFilters({ ...filters, minBalance: e.target.value })}
            className={`px-3 py-2 rounded-lg text-sm w-32 border ${inputClass}`}
          />
        </div>
      </div>

      {/* Agents Table */}
      <div className={cardClass}>
        {loading ? (
          <div className="p-8 text-center">
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Loading agents...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={darkMode ? 'border-b border-gray-800' : 'border-b border-gray-200'}>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Store</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Agent</th>
                  <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Balance</th>
                  <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pending</th>
                  <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Earnings</th>
                  <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                  <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
                {agents.map((agent) => (
                  <tr key={agent.storeId} className={darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-4">
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{agent.storeName}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{agent.storeSlug}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{agent.agent?.name || 'N/A'}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{agent.agent?.email}</p>
                    </td>
                    <td className={`px-4 py-4 text-right font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(agent.wallet?.balance)}
                    </td>
                    <td className="px-4 py-4 text-right text-yellow-500">
                      {formatCurrency(agent.wallet?.pendingWithdrawal)}
                    </td>
                    <td className="px-4 py-4 text-right text-green-500">
                      {formatCurrency(agent.wallet?.totalEarnings)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusColors[agent.status] || statusColors.pending_approval}`}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => { setSelectedAgent(agent); fetchAgentDetails(agent.storeId) }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className={`px-4 py-3 flex items-center justify-between border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Showing {agents.length} of {pagination.total} agents
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className={`px-3 py-1.5 rounded-lg text-sm disabled:opacity-50 ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={agents.length < pagination.limit}
              className={`px-3 py-1.5 rounded-lg text-sm disabled:opacity-50 ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Agent Details Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${cardClass} max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className={`sticky top-0 p-4 border-b ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedAgent.storeName}</h2>
                <button onClick={() => { setSelectedAgent(null); setAgentDetails(null) }} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>X</button>
              </div>
            </div>

            <div className="p-6">
              {detailsLoading ? (
                <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading details...</p>
              ) : agentDetails ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Balance</p>
                      <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(agentDetails.store?.wallet?.balance)}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total Earnings</p>
                      <p className="text-lg font-bold text-green-500">{formatCurrency(agentDetails.store?.wallet?.totalEarnings)}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total Orders</p>
                      <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{agentDetails.store?.metrics?.totalOrders || 0}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Products</p>
                      <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{agentDetails.store?.productsCount || 0}</p>
                    </div>
                  </div>

                  {agentDetails.recentTransactions?.length > 0 && (
                    <div>
                      <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Transactions</h3>
                      <div className="space-y-2">
                        {agentDetails.recentTransactions.slice(0, 5).map((tx) => (
                          <div key={tx._id} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                            <div>
                              <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{tx.network} {tx.capacity}GB - {tx.phoneNumber}</p>
                              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{new Date(tx.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(tx.amount)}</p>
                              <p className="text-xs text-green-500">+{formatCurrency(tx.agentProfit)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <Link href={`/admin_stores/investigation?storeId=${selectedAgent.storeId}`} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                      Full Investigation
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
