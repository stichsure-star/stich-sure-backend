'use strict';

/** @type {import('sequelize-cli').Migration} */
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {



  


    await queryInterface.addColumn("Payments", "totalAmount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    
    await queryInterface.removeColumn("Payments", "totalAmount");
  },
};
