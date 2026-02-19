const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token ไม่ถูกต้อง' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user?.role === 'Admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Admin Only' });
  }
};

module.exports = { protect, isAdmin };
