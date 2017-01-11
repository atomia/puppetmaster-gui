var dbh = require('../lib/database_helper')
var request = require('request')
var Servers = require('../servers/model')
var Installation = function (data) {
  this.data = data
}

Installation.prototype.data = {}

Installation.scheduleInstallationFromJson = function (environmentId, environmentName, orderId, data, callback, onError) {
  var servers = Servers.filterSelectedServers(data.servers)
  var serverKey = ''
  if(data.amazon) {
    Servers.getAWSConfig(function (aws){
      serverKey = aws.private_key
      this.doSchedule(environmentId, environmentName, orderId, servers, serverKey, callback, onError)
    })
  } else {
    serverKey = data.server_key
    this.doSchedule(environmentId, environmentName, orderId, servers, serverKey, callback, onError)
  }
}

Installation.doSchedule = function (environmentId, environmentName, orderId, servers, serverKey, callback, onError) {
  var scheduledServers = 0
  var serverCount = 0
  for (var memberId = 0; memberId < servers.length; memberId++) {
    (function (curServer) {
      // Check if there is already an existing task for this server
      if (curServer.provisioning_order == orderId) {
        serverCount++
        Servers.getAllTasks(environmentId, 'installation', function (taskData) {
          var taskExists = false
          for (var i = 0; i < taskData.length; i++) {
            for (var n = 0; n < curServer.nodes.length; n++) {
              if (taskData[i].input.indexOf(curServer.nodes[n].hostname) !== -1) {
                taskExists = true
              }
            }
          }

          // No task exists for the current server
          if (!taskExists) {
            var jobData = {}
            var requirementsData = {}
            for (var rId = 0; rId < curServer.requirements.length; rId++) {
              requirementsData[curServer.requirements[rId].check] = curServer.requirements[rId].value
            }
            var roleData = {}
            var new_password = ''
            for (var roleId = 1; roleId < curServer.roles.length +1; roleId++) {
              roleData["atomia_role_" + roleId] = curServer.roles[roleId -1].class
              if(curServer.roles[roleId -1].class == 'active_directory_replica') {
                var ad_server = Servers.getServerWithRole(servers, 'active_directory')
                new_password = ad_server.password
              }
            }
            for (var nodeCount = 0; nodeCount < curServer.node_count; nodeCount++)
            {
              var username;
              if (curServer.nodes[nodeCount].username == '') {
                if(curServer.operating_system == 'ubuntu') {
                  username = 'ubuntu'
                }
                else {
                  username = 'Administrator'
                }
              }
              jobData.data = {
                machine: 'provision_server',
                os: curServer.operating_system,
                hostname: curServer.nodes[nodeCount].hostname,
                username: username,
                password: curServer.nodes[nodeCount].password,
                new_password: new_password,
                key: '/root/.ssh/' + 'stefan-test-aws.pem', //TODO: This should not be hardcoded!
                environment: environmentName.toLowerCase().replace(/\s/g, "_"),
                roles: JSON.stringify(roleData)
              }

              var options = {
                url: 'http://localhost:3000/restate-machines',
                method: 'POST',
                body: jobData,
                json: true,
                serverName: curServer.name
              }

              request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                  var runId = JSON.parse(body).Id
                  // Run scheduled add a reference to the database
                  // TODO: we should not allow duplicate task_ids for an environment
                  dbh.query("INSERT INTO tasks VALUES(null,'" + options.serverName + " installation', '" + runId + "', '" + JSON.stringify(options.body) + "', null, " + environmentId + ", 'installation')",
                  function () {
                    scheduledServers++
                    if (scheduledServers == serverCount) {
                      callback()
                    }
                  }, function (err) {
                    // dbh.query failed
                    onError(err)
                  })

                } else {
                  if (error) {
                    onError(error)
                  }
                }
              })
            }
          }
        })
      }
    })(servers[memberId])

  }
}

Installation.getAllTasks = function (callback, onError) {
  dbh.query('SELECT * from tasks', function (result) {
    callback(result)
  }, function (err) {
    onError(err)
  })
}

Installation.getTaskByRunId = function (runId, callback, onError) {
  dbh.query("SELECT * from tasks WHERE run_id ='" + runId + "'", function (result) {
    callback(result[0])
  }, function (err) {
    onError(err)
  })
}

Installation.updateTask = function (taskId, taskStatus, callback, onError) {
  dbh.query("UPDATE tasks SET status = '" + taskStatus + "' WHERE id = " + taskId, function () {
    callback(true)
  }, function (err) {
    onError(err)
  })
}

module.exports = Installation
