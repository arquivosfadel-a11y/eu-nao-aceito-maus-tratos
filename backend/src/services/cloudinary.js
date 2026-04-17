const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuração do multer para upload temporário
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
});

const uploadToCloudinary = async (filePath, folder = 'participa-cidade') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      width: 1200,
      height: 1200,
      crop: 'limit',
      quality: 'auto'
    });

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('❌ Erro ao fazer upload para Cloudinary:', error.message);
    return { success: false, error: error.message };
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao deletar do Cloudinary:', error.message);
    return { success: false, error: error.message };
  }
};

const uploadMultipleImages = async (files, folder = 'participa-cidade/complaints') => {
  const uploadPromises = files.map(file => uploadToCloudinary(file.path, folder));
  const results = await Promise.all(uploadPromises);
  const urls = results
    .filter(r => r.success)
    .map(r => r.url);
  return urls;
};

module.exports = {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadMultipleImages
};