var dbh = require('../lib/database_helper')
var PuppetHelper = require('../lib/puppet_helper')
var PuppetConfig = function (data) {
  this.data = data
}

PuppetConfig.prototype.data = {}


PuppetConfig.getVariables = function (environmentData, callback) {
  // Get all selected roles
  var environmentName = environmentData.name.toLowerCase().replace(/\s/g, "_")
  var roleNames = []
  var totalNumRoles = 0
  var roleId = 0
  for (var categoryId = 0; categoryId < environmentData.servers.length; categoryId++) {
    for (var serverId = 0; serverId < environmentData.servers[categoryId].members.length; serverId++) {
      if(environmentData.servers[categoryId].members[serverId].selected) {
        roleNames.push(environmentData.servers[categoryId].members[serverId].roles)
        totalNumRoles+=environmentData.servers[categoryId].members[serverId].roles.length
      }

    }
  }

  var roleCount = 0
  var manifestData = []
  for (roleId = 0; roleId < roleNames.length; roleId++) {
    for (var subRoleId = 0; subRoleId < roleNames[roleId].length; subRoleId++) {
      (function () {
        PuppetHelper.parseManifest(environmentData.name, roleNames[roleId][subRoleId], function (variables) {
          // Check for database overrides
          dbh.query ('SELECT * FROM configuration WHERE env = \'' + environmentName + '\'', function (data) {
            roleCount++
            if (variables != null) {
              for (var id = 0; id < variables.length; id++) {
                if(variables[id].name == 'skip_mount')
                var currentVariable = 'atomia::' + variables[id].namespace + '::' + variables[id].name;
                for (var dId = 0; dId < data.length; dId++) {
                  if( data[dId].var == currentVariable) {
                    if (data[dId].val == '0')
                    data[dId].val = 0;
                    if (data[dId].val == '1')
                    data[dId].val = 1;

                    variables[id].value = data[dId].val
                  }
                }
              }
              manifestData.push({'name' : variables[0].rolePretty, 'variables' : variables})
            }

            if(roleCount == totalNumRoles) {
              callback(manifestData)
            }
          })//, function (err) {  })


        })
      })(roleNames[roleId][subRoleId])
    }
  }

}

PuppetConfig.handleSpecialVariables = function (variable) {

  return variable
}

PuppetConfig.updateData = function (environmentName, data, callback, onError) {
  environmentName = environmentName.toLowerCase().replace(/\s/g, "_")
  var variablesDone = 0
  var totalVariables = 0
  for (var manifestIndex = 0; manifestIndex < data.length; manifestIndex++) {
    for (var variableIndex = 0; variableIndex < data[manifestIndex].variables.length; variableIndex++) {
      totalVariables++
      var curVariable = 'atomia::' + data[manifestIndex].variables[variableIndex].namespace + '::' + data[manifestIndex].variables[variableIndex].name
      var curValue = data[manifestIndex].variables[variableIndex].value

      if(curValue !== '') {
        if (data[manifestIndex].variables[variableIndex].validation === '%int_boolean') {
          if (data[manifestIndex].variables[variableIndex].value == true || data[manifestIndex].variables[variableIndex].value === 'true') {
            curValue = '1'
          }
          else if ((data[manifestIndex].variables[variableIndex].value == false )) {
            curValue = '0'
          }
        }
      }
      dbh.query('INSERT INTO configuration VALUES(null,\'' + curVariable + '\',\'' + curValue + '\',\'' + environmentName + '\') ON DUPLICATE KEY UPDATE val = \'' + curValue + '\'', function () {
        variablesDone++
        if(totalVariables == variablesDone)
        {
          callback(true)
        }
      }, function (err) {
        onError(err)
      })
    }
  }
}
module.exports = PuppetConfig
