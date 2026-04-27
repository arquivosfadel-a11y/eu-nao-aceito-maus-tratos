const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// Define model inline (simples, sem arquivo separado)
const NewsletterSubscriber = sequelize.define('NewsletterSubscriber', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
}, {
  tableName: 'newsletter_subscribers',
  timestamps: true,
});

router.post('/', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Nome e e-mail são obrigatórios.' });
  }

  try {
    await NewsletterSubscriber.findOrCreate({ where: { email }, defaults: { name, email } });
    return res.json({ success: true });
  } catch (err) {
    console.error('Newsletter error:', err);
    return res.status(500).json({ success: false, message: 'Erro interno.' });
  }
});

module.exports = router;
