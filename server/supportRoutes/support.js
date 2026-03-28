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
        .populate({
          path: 'storeId',
          select: 'storeName owner',
          populate: { path: 'owner', select: 'name phoneNumber email' }
        })
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
        .populate('owner', 'name phoneNumber email')
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
// STORE ORDERS - View & manage stuck store orders
// ============================================================================

// Import store-related dependencies for support
const axios = require('axios');
const DATAMART_BASE_URL = 'https://api.datamartgh.shop';
const DATAMART_API_KEY = process.env.DATAMART_API_KEY || 'fb9b9e81e9640c1861605b4ec333e3bd57bdf70dcce461d766fa877c9c0f7553';
const PAYSTACK_SECRET_KEY_STORE = process.env.PAYSTACK_SECRET_KEY || 'sk_live_b8f78b58b7860fd9795eb376a8602eba072d6e15';

const datamartClient = axios.create({
  baseURL: DATAMART_BASE_URL,
  headers: { 'x-api-key': DATAMART_API_KEY, 'Content-Type': 'application/json' }
});

const paystackClient = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET_KEY_STORE}`, 'Content-Type': 'application/json' }
});

const mapNetworkForDatamart = (network) => {
  const networkMap = {
    'AIRTELTIGO': 'at', 'AT': 'at', 'AT_PREMIUM': 'at',
    'YELLO': 'YELLO', 'MTN': 'YELLO',
    'TELECEL': 'TELECEL', 'VODAFONE': 'TELECEL'
  };
  return networkMap[network?.toUpperCase()?.replace(/[\s-_]/g, '')] || network;
};

// Get all store orders (with filters)
router.get('/store-orders', auth, workerAuth, async (req, res) => {
  try {
    if (!AgentTransaction) {
      const storeSchema = require('../schema/storeSchema');
      AgentTransaction = storeSchema.AgentTransaction;
    }
    if (!AgentTransaction) {
      return res.status(503).json({ status: 'error', message: 'Store orders not available' });
    }

    const { status = 'all', page = 1, limit = 30, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status !== 'all') query.orderStatus = status;
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { transactionId: regex },
        { recipientPhone: regex },
        { customerPhone: regex },
        { customerName: regex }
      ];
    }

    const [orders, total] = await Promise.all([
      AgentTransaction.find(query)
        .populate({
          path: 'storeId',
          select: 'storeName owner',
          populate: { path: 'owner', select: 'name phoneNumber email' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AgentTransaction.countDocuments(query)
    ]);

    res.json({
      status: 'success',
      data: { orders, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Verify payment & retry fulfillment (Support)
router.post('/store-orders/:transactionId/verify-and-retry', auth, workerAuth, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (!AgentTransaction) {
      const storeSchema = require('../schema/storeSchema');
      AgentTransaction = storeSchema.AgentTransaction;
    }

    const transaction = await AgentTransaction.findOneAndUpdate(
      { transactionId: req.params.transactionId, orderStatus: { $in: ['processing', 'paid'] } },
      { $set: { fulfillmentStatus: 'retrying' } },
      { new: true, session }
    );

    if (!transaction) {
      await session.abortTransaction();
      return res.status(404).json({ status: 'error', message: 'Order not found or not eligible for retry' });
    }

    // Verify payment with Paystack
    let paymentVerified = false;
    try {
      const paystackRes = await paystackClient.get(`/transaction/verify/${transaction.transactionId}`);
      if (paystackRes.data?.data?.status === 'success') {
        paymentVerified = true;
      }
    } catch (err) {
      if (transaction.paidAt) paymentVerified = true;
    }

    if (!paymentVerified) {
      transaction.fulfillmentStatus = 'pending';
      await transaction.save({ session });
      await session.commitTransaction();
      return res.status(400).json({ status: 'error', message: 'Payment not confirmed by Paystack' });
    }

    if (!transaction.paidAt) {
      transaction.orderStatus = 'paid';
      transaction.paidAt = new Date();
    }

    // Retry DataMart fulfillment
    const datamartPayload = {
      phoneNumber: transaction.recipientPhone,
      network: mapNetworkForDatamart(transaction.network),
      capacity: transaction.capacity.toString(),
      gateway: 'wallet',
      ref: transaction.transactionId
    };

    logSupport('SUPPORT_RETRY_REQUEST', { workerId: req.user._id, ...datamartPayload });

    let fulfillmentSuccess = false;
    let datamartResponse = null;

    try {
      const response = await datamartClient.post('/api/developer/purchase', datamartPayload);
      datamartResponse = response.data;
      if (datamartResponse && datamartResponse.status === 'success') {
        fulfillmentSuccess = true;
      }
    } catch (datamartError) {
      datamartResponse = { error: datamartError.message, response: datamartError.response?.data };
    }

    if (fulfillmentSuccess) {
      transaction.orderStatus = 'completed';
      transaction.fulfillmentStatus = 'delivered';
      transaction.datamartReference = datamartResponse.reference || datamartResponse.data?.reference;
      transaction.fulfillmentResponse = datamartResponse;
      transaction.completedAt = new Date();
      transaction.updatedAt = new Date();
      await transaction.save({ session });

      // Credit store wallet
      if (AgentStore) {
        await AgentStore.findByIdAndUpdate(
          transaction.storeId,
          {
            $inc: {
              'wallet.availableBalance': transaction.netProfit,
              'wallet.totalEarnings': transaction.netProfit,
              'stats.totalOrders': 1,
              'stats.totalRevenue': transaction.sellingPrice
            }
          },
          { session }
        );
      }

      await session.commitTransaction();

      logSupport('SUPPORT_RETRY_SUCCESS', { workerId: req.user._id, transactionId: transaction.transactionId });

      res.json({
        status: 'success',
        message: 'Payment verified and order fulfilled',
        data: { transactionId: transaction.transactionId, orderStatus: 'completed' }
      });
    } else {
      transaction.fulfillmentStatus = 'pending';
      transaction.fulfillmentResponse = datamartResponse;
      transaction.updatedAt = new Date();
      await transaction.save({ session });
      await session.commitTransaction();

      res.json({
        status: 'failed',
        message: 'Payment confirmed but data delivery failed. Try again shortly.',
        data: { transactionId: transaction.transactionId, orderStatus: 'processing', datamartResponse }
      });
    }
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    logSupport('SUPPORT_RETRY_ERROR', { error: error.message });
    res.status(500).json({ status: 'error', message: error.message });
  } finally {
    session.endSession();
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

// ============================================================================
// USER ACCOUNT MANAGEMENT — Disable/Enable, Approve/Reject
// ============================================================================

// Disable a user account (ADMIN ONLY)
router.post('/users/:id/disable', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ status: 'error', message: 'Admin access required' });
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isDisabled: true, disableReason: reason || 'Disabled by support', disabledAt: new Date() } },
      { new: true }
    ).select('name email phoneNumber isDisabled');

    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    logSupport('USER_DISABLED', { workerId: req.user._id, userId: user._id, userName: user.name, reason });
    res.json({ status: 'success', message: `${user.name} has been disabled`, data: user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Enable a user account (ADMIN ONLY)
router.post('/users/:id/enable', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ status: 'error', message: 'Admin access required' });
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isDisabled: false }, $unset: { disableReason: 1, disabledAt: 1 } },
      { new: true }
    ).select('name email phoneNumber isDisabled');

    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    logSupport('USER_ENABLED', { workerId: req.user._id, userId: user._id, userName: user.name });
    res.json({ status: 'success', message: `${user.name} has been re-enabled`, data: user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Approve a user
router.post('/users/:id/approve', auth, workerAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { approvalStatus: 'approved', approvedBy: req.user._id, approvedAt: new Date() } },
      { new: true }
    ).select('name email phoneNumber approvalStatus');

    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    logSupport('USER_APPROVED', { workerId: req.user._id, userId: user._id, userName: user.name });
    res.json({ status: 'success', message: `${user.name} has been approved`, data: user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Reject a user
router.post('/users/:id/reject', auth, workerAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { approvalStatus: 'rejected', rejectionReason: reason || 'Rejected by support' } },
      { new: true }
    ).select('name email phoneNumber approvalStatus');

    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    logSupport('USER_REJECTED', { workerId: req.user._id, userId: user._id, userName: user.name, reason });
    res.json({ status: 'success', message: `${user.name} has been rejected`, data: user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================================================
// ALL ORDERS — View all orders with filters (not just failed)
// ============================================================================
router.get('/all-orders', auth, workerAuth, async (req, res) => {
  try {
    const { status = 'all', network, page = 1, limit = 30, search, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    if (status !== 'all') query.status = status;
    if (network) query.network = network;
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { phoneNumber: regex },
        { geonetReference: regex },
        { apiOrderId: regex }
      ];
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) { const d = new Date(endDate); d.setHours(23, 59, 59, 999); query.createdAt.$lte = d; }
    }

    const [orders, total] = await Promise.all([
      DataPurchase.find(query)
        .populate('userId', 'name email phoneNumber')
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

// Mark order as completed manually
router.post('/orders/:id/complete', auth, workerAuth, async (req, res) => {
  try {
    const order = await DataPurchase.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'completed' } },
      { new: true }
    );
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

    logSupport('ORDER_COMPLETED_MANUAL', { workerId: req.user._id, orderId: order._id, ref: order.geonetReference });
    res.json({ status: 'success', message: 'Order marked as completed', data: order });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Bulk refund failed orders
router.post('/orders/bulk-refund', auth, workerAuth, async (req, res) => {
  try {
    const { orderIds } = req.body;
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ status: 'error', message: 'orderIds array required' });
    }

    const results = { success: 0, failed: 0, errors: [] };

    for (const orderId of orderIds) {
      try {
        const order = await DataPurchase.findById(orderId);
        if (!order || order.status === 'refunded') {
          results.failed++;
          results.errors.push({ orderId, reason: 'Not found or already refunded' });
          continue;
        }

        const user = await User.findById(order.userId);
        if (!user) {
          results.failed++;
          results.errors.push({ orderId, reason: 'User not found' });
          continue;
        }

        user.walletBalance = (user.walletBalance || 0) + order.price;
        order.status = 'refunded';

        const refundTx = new Transaction({
          userId: user._id,
          type: 'refund',
          amount: order.price,
          status: 'completed',
          reference: `REFUND-${order.geonetReference || order._id}`,
          gateway: 'system',
          description: `Bulk refund: ${order.network} ${order.capacity}GB to ${order.phoneNumber}`
        });

        await refundTx.save();
        await order.save();
        await user.save();
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ orderId, reason: err.message });
      }
    }

    logSupport('BULK_REFUND', { workerId: req.user._id, total: orderIds.length, ...results });
    res.json({ status: 'success', message: `Refunded ${results.success}/${orderIds.length} orders`, data: results });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================================================
// SMS — Send message to customer
// ============================================================================
const MNOTIFY_API_KEY = process.env.MNOTIFY_API_KEY || 'w3rGWhv4e235nDwYvD5gVDyrW';

router.post('/send-sms', auth, workerAuth, async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    if (!phoneNumber || !message) {
      return res.status(400).json({ status: 'error', message: 'phoneNumber and message required' });
    }

    const smsRes = await axios.get(`https://apps.mnotify.net/smsapi`, {
      params: {
        key: MNOTIFY_API_KEY,
        to: phoneNumber,
        msg: message,
        sender_id: 'DataHustle'
      }
    });

    logSupport('SMS_SENT', { workerId: req.user._id, to: phoneNumber, messageLength: message.length });
    res.json({ status: 'success', message: `SMS sent to ${phoneNumber}`, data: smsRes.data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'SMS sending failed: ' + error.message });
  }
});

// ============================================================================
// AUDIT LOG — Persistent support action log
// ============================================================================

// Save audit log to DB (create a simple collection)
const AuditLogSchema = new mongoose.Schema({
  action: String,
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Userdatahustle' },
  workerName: String,
  details: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ workerId: 1 });
const AuditLog = mongoose.models.SupportAuditLog || mongoose.model('SupportAuditLog', AuditLogSchema);

// Override logSupport to also persist to DB
const _originalLogSupport = logSupport;
const logSupportPersist = (operation, data) => {
  console.log(`[${new Date().toISOString()}] [SUPPORT] [${operation}]`, JSON.stringify(data));
  AuditLog.create({
    action: operation,
    workerId: data.workerId || data.adminId,
    workerName: data.workerName || data.workerEmail || '',
    details: data
  }).catch(() => {});
};
// Note: existing endpoints still use logSupport (console only).
// New endpoints below use logSupportPersist.

// Get audit logs
router.get('/audit-logs', auth, workerAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, action, workerId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};
    if (action) query.action = new RegExp(action, 'i');
    if (workerId) query.workerId = workerId;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('workerId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    res.json({ status: 'success', data: { logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================================================
// PENDING USERS — List users awaiting approval
// ============================================================================
router.get('/pending-users', auth, workerAuth, async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find({ approvalStatus: 'pending' })
        .select('name email phoneNumber walletBalance createdAt approvalStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments({ approvalStatus: 'pending' })
    ]);

    res.json({ status: 'success', data: { users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================================================
// WALLET DEDUCT — Deduct from user wallet (for corrections)
// ============================================================================
router.post('/wallet/deduct', auth, workerAuth, async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    if (!userId || !amount || !reason) {
      return res.status(400).json({ status: 'error', message: 'userId, amount, and reason required' });
    }

    const deductAmount = parseFloat(amount);
    if (isNaN(deductAmount) || deductAmount <= 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid amount' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    if (user.walletBalance < deductAmount) {
      return res.status(400).json({ status: 'error', message: `User only has GH₵${user.walletBalance.toFixed(2)}` });
    }

    const balanceBefore = user.walletBalance;
    user.walletBalance -= deductAmount;

    const tx = new Transaction({
      userId: user._id,
      type: 'admin-deduction',
      amount: deductAmount,
      status: 'completed',
      reference: `DEDUCT-${Date.now()}`,
      gateway: 'system',
      description: `Support deduction: ${reason}`
    });

    await tx.save();
    await user.save();

    logSupportPersist('WALLET_DEDUCTED', {
      workerId: req.user._id,
      targetUserId: userId,
      targetName: user.name,
      amount: deductAmount,
      reason,
      balanceBefore,
      balanceAfter: user.walletBalance
    });

    res.json({
      status: 'success',
      message: `GH₵${deductAmount.toFixed(2)} deducted from ${user.name}`,
      data: { balanceBefore, balanceAfter: user.walletBalance }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================================================
// DEPOSIT RESOLUTION — Search & credit deposits for users
// ============================================================================

/**
 * GET /api/support/deposit/search/:reference
 * Search for a deposit by Paystack reference or MoMo TrxId
 * Checks: 1) Local transactions  2) Paystack API  3) DataMart MoMo pool
 */
router.get('/deposit/search/:reference', auth, workerAuth, async (req, res) => {
  try {
    const { reference } = req.params;
    if (!reference) return res.status(400).json({ status: 'error', message: 'Reference required' });

    const results = { local: null, paystack: null, momo: null };

    // 1) Check local transactions
    const localTx = await Transaction.findOne({
      $or: [
        { reference },
        { reference: `DEP-${reference}` },
        { reference: `MOMO-${reference}` },
        { 'metadata.externalRef': reference }
      ]
    }).populate('userId', 'name email phoneNumber walletBalance').lean();

    if (localTx) {
      results.local = {
        _id: localTx._id,
        userId: localTx.userId,
        type: localTx.type,
        amount: localTx.amount,
        status: localTx.status,
        reference: localTx.reference,
        gateway: localTx.gateway,
        createdAt: localTx.createdAt,
        metadata: localTx.metadata
      };
    }

    // 2) Check Paystack
    try {
      const paystackRes = await paystackClient.get(`/transaction/verify/${reference}`);
      if (paystackRes.data?.data) {
        const pd = paystackRes.data.data;
        results.paystack = {
          reference: pd.reference,
          amount: pd.amount / 100, // Convert from kobo/pesewas
          status: pd.status,
          channel: pd.channel,
          currency: pd.currency,
          paidAt: pd.paid_at,
          customerEmail: pd.customer?.email,
          gatewayResponse: pd.gateway_response
        };
      }
    } catch (e) {
      // Paystack didn't find it — that's fine
    }

    // 3) Check MoMo (DataMart pool)
    try {
      const momoRes = await datamartClient.get(`/api/payments/external/check/${reference}`);
      if (momoRes.data?.success) {
        results.momo = momoRes.data.data;
      }
    } catch (e) {
      // Not in MoMo pool — that's fine
    }

    const found = results.local || results.paystack || results.momo;
    if (!found) {
      return res.status(404).json({ status: 'error', message: 'No deposit found with this reference' });
    }

    logSupport('DEPOSIT_SEARCH', { workerId: req.user._id, reference, found: !!found });

    res.json({ status: 'success', data: results });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * POST /api/support/deposit/credit
 * Credit a user's wallet after verifying a deposit
 * Body: { userId, reference, amount, type: 'paystack' | 'momo', notes }
 */
router.post('/deposit/credit', auth, workerAuth, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { userId, reference, amount, type, notes } = req.body;

    if (!userId || !reference || !amount || !type) {
      return res.status(400).json({ status: 'error', message: 'userId, reference, amount, and type are required' });
    }

    if (!['paystack', 'momo'].includes(type)) {
      return res.status(400).json({ status: 'error', message: 'type must be paystack or momo' });
    }

    const creditAmount = parseFloat(amount);
    if (isNaN(creditAmount) || creditAmount <= 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid amount' });
    }

    // Check if already credited
    const existing = await Transaction.findOne({
      reference: { $in: [reference, `DEP-${reference}`, `MOMO-${reference}`, `SUPPORT-${reference}`] },
      status: 'completed',
      type: 'deposit'
    });

    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: 'This deposit has already been credited',
        data: { transactionId: existing._id, creditedAt: existing.createdAt }
      });
    }

    // Verify the payment source before crediting
    if (type === 'paystack') {
      try {
        const paystackRes = await paystackClient.get(`/transaction/verify/${reference}`);
        if (paystackRes.data?.data?.status !== 'success') {
          return res.status(400).json({ status: 'error', message: `Paystack payment status: ${paystackRes.data?.data?.status || 'unknown'}. Cannot credit.` });
        }
      } catch (e) {
        return res.status(400).json({ status: 'error', message: 'Could not verify payment with Paystack. Reference may be invalid.' });
      }
    } else if (type === 'momo') {
      // Claim from DataMart's MoMo pool
      try {
        const user = await User.findById(userId).lean();
        const claimRes = await datamartClient.post('/api/payments/external/claim', {
          trxId: reference,
          platformUserId: userId,
          platformUserName: user?.name || 'Support Credit'
        });
        if (!claimRes.data?.success) {
          return res.status(400).json({ status: 'error', message: claimRes.data?.message || 'Could not claim MoMo payment' });
        }
      } catch (e) {
        const msg = e.response?.data?.message || 'Could not claim MoMo payment from pool';
        return res.status(400).json({ status: 'error', message: msg });
      }
    }

    // Credit the user's wallet
    session.startTransaction();

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const balanceBefore = user.walletBalance || 0;
    user.walletBalance = balanceBefore + creditAmount;

    const transaction = new Transaction({
      userId: user._id,
      type: 'deposit',
      amount: creditAmount,
      status: 'completed',
      reference: `SUPPORT-${reference}`,
      gateway: type === 'paystack' ? 'paystack' : 'momo',
      description: `Support credit: ${type} ref ${reference}${notes ? ' — ' + notes : ''}`
    });

    await transaction.save({ session });
    await user.save({ session });
    await session.commitTransaction();

    logSupport('DEPOSIT_CREDITED', {
      workerId: req.user._id,
      workerEmail: req.user.email,
      targetUserId: userId,
      targetEmail: user.email,
      amount: creditAmount,
      reference,
      type,
      balanceBefore,
      balanceAfter: user.walletBalance,
      notes
    });

    res.json({
      status: 'success',
      message: `GH₵${creditAmount.toFixed(2)} credited to ${user.name || user.email}`,
      data: {
        transactionId: transaction._id,
        userId: user._id,
        userName: user.name,
        amount: creditAmount,
        balanceBefore,
        balanceAfter: user.walletBalance,
        reference: `SUPPORT-${reference}`
      }
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    logSupport('DEPOSIT_CREDIT_ERROR', { error: error.message });
    res.status(500).json({ status: 'error', message: error.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;
