'use client'
import { Wallet, CreditCard } from 'lucide-react'

export default function PaymentMethodSelector({ selected, onSelect, walletBalance = 0, price = 0 }) {
  const canPayWithWallet = walletBalance >= price
  const formatMoney = (v) => `GH₵${(v || 0).toFixed(2)}`

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</p>
      <div className="grid grid-cols-2 gap-3">
        {/* Wallet */}
        <button
          type="button"
          onClick={() => canPayWithWallet && onSelect('wallet')}
          disabled={!canPayWithWallet}
          className={`
            relative flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center
            ${selected === 'wallet'
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : canPayWithWallet
                ? 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
            }
          `}
        >
          <Wallet className={`w-5 h-5 ${selected === 'wallet' ? 'text-indigo-500' : 'text-gray-400'}`} />
          <span className={`text-xs font-medium ${selected === 'wallet' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
            Wallet
          </span>
          <span className={`text-[10px] ${canPayWithWallet ? 'text-gray-500' : 'text-red-500'}`}>
            {formatMoney(walletBalance)}
          </span>
          {selected === 'wallet' && (
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
          )}
        </button>

        {/* Paystack */}
        <button
          type="button"
          onClick={() => onSelect('paystack')}
          className={`
            relative flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center
            ${selected === 'paystack'
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
            }
          `}
        >
          <CreditCard className={`w-5 h-5 ${selected === 'paystack' ? 'text-indigo-500' : 'text-gray-400'}`} />
          <span className={`text-xs font-medium ${selected === 'paystack' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
            Paystack
          </span>
          <span className="text-[10px] text-gray-500">MoMo / Card</span>
          {selected === 'paystack' && (
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
          )}
        </button>
      </div>
    </div>
  )
}
