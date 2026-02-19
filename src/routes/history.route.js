const express = require("express");
const app = express();
const controller = require("../controllers/historyController");

app.get("/:playerId/history",
  // #swagger.tags = ['History']
  // #swagger.description = 'ดูประวัติการสมัครของผู้เล่น (รายคน)'
  controller.getPlayerHistory
);

app.put("/history/:id",
  // #swagger.tags = ['History']
  // #swagger.description = 'ยกเลิกการสมัครในประวัติ (เปลี่ยนสถานะเป็น cancelled)'
  controller.cancelHistory
);

module.exports = app;
