exports.register = (req, res) => {
    res.status(201).json({ 
        message: "ลงทะเบียนผู้ใช้งานใหม่สำเร็จ",
        user: req.body.email 
    });
};

exports.login = (req, res) => {
    res.status(200).json({ 
        message: "เข้าสู่ระบบสำเร็จ",
    });
};