const express = require('express');
const router = express.Router();
const controller = require('../controllers/registrationController');
const { protect, isAdmin } = require('../middleware/authMiddleware'); 

// 1. อนุมัติการลงทะเบียน
router.put('/:id/approve',
  protect, 
  isAdmin,
  controller.approveRegistration
);

// 2. ไม่อนุมัติการลงทะเบียน
router.put('/:id/reject',
  protect, 
  isAdmin,
  controller.rejectRegistration
);

module.exports = router;