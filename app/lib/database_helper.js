/*global databasePool */
var DatabaseHelper = function () {}

DatabaseHelper.query = function (query, callback, onError) {
  databasePool.getConnection(function(err, connection) {
    if (err) {
        onError(err)
        return
    }    
    connection.query(query, function (err, rows) {
      if (err) {
        connection.release()
        onError(err)
      } else {
        connection.release()
        callback(rows)
      }
    })
  })
}
module.exports = DatabaseHelper
