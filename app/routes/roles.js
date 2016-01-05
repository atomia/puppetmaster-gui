var express = require('express');
var router = express.Router();

router.get('/role/:role', function(req, res, next) {
	var roleName = req.params.role;
	console.log(roleName);
	database.query("SELECT * FROM roles JOIN servers on fk_server = servers.id WHERE name = '"+ roleName + "' ORDER by roles.id DESC LIMIT 1", function(err, rows, field) {
		if(err)
			throw err;
		
		res.json({role: rows});
	})
});

router.get('/:hostname/:json?', function(req, res, next) {
  var hostname = req.params.hostname;

  database.query("SELECT * FROM roles JOIN servers ON roles.fk_server = servers.id WHERE servers.hostname = '"+ hostname+"'", function(err, rows, field){
    if(err)
      throw err;
      if (req.params.json) {
        data = []
        for (var i = 0; i < rows.length; i++) {
          data.push(rows[i].name);
        }
        res.json({roles: data});

      }
      else { 
        res.render('roles/hostname', { keys: rows });
      }
  })
});




module.exports = router;
