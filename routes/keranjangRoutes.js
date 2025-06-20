const express = require('express');
const router = express.Router();
const cartController = require('../controllers/keranjangController');

router.get('/', cartController.getCart);
router.post('/update/:id', cartController.updateCartQuantity);
router.post('/delete/:id', cartController.deleteCartItem);

module.exports = router;