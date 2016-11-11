sudo apt-get update
sudo apt-get install -y git nodejs nodejs-legacy npm mysql-server python-pip
sudo pip install pywinrm
cd /opt
sudo git clone https://github.com/atomia/puppetmaster-gui.git
cd puppetmaster-gui/app
sudo npm install

MYSQL_PASSWORD=`openssl rand -base64 16`

sudo mysql --defaults-file=/etc/mysql/debian.cnf -e "GRANT USAGE ON *.* TO 'puppetgui'@'localhost'; DROP USER 'puppetgui'@'localhost';"
sudo mysql --defaults-file=/etc/mysql/debian.cnf -e "CREATE USER 'puppetgui'@'localhost' IDENTIFIED BY '$MYSQL_PASSWORD';GRANT ALL PRIVILEGES ON hiera.* TO 'puppetgui'@'localhost';FLUSH PRIVILEGES;"

cd /opt/puppetmaster-gui/app
sudo mysql --defaults-file=/etc/mysql/debian.cnf < schema.sql

sudo bash -c 'echo "{
  \"database\" : {
      \"user\": \"puppetgui\",
      \"password\": \"'$MYSQL_PASSWORD'\",
      \"database\": \"hiera\"
    }
}" > /opt/puppetmaster-gui/app/config.json'

sudo cp /opt/puppetmaster-gui/puppetmaster-gui.conf /etc/init

sudo start puppetmaster-gui

