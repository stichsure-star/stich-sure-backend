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
      // define association here
      Payment.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order',
      });
      Payment.belongsTo(models.Customer, {
        foreignKey: 'customerId',
        as: 'customer',
      });
      Payment.belongsTo(models.Designer, {
        foreignKey: 'designerId',
        as: 'designer',
      });
    }
  }
  Payment.init({
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    customerId: DataTypes.UUID,
    orderId: DataTypes.UUID,
    reference: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'success', 'failed'),
      defaultValue: 'pending'
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    currency: DataTypes.STRING,
    paymentProvider: DataTypes.STRING,
    transactionReference: DataTypes.STRING,
    paidAt: DataTypes.DATE,
      pickupRequestToken: { 
    type: DataTypes.STRING
  }, 
pickupCourierId: {
  type:DataTypes.STRING
},
pickupServiceCode: DataTypes.STRING,
pickupFee: DataTypes.DECIMAL,
deliveryRequestToken: DataTypes.STRING,
deliveryCourierId: DataTypes.STRING,
deliveryServiceCode: DataTypes.STRING,
deliveryFee: DataTypes.DECIMAL,
shippingFee: DataTypes.DECIMAL,
pickupShipmentCreated: { 
  type: DataTypes.BOOLEAN, 
  defaultValue: false 
},
deliveryShipmentCreated: 
{ type: DataTypes.BOOLEAN, 
  defaultValue: false 
},
escrowStatus: {
  type: DataTypes.ENUM("holding", "released", "refunded"),
  defaultValue: "holding",
},

designAmount: {
  type: DataTypes.DECIMAL(10, 2),
  allowNull: false,
},

releasedAt: {
  type: DataTypes.DATE,
},

platformFee: {
  type: DataTypes.DECIMAL(10, 2),
  defaultValue: 0,
},

designerAmount: {
  type: DataTypes.DECIMAL(10, 2),
  defaultValue: 0,
},

releasedBy: {
  type: DataTypes.ENUM("system", "admin"),
  allowNull: true,
},
totalAmount: {
  type: DataTypes.DECIMAL(10, 2),
  allowNull: false,
},
  }, 
{
    sequelize,
    modelName: 'Payment',
  });
  return Payment;
};