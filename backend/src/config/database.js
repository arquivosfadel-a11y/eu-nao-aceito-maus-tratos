const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

if (process.env.DATABASE_URL) {
  // Railway / produção — usa a URL completa
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Local — usa variáveis separadas
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

const runMigrations = async () => {
  // Remove constraints NOT NULL herdadas do Participa Cidade que não se aplicam ao causaanimal
  const migrations = [
    `ALTER TABLE IF EXISTS complaints ALTER COLUMN city_id DROP NOT NULL`,
    `ALTER TABLE IF EXISTS complaints ALTER COLUMN department_id DROP NOT NULL`,
  ];
  for (const sql of migrations) {
    try {
      await sequelize.query(sql);
    } catch (e) {
      // Ignora se a coluna não existe ou constraint já foi removida
    }
  }
  console.log('✅ Migrations de compatibilidade aplicadas!');
};

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Banco de dados conectado com sucesso!');
    await sequelize.sync({ alter: true });
    console.log('✅ Tabelas sincronizadas!');
    await runMigrations();
  } catch (error) {
    console.error('❌ Erro ao conectar banco de dados:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };