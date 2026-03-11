const { User } = require('../schema/schema');

/**
 * Middleware to verify worker or admin role from DATABASE.
 * Workers are support team members who can view/manage customer issues.
 * Admins also pass this check.
 * Must be used after the auth middleware which attaches req.user.
 */
const workerAuth = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ msg: 'Authentication required' });
    }

    const freshUser = await User.findById(req.user._id).select('role');
    if (!freshUser) {
      return res.status(401).json({ msg: 'User not found' });
    }

    if (freshUser.role !== 'worker' && freshUser.role !== 'admin') {
      return res.status(403).json({ msg: 'Support team access required' });
    }

    next();
  } catch (err) {
    console.error('Worker auth middleware error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = workerAuth;
