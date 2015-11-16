# puppetmaster-gui

## Installation instructions
Installation is currently done manually

		git clone https://github.com/atomia/puppetmaster-gui.git
		sudo apt-get install nodejs nodejs-legacy npm mysql-server
		cd ~/puppetmaster-gui/app
		sudo npm install
		sudo npm install -g nodemon
		
		# Add mysql user
		sudo mysql --defaults-file=/etc/mysql/debian.cnf
		CREATE USER 'puppetgui'@'localhost' IDENTIFIED BY 'changeme';
		GRANT ALL PRIVILEGES ON `hiera`.* TO 'puppetgui'@'localhost';
		FLUSH PRIVILEGES;
		exit

		# Import database schema
		sudo mysql --defaults-file=/etc/mysql/debian.cnf < schema.sql

		# Modify the config
		vim config.json

		# Start debug server
		nodemon
	
		# Application is now available at 127.0.0.1:3000
