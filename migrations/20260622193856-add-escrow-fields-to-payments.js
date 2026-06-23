'use strict';

/** @type {import('sequelize-cli').Migration} */
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn("Payments", "escrowStatus", {
      type: Sequelize.ENUM("holding", "released", "refunded"),
      defaultValue: "holding",
    });

    await queryInterface.addColumn("Payments", "releasedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("Payments", "platformFee", {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
    });

    await queryInterface.addColumn("Payments", "designerAmount", {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
    });

    await queryInterface.addColumn("Payments", "releasedBy", {
      type: Sequelize.ENUM("system", "admin"),
      allowNull: true,
    });

  },

  async down(queryInterface) {

    await queryInterface.removeColumn("Payments", "escrowStatus");
    await queryInterface.removeColumn("Payments", "releasedAt");
    await queryInterface.removeColumn("Payments", "platformFee");
    await queryInterface.removeColumn("Payments", "designerAmount");
    await queryInterface.removeColumn("Payments", "releasedBy");

  }
};
