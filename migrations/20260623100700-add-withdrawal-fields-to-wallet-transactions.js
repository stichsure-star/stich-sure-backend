'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('DesignerWalletTransactions', 'orderId', {
      type: Sequelize.UUID,
      allowNull: true,
    });

    try {
      await queryInterface.removeIndex('DesignerWalletTransactions', 'orderId');
    } catch (error) {
      // Index name can differ depending on when the table was created.
    }

    await queryInterface.addColumn('DesignerWalletTransactions', 'transactionType', {
      type: Sequelize.ENUM('order_credit', 'withdrawal'),
      allowNull: false,
      defaultValue: 'order_credit',
    });

    await queryInterface.addColumn('DesignerWalletTransactions', 'payoutReference', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('DesignerWalletTransactions', 'payoutReference');
    await queryInterface.removeColumn('DesignerWalletTransactions', 'transactionType');

    await queryInterface.changeColumn('DesignerWalletTransactions', 'orderId', {
      type: Sequelize.UUID,
      allowNull: false,
    });

    await queryInterface.addIndex('DesignerWalletTransactions', ['orderId'], {
      unique: true,
      name: 'orderId',
    });
  },
};
