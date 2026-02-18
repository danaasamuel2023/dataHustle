// middleware/adminAuth.js
const { User } = require('../schema/schema');

/**
 * Middleware to verify admin role from DATABASE (not just JWT claims).
 * This prevents privilege escalation if JWT is compromised -
 * attacker can't just set role='admin' in a forged token.
 * Must be used after the auth middleware which attaches req.user.
 */
const adminAuth = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ msg: 'Authentication required' });
    }

    // Re-verify role from database - don't trust JWT claim alone
    const freshUser = await User.findById(req.user._id).select('role');
    if (!freshUser) {
      return res.status(401).json({ msg: 'User not found' });
    }

    if (freshUser.role !== 'admin') {
      return res.status(403).json({ msg: 'Admin access required' });
    }

    next();
  } catch (err) {
    console.error('Admin auth middleware error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = adminAuth;
