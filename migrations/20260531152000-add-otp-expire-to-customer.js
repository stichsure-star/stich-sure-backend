"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("Customers");

    if (!table.otpExpire) {
      await queryInterface.addColumn("Customers", "otpExpire", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("Customers");

    if (table.otpExpire) {
      await queryInterface.removeColumn("Customers", "otpExpire");
    }
  },
};
