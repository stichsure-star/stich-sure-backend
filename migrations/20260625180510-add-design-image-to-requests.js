'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

 await queryInterface.addColumn('requests', 'designImage', {
      type: Sequelize.JSON,
      defaultValue: [],
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeColumn('requests', 'designImage');
  }
};