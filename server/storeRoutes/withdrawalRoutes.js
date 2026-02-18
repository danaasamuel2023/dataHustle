// withdrawalRoutes.js - Store Withdrawal Routes for DataHustle
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
  PlatformSettings
} = require('../schema/storeSchema');

// ===== PAYSTACK CONFIGURATION =====
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Get Paystack client dynamically from platform settings
async function getPaystackClient() {
  const settings = await PlatformSettings.findOne({ key: 'platform_settings' });
  const secretKey = settings?.withdrawalProviders?.paystack?.secretKey
    || process.env.PAYSTACK_SECRET_KEY
    || process.env.PAYSTACK_SECRETE_KEY
    || '';

  return axios.create({
    baseURL: PAYSTACK_BASE_URL,
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    }
  });
}

// Get platform settings with defaults
async function getPlatformSettings() {
  let settings = await PlatformSettings.findOne({ key: 'platform_settings' });
  if (!settings) {
    settings = await PlatformSettings.create({ key: 'platform_settings' });
  }
  return settings;
}

// ===== HELPER FUNCTIONS =====
const logOperation = (operation, data) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [WITHDRAWAL] [${operation}]`, JSON.stringify(data, null, 2));
};

const verifyAgentOwnership = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const ownerId = req.user._id;

    const store = await AgentStore.findById(storeId);
    if (!store) {
      return res.status(404).json({ status: 'error', message: 'Store not found' });
    }

    if (store.owner.toString() !== ownerId.toString()) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized' });
    }

    req.store = store;
    next();
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to verify ownership' });
  }
};

// Map network to Paystack bank code
const getPaystackBankCode = (network) => {
  const bankCodes = {
    'mtn': 'MTN',
    'MTN': 'MTN',
    'vodafone': 'VOD',
    'telecel': 'VOD',
    'TELECEL': 'VOD',
    'airteltigo': 'ATL',
    'at': 'ATL',
    'AT': 'ATL'
  };
  return bankCodes[network] || 'MTN';
};

// ===== WITHDRAWAL ROUTES =====

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
        feePercent: wp.feePercent,
        fixedFee: wp.fixedFee,
        methods: ['momo']
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch settings' });
  }
});

// Request withdrawal
router.post('/stores/:storeId/withdrawal/request', auth, verifyAgentOwnership, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, momoNumber, momoNetwork, momoName } = req.body;
    const store = req.store;
    const settings = await getPlatformSettings();
    const wp = settings.withdrawalProviders;

    // Validation
    if (!amount || amount < wp.minWithdrawal) {
      return res.status(400).json({ status: 'error', message: `Minimum withdrawal is GH₵${wp.minWithdrawal}` });
    }

    if (amount > wp.maxWithdrawal) {
      return res.status(400).json({ status: 'error', message: `Maximum withdrawal is GH₵${wp.maxWithdrawal}` });
    }

    if (!momoNumber || !momoNetwork) {
      return res.status(400).json({ status: 'error', message: 'MoMo details are required' });
    }

    if (amount > store.wallet.availableBalance) {
      return res.status(400).json({ status: 'error', message: 'Insufficient balance' });
    }

    // Check for pending withdrawal
    const pendingWithdrawal = await StoreWithdrawal.findOne({
      storeId: store._id,
      status: { $in: ['pending', 'processing'] }
    }).session(session);

    if (pendingWithdrawal) {
      return res.status(400).json({
        status: 'error',
        message: 'You have a pending withdrawal. Please wait for it to complete.'
      });
    }

    // Generate withdrawal ID
    const withdrawalId = `SWD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const fee = Math.round(((amount * wp.feePercent / 100) + wp.fixedFee) * 100) / 100;
    const netAmount = amount - fee;

    // Create withdrawal record
    const withdrawal = new StoreWithdrawal({
      withdrawalId,
      storeId: store._id,
      requestedAmount: amount,
      fee,
      netAmount,
      method: 'momo',
      paymentDetails: {
        momoNumber,
        momoNetwork,
        momoName: momoName || ''
      },
      status: 'processing',
      createdAt: new Date()
    });

    await withdrawal.save({ session });

    // Deduct from wallet
    const balanceBefore = store.wallet.availableBalance;
    await AgentStore.findByIdAndUpdate(
      store._id,
      {
        $inc: {
          'wallet.availableBalance': -amount,
          'wallet.pendingBalance': amount
        }
      },
      { session }
    );

    // Create audit log
    const auditLog = new WalletAuditLog({
      storeId: store._id,
      operation: 'withdrawal',
      amount: -amount,
      balanceBefore,
      balanceAfter: balanceBefore - amount,
      source: {
        type: 'withdrawal',
        referenceId: withdrawalId,
        referenceModel: 'StoreWithdrawal'
      },
      reason: `Withdrawal request: ${withdrawalId}`,
      createdAt: new Date()
    });

    await auditLog.save({ session });

    await session.commitTransaction();

    // Process via Paystack (async - don't wait)
    processPaystackWithdrawal(withdrawal, store).catch(err => {
      logOperation('PAYSTACK_PROCESS_ERROR', { withdrawalId, error: err.message });
    });

    logOperation('WITHDRAWAL_REQUESTED', { withdrawalId, amount, storeId: store._id });

    res.json({
      status: 'success',
      message: 'Withdrawal request submitted',
      data: {
        withdrawal: {
          withdrawalId,
          requestedAmount: amount,
          fee,
          netAmount,
          status: 'processing',
          momoNumber: momoNumber.substring(0, 6) + '****'
        }
      }
    });
  } catch (error) {
    await session.abortTransaction();
    logOperation('WITHDRAWAL_ERROR', { error: error.message });
    res.status(500).json({ status: 'error', message: 'Failed to process withdrawal' });
  } finally {
    session.endSession();
  }
});

// Process withdrawal via Paystack
async function processPaystackWithdrawal(withdrawal, store) {
  try {
    const paystackClient = await getPaystackClient();
    const bankCode = getPaystackBankCode(withdrawal.paymentDetails.momoNetwork);
    const momoNumber = withdrawal.paymentDetails.momoNumber.replace(/^0/, '');

    // Step 1: Create transfer recipient
    const recipientPayload = {
      type: 'mobile_money',
      name: withdrawal.paymentDetails.momoName || store.storeName,
      account_number: momoNumber,
      bank_code: bankCode,
      currency: 'GHS'
    };

    logOperation('CREATING_RECIPIENT', { withdrawalId: withdrawal.withdrawalId, bankCode });

    const recipientResponse = await paystackClient.post('/transferrecipient', recipientPayload);

    if (!recipientResponse.data.status) {
      throw new Error('Failed to create recipient');
    }

    const recipientCode = recipientResponse.data.data.recipient_code;

    // Update withdrawal with recipient code
    withdrawal.processingDetails = {
      provider: 'paystack',
      paystackRecipientCode: recipientCode,
      processedAt: new Date()
    };
    await withdrawal.save();

    // Step 2: Initiate transfer
    const transferPayload = {
      source: 'balance',
      amount: Math.round(withdrawal.netAmount * 100), // Convert to pesewas
      recipient: recipientCode,
      reason: `Withdrawal ${withdrawal.withdrawalId}`,
      reference: withdrawal.withdrawalId
    };

    logOperation('INITIATING_TRANSFER', { withdrawalId: withdrawal.withdrawalId, amount: withdrawal.netAmount });

    const transferResponse = await paystackClient.post('/transfer', transferPayload);

    if (!transferResponse.data.status) {
      throw new Error(transferResponse.data.message || 'Transfer failed');
    }

    const transferCode = transferResponse.data.data.transfer_code;

    // Update withdrawal
    withdrawal.processingDetails.paystackTransferCode = transferCode;
    withdrawal.status = 'processing';
    await withdrawal.save();

    logOperation('TRANSFER_INITIATED', {
      withdrawalId: withdrawal.withdrawalId,
      transferCode
    });

    // Poll for completion
    pollTransferStatus(withdrawal);

  } catch (error) {
    logOperation('PAYSTACK_ERROR', { withdrawalId: withdrawal.withdrawalId, error: error.message });

    // Mark as failed
    withdrawal.status = 'failed';
    withdrawal.processingDetails = {
      ...withdrawal.processingDetails,
      failureReason: error.message
    };
    await withdrawal.save();

    // Refund to wallet
    await refundWithdrawal(withdrawal);
  }
}

// Poll transfer status
async function pollTransferStatus(withdrawal, attempts = 0) {
  const maxAttempts = 30; // 5 minutes (30 x 10 seconds)

  if (attempts >= maxAttempts) {
    logOperation('POLL_TIMEOUT', { withdrawalId: withdrawal.withdrawalId });
    return;
  }

  try {
    const transferCode = withdrawal.processingDetails?.paystackTransferCode;
    if (!transferCode) return;

    const paystackClient = await getPaystackClient();
    const response = await paystackClient.get(`/transfer/${transferCode}`);
    const status = response.data.data.status;

    logOperation('POLL_STATUS', { withdrawalId: withdrawal.withdrawalId, status, attempt: attempts + 1 });

    if (status === 'success') {
      // Complete withdrawal
      await completeWithdrawal(withdrawal);
    } else if (status === 'failed' || status === 'reversed') {
      // Failed - refund
      withdrawal.status = 'failed';
      withdrawal.processingDetails.failureReason = response.data.data.reason || 'Transfer failed';
      await withdrawal.save();
      await refundWithdrawal(withdrawal);
    } else {
      // Still pending - poll again after 10 seconds
      setTimeout(() => pollTransferStatus(withdrawal, attempts + 1), 10000);
    }
  } catch (error) {
    logOperation('POLL_ERROR', { withdrawalId: withdrawal.withdrawalId, error: error.message });
    // Retry after delay
    setTimeout(() => pollTransferStatus(withdrawal, attempts + 1), 10000);
  }
}

// Complete withdrawal
async function completeWithdrawal(withdrawal) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const store = await AgentStore.findById(withdrawal.storeId).session(session);

    // Update withdrawal status
    withdrawal.status = 'completed';
    withdrawal.completedAt = new Date();
    await withdrawal.save({ session });

    // Update store wallet
    await AgentStore.findByIdAndUpdate(
      withdrawal.storeId,
      {
        $inc: {
          'wallet.pendingBalance': -withdrawal.requestedAmount,
          'wallet.totalWithdrawn': withdrawal.netAmount
        },
        $set: { 'wallet.lastWithdrawal': new Date() }
      },
      { session }
    );

    await session.commitTransaction();
    logOperation('WITHDRAWAL_COMPLETED', { withdrawalId: withdrawal.withdrawalId });
  } catch (error) {
    await session.abortTransaction();
    logOperation('COMPLETE_ERROR', { withdrawalId: withdrawal.withdrawalId, error: error.message });
    throw error;
  } finally {
    session.endSession();
  }
}

// Refund failed withdrawal
async function refundWithdrawal(withdrawal) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const store = await AgentStore.findById(withdrawal.storeId).session(session);
    const balanceBefore = store.wallet.availableBalance;

    // Refund to wallet
    await AgentStore.findByIdAndUpdate(
      withdrawal.storeId,
      {
        $inc: {
          'wallet.availableBalance': withdrawal.requestedAmount,
          'wallet.pendingBalance': -withdrawal.requestedAmount
        }
      },
      { session }
    );

    // Create refund audit log
    const auditLog = new WalletAuditLog({
      storeId: store._id,
      operation: 'refund',
      amount: withdrawal.requestedAmount,
      balanceBefore,
      balanceAfter: balanceBefore + withdrawal.requestedAmount,
      source: {
        type: 'withdrawal_refund',
        referenceId: withdrawal.withdrawalId,
        referenceModel: 'StoreWithdrawal'
      },
      reason: `Withdrawal failed refund: ${withdrawal.withdrawalId}`,
      createdAt: new Date()
    });

    await auditLog.save({ session });

    await session.commitTransaction();
    logOperation('WITHDRAWAL_REFUNDED', { withdrawalId: withdrawal.withdrawalId });
  } catch (error) {
    await session.abortTransaction();
    logOperation('REFUND_ERROR', { withdrawalId: withdrawal.withdrawalId, error: error.message });
  } finally {
    session.endSession();
  }
}

// Get withdrawal history
router.get('/stores/:storeId/withdrawals', auth, verifyAgentOwnership, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = { storeId: req.params.storeId };
    if (status) query.status = status;

    const withdrawals = await StoreWithdrawal.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('withdrawalId requestedAmount fee netAmount status method paymentDetails createdAt completedAt');

    const total = await StoreWithdrawal.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        withdrawals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
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
      storeId: req.params.storeId,
      withdrawalId: req.params.withdrawalId
    });

    if (!withdrawal) {
      return res.status(404).json({ status: 'error', message: 'Withdrawal not found' });
    }

    res.json({ status: 'success', data: { withdrawal } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch withdrawal' });
  }
});

module.exports = router;
