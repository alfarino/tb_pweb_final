// controllers/recommendationController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fungsi untuk mendapatkan item rekomendasi berdasarkan faculty user
const getRecommendationsByFaculty = async (req, res) => {
  const user = req.session.user;

  if (!user) {
    return res.redirect('/login');
  }

  try {
    const items = await prisma.item.findMany({
      where: {
        isAvailable: true,
        isActive: true,
        approvalStatus: 'approved',
        NOT: {
          userId: user.id,
        },
        user: {
          is: {
            faculty: user.faculty,
          },
        },
      },
      include: {
        itemImages: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const tombol = [
      { label: 'WTB', link: '/wtb' },
      { label: 'Rekomendasi', link: '/recommendations' },
      {}, {}, {}, {}, {} // 5 slot kosong
    ];


    res.render('recommendations/recommendations', { items, tombol });
  } catch (error) {
    console.error('❌ Gagal mengambil rekomendasi:', error);
    res.status(500).send('Terjadi kesalahan saat mengambil data rekomendasi.');
  }
};

module.exports = {
  getRecommendationsByFaculty,
};
