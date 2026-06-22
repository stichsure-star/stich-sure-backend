'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Payments', 'pickupRequestToken', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Payments', 'pickupCourierId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Payments', 'pickupServiceCode', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Payments', 'pickupFee', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.addColumn('Payments', 'deliveryRequestToken', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Payments', 'deliveryCourierId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Payments', 'deliveryServiceCode', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Payments', 'deliveryFee', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.addColumn('Payments', 'pickupShipmentCreated', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn('Payments', 'deliveryShipmentCreated', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Payments', 'pickupRequestToken');
    await queryInterface.removeColumn('Payments', 'pickupCourierId');
    await queryInterface.removeColumn('Payments', 'pickupServiceCode');
    await queryInterface.removeColumn('Payments', 'pickupFee');
    await queryInterface.removeColumn('Payments', 'deliveryRequestToken');
    await queryInterface.removeColumn('Payments', 'deliveryCourierId');
    await queryInterface.removeColumn('Payments', 'deliveryServiceCode');
    await queryInterface.removeColumn('Payments', 'deliveryFee');
    await queryInterface.removeColumn('Payments', 'pickupShipmentCreated');
    await queryInterface.removeColumn('Payments', 'deliveryShipmentCreated');
  }
};