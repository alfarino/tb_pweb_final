const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { requireLogin } = require('../middleware/auth');

router.get('/', requireLogin, checkoutController.renderMultipleCheckoutPage);
router.post('/process', requireLogin, checkoutController.processCheckout);
router.get('/sukses', requireLogin, checkoutController.renderSuccessPage);
router.post('/', requireLogin, checkoutController.processMultipleCheckout);



module.exports = router;
