const prisma = require('../prisma/client');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

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

exports.renderCheckoutPage = async (req, res) => {
  const userId = req.session.user.id;
  const idsParam = req.query.ids;

  if (!idsParam) {
    req.flash('error', 'Silakan pilih item terlebih dahulu');
    return res.redirect('/keranjang');
  }

  const selectedIds = idsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));

  if (selectedIds.length === 0) {
    req.flash('error', 'ID item tidak valid');
    return res.redirect('/keranjang');
  }

  try {
    const carts = await prisma.cart.findMany({
      where: {
        id: { in: selectedIds },
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
    console.error('Error renderCheckoutPage:', err);
    req.flash('error', 'Gagal menampilkan halaman checkout');
    return res.redirect('/keranjang');
  }
};

exports.konfirmasiPesanan = async (req, res) => {
  const transaksiId = parseInt(req.params.id);
  const { action } = req.body;

  try {
    const transaksi = await prisma.transaksi.findUnique({
      where: { id: transaksiId }
    });

    if (!transaksi) return res.status(404).send('Transaksi tidak ditemukan');

    let newStatus = null;
    if (action === 'terima') newStatus = 'IN_PROGRESS';
    if (action === 'tolak') newStatus = 'CANCELLED';

    if (!newStatus) return res.status(400).send('Aksi tidak valid');

    // Step 1: Update status transaksi
    await prisma.transaksi.update({
      where: { id: transaksiId },
      data: { status: newStatus }
    });

    // Step 2: Kalau diterima → update item isAvailable = false
    if (newStatus === 'IN_PROGRESS') {
      await prisma.item.update({
        where: { id: transaksi.itemId },
        data: { isAvailable: false }
      });
    } else if (newStatus === 'CANCELLED') {
      await prisma.item.update({
        where: { id: transaksi.itemId },
        data: { isAvailable: true }
      });
    }

    res.redirect('/checkout/konfirmasi');
  } catch (err) {
    console.error('Error konfirmasiPesanan:', err);
    res.status(500).send('Gagal mengkonfirmasi pesanan');
  }
};


exports.renderKonfirmasiPage = async (req, res) => {
  const userId = req.session.user.id;

  try {
    const transaksiList = await prisma.transaksi.findMany({
  where: {
    penjualId: userId,
    status: 'PENDING'
  },
  include: {
    item: {
      include: {
        itemImages: true  // nama relasi ke gambar
      }
    },
    pembeli: true
  }
});


    res.render('checkout/konfirmasi', { transaksiList });
  } catch (err) {
    console.error('Error renderKonfirmasiPage:', err);
    res.status(500).send('Gagal menampilkan pesanan');
  }
};

exports.handleKonfirmasi = async (req, res) => {
    const transaksiId = parseInt(req.params.id);
    const action = req.body.action; // 'terima' atau 'tolak'
  
    try {
        await prisma.transaksi.update({
            where: { id: transaksiId },
            data: {
                status: action === 'terima' ? 'DITERIMA' : 'DITOLAK'
            }
        });

        res.redirect('/checkout/konfirmasi'); // balik ke halaman konfirmasi
    } catch (err) {
        console.error('Error handleKonfirmasi:', err);
        res.status(500).send('Gagal mengupdate transaksi');
    }
};

exports.completeTransaksi = async (req, res) => {
    const trxId = Number(req.params.id);

    try {
        await prisma.transaksi.update({
            where: { id: trxId },
            data: {
                status: 'COMPLETED' // kamu sesuaikan enum status
            }
        });

        res.redirect('/profile/history-sell');
    } catch (err) {
        console.error('Error completeTransaksi:', err);
        res.status(500).send('Gagal menyelesaikan transaksi');
    }
};

exports.generatePDF = async (req, res) => {
  const { ids } = req.query;
  const url = `http://localhost:3000/checkout/pdf-view?ids=${ids}`;

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Akses halaman sukses
    await page.goto(url, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="bukti-transaksi.pdf"',
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error('Gagal generate PDF:', err);
    res.status(500).send('Gagal generate PDF');
  }
};

exports.generatePDFPublic = async (req, res) => {
  const idParams = req.query.ids;

  if (!idParams) return res.status(400).send('ID transaksi tidak diberikan');

  const idArray = idParams.split(',').map(id => parseInt(id)).filter(Boolean);

  try {
    const transaksiList = await prisma.transaksi.findMany({
      where: {
        id: { in: idArray }
        // hilangkan filter pembeliId jika route ini publik
      },
      include: {
        item: { include: { itemImages: true } },
        pembeli: true,
        penjual: true
      }
    });

    // Render halaman khusus untuk PDF
    res.render('checkout/pdf-view', { transaksi: transaksiList });
  } catch (err) {
    console.error('Error renderPDF view:', err);
    res.status(500).send('Gagal memuat transaksi');
  }
};