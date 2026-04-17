const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const messageRoutes = require('./routes/messageRoutes');
const cityRoutes = require('./routes/cityRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const workLogRoutes = require('./routes/workLogRoutes');
const animalRoutes = require('./routes/animalRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/complaints', messageRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/work-logs', workLogRoutes);
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);
app.use('/api/animals', animalRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ Eu Não Aceito Maus Tratos API funcionando!',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// Socket.io - Chat em tempo real
io.on('connection', (socket) => {
  console.log(`🔌 Usuário conectado: ${socket.id}`);

  socket.on('join_complaint', (complaint_id) => {
    socket.join(`complaint_${complaint_id}`);
    console.log(`👥 Socket ${socket.id} entrou na sala: complaint_${complaint_id}`);
  });

  socket.on('leave_complaint', (complaint_id) => {
    socket.leave(`complaint_${complaint_id}`);
    console.log(`👋 Socket ${socket.id} saiu da sala: complaint_${complaint_id}`);
  });

  socket.on('new_message', (data) => {
    const { complaint_id, message } = data;
    socket.to(`complaint_${complaint_id}`).emit('message_received', message);
    console.log(`💬 Nova mensagem na reclamação ${complaint_id}`);
  });

  socket.on('typing', (data) => {
    const { complaint_id, user_name } = data;
    socket.to(`complaint_${complaint_id}`).emit('user_typing', { user_name });
  });

  socket.on('stop_typing', (complaint_id) => {
    socket.to(`complaint_${complaint_id}`).emit('user_stop_typing');
  });

  socket.on('status_updated', (data) => {
    const { complaint_id, status } = data;
    io.to(`complaint_${complaint_id}`).emit('complaint_status_changed', { status });
  });

  socket.on('disconnect', () => {
    console.log(`❌ Usuário desconectado: ${socket.id}`);
  });
});

app.set('io', io);

// Tratamento de erros globais
app.use((err, req, res, next) => {
  console.error('Erro:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor'
  });
});

// ============================================================
// JOB 1 — Marca como "não resolvida" após 30 dias sem atendimento
// ============================================================
const startNotResolvedJob = async () => {
  const { Op } = require('sequelize');

  const runJob = async () => {
    try {
      const { Complaint } = require('./models');

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await Complaint.update(
        { status: 'not_resolved' },
        {
          where: {
            status: 'validated',
            validated_at: { [Op.lte]: thirtyDaysAgo }
          }
        }
      );

      const count = result[0];
      if (count > 0) {
        console.log(`⚠️  Job 30 dias: ${count} reclamação(ões) marcada(s) como "não resolvida"`);
      }
    } catch (error) {
      console.error('❌ Erro no job de não resolvidas:', error.message);
    }
  };

  await runJob();
  setInterval(runJob, 3_600_000);
  console.log('⏰ Job 30 dias ativado (roda a cada 1 hora)');
};

// ============================================================
// JOB 2 — Fecha reclamações resolvidas após 5 dias sem resposta
// ============================================================
const startConfirmationJob = async () => {
  const runJob = async () => {
    try {
      const { Complaint, Message } = require('./models');
      const { Op } = require('sequelize');

      const expired = await Complaint.findAll({
        where: {
          status: 'resolved',
          citizen_confirmed: { [Op.eq]: false },
          confirmation_deadline: { [Op.lt]: new Date() }
        }
      });

      for (const complaint of expired) {
        await complaint.update({ status: 'closed' });
        await Message.create({
          complaint_id: complaint.id,
          sender_id: null,
          content: '🔒 Prazo de 5 dias encerrado sem resposta do cidadão. Reclamação fechada automaticamente.',
          is_system: true
        });
        console.log(`🔒 Job 5 dias: reclamação ${complaint.protocol} fechada automaticamente.`);
      }

      if (expired.length > 0) {
        console.log(`🔒 Job 5 dias: ${expired.length} reclamação(ões) fechada(s).`);
      }
    } catch (error) {
      console.error('❌ Erro no job de confirmação:', error.message);
    }
  };

  await runJob();
  setInterval(runJob, 3_600_000);
  console.log('⏰ Job 5 dias ativado (roda a cada 1 hora)');
};

// Iniciar servidor
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  await startNotResolvedJob();
  await startConfirmationJob();

  server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 API disponível em: http://localhost:${PORT}/api`);
    console.log(`🔌 Socket.io ativo`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
  });
};

startServer();