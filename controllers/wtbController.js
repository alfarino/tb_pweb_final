const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createWtbRequest = async (req, res) => {
  const userId = req.session.user?.id;
  const { title, description, maxPrice, category, preferredCondition, location, urgency } = req.body;

  if (!userId) return res.redirect('/login');

  try {
    await prisma.wtbRequest.create({
      data: {
        userId,
        title,
        description,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        category,
        preferredCondition,
        location,
        urgency
      }
    });

    res.redirect('/wtb');
  } catch (err) {
    console.error('Gagal membuat WTB:', err);
    res.status(500).send('Gagal menyimpan permintaan.');
  }
};

const renderBerandaPage = async (req, res) => {
  const user = req.session.user;

  try {
    const wtbRequests = await prisma.wtbRequest.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    res.render('wtb/wtb', {
      user,
      wtbRequests
    });
  } catch (error) {
    console.error('Error loading beranda:', error);
    res.status(500).send('Terjadi kesalahan saat memuat halaman.');
  }
};

const getBerandaPartial = async (req, res) => {
  try {
    const wtbRequests = await prisma.wtbRequest.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.render("wtb/partials/beranda-wtb", { wtbRequests });
  } catch (error) {
    console.error("Error loading beranda partial:", error);
    res.status(500).send("Gagal memuat data.");
  }
};

const getPostSayaPartial = async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) return res.status(401).send("Unauthorized");

    const posts = await prisma.wtbRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.render("wtb/partials/postSaya", { posts });
  } catch (error) {
    console.error("Gagal memuat post saya:", error);
    res.status(500).send("Gagal memuat post saya.");
  }
};

const getKomentarSayaPartial = async (req, res) => {
  try {
    res.render("wtb/partials/komentarSaya", {
      comments: []
    });
  } catch (error) {
    console.error("Gagal memuat komentar saya:", error);
    res.status(500).send("Gagal memuat komentar.");
  }
};

// ✅ Export semua fungsi secara eksplisit
module.exports = {
  createWtbRequest,
  renderBerandaPage,
  getBerandaPartial,
  getPostSayaPartial,
  getKomentarSayaPartial
};
