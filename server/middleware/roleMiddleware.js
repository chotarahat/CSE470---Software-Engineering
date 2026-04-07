// Role-based access control middleware
// Usage: authorize('admin') or authorize('admin', 'counselor')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Requires one of: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = { authorize };