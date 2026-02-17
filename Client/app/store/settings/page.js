'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Store,
  Palette,
  Phone,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

const API_BASE = 'https://datahustle.onrender.com/api/v1';

const TABS = [
  { id: 'general', name: 'General', icon: Store },
  { id: 'design', name: 'Design', icon: Palette },
  { id: 'contact', name: 'Contact', icon: Phone }
];

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    storeName: '',
    description: '',
    contactPhone: '',
    contactEmail: '',
    whatsappNumber: '',
    isActive: true,
    design: {
      primaryColor: '#10B981',
      secondaryColor: '#059669',
      showLogo: true
    }
  });

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  };

  const fetchStore = async () => {
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

      if (data.status !== 'success' || !data.data.store) {
        router.push('/store/create');
        return;
      }

      const storeData = data.data.store;
      setStore(storeData);
      setFormData({
        storeName: storeData.storeName || '',
        description: storeData.description || '',
        contactPhone: storeData.contactPhone || '',
        contactEmail: storeData.contactEmail || '',
        whatsappNumber: storeData.whatsappNumber || '',
        isActive: storeData.isActive !== false,
        design: {
          primaryColor: storeData.design?.primaryColor || '#10B981',
          secondaryColor: storeData.design?.secondaryColor || '#059669',
          showLogo: storeData.design?.showLogo !== false
        }
      });
    } catch (error) {
      console.error('Failed to fetch store:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStore();
  }, [router]);

  const handleSave = async () => {
    const token = getAuthToken();
    if (!token || !store) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/agent-store/stores/${store._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.status === 'success') {
        setSuccess('Settings saved successfully');
        setStore(data.data.store);
      } else {
        setError(data.message || 'Failed to save settings');
      }
    } catch (error) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const copyStoreLink = () => {
    if (store?.storeSlug) {
      navigator.clipboard.writeText(`https://datahustlegh.shop/${store.storeSlug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Store Settings
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your store configuration
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Store Link */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              Your Store Link
            </p>
            <p className="text-sm text-indigo-600 dark:text-indigo-400 truncate mt-1">
              https://datahustlegh.shop/{store?.storeSlug}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyStoreLink}
              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-lg"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
            <a
              href={`https://datahustlegh.shop/${store?.storeSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-lg"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Store Name
              </label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white resize-none"
                placeholder="Tell customers about your store..."
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Store Status</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formData.isActive ? 'Your store is visible to customers' : 'Your store is hidden'}
                </p>
              </div>
              <button
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                className="flex items-center gap-2"
              >
                {formData.isActive ? (
                  <ToggleRight className="w-10 h-10 text-green-500" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Design Tab */}
        {activeTab === 'design' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.design.primaryColor}
                    onChange={(e) => setFormData({
                      ...formData,
                      design: { ...formData.design, primaryColor: e.target.value }
                    })}
                    className="w-12 h-10 rounded cursor-pointer border border-gray-200 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    value={formData.design.primaryColor}
                    onChange={(e) => setFormData({
                      ...formData,
                      design: { ...formData.design, primaryColor: e.target.value }
                    })}
                    className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Secondary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.design.secondaryColor}
                    onChange={(e) => setFormData({
                      ...formData,
                      design: { ...formData.design, secondaryColor: e.target.value }
                    })}
                    className="w-12 h-10 rounded cursor-pointer border border-gray-200 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    value={formData.design.secondaryColor}
                    onChange={(e) => setFormData({
                      ...formData,
                      design: { ...formData.design, secondaryColor: e.target.value }
                    })}
                    className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Preview</p>
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                <div
                  className="p-6 text-white text-center"
                  style={{ backgroundColor: formData.design.primaryColor }}
                >
                  <h3 className="text-xl font-bold">{formData.storeName || 'Your Store'}</h3>
                  <p className="text-sm opacity-90 mt-1">Buy affordable data bundles</p>
                  <button
                    className="mt-4 px-6 py-2 rounded-lg font-medium"
                    style={{ backgroundColor: formData.design.secondaryColor }}
                  >
                    Shop Now
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Show Logo</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Display your store logo in the header
                </p>
              </div>
              <button
                onClick={() => setFormData({
                  ...formData,
                  design: { ...formData.design, showLogo: !formData.design.showLogo }
                })}
              >
                {formData.design.showLogo ? (
                  <ToggleRight className="w-10 h-10 text-green-500" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="0241234567"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Email (Optional)
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="store@example.com"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                WhatsApp Number
              </label>
              <input
                type="tel"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                placeholder="0241234567"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Customers can contact you directly via WhatsApp
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
