var fh = require('../lib/file_helper')
var dbh = require('../lib/database_helper')
var fs = require('fs')

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
      callback(result[0])
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

PlatformOption.updateEnvironmentData = function (name, platformData, callback, onError) {
  dbh.connect(function (data) {
    console.log(name)
    dbh.query('UPDATE platform_data SET json_data = \'' + JSON.stringify(platformData).replace(/\\/g, '') + '\' WHERE name = \'' + name + '\' ', function (result) {
      console.log(result)
      callback(result)
    }, function (err) {
      onError(err)
    })
  }, function (err) {
    onError(err)
  })
}

PlatformOption.buildVlanTree = function (platform, callback, onError) {
  var vlanTree = [];

  for (var i = 1; i < 6; i++) {
    vlanTree[i] = []
  }

console.log(platform)
  for (var i = 0; i < platform.servers.length; i++) {
    var p = platform.servers[i]
    for (var a = 0; a < p.members.length; a++) {
      var m = p.members[a]
      if (m.selected) {
        if(vlanTree[m.vlan].length == 0) {
          var vlanOrder = []
          vlanOrder[0] = m
          vlanTree[m.vlan][m.graph_position] = vlanOrder
        }
        else {
          if (typeof vlanTree[m.vlan][m.graph_position] === 'undefined') {
            var vlanOrder = []
            vlanOrder[0] = m
            vlanTree[m.vlan][m.graph_position] = vlanOrder
          } else {
            vlanTree[m.vlan][m.graph_position].push(m)
          }
        }
      }
    }
  }
  callback(vlanTree)
}

PlatformOption.getAllRoles = function (callback, onError) {
  var roles = []
  fh.readFiles('config/roles/', function (filename, content, count, total) {
    var role = JSON.parse(content)
    roles[role.role_name] = role

    if (count === total) {
      callback(roles)
    }
  }, function (err) {
    onError(err)
  })
}

PlatformOption.getRoleByName = function (name, callback, onError) {
  fs.readFile('config/roles/' + name + '.json', 'utf8', function (err, data) {
    if (err) throw err;
    callback(JSON.parse(data));
  });
}

module.exports = PlatformOption
