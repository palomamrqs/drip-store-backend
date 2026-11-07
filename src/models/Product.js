const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Requisito 03 - Tabela de produtos
const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  enabled: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false },
  use_in_menu: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
  stock: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  description: { type: DataTypes.STRING, allowNull: true },
  price: { type: DataTypes.FLOAT, allowNull: false },
  price_with_discount: { type: DataTypes.FLOAT, allowNull: false },
}, {
  tableName: 'products',
  timestamps: true,
});

module.exports = Product;
