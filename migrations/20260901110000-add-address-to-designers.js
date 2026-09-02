'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Designers');

    if (!table.address) {
      await queryInterface.addColumn('Designers', 'address', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('Designers');

    if (table.address) {
      await queryInterface.removeColumn('Designers', 'address');
    }
  },
};
