apt-get update
sudo apt-get install -y git nodejs nodejs-legacy npm mysql-server python-pip
sudo pip install pywinrm
cd /opt
git clone https://github.com/atomia/puppetmaster-gui.git
cd puppetmaster-gui/app
sudo npm install

MYSQL_PASSWORD=`openssl rand -base64 16`

sudo mysql --defaults-file=/etc/mysql/debian.cnf
CREATE USER 'puppetgui'@'localhost' IDENTIFIED BY '$MYSQL_PASSWORD';
GRANT ALL PRIVILEGES ON `hiera`.* TO 'puppetgui'@'localhost';
FLUSH PRIVILEGES;
exit

sudo mysql --defaults-file=/etc/mysql/debian.cnf < schema.sql

echo "{
  \"database\" : {
      \"user\": \"puppetgui\",
      \"password\": \"$MYSQL_PASSWORD\",
      \"database\": \"hiera\"
    }
}" > /opt/puppetmaster-gui/app/config.json

cp /opt/puppetmaster-gui/puppetmaster-gui.conf /etc/init

start puppetmaster-gui

