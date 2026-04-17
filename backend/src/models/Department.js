const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
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
  responsible_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  responsible_email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  responsible_whatsapp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  categories: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  total_complaints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  resolved_complaints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'departments',
  timestamps: true
});

module.exports = Department;