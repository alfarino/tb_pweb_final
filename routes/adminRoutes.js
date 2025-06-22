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
router.get('/database-users', requireAdmin, adminController.getApprovedUsers);
router.post('/users/activate/:id', requireAdmin, adminController.activateUser);
router.post('/users/deactivate/:id', requireAdmin, adminController.deactivateUser);
router.get('/database-items', adminController.getApprovedItems);
router.post('/items/delete/:id', adminController.deleteItem);


module.exports = router;
