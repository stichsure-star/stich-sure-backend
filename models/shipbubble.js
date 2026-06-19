'use strict';
const {
  Model,
  Sequelize
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
      type: Sequelize.STRING,
    },
    trackingCode: {
      type: Sequelize.STRING,
    },
    trackingUrl: {
      type: Sequelize.TEXT,
    },
    courier: {
      type: Sequelize.STRING,
    },
    status: {
      type: Sequelize.STRING,
      ENUM: [
        
      ]
      
    },
    shippingFee: {
      type: Sequelize.FLOAT,
    },
    currency: {
      type: Sequelize.STRING,
      defaultValue: 'NGN',
    },
  });
  return Shipment;
};