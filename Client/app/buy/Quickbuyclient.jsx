'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Moon, Sun, AlertCircle, XCircle, Shield, User, Clock, Search, CheckCircle, Loader2, Phone, Hash, ChevronDown, ChevronUp, MapPin, MessageCircle, Database } from 'lucide-react';

// ===== DATA HUSTLE CONFIGURATION =====
// Uses same backend and store as DataMart, but with 'datahustle' platform
const API_BASE = 'https://api.datamartgh.shop/api/v1';
const API_BASE_V0 = 'https://api.datamartgh.shop/api';
const STORE_NAME = 'sam-1756835542914'; // Same store as DataMart
const WHATSAPP_CHANNEL = 'https://whatsapp.com/channel/0029Vb6zDvaGzzKTwCWszC1Z';
const PLATFORM_NAME = 'Data Hustle';
const PLATFORM_URL = 'https://datahustle.shop';

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-down">
      <div className={`p-4 rounded-lg shadow-lg flex items-center gap-3 ${
        type === 'success' ? 'bg-green-500 text-white' : type === 'error' ? 'bg-red-500 text-white' : 'bg-indigo-500 text-white'
      }`}>
        {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
        <p className="font-medium">{message}</p>
        <button onClick={onClose} className="ml-2 hover:opacity-70">✕</button>
      </div>
    </div>
  );
};

// Loading Overlay - Indigo themed
const LoadingOverlay = ({ isLoading, network }) => {
  if (!isLoading) return null;
  const color = network === 'YELLO' ? 'text-yellow-500' : network === 'TELECEL' ? 'text-red-600' : 'text-purple-600';
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-auto text-center">
        <div className="flex justify-center mb-4">
          <svg className={`animate-spin h-16 w-16 ${color}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h4 className="text-xl font-bold text-indigo-600 mb-2">Processing Your Order...</h4>
        <p className="text-gray-700 dark:text-gray-300">Please do not close this page.</p>
      </div>
    </div>
  );
};

// ===== TRACK ORDER COMPONENT - INDIGO THEMED =====
const TrackOrder = ({ darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchType, setSearchType] = useState('phone');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchValue.trim()) {
      setError('Please enter a phone number or reference');
      return;
    }

    setLoading(true);
    setError('');
    setOrders(null);

    try {
      const payload = searchType === 'phone' 
        ? { phoneNumber: searchValue.trim() }
        : { reference: searchValue.trim() };

      const response = await fetch(`${API_BASE_V0}/momo-purchase/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.status === 'success') {
        setOrders(data.data.orders);
      } else {
        setError(data.message || 'No orders found');
      }
    } catch (err) {
      setError('Failed to track order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
      case 'waiting':
      case 'accepted':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
      case 'on':
        return <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'refunded':
      case 'refund':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'waiting':
      case 'accepted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
      case 'on':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded':
      case 'refund':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNetworkColor = (network) => {
    switch (network) {
      case 'YELLO':
        return 'bg-yellow-500';
      case 'TELECEL':
        return 'bg-red-500';
      case 'AT_PREMIUM':
      case 'at':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="mb-6">
      {/* Toggle Button - INDIGO GRADIENT */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Search className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Track Your Order</h3>
            <p className="text-sm text-white/80">Check delivery status by phone or reference</p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {/* Expandable Content */}
      {isOpen && (
        <div className={`mt-3 p-4 rounded-xl border shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Type Toggle */}
            <div className={`flex gap-2 p-1 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <button
                type="button"
                onClick={() => setSearchType('phone')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  searchType === 'phone'
                    ? darkMode 
                      ? 'bg-gray-600 text-indigo-400 shadow' 
                      : 'bg-white text-indigo-600 shadow'
                    : darkMode 
                      ? 'text-gray-400 hover:text-gray-300' 
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Phone className="w-4 h-4" />
                Phone Number
              </button>
              <button
                type="button"
                onClick={() => setSearchType('reference')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  searchType === 'reference'
                    ? darkMode 
                      ? 'bg-gray-600 text-indigo-400 shadow' 
                      : 'bg-white text-indigo-600 shadow'
                    : darkMode 
                      ? 'text-gray-400 hover:text-gray-300' 
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Hash className="w-4 h-4" />
                Reference
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={searchType === 'phone' ? 'Enter phone number (e.g., 0241234567)' : 'Enter order reference'}
                className={`w-full px-4 py-3 pl-12 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {searchType === 'phone' ? <Phone className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
              </div>
            </div>

            {/* Search Button - INDIGO */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Track Order
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-700'}`}>{error}</p>
            </div>
          )}

          {/* Results */}
          {orders && orders.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className={`font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Package className="w-5 h-5" />
                Found {orders.length} order{orders.length > 1 ? 's' : ''}
              </h4>

              {orders.map((order, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                >
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${getNetworkColor(order.product.network)} flex items-center justify-center text-white font-bold text-xs`}>
                        {order.product.networkDisplay?.substring(0, 3) || order.product.network?.substring(0, 3)}
                      </div>
                      <div>
                        <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {order.product.networkDisplay} {order.product.capacityDisplay}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          To: {order.recipientPhone}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)} flex items-center gap-1`}>
                      {getStatusIcon(order.status)}
                      {order.statusDisplay}
                    </div>
                  </div>

                  {/* Status Message */}
                  <div className={`mb-3 p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-100'}`}>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {order.statusMessage}
                    </p>
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Reference</p>
                      <p className={`font-mono text-xs break-all ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {order.orderReference}
                      </p>
                    </div>
                    <div>
                      <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Amount</p>
                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        GH₵{order.pricing?.totalPaid?.toFixed(2) || order.pricing?.basePrice?.toFixed(2) || order.pricing?.price?.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Ordered</p>
                      <p className={darkMode ? 'text-white' : 'text-gray-900'}>{order.timeSinceOrder}</p>
                    </div>
                    <div>
                      <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Method</p>
                      <p className={`capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {order.processingMethod?.replace(/_/g, ' ') || 'Auto'}
                      </p>
                    </div>
                  </div>

                  {/* Tracking Info */}
                  {order.tracking && (
                    <div className={`mt-3 p-3 rounded-lg border ${darkMode ? 'bg-indigo-900/20 border-indigo-800' : 'bg-indigo-50 border-indigo-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className={`w-4 h-4 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        <p className={`font-medium text-sm ${darkMode ? 'text-indigo-300' : 'text-indigo-900'}`}>Tracking Info</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {order.tracking.batchNumber && (
                          <div>
                            <span className={darkMode ? 'text-indigo-400' : 'text-indigo-600'}>Batch:</span>{' '}
                            <span className={darkMode ? 'text-indigo-200' : 'text-indigo-900'}>#{order.tracking.batchNumber}</span>
                          </div>
                        )}
                        {order.tracking.portalId && (
                          <div>
                            <span className={darkMode ? 'text-indigo-400' : 'text-indigo-600'}>Portal ID:</span>{' '}
                            <span className={darkMode ? 'text-indigo-200' : 'text-indigo-900'}>{order.tracking.portalId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Support Info */}
              <div className={`mt-4 p-4 rounded-lg border ${darkMode ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-800' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'}`}>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-500 rounded-full flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className={`font-semibold mb-1 ${darkMode ? 'text-green-300' : 'text-green-900'}`}>
                      Haven&apos;t received your bundle?
                    </p>
                    <p className={`text-sm mb-3 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                      Join our WhatsApp channel to get support contact and updates.
                    </p>
                    <a 
                      href={WHATSAPP_CHANNEL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Join WhatsApp Channel
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Default Info */}
          {!orders && !error && (
            <div className={`mt-4 p-3 rounded-lg border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Enter your phone number or order reference to check your order status.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Confirmation Modal - INDIGO THEMED
const ConfirmationModal = ({ isOpen, onClose, onConfirm, product, phoneNumber, customerName, isProcessing }) => {
  if (!isOpen || !product) return null;
  
  const getNetworkName = (network) => {
    if (network === 'YELLO') return 'MTN';
    if (network === 'TELECEL') return 'Telecel';
    if (network === 'AT_PREMIUM') return 'AirtelTigo';
    return network;
  };
  
  const getNetworkColor = (network) => {
    if (network === 'YELLO') return { bg: 'from-yellow-400 to-yellow-500', text: 'text-black', btn: 'bg-yellow-500 hover:bg-yellow-400 text-black' };
    if (network === 'TELECEL') return { bg: 'from-red-500 to-red-600', text: 'text-white', btn: 'bg-red-500 hover:bg-red-400 text-white' };
    if (network === 'AT_PREMIUM') return { bg: 'from-purple-500 to-purple-600', text: 'text-white', btn: 'bg-purple-500 hover:bg-purple-400 text-white' };
    return { bg: 'from-indigo-500 to-indigo-600', text: 'text-white', btn: 'bg-indigo-500 hover:bg-indigo-400 text-white' };
  };
  
  const colors = getNetworkColor(product?.network);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-modal-pop">
        {/* Header */}
        <div className={`bg-gradient-to-r ${colors.bg} ${colors.text} p-5 text-center`}>
          <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Confirm Purchase</h2>
        </div>
        
        {/* Content */}
        <div className="p-6 text-center">
          <p className="text-gray-400 mb-4">Sending data to:</p>
          
          <div className="bg-gray-800 rounded-xl p-5 mb-4">
            <p className="text-3xl font-bold text-white tracking-wider mb-2">{phoneNumber}</p>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${colors.btn}`}>
              {product?.capacity}GB {getNetworkName(product?.network)}
            </span>
            {customerName && (
              <p className="text-gray-400 text-sm mt-2">Name: {customerName}</p>
            )}
          </div>

          {/* Delivery Time Info - INDIGO ACCENT */}
          <div className="bg-indigo-900/30 border border-indigo-600/50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span className="text-indigo-400 text-sm font-semibold">Delivery Time</span>
            </div>
            <p className="text-indigo-200 text-sm">
              Usually <strong>10 mins - 24 hours</strong>
            </p>
            <p className="text-indigo-300/70 text-xs mt-1">We WILL deliver - trust us! 🤝</p>
          </div>
          
          <p className="text-amber-400 text-sm mb-6">
            ⚠️ Data cannot be reversed once sent!
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                `Pay GH₵${product?.sellingPrice?.toFixed(2)}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Network Logos
const MTNLogo = () => (
  <svg width="60" height="60" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="85" fill="#ffcc00" stroke="#000" strokeWidth="2"/>
    <path d="M50 80 L80 140 L100 80 L120 140 L150 80" stroke="#000" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TelecelLogo = () => (
  <svg width="60" height="60" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="85" fill="#ffffff" stroke="#cc0000" strokeWidth="2"/>
    <text x="100" y="110" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="32" fill="#cc0000">T</text>
    <path d="M50 125 L150 125" stroke="#cc0000" strokeWidth="5" strokeLinecap="round"/>
  </svg>
);

const AirtelTigoLogo = () => (
  <svg width="60" height="60" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="85" fill="#ffffff" stroke="#7c3aed" strokeWidth="2"/>
    <text x="100" y="110" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="28" fill="#7c3aed">AT</text>
  </svg>
);

// Data Hustle Logo Component
const DataHustleLogo = () => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
      <Database className="w-5 h-5 text-white" />
    </div>
    <span className="text-lg font-bold text-indigo-500">Data Hustle</span>
  </div>
);

export default function QuickBuyClient({ initialProducts = [] }) {
  const [products, setProducts] = useState(initialProducts);
  const [loadingProducts, setLoadingProducts] = useState(initialProducts.length === 0);
  const [selectedNetwork, setSelectedNetwork] = useState('YELLO');
  const [selectedProductIndex, setSelectedProductIndex] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingNetwork, setProcessingNetwork] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [bundleMessages, setBundleMessages] = useState({});
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);

  // Fetch products client-side if not provided from server
  useEffect(() => {
    if (initialProducts.length === 0) {
      fetchProducts();
    }
  }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch(`${API_BASE}/agent-stores/stores/${STORE_NAME}/products`);
      const data = await response.json();
      
      if (data.status === 'success' && data.data?.products) {
        setProducts(data.data.products);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      showToast('Failed to load products. Please refresh the page.', 'error');
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('dh-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(saved === 'dark' || (saved === null && prefersDark));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('dh-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const showToast = (message, type = 'success') => setToast({ visible: true, message, type });
  const hideToast = () => setToast(prev => ({ ...prev, visible: false }));

  const validatePhoneNumber = (number, network) => {
    const clean = number.replace(/[\s-]/g, '');
    if (network === 'YELLO') return clean.length === 10 && /^0\d{9}$/.test(clean);
    if (network === 'TELECEL') return /^(020|050)\d{7}$/.test(clean);
    if (network === 'AT_PREMIUM') return /^(026|027|056|057)\d{7}$/.test(clean);
    return true;
  };

  const getPhoneNumberPlaceholder = (network) => {
    if (network === 'YELLO') return '0XXXXXXXXX';
    if (network === 'TELECEL') return '020/050XXXXXXX';
    if (network === 'AT_PREMIUM') return '026/027/056/057XXXXXXX';
    return '0XXXXXXXXX';
  };

  const handleShowConfirmation = (product, index) => {
    setBundleMessages(prev => ({ ...prev, [index]: null }));

    if (!product.inStock) {
      setBundleMessages(prev => ({ ...prev, [index]: { text: 'Sorry, this bundle is currently out of stock.', type: 'error' } }));
      return;
    }
    if (!validatePhoneNumber(phoneNumber, product.network)) {
      setBundleMessages(prev => ({ ...prev, [index]: { text: `Please enter a valid ${product.network === 'YELLO' ? 'MTN' : product.network} number`, type: 'error' } }));
      return;
    }
    if (!customerName) {
      setBundleMessages(prev => ({ ...prev, [index]: { text: 'Please enter your name', type: 'error' } }));
      return;
    }

    setConfirmationData({ product, index });
    setShowConfirmation(true);
  };

  // ===== KEY: isMainPlatform: true for Data Hustle =====
  const handleConfirmedPurchase = async () => {
    if (!confirmationData) return;
    
    const { product } = confirmationData;
    const autoGeneratedEmail = `customer_${phoneNumber.replace(/[\s-]/g, '')}@datahustle.shop`;

    setIsProcessing(true);
    setProcessingNetwork(product.network);

    try {
      const response = await fetch(`${API_BASE}/agent-stores/stores/${STORE_NAME}/purchase/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          phoneNumber,
          customerEmail: autoGeneratedEmail,
          customerName,
          quantity: 1,
          isMainPlatform: true,
          platform: 'datahustle'  // ← TELLS BACKEND TO USE DATAHUSTLE CALLBACK URL
        })
      });

      const data = await response.json();
      if (data.status === 'success' && data.data.authorizationUrl) {
        showToast(`${product.capacity}GB bundle purchase initiated successfully!`, 'success');
        window.location.href = data.data.authorizationUrl;
      } else {
        setShowConfirmation(false);
        showToast(data.message || 'Failed to initialize payment', 'error');
      }
    } catch (error) {
      setShowConfirmation(false);
      showToast('Error processing purchase: ' + error.message, 'error');
    } finally {
      setIsProcessing(false);
      setProcessingNetwork('');
    }
  };

  const getNetworkLogo = (network) => {
    if (network === 'YELLO') return <MTNLogo />;
    if (network === 'TELECEL') return <TelecelLogo />;
    if (network === 'AT_PREMIUM') return <AirtelTigoLogo />;
    return <Package className="w-12 h-12" />;
  };

  const getCardColors = (network) => {
    if (network === 'YELLO') {
      return { card: 'bg-yellow-400', expanded: darkMode ? 'bg-yellow-500' : 'bg-yellow-400', button: 'bg-green-600 hover:bg-green-700', outOfStockBg: 'bg-yellow-500', outOfStockText: 'text-yellow-900' };
    } else if (network === 'TELECEL') {
      return { card: 'bg-gradient-to-tr from-red-700 to-red-500', expanded: 'bg-gradient-to-br from-red-600 to-red-700', button: 'bg-red-900 hover:bg-red-800', outOfStockBg: 'bg-red-600', outOfStockText: 'text-white' };
    } else if (network === 'AT_PREMIUM') {
      return { card: 'bg-gradient-to-tr from-purple-700 to-purple-500', expanded: 'bg-gradient-to-br from-purple-600 to-purple-700', button: 'bg-purple-900 hover:bg-purple-800', outOfStockBg: 'bg-purple-600', outOfStockText: 'text-white' };
    }
    return { card: 'bg-gradient-to-tr from-indigo-700 to-indigo-500', expanded: 'bg-gradient-to-br from-indigo-600 to-indigo-700', button: 'bg-indigo-900 hover:bg-indigo-800', outOfStockBg: 'bg-indigo-600', outOfStockText: 'text-white' };
  };

  const filteredProducts = products.filter(p => p.network === selectedNetwork);
  const availableNetworks = ['YELLO', 'TELECEL', 'AT_PREMIUM'].filter(net => products.some(p => p.network === net));

  return (
    <div className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'} min-h-screen transition-colors duration-200`}>
      {toast.visible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <LoadingOverlay isLoading={isProcessing && !showConfirmation} network={processingNetwork} />
      
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmedPurchase}
        product={confirmationData?.product}
        phoneNumber={phoneNumber}
        customerName={customerName}
        isProcessing={isProcessing}
      />

      {/* Header - INDIGO THEMED (using div to avoid being hidden by layout) */}
      <div className={`sticky top-0 z-40 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <DataHustleLogo />
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-indigo-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link 
              href="/SignIn" 
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Sign In
            </Link>
            <Link 
              href="/SignUp" 
              className="px-4 py-2 text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Buy Data Bundles</h1>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No account needed • Pay via MoMo • Cheapest in Ghana
          </p>
        </div>

        {/* Track Order */}
        <TrackOrder darkMode={darkMode} />

        {/* Network Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Select Network</h2>
          <div className="flex gap-4 flex-wrap">
            {availableNetworks.map((network) => (
              <button
                key={network}
                onClick={() => setSelectedNetwork(network)}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                  selectedNetwork === network
                    ? network === 'YELLO' ? 'bg-yellow-500 text-black ring-2 ring-yellow-700' :
                      network === 'TELECEL' ? 'bg-red-600 text-white ring-2 ring-red-800' :
                      'bg-purple-600 text-white ring-2 ring-purple-800'
                    : darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {network === 'YELLO' ? 'MTN' : network === 'TELECEL' ? 'Telecel' : 'AirtelTigo'}
              </button>
            ))}
          </div>
        </div>

        {/* Guest Checkout Notice - INDIGO */}
        <div className={`mb-6 p-4 rounded-lg border-l-4 ${darkMode ? 'bg-indigo-900/30 border-indigo-600' : 'bg-indigo-50 border-indigo-500'}`}>
          <div className="flex">
            <Shield className={`h-5 w-5 flex-shrink-0 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <div className="ml-3">
              <h3 className={`text-sm font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-800'}`}>Guest Checkout</h3>
              <p className={`mt-1 text-sm ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                ✓ No account needed • ✓ Pay with MoMo • ✓ Track order above
              </p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loadingProducts ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className={`w-12 h-12 animate-spin ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} mb-4`} />
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loading bundles...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => {
            const colors = getCardColors(product.network);
            const isSelected = selectedProductIndex === index;
            
            return (
              <div key={product._id} className="flex flex-col relative">
                {!product.inStock && (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="bg-red-600 text-white text-xs font-bold py-1 px-2 rounded-full shadow-lg">OUT OF STOCK</span>
                  </div>
                )}
                
                <div 
                  className={`flex flex-col ${colors.card} ${product.network === 'YELLO' ? '' : 'text-white'} overflow-hidden shadow-md transition-transform duration-300 cursor-pointer hover:translate-y-[-5px] ${isSelected ? 'rounded-t-lg' : 'rounded-lg'}`}
                  onClick={() => {
                    setSelectedProductIndex(index === selectedProductIndex ? null : index);
                    setPhoneNumber('');
                    setCustomerName('');
                    setBundleMessages(prev => ({ ...prev, [index]: null }));
                  }}
                >
                  <div className="flex flex-col items-center justify-center p-5 space-y-3">
                    <div className="w-16 h-16 flex justify-center items-center">
                      {getNetworkLogo(product.network)}
                    </div>
                    <h3 className="text-xl font-bold">{product.capacity}GB</h3>
                    {product.displayName && (
                      <p className={`text-sm ${product.network === 'YELLO' ? 'text-gray-700' : 'text-white/90'}`}>
                        {product.displayName}
                      </p>
                    )}
                  </div>

                  <div className={`grid grid-cols-2 text-white ${product.network === 'YELLO' ? 'bg-black' : 'bg-black/80'}`}
                       style={{ borderRadius: isSelected ? '0' : '0 0 0.5rem 0.5rem' }}>
                    <div className="flex flex-col items-center justify-center p-3 text-center border-r border-r-gray-600">
                      <p className="text-lg font-bold">GH₵ {product.sellingPrice.toFixed(2)}</p>
                      <p className="text-sm font-bold">Price</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 text-center">
                      <p className="text-lg">Non Expiry</p>
                      <p className="text-sm font-bold">Validity</p>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className={`${colors.expanded} p-6 rounded-b-lg shadow-md`}>
                    {!product.inStock ? (
                      <div className={`${colors.outOfStockBg} rounded-lg p-6 border-2 border-opacity-50`}>
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className={`${colors.outOfStockText} bg-white/20 rounded-full p-4`}>
                            <XCircle className="w-16 h-16" />
                          </div>
                          <div className="text-center">
                            <h3 className={`text-2xl font-bold ${colors.outOfStockText} mb-2`}>Currently Unavailable</h3>
                            <p className={`text-sm ${colors.outOfStockText} opacity-90`}>
                              This {product.capacity}GB bundle is temporarily out of stock.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {bundleMessages[index] && (
                          <div className={`mb-3 p-3 rounded ${bundleMessages[index].type === 'success' ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}`}>
                            {bundleMessages[index].text}
                          </div>
                        )}
                        
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-white mb-1">Your Name</label>
                          <input
                            type="text"
                            className={`w-full px-3 py-2 rounded ${product.network === 'YELLO' ? 'bg-yellow-300 text-black placeholder-yellow-700 border border-yellow-500' : 'bg-white/90 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2`}
                            placeholder="Enter your name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-white mb-1">Beneficiary Number</label>
                          <input
                            type="tel"
                            className={`w-full px-3 py-2 rounded ${product.network === 'YELLO' ? 'bg-yellow-300 text-black placeholder-yellow-700 border border-yellow-500' : 'bg-white/90 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2`}
                            placeholder={getPhoneNumberPlaceholder(product.network)}
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                          />
                          <p className="text-xs text-white/80 mt-1">Data will be sent to this number</p>
                        </div>
                        
                        <button
                          onClick={() => handleShowConfirmation(product, index)}
                          className={`w-full px-4 py-2 ${colors.button} text-white rounded focus:outline-none focus:ring-2 transition-all duration-300`}
                        >
                          Buy Now
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className={`w-16 h-16 ${darkMode ? 'text-gray-600' : 'text-gray-400'} mx-auto mb-4`} />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>No bundles available for this network</p>
          </div>
        )}
          </>
        )}

        {/* Create Account CTA - INDIGO */}
        <div className={`mt-8 p-6 rounded-2xl text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <User className={`w-10 h-10 mx-auto mb-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
          <h3 className={`font-bold text-lg mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Want more features?</h3>
          <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Create a free account for order history and exclusive deals</p>
          <div className="flex justify-center gap-3">
            <Link href="/SignIn" className={`px-5 py-2 rounded-lg font-medium border transition-colors ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              Sign In
            </Link>
            <Link href="/SignUp" className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-colors">
              Sign Up Free
            </Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
        @keyframes modal-pop { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        .animate-modal-pop { animation: modal-pop 0.2s ease-out; }
      `}</style>
    </div>
  );
}