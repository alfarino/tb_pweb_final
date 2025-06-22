  const prisma = require('../prisma/client');
  const { generateUsername, generatePassword } = require('../utils/generateCred');
  const { sendAccountEmailToUser, sendRejectionEmail } = require('../utils/mailer');
  const bcrypt = require('bcrypt');
  const csvParser = require('csv-parser');
  const fs = require('fs');
  const path = require('path');

  // ============================== 
  // DASHBOARD
  // ==============================
  exports.getAdminDashboard = async (req, res) => {
    try {
      const totalUsers = await prisma.user.count({
        where: {
          isApproved: true,
          isAdmin: false
        }
      });
  
      const totalProducts = await prisma.item.count({
        where: {
          approvalStatus: 'approved',
          isActive: true
        }
      });
  
      const totalOrders = await prisma.transaksi.count();
  
      res.render('admin/admin-dashboard', {
        totalUsers,
        totalProducts,
        totalOrders,
        user: req.session.user
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
    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

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

      await sendAccountEmailToUser(user.email, user.fullName, username, plainPassword);
      req.session.success = 'Pengguna berhasil disetujui!';
    } catch (err) {
      console.error('Approval Error:', err);
      req.session.success = 'Gagal menyetujui pengguna.';
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

exports.getApprovedTransactions = async (req, res) => {
  try {
    const transactions = await prisma.transaksi.findMany({
      include: {
        item: true,
        pembeli: true,
        penjual: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.render('admin/database-transactions', {
      transactions,
      user: req.session.user,
      success: req.session.success || null
    });
    delete req.session.success;
  } catch (err) {
    console.error('Gagal memuat daftar transaksi:', err);
    res.status(500).send('Terjadi kesalahan saat memuat transaksi.');
  }
};

exports.completeTransaction = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.transaksi.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });
    req.session.success = 'Transaksi ditandai selesai.';
  } catch (err) {
    console.error('Gagal menyelesaikan transaksi:', err);
    req.session.success = 'Gagal menyelesaikan transaksi.';
  }
  res.redirect('/admin/database-transactions');
};

exports.uploadUserCSV = async (req, res) => {
  if (!req.file) {
    req.session.success = 'File CSV tidak ditemukan.';
    return res.redirect('/admin/userapproval');
  }

  const filePath = req.file.path;
  const results = [];

  fs.createReadStream(filePath)
  .pipe(csvParser()) // ✅ sesuai dengan const csvParser = require('csv-parser');
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        for (const userData of results) {
          if (!userData.email || !userData.fullName || !userData.password) continue;

          const existing = await prisma.user.findUnique({ where: { email: userData.email } });
          if (existing) continue;

          const hashedPassword = await bcrypt.hash(userData.password, 10);

          await prisma.user.create({
            data: {
              email: userData.email,
              fullName: userData.fullName,
              password: hashedPassword,
              studentId: userData.studentId || null,
              university: userData.university || null,
              faculty: userData.faculty || null,
              major: userData.major || null,
              phoneNumber: userData.phoneNumber || null,
              isVerified: false,
              isApproved: false,
              isActive: true,
              username: generateUsername(userData.fullName),
            }
          });
        }

        req.session.success = 'Data pengguna dari CSV berhasil diimpor.';
      } catch (err) {
        console.error('Upload CSV error:', err);
        req.session.success = 'Terjadi kesalahan saat mengimpor data.';
      } finally {
        fs.unlink(filePath, () => {}); // Hapus file setelah selesai
        res.redirect('/admin/userapproval');
      }
    });
};

exports.cancelTransaction = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await prisma.transaksi.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      }
    });

    req.session.success = 'Transaksi berhasil dibatalkan.';
  } catch (err) {
    console.error('Gagal membatalkan transaksi:', err);
    req.session.success = 'Gagal membatalkan transaksi.';
  }

  res.redirect('/admin/database-transactions');
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
