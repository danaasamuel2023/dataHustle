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
      // Only send withdrawalProviders - not the entire DB document
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          withdrawalProviders: settings?.withdrawalProviders
        })
      })
      const data = await res.json()
      if (data.status === 'success') {
        setSettings(data.data.settings)
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

  // Deep clone + set nested value (fixes shallow copy mutation bug)
  const updateNestedSetting = (path, value) => {
    setSettings(prev => {
      const newSettings = JSON.parse(JSON.stringify(prev))
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

  const labelClass = `block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Loading settings...</p>
      </div>
    )
  }

  const wp = settings?.withdrawalProviders || {}

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

      {/* Pause Withdrawals Banner */}
      {wp.withdrawalsPaused && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-500 text-lg font-bold">WITHDRAWALS PAUSED</span>
            {wp.pausedAt && (
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                since {new Date(wp.pausedAt).toLocaleString()}
              </span>
            )}
          </div>
          {wp.pauseReason && (
            <p className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Reason: {wp.pauseReason}</p>
          )}
        </div>
      )}

      {/* Global Controls */}
      <div className={cardClass}>
        <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Global Controls</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Pause Withdrawals */}
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pause All Withdrawals</p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Temporarily stop all withdrawals from being processed</p>
            </div>
            <button
              onClick={() => updateNestedSetting('withdrawalProviders.withdrawalsPaused', !wp.withdrawalsPaused)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                wp.withdrawalsPaused
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {wp.withdrawalsPaused ? 'PAUSED - Click to Resume' : 'Pause Withdrawals'}
            </button>
          </div>
          {/* Pause Reason */}
          {wp.withdrawalsPaused && (
            <div>
              <label className={labelClass}>Pause Reason</label>
              <input
                type="text"
                value={wp.pauseReason || ''}
                onChange={(e) => updateNestedSetting('withdrawalProviders.pauseReason', e.target.value)}
                placeholder="e.g. Provider maintenance, investigating fraud..."
                className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
              />
            </div>
          )}

          {/* Auto Fallback */}
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Auto Fallback</p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Automatically try next provider if active one fails</p>
            </div>
            <button
              onClick={() => updateNestedSetting('withdrawalProviders.enableAutoFallback', !wp.enableAutoFallback)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                wp.enableAutoFallback !== false
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {wp.enableAutoFallback !== false ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>

      {/* Active Provider */}
      <div className={cardClass}>
        <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Active Provider</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {['auto', 'moolre', 'paystack', 'bulkclix'].map((provider) => (
              <button
                key={provider}
                onClick={() => updateNestedSetting('withdrawalProviders.activeProvider', provider)}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  wp.activeProvider === provider
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className={`font-bold capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}>{provider}</p>
                {provider === 'auto' && (
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Uses priority order</span>
                )}
                {wp.activeProvider === provider && (
                  <span className="block text-xs text-indigo-500 mt-1">Active</span>
                )}
              </button>
            ))}
          </div>

          {/* Provider Priority */}
          <div className="mt-4">
            <label className={labelClass}>Provider Priority Order (for auto mode & fallback)</label>
            <p className={`text-xs mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Current order: {(wp.providerPriority || ['paystack', 'moolre', 'bulkclix']).join(' → ')}
            </p>
            <div className="flex gap-2 flex-wrap">
              {['paystack', 'moolre', 'bulkclix'].map((provider) => {
                const priority = wp.providerPriority || ['paystack', 'moolre', 'bulkclix']
                const idx = priority.indexOf(provider)
                return (
                  <div key={provider} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                    darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}>
                    <span className="font-medium">{idx + 1}.</span>
                    <span className="capitalize">{provider}</span>
                    {idx > 0 && (
                      <button
                        onClick={() => {
                          const newPriority = [...priority]
                          ;[newPriority[idx - 1], newPriority[idx]] = [newPriority[idx], newPriority[idx - 1]]
                          updateNestedSetting('withdrawalProviders.providerPriority', newPriority)
                        }}
                        className="ml-1 text-xs text-indigo-500 hover:text-indigo-400"
                        title="Move up"
                      >
                        ↑
                      </button>
                    )}
                    {idx < priority.length - 1 && (
                      <button
                        onClick={() => {
                          const newPriority = [...priority]
                          ;[newPriority[idx], newPriority[idx + 1]] = [newPriority[idx + 1], newPriority[idx]]
                          updateNestedSetting('withdrawalProviders.providerPriority', newPriority)
                        }}
                        className="ml-1 text-xs text-indigo-500 hover:text-indigo-400"
                        title="Move down"
                      >
                        ↓
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Limits & Fees */}
      <div className={cardClass}>
        <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Withdrawal Limits & Fees</h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Minimum Withdrawal (GH₵)</label>
            <input
              type="number"
              value={wp.minWithdrawal ?? 10}
              onChange={(e) => updateNestedSetting('withdrawalProviders.minWithdrawal', parseFloat(e.target.value))}
              className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
            />
          </div>
          <div>
            <label className={labelClass}>Maximum Withdrawal (GH₵)</label>
            <input
              type="number"
              value={wp.maxWithdrawal ?? 5000}
              onChange={(e) => updateNestedSetting('withdrawalProviders.maxWithdrawal', parseFloat(e.target.value))}
              className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
            />
          </div>
          <div>
            <label className={labelClass}>Daily Limit per Agent (GH₵)</label>
            <input
              type="number"
              value={wp.dailyLimit ?? 3000}
              onChange={(e) => updateNestedSetting('withdrawalProviders.dailyLimit', parseFloat(e.target.value))}
              className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
            />
          </div>
          <div className="border-l pl-4" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
            <label className={labelClass}>Withdrawal Fee (%)</label>
            <input
              type="number"
              step="0.1"
              value={wp.feePercent ?? 1}
              onChange={(e) => updateNestedSetting('withdrawalProviders.feePercent', parseFloat(e.target.value))}
              className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
            />
          </div>
          <div>
            <label className={labelClass}>Fixed Fee (GH₵)</label>
            <input
              type="number"
              step="0.1"
              value={wp.fixedFee ?? 0}
              onChange={(e) => updateNestedSetting('withdrawalProviders.fixedFee', parseFloat(e.target.value))}
              className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
            />
          </div>
        </div>
      </div>

      {/* Paystack Settings */}
      <div className={cardClass}>
        <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Paystack Configuration</h3>
            {wp.paystack?.lastUsed && (
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Last used: {new Date(wp.paystack.lastUsed).toLocaleString()}
              </span>
            )}
          </div>
          {/* Provider stats */}
          {(wp.paystack?.successCount > 0 || wp.paystack?.failureCount > 0) && (
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-green-500">{wp.paystack.successCount} successful</span>
              <span className="text-red-500">{wp.paystack.failureCount} failed</span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                GH₵{(wp.paystack.totalAmountProcessed || 0).toFixed(2)} processed
              </span>
            </div>
          )}
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className={labelClass}>Secret Key</label>
            <input
              type="password"
              value={wp.paystack?.secretKey || ''}
              onChange={(e) => updateNestedSetting('withdrawalProviders.paystack.secretKey', e.target.value)}
              placeholder="sk_live_..."
              className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={wp.paystack?.enabled || false}
              onChange={(e) => updateNestedSetting('withdrawalProviders.paystack.enabled', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Enable Paystack</label>
          </div>
          {wp.paystack?.lastError && (
            <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
              Last error: {wp.paystack.lastError}
            </div>
          )}
        </div>
      </div>

      {/* Moolre Settings */}
      <div className={cardClass}>
        <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Moolre Configuration</h3>
            {wp.moolre?.lastUsed && (
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Last used: {new Date(wp.moolre.lastUsed).toLocaleString()}
              </span>
            )}
          </div>
          {(wp.moolre?.successCount > 0 || wp.moolre?.failureCount > 0) && (
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-green-500">{wp.moolre.successCount} successful</span>
              <span className="text-red-500">{wp.moolre.failureCount} failed</span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                GH₵{(wp.moolre.totalAmountProcessed || 0).toFixed(2)} processed
              </span>
            </div>
          )}
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className={labelClass}>API Key</label>
            <input
              type="password"
              value={wp.moolre?.apiKey || ''}
              onChange={(e) => updateNestedSetting('withdrawalProviders.moolre.apiKey', e.target.value)}
              placeholder="Enter Moolre API key..."
              className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
            />
          </div>
          <div>
            <label className={labelClass}>API User</label>
            <input
              type="text"
              value={wp.moolre?.apiUser || ''}
              onChange={(e) => updateNestedSetting('withdrawalProviders.moolre.apiUser', e.target.value)}
              placeholder="Enter Moolre API user..."
              className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
            />
          </div>
          <div>
            <label className={labelClass}>Account Number</label>
            <input
              type="text"
              value={wp.moolre?.accountNumber || ''}
              onChange={(e) => updateNestedSetting('withdrawalProviders.moolre.accountNumber', e.target.value)}
              placeholder="Enter Moolre account number..."
              className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={wp.moolre?.enabled || false}
              onChange={(e) => updateNestedSetting('withdrawalProviders.moolre.enabled', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Enable Moolre</label>
          </div>
          {wp.moolre?.lastError && (
            <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
              Last error: {wp.moolre.lastError}
            </div>
          )}
        </div>
      </div>

      {/* BulkClix Settings */}
      <div className={cardClass}>
        <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>BulkClix Configuration</h3>
            {wp.bulkclix?.lastUsed && (
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Last used: {new Date(wp.bulkclix.lastUsed).toLocaleString()}
              </span>
            )}
          </div>
          {(wp.bulkclix?.successCount > 0 || wp.bulkclix?.failureCount > 0) && (
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-green-500">{wp.bulkclix.successCount} successful</span>
              <span className="text-red-500">{wp.bulkclix.failureCount} failed</span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                GH₵{(wp.bulkclix.totalAmountProcessed || 0).toFixed(2)} processed
              </span>
            </div>
          )}
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className={labelClass}>API Key</label>
            <input
              type="password"
              value={wp.bulkclix?.apiKey || ''}
              onChange={(e) => updateNestedSetting('withdrawalProviders.bulkclix.apiKey', e.target.value)}
              placeholder="Enter BulkClix API key..."
              className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={wp.bulkclix?.enabled || false}
              onChange={(e) => updateNestedSetting('withdrawalProviders.bulkclix.enabled', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Enable BulkClix</label>
          </div>
          {wp.bulkclix?.lastError && (
            <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
              Last error: {wp.bulkclix.lastError}
            </div>
          )}
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
