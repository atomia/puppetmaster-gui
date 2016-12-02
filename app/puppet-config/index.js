var express = require('express')
var router = express.Router()
var PuppetConfig = require('./model')
var PlatformOption = require('../platform-options/model')


router.get('/', function (req, res, next) {
  var selectedEnvironmentData = req.cookies.platformName

  PlatformOption.getEnvironmentFromDatabase(selectedEnvironmentData, function (data) {
    PuppetConfig.getVariables(JSON.parse(data.json_data.replace(/(^")|("$)/g, "")), function (data) {
      var environmentName = req.cookies.platformName.toLowerCase().replace(/\s/g, "_")


      const exec = require('child_process').exec;
      exec("/bin/bash -c 'if [ ! -d \"/etc/puppet/atomiacerts/" + environmentName + "\" ]; then exit 1; fi'", (error) => {
        var certExists = false
        if (!error) {
          certExists = true
        }
        res.render('puppet-config/puppet-config', {'varData' : data, 'envName' : selectedEnvironmentData, 'certExists' : certExists})
      });
    })
  },
  function (error) {
    error.message = 'Could not load environment'
    next(error)
  })
})

router.post('/', function (req) {
  var configurationData = JSON.parse(req.body.configuration)
  PuppetConfig.updateData(req.cookies.platformName, configurationData, function() {

  }, function() {
    // Handle error here
  })
})

router.post('/certificate', function (req,res) {
  var environmentName = req.cookies.platformName.toLowerCase().replace(/\s/g, "_")
  var appDomain = req.body.appDomain
  var loginUrl = req.body.loginUrl
  var orderUrl = req.body.orderUrl
  var billingUrl = req.body.billingUrl
  var hcpUrl = req.body.hcpUrl
  const spawn = require('child_process').spawn;
  const generate_cert = spawn('ruby', ['/etc/puppet/modules/atomia/files/certificates/generate_certificates.rb', appDomain, loginUrl, orderUrl, billingUrl, hcpUrl, environmentName]);
  generate_cert.on('close', (code) => {
    res.json({'status': code})
  });
})



module.exports = router
