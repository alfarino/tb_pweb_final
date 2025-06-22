// ✅ Import Core Modules
const express = require("express");
const session = require("express-session");
const flash = require('connect-flash');
const path = require("path");

// ✅ Inisialisasi Express
const app = express();
const PORT = 3000;

// ✅ Prisma Client
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ✅ Import Middleware
const { requireLogin, requireAdmin } = require('./middleware/auth');
const flashMiddleware = require('./middleware/flash');

// ✅ Import Controllers
const authController = require('./controllers/authController');
const itemController = require("./controllers/itemController");
const wtbController = require('./controllers/wtbController');

// ✅ Import Routes
const itemRoutes = require("./routes/itemRoutes");
const profileRoutes = require("./routes/profileRoutes");
const cartRoutes = require("./routes/keranjangRoutes");
const wtbRoutes = require("./routes/wtbRoutes");
const adminRoutes = require('./routes/adminRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');

// ✅ View Engine Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ✅ Static Files Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // untuk gambar

// ✅ Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Session Configuration
app.use(session({
  secret: 'rahasia-kuat-123',
  resave: false,
  saveUninitialized: false,
}));


app.use(flash());
app.use((req, res, next) => {
  res.locals.errorMessage = req.flash('error');
  next();
});

// ✅ Inject user ke semua view
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentUrl = req.originalUrl;
  res.locals.success = req.session.success;
  delete req.session.success;
  next();
});

app.post("/want-to-buy/create", wtbController.createWtbRequest);

// ✅ Flash Middleware
app.use(flashMiddleware);

// ✅ Protected Routes
app.use("/items", requireLogin, itemRoutes);
app.use('/keranjang', requireLogin, cartRoutes);
app.use("/profile", requireLogin, profileRoutes);
app.use("/wtb", requireLogin, wtbRoutes);
app.use('/checkout', checkoutRoutes);

// ✅ Admin Routes (dengan login & admin check)
app.use('/admin', requireLogin, requireAdmin, adminRoutes);

// ✅ Login & Logout Routes
app.get("/login", authController.showLoginPage);
app.post("/login", authController.login);
app.get("/logout", authController.logout);

// ✅ Auth Routes
const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);

// ✅ Home & Produk Saya
app.get("/", requireLogin, itemController.getItemList);
app.get("/product", requireLogin, itemController.getUserProducts);

//recommendations
const recommendationRoutes = require('./routes/recommendationRoutes');
app.use('/recommendations', requireLogin, recommendationRoutes);


// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
