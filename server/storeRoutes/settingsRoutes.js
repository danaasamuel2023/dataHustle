const express = require('express');
const router = express.Router();
const auth = require('../middlewareUser/middleware');
const adminAuth = require('../adminMiddleware/middleware');
const { PlatformSettings } = require('../schema/storeSchema');

// =============================================================================
// GET PLATFORM SETTINGS (Admin)
// =============================================================================
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne({ key: 'platform_settings' });

    // Create default settings if none exist
    if (!settings) {
      settings = await PlatformSettings.create({ key: 'platform_settings' });
    }

    res.json({
      status: 'success',
      data: { settings }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch settings' });
  }
});

// =============================================================================
// UPDATE PLATFORM SETTINGS (Admin)
// =============================================================================
router.put('/', auth, adminAuth, async (req, res) => {
  try {
    const updateData = req.body;

    let settings = await PlatformSettings.findOne({ key: 'platform_settings' });

    if (!settings) {
      settings = new PlatformSettings({ key: 'platform_settings' });
    }

    // Update withdrawal providers settings
    if (updateData.withdrawalProviders) {
      const wp = updateData.withdrawalProviders;

      if (wp.activeProvider) settings.withdrawalProviders.activeProvider = wp.activeProvider;
      if (wp.minWithdrawal !== undefined) settings.withdrawalProviders.minWithdrawal = wp.minWithdrawal;
      if (wp.maxWithdrawal !== undefined) settings.withdrawalProviders.maxWithdrawal = wp.maxWithdrawal;
      if (wp.feePercent !== undefined) settings.withdrawalProviders.feePercent = wp.feePercent;
      if (wp.fixedFee !== undefined) settings.withdrawalProviders.fixedFee = wp.fixedFee;

      // Paystack settings
      if (wp.paystack) {
        if (wp.paystack.secretKey !== undefined) settings.withdrawalProviders.paystack.secretKey = wp.paystack.secretKey;
        if (wp.paystack.enabled !== undefined) settings.withdrawalProviders.paystack.enabled = wp.paystack.enabled;
      }

      // Moolre settings
      if (wp.moolre) {
        if (wp.moolre.apiKey !== undefined) settings.withdrawalProviders.moolre.apiKey = wp.moolre.apiKey;
        if (wp.moolre.enabled !== undefined) settings.withdrawalProviders.moolre.enabled = wp.moolre.enabled;
      }

      // Bulkclix settings
      if (wp.bulkclix) {
        if (wp.bulkclix.apiKey !== undefined) settings.withdrawalProviders.bulkclix.apiKey = wp.bulkclix.apiKey;
        if (wp.bulkclix.enabled !== undefined) settings.withdrawalProviders.bulkclix.enabled = wp.bulkclix.enabled;
      }
    }

    settings.updatedAt = new Date();
    await settings.save();

    res.json({
      status: 'success',
      data: { settings }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update settings' });
  }
});

module.exports = router;
