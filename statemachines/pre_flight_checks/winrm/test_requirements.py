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

	ps_num_cores = """
(Get-CimInstance win32_processor).NumberOfCores
"""
	ps_disk_size = """
$disk = Get-WmiObject Win32_LogicalDisk -Filter "DeviceID='C:'" |
Select-Object Size,FreeSpace

$disk.size / 1GB
"""
	ps_ram = """
get-ciminstance -class "cim_physicalmemory" | % {$_.Capacity}
"""
	try:
		s = winrm.Session(options.host, auth=(options.username,options.password))
		r = s.run_ps(ps_num_cores)
		if r.status_code != 0:
			print "{\"status\" : \"failed\", \"message\" : \"Could not fetch available cpu from the server\"}"
			exit(1)
		cpu = r.std_out.rstrip()
		r = s.run_ps(ps_disk_size)
		if r.status_code != 0:
			print "{\"status\" : \"failed\", \"message\" : \"Could not fetch available disk from the server\"}"
			exit(1)
		disk = int(float(r.std_out.rstrip()))
		r = s.run_ps(ps_ram)
		if r.status_code != 0:
			print "{\"status\" : \"failed\", \"message\" : \"Could not fetch available ram from the server\"}"
			exit(1)
		ram = int(r.std_out.rstrip()) / 1024 / 1024
		print "{\"cpu\" : " + cpu + ", \"disk\" : " + str(disk) + ", \"ram\" : " + str(ram) + "}"
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
