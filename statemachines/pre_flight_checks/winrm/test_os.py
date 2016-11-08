#!/usr/bin/python
import winrm
from optparse import OptionParser
import requests
def main():
	parser = OptionParser()
	parser.add_option("-i", "--host", help="The ip or hostname of the server to connect to")
	parser.add_option("-u", "--username", help="The username to connect with")
	parser.add_option("-p", "--password", help="The password to authenticate with")
	parser.add_option
	(options, args) = parser.parse_args()

	ps_script = """
$major = [System.Environment]::OSVersion.Version.Major
$minor = [System.Environment]::OSVersion.Version.Minor

if (!($major -eq 6 -AND ($minor -eq 2 -OR $minor -eq 3))) {
    exit 1
}
"""
	try:
		s = winrm.Session(options.host, auth=(options.username,options.password))
		r = s.run_ps(ps_script)
		if r.status_code != 0:
			print "{\"status\" : \"failed\", \"message\" : \"Not supported Windows server version, expected Windows Server 2012 R2\"}"
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

if __name__ == "__main__":
    main()
