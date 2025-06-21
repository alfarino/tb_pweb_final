// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireLogin } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/isAdmin');

router.use(requireLogin, requireAdmin);

router.get('/dashboard', adminController.getAdminDashboard);
router.get('/item-approval', adminController.getItemApproval);
router.post('/item-approval/:id/approve', adminController.approveItem);
router.post('/item-approval/:id/reject', adminController.rejectItem);

router.get('/user-approval', adminController.getUserApproval);
router.post('/user-approval/:id/approve', adminController.approveUser);

module.exports = router;