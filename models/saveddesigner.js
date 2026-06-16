'use strict';
const { Model, Sequelize } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SavedDesigner extends Model {
    static associate(models) {
      SavedDesigner.belongsTo(models.Customer, {
        foreignKey: 'customerId',
        as: 'customer',
      });

      SavedDesigner.belongsTo(models.Designer, {
        foreignKey: 'designerId',
        as: 'designer',
      });
    }
  }

  SavedDesigner.init({
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    customerId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    designerId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'SavedDesigner',
    indexes: [
      {
        unique: true,
        fields: ['customerId', 'designerId'],
      },
    ],
  });

  return SavedDesigner;
};
