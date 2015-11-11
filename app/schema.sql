DROP database IF EXISTS hiera;
CREATE database hiera;
USE hiera;
CREATE TABLE servers (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hostname` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `fk_ssh_key` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;

CREATE TABLE `ssh_keys` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `content` varchar(2048) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;

CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `fk_server` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;


CREATE TABLE `configuration` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `var` varchar(255) DEFAULT NULL,
  `val` text DEFAULT NULL,
  `env` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY (`var`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;

CREATE TABLE `app_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `var` varchar(255) DEFAULT NULL,
  `val` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY (`var`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;

INSERT INTO app_config VALUES(null, 'current_step',0);

INSERT INTO app_config VALUES(null,'installation_steps_default','[
  {"name": "Pre requirements","route" : "/wizard"},
  {"name": "Add SSH keys","route" : "/keys"},
  {"name": "Install Puppet Master","route" : "/wizard/puppet"},
  {"name": "Setup internal DNS","route" : "/wizard/internaldns"},
  {"name": "Setup monitoring","route" : "/wizard/nagios_server"},
  {"name": "Setup Active Directory","route" : "/wizard/active_directory"},
  {"name": "Add an Active Directoyr replica","route" : "/wizard/active_directory_replica"},
  {"name": "Install Atomia Domainreg","route" : "/wizard/domainreg"},
  {"name": "Configure shared storage","route" : "/wizard/glusterfs"},
  {"name": "Install AtomiaDNS","route" : "/wizard/atomiadns"},
  {"name": "Install Nameservers","route" : "/wizard/atomiadns"},
  {"name": "Configure Atomia applications","route" : "/wizard/windows"},
  {"name": "Install Atomia ActionTrail", "route" : "/wizard/actiontrail"}
]');

# SELECT var, val FROM servers JOIN configuration ON fk_server = servers.id WHERE servers.hostname='%{fqdn}'
#pg_user=`grep -i PostgreSQL /etc/passwd | cut -d : -f 1`
#if [ -z "$pg_user" ]; then
#        echo "unable to find postgresql user, defaulting to postgres"
#        pg_user="postgres"
#fi

#sudo="sudo -u $pg_user"
#psql="$sudo psql"

#$psql -c "CREATE DATABASE hieradata WITH OWNER puppetdb ENCODING 'UTF8'"
