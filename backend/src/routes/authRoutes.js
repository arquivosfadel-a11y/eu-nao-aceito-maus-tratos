const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  sendVerificationCode,
  verifyPhone,
  savePushToken
} = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

// Rotas públicas
router.post('/register', register);
router.post('/login', login);

// Rotas protegidas
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

// Verificação de telefone
router.post('/send-verification', authenticate, sendVerificationCode);
router.post('/verify-phone', authenticate, verifyPhone);

// ✅ NOVO: Push token
router.post('/push-token', authenticate, savePushToken);

module.exports = router;