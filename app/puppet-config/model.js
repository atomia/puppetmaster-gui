var dbh = require('../lib/database_helper')
var request = require('request')
var config = require('../config/config.json')
var exec = require('child_process').exec;
var PuppetHelper = require('../lib/puppet_helper')
var PuppetConfig = function (data) {
  this.data = data
}

PuppetConfig.prototype.data = {}


PuppetConfig.getVariables = function (environmentData, callback, onError) {
  var modulePath = config.main.module_path

  // Get all selected roles
  var roleNames = []
  var totalNumRoles = 0
  for (var categoryId = 0; categoryId < environmentData.servers.length; categoryId++) {
    for (var serverId = 0; serverId < environmentData.servers[categoryId].members.length; serverId++) {
      if(environmentData.servers[categoryId].members[serverId].selected) {
        for (var roleId = 0; roleId < environmentData.servers[categoryId].members[serverId].roles.length; roleId++) {
          roleNames.push(environmentData.servers[categoryId].members[serverId].roles)
          totalNumRoles+=environmentData.servers[categoryId].members[serverId].roles.length
        }
      }
    }
  }

  var roleCount = 0
  var manifestData = []
  for (var roleId = 0; roleId < roleNames.length; roleId++) {
    for (var subRoleId = 0; subRoleId < roleNames[roleId].length; subRoleId++) {
      (function (role) {
      PuppetHelper.parseManifest(roleNames[roleId][subRoleId], function (variables) {
        roleCount++
        console.log(variables[0])
        manifestData.push({'name' : variables[0].rolePretty, 'variables' : variables})
        if(roleCount == totalNumRoles) {
          callback(manifestData)
        }
      })
    })(roleNames[roleId][subRoleId])
    }
  }

}

PuppetConfig.handleSpecialVariables = function (variable) {

  return variable
}

module.exports = PuppetConfig
