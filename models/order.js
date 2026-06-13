'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.request, {
        foreignKey: 'requestId',
        as: 'request',
      });

      Order.belongsTo(models.Customer, {
        foreignKey: 'customerId',
        as: 'customer',
      });

      Order.belongsTo(models.Designer, {
        foreignKey: 'designerId',
        as: 'designer',
      });

      Order.belongsTo(models.Designs, {
        foreignKey: 'designId',
        as: 'design',
      });

      Order.hasOne(models.DesignerWalletTransaction, {
        foreignKey: 'orderId',
        as: 'walletTransaction',
      });
      Order.hasMany(models.Payment, {
        foreignKey: 'orderId',
        as: 'payments',
      });
    }
  }

  Order.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    requestId: DataTypes.UUID,
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    designerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    designId: DataTypes.UUID,
    itemName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('new', 'preparing', 'ready', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'new',
    },
    placedAt: DataTypes.DATE,
    preparingAt: DataTypes.DATE,
    readyAt: DataTypes.DATE,
    address: {
        type: DataTypes.STRING,
        allowNull: false
      },
    completedAt: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'Order',
  });

  return Order;
};
