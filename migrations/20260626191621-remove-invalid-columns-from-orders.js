'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Orders');


    if (tableDescription.orderId) {
      await queryInterface.removeColumn('Orders', 'orderId');
    }
    if (tableDescription.designerProfile) {
      await queryInterface.removeColumn('Orders', 'designerProfile');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('Orders', 'orderId', {
      type: Sequelize.UUID,
      allowNull: true,
    });
    await queryInterface.addColumn('Orders', 'designerProfile', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }
};