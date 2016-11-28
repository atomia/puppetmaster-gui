var dbh = require('../lib/database_helper')
var request = require('request')
var PlatformOption = require('../platform-options/model')
var fs = require('fs')
var config = require('../config/config.json')

var Server = function (data) {
  this.data = data
}

Server.prototype.data = {}

// TODO: refactor this function
Server.scheduleEnvironmentFromJson = function (environmentId, data, callback, onError) {
  var servers = this.filterSelectedServers(data.servers)
  var environmentName = data.environmentName
  var scheduledServers = 0
  var nodeCount = 0
  for (var serverCountId = 0; serverCountId < servers.length; serverCountId++) {
    nodeCount = nodeCount + servers[serverCountId].node_count
  }
  for (var memberId = 0; memberId < servers.length; memberId++) {

    (function (curServer, onError) {
      var roleCount = 0
      var security_groups = []
      var volume_size = 10
      for (var roleId = 0; roleId < curServer.roles.length; roleId++) {
        PlatformOption.getRoleByName(curServer.roles[roleId].class, function (roleData) {
          roleCount++
          for (var securityGroupId = 0; securityGroupId < roleData.firewall.length; securityGroupId++) {
            security_groups.push(roleData.firewall[securityGroupId])
          }
          for (var rId = 0; rId < curServer.requirements.length; rId++) {
            if (curServer.requirements[rId].check == 'disk') {
              volume_size = curServer.requirements[rId].value
            }
          }
          if (roleCount === curServer.roles.length) {
            // Schedule the jobs
            for (var nodeCount = 0; nodeCount < curServer.node_count; nodeCount++)
            {
              var jobData = {}
              jobData.data = {
                machine: 'create_ec2_server',
                key_name: 'stefan-test-aws',
                vpc_id: 'vpc-ad0f6ac9',
                instance_name: '(' + environmentName + ') ' + curServer.name + '_' + nodeCount,
                ami: curServer.ami,
                type: curServer.ec2_type,
                security_groups: security_groups,
                existing_security_groups: ['default'],
                os: curServer.operating_system,
                volume_size: volume_size
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
                dbh.query("INSERT INTO tasks VALUES(null,'" + curServer.name + "', '" + runId + "', '" + JSON.stringify(jobData) + "', null, " + environmentId + ", 'ec2')",
                function () {
                  scheduledServers++
                  if (scheduledServers == nodeCount) {
                    callback()
                  }
                }, function (err) {
                  // dbh.query failed
                  onError(err)
                })
              })
            }
          }
        })
      }
    })(servers[memberId], onError)

  }
}

Server.filterSelectedServers = function (servers) {
  var serverList = []
  for (var categoryId = 0; categoryId < servers.length; categoryId++) {
    for (var memberId = 0; memberId < servers[categoryId].members.length; memberId++) {
      if(servers[categoryId].members[memberId].selected == true) {
        serverList.push(servers[categoryId].members[memberId])
      }
    }
  }
  return serverList
}
Server.getAllTasks = function (platformId, task_type, callback, onError) {
  dbh.query('SELECT * from tasks where type = \''+task_type+'\' AND fk_platform_data = ' + platformId +'', function (result) {
    callback(result)
  }, function (err) {
    onError(err)
  })
}

Server.updateTask = function (task, callback, onError) {
  dbh.query("UPDATE tasks SET status = '" + task.status + "' WHERE id = " + task.id, function () {
    callback(true)
  }, function (err) {
    onError(err)
  })
}

Server.saveAWSConfig = function (awsConfig, callback) {
  if (typeof config.amazon != 'undefined') {
    callback()
    return
  }
  var configPath = '/root/.aws'
  if (!fs.existsSync(configPath)){
    fs.mkdirSync(configPath);
  }
  var awsData = '[default]\n'
  awsData += 'aws_access_key_id=' + awsConfig.aws_key + '\n'
  awsData += 'aws_secret_access_key=' + awsConfig.aws_secret + '\n'
  awsData += 'region=' + awsConfig.aws_region + '\n'
  awsData += 'private_key' + awsConfig.private_key + '\n'
  awsData += 'output=json\n'

  fs.writeFile(configPath + '/config', awsData, function(err) {
    if(err) {
      return callback(err);
    }
    callback()
  });
}

Server.getAWSConfig = function (callback) {
  // The aws config file is stored at /root/.aws/config
  var configPath = '/root/.aws/config'
  if (typeof config.amazon != 'undefined') {
    callback(config.amazon)
    return
  }
  else {
    var awsConfig = {
      'aws_key': '',
      'aws_secret': '',
      'aws_region': '',
      'vpc_id': '',
      'private_key': ''
    }
  }

  fs.stat(configPath, function(err) {
    if(err == null) {
      var lineReader = require('readline').createInterface({
        input: require('fs').createReadStream(configPath)
      });

      lineReader.on ('line', function (line) {
        var awsKeyRE = /^aws_access_key_id=(.*)$/
        var awsSecretRE = /^aws_secret_access_key=(.*)$/
        var awsRegionRE = /^region=(.*)$/
        var vpcIdRE = /^vpc_id=(.*)$/
        var privateKeyRE = /^private_key=(.*)$/

        var awsKey = line.match(awsKeyRE)
        var awsSecret = line.match(awsSecretRE)
        var awsRegion = line.match(awsRegionRE)
        var vpcId = line.match(vpcIdRE)
        var privateKey = line.match(privateKeyRE)

        if (awsKey) {
          awsConfig.aws_key = awsKey[1]
        }
        if (awsSecret) {
          awsConfig.aws_secret = awsSecret[1]
        }
        if (awsRegion) {
          awsConfig.aws_region = awsRegion[1]
        }
        if (vpcId) {
          awsConfig.vpc_id = vpcId[1]
        }
        if (privateKey) {
          awsConfig.private_key = privateKey[1]
        }
      });
      lineReader.on ('close', function () {
        callback(awsConfig)
      })
    }
    else {
      callback (awsConfig)
    }
  })
}

module.exports = Server
