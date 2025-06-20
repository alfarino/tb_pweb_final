const express = require("express");
const router = express.Router();
const { getWantToBuyPage } = require("../controllers/wtbController");  // Mengimpor controller

// Menambahkan route untuk halaman Want to Buy
router.get("/", getWantToBuyPage);

module.exports = router;
