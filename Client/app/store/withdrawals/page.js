'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  ArrowDownToLine,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Phone,
  Info,
  TrendingUp,
  Zap,
  CreditCard,
  Shield
} from 'lucide-react';

const API_BASE = 'https://datahustle.onrender.com/api/v1';

const NETWORKS = [
  { value: 'mtn', label: 'MTN Mobile Money', color: 'yellow' },
  { value: 'vodafone', label: 'Telecel Cash', color: 'red' },
  { value: 'airteltigo', label: 'AirtelTigo Money', color: 'blue' }
];

export default function WithdrawalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const [formData, setFormData] = useState({
    amount: '',
    momoNumber: '',
    momoNetwork: 'mtn',
    momoName: ''
  });

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  };

  const fetchData = async () => {
    const token = getAuthToken();
    if (!token) {
      router.push('/SignIn');
      return;
    }

    try {
      // Fetch store
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

      // Fetch withdrawals
      const withdrawalsRes = await fetch(`${API_BASE}/agent-store/stores/${storeId}/withdrawals`, {
        headers: { 'x-auth-token': token }
      });
      const withdrawalsData = await withdrawalsRes.json();

      if (withdrawalsData.status === 'success') {
        setWithdrawals(withdrawalsData.data.withdrawals || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token || !store) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    const amount = parseFloat(formData.amount);

    // Validation
    if (amount < 5) {
      setError('Minimum withdrawal is GH₵5');
      setSubmitting(false);
      return;
    }

    if (amount > store.wallet.availableBalance) {
      setError('Insufficient balance');
      setSubmitting(false);
      return;
    }

    if (!formData.momoNumber || formData.momoNumber.length < 10) {
      setError('Please enter a valid phone number');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/agent-store/stores/${store._id}/withdrawal/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          amount,
          momoNumber: formData.momoNumber,
          momoNetwork: formData.momoNetwork,
          momoName: formData.momoName
        })
      });

      const data = await res.json();

      if (data.status === 'success') {
        setSuccess('Withdrawal request submitted successfully! Money will be sent to your MoMo shortly.');
        setFormData({ amount: '', momoNumber: '', momoNetwork: 'mtn', momoName: '' });
        fetchData();
      } else {
        setError(data.message || 'Failed to submit withdrawal');
      }
    } catch (error) {
      setError('Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => `GH₵${(amount || 0).toFixed(2)}`;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
      case 'processing':
      case 'queued':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30';
      case 'pending':
      case 'processing':
      case 'queued':
        return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30';
      case 'failed':
        return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30';
      default:
        return 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-500/30';
    }
  };

  // Filter withdrawals
  const filteredWithdrawals = filter === 'all'
    ? withdrawals
    : withdrawals.filter(w => w.status === filter);

  // Calculate fee and net
  const amount = parseFloat(formData.amount) || 0;
  const fee = amount * 0.01; // 1% fee
  const netAmount = amount - fee;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const hasPendingWithdrawal = withdrawals.some(w => ['pending', 'processing', 'queued'].includes(w.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-7 h-7 text-indigo-500" />
            Withdrawals
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Transfer your earnings to mobile money
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Balance & Form */}
        <div className="space-y-5">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-white/20 rounded-xl">
                <Wallet className="w-6 h-6" />
              </div>
              <span className="font-medium text-white/90">Available Balance</span>
            </div>
            <p className="text-4xl font-bold mb-2">
              {formatCurrency(store?.wallet?.availableBalance)}
            </p>
            <div className="flex items-center gap-2 text-indigo-200 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>Total Earned: {formatCurrency(store?.wallet?.totalEarnings)}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Completed</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {withdrawals.filter(w => w.status === 'completed').length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Pending</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {withdrawals.filter(w => ['pending', 'processing', 'queued'].includes(w.status)).length}
              </p>
            </div>
          </div>

          {/* Withdrawal Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              New Withdrawal
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-500/20 border border-green-200 dark:border-green-500/30 rounded-xl flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
              </div>
            )}

            {hasPendingWithdrawal && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-500/20 border border-yellow-200 dark:border-yellow-500/30 rounded-xl flex items-start gap-2">
                <Info className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-600 dark:text-yellow-400 text-sm">You have a pending withdrawal. Please wait for it to complete.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (GH₵)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  min="5"
                  step="0.01"
                  disabled={hasPendingWithdrawal || submitting}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-lg font-bold placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 transition-all"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Minimum: GH₵5</p>
              </div>

              {/* Fee Calculator */}
              {amount > 0 && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500 dark:text-gray-400">Fee (1%):</span>
                    <span className="text-gray-700 dark:text-gray-300">-GH₵{fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">You'll Receive:</span>
                    <span className="text-green-600 dark:text-green-400 font-bold text-lg">GH₵{netAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Network */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mobile Network
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {NETWORKS.map(network => (
                    <button
                      key={network.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, momoNetwork: network.value })}
                      disabled={hasPendingWithdrawal || submitting}
                      className={`p-3 rounded-xl border-2 text-center transition-all disabled:opacity-50 ${
                        formData.momoNetwork === network.value
                          ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <span className="text-xs font-medium">{network.value.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="tel"
                    value={formData.momoNumber}
                    onChange={(e) => setFormData({ ...formData, momoNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="0241234567"
                    disabled={hasPendingWithdrawal || submitting}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 transition-all"
                  />
                </div>
              </div>

              {/* Account Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.momoName}
                  onChange={(e) => setFormData({ ...formData, momoName: e.target.value })}
                  placeholder="Name on MoMo account"
                  disabled={hasPendingWithdrawal || submitting}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 transition-all"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || hasPendingWithdrawal || !formData.amount || !formData.momoNumber}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 dark:disabled:from-gray-600 dark:disabled:to-gray-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg disabled:shadow-none"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-5 h-5" />
                    Withdraw to MoMo
                  </>
                )}
              </button>

              {/* Security Note */}
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Shield className="w-4 h-4" />
                <span>Secure withdrawal processed via mobile money</span>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - History */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header with Filters */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-bold text-gray-900 dark:text-white">Withdrawal History</h2>
                <div className="flex gap-2 flex-wrap">
                  {['all', 'completed', 'pending', 'failed'].map((status) => {
                    const count = status === 'all'
                      ? withdrawals.length
                      : withdrawals.filter(w => status === 'pending'
                          ? ['pending', 'processing', 'queued'].includes(w.status)
                          : w.status === status
                        ).length;
                    return (
                      <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          filter === status
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {count > 0 && <span className="ml-1 opacity-75">({count})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Withdrawals List */}
            {filteredWithdrawals.length === 0 ? (
              <div className="p-12 text-center">
                <Wallet className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">No withdrawals yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Your withdrawal history will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredWithdrawals.map((withdrawal) => (
                  <div key={withdrawal._id || withdrawal.withdrawalId} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl ${
                          withdrawal.status === 'completed' ? 'bg-green-100 dark:bg-green-500/20' :
                          withdrawal.status === 'failed' ? 'bg-red-100 dark:bg-red-500/20' : 'bg-yellow-100 dark:bg-yellow-500/20'
                        }`}>
                          {getStatusIcon(withdrawal.status)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-lg">
                            {formatCurrency(withdrawal.requestedAmount)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <CreditCard className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {withdrawal.paymentDetails?.momoNetwork?.toUpperCase()} • {withdrawal.paymentDetails?.momoNumber}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
                            {withdrawal.withdrawalId}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(withdrawal.status)}`}>
                          {getStatusIcon(withdrawal.status)}
                          {withdrawal.status}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {formatDate(withdrawal.createdAt)}
                        </p>
                        {withdrawal.netAmount && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Net: {formatCurrency(withdrawal.netAmount)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-gray-900 dark:text-white font-medium text-sm">How withdrawals work</h3>
                <ul className="mt-2 space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                  <li>• Minimum withdrawal: GH₵5</li>
                  <li>• 1% processing fee applies</li>
                  <li>• Money is sent directly to your MoMo</li>
                  <li>• Processing time: 5-30 minutes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
