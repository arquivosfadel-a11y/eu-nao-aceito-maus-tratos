const { Message, Complaint, User } = require('../models');
const { Op } = require('sequelize');

const getMessages = async (req, res) => {
  try {
    const { complaint_id } = req.params;

    const complaint = await Complaint.findByPk(complaint_id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Reclamação não encontrada' });
    }

    if (!complaint.is_public) {
      if (!req.user || 
          (req.user.id !== complaint.citizen_id && 
           req.user.id !== complaint.secretary_id)) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }
    }

    const messages = await Message.findAll({
      where: { complaint_id },
      include: [{ association: 'sender', attributes: ['id', 'name', 'avatar_url', 'role'] }],
      order: [['createdAt', 'ASC']]
    });

    // Marca como lidas somente para cidadão e protetor
    if (req.user &&
        (req.user.id === complaint.citizen_id || req.user.id === complaint.secretary_id)) {
      await Message.update(
        { is_read: true, read_at: new Date() },
        { where: { complaint_id, sender_id: { [Op.ne]: req.user.id }, is_read: false } }
      );
    }

    // Conta não lidas para retornar ao app
    const unreadCount = req.user ? await Message.count({
      where: {
        complaint_id,
        sender_id: { [Op.ne]: req.user.id },
        is_read: false
      }
    }) : 0;

    return res.status(200).json({ success: true, messages, unread_count: unreadCount });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { complaint_id } = req.params;
    const { content } = req.body;

    const complaint = await Complaint.findByPk(complaint_id, {
      include: [
        { association: 'citizen' },
        { association: 'secretary' }
      ]
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Reclamação não encontrada' });
    }

    const isCitizen = req.user.id === complaint.citizen_id;
    const isProtector = req.user.id === complaint.secretary_id;

    if (!isCitizen && !isProtector) {
      return res.status(403).json({
        success: false,
        message: 'Apenas o cidadão denunciante e o protetor responsável podem enviar mensagens'
      });
    }

    if (!['validated', 'in_progress', 'resolved'].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível enviar mensagens nesta reclamação'
      });
    }

    const message = await Message.create({
      complaint_id,
      sender_id: req.user.id,
      sender_role: isCitizen ? 'citizen' : 'protector',
      content
    });

    if (complaint.status === 'validated') {
      await complaint.update({ status: 'in_progress' });
    }

    const messageWithSender = await Message.findByPk(message.id, {
      include: [{ association: 'sender', attributes: ['id', 'name', 'avatar_url', 'role'] }]
    });

    // Emite via Socket.io para notificação em tempo real
    const io = req.app.get('io');
    if (io) {
      io.to(`complaint_${complaint_id}`).emit('message_received', messageWithSender);
    }

    return res.status(201).json({ success: true, message: messageWithSender });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

// Retorna contagem de mensagens não lidas por reclamação
const getUnreadCounts = async (req, res) => {
  try {
    const { complaint_ids } = req.query;
    if (!complaint_ids) return res.status(200).json({ success: true, unread: {} });

    const ids = complaint_ids.split(',').map(id => id.trim()).filter(Boolean);

    const unread = {};
    await Promise.all(ids.map(async (cid) => {
      const count = await Message.count({
        where: {
          complaint_id: cid,
          sender_id: { [Op.ne]: req.user.id },
          is_read: false
        }
      });
      if (count > 0) unread[cid] = count;
    }));

    return res.status(200).json({ success: true, unread });
  } catch (error) {
    console.error('Erro ao buscar não lidas:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

module.exports = { getMessages, sendMessage, getUnreadCounts };