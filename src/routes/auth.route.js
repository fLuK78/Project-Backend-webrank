const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth'); 

// ส้นทางสมัครสมาชิก
router.post('/register', authController.register);

//เส้นทางเข้าสู่ระบบ
router.post('/login', authController.login);

//เส้นทางแก้ไขโปรไฟล์ (ต้อง Login ก่อน)
router.put('/profile', auth, authController.updateProfile);

module.exports = router;