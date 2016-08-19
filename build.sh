#!/bin/sh

## Version 2.0.0
##
## Usage
## ./build.sh
##
## OS supported:
## win32 win64 linux32 linux64 linuxarm osx
##


ELECTRONVER=1.0.2
NODEJSVER=5.1.1
UPXVER=391

OS="${1}"

# Get Version
PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')
echo "OpenBazaar Version: $PACKAGE_VERSION"

# Check if user specified repository to pull code from
clone_url_server="https://github.com/OpenBazaar/openbazaar-go.git"
clone_url_client="https://github.com/OpenBazaar/OpenBazaar-Client.git"

# Create temp/build dirs
mkdir dist/
rm -rf dist/*
mkdir temp/
rm -rf temp/*


# Retrieve Latest Server Binaries
cd temp/
curl -s https://api.github.com/repos/OpenBazaar/openbazaar-go/releases | jq -r ".[0].assets[].browser_download_url" | xargs -n 1 curl -O
cd ..

# Install wine
# sudo add-apt-repository -y ppa:ubuntu-wine/ppa
# sudo apt-get update
# sudo apt-get install -y wine1.6

sudo rm /etc/apt/sources.list.d/google-chrome.list
sudo dpkg --add-architecture i386
sudo apt-get update
sudo apt-get install -y wine1.6

wget http://download.mono-project.com/sources/mono/mono-4.2.4.4.tar.bz2
tar -xjf mono-4.2.4.4.tar.bz2
cd mono-4.2.4
./configure --prefix=/usr/local
make
sudo make install
cd ..

command_exists () {
    if ! [ -x "$(command -v $1)" ]; then
 	echo "$1 is not installed." >&2
    fi
}

command_exists npm
command_exists wine

echo 'Preparing to build installers'

echo 'Installing npm modules'
npm install rcedit@0.5.0 electron-packager@7.1.0
npm install grunt
npm install --save-dev grunt-electron-installer
npm install

# WINDOWS 32
echo 'Building Windows 32-bit Installer...'
mkdir dist/win32

echo 'Running Electron Packager...'
electron-packager . OpenBazaar --asar=true --out=dist --protocol-name=OpenBazaar --version-string.ProductName=OpenBazaar --protocol=ob --platform=win32 --arch=ia32 --icon=windows/icon.ico --version=${ELECTRONVER} --overwrite

echo 'Copying server binary into application folder...'
cp -rf temp/openbazaar-go-windows-4.0-386.exe dist/OpenBazaar-win32-ia32/resources/
mv dist/OpenBazaar-win32-ia32/resources/openbazaar-go-windows-4.0-386.exe dist/OpenBazaar-win32-ia32/resources/openbazaard.exe

echo 'Building Installer...'
grunt create-windows-installer --obversion=$PACKAGE_VERSION --appdir=dist/OpenBazaar-win32-ia32 --outdir=dist/win32
