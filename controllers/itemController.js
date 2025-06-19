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
    const items = await prisma.item.findMany({
      where: {
        userId: req.session.user.id
      },
      include: {
        itemImages: {
          where: { isPrimary: true },
          take: 1
        }
      }
    });

    const produk = items.map(item => ({
      id: item.id,
      title: item.title,
      price: parseFloat(item.price), // konversi Decimal ke float
      status: item.status,
      imageUrl: item.itemImages[0]?.imageUrl || 'default.jpg'
    }));

    res.render('profile/product', {
      produk,
      user: req.session.user // tambahan agar bisa pakai nama pemilik akun di EJS
    });
  } catch (error) {
    console.error('[getUserProducts] Error:', error);
    res.status(500).send('Gagal mengambil produk');
  }
};


