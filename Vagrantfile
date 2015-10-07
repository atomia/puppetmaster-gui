# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|

  config.vm.define "master" do |master| 
    master.vm.box = "urban/trusty64-node"

    master.vm.network "forwarded_port", guest: 3000, host: 3000
    master.vm.network "forwarded_port", guest: 8082, host: 8082
    master.vm.network "private_network", ip: "192.168.33.10"
    master.vm.network "public_network"
    master.vm.synced_folder "app", "/srv/app"
  end

  config.vm.define "test1" do |test1| 
    test1.vm.box = "ubuntu/trusty64"

    test1.vm.network "private_network", ip: "192.168.33.11"
    test1.vm.network "public_network"
    test1.vm.hostname = "test1.atomia.local"
  end
  config.ssh.insert_key = false
  config.ssh.username = "vagrant"
  config.ssh.password = "vagrant"

end
