var express = require('express');
var router = express.Router();
var ping = require('net-ping');
var dns = require('dns');
var ssh = require('simple-ssh');
var fs = require('fs');
var execSync = require('execSync');
var exec = require('child_process').exec;
var puppetDB = require('../lib/puppetdb.js');
var Convert = require('ansi-to-html');
var convert = new Convert();
router.get('/', function (req, res, next) {
	res.send('respond with a resource');
});
router.get('/status/:hostname', function (req, res, next) {
	var hostname = req.params.hostname;
	puppetDB.getReports(hostname, function (reports) {
		res.render('servers/status', {
			reports: reports,
			hostname: hostname
		});
	});
});
router.get('/status/events/:hash', function (req, res, next) {
	var hash = req.params.hash;
	puppetDB.getEvents(hash, function (events) {
		res.render('servers/events', { events: events });
	});
});
router.get('/new', function (req, res, next) {
	database.query('SELECT * FROM ssh_keys', function (err, rows, field) {
		if (err)
			throw err;
		res.render('servers/new', { keys: rows });
	});
});
router.get('/ip/:hostname', function (req, res, next) {
	var hostname = req.params.hostname;
	dns.resolve4(hostname, function (err, ip) {
		res.send(ip);
	});
});
// Get a specific fact from current server
router.get('/facter/:fact', function (req, res, next) {
	var fact = req.params.fact;
	var result = '';
	var factExec = exec('facter ' + fact);
	factExec.stdout.on('data', function (data) {
		result = data;
	});
	factExec.on('close', function (code) {
		res.send(JSON.stringify({ ok: result }));
	});
});
router.delete('/:hostname', function (req, res, next) {
	var hostname = req.params.hostname;
	database.query('DELETE servers FROM servers JOIN roles ON servers.id = roles.fk_server WHERE servers.hostname = \'' + hostname + '\'', function (err, rows, field) {
		if (err) {
			res.send(JSON.stringify({ error: 'could not delete from database' }));
		}
		res.send(JSON.stringify({ error: 'ok' }));
	});
});
router.post('/update_hostname', function (req, res, next) {
	var serverHostname = req.body.serverHostname;
	var serverUsername = req.body.serverUsername;
	var serverPassword = req.body.serverPassword;
	var serverRole = req.body.serverRole;
	var serverKeyId = req.body.serverKey;
	var arrHostnames = serverHostname.split(",");

	database.query('DELETE servers from servers JOIN roles ON servers.id = roles.fk_server WHERE roles.name=\'' + serverRole + '\'', function (err, rows, field) {
		if (err) {
			console.log(err);
			res.send(JSON.stringify({ error: 'could not delete servers from database' }));
			return;
		}
		database.query('DELETE from roles where roles.name=\'' + serverRole + '\'',function (err, rows, field) {
			if (err) {
				console.log(err);
				res.send(JSON.stringify({ error: 'could not delete roles from database' }));
				return;
			}
			for(var i = 0; i < arrHostnames.length ; i++) {
				database.query('INSERT INTO servers VALUES(null,\'' + arrHostnames[i] + '\',\'' + serverUsername + '\',\'' + serverPassword + '\',\'' + serverKeyId + '\')', function (err, rows, field) {
					if (err) {
						res.send(JSON.stringify({ error: 'could not insert server to database' }));
						console.log(err);
						return;
					}
					database.query('INSERT INTO roles VALUES(null,\'' + serverRole + '\',\'' + rows.insertId + '\')', function (err, rows, field) {
						if (err) {
							res.send(JSON.stringify({ error: 'could not insert roles to database' }));
							console.log(err);
							return;
						}
						update_hostname_callback(arrHostnames.length, res);
					});
				});
			}
		});
	});
});
var hostnameCount = 0;
function update_hostname_callback( max, res){
	if(hostnameCount == max)
		res.send(JSON.stringify({ success: 'server updated' }));
	hostnameCount++;
}
router.post('/generate_certificates', function (req, res) {
	var appDomain = req.body.appDomain;
	var login = req.body.login;
	var order = req.body.order;
	var billing = req.body.billing;
	var hcp = req.body.hcp;
	execSync.exec('rm -f /etc/puppet/atomiacerts/certificates/* 2> /dev/null');
	var spawn = require('child_process').spawn, child = spawn('ruby', [
		'generate_certificates.rb',
		appDomain,
		login,
		order,
		billing,
		hcp
				], { cwd: '/etc/puppet/modules/atomia/files/certificates/' });
	child.stdout.on('data', function (data) {
		io.emit('server', { consoleData: '' + data });
	});
	child.stderr.on('data', function (data) {
		io.emit('server', { consoleData: '' + data });
	});
	child.on('close', function (code) {
		var numCerts = execSync.exec('ls /etc/puppet/atomiacerts/certificates/ | wc -l').stdout;
		if (parseInt(numCerts.trim()) < 1) {
			io.emit('server', {
				error: 'The certificates was not generated!',
				done: 'error'
			});
			res.status(500);
			res.send(JSON.stringify({ error: 'error' }));
		} else {
			// Get the certificate thumbprints
			thumbprints = {};
			thumbprints.automation_encryption = execSync.exec('/etc/puppet/modules/atomia/files/certificates/get_cert_fingerprint.sh | grep -A 1 \'Automation Server Encryption:\' | tail -n 1').stdout;
			thumbprints.billing_encryption = execSync.exec('/etc/puppet/modules/atomia/files/certificates/get_cert_fingerprint.sh | grep -A 1 \'Billing Encryption:\' | tail -n 1').stdout;
			thumbprints.root = execSync.exec('/etc/puppet/modules/atomia/files/certificates/get_cert_fingerprint.sh | grep -A 1 \'Root cert:\' | tail -n 1').stdout;
			thumbprints.signing = execSync.exec('/etc/puppet/modules/atomia/files/certificates/get_cert_fingerprint.sh | grep -A 1 \'Signing:\' | tail -n 1').stdout;
			io.emit('server', {
				ok: 'Certificates generated sucessfully!',
				done: 'ok'
			});
			res.status(200);
			res.send(JSON.stringify({
				ok: 'ok',
				certificates: thumbprints
			}));
		}
	});
});
/* Validates that SSH is working on a server */
router.post('/validate/ssh', function (req, res) {
	var serverHostname = req.body.serverHostname;
	var serverUsername = req.body.serverUsername;
	var serverPassword = req.body.serverPassword;
	var serverKey = '';
	var serverKeyId = req.body.serverKey;
	var serverRole = req.body.serverRole;
	var arrHostnames = [];
	var checked = 0;
	if (serverHostname.indexOf(',') > -1) {
		arrHostnames = serverHostname.split(',');
	} else {
		arrHostnames[0] = serverHostname;
	}
	for (var i = 0; i < arrHostnames.length; i++) {
		if (serverKeyId !== null && serverKeyId !== '' && typeof serverKeyId != 'undefined') {
			(function (hostname) {
				getKeyFromId(serverKeyId, function (key) {
					serverKey = key;
					tryLogin(hostname, finishedLoginCheck());
				});
			} (arrHostnames[i]));
		} else {
			tryLogin(arrHostnames[i], finishedLoginCheck());
		}
	}
	function tryLogin(serverHost, callback) {
		io.emit('server', { consoleData: '\nVerifying SSH connectivity to ' + serverHost + '...' });
		sshSession = new ssh({
			host: serverHost,
			user: serverUsername,
			pass: serverPassword,
			key: serverKey,
			timeout: 5000
		});
		sshSession.on('error', function (err) {
			sshSession.end();
			returnError(res, '\nServer validation failed: Could not connect to the server ' + serverHost + ' via SSH!');
		});
		sshSession.exec('echo \'\nThis is a test command from Atomia!\n\'', {
			out: function (stdout) {
				io.emit('server', { consoleData: stdout });
			},
			exit: function (code) {
				io.emit('server', { consoleData: '\nCommand completed with status code: ' + code });
				if (code === 0)
					finishedLoginCheck();
				else
					returnError(res, 'Server validation failed: Could not execute remot SSH command');
			}
		}).start();
	}
	function finishedLoginCheck() {
		if (checked == arrHostnames.length)
			returnOk(res, 'SSH login verified sucessfully');
		checked++;
	}
});
/* Validates that WinRM is working on a server */
router.post('/validate/windows', function (req, res) {
	var serverHostname = req.body.serverHostname;
	var serverUsername = req.body.serverUsername;
	var serverPassword = req.body.serverPassword;
	var error = false;
	var tryWinRM = exec(__dirname + '/../scripts/winrm -hostname ' + serverHostname + ' -username "' + serverUsername + '" -password "' + serverPassword + '" "dir"');
	tryWinRM.stdout.on('data', function (data) {
		io.emit('server', { consoleData: '' + data });
	});
	tryWinRM.stderr.on('data', function (data) {
		io.emit('server', { consoleData: 'stderr: ' + data });
		io.emit('server', {
			done: 'error',
			error: 'Could not run winrm command, is winrm setup to allow connections?'
		});
		if (!error) {
			res.status(500);
			res.send(JSON.stringify({ error: 'error' }));
		}
		error = true;
	});
	tryWinRM.on('close', function (code) {
		if (code === 0) {
			io.emit('server', { consoleData: 'WinRM validation successfull!' });
			res.status(200);
			res.send(JSON.stringify({ ok: 'Validation sucessfull!' }));
		} else {
			if (!error) {
				io.emit('server', {
					done: 'error',
					error: 'Could not run winrm command, is winrm setup to allow connections?'
				});
				res.status(500);
				res.send(JSON.stringify({ error: 'error' }));
			}
		}
	});
});
router.post('/update', function (req, res) {
	var serverHostname = req.body.serverHostname;
	var serverUsername = req.body.serverUsername;
	var serverPassword = req.body.serverPassword;
	var serverKey = '';
	var serverKeyId = req.body.serverKey;
	var serverRole = req.body.serverRole;
	io.emit('server', {
		status: 'Bootstrapping',
		progress: '10%'
	});
	if (serverKeyId !== null && serverKeyId !== '' && typeof serverKeyId != 'undefined') {
		database.query('SELECT * FROM ssh_keys WHERE id = \'' + serverKeyId + '\'', function (err, rows, field) {
			serverKey = rows[0].content;
			database.query('select * from roles JOIN servers ON servers.id=roles.fk_server WHERE roles.name=\'puppet\'', function (err, rows, field) {
				startConfigure(rows[0].hostname);
			});
		});
	} else {
		database.query('select * from roles  JOIN servers ON servers.id=roles.fk_server WHERE roles.name=\'puppet\'', function (err, rows, field) {
			startConfigure(rows[0].hostname);
		});
	}
	function startConfigure(puppetHostname) {
		sshSession = new ssh({
			host: serverHostname,
			user: serverUsername,
			pass: serverPassword,
			key: serverKey,
			timeout: 5000
		});
		sshSession.on('error', function (err) {
			sshSession.end();
			io.emit('server', { consoleData: 'Error communicating with the server: ' + err });
		});
		sshSession.exec('sudo puppet agent --test --waitforcert 1', {
			out: function (stdout) {
				io.emit('server', { consoleData: stdout });
			},
			exit: function (code) {
				io.emit('server', { consoleData: code });
			}
		}).start();
	}
	res.status(200);
	res.send(JSON.stringify({ ok: 'ok' }));
});
/* Provision a new server */
router.post('/new', function (req, res) {
	var serverHostname = req.body.serverHostname;
	var serverUsername = req.body.serverUsername;
	var serverPassword = req.body.serverPassword;
	var serverKey = '';
	var serverKeyId = req.body.serverKey;
	var serverRole = req.body.serverRole;
	var error = false;
	res.setHeader('Content-Type', 'application/json');
	res.status(500);
	var arrHostnames = [];
	if (serverHostname.indexOf(',') > -1) {
		arrHostnames = serverHostname.split(',');
	} else {
		arrHostnames[0] = serverHostname;
	}
	for (var i = 0; i < arrHostnames.length; i++) {
		serverHostname = arrHostnames[i];
		// If we are on Windows
		if (serverRole == 'active_directory' || serverRole == 'active_directory_replica' || serverRole == 'internal_apps' || serverRole == 'public_apps' || serverRole == 'iis' || serverRole == 'mssql') {
			// Look for PuppetMaster hostname
			database.query('select * from roles  JOIN servers ON servers.id=roles.fk_server WHERE roles.name=\'puppet\'', function (err, rows, field) {
				if (typeof rows[0] != 'undefined')
					puppetMaster = rows[0].hostname.replace(/(\r\n|\n|\r)/gm, '');
				else {
					if (!error) {
						io.emit('server', {
							done: 'error',
							error: 'Could not find hostname for Puppetmaster, is it installed?'
						});
						res.status(500);
						res.send(JSON.stringify({ error: 'error' }));
						error = true;
					}
				}
				//c:\\windows\\system32\\Dism /online /Enable-Feature /FeatureName:NetFx3 /All;
				var child_puppet_install = exec(__dirname + '/../scripts/winrm -hostname ' + serverHostname + ' -username "' + serverUsername + '" -password "' + serverPassword + '" "%SystemRoot%\\system32\\WindowsPowerShell\\v1.0\\powershell.exe /C (new-object System.Net.WebClient).Downloadfile(\'https://downloads.puppetlabs.com/windows/puppet-x64-latest.msi\', \'puppet-latest.msi\');c:\\windows\\system32\\msiexec /qn /i puppet-latest.msi PUPPET_MASTER_SERVER=\'' + puppetMaster + '\'" ');
				child_puppet_install.stdout.on('data', function (data) {
					io.emit('server', { consoleData: '' + data });
				});
				child_puppet_install.stderr.on('data', function (data) {
					io.emit('server', { consoleData: 'stderr: ' + data });
					io.emit('server', {
						done: 'error',
						error: 'Could not run winrm command, is winrm setup to allow connections?'
					});
					if (!error) {
						res.status(500);
						res.send(JSON.stringify({ error: 'error' }));
						error = true;
					}
				});
				child_puppet_install.on('close', function (code) {
					if (code !== 0) {
						io.emit('server', { consoleData: 'Command exited with code: ' + code });
						if (!error) {
							res.status(500);
							res.send(JSON.stringify({ error: 'error' }));
							error = true;
						}
					} else {
						io.emit('server', { consoleData: 'Puppet installed. \nAdding server to local database...' });
						database.query('INSERT INTO servers VALUES(null,\'' + serverHostname + '\',\'' + serverUsername + '\',\'' + serverPassword + '\',\'' + serverKeyId + '\') ON DUPLICATE KEY UPDATE hostname=\'' + serverHostname + '\', username=\'' + serverUsername + '\', password=\'' + serverPassword + '\', fk_ssh_key=\'' + serverKeyId + '\' ', function (err, rows, field) {
							if (err) {
								io.emit('server', {
									done: 'error',
									error: 'Could not add the server to the database: ' + err
								});
								if (!error) {
									res.status(500);
									res.send(JSON.stringify({ error: 'error' }));
									error = true;
								}
							}
							serverId = rows.insertId;
							database.query('INSERT INTO roles VALUES(null,\'' + serverRole + '\',\'' + serverId + '\')', function (err, rows, field) {
								if (err) {
									io.emit('server', {
										done: 'error',
										error: 'Could not add the server role to the database: ' + err
									});
									if (!error) {
										res.status(500);
										res.send(JSON.stringify({ error: 'error' }));
										error = true;
									}
								}
								// Finally run puppet on the client
								var domain = serverHostname.split('.').pop().replace(/ /g, '').toLowerCase();
								var hostname = serverHostname.replace(/\.[^\.]+$/, '').replace(/ /g, '').toLowerCase();
								//"SET FACTER_hostname=\""+ hostname +"\"& SET FACTER_domain=\"" +domain +"\"&
								var child_run_puppet = exec(__dirname + '/../scripts/winrm -hostname ' + serverHostname + ' -username "' + serverUsername + '" -password "' + serverPassword + '" "SET FACTER_atomia_role_1="' + serverRole + '"& puppet agent --test"');
								child_run_puppet.stdout.on('data', function (data) {
									io.emit('server', { consoleData: '' + data });
								});
								child_run_puppet.stderr.on('data', function (data) {
									io.emit('server', { consoleData: 'stderr: ' + data });
								});
								child_run_puppet.on('close', function (code) {
									if (code !== 0 && code != 2) {
										io.emit('server', { consoleData: 'Command exited with code: ' + code });
										if (!error) {
											error = true;
											finishedProvisioning();
										}
									} else {
										finishedProvisioning();
									}
								});
							});
						});
					}
				});
			});
		} else {
			serverHostname = arrHostnames[i];
			(function (serverHost) {
				if (serverKeyId !== null && serverKeyId !== '' && typeof serverKeyId != 'undefined') {
					getKeyFromId(serverKeyId, function (key) {
						serverKey = key;
						gotKey(serverHost, serverUsername, serverPassword, serverKey, serverRole);
					});
				} else {
					gotKey(serverHost, serverUsername, serverPassword, serverKey, serverRole);
				}
			} (serverHostname));
		}
	}
	function gotKey(serverH, serverUsername, serverPassword, serverKey, serverRole) {
		getPuppetHostname(function (puppet) {
			var sshSession = new ssh({
				host: serverH,
				user: serverUsername,
				pass: serverPassword,
				key: serverKey,
				timeout: 5000
			});
			sshSession.on('error', function (err) {
				returnError(res, 'Error communicating with the server: ' + err);
			});
			setupPuppet(sshSession, puppet, res, function (result) {
				if (result === 0) {
					// Puppet is installed and connected lets add the server to local database and assign a role
					io.emit('server', { consoleData: 'Adding server to local database' });
					addServerToDatabase(serverH, serverUsername, serverPassword, serverKeyId, serverRole, function (result) {
						if (result === 0) {
							io.emit('server', { consoleData: 'Server added to the database, proceeding with provisioning.' });
							// Server is added to the database we can now do a puppet run
							var sshSession = new ssh({
								host: serverH,
								user: serverUsername,
								pass: serverPassword,
								key: serverKey,
								timeout: 5000
							});
							doPuppetRun(sshSession, function (result) {
								var sshSession = new ssh({
									host: serverH,
									user: serverUsername,
									pass: serverPassword,
									key: serverKey,
									timeout: 5000
								});
								// Ensure that puppet is running on the server
								ensurePuppetRunning(sshSession, function (result) {
									finishedProvisioning();
								});
							});
						} else {
							error = true;
							finishedProvisioning();
						}
					});
				} else {
					error = true;
					finishedProvisioning();
				}
			});
		});
	}
	var checked = 0;
	function finishedProvisioning() {
		checked++;
		if (checked == arrHostnames.length && error)
			runDependencies('error');
		else if (checked >= arrHostnames.length) {
			runDependencies('ok');
		}
		function runDependencies(status) {
			// Trigger puppet runs on dependant roles
			// Reload Nagios always
			if (serverRole == 'glusterfs_replica') {
				doPuppetRunOnRole('internaldns', function () {
					doPuppetRunOnRole('glusterfs', function () {
						if (status == 'error')
							returnError(res, 'Error while provisioning. Server might not work fully, please try to run provisioning again');
						else
							returnOk(res, 'Provisioning finished', serverRole);
					});
				});
			} else if (status == 'error')
				returnError(res, 'Error while provisioning. Server might not work fully, please try to run provisioning again');
			else
				returnOk(res, 'Provisioning finished', serverRole);
		}
	}
});
/* Setup puppet on a server with given ssh session */
function setupPuppet(ssh, puppet, res, callback) {
	ssh.exec('wget --no-check-certificate https://raw.github.com/atomia/puppet-atomia/master/files/bootstrap_linux.sh && chmod +x bootstrap_linux.sh && sudo ./bootstrap_linux.sh ' + puppet + '', {
		out: function (stdout) {
			io.emit('server', { consoleData: stdout });
		},
		err: function (stderr) {
			io.emit('server', { consoleData: stderr });
		},
		exit: function (code) {
			io.emit('server', { consoleData: 'Command exited with status: ' + code + '\n' });
			callback(code);
		}
	}).start();
}
function ensurePuppetRunning(ssh, callback) {
	ssh.exec('if [[ $(sudo service puppet status | /bin/grep not | /bin/grep -vc grep)  > 0 ]] ; then sudo service puppet start; else echo Puppet is running; fi', {
		out: function (stdout) {
			io.emit('server', { consoleData: stdout });
		},
		err: function (stderr) {
			io.emit('server', { consoleData: stderr });
		},
		exit: function (code) {
			io.emit('server', { consoleData: 'Command exited with status: ' + code + '\n' });
			callback(code);
		}
	}).start();
}
function addServerToDatabase(serverHostname, serverUsername, serverPassword, serverKeyId, serverRole, callback) {
	database.query('INSERT INTO servers VALUES(null,\'' + serverHostname + '\',\'' + serverUsername + '\',\'' + serverPassword + '\',\'' + serverKeyId + '\') ON DUPLICATE KEY UPDATE hostname=\'' + serverHostname + '\', username=\'' + serverUsername + '\', password=\'' + serverPassword + '\', fk_ssh_key=\'' + serverKeyId + '\' ', function (err, rows, field) {
		if (err)
			callback(1);
		if (serverRole !== '' && typeof serverRole != 'undefined') {
			serverId = rows.insertId;
			database.query('SELECT * FROM roles JOIN servers on roles.fk_server = servers.id WHERE servers.hostname=\'' + serverHostname + '\'', function (err, rows, field) {
				if(err){
					console.log(err);
					callback(1);
				}
				if(rows.length == 0) {
					database.query('INSERT INTO roles VALUES(null,\'' + serverRole + '\',\'' + serverId + '\')', function (err, rows, field) {
						if (err)
							callback(1);
						callback(0);
					});
				}
			});
		}
	});
}
function doPuppetRun(ssh, callback) {
	ssh.exec('sudo puppet agent --test --waitforcert 1', {
		out: function (stdout) {
			io.emit('server', { consoleData: convert.toHtml(stdout) });
		},
		err: function (stderr) {
			io.emit('server', { consoleData: convert.toHtml(stderr) });
		},
		exit: function (code) {
			io.emit('server', { consoleData: 'Command exited with status: ' + code + '\n' });
			callback(code);
		}
	}).start();
}
function doPuppetRunOnRole(role, callback) {
	database.query('SELECT * FROM servers JOIN roles on servers.id = fk_server WHERE roles.name = \'' + role + '\'', function (err, rows, field) {
		if (rows.length > 0) {
			io.emit('server', { consoleData: 'Triggered puppet run on ' + role });
			var serverKeyId = rows[0].fk_ssh_key;
			var serverHostname = rows[0].hostname;
			var serverUsername = rows[0].username;
			var serverPassword = rows[0].password;
			var serverKey = '';
			if (serverKeyId !== null && serverKeyId !== '' && typeof serverKeyId != 'undefined') {
				getKeyFromId(serverKeyId, function (key) {
					serverKey = key;
					gotKeyPuppetRole(serverHostname, serverUsername, serverPassword, serverKey, role);
				});
			} else {
				gotKeyPuppetRole(serverHostname, serverUsername, serverPassword, serverKey, role);
			}
		}
		callback();
	});
}
function gotKeyPuppetRole(serverHostname, serverUsername, serverPassword, serverKey, role) {
	var sshSession = new ssh({
		host: serverHostname,
		user: serverUsername,
		pass: serverPassword,
		key: serverKey,
		timeout: 5000
	});
	doPuppetRun(sshSession, function (result) {
		if (result === 0 || result == 2) {
			io.emit('server', { consoleData: 'Puppet run on ' + role + ' finished sucessfully!' });
			callback();
		} else {
			io.emit('server', { consoleData: 'Puppet run on ' + role + ' failed!' });
			callback();
		}
	});
}
/* Helper functions */
function returnOk(res, message, serverRole) {
	io.emit('server', { consoleData: '\n' + message });
	if (serverRole) {
		if (serverRole != 'nagios_server') {
			io.emit('server', { consoleData: 'Reloading nagios, you don\'t need to wait for this to be done :)' });
			doPuppetRunOnRole('nagios_server', function () {
				io.emit('server', { consoleData: 'Nagios reloaded' });
			});
		}
	}
	if (!res.headersSent) {
		res.status(200);
		res.send(JSON.stringify({ ok: message }));
	}
}
function returnError(res, message) {
	io.emit('server', { consoleData: '\n' + message });
	if (!res.headersSent) {
		res.status(500);
		res.send(JSON.stringify({ error: message }));
	}
}
function getPuppetHostname(callback) {
	database.query('select * from roles JOIN servers ON servers.id=roles.fk_server WHERE roles.name=\'puppet\'', function (err, rows, field) {
		callback(rows[0].hostname);
	});
}
function getKeyFromId(serverKeyId, callback) {
	database.query('SELECT * FROM ssh_keys WHERE id = \'' + serverKeyId + '\'', function (err, rows, field) {
		if (typeof rows[0] != 'undefined') {
			callback(rows[0].content);
		} else {
			callback(null);
		}
	});
}
function ValidateIPaddress(ipaddress) {
	if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {
		return true;
	}
	return false;
}
module.exports = router;