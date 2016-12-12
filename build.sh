#!/bin/sh

## Version 2.0.0
##
## Usage
## ./build.sh
##
## OS supported:
## win32 win64 linux32 linux64 linuxarm osx
##


ELECTRONVER=1.3.4
NODEJSVER=5.1.1

OS="${1}"

# Get Version
PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')
echo "OpenBazaar Version: $PACKAGE_VERSION"

# Create temp/build dirs
mkdir dist/
rm -rf dist/*
mkdir temp/
rm -rf temp/*

echo 'Preparing to build installers'

echo 'Installing npm modules'
npm run build
npm install -g electron-packager --silent
npm install grunt-cli -g --silent
npm install grunt --save-dev
npm install --save-dev grunt-electron-installer --silent
npm install --silent

case "$TRAVIS_OS_NAME" in
  "linux")

    echo 'Linux builds'

    echo 'Building Linux 32-bit Installer....'

    echo 'Making dist directories'
    mkdir dist/linux32
    mkdir dist/linux64

    echo 'Install npm packages for Linux'
    npm install --save-dev electron-installer-debian --silent

    # Retrieve Latest Server Binaries
    sudo apt-get install jq
    cd temp/
    curl -u $GITHUB_USER:$GITHUB_TOKEN -s https://api.github.com/repos/OpenBazaar/openbazaar-go/releases > release.txt
    cat release.txt | jq -r ".[0].assets[].browser_download_url" | xargs -n 1 curl -L -O
    cd ..

    echo "Packaging Electron application"
    electron-packager . openbazaar --platform=linux --arch=ia32 --version=${ELECTRONVER} --overwrite --prune --out=dist

    echo 'Move go server to electron app'
    mkdir dist/openbazaar-linux-ia32/resources/openbazaar-go/
    cp -rf temp/openbazaar-go-linux-386 dist/openbazaar-linux-ia32/resources/openbazaar-go
    mv dist/openbazaar-linux-ia32/resources/openbazaar-go/openbazaar-go-linux-386 dist/openbazaar-linux-ia32/resources/openbazaar-go/openbazaard
    chmod +x dist/openbazaar-linux-ia32/resources/openbazaar-go/openbazaard

    echo 'Create debian archive'
    electron-installer-debian --config .travis/config_ia32.json

    echo 'Sign the installer'

    echo 'Building Linux 64-bit Installer....'

    echo "Packaging Electron application"
    electron-packager . openbazaar --platform=linux --arch=x64 --version=${ELECTRONVER} --overwrite --prune --out=dist

    echo 'Move go server to electron app'
    mkdir dist/openbazaar-linux-x64/resources/openbazaar-go/
    cp -rf temp/openbazaar-go-linux-amd64 dist/openbazaar-linux-x64/resources/openbazaar-go
    mv dist/openbazaar-linux-x64/resources/openbazaar-go/openbazaar-go-linux-amd64 dist/openbazaar-linux-x64/resources/openbazaar-go/openbazaard
    chmod +x dist/openbazaar-linux-x64/resources/openbazaar-go/openbazaard

    echo 'Create debian archive'
    electron-installer-debian --config .travis/config_amd64.json

    echo 'Sign the installer'


    ;;

  "osx")

    brew update
    brew install jq
    curl -L https://dl.bintray.com/develar/bin/7za -o /tmp/7za
    chmod +x /tmp/7za
    curl -L https://dl.bintray.com/develar/bin/wine.7z -o /tmp/wine.7z
    /tmp/7za x -o/usr/local/Cellar -y /tmp/wine.7z

    brew link --overwrite fontconfig gd gnutls jasper libgphoto2 libicns libtasn1 libusb libusb-compat little-cms2 nettle openssl sane-backends webp wine git-lfs gnu-tar dpkg xz
    brew install freetype graphicsmagick
    brew link xz
    brew install mono

    # Retrieve Latest Server Binaries
    cd temp/
    curl -u $GITHUB_USER:$GITHUB_TOKEN -s https://api.github.com/repos/OpenBazaar/openbazaar-go/releases > release.txt
    cat release.txt | jq -r ".[0].assets[].browser_download_url" | xargs -n 1 curl -L -O
    cd ..

    # WINDOWS 32
    echo 'Building Windows 32-bit Installer...'
    mkdir dist/win32

    echo 'Running Electron Packager...'
    electron-packager . OpenBazaar2 --asar=true --out=dist --protocol-name=OpenBazaar --win32metadata.ProductName="OpenBazaar2" --win32metadata.CompanyName="OpenBazaar" --win32metadata.FileDescription='Decentralized p2p marketplace for Bitcoin' --win32metadata.OriginalFilename=OpenBazaar2.exe --protocol=ob --platform=win32 --arch=ia32 --icon=imgs/windows-icon.ico --version=${ELECTRONVER} --overwrite

    echo 'Copying server binary into application folder...'
    cp -rf temp/openbazaar-go-windows-4.0-386.exe dist/OpenBazaar2-win32-ia32/resources/
    mkdir dist/OpenBazaar2-win32-ia32/resources/openbazaar-go
    mv dist/OpenBazaar2-win32-ia32/resources/openbazaar-go-windows-4.0-386.exe dist/OpenBazaar2-win32-ia32/resources/openbazaar-go/openbazaard.exe

    echo 'Building Installer...'
    grunt create-windows-installer --obversion=$PACKAGE_VERSION --appdir=dist/OpenBazaar2-win32-ia32 --outdir=dist/win32
    mv dist/win32/OpenBazaar2Setup.exe dist/win32/OpenBazaar2-$PACKAGE_VERSION-Setup-32.exe

    echo 'Sign the installer'
    signcode -t http://timestamp.digicert.com -a sha1 -spc .travis/ob1.cert.spc -pvk .travis/ob1.pvk -n "OpenBazaar $PACKAGE_VERSION" dist/win32/OpenBazaar2-$PACKAGE_VERSION-Setup-32.exe


    # WINDOWS 64
    echo 'Building Windows 64-bit Installer...'
    mkdir dist/win64

    echo 'Running Electron Packager...'
    electron-packager . OpenBazaar2 --asar=true --out=dist --protocol-name=OpenBazaar --win32metadata.ProductName="OpenBazaar2" --win32metadata.CompanyName="OpenBazaar" --win32metadata.FileDescription='Decentralized p2p marketplace for Bitcoin' --win32metadata.OriginalFilename=OpenBazaar2.exe --protocol=ob --platform=win32 --arch=x64 --icon=imgs/windows-icon.ico --version=${ELECTRONVER} --overwrite

    echo 'Copying server binary into application folder...'
    cp -rf temp/openbazaar-go-windows-4.0-amd64.exe dist/OpenBazaar2-win32-x64/resources/
    mkdir dist/OpenBazaar2-win32-x64/resources/openbazaar-go
    mv dist/OpenBazaar2-win32-x64/resources/openbazaar-go-windows-4.0-amd64.exe dist/OpenBazaar2-win32-x64/resources/openbazaar-go/openbazaard.exe

    echo 'Building Installer...'
    grunt create-windows-installer --obversion=$PACKAGE_VERSION --appdir=dist/OpenBazaar2-win32-x64 --outdir=dist/win64
    mv dist/win64/OpenBazaar2Setup.exe dist/win64/OpenBazaar2-$PACKAGE_VERSION-Setup-64.exe

    echo 'Sign the installer'
    signcode -t http://timestamp.digicert.com -a sha1 -spc .travis/ob1.cert.spc -pvk .travis/ob1.pvk -n "OpenBazaar $PACKAGE_VERSION" dist/win64/OpenBazaar2-$PACKAGE_VERSION-Setup-64.exe


    # OSX
    echo 'Building OSX Installer'
    mkdir dist/osx

    # Install the DMG packager
    echo 'Installing electron-installer-dmg'
    npm install -g electron-installer-dmg

    # Sign openbazaar-go binary
    echo 'Signing Go binary'
    mv temp/openbazaar-go-darwin-10.6-amd64 dist/osx/openbazaard
    codesign --force --sign "$SIGNING_IDENTITY" dist/osx/openbazaard

    echo 'Running Electron Packager...'
    electron-packager . OpenBazaar2 --out=dist -app-category-type=public.app-category.business --protocol-name=OpenBazaar --protocol=ob --platform=darwin --arch=x64 --icon=imgs/osx-tent.icns --version=${ELECTRONVER} --overwrite --app-version=$PACKAGE_VERSION

    echo 'Creating openbazaar-go folder in the OS X .app'
    mkdir dist/OpenBazaar2-darwin-x64/OpenBazaar2.app/Contents/Resources/openbazaar-go

    echo 'Moving binary to correct folder'
    mv dist/osx/openbazaard dist/OpenBazaar2-darwin-x64/OpenBazaar2.app/Contents/Resources/openbazaar-go/openbazaard
    chmod +x dist/OpenBazaar2-darwin-x64/OpenBazaar2.app/Contents/Resources/openbazaar-go/openbazaard

    echo 'Codesign the .app'
    codesign --force --deep --sign "$SIGNING_IDENTITY" dist/OpenBazaar2-darwin-x64/OpenBazaar2.app
    electron-installer-dmg dist/OpenBazaar2-darwin-x64/OpenBazaar2.app OpenBazaar2-$PACKAGE_VERSION --icon ./imgs/osx-tent.icns --out=dist/OpenBazaar2-darwin-x64 --overwrite --background=./imgs/osx-finder_background.png --debug

    echo 'Codesign the DMG and zip'
    codesign --force --sign "$SIGNING_IDENTITY" dist/OpenBazaar2-darwin-x64/OpenBazaar2-$PACKAGE_VERSION.dmg
    cd dist/OpenBazaar2-darwin-x64/
    zip -q -r OpenBazaar2-mac-$PACKAGE_VERSION.zip OpenBazaar2.app

    cp -r OpenBazaar2.app ../osx/
    cp OpenBazaar2-mac-$PACKAGE_VERSION.zip ../osx/
    cp OpenBazaar2-$PACKAGE_VERSION.dmg ../osx/


    ;;
esac
