const express = require("express");
const session = require("express-session");
const path = require("path");
const app = express();
const PORT = 3000;

// ✅ Prisma Client
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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

// ✅ Middleware untuk memastikan pengguna sudah login
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");  // Jika belum login, arahkan ke halaman login
  }
  next();  // Jika sudah login, lanjutkan ke route berikutnya
}

// ✅ Import Routes
const itemRoutes = require("./routes/itemRoutes");
const profileRouter = require("./routes/profileRoutes");
const cartRoutes = require('./routes/keranjangRoutes');
const wtbRoutes = require("./routes/wtbRoutes");  // Mengimpor route untuk halaman "Want to Buy"

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// ✅ Gunakan Routes
app.use("/items", requireLogin, itemRoutes);
app.use('/keranjang', requireLogin, cartRoutes);
app.use("/profile", requireLogin, profileRouter); // Proteksi semua route profile
app.use("/want-to-buy", requireLogin, wtbRoutes);  // Menambahkan route untuk halaman "Want to Buy"

// ✅ Login Routes
app.get("/login", (req, res) => {
  res.render("auth/login", { error: null });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || user.password !== password) {
      return res.render("auth/login", { error: "Username atau password salah!" });
    }

    // Simpan data user ke dalam session
    req.session.user = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
    };

    res.redirect("/");
  } catch (error) {
    console.error("Login error:", error);
    res.render("auth/login", { error: "Terjadi kesalahan pada server." });
  }
});

// ✅ Logout Route
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// ✅ Beranda (Home)
const itemController = require("./controllers/itemController");
app.get("/", requireLogin, itemController.getItemList);
app.get("/product", requireLogin, itemController.getUserProducts);

// ✅ Jalankan Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
