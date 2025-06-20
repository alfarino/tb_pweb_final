const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { upload } = require('../utils/cloudinary');

// ✨ PASTIKAN YANG INI DI ATAS DULU
router.get('/add', itemController.renderAddForm);
router.post('/add', upload.single('image'), itemController.addItem);

router.get('/user-products', itemController.getUserProducts);
router.get('/', itemController.getItemList);

// ⛔ INI HARUS PALING BAWAH
router.get('/:id', itemController.getItemDetail);

module.exports = router;
