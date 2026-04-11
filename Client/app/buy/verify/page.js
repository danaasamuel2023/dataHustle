'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Clock, Package, Database } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.datahustle.shop';

function VerifyContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const [status, setStatus] = useState('verifying'); // verifying, success, failed, error
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    if (reference) {
      verifyPayment(reference);
    } else {
      setStatus('error');
      setMessage('No payment reference found.');
    }
  }, [reference]);

  const verifyPayment = async (ref) => {
    try {
      const response = await fetch(`${API}/api/guest/verify?reference=${ref}`);
      const data = await response.json();

      if (data.status === 'success') {
        setStatus('success');
        setOrder(data.data);
        setMessage(data.message || 'Payment verified! Your order is being processed.');
      } else {
        setStatus('failed');
        setMessage(data.message || 'Payment verification failed.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Could not verify payment. Please contact support.');
    }
  };

  const getNetworkName = (network) => {
    if (network === 'YELLO') return 'MTN';
    if (network === 'TELECEL') return 'Telecel';
    if (network === 'AT_PREMIUM') return 'AirtelTigo';
    return network;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-indigo-500">Data Hustle</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Status Header */}
          <div className={`p-8 text-center ${
            status === 'verifying' ? 'bg-indigo-500' :
            status === 'success' ? 'bg-green-500' :
            'bg-red-500'
          } text-white`}>
            {status === 'verifying' && <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" />}
            {status === 'success' && <CheckCircle className="w-16 h-16 mx-auto mb-4" />}
            {(status === 'failed' || status === 'error') && <XCircle className="w-16 h-16 mx-auto mb-4" />}

            <h1 className="text-2xl font-bold mb-2">
              {status === 'verifying' ? 'Verifying Payment' :
               status === 'success' ? 'Payment Successful!' :
               'Payment Failed'}
            </h1>
            <p className="text-white/90">{message}</p>
          </div>

          {/* Order Details */}
          {order && status === 'success' && (
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Reference</span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white">{order.reference}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Network</span>
                  <span className="font-medium text-gray-900 dark:text-white">{getNetworkName(order.network)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Bundle</span>
                  <span className="font-bold text-gray-900 dark:text-white">{order.capacity}GB</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Amount</span>
                  <span className="font-bold text-gray-900 dark:text-white">GH₵{order.price?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Recipient</span>
                  <span className="font-medium text-gray-900 dark:text-white">{order.recipientPhone}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Clock className="w-3.5 h-3.5" />
                    Processing
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-indigo-900 dark:text-indigo-300 text-sm">What happens next?</p>
                    <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">
                      Your data bundle will be delivered within <strong>10 minutes to 24 hours</strong>.
                      You can track your order on the buy page using your phone number or reference.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-6 pt-0">
            <div className="flex gap-3">
              <Link href="/buy" className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl text-center transition-colors">
                {status === 'success' ? 'Buy More Data' : 'Try Again'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuyVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
