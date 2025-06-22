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
router.post('/users/reject/:id', adminController.rejectUser);

router.get('/adminedit-profile', adminController.getAdminEditProfile);
router.post('/adminedit-profile', adminController.updateAdminProfile);

router.get('/database-users', adminController.getApprovedUsers);
router.post('/users/activate/:id', adminController.activateUser);
router.post('/users/deactivate/:id', adminController.deactivateUser);

router.get('/database-items', adminController.getApprovedItems);
router.post('/items/delete/:id', adminController.deleteItem);

router.get('/database-transactions', adminController.getApprovedTransactions);
router.post('/transactions/complete/:id', adminController.completeTransaction);
router.post('/transactions/cancel/:id', adminController.cancelTransaction);

module.exports = router;
