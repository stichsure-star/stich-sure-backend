'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class request extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Customer, {
        foreignKey: "customerId",
        as: "customer"
      });
      this.belongsTo(models.Designer, {
        foreignKey: "designerId",
        as: "designer"
      });
    }
  }
  request.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    customerId: {
      type: DataTypes.UUID
    },
    designerId: {
      type: DataTypes.UUID
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    deadLine: DataTypes.DATE,
    description: DataTypes.STRING,
    measurement: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'request',
  });
  return request;
};
