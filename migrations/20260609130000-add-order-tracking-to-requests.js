'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('requests', 'status', {
      type: Sequelize.ENUM(
        'pending',
        'proposal_sent',
        'accepted',
        'picked_up',
        'ready',
        'completed',
        'rejected',
        'cancelled'
      ),
      allowNull: false,
      defaultValue: 'pending',
    });

    await queryInterface.addColumn('requests', 'progress', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('requests', 'pickedUpAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('requests', 'readyAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('requests', 'completedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('requests', 'completedAt');
    await queryInterface.removeColumn('requests', 'readyAt');
    await queryInterface.removeColumn('requests', 'pickedUpAt');
    await queryInterface.removeColumn('requests', 'progress');
    await queryInterface.changeColumn('requests', 'status', {
      type: Sequelize.ENUM('pending', 'proposal_sent', 'accepted', 'rejected', 'completed'),
      allowNull: false,
      defaultValue: 'pending',
    });
  },
};
