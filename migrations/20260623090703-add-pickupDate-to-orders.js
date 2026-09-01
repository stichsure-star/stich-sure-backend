'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // pickupDate is added by 20260623085844-add-pickupDate-to-order.
    // Keep this duplicate migration as a no-op so existing databases can
    // record it without attempting to add the column twice.
  },

  async down(queryInterface) {
    // The preceding migration owns the pickupDate column, so do not remove it.
  },
};

