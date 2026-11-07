// Middleware de autenticação JWT.
// Exige o cabeçalho "Authorization: Bearer <token>" nas rotas protegidas.
const jwt = require('jsonwebtoken');
const HttpError = require('../utils/HttpError');

function auth(req, res, next) {
  const header = req.headers.authorization;

  // Sem cabeçalho: 400, como pede a Seção 05 - Requisito 02 da documentação
  if (!header) {
    return next(HttpError.badRequest('Cabeçalho Authorization não informado'));
  }

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(HttpError.badRequest('Use o formato "Authorization: Bearer <token>"'));
  }

  try {
    // Token válido: guardamos os dados do usuário para uso nos controllers
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (err) {
    // Token expirado ou adulterado
    return next(HttpError.unauthorized('Token inválido ou expirado'));
  }
}

module.exports = auth;
