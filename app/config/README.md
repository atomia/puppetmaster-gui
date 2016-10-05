# Configuration #
All default configuration to base installations on is found in the directories within the config folder.

* environments: contains environment templates maintained by Atomia
* custom_environments: contains environments that is custom for this specific installation. Place your own custom templates here.

## Environment templates ##
Within the configuration folder there is a number of different json files which contains the blueprint for Atomia environments optimized for specific purposes. In most cases you would not need to modify these templates at all but would pick the one that suits your needs and modify/override it through the GUI. If you do however need to make any modifications a new template should be created in the "custom_environments" folder. A complete documentation on the different fields available can be found below. 

	{
		# The name used for the environment
		"name" : "Live Environment",
		# The priority that will decide in what order this environment is displayed in the GUI, lower = shown first
		"priority": "0",
		"description": "Optimized for live usage",
		# A short description of this environment 
		"servers": [
		# The servers array contains a list of all the servers that can be installed with this template. For clarity the servers are grouped into different categories.
			{
				"category": "System",
				# The name of this category (shown in the GUI)
				"category_id": "system",
				# Unique identifier for this category
				"selected": true,
				# Defines if this category should be preselected in the gui or not
				"members": [
				# The members array contains a definition for every server that is available within the current category
					{
						"name": "Active directory",
						# The name of the server (shown in the GUI)
						"description": "",
						# The description of the server (shown in the GUI)
						"required": true,
						# Should the user be able to decide if he want to install this server or not?
						"selected": true,
						# Is this server going to be pre selected or not?
						"cluster": false,
						# Is it possible to install this server as a cluster (for example apache, iis clusters)
						"multiple": false,
						# Is it possible to install several instances of this server (for example dns server). Should not be used together with cluster.
						"node_count": 1,
						# The default number of servers to install
						"operating_system": "windows",
						# The operating system of the server. Valid values are: windows, linux and openstack
						"requirements": [
						# An array of recommended requirements
								{
									"check": "ram",
									# Defines what check to use to verify that the requirements have been met
									"value": "4",
									# The expected output from the check
									"name": "%v GB RAM"
									# Formatted string to be shown in the requirements list in the GUI
								},
								{
									"check": "cpu",
									"value": "1",
									"name": "%v CPUs"
								},
								{
									"check": "disk",
									"value": "50",
									"name": "%v GB disk space"
								}
						],
						"roles": [
						# All the roles to install on the server
							"active_directory"
						]
					}
					...
				]
			}
		]	
	}