var config = require('../config/config.json')
var fs = require('fs')
var readline = require('readline')
var fh = require('../lib/file_helper')

var PuppetHelper = function (connection) {
  this.connection = connection
}


PuppetHelper.parseManifest = function (manifest, callback, onError) {
  var manifestPath = config.main.module_path
  var variables = {}
  var classPath = manifest.class
  if (classPath === 'nagios_server' || classPath === 'nagios') {
    classPath = 'nagios/server'
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

    var defaultValueRegex = /^\W+\$([a-z_0-9]*)\W+=\s+'?"?([ a-zA-Z:\/0-9.${}_,-]*)'?"?,?$/
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
    Object.keys(variables).forEach(function(key,index) {
      // Add pretty variable name from config
      if (typeof localConfig.pretty_variables[key] != 'undefined')
      variables[key].pretty = localConfig.pretty_variables[key]
      else {
        variables[key].pretty = false
      }
      variables[key].rolePretty = localConfig.name
      variables[key].name = key
      // Rewrite int_boolean strings to true/false
      if (variables[key].value == '0')
      variables[key].value = false;
      if (variables[key].value == '1')
      variables[key].value = true;

      if(typeof variables[key].advanced != 'undefined')
      retArr.push(variables[key])
    });

    callback(retArr)
  })



}

module.exports = PuppetHelper
