#!/bin/bash

[ -n "$(which x11docker)" ] \
    || { echo "x11docker is required"; exit 1; }

SCRIPT_DIR=$(dirname $(readlink -f "$0"))

VERSION=2.1.1
IMAGE=openbazaar-desktop:${VERSION}

[ -n "$(docker images -q --filter=reference="${IMAGE}")" ] \
    || docker build -t ${IMAGE} --build-arg VERSION=${VERSION} ${SCRIPT_DIR}

x11docker --hostdisplay \
    --homedir ${HOME} \
    --clipboard \
    --stdout \
    --stderr \
    --no-init \
    ${IMAGE} \
    openbazaar2