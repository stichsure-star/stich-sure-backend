const {Model} =  require('sequelize')

module.exports = (sequelize, DataTypes) => {
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
  });
  return Shipment;
};