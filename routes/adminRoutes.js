const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireLogin, requireAdmin } = require('../middleware/auth');

router.use(requireLogin, requireAdmin);

router.get('/dashboard', adminController.getAdminDashboard);
router.get('/item-approval', adminController.getItemApproval);
router.post('/item-approval/:id/approve', adminController.approveItem);
router.post('/item-approval/:id/reject', adminController.rejectItem);
router.get('/adminprofile', adminController.getAdminProfile);
router.get('/userapproval', adminController.getUserApprovalList); 
router.post('/users/approve/:id', adminController.approveUser);
router.post('/users/reject/:id', adminController.rejectUser); // ⬅️ Tambahan
router.get('/adminedit-profile', adminController.getAdminEditProfile);
router.post('/adminedit-profile', adminController.updateAdminProfile);

module.exports = router;
