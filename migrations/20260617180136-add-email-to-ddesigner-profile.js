'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('DesignerProfiles');

    if (!table.email) {
      await queryInterface.addColumn('DesignerProfiles', 'email', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('DesignerProfiles');

    if (table.email) {
      await queryInterface.removeColumn('DesignerProfiles', 'email');
    }
  },
};
