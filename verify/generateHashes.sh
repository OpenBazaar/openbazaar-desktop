#!/usr/bin/env bash

### This utility is for the build manager to hash the binaries for the release and create a GPG signed
### file for verification that files are being released in authenticated fashion.

# Check for version arg
if [ -n "$1" ]; then
    version=$1
else
    printf "usage: generateHashes.sh version [folder]\n   version: version number\n   folder: full path to binary folder\n"
    exit 0
fi

# Check for directory arg
if [ -n "$2" ]; then
    releasedir=$2
else
    releasedir=$(pwd)
fi

# Check if GPG_SIGNER is set
if [[ "$GPG_SIGNER" == '' ]]; then
    echo "Please set GPG_SIGNER environment variable with your GPG key id"
    exit 0
fi

# Detect OS
platform='unknown'
unamestr=`uname`
if [[ "$unamestr" == 'Linux' ]]; then
   platform='linux'
elif [[ "$unamestr" == 'FreeBSD' ]]; then
   platform='freebsd'
elif [[ "$unamestr" == 'Darwin' ]]; then
   platform='darwin'
fi

# Set up correct sha256 hashing utilty
if [[ "$platform" == 'darwin' ]]; then
    hashcommand="shasum -a 256"
elif [[ "$platform" == 'linux' ]]; then
    hashcommand="sha256sum"
fi

# Hash binaries for the release
currentdir=$(pwd)
cd $releasedir

# Clean up SHA256SUMS.txt if exists
if [ -f SHA256SUMS.txt ]; then
    rm SHA256SUMS.txt
fi

# Hash binaries into clear text file
for filename in *; do
    echo `$hashcommand $filename` >> "SHA256SUMS"
done

# Sign hash file and remove clear text file
gpg --digest-algo sha256 --default-key "$GPG_SIGNER" --clearsign SHA256SUMS
rm SHA256SUMS

# Move the file to script execution directory
mv SHA256SUMS.asc "${currentdir}/SHA256SUMS.${version}.asc"

echo "Signature file created."
echo "Place file at https://openbazaar.org/releases/SHA256SUMS.${version}.asc"