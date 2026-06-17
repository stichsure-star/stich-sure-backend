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
    const table = await queryInterface.describeTable('DesignerProfiles');

    const removeColumnIfPresent = async (columnName) => {
      if (table[columnName]) {
        await queryInterface.removeColumn('DesignerProfiles', columnName);
      }
    };

    await removeColumnIfPresent('accountName');
    await removeColumnIfPresent('accountNumber');
    await removeColumnIfPresent('bankName');
  },
};
