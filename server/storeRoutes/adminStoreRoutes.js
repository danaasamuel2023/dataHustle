const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middlewareUser/middleware');
const adminAuth = require('../adminMiddleware/middleware');
const { AgentStore, AgentTransaction, StoreWithdrawal, WalletAuditLog, PlatformSettings, PaystackWithdrawalQueue } = require('../schema/storeSchema');
const withdrawalUtils = require('./withdrawalRoutes');

// =============================================================================
// GET ALL AUDIT LOGS (Admin)
// =============================================================================
router.get('/audit/all', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, operation, startDate, endDate, storeId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = {};

    if (operation) {
      query.operation = operation;
    }

    if (storeId) {
      query.storeId = mongoose.Types.ObjectId.isValid(storeId) ? storeId : null;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const [logs, total] = await Promise.all([
      WalletAuditLog.find(query)
        .populate('storeId', 'storeName storeSlug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      WalletAuditLog.countDocuments(query)
    ]);

    res.json({
      status: 'success',
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('[AUDIT_LOGS] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// =============================================================================
// GET AUDIT LOGS FOR SPECIFIC STORE
// =============================================================================
router.get('/wallet/audit/:storeId', auth, adminAuth, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { limit = 50 } = req.query;

    const store = await AgentStore.findById(storeId).lean();
    if (!store) {
      return res.status(404).json({ status: 'error', message: 'Store not found' });
    }

    const logs = await WalletAuditLog.find({ storeId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      status: 'success',
      data: {
        currentBalance: store.wallet?.availableBalance || 0,
        totalEarnings: store.wallet?.totalEarnings || 0,
        totalWithdrawn: store.wallet?.totalWithdrawn || 0,
        pendingWithdrawal: store.wallet?.pendingBalance || 0,
        recentLogs: logs
      }
    });
  } catch (error) {
    console.error('[WALLET_AUDIT] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// =============================================================================
// GET DETAILED LOGS FOR INVESTIGATION
// =============================================================================
router.get('/wallet/detailed-logs/:storeId', auth, adminAuth, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { limit = 50 } = req.query;

    const logs = await WalletAuditLog.find({ storeId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      status: 'success',
      data: { logs }
    });
  } catch (error) {
    console.error('[DETAILED_LOGS] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// =============================================================================
// GET ALL STORES (Admin)
// =============================================================================
router.get('/stores', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 30, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status) query.isActive = status === 'active';
    if (search) {
      query.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { storeSlug: { $regex: search, $options: 'i' } }
      ];
    }

    const [stores, total] = await Promise.all([
      AgentStore.find(query)
        .populate('owner', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AgentStore.countDocuments(query)
    ]);

    res.json({
      status: 'success',
      data: {
        stores,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('[STORES] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// =============================================================================
// GET STORE FULL DETAILS
// =============================================================================
router.get('/agents/:storeId/full-details', auth, adminAuth, async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await AgentStore.findById(storeId)
      .populate('owner', 'name email phone')
      .lean();

    if (!store) {
      return res.status(404).json({ status: 'error', message: 'Store not found' });
    }

    res.json({
      status: 'success',
      data: { store }
    });
  } catch (error) {
    console.error('[STORE_DETAILS] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// =============================================================================
// GET STORE TRANSACTIONS
// =============================================================================
router.get('/agents/:storeId/transactions', auth, adminAuth, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { limit = 50 } = req.query;

    const transactions = await AgentTransaction.find({ storeId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      status: 'success',
      data: { transactions }
    });
  } catch (error) {
    console.error('[STORE_TRANSACTIONS] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// =============================================================================
// GET STORE WITHDRAWALS
// =============================================================================
router.get('/agents/:storeId/withdrawals', auth, adminAuth, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { limit = 20 } = req.query;

    const withdrawals = await StoreWithdrawal.find({ storeId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      status: 'success',
      data: { withdrawals }
    });
  } catch (error) {
    console.error('[STORE_WITHDRAWALS] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// =============================================================================
// SECURE WALLET ADJUSTMENT (Admin)
// =============================================================================
router.post('/wallet/secure-adjust/:storeId', auth, adminAuth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { storeId } = req.params;
    const { amount, reason, operation } = req.body;

    if (!amount || !reason) {
      await session.abortTransaction();
      return res.status(400).json({ status: 'error', message: 'Amount and reason required' });
    }

    const store = await AgentStore.findById(storeId).session(session);
    if (!store) {
      await session.abortTransaction();
      return res.status(404).json({ status: 'error', message: 'Store not found' });
    }

    const balanceBefore = store.wallet?.availableBalance || 0;
    const adjustAmount = parseFloat(amount);

    // Update balance
    store.wallet.availableBalance = balanceBefore + adjustAmount;
    if (adjustAmount > 0) {
      store.wallet.totalEarnings = (store.wallet.totalEarnings || 0) + adjustAmount;
    }
    await store.save({ session });

    // Create audit log
    const auditLog = new WalletAuditLog({
      storeId: store._id,
      operation: operation || (adjustAmount > 0 ? 'credit' : 'debit'),
      amount: adjustAmount,
      balanceBefore,
      balanceAfter: store.wallet.availableBalance,
      source: {
        type: 'admin',
        referenceId: `ADMIN_ADJ_${Date.now()}`,
        referenceModel: 'AdminAdjustment'
      },
      reason,
      performedBy: {
        userId: req.user._id,
        userType: 'admin'
      }
    });
    await auditLog.save({ session });

    await session.commitTransaction();

    res.json({
      status: 'success',
      message: 'Wallet adjusted successfully',
      data: {
        balanceBefore,
        balanceAfter: store.wallet.availableBalance,
        adjustmentAmount: adjustAmount
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('[WALLET_ADJUST] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  } finally {
    session.endSession();
  }
});

// =============================================================================
// GET ADMIN DASHBOARD STATS
// =============================================================================
router.get('/dashboard/stats', auth, adminAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalStores,
      activeStores,
      todayTransactions,
      pendingWithdrawals,
      todayProfit
    ] = await Promise.all([
      AgentStore.countDocuments(),
      AgentStore.countDocuments({ isActive: true }),
      AgentTransaction.countDocuments({ createdAt: { $gte: today }, orderStatus: 'completed' }),
      StoreWithdrawal.countDocuments({ status: 'pending' }),
      AgentTransaction.aggregate([
        { $match: { createdAt: { $gte: today }, orderStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$netProfit' } } }
      ])
    ]);

    // Get top earners today
    const topEarners = await AgentTransaction.aggregate([
      { $match: { createdAt: { $gte: today }, orderStatus: 'completed' } },
      { $group: { _id: '$storeId', totalProfit: { $sum: '$netProfit' }, orderCount: { $sum: 1 } } },
      { $sort: { totalProfit: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'agentstorehustles', localField: '_id', foreignField: '_id', as: 'store' } },
      { $unwind: { path: '$store', preserveNullAndEmptyArrays: true } }
    ]);

    res.json({
      status: 'success',
      data: {
        stats: {
          totalStores,
          activeStores,
          todayTransactions,
          pendingWithdrawals,
          todayProfit: todayProfit[0]?.total || 0
        },
        topEarners: topEarners.map(e => ({
          storeId: e._id,
          storeName: e.store?.storeName || 'Unknown',
          totalProfit: e.totalProfit,
          orderCount: e.orderCount
        }))
      }
    });
  } catch (error) {
    console.error('[DASHBOARD_STATS] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// =============================================================================
// GET ALL WITHDRAWALS (Admin)
// =============================================================================
router.get('/withdrawals', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 30, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status) query.status = status;

    const [withdrawals, total] = await Promise.all([
      StoreWithdrawal.find(query)
        .populate({
          path: 'storeId',
          select: 'storeName storeSlug owner',
          populate: { path: 'owner', select: 'name email' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      StoreWithdrawal.countDocuments(query)
    ]);

    res.json({
      status: 'success',
      data: {
        withdrawals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('[WITHDRAWALS] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// =============================================================================
// INVESTIGATION SUMMARY (Admin Dashboard)
// =============================================================================
router.get('/investigation/summary', auth, adminAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todayTxns,
      pendingWithdrawals,
      storesByStatus,
      totalStoreBalance
    ] = await Promise.all([
      // Today's transactions
      AgentTransaction.aggregate([
        { $match: { createdAt: { $gte: today } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: '$sellingPrice' },
            totalProfit: { $sum: '$netProfit' }
          }
        }
      ]),
      // Pending withdrawals
      StoreWithdrawal.aggregate([
        { $match: { status: { $in: ['pending', 'processing'] } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: '$requestedAmount' }
          }
        }
      ]),
      // Stores by status
      AgentStore.aggregate([
        {
          $group: {
            _id: { $cond: ['$isActive', 'active', 'inactive'] },
            count: { $sum: 1 },
            totalBalance: { $sum: '$wallet.availableBalance' }
          }
        }
      ]),
      // Total store balance
      AgentStore.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalBalance: { $sum: '$wallet.availableBalance' }
          }
        }
      ])
    ]);

    res.json({
      status: 'success',
      data: {
        today: {
          transactions: {
            count: todayTxns[0]?.count || 0,
            totalAmount: todayTxns[0]?.totalAmount || 0,
            totalProfit: todayTxns[0]?.totalProfit || 0
          }
        },
        pending: {
          withdrawals: {
            count: pendingWithdrawals[0]?.count || 0,
            totalAmount: pendingWithdrawals[0]?.totalAmount || 0
          }
        },
        stores: {
          total: totalStoreBalance[0]?.total || 0,
          totalBalance: totalStoreBalance[0]?.totalBalance || 0,
          byStatus: storesByStatus
        }
      }
    });
  } catch (error) {
    console.error('[INVESTIGATION_SUMMARY] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// =============================================================================
// TOP EARNERS (Admin Dashboard)
// =============================================================================
router.get('/agents/top-earners', auth, adminAuth, async (req, res) => {
  try {
    const { limit = 5, period = 'today' } = req.query;

    const dateFilter = {};
    const now = new Date();
    if (period === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter.createdAt = { $gte: today };
    } else if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter.createdAt = { $gte: weekAgo };
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter.createdAt = { $gte: monthAgo };
    }

    const topEarners = await AgentTransaction.aggregate([
      { $match: { ...dateFilter, orderStatus: 'completed' } },
      {
        $group: {
          _id: '$storeId',
          totalProfit: { $sum: '$netProfit' },
          totalRevenue: { $sum: '$sellingPrice' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalProfit: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'agentstorehustles',
          localField: '_id',
          foreignField: '_id',
          as: 'store'
        }
      },
      { $unwind: { path: '$store', preserveNullAndEmptyArrays: true } }
    ]);

    res.json({
      status: 'success',
      data: {
        topEarners: topEarners.map((e, index) => ({
          rank: index + 1,
          storeId: e._id,
          storeName: e.store?.storeName || 'Unknown',
          storeSlug: e.store?.storeSlug || '',
          totalProfit: e.totalProfit,
          totalRevenue: e.totalRevenue,
          orderCount: e.orderCount
        }))
      }
    });
  } catch (error) {
    console.error('[TOP_EARNERS] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// =============================================================================
// RECENT ACTIVITY (Admin Dashboard)
// =============================================================================
router.get('/agents/recent-activity', auth, adminAuth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const activityLimit = Math.min(parseInt(limit), 50);

    // Get recent transactions and withdrawals, merge and sort
    const [recentTransactions, recentWithdrawals] = await Promise.all([
      AgentTransaction.find()
        .sort({ createdAt: -1 })
        .limit(activityLimit)
        .populate({ path: 'storeId', select: 'storeName storeSlug' })
        .lean(),
      StoreWithdrawal.find()
        .sort({ createdAt: -1 })
        .limit(activityLimit)
        .populate({ path: 'storeId', select: 'storeName storeSlug' })
        .lean()
    ]);

    const activities = [
      ...recentTransactions.map(t => ({
        type: 'transaction',
        storeName: t.storeId?.storeName || 'Unknown',
        description: `${t.network} ${t.capacity}${t.capacityUnit || 'GB'} to ${t.recipientPhone || 'N/A'}`,
        amount: t.sellingPrice,
        profit: t.netProfit,
        status: t.orderStatus,
        createdAt: t.createdAt
      })),
      ...recentWithdrawals.map(w => ({
        type: 'withdrawal',
        storeName: w.storeId?.storeName || 'Unknown',
        description: `Withdrawal via ${w.method} - ${w.withdrawalId}`,
        amount: w.requestedAmount,
        profit: 0,
        status: w.status,
        createdAt: w.createdAt
      }))
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, activityLimit);

    res.json({
      status: 'success',
      data: { activities }
    });
  } catch (error) {
    console.error('[RECENT_ACTIVITY] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// =============================================================================
// ADMIN WITHDRAWAL MANAGEMENT ENDPOINTS
// =============================================================================

// GET /withdrawals/all - List all withdrawals with pagination/status/search
router.get('/withdrawals/all', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 30, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { withdrawalId: { $regex: search, $options: 'i' } }
      ];
    }

    const [withdrawals, total] = await Promise.all([
      StoreWithdrawal.find(query)
        .populate({
          path: 'storeId',
          select: 'storeName storeSlug owner',
          populate: { path: 'owner', select: 'name email' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      StoreWithdrawal.countDocuments(query)
    ]);

    res.json({
      status: 'success',
      data: {
        withdrawals,
        pagination: { page: parseInt(page), limit: parseInt(limit), total }
      }
    });
  } catch (error) {
    console.error('[ADMIN_WITHDRAWALS_ALL] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /withdrawals/stuck - Withdrawals stuck >24h
router.get('/withdrawals/stuck', auth, adminAuth, async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stuckWithdrawals = await StoreWithdrawal.find({
      status: { $in: ['pending', 'processing', 'queued'] },
      createdAt: { $lt: twentyFourHoursAgo }
    })
      .populate({ path: 'storeId', select: 'storeName storeSlug' })
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      status: 'success',
      data: { stuckWithdrawals }
    });
  } catch (error) {
    console.error('[STUCK_WITHDRAWALS] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /withdrawals/provider-balance - Provider stats
router.get('/withdrawals/provider-balance', auth, adminAuth, async (req, res) => {
  try {
    const settings = await PlatformSettings.findOne({ key: 'platform_settings' });
    const wp = settings?.withdrawalProviders || {};

    // Get queue stats
    const [queuedCount, processingCount] = await Promise.all([
      PaystackWithdrawalQueue.countDocuments({ status: 'queued' }),
      PaystackWithdrawalQueue.countDocuments({ status: { $in: ['processing', 'polling', 'background_polling'] } })
    ]);

    res.json({
      status: 'success',
      data: {
        activeProvider: wp.activeProvider || 'paystack',
        providerPriority: wp.providerPriority || ['paystack', 'moolre', 'bulkclix'],
        withdrawalsPaused: wp.withdrawalsPaused || false,
        queue: { queued: queuedCount, processing: processingCount },
        paystack: {
          enabled: wp.paystack?.enabled || false,
          successCount: wp.paystack?.successCount || 0,
          failureCount: wp.paystack?.failureCount || 0,
          totalAmountProcessed: wp.paystack?.totalAmountProcessed || 0,
          lastUsed: wp.paystack?.lastUsed,
          lastError: wp.paystack?.lastError
        },
        moolre: {
          enabled: wp.moolre?.enabled || false,
          successCount: wp.moolre?.successCount || 0,
          failureCount: wp.moolre?.failureCount || 0,
          totalAmountProcessed: wp.moolre?.totalAmountProcessed || 0,
          lastUsed: wp.moolre?.lastUsed,
          lastError: wp.moolre?.lastError
        },
        bulkclix: {
          enabled: wp.bulkclix?.enabled || false,
          successCount: wp.bulkclix?.successCount || 0,
          failureCount: wp.bulkclix?.failureCount || 0,
          totalAmountProcessed: wp.bulkclix?.totalAmountProcessed || 0,
          lastUsed: wp.bulkclix?.lastUsed,
          lastError: wp.bulkclix?.lastError
        }
      }
    });
  } catch (error) {
    console.error('[PROVIDER_BALANCE] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /withdrawals/approve/:withdrawalId - Approve & process
router.post('/withdrawals/approve/:withdrawalId', auth, adminAuth, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { withdrawalId } = req.params;
    const withdrawal = await StoreWithdrawal.findOne({ withdrawalId });

    if (!withdrawal) {
      return res.status(404).json({ status: 'error', message: 'Withdrawal not found' });
    }

    if (!['pending', 'queued'].includes(withdrawal.status)) {
      return res.status(400).json({ status: 'error', message: `Cannot approve withdrawal with status: ${withdrawal.status}` });
    }

    // Get provider config and try to process
    const providerConfig = await withdrawalUtils.getProviderConfig();
    const { providerPriority, enableAutoFallback } = providerConfig;

    const transferParams = {
      amount: withdrawal.netAmount,
      phone: withdrawal.paymentDetails.momoNumber,
      network: withdrawal.paymentDetails.momoNetwork,
      name: withdrawal.paymentDetails.momoName || 'Customer',
      externalRef: withdrawal.withdrawalId,
      reference: `DataHustle Admin Approved ${withdrawal.withdrawalId}`
    };

    let transferResult = null;
    let usedProvider = null;
    let providerErrors = {};

    for (let i = 0; i < providerPriority.length; i++) {
      const provider = providerPriority[i];
      if (i > 0 && !enableAutoFallback) break;

      try {
        if (provider === 'moolre') transferResult = await withdrawalUtils.moolreProcessWithdrawal(transferParams);
        else if (provider === 'paystack') transferResult = await withdrawalUtils.paystackProcessWithdrawal(transferParams);
        else if (provider === 'bulkclix') transferResult = await withdrawalUtils.bulkclixProcessWithdrawal(transferParams);
        else continue;

        if (transferResult.success || !transferResult.failed) {
          usedProvider = provider;
          await withdrawalUtils.updateProviderStats(provider, true, withdrawal.netAmount);
          break;
        } else {
          providerErrors[provider] = transferResult.error;
          await withdrawalUtils.updateProviderStats(provider, false, 0, transferResult.error);
        }
      } catch (error) {
        providerErrors[provider] = error.message;
        await withdrawalUtils.updateProviderStats(provider, false, 0, error.message);
      }
    }

    if (!usedProvider) {
      return res.status(503).json({ status: 'error', message: 'All providers failed', providerErrors });
    }

    const isCompleted = transferResult.completed === true;

    session.startTransaction();

    // Update withdrawal record
    withdrawal.status = isCompleted ? 'completed' : 'processing';
    withdrawal.processingDetails.provider = usedProvider;
    withdrawal.processingDetails.gateway = 'mobile_money';
    withdrawal.processingDetails.processedAt = new Date();
    if (isCompleted) {
      withdrawal.completedAt = new Date();
      withdrawal.processingDetails.completedAt = new Date();
    }
    if (usedProvider === 'paystack') {
      withdrawal.processingDetails.paystackTransferCode = transferResult.transferCode;
      withdrawal.processingDetails.paystackRecipientCode = transferResult.recipientCode;
    }
    withdrawal.paymentReference = transferResult.transactionId || transferResult.transferCode;
    await withdrawal.save({ session });

    // If completed, finalize wallet
    if (isCompleted) {
      await AgentStore.findOneAndUpdate(
        { _id: withdrawal.storeId },
        {
          $inc: { 'wallet.pendingBalance': -withdrawal.requestedAmount, 'wallet.totalWithdrawn': withdrawal.requestedAmount },
          $set: { 'wallet.lastWithdrawal': new Date() }
        },
        { session }
      );

      await new WalletAuditLog({
        storeId: withdrawal.storeId,
        operation: 'withdrawal_complete',
        amount: -withdrawal.requestedAmount,
        source: { type: 'withdrawal', referenceId: withdrawal.withdrawalId, referenceModel: 'StoreWithdrawal' },
        performedBy: { userId: req.user._id, userType: 'admin' },
        reason: `Admin approved - completed via ${usedProvider}`
      }).save({ session });
    }

    // Remove from Paystack queue if it was queued
    await PaystackWithdrawalQueue.deleteMany({ withdrawalRef: withdrawal.withdrawalId }).session(session);

    await session.commitTransaction();

    res.json({
      status: 'success',
      message: isCompleted ? 'Withdrawal approved and completed' : 'Withdrawal approved and processing',
      data: { withdrawal }
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    console.error('[APPROVE_WITHDRAWAL] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  } finally {
    session.endSession();
  }
});

// POST /withdrawals/reject/:withdrawalId - Reject & refund
router.post('/withdrawals/reject/:withdrawalId', auth, adminAuth, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { withdrawalId } = req.params;
    const { reason } = req.body;
    const withdrawal = await StoreWithdrawal.findOne({ withdrawalId });

    if (!withdrawal) {
      return res.status(404).json({ status: 'error', message: 'Withdrawal not found' });
    }

    if (['completed', 'cancelled'].includes(withdrawal.status)) {
      return res.status(400).json({ status: 'error', message: `Cannot reject withdrawal with status: ${withdrawal.status}` });
    }

    session.startTransaction();

    // Refund to available balance (from pending)
    const store = await AgentStore.findById(withdrawal.storeId).session(session);
    const balanceBefore = store.wallet.availableBalance;

    await AgentStore.findOneAndUpdate(
      { _id: withdrawal.storeId },
      {
        $inc: { 'wallet.pendingBalance': -withdrawal.requestedAmount, 'wallet.availableBalance': withdrawal.requestedAmount }
      },
      { session }
    );

    // Update withdrawal
    withdrawal.status = 'cancelled';
    withdrawal.processingDetails.failureReason = reason || 'Rejected by admin';
    await withdrawal.save({ session });

    // Audit log
    await new WalletAuditLog({
      storeId: withdrawal.storeId,
      operation: 'refund',
      amount: withdrawal.requestedAmount,
      balanceBefore,
      balanceAfter: balanceBefore + withdrawal.requestedAmount,
      source: { type: 'withdrawal_refund', referenceId: withdrawal.withdrawalId, referenceModel: 'StoreWithdrawal' },
      performedBy: { userId: req.user._id, userType: 'admin' },
      reason: `Admin rejected: ${reason || 'No reason provided'}`
    }).save({ session });

    // Remove from queue
    await PaystackWithdrawalQueue.deleteMany({ withdrawalRef: withdrawal.withdrawalId }).session(session);

    await session.commitTransaction();

    res.json({
      status: 'success',
      message: 'Withdrawal rejected and funds returned',
      data: { withdrawal }
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    console.error('[REJECT_WITHDRAWAL] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  } finally {
    session.endSession();
  }
});

// POST /withdrawals/return-to-balance/:withdrawalId - Return funds from failed/stuck
router.post('/withdrawals/return-to-balance/:withdrawalId', auth, adminAuth, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { withdrawalId } = req.params;
    const { reason } = req.body;
    const withdrawal = await StoreWithdrawal.findOne({ withdrawalId });

    if (!withdrawal) {
      return res.status(404).json({ status: 'error', message: 'Withdrawal not found' });
    }

    if (['completed', 'cancelled'].includes(withdrawal.status)) {
      return res.status(400).json({ status: 'error', message: `Cannot return funds for status: ${withdrawal.status}` });
    }

    session.startTransaction();

    const store = await AgentStore.findById(withdrawal.storeId).session(session);
    const balanceBefore = store.wallet.availableBalance;

    // If status is failed, the funds might already be refunded
    // Check pendingBalance - if it's >= requestedAmount, funds are still held
    if (store.wallet.pendingBalance >= withdrawal.requestedAmount) {
      await AgentStore.findOneAndUpdate(
        { _id: withdrawal.storeId },
        {
          $inc: { 'wallet.pendingBalance': -withdrawal.requestedAmount, 'wallet.availableBalance': withdrawal.requestedAmount }
        },
        { session }
      );
    } else {
      // Funds may have been partially or fully refunded already, just credit back
      await AgentStore.findOneAndUpdate(
        { _id: withdrawal.storeId },
        {
          $inc: { 'wallet.availableBalance': withdrawal.requestedAmount }
        },
        { session }
      );
    }

    withdrawal.status = 'cancelled';
    withdrawal.processingDetails.failureReason = reason || 'Admin returned to balance';
    await withdrawal.save({ session });

    await new WalletAuditLog({
      storeId: withdrawal.storeId,
      operation: 'refund',
      amount: withdrawal.requestedAmount,
      balanceBefore,
      balanceAfter: balanceBefore + withdrawal.requestedAmount,
      source: { type: 'withdrawal_refund', referenceId: withdrawal.withdrawalId, referenceModel: 'StoreWithdrawal' },
      performedBy: { userId: req.user._id, userType: 'admin' },
      reason: `Admin returned to balance: ${reason || 'No reason provided'}`
    }).save({ session });

    await PaystackWithdrawalQueue.deleteMany({ withdrawalRef: withdrawal.withdrawalId }).session(session);

    await session.commitTransaction();

    res.json({
      status: 'success',
      message: 'Funds returned to agent wallet',
      data: { withdrawal }
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    console.error('[RETURN_TO_BALANCE] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  } finally {
    session.endSession();
  }
});

// POST /withdrawals/retry/:withdrawalId - Retry failed withdrawal
router.post('/withdrawals/retry/:withdrawalId', auth, adminAuth, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { withdrawalId } = req.params;
    const { preferredProvider } = req.body;
    const withdrawal = await StoreWithdrawal.findOne({ withdrawalId });

    if (!withdrawal) {
      return res.status(404).json({ status: 'error', message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'failed') {
      return res.status(400).json({ status: 'error', message: `Can only retry failed withdrawals. Current status: ${withdrawal.status}` });
    }

    // For failed withdrawals, funds were already refunded. Need to re-deduct.
    session.startTransaction();

    const store = await AgentStore.findById(withdrawal.storeId).session(session);
    if (store.wallet.availableBalance < withdrawal.requestedAmount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ status: 'error', message: 'Insufficient balance for retry' });
    }

    // Re-deduct funds
    await AgentStore.findOneAndUpdate(
      { _id: withdrawal.storeId, 'wallet.availableBalance': { $gte: withdrawal.requestedAmount } },
      {
        $inc: { 'wallet.availableBalance': -withdrawal.requestedAmount, 'wallet.pendingBalance': withdrawal.requestedAmount }
      },
      { session }
    );

    await new WalletAuditLog({
      storeId: withdrawal.storeId,
      operation: 'withdrawal_hold',
      amount: -withdrawal.requestedAmount,
      balanceBefore: store.wallet.availableBalance,
      balanceAfter: store.wallet.availableBalance - withdrawal.requestedAmount,
      source: { type: 'withdrawal', referenceId: withdrawal.withdrawalId, referenceModel: 'StoreWithdrawal' },
      performedBy: { userId: req.user._id, userType: 'admin' },
      reason: `Admin retry via ${preferredProvider || 'auto'}`
    }).save({ session });

    await session.commitTransaction();
    session.endSession();

    // Now try the provider
    const transferParams = {
      amount: withdrawal.netAmount,
      phone: withdrawal.paymentDetails.momoNumber,
      network: withdrawal.paymentDetails.momoNetwork,
      name: withdrawal.paymentDetails.momoName || 'Customer',
      externalRef: `${withdrawal.withdrawalId}-R${Date.now()}`,
      reference: `DataHustle Retry ${withdrawal.withdrawalId}`
    };

    let transferResult = null;
    let usedProvider = null;

    // Try preferred provider first, then fallback
    const providers = preferredProvider
      ? [preferredProvider]
      : (await withdrawalUtils.getProviderConfig()).providerPriority;

    for (const provider of providers) {
      try {
        if (provider === 'moolre') transferResult = await withdrawalUtils.moolreProcessWithdrawal(transferParams);
        else if (provider === 'paystack') transferResult = await withdrawalUtils.paystackProcessWithdrawal(transferParams);
        else if (provider === 'bulkclix') transferResult = await withdrawalUtils.bulkclixProcessWithdrawal(transferParams);
        else continue;

        if (transferResult.success || !transferResult.failed) {
          usedProvider = provider;
          await withdrawalUtils.updateProviderStats(provider, true, withdrawal.netAmount);
          break;
        } else {
          await withdrawalUtils.updateProviderStats(provider, false, 0, transferResult.error);
        }
      } catch (error) {
        await withdrawalUtils.updateProviderStats(provider, false, 0, error.message);
      }
    }

    if (!usedProvider) {
      // Refund since retry failed
      const refundSession = await mongoose.startSession();
      refundSession.startTransaction();
      try {
        await AgentStore.findOneAndUpdate(
          { _id: withdrawal.storeId },
          { $inc: { 'wallet.pendingBalance': -withdrawal.requestedAmount, 'wallet.availableBalance': withdrawal.requestedAmount } },
          { session: refundSession }
        );
        await new WalletAuditLog({
          storeId: withdrawal.storeId, operation: 'refund', amount: withdrawal.requestedAmount,
          source: { type: 'withdrawal_refund', referenceId: withdrawal.withdrawalId, referenceModel: 'StoreWithdrawal' },
          performedBy: { userId: req.user._id, userType: 'admin' },
          reason: 'Admin retry failed - all providers down'
        }).save({ session: refundSession });
        await refundSession.commitTransaction();
      } catch (e) {
        await refundSession.abortTransaction();
      } finally {
        refundSession.endSession();
      }

      return res.status(503).json({ status: 'error', message: 'Retry failed - all providers unavailable. Funds returned.' });
    }

    const isCompleted = transferResult.completed === true;

    // Update withdrawal status
    withdrawal.status = isCompleted ? 'completed' : 'processing';
    withdrawal.processingDetails.provider = usedProvider;
    withdrawal.processingDetails.gateway = 'mobile_money';
    withdrawal.processingDetails.processedAt = new Date();
    withdrawal.processingDetails.fallbackUsed = false;
    if (isCompleted) {
      withdrawal.completedAt = new Date();
      withdrawal.processingDetails.completedAt = new Date();
    }
    if (usedProvider === 'paystack') {
      withdrawal.processingDetails.paystackTransferCode = transferResult.transferCode;
      withdrawal.processingDetails.paystackRecipientCode = transferResult.recipientCode;
    }
    withdrawal.paymentReference = transferResult.transactionId || transferResult.transferCode;
    await withdrawal.save();

    // If completed, finalize wallet
    if (isCompleted) {
      const finalSession = await mongoose.startSession();
      finalSession.startTransaction();
      try {
        await AgentStore.findOneAndUpdate(
          { _id: withdrawal.storeId },
          {
            $inc: { 'wallet.pendingBalance': -withdrawal.requestedAmount, 'wallet.totalWithdrawn': withdrawal.requestedAmount },
            $set: { 'wallet.lastWithdrawal': new Date() }
          },
          { session: finalSession }
        );
        await new WalletAuditLog({
          storeId: withdrawal.storeId, operation: 'withdrawal_complete', amount: -withdrawal.requestedAmount,
          source: { type: 'withdrawal', referenceId: withdrawal.withdrawalId, referenceModel: 'StoreWithdrawal' },
          performedBy: { userId: req.user._id, userType: 'admin' },
          reason: `Admin retry completed via ${usedProvider}`
        }).save({ session: finalSession });
        await finalSession.commitTransaction();
      } catch (e) {
        await finalSession.abortTransaction();
      } finally {
        finalSession.endSession();
      }
    }

    res.json({
      status: 'success',
      message: isCompleted ? 'Retry successful - withdrawal completed' : 'Retry initiated - processing',
      data: { withdrawal, provider: usedProvider }
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    if (!session.hasEnded) session.endSession();
    console.error('[RETRY_WITHDRAWAL] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /withdrawals/force-complete/:withdrawalId - Admin manually marks as done
router.post('/withdrawals/force-complete/:withdrawalId', auth, adminAuth, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { withdrawalId } = req.params;
    const withdrawal = await StoreWithdrawal.findOne({ withdrawalId });

    if (!withdrawal) {
      return res.status(404).json({ status: 'error', message: 'Withdrawal not found' });
    }

    if (withdrawal.status === 'completed') {
      return res.status(400).json({ status: 'error', message: 'Withdrawal already completed' });
    }

    if (withdrawal.status === 'cancelled') {
      return res.status(400).json({ status: 'error', message: 'Cannot complete a cancelled withdrawal' });
    }

    session.startTransaction();

    // Move funds from pending to withdrawn
    const store = await AgentStore.findById(withdrawal.storeId).session(session);

    if (store.wallet.pendingBalance >= withdrawal.requestedAmount) {
      await AgentStore.findOneAndUpdate(
        { _id: withdrawal.storeId },
        {
          $inc: { 'wallet.pendingBalance': -withdrawal.requestedAmount, 'wallet.totalWithdrawn': withdrawal.requestedAmount },
          $set: { 'wallet.lastWithdrawal': new Date() }
        },
        { session }
      );
    } else {
      // Funds not in pending (already refunded or never held), just count as withdrawn
      await AgentStore.findOneAndUpdate(
        { _id: withdrawal.storeId },
        {
          $inc: { 'wallet.totalWithdrawn': withdrawal.requestedAmount },
          $set: { 'wallet.lastWithdrawal': new Date() }
        },
        { session }
      );
    }

    withdrawal.status = 'completed';
    withdrawal.completedAt = new Date();
    withdrawal.processingDetails.completedAt = new Date();
    withdrawal.processingDetails.processedAt = withdrawal.processingDetails.processedAt || new Date();
    await withdrawal.save({ session });

    await new WalletAuditLog({
      storeId: withdrawal.storeId,
      operation: 'withdrawal_complete',
      amount: -withdrawal.requestedAmount,
      source: { type: 'withdrawal', referenceId: withdrawal.withdrawalId, referenceModel: 'StoreWithdrawal' },
      performedBy: { userId: req.user._id, userType: 'admin' },
      reason: 'Admin force-completed withdrawal'
    }).save({ session });

    await PaystackWithdrawalQueue.deleteMany({ withdrawalRef: withdrawal.withdrawalId }).session(session);

    await session.commitTransaction();

    res.json({
      status: 'success',
      message: 'Withdrawal force-completed',
      data: { withdrawal }
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    console.error('[FORCE_COMPLETE] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;
