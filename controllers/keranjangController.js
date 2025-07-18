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
    if (!['increase', 'decrease'].includes(action)) {
      return res.status(400).send('Aksi tidak valid');
    }

    const cart = await prisma.cart.findUnique({ where: { id: cartId }, include: { item: true } });

    if (!cart) {
      return res.status(404).send('Item keranjang tidak ditemukan');
    }

    let updatedQty = cart.quantity;

    if (action === 'increase') {
      updatedQty += 1;
    } else if (action === 'decrease' && cart.quantity > 1) {
      updatedQty -= 1;
    }

    if (updatedQty !== cart.quantity) {
      await prisma.cart.update({
        where: { id: cartId },
        data: { quantity: updatedQty }
      });
    }

    res.redirect('/keranjang');
  } catch (error) {
    console.error('Error updateCartQuantity:', error);
    res.status(500).send('Terjadi kesalahan saat memperbarui jumlah');
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
    const user = req.session.user;
    const userId = user.id;
    
    const itemIdInt = parseInt(itemId);
    const quantityInt = parseInt(quantity) || 1;

    // Ambil data item (untuk cek pemilik)
    const item = await prisma.item.findUnique({
      where: { id: itemIdInt },
      select: { userId: true }
    });

    if (!item) {
      return res.status(404).send('Barang tidak ditemukan');
    }

    // ❌ Admin dan pemilik barang tidak boleh beli
    if (item.userId === userId || user.isAdmin === true) {
      req.flash('error', 'Tidak dapat membeli atau memasukkan barang milik sendiri ke keranjang');
      return res.redirect('/items/' + itemIdInt);
    }

    // ✅ Lanjut proses keranjang
    const existingCart = await prisma.cart.findFirst({
      where: {
        userId: userId,
        itemId: itemIdInt
      }
    });

    if (existingCart) {
      await prisma.cart.update({
        where: { id: existingCart.id },
        data: { quantity: existingCart.quantity + quantityInt }
      });
    } else {
      await prisma.cart.create({
        data: {
          userId: userId,
          itemId: itemIdInt,
          quantity: quantityInt
        }
      });
    }

    // Redirect
    if (redirect === 'checkout') {
      res.redirect('/keranjang');
    } else {
      res.redirect('/keranjang');
    }

  } catch (error) {
    console.error('Error addToCart:', error);
    res.status(500).send('Gagal menambahkan item ke keranjang');
  }
};
