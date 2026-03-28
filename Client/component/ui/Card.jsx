export default function Card({ children, className = '', elevated = false }) {
  return (
    <div className={`
      bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg
      ${elevated ? 'shadow-sm' : ''} ${className}
    `}>
      {children}
    </div>
  )
}
