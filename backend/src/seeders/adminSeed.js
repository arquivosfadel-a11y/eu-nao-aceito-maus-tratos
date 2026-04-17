require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

const SEED_USERS = [
  {
    name: 'Admin CausaAnimal',
    email: 'admin@causaanimal.com.br',
    password: 'CausaAnimal@2024',
    role: 'admin',
    phone: '14996114720',
  },
  {
    name: 'Validador Teste',
    email: 'validador@causaanimal.com.br',
    password: 'CausaAnimal@2024',
    role: 'validator',
    phone: '14900000001',
  },
  {
    name: 'Protetor Teste',
    email: 'protetor@causaanimal.com.br',
    password: 'CausaAnimal@2024',
    role: 'protector',
    phone: '14900000002',
  },
];

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Banco conectado');

    // Sync just enough to query — don't alter in seed
    await sequelize.sync({ alter: false });

    const created = [];
    const skipped = [];

    for (const u of SEED_USERS) {
      const [row, wasCreated] = await sequelize.query(
        `INSERT INTO users (id, name, email, password, role, phone, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), :name, :email, :password, :role, :phone, NOW(), NOW())
         ON CONFLICT (email) DO NOTHING
         RETURNING email, role`,
        {
          replacements: {
            name: u.name,
            email: u.email,
            password: await bcrypt.hash(u.password, 10),
            role: u.role,
            phone: u.phone,
          },
          type: sequelize.QueryTypes.INSERT,
        }
      );

      if (row && row.length > 0) {
        created.push({ email: u.email, role: u.role, password: u.password });
      } else {
        skipped.push(u.email);
      }
    }

    console.log('\n=== SEED CONCLUÍDO ===\n');

    if (created.length > 0) {
      console.log('✅ Usuários criados:');
      created.forEach(u => {
        console.log(`  ${u.role.padEnd(10)} | ${u.email} | senha: ${u.password}`);
      });
    }

    if (skipped.length > 0) {
      console.log('\n⏭️  Já existiam (ignorados):');
      skipped.forEach(e => console.log(`  ${e}`));
    }

    console.log('\n');
  } catch (err) {
    console.error('❌ Erro no seed:', err.message);
    if (err.original) console.error('   Detalhe:', err.original.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

run();
