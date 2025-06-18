const prisma = require('../prisma/client'); // inisialisasi prisma client

exports.getItemDetail = async (req, res) => {
  const itemId = parseInt(req.params.id); // ambil ID dari URL

  try {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { itemImages: true, priceHistories: true },
    });

    if (!item) {
      return res.status(404).render('errors/404', { message: 'Item tidak ditemukan' });
    }

    // kirim data ke file EJS views/items/detail.ejs
    res.render('items/detail', { item });
  } catch (error) {
    console.error(error);
    res.status(500).render('errors/500', { message: 'Server error' });
  }
};
