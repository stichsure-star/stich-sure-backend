'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Orders", "pickupDate", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Orders", "pickupDate");
  },
};

