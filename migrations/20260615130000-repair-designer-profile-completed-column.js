"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("DesignerProfiles");

    if (!table.isProfileCompleted) {
      await queryInterface.addColumn("DesignerProfiles", "isProfileCompleted", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("DesignerProfiles");

    if (table.isProfileCompleted) {
      await queryInterface.removeColumn("DesignerProfiles", "isProfileCompleted");
    }
  },
};
