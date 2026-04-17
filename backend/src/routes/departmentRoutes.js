const express = require('express');
const router = express.Router();
const { Department, User } = require('../models');
const { authenticate, authorize } = require('../middlewares/auth');

// Criar departamento + usuário secretário automaticamente
router.post(
  '/',
  authenticate,
  authorize('admin', 'validator'),
  async (req, res) => {
    try {
      const {
        name,
        description,
        city_id,
        responsible_name,
        responsible_email,
        responsible_whatsapp,
        responsible_password
      } = req.body;

      // Cria a secretaria
      const department = await Department.create({
        name,
        description,
        city_id,
        responsible_name,
        responsible_email,
        responsible_whatsapp
      });

      // Se tiver email e senha, cria o usuário secretário
      if (responsible_email && responsible_password) {
        // Verifica se já existe usuário com esse email
        const existing = await User.findOne({ where: { email: responsible_email } });

        if (existing) {
          // Atualiza o usuário existente vinculando à secretaria
          await existing.update({
            department_id: department.id,
            city_id,
            role: 'secretary',
            name: responsible_name || existing.name,
            whatsapp: responsible_whatsapp || existing.whatsapp,
            is_active: true
          });
        } else {
          // Cria novo usuário secretário
          await User.create({
            name: responsible_name || name,
            email: responsible_email,
            password: responsible_password,
            phone: responsible_whatsapp || '00000000000',
            whatsapp: responsible_whatsapp,
            role: 'secretary',
            city_id,
            department_id: department.id,
            is_active: true
          });
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Secretaria e acesso do secretário criados com sucesso!',
        department
      });
    } catch (error) {
      console.error('Erro ao criar departamento:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
);

// Atualizar departamento + usuário secretário
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'validator'),
  async (req, res) => {
    try {
      const department = await Department.findByPk(req.params.id);
      if (!department) {
        return res.status(404).json({ success: false, message: 'Secretaria não encontrada' });
      }

      const {
        responsible_email,
        responsible_password,
        responsible_name,
        responsible_whatsapp,
        city_id,
        ...rest
      } = req.body;

      await department.update({ responsible_email, responsible_name, responsible_whatsapp, city_id, ...rest });

      // Atualiza ou cria o usuário secretário se email informado
      if (responsible_email) {
        const existing = await User.findOne({ where: { email: responsible_email } });

        if (existing) {
          const updateData = {
            department_id: department.id,
            city_id: city_id || department.city_id,
            role: 'secretary',
            name: responsible_name || existing.name,
            whatsapp: responsible_whatsapp || existing.whatsapp,
            is_active: true
          };
          // Só atualiza senha se foi informada
          if (responsible_password) updateData.password = responsible_password;
          await existing.update(updateData);
        } else if (responsible_password) {
          // Cria novo usuário se não existe e tem senha
          await User.create({
            name: responsible_name || department.name,
            email: responsible_email,
            password: responsible_password,
            phone: responsible_whatsapp || '00000000000',
            whatsapp: responsible_whatsapp,
            role: 'secretary',
            city_id: city_id || department.city_id,
            department_id: department.id,
            is_active: true
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Secretaria atualizada com sucesso!',
        department
      });
    } catch (error) {
      console.error('Erro ao atualizar departamento:', error);
      return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }
);

// Listar secretários de um departamento
router.get(
  '/:id/secretaries',
  authenticate,
  authorize('admin', 'validator'),
  async (req, res) => {
    try {
      const secretaries = await User.findAll({
        where: { department_id: req.params.id, role: 'secretary', is_active: true },
        attributes: ['id', 'name', 'email', 'whatsapp', 'phone']
      });

      return res.status(200).json({ success: true, secretaries });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }
);

module.exports = router;