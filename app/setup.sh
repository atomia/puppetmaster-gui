apt-get install -y wget nodejs mysql-server
npm install -g nodemon
mysql --defaults-file=/etc/mysql/debian.cnf < schema.sql
