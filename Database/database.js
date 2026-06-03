const { Sequelize } = require('sequelize');


const sequelize = new Sequelize('sql8829131', 'sql8829131', 'NsmRcbBAbX', {
    host: "sql8.freesqldatabase.com",
    dialect: 'mysql'
});

module.exports = sequelize