const express = require("express");
const router = express.Router();
const wtbController = require("../controllers/wtbController"); // Pastikan ini benar

// Menangani POST request untuk membuat WTB request
router.post('/create', wtbController.createWtbRequest);

// Menangani GET request untuk halaman WTB
router.get('/', wtbController.renderBerandaPage);

router.get("/beranda", wtbController.getBerandaPartial);
router.get("/post-saya", wtbController.getPostSayaPartial);
router.get("/komentar-saya", wtbController.getKomentarSayaPartial);

router.get("/beranda-wtb", (req, res) => {
  res.render("wtb/partials/beranda-wtb");
});

module.exports = router;
