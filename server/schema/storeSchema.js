const mongoose = require("mongoose");

// ===== AGENT STORE SCHEMA =====
const AgentStoreSchema = new mongoose.Schema({
  // Store owner
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Userdatahustle",
    required: true
  },

  // Store details
  storeName: {
    type: String,
    required: true,
    trim: true
  },
  storeSlug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    default: ""
  },
  logo: {
    type: String,
    default: ""
  },

  // Store settings
  isActive: {
    type: Boolean,
    default: true
  },

  // Contact info
  contactPhone: String,
  contactEmail: String,
  whatsappNumber: String,

  // Wallet
  wallet: {
    availableBalance: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    lastWithdrawal: Date
  },

  // Stats
  stats: {
    totalOrders: { type: Number, default: 0 },
    totalCustomers: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 }
  },

  // Design customization
  design: {
    primaryColor: { type: String, default: "#10B981" },
    secondaryColor: { type: String, default: "#059669" },
    bannerImage: String,
    showLogo: { type: Boolean, default: true }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

AgentStoreSchema.index({ owner: 1 });
AgentStoreSchema.index({ storeSlug: 1 });
AgentStoreSchema.index({ isActive: 1 });

// ===== AGENT PRODUCT SCHEMA =====
const AgentProductSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AgentStoreHustle",
    required: true
  },

  // Product details
  name: {
    type: String,
    required: true
  },
  description: String,

  // Product type (data bundle)
  productType: {
    type: String,
    enum: ["data", "airtime", "sms", "other"],
    default: "data"
  },

  // For data bundles
  network: {
    type: String,
    enum: ["MTN", "TELECEL", "AIRTELTIGO", "AT"],
    required: true
  },
  capacity: {
    type: Number, // in MB or GB
    required: true
  },
  capacityUnit: {
    type: String,
    enum: ["MB", "GB"],
    default: "GB"
  },
  validity: {
    type: String,
    default: "30 days"
  },

  // Pricing
  basePrice: {
    type: Number,
    required: true // Cost to the store owner
  },
  sellingPrice: {
    type: Number,
    required: true // Price customer pays
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  inStock: {
    type: Boolean,
    default: true
  },

  // Stats
  totalSold: {
    type: Number,
    default: 0
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

AgentProductSchema.index({ storeId: 1, isActive: 1 });
AgentProductSchema.index({ network: 1 });

// ===== AGENT TRANSACTION SCHEMA =====
const AgentTransactionSchema = new mongoose.Schema({
  // Transaction ID
  transactionId: {
    type: String,
    required: true,
    unique: true
  },

  // Store info
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AgentStoreHustle",
    required: true
  },

  // Product info
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AgentProductHustle",
    required: true
  },

  // Customer info
  customerPhone: {
    type: String,
    required: true
  },
  customerName: String,
  customerEmail: String,

  // Recipient info (who receives the data)
  recipientPhone: {
    type: String,
    required: true
  },

  // Product details at time of purchase
  productName: String,
  network: String,
  capacity: Number,
  capacityUnit: String,

  // Pricing
  basePrice: Number,
  sellingPrice: Number,
  customerPaid: Number,
  netProfit: Number, // sellingPrice - basePrice

  // Payment info
  paymentMethod: {
    type: String,
    enum: ["paystack", "wallet"],
    default: "paystack"
  },
  paymentReference: String,
  paystackReference: String,

  // Order status
  orderStatus: {
    type: String,
    enum: ["pending", "paid", "processing", "completed", "failed", "refunded"],
    default: "pending"
  },

  // Fulfillment
  fulfillmentStatus: {
    type: String,
    enum: ["pending", "processing", "delivered", "failed"],
    default: "pending"
  },
  geonetReference: String,
  fulfillmentResponse: mongoose.Schema.Types.Mixed,

  // Timestamps
  paidAt: Date,
  completedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

AgentTransactionSchema.index({ storeId: 1, createdAt: -1 });
AgentTransactionSchema.index({ transactionId: 1 });
AgentTransactionSchema.index({ paymentReference: 1 });
AgentTransactionSchema.index({ paystackReference: 1 });
AgentTransactionSchema.index({ orderStatus: 1 });
AgentTransactionSchema.index({ customerPhone: 1 });

// ===== STORE WITHDRAWAL SCHEMA =====
const StoreWithdrawalSchema = new mongoose.Schema({
  withdrawalId: {
    type: String,
    required: true,
    unique: true
  },

  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AgentStoreHustle",
    required: true
  },

  // Amount
  requestedAmount: {
    type: Number,
    required: true
  },
  fee: {
    type: Number,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true
  },

  // Payment details
  method: {
    type: String,
    enum: ["momo"],
    default: "momo"
  },
  paymentDetails: {
    momoNumber: String,
    momoNetwork: String,
    momoName: String
  },

  // Status
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed", "cancelled"],
    default: "pending"
  },

  // Processing
  processingDetails: {
    provider: String,
    paystackTransferCode: String,
    paystackRecipientCode: String,
    processedAt: Date,
    failureReason: String
  },

  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

StoreWithdrawalSchema.index({ storeId: 1, createdAt: -1 });
StoreWithdrawalSchema.index({ withdrawalId: 1 });
StoreWithdrawalSchema.index({ status: 1 });

// ===== WALLET AUDIT LOG =====
const WalletAuditLogSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AgentStoreHustle",
    required: true
  },

  operation: {
    type: String,
    enum: ["credit", "debit", "withdrawal", "refund", "correction", "admin_adjustment"],
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  balanceBefore: Number,
  balanceAfter: Number,

  source: {
    type: { type: String },
    referenceId: String,
    referenceModel: String
  },

  reason: String,

  performedBy: {
    userId: mongoose.Schema.Types.ObjectId,
    userType: String
  },

  createdAt: { type: Date, default: Date.now }
});

WalletAuditLogSchema.index({ storeId: 1, createdAt: -1 });

// ===== PLATFORM SETTINGS SCHEMA =====
const PlatformSettingsSchema = new mongoose.Schema({
  // Singleton key
  key: {
    type: String,
    default: "platform_settings",
    unique: true
  },

  // Withdrawal provider settings
  withdrawalProviders: {
    activeProvider: {
      type: String,
      enum: ["moolre", "paystack", "bulkclix"],
      default: "paystack"
    },
    minWithdrawal: { type: Number, default: 10 },
    maxWithdrawal: { type: Number, default: 5000 },
    feePercent: { type: Number, default: 2 },
    fixedFee: { type: Number, default: 0 },

    paystack: {
      secretKey: { type: String, default: "" },
      enabled: { type: Boolean, default: false }
    },
    moolre: {
      apiKey: { type: String, default: "" },
      enabled: { type: Boolean, default: false }
    },
    bulkclix: {
      apiKey: { type: String, default: "" },
      enabled: { type: Boolean, default: false }
    }
  },

  updatedAt: { type: Date, default: Date.now }
});

// Export models
const AgentStore = mongoose.models.AgentStoreHustle || mongoose.model("AgentStoreHustle", AgentStoreSchema);
const AgentProduct = mongoose.models.AgentProductHustle || mongoose.model("AgentProductHustle", AgentProductSchema);
const AgentTransaction = mongoose.models.AgentTransactionHustle || mongoose.model("AgentTransactionHustle", AgentTransactionSchema);
const StoreWithdrawal = mongoose.models.StoreWithdrawalHustle || mongoose.model("StoreWithdrawalHustle", StoreWithdrawalSchema);
const WalletAuditLog = mongoose.models.WalletAuditLogHustle || mongoose.model("WalletAuditLogHustle", WalletAuditLogSchema);
const PlatformSettings = mongoose.models.PlatformSettingsHustle || mongoose.model("PlatformSettingsHustle", PlatformSettingsSchema);

module.exports = {
  AgentStore,
  AgentProduct,
  AgentTransaction,
  StoreWithdrawal,
  WalletAuditLog,
  PlatformSettings
};
