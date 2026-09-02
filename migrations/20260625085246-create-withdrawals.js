'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Withdrawals', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      designerId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      bankName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      accountNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      accountName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      bankCode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      reference: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'success', 'failed'),
        defaultValue: 'pending',
      },
      korapayTransferId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      failureReason: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Withdrawals');
  }
};