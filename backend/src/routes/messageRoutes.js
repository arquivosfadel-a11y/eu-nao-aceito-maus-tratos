const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage
} = require('../controllers/messageController');
const { authenticate, optionalAuth } = require('../middlewares/auth');

// Buscar mensagens de uma reclamação
// Cidadãos autenticados podem VER (observar)
// Apenas reclamante e secretário podem ESCREVER
router.get(
  '/:complaint_id/messages',
  optionalAuth,
  getMessages
);

// Enviar mensagem (apenas reclamante ou secretário)
router.post(
  '/:complaint_id/messages',
  authenticate,
  sendMessage
);

module.exports = router;