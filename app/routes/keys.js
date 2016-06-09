var express = require('express');
var router = express.Router();
/* GET users listing. */
router.get('/', function (req, res, next) {
    database.query('SELECT * FROM ssh_keys', function (err, rows, field) {
        if (err)
            throw err;
        res.render('keys/index', { keys: rows });
    });
});
/* GET users listing. */
router.get('/new', function (req, res, next) {
    res.render('keys/new', { title: 'Atomia Installation and Configuration' });
});
router.post('/new', function (req, res) {
    var keyTitle = req.body.keyTitle;
    var keyContent = req.body.keyContent;

    var validationRegex = /^-----BEGIN((.|\n)*)-----END.*$/;
    var result = keyContent.match(validationRegex);
    database.query('INSERT INTO ssh_keys VALUES(null,\'' + keyTitle + '\',\'' + keyContent + '\')', function (err, rows, field) {
        if (err)
            res.send(JSON.stringify({ error: err }));
        res.send(JSON.stringify({ ok: "ok" }));
    });
});
module.exports = router;