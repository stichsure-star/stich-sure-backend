'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Payments', 'shippingFee', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('Payments', 'shippingFee');
  }
};
