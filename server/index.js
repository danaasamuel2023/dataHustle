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
const HubnetAt = require('./HubnetInteraction/hubnet.js');
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

// Initialize Express app
const app = express();

// Security Middleware
app.use(helmet()); // Sets secure HTTP headers (X-Content-Type-Options, X-Frame-Options, etc.)
app.use(express.json({ limit: '10mb' })); // Limit request body size

// CORS - restrict to your actual frontend domains
const allowedOrigins = [
  'http://localhost:3000',
  'https://data-hustle.vercel.app',
  'https://datahustle.vercel.app',
  'https://www.datahustle.com',
  'https://www.datavendo.shop'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization'],
  credentials: true
}));

// Connect to Database
ConnectDB();

// Routes
app.use('/api/v1', authRouter); // Use the router property
app.use('/api', sms);

app.use('/api/v1/data', dataOrderRoutes);
app.use('/api/v1', Deposit);
app.use('/api/developer', Developer)
app.use('/api/v1', HubnetAt);
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

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`[PAYSTACK_QUEUE] Queue processor started (every 10s)`);
});