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
          existingEnvironmentsData.push(JSON.parse(existingEnvironments[i].json_data.replace(/(^")|("$)/g, "")))
        }
        console.log(existingEnvironmentsData)
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
  var platformData = req.body.platformData
  if (typeof platformName !== 'undefined' && platformName !== '' && platformName !== 'undefined') {
    res.cookie('platformName', platformName)
  }
  if (typeof platformData !== 'undefined' && platformData !== '' && platformData !== 'undefined') {
    PlatformOption.updateEnvironmentData(platformName, platformData, function (data) {
      res.json({'status': 'ok'})
    },
    function (error) {
      error.message = 'Could not update environment data'
      next(error)
    })
  }
})

router.get('/requirements', function (req, res, next) {
  PlatformOption.getEnvironmentFromDatabase(req.cookies.platformName, function (data) {

    PlatformOption.buildVlanTree(JSON.parse(data.json_data.replace(/(^")|("$)/g, "")), function (vlanData) {
      PlatformOption.getAllRoles(function (roleData) {

        res.render('platform-options/requirements', { platformTree: vlanData, roleData: roleData })
      },
      function (error) {
        error.message = 'Could not load roles'
        next(error)
      })
    },
    function (error) {
      error.message = 'Could not build VLAN tree from environment'
      next(error)
    })
  },
  function (error) {
    error.message = 'Could not load environment'
    next(error)
  })

})

router.delete('/cookies', function (req, res, next) {
  res.clearCookie('platformName')
  res.clearCookie('currentPlatform')
  res.json({'status': 'ok'})
})

module.exports = router
