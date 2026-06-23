'use strict';

/** @type {import('sequelize-cli').Migration} */
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Payments", "designAmount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn("Payments", "shippingFee", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn("Payments", "platformFee", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn("Payments", "designerAmount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn("Payments", "totalAmount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Payments", "designAmount");
    await queryInterface.removeColumn("Payments", "shippingFee");
    await queryInterface.removeColumn("Payments", "platformFee");
    await queryInterface.removeColumn("Payments", "designerAmount");
    await queryInterface.removeColumn("Payments", "totalAmount");
  },
};
