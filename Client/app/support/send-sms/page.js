'use client'
import { useState } from 'react'
import { useTheme } from 'next-themes'

const API = 'https://api.datahustle.shop/api/support'

export default function SendSmsPage() {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // Quick search to find user
  const [searchQuery, setSearchQuery] = useState('')
  const [foundUser, setFoundUser] = useState(null)
  const [searching, setSearching] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  const headers = { 'x-auth-token': token, 'Content-Type': 'application/json' }

  const searchUser = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setFoundUser(null)
    try {
      const res = await fetch(`${API}/customers?q=${encodeURIComponent(searchQuery.trim())}&page=1&limit=5`, { headers })
      const data = await res.json()
      if (data.status === 'success' && data.data?.users?.length > 0) {
        const u = data.data.users[0]
        setFoundUser(u)
        setPhone(u.phoneNumber || '')
      }
    } catch (e) {}
    setSearching(false)
  }

  const templates = [
    { label: 'Refund Notification', text: 'Hello! Your wallet has been refunded for a failed order. Please check your balance on Data Hustle. Thank you!' },
    { label: 'Order Completed', text: 'Hello! Your data order has been successfully delivered. Thank you for choosing Data Hustle!' },
    { label: 'Account Approved', text: 'Welcome to Data Hustle! Your account has been approved. You can now deposit funds and start buying data bundles.' },
    { label: 'Deposit Credited', text: 'Hello! Your deposit has been verified and credited to your wallet. Thank you for using Data Hustle!' },
  ]

  const handleSend = async (e) => {
    e.preventDefault()
    if (!phone.trim() || !message.trim()) return
    setSending(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(`${API}/send-sms`, {
        method: 'POST', headers,
        body: JSON.stringify({ phoneNumber: phone.trim(), message: message.trim() })
      })
      const data = await res.json()
      if (data.status === 'success') {
        setResult(data.message)
        setMessage('')
      } else {
        setError(data.message || 'SMS failed')
      }
    } catch (e) {
      setError('Failed to send SMS')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Send SMS</h1>
        <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Send SMS notifications to customers</p>
      </div>

      {/* User lookup */}
      <div className={`p-4 rounded-xl border ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <p className={`text-sm font-medium mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>Find Customer (optional)</p>
        <div className="flex gap-2">
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Email or phone..." onKeyDown={(e) => e.key === 'Enter' && searchUser()}
            className={`flex-1 px-3 py-2 rounded-lg border text-sm ${dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`} />
          <button onClick={searchUser} disabled={searching}
            className="px-4 py-2 bg-indigo-500 text-white text-sm rounded-lg">{searching ? '...' : 'Find'}</button>
        </div>
        {foundUser && (
          <div className={`mt-2 p-2 rounded-lg ${dark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{foundUser.name}</p>
            <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{foundUser.email} | {foundUser.phoneNumber}</p>
          </div>
        )}
      </div>

      {/* SMS Form */}
      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <label className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>Phone Number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0XXXXXXXXX"
            className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm ${dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`} />
        </div>

        {/* Templates */}
        <div>
          <label className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>Quick Templates</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {templates.map(t => (
              <button key={t.label} type="button" onClick={() => setMessage(t.text)}
                className={`px-2 py-1 rounded-md text-xs ${dark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Type your message..."
            className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm resize-none ${dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`} />
          <p className={`text-xs mt-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{message.length}/160 characters</p>
        </div>

        {error && <div className={`p-2 rounded-lg text-sm ${dark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>{error}</div>}
        {result && <div className={`p-2 rounded-lg text-sm ${dark ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-600'}`}>{result}</div>}

        <button type="submit" disabled={sending || !phone.trim() || !message.trim()}
          className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400 text-white font-medium rounded-lg text-sm">
          {sending ? 'Sending...' : 'Send SMS'}
        </button>
      </form>
    </div>
  )
}
