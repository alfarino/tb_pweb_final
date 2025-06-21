const prisma = require('../prisma/client');
const { cloudinary } = require('../utils/cloudinary');

// 🔍 Ambil public_id dari URL Cloudinary
function getCloudinaryPublicId(url) {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  const parts = url.split('/');
  const fileName = parts.pop().split('.')[0];
  return `campusexchange/items/${fileName}`;
}

// ✅ GET: Halaman detail item
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

// ✅ GET: Halaman utama (beranda)
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

// ✅ GET: Produk milik user
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

    const produk = items.map(item => ({
      id: item.id,
      title: item.title,
      price: parseFloat(item.price),
      status: item.status,
      imageUrl: item.itemImages[0]?.imageUrl?.trim() || null
    }));

    const success = req.session.success;
    delete req.session.success;

    res.render('profile/product', {
      user: req.session.user,
      produk,
      success
    });
  } catch (error) {
    console.error('[getUserProducts] Error:', error);
    res.status(500).send('Gagal mengambil produk');
  }
};

// ✅ GET: Profil user
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;

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

// ✅ GET: Form tambah produk
exports.renderAddForm = (req, res) => {
  res.render('items/add', { user: req.session.user });
};

// ✅ GET: Riwayat pembelian
exports.getRiwayatPembelian = async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) return res.status(401).send('Unauthorized');

    const pembelian = await prisma.transaksi.findMany({
      where: { pembeliId: userId },
      include: {
        item: {
          include: { itemImages: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const dataPembelian = pembelian.map(t => ({
      nama: t.item?.title || 'Barang tidak tersedia',
      jumlah: t.jumlah,
      gambar: t.item?.itemImages?.[0]?.imageUrl || null,
      tanggal_transaksi: t.createdAt
        ? t.createdAt.toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
          })
        : 'Tanggal tidak tersedia',
      status: t.status
    }));

    res.render('profile/history-buy', { pembelian: dataPembelian });
  } catch (err) {
    console.error('Gagal mengambil data pembelian:', err);
    res.status(500).send('Terjadi kesalahan saat mengambil riwayat pembelian');
  }
};

// ✅ POST: Tambah produk
exports.addItem = async (req, res) => {
  try {
    const {
      title, description, price, category,
      condition, conditionDetail, location
    } = req.body;

    const userId = req.session.user.id;

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

    await prisma.itemImage.create({
      data: {
        itemId: newItem.id,
        imageUrl: files.primaryImage[0].path,
        isPrimary: true,
        sortOrder: sortOrder++
      }
    });

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

    req.session.success = "Produk berhasil ditambahkan!";
    res.redirect('/profile/product');
  } catch (err) {
    console.error('Gagal menambahkan item:', err);
    res.status(500).send('Terjadi kesalahan saat menambahkan produk.');
  } 
};

// ✅ GET: Halaman edit
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
    removedImageIds: []
  });
};

// ✅ POST: Update produk
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

  for (let id of imageIdsToRemove) {
    const img = await prisma.itemImage.findUnique({ where: { id } });
    if (img && img.itemId === itemId) {
      const publicId = getCloudinaryPublicId(img.imageUrl);
      if (publicId) await cloudinary.uploader.destroy(publicId);
      await prisma.itemImage.delete({ where: { id } });
    }
  }

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

  const files = req.files || {};

  if (files.primaryImage?.[0]) {
    await prisma.itemImage.deleteMany({ where: { itemId, isPrimary: true } });
    await prisma.itemImage.updateMany({
      where: { itemId, isPrimary: false, sortOrder: 0 },
      data: { sortOrder: 1000 }
    });

    await prisma.itemImage.create({
      data: {
        itemId,
        imageUrl: files.primaryImage[0].path,
        isPrimary: true,
        sortOrder: 0
      }
    });
  }

  let currentCount = await prisma.itemImage.count({ where: { itemId } });
  let nextSort = currentCount;

  if (files.additionalImages) {
    for (const file of files.additionalImages) {
      await prisma.itemImage.create({
        data: {
          itemId,
          imageUrl: file.path,
          isPrimary: false,
          sortOrder: nextSort++
        }
      });
    }
  }

  const allImages = await prisma.itemImage.findMany({
    where: { itemId },
    orderBy: [
      { isPrimary: 'desc' },
      { sortOrder: 'asc' }
    ]
  });

  for  (let i = 0; i < allImages.length; i++) {
    await prisma.itemImage.update({
      where: { id: allImages[i].id },
      data: { sortOrder: i }
    });
  }

  req.session.success = "Produk berhasil diperbarui!";
  res.redirect('/profile/product');
};

// ✅ DELETE: Hapus produk
exports.deleteItem = async (req, res) => {
  const itemId = parseInt(req.params.id);
  const userId = req.session.user.id;

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { itemImages: true }
  });

  if (!item || item.userId !== userId) {
    return res.status(403).send("Akses ditolak");
  }

  for (const image of item.itemImages) {
    const publicId = getCloudinaryPublicId(image.imageUrl);
    if (publicId) await cloudinary.uploader.destroy(publicId).catch(() => {});
  }

  await prisma.item.delete({ where: { id: itemId } });

  req.session.success = "Produk berhasil dihapus!";
  res.redirect('/profile/product');
};
