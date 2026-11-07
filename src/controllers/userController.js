// Controllers só lidam com HTTP (req/res). A regra de negócio fica nos services.
const userService = require('../services/userService');

module.exports = {
  async show(req, res) {
    res.status(200).json(await userService.findById(req.params.id));
  },

  async store(req, res) {
    const user = await userService.create(req.body);
    res.status(201).json(user);
  },

  async update(req, res) {
    await userService.update(req.params.id, req.body);
    res.status(204).end();
  },

  async destroy(req, res) {
    await userService.remove(req.params.id);
    res.status(204).end();
  },

  async token(req, res) {
    res.status(200).json(await userService.generateToken(req.body));
  },
};
