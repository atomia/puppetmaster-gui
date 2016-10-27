var express = require('express')
var router = express.Router()
var request = require('request')
var config = require('../config/config.json')
var PuppetConfig = require('./model')
var PlatformOption = require('../platform-options/model')


router.get('/', function (req, res, next) {
  var selectedEnvironmentData = req.cookies.platformName

  // Load variables with default form manifest
  // Load overrides from template
  // Load variables defined in database
  PlatformOption.getEnvironmentFromDatabase(selectedEnvironmentData, function (data) {
    PuppetConfig.getVariables(JSON.parse(data.json_data.replace(/(^")|("$)/g, "")), function (data) {
      res.render('puppet-config/puppet-config', {'varData' : data})
    })
  },
  function (error) {
    error.message = 'Could not load environment'
    next(error)
  })


})


module.exports = router
