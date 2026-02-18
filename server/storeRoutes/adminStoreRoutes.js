const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middlewareUser/middleware');
const adminAuth = require('../adminMiddleware/middleware');
const { AgentStore, AgentTransaction, StoreWithdrawal, WalletAuditLog } = require('../schema/storeSchema');

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

module.exports = router;
