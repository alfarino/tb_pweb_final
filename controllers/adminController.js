// controllers/adminController.js
const prisma = require('../prisma/client');
const { generateUsername, generatePassword } = require('../utils/generateCred');
const { sendAccountEmailToUser, sendRejectionEmail } = require('../utils/mailer');

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

  req.session.success = 'Produk berhasil disetujui.';
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

  req.session.success = 'Produk telah ditolak.';
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

exports.getAdminProfile = async (req, res) => {
  try {
    const adminId = req.session.user.id;

    // Ambil data lengkap admin dari database
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        major: true,
        isAdmin: true
      }
    });

    // Render halaman dengan data admin lengkap
    res.render('admin/admin-profile', { user: admin });
  } catch (err) {
    console.error('Gagal load admin profile:', err);
    res.status(500).send('Internal Server Error');
  }
};

exports.updateAdminProfile = async (req, res) => {
  const { fullName, username } = req.body;
  const userId = req.session.user.id;

  await prisma.user.update({
    where: { id: userId },
    data: { fullName, username }
  });

  req.session.user.fullName = fullName;
  req.session.user.username = username;

  req.session.success = "Profil admin berhasil diperbarui!";
  res.redirect('/admin/profile');
};

exports.getUserApprovalList = async (req, res) => {
  const users = await prisma.user.findMany({
    where: { isApproved: false },
    orderBy: { createdAt: 'desc' }
  });

  res.render('admin/userapproval', { users });
};

exports.approveUser = async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isApproved) return res.redirect('/admin/users/approval');

    const username = generateUsername(user.fullName);
    const password = generatePassword();

    await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        password,
        isApproved: true,
        approvedById: req.session.user.id,
        approvedAt: new Date()
      }
    });

    await sendAccountEmailToUser(user.email, user.fullName, username, password);
    res.redirect('/admin/users/approval');
  } catch (err) {
    console.error('Approval Error:', err);
    res.redirect('/admin/users/approval');
  }
};

exports.rejectUser = async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isApproved) return res.redirect('/admin/users/approval');

    await sendRejectionEmail(user.email, user.fullName);

    await prisma.user.delete({ where: { id: userId } });

    res.redirect('/admin/users/approval');
  } catch (err) {
    console.error('Reject Error:', err);
    res.redirect('/admin/users/approval');
  }
};

exports.getAdminEditProfile = async (req, res) => {
  try {
    const adminId = req.session.user.id;

    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        major: true,
        isAdmin: true
      }
    });

    res.render('admin/adminedit-profile', { user: admin });
  } catch (err) {
    console.error('Gagal load form edit admin profile:', err);
    res.status(500).send('Internal Server Error');
  }
};
