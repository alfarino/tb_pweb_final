  const prisma = require('../prisma/client');
  const { generateUsername, generatePassword } = require('../utils/generateCred');
  const { sendAccountEmailToUser, sendRejectionEmail } = require('../utils/mailer');
  const bcrypt = require('bcrypt');

  // ============================== 
  // DASHBOARD
  // ==============================
  exports.getAdminDashboard = async (req, res) => {
    try {
      const pendingItems = await prisma.item.count({ where: { approvalStatus: 'pending' } });
      const pendingUsers = await prisma.user.count({ where: { isApproved: false, isAdmin: false } });

      res.render('admin/admin-dashboard', {
        pendingItems,
        pendingUsers,
        user: req.session.user,
      });
    } catch (err) {
      console.error('Gagal memuat dashboard:', err);
      res.status(500).send('Internal Server Error');
    }
  };

  // ==============================
  // APPROVAL PRODUK
  // ==============================
  exports.getItemApproval = async (req, res) => {
    try {
      const items = await prisma.item.findMany({
        where: { approvalStatus: 'pending' },
        include: { user: true, itemImages: true }
      });

      res.render('admin/itemapproval', {
        items,
        user: req.session.user,
        success: res.locals.success
      });
    } catch (err) {
      console.error('Gagal load item approval:', err);
      res.status(500).send('Internal Server Error');
    }
  };

  exports.approveItem = async (req, res) => {
    try {
      await prisma.item.update({
        where: { id: parseInt(req.params.id) },
        data: {
          approvalStatus: 'approved',
          approvedAt: new Date(),
          approvedById: req.session.user.id
        }
      });
      req.session.success = 'Produk berhasil disetujui.';
    } catch (err) {
      console.error('Approve item error:', err);
      req.session.success = 'Gagal menyetujui produk.';
    }
    res.redirect('/admin/item-approval');
  };

  exports.rejectItem = async (req, res) => {
    try {
      await prisma.item.update({
        where: { id: parseInt(req.params.id) },
        data: {
          approvalStatus: 'rejected',
          approvedAt: new Date(),
          approvedById: req.session.user.id
        }
      });
      req.session.success = 'Produk telah ditolak.';
    } catch (err) {
      console.error('Reject item error:', err);
      req.session.success = 'Gagal menolak produk.';
    }
    res.redirect('/admin/item-approval');
  };

  // ==============================
  // APPROVAL USER
  // ==============================
  exports.getUserApprovalList = async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        where: { isApproved: false, isAdmin: false },
        orderBy: { createdAt: 'desc' }
      });

      res.render('admin/userapproval', { // ✅ ini sudah sinkron
        users,
        user: req.session.user,
        success: res.locals.success
      });
    } catch (err) {
      console.error('Gagal load user approval:', err);
      res.status(500).send('Internal Server Error');
    }
  };

exports.approveUser = async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isApproved) return res.redirect('/admin/userapproval');

    const username = generateUsername(user.fullName);
    const plainPassword = generatePassword(); // ✅ ini yang akan dikirim ke email
    const hashedPassword = await bcrypt.hash(plainPassword, 10); // ✅ ini disimpan di DB

    await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        password: hashedPassword,
        isApproved: true,
        approvedById: req.session.user.id,
        approvedAt: new Date()
      }
    });

    // ✅ Kirim yang plainPassword, bukan password
    await sendAccountEmailToUser(user.email, user.fullName, username, plainPassword);

    req.session.success = 'Pengguna berhasil disetujui!';
  } catch (err) {
    console.error('Approval Error:', err.message);
    res.status(500).send('Gagal menyetujui pengguna.');
  }

  res.redirect('/admin/userapproval');
};


  exports.rejectUser = async (req, res) => {
    const userId = parseInt(req.params.id);
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.isApproved) return res.redirect('/admin/userapproval'); // ✅ sinkron

      await sendRejectionEmail(user.email, user.fullName);
      await prisma.user.delete({ where: { id: userId } });

      req.session.success = 'Pengguna telah ditolak dan dihapus.';
    } catch (err) {
      console.error('Reject Error:', err);
      req.session.success = 'Gagal menolak pengguna.';
    }

    res.redirect('/admin/userapproval'); // ✅ betulkan
  };


  // ==============================
  // PROFIL ADMIN
  // ==============================
  exports.getAdminProfile = async (req, res) => {
    try {
      const admin = await prisma.user.findUnique({
        where: { id: req.session.user.id },
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

      res.render('admin/admin-profile', { user: admin });
    } catch (err) {
      console.error('Gagal load admin profile:', err);
      res.status(500).send('Internal Server Error');
    }
  };

  //fungsi menampilkan user di tabel kelola user

  exports.getApprovedUsers = async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        where: {
          isApproved: true,
          isAdmin: false
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.render('admin/database-users', {
        users,
        user: req.session.user,
        success: req.session.success || null
      });
      delete req.session.success;
    } catch (err) {
      console.error('Gagal memuat daftar user:', err);
      res.status(500).send('Terjadi kesalahan saat memuat data pengguna.');
    }
  };

  //fungsi mengaktifkan user yang nonaktif di (database user)

  exports.activateUser = async (req, res) => {
    const userId = parseInt(req.params.id);

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: true }
      });

      req.session.success = "Akun berhasil diaktifkan.";
      res.redirect('/admin/database-users');
    } catch (err) {
      console.error('Gagal mengaktifkan user:', err);
      res.status(500).send('Terjadi kesalahan saat mengaktifkan akun.');
    }
  };

  //fungsi menonaktifkan akun user

  exports.deactivateUser = async (req, res) => {
    const userId = parseInt(req.params.id);

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false }
      });

      req.session.success = "Akun berhasil dinonaktifkan.";
      res.redirect('/admin/database-users');
    } catch (err) {
      console.error('Gagal menonaktifkan user:', err);
      res.status(500).send('Terjadi kesalahan saat menonaktifkan akun.');
    }
  };

  exports.getAdminEditProfile = async (req, res) => {
    try {
      const admin = await prisma.user.findUnique({
        where: { id: req.session.user.id },
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

exports.deleteItem = async (req, res) => {
  const itemId = parseInt(req.params.id);

  try {
    await prisma.item.delete({
      where: { id: itemId }
    });

    req.session.success = 'Item berhasil dihapus.';
    res.redirect('/admin/database-items');
  } catch (err) {
    console.error('Gagal menghapus item:', err);
    res.status(500).send('Terjadi kesalahan saat menghapus item.');
  }
};

exports.getApprovedItems = async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      where: {
        approvalStatus: 'approved',
        isActive: true
      },
      include: {
        user: true,
        itemImages: true
      }
    });

    res.render('admin/database-items', { items, user: req.session.user });
  } catch (err) {
    console.error("Gagal memuat daftar item:", err);
    res.status(500).send("Terjadi kesalahan saat memuat item.");
  }
};
  exports.updateAdminProfile = async (req, res) => {
    try {
      const { fullName, username } = req.body;

      await prisma.user.update({
        where: { id: req.session.user.id },
        data: { fullName, username }
      });

      req.session.user.fullName = fullName;
      req.session.user.username = username;
      req.session.success = "Profil admin berhasil diperbarui!";
      res.redirect('/admin/profile');
    } catch (err) {
      console.error('Gagal update profil admin:', err);
      res.status(500).send('Internal Server Error');
    }
  };
