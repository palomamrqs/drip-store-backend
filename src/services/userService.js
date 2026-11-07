// Regras de negócio de usuários: cadastro, consulta, atualização, remoção e login
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const HttpError = require('../utils/HttpError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Nunca devolvemos a senha (nem o hash) nas respostas
function toPublic(user) {
  return {
    id: user.id, firstname: user.firstname, surname: user.surname, email: user.email,
  };
}

async function findById(id) {
  const user = await User.findByPk(id);
  if (!user) throw HttpError.notFound('Usuário não encontrado');
  return toPublic(user);
}

async function create(data) {
  const {
    firstname, surname, email, password, confirmPassword,
  } = data || {};

  const errors = [];
  if (!firstname) errors.push('firstname é obrigatório');
  if (!surname) errors.push('surname é obrigatório');
  if (!email || !EMAIL_REGEX.test(email)) errors.push('email inválido');
  if (!password) errors.push('password é obrigatório');
  if (password !== confirmPassword) errors.push('password e confirmPassword não conferem');
  if (errors.length) throw HttpError.badRequest('Dados da requisição inválidos', errors);

  if (await User.findOne({ where: { email } })) {
    throw HttpError.badRequest('Já existe um usuário com este e-mail');
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    firstname, surname, email, password: hash,
  });
  return toPublic(user);
}

async function update(id, data) {
  const { firstname, surname, email } = data || {};

  const errors = [];
  if (!firstname) errors.push('firstname é obrigatório');
  if (!surname) errors.push('surname é obrigatório');
  if (!email || !EMAIL_REGEX.test(email)) errors.push('email inválido');
  if (errors.length) throw HttpError.badRequest('Dados da requisição inválidos', errors);

  const user = await User.findByPk(id);
  if (!user) throw HttpError.notFound('Usuário não encontrado');

  await user.update({ firstname, surname, email });
}

async function remove(id) {
  const deleted = await User.destroy({ where: { id } });
  if (!deleted) throw HttpError.notFound('Usuário não encontrado');
}

// Gera o token JWT quando e-mail e senha conferem
async function generateToken({ email, password } = {}) {
  if (!email || !password) throw HttpError.badRequest('Informe email e password');

  const user = await User.findOne({ where: { email } });
  const valid = user && await bcrypt.compare(password, user.password);
  if (!valid) throw HttpError.badRequest('E-mail ou senha incorretos');

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
  );
  return { token };
}

module.exports = {
  findById, create, update, remove, generateToken,
};
