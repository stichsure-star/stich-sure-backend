'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Orders').catch(() => null);

    if (table && !table.pickupDate) {
      await queryInterface.addColumn('Orders', 'pickupDate', {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('Orders').catch(() => null);

    if (table && table.pickupDate) {
      await queryInterface.removeColumn('Orders', 'pickupDate');
    }
  },
};
