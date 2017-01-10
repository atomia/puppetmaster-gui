var config = require('../config/config.json')
var fs = require('fs')
var readline = require('readline')
var PlatformOption = require('../platform-options/model')
var waterfall = require('async-waterfall')
var PuppetHelper = function (connection) {
  this.connection = connection
}


PuppetHelper.parseManifest = function (environmentName, manifest, callback) {
  var manifestPath = config.main.module_path
  var variables = {}
  var classPath = manifest.class
  if (classPath === 'nagios_server' || classPath === 'nagios') {
    classPath = 'nagios/server'
  }
  if (classPath === 'glusterfs_replica') {
    callback(null)
    return
  }
  var rd = readline.createInterface({
    input: fs.createReadStream(manifestPath + '/' + classPath + '.pp'),
    output: process.stdout,
    terminal: false
  })

  rd.on('line', function(line) {
    // Search fo documentation
    var docRegex = /^####\s([a-zA-Z_0-9]*):\s(.*)$/
    var docRegexResult = line.match(docRegex)
    if (docRegexResult) {

      if (typeof variables[docRegexResult[1]] == 'undefined')
      variables[docRegexResult[1]] = {}

      variables[docRegexResult[1]].documentation = docRegexResult[2]
    }

    var validationRegex = /^#####\s([a-zA-Z_0-9]*)(\(advanced\))?:\s?(.*)$/
    var validationRegexResult = line.match(validationRegex)
    if (validationRegexResult) {
      if (typeof variables[validationRegexResult[1]] == 'undefined')
      variables[validationRegexResult[1]] = {}

      variables[validationRegexResult[1]].advanced = (validationRegexResult[2] === '(advanced)' ? true : false)
      variables[validationRegexResult[1]].validation = validationRegexResult[3]

    }

    var defaultValueRegex = /^\W+\$([a-z_0-9]*)\W+=\s+'?"?([ a-zA-Z:\/0-9.${}_,-]*)'?"?,?\)?\{?$/
      var defaultValueRegexResult = line.match(defaultValueRegex)
      if (defaultValueRegexResult) {
        if (typeof variables[defaultValueRegexResult[1]] != 'undefined') {
          variables[defaultValueRegexResult[1]].value = defaultValueRegexResult[2].replace(/,\s*$/, "")
        }
      }
    })

    rd.on ('close', function() {
      var retArr = []
      var localConfig = require('../config/roles/' + manifest.class + '.json')
      var objectCount = 0
      var objectTotal = 0
      /* eslint-disable no-unused-vars */

      objectTotal = Object.keys(variables).length
      Object.keys(variables).forEach(function(key, index) {
        waterfall([
          function (callback) {
            var curKey = key

            /* eslint-enable no-unused-vars */
            // Add pretty variable name from config
            if (typeof localConfig.pretty_variables[curKey] != 'undefined')
            variables[curKey].pretty = localConfig.pretty_variables[curKey]
            else {
              variables[curKey].pretty = false
            }
            variables[curKey].rolePretty = localConfig.name
            variables[curKey].name = key
            variables[curKey].namespace = manifest.class

            if (typeof variables[curKey].value == 'undefined') {
              variables[curKey].value = ''
            }


            if (variables[curKey].validation === '%int_boolean') {

              // Rewrite int_boolean strings to true/false
              if (variables[curKey].value === '0'){
                variables[curKey].value = false;
              }
              if (variables[curKey].value === '1') {
                variables[curKey].value = true;
              }
            }
            // Generate passwords for password fields
            if (variables[curKey].validation === '%password' && variables[curKey].value === '') {
              variables[curKey].value = PuppetHelper.generatePassword()
            }

            callback(null,curKey)
          },
          function (curKey, callback) {
            if (variables[curKey].validation === '%ipaddress' && variables[curKey].value === '') {
              PlatformOption.getHostnameForRole(environmentName, manifest.class, function (hostname) {
                if (hostname != null) {
                  PlatformOption.getIpFromHostname(hostname, function (ip) {
                    variables[curKey].value = ip
                    callback(null, curKey)
                  })
                }
              },
              function (error) {
                error.message = 'Could not fetch roles'
                //  next(error)
              }
            )
          }
          else {
            callback(null, curKey)
          }
        },
        function (curKey, callback) {
          if (variables[curKey].validation === '%hostname' && variables[curKey].value === '') {
            PlatformOption.getHostnameForRole(environmentName, manifest.class, function (hostname) {
              if (hostname != null) {
                variables[curKey].value = hostname
              }
              callback(null,curKey)
            },
            function (error) {
              error.message = 'Could not fetch roles'
              callback(null,curKey)
            }
          )
        }
        else {
          callback(null,curKey)
        }
      },
      function (curKey, callback) {
        if (typeof variables[curKey].value == 'string' && variables[curKey].value.includes('${::fqdn}')) {
          PlatformOption.getHostnameForRole(environmentName, manifest.class, function (hostname) {
            if (hostname != null) {

              variables[curKey].value = variables[curKey].value.replace('${::fqdn}',hostname)
            }
            callback(variables[curKey])
          },
          function (error) {
            error.message = 'Could not fetch roles'
            callback(variables[curKey])
          }
        )
      }
      else {
        callback(variables[curKey])
      }
    },
    ],
    function (variable) {
      if(typeof variable.advanced != 'undefined') {
        if (variables[key].validation != '%hide') {
          retArr.push(variable)
        }
        objectCount++
        if(objectCount == objectTotal ) {
          callback(retArr)
        }
      } else { objectCount++ }
    } )
  });
})
}

String.prototype.replaceAt = function(index, character) {
  return this.substr(0, index) + character + this.substr(index+character.length);
}

PuppetHelper.generatePassword = function () {

  var length = 16;
  var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVXYZ1234567890';
  var lowerCase = 'abcdefghijklmnopqrstuvwxyz';
  var upperCase = 'ABCDEFGHIJKLMNOPQRSTUVXYZ';
  var numbers = '1234567890';
  var pass = '';
  for (var x = 0; x < length; x++) {
    var i = Math.floor(Math.random() * chars.length);
    pass += chars.charAt(i);
  }
  var arr = []
  while(arr.length < 3){
    var randomnumber=Math.ceil(Math.random()*(length - 1));
    var found=false;
    for(var a=0;a<arr.length;a++){
      if(arr[a]==randomnumber){found=true;break;}
    }
    if(!found)arr[arr.length]=randomnumber;
  }
  pass = pass.replaceAt(arr[0], lowerCase.charAt(Math.floor(Math.random() * lowerCase.length)));
  pass = pass.replaceAt(arr[1], upperCase.charAt(Math.floor(Math.random() * upperCase.length)));
  pass = pass.replaceAt(arr[2], numbers.charAt(Math.floor(Math.random() * numbers.length)));
  return (pass)

}

module.exports = PuppetHelper
