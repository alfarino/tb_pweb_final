// /middleware/uploadProfileImage.js
const multer = require('multer');
const { cloudinary, storage } = require('../utils/cloudinary');
const multerStorage = require('multer-storage-cloudinary');

const profileStorage = new multerStorage.CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'campusexchange/profile-images',
    allowedFormats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 300, height: 300, crop: 'limit' }],
  },
});

const uploadProfileImage = multer({ storage: profileStorage });
module.exports = uploadProfileImage;
