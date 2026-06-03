const { Sequelize, DataTypes, Model } = require('sequelize') 
const Sequelize = require('../Database/database')
class designRequest extends Model {}
  designRequest.init({
    description: DataTypes.STRING,
    Image: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'designRequest',
  });
  return designRequest;
