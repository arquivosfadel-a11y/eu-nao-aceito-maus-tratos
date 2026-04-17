const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  complaint_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  sender_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  sender_role: {
    type: DataTypes.ENUM('citizen', 'secretary'),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  attachment_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  attachment_type: {
    type: DataTypes.ENUM('image', 'document', 'none'),
    defaultValue: 'none'
  },
  whatsapp_notified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  whatsapp_notified_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'messages',
  timestamps: true
});

module.exports = Message;