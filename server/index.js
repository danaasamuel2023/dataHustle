const express = require('express');
const dotenv = require('dotenv');

// Load env vars BEFORE importing routes (they read process.env at import time)
dotenv.config();

const cors = require('cors');
const helmet = require('helmet');
const ConnectDB = require('./DataBaseConnection/connection.js');
// Either import just the router or destructure it from the object
const authRouter = require('./AuthRoutes/Auth.js').router;
const dataOrderRoutes = require('./orderRou/order.js');
const Deposit = require('./DepositeRoutes/UserDeposite.js');
const Developer = require('./ResellerApi/resellerApi.js')
const axios = require('axios');
const AdminManagement = require('./admin-management/adminManagemet.js')
const passreset = require('./ResetPasword/reset.js')
const Report = require('./Reporting/reporting.js')
const DepositeMorle = require('./DepositeMoorle/moorle.js')
const approveuser = require('./adim-aprove/approve.js')
const registerFriend = require('./regsterFreinds/register.js')
const bulkUpload = require('./bulkPurchase/bulk.js')
const userStats = require('./userInfo/userInfo.js')
const adminOrder = require('./allOrders/allorders.js')
const waiting_orders_export = require('./waitingorders/waiting.js')
const phoneVerification = require('./PhoneVerifyRoutes/Verification.js')
const sms = require('./smsRoutes/smsRoutes.js')

// Agent Store Routes
const storeRoutes = require('./storeRoutes/storeRoutes.js');
const withdrawalRoutes = require('./storeRoutes/withdrawalRoutes.js');
const adminStoreRoutes = require('./storeRoutes/adminStoreRoutes.js');
const settingsRoutes = require('./storeRoutes/settingsRoutes.js');

// Support Team Routes
const supportRoutes = require('./supportRoutes/support.js');

// Guest Purchase Routes
const guestPurchase = require('./guestPurchase/guestPurchase.js');

// Initialize Express app
const app = express();

// Security Middleware
app.use(helmet()); // Sets secure HTTP headers (X-Content-Type-Options, X-Frame-Options, etc.)
app.use(express.json({ limit: '10mb' })); // Limit request body size

// CORS
app.use(cors());



// Connect to Database
ConnectDB();

// Routes
app.use('/api/v1', authRouter); // Use the router property
app.use('/api', sms);

app.use('/api/v1/data', dataOrderRoutes);
app.use('/api/v1', Deposit);
app.use('/api/developer', Developer)
// Hubnet removed — all orders go through DataMart
app.use('/api',AdminManagement)
app.use('/api/v1', passreset);
app.use('/api/reports', Report);
app.use('/api/v1', DepositeMorle);
app.use('/api', approveuser)
app.use('/api', registerFriend);
app.use('/api', bulkUpload);
app.use('/api/v1', userStats);
app.use('/api', adminOrder);
app.use('/api/orders', waiting_orders_export);
app.use('/api/verifications', phoneVerification);

// Agent Store Routes
app.use('/api/v1/agent-store', storeRoutes);
app.use('/api/v1/agent-store', withdrawalRoutes);
app.use('/api/v1/admin/agent-stores', adminStoreRoutes);
app.use('/api/v1/settings', settingsRoutes);

// Support Team Routes
app.use('/api/support', supportRoutes);

// Guest Purchase (public buy page)
app.use('/api/guest', guestPurchase);

// DataMart Webhook (order status updates)
const datamartWebhook = require('./webhooks/datamartWebhook');
app.use('/api/webhook', datamartWebhook);

// Default Route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// =============================================================================
// PAYSTACK WITHDRAWAL QUEUE PROCESSOR
// Runs every 10 seconds to process queued withdrawals one at a time
// =============================================================================
const { processPaystackQueue, PaystackWithdrawalQueue } = require('./storeRoutes/withdrawalRoutes');

setInterval(async () => {
  try {
    const queuedCount = await PaystackWithdrawalQueue.countDocuments({ status: 'queued' });
    const processingCount = await PaystackWithdrawalQueue.countDocuments({ status: { $in: ['processing', 'polling'] } });

    if (queuedCount > 0 || processingCount > 0) {
      console.log(`[PAYSTACK_QUEUE] Status: ${queuedCount} queued, ${processingCount} processing/polling`);
    }

    await processPaystackQueue();
  } catch (error) {
    console.error('[PAYSTACK_QUEUE] Processor error:', error.message);
  }
}, 10000);

// =============================================================================
// PENDING ORDER PROCESSOR
// Runs every 30 seconds to process pending orders via DataMart API
// =============================================================================
setInterval(async () => {
  try {
    const res = await axios.post(`http://localhost:${process.env.PORT || 5000}/api/v1/data/process-pending-orders`);
    if (res.data?.data?.success > 0 || res.data?.data?.failed > 0) {
      console.log(`[ORDER_QUEUE] Processed: ${res.data.data.success} success, ${res.data.data.failed} failed`);
    }
  } catch (error) {
    // Silently ignore — orders will be retried next cycle
  }
}, 30000);

// =============================================================================
// GUEST ORDER PROCESSOR
// Picks up paid guest orders and sends them to DataMart API
// =============================================================================
const { GuestOrder, DataInventory: GuestInventory } = require('./schema/schema');

const DATAMART_BASE_URL_GUEST = 'https://api.datamartgh.shop';
const DATAMART_API_KEY_GUEST = process.env.DATAMART_API_KEY || 'fb9b9e81e9640c1861605b4ec333e3bd57bdf70dcce461d766fa877c9c0f7553';

const datamartClientGuest = axios.create({
  baseURL: DATAMART_BASE_URL_GUEST,
  headers: {
    'x-api-key': DATAMART_API_KEY_GUEST,
    'Content-Type': 'application/json'
  }
});

const mapNetworkForDatamart = (network) => {
  const map = { 'YELLO': 'YELLO', 'AT_PREMIUM': 'at', 'TELECEL': 'TELECEL' };
  return map[network] || network;
};

setInterval(async () => {
  try {
    const paidOrders = await GuestOrder.find({
      paymentStatus: 'paid',
      orderStatus: 'pending'
    }).limit(10);

    if (paidOrders.length === 0) return;

    console.log(`[GUEST_ORDER_QUEUE] Processing ${paidOrders.length} paid guest orders`);

    for (const order of paidOrders) {
      try {
        // Check inventory
        const inv = await GuestInventory.findOne({ network: order.network });
        if (inv && !inv.inStock) {
          console.log(`[GUEST_ORDER_QUEUE] ${order.reference}: Network ${order.network} out of stock, skipping`);
          continue;
        }

        // Send to DataMart
        const datamartNetwork = mapNetworkForDatamart(order.network);
        const datamartPayload = {
          phoneNumber: order.recipientPhone,
          network: datamartNetwork,
          capacity: order.capacity.toString(),
          gateway: 'wallet',
          ref: order.reference
        };

        const dmResponse = await datamartClientGuest.post('/api/developer/purchase', datamartPayload);

        if (dmResponse.data && dmResponse.data.status === 'success') {
          order.orderStatus = 'processing';
          order.datamartReference = dmResponse.data.data?.purchaseId || order.reference;
          order.updatedAt = new Date();
          await order.save();
          console.log(`[GUEST_ORDER_QUEUE] ${order.reference}: Sent to DataMart, status: processing`);
        } else {
          console.error(`[GUEST_ORDER_QUEUE] ${order.reference}: DataMart rejected:`, dmResponse.data?.message);
        }
      } catch (err) {
        console.error(`[GUEST_ORDER_QUEUE] ${order.reference}: Error:`, err.response?.data?.message || err.message);
      }
    }
  } catch (error) {
    // Silently ignore
  }
}, 15000); // Every 15 seconds

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`[PAYSTACK_QUEUE] Queue processor started (every 10s)`);
  console.log(`[ORDER_QUEUE] Pending order processor started (every 30s)`);
});