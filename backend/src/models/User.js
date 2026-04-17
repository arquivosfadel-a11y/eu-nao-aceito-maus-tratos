const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cpf: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM(
      'citizen',
      'protector',
      'validator',
      'admin'
    ),
    defaultValue: 'citizen'
  },
  city_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  city_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  department_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  avatar_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  whatsapp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // ✅ NOVO: Token para notificações push (Expo)
  push_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verification_code: {
    type: DataTypes.STRING(6),
    allowNull: true
  },
  verification_code_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  party: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  councilman_number: {
    type: DataTypes.STRING(10),
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true
});

User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 12);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password') && !user.password.startsWith('$2')) {
    user.password = await bcrypt.hash(user.password, 12);
  }
});

User.prototype.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = User;