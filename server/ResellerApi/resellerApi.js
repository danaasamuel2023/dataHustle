const express = require('express');
const router = express.Router();
const axios = require('axios');

const mongoose = require('mongoose');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const { 
    User, 
    DataPurchase, 
    Transaction, 
    ReferralBonus,
    ApiKey,
    DataInventory // Added DataInventory to schema imports
} = require('../schema/schema');

// Constants
const JWT_SECRET = process.env.JWT_SECRET || 'DatAmArt';

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

const mapNetworkToDatamart = (network) => {
  const networkMap = {
    'TELECEL': 'TELECEL', 'MTN': 'YELLO', 'YELLO': 'YELLO',
    'AIRTEL': 'at', 'AT': 'at', 'AT_PREMIUM': 'at', 'AIRTELTIGO': 'at', 'TIGO': 'at', 'at': 'at'
  };
  return networkMap[network?.toUpperCase()] || network;
};

const logOperation = (operation, data) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${operation}]`, JSON.stringify(data, null, 2));
  };

// Data Package Pricing for all networks
const DATA_PACKAGES = [
    // TELECEL Packages
  // { capacity: '1', mb: '1000', price: '3.65', network: 'TELECEL' },
    // { capacity: '2', mb: '2000', price: '7.30', network: 'TELECEL' },
    // { capacity: '3', mb: '3000', price: '11.20', network: 'TELECEL' },
    // { capacity: '4', mb: '4000', price: '14.00', network: 'TELECEL' },
    { capacity: '5', mb: '5000', price: '23.00', network: 'TELECEL' },
    { capacity: '6', mb: '6000', price: '28.00', network: 'TELECEL' },
    { capacity: '8', mb: '8000', price: '28.00', network: 'TELECEL' },
    { capacity: '10', mb: '10000', price: '35.50', network: 'TELECEL' },
    { capacity: '12', mb: '12000', price: '42.50', network: 'TELECEL' },
    { capacity: '15', mb: '15000', price: '55.50', network: 'TELECEL' },
    { capacity: '20', mb: '20000', price: '75.00', network: 'TELECEL' },
    { capacity: '25', mb: '25000', price: '92.00', network: 'TELECEL' },
    { capacity: '30', mb: '30000', price: '110.00', network: 'TELECEL' },
    { capacity: '40', mb: '40000', price: '145.00', network: 'TELECEL' },
    { capacity: '50', mb: '50000', price: '180.00', network: 'TELECEL' },
    
    // MTN Packages
   { capacity: '1', mb: '1000', price: '4.7', network: 'YELLO', inStock: true },
   { capacity: '2', mb: '2000', price: '9.500', network: 'YELLO', inStock: true },
   { capacity: '3', mb: '3000', price: '13.5', network: 'YELLO', inStock: true },
   { capacity: '4', mb: '4000', price: '18.00', network: 'YELLO', inStock: true },
   { capacity: '5', mb: '5000', price: '22.50', network: 'YELLO', inStock: true },
   { capacity: '6', mb: '6000', price: '27.00', network: 'YELLO', inStock: true },
   { capacity: '7', mb: '7000', price: '31.50', network: 'YELLO', inStock: true },
   { capacity: '8', mb: '8000', price: '35.50', network: 'YELLO', inStock: true },
   { capacity: '10', mb: '10000', price: '43.50', network: 'YELLO', inStock: true },
   { capacity: '15', mb: '15000', price: '62.50', network: 'YELLO', inStock: true },
   { capacity: '20', mb: '20000', price: '85.00', network: 'YELLO', inStock: true },
   { capacity: '25', mb: '25000', price: '105.00', network: 'YELLO', inStock: true },
   { capacity: '30', mb: '30000', price: '128.00', network: 'YELLO', inStock: true },
   { capacity: '40', mb: '40000', price: '165.00', network: 'YELLO', inStock: true },
   { capacity: '50', mb: '50000', price: '206.00', network: 'YELLO', inStock: true },
   { capacity: '100', mb: '100000', price: '406.00', network: 'YELLO', inStock: true },
    // AirtelTigo Packages
    { capacity: '1', mb: '1000', price: '3.9', network: 'at' },
    { capacity: '2', mb: '2000', price: '8.30', network: 'at' },
    { capacity: '3', mb: '3000', price: '13.20', network: 'at' },
    { capacity: '4', mb: '4000', price: '16.00', network: 'at' },
    { capacity: '5', mb: '5000', price: '19.00', network: 'at' },
    { capacity: '6', mb: '6000', price: '23.00', network: 'at' },
    { capacity: '8', mb: '8000', price: '30.00', network: 'at' },
    { capacity: '10', mb: '10000', price: '37.50', network: 'at' },
    { capacity: '12', mb: '12000', price: '42.50', network: 'at' },
    { capacity: '15', mb: '15000', price: '54.50', network: 'at' },
    // { capacity: '20', mb: '20000', price: '75.00', network: 'at' },
    { capacity: '25', mb: '25000', price: '87.00', network: 'at' },
    { capacity: '30', mb: '30000', price: '110.00', network: 'at' },
    { capacity: '40', mb: '40000', price: '145.00', network: 'at' },
    { capacity: '50', mb: '50000', price: '180.00', network: 'at' }
];


// Authentication Middleware (JWT for web, keep for backward compatibility)
// Modified authentication middleware to check multiple sources for the token
const authenticateUser = async (req, res, next) => {
    // Try to get token from various sources
    const token = 
        req.headers['authorization'] || 
        req.query.token ||
        req.cookies.token || 
        (req.body && req.body.token);
    
    console.log('Token received:', token ? 'exists' : 'missing');
    
    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'No token provided'
        });
    }

    try {
        // Remove 'Bearer ' prefix if it exists
        const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;
        
        console.log('Token for verification:', tokenString.substring(0, 20) + '...');
        
        const decoded = jwt.verify(tokenString, JWT_SECRET);
        console.log('Decoded token:', decoded);
        
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token - user not found'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('JWT verification error:', error.message);
        res.status(401).json({
            status: 'error',
            message: 'Unauthorized',
            details: error.message
        });
    }
};
// Generate API Key
const generateApiKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

// API Key Authentication Middleware
const authenticateApiKey = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({
            status: 'error',
            message: 'No API key provided'
        });
    }

    try {
        const keyRecord = await ApiKey.findOne({ 
            key: apiKey,
            isActive: true
        }).populate('userId');
        
        if (!keyRecord) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid or inactive API key'
            });
        }

        // Check if key is expired
        if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
            return res.status(401).json({
                status: 'error',
                message: 'API key has expired'
            });
        }

        // Update last used timestamp
        keyRecord.lastUsed = new Date();
        await keyRecord.save();

        req.user = keyRecord.userId;
        next();
    } catch (error) {
        res.status(401).json({
            status: 'error',
            message: 'Unauthorized',
            details: error.message
        });
    }
};

// Find data package by capacity and network
const findDataPackage = (capacity, network) => {
    const dataPackage = DATA_PACKAGES.find(
        pkg => pkg.capacity === capacity && pkg.network === network
    );
    
    if (!dataPackage) {
        throw new Error(`Invalid data package requested: ${capacity}GB for ${network}`);
    }
    
    return {
        ...dataPackage,
        price: parseFloat(dataPackage.price)
    };
};

// Create new API key
router.post('/generate-api-key', authenticateUser, async (req, res) => {
    try {
        const { name, expiresIn } = req.body;
        
        if (!name) {
            return res.status(400).json({
                status: 'error',
                message: 'API key name is required'
            });
        }

        // Generate a new API key
        const key = generateApiKey();
        
        // Calculate expiration date if provided
        let expiryDate = null;
        if (expiresIn) {
            expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + parseInt(expiresIn));
        }

        // Create a new API key record
        const apiKey = new ApiKey({
            userId: req.user._id,
            key,
            name,
            expiresAt: expiryDate,
            isActive: true,
            createdAt: new Date(),
            lastUsed: null
        });

        await apiKey.save();

        res.status(201).json({
            status: 'success',
            data: {
                key,
                name,
                expiresAt: expiryDate,
                id: apiKey._id
            },
            message: 'API key generated successfully. Please save this key as it will not be displayed again.'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// List user's API keys
router.get('/api-keys', authenticateUser, async (req, res) => {
    try {
        const apiKeys = await ApiKey.find({ 
            userId: req.user._id 
        }).select('-key'); // Don't send the actual key for security

        res.json({
            status: 'success',
            data: apiKeys
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Revoke an API key
router.delete('/api-keys/:id', authenticateUser, async (req, res) => {
    try {
        const apiKey = await ApiKey.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!apiKey) {
            return res.status(404).json({
                status: 'error',
                message: 'API key not found'
            });
        }

        // Deactivate the key
        apiKey.isActive = false;
        await apiKey.save();

        res.json({
            status: 'success',
            message: 'API key revoked successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Endpoint to get available data packages by network
router.get('/data-packages', async (req, res) => {
    try {
        const { network } = req.query;
        
        if (network) {
            const packages = DATA_PACKAGES.filter(pkg => pkg.network === network);
            res.json({
                status: 'success',
                data: packages
            });
        } else {
            // Group packages by network
            const networkPackages = {};
            DATA_PACKAGES.forEach(pkg => {
                if (!networkPackages[pkg.network]) {
                    networkPackages[pkg.network] = [];
                }
                networkPackages[pkg.network].push(pkg);
            });
            
            res.json({
                status: 'success',
                data: networkPackages
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Helper function for Telecel API integration
router.post('/purchase', async (req, res, next) => {
    // First try API key authentication
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
        return authenticateApiKey(req, res, next);
    }
    // Fallback to JWT token authentication
    return authenticateUser(req, res, next);
}, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { 
            phoneNumber, 
            network, 
            capacity, 
            gateway,
            referrerNumber // Added to support Hubnet referrer functionality
        } = req.body;

        logOperation('DATA_PURCHASE_REQUEST', {
            userId: req.user._id,
            phoneNumber,
            network,
            capacity,
            gateway,
            referrerNumber,
            timestamp: new Date()
        });

        // Validate required fields
        if (!phoneNumber || !network || !capacity || !gateway) {
            logOperation('DATA_PURCHASE_VALIDATION_ERROR', {
                missingFields: {
                    phoneNumber: !phoneNumber,
                    network: !network,
                    capacity: !capacity,
                    gateway: !gateway
                }
            });
            
            await session.abortTransaction();
            session.endSession();
            
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields'
            });
        }

        // Get package details from server-side pricing data
        const dataPackage = findDataPackage(capacity, network);
        const price = dataPackage.price;

        logOperation('DATA_PURCHASE_USER_FOUND', {
            userId: req.user._id,
            currentBalance: req.user.walletBalance,
            requestedPurchaseAmount: price
        });

        // Check wallet balance
        if (req.user.walletBalance < price) {
            logOperation('DATA_PURCHASE_INSUFFICIENT_BALANCE', {
                userId: req.user._id,
                walletBalance: req.user.walletBalance,
                requiredAmount: price,
                shortfall: price - req.user.walletBalance
            });
            
            await session.abortTransaction();
            session.endSession();
            
            return res.status(400).json({
                status: 'error',
                message: 'Insufficient wallet balance',
                currentBalance: req.user.walletBalance,
                requiredAmount: price
            });
        }

        // NEW: Check inventory/stock status for the network
        const inventory = await DataInventory.findOne({ network }).session(session);
        
        logOperation('DATA_INVENTORY_CHECK', {
            network,
            inventoryFound: !!inventory,
            inStock: inventory ? inventory.inStock : false,
            skipGeonettech: inventory ? inventory.skipGeonettech : false
        });
        
        // If inventory doesn't exist or inStock is false, return error immediately
        if (!inventory || !inventory.inStock) {
            logOperation('DATA_INVENTORY_OUT_OF_STOCK', {
                network,
                inventoryExists: !!inventory
            });
            
            await session.abortTransaction();
            session.endSession();
            
            return res.status(400).json({
                status: 'error',
                message: `${network} data bundles are currently out of stock. Please try again later or choose another network.`
            });
        }

        // Generate unique references
        const transactionReference = `TRX-${uuidv4()}`;
        const orderReference = `DM-${Math.floor(100000 + Math.random() * 900000)}`;

        // Create Transaction (wallet deduction)
        // Save order as PENDING — queue processor sends to DataMart
        const transaction = new Transaction({
            userId: req.user._id,
            type: 'purchase',
            amount: price,
            status: 'completed',
            reference: transactionReference,
            gateway
        });

        const dataPurchase = new DataPurchase({
            userId: req.user._id,
            phoneNumber,
            network,
            capacity,
            mb: dataPackage.mb,
            gateway,
            method: 'api',
            price,
            status: 'pending',
            geonetReference: orderReference,
            processingMethod: 'datamart_api'
        });

        const previousBalance = req.user.walletBalance;
        req.user.walletBalance -= price;
        transaction.relatedPurchaseId = dataPurchase._id;

        await dataPurchase.save({ session });
        await transaction.save({ session });
        await req.user.save({ session });

        await session.commitTransaction();
        session.endSession();

        logOperation('DATA_PURCHASE_SAVED_PENDING', {
            userId: req.user._id,
            orderReference, network, capacity,
            previousBalance, newBalance: req.user.walletBalance
        });

        // Process via DataMart async (non-blocking)
        const datamartNetwork = mapNetworkToDatamart(network);
        datamartClient.post('/api/developer/purchase', {
            phoneNumber,
            network: datamartNetwork,
            capacity: capacity.toString(),
            gateway: 'wallet',
            ref: orderReference
        }).then(response => {
            if (response.data?.status === 'success') {
                DataPurchase.findByIdAndUpdate(dataPurchase._id, {
                    status: 'processing',
                    apiOrderId: response.data.data?.purchaseId || orderReference,
                    apiResponse: response.data,
                    processingMethod: 'datamart_api'
                }).catch(err => logOperation('DB_UPDATE_ERROR', { error: err.message }));
            }
        }).catch(err => {
            logOperation('ASYNC_DATAMART_ERROR', { orderId: dataPurchase._id, error: err.message });
        });

        res.status(201).json({
            status: 'success',
            message: 'Order placed successfully. Processing your data bundle.',
            data: {
                purchaseId: dataPurchase._id,
                transactionReference: transaction.reference,
                network,
                capacity,
                mb: dataPackage.mb,
                price,
                remainingBalance: req.user.walletBalance,
                orderStatus: 'pending',
                orderReference
            }
        });

    } catch (error) {
        // Rollback transaction
        await session.abortTransaction();
        session.endSession();
        
        logOperation('DATA_PURCHASE_ERROR', {
            message: error.message,
            stack: error.stack,
            response: error.response ? {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            } : null,
            request: error.request ? {
                method: error.request.method,
                path: error.request.path,
                headers: error.request.headers
            } : null
        });

        res.status(500).json({
            status: 'error',
            message: 'Could not complete your purchase. Please try again later.'
        });
    }
});


// Get Purchase History (support both authentication methods)
router.get('/purchase-history/:userId', async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
        return authenticateApiKey(req, res, next);
    }
    return authenticateUser(req, res, next);
}, async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        // Ensure user can only access their own purchase history
        if (req.user._id.toString() !== userId) {
            return res.status(403).json({
                status: 'error',
                message: 'Unauthorized access to purchase history'
            });
        }

        const purchases = await DataPurchase.find({ userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await DataPurchase.countDocuments({ userId });

        res.json({
            status: 'success',
            data: {
                purchases,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get Transaction History (support both authentication methods)
router.get('/transactions', async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
        return authenticateApiKey(req, res, next);
    }
    return authenticateUser(req, res, next);
}, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const transactions = await Transaction.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Transaction.countDocuments({ userId: req.user._id });

        res.json({
            status: 'success',
            data: {
                transactions,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Referral Bonus Claiming (support both authentication methods)
router.post('/claim-referral-bonus', async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
        return authenticateApiKey(req, res, next);
    }
    return authenticateUser(req, res, next);
}, async (req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            // Find pending referral bonuses for the user
            const pendingBonuses = await ReferralBonus.find({ 
                userId: req.user._id, 
                status: 'pending' 
            });

            let totalBonus = 0;
            const processedBonuses = [];

            for (let bonus of pendingBonuses) {
                totalBonus += bonus.amount;
                bonus.status = 'credited';
                await bonus.save({ session });
                processedBonuses.push(bonus._id);
            }

            // Update user wallet
            req.user.walletBalance += totalBonus;
            await req.user.save({ session });

            res.json({
                status: 'success',
                data: {
                    bonusClaimed: totalBonus,
                    processedBonuses,
                    newWalletBalance: req.user.walletBalance
                }
            });
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    } finally {
        await session.endSession();
    }
});

module.exports = router;