'use client'
import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ArrowRight,
  Phone,
  AlertCircle,
  RefreshCw,
  Info
} from 'lucide-react';

const API_BASE_URL = 'https://datahustle.onrender.com/api/v1';

const DataHustleDeposit = () => {
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [network, setNetwork] = useState('mtn');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [refId, setRefId] = useState('');
  const [userId, setUserId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [showStatusReminder, setShowStatusReminder] = useState(false);

  useEffect(() => {
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setUserId(userData.id);
        
        if (userData.phone) {
          setPhoneNumber(userData.phone);
        }
      } else {
        setErrorMsg('Please log in to make a deposit');
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setErrorMsg('Unable to retrieve user information');
    }
  }, []);

  const validateForm = () => {
    if (!amount || parseFloat(amount) <= 9) {
      setErrorMsg('Amount must be greater than GHS 9');
      return false;
    }
    
    if (!phoneNumber || phoneNumber.length < 10) {
      setErrorMsg('Please enter a valid phone number');
      return false;
    }
    
    if (!network) {
      setErrorMsg('Please select a network');
      return false;
    }
    
    if (!userId) {
      setErrorMsg('User ID not found. Please log in again');
      return false;
    }
    
    setErrorMsg('');
    return true;
  };

  const submitDeposit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    
    try {
      const res = await fetch(`${API_BASE_URL}/depositsmoolre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: parseFloat(amount),
          phoneNumber,
          network,
          currency: 'GHS'
        })
      });
      
      const data = await res.json();
      console.log('Deposit response:', data);
      
      if (data.success && data.requiresOtp) {
        setRequiresOtp(true);
        setRefId(data.reference);
        setSuccessMsg('OTP code sent to your phone. Please enter it below.');
        setCurrentStep(2);
      } else if (data.success) {
        setSuccessMsg('Deposit initiated. Please check your phone to approve the payment.');
        setRefId(data.reference);
        setShowStatusReminder(true);
        setCurrentStep(3);
      } else {
        setErrorMsg(data.message || 'Failed to initiate deposit');
      }
    } catch (err) {
      console.error('Deposit error:', err);
      setErrorMsg('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    
    if (!otpValue || otpValue.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit OTP code');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      const res = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: refId,
          otpCode: otpValue,
          phoneNumber: phoneNumber
        })
      });
      
      const data = await res.json();
      console.log('OTP response:', data);
      
      if (data.success) {
        setSuccessMsg('OTP verified. Please approve payment on your phone.');
        setRequiresOtp(false);
        setShowStatusReminder(true);
        setCurrentStep(3);
      } else {
        setErrorMsg(data.message || 'Invalid OTP code');
      }
    } catch (err) {
      console.error('OTP error:', err);
      setErrorMsg('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!refId) {
      setErrorMsg('Reference ID missing. Cannot check status.');
      return;
    }
    
    setIsLoading(true);
    setShowStatusReminder(false);
    
    try {
      const res = await fetch(`${API_BASE_URL}/verify-payments?reference=${encodeURIComponent(refId)}`);
      const data = await res.json();
      
      console.log('Status response:', data);
      
      if (data.success) {
        setPaymentStatus(data.data.status);
        
        if (data.data.status === 'completed') {
          setSuccessMsg(`Payment of GHS ${data.data.amount.toFixed(2)} completed successfully!`);
          
          setTimeout(() => {
            setAmount('');
            setPhoneNumber('');
            setOtpValue('');
            setRefId('');
            setRequiresOtp(false);
            setCurrentStep(1);
          }, 5000);
        } else if (data.data.status === 'failed') {
          setErrorMsg('Payment failed. Please try again.');
        } else {
          setPaymentStatus('pending');
          setSuccessMsg('Payment still processing. Please complete on your phone.');
          setShowStatusReminder(true);
        }
      } else {
        setErrorMsg(data.message || 'Could not verify payment');
      }
    } catch (err) {
      console.error('Status check error:', err);
      setErrorMsg('Network error while checking status.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Add Funds
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Top up your account balance
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-yellow-500 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Deposit Funds</h2>
                <p className="text-sm text-white/90">Mobile Money Payment</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-800 dark:text-red-200">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-green-800 dark:text-green-200">{successMsg}</span>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Amount (GHS)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">₵</span>
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="pl-8 pr-3 py-2 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      step="0.01"
                      min="10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Mobile Money Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={18} className="text-gray-500" />
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="02XXXXXXXX"
                      className="pl-10 pr-3 py-2 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Network Provider
                  </label>
                  <select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                    className="py-2 px-3 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="mtn">MTN Mobile Money</option>
                    <option value="vodafone">Vodafone Cash</option>
                    <option value="at">AirtelTigo Money</option>
                  </select>
                </div>

                <button
                  onClick={submitDeposit}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 transition-colors font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}

            {currentStep === 2 && requiresOtp && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-3">
                    <Smartphone size={32} className="text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Enter Verification Code
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Code sent to {phoneNumber}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    6-digit OTP Code
                  </label>
                  <input
                    type="text"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').substring(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="py-2 px-3 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-center text-2xl tracking-widest font-semibold"
                  />
                </div>

                <button
                  onClick={submitOtp}
                  disabled={isLoading || otpValue.length !== 6}
                  className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 transition-colors font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-2">
                  <CreditCard size={32} className="text-yellow-600" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Awaiting Payment Confirmation
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please check your phone and approve the payment request.
                </p>
                
                {showStatusReminder && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2 text-left">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      After approving on your phone, click "Check Status" to complete the transaction.
                    </p>
                  </div>
                )}

                <button
                  onClick={checkStatus}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 transition-colors font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 w-5 h-5" />
                      Check Status
                    </>
                  )}
                </button>
                
                {paymentStatus && (
                  <div className={`p-3 rounded-lg text-sm font-medium ${
                    paymentStatus === 'completed' 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' 
                      : paymentStatus === 'failed' 
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' 
                        : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                  }`}>
                    Status: {paymentStatus}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Step {currentStep} of 3
              </span>
              {currentStep > 1 && (
                <button 
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="text-xs text-yellow-600 hover:text-yellow-700 font-medium"
                >
                  ← Back
                </button>
              )}
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
              <div 
                className="bg-yellow-500 h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Need help? Contact support at{' '}
                <a href="mailto:support@datahustle.com" className="text-yellow-600 hover:text-yellow-700 font-medium">
                  support@datahustle.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataHustleDeposit;