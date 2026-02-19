const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      success: false, 
      message: "กรุณาเข้าสู่ระบบ (No token provided)" 
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded; 
    
    next();
  } catch (err) {

    const errorMsg = err.name === 'TokenExpiredError' ? "Token หมดอายุแล้ว" : "Token ไม่ถูกต้อง";
    return res.status(401).json({ 
      success: false, 
      message: errorMsg 
    });
  }
};