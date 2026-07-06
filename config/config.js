require('dotenv').config()
USERNAME = process.env.USERNAME
PASSWORD = process.env.PASSWORD
DATABASE = process.env.DATABASE
HOST = process.env.HOST
DIALECT = process.env.DIALECT
module.exports = {
  "development": {
    "username": "sql8832011",
    "password": "YAERLaXwRW",
    "database": "sql8832011",
    "host": "sql8.freesqldatabase.com",
    "dialect": "mysql"
  },
  "test": {
    "username": "root",
    "password": null,
    "database": "database_test",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "production": {
    "username": "sql8832011",
    "password": "YAERLaXwRW",
    "database": "sql8832011",
    "host": "sql8.freesqldatabase.com",
    "dialect": "mysql"
  }
}