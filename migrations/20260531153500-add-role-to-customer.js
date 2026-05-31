"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Customers", "role", {
      type: Sequelize.STRING,
      defaultValue: "customer",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Customers", "role");
  },
};
