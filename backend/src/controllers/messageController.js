const { Message, Complaint, User } = require('../models');
const { Op } = require('sequelize');

const PRIVILEGED_ROLES = ['admin', 'validator', 'protector'];

const getMessages = async (req, res) => {
  try {
    const { complaint_id } = req.params;

    const complaint = await Complaint.findByPk(complaint_id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Denúncia não encontrada' });
    }

    // Admin, validator e protector sempre podem ver
    if (!complaint.is_public && req.user) {
      const isPrivileged = PRIVILEGED_ROLES.includes(req.user.role);
      const isParticipant = req.user.id === complaint.citizen_id || req.user.id === complaint.secretary_id;
      if (!isPrivileged && !isParticipant) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }
    } else if (!complaint.is_public && !req.user) {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }

    const messages = await Message.findAll({
      where: { complaint_id },
      include: [{ association: 'sender', attributes: ['id', 'name', 'avatar_url', 'role'] }],
      order: [['createdAt', 'ASC']]
    });

    // Marca como lidas para quem é participante direto
    if (req.user) {
      const isParticipant = req.user.id === complaint.citizen_id || req.user.id === complaint.secretary_id;
      if (isParticipant) {
        await Message.update(
          { is_read: true, read_at: new Date() },
          { where: { complaint_id, sender_id: { [Op.ne]: req.user.id }, is_read: false } }
        );
      }
    }

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

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Conteúdo da mensagem é obrigatório' });
    }

    const complaint = await Complaint.findByPk(complaint_id, {
      include: [
        { association: 'citizen' },
        { association: 'secretary' }
      ]
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Denúncia não encontrada' });
    }

    // Determina o papel do remetente
    const isCitizen    = req.user.id === complaint.citizen_id;
    const isAssigned   = req.user.id === complaint.secretary_id;
    const isPrivileged = PRIVILEGED_ROLES.includes(req.user.role);

    if (!isCitizen && !isAssigned && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para enviar mensagens nesta denúncia'
      });
    }

    let senderRole = req.user.role; // 'citizen', 'protector', 'validator', 'admin'
    if (isCitizen) senderRole = 'citizen';
    else if (isAssigned && req.user.role === 'protector') senderRole = 'protector';

    const message = await Message.create({
      complaint_id,
      sender_id:   req.user.id,
      sender_role: senderRole,
      content:     content.trim(),
      is_system:   false
    });

    // Ao escrever no chat, muda status de validated → in_progress automaticamente
    if (complaint.status === 'validated' && (isCitizen || isAssigned)) {
      await complaint.update({ status: 'in_progress' });
    }

    const messageWithSender = await Message.findByPk(message.id, {
      include: [{ association: 'sender', attributes: ['id', 'name', 'avatar_url', 'role'] }]
    });

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
