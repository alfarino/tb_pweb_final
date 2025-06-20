const prisma = require('../prisma/client'); // inisialisasi prisma client

  exports.getItemDetail = async (req, res) => {
    const itemId = parseInt(req.params.id); // ambil ID dari URL

    try {
      const itemRaw = await prisma.item.findUnique({
        where: { id: itemId, isActive: true, isAvailable: true }, // pastikan item aktif
        include: {
          itemImages: {
            orderBy: { sortOrder: 'asc' }
          },
          priceHistories: true
        },
      });

      if (!itemRaw) {
        return res.status(404).render('errors/404', { message: 'Item tidak ditemukan' });
      }

      const item = {
        ...itemRaw,
        imageUrl: itemRaw.itemImages.length > 0 ? itemRaw.itemImages[0].imageUrl : null
      };


      if (!item) {
        return res.status(404).render('errors/404', { message: 'Item tidak ditemukan' });
      }

      const produkLainnya = await prisma.item.findMany({
        where: { id: { not: itemId }, isActive: true, isAvailable: true }, // pastikan produk lain aktif
        include: {
          itemImages: {
            where: { isPrimary: true },
            take: 1
          }
        },
        take: 6 // batasi jumlah produk lainnya
      });

      // kirim data ke file EJS views/items/detail.ejs
      res.render('items/detail', { item, items: produkLainnya });
    } catch (error) {
      console.error(error);
      res.status(500).render('errors/500', { message: 'Server error' });
    }
  };

exports.getItemList = async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      where: {
        isActive: true,
        isAvailable: true
      },
      include: { itemImages: true }
    });

    res.render('index', { items });
  } catch (error) {
    console.error(error);
    res.status(500).render('errors/500', { message: 'Server error' });
  }
};

// Tambahkan console.log untuk debugging
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

    // DEBUG: Cek apa yang ada di database
    console.log('Raw item images:', items.map(item => ({
      id: item.id,
      imageUrl: item.itemImages[0]?.imageUrl
    })));

    const produk = items.map(item => ({
      id: item.id,
      title: item.title,
      price: parseFloat(item.price),
      status: item.status,
      imageUrl: item.itemImages[0]?.imageUrl.trim() || null
    }));

    // DEBUG: Cek path final
    console.log('Final image URLs:', produk.map(p => ({ id: p.id, imageUrl: p.imageUrl })));

    res.render('profile/product', {
      produk,
      user: req.session.user
    });
  } catch (error) {
    console.error('[getUserProducts] Error:', error);
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


exports.renderAddForm = (req, res) => {
  res.render('items/add', {
    user: req.session.user // ✅ kirim data user ke view
  });
};

exports.addItem = async (req, res) => {
  try {
    const { title, description, price, category, condition, conditionDetail, location } = req.body;
    const userId = req.session.user.id;

    const newItem = await prisma.item.create({
      data: {
        userId,
        title,
        description,
        price: parseFloat(price),
        category,
        condition,
        conditionDetail,
        location,
        isActive: true,
        isAvailable: true,
      },
    });

    const files = req.files || {};

    // Gambar utama
    if (files.primaryImage && files.primaryImage.length > 0) {
      await prisma.itemImage.create({
        data: {
          itemId: newItem.id,
          imageUrl: files.primaryImage[0].path,
          isPrimary: true,
          sortOrder: 0
        }
      });
    }

    // Gambar tambahan
    if (files.additionalImages && files.additionalImages.length > 0) {
      await Promise.all(
        files.additionalImages.map((file, idx) =>
          prisma.itemImage.create({
            data: {
              itemId: newItem.id,
              imageUrl: file.path,
              isPrimary: false,
              sortOrder: idx + 1
            }
          })
        )
      );
    }

    res.redirect('/profile/product');
  } catch (err) {
    console.error('Gagal menambahkan item:', err);
    res.status(500).send('Terjadi kesalahan saat menambahkan produk.');
  }
};

// Ambil data riwayat pembelian user
exports.getRiwayatPembelian = async (req, res) => {
  try {
    const userId = req.session.user?.id; // Ganti dengan session user ID sesungguhnya
     if (!userId) return res.status(401).send('Unauthorized');

    const pembelian = await prisma.transaksi.findMany({
      where: {
        pembeliId: userId
      },
      include: {
        item: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Siapkan data untuk ditampilkan ke EJS
    const dataPembelian = pembelian.map(t => ({
      nama: t.item.nama,
      harga: t.item.harga,
      gambar: t.item.gambar,
      tanggal_transaksi: t.tanggal_transaksi.toISOString().split('T')[0], // Format yyyy-mm-dd
      status: t.status
    }));

    res.render('profile/history-buy', { pembelian: dataPembelian });
  } catch (err) {
    console.error('Gagal mengambil data pembelian:', err);
    res.status(500).send('Terjadi kesalahan saat mengambil riwayat pembelian');
  }
};
