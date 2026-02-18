'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Search,
  AlertCircle,
  X,
  Check
} from 'lucide-react';

const API_BASE = 'https://datahustle.onrender.com/api/v1';

const NETWORKS = ['MTN', 'TELECEL', 'AT'];

// Must match backend OFFICIAL_PRICING exactly
const OFFICIAL_PRICING = {
  MTN: {
    1: 4.20, 2: 8.80, 3: 12.80, 4: 17.80, 5: 22.30, 6: 25.00,
    8: 33.00, 10: 41.00, 15: 59.50, 20: 79.00, 25: 99.00,
    30: 121.00, 40: 158.00, 50: 200.00
  },
  AT: {
    1: 3.95, 2: 8.35, 3: 13.25, 4: 16.50, 5: 19.50, 6: 23.50,
    8: 30.50, 10: 38.50, 12: 45.50, 15: 57.50, 25: 95.00,
    30: 115.00, 40: 151.00, 50: 190.00
  },
  TELECEL: {
    5: 19.50, 8: 34.64, 10: 37.50, 12: 43.70, 15: 54.85,
    20: 73.80, 25: 90.75, 30: 107.70, 35: 130.65, 40: 142.60,
    45: 154.55, 50: 177.50, 100: 397.00
  }
};

const getBasePrice = (network, capacity) => {
  return OFFICIAL_PRICING[network]?.[capacity] || null;
};

// Network Icons
const MTNIcon = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <rect width="80" height="80" rx="16" fill="#FFCC00"/>
    <ellipse cx="40" cy="40" rx="30" ry="20" stroke="#000" strokeWidth="3" fill="none"/>
    <text x="40" y="46" textAnchor="middle" fontFamily="Arial Black" fontSize="14" fontWeight="900" fill="#000">MTN</text>
  </svg>
);

const TelecelIcon = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <rect width="80" height="80" rx="16" fill="#E30613"/>
    <circle cx="40" cy="40" r="28" fill="#FFF" fillOpacity="0.15"/>
    <text x="40" y="50" textAnchor="middle" fontFamily="Arial" fontSize="32" fontWeight="700" fill="#FFF">t</text>
  </svg>
);

const ATIcon = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <rect width="80" height="80" rx="16" fill="#0066B3"/>
    <circle cx="30" cy="32" r="5" fill="#FFF"/>
    <circle cx="50" cy="32" r="5" fill="#FFF"/>
    <path d="M24 48 Q40 64 56 48" stroke="#FFF" strokeWidth="5" fill="none" strokeLinecap="round"/>
  </svg>
);

const getNetworkIcon = (network, size = 40) => {
  switch (network) {
    case 'MTN': return <MTNIcon size={size} />;
    case 'TELECEL': return <TelecelIcon size={size} />;
    case 'AT': return <ATIcon size={size} />;
    default: return <MTNIcon size={size} />;
  }
};

const NETWORK_LABELS = { MTN: 'MTN', TELECEL: 'Telecel', AT: 'AirtelTigo' };

export default function ProductsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNetwork, setFilterNetwork] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    network: 'MTN',
    capacity: '',
    capacityUnit: 'GB',
    validity: '30 days',
    basePrice: '',
    sellingPrice: '',
    isActive: true
  });

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  };

  const fetchProducts = async () => {
    const token = getAuthToken();
    if (!token) {
      router.push('/SignIn');
      return;
    }

    try {
      const storeRes = await fetch(`${API_BASE}/agent-store/stores/my-store`, {
        headers: { 'x-auth-token': token }
      });
      const storeData = await storeRes.json();

      if (storeData.status !== 'success' || !storeData.data.store) {
        router.push('/store/create');
        return;
      }

      setStore(storeData.data.store);
      const storeId = storeData.data.store._id;

      const productsRes = await fetch(`${API_BASE}/agent-store/stores/${storeId}/products`, {
        headers: { 'x-auth-token': token }
      });
      const productsData = await productsRes.json();

      if (productsData.status === 'success') {
        setProducts(productsData.data.products || []);
        setFilteredProducts(productsData.data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [router]);

  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.network.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterNetwork) {
      filtered = filtered.filter(p => p.network === filterNetwork);
    }

    setFilteredProducts(filtered);
  }, [searchTerm, filterNetwork, products]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      network: 'MTN',
      capacity: '',
      capacityUnit: 'GB',
      validity: '30 days',
      basePrice: '',
      sellingPrice: '',
      isActive: true
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      network: product.network,
      capacity: product.capacity.toString(),
      capacityUnit: product.capacityUnit,
      validity: product.validity,
      basePrice: product.basePrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      isActive: product.isActive
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token || !store) return;

    setSaving(true);
    setError('');

    try {
      const capacity = parseFloat(formData.capacity);
      const basePrice = getBasePrice(formData.network, capacity);

      if (!basePrice) {
        setError(`Invalid capacity for ${formData.network}. Available: ${Object.keys(OFFICIAL_PRICING[formData.network] || {}).join(', ')}GB`);
        setSaving(false);
        return;
      }

      if (parseFloat(formData.sellingPrice) < basePrice) {
        setError(`Selling price must be at least GH₵${basePrice.toFixed(2)} (base cost)`);
        setSaving(false);
        return;
      }

      const payload = {
        name: formData.name || `${formData.network} ${formData.capacity}${formData.capacityUnit}`,
        network: formData.network,
        capacity,
        capacityUnit: formData.capacityUnit,
        validity: formData.validity,
        sellingPrice: parseFloat(formData.sellingPrice),
        isActive: formData.isActive,
        productType: 'data'
      };

      const url = editingProduct
        ? `${API_BASE}/agent-store/stores/${store._id}/products/${editingProduct._id}`
        : `${API_BASE}/agent-store/stores/${store._id}/products`;

      const res = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.status === 'success') {
        setShowModal(false);
        fetchProducts();
      } else {
        setError(data.message || 'Failed to save product');
      }
    } catch (error) {
      setError('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const toggleProductStatus = async (product) => {
    const token = getAuthToken();
    if (!token || !store) return;

    try {
      const res = await fetch(`${API_BASE}/agent-store/stores/${store._id}/products/${product._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ isActive: !product.isActive })
      });

      if (res.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to toggle product:', error);
    }
  };

  const deleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const token = getAuthToken();
    if (!token || !store) return;

    try {
      const res = await fetch(`${API_BASE}/agent-store/stores/${store._id}/products/${productId}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });

      if (res.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const formatCurrency = (amount) => `GH₵${(amount || 0).toFixed(2)}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Group products by network for summary
  const networkCounts = products.reduce((acc, p) => {
    acc[p.network] = (acc[p.network] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Products
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {products.length} bundle{products.length !== 1 ? 's' : ''} across {Object.keys(networkCounts).length} network{Object.keys(networkCounts).length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Network Filter Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterNetwork('')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
            filterNetwork === ''
              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          All ({products.length})
        </button>
        {NETWORKS.map(net => {
          const count = networkCounts[net] || 0;
          if (count === 0 && filterNetwork !== net) return null;
          return (
            <button
              key={net}
              onClick={() => setFilterNetwork(filterNetwork === net ? '' : net)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                filterNetwork === net
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {getNetworkIcon(net, 20)}
              {NETWORK_LABELS[net]} ({count})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No products found</p>
          <button
            onClick={openAddModal}
            className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Add your first product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const profit = product.sellingPrice - product.basePrice;
            return (
              <div
                key={product._id}
                className={`bg-white dark:bg-gray-800 rounded-xl border ${
                  product.isActive
                    ? 'border-gray-200 dark:border-gray-700'
                    : 'border-gray-200 dark:border-gray-700 opacity-60'
                } overflow-hidden`}
              >
                {/* Card Header with Network Icon */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
                  {getNetworkIcon(product.network, 44)}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {product.capacity}{product.capacityUnit} {NETWORK_LABELS[product.network]}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {product.validity || '30 days'}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleProductStatus(product)}
                    title={product.isActive ? 'Active — click to disable' : 'Inactive — click to enable'}
                  >
                    {product.isActive ? (
                      <ToggleRight className="w-7 h-7 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Pricing */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Base Cost</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(product.basePrice)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Selling Price</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(product.sellingPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Your Profit</span>
                    <span className={`text-sm font-semibold ${profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                      {profit > 0 ? '+' : ''}{formatCurrency(profit)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => openEditModal(product)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <div className="w-px h-8 bg-gray-100 dark:bg-gray-700" />
                  <button
                    onClick={() => deleteProduct(product._id)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Network Selector with Icons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Network *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {NETWORKS.map(net => (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setFormData({ ...formData, network: net, capacity: '', basePrice: '' })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        formData.network === net
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {getNetworkIcon(net, 36)}
                      <span className={`text-xs font-medium ${
                        formData.network === net
                          ? 'text-indigo-700 dark:text-indigo-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {NETWORK_LABELS[net]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Capacity (GB) *
                </label>
                <select
                  value={formData.capacity}
                  onChange={(e) => {
                    const cap = e.target.value;
                    const base = getBasePrice(formData.network, parseFloat(cap));
                    setFormData({ ...formData, capacity: cap, capacityUnit: 'GB', basePrice: base ? base.toFixed(2) : '' });
                  }}
                  required
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="">Select capacity</option>
                  {Object.keys(OFFICIAL_PRICING[formData.network] || {}).map(cap => (
                    <option key={cap} value={cap}>{cap}GB — Base: GH₵{OFFICIAL_PRICING[formData.network][cap].toFixed(2)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={`${formData.network} ${formData.capacity}${formData.capacityUnit}`}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for auto-generated name</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Validity
                </label>
                <input
                  type="text"
                  value={formData.validity}
                  onChange={(e) => setFormData({ ...formData, validity: e.target.value })}
                  placeholder="e.g., 30 days"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Base Cost (GH₵)
                  </label>
                  <input
                    type="text"
                    value={formData.basePrice ? `GH₵${parseFloat(formData.basePrice).toFixed(2)}` : 'Select capacity'}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Set by platform</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Your Selling Price (GH₵) *
                  </label>
                  <input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    placeholder="0.00"
                    required
                    min={formData.basePrice || 0}
                    step="0.01"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                  {formData.basePrice && (
                    <p className="text-xs text-gray-500 mt-1">Min: GH₵{parseFloat(formData.basePrice).toFixed(2)}</p>
                  )}
                </div>
              </div>

              {formData.basePrice && formData.sellingPrice && parseFloat(formData.sellingPrice) >= parseFloat(formData.basePrice) && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Profit per sale: <span className="font-semibold">GH₵{(parseFloat(formData.sellingPrice) - parseFloat(formData.basePrice)).toFixed(2)}</span>
                  </p>
                </div>
              )}
              {formData.basePrice && formData.sellingPrice && parseFloat(formData.sellingPrice) < parseFloat(formData.basePrice) && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Selling price must be at least GH₵{parseFloat(formData.basePrice).toFixed(2)}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className="flex items-center gap-2"
                >
                  {formData.isActive ? (
                    <ToggleRight className="w-6 h-6 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </span>
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium disabled:bg-indigo-400 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {editingProduct ? 'Save Changes' : 'Add Product'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
