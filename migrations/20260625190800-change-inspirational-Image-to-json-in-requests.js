'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('requests', 'inspirationalImage', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Add designImage if it doesn't exist, then change it
    try {
      await queryInterface.addColumn('requests', 'designImage', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    } catch (error) {
      // Column may already exist, try changing it instead
      await queryInterface.changeColumn('requests', 'designImage', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.changeColumn('requests', 'inspirationalImage', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    } catch (error) {
      // Column may not exist
    }

    try {
      await queryInterface.changeColumn('requests', 'designImage', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    } catch (error) {
      // Column may not exist
    }
  }
};