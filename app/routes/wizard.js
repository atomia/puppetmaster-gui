var express = require('express');
var router = express.Router();
var exec = require('child_process').exec;
var shelljs = require('shelljs');
var fs = require('fs');
var yaml = require('yamljs');
var puppetDB = require('../lib/puppetdb.js');
var ssh = require('simple-ssh');
/* GET users listing. */
router.get('/', function (req, res, next) {
	res.render('wizard/index');
});
router.get('/next_step', function (req, res, next) {
	skipStep(1, res);
});
router.get('/next_step/:skipSteps', function (req, res, next) {
	var skipSteps = req.params.skipSteps;
	skipStep(skipSteps, res);
});
function skipStep(numberOfSteps, res) {
	var installationTemplate = '';
	database.query('SELECT * FROM app_config WHERE var IN(\'current_step\',\'installation_template\')', function (err, rows, field) {
		for (var i = 0; i < rows.length; i++) {
			if (rows[i].var == 'current_step')
				step = rows[i].val;
			if (rows[i].var == 'installation_template')
				installationTemplate = rows[i].val;
		}
		database.query('SELECT * FROM app_config WHERE var = \'' + installationTemplate + '\'', function (err, rows, field) {
			installationSteps = rows[0].val;
			nextStepId = parseInt(step) + parseInt(numberOfSteps);
			nextStep = JSON.parse(installationSteps)[nextStepId];
			res.redirect(nextStep.route);
			database.query('UPDATE app_config SET val =' + nextStepId + ' WHERE var = \'current_step\'', function (err, rows, field) {
			});
		});
	});
}
router.get('/all_tasks', function (req, res, next) {
	database.query('SELECT * FROM app_config WHERE var IN(\'current_step\',\'installation_template\')', function (err, rows, field) {
		for (var i = 0; i < rows.length; i++) {
			if (rows[i].var == 'current_step')
				step = rows[i].val;
			if (rows[i].var == 'installation_template')
				installationTemplate = rows[i].val;
		}
		database.query('SELECT * FROM app_config WHERE var = \'' + installationTemplate + '\'', function (err, rows, field) {
			installationSteps = rows[0].val;
			console.log(installationSteps);
			currentStep = JSON.parse(installationSteps)[step];
			res.render('wizard/all_tasks', { allSteps: JSON.parse(installationSteps) });
		});
	});
});
router.get('/puppet', function (req, res, next) {
	res.render('wizard/puppet');
});
router.get('/basic', function (req, res, next) {
	getConfiguration('config', function (config) {
		res.render('wizard/basic', {
			config: config,
			moduleName: 'atomia::config'
		});
	});
});
router.get('/internaldns', function (req, res, next) {
	setVariablesAndRender('internaldns', res, null, req);
});
router.get('/atomia_database', function (req, res, next) {
	setVariablesAndRender('atomia_database', res, null, req);
});
router.get('/domainreg', function (req, res, next) {
	setVariablesAndRender('domainreg', res, null, req);
});
router.get('/atomiadns', function (req, res, next) {
	setVariablesAndRender('atomiadns', res, null, req);
});
router.get('/atomiadns_powerdns', function (req, res, next) {
	setVariablesAndRender('atomiadns_powerdns', res, null, req);
});
router.get('/nagios_server', function (req, res, next) {
	setVariablesAndRender('nagios/server', res, 'nagios_server', req);
});
router.get('/active_directory', function (req, res, next) {
	setVariablesAndRender('active_directory', res, null, req);
});
router.get('/active_directory_replica', function (req, res, next) {
	setVariablesAndRender('active_directory_replica', res, 'active_directory_replica', req);
});
router.get('/windows', function (req, res, next) {
	setVariablesAndRender('windows_base', res, null, req);
});
router.get('/internal_apps', function (req, res, next) {
	setVariablesAndRender('internal_apps', res, null, req);
});
router.get('/public_apps', function (req, res, next) {
	setVariablesAndRender('public_apps', res, null, req);
});
router.get('/fsagent', function (req, res, next) {
	setVariablesAndRender('fsagent', res, null, req);
});
router.get('/storage', function (req, res, next) {
	setVariablesAndRender('storage', res, null, req);
});
router.get('/installatron', function (req, res, next) {
	setVariablesAndRender('installatron', res, null, req);
});
router.get('/awstats', function (req, res, next) {
	setVariablesAndRender('awstats', res, null, req);
});
router.get('/daggre', function (req, res, next) {
	setVariablesAndRender('daggre', res, null, req);
});
router.get('/cronagent', function (req, res, next) {
	setVariablesAndRender('cronagent', res, null, req);
});
router.get('/haproxy', function (req, res, next) {
	setVariablesAndRender('haproxy', res, null, req);
});
router.get('/apache', function (req, res, next) {
	setVariablesAndRender('apache_agent', res, null, req);
});
router.get('/apachecl', function (req, res, next) {
	setVariablesAndRender('apache_agent_cl', res, null, req);
});
router.get('/iis', function (req, res, next) {
	setVariablesAndRender('iis', res, null, req);
});
router.get('/ftp', function (req, res, next) {
	setVariablesAndRender('pureftpd', res, null, req);
});
router.get('/ftp_slave', function (req, res, next) {
	setVariablesAndRender('pureftpd', res, 'pureftpd_slave', req);
});
router.get('/mail', function (req, res, next) {
	setVariablesAndRender('mailserver', res, null, req);
});
router.get('/mail_slave', function (req, res, next) {
	setVariablesAndRender('mailserver', res, 'mailserver_slave', req);
});
router.get('/webmail', function (req, res, next) {
	setVariablesAndRender('webmail', res, null, req);
});
router.get('/ssh', function (req, res, next) {
	setVariablesAndRender('sshserver', res, null, req);
});
router.get('/mysql', function (req, res, next) {
	setVariablesAndRender('mysql', res, null, req);
});
router.get('/postgresql', function (req, res, next) {
	setVariablesAndRender('postgresql', res, null, req);
});
router.get('/mssql', function (req, res, next) {
	setVariablesAndRender('mssql', res, null, req);
});
router.get('/openstack', function (req, res, next) {
	setVariablesAndRender('openstack', res, null, req);
});
router.get('/internal_mailserver', function (req, res, next) {
	setVariablesAndRender('internal_mailserver', res, null, req);
});
router.get('/done', function (req, res, next) {
	res.render('wizard/done');
});
router.get('/output/:role', function (req, res, next) {
	var role = req.params.role;
	getLatestPuppetOutput(role, function (output) {
		if (output) {
			res.send(JSON.stringify({ output: output }));
		} else
			res.send(JSON.stringify({ output: '' }));
	});
});
router.post('/puppet', function (req, res, next) {
	var hasError = false;
	req.setTimeout(1000000, function () {
		req.abort();
		io.emit('server', { consoleData: 'Timeout occured' });
	});
	var child = exec('puppet="$(wget -q -O - https://raw.githubusercontent.com/atomia/puppet-atomia/master/setup-puppet-atomia)"; echo "$puppet" |  bash');
	child.stdout.on('data', function (data) {
		io.emit('server', { consoleData: data });
	});
	child.stderr.on('data', function (data) {
		io.emit('server', { consoleData: 'stderr: ' + data });
	});
	child.on('close', function (code) {
		if (!hasError) {
			var hostname = shelljs.exec('facter fqdn | tr -d \'\n\' 2> /dev/null').stdout;
			database.query('INSERT INTO servers VALUES(null,\'' + hostname + '\',\'\',\'\',\'\')', function (err, rows, field) {
				if (typeof rows != 'undefined') {
					serverId = rows.insertId;
					database.query('INSERT INTO roles VALUES(null,\'puppet\',\'' + serverId + '\')', function (err, rows, field) {
						io.emit('server', {
							done: 'ok',
							error: 'Puppetmaster installed sucessfully!'
						});
						res.status(200);
						res.send(JSON.stringify({ ok: 'ok' }));
						database.query('UPDATE app_config SET val = 2 WHERE var = \'current_step\';', function (err, rows, field) {
						});
					});
				} else {
					res.status(200);
					res.send(JSON.stringify({ ok: 'ok' }));
				}
			});
		}
	});
});
router.get('/glusterfs', function (req, res, next) {
	setVariablesAndRender('glusterfs', res, null, req);
});
router.get('/glusterfs_replica', function (req, res, next) {
	setVariablesAndRender('glusterfs', res, 'glusterfs_replica', req);
});
router.post('/template', function (req, res, next) {
	var templateName = req.body.templateName;
	database.query('UPDATE app_config SET val = \'' + templateName + '\'WHERE var = \'installation_template\';', function (err, rows, field) {
		if (!err) {
			res.status(200);
			res.send(JSON.stringify({ ok: 'ok' }));
		} else {
			res.status(500);
			res.send(JSON.stringify({ error: err }));
		}
	});
});
function setVariablesAndRender(currentRole, res, role, req, hostname) {
	getConfiguration(currentRole, function (config) {
		moduleName = 'atomia::' + currentRole.replace('/', '::');
		database.query('SELECT * FROM ssh_keys', function (err, keyRows, field) {
			if (err)
				throw err;
			dbRole = currentRole;
			if (role)
				dbRole = role;
			database.query('SELECT hostname, username, password, fk_ssh_key, ssh_keys.name as \'ssh_key_name\' from servers JOIN roles ON roles.fk_server = servers.id LEFT JOIN ssh_keys ON ssh_keys.id = servers.fk_ssh_key WHERE roles.name = \'' + dbRole + '\'', function (err, serverRows, field) {
				if (err)
					throw err;
				database.query('select * from roles  JOIN servers ON servers.id=roles.fk_server WHERE roles.name=\'puppet\'', function (err, rows, field) {
					puppetHostname = '';
					if (typeof rows[0] != 'undefined')
						puppetHostname = rows[0].hostname;
					serverHostname = '';
					if (role)
						currentRole = role;
					if (typeof serverRows[0] != 'undefined') {
						serverHostname = serverRows[0].hostname;
					} else
						serverHostname = '';
					puppetDB.getLatestReportAndEvents(serverHostname, function (reports, events) {
						var latestReport;
						if (reports) {
							reportStatus = reports.status;
							reportEvents = events;
							latestReport = reports[0];
						} else {
							reportStatus = 'error';
							reportEvents = '';
							latestReport = null;
						}
						getPuppetStatus(currentRole, function (puppetStatus) {
							res.render('wizard/' + currentRole, {
								puppetStatus: puppetStatus,
								latestReport: latestReport,
								reportEvents: reportEvents,
								reportStatus: reportStatus,
								keys: keyRows,
								config: config,
								moduleName: moduleName,
								server: serverRows,
								puppetMaster: puppetHostname,
								path: req.originalUrl
							});
						});
					});
				});
			});
		});
	});
}
/*
Fetches configuraton from the Puppet module using external scripts
*/
function getConfiguration(namespace, callback) {
	command = 'sh ' + __dirname + '/../scripts/get_variables.sh ' + namespace;
	variables = {};
	var child = exec(command);
	child.stdout.on('data', function (data) {
		var sData = data.split('\n');
		var a = 0;
		database.query('SELECT * FROM configuration', function (err, allConfig, field) {
			for (var i = 0; i <= sData.length; i++) {
				if (typeof sData[i] != 'undefined' && sData[i] !== '') {
					var siData = sData[i].split(' ');
					var hieraVar = 'atomia::' + namespace.replace('/', '::', namespace) + '::' + siData[0];
					var inputData = siData;
					database.query('SELECT * FROM configuration WHERE var = \'' + hieraVar.replace(',', '') + '\'', function (inputData) {
						return function (err, rows, field) {
							a++;
							if (err)
								throw err;
							var data = {};
							data.required = 'notrequired';
							if (typeof inputData[1] == 'undefined') {
								inputData[1] = '';
								data.required = 'required';
							}
							command = 'sh ' + __dirname + '/../scripts/get_variable_documentation.sh ' + namespace + ' ' + inputData[0];
							doc = shelljs.exec(command);
							command2 = 'sh ' + __dirname + '/../scripts/get_variable_validation.sh ' + namespace + ' ' + inputData[0];
							validation = shelljs.exec(command2);
							command3 = 'sh ' + __dirname + '/../scripts/get_variable_options.sh ' + namespace + ' ' + inputData[0];
							options = shelljs.exec(command3).stdout.split(',');
							if (options.length > 0) {
								data.options = [];
								for (var b = 0; b <= options.length; b++) {
									data.options[b] = options[b];
									if (options[b] == 'advanced')
										data.advanced = 'true';
									else if (typeof options[b] != 'undefined' && options[b].split('=')[0] == 'default_file') {
										try {
											var content = fs.readFileSync('/etc/puppet/modules/atomia/files/' + namespace + '/' + options[b].split('=')[1]);
											inputData[1] = content;
											data.textArea = 'true';
										} catch (e) {
											console.log('File missing ' + options[b].split('=')[1]);
										}
									}
								}
							} else {
								data.options = '';
							}
							if (rows.length > 0) {
								if (inputData[0] == 'domainreg_tld_config_hash') {
									domainregData = JSON.parse(rows[0].val);
									data.value = domainregData;
								} else {
									data.value = rows[0].val;
								}
								data.doc = doc.stdout;
								data.validation = validation.stdout.trim();
								data.name = inputData[0];
								variables[inputData[0]] = data;
							} else {
								data.value = '';
								for (var c = 1; c < inputData.length; c++) {
									if (c > 1)
										data.value = data.value + ' ';
									data.value = data.value + inputData[c];
								}
								// Replace special strings
								if (data.value.indexOf('[[atomia_domain]]') > -1) {
									atomia_domain = allConfig.filter(function (v) {
										return v['var'] == 'atomia::config::atomia_domain';
									});
									data.value = data.value.replace(/\[\[atomia_domain\]\]/g, atomia_domain[0].val);
								}
								if (data.value.indexOf('expand_default') > -1) {
									data.value = data.value.replace(/expand_default\(\'/g, '');
									data.value = data.value.replace(/\'\)$/g, '');
								}
								data.doc = doc.stdout;
								data.validation = validation.stdout.trim();
								data.name = inputData[0];
								variables[inputData[0]] = data;
							}
							if (a == sData.length - 1)
								callback(variables);
						};
					} (inputData));
				}
			}
		});
	});
	child.stderr.on('data', function (data) {
	});
	child.on('close', function (code) {
	});
}
function getPuppetStatus(role, callback) {
	//puppet agent: applying configuration
	if (role != 'active_directory' && role != 'active_directory_replica' && role != 'internal_apps' && role != 'public_apps') {
		var sshSession = getSSHSession(role, function (sshSession) {
			if (sshSession) {
				var puppetStatus;
				sshSession.exec('ps auxwww | grep \'puppet agent: applying configuration\' | grep -v grep |  wc -l', {
					out: function (stdout) {
						if (stdout > 0) {
							callback(true);
						} else {
							callback(false);
						}
					},
					err: function (stderr) {
						callback(false);
					},
					exit: function (code) {
					}
				}).start();
				sshSession.on('error', function (err) {
				sshSession.end();
				callback(false);
				});
			} else {
				callback(false);
			}

		});
	} else {
		callback(false);
	}
}
function getLatestPuppetOutput(role, callback) {
	if (role != 'active_directory' && role != 'active_directory_replica' && role != 'internal_apps' && role != 'public_apps') {
		var sshSession = getSSHSession(role, function (sshSession) {
			if (sshSession) {
				var puppetOutput;
				sshSession.exec('grep puppet-agent /var/log/syslog | tail -n1 | awk \'{print $5}\' | cut -d \'[\' -f 2 | sed \'s/]://\' | xargs -n1 -I% grep % /var/log/syslog', {
					out: function (stdout) {
						puppetOutput = puppetOutput + stdout;
					},
					err: function (stderr) {
						callback(null);
					},
					exit: function (code) {
						callback(puppetOutput);
					}
				}).start();
			} else
				callback(null);
		});
	} else {
		callback(null);
	}
}
function getSSHSession(role, callback) {
	database.query('SELECT * FROM roles JOIN servers on fk_server = servers.id  LEFT JOIN ssh_keys ON fk_ssh_key = ssh_keys.id WHERE roles.name = \'' + role + '\' ', function (err, rows, field) {
		if (err)
			throw err;
		if (rows.length > 0) {
			var sshSession = new ssh({
				host: rows[0].hostname,
				user: rows[0].username,
				pass: rows[0].password,
				key: rows[0].content,
				timeout: 2000
			});
			callback(sshSession);
		} else
			callback(null);
	});
}
module.exports = router;