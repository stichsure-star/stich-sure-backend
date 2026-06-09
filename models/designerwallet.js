'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DesignerWallet extends Model {
    static associate(models) {
      DesignerWallet.belongsTo(models.Designer, {
        foreignKey: 'designerId',
        as: 'designer',
      });
    }
  }

  DesignerWallet.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    designerId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accountName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isWalletVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    sequelize,
    modelName: 'DesignerWallet',
  });

  return DesignerWallet;
};
