const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ValidatorCity = sequelize.define('ValidatorCity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  validator_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  city_id: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'validator_cities',
  timestamps: true
});

module.exports = ValidatorCity;