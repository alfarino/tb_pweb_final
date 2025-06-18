// routes/itemRoutes.js
const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

router.get('/:id', itemController.getItemDetail);
router.get('/', itemController.getItemList);

module.exports = router;
