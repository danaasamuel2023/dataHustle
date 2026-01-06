'use client'

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, Loader2, Home, RefreshCw, Copy, Phone, Database } from 'lucide-react';

// ============================================
// MAIN CLIENT COMPONENT (uses useSearchParams)
// ============================================
function VerifyPaymentClient() {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Verifying your payment...');
  const [orderData, setOrderData] = useState(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const statusParam = searchParams.get('status');

  useEffect(() => {
    // If status is passed directly from redirect
    if (statusParam === 'success') {
      setStatus('success');
      setMessage('Payment successful! Your data bundle order has been placed.');
      if (reference) fetchOrderDetails(reference);
      return;
    }
    
    if (statusParam === 'failed') {
      setStatus('failed');
      setMessage('Payment failed. Please try again.');
      return;
    }

    // Otherwise verify with API
    if (reference) {
      verifyPayment(reference);
    } else {
      setStatus('failed');
      setMessage('No payment reference found.');
    }
  }, [reference, statusParam]);

  const fetchOrderDetails = async (ref) => {
    try {
      const response = await axios.get(`https://datahustle.onrender.com/api/momo-purchase/order/${ref}`);
      if (response.data.status === 'success') {
        setOrderData(response.data.data);
      }
    } catch (error) {
      console.log('Could not fetch order details:', error);
    }
  };

  const verifyPayment = async (ref) => {
    let attempts = 0;
    const maxAttempts = 10;

    const checkStatus = async () => {
      try {
        const response = await axios.get(`https://datahustle.onrender.com/api/momo-purchase/verify?reference=${ref}`, {
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.data.status === 'success') {
          setStatus('success');
          setMessage('Payment successful! Your data bundle order has been placed.');
          setOrderData(response.data.data);
          return true;
        } else if (response.data.status === 'failed') {
          setStatus('failed');
          setMessage(response.data.message || 'Payment failed. Please try again.');
          return true;
        }
        return false;
      } catch (error) {
        console.error('Verification error:', error);
        if (attempts >= maxAttempts) {
          setStatus('pending');
          setMessage('Payment is still processing. Please check your order history in a few minutes.');
          return true;
        }
        return false;
      }
    };

    const poll = async () => {
      const complete = await checkStatus();
      if (!complete && attempts < maxAttempts) {
        attempts++;
        setTimeout(poll, 3000);
      }
    };

    poll();
  };

  const copyReference = () => {
    navigator.clipboard.writeText(reference || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusConfig = {
    processing: {
      icon: <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />,
      bgClass: 'bg-indigo-50 dark:bg-indigo-900/20',
      iconBgClass: 'bg-indigo-100 dark:bg-indigo-900/30',
      titleClass: 'text-indigo-600 dark:text-indigo-400'
    },
    success: {
      icon: <CheckCircle className="w-16 h-16 text-emerald-500" />,
      bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconBgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
      titleClass: 'text-emerald-600 dark:text-emerald-400'
    },
    failed: {
      icon: <XCircle className="w-16 h-16 text-red-500" />,
      bgClass: 'bg-red-50 dark:bg-red-900/20',
      iconBgClass: 'bg-red-100 dark:bg-red-900/30',
      titleClass: 'text-red-600 dark:text-red-400'
    },
    pending: {
      icon: <Clock className="w-16 h-16 text-amber-500" />,
      bgClass: 'bg-amber-50 dark:bg-amber-900/20',
      iconBgClass: 'bg-amber-100 dark:bg-amber-900/30',
      titleClass: 'text-amber-600 dark:text-amber-400'
    }
  };

  const config = statusConfig[status];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
              <span className="text-white font-black text-sm">DH</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              Data<span className="text-indigo-500">Hustle</span>
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">
          {/* Status Header */}
          <div className={`${config.bgClass} p-6 text-center`}>
            <div className={`w-24 h-24 mx-auto ${config.iconBgClass} rounded-full flex items-center justify-center mb-4`}>
              {config.icon}
            </div>
            <h1 className={`text-2xl font-bold ${config.titleClass}`}>
              {status === 'processing' && 'Verifying Payment'}
              {status === 'success' && 'Payment Successful!'}
              {status === 'failed' && 'Payment Failed'}
              {status === 'pending' && 'Payment Pending'}
            </h1>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {message}
            </p>

            {/* Order Details (Success) */}
            {status === 'success' && orderData && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Database className="w-4 h-4" />
                    <span className="text-sm">Bundle</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {orderData.capacity}GB {orderData.network}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">Recipient</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {orderData.phoneNumber || orderData.recipient}
                  </span>
                </div>

                {orderData.pricing && (
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Total Paid</span>
                      <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                        GHS {orderData.pricing.totalPaid?.toFixed(2) || orderData.total?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {orderData.orderReference && (
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Order #</span>
                      <span className="font-mono text-sm text-gray-900 dark:text-white">
                        {orderData.orderReference}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reference Box */}
            {reference && (
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reference</p>
                    <p className="font-mono text-sm text-gray-800 dark:text-gray-200 break-all">
                      {reference}
                    </p>
                  </div>
                  <button
                    onClick={copyReference}
                    className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Delivery Notice (Success) */}
            {status === 'success' && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  <strong>📱 Delivery Time:</strong> Your data bundle will be delivered within 5 minutes to 4 hours depending on network conditions.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {status === 'success' && (
                <Link href="/buy" className="block">
                  <button className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors">
                    Buy More Data
                  </button>
                </Link>
              )}

              {status === 'failed' && (
                <Link href="/buy" className="block">
                  <button className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    Try Again
                  </button>
                </Link>
              )}

              {status === 'pending' && (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Check Again
                </button>
              )}

              <Link href="/" className="block">
                <button className="w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Home className="w-5 h-5" />
                  Back to Home
                </button>
              </Link>
            </div>

            {/* Support Notice */}
            {(status === 'failed' || status === 'pending') && (
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                Need help? Contact support with your reference number.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          Data Hustle © 2026
        </p>
      </div>
    </div>
  );
}

// ============================================
// LOADING FALLBACK COMPONENT
// ============================================
function VerifyPaymentFallback() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Verifying payment...</p>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE EXPORT (with Suspense boundary)
// ============================================
export default function VerifyPaymentPage() {
  return (
    <Suspense fallback={<VerifyPaymentFallback />}>
      <VerifyPaymentClient />
    </Suspense>
  );
}