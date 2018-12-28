var express = require('express');
var router = express.Router();
/* GET users listing. */
router.get('/', function (req, res, next) {
	res.render('config/index');
});
// Adds configuration to the database takes an array of key, values
router.post('/', function (req, res, next) {
	var configData = req.body.configData;
	for (var i = 0; i < configData.length; i++) {
		var sql = 'INSERT INTO configuration VALUES(null,\'' + configData[i].key + '\',?,\'null\') ON DUPLICATE KEY UPDATE val = ?';
		var sqlData = [
			configData[i].value,
			configData[i].value
		];
		sql = mysql.format(sql, sqlData);
		database.query(sql, function (err, rows, field) {
			if (err) {
				console.log('error saving config data! ' + err);
			}
			return;
		});
	}
	res.status(200);
	res.send(JSON.stringify({ ok: 'ok' }));
});
router.get('/:configvar', function (req, res, next) {
	var configVar = req.params.configvar;
	database.query('SELECT * FROM configuration WHERE var = \'' + configVar + '\'', function (err, rows, field) {
		if (err)
			throw err;
		res.json({ output: rows[0].val });
	});
});
module.exports = router;