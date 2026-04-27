const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');

router.post('/', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Nome e e-mail são obrigatórios.' });
  }

  try {
    await sequelize.query(
      `INSERT INTO newsletter_subscribers (id, name, email, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), :name, :email, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      { replacements: { name, email }, type: sequelize.QueryTypes.INSERT }
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('Newsletter error:', err);
    return res.status(500).json({ success: false, message: 'Erro interno.' });
  }
});

module.exports = router;
