const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const controller = require('../controllers/registrationController'); 


// 1. ลงทะเบียนแข่งขัน
router.post('/', 
  // #swagger.tags = ['Registrations']
  // #swagger.description = 'ลงทะเบียนแข่งขัน'
  protect,
  controller.registerCompetition
);

// 2. ดูประวัติการสมัครของผู้เล่น 
router.get('/my-history', 
  // #swagger.tags = ['Registrations']
  // #swagger.description = 'ดูประวัติการสมัครของผู้เล่น (ดึงจากคนล็อกอิน)'
  protect,
  controller.getPlayerHistory
);

// 3. ดูรายชื่อผู้สมัครทั้งหมดในรายการแข่งขันนั้นๆ
router.get('/competition/:competitionId', 
  // #swagger.tags = ['Registrations']
  // #swagger.description = 'ดูรายชื่อผู้สมัครทั้งหมดในรายการแข่งขันนั้นๆ'
  protect,
  controller.getCompetitionParticipants
);

// 4. ยกเลิกการสมัคร
router.put('/:id/cancel', 
  // #swagger.tags = ['Registrations']
  // #swagger.description = 'ยกเลิกการสมัคร'
  protect,
  controller.cancelRegistration
);

// 5. อนุมัติการสมัคร (เรียกตรงไปที่ approve)
router.put('/:id/approve', 
  // #swagger.tags = ['Registrations']
  // #swagger.description = 'อนุมัติการสมัคร'
  protect,
  controller.approveRegistration
);

// 6. ปฏิเสธการสมัคร (เรียกตรงไปที่ reject)
router.put('/:id/reject', 
  // #swagger.tags = ['Registrations']
  // #swagger.description = 'ปฏิเสธการสมัคร'
  protect,
  controller.rejectRegistration
);

// 7. รวมศูนย์การ Update Status 
router.put('/:id/status', 
  // #swagger.tags = ['Registrations']
  // #swagger.description = 'อัปเดตสถานะการสมัคร (ส่ง status ใน body เช่น approved, rejected, cancelled)'
  protect,
  controller.updateStatus
);

module.exports = router;