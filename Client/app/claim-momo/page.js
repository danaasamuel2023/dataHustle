'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, CheckCircle, XCircle, Loader2, ArrowLeft, Wallet } from 'lucide-react'

const API = 'https://datahustle.onrender.com/api/v1'

export default function ClaimMomoPage() {
  const router = useRouter()
  const [trxId, setTrxId] = useState('')
  const [loading, setLoading] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [payment, setPayment] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

  const headers = { 'x-auth-token': token, 'Content-Type': 'application/json' }

  const handleCheck = async (e) => {
    e.preventDefault()
    if (!trxId.trim()) return
    setLoading(true)
    setError('')
    setPayment(null)
    setResult(null)

    try {
      const res = await fetch(`${API}/momo/check/${trxId.trim()}`, { headers })
      const data = await res.json()

      if (data.status === 'success' && data.data) {
        setPayment(data.data)
        if (!data.data.claimable) {
          setError(`This payment is ${data.data.status} and cannot be claimed.`)
        }
      } else {
        setError(data.message || 'Payment not found')
      }
    } catch (err) {
      setError('Could not check payment. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async () => {
    if (claiming) return
    setClaiming(true)
    setError('')

    try {
      const res = await fetch(`${API}/momo/claim`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ trxId: trxId.trim() })
      })
      const data = await res.json()

      if (data.status === 'success') {
        setResult(data.data)
        setPayment(null)
      } else {
        setError(data.message || 'Claim failed')
      }
    } catch (err) {
      setError('Network error. Try again.')
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Claim MoMo Deposit</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Enter your MoMo transaction ID to credit your wallet</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">How it works</h3>
          <ol className="text-xs text-indigo-800 dark:text-indigo-400 space-y-1 list-decimal list-inside">
            <li>Send money to the MoMo number provided</li>
            <li>Copy the Transaction ID from your MoMo receipt</li>
            <li>Paste it below and click "Check Payment"</li>
            <li>Confirm the details and claim to credit your wallet</li>
          </ol>
        </div>

        {/* Search form */}
        <form onSubmit={handleCheck} className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Transaction ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              placeholder="e.g. 77820604706"
              className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || !trxId.trim()}
              className="px-5 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Check
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Payment found */}
        {payment && payment.claimable && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Payment Found</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Amount</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">GHS {payment.amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Sender</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{payment.senderName || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Network</span>
                <span className="text-sm text-gray-900 dark:text-white">{payment.network || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Transaction ID</span>
                <span className="text-sm font-mono text-gray-900 dark:text-white">{payment.trxId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Received</span>
                <span className="text-sm text-gray-900 dark:text-white">{new Date(payment.receivedAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {claiming ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Claiming...</>
                ) : (
                  <><Wallet className="w-4 h-4" /> Claim GHS {payment.amount?.toFixed(2)} to Wallet</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {result && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-1">Wallet Credited!</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">GHS {result.amount?.toFixed(2)}</p>
            <p className="text-sm text-green-700 dark:text-green-400 mb-1">From: {result.senderName}</p>
            <p className="text-xs text-green-600 dark:text-green-500 font-mono mb-4">TrxId: {result.trxId}</p>
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              New Balance: GHS {result.newBalance?.toFixed(2)}
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
