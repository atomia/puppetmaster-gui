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

ALTER TABLE `servers`
ADD UNIQUE INDEX `ix_hostname` (`hostname`);

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

INSERT INTO app_config VALUES(null, 'installation_template','installation_steps_complete');

INSERT INTO app_config VALUES(null,'installation_steps_complete','[
	{"name": "Pre requirements","route" : "/wizard"},
	{"name": "Install Puppet Master","route" : "/wizard/puppet"},
	{"name": "Add SSH keys","route" : "/keys"},
	{"name": "Initial configuration","route" : "/wizard/basic"},
	{"name": "Setup internal DNS","route" : "/wizard/internaldns"},
	{"name": "Setup monitoring","route" : "/wizard/nagios_server"},
	{"name": "Install Atomia database","route" : "/wizard/atomia_database"},
	{"name": "Setup Active Directory","route" : "/wizard/active_directory"},
	{"name": "Add an Active Directory replica","route" : "/wizard/active_directory_replica"},
	{"name": "Install Atomia Domainreg","route" : "/wizard/domainreg"},
	{"name": "Install internal mailserver","route" : "/wizard/internal_mailserver"},	
	{"name": "Configure shared storage","route" : "/wizard/glusterfs"},
	{"name": "Configure shared storage replicas","route" : "/wizard/glusterfs_replica"},
	{"name": "Configure Atomia applications","route" : "/wizard/windows"},
    {"name": "Configure OpenStack","route" : "/wizard/openstack"},
	{"name": "Install public Atomia applications", "route" : "/wizard/public_apps"},
	{"name": "Install internal Atomia applications", "route" : "/wizard/internal_apps"},    
	{"name": "Install AtomiaDNS","route" : "/wizard/atomiadns"},
	{"name": "Install Nameservers","route" : "/wizard/atomiadns_powerdns"},
	{"name": "Install Atomia filesystem agent", "route" : "/wizard/fsagent"},
	{"name": "Install Installatron", "route" : "/wizard/installatron"},
	{"name": "Install Awstats", "route" : "/wizard/awstats"},
	{"name": "Install Daggre", "route" : "/wizard/daggre"},
	{"name": "Install Cronjob server", "route" : "/wizard/cronagent"},
	{"name": "Install Apache cluster", "route" : "/wizard/apache"},
	{"name": "Install IIS cluster", "route" : "/wizard/iis"},
	{"name": "Install FTP cluster master", "route" : "/wizard/ftp"},
	{"name": "Install FTP cluster slaves", "route" : "/wizard/ftp_slave"},
	{"name": "Install mail cluster master", "route" : "/wizard/mail"},
	{"name": "Install mail cluster slaves", "route" : "/wizard/mail_slave"},
 	{"name": "Install Load balancers", "route" : "/wizard/haproxy"},   
	{"name": "Install Customer MySQL server", "route" : "/wizard/mysql"},
	{"name": "Install Customer PostgreSQL server", "route" : "/wizard/postgresql"},
	{"name": "Install Customer MSSQL server", "route" : "/wizard/mssql"},
    {"name": "Configure OpenStack","route" : "/wizard/openstack"},
	{"name": "Installation complete!", "route" : "/wizard/done"}
]');

INSERT INTO app_config VALUES(null,'installation_steps_shared','[
	{"name": "Pre requirements","route" : "/wizard"},
	{"name": "Install Puppet Master","route" : "/wizard/puppet"},
	{"name": "Add SSH keys","route" : "/keys"},
	{"name": "Initial configuration","route" : "/wizard/basic"},
	{"name": "Setup internal DNS","route" : "/wizard/internaldns"},
	{"name": "Setup monitoring","route" : "/wizard/nagios_server"},
	{"name": "Install Atomia database","route" : "/wizard/atomia_database"},
	{"name": "Setup Active Directory","route" : "/wizard/active_directory"},
	{"name": "Add an Active Directory replica","route" : "/wizard/active_directory_replica"},
	{"name": "Install Atomia Domainreg","route" : "/wizard/domainreg"},
	{"name": "Install internal mailserver","route" : "/wizard/internal_mailserver"},	
	{"name": "Configure shared storage","route" : "/wizard/glusterfs"},
	{"name": "Configure shared storage replicas","route" : "/wizard/glusterfs_replica"},
	{"name": "Configure Atomia applications","route" : "/wizard/windows"},	
	{"name": "Install public Atomia applications", "route" : "/wizard/public_apps"},
	{"name": "Install internal Atomia applications", "route" : "/wizard/internal_apps"},    
	{"name": "Install AtomiaDNS","route" : "/wizard/atomiadns"},
	{"name": "Install Nameservers","route" : "/wizard/atomiadns_powerdns"},
	{"name": "Install Atomia filesystem agent", "route" : "/wizard/fsagent"},
	{"name": "Install Installatron", "route" : "/wizard/installatron"},
	{"name": "Install Awstats", "route" : "/wizard/awstats"},
	{"name": "Install Daggre", "route" : "/wizard/daggre"},
	{"name": "Install Cronjob server", "route" : "/wizard/cronagent"},
	{"name": "Install Apache cluster", "route" : "/wizard/apache"},
	{"name": "Install IIS cluster", "route" : "/wizard/iis"},
	{"name": "Install FTP cluster master", "route" : "/wizard/ftp"},
	{"name": "Install FTP cluster slaves", "route" : "/wizard/ftp_slave"},
	{"name": "Install mail cluster master", "route" : "/wizard/mail"},
	{"name": "Install mail cluster slaves", "route" : "/wizard/mail_slave"},
 	{"name": "Install Load balancers", "route" : "/wizard/haproxy"},   
	{"name": "Install Customer MySQL server", "route" : "/wizard/mysql"},
	{"name": "Install Customer PostgreSQL server", "route" : "/wizard/postgresql"},
	{"name": "Install Customer MSSQL server", "route" : "/wizard/mssql"},
	{"name": "Installation complete!", "route" : "/wizard/done"}
]');

INSERT INTO app_config VALUES(null,'installation_steps_openstack','[
	{"name": "Pre requirements","route" : "/wizard"},
	{"name": "Install Puppet Master","route" : "/wizard/puppet"},
	{"name": "Add SSH keys","route" : "/keys"},
	{"name": "Initial configuration","route" : "/wizard/basic"},
	{"name": "Setup internal DNS","route" : "/wizard/internaldns"},
	{"name": "Setup monitoring","route" : "/wizard/nagios_server"},
	{"name": "Install Atomia database","route" : "/wizard/atomia_database"},
	{"name": "Setup Active Directory","route" : "/wizard/active_directory"},
	{"name": "Add an Active Directory replica","route" : "/wizard/active_directory_replica"},
	{"name": "Install Atomia Domainreg","route" : "/wizard/domainreg"},
	{"name": "Install internal mailserver","route" : "/wizard/internal_mailserver"},
    {"name": "Configure Atomia applications","route" : "/wizard/windows"},	
    {"name": "Configure OpenStack","route" : "/wizard/openstack"},	
	{"name": "Install public Atomia applications", "route" : "/wizard/public_apps"},
	{"name": "Install internal Atomia applications", "route" : "/wizard/internal_apps"},    
	{"name": "Install AtomiaDNS","route" : "/wizard/atomiadns"},
	{"name": "Install Nameservers","route" : "/wizard/atomiadns_powerdns"},
	{"name": "Installation complete!", "route" : "/wizard/done"}
]');
