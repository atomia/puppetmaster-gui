var express = require('express');
var router = express.Router();
var sys = require('sys');
var exec = require('child_process').exec;
var execSync = require('execSync');
var fs = require('fs');
var yaml = require('yamljs');
var puppetDB = require('../lib/puppetdb.js');

/* GET users listing. */
router.get('/', function(req, res, next) {
      res.render('wizard/index');
});

router.get('/next_step', function(req, res, next) {
  database.query("SELECT * FROM app_config WHERE var IN('current_step','installation_steps_default')", function(err, rows, field){
    for(var i = 0; i <rows.length; i++)
    {
      if(rows[i].var == 'current_step')
        step = rows[i].val;
      if(rows[i].var == 'installation_steps_default')
        installationSteps = rows[i].val;
    }
    nextStepId = parseInt(step) + 1;
    nextStep = JSON.parse(installationSteps)[nextStepId];
    res.redirect(nextStep.route);
    database.query("UPDATE app_config SET val =" + nextStepId + " WHERE var = 'current_step'", function(err, rows, field){

    });

  });
});

router.get('/all_tasks', function(req, res, next) {
  database.query("SELECT * FROM app_config WHERE var IN('current_step','installation_steps_default')", function(err, rows, field){
    for(var i = 0; i <rows.length; i++)
    {
      if(rows[i].var == 'current_step')
        step = rows[i].val;
      if(rows[i].var == 'installation_steps_default')
        installationSteps = rows[i].val;
    }
    currentStep = JSON.parse(installationSteps)[step];
    res.render('wizard/all_tasks', {allSteps: JSON.parse(installationSteps)});

  });
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
  setVariablesAndRender("internaldns", res, null, req);
});

router.get('/atomia_database', function(req, res, next) {
  setVariablesAndRender("atomia_database", res, null, req);
});


router.get('/domainreg', function(req, res, next) {
  setVariablesAndRender("domainreg", res, null, req);
});

router.get('/atomiadns', function(req, res, next) {
  setVariablesAndRender("atomiadns", res, null, req);
});

router.get('/nagios_server', function(req, res, next) {
  setVariablesAndRender("nagios/server", res, "nagios_server", req);
});

router.get('/active_directory', function(req, res, next) {
  setVariablesAndRender("active_directory", res, null, req);
});

router.get('/active_directory_replica', function(req, res, next) {
  setVariablesAndRender("active_directory", res, "active_directory_replica", req);
});

router.get('/windows', function(req, res, next) {
  setVariablesAndRender("windows_base", res, null, req);
});

router.get('/internal_apps', function(req, res, next) {
  setVariablesAndRender("internal_apps", res, null, req);
});

router.get('/public_apps', function(req, res, next) {
  setVariablesAndRender("public_apps", res, null, req);
});

router.post('/puppet', function(req, res, next) {

	var hasError = false;
	var child = exec("puppet=\"$(wget -q -O - https://raw.githubusercontent.com/atomia/puppet-atomia/master/setup-puppet-atomia)\"; echo \"$puppet\" |  sh");

	child.stdout.on('data', function(data) {
		io.emit('server', { consoleData: data });
	});

	child.stderr.on('data', function(data) {
		io.emit('server', { consoleData: 'stderr: ' + data });
	});
	child.on('close', function(code) {
		if(!hasError)
		{
			var hostname =  execSync.exec("facter fqdn 2> /dev/null").stdout;
				database.query("INSERT INTO servers VALUES(null,'" + hostname + "','','','')",function(err, rows, field) {
					serverId = rows["insertId"];
					database.query("INSERT INTO roles VALUES(null,'puppet','" + serverId + "')", function(err, rows, field) {
						io.emit('server', { done: 'ok', error: 'Puppetmaster installed sucessfully!' });
						res.status(200);
						res.send(JSON.stringify({ok: "ok"}));
						database.query("UPDATE app_config SET val = 2 WHERE var = 'current_step';", function(err, rows, field) {

						});
					});
				});
		}
	});
});

router.get('/glusterfs', function(req, res, next) {
  getConfiguration('glusterfs', function(config){
    moduleName = "atomia::glusterfs";
    database.query("SELECT * FROM ssh_keys", function(err, rows, field){
      if(err)
        throw err;
        res.render('wizard/glusterfs', { keys: rows, config: config, moduleName: moduleName });
    })
  });
});

function setVariablesAndRender(currentRole, res, role, req, hostname) {
  getConfiguration(currentRole, function(config){
    moduleName = "atomia::" + currentRole.replace("/","::");
    database.query("SELECT * FROM ssh_keys", function(err, keyRows, field){
      if(err)
        throw err;
      dbRole = currentRole;
      if(role)
        dbRole = role;
	  database.query("SELECT hostname, username, password, fk_ssh_key, ssh_keys.name as 'ssh_key_name' from servers JOIN roles ON roles.fk_server = servers.id LEFT JOIN ssh_keys ON ssh_keys.id = servers.fk_ssh_key WHERE roles.name = '"+dbRole+"'", function(err, serverRows, field){
        if(err)
          throw err;
        database.query("select * from roles  JOIN servers ON servers.id=roles.fk_server WHERE roles.name='puppet'", function(err, rows, field){
          puppetHostname = "";
          if(typeof rows[0] != 'undefined')
            puppetHostname = rows[0]['hostname'];
          if(role)
            currentRole = role;
			if(typeof serverRows[0] != 'undefined')
				serverHostname = serverRows[0].hostname;
			else
				serverHostname = "";
				
		puppetDB.getReports(serverHostname, function(reports){

			if(reports.length > 0)
				reportStatus = reports[0].status
			else
				reportStatus = ""

				console.log("RENDER");
			res.render('wizard/' + currentRole, { latestReport: reports[0], reportStatus: reportStatus, keys: keyRows, config: config, moduleName: moduleName, server: serverRows[0], puppetMaster: puppetHostname, path:req.originalUrl });

		});
        });
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
      database.query("SELECT * FROM configuration",  function(err, allConfig, field){
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
                data.value = data.value + inputData[b];
              }

              // Replace special strings
              if(data.value.indexOf("[[atomia_domain]]") > -1)
              {
                atomia_domain = allConfig.filter(function(v) { return v["var"] == "atomia::config::atomia_domain";});
                data.value = data.value.replace(/\[\[atomia_domain\]\]/g,atomia_domain[0].val);
              }
              if(data.value.indexOf("expand_default") > -1)
              {
                data.value = data.value.replace(/expand_default\(\'/g,"");
                data.value = data.value.replace(/\'\)$/g,"");
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

    });
    child.stderr.on('data', function(data) {
      console.log(data);
    });
    child.on('close', function(code) {
    });
}
module.exports = router;
