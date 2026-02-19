const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST / - ลงทะเบียนแข่งขัน (Re-activate ได้ถ้าเคยยกเลิก)
exports.registerCompetition = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ status: 'error', message: 'กรุณาเข้าสู่ระบบใหม่' });
    }

    const { competitionId } = req.body;
    const uId = Number(req.user.id);
    const cId = Number(competitionId);

    if (!cId || isNaN(cId)) {
      return res.status(400).json({ status: 'error', message: 'ID รายการแข่งขันไม่ถูกต้อง' });
    }

    const competition = await prisma.competition.findUnique({
      where: { id: cId },
      include: {
        registrations: {
          where: { status: { not: 'cancelled' } }
        }
      }
    });

    if (!competition) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบรายการแข่งขันนี้' });
    }

    const now = new Date();
    if (competition.endDate && now > new Date(competition.endDate)) {
      return res.status(400).json({ status: 'error', message: 'ขออภัย รายการนี้ปิดรับสมัครแล้ว' });
    }

    if (competition.maxPlayer > 0 && competition.registrations.length >= competition.maxPlayer) {
      return res.status(400).json({ status: 'error', message: 'ขออภัย จำนวนผู้สมัครเต็มแล้ว' });
    }

    const existing = await prisma.registration.findFirst({
      where: { userId: uId, competitionId: cId }
    });

    if (existing) {
      if (existing.status !== 'cancelled') {
        return res.status(409).json({ 
          status: 'error', 
          message: 'คุณได้สมัครรายการนี้ไปแล้ว',
          data: existing 
        });
      }

      const updated = await prisma.registration.update({
        where: { id: existing.id },
        data: {
          status: 'pending',
          createdAt: new Date()
        }
      });
      return res.status(200).json({ status: 'success', message: 'กลับเข้าสู่การสมัครสำเร็จ', data: updated });
    }

    const result = await prisma.registration.create({
      data: {
        userId: uId,
        competitionId: cId,
        status: 'pending'
      }
    });

    return res.status(201).json({ status: 'success', message: 'ลงทะเบียนสำเร็จ', data: result });

  } catch (error) {
    console.error("🔥 [Registration Error]:", error);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดภายในระบบ' });
  }
};

// GET /my-history - ดูประวัติตัวเอง (รายการที่ยกเลิกจะถูกกรองออก)
exports.getPlayerHistory = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    if (isNaN(userId)) return res.status(400).json({ status: 'error', message: 'User ID ไม่ถูกต้อง' });

    const history = await prisma.registration.findMany({
      where: { 
        userId: userId,
        status: { not: 'cancelled' }
      },
      include: { competition: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ status: 'success', total: history.length, data: history });
  } catch (error) {
    console.error("🔥 [History Error]:", error);
    res.status(500).json({ status: 'error', message: 'ดึงข้อมูลไม่สำเร็จ' });
  }
};

// GET /:competitionId/participants - ดูรายชื่อผู้สมัครในรายการ (เฉพาะสถานะที่ถูกต้อง)
exports.getCompetitionParticipants = async (req, res) => {
  const competitionId = Number(req.params.competitionId);
  if (isNaN(competitionId)) return res.status(400).json({ status: 'error', message: 'ID การแข่งขันไม่ถูกต้อง' });

  try {
    const participants = await prisma.registration.findMany({
      where: {
        competitionId,
        status: { in: ['approved', 'paid', 'pending'] } 
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true }
        }
      },
      orderBy: { createdAt: 'asc' } 
    });

    res.json({ status: 'success', total: participants.length, data: participants });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'โหลดรายชื่อไม่สำเร็จ' });
  }
};

// PATCH /:id/cancel - ยกเลิกการสมัคร
exports.cancelRegistration = async (req, res) => {
  const id = Number(req.params.id);
  const userId = Number(req.user.id);

  try {
    const entry = await prisma.registration.findUnique({ where: { id } });
    if (!entry) return res.status(404).json({ status: 'error', message: 'ไม่พบข้อมูล' });

    if (entry.userId !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({ status: 'error', message: 'ไม่มีสิทธิ์ทำรายการนี้' });
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: { status: 'cancelled' }
    });

    res.json({ status: 'success', message: 'ยกเลิกการสมัครแล้ว', data: updated });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'ยกเลิกไม่สำเร็จ' });
  }
};

// Helper function สำหรับตรวจสอบสิทธิ์ Admin
const checkAdmin = (req, res) => {
  if (req.user.role !== 'Admin') {
    res.status(403).json({ status: 'error', message: 'เฉพาะ Admin เท่านั้น' });
    return false;
  }
  return true;
};

// Admin Actions: อนุมัติการสมัคร
exports.approveRegistration = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const result = await prisma.registration.update({
      where: { id: Number(req.params.id) },
      data: { status: 'approved' }
    });
    res.json({ status: 'success', message: 'อนุมัติเรียบร้อย', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'ดำเนินการไม่สำเร็จ' });
  }
};

// Admin Actions: ปฏิเสธการสมัคร
exports.rejectRegistration = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const result = await prisma.registration.update({
      where: { id: Number(req.params.id) },
      data: { status: 'rejected' }
    });
    res.json({ status: 'success', message: 'ปฏิเสธเรียบร้อย', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'ดำเนินการไม่สำเร็จ' });
  }
};

// Admin Actions: อัปเดตสถานะแบบกำหนดเอง
exports.updateStatus = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  const { status } = req.body;
  const validStatus = ['approved', 'rejected', 'pending', 'cancelled'];
  if (!validStatus.includes(status)) return res.status(400).json({ status: 'error', message: 'สถานะไม่ถูกต้อง' });

  try {
    const updated = await prisma.registration.update({
      where: { id: Number(req.params.id) },
      data: { status }
    });
    res.json({ status: 'success', message: 'อัปเดตสถานะสำเร็จ', data: updated });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'อัปเดตไม่สำเร็จ' });
  }
};

// Admin Actions: ดูรายการลงทะเบียนทั้งหมดในระบบ
exports.getAllRegistrations = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const data = await prisma.registration.findMany({
      include: {
        user: { select: { id: true, name: true, username: true } },
        competition: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ status: 'success', data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'โหลดข้อมูลไม่สำเร็จ' });
  }
};