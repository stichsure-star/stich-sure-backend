'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('requests', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      customerId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        references : {
          model: 'Customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      designerId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        references : {
          model: 'Designers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      fullName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      deadLine: {
        type: Sequelize.DATE
      },
      description: {
        type: Sequelize.STRING
      },
      measurement: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('requests');
  }
};
