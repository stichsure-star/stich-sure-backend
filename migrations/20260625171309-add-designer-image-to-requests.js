'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('requests', 'designerImage', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('requests');

    if (table.designerImage) {
      await queryInterface.removeColumn('requests', 'designerImage');
    }
  }
};