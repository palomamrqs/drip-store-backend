// Ponto único de importação dos models e definição dos relacionamentos
const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const ProductImage = require('./ProductImage');
const ProductOption = require('./ProductOption');
const ProductCategory = require('./ProductCategory');

// Um produto tem várias imagens e várias opções.
// onDelete CASCADE: ao apagar o produto, imagens e opções vão junto.
Product.hasMany(ProductImage, { as: 'images', foreignKey: 'product_id', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(ProductOption, { as: 'options', foreignKey: 'product_id', onDelete: 'CASCADE' });
ProductOption.belongsTo(Product, { foreignKey: 'product_id' });

// Produtos e categorias: muitos para muitos através de product_categories
Product.belongsToMany(Category, {
  through: ProductCategory, as: 'categories', foreignKey: 'product_id', otherKey: 'category_id',
});
Category.belongsToMany(Product, {
  through: ProductCategory, as: 'products', foreignKey: 'category_id', otherKey: 'product_id',
});

module.exports = {
  sequelize, User, Category, Product, ProductImage, ProductOption, ProductCategory,
};
