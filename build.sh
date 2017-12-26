#!/bin/sh

## Version 2.0.0
##
## Usage
## ./build.sh
##
## OS supported:
## win32 win64 linux32 linux64 linuxarm osx
##


ELECTRONVER=1.7.8
NODEJSVER=6

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

echo 'Preparing to build installers...'

echo 'Installing npm packages...'
npm i -g npm@5.2
npm install electron-packager -g --silent
npm install npm-run-all -g --silent
npm install grunt-cli -g --silent
npm install grunt --save-dev --silent
npm install grunt-electron-installer --save-dev --silent
npm install --silent

echo 'Building OpenBazaar app...'
npm run build

echo 'Copying transpiled files into js folder...'
cp -rf prod/* js/


case "$TRAVIS_OS_NAME" in
  "linux")

    echo 'Linux builds'

    echo 'Building Linux 32-bit Installer....'

    echo 'Making dist directories'
    mkdir dist/linux32
    mkdir dist/linux64

    echo 'Install npm packages for Linux'
    npm install -g --save-dev electron-installer-debian --silent
    npm install -g --save-dev electron-installer-redhat --silent

    # Install rpmbuild
    sudo apt-get install rpm

    # Ensure fakeroot is installed
    sudo apt-get install fakeroot

    # Retrieve Latest Server Binaries
    sudo apt-get install jq
    cd temp/
    curl -u $GITHUB_USER:$GITHUB_TOKEN -s https://api.github.com/repos/OpenBazaar/openbazaar-go/releases > release.txt
    cat release.txt | jq -r ".[0].assets[].browser_download_url" | xargs -n 1 curl -L -O
    cd ..

    APPNAME="openbazaar2"

    echo "Packaging Electron application"
    electron-packager . ${APPNAME} --platform=linux --arch=ia32 --version=${ELECTRONVER} --overwrite --prune --out=dist

    echo 'Move go server to electron app'
    mkdir dist/${APPNAME}-linux-ia32/resources/openbazaar-go/
    cp -rf temp/openbazaar-go-linux-386 dist/${APPNAME}-linux-ia32/resources/openbazaar-go
    mv dist/${APPNAME}-linux-ia32/resources/openbazaar-go/openbazaar-go-linux-386 dist/${APPNAME}-linux-ia32/resources/openbazaar-go/openbazaard
    rm -rf dist/${APPNAME}-linux-ia32/resources/app/.travis
    chmod +x dist/${APPNAME}-linux-ia32/resources/openbazaar-go/openbazaard

    echo 'Create debian archive'
    electron-installer-debian --config .travis/config_ia32.json

    echo 'Create RPM archive'
    electron-installer-redhat --config .travis/config_ia32.json

    echo 'Building Linux 64-bit Installer....'

    echo "Packaging Electron application"
    electron-packager . ${APPNAME} --platform=linux --arch=x64 --version=${ELECTRONVER} --overwrite --prune --out=dist

    echo 'Move go server to electron app'
    mkdir dist/${APPNAME}-linux-x64/resources/openbazaar-go/
    cp -rf temp/openbazaar-go-linux-amd64 dist/${APPNAME}-linux-x64/resources/openbazaar-go
    mv dist/${APPNAME}-linux-x64/resources/openbazaar-go/openbazaar-go-linux-amd64 dist/${APPNAME}-linux-x64/resources/openbazaar-go/openbazaard
    rm -rf dist/${APPNAME}-linux-x64/resources/app/.travis
    chmod +x dist/${APPNAME}-linux-x64/resources/openbazaar-go/openbazaard

    echo 'Create debian archive'
    electron-installer-debian --config .travis/config_amd64.json

    echo 'Create RPM archive'
    electron-installer-redhat --config .travis/config_amd64.json

    APPNAME="openbazaar2client"

    echo "Packaging Electron application"
    electron-packager . ${APPNAME} --platform=linux --arch=ia32 --version=${ELECTRONVER} --overwrite --prune --out=dist

    echo 'Create debian archive'
    electron-installer-debian --config .travis/config_ia32.client.json

    echo 'Create RPM archive'
    electron-installer-redhat --config .travis/config_ia32.client.json

    echo 'Building Linux 64-bit Installer....'

    echo "Packaging Electron application"
    electron-packager . ${APPNAME} --platform=linux --arch=x64 --version=${ELECTRONVER} --overwrite --prune --out=dist

    echo 'Create debian archive'
    electron-installer-debian --config .travis/config_amd64.client.json

    echo 'Create RPM archive'
    electron-installer-redhat --config .travis/config_amd64.client.json

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
    curl https://api.github.com/repos/phoreproject/openbazaar-go/releases > release.txt
    cat release.txt | jq -r ".[0].assets[].browser_download_url" | xargs -n 1 curl -L -O
    cd ..

    # WINDOWS 32
    echo 'Building Windows 32-bit Installer...'
    mkdir dist/win32

    echo 'Running Electron Packager...'
    electron-packager . OpenBazaar2 --asar --out=dist --protocol-name=OpenBazaar --win32metadata.ProductName="OpenBazaar2" --win32metadata.CompanyName="OpenBazaar" --win32metadata.FileDescription='Decentralized p2p marketplace for Bitcoin' --win32metadata.OriginalFilename=OpenBazaar2.exe --protocol=ob --platform=win32 --arch=ia32 --icon=imgs/openbazaar2.ico --electron-version=${ELECTRONVER} --overwrite

    echo 'Copying server binary into application folder...'
    cp -rf temp/openbazaar-go-windows-4.0-386.exe dist/OpenBazaar2-win32-ia32/resources/
    cp -rf temp/libwinpthread-1.win32.dll dist/OpenBazaar2-win32-ia32/resources/libwinpthread-1.dll
    mkdir dist/OpenBazaar2-win32-ia32/resources/openbazaar-go
    mv dist/OpenBazaar2-win32-ia32/resources/openbazaar-go-windows-4.0-386.exe dist/OpenBazaar2-win32-ia32/resources/openbazaar-go/openbazaard.exe
    mv dist/OpenBazaar2-win32-ia32/resources/libwinpthread-1.dll dist/OpenBazaar2-win32-ia32/resources/openbazaar-go/libwinpthread-1.dll

    echo 'Building Installer...'
    grunt create-windows-installer --appname=OpenBazaar2 --obversion=$PACKAGE_VERSION --appdir=dist/OpenBazaar2-win32-ia32 --outdir=dist/win32
    mv dist/win32/OpenBazaar2Setup.exe dist/win32/OpenBazaar2-$PACKAGE_VERSION-Setup-32.exe
    mv dist/win64/RELEASES dist/win32/RELEASES

    #### CLIENT ONLY
    echo 'Running Electron Packager...'
    electron-packager . OpenBazaar2Client --asar --out=dist --protocol-name=OpenBazaar --win32metadata.ProductName="OpenBazaar2Client" --win32metadata.CompanyName="OpenBazaar" --win32metadata.FileDescription='Decentralized p2p marketplace for Bitcoin' --win32metadata.OriginalFilename=OpenBazaar2Client.exe --protocol=ob --platform=win32 --arch=ia32 --icon=imgs/openbazaar2.ico --electron-version=${ELECTRONVER} --overwrite

    echo 'Building Installer...'
    grunt create-windows-installer --appname=OpenBazaar2Client --obversion=$PACKAGE_VERSION --appdir=dist/OpenBazaar2Client-win32-ia32 --outdir=dist/win32
    mv dist/win32/OpenBazaar2ClientSetup.exe dist/win32/OpenBazaar2Client-$PACKAGE_VERSION-Setup-32.exe

    # WINDOWS 64
    echo 'Building Windows 64-bit Installer...'
    mkdir dist/win64

    echo 'Running Electron Packager...'
    electron-packager . OpenBazaar2 --asar --out=dist --protocol-name=OpenBazaar --win32metadata.ProductName="OpenBazaar2" --win32metadata.CompanyName="OpenBazaar" --win32metadata.FileDescription='Decentralized p2p marketplace for Bitcoin' --win32metadata.OriginalFilename=OpenBazaar2.exe --protocol=ob --platform=win32 --arch=x64 --icon=imgs/openbazaar2.ico --electron-version=${ELECTRONVER} --overwrite

    echo 'Copying server binary into application folder...'
    cp -rf temp/openbazaar-go-windows-4.0-amd64.exe dist/OpenBazaar2-win32-x64/resources/
    cp -rf temp/libwinpthread-1.win64.dll dist/OpenBazaar2-win32-x64/resources/libwinpthread-1.dll
    mkdir dist/OpenBazaar2-win32-x64/resources/openbazaar-go
    mv dist/OpenBazaar2-win32-x64/resources/openbazaar-go-windows-4.0-amd64.exe dist/OpenBazaar2-win32-x64/resources/openbazaar-go/openbazaard.exe
    mv dist/OpenBazaar2-win32-x64/resources/libwinpthread-1.dll dist/OpenBazaar2-win32-x64/resources/openbazaar-go/libwinpthread-1.dll

    echo 'Building Installer...'
    grunt create-windows-installer --appname=OpenBazaar2 --obversion=$PACKAGE_VERSION --appdir=dist/OpenBazaar2-win32-x64 --outdir=dist/win64
    mv dist/win64/OpenBazaar2Setup.exe dist/win64/OpenBazaar2-$PACKAGE_VERSION-Setup-64.exe
    mv dist/win64/RELEASES dist/win64/RELEASES-x64

    #### CLIENT ONLY
    echo 'Running Electron Packager...'
    electron-packager . OpenBazaar2Client --asar --out=dist --protocol-name=OpenBazaar --win32metadata.ProductName="OpenBazaar2Client" --win32metadata.CompanyName="OpenBazaar" --win32metadata.FileDescription='Decentralized p2p marketplace for Bitcoin' --win32metadata.OriginalFilename=OpenBazaar2Client.exe --protocol=ob --platform=win32 --arch=x64 --icon=imgs/openbazaar2.ico --electron-version=${ELECTRONVER} --overwrite

    echo 'Building Installer...'
    grunt create-windows-installer --appname=OpenBazaar2Client --obversion=$PACKAGE_VERSION --appdir=dist/OpenBazaar2Client-win32-x64 --outdir=dist/win64
    mv dist/win64/OpenBazaar2ClientSetup.exe dist/win64/OpenBazaar2Client-$PACKAGE_VERSION-Setup-64.exe

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
    electron-packager . OpenBazaar2 --out=dist -app-category-type=public.app-category.business --protocol-name=OpenBazaar --protocol=ob --platform=darwin --arch=x64 --icon=imgs/openbazaar2.icns --electron-version=${ELECTRONVER} --overwrite --app-version=$PACKAGE_VERSION
    # Client Only
    electron-packager . OpenBazaar2Client --out=dist -app-category-type=public.app-category.business --protocol-name=OpenBazaar --protocol=ob --platform=darwin --arch=x64 --icon=imgs/openbazaar2.icns --electron-version=${ELECTRONVER} --overwrite --app-version=$PACKAGE_VERSION

    echo 'Creating openbazaar-go folder in the OS X .app'
    mkdir dist/OpenBazaar2-darwin-x64/OpenBazaar2.app/Contents/Resources/openbazaar-go

    echo 'Moving binary to correct folder'
    mv dist/osx/openbazaard dist/OpenBazaar2-darwin-x64/OpenBazaar2.app/Contents/Resources/openbazaar-go/openbazaard
    chmod +x dist/OpenBazaar2-darwin-x64/OpenBazaar2.app/Contents/Resources/openbazaar-go/openbazaard

    echo 'Codesign the .app'
    codesign --force --deep --sign "$SIGNING_IDENTITY" dist/OpenBazaar2-darwin-x64/OpenBazaar2.app
    electron-installer-dmg dist/OpenBazaar2-darwin-x64/OpenBazaar2.app OpenBazaar2-$PACKAGE_VERSION --icon ./imgs/openbazaar2.icns --out=dist/OpenBazaar2-darwin-x64 --overwrite --background=./imgs/osx-finder_background.png --debug
    # Client Only
    codesign --force --deep --sign "$SIGNING_IDENTITY" dist/OpenBazaar2Client-darwin-x64/OpenBazaar2Client.app
    electron-installer-dmg dist/OpenBazaar2Client-darwin-x64/OpenBazaar2Client.app OpenBazaar2Client-$PACKAGE_VERSION --icon ./imgs/openbazaar2.icns --out=dist/OpenBazaar2Client-darwin-x64 --overwrite --background=./imgs/osx-finder_background.png --debug

    echo 'Codesign the DMG and zip'
    codesign --force --sign "$SIGNING_IDENTITY" dist/OpenBazaar2-darwin-x64/OpenBazaar2-$PACKAGE_VERSION.dmg
    cd dist/OpenBazaar2-darwin-x64/
    zip -q -r OpenBazaar2-mac-$PACKAGE_VERSION.zip OpenBazaar2.app
    cp -r OpenBazaar2.app ../osx/
    cp OpenBazaar2-mac-$PACKAGE_VERSION.zip ../osx/
    cp OpenBazaar2-$PACKAGE_VERSION.dmg ../osx/

    # Client Only
    cd ../../
    codesign --force --sign "$SIGNING_IDENTITY" dist/OpenBazaar2Client-darwin-x64/OpenBazaar2Client-$PACKAGE_VERSION.dmg
    cd dist/OpenBazaar2Client-darwin-x64/
    zip -q -r OpenBazaar2Client-mac-$PACKAGE_VERSION.zip OpenBazaar2Client.app
    cp -r OpenBazaar2Client.app ../osx/
    cp OpenBazaar2Client-mac-$PACKAGE_VERSION.zip ../osx/
    cp OpenBazaar2Client-$PACKAGE_VERSION.dmg ../osx/

    ;;
esac
