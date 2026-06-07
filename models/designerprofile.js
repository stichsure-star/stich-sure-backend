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
    profilePhoto: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    specialization: {
      type: DataTypes.JSON,
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
    }
  }, {
    sequelize,
    modelName: 'DesignerProfile',
  });

  return DesignerProfile;
};
