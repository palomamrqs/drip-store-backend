const categoryService = require('../services/categoryService');

module.exports = {
  async search(req, res) {
    res.status(200).json(await categoryService.search(req.query));
  },

  async show(req, res) {
    res.status(200).json(await categoryService.findById(req.params.id));
  },

  async store(req, res) {
    res.status(201).json(await categoryService.create(req.body));
  },

  async update(req, res) {
    await categoryService.update(req.params.id, req.body);
    res.status(204).end();
  },

  async destroy(req, res) {
    await categoryService.remove(req.params.id);
    res.status(204).end();
  },
};
