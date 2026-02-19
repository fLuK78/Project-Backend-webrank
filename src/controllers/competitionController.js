const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET / - ดึงรายการแข่งขันทั้งหมด
exports.getCompetitions = async (req, res) => {
  try {
    const { keyword, minPlayer, sort, order } = req.query;
    const where = {};
    if (keyword) where.name = { contains: keyword, mode: 'insensitive' };
    if (minPlayer) where.maxPlayer = { gte: parseInt(minPlayer, 10) };

    const competitions = await prisma.competition.findMany({
      where,
      orderBy: { [sort || 'createdAt']: order === 'desc' ? 'desc' : 'asc' },
      include: { _count: { select: { registrations: true } } }
    });
    res.json({ status: 'success', total: competitions.length, data: competitions });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

// GET /:id - ดึงข้อมูลการแข่งขันตาม ID
exports.getCompetitionById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ status: 'error', message: 'ID ไม่ถูกต้อง' });
  try {
    const data = await prisma.competition.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } }
    });
    if (!data) return res.status(404).json({ status: 'error', message: 'ไม่พบรายการแข่งขัน' });
    res.json({ status: 'success', data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'เซิร์ฟเวอร์ขัดข้อง' });
  }
};

// GET /:id/players - ดึงรายชื่อผู้สมัครในรายการนั้นๆ
exports.getCompetitionPlayers = async (req, res) => {
  const compId = parseInt(req.params.id, 10);
  try {
    const competition = await prisma.competition.findUnique({
      where: { id: compId },
      include: {
        registrations: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } }
          }
        }
      }
    });
    if (!competition) return res.status(404).json({ success: false, message: 'ไม่พบการแข่งขัน' });
    
    res.json({
      success: true,
      data: competition.registrations.map(r => ({ id: r.user.id, regId: r.id, status: r.status, ...r.user }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'ดึงข้อมูลไม่สำเร็จ' });
  }
};

// POST /:id/join - ลงชื่อสมัครเข้าแข่งขัน
exports.joinCompetition = async (req, res) => {
  const compId = parseInt(req.params.id, 10);
  const userId = req.user.id; 
  try {
    const competition = await prisma.competition.findUnique({
      where: { id: compId },
      include: { _count: { select: { registrations: true } } }
    });
    if (!competition) return res.status(404).json({ success: false, message: 'ไม่พบรายการแข่งขัน' });
    if (competition._count.registrations >= competition.maxPlayer) {
      return res.status(400).json({ success: false, message: 'ขออภัย รายการนี้เต็มแล้ว' });
    }

    await prisma.registration.create({
      data: { userId, competitionId: compId, status: "pending" }
    });
    res.status(200).json({ success: true, message: "ลงสมัครสำเร็จ! รอการอนุมัติ" });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'คุณสมัครไปแล้ว' });
    res.status(500).json({ success: false, message: 'เซิร์ฟเวอร์ขัดข้อง' });
  }
};

// DELETE /:id/join - ยกเลิกการสมัครเข้าแข่งขัน
exports.cancelJoinCompetition = async (req, res) => {
  const compId = parseInt(req.params.id, 10);
  const userId = req.user.id;
  try {
    const deleted = await prisma.registration.deleteMany({
      where: { competitionId: compId, userId: userId }
    });
    if (deleted.count === 0) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการสมัคร' });
    res.json({ success: true, message: 'ยกเลิกการสมัครเรียบร้อยแล้ว' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'ไม่สามารถยกเลิกได้' });
  }
};

// GET /:id/slots - ตรวจสอบจำนวนที่ว่าง
exports.getSlots = async (req, res) => {
  const compId = parseInt(req.params.id, 10);
  try {
    const comp = await prisma.competition.findUnique({
      where: { id: compId },
      include: { _count: { select: { registrations: true } } }
    });
    const booked = comp._count.registrations;
    res.json({ status: 'success', maxPlayer: comp.maxPlayer, booked, remaining: comp.maxPlayer - booked });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'ตรวจสอบไม่ได้' });
  }
};

// PUT /:id - แก้ไขข้อมูลการแข่งขัน
exports.updateCompetition = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const { name, date, maxPlayer, rules, prize, description, image, location } = req.body;
    const updated = await prisma.competition.update({
      where: { id },
      data: { 
        name, 
        rules, 
        prize, 
        description, 
        image,
        date: date ? new Date(date) : undefined, 
        maxPlayer: maxPlayer ? parseInt(maxPlayer, 10) : undefined 
      }
    });
    res.json({ status: 'success', data: updated });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ status: 'error', message: 'แก้ไขไม่ได้' });
  }
};

// DELETE /:id - ลบรายการการแข่งขัน
exports.deleteCompetition = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    await prisma.competition.delete({ where: { id } });
    res.json({ status: 'success', message: 'ลบเรียบร้อย' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'ลบไม่ได้' });
  }
};

// POST / - สร้างรายการการแข่งขันใหม่
exports.createCompetition = async (req, res) => {
  // 1. เพิ่ม detail เข้าไปในการดึงค่าจาก req.body
  const { name, date, maxPlayer, rules, prize, description, image, detail } = req.body;
  
  if (!name || !date || maxPlayer === undefined) {
    return res.status(400).json({ status: 'error', message: 'ข้อมูลไม่ครบ' });
  }

  try {
    const newComp = await prisma.competition.create({
      data: { 
        name, 
        date: new Date(date), 
        maxPlayer: parseInt(maxPlayer, 10), 
        rules: rules || null, 
        prize: prize || null, 
        description: description || null,
        detail: detail || null, 
        image: image || null,
      }
    });
    res.status(201).json({ status: 'success', data: newComp });
  } catch (error) {
    console.error("Create Error:", error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถสร้างได้' });
  }
};

// PUT /api/approvals/:id/approve - อนุมัติผู้สมัครโดย Admin
exports.approveRegistration = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { adminNote } = req.body;
  const adminId = req.user.id;

  try {
    const result = await prisma.registration.update({
      where: { id },
      data: { 
        status: 'approved',
        adminId: adminId, 
        adminNote: adminNote || 'อนุมัติโดยระบบ'
      }
    });
    res.json({ status: 'success', message: 'อนุมัติการลงทะเบียนเรียบร้อย', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'ไม่สามารถอนุมัติได้' });
  }
};

// PUT /api/approvals/:id/reject - ปฏิเสธผู้สมัครโดย Admin
exports.rejectRegistration = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { adminNote } = req.body;
  const adminId = req.user.id;

  try {
    const result = await prisma.registration.update({
      where: { id },
      data: { 
        status: 'rejected',
        adminId: adminId,
        adminNote: adminNote || 'ไม่ผ่านเกณฑ์การตรวจสอบ'
      }
    });
    res.json({ status: 'success', message: 'ปฏิเสธการลงทะเบียนเรียบร้อย', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'ไม่สามารถดำเนินการได้' });
  }
};