var mysql = require('mysql')
var config = require('../config/config.json')

var DatabaseHelper = function (connection) {
  this.connection = connection
}

DatabaseHelper.connect = function (callback, onError) {
  this.connection = mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
  })

  this.connection.connect()

  this.connection.query('SELECT 1', function (err, rows) {
    if (err) {
      onError(err)
    } else {
      callback(true)
    }
  })
}

DatabaseHelper.query = function (query, callback, onError) {
  this.connection.query(query, function (err, rows) {
    if (err) {
      onError(err)
    } else {
      callback(rows)
    }
  })
}

module.exports = DatabaseHelper
