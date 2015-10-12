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
      var a = 0;
      for(var i = 0;i <= sData.length; i++)
      {
        if(typeof(sData[i]) != 'undefined' && sData[i] != '')
        {
          var siData = sData[i].split(" ");
          var hieraVar = "atomia::" + namespace.replace('/','::',namespace) + "::" + siData;
          var inputData = siData;
          database.query("SELECT * FROM configuration WHERE var = '" + hieraVar + "'", (function(inputData) { return function(err, rows, field){
            a++;
            if(err)
              throw err;

            var data = {};
            data.required = "notrequired";
            if(typeof(inputData[1]) == 'undefined' || inputData[1] == "")
            {
              inputData[1] = "";
              data.required = "required";
            }
            command = 'sh ' + __dirname + '/../scripts/get_variable_documentation.sh ' + namespace + " " + inputData[0];
            doc = execSync.exec(command);
            command2 = 'sh ' + __dirname + '/../scripts/get_variable_validation.sh ' + namespace + " " + inputData[0];
            validation = execSync.exec(command2);
            command3 = 'sh ' + __dirname + '/../scripts/get_variable_options.sh ' + namespace + " " + inputData[0];
            options = execSync.exec(command3).stdout.split(',');
            if(options.length > 0){
              data.options = [];
              for(var b = 0;b <= options.length; b++){
                data.options[b] = options[b];
                if(options[b] == 'advanced')
                  data.advanced = 'true';
              }
            }
            else {
              data.options = "";
            }
            console.log(options);
            if(rows.length > 0)
            {
              data.value =  rows[0].val;
              data.doc = doc.stdout;
              data.validation = validation.stdout;
              data.name = inputData[0];
              variables[inputData[0]] = data;
            }
            else {
              data.value = inputData[1];
              data.doc = doc.stdout;
              data.validation = validation.stdout;
              data.name = inputData[0];
              variables[inputData[0]] = data;
            }
            if(a == sData.length -1)
                callback(variables);
          }
        })(inputData));
        }
      }

    });
    child.stderr.on('data', function(data) {
      console.log(data);
    });
    child.on('close', function(code) {
    });
}
module.exports = router;
