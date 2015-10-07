var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  database.query("SELECT * FROM servers LEFT JOIN roles ON roles.fk_server = servers.id", function(err, rows, field){
    if(err)
      throw err;

      res.render('index', { servers: rows });
  })
});

module.exports = router;
