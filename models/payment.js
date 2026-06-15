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
      Payment.belongsTo(models.Order, {
     foreignKey: "orderId",
     as: "order"
});
    }
  }
  Payment.init({
    orderId: DataTypes.UUID,
    amount: DataTypes.DECIMAL,
    currency: DataTypes.STRING,
    paymentProvider: DataTypes.STRING,
    transactionReference: DataTypes.STRING,
    status: DataTypes.STRING,
    paidAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Payment',
  });
  return Payment;
};