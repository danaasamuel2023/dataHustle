'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

const API_BASE = 'https://datahustle.onrender.com/api/v1'

export default function WithdrawalSettingsPage() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    setMounted(true)
    fetchSettings()
  }, [])

  const darkMode = mounted && resolvedTheme === 'dark'

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(`${API_BASE}/settings`, {
        headers: { 'x-auth-token': token }
      })
      const data = await res.json()
      if (data.status === 'success') {
        setSettings(data.data.settings)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })
      const data = await res.json()
      if (data.status === 'success') {
        alert('Settings saved successfully')
      } else {
        alert(data.message || 'Failed to save settings')
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const updateNestedSetting = (path, value) => {
    setSettings(prev => {
      const newSettings = { ...prev }
      const keys = path.split('.')
      let current = newSettings
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {}
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      return newSettings
    })
  }

  const cardClass = darkMode
    ? 'bg-gray-900 border border-gray-800 rounded-xl'
    : 'bg-white border border-gray-200 rounded-xl shadow-sm'

  const inputClass = darkMode
    ? 'bg-gray-800 border-gray-700 text-white'
    : 'bg-white border-gray-300 text-gray-900'

  const btnClass = darkMode
    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Provider Settings</h1>
          <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Configure withdrawal provider settings</p>
        </div>
        <button onClick={fetchSettings} className={`px-4 py-2 rounded-lg text-sm font-medium ${btnClass}`}>
          Refresh
        </button>
      </div>

      {/* Active Provider */}
      <div className={cardClass}>
        <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Active Provider</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4">
            {['moolre', 'paystack', 'bulkclix'].map((provider) => (
              <button
                key={provider}
                onClick={() => updateNestedSetting('withdrawalProviders.activeProvider', provider)}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  settings?.withdrawalProviders?.activeProvider === provider
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className={`font-bold capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}>{provider}</p>
                {settings?.withdrawalProviders?.activeProvider === provider && (
                  <span className="text-xs text-indigo-500">Active</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Withdrawal Settings */}
      <div className={cardClass}>
        <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Withdrawal Limits</h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Minimum Withdrawal (GH₵)</label>
            <input
              type="number"
              value={settings?.withdrawalProviders?.minWithdrawal || 10}
              onChange={(e) => updateNestedSetting('withdrawalProviders.minWithdrawal', parseFloat(e.target.value))}
              className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
            />
          </div>
          <div>
            <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Maximum Withdrawal (GH₵)</label>
            <input
              type="number"
              value={settings?.withdrawalProviders?.maxWithdrawal || 5000}
              onChange={(e) => updateNestedSetting('withdrawalProviders.maxWithdrawal', parseFloat(e.target.value))}
              className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
            />
          </div>
          <div>
            <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Withdrawal Fee (%)</label>
            <input
              type="number"
              step="0.1"
              value={settings?.withdrawalProviders?.feePercent || 2}
              onChange={(e) => updateNestedSetting('withdrawalProviders.feePercent', parseFloat(e.target.value))}
              className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
            />
          </div>
          <div>
            <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fixed Fee (GH₵)</label>
            <input
              type="number"
              step="0.1"
              value={settings?.withdrawalProviders?.fixedFee || 0}
              onChange={(e) => updateNestedSetting('withdrawalProviders.fixedFee', parseFloat(e.target.value))}
              className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
            />
          </div>
        </div>
      </div>

      {/* Paystack Settings */}
      <div className={cardClass}>
        <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Paystack Configuration</h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Secret Key</label>
            <input
              type="password"
              value={settings?.withdrawalProviders?.paystack?.secretKey || ''}
              onChange={(e) => updateNestedSetting('withdrawalProviders.paystack.secretKey', e.target.value)}
              placeholder="sk_live_..."
              className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings?.withdrawalProviders?.paystack?.enabled || false}
              onChange={(e) => updateNestedSetting('withdrawalProviders.paystack.enabled', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Enable Paystack</label>
          </div>
        </div>
      </div>

      {/* Moolre Settings */}
      <div className={cardClass}>
        <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Moolre Configuration</h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>API Key</label>
            <input
              type="password"
              value={settings?.withdrawalProviders?.moolre?.apiKey || ''}
              onChange={(e) => updateNestedSetting('withdrawalProviders.moolre.apiKey', e.target.value)}
              placeholder="Enter Moolre API key..."
              className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings?.withdrawalProviders?.moolre?.enabled || false}
              onChange={(e) => updateNestedSetting('withdrawalProviders.moolre.enabled', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Enable Moolre</label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
