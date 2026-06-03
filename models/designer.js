const { Model } = require('sequelize') 

module.exports = (sequelize, DataTypes) => {
  class Designer extends Model {} 
Designer.init({ 
  id: { 
    type: DataTypes.UUID, 
    defaultValue: DataTypes.UUIDV4, 
    primaryKey: true, 
    allowNull: false 
  }, 
  firstName: { 
    type: DataTypes.STRING, 
    allowNull: false 
  }, 
  lastName: { 
    type: DataTypes.STRING, 
    allowNull: false 
  }, 
  email: { 
    type: DataTypes.STRING, 
    allowNull: false 
  }, 
  password: { 
    type: DataTypes.STRING, 
    allowNull: false 
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
    defaultValue: 'designer' 
  }, 
  isEmailVerified: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: false 
  } 
}, { 
  sequelize, 
  modelName: 'Designer',
 }); 
 return Designer;
};
