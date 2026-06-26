module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Payments', 'checkoutUrl', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('Payments', 'checkoutUrl');
  }
};