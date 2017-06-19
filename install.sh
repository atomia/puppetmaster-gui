#!/bin/bash

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
        echo "Starting the installation"
else
        echo "Exiting without any action"
        exit
fi

apt-get update
apt-get install -y curl
REPO=`curl -m 5 --output /dev/null --silent --head --fail http://apt.atomia.com`
if [ "$?" != "0" ]; then
        printf "\nERROR: This server can not access Atomias apt repository http://apt.atomia.com, please contact support@atomia.com to request access\n"
        exit
fi
curl -sL https://deb.nodesource.com/setup_6.x -o nodesource_setup.sh
bash nodesource_setup.sh
apt-get install -y nodejs
apt-get install -y git mysql-server python-pip jq sshpass
pip install --upgrade pip
pip install pywinrm
pip install --upgrade awscli
cd /opt
git clone https://github.com/atomia/puppetmaster-gui.git
cd puppetmaster-gui
git checkout master 
cd app
npm install

MYSQL_PASSWORD=`openssl rand -base64 16`
RESTATE_PASSWORD=`openssl rand -base64 16 | sed 's/\///'`
DB_USER="puppetgui"
USER_EXISTS="$(mysql --defaults-file=/etc/mysql/debian.cnf -sse "SELECT EXISTS(SELECT 1 FROM mysql.user WHERE user = '$DB_USER')")"

if [ "$USER_EXISTS" = "1" ]; then
        mysql --defaults-file=/etc/mysql/debian.cnf -e "DROP USER '$DB_USER'@'localhost';"
fi

sudo mysql --defaults-file=/etc/mysql/debian.cnf -e "GRANT USAGE ON *.* TO 'puppetgui'@'localhost'; DROP USER 'puppetgui'@'localhost';"
sudo mysql --defaults-file=/etc/mysql/debian.cnf -e "CREATE USER 'puppetgui'@'localhost' IDENTIFIED BY '$MYSQL_PASSWORD';GRANT ALL PRIVILEGES ON puppet_atomia.* TO 'puppetgui'@'localhost';FLUSH PRIVILEGES;"

cd /opt/puppetmaster-gui/app
mysql --defaults-file=/etc/mysql/debian.cnf < schema.sql

bash -c 'echo "{
  \"database\" : {
    \"user\": \"'$DB_USER'\",
    \"password\": \"'$MYSQL_PASSWORD'\",
    \"database\": \"puppet_atomia\",
    \"host\": \"localhost\"
  },
  \"restate_machine\" : {
    \"user\": \"restatemachine\",
    \"password\": \"'$RESTATE_PASSWORD'\",
    \"host\": \"localhost\",
    \"port\": \"8080\"
  },
  \"main\" : {
    \"module_path\" : \"/etc/puppet/modules/atomia/manifests\"
  }
}" > /opt/puppetmaster-gui/app/config/config.json'

if [ `lsb_release -r | awk '{print $2}'` == '14.04' ]
then
	cp /opt/puppetmaster-gui/puppetmaster-gui-sysv.service /etc/init.d/puppetmaster-gui
	update-rc.d puppetmaster-gui defaults
else
	cp /opt/puppetmaster-gui/puppetmaster-gui-sysd.service /lib/systemd/system/puppetmaster-gui.service
	systemctl enable puppetmaster-gui.service
fi

wget https://raw.githubusercontent.com/atomia/puppet-atomia/master/setup-puppet-atomia
chmod +x setup-puppet-atomia
./setup-puppet-atomia
LSBDISTCODENAME=`facter lsbdistcodename`
REPO=`echo "ubuntu-${LSBDISTCODENAME} ${LSBDISTCODENAME} main"`
echo "deb http://apt.atomia.com/${REPO}" > /etc/apt/sources.list.d/atomia.list

bash -c 'echo "-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: GnuPG v1.4.6 (GNU/Linux)

mQGiBEoSgyoRBAC/Tijk3IMYga1RuCe2tpQkQZSyMJKriD/UHjwo+ZGzKRwfXiWt
Y/OwDx+g1VCuC8aj6ZlqYMbw7A9uS7DkzZ5vzuGPK345aiNpvtsdW3Q0i7wvIYwm
w9zBeIhPYi5qwsPKOC4Ma/x/uvivhexkJpj2dyNmqPErBoiJzq3nOuvMIwCgmLQQ
3cG5S/thfGz48lkH/HdjAe0D/0ym/24iNxzrP9aVIYEA/UCAHmSnNGktyqb5s1Qj
/vqgoNFti62eQPqWtgPwNIHomxB/7VVdnGgGN1RfbfZqktaKGsTzYkOepNnQwqWa
B9v7nljLPvzlPCbWCw2ZO5MdUmX/0xYyo//DlID9RQcrIUd89OVGG2b1wCiMwwyB
xPVqA/9HmEuB7HQZWxNYcJr6TBxs5mRvNIxdM2c5a5y89lrKaziPqJ5ol7M0Qzgv
fH3Kj9fVo9UL1WNF/5K1TosN1WS3mF4yFijcD+F9G/b5OuuzL8v7K7mO8WlWYUx8
oPpBejjLj3ROrwDQkHScfR0K0F6waHqolNFDf+1UF8Iv7MovVbQ1QXRvbWlhIEFQ
VCBSZXBvc2l0b3J5IEFkbWluaXN0cmF0b3IgPGluZm9AYXRvbWlhLmNvbT6IYAQT
EQIAIAUCShKDKwIbAwYLCQgHAwIEFQIIAwQWAgMBAh4BAheAAAoJENvC7IiT3oJa
TQ8AnA1hCn1Jo8frDKrjOMymK5/h3Q84AKCAySrepeLfklZ6gFm68pnL4ZImDrkC
DQRKEoMyEAgAicKR8bE1L3TEqJ0uRnTiwsLaUpFboUqUDVFT1Ds+iHFWFxHFCRPP
I8U+mfDEdnGYANNlt7j3/7dllw2NYDTh1CZrgZTgsHMz6l0eWA0aYOl43A3yEpse
StcoC1kMqZyL5gBxGGlblc+jY2s3DrFt7oijE6Gk6H1krJwng0pl0Z1Ao+lKzJXy
p3Xyhjk7WCpDbZabEO2Bki/Np82gPLZzDRawIWRxv4gO/3NbT+yZ453zG4nlaRi5
IEqeeTqW1zH+vLJOlVVxCvJie0CzFsoKasUpvJgQF3Ev17aJugjgebQtqV48uCI1
Tt4JbUvyeR8lejNzB1k7n9XxnJgT+PJ73wAEDQf/byaz0MwbhcGSZ5eEblek51dR
Gn8XYFGOgGnbo02fgA+CWQqEgKBHBlJlUBS4tLz8Di2bnzb/r39sQx97cj/cMStm
BDrrRanVKFPBb5zH0r18Ev7iiV+JEbaETKEs7XN42eN+oztoUmCMogBHkaKkYpJc
t4rs0SP1XupBTw+UySy1KR1YYuRynGx3XetfGPs2sIuEfiiuIXCp6bw060ftwd60
sQ6aEa0mzLfKXG4eKuvDv1hQPeLq2CZ0GGN/gRzc6s9fbpf4LpdmKDcngZvs1qFR
HWXlO3ZyNUzZhKI7r2UPcQPjyjthL8X9tCO62mPXRaI9lfF/+9Ox+iTy36qe1IhJ
BBgRAgAJBQJKEoMyAhsMAAoJENvC7IiT3oJaYTUAn08bci+KCKonSvtUZiqOiPQK
LEN2AJ49aDOpLTtEHUOw5nD7hKiT9ClsNQ==
=IX4x
-----END PGP PUBLIC KEY BLOCK-----" > /etc/apt/ATOMIA-GPG-KEY.pub'

/usr/bin/apt-key add /etc/apt/ATOMIA-GPG-KEY.pub

apt-get update
apt-get install -y restatemachine

bash -c 'echo "ListenOn = \":8080\"
Username = \"restatemachine\"
Password = \"'$RESTATE_PASSWORD'\"
#TLSCertificateFile = \"/some/certificate.pem\"
# TLSKeyFile = \"/some/certificate_key.pem\"
StateMachinePath = \"/opt/puppetmaster-gui/statemachines\"" > /etc/restatemachine/restatemachine.conf'

chmod -R +x /opt/puppetmaster-gui/statemachines
service restatemachine restart

service puppetmaster-gui start

# Apply hiera patch, needed due to https://github.com/puppetlabs/puppet/pull/4482
# currently no updated version is available for puppet 3.4
 patch /usr/lib/ruby/vendor_ruby/hiera/scope.rb < /opt/puppetmaster-gui/hiera.atomia.patch
