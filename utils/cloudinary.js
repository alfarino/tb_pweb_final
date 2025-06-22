// utils/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'campusexchange/items',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const upload = multer({ storage });

function getCloudinaryPublicId(imageUrl) {
  try {
    const urlParts = imageUrl.split('/');
    const publicIdWithFolder = urlParts.slice(urlParts.indexOf('upload') + 1).join('/');
    const publicId = publicIdWithFolder.replace(/\.[^/.]+$/, '');
    return publicId;
  } catch (error) {
    console.error('Gagal mendapatkan publicId:', error);
    return null;
  }
}

// ✅ Gabungkan semua ke dalam satu objek ekspor
module.exports = {
  cloudinary,
  upload,
  getCloudinaryPublicId
};
