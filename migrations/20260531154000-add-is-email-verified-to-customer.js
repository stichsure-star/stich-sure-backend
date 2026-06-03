"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("Customers");

    if (!table.isEmailVerified) {
      await queryInterface.addColumn("Customers", "isEmailVerified", {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("Customers");

    if (table.isEmailVerified) {
      await queryInterface.removeColumn("Customers", "isEmailVerified");
    }
  },
};
