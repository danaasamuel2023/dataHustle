'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Info, AlertCircle, X, Copy, CreditCard, TrendingUp, Loader2, Shield, CheckCircle } from 'lucide-react';

export default function DepositPage() {
  const [amount, setAmount] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [processingFee, setProcessingFee] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [acctStatus, setAcctStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [copied, setCopied] = useState(false);
  
  const router = useRouter();
  
  useEffect(() => {
    const checkUserAuth = () => {
      const userDataStr = localStorage.getItem('userData');
      
      if (userDataStr) {
        const user = JSON.parse(userDataStr);
        setUserId(user.id);
        setUserEmail(user.email);
        setAuthenticated(true);
        
        if (user.isDisabled) {
          setAcctStatus('disabled');
          setStatusReason(user.disableReason || 'No reason provided');
        } else if (user.approvalStatus === 'pending') {
          setAcctStatus('pending');
        } else if (user.approvalStatus === 'rejected') {
          setAcctStatus('not-approved');
          setStatusReason(user.rejectionReason || 'Your account has not been approved.');
        }
      } else {
        router.push('/SignIn');
      }
    };
    
    checkUserAuth();
  }, [router]);
  
  useEffect(() => {
    if (amount && amount > 0) {
      const fee = parseFloat(amount) * 0.03;
      const total = parseFloat(amount) + fee;
      setProcessingFee(fee.toFixed(2));
      setTotalAmount(total.toFixed(2));
    } else {
      setProcessingFee('');
      setTotalAmount('');
    }
  }, [amount]);
  
  const submitDeposit = async (e) => {
    e.preventDefault();
    
    if (!amount || amount <= 9) {
      setErrorMsg('Please enter an amount greater than 9 GHS.');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const res = await fetch('https://datahustle.onrender.com/api/v1/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: parseFloat(amount),
          totalAmountWithFee: parseFloat(totalAmount),
          email: userEmail
        })
      });
      
      const data = await res.json();
      
      if (data.paystackUrl) {
        setSuccessMsg('Redirecting to payment gateway...');
        window.location.href = data.paystackUrl;
      }
    } catch (err) {
      console.error('Deposit error:', err);
      
      const errorData = err.response?.data;
      
      if (errorData?.error === 'Account is disabled') {
        setAcctStatus('disabled');
        setStatusReason(errorData.disableReason || 'No reason provided');
        setShowModal(true);
      } else if (errorData?.error === 'Account not approved') {
        if (errorData.approvalStatus === 'pending') {
          setAcctStatus('pending');
        } else {
          setAcctStatus('not-approved');
          setStatusReason(errorData.reason || 'Your account has not been approved.');
        }
        setShowModal(true);
      } else {
        setErrorMsg(errorData?.error || 'Failed to process deposit. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText('0597760914');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-500 animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Deposit Funds
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add money to your account
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-yellow-500 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Add Funds</h2>
                  <p className="text-sm text-white/90">Via Paystack</p>
                </div>
              </div>
              
              <Link 
                href="/howtodeposite" 
                className="flex items-center gap-1 px-3 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
              >
                <Info size={16} />
                <span>Guide</span>
              </Link>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Need help? <Link href="/howtodeposite" className="text-blue-600 hover:text-blue-700 underline font-medium">View deposit guide</Link>
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-800 dark:text-red-200">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-green-800 dark:text-green-200">{successMsg}</span>
              </div>
            )}

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
                    className="pl-8 pr-3 py-2 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="10"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              
              {amount && amount > 0 && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Payment Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                      <span>Amount:</span>
                      <span className="font-medium">GHS {parseFloat(amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                      <span>Processing Fee (3%):</span>
                      <span className="font-medium">GHS {processingFee}</span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                      <div className="flex justify-between font-semibold text-gray-900 dark:text-white">
                        <span>Total:</span>
                        <span className="text-yellow-600">GHS {totalAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <button
                onClick={submitDeposit}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 transition-colors font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Continue to Payment'
                )}
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                <p className="flex items-center">
                  <Shield className="w-3 h-3 mr-2" />
                  3% processing fee applies to all deposits
                </p>
                <p className="flex items-center">
                  <Shield className="w-3 h-3 mr-2" />
                  Payments processed securely via Paystack
                </p>
                <Link 
                  href="/myorders" 
                  className="flex items-center text-yellow-600 hover:text-yellow-700 font-medium transition-colors mt-2"
                >
                  <TrendingUp className="w-3 h-3 mr-2" />
                  View transaction history
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 max-w-sm w-full shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {acctStatus === 'pending' ? 'Account Pending' : 
                   acctStatus === 'disabled' ? 'Account Disabled' : 
                   'Account Not Approved'}
                </h2>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            
            {acctStatus === 'disabled' ? (
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                {statusReason}
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  {acctStatus === 'pending' ? 
                    'To activate your account, pay 100 GHS to:' : 
                    'Your account needs approval. Pay 100 GHS to:'}
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        MoMo: 0597760914
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Name: KOJO Frimpong
                      </p>
                    </div>
                    <button 
                      onClick={copyToClipboard}
                      className="flex items-center gap-1 text-yellow-600 hover:text-yellow-700 font-medium p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Copy size={16} />
                      {copied && <span className="text-xs">Copied!</span>}
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-amber-600 dark:text-amber-400 mb-4 text-center font-medium">
                  Use your email or phone as reference
                </p>
              </>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 px-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors text-sm"
              >
                Close
              </button>
              
              <a
                href="mailto:datamartghana@gmail.com"
                className="flex-1 py-2 px-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg text-center transition-colors text-sm"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}