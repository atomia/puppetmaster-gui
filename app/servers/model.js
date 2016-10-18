var dbh = require('../lib/database_helper')
var request = require('request')
var PlatformOption = require('../platform-options/model')
var Server = function (data) {
  this.data = data
}

Server.prototype.data = {}

// TODO: refactor this function
Server.scheduleEnvironmentFromJson = function (data, callback, onError) {
  for (var i = 0; i < data.servers.length; i++) {
    for (var a = 0; a < data.servers[i].members.length; a++) {
      var curServer = data.servers[i].members[a]
      // Get all firewall rules for the roles of this server
      if (curServer.name === 'Active directory') { // For testing
        var security_groups = []
        var roleCount = 0
        for (var r = 0; r < curServer.roles.length; r++) {
          (function (curServer) {
            PlatformOption.getRoleByName(curServer.roles[r].class, function (roleData) {
              roleCount++
              for (var s = 0; s < roleData.firewall.length; s++) {
                security_groups.push(roleData.firewall[s])
              }
              if (roleCount === curServer.roles.length) {
                // Schedule the job
                var jobData = {}
                jobData.data = {
                  machine: 'create_ec2_server',
                  key_name: 'stefan-test-aws',
                  vpc_id: 'vpc-ad0f6ac9',
                  instance_name: curServer.name,
                  ami: curServer.ami,
                  type: curServer.ec2_type,
                  security_groups: security_groups,
                  existing_security_groups: ['default'],
                  os: curServer.operating_system
                }
                var options = {
                  url: 'http://localhost:3000/restate-machines',
                  method: 'POST',
                  body: jobData,
                  json: true
                }
                console.log(jobData)
                request(options, function (error, response, body) {
                  if (error) {
                    console.log('ERROR: ' + error.message)
                  }
                  var runId = JSON.parse(body).Id
                  // Run scheduled add a reference to the database
                  dbh.connect(function (data) {
                    // TODO: we should not allow duplicate task_ids for an environment
                    dbh.query("INSERT INTO tasks VALUES(null,'" + curServer.name + "', '" + runId + "', '" + JSON.stringify(jobData) + "', null, 1)", function (result) {
                      callback() // Should be sent when all tasks are done....
                    }, function (err) {
                      console.log(err)
                    })
                  }, function (err) {
                    console.log(err)
                  })
                  console.log(body)
                })
              }
            })
          })(curServer)
        }
      }
    }
  }
}

Server.getAllTasks = function (callback, onError) {
  dbh.connect(function () {
    dbh.query('SELECT * from tasks', function (result) {
      callback(result)
    }, function (err) {
      onError(err)
    })
  }, function (err) {
    onError(err)
  })
}

Server.updateTask = function (task, callback, onError) {
  dbh.connect(function () {
    dbh.query("UPDATE tasks SET status = '" + task.status + "' WHERE id = " + task.id, function (result) {
      callback(true)
    }, function (err) {
      onError(err)
    })
  }, function (err) {
    onError(err)
  })
}

module.exports = Server
