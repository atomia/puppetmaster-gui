var fh = require('../lib/file_helper')
var dbh = require('../lib/database_helper')
var PlatformOption = function (data) {
  this.data = data
}

PlatformOption.prototype.data = {}

PlatformOption.getAllEnvironmentsFromTemplate = function (callback, onError) {
  var environments = []
  fh.readFiles('config/environments/', function (filename, content, count, total) {
    var environment = JSON.parse(content)
    environments[environment.priority] = environment
    if (count === total) {
      callback(new PlatformOption(environments))
    }
  }, function (err) {
    onError(err)
  })
}

PlatformOption.getTemplateByName = function (name, callback, onError) {
  var environments = []
  fh.readFiles('config/environments/', function (filename, content, count, total) {
    var environment = JSON.parse(content)
    environments[environment.priority] = environment
    if (count === total) {
      for (var i = 0; i < environments.length; i++) {
        if (environments[i].name === name) {
          callback(environments[i])
          return
        }
      }
      onError('Could not find template')
    }
  }, function (err) {
    onError(err)
  })
}

PlatformOption.newEnvironment = function (name, template, callback, onError) {
  // Get the chosen template
  this.getTemplateByName(template, function (templateData) {
    dbh.connect(function (data) {
      templateData.name = name
      dbh.query("INSERT INTO platform_data VALUES(null,'" + template + "', '" + JSON.stringify(templateData) + "', '" + name + "')", function (result) {
        callback()
      }, function (err) {
        onError(err)
      })
    }, function (err) {
      onError(err)
    })
  }, function (err) {
    onError(err)
  })
}

PlatformOption.getEnvironmentFromDatabase = function (name, callback, onError) {
  dbh.connect(function (data) {
    dbh.query('SELECT * FROM platform_data WHERE name = \'' + name + '\' ', function (result) {
      callback(result)
    }, function (err) {
      onError(err)
    })
  }, function (err) {
    onError(err)
  })
}

PlatformOption.getAllEnvironmentsFromDatabase = function (callback, onError) {
  dbh.connect(function (data) {
    dbh.query('SELECT * FROM platform_data', function (result) {
      callback(result)
    }, function (err) {
      onError(err)
    })
  }, function (err) {
    onError(err)
  })
}

module.exports = PlatformOption
