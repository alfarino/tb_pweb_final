// controllers/adminController.js
const prisma = require('../prisma/client');

exports.getAdminDashboard = async (req, res) => {
  const pendingItems = await prisma.item.count({ where: { approvalStatus: 'pending' } });
  const pendingUsers = await prisma.user.count({ where: { isApproved: false, isAdmin: false } });

  res.render('admin/admin-dashboard', { pendingItems, pendingUsers, user: req.session.user });
};

exports.getItemApproval = async (req, res) => {
  const items = await prisma.item.findMany({
    where: { approvalStatus: 'pending' },
    include: { user: true, itemImages: true }
  });
  res.render('admin/itemapproval', { items, user: req.session.user });
};

exports.approveItem = async (req, res) => {
  const { id } = req.params;
  await prisma.item.update({
    where: { id: parseInt(id) },
    data: {
      approvalStatus: 'approved',
      approvedAt: new Date(),
      approvedById: req.session.user.id
    }
  });
  res.redirect('/admin/item-approval');
};

exports.rejectItem = async (req, res) => {
  const { id } = req.params;
  await prisma.item.update({
    where: { id: parseInt(id) },
    data: {
      approvalStatus: 'rejected',
      approvedAt: new Date(),
      approvedById: req.session.user.id
    }
  });
  res.redirect('/admin/item-approval');
};

exports.getUserApproval = async (req, res) => {
  const users = await prisma.user.findMany({ where: { isApproved: false, isAdmin: false } });
  res.render('admin/userapproval', { users, user: req.session.user });
};

exports.approveUser = async (req, res) => {
  const { id } = req.params;
  await prisma.user.update({
    where: { id: parseInt(id) },
    data: {
      isApproved: true,
      approvedAt: new Date(),
      approvedById: req.session.user.id
    }
  });
  res.redirect('/admin/user-approval');
};