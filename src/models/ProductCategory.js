const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Requisito 06 - Tabela de ligação entre produtos e categorias (N:N)
const ProductCategory = sequelize.define('ProductCategory', {
  product_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  category_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
}, {
  tableName: 'product_categories',
  timestamps: false,
});

module.exports = ProductCategory;
