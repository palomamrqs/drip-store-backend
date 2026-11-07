'use strict';

/** Migration: cria a tabela products */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      enabled: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
      name: { type: Sequelize.STRING, allowNull: false },
      slug: { type: Sequelize.STRING, allowNull: false },
      use_in_menu: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
      stock: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      description: { type: Sequelize.STRING, allowNull: true },
      price: { type: Sequelize.FLOAT, allowNull: false },
      price_with_discount: { type: Sequelize.FLOAT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products');
  },
};
