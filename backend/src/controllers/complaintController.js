const { Complaint, User, City, Message } = require('../models');
const { uploadMultipleImages } = require('../services/cloudinary');
const {
  notifyNewComplaint,
  notifyProtectorAssigned,
  notifyComplaintValidated,
  notifyComplaintResolved
} = require('../services/whatsapp');
const { Op } = require('sequelize');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

// ─────────────────────────────────────────────
// Enviar push notification via Expo Push API
// ─────────────────────────────────────────────
const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!pushToken || !pushToken.startsWith('ExponentPushToken')) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
        channelId: 'default',
      }),
    });
    console.log(`✅ Push enviado para: ${pushToken}`);
  } catch (e) {
    console.log('Erro ao enviar push:', e.message);
  }
};

const createComplaint = async (req, res) => {
  try {
    const { title, description, category, latitude, longitude, address, neighborhood, city_id } = req.body;

    // city_id é opcional — vem do body (GPS da denúncia) ou do cadastro do usuário como fallback
    const city_id_final = city_id || req.user.city_id || null;

    let images = [];
    if (req.files && req.files.length > 0) {
      images = await uploadMultipleImages(req.files);
      req.files.forEach(file => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); });
    }

    const complaint = await Complaint.create({
      title, description,
      category: category || 'Geral',
      city_id: city_id_final,
      citizen_id: req.user.id,
      latitude, longitude, address, neighborhood,
      images,
      status: 'pending',
      is_public: false
    });

    return res.status(201).json({
      success: true,
      message: 'Denúncia enviada com sucesso! Aguarde a validação.',
      complaint: { id: complaint.id, protocol: complaint.protocol, status: complaint.status }
    });
  } catch (error) {
    console.error('Erro ao criar denúncia:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor', debug: error.message });
  }
};

const getComplaints = async (req, res) => {
  try {
    const { city_id, city_ids, status, category, page = 1, limit = 20 } = req.query;

    const where = {};

    const isPrivileged = req.user && ['validator', 'admin', 'protector'].includes(req.user.role);
    if (!isPrivileged) {
      where.is_public = true;
    }

    if (city_id) {
      where.city_id = city_id;
    } else if (city_ids) {
      const ids = city_ids.split(',').map(id => id.trim()).filter(Boolean);
      if (ids.length > 0) where.city_id = { [Op.in]: ids };
    }

    if (status) where.status = status;
    if (category) where.category = category;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Complaint.findAndCountAll({
      where,
      include: [
        { association: 'citizen', attributes: ['id', 'name', 'avatar_url', 'phone', 'whatsapp'] },
        { association: 'city', attributes: ['id', 'name', 'state'] },
        { association: 'secretary', attributes: ['id', 'name', 'avatar_url'], required: false }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return res.status(200).json({
      success: true,
      total: count,
      pages: Math.ceil(count / parseInt(limit)),
      current_page: parseInt(page),
      complaints: rows
    });
  } catch (error) {
    console.error('Erro ao buscar denúncias:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findByPk(id, {
      include: [
        { association: 'citizen', attributes: ['id', 'name', 'avatar_url', 'phone', 'whatsapp'] },
        { association: 'city', attributes: ['id', 'name', 'state'] },
        { association: 'secretary', attributes: ['id', 'name', 'avatar_url'], required: false }
      ]
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Denúncia não encontrada' });
    }

    if (!complaint.is_public) {
      if (!req.user || req.user.id !== complaint.citizen_id) {
        if (!req.user || !['validator', 'admin'].includes(req.user.role)) {
          return res.status(403).json({ success: false, message: 'Denúncia não disponível' });
        }
      }
    }

    await complaint.increment('views_count');

    return res.status(200).json({ success: true, complaint });
  } catch (error) {
    console.error('Erro ao buscar denúncia:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

// Validador aprova e encaminha ao protetor escolhido
const validateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, protector_id, rejection_reason, priority, title, description } = req.body;

    const complaint = await Complaint.findByPk(id, {
      include: [{ association: 'citizen' }]
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Denúncia não encontrada' });
    }

    if (complaint.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Denúncia já foi processada' });
    }

    if (action === 'approve') {
      if (!protector_id) {
        return res.status(400).json({ success: false, message: 'Informe o protetor responsável.' });
      }

      const protector = await User.findOne({
        where: { id: protector_id, role: 'protector', is_active: true }
      });

      if (!protector) {
        return res.status(400).json({ success: false, message: 'Protetor não encontrado ou inativo.' });
      }

      const updateData = {
        status: 'validated',
        is_public: true,
        validated_at: new Date(),
        priority: priority || 'medium',
        secretary_id: protector.id  // campo técnico mantido
      };

      if (title && title.trim()) updateData.title = title.trim();
      if (description && description.trim()) updateData.description = description.trim();

      await complaint.update(updateData);

      // Notificar cidadão via WhatsApp
      if (complaint.citizen?.whatsapp) {
        await notifyComplaintValidated(complaint.citizen.whatsapp, complaint);
      }

      // Notificar protetor via WhatsApp
      if (protector.whatsapp) {
        await notifyNewComplaint(protector.whatsapp, complaint);
      }

      // Push para o protetor
      if (protector.push_token) {
        await sendPushNotification(
          protector.push_token,
          '🐾 Nova denúncia encaminhada!',
          `Uma denúncia foi encaminhada para você: "${complaint.title}"`,
          { complaintId: complaint.id, screen: 'ProtectorComplaintDetail' }
        );
      }

      // Push para o cidadão
      const citizen = await User.findByPk(complaint.citizen_id);
      if (citizen?.push_token) {
        await sendPushNotification(
          citizen.push_token,
          '✅ Denúncia validada!',
          `Sua denúncia "${complaint.title}" foi aceita e encaminhada ao protetor.`,
          { complaintId: complaint.id, screen: 'ComplaintDetail' }
        );
      }

      return res.status(200).json({ success: true, message: 'Denúncia validada e encaminhada ao protetor com sucesso!' });

    } else if (action === 'reject') {
      await complaint.update({ status: 'rejected', rejection_reason, is_public: false });

      const citizen = await User.findByPk(complaint.citizen_id);
      if (citizen?.push_token) {
        await sendPushNotification(
          citizen.push_token,
          '❌ Denúncia não aprovada',
          `Sua denúncia "${complaint.title}" não pôde ser processada.`,
          { complaintId: complaint.id, screen: 'ComplaintDetail' }
        );
      }

      return res.status(200).json({ success: true, message: 'Denúncia rejeitada.' });
    }

    return res.status(400).json({ success: false, message: 'Ação inválida. Use "approve" ou "reject"' });

  } catch (error) {
    console.error('Erro ao validar denúncia:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution_description } = req.body;

    const complaint = await Complaint.findByPk(id, {
      include: [{ association: 'citizen' }]
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Denúncia não encontrada' });
    }

    // Protetor só pode atualizar suas próprias denúncias
    if (req.user.role === 'protector' && complaint.secretary_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Você não tem permissão para atualizar esta denúncia' });
    }

    const updateData = { status };

    if (status === 'resolved') {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'É obrigatório enviar pelo menos uma foto do atendimento realizado.'
        });
      }

      if (!resolution_description || !resolution_description.trim()) {
        return res.status(400).json({
          success: false,
          message: 'É obrigatório descrever o atendimento realizado.'
        });
      }

      let resolution_images = [];
      resolution_images = await uploadMultipleImages(req.files);
      req.files.forEach(file => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); });

      updateData.resolved_at = new Date();
      updateData.resolution_description = resolution_description;
      updateData.resolution_images = resolution_images;
      updateData.confirmation_deadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      updateData.contest_count = 0;

      if (complaint.citizen?.whatsapp) {
        await notifyComplaintResolved(complaint.citizen.whatsapp, complaint);
      }

      const citizen = await User.findByPk(complaint.citizen_id);
      if (citizen?.push_token) {
        await sendPushNotification(
          citizen.push_token,
          '🎉 Denúncia atendida!',
          `Sua denúncia "${complaint.title}" foi atendida! Confirme se o problema foi resolvido.`,
          { complaintId: complaint.id, screen: 'ComplaintDetail' }
        );
      }

      await Message.create({
        complaint_id: complaint.id,
        sender_id: req.user.id,
        sender_role: 'protector',
        content: `✅ Atendimento realizado! "${resolution_description}" — Você tem 5 dias para confirmar ou contestar.`,
        is_system: true
      });
    }

    if (status === 'in_progress') {
      const citizen = await User.findByPk(complaint.citizen_id);
      if (citizen?.push_token) {
        await sendPushNotification(
          citizen.push_token,
          '🐾 Em atendimento!',
          `Sua denúncia "${complaint.title}" está sendo atendida pelo protetor.`,
          { complaintId: complaint.id, screen: 'ComplaintDetail' }
        );
      }
    }

    await complaint.update(updateData);

    return res.status(200).json({ success: true, message: 'Status atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

const confirmResolution = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const complaint = await Complaint.findByPk(id, {
      include: [{ association: 'citizen' }]
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Denúncia não encontrada' });
    }

    if (complaint.citizen_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Apenas o cidadão que registrou a denúncia pode confirmar ou contestar.' });
    }

    if (complaint.status !== 'resolved') {
      return res.status(400).json({ success: false, message: 'Esta denúncia não está aguardando confirmação.' });
    }

    if (complaint.citizen_confirmed) {
      return res.status(400).json({ success: false, message: 'Você já confirmou a resolução desta denúncia.' });
    }

    if (action === 'confirm') {
      await complaint.update({
        status: 'closed',
        citizen_confirmed: true,
        confirmed_at: new Date()
      });

      await Message.create({
        complaint_id: complaint.id,
        sender_id: req.user.id,
        sender_role: 'citizen',
        content: '✅ Cidadão confirmou que o problema foi resolvido. Denúncia encerrada com sucesso!',
        is_system: true
      });

      // Notificar protetor
      if (complaint.secretary_id) {
        const protector = await User.findByPk(complaint.secretary_id);
        if (protector?.push_token) {
          await sendPushNotification(
            protector.push_token,
            '✅ Atendimento confirmado!',
            `O cidadão confirmou que "${complaint.title}" foi resolvida com sucesso.`,
            { complaintId: complaint.id, screen: 'ProtectorComplaintDetail' }
          );
        }
      }

      return res.status(200).json({ success: true, message: 'Resolução confirmada! Obrigado pelo feedback.' });

    } else if (action === 'contest') {
      const contestCount = (complaint.contest_count || 0) + 1;

      if (contestCount > 3) {
        return res.status(400).json({
          success: false,
          message: 'Você atingiu o limite de 3 contestações para esta denúncia.'
        });
      }

      await complaint.update({
        status: 'in_progress',
        contest_count: contestCount,
        confirmation_deadline: null
      });

      await Message.create({
        complaint_id: complaint.id,
        sender_id: req.user.id,
        sender_role: 'citizen',
        content: `⚠️ Cidadão contestou a resolução (${contestCount}/3). O problema não foi resolvido satisfatoriamente. O protetor deve retomar o atendimento.`,
        is_system: true
      });

      // Notificar protetor
      if (complaint.secretary_id) {
        const protector = await User.findByPk(complaint.secretary_id);
        if (protector?.push_token) {
          await sendPushNotification(
            protector.push_token,
            '⚠️ Atendimento contestado!',
            `O cidadão contestou a resolução de "${complaint.title}". Verifique e retome o atendimento.`,
            { complaintId: complaint.id, screen: 'ProtectorComplaintDetail' }
          );
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Contestação registrada. O protetor será notificado.',
        contest_count: contestCount
      });
    }

    return res.status(400).json({ success: false, message: 'Ação inválida. Use "confirm" ou "contest"' });

  } catch (error) {
    console.error('Erro ao confirmar resolução:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

const getMyComplaints = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const where = req.user.role === 'protector'
      ? { secretary_id: req.user.id }
      : { citizen_id: req.user.id };
    if (status) where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Complaint.findAndCountAll({
      where,
      include: [
        { association: 'city', attributes: ['id', 'name', 'state'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return res.status(200).json({
      success: true,
      total: count,
      pages: Math.ceil(count / parseInt(limit)),
      current_page: parseInt(page),
      complaints: rows
    });
  } catch (error) {
    console.error('Erro ao buscar minhas denúncias:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

const getCityStats = async (req, res) => {
  try {
    const { city_id } = req.params;

    const total = await Complaint.count({ where: { city_id, is_public: true } });
    const resolved = await Complaint.count({ where: { city_id, status: { [Op.in]: ['resolved', 'closed'] } } });
    const in_progress = await Complaint.count({ where: { city_id, status: 'in_progress' } });
    const pending = await Complaint.count({ where: { city_id, status: 'validated' } });
    const resolution_rate = total > 0 ? ((resolved / total) * 100).toFixed(1) : 0;

    return res.status(200).json({
      success: true,
      stats: { total, resolved, in_progress, pending, resolution_rate: parseFloat(resolution_rate) }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

// Validador — lista denúncias pendentes de validação
const getPendingComplaints = async (req, res) => {
  try {
    const { city_id, city_ids, page = 1, limit = 50 } = req.query;

    const where = { status: 'pending' };

    if (city_id) {
      where.city_id = city_id;
    } else if (city_ids) {
      const ids = city_ids.split(',').map(id => id.trim()).filter(Boolean);
      if (ids.length > 0) where.city_id = { [Op.in]: ids };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Complaint.findAndCountAll({
      where,
      include: [
        { association: 'citizen', attributes: ['id', 'name', 'phone', 'whatsapp', 'avatar_url'] },
        { association: 'city', attributes: ['id', 'name', 'state'] }
      ],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    return res.status(200).json({
      success: true,
      total: count,
      pages: Math.ceil(count / parseInt(limit)),
      current_page: parseInt(page),
      complaints: rows
    });
  } catch (error) {
    console.error('Erro ao buscar denúncias pendentes:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

// Validador — lista todos os protetores disponíveis com localização
const getProtectors = async (req, res) => {
  try {
    const { city_id } = req.query;

    const where = { role: 'protector', is_active: true };
    if (city_id) where.city_id = city_id;

    const protectors = await User.findAll({
      where,
      attributes: ['id', 'name', 'email', 'phone', 'whatsapp', 'avatar_url', 'city_id'],
      include: [
        { association: 'city', attributes: ['id', 'name', 'state', 'latitude', 'longitude'] }
      ],
      order: [['name', 'ASC']]
    });

    return res.status(200).json({ success: true, protectors });
  } catch (error) {
    console.error('Erro ao listar protetores:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

// Validador — atribui ou reatribui protetor a uma denúncia já validada
const assignProtector = async (req, res) => {
  try {
    const { id } = req.params;
    const { protector_id, notes } = req.body;

    if (!protector_id) {
      return res.status(400).json({ success: false, message: 'Informe o protetor responsável.' });
    }

    const complaint = await Complaint.findByPk(id, {
      include: [{ association: 'citizen' }]
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Denúncia não encontrada' });
    }

    if (!['validated', 'in_progress', 'not_resolved'].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: 'Só é possível reatribuir denúncias com status validated, in_progress ou not_resolved.'
      });
    }

    const protector = await User.findOne({
      where: { id: protector_id, role: 'protector', is_active: true }
    });

    if (!protector) {
      return res.status(400).json({ success: false, message: 'Protetor não encontrado ou inativo.' });
    }

    const previousProtectorId = complaint.secretary_id;

    await complaint.update({
      secretary_id: protector.id,
      status: 'validated'   // volta para validated ao reatribuir
    });

    // Mensagem de sistema no chat
    const assignNote = notes ? ` Observação: ${notes}` : '';
    await Message.create({
      complaint_id: complaint.id,
      sender_id: req.user.id,
      sender_role: 'validator',
      content: `🔄 Protetor responsável atualizado para ${protector.name}.${assignNote}`,
      is_system: true
    });

    // Notificar novo protetor via WhatsApp
    if (protector.whatsapp) {
      await notifyProtectorAssigned(protector.whatsapp, complaint);
    }

    // Push para o novo protetor
    if (protector.push_token) {
      await sendPushNotification(
        protector.push_token,
        '🐾 Denúncia atribuída a você!',
        `Você foi designado para atender: "${complaint.title}"`,
        { complaintId: complaint.id, screen: 'ProtectorComplaintDetail' }
      );
    }

    return res.status(200).json({
      success: true,
      message: `Denúncia reatribuída ao protetor ${protector.name} com sucesso!`
    });
  } catch (error) {
    console.error('Erro ao atribuir protetor:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

module.exports = {
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
};
