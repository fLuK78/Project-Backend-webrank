const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET / - ดึงประวัติการสมัครแข่งของผู้ใช้งาน (จาก Token)
exports.getPlayerHistory = async (req, res) => {
  try {
    const userId = req.user.id; 

    const history = await prisma.registration.findMany({
      where: { userId: userId },
      include: {
        competition: {
          select: {
            id: true,
            name: true,
            date: true,
            image: true,
            maxPlayer: true
          }
        },
        payment: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      status: "success",
      total: history.length,
      data: history
    });
  } catch (error) {
    console.error("Fetch History Error:", error);
    res.status(500).json({ status: "error", message: "ไม่สามารถดึงข้อมูลประวัติได้" });
  }
};

// PUT /:id/cancel - ยกเลิกรายการสมัครโดยผู้แข่งขันเอง
exports.cancelHistory = async (req, res) => {
  const registrationId = parseInt(req.params.id, 10);
  const userIdFromToken = req.user.id;

  if (isNaN(registrationId)) {
    return res.status(400).json({ status: "error", message: "ID ไม่ถูกต้อง" });
  }

  try {
    const updateResult = await prisma.registration.updateMany({
      where: {
        id: registrationId,
        userId: userIdFromToken,
        status: { in: ["pending", "waiting_payment"] } 
      },
      data: {
        status: "cancelled"
      }
    });

    if (updateResult.count === 0) {
      return res.status(404).json({ 
        status: "error", 
        message: "ไม่พบรายการที่สามารถยกเลิกได้ หรือคุณไม่มีสิทธิ์ในรายการนี้" 
      });
    }

    res.json({
      status: "success",
      message: "ยกเลิกการสมัครของคุณเรียบร้อยแล้ว"
    });
  } catch (error) {
    console.error("Cancel Error:", error);
    res.status(500).json({ status: "error", message: "เกิดข้อผิดพลาดในการยกเลิก" });
  }
};