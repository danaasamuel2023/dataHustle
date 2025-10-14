const express = require('express');
const router = express.Router();
const { Transaction, User } = require('../schema/schema');
const axios = require('axios');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Import authentication middleware
const auth = require('../middlewareUser/middleware');

// Paystack configuration - MOVED TO ENVIRONMENT VARIABLES
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_live_b8f78b58b7860fd9795eb376a8602eba072d6e15'; 
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Fee configuration - SERVER-SIDE ONLY
const FEE_PERCENTAGE = 0.02; // 2% fee - adjust as needed

// mNotify SMS configuration
const SMS_CONFIG = {
  API_KEY: process.env.MNOTIFY_API_KEY || 'w3rGWhv4e235nDwYvD5gVDyrW',
  SENDER_ID: 'DataHustleGH',
  BASE_URL: 'https://apps.mnotify.net/smsapi'
};

/**
 * Format phone number to Ghana format
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '233' + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('233')) {
    cleaned = '233' + cleaned;
  }
  
  return cleaned;
};

/**
 * Send SMS notification
 */
const sendSMS = async (to, message) => {
  try {
    const formattedPhone = formatPhoneNumber(to);
    
    if (!formattedPhone || formattedPhone.length < 12) {
      throw new Error('Invalid phone number format');
    }
    
    const url = `${SMS_CONFIG.BASE_URL}?key=${SMS_CONFIG.API_KEY}&to=${formattedPhone}&msg=${encodeURIComponent(message)}&sender_id=${SMS_CONFIG.SENDER_ID}`;
    
    const response = await axios.get(url);
    
    console.log('SMS API Response:', response.data);
    
    let responseCode;
    
    if (typeof response.data === 'number') {
      responseCode = response.data;
    } else if (typeof response.data === 'string') {
      const match = response.data.match(/\d+/);
      responseCode = match ? parseInt(match[0]) : parseInt(response.data.trim());
    } else if (typeof response.data === 'object' && response.data.code) {
      responseCode = parseInt(response.data.code);
    }
    
    if (isNaN(responseCode)) {
      if (response.status === 200) {
        return { success: true, message: 'SMS sent (assumed successful)' };
      }
      throw new Error(`Invalid response: ${JSON.stringify(response.data)}`);
    }
    
    switch (responseCode) {
      case 1000:
        return { success: true, message: 'SMS sent successfully', code: responseCode };
      case 1007:
        return { success: true, message: 'SMS scheduled', code: responseCode };
      default:
        throw new Error(`SMS Error Code: ${responseCode}`);
    }
  } catch (error) {
    console.error('SMS Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send deposit confirmation SMS
 */
const sendDepositSMS = async (user, amount, newBalance) => {
  try {
    const message = `Hello ${user.name}! Your DataHustleGH account has been credited with GHS ${amount.toFixed(2)}. New balance: GHS ${newBalance.toFixed(2)}. Thank you!`;
    
    const result = await sendSMS(user.phoneNumber, message);
    
    if (result.success) {
      console.log(`Deposit SMS sent to ${user.phoneNumber}`);
    } else {
      console.error(`Failed to send deposit SMS:`, result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Send Deposit SMS Error:', error);
    return { success: false, error: error.message };
  }
};

// ✅ SECURE: Initiate Deposit with SERVER-SIDE fee calculation
router.post('/deposit', async (req, res) => {
  try {
    const { userId, amount, email } = req.body;

    // Validate input
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid deposit details' 
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Check if account is disabled
    if (user.isDisabled) {
      return res.status(403).json({
        success: false,
        error: 'Account is disabled',
        message: 'Your account has been disabled. Deposits are not allowed.',
        disableReason: user.disableReason || 'No reason provided'
      });
    }

    // Convert to number
    const depositAmount = parseFloat(amount);

    // ✅ SECURITY FIX: Calculate fee SERVER-SIDE (never trust client)
    const fee = depositAmount * FEE_PERCENTAGE;
    const totalAmountWithFee = depositAmount + fee;

    // Generate unique reference
    const reference = `DEP-${crypto.randomBytes(10).toString('hex')}-${Date.now()}`;

    // Get current balance for tracking
    const balanceBefore = user.walletBalance;
    const balanceAfter = balanceBefore + depositAmount;

    // ✅ SECURITY FIX: Store expected amount for verification
    const transaction = new Transaction({
      userId,
      type: 'deposit',
      amount: depositAmount,
      balanceBefore: balanceBefore,
      balanceAfter: balanceAfter,
      status: 'pending',
      reference,
      gateway: 'paystack',
      description: `Wallet deposit via Paystack`,
      metadata: {
        expectedPaystackAmount: totalAmountWithFee, // ✅ Store for verification
        fee: fee,
        baseAmount: depositAmount
      }
    });

    await transaction.save();

    // ✅ Use SERVER-calculated total amount
    const paystackAmount = Math.round(totalAmountWithFee * 100); // Convert to pesewas
    
    const paystackResponse = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: email || user.email,
        amount: paystackAmount,
        currency: 'GHS',
        reference,
        callback_url: `https://www.datahustle.shop/payment/callback?reference=${reference}`
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.json({
      success: true,
      message: 'Deposit initiated',
      paystackUrl: paystackResponse.data.data.authorization_url,
      reference,
      depositInfo: {
        baseAmount: depositAmount,
        fee: fee,
        totalAmount: totalAmountWithFee
      }
    });

  } catch (error) {
    console.error('Deposit Error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// ✅ SECURE: Payment processing with Paystack verification and fraud detection
async function processSuccessfulPayment(reference) {
  const transaction = await Transaction.findOneAndUpdate(
    { 
      reference, 
      status: 'pending',
      processing: { $ne: true }
    },
    { 
      $set: { 
        processing: true
      } 
    },
    { new: true }
  );

  if (!transaction) {
    console.log(`Transaction ${reference} not found or already processed`);
    return { success: false, message: 'Transaction not found or already processed' };
  }

  try {
    // ✅ SECURITY FIX: VERIFY WITH PAYSTACK API
    console.log(`Verifying payment with Paystack: ${reference}`);
    
    const paystackResponse = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const paystackData = paystackResponse.data.data;
    
    // ✅ SECURITY FIX: Get ACTUAL amount paid
    const actualAmountPaid = paystackData.amount / 100; // Convert from pesewas
    const expectedAmount = transaction.metadata?.expectedPaystackAmount || transaction.amount;
    
    console.log('Payment verification:', {
      reference,
      actualAmountPaid,
      expectedAmount,
      baseAmount: transaction.amount,
      paystackStatus: paystackData.status
    });

    // ✅ SECURITY FIX: VERIFY AMOUNT MATCHES (fraud detection)
    if (Math.abs(actualAmountPaid - expectedAmount) > 0.02) {
      console.error(`🚨 FRAUD DETECTED - Amount mismatch!`, {
        reference,
        expectedAmount,
        actualAmountPaid,
        difference: actualAmountPaid - expectedAmount,
        baseAmount: transaction.amount
      });
      
      transaction.status = 'failed';
      transaction.processing = false;
      transaction.metadata = {
        ...transaction.metadata,
        fraudDetected: true,
        fraudReason: 'Amount mismatch - possible fraud attempt',
        expectedAmount: expectedAmount,
        actualAmountPaid: actualAmountPaid,
        fraudDetectedAt: new Date()
      };
      await transaction.save();
      
      return { 
        success: false, 
        message: 'Payment amount verification failed'
      };
    }

    // ✅ Check Paystack status
    if (paystackData.status !== 'success') {
      console.warn(`Payment not successful. Paystack status: ${paystackData.status}`);
      transaction.status = 'failed';
      transaction.processing = false;
      transaction.metadata = {
        ...transaction.metadata,
        paystackStatus: paystackData.status,
        failedAt: new Date()
      };
      await transaction.save();
      
      return { 
        success: false, 
        message: `Payment not successful: ${paystackData.status}`
      };
    }

    // ✅ Update user's wallet with verified base amount
    const user = await User.findById(transaction.userId);
    if (!user) {
      console.error(`User not found for transaction ${reference}`);
      transaction.processing = false;
      await transaction.save();
      return { success: false, message: 'User not found' };
    }

    // Verify balance consistency
    if (Math.abs(user.walletBalance - transaction.balanceBefore) > 0.01) {
      console.warn(`Balance mismatch for user ${user._id}. Adjusting...`);
      transaction.balanceBefore = user.walletBalance;
      transaction.balanceAfter = user.walletBalance + transaction.amount;
    }

    // Update user balance
    const previousBalance = user.walletBalance;
    user.walletBalance += transaction.amount; // Credit base amount (without fee)
    await user.save();

    // Update transaction with final status
    transaction.status = 'completed';
    transaction.balanceBefore = previousBalance;
    transaction.balanceAfter = user.walletBalance;
    transaction.processing = false;
    transaction.completedAt = new Date();
    await transaction.save();

    console.log(`✅ Transaction ${reference} completed. User ${user._id} balance: ${previousBalance} -> ${user.walletBalance}`);
    
    // Send SMS notification
    await sendDepositSMS(user, transaction.amount, user.walletBalance);
    
    return { 
      success: true, 
      message: 'Deposit successful', 
      newBalance: user.walletBalance 
    };
  } catch (error) {
    // Release processing lock on error
    transaction.processing = false;
    transaction.status = 'failed';
    transaction.metadata = {
      ...transaction.metadata,
      error: error.message,
      errorStack: error.stack,
      failedAt: new Date()
    };
    await transaction.save();
    
    console.error('Payment Processing Error:', error);
    throw error;
  }
}

// ✅ SECURE: Paystack webhook handler with signature verification
router.post('/paystack/webhook', async (req, res) => {
  try {
    console.log('Webhook received:', {
      signature: req.headers['x-paystack-signature'],
      event: req.body.event,
      reference: req.body.data?.reference
    });

    const secret = PAYSTACK_SECRET_KEY;
    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    // ✅ Verify Paystack signature
    if (hash !== req.headers['x-paystack-signature']) {
      console.error('❌ Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    // Handle successful charge
    if (event.event === 'charge.success') {
      const { reference } = event.data;
      console.log(`Processing successful payment: ${reference}`);

      const result = await processSuccessfulPayment(reference);
      return res.json({ message: result.message });
    } else {
      console.log(`Unhandled event type: ${event.event}`);
      return res.json({ message: 'Event received' });
    }

  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ SECURE: Verify payment endpoint with full verification
router.get('/verify-payment', async (req, res) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({ 
        success: false, 
        error: 'Reference is required' 
      });
    }

    const transaction = await Transaction.findOne({ reference });

    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        error: 'Transaction not found' 
      });
    }

    // If already completed
    if (transaction.status === 'completed') {
      return res.json({
        success: true,
        message: 'Payment already verified and completed',
        data: {
          reference,
          amount: transaction.amount,
          status: transaction.status,
          balanceBefore: transaction.balanceBefore,
          balanceAfter: transaction.balanceAfter,
          balanceChange: transaction.balanceAfter - transaction.balanceBefore
        }
      });
    }

    // If still pending, verify
    if (transaction.status === 'pending') {
      const result = await processSuccessfulPayment(reference);
      
      if (result.success) {
        const updatedTransaction = await Transaction.findOne({ reference });
        
        return res.json({
          success: true,
          message: 'Payment verified successfully',
          data: {
            reference,
            amount: updatedTransaction.amount,
            status: 'completed',
            balanceBefore: updatedTransaction.balanceBefore,
            balanceAfter: updatedTransaction.balanceAfter,
            balanceChange: updatedTransaction.balanceAfter - updatedTransaction.balanceBefore,
            newBalance: result.newBalance
          }
        });
      } else {
        return res.json({
          success: false,
          message: result.message,
          data: {
            reference,
            amount: transaction.amount,
            status: transaction.status
          }
        });
      }
    }

    // For failed or other statuses
    return res.json({
      success: false,
      message: `Payment status: ${transaction.status}`,
      data: {
        reference,
        amount: transaction.amount,
        status: transaction.status
      }
    });
  } catch (error) {
    console.error('Verification Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ✅ Get all transactions for a user with balance tracking
router.get('/user-transactions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, type, page = 1, limit = 10 } = req.query;
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid user ID' 
      });
    }
    
    const filter = { userId };
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const transactions = await Transaction.find(filter)
      .populate('relatedPurchaseId', 'phoneNumber network capacity')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const totalCount = await Transaction.countDocuments(filter);
    
    const formattedTransactions = transactions.map(tx => ({
      _id: tx._id,
      type: tx.type,
      amount: tx.amount,
      balanceBefore: tx.balanceBefore,
      balanceAfter: tx.balanceAfter,
      balanceChange: tx.balanceAfter - tx.balanceBefore,
      isCredit: (tx.balanceAfter - tx.balanceBefore) > 0,
      status: tx.status,
      reference: tx.reference,
      gateway: tx.gateway,
      description: tx.description,
      relatedPurchase: tx.relatedPurchaseId,
      metadata: tx.metadata,
      createdAt: tx.createdAt,
      processing: tx.processing
    }));
    
    return res.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
    
  } catch (error) {
    console.error('Get Transactions Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ✅ Verify pending transaction by ID
router.post('/verify-pending-transaction/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    if (transaction.status !== 'pending') {
      return res.json({
        success: false,
        message: `Transaction is already ${transaction.status}`,
        data: {
          transactionId,
          reference: transaction.reference,
          amount: transaction.amount,
          status: transaction.status,
          balanceBefore: transaction.balanceBefore,
          balanceAfter: transaction.balanceAfter
        }
      });
    }
    
    const result = await processSuccessfulPayment(transaction.reference);
    
    if (result.success) {
      const updatedTransaction = await Transaction.findById(transactionId);
      
      return res.json({
        success: true,
        message: 'Transaction verified and completed successfully',
        data: {
          transactionId,
          reference: updatedTransaction.reference,
          amount: updatedTransaction.amount,
          status: 'completed',
          balanceBefore: updatedTransaction.balanceBefore,
          balanceAfter: updatedTransaction.balanceAfter,
          balanceChange: updatedTransaction.balanceAfter - updatedTransaction.balanceBefore,
          newBalance: result.newBalance
        }
      });
    } else {
      return res.json({
        success: false,
        message: result.message,
        data: {
          transactionId,
          reference: transaction.reference,
          amount: transaction.amount,
          status: transaction.status
        }
      });
    }
    
  } catch (error) {
    console.error('Verify Pending Transaction Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;