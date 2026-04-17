const express = require('express');
const router = express.Router();
const multer = require('multer');
const { WorkLog, Department } = require('../models');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadMultipleImages } = require('../services/cloudinary');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

// Criar registro de trabalho (secretário)
router.post('/', authenticate, authorize('secretary'), upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, latitude, longitude, address } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Título é obrigatório.' });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Localização é obrigatória.' });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      images = await uploadMultipleImages(req.files);
      req.files.forEach(file => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); });
    }

    const workLog = await WorkLog.create({
      title: title.trim(),
      description: description?.trim() || null,
      city_id: req.user.city_id,
      department_id: req.user.department_id,
      secretary_id: req.user.id,
      latitude,
      longitude,
      address: address?.trim() || null,
      images,
      status: 'working'
    });

    return res.status(201).json({
      success: true,
      message: 'Trabalho registrado com sucesso!',
      workLog
    });
  } catch (error) {
    console.error('Erro ao criar trabalho:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Listar trabalhos do secretário logado
router.get('/my', authenticate, authorize('secretary'), async (req, res) => {
  try {
    const workLogs = await WorkLog.findAll({
      where: { secretary_id: req.user.id },
      include: [{ association: 'department', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });
    return res.status(200).json({ success: true, workLogs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Listar trabalhos de uma cidade (prefeito/admin — para o mapa)
router.get('/city/:city_id', authenticate, authorize('mayor', 'admin'), async (req, res) => {
  try {
    const workLogs = await WorkLog.findAll({
      where: { city_id: req.params.city_id },
      include: [
        { association: 'department', attributes: ['id', 'name'] },
        { association: 'secretary', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    return res.status(200).json({ success: true, workLogs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Encerrar trabalho (secretário)
router.put('/:id/finish', authenticate, authorize('secretary'), async (req, res) => {
  try {
    const workLog = await WorkLog.findByPk(req.params.id);

    if (!workLog) {
      return res.status(404).json({ success: false, message: 'Trabalho não encontrado.' });
    }

    if (workLog.secretary_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Sem permissão para encerrar este trabalho.' });
    }

    await workLog.update({ status: 'finished', finished_at: new Date() });

    return res.status(200).json({ success: true, message: 'Trabalho encerrado!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

module.exports = router;