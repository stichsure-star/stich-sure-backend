'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('DesignerWallets', 'pendingWithdrawal', {
      type: Sequelize.FLOAT,
      defaultValue: 0,
    });
    await queryInterface.addColumn('DesignerWallets', 'lastWithdrawnAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('DesignerWallets', 'pendingWithdrawal');
    await queryInterface.removeColumn('DesignerWallets', 'lastWithdrawnAt');
  }
};