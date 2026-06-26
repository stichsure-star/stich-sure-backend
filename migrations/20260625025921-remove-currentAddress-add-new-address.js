'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('DesignerProfiles', 'currentHouseAddress');
    } catch (error) {
      // Column may not exist
    }

    try {
      await queryInterface.addColumn('DesignerProfiles', 'address', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    } catch (error) {
      // Column may already exist
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('DesignerProfiles', 'address');
    } catch (error) {
      // Column may not exist
    }

    try {
      await queryInterface.addColumn('DesignerProfiles', 'currentHouseAddress', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    } catch (error) {
      // Column may already exist
    }
  }
};