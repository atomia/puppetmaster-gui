module.exports = {

  handler: function(req, res, next) {
    rolesPretty = {}
    rolesPretty["active_directory"] = {"prettyName" : "Active Directory"};
    rolesPretty["active_directory_replica"] = {"prettyName" : "Active Directory Replica"};
    rolesPretty["puppet"] = {"prettyName" : "Puppet Master"};
    rolesPretty["internaldns"] = {"prettyName" : "Internal DNS server"};
    rolesPretty["domainreg"] = {"prettyName" : "Domainreg"};
    rolesPretty["glusterfs"] = {"prettyName" : "GlusterFS"};
		rolesPretty["glusterfs_replica"] = {"prettyName" : "GlusterFS replica"};
    rolesPretty["nagios_server"] = {"prettyName" : "Nagios"};
		rolesPretty["atomiadns"] = {"prettyName" : "Atomia DNS"};
		
    allRoles = [];
	allRolesSimple = [];
    database.query("SELECT * FROM roles JOIN servers ON roles.fk_server = servers.id GROUP by roles.name ORDER BY servers.id", function(err, rows, field){
      if(err)
        throw err;
        a = 0;
        for (var i = 0; i < rows.length; i++) {
            if(typeof rolesPretty[rows[i].name] != 'undefined')
            {
              rolesPretty[rows[i].name]['url'] = rows[i].name;
              rolesPretty[rows[i].name]['hostname'] = rows[i].hostname;
              allRoles[a] = rolesPretty[rows[i].name];
			  allRolesSimple[rows[i].name] = "installed";
              a++;
            }
        }
        database.query("SELECT * FROM app_config WHERE var IN('current_step','installation_steps_default')", function(err, rows, field){
          for(var i = 0; i <rows.length; i++)
          {
            if(rows[i].var == 'current_step')
              step = rows[i].val;
            if(rows[i].var == 'installation_steps_default')
              installationSteps = rows[i].val;

          }
		  currentStep = 0;
		  if( installationSteps != '')
          	currentStep = JSON.parse(installationSteps)[step];

			console.log(currentStep);
          res.locals = {
            menuStatus: allRoles,
            installationSteps: installationSteps,
            currentStep : currentStep
          };

          next();
        });

      });


  }
};
