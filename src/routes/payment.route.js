const express = require('express');
const router = express.Router();
const controller = require('../controllers/paymentController');
const upload = require('../middleware/upload');

// User: ส่งหลักฐานชำระเงิน (เพิ่ม middleware upload)
router.post('/submit', 
  upload.single('slipImage'), 
  // #swagger.tags = ['Payments']
  controller.processPayment
);

// Admin: ดึงรายการชำระเงินทั้งหมดที่รอตรวจสอบ
router.get('/pending', 
  // #swagger.tags = ['Payments (Admin)']
  controller.getPendingPayments
);

// Admin: อนุมัติหรือปฏิเสธสลิป
router.patch('/verify/:id', 
  // #swagger.tags = ['Payments (Admin)']
  controller.verifyPayment
);

router.get('/:paymentId', 
  // #swagger.tags = ['Payments']
  controller.getPaymentDetail
);

module.exports = router;