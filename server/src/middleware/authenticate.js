const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const token = req.cookies && req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof payload.sub !== 'string') {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    req.userId = payload.sub;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

module.exports = authenticate;
