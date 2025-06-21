const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getWantToBuyPage = async (req, res) => {
  try {
    console.log("📥 Masuk ke getWantToBuyPage controller");
    const products = await prisma.product.findMany();
    console.log("📦 Produk:", products);
    res.render("wtb/wtb", { products });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.render("wtb/wtb", { products: [] });
  }
};

// Fungsi untuk menambahkan WTB Request (post)
const createWtbRequest = async (req, res) => {
  const { userId, title, description, maxPrice, category, preferredCondition, location, urgency } = req.body;
  
  try {
    // Menyimpan WTB Request ke database
    const newWtbRequest = await prisma.wtbRequest.create({
      data: {
        userId,
        title,
        description,
        maxPrice,
        category,
        preferredCondition,
        location,
        urgency,
      },
    });

    // Redirect ke halaman WTB setelah posting berhasil
    res.redirect('wtb/wtb'); // Atau arahkan ke halaman yang sesuai
  } catch (error) {
    console.error("Error creating WTB request:", error);
    res.status(500).json({ error: "Failed to create WTB request" });
  }
};

module.exports = { getWantToBuyPage, createWtbRequest };