'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('DesignerProfiles', 'kycStatus', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'pending',
    });

    await queryInterface.addColumn('DesignerProfiles', 'kycDocument', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('DesignerProfiles', 'isKycVerified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('DesignerProfiles', 'minimumPrice', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('DesignerProfiles', 'maxActiveOrders', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 5,
    });

    await queryInterface.addColumn('DesignerProfiles', 'isAvailable', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('DesignerProfiles', 'isAvailable');
    await queryInterface.removeColumn('DesignerProfiles', 'maxActiveOrders');
    await queryInterface.removeColumn('DesignerProfiles', 'minimumPrice');
    await queryInterface.removeColumn('DesignerProfiles', 'isKycVerified');
    await queryInterface.removeColumn('DesignerProfiles', 'kycDocument');
    await queryInterface.removeColumn('DesignerProfiles', 'kycStatus');
  },
};
