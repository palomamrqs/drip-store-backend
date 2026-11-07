'use strict';

/** Migration: cria a tabela product_images (FK para products) */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_images', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      enabled: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
      path: { type: Sequelize.STRING, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_images');
  },
};
