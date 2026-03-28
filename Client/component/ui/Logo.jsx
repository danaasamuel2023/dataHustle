'use client'

/**
 * Data Hustle Logo
 * A signal/data icon with ascending bars representing growth + connectivity.
 * The bars form a subtle "d" shape. Indigo primary.
 */

export function LogoIcon({ size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="40" height="40" rx="10" fill="#6366F1" />
      {/* Signal bars — ascending left to right */}
      <rect x="8" y="26" width="5" height="6" rx="1.5" fill="white" opacity="0.5" />
      <rect x="15" y="20" width="5" height="12" rx="1.5" fill="white" opacity="0.7" />
      <rect x="22" y="14" width="5" height="18" rx="1.5" fill="white" opacity="0.85" />
      <rect x="29" y="8" width="5" height="24" rx="1.5" fill="white" />
      {/* Small dot — like a signal broadcast */}
      <circle cx="31.5" cy="6" r="2" fill="white" opacity="0.6" />
    </svg>
  )
}

export function LogoFull({ size = 36, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoIcon size={size} />
      <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
        Data<span className="text-indigo-500">Hustle</span>
      </span>
    </div>
  )
}

export function LogoFullWhite({ size = 36, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoIcon size={size} />
      <span className="text-xl font-bold text-white tracking-tight">
        Data<span className="text-indigo-300">Hustle</span>
      </span>
    </div>
  )
}

export default LogoFull
