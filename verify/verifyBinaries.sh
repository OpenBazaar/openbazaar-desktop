#!/usr/bin/env bash

### This utility is for users to verify that binaries they downloaded are the signed, correct versions

BASEURL="https://github.com/OpenBazaar/openbazaar-desktop/releases/download/"
TMPFILE="hashes.tmp"
TMPFOLDER="temp"

function clean_up {
   for file in $*
   do
      rm "$file" 2> /dev/null
   done
}

if [ ! -f $TMPFOLDER ]; then
    mkdir $TMPFOLDER
fi

# Check for version arg
if [ -n "$1" ]; then
    VERSION=$1
else
    printf "usage: verifyBinaries.sh version [clean]\n   version: version number\n   clean: remove binaries after verify\n"
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

GITHUBRELEASEURL="https://github.com/OpenBazaar/openbazaar-desktop/releases/download/$VERSION/"
SIGNATUREFILENAME="SHA256SUMS.${VERSION}.asc"
#https://github.com/OpenBazaar/openbazaar-desktop/releases/download/v2.3.8/SHA256SUMS.v2.3.8.asc
# Retrieve the signature file
echo "Downloading binaries to $TMPFOLDER..."
echo "$GITHUBRELEASEURL$SIGNATUREFILENAME"
wget --quiet -N "$GITHUBRELEASEURL$SIGNATUREFILENAME" 2>&1
mv $SIGNATUREFILENAME temp/

# GPG check the downloaded file
GPGOUT=$(gpg --yes --decrypt --output "$TMPFOLDER/$TMPFILE" "$TMPFOLDER/$SIGNATUREFILENAME" 2>&1)

RET="$?"
if [ $RET -ne 0 ]; then
   if [ $RET -eq 1 ]; then
      #and notify the user if it's bad
      echo "Bad signature."
   elif [ $RET -eq 2 ]; then
      #or if a gpg error has occurred
      echo "gpg error. Do you have the OpenBazaar signing key installed?"
   fi

   echo "gpg output:"
   echo "$GPGOUT"|sed 's/^/\t/g'
   clean_up $TMPFOLDER/$SIGNATUREFILENAME $TMPFOLDER/$TMPFILE
   exit "$RET"
fi

# Get file names from the signature file
FILES=$(awk '{print $2}' "$TMPFOLDER/$TMPFILE")

# Download them one by one to local machine
for file in $FILES
do
   wget --quiet -N "$GITHUBRELEASEURL$file" -P $TMPFOLDER/
done

# Check hashes
cd $TMPFOLDER

DIFF=$(diff -w <($hashcommand $FILES) "$TMPFILE")

if [ $? -eq 1 ]; then
   echo "Hashes don't match."
   echo "Offending files:"
   echo "$DIFF"|grep "^<"|awk '{print "\t"$3}'
   exit 1
elif [ $? -gt 1 ]; then
   echo "Error executing 'diff'"
   exit 2
fi

if [ -n "$2" ]; then
   echo "Clean up the binaries"
   clean_up $FILES $SIGNATUREFILENAME $TMPFILE
else
   echo "Keep the binaries in $TMPFOLDER"
   clean_up $TMPFILE
fi

echo -e "Verified hashes of \n$FILES"

exit 0
