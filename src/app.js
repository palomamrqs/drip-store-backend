// Monta a aplicação Express (sem subir o servidor, para poder ser usada nos testes)
require('dotenv').config({ quiet: true });
const path = require('path');
const express = require('express');
const qs = require('qs');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Permite query strings como option[45]=GG,PP virarem objeto: { option: { 45: 'GG,PP' } }.
// parseArrays: false impede que o "45" seja tratado como posição de array.
app.set('query parser', (str) => qs.parse(str, { parseArrays: false }));

app.use(cors());
// Limite maior porque as imagens dos produtos chegam em base64 no corpo da requisição
app.use(express.json({ limit: '15mb' }));

// Imagens salvas ficam acessíveis em /uploads/...
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

// Documentação interativa da API
const swaggerDocument = YAML.load(path.resolve(__dirname, 'docs', 'swagger.yaml'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => res.json({ message: 'Drip Store API', docs: '/docs' }));

app.use('/v1', routes);

// Rota não encontrada
app.use((req, res) => res.status(404).json({ message: 'Rota não encontrada' }));

app.use(errorHandler);

module.exports = app;
