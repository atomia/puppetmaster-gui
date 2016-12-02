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
	BOOTSTRAP=`cat << BOOTSTRAP_END
# Should be placed in /usr/lib/ruby/vendor_ruby/facter/atomia_role.rb
require 'net/http'
require 'uri'
require 'json'

Facter.add('atomia_role_1') do
  setcode do
    serverFQDN = Facter.value(:fqdn)
    if Facter.value(:ec2_public_hostname)
      serverFQDN = Facter.value(:ec2_public_hostname)
    end
    puppetFQDN = getPuppetFQDN()
    JSON.parse(Net::HTTP.get(URI.parse("http://#{puppetFQDN}:3000/servers/roles/#{serverFQDN}")))[0]
  end
end

Facter.add('atomia_role_2') do
  setcode do
    serverFQDN = Facter.value(:fqdn)
    if Facter.value(:ec2_public_hostname)
      serverFQDN = Facter.value(:ec2_public_hostname)
    end
    puppetFQDN = getPuppetFQDN()
    JSON.parse(Net::HTTP.get(URI.parse("http://#{puppetFQDN}:3000/servers/roles/#{serverFQDN}")))[1]
  end
end

Facter.add('atomia_role_3') do
  setcode do
    serverFQDN = Facter.value(:fqdn)
    if Facter.value(:ec2_public_hostname)
      serverFQDN = Facter.value(:ec2_public_hostname)
    end
    puppetFQDN = getPuppetFQDN()
    JSON.parse(Net::HTTP.get(URI.parse("http://#{puppetFQDN}:3000/servers/roles/#{serverFQDN}")))[2]
  end
end

Facter.add('atomia_role_4') do
  setcode do
    serverFQDN = Facter.value(:fqdn)
    if Facter.value(:ec2_public_hostname)
      serverFQDN = Facter.value(:ec2_public_hostname)
    end
    puppetFQDN = getPuppetFQDN()
    JSON.parse(Net::HTTP.get(URI.parse("http://#{puppetFQDN}:3000/servers/roles/#{serverFQDN}")))[3]
  end
end

Facter.add('atomia_role_5') do
  setcode do
    serverFQDN = Facter.value(:fqdn)
    if Facter.value(:ec2_public_hostname)
      serverFQDN = Facter.value(:ec2_public_hostname)
    end
    puppetFQDN = getPuppetFQDN()
    JSON.parse(Net::HTTP.get(URI.parse("http://#{puppetFQDN}:3000/servers/roles/#{serverFQDN}")))[4]
  end
end

def getPuppetFQDN
  contents = File.read('/etc/puppet/puppet.conf')
  server= /server=(.*)/.match(contents)
  server[1]
end
BOOTSTRAP_END
`
mkdir -p /usr/lib/ruby/vendor_ruby/facter

echo "$BOOTSTRAP" > /usr/lib/ruby/vendor_ruby/facter/atomia_role.rb
fi
