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

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`[PAYSTACK_QUEUE] Queue processor started (every 10s)`);
  console.log(`[ORDER_QUEUE] Pending order processor started (every 30s)`);
});