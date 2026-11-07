'use strict';

/** Migration: cria a tabela product_options (FK para products) */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_options', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: { type: Sequelize.STRING, allowNull: false },
      shape: { type: Sequelize.ENUM('square', 'circle'), allowNull: true, defaultValue: 'square' },
      radius: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      type: { type: Sequelize.ENUM('text', 'color'), allowNull: true, defaultValue: 'text' },
      values: { type: Sequelize.STRING, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_options');
  },
};
