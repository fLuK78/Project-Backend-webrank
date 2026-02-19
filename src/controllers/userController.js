const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('รองรับเฉพาะไฟล์รูปภาพเท่านั้น!'), false);
  }
};

exports.upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// GET /users - ดึงรายชื่อผู้ใช้ทั้งหมด (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, username: true, name: true, email: true,
        image: true, role: true, createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ status: 'success', data: users });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้' });
  }
};

// POST /users - สร้างผู้ใช้ใหม่โดย Admin
exports.createUser = async (req, res) => {
  const { username, name, email, password, phone, role } = req.body;
  if (!username || !name || !email || !password) {
    return res.status(400).json({ status: 'error', message: 'ข้อมูลไม่ครบถ้วน' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { username, name, email, password: hashedPassword, phone, role: role || 'User' },
      select: { id: true, username: true, name: true, email: true, role: true }
    });
    res.status(201).json({ status: 'success', message: 'สร้างผู้ใช้สำเร็จ', data: newUser });
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ status: 'error', message: 'Username หรือ Email ซ้ำ' });
    res.status(500).json({ status: 'error', message: 'ไม่สามารถสร้างผู้ใช้ได้' });
  }
};

// GET /users/:id - ดูรายละเอียดผู้ใช้รายบุคคล
exports.getUserById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ status: 'error', message: 'ID ไม่ถูกต้อง' });

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, name: true, email: true, phone: true, role: true, image: true, createdAt: true, bio: true, location: true, socialLink: true }
    });
    if (!user) return res.status(404).json({ status: 'error', message: 'ไม่พบผู้ใช้' });
    res.json({ status: 'success', data: user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server Error' });
  }
};

// PUT /users/:id - แก้ไขข้อมูลผู้ใช้โดย Admin
exports.updateUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const updateData = {};
    const allowedFields = ['name', 'email', 'role', 'phone', 'image'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });
    if (req.body.password) updateData.password = await bcrypt.hash(req.body.password, 10);

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, username: true, name: true, email: true, role: true, image: true, phone: true }
    });
    res.json({ status: 'success', data: updated });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// DELETE /users/:id - ลบผู้ใช้
exports.deleteUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ status: 'error', message: 'ไม่พบผู้ใช้ที่ต้องการลบ' });

    await prisma.user.delete({ where: { id } });
    res.json({ status: 'success', message: 'ลบผู้ใช้เรียบร้อยแล้ว' });
  } catch (error) {
    console.error("🔥 Delete Error:", error);
    if (error.code === 'P2003') {
      return res.status(400).json({ status: 'error', message: 'ไม่สามารถลบได้เนื่องจากผู้ใช้นี้มีข้อมูลเชื่อมโยงกับส่วนอื่น' });
    }
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

// PUT /profile - อัปเดตข้อมูลโปรไฟล์ตนเอง (รองรับรูปภาพ)
exports.updateProfile = async (req, res) => {
  try {
    const userId = parseInt(req.user?.id || req.user?.userId || req.user?.sub, 10);
    if (isNaN(userId)) return res.status(400).json({ status: 'error', message: 'ID ผู้ใช้ไม่ถูกต้อง' });

    const body = req.body || {};
    const { name, phone, bio, location, socialLink, password } = body;

    let imageUrl = body.image;
    if (req.file) {
      const baseUrl = process.env.API_URL || 'https://arena-tournament.onrender.com';
      imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }

    const dataToUpdate = { name, phone, bio, location, socialLink, image: imageUrl };

    if (password && password.trim() !== "") {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true, username: true, name: true, email: true,
        image: true, role: true, phone: true, bio: true,
        location: true, socialLink: true
      }
    });

    res.json({ status: 'success', message: 'อัปเดตสำเร็จ', data: updatedUser });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// GET /profile - ดึงข้อมูลโปรไฟล์ตนเอง
exports.getProfile = async (req, res) => {
  try {
    const userId = parseInt(req.user.id || req.user.userId, 10);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, name: true, email: true, image: true, role: true, phone: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ status: 'error', message: 'ไม่พบผู้ใช้' });
    res.json({ status: 'success', data: user });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Server Error' });
  }
};