const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Complaint = sequelize.define('Complaint', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  protocol: {
    type: DataTypes.STRING,
    unique: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'pending',       // aguardando validação
      'validated',     // validada e encaminhada ao protetor
      'in_progress',   // em atendimento pelo protetor
      'resolved',      // resolvida pelo protetor
      'rejected',      // rejeitada pelo validador
      'closed',        // encerrada (cidadão confirmou)
      'not_resolved'   // não resolvida (30 dias sem atendimento)
    ),
    defaultValue: 'pending'
  },
  citizen_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  city_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  department_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  secretary_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  councilman_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  neighborhood: {
    type: DataTypes.STRING,
    allowNull: true
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: false // só fica público após validação
  },
  validated_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resolution_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resolution_images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  views_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  // Confirmação de resolução pelo cidadão
  citizen_confirmed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  confirmed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  confirmation_deadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  contest_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'complaints',
  timestamps: true,
  hooks: {
    beforeCreate: async (complaint) => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const random = Math.floor(Math.random() * 90000) + 10000;
      complaint.protocol = `MT-${year}${month}-${random}`;
    }
  }
});

module.exports = Complaint;