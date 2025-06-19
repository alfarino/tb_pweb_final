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
// Menyediakan akses langsung ke file di folder /public
app.use(express.static(path.join(__dirname, "public")));

// ✅ Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Session Configuration
app.use(session({
  secret: 'rahasia-kuat-123',
  resave: false,
  saveUninitialized: false,
}));

// ✅ Middleware Proteksi Login
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

// ✅ Import Routes
const itemRoutes = require("./routes/itemRoutes");
const profileRouter = require("./routes/profile");

// ✅ Gunakan Routes
app.use("/items", itemRoutes);
app.use("/profile", requireLogin, profileRouter); // Proteksi semua route profile

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

// ✅ Jalankan Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
