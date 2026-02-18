'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

export default function AdminStoreLayout({ children }) {
  const pathname = usePathname()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const darkMode = resolvedTheme === 'dark'

  const navigation = [
    { name: 'Dashboard', href: '/admin_stores' },
    { name: 'Agents & Balances', href: '/admin_stores/agents' },
    { name: 'Agent Stores', href: '/admin_stores/manage' },
    { name: 'Investigation', href: '/admin_stores/investigation' },
    { name: 'Wallet Fixes', href: '/admin_stores/wallet-fixes' },
    { name: 'Audit Logs', href: '/admin_stores/audit-logs' },
    { name: 'Stuck Orders', href: '/admin_stores/stuck-orders' },
    { name: 'Withdrawals', href: '/admin_stores/withdrawal' },
    { name: 'Provider Settings', href: '/admin_stores/withdrawal-settings' },
  ]

  const isActiveRoute = (href) => {
    if (href === '/admin_stores') return pathname === href
    return pathname.startsWith(href)
  }

  const toggleTheme = () => {
    setTheme(darkMode ? 'light' : 'dark')
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64
        ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
        border-r transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Logo */}
        <div className={`h-16 flex items-center justify-between px-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Store Admin
            </h1>
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Management Portal</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className={`lg:hidden p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = isActiveRoute(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive
                    ? darkMode
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-500 text-white'
                    : darkMode
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Theme Toggle */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <button
            onClick={toggleTheme}
            className={`
              w-full px-4 py-3 rounded-lg text-sm font-medium transition-all
              ${darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {mounted && (darkMode ? 'Light Mode' : 'Dark Mode')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className={`
          sticky top-0 z-30 h-16 border-b backdrop-blur-lg
          ${darkMode
            ? 'bg-gray-950/80 border-gray-800'
            : 'bg-white/80 border-gray-200'
          }
        `}>
          <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb */}
            <div className="hidden lg:flex items-center text-sm">
              <Link href="/admin_stores" className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                Dashboard
              </Link>
              {pathname !== '/admin_stores' && (
                <>
                  <span className={`mx-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>/</span>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {navigation.find(item => isActiveRoute(item.href) && item.href !== '/admin_stores')?.name}
                  </span>
                </>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Back to Admin
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
