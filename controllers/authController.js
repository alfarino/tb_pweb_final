const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

exports.showRegisterPage = (req, res) => {
  res.render('auth/register', { error: null, success: null });
};

exports.register = async (req, res) => {
  const { email, fullName, studentId, university, faculty, major, phoneNumber } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.render('auth/register', {
        error: 'Email tidak ditemukan dalam sistem.',
        success: null
      });
    }

    if (user.isApproved) {
      return res.render('auth/register', {
        error: 'Akun ini sudah disetujui sebelumnya.',
        success: null
      });
    }

    await prisma.user.update({
      where: { email },
      data: {
        fullName,
        studentId,
        university,
        faculty,
        major,
        phoneNumber
      }
    });

    // ✅ Cari semua admin
    const admins = await prisma.user.findMany({ where: { isAdmin: true } });

    // ✅ Kirim email ke admin
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'sisteminformasiunand23@gmail.com',
        pass: 'dplf ffdi ecup tgjl'
      }
    });

    const adminEmailList = admins.map(admin => admin.email);

    await transporter.sendMail({
      from: '"CampusExchange" <sisteminformasiunand23@gmail.com>',
      to: adminEmailList,
      subject: 'Pendaftaran Baru Menunggu Persetujuan',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e5e5e5; border-radius: 10px;">
          <h2 style="color: #16a34a;">📥 Pendaftaran Baru!</h2>
          <p>Seorang mahasiswa baru telah mendaftar melalui sistem. Berikut detailnya:</p>
          <ul style="margin: 10px 0;">
            <li><strong>Nama:</strong> ${fullName}</li>
            <li><strong>Email:</strong> ${email}</li>
          </ul>
          <p>Silakan login ke dashboard admin untuk menyetujui akun ini.</p>
        </div>
      `
    });

    res.render('auth/register', {
      success: 'Data berhasil diperbarui. Silakan tunggu persetujuan dari admin.',
      error: null
    });

  } catch (err) {
    console.error('Register error:', err);
    res.render('auth/register', {
      error: 'Terjadi kesalahan saat mendaftarkan.',
      success: null
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.render('auth/login', { error: 'Email atau password salah!' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.render('auth/login', { error: 'Email atau password salah!' });
    }

    req.session.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isAdmin: user.isAdmin,
      faculty: user.faculty,
    };

    if (user.isAdmin) {
      return res.redirect('/admin/dashboard');
    }

    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    res.render('auth/login', { error: 'Terjadi kesalahan saat login.' });
  }
};

exports.showLoginPage = (req, res) => {
  res.render('auth/login', { error: null });
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};
