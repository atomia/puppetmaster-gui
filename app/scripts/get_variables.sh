#!/bin/sh

if [ -z "$1" ]
then
        echo "usage: $0 namespace (module_path)"
        exit 1
fi

if [ ! -z "$2" ]
then
    MODULE_PATH=$2
else
    MODULE_PATH="/etc/puppet/modules/atomia/manifests"
fi

NAMESPACE=$1
VARIABLE=$2

#cat "${MODULE_PATH}/${NAMESPACE}.pp" |  sed -n '/class.*(/,/)/p' | egrep '\$.*' | sed -e 's/^[[:space:]]*//' | awk '{print $1,$3}' | grep -P -o -h  "[A-Za-z_-].* [A-Za-z0-9,\"'.\[\]]+[\]|\"|\'|$]" | sed -e 's/\s[\"]/ /' | sed -e 's/\"$//' 
cat "${MODULE_PATH}/${NAMESPACE}.pp" |  sed -n '/class.*(/,/)/p' | egrep '\$.*' | sed -e 's/^[[:space:]]*//' | awk '{print $1,$3}' | grep -P -o -h  "[A-Za-z_-].* [A-Za-z0-9,:\{\}\/\$\"'.\[\]]+[\]|\"|\'|\}|\]|$]" | sed -e 's/\s[\"]/ /' | sed -e 's/\"$//' 
