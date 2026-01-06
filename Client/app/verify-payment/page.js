'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Clock, Package, Home, RefreshCw, Database } from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api/v1';
const STORE_NAME = 'sam-1756835542914'; // Same store as DataMart

export default function VerifyPaymentClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [status, setStatus] = useState('verifying'); // verifying, success, failed, error
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState('');
  
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const transactionId = searchParams.get('transaction');

  useEffect(() => {
    if (reference) {
      verifyPayment(reference);
    } else if (transactionId) {
      fetchOrderStatus(transactionId);
    } else {
      setStatus('error');
      setError('No payment reference found');
    }
  }, [reference, transactionId]);

  const verifyPayment = async (ref) => {
    try {
      // The backend should have already verified via webhook
      // This is just to fetch the order status
      const response = await fetch(`${API_BASE}/agent-stores/stores/${STORE_NAME}/payment/status/${ref}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setOrderDetails(data.data);
        setStatus(data.data.orderStatus === 'completed' ? 'success' : 
                  data.data.orderStatus === 'failed' ? 'failed' : 'processing');
      } else {
        // Try fetching by transaction ID pattern
        const txnResponse = await fetch(`${API_BASE}/agent-stores/stores/${STORE_NAME}/payment/status/${ref}`);
        const txnData = await txnResponse.json();
        
        if (txnData.status === 'success') {
          setOrderDetails(txnData.data);
          setStatus(txnData.data.orderStatus === 'completed' ? 'success' : 'processing');
        } else {
          setStatus('error');
          setError('Could not verify payment status');
        }
      }
    } catch (err) {
      console.error('Verification error:', err);
      setStatus('error');
      setError('Failed to verify payment. Please check your order history.');
    }
  };

  const fetchOrderStatus = async (txnId) => {
    try {
      const response = await fetch(`${API_BASE}/agent-stores/stores/${STORE_NAME}/payment/status/${txnId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setOrderDetails(data.data);
        setStatus(data.data.orderStatus === 'completed' ? 'success' : 
                  data.data.orderStatus === 'failed' ? 'failed' : 'processing');
      } else {
        setStatus('error');
        setError('Order not found');
      }
    } catch (err) {
      setStatus('error');
      setError('Failed to fetch order status');
    }
  };

  const getNetworkName = (network) => {
    if (network === 'YELLO') return 'MTN';
    if (network === 'TELECEL') return 'Telecel';
    if (network === 'AT_PREMIUM') return 'AirtelTigo';
    return network;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Data Hustle</span>
          </div>
        </div>

        {/* Verifying State */}
        {status === 'verifying' && (
          <div className="bg-gray-800 rounded-2xl p-8 text-center shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verifying Payment</h2>
            <p className="text-gray-400">Please wait while we confirm your payment...</p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Payment Successful!</h2>
              <p className="text-green-100 mt-1">Your data bundle is on the way</p>
            </div>

            {/* Order Details */}
            <div className="p-6">
              {orderDetails && (
                <div className="space-y-4">
                  <div className="bg-gray-700/50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Product</p>
                        <p className="text-white font-semibold">
                          {getNetworkName(orderDetails.product?.network)} {orderDetails.product?.capacity}GB
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Amount</p>
                        <p className="text-white font-semibold">GH₵ {orderDetails.amount?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Recipient</p>
                        <p className="text-white font-semibold">{orderDetails.phoneNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Reference</p>
                        <p className="text-white font-mono text-sm">{orderDetails.transactionId}</p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="bg-indigo-900/30 border border-indigo-600/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <span className="text-indigo-400 font-semibold text-sm">Delivery Time</span>
                    </div>
                    <p className="text-indigo-200 text-sm">
                      Usually <strong>10 minutes - 24 hours</strong>
                    </p>
                    <p className="text-indigo-300/70 text-xs mt-1">
                      You'll receive an SMS when your data is delivered
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <Link
                  href="/quick-buy"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors"
                >
                  <Package className="w-5 h-5" />
                  Buy More Data
                </Link>
                <Link
                  href="/"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors"
                >
                  <Home className="w-5 h-5" />
                  Go Home
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {status === 'processing' && (
          <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <Clock className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Order Processing</h2>
              <p className="text-yellow-100 mt-1">Your payment was received</p>
            </div>

            <div className="p-6">
              {orderDetails && (
                <div className="bg-gray-700/50 rounded-xl p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Product</p>
                      <p className="text-white font-semibold">
                        {getNetworkName(orderDetails.product?.network)} {orderDetails.product?.capacity}GB
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Recipient</p>
                      <p className="text-white font-semibold">{orderDetails.phoneNumber}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-xl p-4 mb-6">
                <p className="text-yellow-200 text-sm text-center">
                  Your order is being processed. You'll receive your data bundle shortly.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-xl transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  Check Status
                </button>
                <Link
                  href="/quick-buy"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors"
                >
                  <Home className="w-5 h-5" />
                  Go Back
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Failed State */}
        {status === 'failed' && (
          <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-red-500 to-rose-500 p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <XCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Payment Failed</h2>
              <p className="text-red-100 mt-1">Something went wrong</p>
            </div>

            <div className="p-6">
              <div className="bg-red-900/30 border border-red-600/50 rounded-xl p-4 mb-6">
                <p className="text-red-200 text-sm text-center">
                  {error || 'Your payment could not be processed. Please try again.'}
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  href="/quick-buy"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </Link>
                <Link
                  href="/"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors"
                >
                  <Home className="w-5 h-5" />
                  Go Home
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <XCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Verification Error</h2>
              <p className="text-gray-300 mt-1">Could not verify payment</p>
            </div>

            <div className="p-6">
              <div className="bg-gray-700/50 rounded-xl p-4 mb-6">
                <p className="text-gray-300 text-sm text-center">
                  {error || 'We could not verify your payment. If you were charged, please contact support.'}
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  href="/quick-buy"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors"
                >
                  <Package className="w-5 h-5" />
                  Buy Data
                </Link>
                <Link
                  href="/"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors"
                >
                  <Home className="w-5 h-5" />
                  Go Home
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Need help? Contact us via WhatsApp
        </p>
      </div>
    </div>
  );
}