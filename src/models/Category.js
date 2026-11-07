const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Requisito 02 - Tabela de categorias
const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false },
  use_in_menu: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
}, {
  tableName: 'categories',
  timestamps: true,
});

module.exports = Category;
