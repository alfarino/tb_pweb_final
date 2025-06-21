const prisma = require('../prisma/client'); // inisialisasi prisma client
const { cloudinary } = require('../utils/cloudinary'); // pastikan cloudinary sudah diinisialisasi

exports.getItemDetail = async (req, res) => {
  const itemId = parseInt(req.params.id);

  try {
    const itemRaw = await prisma.item.findUnique({
      where: { id: itemId, isActive: true, isAvailable: true },
      include: {
        itemImages: { orderBy: { sortOrder: 'asc' } },
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

    const produkLainnya = await prisma.item.findMany({
      where: { id: { not: itemId }, isActive: true, isAvailable: true },
      include: {
        itemImages: {
          where: { isPrimary: true },
          take: 1
        }
      },
      take: 6
    });

    res.render('items/detail', { item, items: produkLainnya });
  } catch (error) {
    console.error(error);
    res.status(500).render('errors/500', { message: 'Server error' });
  }
};

exports.getItemList = async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      where: { isActive: true, isAvailable: true },
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
      where: { userId: req.session.user.id },
      include: {
        itemImages: {
          where: { isPrimary: true },
          take: 1
        }
      }
    });

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
    const userId = 1; // Ganti dengan ID dari session nanti

    const user = await prisma.user.findUnique({ where: { id: userId } });

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
    user: req.session.user
  });
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

exports.addItem = async (req, res) => {
  try {
    const {
      title, description, price, category,
      condition, conditionDetail, location
    } = req.body;

    const userId = req.session.user.id;

    // Validasi: gambar utama harus ada
    if (!req.files?.primaryImage || req.files.primaryImage.length === 0) {
      return res.status(400).send("Gambar utama wajib diisi.");
    }

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
        isAvailable: true
      }
    });

    const files = req.files || {};
    let sortOrder = 0;

    // Simpan gambar utama di sortOrder: 0
    await prisma.itemImage.create({
      data: {
        itemId: newItem.id,
        imageUrl: files.primaryImage[0].path,
        isPrimary: true,
        sortOrder: sortOrder++
      }
    });

    // Simpan gambar tambahan dimulai dari sortOrder: 1, 2, ...
    if (files.additionalImages?.length) {
      for (const file of files.additionalImages) {
        await prisma.itemImage.create({
          data: {
            itemId: newItem.id,
            imageUrl: file.path,
            isPrimary: false,
            sortOrder: sortOrder++
          }
        });
      }
    }

    res.redirect('/profile/product');
  } catch (err) {
    console.error('Gagal menambahkan item:', err);
    res.status(500).send('Terjadi kesalahan saat menambahkan produk.');
  }
};


// 🔧 GET Edit Item Page
exports.getEditItem = async (req, res) => {
  const itemId = parseInt(req.params.id);
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { itemImages: { orderBy: { sortOrder: 'asc' } } },
  });

  if (!item || item.userId !== req.session.user.id) {
    return res.status(403).send("Akses ditolak");
  }

  res.render('items/edit', {
    item,
    user: req.session.user,
    removedImageIds: [] // supaya tidak error di EJS saat render awal
  });
};

// 🔧 POST Update Item
exports.updateItem = async (req, res) => {
  const itemId = parseInt(req.params.id);
  const existingItem = await prisma.item.findUnique({
    where: { id: itemId },
    include: { itemImages: true },
  });

  if (!existingItem || existingItem.userId !== req.session.user.id) {
    return res.status(403).send("Akses ditolak");
  }

  const {
    title, description, price, category,
    condition, conditionDetail, location,
    removedImageIds = [],
  } = req.body;

  const imageIdsToRemove = (Array.isArray(removedImageIds) ? removedImageIds : [removedImageIds])
    .map(id => parseInt(id))
    .filter(id => !isNaN(id));

  // 🗑️ Hapus gambar yang ditandai untuk dihapus
  for (let id of imageIdsToRemove) {
    const img = await prisma.itemImage.findUnique({ where: { id } });
    if (img && img.itemId === itemId) {
      const publicId = getCloudinaryPublicId(img.imageUrl);
      if (publicId) await cloudinary.uploader.destroy(publicId);
      await prisma.itemImage.delete({ where: { id: img.id } });
    }
  }

  // 📝 Update data item utama
  await prisma.item.update({
    where: { id: itemId },
    data: {
      title,
      description,
      price: parseFloat(price),
      category,
      condition,
      conditionDetail,
      location,
    }
  });

  // 📷 Update gambar utama jika ada upload baru
  const files = req.files || {};
  if (files.primaryImage?.[0]) {
    await prisma.itemImage.deleteMany({
      where: { itemId, isPrimary: true }
    });

    await prisma.itemImage.create({
      data: {
        itemId,
        imageUrl: files.primaryImage[0].path,
        isPrimary: true,
        sortOrder: 0,
      }
    });
  }

  // 🔄 Tambah gambar tambahan
  let currentCount = await prisma.itemImage.count({ where: { itemId } });
  let nextSort = currentCount;

  if (files.additionalImages) {
    for (const file of files.additionalImages) {
      await prisma.itemImage.create({
        data: {
          itemId,
          imageUrl: file.path,
          isPrimary: false,
          sortOrder: nextSort++,
        }
      });
    }
  }

  // 📊 (Opsional) Rapikan ulang sortOrder agar rapi (0,1,2,...)
  const allImages = await prisma.itemImage.findMany({
    where: { itemId },
    orderBy: { sortOrder: 'asc' }
  });

  for (let i = 0; i < allImages.length; i++) {
    await prisma.itemImage.update({
      where: { id: allImages[i].id },
      data: { sortOrder: i }
    });
  }

  res.redirect('/profile/product');
};

// 🔍 Ambil public_id dari URL Cloudinary
function getCloudinaryPublicId(url) {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  const parts = url.split('/');
  const fileName = parts.pop().split('.')[0];
  return `campusexchange/items/${fileName}`;
}

