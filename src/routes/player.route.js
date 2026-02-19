const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const { protect } = require('../middleware/authMiddleware');


// GET: /api/players/:userId/history
// #swagger.tags = ['Players']
// #swagger.description = 'ดูประวัติการสมัครของผู้เล่น (รายคน)'
router.get('/:userId/history', protect, playerController.getHistory);

// DELETE: /api/players/history/:registrationId
// #swagger.tags = ['Players']
// #swagger.description = 'ยกเลิกการสมัครในประวัติ (เปลี่ยนสถานะเป็น cancelled)'
router.delete('/history/:registrationId', protect, playerController.cancelRegistration);

module.exports = router;