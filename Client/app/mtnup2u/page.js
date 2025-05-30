'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Zap, Star, AlertTriangle, CheckCircle, X, Info, Shield, Phone, CreditCard, ArrowRight, Sparkles } from 'lucide-react';

// Toast Notification Component - Compact
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`p-3 rounded-xl shadow-xl flex items-center backdrop-blur-xl border max-w-sm ${
        type === 'success' 
          ? 'bg-emerald-500/90 text-white border-emerald-400/50' 
          : type === 'error' 
            ? 'bg-red-500/90 text-white border-red-400/50' 
            : 'bg-yellow-500/90 text-white border-yellow-400/50'
      }`}>
        <div className="mr-2">
          {type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : type === 'error' ? (
            <X className="h-4 w-4" />
          ) : (
            <Info className="h-4 w-4" />
          )}
        </div>
        <div className="flex-grow">
          <p className="font-medium text-sm">{message}</p>
        </div>
        <button onClick={onClose} className="ml-3 hover:scale-110 transition-transform">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Service Information Modal - Compact
const ServiceInfoModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 w-full max-w-md shadow-xl">
        {/* Modal header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Service Notice
          </h3>
          <button onClick={onClose} className="text-white hover:text-white/70 p-1 rounded-lg hover:bg-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Modal content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3 text-white/80 text-sm">
            <div className="flex items-start">
              <div className="w-1 h-1 rounded-full bg-emerald-400 mr-2 mt-2 flex-shrink-0"></div>
              <p><strong className="text-white">Not instant service</strong> - delivery times vary</p>
            </div>
            <div className="flex items-start">
              <div className="w-1 h-1 rounded-full bg-emerald-400 mr-2 mt-2 flex-shrink-0"></div>
              <p>For urgent data, use <strong className="text-white">*138#</strong> instead</p>
            </div>
            <div className="flex items-start">
              <div className="w-1 h-1 rounded-full bg-emerald-400 mr-2 mt-2 flex-shrink-0"></div>
              <p>Please be patient - orders may take time to process</p>
            </div>
            <div className="flex items-start">
              <div className="w-1 h-1 rounded-full bg-emerald-400 mr-2 mt-2 flex-shrink-0"></div>
              <p>Not suitable for instant bundle needs</p>
            </div>
          </div>
          
          <div className="bg-emerald-500/20 border border-emerald-500/30 p-3 rounded-xl mt-4">
            <div className="flex items-start">
              <Info className="w-4 h-4 text-emerald-400 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-emerald-200 text-sm">
                Thank you for your patience and understanding.
              </p>
            </div>
          </div>
        </div>
        
        {/* Modal footer */}
        <div className="px-6 py-4 border-t border-white/10 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all border border-white/20 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl transition-all transform hover:scale-105 text-sm"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

// Loading Overlay - Compact
const LoadingOverlay = ({ isLoading }) => {
  if (!isLoading) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-w-xs w-full mx-auto text-center shadow-xl">
        <div className="flex justify-center mb-4">
          <div className="relative w-12 h-12">
            <div className="w-12 h-12 rounded-full border-3 border-emerald-200/20"></div>
            <div className="absolute top-0 w-12 h-12 rounded-full border-3 border-transparent border-t-emerald-400 border-r-teal-400 animate-spin"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 animate-pulse flex items-center justify-center">
              <Zap className="w-4 h-4 text-white animate-bounce" strokeWidth={2.5} />
            </div>
          </div>
        </div>
        <h4 className="text-lg font-bold text-white mb-2">Processing...</h4>
        <p className="text-white/80 text-sm">Please wait while we process your order</p>
      </div>
    </div>
  );
};

const MTNBundleSelect = () => {
  const [selectedBundle, setSelectedBundle] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState(null);
  
  // Toast state
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success'
  });
  
  // Manual inventory control
  const inventoryAvailable = true;
  
  const bundles = [
    { value: '1', label: '1GB', capacity: '1', price: '4.40', network: 'YELLO', inStock: inventoryAvailable },
    { value: '2', label: '2GB', capacity: '2', price: '9.20', network: 'YELLO', inStock: inventoryAvailable },
    { value: '3', label: '3GB', capacity: '3', price: '13.50', network: 'YELLO', inStock: inventoryAvailable },
    { value: '4', label: '4GB', capacity: '4', price: '18.50', network: 'YELLO', inStock: inventoryAvailable },
    { value: '5', label: '5GB', capacity: '5', price: '23.50', network: 'YELLO', inStock: inventoryAvailable },
    { value: '6', label: '6GB', capacity: '6', price: '27.00', network: 'YELLO', inStock: inventoryAvailable },
    { value: '8', label: '8GB', capacity: '8', price: '35.50', network: 'YELLO', inStock: inventoryAvailable },
    { value: '10', label: '10GB', capacity: '10', price: '43.50', network: 'YELLO', inStock: inventoryAvailable },
    { value: '15', label: '15GB', capacity: '15', price: '62.50', network: 'YELLO', inStock: inventoryAvailable },
    { value: '20', label: '20GB', capacity: '20', price: '83.00', network: 'YELLO', inStock: inventoryAvailable },
    { value: '25', label: '25GB', capacity: '25', price: '105.00', network: 'YELLO', inStock: inventoryAvailable },
    { value: '30', label: '30GB', capacity: '30', price: '129.00', network: 'YELLO', inStock: inventoryAvailable },
    { value: '40', label: '40GB', capacity: '40', price: '166.00', network: 'YELLO', inStock: inventoryAvailable },
    { value: '50', label: '50GB', capacity: '50', price: '207.00', network: 'YELLO', inStock: inventoryAvailable },
    { value: '100', label: '100GB', capacity: '100', price: '407.00', network: 'YELLO', inStock: false }
  ];

  // Get user data from localStorage on component mount
  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, []);

  // Add CSS for animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(100px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      .animate-slide-in {
        animation: slideIn 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Function to validate phone number format
  const validatePhoneNumber = (number) => {
    const cleanNumber = number.replace(/[\s-]/g, '');
    
    if (cleanNumber.startsWith('0')) {
      return cleanNumber.length === 10 && /^0\d{9}$/.test(cleanNumber);
    }
    
    return false;
  };
  
  // Format phone number as user types
  const formatPhoneNumber = (input) => {
    let formatted = input.replace(/\D/g, '');
    
    if (!formatted.startsWith('0') && formatted.length > 0) {
      formatted = '0' + formatted;
    }
    
    if (formatted.length > 10) {
      formatted = formatted.substring(0, 10);
    }
    
    return formatted;
  };

  const handlePhoneNumberChange = (e) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    setPhoneNumber(formattedNumber);
  };

  // Function to show toast
  const showToast = (message, type = 'success') => {
    setToast({
      visible: true,
      message,
      type
    });
  };

  // Function to hide toast
  const hideToast = () => {
    setToast(prev => ({
      ...prev,
      visible: false
    }));
  };

  // Get selected bundle details
  const getSelectedBundleDetails = () => {
    return bundles.find(bundle => bundle.value === selectedBundle);
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!selectedBundle) {
      setError('Please select a data bundle');
      return;
    }
    
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid MTN number');
      return;
    }

    const bundle = getSelectedBundleDetails();
    
    if (!bundle.inStock) {
      setError('Sorry, this bundle is currently out of stock.');
      return;
    }

    if (!userData || !userData.id) {
      showToast('Please login to continue', 'error');
      return;
    }

    setPendingPurchase(bundle);
    setIsModalOpen(true);
  };

  // Process the actual purchase after modal confirmation
  const processPurchase = async () => {
    if (!pendingPurchase) return; 
    
    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post('https://datahustle.onrender.com/api/v1/data/purchase-data', {
        userId: userData.id,
        phoneNumber: phoneNumber,
        network: pendingPurchase.network,
        capacity: pendingPurchase.capacity, 
        price: parseFloat(pendingPurchase.price)
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.status === 'success') {
        showToast(`${pendingPurchase.capacity}GB purchased successfully!`, 'success');
        setSelectedBundle('');
        setPhoneNumber('');
        setError('');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setError(error.response?.data?.message || 'Failed to purchase data bundle');
      showToast(error.response?.data?.message || 'Purchase failed', 'error');
    } finally {
      setIsLoading(false);
      setPendingPurchase(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Elements - Subtle */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-400/5 to-teal-400/5 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-purple-400/5 to-pink-400/5 blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Toast Notification */}
      {toast.visible && (
        <Toast 
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      
      {/* Loading Overlay */}
      <LoadingOverlay isLoading={isLoading} />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <ServiceInfoModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={() => {
              setIsModalOpen(false);
              processPurchase();
            }}
          />
          
          {/* Header - Compact */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-lg">
                <span className="text-lg font-bold text-white">M</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-transparent bg-clip-text">
                MTN Data
              </h1>
            </div>
            <p className="text-white/80 text-sm">Non-Expiry Bundles</p>
          </div>

          {/* Main Card - Compact */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden shadow-xl">
            {/* Header - Compact */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 relative overflow-hidden">
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                    <Zap className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Select Bundle</h2>
                    <p className="text-white/90 text-sm">Choose data & buy instantly</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form - Compact */}
            <div className="p-6">
              {/* Service info button */}
              <div className="mb-4 flex justify-center">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium rounded-lg hover:bg-emerald-500/30 transition-all text-sm"
                >
                  <Info className="h-4 w-4" />
                  <span>Service Info</span>
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 rounded-xl flex items-start bg-red-500/20 border border-red-500/30">
                  <X className="w-4 h-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-red-200 text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handlePurchase} className="space-y-4">
                {/* Bundle Selection Grid */}
                <div>
                  <label className="block text-sm font-bold mb-3 text-white">
                    Select Data Bundle
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {bundles.map((bundle) => (
                      <button
                        key={bundle.value}
                        type="button"
                        onClick={() => setSelectedBundle(bundle.value)}
                        disabled={!bundle.inStock}
                        className={`p-3 rounded-xl text-center transition-all border ${
                          selectedBundle === bundle.value
                            ? 'bg-emerald-500/30 border-emerald-400 text-white'
                            : bundle.inStock
                              ? 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                              : 'bg-gray-500/20 border-gray-500/30 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <div className="text-sm font-bold">{bundle.label}</div>
                        <div className="text-xs text-emerald-400">₵{bundle.price}</div>
                        {!bundle.inStock && (
                          <div className="text-xs text-red-400 mt-1">Out of Stock</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone Number Input */}
                <div>
                  <label className="block text-sm font-bold mb-3 text-white">
                    MTN Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="w-4 h-4 text-emerald-400" />
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      className="pl-10 pr-4 py-3 block w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                      placeholder="0XXXXXXXXX"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-white/70">Format: 0 + 9 digits</p>
                </div>

                {/* Order Summary */}
                {selectedBundle && (
                  <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center">
                      <CreditCard className="w-4 h-4 mr-2 text-emerald-400" />
                      Order Summary
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-white/90 text-sm">
                        <span>Data:</span>
                        <span className="font-medium">{getSelectedBundleDetails()?.capacity}GB</span>
                      </div>
                      <div className="flex justify-between text-white/90 text-sm">
                        <span>Duration:</span>
                        <span className="font-medium text-emerald-400">No-Expiry</span>
                      </div>
                      <div className="border-t border-white/20 pt-2 mt-2">
                        <div className="flex justify-between text-white font-bold">
                          <span>Total:</span>
                          <span className="text-emerald-400">₵{getSelectedBundleDetails()?.price}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Purchase Button */}
                <button
                  type="submit"
                  disabled={isLoading || !selectedBundle || !phoneNumber}
                  className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-bold"
                >
                  <Zap className="mr-2 w-4 h-4" />
                  Purchase Data
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </form>

              {/* Important Notice - Compact */}
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                <div className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-red-400 mb-1">Important</h4>
                    <div className="space-y-1 text-white/80 text-xs">
                      <p>• Turbonet & Broadband SIMs not eligible</p>
                      <p>• Verify number carefully - no refunds</p>
                      <p>• Data delivery may take time</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MTNBundleSelect;