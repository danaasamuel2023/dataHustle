'use client'
import { forwardRef } from 'react'

const Input = forwardRef(function Input({ label, icon: Icon, error, className = '', ...props }, ref) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2 bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700 rounded-md
            text-sm text-gray-900 dark:text-white
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-red-400 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
})

export default Input
