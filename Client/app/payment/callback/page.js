'use client'

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

function PaymentCallbackClient() {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Verifying your payment...');
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  
  useEffect(() => {
    if (reference) {
      let checkCount = 0;
      const maxChecks = 10;
      
      const verifyPayment = async () => {
        try {
          const response = await axios.get(`https://datahustle.onrender.com/api/v1/verify-payment?reference=${reference}`);
          
          if (response.data.success) {
            setStatus('success');
            setMessage(`Your deposit of GHS ${response.data.data.amount.toFixed(2)} was successful! Funds have been added to your wallet.`);
            return true;
          } else if (response.data.data && response.data.data.status === 'failed') {
            setStatus('failed');
            setMessage('Payment failed. Please try again or contact support.');
            return true;
          } else if (checkCount < maxChecks) {
            return false;
          } else {
            setStatus('pending');
            setMessage('Your payment is still processing. Please check your account in a few minutes.');
            return true;
          }
        } catch (error) {
          console.error('Verification error:', error);
          if (checkCount < maxChecks) {
            return false;
          } else {
            setStatus('failed');
            setMessage('An error occurred while verifying your payment. Please contact support with your reference number.');
            return true;
          }
        }
      };
      
      const checkPaymentStatus = async () => {
        const isComplete = await verifyPayment();
        
        if (!isComplete) {
          checkCount++;
          setTimeout(checkPaymentStatus, 3000);
        }
      };
      
      checkPaymentStatus();
    }
  }, [reference]);

  useEffect(() => {
    if (status === 'success') {
      const redirectTimer = setTimeout(() => {
        router.push('/');
      }, 5000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [status, router]);

  const statusConfig = {
    processing: {
      icon: (
        <div className="relative">
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-24 h-24 rounded-full border-4 border-transparent 
                          border-t-blue-500 border-r-blue-500 dark:border-t-blue-400 dark:border-r-blue-400"></div>
          </motion.div>
          <motion.div
            className="absolute inset-2"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-20 h-20 rounded-full border-4 border-transparent 
                          border-b-purple-500 border-l-purple-500 dark:border-b-purple-400 dark:border-l-purple-400"></div>
          </motion.div>
          <motion.div
            className="absolute inset-8"
            animate={{ scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 
                          dark:from-blue-400 dark:to-purple-400"></div>
          </motion.div>
        </div>
      ),
      bgGradient: 'from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800',
      cardBg: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg',
      titleColor: 'text-gray-800 dark:text-gray-100'
    },
    success: {
      icon: (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-green-500 dark:bg-green-400 rounded-full opacity-20 
                        animate-ping"></div>
          <div className="relative bg-gradient-to-br from-green-400 to-emerald-600 
                        dark:from-green-300 dark:to-emerald-500 rounded-full p-6">
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </motion.svg>
          </div>
        </motion.div>
      ),
      bgGradient: 'from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800',
      cardBg: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg',
      titleColor: 'text-green-700 dark:text-green-400'
    },
    failed: {
      icon: (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-red-500 dark:bg-red-400 rounded-full opacity-20 
                        animate-pulse"></div>
          <div className="relative bg-gradient-to-br from-red-400 to-rose-600 
                        dark:from-red-300 dark:to-rose-500 rounded-full p-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </motion.div>
      ),
      bgGradient: 'from-red-50 to-rose-50 dark:from-gray-900 dark:to-gray-800',
      cardBg: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg',
      titleColor: 'text-red-700 dark:text-red-400'
    },
    pending: {
      icon: (
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative"
        >
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 
                        dark:from-yellow-300 dark:to-orange-400 rounded-full p-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </motion.div>
      ),
      bgGradient: 'from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800',
      cardBg: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg',
      titleColor: 'text-yellow-700 dark:text-yellow-400'
    }
  };

  const currentConfig = statusConfig[status] || statusConfig.processing;

  return (
    <div className={`flex items-center justify-center min-h-screen bg-gradient-to-br ${currentConfig.bgGradient} transition-all duration-1000`}>
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 dark:bg-blue-600 rounded-full 
                     mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-30"
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 dark:bg-purple-600 rounded-full 
                     mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-30"
          animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <div className={`w-full max-w-md p-8 ${currentConfig.cardBg} rounded-2xl shadow-2xl 
                      border border-gray-200 dark:border-gray-700`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <h1 className={`text-3xl font-bold ${currentConfig.titleColor} mb-8`}>
                Payment {status.charAt(0).toUpperCase() + status.slice(1)}
              </h1>
              
              <div className="flex justify-center my-8 h-24">
                {currentConfig.icon}
              </div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-gray-700 dark:text-gray-300 mb-8"
              >
                {message}
              </motion.p>
              
              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Redirecting to dashboard in a few seconds...
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 5 }}
                    />
                  </div>
                </motion.div>
              )}
              
              {status !== 'processing' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-8 space-y-4"
                >
                  <Link href="/" className="block">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 
                               text-white font-medium py-3 px-6 rounded-lg shadow-lg transition-all duration-300"
                    >
                      Return to Dashboard
                    </motion.div>
                  </Link>
                  
                  {status === 'failed' && (
                    <Link href="/" className="block">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 
                                 font-medium transition-colors duration-300"
                      >
                        Try Again
                      </motion.div>
                    </Link>
                  )}
                </motion.div>
              )}
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Reference: <span className="font-mono font-medium text-gray-800 dark:text-gray-200">
                    {reference || 'N/A'}
                  </span>
                </p>
                {status === 'failed' && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Please contact support with this reference if you need assistance
                  </p>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function PaymentCallbackFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 
                  dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md p-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl 
                    shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
            Payment Processing
          </h1>
          <div className="flex justify-center my-8">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 animate-spin">
                <div className="w-24 h-24 rounded-full border-4 border-transparent 
                              border-t-blue-500 border-r-blue-500 dark:border-t-blue-400 dark:border-r-blue-400"></div>
              </div>
              <div className="absolute inset-8">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 
                              dark:from-blue-400 dark:to-purple-400 animate-pulse"></div>
              </div>
            </div>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300">Loading payment details...</p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCallback() {
  return (
    <Suspense fallback={<PaymentCallbackFallback />}>
      <PaymentCallbackClient />
    </Suspense>
  );
}