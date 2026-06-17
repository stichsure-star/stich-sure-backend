'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DesignerProfile extends Model {
    static associate(models) {
      DesignerProfile.belongsTo(models.Designer, {
        foreignKey: 'designerId',
        as: 'designer'
      });
    }
  }

  DesignerProfile.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    designerId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    currentHouseAddress: {
      type: DataTypes.STRING,
      allowNull: false
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true
    },
    profilePhoto: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    specialization: {
      type: DataTypes.JSON,
      allowNull: true
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    accountName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    yearsOfExperience: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    shortBio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    kycStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending'
    },
    kycDocument: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isKycVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    minimumPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    maxActiveOrders: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    completedOrders: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,      
    },
    ratingAverage: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    ratingCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    reliabilityScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    isProfileCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    location: {
      type: DataTypes.STRING,
    },
    firstName: {
      type: DataTypes.STRING
    },
    lastName: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING
    }
  }, {
    sequelize,
    modelName: 'DesignerProfile',
  });

  return DesignerProfile;
};
