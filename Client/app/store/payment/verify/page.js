'use client'

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { CheckCircle, XCircle, Clock, Loader2, RefreshCw, Copy, Phone, Database, ShoppingBag } from 'lucide-react';

const API_BASE = 'https://datahustle.onrender.com/api/v1';

function StoreVerifyClient() {
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const [orderData, setOrderData] = useState(null);
  const [copied, setCopied] = useState(false);
  const searchParams = useSearchParams();

  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const storeSlug = searchParams.get('store');

  useEffect(() => {
    if (reference && storeSlug) {
      verifyPayment(reference, storeSlug);
    } else if (!reference) {
      setStatus('failed');
      setMessage('No payment reference found.');
    } else if (!storeSlug) {
      setStatus('failed');
      setMessage('Store information missing.');
    }
  }, [reference, storeSlug]);

  const verifyPayment = async (ref, slug) => {
    let attempts = 0;
    const maxAttempts = 12;

    const checkStatus = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/agent-stores/stores/${slug}/payment/verify?reference=${ref}`
        );

        const data = response.data?.data;

        if (response.data.status === 'success' && data) {
          setOrderData(data);

          if (data.orderStatus === 'completed') {
            setStatus('success');
            setMessage('Payment successful! Your data bundle has been delivered.');
            return true;
          } else if (data.orderStatus === 'processing') {
            setStatus('processing');
            setMessage('Payment confirmed! Delivering your data bundle...');
            // Keep polling - it might complete
            if (attempts >= maxAttempts) {
              return true; // Stop polling but show processing state
            }
            return false;
          } else if (data.orderStatus === 'failed') {
            setStatus('failed');
            setMessage('Order failed. Please contact support with your reference number.');
            return true;
          }
        }

        if (response.data.status === 'pending') {
          setStatus('verifying');
          setMessage('Payment is being verified...');
          return false;
        }

        return false;
      } catch (error) {
        console.error('Verification error:', error);
        if (attempts >= maxAttempts) {
          setStatus('pending');
          setMessage('Verification is taking longer than expected. Your order will be processed shortly.');
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
    verifying: {
      icon: <Loader2 className="w-14 h-14 text-indigo-500 animate-spin" />,
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
      title: 'Verifying Payment',
      titleColor: 'text-indigo-600 dark:text-indigo-400'
    },
    processing: {
      icon: <Loader2 className="w-14 h-14 text-blue-500 animate-spin" />,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      title: 'Processing Order',
      titleColor: 'text-blue-600 dark:text-blue-400'
    },
    success: {
      icon: <CheckCircle className="w-14 h-14 text-emerald-500" />,
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      title: 'Order Complete!',
      titleColor: 'text-emerald-600 dark:text-emerald-400'
    },
    failed: {
      icon: <XCircle className="w-14 h-14 text-red-500" />,
      bg: 'bg-red-50 dark:bg-red-900/20',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      title: 'Order Failed',
      titleColor: 'text-red-600 dark:text-red-400'
    },
    pending: {
      icon: <Clock className="w-14 h-14 text-amber-500" />,
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      title: 'Order Pending',
      titleColor: 'text-amber-600 dark:text-amber-400'
    }
  };

  const config = statusConfig[status];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">
          {/* Status Header */}
          <div className={`${config.bg} p-6 text-center`}>
            <div className={`w-20 h-20 mx-auto ${config.iconBg} rounded-full flex items-center justify-center mb-4`}>
              {config.icon}
            </div>
            <h1 className={`text-xl font-bold ${config.titleColor}`}>
              {config.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {message}
            </p>
          </div>

          {/* Order Details */}
          <div className="p-5">
            {orderData && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4 space-y-3">
                {/* Product */}
                {orderData.network && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Database className="w-4 h-4" />
                      <span className="text-sm">Product</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {orderData.network} {orderData.capacity}{orderData.capacityUnit || 'GB'}
                    </span>
                  </div>
                )}

                {/* Amount */}
                {(orderData.sellingPrice || orderData.amount) && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <ShoppingBag className="w-4 h-4" />
                      <span className="text-sm">Amount</span>
                    </div>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      GH₵{(orderData.sellingPrice || orderData.amount)?.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Recipient */}
                {orderData.recipientPhone && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">Recipient</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {orderData.recipientPhone}
                    </span>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-600 pt-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                    orderData.orderStatus === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    orderData.orderStatus === 'processing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    orderData.orderStatus === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {orderData.orderStatus}
                  </span>
                </div>
              </div>
            )}

            {/* Transaction ID */}
            {reference && (
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Transaction ID</p>
                    <p className="font-mono text-xs text-gray-800 dark:text-gray-200 break-all">
                      {reference}
                    </p>
                  </div>
                  <button
                    onClick={copyReference}
                    className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Processing Notice */}
            {status === 'processing' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Your payment is confirmed. Data bundle delivery usually takes 1-5 minutes. You will receive an SMS when complete.
                </p>
              </div>
            )}

            {/* Success Notice */}
            {status === 'success' && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Your data bundle has been delivered successfully! Check your phone for confirmation.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              {(status === 'processing' || status === 'pending') && (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Check Again
                </button>
              )}

              {storeSlug && (
                <a href={`https://www.datavendo.shop/${storeSlug}`} className="block">
                  <button className="w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Back to Store
                  </button>
                </a>
              )}
            </div>

            {/* Support */}
            {(status === 'failed' || status === 'pending') && (
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                Need help? Contact support with your transaction ID.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function VerifyFallback() {
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

export default function StorePaymentVerifyPage() {
  return (
    <Suspense fallback={<VerifyFallback />}>
      <StoreVerifyClient />
    </Suspense>
  );
}
