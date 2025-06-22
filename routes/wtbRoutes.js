const express = require("express");
const router = express.Router();
const wtbController = require("../controllers/wtbController"); // Pastikan ini benar

// Menangani POST request untuk membuat WTB request
router.post("/create", wtbController.createWtbRequest);

// Menangani GET request untuk halaman WTB
router.get("/", wtbController.getWantToBuyPage);

module.exports = router;
