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

command_exists () {
    if ! [ -x "$(command -v $1)" ]; then
 	echo "$1 is not installed." >&2
    fi
}


echo 'Preparing to build installers'

echo 'Installing npm modules'
npm install -g electron-packager
npm install grunt
npm install --save-dev grunt-electron-installer
npm install

case "$TRAVIS_OS_NAME" in
  "linux")

    echo 'Linux builds'

    ;;

  "osx")    

    brew update
    brew install jq
  curl -L https://dl.bintray.com/develar/bin/7za -o /tmp/7za
  chmod +x /tmp/7za
curl -L https://dl.bintray.com/develar/bin/wine.7z -o /tmp/wine.7z
 /tmp/7za x -o/usr/local/Cellar -y /tmp/wine.7z
    brew link --overwrite fontconfig freetype gd gnutls jasper libgphoto2 libicns libtasn1 libusb libusb-compat little-cms2 nettle openssl sane-backends webp wine git-lfs gnu-tar dpkg graphicsmagick 

brew install wine
  

  # Retrieveu Latest Server Binaries
    cd temp/
    curl -s https://api.github.com/repos/OpenBazaar/openbazaar-go/releases > release.txt
cat release.txt

cat release.txt | jq -r ".[0].assets[].browser_download_url" | xargs -n 1 curl -O
    cd ..

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
    ;;
esac
