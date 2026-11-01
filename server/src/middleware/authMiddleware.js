const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'datalens_secure_jwt_secret_2026';

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Optional auth: if token provided, decode user; otherwise default to demo user
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      // ignore invalid optional token
    }
  }

  // Default to demo user for frictionless guest exploration
  req.user = {
    id: 'demo-user-id',
    email: 'demo@datalens.local',
    name: 'Demo Analyst'
  };
  next();
};

module.exports = {
  requireAuth,
  optionalAuth,
  JWT_SECRET
};
