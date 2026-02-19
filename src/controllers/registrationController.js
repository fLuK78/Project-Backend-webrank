const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

    const result = await prisma.$transaction(async (tx) => {
      const competition = await tx.competition.findUnique({
        where: { id: cId },
        include: {
          _count: {
            select: { registrations: { where: { status: { not: 'cancelled' } } } }
          }
        }
      });

      if (!competition) throw new Error('NOT_FOUND');

      const now = new Date();
      if (competition.endDate && now > new Date(competition.endDate)) {
        throw new Error('CLOSED');
      }

      if (competition.maxPlayer > 0 && competition._count.registrations >= competition.maxPlayer) {
        throw new Error('FULL');
      }

      const existing = await tx.registration.findFirst({
        where: { userId: uId, competitionId: cId }
      });

      if (existing) {
        if (existing.status !== 'cancelled') {
          throw new Error('ALREADY_EXISTS');
        }
        
        return await tx.registration.update({
          where: { id: existing.id },
          data: {
            status: 'pending',
            createdAt: new Date()
          }
        });
      }

      return await tx.registration.create({
        data: {
          userId: uId,
          competitionId: cId,
          status: 'pending'
        }
      });
    });

    return res.status(201).json({ status: 'success', message: 'ลงทะเบียนสำเร็จ', data: result });

  } catch (error) {
    console.error("🔥 [Registration Error]:", error);
    
    if (error.message === 'NOT_FOUND') return res.status(404).json({ status: 'error', message: 'ไม่พบรายการแข่งขันนี้' });
    if (error.message === 'CLOSED') return res.status(400).json({ status: 'error', message: 'ขออภัย รายการนี้ปิดรับสมัครแล้ว' });
    if (error.message === 'FULL') return res.status(400).json({ status: 'error', message: 'ขออภัย จำนวนผู้สมัครเต็มแล้ว' });
    if (error.message === 'ALREADY_EXISTS') return res.status(409).json({ status: 'error', message: 'คุณได้สมัครรายการนี้ไปแล้ว' });

    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดภายในระบบ' });
  }
};

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

exports.getCompetitionParticipants = async (req, res) => {
  const competitionId = Number(req.params.competitionId);
  if (isNaN(competitionId)) return res.status(400).json({ status: 'error', message: 'ID การแข่งขันไม่ถูกต้อง' });

  try {
    const participants = await prisma.registration.findMany({
      where: {
        competitionId,
        status: { in: ['approved', 'paid', 'pending', 'waiting', 'rejected'] } 
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

exports.cancelRegistration = async (req, res) => {
  const id = Number(req.params.id);
  const userId = Number(req.user.id);

  try {
    const entry = await prisma.registration.findUnique({ where: { id } });
    if (!entry) return res.status(404).json({ status: 'error', message: 'ไม่พบข้อมูล' });

    // ตรวจสอบสิทธิ์: ต้องเป็นเจ้าของ หรือ Admin
    if (entry.userId !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({ status: 'error', message: 'ไม่มีสิทธิ์ทำรายการนี้' });
    }

    // ห้ามยกเลิกถ้าจ่ายเงินหรืออนุมัติแล้ว
    if (entry.status === 'approved' || entry.status === 'paid') {
      return res.status(400).json({ status: 'error', message: 'ไม่สามารถยกเลิกรายการที่อนุมัติแล้วได้' });
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: { status: 'cancelled' } // เปลี่ยนเป็น cancelled เพื่อให้หลุดจาก list
    });

    res.json({ status: 'success', message: 'ยกเลิกการสมัครแล้ว', data: updated });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'ยกเลิกไม่สำเร็จ' });
  }
};

exports.cancelRegistration = async (req, res) => {
  const id = Number(req.params.id);
  const userId = Number(req.user.id);

  try {
    const entry = await prisma.registration.findUnique({ where: { id } });
    if (!entry) return res.status(404).json({ status: 'error', message: 'ไม่พบข้อมูล' });

    if (entry.userId !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({ status: 'error', message: 'ไม่มีสิทธิ์ทำรายการนี้' });
    }

    if (entry.status === 'approved' || entry.status === 'paid') {
      return res.status(400).json({ status: 'error', message: 'ไม่สามารถยกเลิกรายการที่อนุมัติแล้วได้ กรุณาติดต่อทีมงาน' });
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

const checkAdmin = (req, res) => {
  if (req.user.role !== 'Admin') {
    res.status(403).json({ status: 'error', message: 'เฉพาะ Admin เท่านั้น' });
    return false;
  }
  return true;
};

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

exports.rejectRegistration = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const result = await prisma.registration.update({
      where: { id: Number(req.params.id) },
      data: { status: 'rejected' }
    });
    res.json({ status: 'success', message: 'ปฏิเสธการสมัครเรียบร้อย', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'ดำเนินการไม่สำเร็จ' });
  }
};

exports.updateStatus = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  const { status } = req.body;
  const validStatus = ['approved', 'rejected', 'pending', 'cancelled', 'waiting', 'paid'];
  
  if (!validStatus.includes(status)) {
    return res.status(400).json({ status: 'error', message: 'สถานะไม่ถูกต้อง' });
  }

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

exports.getAllRegistrations = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const data = await prisma.registration.findMany({
      include: {
        user: { select: { id: true, name: true, username: true, email: true } },
        competition: { select: { id: true, name: true, price: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ status: 'success', data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'โหลดข้อมูลไม่สำเร็จ' });
  }
};