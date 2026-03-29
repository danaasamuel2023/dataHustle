const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { DataPurchase, Transaction, User, GuestOrder } = require('../schema/schema');

// DataMart webhook secret
const DATAMART_WEBHOOK_SECRET = process.env.DATAMART_WEBHOOK_SECRET || '5629993a017b7a2b792feb766cc284a972783f9b0fa07cf24657a2f2f5c02741';

// Verify DataMart webhook signature (HMAC-SHA256)
function verifySignature(req, res, next) {
  const signature = req.headers['x-datamart-signature'];
  if (!signature) {
    console.error('[Webhook:DataMart] Missing X-DataMart-Signature header');
    return res.status(401).json({ status: 'error', message: 'Missing signature' });
  }

  if (!DATAMART_WEBHOOK_SECRET) {
    console.error('[Webhook:DataMart] No webhook secret configured');
    return res.status(500).json({ status: 'error', message: 'Webhook not configured' });
  }

  const expected = crypto
    .createHmac('sha256', DATAMART_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expected) {
    console.error('[Webhook:DataMart] Signature mismatch', {
      received: signature.substring(0, 16) + '...',
      expected: expected.substring(0, 16) + '...',
    });
    return res.status(401).json({ status: 'error', message: 'Invalid signature' });
  }

  console.log('[Webhook:DataMart] Signature verified OK');
  next();
}

// POST /api/webhook/datamart
router.post('/datamart', verifySignature, async (req, res) => {
  try {
    const { event, data } = req.body;

    // DataMart sends: { event, timestamp, data: { orderId, orderReference, phone, network, capacity, price, status } }
    const dmRef = data?.orderReference || data?.transactionId || data?.orderId;
    const status = data?.status || event?.split('.')[1];

    const trackingId = data?.trackingId || null;
    const deliveryInfo = data?.deliveryInfo || null;
    const completedAt = data?.completedAt || null;

    console.log('[Webhook:DataMart] Received:', {
      event,
      dmRef,
      status,
      phone: data?.phone,
      network: data?.network,
      orderId: data?.orderId,
      trackingId,
      deliveryInfo,
    });

    if (!dmRef || !status) {
      console.error('[Webhook:DataMart] Missing reference or status');
      return res.status(400).json({ status: 'error', message: 'Missing reference or status' });
    }

    // Find purchase by geonetReference (wallet orders) OR guest order reference
    const purchase = await DataPurchase.findOne({
      $or: [
        { geonetReference: dmRef },
        { geonetReference: data?.orderId },
      ],
    });

    // Also check guest orders
    const guestOrder = !purchase ? await GuestOrder.findOne({
      $or: [
        { reference: dmRef },
        { datamartReference: dmRef },
        { reference: data?.orderId },
      ],
    }) : null;

    if (!purchase && !guestOrder) {
      console.error('[Webhook:DataMart] No matching purchase for ref:', dmRef);
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const newStatus = status.toLowerCase();

    // ===== HANDLE GUEST ORDERS =====
    if (guestOrder) {
      console.log('[Webhook:DataMart] Found guest order:', {
        id: guestOrder._id,
        ref: guestOrder.reference,
        currentStatus: guestOrder.orderStatus,
        newStatus,
      });

      if (['completed', 'failed', 'refunded'].includes(guestOrder.orderStatus)) {
        return res.json({ status: 'success', message: 'Already in final state' });
      }

      if (newStatus === 'completed' || newStatus === 'success' || newStatus === 'delivered') {
        guestOrder.orderStatus = 'completed';
        guestOrder.completedAt = new Date();
        if (trackingId) guestOrder.trackingId = trackingId;
        if (deliveryInfo) guestOrder.deliveryInfo = deliveryInfo;
        guestOrder.updatedAt = new Date();
        await guestOrder.save();
        console.log('[Webhook:DataMart] Guest order completed:', guestOrder.reference);

      } else if (newStatus === 'processing' || newStatus === 'queued' || newStatus === 'waiting') {
        if (guestOrder.orderStatus !== 'processing') {
          guestOrder.orderStatus = 'processing';
          guestOrder.updatedAt = new Date();
          await guestOrder.save();
        }

      } else if (newStatus === 'failed' || newStatus === 'rejected' || newStatus === 'cancelled') {
        guestOrder.orderStatus = 'failed';
        guestOrder.adminNotes = data?.message || 'Failed via DataMart webhook';
        if (trackingId) guestOrder.trackingId = trackingId;
        if (deliveryInfo) guestOrder.deliveryInfo = deliveryInfo;
        guestOrder.updatedAt = new Date();
        await guestOrder.save();
        console.log('[Webhook:DataMart] Guest order failed:', guestOrder.reference);
        // Note: Guest orders paid via Paystack - admin handles refunds manually
      }

      return res.json({ status: 'success', message: 'Guest order webhook processed' });
    }

    // ===== HANDLE WALLET ORDERS (existing logic) =====
    console.log('[Webhook:DataMart] Found purchase:', {
      id: purchase._id,
      ref: purchase.geonetReference,
      currentStatus: purchase.status,
      newStatus,
    });

    // Already in final state
    if (['completed', 'failed', 'refunded', 'delivered'].includes(purchase.status)) {
      console.log('[Webhook:DataMart] Order already in final state:', purchase.status);
      return res.json({ status: 'success', message: 'Already in final state' });
    }

    if (newStatus === 'completed' || newStatus === 'success' || newStatus === 'delivered') {
      purchase.status = 'completed';
      purchase.updatedAt = new Date();
      if (completedAt) purchase.completedAt = new Date(completedAt);
      if (trackingId) purchase.trackingId = trackingId;
      if (deliveryInfo) purchase.deliveryInfo = deliveryInfo;
      await purchase.save();
      console.log('[Webhook:DataMart] Order marked completed:', purchase.geonetReference, trackingId ? `trackingId: ${trackingId}` : '');

    } else if (newStatus === 'processing' || newStatus === 'queued' || newStatus === 'waiting') {
      if (purchase.status !== 'processing') {
        purchase.status = 'processing';
        purchase.updatedAt = new Date();
        await purchase.save();
        console.log('[Webhook:DataMart] Order marked processing:', purchase.geonetReference);
      }

    } else if (newStatus === 'failed' || newStatus === 'rejected' || newStatus === 'cancelled') {
      purchase.status = 'failed';
      purchase.adminNotes = data?.message || 'Failed via DataMart webhook';
      purchase.updatedAt = new Date();
      if (trackingId) purchase.trackingId = trackingId;
      if (deliveryInfo) purchase.deliveryInfo = deliveryInfo;
      await purchase.save();
      console.log('[Webhook:DataMart] Order marked failed:', purchase.geonetReference);

      // Auto-refund wallet
      if (purchase.userId) {
        const user = await User.findOneAndUpdate(
          { _id: purchase.userId },
          { $inc: { walletBalance: purchase.price } },
          { new: true }
        );

        if (user) {
          await Transaction.create({
            userId: purchase.userId,
            type: 'refund',
            amount: purchase.price,
            status: 'completed',
            reference: `RFD-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase(),
            gateway: 'system',
            description: `Auto-refund: failed ${purchase.capacity}GB ${purchase.network} order`,
          });
          console.log('[Webhook:DataMart] Refunded', purchase.price, 'to user', purchase.userId);
        }
      }

    } else if (newStatus === 'pending') {
      console.log('[Webhook:DataMart] Order still pending:', purchase.geonetReference);
    } else {
      console.log('[Webhook:DataMart] Unknown status ignored:', newStatus);
    }

    res.json({ status: 'success', message: 'Webhook processed' });
  } catch (err) {
    console.error('[Webhook:DataMart] Error:', err.stack || err.message);
    res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
  }
});

module.exports = router;
