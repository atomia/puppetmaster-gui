var express = require('express');
var router = express.Router();
var sys = require('sys');
var exec = require('child_process').exec;
var execSync = require('execSync');
var fs = require('fs');
var yaml = require('yamljs');

/* GET users listing. */
router.get('/', function(req, res, next) {
      res.render('wizard/index');
});

router.get('/puppet', function(req, res, next) {
      res.render('wizard/puppet');
});

router.get('/basic', function(req, res, next) {
  getConfiguration('config', function(config){
    res.render('wizard/basic', { config: config, moduleName: "atomia::config" });
  });

});

router.get('/internaldns', function(req, res, next) {
  setVariablesAndRender("internaldns", res);
});


router.get('/domainreg', function(req, res, next) {
  setVariablesAndRender("domainreg", res);
});

router.get('/atomiadns', function(req, res, next) {
  setVariablesAndRender("atomiadns", res);
});

router.get('/monitoring', function(req, res, next) {
  setVariablesAndRender("nagios/server", res, "nagios_server");
});

router.post('/puppet', function(req, res, next) {

    var child = exec("repo=\"$(wget -q -O - http://public.apt.atomia.com/setup.sh.shtml | sed s/%distcode/`lsb_release -c | awk '{ print $2 }'`/g)\"; echo \"$repo\" | sh && apt-get update && apt-get install -y atomia-puppetmaster && /bin/setup-puppet-atomia");
    child.stdout.on('data', function(data) {
      io.emit('server', { consoleData: data });
    });
    child.stderr.on('data', function(data) {
      io.emit('server', { consoleData: "Error communicating with server " + data });
      io.emit('server', { done: 'error' });
      child.kill();
    });
    child.on('close', function(code) {
        var hostname =  execSync.exec("facter fqdn 2> /dev/null").stdout;
        database.query("INSERT INTO servers VALUES(null,'" + hostname + "','','','')",function(err, rows, field) {
          serverId = rows["insertId"];
          database.query("INSERT INTO roles VALUES(null,'puppet','" + serverId + "')", function(err, rows, field) {
          });
        });

        io.emit('server', { done: 'ok' });
    });

    res.setHeader('Content-Type', 'application/json');
  	res.status(200);
    res.send(JSON.stringify({ok: "ok"}));
});

router.get('/glusterfs', function(req, res, next) {
  getConfiguration('glusterfs', function(config){
    moduleName = "atomia::nagios::server";
    database.query("SELECT * FROM ssh_keys", function(err, rows, field){
      if(err)
        throw err;
        res.render('wizard/glusterfs', { keys: rows, config: config, moduleName: moduleName });
    })
  });
});

function setVariablesAndRender(currentRole, res, role) {
  getConfiguration(currentRole, function(config){
    moduleName = "atomia::" + currentRole;
    database.query("SELECT * FROM ssh_keys", function(err, keyRows, field){
      if(err)
        throw err;
      dbRole = currentRole;
      if(role)
        dbRole = role;
      database.query("SELECT hostname, username, password, fk_ssh_key, ssh_keys.name as 'ssh_key_name' from servers JOIN roles ON roles.fk_server = servers.id JOIN ssh_keys ON ssh_keys.id = servers.fk_ssh_key WHERE roles.name = '"+dbRole+"'", function(err, serverRows, field){
        if(err)
          throw err;
        res.render('wizard/' + currentRole, { keys: keyRows, config: config, moduleName: moduleName, server: serverRows[0] });
      });
    })
  });
}
/*
Fetches configuraton from the Puppet module using external scripts
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
          var hieraVar = "atomia::" + namespace.replace('/','::',namespace) + "::" + siData[0];
          var inputData = siData;
          database.query("SELECT * FROM configuration WHERE var = '" + hieraVar.replace(",","") + "'", (function(inputData) { return function(err, rows, field){
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
                else if(typeof options[b] != 'undefined' && options[b].split("=")[0] == 'default_file'){
                  try
                  {
                  var content = fs.readFileSync("/etc/puppet/modules/atomia/files/" + namespace + "/" + options[b].split("=")[1])
                  inputData[1] = content;
                  data.textArea = 'true';
                  }
                  catch (e)
                  {
                    console.log("File missing " + options[b].split("=")[1]);
                  }
                }
              }
            }
            else {
              data.options = "";
            }

            if(rows.length > 0)
            {
              if(inputData[0] == 'domainreg_tld_config_hash') {
                domainregData = JSON.parse(rows[0].val);
                data.value = domainregData;
              }
              else {
              data.value =  rows[0].val;
              }
              data.doc = doc.stdout;
              data.validation = validation.stdout.trim();
              data.name = inputData[0];
              variables[inputData[0]] = data;
            }
          else {

              data.value = "";
              for(b = 1; b < inputData.length; b++){
                console.log(b);
                data.value = data.value + inputData[b];
                }
              data.doc = doc.stdout;
              data.validation = validation.stdout.trim();
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
