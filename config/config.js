require('dotenv').config();
USERNAME = process.env.DB_USERNAME
PASSWORD = process.env.DB_PASSWORD
DATABASE = process.env.DB_DATABASE
HOST = process.env.DB_HOST
DIALECT = process.env.DB_DIALECT


module.exports = {
  "development": {
    "username": USERNAME,
    "password": PASSWORD,
    "database": DATABASE,
    "host": HOST,
    "dialect": DIALECT || "mysql"
  },
  "test": {
    "username": "root",
    "password": null,
    "database": "database_test",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "production": {
    "username": USERNAME,
    "password": PASSWORD,
    "database": DATABASE,
    "host": HOST,
    "dialect": DIALECT || "mysql"
  }
}