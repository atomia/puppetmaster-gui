var dbh = require('../lib/database_helper')
var request = require('request')
var Servers = require('../servers/model')
var Installation = function (data) {
  this.data = data
}

Installation.prototype.data = {}

Installation.scheduleInstallationFromJson = function (environmentId, environmentName, data, callback, onError) {

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
      var roleData = {}
      for (var roleId = 1; roleId < curServer.roles.length +1; roleId++) {
        roleData["atomia_role_" + roleId] = curServer.roles[roleId -1].class
      }
      jobData.data = {
        machine: 'provision_server',
        os: curServer.operating_system,
        hostname: curServer.hostname,
        username: curServer.username,
        password: curServer.password,
        key: '/root/.ssh/' + 'stefan-test-aws.pem', //TODO: This should not be hardcoded!
        environment: environmentName.toLowerCase().replace(/\s/g, "_"),
        roles: JSON.stringify(roleData)
      }
      var options = {
        url: 'http://localhost:3000/restate-machines',
        method: 'POST',
        body: jobData,
        json: true
      }
      request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {

          var runId = JSON.parse(body).Id
          // Run scheduled add a reference to the database
          // TODO: we should not allow duplicate task_ids for an environment
          dbh.query("INSERT INTO tasks VALUES(null,'" + curServer.name + " installation', '" + runId + "', '" + JSON.stringify(jobData) + "', null, " + environmentId + ", 'installation')",
          function () {
            scheduledServers++
            if (scheduledServers == servers.length) {
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

Installation.updateTask = function (task, callback, onError) {
  dbh.query("UPDATE tasks SET status = '" + task.status + "' WHERE id = " + task.id, function () {
    callback(true)
  }, function (err) {
    onError(err)
  })
}

module.exports = Installation
