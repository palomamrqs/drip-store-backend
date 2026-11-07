const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Requisito 04 - Tabela de imagens do produto
const ProductImage = sequelize.define('ProductImage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  enabled: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
  // Caminho relativo da imagem salva no servidor (ex.: uploads/products/abc.png)
  path: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'product_images',
  timestamps: false,
});

module.exports = ProductImage;
