const express = require('express');
const router = express.Router();
const { User, City, Department, ValidatorCity, Complaint } = require('../models');
const { sequelize } = require('../config/database');
const { authenticate, authorize } = require('../middlewares/auth');
const { Op } = require('sequelize');

// GET /api/users/protectors — todos os protetores com disponibilidade
router.get(
  '/protectors',
  authenticate,
  authorize('admin', 'validator'),
  async (req, res) => {
    try {
      const protectors = await User.findAll({
        where: { role: 'protector', is_active: true },
        attributes: ['id', 'name', 'email', 'phone', 'whatsapp', 'city_id', 'city_name', 'avatar_url'],
        include: [{ association: 'city', attributes: ['id', 'name', 'state'] }],
        order: [['name', 'ASC']]
      });

      // Conta denúncias em andamento por protetor
      const counts = await Complaint.findAll({
        where: { secretary_id: protectors.map(p => p.id), status: 'in_progress' },
        attributes: ['secretary_id', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['secretary_id'],
        raw: true
      });

      const countMap = {};
      counts.forEach(c => { countMap[c.secretary_id] = parseInt(c.count); });

      const result = protectors
        .map(p => ({
          ...p.toJSON(),
          city_name: p.city_name || p.city?.name || null,
          in_progress_count: countMap[p.id] || 0
        }))
        .sort((a, b) => {
          if (a.in_progress_count !== b.in_progress_count) return a.in_progress_count - b.in_progress_count;
          return a.name.localeCompare(b.name, 'pt-BR');
        });

      return res.status(200).json({ success: true, protectors: result });
    } catch (error) {
      console.error('Erro ao listar protetores:', error);
      return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }
);

// Listar usuários — com filtro opcional por role
router.get(
  '/',
  authenticate,
  authorize('admin', 'validator'),
  async (req, res) => {
    try {
      const { role } = req.query;
      const where = {};
      if (role) where.role = role;

      const users = await User.findAll({
        where,
        attributes: { exclude: ['password'] },
        include: [
          { association: 'city', attributes: ['id', 'name', 'state'] },
          { association: 'department', attributes: ['id', 'name'] },
          // Inclui cidades do validador se for validator
          {
            model: City,
            as: 'validatorCities',
            attributes: ['id', 'name', 'state'],
            through: { attributes: [] },
            required: false
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      return res.status(200).json({ success: true, users });
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }
);

// Criar usuário
router.post(
  '/',
  authenticate,
  authorize('admin', 'validator'),
  async (req, res) => {
    try {
      const { name, email, password, phone, whatsapp, role, city_id, city_name, department_id, city_ids, party, councilman_number } = req.body;

      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email já cadastrado' });
      }

      const user = await User.create({
        name, email, password, phone: phone || whatsapp || '00000000000',
        whatsapp: whatsapp || phone,
        role, city_id, city_name, department_id,
        party, councilman_number,
        is_active: true
      });

      // Se for validador e tiver cidades selecionadas
      if (role === 'validator' && city_ids?.length > 0) {
        const entries = city_ids.map((cid) => ({
          validator_id: user.id,
          city_id: cid
        }));
        await ValidatorCity.bulkCreate(entries);
      }

      return res.status(201).json({
        success: true,
        message: 'Usuário cadastrado com sucesso!',
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }
);

// Atualizar usuário
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'validator'),
  async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
      }

      const { city_ids, ...updateData } = req.body;

      // Se senha vazia, não atualiza
      if (updateData.password === '' || updateData.password === undefined) {
        delete updateData.password;
      }

      await user.update(updateData);

      // Atualiza cidades do validador se informadas
      if (user.role === 'validator' && city_ids !== undefined) {
        await ValidatorCity.destroy({ where: { validator_id: user.id } });
        if (city_ids.length > 0) {
          const entries = city_ids.map((cid) => ({
            validator_id: user.id,
            city_id: cid
          }));
          await ValidatorCity.bulkCreate(entries);
        }
      }

      return res.status(200).json({ success: true, message: 'Usuário atualizado!' });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }
);

// Buscar cidades de um validador específico
router.get(
  '/:id/cities',
  authenticate,
  authorize('admin', 'validator'),
  async (req, res) => {
    try {
      const cities = await ValidatorCity.findAll({
        where: { validator_id: req.params.id },
        include: [{ model: City, as: 'city', attributes: ['id', 'name', 'state'] }]
      });
      return res.status(200).json({ success: true, cities: cities.map(vc => vc.city) });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }
);

module.exports = router;