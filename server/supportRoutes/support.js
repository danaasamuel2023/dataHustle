const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middlewareUser/middleware');
const workerAuth = require('../middlewareUser/workerAuth');

// Import schemas
const { User, DataPurchase, Transaction, OrderReport } = require('../schema/schema');

// Import Agent Store schemas with error handling
let AgentStore, AgentTransaction, StoreWithdrawal, WalletAuditLog;
try {
  const storeSchema = require('../schema/storeSchema');
  AgentStore = storeSchema.AgentStore;
  AgentTransaction = storeSchema.AgentTransaction;
  StoreWithdrawal = storeSchema.StoreWithdrawal;
  WalletAuditLog = storeSchema.WalletAuditLog;
} catch (err) {
  console.warn('Store schemas not loaded for support routes:', err.message);
}

const logSupport = (operation, data) => {
  console.log(`[${new Date().toISOString()}] [SUPPORT] [${operation}]`, JSON.stringify(data));
};

// ============================================================================
// DASHBOARD - Overview stats for support team
// ============================================================================
router.get('/dashboard', auth, workerAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      todayOrders,
      todayFailedOrders,
      pendingDeposits,
      pendingReports,
      todayRevenue,
      pendingWithdrawals,
      recentFailedOrders
    ] = await Promise.all([
      User.countDocuments(),
      DataPurchase.countDocuments({ createdAt: { $gte: today } }),
      DataPurchase.countDocuments({ createdAt: { $gte: today }, status: 'failed' }),
      Transaction.countDocuments({ type: 'deposit', status: 'pending' }),
      OrderReport.countDocuments({ status: 'pending' }),
      DataPurchase.aggregate([
        { $match: { createdAt: { $gte: today }, status: { $in: ['completed', 'delivered'] } } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ]),
      StoreWithdrawal ? StoreWithdrawal.countDocuments({ status: { $in: ['pending', 'processing', 'queued', 'polling'] } }) : 0,
      DataPurchase.find({ status: 'failed' }).sort({ createdAt: -1 }).limit(10).populate('userId', 'name phoneNumber email').lean()
    ]);

    res.json({
      status: 'success',
      data: {
        totalUsers,
        todayOrders,
        todayFailedOrders,
        pendingDeposits,
        pendingReports,
        todayRevenue: todayRevenue[0]?.total || 0,
        pendingWithdrawals,
        recentFailedOrders
      }
    });
  } catch (error) {
    console.error('[Support Dashboard]', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================================================
// CUSTOMER SEARCH - Search by name, email, phone
// ============================================================================
router.get('/search', auth, workerAuth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ status: 'error', message: 'Search query must be at least 2 characters' });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const users = await User.find({
      $or: [
        { name: regex },
        { email: regex },
        { phoneNumber: regex }
      ]
    })
      .select('name email phoneNumber role walletBalance isDisabled approvalStatus createdAt lastLogin')
      .limit(20)
      .sort({ createdAt: -1 })
      .lean();

    logSupport('CUSTOMER_SEARCH', { workerId: req.user._id, query: q, results: users.length });

    res.json({ status: 'success', data: users });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================================================
// CUSTOMER DETAIL - Full customer profile with history
// ============================================================================
router.get('/customer/:id', auth, workerAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordOTP -resetPasswordOTPExpiry')
      .lean();

    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    const [orders, transactions, reports, store] = await Promise.all([
      DataPurchase.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
      Transaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
      OrderReport.find({ userId: user._id }).sort({ createdAt: -1 }).limit(10).lean(),
      AgentStore ? AgentStore.findOne({ agentId: user._id }).lean() : null
    ]);

    // Calculate stats
    const totalSpent = orders.filter(o => ['completed', 'delivered'].includes(o.status)).reduce((sum, o) => sum + o.price, 0);
    const totalDeposited = transactions.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
    const failedOrders = orders.filter(o => o.status === 'failed').length;

    logSupport('CUSTOMER_VIEWED', { workerId: req.user._id, customerId: user._id });

    res.json({
      status: 'success',
      data: {
        user,
        orders,
        transactions,
        reports,
        store,
        stats: { totalSpent, totalDeposited, failedOrders, totalOrders: orders.length }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================================================
// FAILED ORDERS - List all failed orders
// ============================================================================
router.get('/failed-orders', auth, workerAuth, async (req, res) => {
  try {
    const { page = 1, limit = 30, network, days = 7 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - parseInt(days));

    const query = { status: 'failed', createdAt: { $gte: dateFilter } };
    if (network) query.network = network;

    const [orders, total] = await Promise.all([
      DataPurchase.find(query)
        .populate('userId', 'name phoneNumber email walletBalance')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      DataPurchase.countDocuments(query)
    ]);

    res.json({
      status: 'success',
      data: { orders, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================================================
// REFUND ORDER - Refund a failed order to user wallet
// ============================================================================
router.post('/order/:orderId/refund', auth, workerAuth, async (req, res) => {
  try {
    const order = await DataPurchase.findById(req.params.orderId);
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

    if (order.status === 'refunded') {
      return res.status(400).json({ status: 'error', message: 'Order already refunded' });
    }

    const user = await User.findById(order.userId);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    // Only refund wallet-paid orders
    if (order.gateway !== 'wallet') {
      return res.status(400).json({ status: 'error', message: 'Can only refund wallet-paid orders' });
    }

    const balanceBefore = user.walletBalance;
    user.walletBalance += order.price;
    await user.save();

    order.status = 'refunded';
    order.adminNotes = `Refunded by support (${req.user.name}) on ${new Date().toISOString()}`;
    order.updatedBy = req.user._id;
    order.updatedAt = new Date();
    await order.save();

    // Create refund transaction
    await Transaction.create({
      userId: user._id,
      type: 'refund',
      amount: order.price,
      status: 'completed',
      reference: `REFUND-${order._id}-${Date.now()}`,
      gateway: 'system',
      createdAt: new Date()
    });

    logSupport('ORDER_REFUNDED', {
      workerId: req.user._id,
      orderId: order._id,
      userId: user._id,
      amount: order.price,
      balanceBefore,
      balanceAfter: user.walletBalance
    });

    res.json({
      status: 'success',
      message: `Refunded GH₵${order.price.toFixed(2)} to ${user.name}`,
      data: { balanceBefore, balanceAfter: user.walletBalance }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================================================
// DEPOSITS - List pending/recent deposits
// ============================================================================
router.get('/deposits', auth, workerAuth, async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 30, days = 7 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - parseInt(days));

    const query = { type: 'deposit', createdAt: { $gte: dateFilter } };
    if (status !== 'all') query.status = status;

    const [deposits, total] = await Promise.all([
      Transaction.find(query)
        .populate('userId', 'name phoneNumber email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Transaction.countDocuments(query)
    ]);

    res.json({
      status: 'success',
      data: { deposits, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================================================
// WALLET CREDIT - Add money to user wallet (support)
// ============================================================================
router.post('/wallet/credit', auth, workerAuth, async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ status: 'error', message: 'Valid userId and amount required' });
    }
    if (!reason || reason.length < 10) {
      return res.status(400).json({ status: 'error', message: 'Reason must be at least 10 characters' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    const balanceBefore = user.walletBalance;
    user.walletBalance += parseFloat(amount);
    await user.save();

    await Transaction.create({
      userId: user._id,
      type: 'deposit',
      amount: parseFloat(amount),
      status: 'completed',
      reference: `SUPPORT-CREDIT-${Date.now()}`,
      gateway: 'admin-deposit',
      createdAt: new Date()
    });

    logSupport('WALLET_CREDITED', {
      workerId: req.user._id,
      userId, amount, reason, balanceBefore, balanceAfter: user.walletBalance
    });

    res.json({
      status: 'success',
      message: `Credited GH₵${parseFloat(amount).toFixed(2)} to ${user.name}`,
      data: { balanceBefore, balanceAfter: user.walletBalance }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================================================
// WALLET DEDUCT - Remove money from user wallet (support)
// ============================================================================
router.post('/wallet/deduct', auth, workerAuth, async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ status: 'error', message: 'Valid userId and amount required' });
    }
    if (!reason || reason.length < 10) {
      return res.status(400).json({ status: 'error', message: 'Reason must be at least 10 characters' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    const balanceBefore = user.walletBalance;
    user.walletBalance -= parseFloat(amount);
    await user.save();

    await Transaction.create({
      userId: user._id,
      type: 'admin-deduction',
      amount: parseFloat(amount),
      status: 'completed',
      reference: `SUPPORT-DEDUCT-${Date.now()}`,
      gateway: 'admin-deduction',
      createdAt: new Date()
    });

    logSupport('WALLET_DEDUCTED', {
      workerId: req.user._id,
      userId, amount, reason, balanceBefore, balanceAfter: user.walletBalance
    });

    res.json({
      status: 'success',
      message: `Deducted GH₵${parseFloat(amount).toFixed(2)} from ${user.name}`,
      data: { balanceBefore, balanceAfter: user.walletBalance }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================================================
// ORDER REPORTS / TICKETS - Manage customer reports
// ============================================================================
router.get('/reports', auth, workerAuth, async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status !== 'all') query.status = status;

    const [reports, total] = await Promise.all([
      OrderReport.find(query)
        .populate('userId', 'name phoneNumber email')
        .populate('purchaseId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      OrderReport.countDocuments(query)
    ]);

    res.json({
      status: 'success',
      data: { reports, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.put('/reports/:id', auth, workerAuth, async (req, res) => {
  try {
    const { status, adminNotes, resolution } = req.body;
    const report = await OrderReport.findById(req.params.id);
    if (!report) return res.status(404).json({ status: 'error', message: 'Report not found' });

    if (status) report.status = status;
    if (adminNotes) report.adminNotes = adminNotes;
    if (resolution) report.resolution = resolution;
    report.updatedAt = new Date();
    await report.save();

    logSupport('REPORT_UPDATED', { workerId: req.user._id, reportId: report._id, status, resolution });

    res.json({ status: 'success', message: 'Report updated', data: report });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================================================
// AGENT STORE WITHDRAWALS - View and manage
// ============================================================================
router.get('/withdrawals', auth, workerAuth, async (req, res) => {
  try {
    if (!StoreWithdrawal) {
      return res.status(503).json({ status: 'error', message: 'Store withdrawals not available' });
    }

    const { status = 'all', page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status !== 'all') query.status = status;

    const [withdrawals, total] = await Promise.all([
      StoreWithdrawal.find(query)
        .populate('storeId', 'storeName')
        .populate('agentId', 'name phoneNumber email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      StoreWithdrawal.countDocuments(query)
    ]);

    res.json({
      status: 'success',
      data: { withdrawals, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================================================
// AGENT STORES - View agent stores
// ============================================================================
router.get('/stores', auth, workerAuth, async (req, res) => {
  try {
    if (!AgentStore) {
      return res.status(503).json({ status: 'error', message: 'Agent stores not available' });
    }

    const { q, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query = { $or: [{ storeName: regex }, { storeSlug: regex }] };
    }

    const [stores, total] = await Promise.all([
      AgentStore.find(query)
        .populate('agentId', 'name phoneNumber email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AgentStore.countDocuments(query)
    ]);

    res.json({
      status: 'success',
      data: { stores, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================================================
// ROLE MANAGEMENT - Admin only: change user roles
// ============================================================================
router.put('/users/:id/role', auth, async (req, res) => {
  try {
    // Only admins can change roles
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Only admins can change user roles' });
    }

    const { role } = req.body;
    const validRoles = ['buyer', 'seller', 'reporter', 'admin', 'Dealer', 'worker'];

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ status: 'error', message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    // Prevent demoting yourself
    if (req.params.id === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ status: 'error', message: 'Cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true }
    ).select('name email phoneNumber role');

    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    logSupport('ROLE_CHANGED', {
      adminId: req.user._id,
      adminName: req.user.name,
      userId: user._id,
      userName: user.name,
      newRole: role
    });

    res.json({ status: 'success', message: `${user.name} is now a ${role}`, data: user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================================================
// LIST WORKERS - Admin only: see all support team members
// ============================================================================
router.get('/workers', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Admin access required' });
    }

    const workers = await User.find({ role: 'worker' })
      .select('name email phoneNumber createdAt lastLogin')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ status: 'success', data: workers });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
