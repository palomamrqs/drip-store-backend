// Cria a instância única do Sequelize de acordo com o ambiente (NODE_ENV)
const { Sequelize } = require('sequelize');
const config = require('./config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = dbConfig.dialect === 'sqlite'
  ? new Sequelize({ ...dbConfig })
  : new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);

module.exports = sequelize;
