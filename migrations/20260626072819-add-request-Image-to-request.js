'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('requests', 'requestImage', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('requests', 'requestImage'); // ✅ no third argument
  }
};