const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /payments/submit - User ส่งหลักฐานชำระเงิน
exports.processPayment = async (req, res) => {
  try {
    const { registrationId, amount, method } = req.body;
    // ดึงชื่อไฟล์จาก multer (ที่ส่งมาจาก route)
    const slipImage = req.file ? req.file.filename : null;

    if (!registrationId || !amount || !slipImage) {
      return res.status(400).json({
        status: 'error',
        message: 'ข้อมูลไม่ครบถ้วน',
        detail: 'ต้องมี registrationId, amount และรูปสลิป'
      });
    }

    const regId = parseInt(registrationId, 10);
    const payAmount = parseFloat(amount);

    // ใช้ upsert เพื่อป้องกันการสร้าง Payment ซ้ำซ้อน (กรณี User ส่งสลิปใหม่)
    const payment = await prisma.payment.upsert({
      where: { registrationId: regId },
      update: {
        amount: payAmount,
        method: method || "Transfer",
        slipImage: slipImage,
        status: "PENDING" // ทุกครั้งที่ส่งใหม่ สถานะจะกลับเป็นรอตรวจ
      },
      create: {
        registrationId: regId,
        amount: payAmount,
        method: method || "Transfer",
        slipImage: slipImage,
        status: "PENDING"
      }
    });

    // อัปเดตสถานะใน Registration เป็น 'waiting' (รอตรวจสอบ)
    await prisma.registration.update({
      where: { id: regId },
      data: { status: 'waiting' }
    });

    res.status(201).json({
      status: 'success',
      message: 'ส่งหลักฐานชำระเงินเรียบร้อย รอแอดมินตรวจสอบ',
      data: payment
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  }
};

// PATCH /payments/verify/:id - Admin ตรวจสอบสลิป
exports.verifyPayment = async (req, res) => {
  const { id } = req.params; // paymentId
  const { status, adminNote } = req.body; // status: 'VERIFIED' หรือ 'REJECTED'

  try {
    const payment = await prisma.payment.update({
      where: { id: parseInt(id) },
      data: { status: status },
      include: { registration: true }
    });

    // อัปเดตสถานะการสมัครตามผลการตรวจเงิน
    await prisma.registration.update({
      where: { id: payment.registrationId },
      data: { 
        status: status === 'VERIFIED' ? 'confirmed' : 'rejected',
        adminNote: adminNote || (status === 'VERIFIED' ? 'ชำระเงินเรียบร้อย' : 'สลิปไม่ถูกต้อง')
      }
    });

    res.json({
      status: 'success',
      message: `ยืนยันสถานะเป็น ${status} เรียบร้อย`
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'ไม่สามารถอัปเดตสถานะได้' });
  }
};

// GET /payments/pending - Admin ดึงสลิปที่รอตรวจทั้งหมด
exports.getPendingPayments = async (req, res) => {
  try {
    const pendingList = await prisma.payment.findMany({
      where: { status: "PENDING" },
      include: {
        registration: {
          include: {
            user: { select: { name: true, username: true, phone: true } },
            competition: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ status: 'success', data: pendingList });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงข้อมูลได้' });
  }
};

// GET /payments/:paymentId - ดูรายละเอียด (คงเดิม)
exports.getPaymentDetail = async (req, res) => {
  const paymentId = parseInt(req.params.paymentId, 10);
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { registration: { include: { user: true, competition: true } } }
    });

    if (!payment) return res.status(404).json({ status: 'error', message: 'ไม่พบข้อมูล' });

    res.json({ status: 'success', data: payment });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error fetching detail' });
  }
};