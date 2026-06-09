'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Collaboration extends Model {
    static associate(models) {
      Collaboration.belongsTo(models.Designer, {
        foreignKey: 'senderDesignerId',
        as: 'sender'
      });
      Collaboration.belongsTo(models.Designer, {
        foreignKey: 'receiverDesignerId',
        as: 'receiver'
      });
    }
  }

  Collaboration.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    senderDesignerId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    receiverDesignerId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    specialtyNeeded: DataTypes.STRING,
    deadline: DataTypes.DATE,
    priceOffer: DataTypes.DECIMAL(10, 2),
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled'),
      defaultValue: 'pending'
    }
  }, {
    sequelize,
    modelName: 'Collaboration',
  });

  return Collaboration;
};
