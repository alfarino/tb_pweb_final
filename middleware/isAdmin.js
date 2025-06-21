// middleware/isAdmin.js
exports.requireAdmin = (req, res, next) => {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).send("Akses ditolak. Admin saja.");
  }
  next();
};
