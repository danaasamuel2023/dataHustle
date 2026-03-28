'use client'
import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'bg-indigo-500 hover:bg-indigo-600 text-white',
  secondary: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
  ghost: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  mtn: 'bg-[#FFCC00] hover:bg-[#E6B800] text-black',
  telecel: 'bg-[#E30613] hover:bg-[#B8050F] text-white',
  at: 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export default function Button({
  children, variant = 'primary', size = 'md', loading = false,
  disabled = false, className = '', ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-md
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
