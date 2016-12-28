var express = require('express')
var router = express.Router()
var request = require('request')
var config = require('../config/config.json')
var stripAnsi = require('strip-ansi')

var restate_username = config.restate_machine.user
var restate_password = config.restate_machine.password
var restate_url = 'http://' + restate_username + ':' + restate_password + '@' + config.restate_machine.host + ':' + config.restate_machine.port

// Add a restate machine run
router.post('/', function (req, res, next) {
  var data = req.body.data
  var options = {
    url: restate_url + '/runs/' + data.machine,
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream'
    },
    body: new Buffer(JSON.stringify(data))

  }

  function callback(error, response, body) {
    if(error) {
      error.message = 'Could not schedule run'
      next(error)
    }
    res.json(body)
  }
  request(options, callback)
})

router.get('/:id', function (req, res, next) {
  var machine_id = req.params.id

  var options = {
    url: restate_url + '/runs/' + machine_id,
    method: 'GET'
  }

  function callback(error, response, body) {
    if(error) {
      error.message = 'Could not fetch machine'
      next(error)
    }
    var data = stripAnsi(body.replace(/\\u001b/g,''))
    res.json(JSON.parse(data))
  }
  request(options, callback)
})


module.exports = router
