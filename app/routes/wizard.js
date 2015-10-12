var express = require('express');
var router = express.Router();
var sys = require('sys');
var exec = require('child_process').exec;
var execSync = require('execSync');

/* GET users listing. */
router.get('/', function(req, res, next) {
      res.render('wizard/index');
});

router.get('/puppet', function(req, res, next) {
      res.render('wizard/puppet');
});

router.get('/basic', function(req, res, next) {
  basicConfig = {};

  basicConfig["atomia_domain"] = {
    "name" : "atomia_domain",
    "required" : "required",
    "value" : "",
    "doc" : "The domain name where all your Atomia applications will be placed. For example writing atomia.com in the box below will mean that your applications will be accessible at hcp.atomia.com, billing.atomia.com etc. Please make sure that you have a valid wildcard SSL certificate for the domain name you choose as the Atomia frontend applications are served over SSL"
  }

  res.render('wizard/basic', { config: basicConfig, moduleName: "config" });

});

router.get('/domainreg', function(req, res, next) {
  getConfiguration('domainreg', function(config){
    moduleName = "atomia::domainreg";
    database.query("SELECT * FROM ssh_keys", function(err, rows, field){
      if(err)
        throw err;
        res.render('wizard/domainreg', { keys: rows, config: config, moduleName: moduleName });
    })
  });
});

router.get('/atomiadns', function(req, res, next) {
  getConfiguration('atomiadns', function(config){
    moduleName = "atomia::atomiadns";
    database.query("SELECT * FROM ssh_keys", function(err, rows, field){
      if(err)
        throw err;
        res.render('wizard/atomiadns', { keys: rows, config: config, moduleName: moduleName });
    })
  });
});

router.get('/monitoring', function(req, res, next) {
  getConfiguration('nagios/server', function(config){
    moduleName = "atomia::nagios::server";
    database.query("SELECT * FROM ssh_keys", function(err, rows, field){
      if(err)
        throw err;
        res.render('wizard/monitoring', { keys: rows, config: config, moduleName: moduleName });
    })
  });
});

router.post('/puppet', function(req, res, next) {

    var child = exec("repo=\"$(wget -q -O - http://public.apt.atomia.com/setup.sh.shtml | sed s/%distcode/`lsb_release -c | awk '{ print $2 }'`/g)\"; echo \"$repo\" | sh && apt-get update && apt-get install -y atomia-puppetmaster");
    child.stdout.on('data', function(data) {
      io.emit('server', { consoleData: data });
    });
    child.stderr.on('data', function(data) {
      io.emit('server', { consoleData: "Error communicating with server " + data });
      io.emit('server', { done: 'error' });
      child.kill();
    });
    child.on('close', function(code) {
        io.emit('server', { done: 'ok' });
    });

    res.setHeader('Content-Type', 'application/json');
  	res.status(200);
    res.send(JSON.stringify({ok: "ok"}));
});

/*
Fetches configuraton from the Puppet module
*/
function getConfiguration (namespace, callback) {
    command = 'sh ' + __dirname + '/../scripts/get_variables.sh ' + namespace;
    variables = {};
    var child = exec(command);
    child.stdout.on('data', function(data) {
      var sData = data.split("\n");
      for(var i = 0;i <= sData.length; i++)
      {
        if(typeof(sData[i]) != 'undefined' && sData[i] != '')
        {
          var siData = sData[i].split(" ");
          var data = {};
          data.required = "notrequired";
          if(typeof(siData[1]) == 'undefined' || siData[1] == "")
          {
            siData[1] = "";
            data.required = "required";
          }
          command = 'sh ' + __dirname + '/../scripts/get_variable_documentation.sh ' + namespace + " " + siData[0];
          doc = execSync.exec(command);
          command2 = 'sh ' + __dirname + '/../scripts/get_variable_validation.sh ' + namespace + " " + siData[0];
          console.log(command);
          validation = execSync.exec(command2);
          data.value = siData[1];
          data.doc = doc.stdout;
          data.validation = validation.stdout;
          data.name = siData[0];
          variables[siData[0]] = data;
        }
      }
      callback(variables);
    });
    child.stderr.on('data', function(data) {
      console.log(data);
    });
    child.on('close', function(code) {
    });
}
module.exports = router;
