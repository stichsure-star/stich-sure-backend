const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('../Database/database') 

class Customer extends Model {}
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
      profilePhoto: DataTypes.TEXT
    },
    {
      sequelize,
      modelName: "Customer",
    },
  );

module.exports = Customer


