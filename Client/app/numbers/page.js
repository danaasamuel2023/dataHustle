'use client';

import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

export default function PhoneNumbersPage() {
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  const fetchPhoneNumbers = async (userEmail) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`http://localhost:5000/api/orders?email=${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }
      
      // Extract phone numbers from orders
      const numbers = [];
      data.forEach(order => {
        if (order.phoneNumbers && Array.isArray(order.phoneNumbers)) {
          numbers.push(...order.phoneNumbers);
        } else if (order.phoneNumber) {
          numbers.push(order.phoneNumber);
        }
      });
      
      // Remove duplicates and filter out empty values
      const uniqueNumbers = [...new Set(numbers.filter(num => num && num.trim()))];
      setPhoneNumbers(uniqueNumbers);
      
    } catch (err) {
      setError(err.message);
      setPhoneNumbers([]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (phoneNumber, index) => {
    try {
      await navigator.clipboard.writeText(phoneNumber);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyAllNumbers = async () => {
    try {
      const allNumbers = phoneNumbers.join('\n');
      await navigator.clipboard.writeText(allNumbers);
      setCopiedIndex('all');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy all numbers:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      fetchPhoneNumbers(email.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Phone Numbers Display</h1>
          
          {/* Email Input Form */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email to fetch phone numbers"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Fetch Numbers'}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {/* Phone Numbers Display */}
          {phoneNumbers.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-700">
                  Phone Numbers ({phoneNumbers.length})
                </h2>
                <button
                  onClick={copyAllNumbers}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  {copiedIndex === 'all' ? (
                    <>
                      <Check size={16} />
                      Copied All!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy All
                    </>
                  )}
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {phoneNumbers.map((phoneNumber, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-3 rounded-md border hover:shadow-sm transition-shadow"
                    >
                      <span className="font-mono text-gray-800 select-all">
                        {phoneNumber}
                      </span>
                      <button
                        onClick={() => copyToClipboard(phoneNumber, index)}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check size={14} />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* No Numbers Found */}
          {!loading && phoneNumbers.length === 0 && email && !error && (
            <div className="text-center py-8 text-gray-500">
              No phone numbers found for the provided email.
            </div>
          )}

          {/* Initial State */}
          {!loading && phoneNumbers.length === 0 && !email && !error && (
            <div className="text-center py-8 text-gray-500">
              Enter an email address to fetch and display phone numbers from orders.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}