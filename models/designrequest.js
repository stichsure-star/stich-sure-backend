const { DataTypes, Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class DesignRequest extends Model {}

DesignRequest.init({
  description: DataTypes.STRING,
  Image: DataTypes.STRING
}, {
  sequelize,
  modelName: 'DesignRequest',
});

  return DesignRequest;
};

