#!/bin/sh

if [ -z "$1" ]
then
        echo "usage: $0 namespace variable (module_path)"
        exit 1
fi

if [ ! -z "$3" ]
then
    MODULE_PATH=$3
else
    MODULE_PATH="/etc/puppet/modules/atomia/manifests"
fi

NAMESPACE=$1
VARIABLE=$2
#| grep -o "[\(.*\))]"
cat "${MODULE_PATH}/${NAMESPACE}.pp" | egrep "#####.*$VARIABLE[\(.*\)]?.*:" | cut -d ":" -f1 | grep -o "(.*)" | sed 's/(//' | sed 's/)//' | sed -e 's/^[[:space:]]*//' | tr -d '\n' 
