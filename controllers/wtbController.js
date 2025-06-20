const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getWantToBuyPage = async (req, res) => {
  try {
    // Mengambil produk dari database
    const products = await prisma.product.findMany();
    
    // Kirim data produk ke tampilan wtb.ejs
    res.render("wtb", { products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.render("wtb", { products: [] }); // Jika terjadi error, kirim array kosong
  }
};

module.exports = { getWantToBuyPage };