'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('DesignerProfiles', 'reliabilityScore', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.bulkUpdate(
      'DesignerProfiles',
      { reliabilityScore: 0 },
      {
        completedOrders: 0,
        reliabilityScore: 100,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('DesignerProfiles', 'reliabilityScore', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 100,
    });
  },
};
