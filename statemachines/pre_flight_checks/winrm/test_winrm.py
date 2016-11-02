#!/usr/bin/python
import winrm
import requests
from optparse import OptionParser

def main():
	parser = OptionParser()
	parser.add_option("-i", "--host", help="The ip or hostname of the server to connect to")
	parser.add_option("-u", "--username", help="The username to connect with")
	parser.add_option("-p", "--password", help="The password to authenticate with")
	parser.add_option
	(options, args) = parser.parse_args()

	try:
		s = winrm.Session(options.host, auth=(options.username,options.password))
		r = s.run_cmd('ipconfig', ['/all'])
		exit(0)
	except requests.exceptions.ConnectionError:
		print "{\"status\" : \"error\", \"message\" : \"Could not connect to server via winrm. Could not reach hostname or ip, make sure all pre requirements are met\"}"
		exit(1)
	except requests.exceptions.ConnectTimeout:
		print "{\"status\" : \"error\", \"message\" : \"Could not connect to server via winrm. Make sure that all pre requirements are met\"}"
		exit(1)
	except winrm.exceptions.InvalidCredentialsError:
		print "{\"status\" : \"error\", \"message\" : \"Could not login to server via winrm. Invalid credentials\"}"
		exit(1)

if __name__ == "__main__":
    main()

