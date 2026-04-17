const cron = require('node-cron');
const { Complaint, Message } = require('../models');
const { Op } = require('sequelize');

// Roda a cada hora
cron.schedule('0 * * * *', async () => {
  console.log('[JOB] Verificando reclamações aguardando confirmação...');

  try {
    // 1. Fecha reclamações resolved com prazo de 5 dias expirado
    const expired = await Complaint.findAll({
      where: {
        status: 'resolved',
        citizen_confirmed: false,
        confirmation_deadline: { [Op.lt]: new Date() }
      }
    });

    for (const complaint of expired) {
      await complaint.update({ status: 'closed', citizen_confirmed: false });
      await Message.create({
        complaint_id: complaint.id,
        sender_id: null,
        content: '🔒 Prazo de 5 dias encerrado sem resposta do cidadão. Reclamação fechada automaticamente.',
        is_system: true
      });
      console.log(`[JOB] Reclamação ${complaint.protocol} fechada automaticamente.`);
    }

    // 2. Marca como not_resolved reclamações validated há mais de 30 dias sem atendimento
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const notResolved = await Complaint.findAll({
      where: {
        status: 'validated',
        validated_at: { [Op.lt]: thirtyDaysAgo }
      }
    });

    for (const complaint of notResolved) {
      await complaint.update({ status: 'not_resolved' });
      console.log(`[JOB] Reclamação ${complaint.protocol} marcada como não resolvida.`);
    }

    console.log(`[JOB] Concluído: ${expired.length} fechadas, ${notResolved.length} marcadas como não resolvidas.`);
  } catch (error) {
    console.error('[JOB] Erro:', error);
  }
});

module.exports = {};