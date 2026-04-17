const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

const DATABASE_URL = 'postgresql://postgres:zUDDVitqJpJGqEVJDILnjfFEdjaJNcSi@mainline.proxy.rlwy.net:38266/railway';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  logging: false
});

async function resetPassword() {
  try {
    await sequelize.authenticate();
    console.log('Conectado ao banco!');
    
    const hash = await bcrypt.hash('Teste123', 10);
    console.log('Hash gerado:', hash);
    
    await sequelize.query(
      'UPDATE users SET password = :hash WHERE email = :email',
      { replacements: { hash, email: 'admin@participacidade.com.br' } }
    );
    
    console.log('Senha atualizada com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
}

resetPassword();