'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class requestImage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      requestImage.belongsTo(models.request, {
        foreignKey: "requestId",
        as: "request"
      });
    }
  }
  requestImage.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    requestId: {
      type: DataTypes.UUID
    },
    image: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'requestImage',
  });
  return requestImage;
};
