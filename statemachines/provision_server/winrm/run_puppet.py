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
        &"${Env:ProgramFiles}\\Puppet Labs\\Puppet\\bin\\puppet.bat" agent --test
	exit ($lastExitCode)
	"""
        try:
                s = winrm.Session(options.host, auth=(options.username,options.password))
                #r = s.run_ps(ps_script)
		r = s.run_cmd('puppet', ['agent', '--test'])
		print r.std_out
		print r.std_err
                if r.status_code == 0 or r.status_code == 2:
			exit(0)
                exit(1)
        except requests.exceptions.ConnectionError:
                print "{\"status\" : \"failed\", \"message\" : \"Could not connect to server via winrm. Could not reach hostname or ip, make sure all pre requirements are met\"}"
                exit(1)
        except requests.exceptions.ConnectTimeout:
                print "{\"status\" : \"failed\", \"message\" : \"Could not connect to server via winrm. Make sure that all pre requirements are met\"}"
                exit(1)
        except winrm.exceptions.InvalidCredentialsError:
                print "{\"status\" : \"failed\", \"message\" : \"Could not login to server via winrm. Invalid credentials\"}"
                exit(1)


if __name__ == "__main__":
    main()

