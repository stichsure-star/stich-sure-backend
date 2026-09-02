'use strict';
const { InboundParsingApi } = require('@getbrevo/brevo');
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
      this.hasOne(models.Order, {
        foreignKey: "requestId",
        as: "order"
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
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    designerId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    deadLine: DataTypes.DATE,
    description: DataTypes.STRING,
   measurement: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('pending', 'proposal_sent', 'accepted', 'picked_up', 'ready', 'completed', 'rejected', 'cancelled'),
      defaultValue: 'pending'
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    offerSentAt: DataTypes.DATE,
    pickedUpAt: DataTypes.DATE,
    readyAt: DataTypes.DATE,
    completedAt: DataTypes.DATE,
    designerMessage: DataTypes.TEXT,
    rating: DataTypes.INTEGER,
    reviewComment: DataTypes.TEXT,
    reviewedAt: DataTypes.DATE,
   designImage: {
  type: DataTypes.TEXT,
  allowNull: true,

  defaultValue: '[]',
  get() {
    const value = this.getDataValue('designImage');
    try {
      return value ? JSON.parse(value) : [];
    } catch {
      return [];
    }
  },
  set(value) {
    this.setDataValue('designImage', JSON.stringify(value || []));
  },
},

inspirationalImage: {
  type: DataTypes.TEXT,
  allowNull: true,
  defaultValue: '[]',
  get() {
    const value = this.getDataValue('inspirationalImage');
    try {
      return value ? JSON.parse(value) : [];
    } catch {
      return [];
    }
  },
  set(value) {
    this.setDataValue('inspirationalImage', JSON.stringify(value || []));
  },
},
  }, {
    sequelize,
    modelName: 'request',
  });
  return request;
};
