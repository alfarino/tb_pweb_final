const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || user.password !== password) {
      return res.render('auth/login', { error: 'Username atau password salah!' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      isAdmin: user.isAdmin,
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

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});
