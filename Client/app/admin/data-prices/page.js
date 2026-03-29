'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://datahustle.onrender.com'

const NETWORKS = ['YELLO', 'AT_PREMIUM', 'TELECEL']
const NETWORK_LABELS = {
  YELLO: { name: 'MTN', color: '#FBBF24', bg: 'bg-yellow-100 text-yellow-800' },
  AT_PREMIUM: { name: 'AirtelTigo', color: '#8B5CF6', bg: 'bg-purple-100 text-purple-800' },
  TELECEL: { name: 'Telecel', color: '#EF4444', bg: 'bg-red-100 text-red-800' },
}

export default function DataPricesAdmin() {
  const router = useRouter()
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState('YELLO')
  const [message, setMessage] = useState(null)

  // Form state for adding new price
  const [newCapacity, setNewCapacity] = useState('')
  const [newPrice, setNewPrice] = useState('')

  // Edit state
  const [editingId, setEditingId] = useState(null)
  const [editPrice, setEditPrice] = useState('')

  const getHeaders = () => {
    const token = localStorage.getItem('authToken')
    return { 'x-auth-token': token, 'Content-Type': 'application/json' }
  }

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('userData') || '{}')
    if (user.role !== 'admin') {
      router.push('/')
      return
    }
    fetchPrices()
  }, [])

  const fetchPrices = async () => {
    try {
      const res = await fetch(`${API}/api/admin/data-prices`, { headers: getHeaders() })
      const data = await res.json()
      if (data.status === 'success') {
        setPrices(data.data)
      }
    } catch (err) {
      console.error(err)
      showMessage('Failed to load prices', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const res = await fetch(`${API}/api/admin/data-prices/seed`, {
        method: 'POST',
        headers: getHeaders()
      })
      const data = await res.json()
      if (data.status === 'success') {
        showMessage(data.message)
        fetchPrices()
      } else {
        showMessage(data.message, 'error')
      }
    } catch (err) {
      showMessage('Failed to seed prices', 'error')
    } finally {
      setSeeding(false)
    }
  }

  const handleAddPrice = async (e) => {
    e.preventDefault()
    if (!newCapacity || !newPrice) return

    setSaving(true)
    try {
      const res = await fetch(`${API}/api/admin/data-prices`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          network: selectedNetwork,
          capacity: Number(newCapacity),
          price: Number(newPrice)
        })
      })
      const data = await res.json()
      if (data.status === 'success') {
        showMessage(data.message)
        setNewCapacity('')
        setNewPrice('')
        fetchPrices()
      } else {
        showMessage(data.message, 'error')
      }
    } catch (err) {
      showMessage('Failed to add price', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePrice = async (id) => {
    if (!editPrice) return
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/admin/data-prices/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ price: Number(editPrice) })
      })
      const data = await res.json()
      if (data.status === 'success') {
        showMessage('Price updated')
        setEditingId(null)
        setEditPrice('')
        fetchPrices()
      } else {
        showMessage(data.message, 'error')
      }
    } catch (err) {
      showMessage('Failed to update', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (id, currentActive) => {
    try {
      const res = await fetch(`${API}/api/admin/data-prices/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ isActive: !currentActive })
      })
      const data = await res.json()
      if (data.status === 'success') {
        showMessage(`Price ${!currentActive ? 'activated' : 'deactivated'}`)
        fetchPrices()
      }
    } catch (err) {
      showMessage('Failed to toggle', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this price?')) return
    try {
      const res = await fetch(`${API}/api/admin/data-prices/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      const data = await res.json()
      if (data.status === 'success') {
        showMessage('Price deleted')
        fetchPrices()
      }
    } catch (err) {
      showMessage('Failed to delete', 'error')
    }
  }

  const filteredPrices = prices
    .filter(p => p.network === selectedNetwork)
    .sort((a, b) => a.capacity - b.capacity)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Bundle Prices</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Manage prices for guest buy page</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {seeding ? 'Seeding...' : 'Seed from Defaults'}
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
            message.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Network Tabs */}
        <div className="flex gap-2 mb-6">
          {NETWORKS.map(net => (
            <button
              key={net}
              onClick={() => setSelectedNetwork(net)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                selectedNetwork === net
                  ? net === 'YELLO' ? 'bg-yellow-500 text-black shadow-lg' :
                    net === 'AT_PREMIUM' ? 'bg-purple-600 text-white shadow-lg' :
                    'bg-red-600 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {NETWORK_LABELS[net].name}
              <span className="ml-2 text-xs opacity-70">
                ({prices.filter(p => p.network === net).length})
              </span>
            </button>
          ))}
        </div>

        {/* Add New Price Form */}
        <form onSubmit={handleAddPrice} className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Add New Price for {NETWORK_LABELS[selectedNetwork].name}</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Capacity (GB)</label>
              <input
                type="number"
                step="0.1"
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                placeholder="e.g. 5"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Price (GHS)</label>
              <input
                type="number"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="e.g. 22.30"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={saving || !newCapacity || !newPrice}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium whitespace-nowrap"
            >
              {saving ? 'Adding...' : 'Add Price'}
            </button>
          </div>
        </form>

        {/* Prices Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Capacity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Price (GHS)</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredPrices.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No prices set for {NETWORK_LABELS[selectedNetwork].name}. Click &quot;Seed from Defaults&quot; to populate.
                  </td>
                </tr>
              ) : (
                filteredPrices.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{item.capacity}GB</span>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === item._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-24 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdatePrice(item._id)}
                            disabled={saving}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setEditPrice('') }}
                            className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span
                          className="text-gray-900 dark:text-white font-medium cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                          onClick={() => { setEditingId(item._id); setEditPrice(item.price.toString()) }}
                        >
                          GHS {item.price.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(item._id, item.isActive)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {item.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {NETWORKS.map(net => {
            const netPrices = prices.filter(p => p.network === net)
            const active = netPrices.filter(p => p.isActive).length
            return (
              <div key={net} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{NETWORK_LABELS[net].name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{active}/{netPrices.length}</p>
                <p className="text-xs text-gray-400">active bundles</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
