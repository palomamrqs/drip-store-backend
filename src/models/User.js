const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Requisito 01 - Tabela de usuários
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  firstname: { type: DataTypes.STRING, allowNull: false },
  surname: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  // Guarda apenas o hash gerado pelo bcrypt, nunca a senha em texto puro
  password: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;
