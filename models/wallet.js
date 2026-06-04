'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Wallet extends Model {
    static associate(models) {
      Wallet.belongsTo(models.Designer, {
        foreignKey: 'designerId',
        as: 'designer'
      });
    }
  }

  Wallet.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    designerId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true
    },
    balance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    pendingBalance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    totalEarned: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'NGN'
    },
    status: {
      type: DataTypes.ENUM('active', 'frozen', 'closed'),
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    sequelize,
    modelName: 'Wallet',
  });

  return Wallet;
};
