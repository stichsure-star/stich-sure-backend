'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Shipments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      orderId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      trackingCode: {
        type: Sequelize.STRING,
      },
      trackingUrl: {
        type: Sequelize.STRING,
      },
      courier: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'pending',
      },
      shippingFee: {
        type: Sequelize.FLOAT,
      },
      currency: {
        type: Sequelize.STRING,
        defaultValue: 'NGN',
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
    await queryInterface.dropTable('Shipments');
  },
};