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

exports.getItemList = async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      include: { itemImages: true }
    });

    res.render('index', { items });
  } catch (error) {
    console.error(error);
    res.status(500).render('errors/500', { message: 'Server error' });
  }
};

exports.getUserProducts = async (req, res) => {
  try {
    const produk = await prisma.item.findMany({
      where: {
        userId: 1 // ganti dengan userId yang login (nanti bisa pakai req.session.user.id)
      }
    });

    res.render('profile/product', { produk });
  } catch (error) {
    console.error(error);
    res.status(500).send('Gagal mengambil produk');
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId = 1; // Ganti dengan ID yang benar, bisa dari session nanti

    const user = await prisma.user.findUnique({
      where: { id: userId }, 
    });

    if (!user) {
      return res.status(404).render('errors/404', { message: 'User tidak ditemukan' });
    }

    res.render('profile/main-profile', { user });

  } catch (error) {
    console.error('Gagal mengambil data user:', error);
    res.status(500).render('errors/500', { message: 'Terjadi kesalahan server' });
  }
};

