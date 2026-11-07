// Middleware central de erros: toda exceção chega aqui e vira uma resposta JSON
const HttpError = require('../utils/HttpError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    const body = { message: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.status).json(body);
  }

  // JSON mal formatado no corpo da requisição
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON inválido no corpo da requisição' });
  }

  // Erros de validação do Sequelize (ex.: campo obrigatório nulo, e-mail duplicado)
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      message: 'Dados da requisição inválidos',
      details: err.errors.map((e) => e.message),
    });
  }

  if (process.env.NODE_ENV !== 'test') console.error(err);
  return res.status(500).json({ message: 'Erro interno do servidor' });
}

module.exports = errorHandler;
