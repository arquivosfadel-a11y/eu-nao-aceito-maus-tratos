const twilio = require('twilio');
require('dotenv').config();

let client = null;

const getClient = () => {
  if (!client) {
    if (!process.env.TWILIO_ACCOUNT_SID ||
        !process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
      console.warn('⚠️ Twilio não configurado - WhatsApp desativado por enquanto');
      return null;
    }
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return client;
};

const sendWhatsApp = async (to, message) => {
  try {
    const twilioClient = getClient();
    if (!twilioClient) {
      console.log(`📱 [SIMULADO] WhatsApp para ${to}: ${message}`);
      return { success: true, simulated: true };
    }

    const formattedNumber = to.startsWith('whatsapp:')
      ? to
      : `whatsapp:+55${to.replace(/\D/g, '')}`;

    const response = await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: formattedNumber,
      body: message
    });

    console.log(`✅ WhatsApp enviado para ${to}: ${response.sid}`);
    return { success: true, sid: response.sid };
  } catch (error) {
    console.error(`❌ Erro ao enviar WhatsApp para ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

const notifyNewComplaint = async (protectorPhone, complaint) => {
  const message = `🔔 *Eu Não Aceito Maus Tratos*\n\nVocê recebeu uma nova denúncia!\n\n📋 *Protocolo:* ${complaint.protocol}\n📁 *Categoria:* ${complaint.category}\n📍 *Local:* ${complaint.address || 'Não informado'}\n\n👉 Acesse a plataforma para visualizar e atender.`;
  return await sendWhatsApp(protectorPhone, message);
};

const notifyProtectorAssigned = async (protectorPhone, complaint) => {
  const message = `🐾 *Eu Não Aceito Maus Tratos*\n\nUma denúncia foi atribuída a você!\n\n📋 *Protocolo:* ${complaint.protocol}\n📁 *Categoria:* ${complaint.category}\n📍 *Local:* ${complaint.address || 'Não informado'}\n\n👉 Acesse a plataforma para visualizar e atender.`;
  return await sendWhatsApp(protectorPhone, message);
};

const notifyCitizenReply = async (citizenPhone, complaint) => {
  const message = `💬 *Eu Não Aceito Maus Tratos*\n\nVocê recebeu uma resposta na sua denúncia!\n\n📋 *Protocolo:* ${complaint.protocol}\n📁 *Categoria:* ${complaint.category}\n\n👉 Acesse o app para visualizar e responder.`;
  return await sendWhatsApp(citizenPhone, message);
};

const notifyProtectorReply = async (protectorPhone, complaint) => {
  const message = `💬 *Eu Não Aceito Maus Tratos*\n\nO cidadão respondeu na denúncia!\n\n📋 *Protocolo:* ${complaint.protocol}\n📁 *Categoria:* ${complaint.category}\n\n👉 Acesse a plataforma para visualizar e responder.`;
  return await sendWhatsApp(protectorPhone, message);
};

const notifyComplaintValidated = async (citizenPhone, complaint) => {
  const message = `✅ *Eu Não Aceito Maus Tratos*\n\nSua denúncia foi validada e encaminhada ao protetor!\n\n📋 *Protocolo:* ${complaint.protocol}\n📁 *Categoria:* ${complaint.category}\n\n👉 Acompanhe no app.`;
  return await sendWhatsApp(citizenPhone, message);
};

const notifyComplaintResolved = async (citizenPhone, complaint) => {
  const message = `🎉 *Eu Não Aceito Maus Tratos*\n\nSua denúncia foi atendida!\n\n📋 *Protocolo:* ${complaint.protocol}\n📁 *Categoria:* ${complaint.category}\n\n👉 Confirme o atendimento no app.`;
  return await sendWhatsApp(citizenPhone, message);
};

module.exports = {
  sendWhatsApp,
  notifyNewComplaint,
  notifyProtectorAssigned,
  notifyCitizenReply,
  notifyProtectorReply,
  notifyComplaintValidated,
  notifyComplaintResolved
};
