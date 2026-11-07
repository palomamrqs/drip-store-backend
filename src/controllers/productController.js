const productService = require('../services/productService');

// Endereço público da API, usado para montar a URL completa das imagens
function baseUrl(req) {
  return process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
}

module.exports = {
  async search(req, res) {
    res.status(200).json(await productService.search(req.query, baseUrl(req)));
  },

  async show(req, res) {
    res.status(200).json(await productService.findById(req.params.id, baseUrl(req)));
  },

  async store(req, res) {
    res.status(201).json(await productService.create(req.body, baseUrl(req)));
  },

  async update(req, res) {
    await productService.update(req.params.id, req.body);
    res.status(204).end();
  },

  async destroy(req, res) {
    await productService.remove(req.params.id);
    res.status(204).end();
  },
};
