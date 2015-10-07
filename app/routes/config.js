var express = require('express');
var router = express.Router();
var sys = require('sys');

/* GET users listing. */
router.get('/', function(req, res, next) {
      res.render('config/index');
});

// Adds configuration to the database takes an array of key, values
router.post('/', function(req, res, next) {
  var configData = req.body.configData;
  console.log(req.body);
  for (var i = 0; i < configData.length; i++) {
    database.query("INSERT INTO configuration VALUES(null,'" + configData[i].key + "','" + configData[i].value + "','null') ON DUPLICATE KEY UPDATE val = '"+ configData[i].value +"'", function(err, rows, field) {
        if(err)
        {
          console.log("error saving config data!")
        }
        return;
      });
  }
  res.status(200);
  res.send(JSON.stringify({ok: "ok"}));
});


module.exports = router;
