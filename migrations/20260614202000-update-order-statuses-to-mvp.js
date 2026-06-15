'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('Orders', 'preparingAt', 'activeAt');
    await queryInterface.renameColumn('Orders', 'readyAt', 'deliveredAt');

    await queryInterface.changeColumn('Orders', 'status', {
      type: Sequelize.ENUM(
        'new',
        'preparing',
        'ready',
        'pending',
        'active',
        'delivered',
        'completed',
        'cancelled'
      ),
      allowNull: false,
      defaultValue: 'new',
    });

    await queryInterface.sequelize.query(`
      UPDATE Orders
      SET status = CASE
        WHEN status = 'new' THEN 'pending'
        WHEN status = 'preparing' THEN 'active'
        WHEN status = 'ready' THEN 'delivered'
        ELSE status
      END
    `);

    await queryInterface.changeColumn('Orders', 'status', {
      type: Sequelize.ENUM('pending', 'active', 'delivered', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Orders', 'status', {
      type: Sequelize.ENUM(
        'new',
        'preparing',
        'ready',
        'pending',
        'active',
        'delivered',
        'completed',
        'cancelled'
      ),
      allowNull: false,
      defaultValue: 'pending',
    });

    await queryInterface.sequelize.query(`
      UPDATE Orders
      SET status = CASE
        WHEN status = 'pending' THEN 'new'
        WHEN status = 'active' THEN 'preparing'
        WHEN status = 'delivered' THEN 'ready'
        ELSE status
      END
    `);

    await queryInterface.changeColumn('Orders', 'status', {
      type: Sequelize.ENUM('new', 'preparing', 'ready', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'new',
    });

    await queryInterface.renameColumn('Orders', 'deliveredAt', 'readyAt');
    await queryInterface.renameColumn('Orders', 'activeAt', 'preparingAt');
  },
};
