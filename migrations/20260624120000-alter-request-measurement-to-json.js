'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('ALTER TABLE requests MODIFY measurement TEXT NULL');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('ALTER TABLE requests MODIFY measurement VARCHAR(255) NULL');
  }
};
