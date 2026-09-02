'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('requests', 'designerImage', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    } catch (error) {
      // Column may already exist
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('requests', 'designerImage');
    } catch (error) {
      // Column may not exist
    }
  }
};