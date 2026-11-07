// Definição de todas as rotas da API (prefixo /v1)
const { Router } = require('express');
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');

const router = Router();

// Garante que qualquer erro de uma função async chegue ao errorHandler
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Valida que :id é um número antes de chegar ao controller
router.param('id', (req, res, next, id) => {
  if (!/^\d+$/.test(id)) return res.status(404).json({ message: 'Recurso não encontrado' });
  return next();
});

// ----- Usuários -----
// Cadastro e login são públicos (senão ninguém conseguiria criar a primeira conta)
router.post('/user/token', wrap(userController.token));
router.post('/user', wrap(userController.store));
router.get('/user/:id', wrap(userController.show));
router.put('/user/:id', auth, wrap(userController.update));
router.delete('/user/:id', auth, wrap(userController.destroy));

// ----- Categorias -----
router.get('/category/search', wrap(categoryController.search));
router.get('/category/:id', wrap(categoryController.show));
router.post('/category', auth, wrap(categoryController.store));
router.put('/category/:id', auth, wrap(categoryController.update));
router.delete('/category/:id', auth, wrap(categoryController.destroy));

// ----- Produtos -----
router.get('/product/search', wrap(productController.search));
router.get('/product/:id', wrap(productController.show));
router.post('/product', auth, wrap(productController.store));
router.put('/product/:id', auth, wrap(productController.update));
router.delete('/product/:id', auth, wrap(productController.destroy));

module.exports = router;
