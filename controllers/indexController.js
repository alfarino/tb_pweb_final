const prisma = require('../prisma/client');

exports.getAllItems = async (req, res) => {
  const items = await prisma.item.findMany({
    include: { itemImages: true }
  });
  res.render('index', { items });
};
