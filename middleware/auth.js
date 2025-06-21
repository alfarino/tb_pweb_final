exports.requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

exports.requireAdmin = (req, res, next) => {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).send('Akses hanya untuk admin');
  }
  next();
};