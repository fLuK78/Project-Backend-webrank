const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { username, name, email, password } = req.body;

    if (!username || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน",
        missing: { username: !!username, name: !!name, email: !!email, password: !!password }
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" 
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.trim().toLowerCase() },
          { username: username.trim() }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "อีเมลหรือชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: 'Player'
      }
    });

    res.status(201).json({
      success: true,
      message: "สมัครสมาชิกสำเร็จ",
      userId: newUser.id
    });

  } catch (err) {
    console.error("REGISTER_ERROR:", err);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
      error: err.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "กรุณากรอกอีเมลและรหัสผ่าน" });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบบัญชีผู้ใช้นี้ในระบบ โปรดตรวจสอบอีเมลหรือสมัครสมาชิกใหม่"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "รหัสผ่านไม่ถูกต้อง โปรดลองอีกครั้ง"
      });
    }

    const secret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign(
      { id: user.id, role: user.role },
      secret,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image
      }
    });

  } catch (err) {
    console.error("LOGIN_ERROR:", err);
    res.status(500).json({
      success: false,
      message: "ระบบล็อกอินขัดข้อง: " + err.message
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const idFromToken = req.user.id || req.user.userId || req.user.sub;
    const userId = parseInt(idFromToken, 10);
    const { name, image } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: "ID จาก Token ไม่ถูกต้อง" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name?.trim() || undefined,
        image: image || undefined
      },
    });

    res.json({
      success: true,
      message: "อัปเดตโปรไฟล์เรียบร้อย",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        image: updatedUser.image,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });

  } catch (err) {
    console.error("UPDATE_PROFILE_ERROR:", err);
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูลผู้ใช้ในระบบ" });
    }
    res.status(500).json({ success: false, message: "แก้ไขไม่สำเร็จ: " + err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: "ID ไม่ถูกต้อง" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูลผู้ใช้" });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (err) {
    console.error("GET_USER_ERROR:", err);
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
};