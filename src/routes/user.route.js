const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');
const jwt = require('jsonwebtoken');

// Middleware ตรวจสอบ Token
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: "ต้องล็อกอินก่อน" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token ไม่ถูกต้อง" });
  }
};

// ROUTES สำหรับข้อมูลส่วนตัว (Static)
router.get('/profile', authenticate, controller.getProfile);
router.put('/profile', authenticate, controller.upload.single('image'), controller.updateProfile);

// ROUTES สำหรับแอดมิน
router.get('/', authenticate, controller.getAllUsers);
router.post('/', authenticate, controller.createUser);

// ROUTES ที่มี Parameters 
router.get('/:id', authenticate, controller.getUserById);
router.put('/:id', authenticate, controller.updateUser);
router.delete('/:id', authenticate, controller.deleteUser);

module.exports = router;