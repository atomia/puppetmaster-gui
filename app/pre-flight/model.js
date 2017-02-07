var dbh = require('../lib/database_helper')
var request = require('request')
var Servers = require('../servers/model')
var PreFlight = function (data) {
  this.data = data
}

PreFlight.prototype.data = {}

PreFlight.schedulePreFlightFromJson = function (environmentId, data, callback, onError) {

  var servers = Servers.filterSelectedServers(data.servers)
  var serverKey = ''
  if(data.amazon) {
    Servers.getAWSConfig(function (aws){
      serverKey = aws.private_key
      PreFlight.doSchedule(environmentId, servers, serverKey, 0, 0, callback, onError)
    })
  } else {
    serverKey = data.server_key
    PreFlight.doSchedule(environmentId, servers, serverKey, 0, 0, callback, onError)
  }
}

PreFlight.doSchedule = function (environmentId, servers, serverKey, currentId, nodeId, callback, onError) {

  var curServer = servers[currentId]
  // Schedule the job
  if (typeof curServer != 'undefined') {
    var jobData = {}
    var requirementsData = {}
    for (var rId = 0; rId < curServer.requirements.length; rId++) {
      requirementsData[curServer.requirements[rId].check] = curServer.requirements[rId].value
    }
    var roleData = []
    for (var roleId = 0; roleId < curServer.roles.length; roleId++) {
      roleData.push(curServer.roles[roleId].class)
    }
      var username = curServer.nodes[nodeId].username
      if (curServer.nodes[nodeId].username == '') {
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
        hostname: curServer.nodes[nodeId].hostname,
        username: username,
        password: curServer.nodes[nodeId].password,
        key: serverKey,
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
          if(nodeId < curServer.node_count -1) {
            nodeId++
          } else {
            currentId++
            nodeId = 0
            if (currentId >= servers.length) {
              callback()
              return
            }
          }
          // Recursive call
          PreFlight.doSchedule(environmentId, servers, serverKey, currentId, nodeId, callback, onError)
          return
        }, function (err) {
          onError(err)
        })
      })
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
