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
    designerId: DataTypes.UUID,
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
    paidAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Payment',
  });
  return Payment;
};