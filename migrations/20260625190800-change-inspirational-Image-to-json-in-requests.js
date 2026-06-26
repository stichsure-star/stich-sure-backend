'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('requests', 'inspirationalImage', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.changeColumn('requests', 'designImage', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('requests', 'inspirationalImage', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn('requests', 'designImage', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }
};