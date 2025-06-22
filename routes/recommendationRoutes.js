// routes/recommendationRoutes.js
const express = require('express');
const router = express.Router(); // ✅ FIX untuk error-mu
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const recommendationController = require('../controllers/recommendationController');

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

    res.render('recommendations/recommendations', { items, tombol });
  } catch (error) {
    console.error("❌ Gagal mengambil rekomendasi:", error);
    res.status(500).send("Terjadi kesalahan saat mengambil data.");
  }
});

router.get('/', recommendationController.getRecommendationsByFaculty);

module.exports = router;
