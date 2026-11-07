// Regras de negócio de categorias
const { Category } = require('../models');
const HttpError = require('../utils/HttpError');
const { parsePagination, parseFields } = require('../utils/query');

const FIELDS = ['name', 'slug', 'use_in_menu'];

function toPublic(c) {
  return {
    id: c.id, name: c.name, slug: c.slug, use_in_menu: Boolean(c.use_in_menu),
  };
}

function validate(data) {
  const { name, slug, use_in_menu: useInMenu } = data || {};
  const errors = [];
  if (!name || typeof name !== 'string') errors.push('name é obrigatório');
  if (!slug || typeof slug !== 'string') errors.push('slug é obrigatório');
  if (useInMenu !== undefined && typeof useInMenu !== 'boolean') errors.push('use_in_menu deve ser booleano');
  if (errors.length) throw HttpError.badRequest('Dados da requisição inválidos', errors);
  return { name, slug, use_in_menu: Boolean(useInMenu) };
}

async function search(query) {
  const { limit, page, options } = parsePagination(query);
  const fields = parseFields(query.fields, FIELDS);

  const where = {};
  if (query.use_in_menu !== undefined) {
    if (!['true', 'false'].includes(query.use_in_menu)) {
      throw HttpError.badRequest('use_in_menu deve ser true ou false');
    }
    where.use_in_menu = query.use_in_menu === 'true';
  }

  const { rows, count } = await Category.findAndCountAll({
    where,
    attributes: fields ? ['id', ...fields] : ['id', ...FIELDS],
    order: [['id', 'ASC']],
    ...options,
  });

  const data = rows.map((r) => {
    const json = r.toJSON();
    if ('use_in_menu' in json) json.use_in_menu = Boolean(json.use_in_menu);
    return json;
  });

  return {
    data, total: count, limit, page,
  };
}

async function findById(id) {
  const category = await Category.findByPk(id);
  if (!category) throw HttpError.notFound('Categoria não encontrada');
  return toPublic(category);
}

async function create(data) {
  const category = await Category.create(validate(data));
  return toPublic(category);
}

async function update(id, data) {
  const values = validate(data);
  const category = await Category.findByPk(id);
  if (!category) throw HttpError.notFound('Categoria não encontrada');
  await category.update(values);
}

async function remove(id) {
  const deleted = await Category.destroy({ where: { id } });
  if (!deleted) throw HttpError.notFound('Categoria não encontrada');
}

module.exports = {
  search, findById, create, update, remove,
};
