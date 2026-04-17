const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const City = sequelize.define('City', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING(2),
    allowNull: false
  },
  ibge_code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false // cidade precisa ser ativada por vocês
  },
  mayor_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  population: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  logo_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  contract_start: {
    type: DataTypes.DATE,
    allowNull: true
  },
  contract_end: {
    type: DataTypes.DATE,
    allowNull: true
  },
  contact_email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contact_phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city_type: {
    type: DataTypes.ENUM('prefeitura', 'camara'),
    defaultValue: 'prefeitura',
    allowNull: false
  }
}, {
  tableName: 'cities',
  timestamps: true
});

module.exports = City;