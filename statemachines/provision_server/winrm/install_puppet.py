#!/usr/bin/python
import winrm
from optparse import OptionParser
import requests
def main():
        parser = OptionParser()
        parser.add_option("-i", "--host", help="The ip or hostname of the server to connect to")
        parser.add_option("-u", "--username", help="The username to connect with")
        parser.add_option("-p", "--password", help="The password to authenticate with")
        parser.add_option("-e", "--environment", help="The puppet environment")
	parser.add_option("-m", "--puppetmaster", help="The hostname of the puppet master")
	parser.add_option("-r", "--roles", help="Atomia role string")
        parser.add_option
        (options, args) = parser.parse_args()

        ps_script = """
$PuppetVersion = "3.8.5" 
$MsiUrl = "https://downloads.puppetlabs.com/windows/puppet-$($PuppetVersion)-x64.msi"
$PuppetInstalled = $false
$PuppetRoles = '""" + options.roles + """'
$PuppetRoles = $PuppetRoles -replace "\\\\", ""
try {
  $ErrorActionPreference = "Stop";
  Get-Command puppet | Out-Null
  $PuppetInstalled = $true
  $PuppetVersion=&puppet "--version"
  # Puppet is installed
  Exit 0
} catch {
  # Puppet is not installed continue
}

if (!($PuppetInstalled)) {
  $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
  if (! ($currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))) {
    Exit 1
  }

  # Install it - msiexec will download from the url
  $install_args = @("/qn", "/norestart","/i", $MsiUrl + "PUPPET_MASTER_SERVER=""" + options.puppetmaster + """ PUPPET_AGENT_ENVIRONMENT=""" + options.environment + """")
  $process = Start-Process -FilePath msiexec.exe -ArgumentList $install_args -Wait -PassThru
  if ($process.ExitCode -ne 0) {
    Exit 1
  }

  # Stop the service that it autostarts
  Start-Sleep -s 5
  Stop-Service -Name puppet
  Set-Service puppet -startuptype "manual"

  # Write to roles
  $path="C:\\ProgramData\\PuppetLabs\\facter\\facts.d"
  If(!(test-path $path))
  {
    New-Item -ItemType -type Directory -Force -Path $path
  }
  $PuppetRoles | Set-Content "$path\\atomia_role.json"

}
"""
        try:
                s = winrm.Session(options.host, auth=(options.username,options.password))
                r = s.run_ps(ps_script)
                if r.status_code != 0:
			print "{\"status\" : \"failed\", \"message\" : \"Failed to install puppet\"}"
                        exit(1)
                exit(0)
        except requests.exceptions.ConnectionError:
                print "{\"status\" : \"failed\", \"message\" : \"Could not connect to server via winrm. Could not reach hostname or ip, make sure all pre requirements are met\"}"
                exit(1)
        except requests.exceptions.ConnectTimeout:
                print "{\"status\" : \"failed\", \"message\" : \"Could not connect to server via winrm. Make sure that all pre requirements are met\"}"
                exit(1)
        except winrm.exceptions.InvalidCredentialsError:
                print "{\"status\" : \"failed\", \"message\" : \"Could not login to server via winrm. Invalid credentials\"}"
                exit(1)
        except:
                print "Unknown WinRM error"
                exit (0)



if __name__ == "__main__":
    main()

