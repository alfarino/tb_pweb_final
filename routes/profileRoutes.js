const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const checkoutController = require('../controllers/checkoutController');
const { requireLogin } = require('../middleware/auth'); 

router.get('/edit-profile', (req, res) => {
  res.render('profile/edit-profile');
});

router.get('/profile/product', requireLogin, async (req, res) => {
  const produk = await prisma.item.findMany({
    where: { userId: req.session.user.id },
    include: {
      itemImages: {
        where: { isPrimary: true },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const produkWithImages = produk.map(item => ({
    ...item,
    imageUrl: item.itemImages[0]?.imageUrl || null
  }));

  const success = req.session.success;
  delete req.session.success;

  res.render('profile/product', {
    user: req.session.user,
    produk: produkWithImages,
    success
  });
});

router.get('/product', itemController.getUserProducts);

router.get('/main-profile', itemController.getUserProfile);

router.get('/history-buy', itemController.getRiwayatPembelian);

router.get('/history-sell', itemController.getHistorySellPage);

router.post('/complete/:id', checkoutController.completeTransaksi);

module.exports = router;
