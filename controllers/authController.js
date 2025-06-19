const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Untuk versi tanpa hash password
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username: username },
    });

    if (!user || user.password !== password) {
      return res.render('auth/login', { error: 'Username atau password salah!' });
    }

    // Simpan data user ke session
    req.session.user = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
    };

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
