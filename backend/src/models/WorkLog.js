const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WorkLog = sequelize.define('WorkLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  department_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  secretary_id: {
    type: DataTypes.UUID,
    allowNull: false
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
  images: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('working', 'finished'),
    defaultValue: 'working'
  },
  finished_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'work_logs',
  timestamps: true
});

module.exports = WorkLog;