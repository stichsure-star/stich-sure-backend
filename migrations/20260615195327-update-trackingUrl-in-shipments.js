'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Shipments', 'trackingUrl', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Shipments', 'trackingUrl', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }
};