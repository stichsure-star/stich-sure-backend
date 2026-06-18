'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      customerId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      userType: {
        type: Sequelize.ENUM('customer', 'designer'),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM(
          'pending', 
          'proposal_sent', 
          'accepted', 
          'picked_up', 
          'ready', 
          'completed', 
          'rejected', 
          'cancelled'
        ),
        allowNull: false,
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      requestId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      orderId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Notifications');
  }
};