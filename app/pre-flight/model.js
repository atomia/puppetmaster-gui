var dbh = require('../lib/database_helper')
var request = require('request')
var Servers = require('../servers/model')
var PreFlight = function (data) {
  this.data = data
}

PreFlight.prototype.data = {}

PreFlight.schedulePreFlightFromJson = function (environmentId, data, callback, onError) {

  var servers = Servers.filterSelectedServers(data.servers)
  var scheduledServers = 0

  for (var memberId = 0; memberId < servers.length; memberId++) {

    (function (curServer) {
      // Schedule the job
      var jobData = {}
      var requirementsData = {}
      for (var rId = 0; rId < curServer.requirements.length; rId++) {
        requirementsData[curServer.requirements[rId].check] = curServer.requirements[rId].value
      }
      var roleData = []
      for (var roleId = 0; roleId < curServer.roles.length; roleId++) {
        roleData.push(curServer.roles[roleId].class)
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
          machine: 'pre_flight_checks',
          system_requirements: requirementsData,
          os: curServer.operating_system,
          hostname: curServer.nodes[nodeCount].hostname,
          username: username,
          password: curServer.nodes[nodeCount].password,
          key: '/root/.ssh/' + 'stefan-test-aws.pem', //TODO: This should not be hardcoded!
          roles: roleData
        }

        var options = {
          url: 'http://localhost:3000/restate-machines',
          method: 'POST',
          body: jobData,
          json: true
        }
        request(options, function (error, response, body) {
          if (error) {
            // Handle error here
          }
          var runId = JSON.parse(body).Id
          // Run scheduled add a reference to the database
          // TODO: we should not allow duplicate task_ids for an environment
          dbh.query("INSERT INTO tasks VALUES(null,'" + curServer.name + " pre-flight', '" + runId + "', '" + JSON.stringify(jobData) + "', null, " + environmentId + ", 'pre_flight')",
          function () {
            scheduledServers++
            if (scheduledServers == servers.length) {
              callback()
            }
          }, function (err) {
            // dbh.query failed
            onError(err)
          })
        })
      }
    })(servers[memberId])

  }
}

PreFlight.getAllTasks = function (callback, onError) {
  dbh.query('SELECT * from tasks', function (result) {
    callback(result)
  }, function (err) {
    onError(err)
  })
}

PreFlight.updateTask = function (task, callback, onError) {
  dbh.query("UPDATE tasks SET status = '" + task.status + "' WHERE id = " + task.id, function () {
    callback(true)
  }, function (err) {
    onError(err)
  })
}

module.exports = PreFlight
