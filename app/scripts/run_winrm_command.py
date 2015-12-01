#!/usr/bin/python
import winrm
import sys

def main(argv):
	try:
		username=argv[0]
		password=argv[1]
		hostname=argv[2]
		command=argv[3]
		command_path=argv[4]
		s = winrm.Session(hostname, auth=(username, password))
		if command_path != "false" and command_path != "cmd":
			r = s.run_cmd('"'+ command_path + '" ' +command)
		elif command_path == "cmd":
			r = s.run_cmd(command)
		else:
			r = s.run_cmd("c:\\windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe -Command '" + command + "'")
		if r.status_code != 0:
			print r.std_err
		print r.std_out
	except():
		print sys.exc_info()[0]
		print "Usage: username password hostname command"
		sys.exit(2)

if __name__ == "__main__":
	main(sys.argv[1:])
