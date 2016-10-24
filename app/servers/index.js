var express = require('express')
var router = express.Router()
var request = require('request')
var config = require('../config/config.json')
var PlatformOption = require('../platform-options/model')
var Server = require('./model')



router.get('/', function (req, res, next) {
    var selectedEnvironmentData = req.cookies.platformName

    PlatformOption.getEnvironmentFromDatabase(req.cookies.platformName, function (data) {

        PlatformOption.getAllRoles(function (roleData) {
          if(data)
            var platData = JSON.parse(data.json_data.replace(/(^")|("$)/g, ""));
          res.render('servers/servers', { platformData: platData, roleData: roleData, selectedEnvironment: selectedEnvironmentData })
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

router.get('/tasks', function (req, res, next) {
  Server.getAllTasks(function (taskData) {
    res.json(taskData)
  },
  function (error) {
    error.message = 'Could not load tasks'
    next(error)
  })
})

router.post('/tasks/:id', function (req, res, next) {
  var taskData = JSON.parse(req.body.task)
  console.log(taskData)
  Server.updateTask(taskData, function (result) {
    res.json({ status: 'ok' })
  },
  function (error) {
    error.message = 'Could not update task'
    next(error)
  })
})

router.post('/schedule', function (req, res, next) {
  var selectedEnvironmentData = req.cookies.platformName
  PlatformOption.getEnvironmentFromDatabase(req.cookies.platformName, function (data) {
    Server.scheduleEnvironmentFromJson(JSON.parse(data.json_data.replace(/(^")|("$)/g, "")), function(data) {
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
