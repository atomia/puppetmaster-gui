#!/usr/bin/python
import winrm
import sys

def main(argv):
    try:
        username=argv[0]
        password=argv[1]
        hostname=argv[2]
        command=argv[3]
        s = winrm.Session(hostname, auth=(username, password))
        r = s.run_ps(command)
        print r.std_out
    except:
        print "Usage: username password hostname command"
        sys.exit(2)

if __name__ == "__main__":
        main(sys.argv[1:])
