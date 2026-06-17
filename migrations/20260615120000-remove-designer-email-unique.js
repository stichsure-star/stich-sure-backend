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

  async down(queryInterface, Sequelize) {
    const duplicateEmails = await queryInterface.sequelize.query(
      `
        SELECT email
        FROM Designers
        WHERE email IS NOT NULL
        GROUP BY email
        HAVING COUNT(*) > 1
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const { email } of duplicateEmails) {
      const rows = await queryInterface.sequelize.query(
        `
          SELECT id
          FROM Designers
          WHERE email = :email
          ORDER BY id
        `,
        {
          replacements: { email },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      for (let i = 1; i < rows.length; i += 1) {
        const duplicateId = rows[i].id;
        const newEmail = `${email}-${duplicateId}`;

        await queryInterface.sequelize.query(
          `
            UPDATE Designers
            SET email = :newEmail
            WHERE id = :duplicateId
          `,
          {
            replacements: { newEmail, duplicateId },
          }
        );
      }
    }

    await queryInterface.addIndex("Designers", ["email"], {
      unique: true,
      name: "designers_email_unique",
    });
  },
};
