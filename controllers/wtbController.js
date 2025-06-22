// wtbController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Fungsi untuk menangani WTB request
const createWtbRequest = async (req, res) => {
  const { title, description, maxPrice, category, preferredCondition, location, urgency } = req.body;

  try {
    const newWtbRequest = await prisma.wtbRequest.create({
      data: {
        title,
        description,
        maxPrice,
        category,
        preferredCondition,
        location,
        urgency,
      },
    });

    // Redirect ke halaman WTB setelah berhasil
    res.redirect("/wtb");
  } catch (error) {
    console.error("Error creating WTB request:", error);
    res.status(500).send("An error occurred while creating WTB request.");
  }
};

// Fungsi untuk mengambil WTB request
const getWantToBuyPage = async (req, res) => {
  try {
    const wtbRequests = await prisma.wtbRequest.findMany();
    res.render("wtb/wtb", { wtbRequests });
  } catch (error) {
    console.error("Error fetching WTB requests:", error);
    res.render("wtb/wtb", { wtbRequests: [] });
  }
};

module.exports = { createWtbRequest, getWantToBuyPage };
