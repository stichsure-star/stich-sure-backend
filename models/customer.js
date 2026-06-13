"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Customer.hasMany(models.request, {
        foreignKey: "customerId",
        as: "requests"
      });
      Customer.hasMany(models.Order, {
        foreignKey: "customerId",
        as: "orders"
      });
      Customer.hasMany(models.Payment, {
        foreignKey: "customerId",
        as: "payments"
      });
    }
  }
  Customer.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      lastName:{
        type:  DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING, 
      },
      otp: {
        type: DataTypes.STRING,
        allowNull: true
      },
      otpExpire: {
        type: DataTypes.DATE,
        allowNull: true
      },
      role: {
        type: DataTypes.STRING,
        defaultValue: "customer",
      },
      isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      profilePhoto: DataTypes.JSON
    },
    {
      sequelize,
      modelName: "Customer",
    },
  );
  return Customer;
};

