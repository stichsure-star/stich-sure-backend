'use strict';

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
    try {
      await queryInterface.removeColumn('DesignerWalletTransactions', 'payoutReference');
    } catch (error) {
      // Column may not exist
    }

    try {
      await queryInterface.removeColumn('DesignerWalletTransactions', 'transactionType');
    } catch (error) {
      // Column may not exist
    }

    await queryInterface.changeColumn('DesignerWalletTransactions', 'orderId', {
      type: Sequelize.UUID,
      allowNull: false,
    });

    try {
      await queryInterface.addIndex('DesignerWalletTransactions', ['orderId'], {
        unique: true,
        name: 'orderId',
      });
    } catch (error) {
      // Index may already exist
    }
  },
}