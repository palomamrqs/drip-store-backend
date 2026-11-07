// Configuração de conexão com o banco de dados.
// É usada tanto pela aplicação quanto pelo sequelize-cli (migrations e seeders).
require('dotenv').config({ quiet: true });

const common = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'drip_store',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  dialect: 'mysql',
  logging: false,
  define: {
    // created_at / updated_at em vez de createdAt / updatedAt
    underscored: true,
  },
};

module.exports = {
  development: common,
  production: common,
  // Nos testes usamos SQLite em memória: não precisa de MySQL instalado
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    define: { underscored: true },
  },
};
