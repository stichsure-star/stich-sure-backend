'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
    Shipment.belongsTo(models.Order, {
    foreignKey: "orderId",
    as: "order",
  });

  Shipment.belongsTo(models.Payment, {
    foreignKey: "paymentId",
    as: "payment",
  });
    }
  }
  
  const Shipment = sequelize.define('Shipment', {
    orderId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    trackingCode: {
      type: DataTypes.STRING,
    },
    trackingUrl: {
      type: DataTypes.STRING,
    },
    courier: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
    },
    shippingFee: {
      type: DataTypes.FLOAT,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'NGN',
    },
    currency: DataTypes.STRING,
  });
  return Shipment;
};