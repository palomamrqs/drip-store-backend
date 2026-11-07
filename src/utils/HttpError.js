// Erro com status HTTP. Os services lançam esse erro e o
// middleware de erros transforma em resposta para o cliente.
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }

  static badRequest(message = 'Dados da requisição inválidos', details) {
    return new HttpError(400, message, details);
  }

  static unauthorized(message = 'Não autorizado') {
    return new HttpError(401, message);
  }

  static notFound(message = 'Recurso não encontrado') {
    return new HttpError(404, message);
  }
}

module.exports = HttpError;
