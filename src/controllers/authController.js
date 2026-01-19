const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password, 
                role: role || "Player"
            }
        });
        res.status(201).json({ status: "success", data: newUser });
    } catch (error) {
        res.status(400).json({ status: "error", message: "อีเมลนี้ถูกใช้ไปแล้วหรือข้อมูลไม่ถูกต้อง" });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (user && user.password === password) {
            res.json({ status: "success", message: "เข้าสู่ระบบสำเร็จ", user });
        } else {
            res.status(401).json({ status: "error", message: "อีเมลหรือรหัสผ่านผิด" });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });
        res.json({ status: "success", data: users });
    } catch (error) {
        // แก้ตรงนี้เพื่อให้รู้ว่าทำไมถึงดึงไม่ได้
        res.status(500).json({ status: "error", message: error.message });
    }
};