#!/bin/bash

# Reset Color
NC='\033[0m'
# Regular Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'

echo -n "FQDN: "
hostname -f
read -p "Do you see valid FQDN (e.g. puppet.atomia.local)? y/n: " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo "Exiting without any action. Please correct FQDN in /etc/hosts file."
        exit
fi

read -p "This script will remove any previous Atomia installations on this server. Is this ok? y/n:  " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Starting the installation${NC}"
else
        echo "${RED}Exiting without any action${NC}"
        exit
fi

sudo yum -y install epel-release
sudo yum -y install gcc-c++ make openssl wget jq
sudo yum -y install nodejs

sudo yum -y install git npm mariadb-server python-pip
sudo pip install pywinrm

# Disable firewalld
systemctl disable firewalld
systemctl stop firewalld

sudo systemctl enable mariadb
sudo systemctl start mariadb

cd /opt
sudo git clone https://github.com/atomia/puppetmaster-gui.git

if [ $? -eq 0 ]; then
  echo -e "${GREEN}puppetmaster-gui repo cloned successfuly${NC}"
else
  echo -e "${RED}puppetmaster-gui repo cloning failed!!!${NC}"
fi

cd puppetmaster-gui
git checkout master

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Successfully switched to master branch${NC}"
else
  echo -e "${RED}Switching to master branch failed!!!${NC}"
fi

cd app
sudo npm install

MYSQL_PASSWORD=`openssl rand -base64 16`

sudo mysql --defaults-file=/etc/my.cnf -e "GRANT USAGE ON *.* TO 'puppetgui'@'localhost'; DROP USER 'puppetgui'@'localhost';"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Granted usage to puppetgui@localhost on *.*${NC}"
else
  echo -e "${RED}Grant usage to puppetgui@localhost on *.* failed!!!${NC}"
fi

sudo mysql --defaults-file=/etc/my.cnf -e "CREATE USER 'puppetgui'@'localhost' IDENTIFIED BY '$MYSQL_PASSWORD';GRANT ALL PRIVILEGES ON hiera.* TO 'puppetgui'@'localhost';FLUSH PRIVILEGES;"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Created user puppetgui@localhost with ${YELLOW}${MYSQL_PASSWORD}${GREEN} password, and granted all privileges to hiera.*${NC}"
else
  echo -e "${RED}Creation of puppetgui@localhost user failed!!!${NC}"
fi

cd /opt/puppetmaster-gui/app
sudo mysqldump --defaults-file=/etc/my.cnf -A > mysql_backup_`date +%F_%H%M`.sql
sudo mysql --defaults-file=/etc/my.cnf < schema.sql

if [ $? -eq 0 ]; then
  echo -e "${GREEN}DB schema imported successfully${NC}"
else
  echo -e "${RED}DB schema import failed!!!${NC}"
fi

sudo bash -c 'echo "{
  \"database\" : {
      \"user\": \"puppetgui\",
      \"password\": \"'$MYSQL_PASSWORD'\",
      \"database\": \"hiera\"
    }
}" > /opt/puppetmaster-gui/app/config.json'

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Created /opt/puppetmaster-gui/app/config.json${NC}"
else
  echo -e "${RED}Creation of /opt/puppetmaster-gui/app/config.json failed!!!${NC}"
fi

sudo cp /opt/puppetmaster-gui/puppetmaster-gui-sysd.service /lib/systemd/system/puppetmaster-gui.service
sudo systemctl enable puppetmaster-gui.service
sudo service puppetmaster-gui start