'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

const navigation = [
  { section: 'Core', items: [
    { name: 'Users', href: '/admin', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' },
    { name: 'Orders', href: '/admin/orders', icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15' },
    { name: 'Transactions', href: '/admin/transactions', icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75' },
  ]},
  { section: 'Reports', items: [
    { name: 'Daily Summary', href: '/admin/daily', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' },
    { name: 'Today Stats', href: '/admin/today', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
    { name: 'Reports', href: '/admin/reports', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
  ]},
  { section: 'Operations', items: [
    { name: 'Processor', href: '/admin/processor', icon: 'M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7' },
    { name: 'Stock Control', href: '/admin/stock', icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
    { name: 'Data Prices', href: '/admin/data-prices', icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ]},
  { section: 'Stores', items: [
    { name: 'Store Dashboard', href: '/admin_stores', icon: 'M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72' },
  ]},
]

export default function AdminLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    setMounted(true)
    const user = JSON.parse(localStorage.getItem('userData') || '{}')
    if (user.role !== 'admin') {
      router.push('/')
      return
    }
    setUserName(user.name || 'Admin')
  }, [])

  const dark = mounted && resolvedTheme === 'dark'

  const isActiveRoute = (href) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Hide root navbar/footer */}
      <style jsx global>{`
        body > div > nav,
        body > div > footer,
        body > div > main > div[class*="whatsapp"],
        body > div > main > div[class*="promo"] {
          display: none !important;
        }
      `}</style>

      <div className={`min-h-screen ${dark ? 'bg-gray-950 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed top-0 left-0 z-50 h-full w-64 flex flex-col
          ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
          border-r transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}>
          {/* Logo */}
          <div className={`h-16 flex items-center justify-between px-5 border-b ${dark ? 'border-gray-800' : 'border-gray-200'} flex-shrink-0`}>
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
              </div>
              <div>
                <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Data Hustle</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Admin Panel</p>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className={`lg:hidden p-1.5 rounded-lg ${dark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
            {navigation.map((group) => (
              <div key={group.section}>
                <p className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
                  {group.section}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActiveRoute(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                          ${active
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                            : dark
                              ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }
                        `}
                      >
                        <svg className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : dark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                        </svg>
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom */}
          <div className={`p-3 border-t ${dark ? 'border-gray-800' : 'border-gray-200'} flex-shrink-0 space-y-2`}>
            <Link
              href="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${dark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              Back to Site
            </Link>
            <button
              onClick={() => setTheme(dark ? 'light' : 'dark')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${dark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {dark
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                }
              </svg>
              {mounted && (dark ? 'Light Mode' : 'Dark Mode')}
            </button>
            <div className={`px-3 py-2 text-xs ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
              Logged in as <span className={`font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{userName}</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:pl-64">
          {/* Top bar */}
          <header className={`
            sticky top-0 z-30 h-14 border-b backdrop-blur-xl
            ${dark ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-gray-200'}
          `}>
            <div className="flex items-center justify-between h-full px-4 lg:px-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className={`lg:hidden p-2 rounded-lg ${dark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                </button>

                {/* Breadcrumb */}
                <div className="hidden sm:flex items-center text-sm">
                  <Link href="/admin" className={`${dark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                    Admin
                  </Link>
                  {pathname !== '/admin' && (() => {
                    const current = navigation.flatMap(g => g.items).find(item => isActiveRoute(item.href) && item.href !== '/admin')
                    return current ? (
                      <>
                        <svg className={`w-4 h-4 mx-1.5 ${dark ? 'text-gray-700' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                        <span className={`font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{current.name}</span>
                      </>
                    ) : null
                  })()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/admin/processor"
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                    pathname === '/admin/processor'
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                      : dark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Processor
                </Link>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
