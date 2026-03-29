const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { DataPrice, GuestOrder, DataInventory } = require('../schema/schema');

// Paystack config
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_live_b8f78b58b7860fd9795eb376a8602eba072d6e15';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const FRONTEND_URL = process.env.GUEST_FRONTEND_URL || 'https://www.datahustle.shop';

const paystackClient = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Hardcoded fallback prices (used if DB is empty)
const FALLBACK_PRICING = {
  'YELLO': [
    { capacity: 1, price: 4.20 }, { capacity: 2, price: 8.80 }, { capacity: 3, price: 12.80 },
    { capacity: 4, price: 17.80 }, { capacity: 5, price: 22.30 }, { capacity: 6, price: 25.00 },
    { capacity: 8, price: 33.00 }, { capacity: 10, price: 41.00 }, { capacity: 15, price: 59.50 },
    { capacity: 20, price: 79.00 }, { capacity: 25, price: 99.00 }, { capacity: 30, price: 121.00 },
    { capacity: 40, price: 158.00 }, { capacity: 50, price: 200.00 }
  ],
  'AT_PREMIUM': [
    { capacity: 1, price: 3.95 }, { capacity: 2, price: 8.35 }, { capacity: 3, price: 13.25 },
    { capacity: 4, price: 16.50 }, { capacity: 5, price: 19.50 }, { capacity: 6, price: 23.50 },
    { capacity: 8, price: 30.50 }, { capacity: 10, price: 38.50 }, { capacity: 12, price: 45.50 },
    { capacity: 15, price: 57.50 }, { capacity: 25, price: 95.00 }, { capacity: 30, price: 115.00 },
    { capacity: 40, price: 151.00 }, { capacity: 50, price: 190.00 }
  ],
  'TELECEL': [
    { capacity: 5, price: 19.50 }, { capacity: 8, price: 34.64 }, { capacity: 10, price: 36.50 },
    { capacity: 12, price: 43.70 }, { capacity: 15, price: 52.85 }, { capacity: 20, price: 69.80 },
    { capacity: 25, price: 86.75 }, { capacity: 30, price: 103.70 }, { capacity: 35, price: 120.65 },
    { capacity: 40, price: 137.60 }, { capacity: 45, price: 154.55 }, { capacity: 50, price: 171.50 },
    { capacity: 100, price: 341.00 }
  ]
};

// ===== GET PRODUCTS (public) =====
router.get('/products', async (req, res) => {
  try {
    // Try DB first
    let products = await DataPrice.find({ isActive: true }).sort({ network: 1, capacity: 1 });

    if (products.length > 0) {
      return res.json({
        status: 'success',
        source: 'database',
        data: { products }
      });
    }

    // Fallback to hardcoded
    const fallbackProducts = [];
    for (const [network, bundles] of Object.entries(FALLBACK_PRICING)) {
      for (const bundle of bundles) {
        fallbackProducts.push({
          _id: `${network}-${bundle.capacity}`,
          network,
          capacity: bundle.capacity,
          price: bundle.price,
          isActive: true
        });
      }
    }

    res.json({
      status: 'success',
      source: 'fallback',
      data: { products: fallbackProducts }
    });
  } catch (error) {
    console.error('[GuestPurchase] Products error:', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to load products' });
  }
});

// ===== INITIALIZE PURCHASE (public) =====
router.post('/initialize', async (req, res) => {
  try {
    const { network, capacity, recipientPhone, customerName, customerPhone } = req.body;

    if (!network || !capacity || !recipientPhone || !customerName) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    // Validate phone
    const cleanPhone = recipientPhone.replace(/[\s-]/g, '');
    if (!/^0\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ status: 'error', message: 'Invalid phone number' });
    }

    // Check inventory
    const inventory = await DataInventory.findOne({ network });
    if (inventory && !inventory.inStock) {
      return res.status(400).json({ status: 'error', message: `${network} bundles are currently out of stock` });
    }

    // Get price from DB, fallback to hardcoded
    let price;
    const dbPrice = await DataPrice.findOne({ network, capacity: Number(capacity), isActive: true });
    if (dbPrice) {
      price = dbPrice.price;
    } else {
      const fallback = FALLBACK_PRICING[network]?.find(b => b.capacity === Number(capacity));
      if (!fallback) {
        return res.status(400).json({ status: 'error', message: 'Invalid network or capacity' });
      }
      price = fallback.price;
    }

    // Generate reference
    const reference = `DH-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`.toUpperCase();

    // Create guest order
    const order = new GuestOrder({
      reference,
      customerName,
      customerPhone: customerPhone || cleanPhone,
      recipientPhone: cleanPhone,
      network,
      capacity: Number(capacity),
      price,
      paymentStatus: 'pending',
      orderStatus: 'pending'
    });
    await order.save();

    // Initialize Paystack
    const paystackPayload = {
      email: `guest_${cleanPhone}@datahustle.shop`,
      amount: Math.round(price * 100), // pesewas
      currency: 'GHS',
      reference,
      callback_url: `${FRONTEND_URL}/buy/verify?reference=${reference}`,
      metadata: {
        reference,
        recipientPhone: cleanPhone,
        network,
        capacity,
        customerName,
        custom_fields: [
          { display_name: 'Recipient', variable_name: 'recipient', value: cleanPhone },
          { display_name: 'Network', variable_name: 'network', value: network },
          { display_name: 'Package', variable_name: 'package', value: `${capacity}GB` }
        ]
      },
      channels: ['mobile_money']
    };

    const paystackResponse = await paystackClient.post('/transaction/initialize', paystackPayload);

    if (!paystackResponse.data.status) {
      throw new Error('Failed to initialize payment');
    }

    order.paystackReference = paystackResponse.data.data.reference;
    await order.save();

    console.log('[GuestPurchase] Initialized:', { reference, network, capacity, price, phone: cleanPhone.substring(0, 3) + 'XXXXXXX' });

    res.json({
      status: 'success',
      data: {
        reference,
        authorizationUrl: paystackResponse.data.data.authorization_url,
        amount: price
      }
    });
  } catch (error) {
    console.error('[GuestPurchase] Initialize error:', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to initialize purchase' });
  }
});

// ===== VERIFY PAYMENT (called after Paystack redirect) =====
router.get('/verify', async (req, res) => {
  try {
    const { reference } = req.query;
    if (!reference) {
      return res.status(400).json({ status: 'error', message: 'Reference is required' });
    }

    const order = await GuestOrder.findOne({ reference });
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    // Already paid
    if (order.paymentStatus === 'paid') {
      return res.json({
        status: 'success',
        message: 'Payment already verified',
        data: {
          reference: order.reference,
          network: order.network,
          capacity: order.capacity,
          price: order.price,
          recipientPhone: order.recipientPhone,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus
        }
      });
    }

    // Verify with Paystack
    const paystackResponse = await paystackClient.get(`/transaction/verify/${reference}`);
    const paystackData = paystackResponse.data.data;

    if (paystackData.status !== 'success') {
      order.paymentStatus = 'failed';
      order.updatedAt = new Date();
      await order.save();
      return res.status(400).json({ status: 'error', message: 'Payment was not successful' });
    }

    // Verify amount matches
    const paidAmount = paystackData.amount / 100;
    if (Math.abs(paidAmount - order.price) > 0.01) {
      console.error('[GuestPurchase] Amount mismatch:', { paid: paidAmount, expected: order.price });
      return res.status(400).json({ status: 'error', message: 'Payment amount mismatch' });
    }

    // Mark as paid - processor will pick it up
    order.paymentStatus = 'paid';
    order.paidAt = new Date();
    order.updatedAt = new Date();
    await order.save();

    console.log('[GuestPurchase] Payment verified:', { reference, amount: paidAmount });

    res.json({
      status: 'success',
      message: 'Payment verified successfully. Your order is being processed.',
      data: {
        reference: order.reference,
        network: order.network,
        capacity: order.capacity,
        price: order.price,
        recipientPhone: order.recipientPhone,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus
      }
    });
  } catch (error) {
    console.error('[GuestPurchase] Verify error:', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to verify payment' });
  }
});

// ===== PAYSTACK WEBHOOK (backup for verify) =====
router.post('/webhook/paystack', async (req, res) => {
  try {
    // Verify signature
    const hash = crypto
      .createHmac('sha256', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ status: 'error', message: 'Invalid signature' });
    }

    const { event, data } = req.body;

    if (event === 'charge.success') {
      const order = await GuestOrder.findOne({ reference: data.reference });
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.paidAt = new Date();
        order.updatedAt = new Date();
        await order.save();
        console.log('[GuestPurchase] Webhook: Payment confirmed:', data.reference);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('[GuestPurchase] Webhook error:', error.message);
    res.sendStatus(200); // Always return 200 to Paystack
  }
});

// ===== CHECK ORDER STATUS (public) =====
router.get('/status/:reference', async (req, res) => {
  try {
    const order = await GuestOrder.findOne({ reference: req.params.reference });
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    res.json({
      status: 'success',
      data: {
        reference: order.reference,
        network: order.network,
        capacity: order.capacity,
        price: order.price,
        recipientPhone: order.recipientPhone,
        customerName: order.customerName,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        trackingId: order.trackingId,
        deliveryInfo: order.deliveryInfo,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        completedAt: order.completedAt
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to check status' });
  }
});

// ===== TRACK BY PHONE (public) =====
router.post('/track', async (req, res) => {
  try {
    const { phoneNumber, reference } = req.body;

    let orders;
    if (reference) {
      orders = await GuestOrder.find({ reference }).sort({ createdAt: -1 }).limit(10);
    } else if (phoneNumber) {
      const clean = phoneNumber.replace(/[\s-]/g, '');
      orders = await GuestOrder.find({ recipientPhone: clean }).sort({ createdAt: -1 }).limit(10);
    } else {
      return res.status(400).json({ status: 'error', message: 'Phone number or reference required' });
    }

    if (!orders.length) {
      return res.status(404).json({ status: 'error', message: 'No orders found' });
    }

    const mapped = orders.map(o => ({
      reference: o.reference,
      network: o.network,
      capacity: o.capacity,
      price: o.price,
      recipientPhone: o.recipientPhone,
      customerName: o.customerName,
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
      trackingId: o.trackingId,
      deliveryInfo: o.deliveryInfo,
      createdAt: o.createdAt,
      paidAt: o.paidAt,
      completedAt: o.completedAt
    }));

    res.json({ status: 'success', data: { orders: mapped } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to track orders' });
  }
});

module.exports = router;
