const prisma = require('../prisma/client');

exports.renderCheckoutPage = async (req, res) => {
  const itemId = parseInt(req.params.id);

  if (isNaN(itemId)) {
    return res.status(400).send('ID item tidak valid');
  }

  const userId = req.session.user.id;

  try {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { itemImages: true, user: true }
    });

    if (!item) return res.status(404).send('Item tidak ditemukan');
    if (item.userId === userId) return res.status(400).send('Tidak bisa checkout barang sendiri');

    res.render('checkout/checkout', {
      item,
      sellerName: item.user.username
    });
  } catch (err) {
    console.error('Error renderCheckoutPage:', err);
    res.status(500).send('Terjadi kesalahan');
  }
};


// exports.processCheckout = async (req, res) => {
//   const userId = req.session.user.id;
//   const { itemId, selectedItems, jadwal, shift, lokasi } = req.body;

//   try {
//     // CASE 1: Checkout dari detail item
//     if (itemId) {
//       const item = await prisma.item.findUnique({
//         where: { id: parseInt(itemId) },
//         include: { user: true }
//       });

//       if (!item) return res.status(404).send('Item tidak ditemukan');
//       if (item.userId === userId) return res.status(400).send('Tidak bisa beli barang sendiri');

//       await prisma.transaksi.create({
//         data: {
//           itemId: item.id,
//           pembeliId: userId,
//           penjualId: item.user.id,
//           jumlah: item.price,
//           status: 'PENDING',
//           statusBayar: 'UNPAID',
//           lokasiCOD: lokasi,
//           catatan: `Shift: ${shift}, Jadwal: ${jadwal}`
//         }
//       });

//       return res.redirect('/checkout/sukses');
//     }

//     // CASE 2: Checkout dari keranjang (multiple)
//     let ids = Array.isArray(selectedItems) ? selectedItems : [selectedItems];

//     const carts = await prisma.cart.findMany({
//       where: {
//         id: { in: ids.map(id => parseInt(id)) },
//         userId
//       },
//       include: {
//         item: { include: { user: true } }
//       }
//     });

//     for (const cart of carts) {
//       if (cart.item.userId === userId) continue;

//       await prisma.transaksi.create({
//         data: {
//           itemId: cart.item.id,
//           pembeliId: userId,
//           penjualId: cart.item.user.id,
//           jumlah: cart.item.price * cart.quantity,
//           status: 'PENDING',
//           statusBayar: 'UNPAID',
//           lokasiCOD: lokasi,
//           catatan: `Shift: ${shift}, Jadwal: ${jadwal}`
//         }
//       });

//       await prisma.cart.delete({ where: { id: cart.id } });
//     }

//     res.redirect('/checkout/sukses');
//   } catch (err) {
//     console.error('Error processCheckout:', err);
//     res.status(500).send('Gagal melakukan checkout');
//   }
// };

exports.processCheckout = async (req, res) => {
  const userId = req.session.user.id;
  const { selectedItems, jadwal, shift, lokasi } = req.body;

  let selectedIds = selectedItems;
  if (!selectedIds) {
    req.flash('error', 'Silahkan pilih item.');
    return res.redirect('/keranjang');
  }

  if (typeof selectedIds === 'string') {
    selectedIds = [selectedIds]; // ubah jadi array
  }

  try {
    const transaksiIds = [];

    const carts = await prisma.cart.findMany({
      where: {
        id: { in: selectedIds.map(id => parseInt(id)) },
        userId
      },
      include: {
        item: {
          include: { user: true }
        }
      }
    });

    for (const cart of carts) {
      if (cart.item.userId === userId) continue;

      const trx = await prisma.transaksi.create({
        data: {
          itemId: cart.item.id,
          pembeliId: userId,
          penjualId: cart.item.user.id,
          jumlah: cart.item.price * cart.quantity,
          status: 'PENDING',
          statusBayar: 'UNPAID',
          lokasiCOD: lokasi || null,
          catatan: `Shift: ${shift}, Jadwal: ${jadwal}`
        }
      });

      transaksiIds.push(trx.id);

      await prisma.cart.delete({ where: { id: cart.id } });
    }

    res.redirect(`/checkout/sukses?ids=${transaksiIds.join(',')}`);
  } catch (error) {
    console.error('Error processCheckout:', error);
    req.flash('error', 'Gagal melakukan checkout.');
    res.redirect('/keranjang');
  }
};

// exports.renderSuccessPage = async (req, res) => {
//   const userId = req.session.user.id;

//   try {
//     const transaksi = await prisma.transaksi.findFirst({
//       where: { pembeliId: userId },
//       orderBy: { createdAt: 'desc' },
//       include: {
//         item: {
//           include: {
//             itemImages: true
//           }
//         },
//         pembeli: true,
//         penjual: true
//       }
//     });

//     if (!transaksi) {
//       return res.status(404).send('Transaksi tidak ditemukan');
//     }

//     res.render('checkout/sukses', { transaksi });
//   } catch (error) {
//     console.error('Error renderSuccessPage:', error);
//     res.status(500).send('Terjadi kesalahan saat menampilkan transaksi');
//   }
// };

exports.renderSuccessPage = async (req, res) => {
  const userId = req.session.user.id;
  const idParams = req.query.ids;

  if (!idParams) {
    return res.status(400).send('ID transaksi tidak diberikan');
  }

  const idArray = idParams.split(',').map(id => parseInt(id)).filter(Boolean);

  try {
    const transaksi = await prisma.transaksi.findMany({
      where: {
        id: { in: idArray },
        pembeliId: userId
      },
      include: {
        item: {
          include: {
            itemImages: true
          }
        },
        pembeli: true,
        penjual: true
      }
    });

    if (transaksi.length === 0) {
      return res.status(404).send('Transaksi tidak ditemukan');
    }

    res.render('checkout/sukses', { transaksi });
  } catch (error) {
    console.error('Error renderSuccessPage:', error);
    res.status(500).send('Terjadi kesalahan saat menampilkan transaksi');
  }
};

exports.processMultipleCheckout = async (req, res) => {
  const userId = req.session.user.id;
  let selectedIds = req.body.selectedItems;

  if (!selectedIds) {
    req.flash('error', 'Silahkan Pilih Barang Yang Ingin Di Checkout');
    return res.redirect('/keranjang');
  }

  if (typeof selectedIds === 'string') {
    selectedIds = selectedIds.split(',');
  }

  const { jadwal, shift, lokasi } = req.body;

  try {
    const carts = await prisma.cart.findMany({
      where: {
        id: { in: selectedIds.map(id => parseInt(id)) },
        userId
      },
      include: {
        item: {
          include: { user: true }
        }
      }
    });

    for (const cart of carts) {
      if (cart.item.userId === userId) continue;

      await prisma.transaksi.create({
        data: {
          itemId: cart.item.id,
          pembeliId: userId,
          penjualId: cart.item.user.id,
          jumlah: cart.item.price * cart.quantity,
          status: 'PENDING',
          statusBayar: 'UNPAID',
          lokasiCOD: lokasi || null,
          catatan: `Shift: ${shift}, Jadwal: ${jadwal}`
        }
      });

      await prisma.cart.delete({ where: { id: cart.id } });
    }

    res.redirect(`/checkout?selectedItems=${selectedIds.join('&selectedItems=')}`);
  } catch (error) {
    console.error('Error processMultipleCheckout:', error);
    req.flash('error', 'Gagal melakukan checkout.');
    res.redirect('/keranjang');
  }
};


exports.renderMultipleCheckoutPage = async (req, res) => {
  const userId = req.session.user.id;
  const selectedIds = req.query.selectedItems;

  // ❗ Tangkap jika tidak ada item dipilih
  if (!selectedIds) {
    req.flash('error', 'Silahkan pilih barang terlebih dahulu');
    return res.redirect('/keranjang');
  }

  // ❗ Tangkap jika selectedIds tidak valid (bukan angka)
  const itemIds = Array.isArray(selectedIds) ? selectedIds : [selectedIds];
  const parsedIds = itemIds.map(id => parseInt(id)).filter(id => !isNaN(id));

  if (parsedIds.length === 0) {
    req.flash('error', 'Data item tidak valid');
    return res.redirect('/keranjang');
  }

  try {
    const carts = await prisma.cart.findMany({
      where: {
        id: { in: parsedIds },
        userId
      },
      include: {
        item: {
          include: { itemImages: true, user: true }
        }
      }
    });

    if (carts.length === 0) {
      req.flash('error', 'Tidak ada item valid untuk checkout');
      return res.redirect('/keranjang');
    }

    res.render('checkout/checkout', { carts });
  } catch (err) {
    console.error('Error renderMultipleCheckoutPage:', err);
    req.flash('error', 'Gagal menampilkan halaman checkout');
    res.redirect('/keranjang');
  }
};
