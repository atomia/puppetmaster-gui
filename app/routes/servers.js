var express = require('express');
var router = express.Router();
var ping = require('net-ping');
var dns = require('dns');
var ssh  = require('simple-ssh');
var fs = require('fs');
var execSync = require('execSync');
var exec = require('child_process').exec;
var puppetDB = require('../lib/puppetdb.js');

router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/status/:hostname', function(req, res, next) {
	var hostname = req.params.hostname;
	puppetDB.getReports(hostname, function(reports){
		res.render('servers/status', {reports: reports, hostname: hostname});
	});
});

router.get('/status/events/:hash', function(req, res, next) {
	var hash = req.params.hash;
	puppetDB.getEvents(hash, function(events){
		res.render('servers/events', {events: events});
	});
});

router.get('/new', function(req, res, next) {
  database.query("SELECT * FROM ssh_keys", function(err, rows, field){
    if(err)
      throw err;
      res.render('servers/new', { keys: rows });
  })
});


router.get('/ip/:hostname', function(req, res, next) {
  var hostname = req.params.hostname;
  dns.resolve4(hostname, function(err, ip){
    res.send(ip);
  });

});

router.delete('/:hostname', function(req, res, next) {
	var hostname = req.params.hostname;
	database.query("DELETE servers FROM servers JOIN roles ON servers.id = roles.fk_server WHERE servers.hostname = '" + hostname + "'", function(err, rows, field){
		if(err){
			res.send(JSON.stringify({error: "could not delete from database"}));
		}
			res.send(JSON.stringify({error: "ok"}));

	})
});

router.post('/update_hostname', function(req, res, next) {
	var serverHostname = req.body.serverHostname;
    var serverUsername = req.body.serverUsername;
    var serverPassword = req.body.serverPassword;

	var newHostname = "";
	var newHostnameExec = exec("python " + __dirname + "/../scripts/run_winrm_command.py " + serverUsername + " " + serverPassword + " " + serverHostname + " 'facter fqdn 2> nul' 'cmd'");

	newHostnameExec.stdout.on('data', function(data) {
		console.log(data);
		newHostname = newHostname + data;
	});

	newHostnameExec.on('close', function (code) {
		newHostname = newHostname.replace(/(\r\n|\n|\r)/gm, "");
		if(newHostname != ""){
			database.query("UPDATE servers SET hostname = '"+newHostname.toLowerCase()+"' WHERE hostname = '"+serverHostname+"'", function(err, rows, field) {
				if(err)
				{
					res.send(JSON.stringify({error: "could not update hostname"}));
				}
				else {
					res.send(JSON.stringify({ok: newHostname.toLowerCase()}));
				}
			});
		}
	});


});

router.post('/generate_certificates', function(req, res) {
	var appDomain = req.body.appDomain;
	var login = req.body.login;
	var order = req.body.order;
	var billing = req.body.billing;
	var hcp = req.body.hcp;

	execSync.exec("rm -f /etc/puppet/atomiacerts/certificates/* 2> /dev/null");

	var spawn = require('child_process').spawn,
	child = spawn("ruby",['generate_certificates.rb',appDomain,login,order,billing,hcp], {cwd: "/etc/puppet/modules/atomia/files/certificates/"});

	child.stdout.on('data', function (data) {
		io.emit('server', { consoleData: "" + data});
	});

	child.stderr.on('data', function (data) {
		io.emit('server', { consoleData: "" + data});
	});

	child.on('close', function (code) {
		var numCerts = execSync.exec("ls /etc/puppet/atomiacerts/certificates/ | wc -l").stdout;
		console.log(numCerts.trim());
		if(parseInt(numCerts.trim()) < 1)
		{
			io.emit('server', { error: 'The certificates was not generated!', done: 'error' });
			res.status(500);
			res.send(JSON.stringify({error: "error"}));
		}
		else {
			// Get the certificate thumbprints
			thumbprints = {}
			thumbprints.automation_encryption = execSync.exec("/etc/puppet/modules/atomia/files/certificates/get_cert_fingerprint.sh | grep -A 1 'Automation Server Encryption:' | tail -n 1").stdout;
			thumbprints.billing_encryption = execSync.exec("/etc/puppet/modules/atomia/files/certificates/get_cert_fingerprint.sh | grep -A 1 'Billing Encryption:' | tail -n 1").stdout;
			thumbprints.root = execSync.exec("/etc/puppet/modules/atomia/files/certificates/get_cert_fingerprint.sh | grep -A 1 'Root cert:' | tail -n 1").stdout;
			thumbprints.signing = execSync.exec("/etc/puppet/modules/atomia/files/certificates/get_cert_fingerprint.sh | grep -A 1 'Signing:' | tail -n 1").stdout;

			io.emit('server', { ok: 'Certificates generated sucessfully!',done: 'ok'});
			res.status(200);
			res.send(JSON.stringify({ok: "ok", certificates: thumbprints }));
		}

	});


});

/* Validates that SSH is working on a server */
router.post('/validate/ssh', function(req, res) {
	var serverHostname = req.body.serverHostname;
    var serverUsername = req.body.serverUsername;
    var serverPassword = req.body.serverPassword;
    var serverKey = "";
    var serverKeyId = req.body.serverKey;
    var serverRole = req.body.serverRole;

	if(serverKeyId != null && serverKeyId != "" && typeof(serverKeyId) != 'undefined'){
		getKeyFromId(serverKeyId, function(key){
			serverKey = key;
			tryLogin();
		});
	}else {
		tryLogin();
	}

	function tryLogin(){
		io.emit('server', { consoleData: "\nVerifying SSH connectivity..." });
		sshSession = new ssh({
		  host: serverHostname,
		  user: serverUsername,
		  password: serverPassword,
		  key: serverKey,
		  timeout: 5000
		});

		sshSession.on('error', function(err) {
		  sshSession.end();
		  returnError(res, "\nServer validation failed: Could not connect to the server via SSH!");
		});

		sshSession.exec("echo '\nThis is a test command from Atomia!\n'", {
	      out: function(stdout){
	        io.emit('server', { consoleData: stdout });
	      },
	      exit: function(code) {
	        io.emit('server', { consoleData: "\nCommand completed with status code: " + code });
			if(code == 0)
				returnOk(res, "SSH login verified sucessfully");
			else
				returnError(res, "Server validation failed: Could not execute remot SSH command");
	      }
	    }).start();
	}
});

/* Validates that WinRM is working on a server */
router.post('/validate/windows', function(req, res) {
	var serverHostname = req.body.serverHostname;
    var serverUsername = req.body.serverUsername;
    var serverPassword = req.body.serverPassword;


	var tryWinRM = exec("python " + __dirname + "/../scripts/run_winrm_command.py " + serverUsername + " " + serverPassword + " " + serverHostname + "ls false");

	tryWinRM.stdout.on('data', function(data) {
		io.emit('server', { consoleData: "" + data });
	});

	tryWinRM.stderr.on('data', function(data) {
		io.emit('server', { consoleData: 'stderr: ' + data });
		io.emit('server', { done: 'error', error: 'Could not run winrm command, is winrm setup to allow connections?' });
		res.status(500);
		res.send(JSON.stringify({error: "error"}));
	});

	tryWinRM.on('close', function(code) {
		if(code == 0){
			io.emit('server', { consoleData: 'WinRM validation successfull!' });
			res.status(200);
			res.send(JSON.stringify({ok: "Validation sucessfull!"}));
		}
		else {
			io.emit('server', { consoleData: 'stderr: ' + data });
			io.emit('server', { done: 'error', error: 'Could not run winrm command, is winrm setup to allow connections?' });
			res.status(500);
			res.send(JSON.stringify({error: "error"}));
		}
	});
});


router.post('/update', function(req, res) {
  var serverHostname = req.body.serverHostname;
  var serverUsername = req.body.serverUsername;
  var serverPassword = req.body.serverPassword;
  var serverKey = "";
  var serverKeyId = req.body.serverKey;
  var serverRole = req.body.serverRole;

  io.emit('server', { status: 'Bootstrapping', progress: '10%' });

  if(serverKeyId != null && serverKeyId != "" && typeof(serverKeyId) != 'undefined'){
    database.query("SELECT * FROM ssh_keys WHERE id = '" + serverKeyId + "'", function(err, rows, field){
      serverKey = rows[0].content;
      database.query("select * from roles JOIN servers ON servers.id=roles.fk_server WHERE roles.name='puppet'", function(err, rows, field){
        startConfigure(rows[0]['hostname']);
      });
    });
  }else {
    database.query("select * from roles  JOIN servers ON servers.id=roles.fk_server WHERE roles.name='puppet'", function(err, rows, field){
      startConfigure(rows[0]['hostname']);
    });
  }

  function startConfigure(puppetHostname)
  {
    sshSession = new ssh({
      host: serverHostname,
      user: serverUsername,
      key: serverKey,
      timeout: 5000
    });
      console.log("Updating server");
    sshSession.on('error', function(err) {
      sshSession.end();
      io.emit('server', { consoleData: "Error communicating with the server: " + err });
    });

    sshSession.exec("sudo puppet agent --test --waitforcert 1", {
      out: function(stdout){
          console.log("Updating server " + serverHostname + " " + stdout);
        io.emit('server', { consoleData: stdout });
      },
      exit: function(code) {
        io.emit('server', { consoleData: code });
      }
    }).start();
  }
  res.status(200);
  res.send(JSON.stringify({ok: "ok"}));
});

/* Provision a new server */
router.post('/new', function(req, res) {
	var serverHostname = req.body.serverHostname;
	var serverUsername = req.body.serverUsername;
	var serverPassword = req.body.serverPassword;
	var serverKey = "";
	var serverKeyId = req.body.serverKey;
	var serverRole = req.body.serverRole;

	res.setHeader('Content-Type', 'application/json');
	res.status(500);

	var arrHostnames = [];
	if(serverHostname.indexOf(",") > -1) {
		arrHostnames = serverHostname.split(",");
	}
	else {
		arrHostnames[0] = serverHostname;
	}

	for(var i = 0; i < arrHostnames.length; i++)
	{
		serverHostname = arrHostnames[i];
		// If we are on Windows
		if(serverRole == 'active_directory' || serverRole == 'active_directory_replica' || serverRole == 'actiontrail') {

			// Look for PuppetMaster hostname
			database.query("select * from roles  JOIN servers ON servers.id=roles.fk_server WHERE roles.name='puppet'", function(err, rows, field) {
				if(typeof rows[0] != 'undefined')
					puppetMaster = rows[0]['hostname'];
				else {
					io.emit('server', { done: 'error', error: 'Could not find hostname for Puppetmaster, is it installed?' });
					res.status(500);
					res.send(JSON.stringify({error: "error"}));
					return;
				}

				// Download the latest version of puppet and connect it to our PuppetMaster

				var child_puppet_install = exec("python " + __dirname + "/../scripts/run_winrm_command.py " + serverUsername + " " + serverPassword + " " + serverHostname + " 'Dism /online /Enable-Feature /FeatureName:NetFx3 /All;(new-object System.Net.WebClient).Downloadfile(\"https://downloads.puppetlabs.com/windows/puppet-latest.msi\", \"puppet-latest.msi\");msiexec /qn /i puppet-latest.msi PUPPET_MASTER_SERVER="+ puppetMaster + "' 'false'");

				child_puppet_install.stdout.on('data', function(data) {
					io.emit('server', { consoleData: "" + data });
				});

				child_puppet_install.stderr.on('data', function(data) {
					io.emit('server', { consoleData: 'stderr: ' + data });
					io.emit('server', { done: 'error', error: 'Could not run winrm command, is winrm setup to allow connections?' });
					res.status(500);
					res.send(JSON.stringify({error: "error"}));
					return;
				});

				child_puppet_install.on('close', function(code) {
					io.emit('server', { consoleData: "Adding server to local database..." });
					database.query("INSERT INTO servers VALUES(null,'" + serverHostname + "','" + serverUsername + "','" + serverPassword + "','" + serverKeyId + "') ON DUPLICATE KEY UPDATE hostname='"+serverHostname+"', username='"+serverUsername+"', password='"+serverPassword+"', fk_ssh_key='"+serverKeyId+"' ", function(err, rows, field) {
						if(err)
						{
							io.emit('server', { done: 'error', error: 'Could not add the server to the database: ' + err });
							res.status(500);
							res.send(JSON.stringify({error: "error"}));
						}

						serverId = rows["insertId"];
						database.query("INSERT INTO roles VALUES(null,'" + serverRole + "','" + serverId + "')", function(err, rows, field) {
							if(err)
							{
								io.emit('server', { done: 'error', error: 'Could not add the server role to the database: ' + err });
								res.status(500);
								res.send(JSON.stringify({error: "error"}));
							}

							// Finally run puppet on the client
							console.log("running puppet");
							console.log("python " + __dirname + "/../scripts/run_winrm_command.py " + serverUsername + " " + serverPassword + " " + serverHostname + " 'agent --test' '%programfiles(x86)%\\Puppet Labs\\Puppet\\bin\\puppet.bat'");
							var child_run_puppet = exec("python " + __dirname + "/../scripts/run_winrm_command.py " + serverUsername + " " + serverPassword + " " + serverHostname + " 'agent --test' 'c:\\Program Files (x86)\\Puppet Labs\\Puppet\\bin\\puppet.bat'");
							child_run_puppet.stdout.on('data', function(data) {
  								io.emit('server', { consoleData: "" + data });
							});

							child_run_puppet.stderr.on('data', function(data) {
								io.emit('server', { consoleData: 'stderr: ' + data });
							});

							child_run_puppet.on('close', function(code) {
								console.log(code);
								res.status(200);
								res.send(JSON.stringify({ok: "ok"}));
							});
					  });
					});
				});
			});
		}
		else {
		  	serverHostname = arrHostnames[i];
			if(serverKeyId != null && serverKeyId != "" && typeof(serverKeyId) != 'undefined'){
				getKeyFromId(serverKeyId, function(key){
					serverKey = key;
					gotKey();
				});
			}else {
				gotKey();
			}

			function gotKey() {
				getPuppetHostname(function(puppet){
					var sshSession = new ssh({
				  		host: serverHostname,
				  		user: serverUsername,
						password: serverPassword,
				      	key: serverKey,
				  		timeout: 5000
				  	});

					sshSession.on('error', function(err) {
						returnError(res, "Error communicating with the server: " + err);
					});

					setupPuppet(sshSession,puppet, res, function(result) {
						if(result == 0){
							// Puppet is installed and connected lets add the server to local database and assign a role
							io.emit('server', { consoleData: "Adding server to local database" });
							addServerToDatabase(serverHostname, serverUsername, serverPassword, serverKeyId, serverRole, function (result) {
								if(result == 0)
								{
									io.emit('server', { consoleData: "Server added to the database, proceeding with provisioning." });
									// Server is added to the database we can now do a puppet run
									var sshSession = new ssh({
										host: serverHostname,
										user: serverUsername,
										password: serverPassword,
										key: serverKey,
										timeout: 5000
									});
									doPuppetRun(sshSession, function(result){
										if(result == 0 || result == 2)
										{
											returnOk(res, "Server provisioned sucessfully!");
										}
										else {
											returnError(res, "Error while provisioning. Server might not work fully, please try to run provisioning again");
										}
									});

								}
								else {
									returnError(res, "Failed to add server to the database!");
								}
							});
						}
						else {
							returnError(res, "Puppet setup failed");
						}
					});
				});
			}

		}
	}
});

	/* Setup puppet on a server with given ssh session */
	function setupPuppet(ssh, puppet, res, callback) {
		console.log("setting up Puppet");

		ssh.exec("wget --no-check-certificate https://raw.github.com/atomia/puppet-atomia/master/files/bootstrap_linux.sh && chmod +x bootstrap_linux.sh && sudo ./bootstrap_linux.sh " + puppet + "", {
			out: function(stdout){
				io.emit('server', { consoleData: stdout });
			},
			err: function(stderr) {
				io.emit('server', { consoleData: stderr });
			},
			exit: function(code) {
				io.emit('server', { consoleData: "Command exited with status: " + code + "\n" });
				callback(code);
			}
		}).start();
	}

	function addServerToDatabase(serverHostname, serverUsername, serverPassword, serverKeyId, serverRole, callback) {
		database.query("INSERT INTO servers VALUES(null,'" + serverHostname + "','" + serverUsername + "','" + serverPassword + "','" + serverKeyId + "') ON DUPLICATE KEY UPDATE hostname='"+serverHostname+"', username='"+serverUsername+"', password='"+serverPassword+"', fk_ssh_key='"+serverKeyId+"' ", function(err, rows, field) {
			if(err)
				callback(1);

			if(serverRole != "" && typeof serverRole != 'undefined')
			{
				serverId = rows["insertId"];
				database.query("INSERT INTO roles VALUES(null,'" + serverRole + "','" + serverId + "')", function(err, rows, field) {
				if(err)
					callback(1);

				callback(0);
				});
			}
		});
	}

	function doPuppetRun(ssh, callback) {
		ssh.exec("sudo puppet agent --test --waitforcert 1", {
			out: function(stdout){
				io.emit('server', { consoleData: stdout });
			},
			err: function(stderr) {
				io.emit('server', { consoleData: stderr });
			},
			exit: function(code) {
				io.emit('server', { consoleData: "Command exited with status: " + code + "\n" });
				callback(code);
			}
		}).start();

	}



/* Helper functions */
function returnOk(res, message){
	io.emit('server', { consoleData: "\n" + message });
	res.status(200);
    res.send(JSON.stringify({ok: message}));
}

function returnError(res, message){
	io.emit('server', { consoleData:  "\n" + message });
	res.status(500);
    res.send(JSON.stringify({error: message}));
}

function getPuppetHostname(callback){
	database.query("select * from roles JOIN servers ON servers.id=roles.fk_server WHERE roles.name='puppet'", function(err, rows, field){
	  callback(rows[0]['hostname']);
	});
}

function getKeyFromId(serverKeyId, callback) {
		database.query("SELECT * FROM ssh_keys WHERE id = '" + serverKeyId + "'", function(err, rows, field){
			if(typeof rows[0].content != 'undefined')
			{
				callback(rows[0].content);
			}
			else {
				callback(null);
			}
		});
};

function ValidateIPaddress(ipaddress)
{
 if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress))
  {
    return (true)
  }
return (false)
}

module.exports = router;
