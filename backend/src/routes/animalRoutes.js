const express = require('express');
const router = express.Router();
const {
  listAnimals,
  getAnimalById,
  createAnimal,
  updateAnimal,
  deleteAnimal,
  updateAnimalStatus
} = require('../controllers/animalController');
const { authenticate, authorize } = require('../middlewares/auth');
const { upload } = require('../services/cloudinary');

// Rotas públicas
router.get('/', listAnimals);
router.get('/:id', getAnimalById);

// Cadastrar animal para adoção (qualquer usuário autenticado)
router.post(
  '/',
  authenticate,
  upload.array('images', 5),
  createAnimal
);

// Atualizar dados do animal (dono ou admin)
router.put(
  '/:id',
  authenticate,
  upload.array('images', 5),
  updateAnimal
);

// Remover animal (dono ou admin)
router.delete(
  '/:id',
  authenticate,
  deleteAnimal
);

// Atualizar status do animal: available / adopted (dono ou admin)
router.put(
  '/:id/status',
  authenticate,
  updateAnimalStatus
);

module.exports = router;
