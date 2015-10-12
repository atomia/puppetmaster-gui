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
  `val` varchar(255) DEFAULT NULL,
  `env` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY (`var`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;

# SELECT var, val FROM servers JOIN configuration ON fk_server = servers.id WHERE servers.hostname='%{fqdn}'
#pg_user=`grep -i PostgreSQL /etc/passwd | cut -d : -f 1`
#if [ -z "$pg_user" ]; then
#        echo "unable to find postgresql user, defaulting to postgres"
#        pg_user="postgres"
#fi

#sudo="sudo -u $pg_user"
#psql="$sudo psql"

#$psql -c "CREATE DATABASE hieradata WITH OWNER puppetdb ENCODING 'UTF8'"
