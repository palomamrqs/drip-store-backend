// Regras de negócio de produtos: busca com filtros, CRUD, imagens e opções
const { Op } = require('sequelize');
const {
  sequelize, Product, ProductImage, ProductOption, ProductCategory, Category,
} = require('../models');
const HttpError = require('../utils/HttpError');
const { parsePagination, parseFields, pickFields } = require('../utils/query');
const { saveBase64Image, deleteImageFile } = require('../utils/imageStorage');

const FIELDS = [
  'enabled', 'name', 'slug', 'use_in_menu', 'stock', 'description',
  'price', 'price_with_discount', 'category_ids', 'images', 'options',
];

const INCLUDE = [
  { model: ProductImage, as: 'images' },
  { model: ProductOption, as: 'options' },
  { model: Category, as: 'categories', attributes: ['id'], through: { attributes: [] } },
];

// ---------------------------------------------------------------------------
// Formatação da resposta
// ---------------------------------------------------------------------------

/** Imagens salvas no servidor viram URL completa; URLs externas ficam como estão. */
function imageUrl(imgPath, baseUrl) {
  if (/^https?:\/\//.test(imgPath)) return imgPath;
  return `${baseUrl}/${imgPath}`;
}

function toPublic(product, baseUrl) {
  return {
    id: product.id,
    enabled: Boolean(product.enabled),
    name: product.name,
    slug: product.slug,
    use_in_menu: Boolean(product.use_in_menu),
    stock: product.stock,
    description: product.description,
    price: product.price,
    price_with_discount: product.price_with_discount,
    category_ids: (product.categories || []).map((c) => c.id).sort((a, b) => a - b),
    images: (product.images || [])
      .sort((a, b) => a.id - b.id)
      .map((img) => ({ id: img.id, content: imageUrl(img.path, baseUrl) })),
    options: (product.options || [])
      .sort((a, b) => a.id - b.id)
      .map((opt) => ({
        id: opt.id,
        title: opt.title,
        shape: opt.shape,
        radius: opt.radius,
        type: opt.type,
        values: opt.values.split(',').map((v) => v.trim()),
      })),
  };
}

// ---------------------------------------------------------------------------
// Validações
// ---------------------------------------------------------------------------

const isNumber = (v) => typeof v === 'number' && !Number.isNaN(v);

/** Valida os campos simples do produto. partial=true é usado no PUT. */
function validateProduct(data, { partial = false } = {}) {
  const errors = [];
  const required = (field, check, msg) => {
    if (data[field] === undefined) {
      if (!partial) errors.push(`${field} é obrigatório`);
    } else if (!check(data[field])) {
      errors.push(msg);
    }
  };

  required('name', (v) => typeof v === 'string' && v.trim(), 'name deve ser um texto');
  required('slug', (v) => typeof v === 'string' && v.trim(), 'slug deve ser um texto');
  required('price', (v) => isNumber(v) && v >= 0, 'price deve ser um número positivo');
  required('price_with_discount', (v) => isNumber(v) && v >= 0, 'price_with_discount deve ser um número positivo');

  if (data.stock !== undefined && !(Number.isInteger(data.stock) && data.stock >= 0)) {
    errors.push('stock deve ser um inteiro positivo');
  }
  ['enabled', 'use_in_menu'].forEach((f) => {
    if (data[f] !== undefined && typeof data[f] !== 'boolean') errors.push(`${f} deve ser booleano`);
  });
  if (data.description !== undefined && data.description !== null && typeof data.description !== 'string') {
    errors.push('description deve ser um texto');
  }
  if (data.category_ids !== undefined
    && !(Array.isArray(data.category_ids) && data.category_ids.every(Number.isInteger))) {
    errors.push('category_ids deve ser uma lista de números inteiros');
  }
  if (data.images !== undefined && !Array.isArray(data.images)) errors.push('images deve ser uma lista');
  if (data.options !== undefined && !Array.isArray(data.options)) errors.push('options deve ser uma lista');

  if (errors.length) throw HttpError.badRequest('Dados da requisição inválidos', errors);
}

/** "4px" -> 4, 10 -> 10 */
function parseRadius(radius) {
  if (radius === undefined) return undefined;
  const value = parseInt(String(radius), 10);
  if (Number.isNaN(value) || value < 0) throw HttpError.badRequest('radius da opção inválido');
  return value;
}

/**
 * Normaliza uma opção vinda do cliente para o formato do banco.
 * A documentação usa ora "values" ora "value", então aceitamos os dois.
 */
function normalizeOption(opt, { partial = false } = {}) {
  const values = opt.values !== undefined ? opt.values : opt.value;
  const result = {};

  if (opt.title !== undefined || !partial) {
    if (!opt.title || typeof opt.title !== 'string') throw HttpError.badRequest('title da opção é obrigatório');
    result.title = opt.title;
  }
  if (values !== undefined || !partial) {
    const list = Array.isArray(values) ? values : String(values || '').split(',');
    const clean = list.map((v) => String(v).trim()).filter(Boolean);
    if (!clean.length) throw HttpError.badRequest('values da opção é obrigatório');
    result.values = clean.join(',');
  }
  if (opt.shape !== undefined) {
    if (!['square', 'circle'].includes(opt.shape)) throw HttpError.badRequest('shape deve ser square ou circle');
    result.shape = opt.shape;
  }
  if (opt.type !== undefined) {
    if (!['text', 'color'].includes(opt.type)) throw HttpError.badRequest('type deve ser text ou color');
    result.type = opt.type;
  }
  const radius = parseRadius(opt.radius);
  if (radius !== undefined) result.radius = radius;

  return result;
}

async function ensureCategoriesExist(ids, transaction) {
  if (!ids || !ids.length) return;
  const unique = [...new Set(ids)];
  const found = await Category.count({ where: { id: unique }, transaction });
  if (found !== unique.length) throw HttpError.badRequest('Uma ou mais categorias informadas não existem');
}

// ---------------------------------------------------------------------------
// Busca
// ---------------------------------------------------------------------------

/** Interseção de conjuntos de IDs (null = sem restrição). */
function intersect(current, ids) {
  if (current === null) return ids;
  return current.filter((id) => ids.includes(id));
}

async function search(query, baseUrl) {
  const { limit, page, options } = parsePagination(query);
  const fields = parseFields(query.fields, FIELDS);
  const where = {};
  let allowedIds = null; // IDs que passam nos filtros de categoria/opção

  // match: procura o termo no nome ou na descrição
  if (query.match) {
    const term = `%${query.match}%`;
    where[Op.or] = [{ name: { [Op.like]: term } }, { description: { [Op.like]: term } }];
  }

  // category_ids=15,24: produtos que pertencem a qualquer uma das categorias
  if (query.category_ids) {
    const ids = String(query.category_ids).split(',').map(Number);
    if (ids.some((id) => !Number.isInteger(id))) throw HttpError.badRequest('category_ids inválido');
    const links = await ProductCategory.findAll({ where: { category_id: ids } });
    allowedIds = intersect(allowedIds, [...new Set(links.map((l) => l.product_id))]);
  }

  // price-range=100-200: preço entre os dois valores
  if (query['price-range']) {
    const [min, max] = String(query['price-range']).split('-').map(Number);
    if (Number.isNaN(min) || Number.isNaN(max) || min > max) {
      throw HttpError.badRequest('price-range deve seguir o formato min-max. Ex.: 100-200');
    }
    where.price = { [Op.between]: [min, max] };
  }

  // option[45]=GG,PP: produtos cuja opção 45 contém algum dos valores
  if (query.option && typeof query.option === 'object') {
    const entries = Object.entries(query.option);
    for (let i = 0; i < entries.length; i += 1) {
      const [optionId, raw] = entries[i];
      const wanted = String(raw).split(',').map((v) => v.trim()).filter(Boolean);
      // eslint-disable-next-line no-await-in-loop
      const found = await ProductOption.findAll({ where: { id: Number(optionId) } });
      const ids = found
        .filter((opt) => opt.values.split(',').some((v) => wanted.includes(v.trim())))
        .map((opt) => opt.product_id);
      allowedIds = intersect(allowedIds, ids);
    }
  }

  if (allowedIds !== null) where.id = allowedIds;

  // Primeiro contamos e pegamos só os IDs da página, depois carregamos os relacionamentos.
  // Assim a paginação não é afetada pelos JOINs de imagens/opções.
  const { rows: idRows, count } = await Product.findAndCountAll({
    where, attributes: ['id'], order: [['id', 'ASC']], ...options,
  });
  const pageIds = idRows.map((r) => r.id);

  const products = pageIds.length
    ? await Product.findAll({ where: { id: pageIds }, include: INCLUDE, order: [['id', 'ASC']] })
    : [];

  return {
    data: products.map((p) => pickFields(toPublic(p, baseUrl), fields)),
    total: count,
    limit,
    page,
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

async function findById(id, baseUrl) {
  const product = await Product.findByPk(id, { include: INCLUDE });
  if (!product) throw HttpError.notFound('Produto não encontrado');
  return toPublic(product, baseUrl);
}

const PRODUCT_COLUMNS = [
  'enabled', 'name', 'slug', 'use_in_menu', 'stock', 'description', 'price', 'price_with_discount',
];

function pickColumns(data) {
  const values = {};
  PRODUCT_COLUMNS.forEach((c) => { if (data[c] !== undefined) values[c] = data[c]; });
  return values;
}

async function create(data, baseUrl) {
  data = data || {};
  validateProduct(data);
  const savedFiles = [];

  try {
    const productId = await sequelize.transaction(async (transaction) => {
      await ensureCategoriesExist(data.category_ids, transaction);

      const product = await Product.create(pickColumns(data), { transaction });

      if (data.category_ids && data.category_ids.length) {
        await ProductCategory.bulkCreate(
          [...new Set(data.category_ids)].map((categoryId) => ({ product_id: product.id, category_id: categoryId })),
          { transaction },
        );
      }

      const images = (data.images || []).map((img) => {
        const imgPath = saveBase64Image(img);
        savedFiles.push(imgPath);
        return { product_id: product.id, path: imgPath, enabled: true };
      });
      if (images.length) await ProductImage.bulkCreate(images, { transaction });

      const opts = (data.options || []).map((opt) => ({ ...normalizeOption(opt), product_id: product.id }));
      if (opts.length) await ProductOption.bulkCreate(opts, { transaction });

      return product.id;
    });

    return findById(productId, baseUrl);
  } catch (err) {
    // Se algo falhou, não deixamos arquivos órfãos no disco
    savedFiles.forEach(deleteImageFile);
    throw err;
  }
}

async function updateImages(product, images, transaction, savedFiles, filesToDelete) {
  const current = await ProductImage.findAll({ where: { product_id: product.id }, transaction });
  const byId = new Map(current.map((img) => [img.id, img]));

  for (let i = 0; i < images.length; i += 1) {
    const img = images[i] || {};

    if (img.id === undefined) {
      // Nova imagem
      const imgPath = saveBase64Image(img);
      savedFiles.push(imgPath);
      // eslint-disable-next-line no-await-in-loop
      await ProductImage.create({ product_id: product.id, path: imgPath, enabled: true }, { transaction });
      continue; // eslint-disable-line no-continue
    }

    const existing = byId.get(img.id);
    if (!existing) throw HttpError.badRequest(`Imagem ${img.id} não pertence a este produto`);

    if (img.deleted) {
      filesToDelete.push(existing.path);
      // eslint-disable-next-line no-await-in-loop
      await existing.destroy({ transaction });
    } else if (img.content && !/^https?:\/\//.test(img.content)) {
      // Conteúdo novo em base64: troca o arquivo. (Se vier uma URL, a imagem é mantida.)
      const imgPath = saveBase64Image({ type: img.type || 'image/png', content: img.content });
      savedFiles.push(imgPath);
      filesToDelete.push(existing.path);
      // eslint-disable-next-line no-await-in-loop
      await existing.update({ path: imgPath }, { transaction });
    }
  }
}

async function updateOptions(product, options, transaction) {
  const current = await ProductOption.findAll({ where: { product_id: product.id }, transaction });
  const byId = new Map(current.map((opt) => [opt.id, opt]));

  for (let i = 0; i < options.length; i += 1) {
    const opt = options[i] || {};

    if (opt.id === undefined) {
      // eslint-disable-next-line no-await-in-loop
      await ProductOption.create({ ...normalizeOption(opt), product_id: product.id }, { transaction });
      continue; // eslint-disable-line no-continue
    }

    const existing = byId.get(opt.id);
    if (!existing) throw HttpError.badRequest(`Opção ${opt.id} não pertence a este produto`);

    if (opt.deleted) {
      // eslint-disable-next-line no-await-in-loop
      await existing.destroy({ transaction });
    } else {
      // eslint-disable-next-line no-await-in-loop
      await existing.update(normalizeOption(opt, { partial: true }), { transaction });
    }
  }
}

async function update(id, data) {
  data = data || {};
  validateProduct(data, { partial: true });
  const savedFiles = [];
  const filesToDelete = [];

  try {
    await sequelize.transaction(async (transaction) => {
      const product = await Product.findByPk(id, { transaction });
      if (!product) throw HttpError.notFound('Produto não encontrado');

      await product.update(pickColumns(data), { transaction });

      if (data.category_ids) {
        await ensureCategoriesExist(data.category_ids, transaction);
        await ProductCategory.destroy({ where: { product_id: product.id }, transaction });
        await ProductCategory.bulkCreate(
          [...new Set(data.category_ids)].map((categoryId) => ({ product_id: product.id, category_id: categoryId })),
          { transaction },
        );
      }

      if (data.images) await updateImages(product, data.images, transaction, savedFiles, filesToDelete);
      if (data.options) await updateOptions(product, data.options, transaction);
    });
  } catch (err) {
    savedFiles.forEach(deleteImageFile);
    throw err;
  }

  // Só apagamos os arquivos antigos depois que tudo deu certo no banco
  filesToDelete.forEach(deleteImageFile);
}

async function remove(id) {
  const product = await Product.findByPk(id, { include: [{ model: ProductImage, as: 'images' }] });
  if (!product) throw HttpError.notFound('Produto não encontrado');

  const paths = product.images.map((img) => img.path);
  await sequelize.transaction(async (transaction) => {
    await ProductImage.destroy({ where: { product_id: id }, transaction });
    await ProductOption.destroy({ where: { product_id: id }, transaction });
    await ProductCategory.destroy({ where: { product_id: id }, transaction });
    await product.destroy({ transaction });
  });
  paths.forEach(deleteImageFile);
}

module.exports = {
  search, findById, create, update, remove,
};
