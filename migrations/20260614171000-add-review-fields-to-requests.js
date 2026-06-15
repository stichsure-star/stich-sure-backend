'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('requests', 'rating', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('requests', 'reviewComment', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('requests', 'reviewedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('requests', 'reviewedAt');
    await queryInterface.removeColumn('requests', 'reviewComment');
    await queryInterface.removeColumn('requests', 'rating');
  },
};
