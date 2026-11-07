const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Requisito 05 - Tabela de opções do produto (tamanhos, cores...)
const ProductOption = sequelize.define('ProductOption', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  shape: { type: DataTypes.ENUM('square', 'circle'), allowNull: true, defaultValue: 'square' },
  radius: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  type: { type: DataTypes.ENUM('text', 'color'), allowNull: true, defaultValue: 'text' },
  // Valores separados por vírgula. Ex.: "P,M,G"
  values: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'product_options',
  timestamps: false,
});

module.exports = ProductOption;
