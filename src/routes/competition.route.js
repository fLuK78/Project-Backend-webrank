const express = require('express');
const router = express.Router(); 
const controller = require('../controllers/competitionController');
const auth = require('../middleware/auth');


router.get('/',
  // #swagger.tags = ['Competitions']
  // #swagger.description = 'ดึงข้อมูลการแข่งขันทั้งหมด'
  controller.getCompetitions
);

router.get('/:id',
  // #swagger.tags = ['Competitions']
  // #swagger.description = 'ดึงข้อมูลการแข่งขันตาม ID'
  controller.getCompetitionById
);

router.get('/:id/slots',
  // #swagger.tags = ['Competitions']
  // #swagger.description = 'ตรวจสอบจำนวนที่ว่าง'
  controller.getSlots
);

router.get('/:id/players',
  // #swagger.tags = ['Competitions']
  // #swagger.description = 'ดึงรายชื่อผู้สมัครในรายการนี้'
  controller.getCompetitionPlayers
);

router.post('/',
  auth, 
  // #swagger.tags = ['Competitions']
  // #swagger.description = 'สร้างรายการแข่งขันใหม่ (ต้องล็อกอินก่อน)'
  controller.createCompetition
);

router.post('/:id/join',
  auth,
  // #swagger.tags = ['Competitions']
  // #swagger.description = 'ลงสมัครเข้าร่วมการแข่งขัน'
  controller.joinCompetition
);

router.delete('/:id/join',
  auth,
  // #swagger.tags = ['Competitions']
  // #swagger.description = 'ยกเลิกการสมัครเข้าร่วมการแข่งขัน'
  controller.cancelJoinCompetition
);

router.put('/:id',
  auth,
  // #swagger.tags = ['Competitions']
  // #swagger.description = 'แก้ไขข้อมูลการแข่งขัน (ต้องล็อกอินก่อน)'
  controller.updateCompetition
);

router.delete('/:id',
  auth,
  // #swagger.tags = ['Competitions']
  // #swagger.description = 'ลบรายการแข่งขัน (ต้องล็อกอินก่อน)'
  controller.deleteCompetition
);

module.exports = router;