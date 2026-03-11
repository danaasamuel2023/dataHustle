'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

export default function SupportLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [userData, setUserData] = useState(null)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem('authToken')
    const user = JSON.parse(localStorage.getItem('userData') || '{}')

    if (!token) {
      router.push('/SignIn')
      return
    }

    if (user.role !== 'worker' && user.role !== 'admin') {
      router.push('/')
      return
    }

    setUserData(user)
    setAuthorized(true)
  }, [])

  const darkMode = resolvedTheme === 'dark'

  const navigation = [
    { name: 'Dashboard', href: '/support', icon: '📊' },
    { name: 'Customer Search', href: '/support/customers', icon: '🔍' },
    { name: 'Failed Orders', href: '/support/failed-orders', icon: '❌' },
    { name: 'Deposits', href: '/support/deposits', icon: '💰' },
    { name: 'Reports & Tickets', href: '/support/reports', icon: '🎫' },
    { name: 'Withdrawals', href: '/support/withdrawals', icon: '🏦' },
    { name: 'Agent Stores', href: '/support/stores', icon: '🏪' },
    { name: 'Team & Roles', href: '/support/team', icon: '👥' },
  ]

  const isActiveRoute = (href) => {
    if (href === '/support') return pathname === href
    return pathname.startsWith(href)
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
    router.push('/SignIn')
  }

  if (!mounted || !authorized) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors ${darkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 flex flex-col
        ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
        border-r transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Header */}
        <div className={`h-16 flex items-center justify-between px-5 border-b flex-shrink-0 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div>
            <h1 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Support Hub</h1>
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Data Hustle Team</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-gray-800/50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = isActiveRoute(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    : darkMode ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className={`p-4 border-t space-y-2 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userData?.name || 'Support'}</p>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{userData?.role}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme(darkMode ? 'light' : 'dark')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className={`
          sticky top-0 z-30 h-14 border-b backdrop-blur-lg flex items-center justify-between px-4
          ${darkMode ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-gray-200'}
        `}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-800/50">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="hidden lg:block text-sm">
            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Support</span>
            {pathname !== '/support' && (
              <>
                <span className={`mx-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>/</span>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {navigation.find(item => isActiveRoute(item.href) && item.href !== '/support')?.name || ''}
                </span>
              </>
            )}
          </div>
          <Link href="/" className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
            Back to App
          </Link>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
