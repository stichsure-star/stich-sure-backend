"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const indexes = await queryInterface.showIndex("Designers");
    const emailUniqueIndexes = indexes.filter((index) => {
      return index.unique && index.fields.some((field) => field.attribute === "email");
    });

    await Promise.all(
      emailUniqueIndexes.map((index) => queryInterface.removeIndex("Designers", index.name))
    );
  },

  async down(queryInterface) {
    await queryInterface.addIndex("Designers", ["email"], {
      unique: true,
      name: "designers_email_unique",
    });
  },
};
