var express = require('express')
var router = express.Router()
var PlatformOption = require('./model')

router.get('/', function (req, res, next) {
  var selectedEnvironmentData = req.cookies.platformName
  PlatformOption.getAllEnvironmentsFromTemplate(function (environmentTemplates) {
    if (environmentTemplates) {
      PlatformOption.getAllEnvironmentsFromDatabase(function (existingEnvironments) {
        var existingEnvironmentsData = []
        for (var i = 0; i < existingEnvironments.length; i++) {
          existingEnvironmentsData.push(JSON.parse(existingEnvironments[i].json_data))
        }
        res.render('platform-options/platform-options', { selectedEnvironment: selectedEnvironmentData, existingEnvironments: existingEnvironmentsData, environments: environmentTemplates.data })
      }, function (error) {
        error.message = 'Could not load existing environments from the database'
        next(error)
      })
    }
  },
  function (error) {
    error.message = 'Could not load environments from the file system'
    next(error)
  })
})

router.post('/', function (req, res, next) {
  var platformName = req.body.name
  var platformTemplate = req.body.template
  PlatformOption.newEnvironment(platformName, platformTemplate, function (data) {
    res.json({'status': 'ok'})
  },
  function (error) {
    error.message = 'Could not create the new environment'
    next(error)
  })
})

// Selects a template
router.put('/', function (req, res, next) {
  var platformName = req.body.name
  console.log(req.body)
  res.cookie('platformName', platformName)
  res.json({'status': 'ok'})
})

module.exports = router
