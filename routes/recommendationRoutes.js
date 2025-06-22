// routes/recommendationRoutes.js
const express = require('express');
const router = express.Router(); // ✅ FIX untuk error-mu
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  const user = req.session.user;
  if (!user || !user.faculty) return res.redirect('/login');

  try {
    const items = await prisma.item.findMany({
      where: {
        user: {
          faculty: user.faculty, // hanya item dari fakultas yang sama
        },
        isAvailable: true,
        isActive: true,
        NOT: { userId: user.id },
      },
      include: {
        itemImages: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.render('recommendations/recommendations', { items });
  } catch (error) {
    console.error("❌ Gagal mengambil rekomendasi:", error);
    res.status(500).send("Terjadi kesalahan saat mengambil data.");
  }
});

module.exports = router;
