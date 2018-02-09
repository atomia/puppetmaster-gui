module.exports = {
	handler: function (req, res, next) {
		rolesPretty = {};
		rolesPretty.active_directory = { 'prettyName': 'Active Directory' };
		rolesPretty.active_directory_replica = { 'prettyName': 'Active Directory Replica' };
		rolesPretty.puppet = { 'prettyName': 'Puppet Master' };
		rolesPretty.internaldns = { 'prettyName': 'Internal DNS server' };
		rolesPretty.domainreg = { 'prettyName': 'Domainreg' };
		rolesPretty.storage = { 'prettyName': 'Storage server' };
		rolesPretty.glusterfs = { 'prettyName': 'GlusterFS' };
		rolesPretty.glusterfs_replica = { 'prettyName': 'GlusterFS replica' };
		rolesPretty.nagios_server = { 'prettyName': 'Nagios' };
		rolesPretty.atomiadns = { 'prettyName': 'Atomia DNS' };
		rolesPretty.atomiadns_powerdns = { 'prettyName': 'Nameserver' };
		rolesPretty.fsagent = { 'prettyName': 'Filesystem agent' };
		rolesPretty.installatron = { 'prettyName': 'Installatron Server' };
		rolesPretty.awstats = { 'prettyName': 'Awstats statistics' };
		rolesPretty.daggre = { 'prettyName': 'Daggre' };
		rolesPretty.cronagent = { 'prettyName': 'Cronjobs' };
		rolesPretty.haproxy = { 'prettyName': 'Haproxy load balancers' };
		rolesPretty.apache_agent = { 'prettyName': 'Apache cluster' };
		rolesPretty.apache_agent_cl = { 'prettyName': 'Apache CloudLinux cluster' };
		rolesPretty.iis = { 'prettyName': 'IIS cluster' };
		rolesPretty.mailserver = { 'prettyName': 'Mail cluster master' };
		rolesPretty.mailserver_slave = { 'prettyName': 'Mail cluster slave' };
		rolesPretty.sshserver = { 'prettyName': 'SSH server cluster' };
		rolesPretty.webmail = { 'prettyName': 'Roundcube webmail' };
		rolesPretty.mssql = { 'prettyName': 'Customer MSSQL' };
		rolesPretty.mysql = { 'prettyName': 'Customer MySQL' };
		rolesPretty.postgresql = { 'prettyName': 'Customer PostgreSQL' };
		rolesPretty.internal_mailserver = { 'prettyName': 'Internal mail server' };
		rolesPretty.internal_apps = { 'prettyName': 'Internal Atomia applications' };
		rolesPretty.public_apps = { 'prettyName': 'Public Atomia applications' };
		rolesPretty.atomia_database = { 'prettyName': 'Atomia database' };
		rolesPretty.pureftpd = { 'prettyName': 'FTP cluster master' };
		rolesPretty.pureftpd_slave = { 'prettyName': 'FTP cluster slaves' };
		allRoles = [];
		allRolesSimple = [];
		database.query('SELECT * FROM roles JOIN servers ON roles.fk_server = servers.id  GROUP BY name ORDER BY servers.id', function (err, rows, field) {
			if (err)
				throw err;
			a = 0;
			for (var i = 0; i < rows.length; i++) {
				if (typeof rolesPretty[rows[i].name] != 'undefined') {
					rolesPretty[rows[i].name].url = rows[i].name;
					rolesPretty[rows[i].name].hostname = rows[i].hostname;
					allRoles[a] = rolesPretty[rows[i].name];
					allRolesSimple[rows[i].name] = 'installed';
					a++;
				}
			}
			database.query('SELECT * FROM roles JOIN servers on fk_server = servers.id WHERE name = \'nagios_server\' ORDER by roles.id DESC LIMIT 1', function (err, rows, field) {
				if (err)
					throw err;
			});
			database.query('SELECT * FROM app_config WHERE var IN(\'current_step\',\'installation_template\')', function (err, rows, field) {
				for (var i = 0; i < rows.length; i++) {
					if (rows[i].var == 'current_step')
						step = rows[i].val;
					if (rows[i].var == 'installation_template')
						installationTemplate = rows[i].val;
				}
				database.query('SELECT * FROM app_config WHERE var = \'' + installationTemplate + '\'', function (err, rows, field) {
					installationSteps = rows[0].val;
					currentStep = 0;
					if (installationSteps !== '')
						currentStep = JSON.parse(installationSteps)[step];
					database.query('SELECT * FROM roles JOIN servers on fk_server = servers.id WHERE name = \'nagios_server\' ORDER by roles.id DESC LIMIT 1', function (err, rows, field) {
						if (err)
							throw err;
						nagios = null;
						if (rows.length > 0)
							nagios = rows[0].hostname + '/nagios';
						res.locals = {
							menuStatus: allRoles,
							installationSteps: installationSteps,
							currentStep: currentStep,
							nagiosUrl: nagios,
							installationTemplate: installationTemplate
						};
						next();
					});
				});
			});
		});
	}
};