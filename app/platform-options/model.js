var fh = require('../lib/file_helper')
var dbh = require('../lib/database_helper')
var fs = require('fs')

var PlatformOption = function (data) {
  this.data = data
}

PlatformOption.prototype.data = {}

PlatformOption.getAllEnvironmentsFromTemplate = function (callback, onError) {
  var environments = []
  fh.readFiles(__dirname + '/../config/environments/', function (filename, content, count, total) {
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
  fh.readFiles(__dirname + '/../config/environments/', function (filename, content, count, total) {
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
    templateData.name = name
    dbh.query("INSERT INTO platform_data VALUES(null,'" + template + "', '" + JSON.stringify(templateData) + "', '" + name + "')", function () {
      callback()
    }, function (err) {
      onError(err)
    })
  }, function (err) {
    onError(err)
  })
}

PlatformOption.getEnvironmentFromDatabase = function (name, callback, onError) {
  dbh.query('SELECT * FROM platform_data WHERE name = \'' + name + '\' ', function (result) {
    callback(result[0])
  }, function (err) {
    onError(err)
  })
}

PlatformOption.getEnvironmentFromDatabaseHostname = function (hostname, callback, onError) {
  dbh.query('SELECT * FROM platform_data WHERE json_data LIKE \'%' + hostname + '%\' ', function (result) {
    callback(result[0])
  }, function (err) {
    onError(err)
  })
}

PlatformOption.getAllEnvironmentsFromDatabase = function (callback, onError) {
  dbh.query('SELECT * FROM platform_data', function (result) {
    callback(result)
  }, function (err) {
    onError(err)
  })
}

PlatformOption.updateEnvironmentData = function (name, platformData, callback, onError) {
  /* Add nodes to json */
  platformData = JSON.parse(platformData)
  for (var i = 0; i < platformData.servers.length; i++) {
    var p = platformData.servers[i]
    for (var a = 0; a < p.members.length; a++) {
      var m = p.members[a]
      if (m.selected) {
        if(typeof platformData.servers[i].members[a].nodes == 'undefined') {
          platformData.servers[i].members[a].nodes = []
          for (var nodeId = 0; nodeId < m.node_count; nodeId++) {
            platformData.servers[i].members[a].nodes.push({
              "hostname":"",
              "username":"",
              "password":"",
              "provisioning_status": {"status":"","message":""},
              "preflight_status": "",
              "installation_status": "",
              "ec2_type": platformData.servers[i].members[a].ec2_type
            })
          }
        }
      }
    }
  }
  dbh.query('UPDATE platform_data SET json_data = \'' + JSON.stringify(platformData).replace(/\\/g, '') + '\' WHERE name = \'' + name + '\' ', function (result) {
    callback(result)
  }, function (err) {
    onError(err)
  })
}

PlatformOption.buildVlanTree = function (platform, callback) {
  var vlanTree = []
  var vlanOrder = []

  for (var treeId = 1; treeId < 6; i++) {
    vlanTree[treeId] = []
  }

  for (var i = 0; i < platform.servers.length; i++) {
    var p = platform.servers[i]
    for (var a = 0; a < p.members.length; a++) {
      var m = p.members[a]
      if (m.selected) {
        if(vlanTree[m.vlan].length == 0) {
          vlanOrder = []
          vlanOrder[0] = m
          vlanTree[m.vlan][m.graph_position] = vlanOrder
        }
        else {
          if (typeof vlanTree[m.vlan][m.graph_position] === 'undefined') {
            vlanOrder = []
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
  fh.readFiles(__dirname + '/../config/roles/', function (filename, content, count, total) {
    var role = JSON.parse(content)
    roles[role.role_name] = role

    if (count === total) {
      callback(roles)
    }
  }, function (err) {
    onError(err)
  })
}

PlatformOption.getRoleByName = function (name, callback) {
  fs.readFile(__dirname + '/../config/roles/' + name + '.json', 'utf8', function (err, data) {
    if (err) throw err;
    callback(JSON.parse(data));
  });
}

PlatformOption.getRolesForHostname = function (fqdn, callback, onError) {

  PlatformOption.getEnvironmentFromDatabaseHostname(fqdn, function (environment) {
    if (typeof environment != 'undefined')
    {
      environment = JSON.parse(environment.json_data.replace(/(^")|("$)/g, ""))
      for (var serverId = 0; serverId < environment.servers.length; serverId++) {
        for (var memberId = 0; memberId < environment.servers[serverId].members.length; memberId++) {
          if (typeof environment.servers[serverId].members[memberId].nodes != 'undefined') {
            for (var nodeId = 0; nodeId < environment.servers[serverId].members[memberId].nodes.length; nodeId++) {
              if(environment.servers[serverId].members[memberId].nodes[nodeId].hostname === fqdn){
                var roles = environment.servers[serverId].members[memberId].roles
                var roleArr = []
                for (var roleId = 0; roleId < roles.length; roleId++) {
                  roleArr.push(roles[roleId].class)
                }
                callback(roleArr)
                return;
              }
            }
          }
        }
      }
    }
    callback([])
  },
  function (error) { onError(error)
  })
}

module.exports = PlatformOption
