'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Shipment extends Model {
    static associate(models) {
      Shipment.belongsTo(models.Order, {
        foreignKey: "orderId",
        as: "order",
      });
    }
  }

  Shipment.init({
    orderId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    trackingCode: {
      type: DataTypes.STRING,
    },
    trackingUrl: {
      type: DataTypes.TEXT,
    },
    courier: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING,
    },
    shippingFee: {
      type: DataTypes.FLOAT,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'NGN',
    },
  }, {
    sequelize,
    modelName: 'Shipment',
  });

  return Shipment;
};
