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
        res.send(JSON.stringify({ status: "ok" }));
    });
});
router.delete('/:id', function (req, res, next) {
    var keyId = req.params.id;
    database.query('DELETE ssh_keys FROM ssh_keys WHERE id =' + keyId, function (err, rows, field) {
        if (err) {
            res.send(JSON.stringify({ error: 'could not delete from database' }));
        }
        res.send(JSON.stringify({ status: 'ok' }));
    });
});
module.exports = router;