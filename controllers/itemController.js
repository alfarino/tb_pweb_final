// controllers/itemController.js
const prisma = require('../prisma/client'); // pastikan sesuai dengan konfigurasi kamu

exports.getItemDetail = async (req, res) => {
  const itemId = parseInt(req.params.id);

  try {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        user: true,
        itemImages: true,
        priceHistories: true,
      },
    });

    if (!item) {
      return res.status(404).render('errors/404', { message: 'Barang tidak ditemukan' });
    }

    res.render('items/detail', { item });
  } catch (error) {
    console.error('Error getItemDetail:', error);
    res.status(500).render('errors/500', { message: 'Terjadi kesalahan pada server' });
  }
};
