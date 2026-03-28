// Process bulk data bundle orders
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { User, DataPurchase, Transaction, DataInventory } = require('../schema/schema');

// DataMart API Configuration
const DATAMART_BASE_URL = 'https://api.datamartgh.shop';
const DATAMART_API_KEY = process.env.DATAMART_API_KEY || 'fb9b9e81e9640c1861605b4ec333e3bd57bdf70dcce461d766fa877c9c0f7553';

const datamartClient = axios.create({
  baseURL: DATAMART_BASE_URL,
  headers: {
    'x-api-key': DATAMART_API_KEY,
    'Content-Type': 'application/json'
  }
});

const mapNetworkToDatamart = (network) => {
  const networkMap = {
    'TELECEL': 'TELECEL', 'MTN': 'YELLO', 'YELLO': 'YELLO',
    'AT': 'at', 'AT_PREMIUM': 'at', 'AIRTELTIGO': 'at', 'at': 'at'
  };
  return networkMap[network?.toUpperCase()] || network;
};

// Enhanced logging function
const logOperation = (operation, data) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${operation}]`, JSON.stringify(data, null, 2));
};

// Process bulk data bundle orders
router.post('/bulk-purchase-data', async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    // Start transaction with extended timeout (90 seconds)
    session.startTransaction({
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
      maxTimeMS: 90000 // Increase timeout to 90 seconds
    });
    
    const { userId, orders } = req.body;

    logOperation('BULK_PURCHASE_REQUEST', {
      userId,
      orderCount: orders.length,
      timestamp: new Date()
    });

    // Validate input
    if (!userId || !Array.isArray(orders) || orders.length === 0) {
      logOperation('BULK_PURCHASE_VALIDATION_ERROR', {
        hasUserId: !!userId,
        hasOrders: Array.isArray(orders),
        orderCount: Array.isArray(orders) ? orders.length : 0
      });
      
      await session.abortTransaction();
      session.endSession();
      
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request. Must include userId and a non-empty array of orders'
      });
    }

    // Find user
    const user = await User.findById(userId).session(session);
    if (!user) {
      logOperation('BULK_PURCHASE_USER_NOT_FOUND', { userId });
      
      await session.abortTransaction();
      session.endSession();
      
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Validate each order and calculate total cost
    let totalCost = 0;
    const validatedOrders = [];
    const invalidOrders = [];
    const recentlyPurchasedNumbers = [];
    const duplicateNumbers = [];
    
    // Check for recent purchases (last 30 minutes) from our database
    const thirtyMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentPurchases = await DataPurchase.find({
      userId: userId,
      createdAt: { $gte: thirtyMinutesAgo }
    }).session(session);
    
    const recentPhoneNumbers = new Set(recentPurchases.map(purchase => purchase.phoneNumber));

    // Check for recent purchases (last 5 minutes) from Geonettech
    // This is a pre-validation to prevent known duplicates before sending to API
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const veryRecentPurchases = await DataPurchase.find({
      createdAt: { $gte: fiveMinutesAgo }
    }).session(session);
    
    const veryRecentPhoneNumbers = new Set(veryRecentPurchases.map(purchase => purchase.phoneNumber));

    // Track unique phone numbers within this batch to prevent duplicates
    const phoneNumbersInBatch = new Set();

    // Validate each order in the bulk request
    for (const order of orders) {
      const { phoneNumber, network, capacity, price } = order;
      
      // Basic validation
      if (!phoneNumber || !network || !capacity || !price) {
        invalidOrders.push({
          ...order,
          reason: 'Missing required fields'
        });
        continue;
      }
      
      // Clean the phone number for consistency
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      
      // Check for duplicates within the same batch
      if (phoneNumbersInBatch.has(cleanPhoneNumber)) {
        duplicateNumbers.push({
          ...order,
          reason: 'Duplicate phone number within this order batch'
        });
        continue;
      }
      
      // Add to our set of phone numbers in this batch
      phoneNumbersInBatch.add(cleanPhoneNumber);
      
      // Check for recent purchases for this phone number (30 minute rule - our database)
      if (recentPhoneNumbers.has(cleanPhoneNumber)) {
        recentlyPurchasedNumbers.push({
          ...order,
          reason: 'Cannot purchase data for the same number within 30 minutes'
        });
        continue;
      }
      
      // Check for very recent purchases (5 minute rule - Geonettech's limitation)
      if (veryRecentPhoneNumbers.has(cleanPhoneNumber)) {
        recentlyPurchasedNumbers.push({
          ...order,
          reason: 'Cannot purchase data for the same number within 5 minutes (provider limitation)'
        });
        continue;
      }
      
      // Verify network availability
      const inventory = await DataInventory.findOne({ network }).session(session);
      if (!inventory || !inventory.inStock) {
        invalidOrders.push({
          ...order,
          reason: 'Network not available or out of stock'
        });
        continue;
      }
      
      // Verify pricing matches our expected prices
      // This is to prevent users from tampering with prices on the frontend
      const expectedPriceEntry = getPriceForCapacity(capacity, network);
      if (!expectedPriceEntry || Math.abs(expectedPriceEntry.price - price) > 0.01) {
        invalidOrders.push({
          ...order,
          reason: 'Invalid price for the selected data amount'
        });
        continue;
      }
      
      // Add to valid orders and total cost
      validatedOrders.push({
        ...order,
        phoneNumber: cleanPhoneNumber, // Use the cleaned phone number
        orderReference: Math.floor(1000 + Math.random() * 900000),
        transactionReference: `TRX-${uuidv4()}`
      });
      
      totalCost += price;
    }

    // Check if there are any valid orders to process
    if (validatedOrders.length === 0) {
      logOperation('BULK_PURCHASE_NO_VALID_ORDERS', {
        invalidCount: invalidOrders.length,
        recentlyPurchasedCount: recentlyPurchasedNumbers.length,
        duplicateCount: duplicateNumbers.length
      });
      
      await session.abortTransaction();
      session.endSession();
      
      return res.status(400).json({
        status: 'error',
        message: 'No valid orders to process',
        data: {
          invalidOrders,
          recentlyPurchasedNumbers,
          duplicateNumbers
        }
      });
    }

    // Check user wallet balance
    if (user.walletBalance < totalCost) {
      logOperation('BULK_PURCHASE_INSUFFICIENT_BALANCE', {
        userId,
        walletBalance: user.walletBalance,
        requiredAmount: totalCost,
        shortfall: totalCost - user.walletBalance
      });
      
      await session.abortTransaction();
      session.endSession();
      
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient wallet balance for bulk purchase',
        data: {
          currentBalance: user.walletBalance,
          requiredAmount: totalCost,
          validOrderCount: validatedOrders.length,
          invalidOrderCount: invalidOrders.length,
          recentlyPurchasedCount: recentlyPurchasedNumbers.length,
          duplicateCount: duplicateNumbers.length
        }
      });
    }

    // *** IMPORTANT: We'll first update the local database before making API call ***
    // This prevents the MongoDB transaction from timing out during the API call
    
    // Update user wallet balance first
    const previousBalance = user.walletBalance;
    user.walletBalance -= totalCost;
    await user.save({ session });
    
    // Save all orders as PENDING — queue processor sends to DataMart
    try {
      await session.commitTransaction();
      session.endSession();

      // Create transaction and data purchase records as PENDING
      const transactions = [];
      const dataPurchases = [];

      for (const order of validatedOrders) {
        const transaction = new Transaction({
          userId,
          type: 'purchase',
          amount: order.price,
          status: 'completed',
          reference: order.transactionReference,
          gateway: 'wallet'
        });

        const dataPurchase = new DataPurchase({
          userId,
          phoneNumber: order.phoneNumber,
          network: order.network,
          capacity: order.capacity,
          gateway: 'wallet',
          method: 'web',
          price: order.price,
          status: 'pending',
          geonetReference: order.orderReference,
          processingMethod: 'datamart_api'
        });

        transactions.push(transaction);
        dataPurchases.push(dataPurchase);
      }

      // Save all records
      for (const transaction of transactions) {
        await transaction.save();
      }
      
      for (const dataPurchase of dataPurchases) {
        await dataPurchase.save();
      }
      
      logOperation('BULK_PURCHASE_SAVED_PENDING', {
        userId,
        totalCost,
        previousBalance,
        totalOrders: validatedOrders.length
      });

      // Process each order via DataMart async (non-blocking)
      for (const dp of dataPurchases) {
        const dmNetwork = mapNetworkToDatamart(dp.network);
        datamartClient.post('/api/developer/purchase', {
          phoneNumber: dp.phoneNumber,
          network: dmNetwork,
          capacity: dp.capacity.toString(),
          gateway: 'wallet',
          ref: dp.geonetReference
        }).then(response => {
          if (response.data?.status === 'success') {
            DataPurchase.findByIdAndUpdate(dp._id, {
              status: 'processing',
              apiOrderId: response.data.data?.purchaseId || dp.geonetReference,
              apiResponse: response.data,
              processingMethod: 'datamart_api'
            }).catch(() => {});
          }
        }).catch(() => {});
      }

      const updatedUser = await User.findById(userId);
      const finalBalance = updatedUser ? updatedUser.walletBalance : user.walletBalance;

      res.status(201).json({
        status: 'success',
        message: `${validatedOrders.length} orders placed. Processing via DataMart.`,
        data: {
          totalOrders: orders.length,
          validOrders: validatedOrders.length,
          pendingOrders: validatedOrders.length,
          newWalletBalance: finalBalance,
          totalCost,
          invalidOrders,
          duplicateNumbers,
          recentlyPurchasedNumbers
        }
      });

    } catch (apiError) {
      logOperation('BULK_PURCHASE_ERROR', { message: apiError.message });

      await refundUser(userId, totalCost, 'Bulk purchase failed');

      return res.status(400).json({
        status: 'error',
        message: 'Failed to process bulk data purchase. Your wallet has been refunded.',
        data: {
          errorDetails,
          failedOrders,
          totalRefunded: totalCost,
          newWalletBalance: (await User.findById(userId)).walletBalance
        }
      });
    }

  } catch (error) {
    // Handle database errors
    if (session.inTransaction()) {
      await session.abortTransaction();
      session.endSession();
    }
    
    logOperation('BULK_PURCHASE_ERROR', {
      message: error.message,
      stack: error.stack,
      response: error.response ? error.response.data : null
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to process bulk data purchase',
      details: error.response ? error.response.data : error.message
    });
  }
});

// Helper function to refund a user after a failed API call
async function refundUser(userId, amount, reason) {
  try {
    // Find the user and update wallet balance
    const user = await User.findById(userId);
    if (user) {
      user.walletBalance += amount;
      await user.save();
      
      // Create refund transaction
      const refundTransaction = new Transaction({
        userId,
        type: 'refund',
        amount,
        status: 'completed',
        reference: `REFUND-${uuidv4()}`,
        gateway: 'wallet',
        description: `Refund for failed bulk purchase: ${reason}`
      });
      
      await refundTransaction.save();
      
      logOperation('USER_REFUNDED', {
        userId,
        amount,
        reason,
        newBalance: user.walletBalance
      });
    }
  } catch (refundError) {
    logOperation('REFUND_ERROR', {
      userId,
      amount,
      error: refundError.message
    });
  }
}

// Helper function to get the price for a specific capacity and network
function getPriceForCapacity(capacity, network) {
  // This matches your pricing data
  const pricesList = [
    { capacity: 1, mb: 1000, price: 4.30, network: 'YELLO' },
    { capacity: 2, mb: 2000, price: 9.20, network: 'YELLO' },
    { capacity: 3, mb: 3000, price: 13.5, network: 'YELLO' },
    { capacity: 4, mb: 4000, price: 18.50, network: 'YELLO' },
    { capacity: 5, mb: 5000, price: 23.50, network: 'YELLO' },
    { capacity: 6, mb: 6000, price: 27.00, network: 'YELLO' },
    { capacity: 8, mb: 8000, price: 35.50, network: 'YELLO' },
    { capacity: 10, mb: 10000, price: 43.50, network: 'YELLO' },
    { capacity: 15, mb: 15000, price: 62.50, network: 'YELLO' },
    { capacity: 20, mb: 20000, price: 83.00, network: 'YELLO' },
    { capacity: 25, mb: 25000, price: 105.00, network: 'YELLO' },
    { capacity: 30, mb: 30000, price: 129.00, network: 'YELLO' },
    { capacity: 40, mb: 40000, price: 166.00, network: 'YELLO' },
    { capacity: 50, mb: 50000, price: 207.00, network: 'YELLO' },
    { capacity: 100, mb: 100000, price: 407.00, network: 'YELLO' }
  ];
  
  // Convert input capacity to number if it's a string
  const capacityNum = typeof capacity === 'string' ? parseInt(capacity, 10) : capacity;
  
  return pricesList.find(p => p.capacity === capacityNum && p.network === network);
}

module.exports = router;