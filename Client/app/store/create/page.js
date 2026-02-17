'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Store,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  Package,
  Palette,
  Rocket
} from 'lucide-react';

const API_BASE = 'https://datahustle.onrender.com/api/v1';

const STEPS = [
  { id: 1, name: 'Store Details', icon: Store },
  { id: 2, name: 'Products', icon: Package },
  { id: 3, name: 'Customize', icon: Palette },
  { id: 4, name: 'Launch', icon: Rocket }
];

const NETWORKS = ['MTN', 'TELECEL', 'AT'];

const DEFAULT_PRODUCTS = {
  MTN: [
    { capacity: 1, capacityUnit: 'GB', validity: '30 days', basePrice: 4.5, sellingPrice: 5 },
    { capacity: 2, capacityUnit: 'GB', validity: '30 days', basePrice: 9, sellingPrice: 10 },
    { capacity: 3, capacityUnit: 'GB', validity: '30 days', basePrice: 13.5, sellingPrice: 15 },
    { capacity: 5, capacityUnit: 'GB', validity: '30 days', basePrice: 22.5, sellingPrice: 25 },
    { capacity: 10, capacityUnit: 'GB', validity: '30 days', basePrice: 45, sellingPrice: 50 },
  ],
  TELECEL: [
    { capacity: 1, capacityUnit: 'GB', validity: '30 days', basePrice: 3.5, sellingPrice: 4 },
    { capacity: 2, capacityUnit: 'GB', validity: '30 days', basePrice: 7, sellingPrice: 8 },
    { capacity: 5, capacityUnit: 'GB', validity: '30 days', basePrice: 15, sellingPrice: 17 },
    { capacity: 10, capacityUnit: 'GB', validity: '30 days', basePrice: 28, sellingPrice: 32 },
  ],
  AT: [
    { capacity: 1, capacityUnit: 'GB', validity: '30 days', basePrice: 4, sellingPrice: 4.5 },
    { capacity: 2, capacityUnit: 'GB', validity: '30 days', basePrice: 8, sellingPrice: 9 },
    { capacity: 5, capacityUnit: 'GB', validity: '30 days', basePrice: 20, sellingPrice: 23 },
    { capacity: 10, capacityUnit: 'GB', validity: '30 days', basePrice: 38, sellingPrice: 43 },
  ]
};

export default function CreateStore() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingStore, setCheckingStore] = useState(true);
  const [error, setError] = useState('');
  const [slugAvailable, setSlugAvailable] = useState(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    storeName: '',
    storeSlug: '',
    description: '',
    contactPhone: '',
    whatsappNumber: '',
    selectedNetworks: ['MTN'],
    products: [],
    design: {
      primaryColor: '#10B981',
      secondaryColor: '#059669'
    }
  });

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  };

  // Check if user already has a store
  useEffect(() => {
    const checkExistingStore = async () => {
      const token = getAuthToken();
      if (!token) {
        router.push('/SignIn');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/agent-store/stores/my-store`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.status === 'success' && data.data.store) {
          router.push('/store');
          return;
        }
      } catch (error) {
        console.error('Error checking store:', error);
      } finally {
        setCheckingStore(false);
      }
    };

    checkExistingStore();
  }, [router]);

  // Generate slug from store name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Check slug availability
  const checkSlugAvailability = async (slug) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    setCheckingSlug(true);
    try {
      const res = await fetch(`${API_BASE}/agent-store/store/${slug}`);
      const data = await res.json();
      setSlugAvailable(data.status !== 'success');
    } catch (error) {
      setSlugAvailable(true);
    } finally {
      setCheckingSlug(false);
    }
  };

  // Handle store name change
  const handleStoreNameChange = (e) => {
    const name = e.target.value;
    const slug = generateSlug(name);
    setFormData({ ...formData, storeName: name, storeSlug: slug });
    checkSlugAvailability(slug);
  };

  // Handle slug change
  const handleSlugChange = (e) => {
    const slug = generateSlug(e.target.value);
    setFormData({ ...formData, storeSlug: slug });
    checkSlugAvailability(slug);
  };

  // Handle network selection
  const toggleNetwork = (network) => {
    const current = formData.selectedNetworks;
    if (current.includes(network)) {
      if (current.length > 1) {
        setFormData({ ...formData, selectedNetworks: current.filter(n => n !== network) });
      }
    } else {
      setFormData({ ...formData, selectedNetworks: [...current, network] });
    }
  };

  // Build products list from selected networks
  const buildProducts = () => {
    const products = [];
    formData.selectedNetworks.forEach(network => {
      DEFAULT_PRODUCTS[network]?.forEach(product => {
        products.push({
          ...product,
          network,
          name: `${network} ${product.capacity}${product.capacityUnit}`,
          productType: 'data',
          isActive: true
        });
      });
    });
    return products;
  };

  // Navigate steps
  const nextStep = () => {
    if (currentStep === 2) {
      setFormData({ ...formData, products: buildProducts() });
    }
    setCurrentStep(Math.min(currentStep + 1, 4));
    setError('');
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
    setError('');
  };

  // Create store
  const createStore = async () => {
    const token = getAuthToken();
    if (!token) {
      router.push('/SignIn');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        storeName: formData.storeName,
        storeSlug: formData.storeSlug,
        description: formData.description,
        contactPhone: formData.contactPhone,
        whatsappNumber: formData.whatsappNumber || formData.contactPhone,
        design: formData.design,
        products: formData.products.length > 0 ? formData.products : buildProducts()
      };

      const res = await fetch(`${API_BASE}/agent-store/stores/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.status === 'success') {
        router.push('/store');
      } else {
        setError(data.message || 'Failed to create store');
      }
    } catch (error) {
      setError('Failed to create store. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Validate step
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.storeName.length >= 3 && formData.storeSlug.length >= 3 && slugAvailable === true && formData.contactPhone.length >= 10;
      case 2:
        return formData.selectedNetworks.length > 0;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  if (checkingStore) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-500" />
            Create Your Data Store
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Start selling data bundles and earn money
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep > step.id
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : currentStep === step.id
                    ? 'border-indigo-500 text-indigo-500'
                    : 'border-gray-300 dark:border-gray-600 text-gray-400'
                }`}>
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`hidden sm:block w-16 lg:w-24 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((step) => (
              <span
                key={step.id}
                className={`text-xs ${
                  currentStep >= step.id
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-400'
                }`}
              >
                {step.name}
              </span>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Step 1: Store Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Store Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Store Name *
                </label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={handleStoreNameChange}
                  placeholder="e.g., John's Data Hub"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Store URL *
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-gray-100 dark:bg-gray-600 border border-r-0 border-gray-200 dark:border-gray-600 rounded-l-lg text-sm text-gray-500 dark:text-gray-400">
                    datahustlegh.shop/
                  </span>
                  <input
                    type="text"
                    value={formData.storeSlug}
                    onChange={handleSlugChange}
                    placeholder="my-store"
                    className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                  />
                </div>
                {checkingSlug && (
                  <p className="text-sm text-gray-500 mt-1">Checking availability...</p>
                )}
                {!checkingSlug && slugAvailable === true && formData.storeSlug && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    ✓ This URL is available
                  </p>
                )}
                {!checkingSlug && slugAvailable === false && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    ✗ This URL is taken
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell customers about your store..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="0241234567"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  WhatsApp Number (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  placeholder="Same as contact if empty"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Step 2: Products */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select Networks
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose which networks you want to sell data for. Products will be auto-generated with competitive pricing.
              </p>

              <div className="grid grid-cols-3 gap-3">
                {NETWORKS.map((network) => (
                  <button
                    key={network}
                    onClick={() => toggleNetwork(network)}
                    className={`p-4 rounded-lg border-2 text-center transition-colors ${
                      formData.selectedNetworks.includes(network)
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <span className={`font-medium ${
                      formData.selectedNetworks.includes(network)
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {network}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Products Preview
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {formData.selectedNetworks.map(network => (
                    DEFAULT_PRODUCTS[network]?.map((product, idx) => (
                      <div
                        key={`${network}-${idx}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-600 dark:text-gray-400">
                          {network} {product.capacity}{product.capacityUnit}
                        </span>
                        <span className="text-gray-900 dark:text-white">
                          GH₵{product.sellingPrice}
                        </span>
                      </div>
                    ))
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Customize */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Customize Store
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose your store's brand colors
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.design.primaryColor}
                      onChange={(e) => setFormData({
                        ...formData,
                        design: { ...formData.design, primaryColor: e.target.value }
                      })}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.design.primaryColor}
                      onChange={(e) => setFormData({
                        ...formData,
                        design: { ...formData.design, primaryColor: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.design.secondaryColor}
                      onChange={(e) => setFormData({
                        ...formData,
                        design: { ...formData.design, secondaryColor: e.target.value }
                      })}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.design.secondaryColor}
                      onChange={(e) => setFormData({
                        ...formData,
                        design: { ...formData.design, secondaryColor: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Preview</p>
                <div
                  className="p-4 rounded-lg text-white text-center"
                  style={{ backgroundColor: formData.design.primaryColor }}
                >
                  <p className="font-semibold">{formData.storeName || 'Your Store'}</p>
                  <button
                    className="mt-2 px-4 py-1.5 rounded text-sm font-medium"
                    style={{ backgroundColor: formData.design.secondaryColor }}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Launch */}
          {currentStep === 4 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto">
                <Rocket className="w-8 h-8 text-indigo-500" />
              </div>

              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Ready to Launch!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Review your store details below
              </p>

              <div className="text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Store Name</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formData.storeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Store URL</span>
                  <span className="font-medium text-gray-900 dark:text-white">datahustlegh.shop/{formData.storeSlug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Networks</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formData.selectedNetworks.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Products</span>
                  <span className="font-medium text-gray-900 dark:text-white">{buildProducts().length} bundles</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Contact</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formData.contactPhone}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            {currentStep > 1 ? (
              <button
                onClick={prevStep}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={createStore}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    Launch Store
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
