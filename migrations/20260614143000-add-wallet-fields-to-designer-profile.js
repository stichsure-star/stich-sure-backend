'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('DesignerProfiles', 'bankName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('DesignerProfiles', 'accountNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('DesignerProfiles', 'accountName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('DesignerProfiles', 'accountName');
    await queryInterface.removeColumn('DesignerProfiles', 'accountNumber');
    await queryInterface.removeColumn('DesignerProfiles', 'bankName');
  },
};
