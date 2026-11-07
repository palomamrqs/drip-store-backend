// Funções auxiliares para ler query strings de busca (limit, page, fields)
const HttpError = require('./HttpError');

/**
 * Lê limit e page. limit=-1 significa "trazer tudo" e ignora page.
 * Padrões: limit 12, page 1.
 */
function parsePagination(query) {
  const limit = query.limit === undefined ? 12 : Number(query.limit);
  const page = query.page === undefined ? 1 : Number(query.page);

  if (!Number.isInteger(limit) || (limit < 1 && limit !== -1)) {
    throw HttpError.badRequest('O parâmetro "limit" deve ser um inteiro positivo ou -1');
  }
  if (!Number.isInteger(page) || page < 1) {
    throw HttpError.badRequest('O parâmetro "page" deve ser um inteiro maior que zero');
  }

  const options = limit === -1 ? {} : { limit, offset: (page - 1) * limit };
  return { limit, page, options };
}

/** Transforma "name,slug" em ['name', 'slug'] (ou null se não informado). */
function parseFields(fields, allowed) {
  if (!fields) return null;
  const list = String(fields).split(',').map((f) => f.trim()).filter(Boolean);
  const invalid = list.filter((f) => !allowed.includes(f));
  if (invalid.length) {
    throw HttpError.badRequest(`Campos inválidos em "fields": ${invalid.join(', ')}`);
  }
  return list;
}

/** Mantém apenas as chaves pedidas em "fields" (o id sempre vem junto). */
function pickFields(obj, fields) {
  if (!fields) return obj;
  const result = { id: obj.id };
  fields.forEach((f) => { result[f] = obj[f]; });
  return result;
}

module.exports = { parsePagination, parseFields, pickFields };
