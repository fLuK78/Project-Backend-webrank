const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getCompetitions = async (req, res) => {
  try {
    const competitions = await prisma.competition.findMany();
    res.json({ status: 'success', data: competitions });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getCompetitionById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const competition = await prisma.competition.findUnique({ where: { id } });
    if (!competition) return res.status(404).json({ status: 'error', message: 'ไม่พบข้อมูล' });
    res.json({ status: 'success', data: competition });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getSlots = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const competition = await prisma.competition.findUnique({ 
        where: { id },
        include: { _count: { select: { registrations: true } } } 
    });
    if (!competition) return res.status(404).json({ status: 'error', message: 'ไม่พบข้อมูล' });
    
    const available = competition.maxPlayer - competition._count.registrations;
    res.json({ status: 'success', availableSlots: available });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.createCompetition = async (req, res) => {
  const { name, date, maxPlayer, detail } = req.body;
  try {
    const newComp = await prisma.competition.create({
      data: {
        name,
        date: new Date(date),
        maxPlayer: parseInt(maxPlayer),
        detail
      }
    });
    res.status(201).json({ status: 'success', data: newComp });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updateCompetition = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, date, maxPlayer, detail } = req.body;
    const updated = await prisma.competition.update({
      where: { id },
      data: {
        name,
        date: date ? new Date(date) : undefined,
        maxPlayer: maxPlayer ? parseInt(maxPlayer) : undefined,
        detail
      }
    });
    res.json({ status: 'success', data: updated });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.deleteCompetition = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.competition.delete({ where: { id } });
    res.json({ status: 'success', message: 'ลบสำเร็จ' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};