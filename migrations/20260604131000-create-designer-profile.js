'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DesignerProfiles', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      designerId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        unique: true,
        references: {
          model: 'Designers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      businessName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      currentHouseAddress: {
        type: Sequelize.STRING,
        allowNull: false
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true
      },
      country: {
        type: Sequelize.STRING,
        allowNull: true
      },
      profilePhoto: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      specialization: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: true
      },
      yearsOfExperience: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      shortBio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      completedOrders: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      ratingAverage: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      ratingCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      reliabilityScore: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      isProfileCompleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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

  async down(queryInterface) {
    await queryInterface.dropTable('DesignerProfiles');
  }
};
