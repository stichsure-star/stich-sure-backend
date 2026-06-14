const { Model } = require('sequelize') 

module.exports = (sequelize, DataTypes) => {
  class Designer extends Model {
    static associate(models) {
      Designer.hasOne(models.DesignerProfile, {
        foreignKey: 'designerId',
        as: 'profile'
      });
      Designer.hasMany(models.Designs, {
        foreignKey: 'designerId',
        as: 'designs'
      });
      Designer.hasMany(models.request, {
        foreignKey: 'designerId',
        as: 'requests'
      });
      Designer.hasMany(models.Order, {
        foreignKey: 'designerId',
        as: 'orders'
      });
      Designer.hasOne(models.DesignerWallet, {
        foreignKey: 'designerId',
        as: 'wallet'
      });
      Designer.hasMany(models.DesignerWalletTransaction, {
        foreignKey: 'designerId',
        as: 'walletTransactions'
      });
      Designer.hasMany(models.Collaboration, {
        foreignKey: 'senderDesignerId',
        as: 'sentCollaborations'
      });
      Designer.hasMany(models.Collaboration, {
        foreignKey: 'receiverDesignerId',
        as: 'receivedCollaborations'
      });
      Designer.hasMany(models.Payment, {
        foreignKey: 'designerId',
        as: 'payments'
      });
      Designer.hasMany(models.SavedDesigner, {
        foreignKey: 'designerId',
        as: 'savedByCustomers'
      });
    }
  } 
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
