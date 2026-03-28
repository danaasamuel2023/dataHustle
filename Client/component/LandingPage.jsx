'use client'
import Link from 'next/link'
import { ArrowRight, Zap, Shield, Clock, Phone, ChevronRight, Users, CheckCircle } from 'lucide-react'

const PRICING = {
  MTN: [
    { gb: '1', price: '4.20' },
    { gb: '5', price: '22.30' },
    { gb: '10', price: '41.00' },
    { gb: '20', price: '79.00' },
  ],
  Telecel: [
    { gb: '5', price: '19.50' },
    { gb: '10', price: '36.50' },
    { gb: '20', price: '69.80' },
    { gb: '50', price: '171.50' },
  ],
  AirtelTigo: [
    { gb: '1', price: '3.95' },
    { gb: '5', price: '19.50' },
    { gb: '10', price: '38.50' },
    { gb: '30', price: '115.00' },
  ],
}

const networkStyles = {
  MTN: { bg: 'bg-yellow-400', text: 'text-black', label: 'MTN' },
  Telecel: { bg: 'bg-red-600', text: 'text-white', label: 'Telecel' },
  AirtelTigo: { bg: 'bg-purple-600', text: 'text-white', label: 'AirtelTigo' },
}

export default function LandingPage() {
  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Hero */}
      <section className="px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
            <Zap className="w-3 h-3" />
            Ghana's trusted data marketplace
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
            Cheap data bundles,<br />delivered instantly.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Buy MTN, Telecel, and AirtelTigo data at wholesale prices. No expiry on MTN bundles. Trusted by thousands of resellers across Ghana.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/buy"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-md transition-colors"
            >
              Buy Data Now
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/SignUp"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Users className="w-4 h-4 text-indigo-500" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">10,000+</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Active resellers</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">5 min</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg. delivery</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Shield className="w-4 h-4 text-indigo-500" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">Secure</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Paystack payments</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Phone className="w-4 h-4 text-indigo-500" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">3 Networks</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">MTN, Telecel, AT</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Wholesale prices, no hidden fees</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Compare our rates across all networks</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(PRICING).map(([network, bundles]) => {
              const style = networkStyles[network]
              return (
                <div key={network} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className={`${style.bg} px-4 py-3`}>
                    <h3 className={`text-sm font-bold ${style.text}`}>{style.label}</h3>
                    {network === 'MTN' && <p className={`text-xs ${style.text} opacity-80`}>Non-expiry bundles</p>}
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {bundles.map((b) => (
                      <div key={b.gb} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{b.gb}GB</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">GH₵{b.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
                    <Link href="/buy" className="text-xs font-medium text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                      View all bundles <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 bg-gray-50 dark:bg-gray-800/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">How it works</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Get data in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Choose a bundle', desc: 'Select your network and data size. MTN, Telecel, or AirtelTigo.' },
              { step: '2', title: 'Enter phone number', desc: 'Type the number that should receive the data bundle.' },
              { step: '3', title: 'Pay and receive', desc: 'Pay with MoMo or card. Data is delivered within minutes.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 mx-auto mb-3 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Data Hustle */}
      <section className="px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Why resellers choose us</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: 'Cheapest rates in Ghana', desc: 'MTN 1GB from GH₵4.20. We offer wholesale prices to everyone.' },
              { title: 'MTN bundles never expire', desc: 'Non-expiry data that stays until you use it. No monthly reset.' },
              { title: 'Instant delivery', desc: 'Most orders delivered within 5 minutes. Track your order in real-time.' },
              { title: 'No account needed', desc: 'Buy data as a guest with MoMo. Or create an account for bulk features.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 bg-gray-50 dark:bg-gray-800/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Start reselling today</h2>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Create a free account to access bulk purchasing, wallet deposits, and your own agent store.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/SignUp"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-md transition-colors"
            >
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/buy"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-gray-700 dark:text-gray-300 font-medium hover:text-indigo-500 transition-colors"
            >
              Or buy as guest
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
