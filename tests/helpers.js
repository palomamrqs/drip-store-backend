// Funções compartilhadas pelos testes.
// O banco de testes é um SQLite em memória criado pelas MESMAS migrations do MySQL,
// então os testes também garantem que as migrations funcionam.
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'src', 'database', 'migrations');

async function setupDatabase() {
  // Recria o banco do zero rodando todas as migrations em ordem
  await sequelize.drop();
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.js')).sort();
  const queryInterface = sequelize.getQueryInterface();
  for (const file of files) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const migration = require(path.join(MIGRATIONS_DIR, file));
    // eslint-disable-next-line no-await-in-loop
    await migration.up(queryInterface, Sequelize);
  }
}

const defaultUser = {
  firstname: 'Maria',
  surname: 'Silva',
  email: 'maria@mail.com',
  password: '123@123',
  confirmPassword: '123@123',
};

/** Cria um usuário (se ainda não existir) e devolve um token JWT válido. */
async function getToken(user = defaultUser) {
  await request(app).post('/v1/user').send(user);
  const res = await request(app).post('/v1/user/token').send({ email: user.email, password: user.password });
  return res.body.token;
}

// Imagem PNG de 1x1 pixel em base64
const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

module.exports = {
  app, request, sequelize, setupDatabase, getToken, defaultUser, PNG_BASE64,
};
