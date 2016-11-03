var config = require('../config/config.json')
var fs = require('fs')
var readline = require('readline')
var fh = require('../lib/file_helper')
var dbh = require('../lib/database_helper')

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
      variables[key].namespace = manifest.class

      // Rewrite int_boolean strings to true/false
      if (variables[key].value === '0'){
        variables[key].value = false;
      }
      if (variables[key].value === '1') {
        variables[key].value = true;
      }

      // Generate passwords for password fields
      if (variables[key].validation === '%password' && variables[key].value === '') {
        variables[key].value = PuppetHelper.generatePassword()
      }

      if(typeof variables[key].advanced != 'undefined')
      retArr.push(variables[key])
    });

    callback(retArr)
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
