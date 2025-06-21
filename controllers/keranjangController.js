const prisma = require('../prisma/client');

// Tampilkan halaman keranjang
exports.getCart = async (req, res) => {
  try {
    const userId = req.session.user.id;

    const carts = await prisma.cart.findMany({
      where: { userId },
      include: {
        item: {
            include: {
                itemImages: true
            }
        },
        user: true
      }
    });

    res.render('keranjang/keranjang', { carts });
  } catch (error) {
    console.error('Error getCart:', error);
    res.status(500).send('Terjadi kesalahan server');
  }
};

// Tambah kuantitas / kurang kuantitas
exports.updateCartQuantity = async (req, res) => {
  const cartId = parseInt(req.params.id);
  const action = req.body.action;

  try {
    const cart = await prisma.cart.findUnique({ where: { id: cartId } });

    if (!cart) return res.status(404).send('Cart item not found');

    const updatedQty = action === 'increase'
      ? cart.quantity + 1
      : Math.max(1, cart.quantity - 1);

    await prisma.cart.update({
      where: { id: cartId },
      data: { quantity: updatedQty }
    });

    res.redirect('/keranjang');
  } catch (error) {
    console.error('Error updateCartQuantity:', error);
    res.status(500).send('Gagal memperbarui jumlah');
  }
};

// Hapus item dari keranjang
exports.deleteCartItem = async (req, res) => {
  const cartId = parseInt(req.params.id);

  try {
    await prisma.cart.delete({ where: { id: cartId } });
    res.redirect('/keranjang');
  } catch (error) {
    console.error('Error deleteCartItem:', error);
    res.status(500).send('Gagal menghapus item');
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { itemId, quantity, redirect } = req.body;
    const userId = req.session.user.id;
    
    // Convert ke integer
    const itemIdInt = parseInt(itemId);
    const quantityInt = parseInt(quantity) || 1;
    
     // ✅ Ambil data item dulu, termasuk userId pemiliknya
    const item = await prisma.item.findUnique({
      where: { id: itemIdInt },
      select: { userId: true } // hanya ambil userId pemilik
    });

    if (!item) {
      return res.status(404).send('Barang tidak ditemukan');
    }

    // ❌ Cek apakah user mencoba membeli barang milik sendiri
    if (item.userId === userId) {
      req.flash('error', 'Tidak dapat membeli atau memasukkan barang milik sendiri ke keranjang');
      return res.redirect('/items/' + itemIdInt); // redirect kembali ke halaman produk
    }

    // ✅ Lanjut jika bukan milik sendiri
    const existingCart = await prisma.cart.findFirst({
      where: {
        userId: userId,
        itemId: itemIdInt
      }
    });
    
    if (existingCart) {
      // Jika sudah ada, tambah quantity
      await prisma.cart.update({
        where: { id: existingCart.id },
        data: { quantity: existingCart.quantity + quantityInt }
      });
    } else {
      // Jika belum ada, buat record baru
      await prisma.cart.create({
        data: {
          userId: userId,
          itemId: itemIdInt,
          quantity: quantityInt
        }
      });
    }
    
    // Tentukan redirect berdasarkan parameter
    if (redirect === 'checkout') {
      // Untuk "Beli Sekarang" - langsung ke checkout
      res.redirect('/keranjang');
    } else {
      // Untuk "Masukkan Keranjang" - ke halaman keranjang
      res.redirect('/keranjang');
    }
    
  } catch (error) {
    console.error('Error addToCart:', error);
    res.status(500).send('Gagal menambahkan item ke keranjang');
  }
};