'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// ===== DATA HUSTLE CONFIGURATION =====
const API_BASE = 'https://datahustle.onrender.com';

const handle401 = (router) => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  router.push('/SignIn');
};

// Simple Spinner Component
const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12', xl: 'w-20 h-20' };
  return (
    <div className={`${sizes[size]} border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin`}></div>
  );
};

// Success Icon
const SuccessIcon = () => (
  <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  </div>
);

// Error Icon
const ErrorIcon = () => (
  <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </div>
);

// Warning Icon
const WarningIcon = () => (
  <div className="w-20 h-20 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
    <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  </div>
);

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
        {type === 'success' ? (
          <div className="p-6">
            <SuccessIcon />
            <h3 className="text-2xl font-bold text-green-600 text-center mb-4">Purchase Successful!</h3>
            <p className="text-gray-600 dark:text-gray-300 text-center text-base mb-5">{message}</p>
            <button onClick={onClose} className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-lg">Done</button>
          </div>
        ) : type === 'error' ? (
          <div className="p-6">
            <ErrorIcon />
            <h3 className="text-2xl font-bold text-red-600 text-center mb-4">Failed</h3>
            <p className="text-gray-600 dark:text-gray-300 text-center text-base mb-5">{message}</p>
            <button onClick={onClose} className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-lg">Try Again</button>
          </div>
        ) : (
          <div className="p-6">
            <WarningIcon />
            <h3 className="text-2xl font-bold text-amber-600 text-center mb-4">Notice</h3>
            <p className="text-gray-600 dark:text-gray-300 text-center text-base mb-5">{message}</p>
            <button onClick={onClose} className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-lg">Okay</button>
          </div>
        )}
      </div>
    </div>
  );
};

// Confirm Modal with Payment Method Selection
const ConfirmModal = ({ isOpen, onClose, onConfirmWallet, onConfirmPaystack, bundle, phoneNumber, isDarkMode, walletBalance = 0 }) => {
  const [payMethod, setPayMethod] = useState('wallet');
  if (!isOpen || !bundle) return null;
  const price = parseFloat(bundle.price);
  const canWallet = walletBalance >= price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg w-full max-w-md overflow-hidden shadow-2xl animate-scale-in`}>
        <div className="bg-yellow-400 px-5 py-4">
          <h3 className="text-lg font-bold text-black text-center">Confirm Purchase</h3>
        </div>
        <div className="p-5">
          <div className="text-center mb-4">
            <p className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{bundle.capacity}GB</p>
            <p className={`text-xl mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>GH₵ {bundle.price}</p>
          </div>
          <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-3 mb-4`}>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Recipient</p>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{phoneNumber}</p>
          </div>

          {/* Payment Method */}
          <div className="mb-4">
            <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Payment Method</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => canWallet && setPayMethod('wallet')}
                disabled={!canWallet}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  payMethod === 'wallet'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : canWallet ? 'border-gray-200 dark:border-gray-600' : 'border-gray-200 dark:border-gray-700 opacity-40'
                }`}
              >
                <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Wallet</p>
                <p className={`text-[10px] ${canWallet ? 'text-gray-500' : 'text-red-500'}`}>₵{walletBalance.toFixed(2)}</p>
              </button>
              <button
                onClick={() => setPayMethod('paystack')}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  payMethod === 'paystack'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Paystack</p>
                <p className="text-[10px] text-gray-500">MoMo / Card</p>
              </button>
            </div>
          </div>

          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mb-4 text-center`}>Delivery is not instant. Times vary by network.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className={`flex-1 py-3 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'} font-medium rounded-md`}>Cancel</button>
            <button
              onClick={() => payMethod === 'wallet' ? onConfirmWallet() : onConfirmPaystack()}
              className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-md"
            >
              {payMethod === 'wallet' ? `Pay ₵${bundle.price}` : 'Pay with Paystack'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading Overlay
const LoadingOverlay = ({ isLoading }) => {
  if (!isLoading) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-2xl">
        <div className="flex justify-center mb-4">
          <Spinner size="xl" />
        </div>
        <p className="text-indigo-500 font-bold text-xl">Processing...</p>
      </div>
    </div>
  );
};

// Info Modal
const InfoModal = ({ isOpen, onClose, isDarkMode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in`}>
        <div className="bg-indigo-500 px-5 py-4 flex justify-between items-center">
          <h3 className="font-bold text-white text-lg">⚠️ Important Notice</h3>
          <button onClick={onClose} className="text-white text-3xl leading-none">&times;</button>
        </div>
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <div className="flex justify-center mb-4">
            <WarningIcon />
          </div>
          <div className="space-y-4">
            <div className={`p-4 ${isDarkMode ? 'bg-red-900/50' : 'bg-red-50'} rounded-lg`}>
              <p className={`font-bold ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>🚫 No Social Media Ads</p>
              <p className={`text-sm ${isDarkMode ? 'text-red-200' : 'text-red-600'}`}>Account will be deleted permanently</p>
            </div>
            <div className={`p-4 ${isDarkMode ? 'bg-amber-900/50' : 'bg-amber-50'} rounded-lg`}>
              <p className={`font-bold ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>⏳ Not Instant</p>
              <p className={`text-sm ${isDarkMode ? 'text-amber-200' : 'text-amber-600'}`}>Delivery times vary. For urgent needs, dial *138#</p>
            </div>
            <div className={`p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
              <p className={`font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>📋 Rules</p>
              <ul className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-2 space-y-2`}>
                <li>• Turbonet/Broadband SIMs not eligible</li>
                <li>• No duplicate orders - no refunds</li>
                <li>• Wrong number = no refund</li>
                <li>• Verify number before purchase</li>
              </ul>
            </div>
          </div>
        </div>
        <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} px-5 py-4`}>
          <button onClick={onClose} className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-lg">I Understand</button>
        </div>
      </div>
    </div>
  );
};

const MTNBundlesClient = () => {
  const router = useRouter();
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userData, setUserData] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [isMobile, setIsMobile] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const bundles = [
    { capacity: '1', price: '4.20', network: 'YELLO' },
    { capacity: '2', price: '8.80', network: 'YELLO' },
    { capacity: '3', price: '12.80', network: 'YELLO' },
    { capacity: '4', price: '17.80', network: 'YELLO' },
    { capacity: '5', price: '22.30', network: 'YELLO' },
    { capacity: '6', price: '25.00', network: 'YELLO' },
    { capacity: '8', price: '33.00', network: 'YELLO' },
    { capacity: '10', price: '41.00', network: 'YELLO' },
    { capacity: '15', price: '59.50', network: 'YELLO' },
    { capacity: '20', price: '79.00', network: 'YELLO' },
    { capacity: '25', price: '99.00', network: 'YELLO' },
    { capacity: '30', price: '121.00', network: 'YELLO' },
    { capacity: '40', price: '158.00', network: 'YELLO' },
    { capacity: '50', price: '200.00', network: 'YELLO' },
  ];

  useEffect(() => {
    const stored = localStorage.getItem('userData');
    if (stored) {
      const user = JSON.parse(stored);
      setUserData(user);
      // Fetch wallet balance
      const token = localStorage.getItem('authToken');
      if (token && user.id) {
        fetch(`${API_BASE}/api/v1/data/user-dashboard/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).then(d => {
          if (d.status === 'success') setWalletBalance(d.data?.userBalance || 0);
        }).catch(() => {});
      }
    }
    const theme = localStorage.getItem('dh-theme');
    setIsDarkMode(theme === 'dark');
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSelect = (bundle) => {
    if (selectedBundle?.capacity === bundle.capacity) setSelectedBundle(null);
    else { setSelectedBundle(bundle); setPhoneNumber(''); setErrorMessage(''); }
  };

  const formatPhone = (val) => {
    let num = val.replace(/\D/g, '');
    if (num.length > 0 && !num.startsWith('0')) num = '0' + num;
    return num.slice(0, 10);
  };

  const validatePhone = (num) => /^0\d{9}$/.test(num);
  const showToast = (message, type) => setToast({ visible: true, message, type });

  const handlePurchase = () => {
    if (!validatePhone(phoneNumber)) {
      setErrorMessage('Enter valid number (0XXXXXXXXX)');
      return;
    }
    if (!userData?.id) {
      showToast('Please login to continue', 'error');
      return;
    }
    setErrorMessage('');
    setShowConfirm(true);
  };

  // Wallet Purchase
  const confirmWalletPurchase = async () => {
    setShowConfirm(false);
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.post(`${API_BASE}/api/v1/data/purchase-data`, {
        userId: userData.id,
        phoneNumber,
        network: selectedBundle.network,
        capacity: selectedBundle.capacity,
        price: parseFloat(selectedBundle.price)
      }, { headers: { 'x-auth-token': token } });

      if (res.data.status === 'success') {
        showToast(`${selectedBundle.capacity}GB sent to ${phoneNumber}`, 'success');
        setSelectedBundle(null);
        setPhoneNumber('');
        setWalletBalance(prev => prev - parseFloat(selectedBundle.price));
      }
    } catch (err) {
      if (err.response?.status === 401) { handle401(router); return; }
      showToast(err.response?.data?.message || 'Purchase failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Paystack Direct Purchase
  const confirmPaystackPurchase = async () => {
    setShowConfirm(false);
    setIsLoading(true);
    try {
      const STORE_SLUG = 'sam-1756835542914';
      const STORE_API = 'https://api.datamartgh.shop/api/v1/agent-stores';

      // Fetch store products to find matching productId
      const productsRes = await axios.get(`${STORE_API}/stores/${STORE_SLUG}/products`);
      const products = productsRes.data?.data?.products || [];
      const match = products.find(p =>
        (p.network === 'MTN' || p.network === 'YELLO') &&
        String(p.capacity) === String(selectedBundle.capacity)
      );

      if (!match) {
        showToast('Bundle not available for direct payment. Try wallet instead.', 'error');
        setIsLoading(false);
        return;
      }

      // Initialize Paystack payment
      const initRes = await axios.post(`${STORE_API}/stores/${STORE_SLUG}/purchase/initialize`, {
        productId: match._id,
        recipientPhone: phoneNumber,
        customerPhone: userData?.phoneNumber || '',
        customerEmail: userData?.email || `${phoneNumber}@datahustle.shop`,
        customerName: userData?.name || 'Customer',
        isMainPlatform: true,
        platform: 'datahustle'
      });

      if (initRes.data?.status === 'success' && initRes.data?.data?.authorizationUrl) {
        window.location.href = initRes.data.data.authorizationUrl;
      } else {
        showToast(initRes.data?.message || 'Could not initialize payment', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Payment initialization failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('dh-theme', newMode ? 'dark' : 'light');
  };

  const cols = isMobile ? 1 : 3;
  const getExpansionPosition = () => {
    if (!selectedBundle) return -1;
    const idx = bundles.findIndex(b => b.capacity === selectedBundle.capacity);
    return Math.floor(idx / cols) * cols + cols;
  };
  const expansionPos = getExpansionPosition();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} transition-colors`}>
      {/* CSS Animation */}
      <style jsx global>{`
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>

      {toast.visible && <Toast {...toast} onClose={() => setToast(p => ({ ...p, visible: false }))} />}
      <LoadingOverlay isLoading={isLoading} />
      <ConfirmModal isOpen={showConfirm} onClose={() => setShowConfirm(false)} onConfirmWallet={confirmWalletPurchase} onConfirmPaystack={confirmPaystackPurchase} bundle={selectedBundle} phoneNumber={phoneNumber} isDarkMode={isDarkMode} walletBalance={walletBalance} />
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} isDarkMode={isDarkMode} />

      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>MTN Non-Expiry Bundles</h1>
          <div className="flex items-center gap-1.5">
            <button onClick={toggleDarkMode} className={`p-1.5 rounded-full text-sm ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{isDarkMode ? '☀️' : '🌙'}</button>
            <button onClick={() => setShowInfo(true)} className={`p-1.5 rounded-full text-sm ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>ℹ️</button>
          </div>
        </div>

        <div onClick={() => setShowInfo(true)} className={`mb-4 px-4 py-2.5 rounded-xl cursor-pointer ${isDarkMode ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-sm text-center ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>⚠️ Not instant • No refunds for wrong numbers • <span className="underline">Tap for details</span></p>
        </div>

        {/* MTN CARDS - YELLOW BRANDING */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {bundles.map((bundle, index) => {
            const isSelected = selectedBundle?.capacity === bundle.capacity;
            const showExpansion = selectedBundle && (index + 1) === Math.min(expansionPos, bundles.length);
            return (
              <React.Fragment key={bundle.capacity}>
                <div onClick={() => handleSelect(bundle)} className={`rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-yellow-500 shadow-xl' : 'hover:shadow-lg'}`}>
                  <div className="bg-yellow-400 p-5 text-center">
                    <div className="inline-block px-3 py-1 bg-yellow-500 rounded-full text-sm font-bold text-black border-2 border-black mb-2">MTN</div>
                    <p className="text-4xl font-bold text-black">{bundle.capacity} GB</p>
                  </div>
                  <div className="grid grid-cols-2 bg-black text-white text-center">
                    <div className="py-4 border-r border-gray-700">
                      <p className="text-xl font-bold">₵{bundle.price}</p>
                      <p className="text-sm text-gray-400">Price</p>
                    </div>
                    <div className="py-4">
                      <p className="text-base font-bold">No Expiry</p>
                      <p className="text-sm text-gray-400">Duration</p>
                    </div>
                  </div>
                </div>
                {showExpansion && (
                  <div className="col-span-1 md:col-span-3 bg-yellow-400 rounded-lg p-3 shadow-lg">
                    <p className="text-center font-bold text-black text-base mb-3">{selectedBundle.capacity}GB – MTN</p>
                    {errorMessage && <div className="bg-red-100 text-red-700 text-xs p-2 rounded-lg mb-2 text-center">{errorMessage}</div>}
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(formatPhone(e.target.value))}
                        placeholder="0XXXXXXXXX"
                        className="flex-1 px-3 py-2 rounded-lg bg-yellow-300 text-black placeholder-yellow-600 border border-yellow-500 focus:border-yellow-600 focus:outline-none text-center font-medium text-sm"
                      />
                      <button
                        onClick={handlePurchase}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg whitespace-nowrap text-sm"
                      >
                        Buy ₵{selectedBundle.price}
                      </button>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MTNBundlesClient;
