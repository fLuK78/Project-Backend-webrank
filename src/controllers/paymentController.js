const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /payments - ชำระเงิน
exports.processPayment = async (req, res) => {
  const { registrationId, amount, method } = req.body;

  if (!registrationId || amount === undefined || !method) {
    return res.status(400).json({
      status: 'error',
      message: 'ข้อมูลไม่ครบถ้วน',
      error: { detail: 'registrationId, amount และ method เป็นข้อมูลที่จำเป็น' }
    });
  }

  const regId = parseInt(registrationId, 10);
  const payAmount = parseFloat(amount);

  if (isNaN(regId) || isNaN(payAmount)) {
    return res.status(400).json({
      status: 'error',
      message: 'ข้อมูลไม่ถูกต้อง'
    });
  }

  try {
    const payment = await prisma.payment.create({
      data: {
        registrationId: regId,
        amount: payAmount,
        method
      }
    });

    await prisma.registration.update({
      where: { id: regId },
      data: { status: 'paid' }
    });

    res.status(201).json({
      status: 'success',
      message: 'ชำระเงินสำเร็จ',
      data: payment
    });
  } catch (error) {
    console.error('Error processing payment:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        status: 'error',
        message: 'ไม่พบข้อมูลการลงทะเบียน'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดำเนินการชำระเงินได้'
    });
  }
};

// GET /payments/:paymentId - ดูรายละเอียดการชำระเงิน
exports.getPaymentDetail = async (req, res) => {
  const paymentId = parseInt(req.params.paymentId, 10);

  if (isNaN(paymentId)) {
    return res.status(400).json({
      status: 'error',
      message: 'ID ไม่ถูกต้อง'
    });
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'ไม่พบข้อมูลการจ่ายเงิน'
      });
    }

    res.json({
      status: 'success',
      data: payment
    });
  } catch (error) {
    console.error('Error fetching payment detail:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลการจ่ายเงินได้'
    });
  }
};
