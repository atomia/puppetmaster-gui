DROP database IF EXISTS puppet_atomia;
CREATE database puppet_atomia;
USE puppet_atomia;

CREATE TABLE `platform_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_template` varchar(45) DEFAULT NULL,
  `json_data` longtext,
  `name` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` varchar(64) DEFAULT NULL,
  `run_id` int(11) DEFAULT NULL,
  `input` longtext,
  `status` varchar(45) DEFAULT NULL,
  `fk_platform_data` int(11) DEFAULT NULL,
  `type` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `configuration` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `var` varchar(255) DEFAULT NULL,
  `val` text DEFAULT NULL,
  `env` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_index` (`var`,`env`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
