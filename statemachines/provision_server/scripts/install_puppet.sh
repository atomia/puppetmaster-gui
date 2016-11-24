#!/bin/sh

if [ "$#" -ne 2 ]; then
        echo "Usage: $0 puppetmaster environment"
        exit 1
fi
hostname=`hostname`
if [ -e '/etc/debian_version' ]; then
        PUPPET_INSTALLED=`dpkg -l puppet 2>&1 | grep puppetlabs | wc -l`
        if [ $PUPPET_INSTALLED -eq 0 ]; then
                apt-get update
                apt-get install -y puppet
        fi
elif [ -e '/etc/redhat-release' ]; then
        for os_release in redhat-release centos-release cloudlinux-release; do
                if rpm -q --quiet $os_release; then
                        major_version=$(rpm -q --queryformat '%{VERSION}' $os_release|cut -d. -f1)
                fi
        done
        if ! rpm -q --quiet puppet puppetlabs-release; then
                rpm -ivh https://yum.puppetlabs.com/puppetlabs-release-el-$major_version.noarch.rpm
                yum install puppet puppetlabs-release -y && chkconfig puppet off
        fi
fi

SERVER_CONF=`grep $1 /etc/puppet/puppet.conf | wc -l`
if [ $SERVER_CONF -eq 0 ]; then
        sed -i "/\[main\]/a server=$1\nlisten=true" /etc/puppet/puppet.conf
        sed -i "/templatedir/d" /etc/puppet/puppet.conf
        echo -e 'path /run\nallow *' >> /etc/puppet/auth.conf
	sed -i "/\[main\]/a environment=$2" /etc/puppet/puppet.conf
        puppet agent --enable
        service puppet stop
fi
#Clean up
