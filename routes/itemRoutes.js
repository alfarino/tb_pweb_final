const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { upload } = require('../utils/cloudinary');
const { requireLogin } = require('../middleware/auth');

// ✨ Tambahkan dukungan upload multiple image
const multerFields = upload.fields([
  { name: 'primaryImage', maxCount: 1 },
  { name: 'additionalImages', maxCount: 5 }
]);

// ✨ Form tambah item (pastikan sebelum :id)
router.get('/add', itemController.renderAddForm);
router.post('/add', multerFields, itemController.addItem);

// ✨ Form Edit Produk
router.get('/edit/:id', itemController.getEditItem);
router.post('/edit/:id', multerFields, itemController.updateItem);

// Hapus Produk
router.get('/hapus/:id', requireLogin, itemController.deleteItem);

// 📦 Produk milik user
router.get('/user-products', itemController.getUserProducts);

// 🏠 Daftar semua item
router.get('/', itemController.getItemList);

// ⛔ Detail produk harus paling bawah agar tidak konflik dengan "/add" dll
router.get('/:id', itemController.getItemDetail);

module.exports = router;
