'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
   
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
      designerId: DataTypes.UUID,
    customerId: DataTypes.UUID,
    orderId: DataTypes.UUID,
    reference: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'success', 'failed'),
      defaultValue: 'pending'
    },
      designerId: DataTypes.UUID,
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
    allowNull: true,    
    defaultValue: null, 
  },
  designAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true, 
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
pickupDate: {
  type: DataTypes.DATEONLY,
  allowNull: true,
},
  }, 
{
    sequelize,
    modelName: 'Payment',
  });
  return Payment;
};