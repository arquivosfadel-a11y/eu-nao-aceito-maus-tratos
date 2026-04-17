const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  validateComplaint,
  updateComplaintStatus,
  getMyComplaints,
  getCityStats,
  confirmResolution,
  getPendingComplaints,
  getProtectors,
  assignProtector
} = require('../controllers/complaintController');
const { authenticate, authorize, optionalAuth } = require('../middlewares/auth');
const { upload } = require('../services/cloudinary');

// Rotas públicas
router.get('/', optionalAuth, getComplaints);
router.get('/stats/:city_id', getCityStats);

// ✅ ROTAS FIXAS — devem vir ANTES de /:id para não serem interceptadas

router.get(
  '/my/complaints',
  authenticate,
  authorize('citizen', 'protector'),
  getMyComplaints
);

// Validador — denúncias pendentes de validação
router.get(
  '/pending',
  authenticate,
  authorize('validator', 'admin'),
  getPendingComplaints
);

// Validador — lista protetores disponíveis
router.get(
  '/protectors',
  authenticate,
  authorize('validator', 'admin'),
  getProtectors
);

router.get('/:id', optionalAuth, getComplaintById);

// Rotas para cidadãos autenticados
router.post(
  '/',
  authenticate,
  authorize('citizen'),
  upload.array('images', 5),
  createComplaint
);

// Validadores — aprovar/rejeitar denúncia pendente
router.put(
  '/:id/validate',
  authenticate,
  authorize('validator', 'admin'),
  validateComplaint
);

// Validadores — reatribuir protetor
router.put(
  '/:id/assign',
  authenticate,
  authorize('validator', 'admin'),
  assignProtector
);

// Rotas para protetores e admin
router.put(
  '/:id/status',
  authenticate,
  authorize('protector', 'admin'),
  upload.array('resolution_images', 5),
  updateComplaintStatus
);

// Cidadão confirma ou contesta resolução
router.post(
  '/:id/confirm',
  authenticate,
  authorize('citizen'),
  confirmResolution
);

module.exports = router;