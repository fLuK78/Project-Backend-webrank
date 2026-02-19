const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// PUT /registrations/:id/approve - อนุมัติการลงทะเบียน
exports.approveRegistration = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { adminId, note } = req.body; 

  try {
    const result = await prisma.registration.update({
      where: { id },
      data: { 
        status: 'approved',
        adminId: adminId ? parseInt(adminId, 10) : null,
        adminNote: note
      }
    });

    res.json({ status: 'success', message: 'อนุมัติเรียบร้อย', data: result });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ status: 'error', message: 'ไม่พบรหัสการลงทะเบียน' });
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด' });
  }
};

// PUT /registrations/:id/reject - ปฏิเสธการลงทะเบียน
exports.rejectRegistration = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({
      status: 'error',
      message: 'ID ไม่ถูกต้อง'
    });
  }

  try {
    const result = await prisma.registration.update({
      where: { id },
      data: { status: 'rejected' }
    });

    res.json({
      status: 'success',
      message: 'ปฏิเสธการลงทะเบียนเรียบร้อย',
      data: result
    });
  } catch (error) {
    console.error('Error rejecting registration:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        status: 'error',
        message: 'ไม่พบรหัสการลงทะเบียนนี้'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถปฏิเสธการลงทะเบียนได้'
    });
  }
};
