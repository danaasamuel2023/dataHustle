// storeRoutes.js - Agent Store Routes for DataHustle
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');
const crypto = require('crypto');
const auth = require('../middlewareUser/middleware');

// Import schemas
const { User, DataPurchase, Transaction, DataInventory, OrderReport } = require('../schema/schema');
const {
  AgentStore,
  AgentProduct,
  AgentTransaction,
  StoreWithdrawal,
  WalletAuditLog
} = require('../schema/storeSchema');

// ===== PAYSTACK CONFIGURATION =====
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRETE_KEY || 'sk_live_xxx';

const paystackClient = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

// ===== DATAMART API CONFIGURATION =====
const DATAMART_BASE_URL = 'https://api.datamartgh.shop';
const DATAMART_API_KEY = process.env.DATAMART_API_KEY || 'fb9b9e81e9640c1861605b4ec333e3bd57bdf70dcce461d766fa877c9c0f7553';

const datamartClient = axios.create({
  baseURL: DATAMART_BASE_URL,
  headers: {
    'x-api-key': DATAMART_API_KEY,
    'Content-Type': 'application/json'
  }
});

// ===== OFFICIAL PRICING STRUCTURE =====
const OFFICIAL_PRICING = {
  'YELLO': {
    '1': 4.20, '2': 8.80, '3': 12.80, '4': 17.80, '5': 22.30, '6': 25.00,
    '8': 33.00, '10': 41.00, '15': 59.50, '20': 79.00, '25': 99.00,
    '30': 121.00, '40': 158.00, '50': 200.00
  },
  'AT_PREMIUM': {
    '1': 3.95, '2': 8.35, '3': 13.25, '4': 16.50, '5': 19.50, '6': 23.50,
    '8': 30.50, '10': 38.50, '12': 45.50, '15': 57.50, '25': 95.00,
    '30': 115.00, '40': 151.00, '50': 190.00
  },
  'TELECEL': {
    '5': 19.50, '8': 34.64, '10': 37.50, '12': 43.70, '15': 54.85,
    '20': 73.80, '25': 90.75, '30': 107.70, '35': 130.65, '40': 142.60,
    '45': 154.55, '50': 177.50, '100': 397.00
  }
};

const getBasePrice = (network, capacity) => {
  const networkMap = {
    'MTN': 'YELLO',
    'YELLO': 'YELLO',
    'AIRTELTIGO': 'AT_PREMIUM',
    'AT': 'AT_PREMIUM',
    'AT_PREMIUM': 'AT_PREMIUM',
    'TELECEL': 'TELECEL',
    'VODAFONE': 'TELECEL'
  };
  const normalizedNetwork = networkMap[network?.toUpperCase()] || network;
  return OFFICIAL_PRICING[normalizedNetwork]?.[capacity?.toString()] || null;
};

// ===== HELPER FUNCTIONS =====
const logOperation = (operation, data) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [STORE] [${operation}]`, JSON.stringify(data, null, 2));
};

const mapNetworkForDatamart = (network) => {
  const networkMap = {
    'AIRTELTIGO': 'at',
    'AT': 'at',
    'AT_PREMIUM': 'at',
    'YELLO': 'YELLO',
    'MTN': 'YELLO',
    'TELECEL': 'TELECEL',
    'VODAFONE': 'TELECEL'
  };
  const cleanNetwork = network.toUpperCase().replace(/[\s-_]/g, '');
  return networkMap[cleanNetwork] || network;
};

const verifyPaystackSignature = (payload, signature) => {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(payload))
    .digest('hex');
  return hash === signature;
};

function generateMixedReference(prefix = '') {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let reference = prefix;
  for (let i = 0; i < 2; i++) {
    reference += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 4; i++) {
    reference += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  for (let i = 0; i < 2; i++) {
    reference += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return reference;
}

const verifyAgentOwnership = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const ownerId = req.user._id;

    const store = await AgentStore.findById(storeId);
    if (!store) {
      return res.status(404).json({ status: 'error', message: 'Store not found' });
    }

    if (store.owner.toString() !== ownerId.toString()) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized: You do not own this store' });
    }

    req.store = store;
    next();
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to verify store ownership' });
  }
};

// ===== WALLET AUDIT LOGGING =====
const logWalletCredit = async (store, transaction, options = {}) => {
  try {
    const { session } = options;

    if (!transaction || !transaction._id) {
      logOperation('WALLET_AUDIT_BLOCKED', { storeId: store._id, reason: 'No valid transaction' });
      return null;
    }

    // Check for duplicate
    let dupQuery = WalletAuditLog.findOne({
      'source.referenceId': transaction.transactionId || transaction._id.toString(),
      operation: 'credit',
      storeId: store._id
    });
    if (session) dupQuery = dupQuery.session(session);
    const existingLog = await dupQuery;

    if (existingLog) {
      logOperation('WALLET_AUDIT_DUPLICATE', { storeId: store._id, transactionId: transaction.transactionId });
      return existingLog._id;
    }

    const balanceBefore = (store.wallet?.availableBalance || 0) - transaction.netProfit;

    const auditLog = new WalletAuditLog({
      storeId: store._id,
      operation: 'credit',
      amount: transaction.netProfit,
      balanceBefore,
      balanceAfter: store.wallet?.availableBalance || 0,
      source: {
        type: 'transaction',
        referenceId: transaction.transactionId || transaction._id.toString(),
        referenceModel: 'AgentTransaction'
      },
      reason: `Order completed: ${transaction.network} ${transaction.capacity}GB to ${transaction.recipientPhone}`,
      createdAt: new Date()
    });

    await auditLog.save({ session });

    logOperation('WALLET_AUDIT_LOGGED', {
      storeId: store._id,
      transactionId: transaction.transactionId,
      amount: transaction.netProfit
    });

    return auditLog._id;
  } catch (error) {
    logOperation('WALLET_AUDIT_ERROR', { storeId: store._id, error: error.message });
    throw error;
  }
};

// ===== PUBLIC ROUTES =====

// Get store by slug (public)
router.get('/store/:storeSlug', async (req, res) => {
  try {
    const { storeSlug } = req.params;

    const store = await AgentStore.findOne({ storeSlug, isActive: true })
      .select('storeName storeSlug description logo contactPhone contactEmail whatsappNumber design');

    if (!store) {
      return res.status(404).json({ status: 'error', message: 'Store not found' });
    }

    res.json({ status: 'success', data: { store } });
  } catch (error) {
    logOperation('GET_STORE_ERROR', { error: error.message });
    res.status(500).json({ status: 'error', message: 'Failed to fetch store' });
  }
});

// Get store products (public)
router.get('/stores/:storeSlug/products', async (req, res) => {
  try {
    const { storeSlug } = req.params;

    const store = await AgentStore.findOne({ storeSlug, isActive: true });
    if (!store) {
      return res.status(404).json({ status: 'error', message: 'Store not found' });
    }

    const products = await AgentProduct.find({ storeId: store._id, isActive: true, inStock: true })
      .select('name description network capacity capacityUnit validity sellingPrice')
      .sort({ network: 1, capacity: 1 });

    res.json({ status: 'success', data: { products, storeName: store.storeName } });
  } catch (error) {
    logOperation('GET_PRODUCTS_ERROR', { error: error.message });
    res.status(500).json({ status: 'error', message: 'Failed to fetch products' });
  }
});

// Initialize purchase (public)
router.post('/stores/:storeSlug/purchase/initialize', async (req, res) => {
  try {
    const { storeSlug } = req.params;
    const { productId, recipientPhone, customerPhone, customerName, customerEmail } = req.body;

    // Validate
    if (!productId || !recipientPhone || !customerPhone) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    const store = await AgentStore.findOne({ storeSlug, isActive: true });
    if (!store) {
      return res.status(404).json({ status: 'error', message: 'Store not found' });
    }

    const product = await AgentProduct.findOne({ _id: productId, storeId: store._id, isActive: true, inStock: true });
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found or out of stock' });
    }

    // Generate transaction ID
    const transactionId = `STORE-${Date.now()}-${generateMixedReference()}`;

    // Create pending transaction
    const transaction = new AgentTransaction({
      transactionId,
      storeId: store._id,
      productId: product._id,
      customerPhone,
      customerName: customerName || '',
      customerEmail: customerEmail || '',
      recipientPhone,
      productName: product.name,
      network: product.network,
      capacity: product.capacity,
      capacityUnit: product.capacityUnit,
      basePrice: product.basePrice,
      sellingPrice: product.sellingPrice,
      customerPaid: product.sellingPrice,
      netProfit: product.sellingPrice - product.basePrice,
      paymentMethod: 'paystack',
      orderStatus: 'pending',
      fulfillmentStatus: 'pending',
      createdAt: new Date()
    });

    await transaction.save();

    // Initialize Paystack payment
    const paystackPayload = {
      email: customerEmail || `${customerPhone}@store.datahustle.com`,
      amount: Math.round(product.sellingPrice * 100), // Convert to pesewas
      currency: 'GHS',
      reference: transactionId,
      callback_url: `${process.env.FRONTEND_URL || 'https://datavendo.shop'}/shop/${storeSlug}/payment/verify?reference=${transactionId}`,
      metadata: {
        transactionId,
        storeId: store._id.toString(),
        productId: product._id.toString(),
        recipientPhone,
        customerPhone,
        network: product.network,
        capacity: product.capacity,
        custom_fields: [
          { display_name: 'Recipient', variable_name: 'recipient', value: recipientPhone },
          { display_name: 'Network', variable_name: 'network', value: product.network },
          { display_name: 'Package', variable_name: 'package', value: `${product.capacity}${product.capacityUnit}` }
        ]
      },
      channels: ['mobile_money']
    };

    const paystackResponse = await paystackClient.post('/transaction/initialize', paystackPayload);

    if (!paystackResponse.data.status) {
      throw new Error('Failed to initialize payment');
    }

    // Update transaction with payment reference
    transaction.paymentReference = paystackResponse.data.data.reference;
    transaction.paystackReference = paystackResponse.data.data.reference;
    await transaction.save();

    logOperation('PURCHASE_INITIALIZED', {
      transactionId,
      storeId: store._id,
      productId: product._id,
      amount: product.sellingPrice
    });

    res.json({
      status: 'success',
      data: {
        transactionId,
        paymentUrl: paystackResponse.data.data.authorization_url,
        reference: paystackResponse.data.data.reference,
        amount: product.sellingPrice
      }
    });
  } catch (error) {
    logOperation('PURCHASE_INIT_ERROR', { error: error.message });
    res.status(500).json({ status: 'error', message: 'Failed to initialize purchase' });
  }
});

// Verify payment (public)
router.get('/stores/:storeSlug/payment/verify', async (req, res) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({ status: 'error', message: 'Reference is required' });
    }

    const transaction = await AgentTransaction.findOne({ transactionId: reference });
    if (!transaction) {
      return res.status(404).json({ status: 'error', message: 'Transaction not found' });
    }

    // If already completed, return success
    if (transaction.orderStatus === 'completed') {
      return res.json({
        status: 'success',
        message: 'Order already completed',
        data: { transaction }
      });
    }

    // Verify with Paystack
    const paystackResponse = await paystackClient.get(`/transaction/verify/${reference}`);

    if (paystackResponse.data.status && paystackResponse.data.data.status === 'success') {
      // Process the order
      await processCompletedPayment(transaction);

      return res.json({
        status: 'success',
        message: 'Payment verified and order processing',
        data: { transactionId: transaction.transactionId }
      });
    } else {
      return res.json({
        status: 'pending',
        message: 'Payment not yet confirmed',
        data: { transactionId: transaction.transactionId }
      });
    }
  } catch (error) {
    logOperation('VERIFY_ERROR', { error: error.message });
    res.status(500).json({ status: 'error', message: 'Failed to verify payment' });
  }
});

// Payment status check (public)
router.get('/stores/:storeSlug/payment/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await AgentTransaction.findOne({ transactionId })
      .select('transactionId orderStatus fulfillmentStatus network capacity recipientPhone createdAt');

    if (!transaction) {
      return res.status(404).json({ status: 'error', message: 'Transaction not found' });
    }

    res.json({ status: 'success', data: { transaction } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch status' });
  }
});

// Paystack Webhook
router.post('/webhook/paystack', async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];

    if (!verifyPaystackSignature(req.body, signature)) {
      logOperation('WEBHOOK_INVALID_SIGNATURE', {});
      return res.status(401).send('Invalid signature');
    }

    const event = req.body;
    logOperation('WEBHOOK_RECEIVED', { event: event.event, reference: event.data?.reference });

    if (event.event === 'charge.success') {
      const reference = event.data.reference;

      // Check if this is a store transaction (STORE-xxx prefix)
      if (reference && reference.startsWith('STORE-')) {
        const transaction = await AgentTransaction.findOne({ transactionId: reference });

        if (transaction && transaction.orderStatus === 'pending') {
          await processCompletedPayment(transaction, event.data);
          logOperation('WEBHOOK_PROCESSED', { transactionId: reference });
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    logOperation('WEBHOOK_ERROR', { error: error.message });
    res.status(500).send('Error');
  }
});

// Process completed payment
async function processCompletedPayment(transaction, paystackData = null) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Mark as paid
    transaction.orderStatus = 'paid';
    transaction.paidAt = new Date();
    await transaction.save({ session });

    // Fulfill the order via DataMart API
    const datamartNetwork = mapNetworkForDatamart(transaction.network);

    const datamartPayload = {
      phoneNumber: transaction.recipientPhone,
      network: datamartNetwork,
      capacity: transaction.capacity.toString(),
      gateway: 'wallet',
      ref: transaction.transactionId
    };

    logOperation('DATAMART_STORE_REQUEST', datamartPayload);

    let fulfillmentSuccess = false;
    let datamartReference = null;

    try {
      const datamartResponse = await datamartClient.post('/api/developer/purchase', datamartPayload);

      if (datamartResponse.data && datamartResponse.data.status === 'success') {
        fulfillmentSuccess = true;
        datamartReference = datamartResponse.data.reference || datamartResponse.data.data?.reference;

        transaction.fulfillmentStatus = 'delivered';
        transaction.datamartReference = datamartReference;
        transaction.fulfillmentResponse = datamartResponse.data;
      }
    } catch (datamartError) {
      logOperation('DATAMART_STORE_ERROR', { error: datamartError.message });
      transaction.fulfillmentStatus = 'pending'; // Will retry later
      transaction.fulfillmentResponse = { error: datamartError.message };
    }

    // Update order status
    transaction.orderStatus = fulfillmentSuccess ? 'completed' : 'processing';
    transaction.completedAt = fulfillmentSuccess ? new Date() : null;
    transaction.updatedAt = new Date();
    await transaction.save({ session });

    // Credit store wallet if successful
    if (fulfillmentSuccess) {
      const store = await AgentStore.findById(transaction.storeId).session(session);

      // Update wallet
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

      // Update product sold count
      await AgentProduct.findByIdAndUpdate(
        transaction.productId,
        { $inc: { totalSold: 1 } },
        { session }
      );

      // Log wallet credit
      const updatedStore = await AgentStore.findById(transaction.storeId).session(session);
      await logWalletCredit(updatedStore, transaction, { session });
    }

    await session.commitTransaction();
    logOperation('PAYMENT_PROCESSED', { transactionId: transaction.transactionId, success: fulfillmentSuccess });

  } catch (error) {
    await session.abortTransaction();
    logOperation('PROCESS_PAYMENT_ERROR', { transactionId: transaction.transactionId, error: error.message });
    throw error;
  } finally {
    session.endSession();
  }
}

// ===== AUTHENTICATED ROUTES =====

// Create store
router.post('/stores/create', auth, async (req, res) => {
  try {
    const { storeName, storeSlug, description, contactPhone, contactEmail, whatsappNumber } = req.body;
    const ownerId = req.user._id;

    if (!storeName || !storeSlug) {
      return res.status(400).json({ status: 'error', message: 'Store name and slug are required' });
    }

    // Check if slug is taken
    const existingStore = await AgentStore.findOne({ storeSlug: storeSlug.toLowerCase() });
    if (existingStore) {
      return res.status(400).json({ status: 'error', message: 'Store slug already taken' });
    }

    // Check if user already has a store
    const userStore = await AgentStore.findOne({ owner: ownerId });
    if (userStore) {
      return res.status(400).json({ status: 'error', message: 'You already have a store' });
    }

    const store = new AgentStore({
      owner: ownerId,
      storeName,
      storeSlug: storeSlug.toLowerCase(),
      description: description || '',
      contactPhone: contactPhone || '',
      contactEmail: contactEmail || '',
      whatsappNumber: whatsappNumber || '',
      isActive: true,
      wallet: {
        availableBalance: 0,
        pendingBalance: 0,
        totalEarnings: 0,
        totalWithdrawn: 0
      },
      stats: {
        totalOrders: 0,
        totalCustomers: 0,
        totalRevenue: 0
      },
      createdAt: new Date()
    });

    await store.save();

    logOperation('STORE_CREATED', { storeId: store._id, storeName, ownerId });

    res.json({ status: 'success', message: 'Store created successfully', data: { store } });
  } catch (error) {
    logOperation('CREATE_STORE_ERROR', { error: error.message });
    res.status(500).json({ status: 'error', message: 'Failed to create store' });
  }
});

// Get my store
router.get('/stores/my-store', auth, async (req, res) => {
  try {
    const store = await AgentStore.findOne({ owner: req.user._id });

    if (!store) {
      return res.status(404).json({ status: 'error', message: 'Store not found' });
    }

    const products = await AgentProduct.find({ storeId: store._id });

    res.json({ status: 'success', data: { store, products } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch store' });
  }
});

// Update store
router.put('/stores/:storeId/update', auth, verifyAgentOwnership, async (req, res) => {
  try {
    const { storeName, description, contactPhone, contactEmail, whatsappNumber, design } = req.body;

    const updates = {};
    if (storeName) updates.storeName = storeName;
    if (description !== undefined) updates.description = description;
    if (contactPhone !== undefined) updates.contactPhone = contactPhone;
    if (contactEmail !== undefined) updates.contactEmail = contactEmail;
    if (whatsappNumber !== undefined) updates.whatsappNumber = whatsappNumber;
    if (design) updates.design = { ...req.store.design, ...design };
    updates.updatedAt = new Date();

    const store = await AgentStore.findByIdAndUpdate(
      req.params.storeId,
      { $set: updates },
      { new: true }
    );

    res.json({ status: 'success', data: { store } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update store' });
  }
});

// Toggle store status
router.post('/stores/:storeId/toggle-status', auth, verifyAgentOwnership, async (req, res) => {
  try {
    const store = await AgentStore.findByIdAndUpdate(
      req.params.storeId,
      { $set: { isActive: !req.store.isActive, updatedAt: new Date() } },
      { new: true }
    );

    res.json({ status: 'success', data: { store, isActive: store.isActive } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to toggle store status' });
  }
});

// Add product
router.post('/stores/:storeId/products', auth, verifyAgentOwnership, async (req, res) => {
  try {
    const { name, description, network, capacity, capacityUnit, validity, sellingPrice } = req.body;

    if (!name || !network || !capacity || !sellingPrice) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    const basePrice = getBasePrice(network, capacity);
    if (!basePrice) {
      return res.status(400).json({ status: 'error', message: 'Invalid network/capacity combination' });
    }

    if (sellingPrice < basePrice) {
      return res.status(400).json({
        status: 'error',
        message: `Selling price must be at least GH₵${basePrice.toFixed(2)} (base price)`
      });
    }

    // Check for duplicate product
    const existingProduct = await AgentProduct.findOne({
      storeId: req.params.storeId,
      network,
      capacity
    });

    if (existingProduct) {
      return res.status(400).json({ status: 'error', message: 'Product with this network and capacity already exists' });
    }

    const product = new AgentProduct({
      storeId: req.params.storeId,
      name,
      description: description || '',
      productType: 'data',
      network,
      capacity,
      capacityUnit: capacityUnit || 'GB',
      validity: validity || '30 days',
      basePrice,
      sellingPrice,
      isActive: true,
      inStock: true,
      totalSold: 0,
      createdAt: new Date()
    });

    await product.save();

    logOperation('PRODUCT_ADDED', { storeId: req.params.storeId, productId: product._id, network, capacity });

    res.json({ status: 'success', data: { product } });
  } catch (error) {
    logOperation('ADD_PRODUCT_ERROR', { error: error.message });
    res.status(500).json({ status: 'error', message: 'Failed to add product' });
  }
});

// Update product
router.put('/stores/:storeId/products/:productId', auth, verifyAgentOwnership, async (req, res) => {
  try {
    const { name, description, sellingPrice, isActive, inStock, validity } = req.body;

    const product = await AgentProduct.findOne({ _id: req.params.productId, storeId: req.params.storeId });
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    if (sellingPrice !== undefined && sellingPrice < product.basePrice) {
      return res.status(400).json({
        status: 'error',
        message: `Selling price must be at least GH₵${product.basePrice.toFixed(2)}`
      });
    }

    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (sellingPrice !== undefined) updates.sellingPrice = sellingPrice;
    if (isActive !== undefined) updates.isActive = isActive;
    if (inStock !== undefined) updates.inStock = inStock;
    if (validity) updates.validity = validity;
    updates.updatedAt = new Date();

    const updatedProduct = await AgentProduct.findByIdAndUpdate(
      req.params.productId,
      { $set: updates },
      { new: true }
    );

    res.json({ status: 'success', data: { product: updatedProduct } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update product' });
  }
});

// Delete product
router.delete('/stores/:storeId/products/:productId', auth, verifyAgentOwnership, async (req, res) => {
  try {
    const product = await AgentProduct.findOne({ _id: req.params.productId, storeId: req.params.storeId });
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    // Check if product has orders
    const orderCount = await AgentTransaction.countDocuments({ productId: req.params.productId });
    if (orderCount > 0) {
      // Just deactivate instead of delete
      product.isActive = false;
      await product.save();
      return res.json({ status: 'success', message: 'Product deactivated (has order history)' });
    }

    await AgentProduct.findByIdAndDelete(req.params.productId);
    res.json({ status: 'success', message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to delete product' });
  }
});

// Get dashboard stats
router.get('/stores/:storeId/dashboard', auth, verifyAgentOwnership, async (req, res) => {
  try {
    const store = req.store;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's stats
    const todayStats = await AgentTransaction.aggregate([
      {
        $match: {
          storeId: store._id,
          orderStatus: 'completed',
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: '$sellingPrice' },
          profit: { $sum: '$netProfit' }
        }
      }
    ]);

    // This month's stats
    const monthStats = await AgentTransaction.aggregate([
      {
        $match: {
          storeId: store._id,
          orderStatus: 'completed',
          createdAt: { $gte: thisMonth }
        }
      },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: '$sellingPrice' },
          profit: { $sum: '$netProfit' }
        }
      }
    ]);

    // Recent orders
    const recentOrders = await AgentTransaction.find({ storeId: store._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('transactionId network capacity recipientPhone sellingPrice orderStatus createdAt');

    // Products summary
    const products = await AgentProduct.find({ storeId: store._id })
      .select('name network capacity sellingPrice totalSold isActive');

    res.json({
      status: 'success',
      data: {
        wallet: store.wallet,
        today: todayStats[0] || { orders: 0, revenue: 0, profit: 0 },
        thisMonth: monthStats[0] || { orders: 0, revenue: 0, profit: 0 },
        allTime: store.stats,
        recentOrders,
        products
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard' });
  }
});

// Get transactions
router.get('/stores/:storeId/transactions', auth, verifyAgentOwnership, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    const query = { storeId: req.params.storeId };
    if (status) query.orderStatus = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await AgentTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await AgentTransaction.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch transactions' });
  }
});

// Get wallet history
router.get('/stores/:storeId/wallet-history', auth, verifyAgentOwnership, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const logs = await WalletAuditLog.find({ storeId: req.params.storeId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await WalletAuditLog.countDocuments({ storeId: req.params.storeId });

    res.json({
      status: 'success',
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch wallet history' });
  }
});

// Order search by phone (public)
router.post('/stores/:storeSlug/orders/search', async (req, res) => {
  try {
    const { storeSlug } = req.params;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ status: 'error', message: 'Phone number is required' });
    }

    const store = await AgentStore.findOne({ storeSlug });
    if (!store) {
      return res.status(404).json({ status: 'error', message: 'Store not found' });
    }

    const orders = await AgentTransaction.find({
      storeId: store._id,
      $or: [
        { customerPhone: { $regex: phone, $options: 'i' } },
        { recipientPhone: { $regex: phone, $options: 'i' } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('transactionId network capacity recipientPhone sellingPrice orderStatus fulfillmentStatus createdAt');

    res.json({ status: 'success', data: { orders } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to search orders' });
  }
});

module.exports = router;
