const express = require('express');
const router = express.Router();
const { Transaction, User } = require('../schema/schema');
const axios = require('axios');
const crypto = require('crypto');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

// Import authentication middleware
const auth = require('../middlewareUser/middleware');

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_live_b8f78b58b7860fd9795eb376a8602eba072d6e15'; 
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const FEE_PERCENTAGE = 0.02;

// mNotify SMS configuration
const SMS_CONFIG = {
  API_KEY: process.env.MNOTIFY_API_KEY || 'w3rGWhv4e235nDwYvD5gVDyrW',
  SENDER_ID: 'DataHustleGH',
  BASE_URL: 'https://apps.mnotify.net/smsapi'
};

// Rate limiting
const depositLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many deposit attempts, please try again later'
});

const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '233' + cleaned.substring(1);
  if (!cleaned.startsWith('233')) cleaned = '233' + cleaned;
  return cleaned;
};

const sendSMS = async (to, message) => {
  try {
    const formattedPhone = formatPhoneNumber(to);
    if (!formattedPhone || formattedPhone.length < 12) {
      throw new Error('Invalid phone number format');
    }
    const url = `${SMS_CONFIG.BASE_URL}?key=${SMS_CONFIG.API_KEY}&to=${formattedPhone}&msg=${encodeURIComponent(message)}&sender_id=${SMS_CONFIG.SENDER_ID}`;
    const response = await axios.get(url);
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
      case 1000: return { success: true, message: 'SMS sent successfully', code: responseCode };
      case 1007: return { success: true, message: 'SMS scheduled', code: responseCode };
      default: throw new Error(`SMS Error Code: ${responseCode}`);
    }
  } catch (error) {
    console.error('SMS Error:', error.message);
    return { success: false, error: error.message };
  }
};

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

const sendFraudAlert = async (transaction, user) => {
  try {
    const adminPhone = process.env.ADMIN_PHONE || '233597760914';
    const message = `🚨 FRAUD ALERT! User: ${user.name} (${user.phoneNumber}). Ref: ${transaction.reference}. Expected: GHS ${transaction.metadata.expectedPaystackAmount}, Paid: GHS ${transaction.metadata.actualAmountPaid}. Check immediately!`;
    await sendSMS(adminPhone, message);
  } catch (error) {
    console.error('Fraud Alert SMS Error:', error);
  }
};

const checkSuspiciousActivity = async (userId, ip) => {
  try {
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentDepositsByIP = await Transaction.countDocuments({
      type: 'deposit',
      createdAt: { $gte: oneHourAgo },
      'metadata.ip': ip
    });
    const recentDepositsByUser = await Transaction.countDocuments({
      userId,
      type: 'deposit',
      createdAt: { $gte: oneHourAgo }
    });
    const recentLargeDeposits = await Transaction.countDocuments({
      userId,
      type: 'deposit',
      amount: { $gte: 5000 },
      createdAt: { $gte: oneHourAgo }
    });
    const isSuspicious = recentDepositsByIP > 10 || recentDepositsByUser > 5 || recentLargeDeposits > 2;
    if (isSuspicious) {
      console.warn('🚨 SUSPICIOUS ACTIVITY:', { userId, ip, recentDepositsByIP, recentDepositsByUser, recentLargeDeposits });
    }
    return {
      isSuspicious,
      metrics: { recentDepositsByIP, recentDepositsByUser, recentLargeDeposits }
    };
  } catch (error) {
    console.error('Suspicious Activity Check Error:', error);
    return { isSuspicious: false, metrics: {} };
  }
};

router.post('/deposit', depositLimiter, async (req, res) => {
  try {
    const { userId, amount, email } = req.body;
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid deposit details' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    if (user.isDisabled) {
      return res.status(403).json({
        success: false,
        error: 'Account is disabled',
        message: 'Your account has been disabled. Deposits are not allowed.',
        disableReason: user.disableReason || 'No reason provided'
      });
    }
    const depositAmount = parseFloat(amount);
    if (depositAmount > 50000) {
      return res.status(400).json({ success: false, error: 'Maximum deposit amount is GHS 50,000' });
    }
    const fee = depositAmount * FEE_PERCENTAGE;
    const totalAmountWithFee = depositAmount + fee;
    const clientIP = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const suspiciousCheck = await checkSuspiciousActivity(userId, clientIP);
    const reference = `DEP-${crypto.randomBytes(10).toString('hex')}-${Date.now()}`;
    const balanceBefore = user.walletBalance;
    const balanceAfter = balanceBefore + depositAmount;
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
        expectedPaystackAmount: totalAmountWithFee,
        fee: fee,
        baseAmount: depositAmount,
        ip: clientIP,
        userAgent: req.headers['user-agent'],
        suspicious: suspiciousCheck.isSuspicious,
        suspiciousMetrics: suspiciousCheck.metrics,
        initiatedAt: new Date()
      }
    });
    await transaction.save();
    const paystackAmount = Math.round(totalAmountWithFee * 100);
    const paystackResponse = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: email || user.email,
        amount: paystackAmount,
        currency: 'GHS',
        reference,
        callback_url: `${process.env.BASE_URL || 'https://www.datahustle.shop'}/api/payment/callback?reference=${reference}`,
        metadata: {
          custom_fields: [
            { display_name: "User ID", variable_name: "user_id", value: userId.toString() },
            { display_name: "Base Amount", variable_name: "base_amount", value: depositAmount.toString() }
          ]
        }
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
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

async function processSuccessfulPayment(reference) {
  const transaction = await Transaction.findOneAndUpdate(
    { reference, status: 'pending', processing: { $ne: true } },
    { $set: { processing: true } },
    { new: true }
  );
  if (!transaction) {
    console.log(`Transaction ${reference} not found or already processed`);
    return { success: false, message: 'Transaction not found or already processed' };
  }
  try {
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
    const actualAmountPaid = paystackData.amount / 100;
    const expectedAmount = transaction.metadata?.expectedPaystackAmount || transaction.amount;
    console.log('Payment verification:', {
      reference,
      actualAmountPaid,
      expectedAmount,
      baseAmount: transaction.amount,
      paystackStatus: paystackData.status
    });
    if (Math.abs(actualAmountPaid - expectedAmount) > 0.02) {
      console.error(`🚨 FRAUD DETECTED - Amount mismatch!`, {
        reference,
        expectedAmount,
        actualAmountPaid,
        difference: actualAmountPaid - expectedAmount,
        baseAmount: transaction.amount,
        userId: transaction.userId
      });
      transaction.status = 'failed';
      transaction.processing = false;
      transaction.metadata = {
        ...transaction.metadata,
        fraudDetected: true,
        fraudReason: 'Amount mismatch - possible fraud attempt',
        expectedAmount: expectedAmount,
        actualAmountPaid: actualAmountPaid,
        fraudDetectedAt: new Date(),
        paystackData: paystackData
      };
      await transaction.save();
      const user = await User.findById(transaction.userId);
      if (user) {
        await sendFraudAlert(transaction, user);
      }
      return { success: false, message: 'Payment amount verification failed' };
    }
    if (paystackData.status !== 'success') {
      console.warn(`Payment not successful. Paystack status: ${paystackData.status}`);
      transaction.status = 'failed';
      transaction.processing = false;
      transaction.metadata = {
        ...transaction.metadata,
        paystackStatus: paystackData.status,
        paystackData: paystackData,
        failedAt: new Date()
      };
      await transaction.save();
      return { success: false, message: `Payment not successful: ${paystackData.status}` };
    }
    const user = await User.findById(transaction.userId);
    if (!user) {
      console.error(`User not found for transaction ${reference}`);
      transaction.processing = false;
      await transaction.save();
      return { success: false, message: 'User not found' };
    }
    if (Math.abs(user.walletBalance - transaction.balanceBefore) > 0.01) {
      console.warn(`Balance mismatch for user ${user._id}. Adjusting...`);
      transaction.balanceBefore = user.walletBalance;
      transaction.balanceAfter = user.walletBalance + transaction.amount;
    }
    const previousBalance = user.walletBalance;
    user.walletBalance += transaction.amount;
    await user.save();
    transaction.status = 'completed';
    transaction.balanceBefore = previousBalance;
    transaction.balanceAfter = user.walletBalance;
    transaction.processing = false;
    transaction.completedAt = new Date();
    transaction.metadata = {
      ...transaction.metadata,
      paystackData: paystackData,
      verifiedAt: new Date()
    };
    await transaction.save();
    console.log(`✅ Transaction ${reference} completed. User ${user._id} balance: ${previousBalance} -> ${user.walletBalance}`);
    await sendDepositSMS(user, transaction.amount, user.walletBalance);
    return { success: true, message: 'Deposit successful', newBalance: user.walletBalance };
  } catch (error) {
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

router.get('/callback', async (req, res) => {
  try {
    const { reference } = req.query;
    if (!reference) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error - DataHustleGH</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #d32f2f; }
            </style>
          </head>
          <body>
            <h1 class="error">Error</h1>
            <p>Invalid payment reference</p>
            <a href="https://www.datahustle.shop">Return to Home</a>
          </body>
        </html>
      `);
    }
    console.log(`Payment callback received for reference: ${reference}`);
    try {
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
      const transaction = await Transaction.findOne({ reference });
      if (!transaction) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Error - DataHustleGH</title>
            </head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #d32f2f;">Transaction Not Found</h1>
              <p>Reference: ${reference}</p>
              <a href="https://www.datahustle.shop">Return to Home</a>
            </body>
          </html>
        `);
      }
      if (paystackData.status !== 'success') {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Payment Failed - DataHustleGH</title>
              <meta http-equiv="refresh" content="3;url=https://www.datahustle.shop/deposit-failed" />
            </head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #d32f2f;">Payment Failed</h1>
              <p>Status: ${paystackData.status}</p>
              <p>Redirecting...</p>
            </body>
          </html>
        `);
      }
      const actualAmountPaid = paystackData.amount / 100;
      const expectedAmount = transaction.metadata?.expectedPaystackAmount || transaction.amount;
      if (Math.abs(actualAmountPaid - expectedAmount) > 0.02) {
        console.error('🚨 FRAUD ALERT - Callback amount mismatch:', {
          reference,
          expectedAmount,
          actualAmountPaid,
          userId: transaction.userId
        });
        transaction.status = 'failed';
        transaction.metadata = {
          ...transaction.metadata,
          fraudDetected: true,
          fraudReason: 'Amount mismatch in callback',
          expectedAmount,
          actualAmountPaid,
          fraudDetectedAt: new Date()
        };
        await transaction.save();
        const user = await User.findById(transaction.userId);
        if (user) {
          await sendFraudAlert(transaction, user);
        }
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Payment Verification Failed - DataHustleGH</title>
              <meta http-equiv="refresh" content="5;url=https://www.datahustle.shop/deposit-failed" />
            </head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #d32f2f;">Payment Verification Failed</h1>
              <p>Your payment could not be verified. Our team has been notified.</p>
              <p>Reference: ${reference}</p>
              <p>Please contact support if you believe this is an error.</p>
              <p>Redirecting...</p>
            </body>
          </html>
        `);
      }
      const result = await processSuccessfulPayment(reference);
      if (result.success) {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Payment Successful - DataHustleGH</title>
              <meta http-equiv="refresh" content="3;url=https://www.datahustle.shop/deposit-success?amount=${transaction.amount}" />
            </head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <div style="max-width: 500px; margin: 0 auto; padding: 30px; border: 2px solid #4caf50; border-radius: 10px;">
                <h1 style="color: #4caf50;">✅ Payment Successful!</h1>
                <p style="font-size: 18px;">GHS ${transaction.amount.toFixed(2)} has been credited to your account</p>
                <p style="font-size: 16px; color: #666;">New Balance: <strong>GHS ${result.newBalance.toFixed(2)}</strong></p>
                <p style="font-size: 14px; color: #999;">Reference: ${reference}</p>
                <p>Redirecting...</p>
              </div>
            </body>
          </html>
        `);
      } else {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Payment Processing Failed - DataHustleGH</title>
              <meta http-equiv="refresh" content="3;url=https://www.datahustle.shop/deposit-failed" />
            </head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #d32f2f;">Payment Processing Failed</h1>
              <p>${result.message}</p>
              <p>Redirecting...</p>
            </body>
          </html>
        `);
      }
    } catch (paystackError) {
      console.error('Paystack Verification Error in Callback:', paystackError.response?.data || paystackError.message);
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Verification Error - DataHustleGH</title>
          </head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #d32f2f;">Verification Error</h1>
            <p>Unable to verify payment with payment provider.</p>
            <p>Reference: ${reference}</p>
            <p>Please contact support for assistance.</p>
            <a href="https://www.datahustle.shop">Return to Home</a>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Callback Error:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error - DataHustleGH</title>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #d32f2f;">Error</h1>
          <p>An error occurred processing your payment</p>
          <a href="https://www.datahustle.shop">Return to Home</a>
        </body>
      </html>
    `);
  }
});

router.post('/paystack/webhook', async (req, res) => {
  try {
    console.log('Webhook received:', {
      signature: req.headers['x-paystack-signature'],
      event: req.body.event,
      reference: req.body.data?.reference
    });
    const secret = PAYSTACK_SECRET_KEY;
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
      console.error('❌ Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }
    const event = req.body;
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

router.get('/verify-payment', async (req, res) => {
  try {
    const { reference } = req.query;
    if (!reference) {
      return res.status(400).json({ success: false, error: 'Reference is required' });
    }
    const transaction = await Transaction.findOne({ reference });
    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
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
          data: { reference, amount: transaction.amount, status: transaction.status }
        });
      }
    }
    return res.json({
      success: false,
      message: `Payment status: ${transaction.status}`,
      data: { reference, amount: transaction.amount, status: transaction.status }
    });
  } catch (error) {
    console.error('Verification Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/user-transactions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, type, page = 1, limit = 10 } = req.query;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }
    const filter = { userId };
    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.type = type;
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
      processing: tx.processing,
      fraudDetected: tx.metadata?.fraudDetected || false
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
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/verify-pending-transaction/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
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
        data: { transactionId, reference: transaction.reference, amount: transaction.amount, status: transaction.status }
      });
    }
  } catch (error) {
    console.error('Verify Pending Transaction Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/admin/fraud-alerts', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const fraudulentTransactions = await Transaction.find({ 'metadata.fraudDetected': true })
      .populate('userId', 'name email phoneNumber')
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json({
      success: true,
      data: {
        fraudAlerts: fraudulentTransactions.map(tx => ({
          reference: tx.reference,
          user: tx.userId,
          amount: tx.amount,
          expectedAmount: tx.metadata.expectedPaystackAmount,
          actualAmountPaid: tx.metadata.actualAmountPaid,
          fraudReason: tx.metadata.fraudReason,
          detectedAt: tx.metadata.fraudDetectedAt,
          createdAt: tx.createdAt,
          ip: tx.metadata.ip
        })),
        total: fraudulentTransactions.length
      }
    });
  } catch (error) {
    console.error('Fraud Alerts Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;