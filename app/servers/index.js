var express = require('express')
var router = express.Router()
var PlatformOption = require('../platform-options/model')
var Server = require('./model')
var fs = require('fs')
var multer = require('multer')
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/root')
  },
  filename: function (req, file, cb) {
    cb(null, 'amazon.key')
  }
})

var upload = multer({ storage: storage  })

router.get('/', function (req, res, next) {
  var selectedEnvironmentData = req.cookies.platformName

  PlatformOption.getEnvironmentFromDatabase(req.cookies.platformName, function (data) {

    PlatformOption.getAllRoles(function (roleData) {
      if(data) {
        var platData = JSON.parse(data.json_data.replace(/(^")|("$)/g, ""));
      }
      Server.getAWSConfig(function (awsData) {
        res.render('servers/servers', { awsData: awsData, platformData: platData, roleData: roleData, selectedEnvironment: selectedEnvironmentData })
      })
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

router.get('/tasks/:taskType', function (req, res, next) {
  var task_type = req.params.taskType

  PlatformOption.getEnvironmentFromDatabase(req.cookies.platformName, function (data) {
    var environmentId = data.id
    Server.getAllTasks(environmentId, task_type, function (taskData) {
      res.json(taskData)
    },
    function (error) {
      error.message = 'Could not load tasks'
      next(error)
    })
  },
  function (error) {
    error.message = 'Could not load environment'
    next(error)
  })
})

router.get ('/roles/:fqdn', function (req, res, next) {
  var fqdn = req.params.fqdn
  PlatformOption.getRolesForHostname(fqdn, function (data) {
    res.json (data)
  },
  function (error) {
    error.message = 'Could not fetch roles'
    next(error)
  }
)
})

router.post('/tasks', function (req, res, next) {
  var taskData = JSON.parse(req.body.task)
  Server.updateTask(taskData, function () {
    res.json({ status: 'ok' })
  },
  function (error) {
    error.message = 'Could not update task'
    next(error)
  })
})

router.post('/key', upload.single('privateKey'), function (req, res) {
  fs.chmodSync('/root/amazon.key', '0400');
  res.json({ status: 'ok' })
})
router.post('/aws', function (req, res, next) {
  var awsData = JSON.parse(req.body.awsData)
  Server.saveAWSConfig(awsData, function () {
    res.json({ status: 'ok' })
  },
  function (error) {
    error.message = 'Could not update task'
    next(error)
  })
})
router.post('/schedule', function (req, res, next) {
  PlatformOption.getEnvironmentFromDatabase(req.cookies.platformName, function (data) {
    var environmentData = JSON.parse(data.json_data.replace(/(^")|("$)/g, ""))
    var environmentId = data.id
    environmentData.environmentName = req.cookies.platformName
    Server.scheduleEnvironmentFromJson(environmentId, environmentData, function() {
      if (!res.headerSent) {
        res.json({'status': 'ok'})
        return
      }
    },
    function (error) {
      error.message = 'Could not load schedule new tasks'
      next(error)
    })
  },
  function (error) {
    error.message = 'Could not load environment'
    next(error)
  })

})


module.exports = router
