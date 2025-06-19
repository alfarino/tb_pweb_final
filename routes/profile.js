const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

router.get('/edit-profile', (req, res) => {
  res.render('profile/edit-profile');
});

router.get('/product', itemController.getUserProducts);

router.get('/main-profile', itemController.getUserProfile);

module.exports = router;
