// routes/recommendationRoutes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect('/login');

  try {
    const items = await prisma.item.findMany({
      where: {
        user: {
          is: { faculty: user.faculty }
        },
        isAvailable: true,
        isActive: true,
        NOT: { userId: user.id }
      },
      include: { itemImages: true }
    });

    res.render('recommendations/recommendations', { items });

  } catch (err) {
    console.error("❌ Gagal render:", err);
    res.status(500).send("Terjadi kesalahan.");
  }
});

module.exports = router;
