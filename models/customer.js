"use strict";
const { Model, INTEGER } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
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
        allownull: false
      },
      lastName:{
        type:  DataTypes.STRING,
        allownull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false, 
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
      isBlocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      loginAttempts: {
        type: DataTypes.INTEGER,
        default: 0
    },
    lockUntil: {
        type: DataTypes.DATE,
    },
    },
    {
      sequelize,
      modelName: "Customer",
    },
  );
  return Customer;
};
