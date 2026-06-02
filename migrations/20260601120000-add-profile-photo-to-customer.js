"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("Customers");

    if (!table.profilePhoto) {
      await queryInterface.addColumn("Customers", "profilePhoto", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("Customers");

    if (table.profilePhoto) {
      await queryInterface.removeColumn("Customers", "profilePhoto");
    }
  },
};
