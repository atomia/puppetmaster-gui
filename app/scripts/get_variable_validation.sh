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

cat "${MODULE_PATH}/${NAMESPACE}.pp" | egrep "#####.*$VARIABLE:" | cut -d ':' -f2-10 |  sed -e 's/^[[:space:]]*//'

