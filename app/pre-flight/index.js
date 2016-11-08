var express = require('express')
var router = express.Router()
var PlatformOption = require('../platform-options/model')
var PreFlight = require('./model')
router.get('/', function (req, res, next) {
  var selectedEnvironmentData = req.cookies.platformName
  PlatformOption.getEnvironmentFromDatabase(req.cookies.platformName, function (data) {

      PlatformOption.getAllRoles(function (roleData) {
        if(data)
          var platData = JSON.parse(data.json_data.replace(/(^")|("$)/g, ""));
        res.render('pre-flight/pre-flight', { platformData: platData, roleData: roleData, selectedEnvironment: selectedEnvironmentData })
      },
      function (error) {
        error.message = 'Could not load roles'
        next(error)
      })

  },
  function (error) {
    error.message = 'Could not load environment'
    next(error)
  })

})

router.post('/schedule', function (req, res, next) {
  PlatformOption.getEnvironmentFromDatabase(req.cookies.platformName, function (data) {
    PreFlight.schedulePreFlightFromJson(JSON.parse(data.json_data.replace(/(^")|("$)/g, "")), function() {
      if (!res.headerSent) {
        res.json({'status': 'ok'})
        return
      }
    })
  },
  function (error) {
    error.message = 'Could not load environment'
    next(error)
  })

})

module.exports = router
