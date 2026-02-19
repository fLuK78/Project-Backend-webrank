const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET / - ดึงประวัติการสมัครแข่งขันของผู้ใช้งาน
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id; 
    const history = await prisma.registration.findMany({
      where: { userId: userId },
      include: { 
        competition: true,
        payment: true 
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error("Fetch History Error:", error);
    res.status(500).json({ success: false, message: "โหลดข้อมูลประวัติไม่สำเร็จ" });
  }
};

// PATCH /:registrationId/cancel - ยกเลิกการสมัครแข่งขัน (เปลี่ยนสถานะเป็น cancelled)
exports.cancelRegistration = async (req, res) => {
  const { registrationId } = req.params;
  const userId = req.user.id; 

  try {
    const registration = await prisma.registration.findUnique({
      where: { id: parseInt(registrationId) }
    });

    if (!registration) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูลการสมัคร" });
    }

    if (registration.userId !== userId) {
      return res.status(403).json({ success: false, message: "คุณไม่มีสิทธิ์จัดการรายการนี้" });
    }

    await prisma.registration.update({
      where: { id: parseInt(registrationId) },
      data: { status: "cancelled" }
    });

    res.status(200).json({ success: true, message: "ยกเลิกการสมัครเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("Cancel Error:", error);
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดที่ Server" });
  }
};