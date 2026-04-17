const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Animal = sequelize.define('Animal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  species: {
    type: DataTypes.STRING,
    allowNull: false
  },
  breed: {
    type: DataTypes.STRING,
    allowNull: true
  },
  age: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  images: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  city_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  city_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contact_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contact_phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contact_whatsapp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('available', 'adopted'),
    defaultValue: 'available'
  },
  registered_by: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'animals',
  timestamps: true
});

module.exports = Animal;
