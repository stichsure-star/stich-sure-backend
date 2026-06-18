// models/Notification.js
'use strict';
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userType: {
      type: DataTypes.ENUM('customer', 'designer')
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
          'pending', 
          'proposal_sent', 
          'accepted', 
          'picked_up', 
          'ready', 
          'completed', 
          'rejected', 
          'cancelled',
          'new_request',       
           'request_rejected', 
           'completed',        
           'rating_received'
      ),
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    requestId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  });

  return Notification;
};