// withdrawalRoutes.js - DataMart-style withdrawal with Queue + Multi-Provider + Fallback
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');
const auth = require('../middlewareUser/middleware');

const {
  AgentStore,
  AgentTransaction,
  StoreWithdrawal,
  WalletAuditLog,
  PlatformSettings,
  PaystackWithdrawalQueue
} = require('../schema/storeSchema');

// =============================================================================
// CONFIGURATION DEFAULTS (fallbacks if not in PlatformSettings)
// =============================================================================
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const MOOLRE_BASE_URL = process.env.MOOLRE_BASE_URL || 'https://api.moolre.com';
const BULKCLIX_BASE_URL = process.env.BULKCLIX_BASE_URL || 'https://api.bulkclix.com/api/v1/payment-api';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
const logOperation = (operation, data) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [WITHDRAWAL] [${operation}]`, JSON.stringify(data, null, 2));
};

const formatPhoneInternational = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '233' + cleaned.substring(1);
  if (!cleaned.startsWith('233')) cleaned = '233' + cleaned;
  return cleaned;
};

const formatPhoneLocal = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('233')) cleaned = '0' + cleaned.substring(3);
  if (!cleaned.startsWith('0')) cleaned = '0' + cleaned;
  return cleaned;
};

// Network detection by phone prefix
const NETWORK_PREFIXES = {
  MTN: ['024', '054', '055', '059', '053', '025', '023'],
  TELECEL: ['020', '050'],
  AIRTELTIGO: ['026', '027', '056', '057']
};

const detectNetworkFromPhone = (phone) => {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('233')) cleaned = '0' + cleaned.substring(3);
  if (!cleaned.startsWith('0')) cleaned = '0' + cleaned;
  const prefix = cleaned.substring(0, 3);
  for (const [network, prefixes] of Object.entries(NETWORK_PREFIXES)) {
    if (prefixes.includes(prefix)) return network;
  }
  return null;
};

const mapMoMoNetwork = (network) => {
  const map = {
    'mtn': 'MTN', 'MTN': 'MTN',
    'vodafone': 'TELECEL', 'VODAFONE': 'TELECEL', 'telecel': 'TELECEL', 'TELECEL': 'TELECEL',
    'airteltigo': 'AIRTELTIGO', 'AIRTELTIGO': 'AIRTELTIGO', 'at': 'AIRTELTIGO', 'AT': 'AIRTELTIGO'
  };
  return map[network] || network.toUpperCase();
};

const validatePhoneNetwork = (phone, selectedNetwork) => {
  const detected = detectNetworkFromPhone(phone);
  const normalized = mapMoMoNetwork(selectedNetwork);
  if (!detected) return { valid: false, error: 'Unable to detect network for this phone number.' };
  if (detected !== normalized) return { valid: false, error: `Phone belongs to ${detected} but you selected ${normalized}.` };
  return { valid: true, detected, selected: normalized };
};

const generateWithdrawalId = () => `SWD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

// =============================================================================
// GET PLATFORM SETTINGS
// =============================================================================
async function getPlatformSettings() {
  let settings = await PlatformSettings.findOne({ key: 'platform_settings' });
  if (!settings) settings = await PlatformSettings.create({ key: 'platform_settings' });
  return settings;
}

async function getProviderConfig() {
  const settings = await getPlatformSettings();
  const wp = settings.withdrawalProviders || {};
  const activeProvider = wp.activeProvider || 'paystack';
  const enableAutoFallback = wp.enableAutoFallback !== false;
  let providerPriority = wp.providerPriority || ['paystack', 'moolre', 'bulkclix'];

  const enabledProviders = [];
  if (wp.paystack?.enabled) enabledProviders.push('paystack');
  if (wp.moolre?.enabled) enabledProviders.push('moolre');
  if (wp.bulkclix?.enabled) enabledProviders.push('bulkclix');

  // If no providers enabled, default to paystack
  if (enabledProviders.length === 0) enabledProviders.push('paystack');

  if (activeProvider !== 'auto' && enabledProviders.includes(activeProvider)) {
    providerPriority = [activeProvider, ...enabledProviders.filter(p => p !== activeProvider)];
  } else {
    providerPriority = providerPriority.filter(p => enabledProviders.includes(p));
  }

  return { activeProvider, enableAutoFallback, providerPriority, enabledProviders, settings: wp };
}

async function updateProviderStats(provider, success, amount = 0, errorMessage = null) {
  try {
    const path = `withdrawalProviders.${provider}`;
    const update = { $set: { [`${path}.lastUsed`]: new Date() }, $inc: {} };
    if (success) {
      update.$inc[`${path}.successCount`] = 1;
      update.$inc[`${path}.totalAmountProcessed`] = amount;
    } else {
      update.$inc[`${path}.failureCount`] = 1;
      if (errorMessage) update.$set[`${path}.lastError`] = errorMessage;
    }
    await PlatformSettings.findOneAndUpdate({ key: 'platform_settings' }, update);
  } catch (err) {
    console.error('[PROVIDER_STATS] Error:', err.message);
  }
}

// =============================================================================
// PAYSTACK FUNCTIONS
// =============================================================================
async function getPaystackSecretKey() {
  const settings = await PlatformSettings.findOne({ key: 'platform_settings' });
  const key = settings?.withdrawalProviders?.paystack?.secretKey;
  if (key && key.trim()) return key.trim();
  return process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRETE_KEY || '';
}

async function paystackRequest(method, endpoint, data = null) {
  try {
    const secretKey = await getPaystackSecretKey();
    const config = {
      method, url: `${PAYSTACK_BASE_URL}${endpoint}`,
      headers: { 'Authorization': `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      timeout: 60000
    };
    if (data) config.data = data;
    const response = await axios(config);
    return { success: response.data?.status === true, data: response.data, statusCode: response.status };
  } catch (error) {
    return { success: false, error: error.message, errorMessage: error.response?.data?.message, statusCode: error.response?.status };
  }
}

const mapNetworkForPaystack = (network) => {
  const map = { 'mtn': 'MTN', 'MTN': 'MTN', 'vodafone': 'VOD', 'telecel': 'VOD', 'TELECEL': 'VOD', 'airteltigo': 'ATL', 'AIRTELTIGO': 'ATL', 'at': 'ATL', 'AT': 'ATL' };
  return map[network] || 'MTN';
};

async function paystackProcessWithdrawal(params) {
  const { amount, phone, network, name, externalRef, reference } = params;
  logOperation('PAYSTACK_START', { externalRef, amount, network });

  // Create recipient
  const recipientRes = await paystackRequest('POST', '/transferrecipient', {
    type: 'mobile_money', name, account_number: formatPhoneLocal(phone),
    bank_code: mapNetworkForPaystack(network), currency: 'GHS'
  });

  if (!recipientRes.success || !recipientRes.data?.data?.recipient_code) {
    return { success: false, failed: true, error: recipientRes.errorMessage || 'Failed to create recipient' };
  }

  const recipientCode = recipientRes.data.data.recipient_code;

  // Initiate transfer
  const transferRes = await paystackRequest('POST', '/transfer', {
    source: 'balance', amount: Math.round(amount * 100), recipient: recipientCode,
    reason: reference || 'DataHustle Withdrawal', reference: externalRef
  });

  if (!transferRes.success || !transferRes.data?.data?.transfer_code) {
    return { success: false, failed: true, error: transferRes.errorMessage || 'Transfer failed', recipientCode };
  }

  const td = transferRes.data.data;
  const completed = td.status === 'success';
  const pending = td.status === 'pending' || td.status === 'otp';
  const failed = td.status === 'failed' || td.status === 'reversed';

  return {
    success: !failed, completed, pending, failed,
    transferCode: td.transfer_code, transactionId: td.id, recipientCode,
    amount: td.amount / 100, message: completed ? 'Transfer completed' : 'Transfer initiated'
  };
}

async function paystackCheckStatus(transferCode) {
  const res = await paystackRequest('GET', `/transfer/${transferCode}`);
  if (!res.success) return { success: false, error: res.errorMessage || 'Status check failed' };
  const status = res.data?.data?.status;
  return {
    success: true, status,
    completed: status === 'success',
    pending: status === 'pending' || status === 'otp',
    failed: status === 'failed' || status === 'reversed'
  };
}

// =============================================================================
// MOOLRE FUNCTIONS
// =============================================================================
async function getMoolreConfig() {
  const settings = await PlatformSettings.findOne({ key: 'platform_settings' });
  const m = settings?.withdrawalProviders?.moolre || {};
  return {
    apiKey: m.apiKey || process.env.MOOLRE_API_KEY || '',
    apiUser: m.apiUser || process.env.MOOLRE_API_USER || '',
    accountNumber: m.accountNumber || process.env.MOOLRE_ACCOUNT_NUMBER || ''
  };
}

const mapNetworkForMoolre = (network) => {
  const map = { 'mtn': 1, 'MTN': 1, 'vodafone': 6, 'telecel': 6, 'TELECEL': 6, 'airteltigo': 7, 'AIRTELTIGO': 7, 'at': 7, 'AT': 7 };
  return map[network] || 1;
};

async function moolreRequest(method, endpoint, data) {
  try {
    const config = await getMoolreConfig();
    const res = await axios({
      method, url: `${MOOLRE_BASE_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json', 'X-API-USER': config.apiUser, 'X-API-KEY': config.apiKey },
      data, timeout: 60000
    });
    return { success: String(res.data?.status) === '1', data: res.data };
  } catch (error) {
    return { success: false, error: error.message, errorMessage: error.response?.data?.message };
  }
}

async function moolreProcessWithdrawal(params) {
  const { amount, phone, network, externalRef, reference } = params;
  const config = await getMoolreConfig();
  const res = await moolreRequest('POST', '/open/transact/transfer', {
    type: 1, channel: mapNetworkForMoolre(network), currency: 'GHS',
    amount: parseFloat(amount).toFixed(2), receiver: formatPhoneInternational(phone),
    externalref: externalRef, reference: reference || 'DataHustle Withdrawal',
    accountnumber: config.accountNumber
  });

  if (!res.success) return { success: false, failed: true, error: res.errorMessage || res.error || 'Moolre transfer failed' };

  const txStatus = parseInt(res.data?.data?.txstatus, 10);
  if (txStatus === 2) return { success: false, failed: true, error: res.data?.message || 'Transfer failed' };

  return {
    success: true, completed: txStatus === 1, pending: txStatus === 0 || txStatus === 3, failed: false,
    transactionId: res.data?.data?.transactionid, transferCode: res.data?.data?.transactionid,
    amount, message: res.data?.message
  };
}

async function moolreCheckStatus(externalRef) {
  const config = await getMoolreConfig();
  const res = await moolreRequest('POST', '/open/transact/status', {
    type: 1, idtype: 1, id: externalRef, accountnumber: config.accountNumber
  });
  if (!res.success) return { success: false, error: res.error };
  const txStatus = parseInt(res.data?.data?.txstatus, 10);
  return { success: true, completed: txStatus === 1, pending: txStatus === 0 || txStatus === 3, failed: txStatus === 2 };
}

// =============================================================================
// BULKCLIX FUNCTIONS
// =============================================================================
async function getBulkclixApiKey() {
  const settings = await PlatformSettings.findOne({ key: 'platform_settings' });
  return settings?.withdrawalProviders?.bulkclix?.apiKey || process.env.BULKCLIX_API_KEY || '';
}

const mapNetworkForBulkclix = (network) => {
  const map = { 'mtn': 'MTN', 'MTN': 'MTN', 'vodafone': 'TELECEL', 'telecel': 'TELECEL', 'TELECEL': 'TELECEL', 'airteltigo': 'AIRTELTIGO', 'AIRTELTIGO': 'AIRTELTIGO' };
  return map[network] || network.toUpperCase();
};

async function bulkclixProcessWithdrawal(params) {
  const { amount, phone, network, name, externalRef } = params;
  try {
    const apiKey = await getBulkclixApiKey();
    const res = await axios({
      method: 'POST', url: `${BULKCLIX_BASE_URL}/send/mobilemoney`,
      headers: { 'x-api-key': apiKey, 'Accept': 'application/json', 'Content-Type': 'application/json' },
      data: { amount: amount.toString(), account_number: formatPhoneInternational(phone), channel: mapNetworkForBulkclix(network), account_name: name, client_reference: externalRef },
      timeout: 45000
    });
    return {
      success: true, completed: true, pending: false, failed: false,
      transactionId: res.data?.transaction_id, transferCode: res.data?.transaction_id,
      amount, message: 'Transfer completed via BulkClix'
    };
  } catch (error) {
    return { success: false, failed: true, error: error.response?.data?.message || error.message };
  }
}

// =============================================================================
// MIDDLEWARE
// =============================================================================
const verifyAgentOwnership = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const store = await AgentStore.findById(storeId);
    if (!store) return res.status(404).json({ status: 'error', message: 'Store not found' });
    if (store.owner.toString() !== req.user._id.toString()) return res.status(403).json({ status: 'error', message: 'Unauthorized' });
    req.store = store;
    next();
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to verify ownership' });
  }
};

// =============================================================================
// ROUTES
// =============================================================================

// Get withdrawal settings/limits
router.get('/stores/:storeId/withdrawal/settings', auth, verifyAgentOwnership, async (req, res) => {
  try {
    const store = req.store;
    const settings = await getPlatformSettings();
    const wp = settings.withdrawalProviders;

    res.json({
      status: 'success',
      data: {
        availableBalance: store.wallet.availableBalance,
        pendingBalance: store.wallet.pendingBalance,
        minWithdrawal: wp.minWithdrawal,
        maxWithdrawal: wp.maxWithdrawal,
        dailyLimit: wp.dailyLimit || 3000,
        feePercent: wp.feePercent,
        fixedFee: wp.fixedFee,
        methods: ['momo'],
        withdrawalsPaused: wp.withdrawalsPaused || false,
        pauseReason: wp.pauseReason
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch settings' });
  }
});

// =============================================================================
// CREATE WITHDRAWAL REQUEST (Queue + Multi-Provider + Fallback)
// =============================================================================
router.post('/stores/:storeId/withdrawal/request', auth, verifyAgentOwnership, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { amount, momoNumber, momoNetwork, momoName, agentNotes } = req.body;
    const store = req.store;

    logOperation('CREATE_WITHDRAWAL', { storeId: store._id, amount, network: momoNetwork });

    // Check for pending/processing/queued withdrawals
    const existingProcessing = await StoreWithdrawal.findOne({
      storeId: store._id,
      status: { $in: ['pending', 'processing', 'queued'] }
    });

    if (existingProcessing) {
      return res.status(409).json({
        status: 'error',
        message: 'You have a pending withdrawal. Please wait for it to complete.',
        existingWithdrawal: {
          withdrawalId: existingProcessing.withdrawalId,
          status: existingProcessing.status,
          amount: existingProcessing.requestedAmount
        }
      });
    }

    // Check if withdrawals are paused
    const settings = await getPlatformSettings();
    const wp = settings.withdrawalProviders;

    if (wp.withdrawalsPaused) {
      return res.status(503).json({
        status: 'error',
        message: wp.pauseReason || 'Withdrawals are temporarily paused. Please try again later.',
        paused: true
      });
    }

    // Validations
    if (!amount || amount <= 0) return res.status(400).json({ status: 'error', message: 'Invalid amount' });
    if (amount < wp.minWithdrawal) return res.status(400).json({ status: 'error', message: `Minimum is GH₵${wp.minWithdrawal}` });
    if (amount > wp.maxWithdrawal) return res.status(400).json({ status: 'error', message: `Maximum is GH₵${wp.maxWithdrawal}` });
    if (amount > store.wallet.availableBalance) return res.status(400).json({ status: 'error', message: 'Insufficient balance' });
    if (!momoNetwork || !momoNumber) return res.status(400).json({ status: 'error', message: 'MoMo network and number are required' });

    // Network validation
    const networkValidation = validatePhoneNetwork(momoNumber, momoNetwork);
    if (!networkValidation.valid) {
      return res.status(400).json({ status: 'error', message: networkValidation.error });
    }

    // Daily limit check
    const dailyLimit = wp.dailyLimit || 3000;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayWithdrawals = await StoreWithdrawal.aggregate([
      { $match: { storeId: store._id, createdAt: { $gte: todayStart }, status: { $nin: ['cancelled', 'failed'] } } },
      { $group: { _id: null, totalAmount: { $sum: '$requestedAmount' } } }
    ]);
    const todayTotal = todayWithdrawals[0]?.totalAmount || 0;
    if (amount > dailyLimit - todayTotal) {
      return res.status(400).json({
        status: 'error',
        message: `Daily limit is GH₵${dailyLimit}. You've withdrawn GH₵${todayTotal} today. Remaining: GH₵${dailyLimit - todayTotal}`
      });
    }

    // Calculate fees
    const fee = Math.round(((amount * wp.feePercent / 100) + wp.fixedFee) * 100) / 100;
    const netAmount = parseFloat((amount - fee).toFixed(2));
    const withdrawalId = generateWithdrawalId();

    // Get provider config
    const providerConfig = await getProviderConfig();
    const { providerPriority, enableAutoFallback } = providerConfig;

    logOperation('PROVIDER_CONFIG', { activeProvider: providerConfig.activeProvider, providerPriority });

    const transferParams = {
      amount: netAmount, phone: momoNumber, network: momoNetwork,
      name: momoName || 'Customer', externalRef: withdrawalId,
      reference: `DataHustle Withdrawal - ${store.storeName}`
    };

    // =========================================================================
    // PAYSTACK QUEUE MODE - If first provider is Paystack, queue it
    // =========================================================================
    if (providerPriority[0] === 'paystack') {
      logOperation('PAYSTACK_QUEUE_MODE', { withdrawalId });

      session.startTransaction();

      // Atomic balance update
      const balanceUpdate = await AgentStore.findOneAndUpdate(
        { _id: store._id, 'wallet.availableBalance': { $gte: amount } },
        { $inc: { 'wallet.availableBalance': -amount, 'wallet.pendingBalance': amount } },
        { session, new: true }
      );

      if (!balanceUpdate) {
        await session.abortTransaction();
        return res.status(409).json({ status: 'error', message: 'Balance changed during processing. Please try again.' });
      }

      // Double-check no duplicate
      const dupCheck = await StoreWithdrawal.findOne({
        storeId: store._id, status: { $in: ['pending', 'processing', 'queued'] }
      }).session(session);

      if (dupCheck) {
        await session.abortTransaction();
        return res.status(409).json({ status: 'error', message: 'Another withdrawal is already processing.' });
      }

      // Create withdrawal with queued status
      const withdrawal = new StoreWithdrawal({
        withdrawalId, storeId: store._id, requestedAmount: amount, fee, netAmount,
        method: 'momo',
        paymentDetails: { momoNetwork, momoNumber: formatPhoneInternational(momoNumber), momoName: momoName || '' },
        status: 'queued', agentNotes,
        processingDetails: {
          initiatedAt: new Date(), initiatedBy: req.user._id.toString(),
          provider: 'paystack', gateway: 'mobile_money', queuedAt: new Date()
        }
      });
      await withdrawal.save({ session });

      // Add to queue
      await PaystackWithdrawalQueue.create([{
        withdrawalId: withdrawal._id, withdrawalRef: withdrawalId,
        storeId: store._id, status: 'queued', queuedAt: new Date()
      }], { session });

      // Audit log
      const auditLog = new WalletAuditLog({
        storeId: store._id, operation: 'withdrawal_hold', amount: -amount,
        balanceBefore: store.wallet.availableBalance,
        balanceAfter: balanceUpdate.wallet.availableBalance,
        source: { type: 'withdrawal', referenceId: withdrawalId, referenceModel: 'StoreWithdrawal' },
        performedBy: { userId: req.user._id, userType: 'agent' },
        reason: 'Withdrawal queued - funds held pending Paystack processing'
      });
      await auditLog.save({ session });

      await session.commitTransaction();

      const queuePosition = await PaystackWithdrawalQueue.countDocuments({ status: 'queued' });

      return res.json({
        status: 'success',
        message: 'Withdrawal queued for processing. You will receive your money shortly.',
        data: {
          withdrawal: {
            id: withdrawal._id, withdrawalId, amount, fee, netAmount,
            method: 'momo', status: 'queued', createdAt: withdrawal.createdAt,
            estimatedTime: '1-5 minutes'
          },
          provider: 'paystack', queuePosition, queuedForProcessing: true
        }
      });
    }

    // =========================================================================
    // NON-PAYSTACK: Try providers in order (immediate processing)
    // =========================================================================
    let transferResult = null;
    let usedProvider = null;
    let providerErrors = {};

    for (let i = 0; i < providerPriority.length; i++) {
      const provider = providerPriority[i];
      if (i > 0 && !enableAutoFallback) break;

      try {
        logOperation(`TRYING_${provider.toUpperCase()}`, { withdrawalId });

        if (provider === 'moolre') transferResult = await moolreProcessWithdrawal(transferParams);
        else if (provider === 'paystack') transferResult = await paystackProcessWithdrawal(transferParams);
        else if (provider === 'bulkclix') transferResult = await bulkclixProcessWithdrawal(transferParams);
        else continue;

        if (transferResult.success || !transferResult.failed) {
          usedProvider = provider;
          await updateProviderStats(provider, true, netAmount);
          break;
        } else {
          providerErrors[provider] = transferResult.error || `${provider} failed`;
          await updateProviderStats(provider, false, 0, providerErrors[provider]);
        }
      } catch (error) {
        providerErrors[provider] = error.message;
        await updateProviderStats(provider, false, 0, error.message);
      }
    }

    if (!usedProvider) {
      return res.status(503).json({
        status: 'error',
        message: 'Withdrawal service temporarily unavailable. Please try again later.',
        providerErrors
      });
    }

    const fallbackUsed = providerPriority.indexOf(usedProvider) > 0;
    const isCompleted = transferResult.completed === true;

    // Atomic balance deduction
    session.startTransaction();

    const balanceUpdate = await AgentStore.findOneAndUpdate(
      { _id: store._id, 'wallet.availableBalance': { $gte: amount } },
      {
        $inc: {
          'wallet.availableBalance': -amount,
          'wallet.pendingBalance': isCompleted ? 0 : amount,
          'wallet.totalWithdrawn': isCompleted ? amount : 0
        },
        $set: isCompleted ? { 'wallet.lastWithdrawal': new Date() } : {}
      },
      { session, new: true }
    );

    if (!balanceUpdate) {
      await session.abortTransaction();
      return res.status(409).json({ status: 'error', message: 'Balance changed during processing.' });
    }

    const withdrawal = new StoreWithdrawal({
      withdrawalId, storeId: store._id, requestedAmount: amount, fee, netAmount,
      method: 'momo',
      paymentDetails: { momoNetwork, momoNumber: formatPhoneInternational(momoNumber), momoName: momoName || '' },
      status: isCompleted ? 'completed' : 'processing',
      completedAt: isCompleted ? new Date() : undefined,
      paymentReference: transferResult.transactionId || transferResult.transferCode,
      agentNotes,
      processingDetails: {
        initiatedAt: new Date(), initiatedBy: req.user._id.toString(),
        provider: usedProvider, gateway: 'mobile_money',
        paystackTransferCode: usedProvider === 'paystack' ? transferResult.transferCode : undefined,
        paystackRecipientCode: usedProvider === 'paystack' ? transferResult.recipientCode : undefined,
        completedAt: isCompleted ? new Date() : undefined,
        fallbackUsed, primaryProviderError: fallbackUsed ? providerErrors[providerPriority[0]] : undefined
      }
    });
    await withdrawal.save({ session });

    const auditLog = new WalletAuditLog({
      storeId: store._id,
      operation: isCompleted ? 'withdrawal_complete' : 'withdrawal_hold',
      amount: -amount,
      balanceBefore: store.wallet.availableBalance,
      balanceAfter: balanceUpdate.wallet.availableBalance,
      source: { type: 'withdrawal', referenceId: withdrawalId, referenceModel: 'StoreWithdrawal' },
      performedBy: { userId: req.user._id, userType: 'agent' },
      reason: isCompleted ? `Withdrawal completed via ${usedProvider}` : `Withdrawal requested - funds held pending ${usedProvider} confirmation`
    });
    await auditLog.save({ session });

    await session.commitTransaction();

    res.json({
      status: 'success',
      message: isCompleted ? 'Withdrawal processed! Money sent.' : 'Processing. You\'ll receive money shortly.',
      data: {
        withdrawal: {
          id: withdrawal._id, withdrawalId, amount, fee, netAmount,
          method: 'momo', status: withdrawal.status, createdAt: withdrawal.createdAt,
          completedAt: withdrawal.completedAt, estimatedTime: isCompleted ? 'Completed' : '5-30 minutes'
        },
        provider: usedProvider, fallbackUsed, immediateCompletion: isCompleted
      }
    });

  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    logOperation('CREATE_ERROR', { error: error.message });
    res.status(500).json({ status: 'error', message: 'Service not available. Please try again.' });
  } finally {
    session.endSession();
  }
});

// =============================================================================
// CHECK WITHDRAWAL STATUS
// =============================================================================
router.post('/stores/:storeId/check-status/:withdrawalId', auth, verifyAgentOwnership, async (req, res) => {
  try {
    const withdrawal = await StoreWithdrawal.findOne({
      withdrawalId: req.params.withdrawalId,
      storeId: req.store._id
    });

    if (!withdrawal) return res.status(404).json({ status: 'error', message: 'Not found' });

    // If already completed or failed, just return status
    if (['completed', 'failed', 'cancelled'].includes(withdrawal.status)) {
      return res.json({
        status: 'success',
        data: { withdrawalId: withdrawal.withdrawalId, status: withdrawal.status, completedAt: withdrawal.completedAt }
      });
    }

    // If queued, check queue position
    if (withdrawal.status === 'queued') {
      const queueItem = await PaystackWithdrawalQueue.findOne({ withdrawalRef: withdrawal.withdrawalId });
      const position = queueItem
        ? await PaystackWithdrawalQueue.countDocuments({ status: 'queued', queuedAt: { $lte: queueItem.queuedAt } })
        : 0;

      return res.json({
        status: 'success',
        data: {
          withdrawalId: withdrawal.withdrawalId, status: 'queued',
          queuePosition: position, estimatedTime: `${position * 2}-${position * 5} minutes`
        }
      });
    }

    // If processing, check provider status
    const provider = withdrawal.processingDetails?.provider;
    let statusResult;

    if (provider === 'paystack') {
      const tc = withdrawal.processingDetails?.paystackTransferCode;
      if (!tc) return res.json({ status: 'success', data: { withdrawalId: withdrawal.withdrawalId, status: withdrawal.status } });
      statusResult = await paystackCheckStatus(tc);
    } else if (provider === 'moolre') {
      statusResult = await moolreCheckStatus(withdrawal.withdrawalId);
    } else {
      return res.json({ status: 'success', data: { withdrawalId: withdrawal.withdrawalId, status: withdrawal.status } });
    }

    if (statusResult.completed) {
      // Complete the withdrawal
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        await AgentStore.findOneAndUpdate(
          { _id: withdrawal.storeId, 'wallet.pendingBalance': { $gte: withdrawal.requestedAmount } },
          {
            $inc: { 'wallet.pendingBalance': -withdrawal.requestedAmount, 'wallet.totalWithdrawn': withdrawal.requestedAmount },
            $set: { 'wallet.lastWithdrawal': new Date() }
          },
          { session }
        );
        withdrawal.status = 'completed';
        withdrawal.completedAt = new Date();
        withdrawal.processingDetails.completedAt = new Date();
        await withdrawal.save({ session });

        const auditLog = new WalletAuditLog({
          storeId: withdrawal.storeId, operation: 'withdrawal_complete', amount: -withdrawal.requestedAmount,
          source: { type: 'withdrawal', referenceId: withdrawal.withdrawalId, referenceModel: 'StoreWithdrawal' },
          reason: `Withdrawal completed via ${provider} status check`
        });
        await auditLog.save({ session });

        await session.commitTransaction();
        session.endSession();
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.json({ status: 'success', data: { withdrawalId: withdrawal.withdrawalId, status: 'completed' } });
    }

    if (statusResult.failed) {
      // Refund
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        await AgentStore.findOneAndUpdate(
          { _id: withdrawal.storeId },
          { $inc: { 'wallet.pendingBalance': -withdrawal.requestedAmount, 'wallet.availableBalance': withdrawal.requestedAmount } },
          { session }
        );
        withdrawal.status = 'failed';
        withdrawal.processingDetails.failureReason = 'Transfer failed on provider';
        await withdrawal.save({ session });

        const auditLog = new WalletAuditLog({
          storeId: withdrawal.storeId, operation: 'refund', amount: withdrawal.requestedAmount,
          source: { type: 'withdrawal_refund', referenceId: withdrawal.withdrawalId, referenceModel: 'StoreWithdrawal' },
          reason: `Withdrawal failed - refunded via ${provider} status check`
        });
        await auditLog.save({ session });

        await session.commitTransaction();
        session.endSession();
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.json({ status: 'success', data: { withdrawalId: withdrawal.withdrawalId, status: 'failed' } });
    }

    // Still pending
    return res.json({ status: 'success', data: { withdrawalId: withdrawal.withdrawalId, status: withdrawal.status, lastChecked: new Date() } });

  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to check status' });
  }
});

// =============================================================================
// GET WITHDRAWAL HISTORY
// =============================================================================
router.get('/stores/:storeId/withdrawals', auth, verifyAgentOwnership, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { storeId: req.params.storeId };
    if (status) query.status = status;

    const withdrawals = await StoreWithdrawal.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('withdrawalId requestedAmount fee netAmount status method paymentDetails processingDetails createdAt completedAt');

    const total = await StoreWithdrawal.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        withdrawals,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch withdrawals' });
  }
});

// Get single withdrawal details
router.get('/stores/:storeId/withdrawals/:withdrawalId', auth, verifyAgentOwnership, async (req, res) => {
  try {
    const withdrawal = await StoreWithdrawal.findOne({
      storeId: req.params.storeId, withdrawalId: req.params.withdrawalId
    });
    if (!withdrawal) return res.status(404).json({ status: 'error', message: 'Withdrawal not found' });
    res.json({ status: 'success', data: { withdrawal } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch withdrawal' });
  }
});

// =============================================================================
// PAYSTACK QUEUE PROCESSOR (called by cron every 10 seconds)
// =============================================================================
async function processPaystackQueue() {
  try {
    const TWO_MINUTES = 2 * 60 * 1000;

    // 1. Check background polling items
    const bgItems = await PaystackWithdrawalQueue.find({ status: 'background_polling' });
    for (const bgItem of bgItems) {
      if (bgItem.transferCode) {
        try {
          const result = await paystackCheckStatus(bgItem.transferCode);
          if (result.completed) {
            bgItem.status = 'completed'; bgItem.completedAt = new Date(); await bgItem.save();
            await completeQueuedWithdrawal(bgItem);
          } else if (result.failed) {
            bgItem.status = 'failed'; bgItem.error = 'Transfer failed on Paystack'; bgItem.completedAt = new Date(); await bgItem.save();
            await failQueuedWithdrawal(bgItem, 'Transfer failed - amount refunded');
          }
        } catch (err) { /* keep polling */ }
      }
    }

    // 2. Check currently processing item
    const current = await PaystackWithdrawalQueue.findOne({ status: { $in: ['processing', 'polling'] } });

    if (current) {
      const startTime = current.processingStartedAt || current.queuedAt || current.createdAt;
      const elapsed = Date.now() - new Date(startTime).getTime();

      if (current.transferCode) {
        try {
          const result = await paystackCheckStatus(current.transferCode);

          if (result.completed) {
            current.status = 'completed'; current.completedAt = new Date(); await current.save();
            await completeQueuedWithdrawal(current);
            return;
          }
          if (result.failed) {
            current.status = 'failed'; current.error = `Transfer ${result.status}`; current.completedAt = new Date(); await current.save();
            await failQueuedWithdrawal(current, `Transfer ${result.status} - amount refunded`);
            return;
          }
          // Still pending - if over 2 min, move to background
          if (elapsed > TWO_MINUTES) {
            current.status = 'background_polling'; await current.save();
          } else {
            return; // Wait more
          }
        } catch (err) { return; }
      } else {
        // No transfer code after 5 min = fail
        if (elapsed > 5 * 60 * 1000) {
          current.status = 'failed'; current.error = 'No transfer code received'; current.completedAt = new Date(); await current.save();
          await failQueuedWithdrawal(current, 'Transfer failed to initiate - amount refunded');
        }
        return;
      }
    }

    // 3. Pick next in queue (FIFO)
    const next = await PaystackWithdrawalQueue.findOneAndUpdate(
      { status: 'queued' },
      { $set: { status: 'processing', processingStartedAt: new Date() } },
      { sort: { queuedAt: 1 }, new: true }
    );

    if (!next) return;

    logOperation('QUEUE_PROCESSING', { withdrawalRef: next.withdrawalRef });

    const withdrawal = await StoreWithdrawal.findById(next.withdrawalId);
    if (!withdrawal) {
      next.status = 'failed'; next.error = 'Withdrawal record not found'; await next.save();
      return;
    }

    // Process with Paystack
    const result = await paystackProcessWithdrawal({
      amount: withdrawal.netAmount,
      phone: withdrawal.paymentDetails.momoNumber,
      network: withdrawal.paymentDetails.momoNetwork,
      name: withdrawal.paymentDetails.momoName || 'Customer',
      externalRef: withdrawal.withdrawalId,
      reference: `DataHustle Withdrawal ${withdrawal.withdrawalId}`
    });

    if (result.success) {
      next.recipientCode = result.recipientCode;
      next.transferCode = result.transferCode;

      // Update withdrawal with Paystack details
      withdrawal.processingDetails.paystackTransferCode = result.transferCode;
      withdrawal.processingDetails.paystackRecipientCode = result.recipientCode;
      withdrawal.status = 'processing';

      if (result.completed) {
        next.status = 'completed'; next.completedAt = new Date(); await next.save();
        await withdrawal.save();
        await completeQueuedWithdrawal(next);
      } else {
        next.status = 'polling'; next.nextPollAt = new Date(Date.now() + 10000); await next.save();
        await withdrawal.save();
      }

      await updateProviderStats('paystack', true, withdrawal.netAmount);
    } else {
      next.status = 'failed'; next.error = result.error; next.completedAt = new Date(); await next.save();
      await failQueuedWithdrawal(next, result.error || 'Paystack transfer failed - amount refunded');
      await updateProviderStats('paystack', false, 0, result.error);
    }

  } catch (error) {
    console.error('[PAYSTACK_QUEUE] Processor error:', error.message);
  }
}

// Complete a queued withdrawal
async function completeQueuedWithdrawal(queueItem) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const withdrawal = await StoreWithdrawal.findById(queueItem.withdrawalId).session(session);
    if (!withdrawal || withdrawal.status === 'completed') { await session.abortTransaction(); session.endSession(); return; }

    await AgentStore.findOneAndUpdate(
      { _id: withdrawal.storeId, 'wallet.pendingBalance': { $gte: withdrawal.requestedAmount } },
      {
        $inc: { 'wallet.pendingBalance': -withdrawal.requestedAmount, 'wallet.totalWithdrawn': withdrawal.requestedAmount },
        $set: { 'wallet.lastWithdrawal': new Date() }
      },
      { session }
    );

    withdrawal.status = 'completed';
    withdrawal.completedAt = new Date();
    withdrawal.processingDetails.completedAt = new Date();
    await withdrawal.save({ session });

    const auditLog = new WalletAuditLog({
      storeId: withdrawal.storeId, operation: 'withdrawal_complete', amount: -withdrawal.requestedAmount,
      source: { type: 'withdrawal', referenceId: withdrawal.withdrawalId, referenceModel: 'StoreWithdrawal' },
      reason: `Queued withdrawal completed via Paystack`
    });
    await auditLog.save({ session });

    await session.commitTransaction();
    logOperation('QUEUE_COMPLETED', { withdrawalRef: queueItem.withdrawalRef });
  } catch (error) {
    await session.abortTransaction();
    logOperation('QUEUE_COMPLETE_ERROR', { error: error.message });
  } finally {
    session.endSession();
  }
}

// Fail a queued withdrawal and refund
async function failQueuedWithdrawal(queueItem, reason) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const withdrawal = await StoreWithdrawal.findById(queueItem.withdrawalId).session(session);
    if (!withdrawal || ['completed', 'failed'].includes(withdrawal.status)) { await session.abortTransaction(); session.endSession(); return; }

    // Refund to wallet
    await AgentStore.findOneAndUpdate(
      { _id: withdrawal.storeId },
      { $inc: { 'wallet.pendingBalance': -withdrawal.requestedAmount, 'wallet.availableBalance': withdrawal.requestedAmount } },
      { session }
    );

    withdrawal.status = 'failed';
    withdrawal.processingDetails.failureReason = reason;
    await withdrawal.save({ session });

    const auditLog = new WalletAuditLog({
      storeId: withdrawal.storeId, operation: 'refund', amount: withdrawal.requestedAmount,
      source: { type: 'withdrawal_refund', referenceId: withdrawal.withdrawalId, referenceModel: 'StoreWithdrawal' },
      reason: `Queued withdrawal failed - ${reason}`
    });
    await auditLog.save({ session });

    await session.commitTransaction();
    logOperation('QUEUE_FAILED_REFUNDED', { withdrawalRef: queueItem.withdrawalRef, reason });
  } catch (error) {
    await session.abortTransaction();
    logOperation('QUEUE_FAIL_ERROR', { error: error.message });
  } finally {
    session.endSession();
  }
}

module.exports = router;
module.exports.processPaystackQueue = processPaystackQueue;
module.exports.PaystackWithdrawalQueue = PaystackWithdrawalQueue;
