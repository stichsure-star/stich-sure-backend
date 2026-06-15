"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("DesignerProfiles");

    const addColumnIfMissing = async (columnName, definition) => {
      if (!table[columnName]) {
        await queryInterface.addColumn("DesignerProfiles", columnName, definition);
      }
    };

    await addColumnIfMissing("phoneNumber", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await addColumnIfMissing("bankName", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await addColumnIfMissing("accountNumber", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await addColumnIfMissing("accountName", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await addColumnIfMissing("yearsOfExperience", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await addColumnIfMissing("shortBio", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await addColumnIfMissing("isProfileCompleted", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("DesignerProfiles");

    const removeColumnIfPresent = async (columnName) => {
      if (table[columnName]) {
        await queryInterface.removeColumn("DesignerProfiles", columnName);
      }
    };

    await removeColumnIfPresent("isProfileCompleted");
    await removeColumnIfPresent("shortBio");
    await removeColumnIfPresent("yearsOfExperience");
    await removeColumnIfPresent("accountName");
    await removeColumnIfPresent("accountNumber");
    await removeColumnIfPresent("bankName");
    await removeColumnIfPresent("phoneNumber");
  },
};
