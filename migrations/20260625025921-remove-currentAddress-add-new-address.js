'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
 
    await queryInterface.removeColumn('DesignerProfiles', 'currentHouseAddress');


    await queryInterface.addColumn('DesignerProfiles', 'address', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeColumn('DesignerProfiles', 'address');


    await queryInterface.addColumn('DesignerProfiles', 'currentHouseAddress', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }
};