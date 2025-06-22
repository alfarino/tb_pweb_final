    const express = require('express');
    const router = express.Router();
    const checkoutController = require('../controllers/checkoutController');
    const { requireLogin } = require('../middleware/auth');

    // router.get('/', requireLogin, checkoutController.renderMultipleCheckoutPage);
    router.post('/process', requireLogin, checkoutController.processCheckout);
    router.get('/sukses', requireLogin, checkoutController.renderSuccessPage);
    router.post('/', requireLogin, checkoutController.processMultipleCheckout);
    router.get('/', requireLogin, checkoutController.renderCheckoutPage);

    // Halaman konfirmasi untuk penjual
    router.get('/konfirmasi', requireLogin, checkoutController.renderKonfirmasiPage);

    // Aksi konfirmasi / tolak
    router.post('/konfirmasi/:id', requireLogin, checkoutController.konfirmasiPesanan);

    router.post('/konfirmasi/:id', requireLogin, checkoutController.handleKonfirmasi);

    module.exports = router;
