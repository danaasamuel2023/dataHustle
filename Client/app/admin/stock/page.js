'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.datahustle.shop'

const NETWORK_LABELS = {
  YELLO: { name: 'MTN (YELLO)', color: '#FBBF24', emoji: '🟡' },
  TELECEL: { name: 'Telecel', color: '#EF4444', emoji: '🔴' },
  AT_PREMIUM: { name: 'AT Premium', color: '#3B82F6', emoji: '🔵' },
  airteltigo: { name: 'AirtelTigo', color: '#F97316', emoji: '🟠' },
  at: { name: 'AT (Standard)', color: '#8B5CF6', emoji: '🟣' },
}

export default function StockManagement() {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)

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
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API}/api/inventory`, { headers: getHeaders() })
      const data = await res.json()
      setInventory(data.inventory || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleStock = async (network) => {
    setToggling(network)
    try {
      const res = await fetch(`${API}/api/inventory/${network}/toggle`, {
        method: 'PUT',
        headers: getHeaders()
      })
      const data = await res.json()
      if (data.network) {
        setInventory(prev => prev.map(item =>
          item.network === network ? { ...item, inStock: data.inStock } : item
        ))
      }
    } catch (err) {
      alert('Failed: ' + err.message)
    } finally {
      setToggling(null)
    }
  }

  const toggleGeonet = async (network) => {
    setToggling(network + '-geo')
    try {
      const res = await fetch(`${API}/api/inventory/${network}/toggle-geonettech`, {
        method: 'PUT',
        headers: getHeaders()
      })
      const data = await res.json()
      if (data.network) {
        setInventory(prev => prev.map(item =>
          item.network === network ? { ...item, skipGeonettech: data.skipGeonettech } : item
        ))
      }
    } catch (err) {
      alert('Failed: ' + err.message)
    } finally {
      setToggling(null)
    }
  }

  const card = dark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200 shadow-sm'

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${dark ? 'bg-gray-950' : 'bg-gray-50'} p-4 sm:p-6`}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Network Stock Control</h1>
            <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Toggle networks in/out of stock and manage API processing</p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${dark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Back to Admin
          </button>
        </div>

        {/* Quick Status */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
          {inventory.map((item) => {
            const info = NETWORK_LABELS[item.network] || { name: item.network, emoji: '⚪' }
            return (
              <div key={item.network} className={`${card} rounded-xl p-3 text-center`}>
                <span className="text-xl">{info.emoji}</span>
                <p className={`text-xs font-bold mt-1 ${dark ? 'text-white' : 'text-gray-900'}`}>{info.name}</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  item.inStock ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {item.inStock ? 'IN STOCK' : 'OUT'}
                </span>
              </div>
            )
          })}
        </div>

        {/* Network Cards */}
        <div className="space-y-3">
          {inventory.map((item) => {
            const info = NETWORK_LABELS[item.network] || { name: item.network, color: '#6B7280', emoji: '⚪' }
            return (
              <div key={item.network} className={`${card} rounded-xl p-5`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{info.emoji}</span>
                    <div>
                      <h3 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{info.name}</h3>
                      <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Network code: {item.network}
                        {item.updatedAt && ` | Last updated: ${new Date(item.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Stock Toggle */}
                  <div className={`p-4 rounded-xl ${item.inStock
                    ? dark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
                    : dark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-bold ${item.inStock ? 'text-green-400' : 'text-red-400'}`}>
                          {item.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                        </p>
                        <p className={`text-xs mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.inStock ? 'Users can buy this network' : 'Users cannot buy this network'}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleStock(item.network)}
                        disabled={toggling === item.network}
                        className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
                          item.inStock ? 'bg-green-500' : 'bg-red-500'
                        } disabled:opacity-50`}
                      >
                        <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                          item.inStock ? 'left-7' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Geonet API Toggle */}
                  <div className={`p-4 rounded-xl ${!item.skipGeonettech
                    ? dark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
                    : dark ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-bold ${!item.skipGeonettech ? 'text-blue-400' : 'text-yellow-400'}`}>
                          {!item.skipGeonettech ? 'API: AUTO' : 'API: MANUAL'}
                        </p>
                        <p className={`text-xs mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {!item.skipGeonettech ? 'Orders auto-processed via API' : 'Orders go to pending (manual)'}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleGeonet(item.network)}
                        disabled={toggling === item.network + '-geo'}
                        className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
                          !item.skipGeonettech ? 'bg-blue-500' : 'bg-yellow-500'
                        } disabled:opacity-50`}
                      >
                        <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                          !item.skipGeonettech ? 'left-7' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
