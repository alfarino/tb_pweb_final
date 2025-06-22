const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const { getCloudinaryPublicId } = require('../utils/cloudinary');

exports.showEditProfilePage = async (req, res) => {
  const userId = req.session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    req.flash('error', 'User tidak ditemukan');
    return res.redirect('/profile/main-profile');
  }

  res.render('profile/edit-profile', { user });
};

exports.updateProfile = async (req, res) => {
  const userId = req.session.user.id;
  const { username, fullName, email, phoneNumber, gender, password } = req.body;

  const dataToUpdate = {};

  if (username) dataToUpdate.username = username;
  if (fullName) dataToUpdate.fullName = fullName;
  if (email) dataToUpdate.email = email;
  if (phoneNumber) dataToUpdate.phoneNumber = phoneNumber;
  if (password) dataToUpdate.password = await bcrypt.hash(password, 10);

  if (req.file) {
    // Hapus gambar lama jika ada
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    const oldImageUrl = existingUser.profileImage;
    if (oldImageUrl) {
      const publicId = getCloudinaryPublicId(oldImageUrl);
      if (publicId) {
        const { cloudinary } = require('../utils/cloudinary');
        await cloudinary.uploader.destroy(publicId).catch(() => {});
      }
    }
    dataToUpdate.profileImage = req.file.path;
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...dataToUpdate,
        updatedAt: new Date()
      }
    });

    req.session.success = 'Profil berhasil diperbarui!';
    res.redirect('/profile/main-profile');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal memperbarui profil.');
    res.redirect('/profile/edit-profile');
  }
};
