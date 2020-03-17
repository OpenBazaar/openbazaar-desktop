#!/bin/bash

## Version 2.0.0
##
## Usage
## ./build.sh
##
## OS supported:
## win32 win64 linux32 linux64 linuxarm osx
##


ELECTRONVER=1.8.7
NODEJSVER=5.1.1

OS="${1}"
if [ -z "${2}" ]; then
SERVERTAG='latest'
else
SERVERTAG=tags/${2}
fi
echo "Building with openbazaar-go/$SERVERTAG"

# Get Version
PACKAGE_VERSION=$(node -p 'require("./package").version')
echo "OpenBazaar Version: $PACKAGE_VERSION"

# Create temp build dirs
mkdir dist/
rm -rf dist/*
mkdir OPENBAZAAR_TEMP/
rm -rf OPENBAZAAR_TEMP/*

echo 'Preparing to build installers...'

echo 'Installing npm packages...'
npm i -g npm@5.2
npm install electron-packager -g --silent
npm install npm-run-all -g --silent
npm install grunt-cli -g --silent
npm install grunt --save-dev --silent
npm install grunt-electron-installer --save-dev --silent
npm install --silent

rvm reinstall ruby

echo 'Building OpenBazaar app...'
npm run build

echo 'Copying transpiled files into js folder...'
cp -rf prod/* js/

echo "We are building: ${BINARY}"

case "$TRAVIS_OS_NAME" in
  "linux")

    echo 'Linux builds'
    echo 'Making dist directories'
    mkdir dist/linux64

    sudo apt-get install rpm

    echo 'Install npm packages for Linux'
    npm install -g --save-dev electron-installer-debian --silent
    npm install -g --save-dev electron-installer-redhat@2.0.0 --silent

    # Install libgconf2-4
    sudo apt-get install libgconf2-4 libgconf-2-4

    # Install rpmbuild
    sudo apt-get --only-upgrade install rpm

    # Ensure fakeroot is installed
    sudo apt-get install fakeroot

    # Retrieve Latest Server Binaries
    sudo apt-get install jq
    cd OPENBAZAAR_TEMP/
    curl -u $GITHUB_USER:$GITHUB_TOKEN -s https://api.github.com/repos/OpenBazaar/openbazaar-go/releases/$SERVERTAG > release.txt
    cat release.txt | jq -r ".assets[].browser_download_url" | xargs -n 1 curl -L -O
    cd ..

    APPNAME="openbazaar2"

    echo 'Building Linux 64-bit Installer....'

    echo "Packaging Electron application"
    electron-packager . ${APPNAME} --platform=linux --arch=x64 --electronVersion=${ELECTRONVER} --overwrite --ignore="OPENBAZAAR_TEMP" --prune --out=dist

    echo 'Move go server to electron app'
    mkdir dist/${APPNAME}-linux-x64/resources/openbazaar-go/
    cp -rf OPENBAZAAR_TEMP/openbazaar-go-linux-amd64 dist/${APPNAME}-linux-x64/resources/openbazaar-go
    rm -rf OPENBAZAAR_TEMP/*
    mv dist/${APPNAME}-linux-x64/resources/openbazaar-go/openbazaar-go-linux-amd64 dist/${APPNAME}-linux-x64/resources/openbazaar-go/openbazaard
    rm -rf dist/${APPNAME}-linux-x64/resources/app/.travis
    chmod +x dist/${APPNAME}-linux-x64/resources/openbazaar-go/openbazaard

    echo 'Create debian archive'
    electron-installer-debian --config .travis/config_amd64.json

    echo 'Create RPM archive'
    electron-installer-redhat --config .travis/config_x86_64.json

    APPNAME="openbazaar2client"

    echo 'Building Linux 64-bit Installer....'

    echo "Packaging Electron application"
    electron-packager . ${APPNAME} --platform=linux --arch=x64 --ignore="OPENBAZAAR_TEMP" --electronVersion=${ELECTRONVER} --overwrite --prune --out=dist

    echo 'Create debian archive'
    electron-installer-debian --config .travis/config_amd64.client.json

    echo 'Create RPM archive'
    electron-installer-redhat --config .travis/config_x86_64.client.json

    ;;

  "osx")

    brew update
    brew remove jq
    brew link oniguruma
    brew install jq
    brew link --overwrite fontconfig gd gnutls jasper libgphoto2 libicns libtasn1 libusb libusb-compat little-cms2 nettle openssl sane-backends webp wine git-lfs gnu-tar dpkg xz
    brew install freetype graphicsmagick
    brew link xz
    brew remove openssl
    brew install openssl
    brew link freetype graphicsmagick mono

    # Retrieve Latest Server Binaries
    cd OPENBAZAAR_TEMP/
    curl -u $GITHUB_USER:$GITHUB_TOKEN -s https://api.github.com/repos/OpenBazaar/openbazaar-go/releases/$SERVERTAG > release.txt
    cat release.txt | jq -r ".assets[].browser_download_url" | xargs -n 1 curl -L -O
    cd ..

    if [[ $BINARY == 'win' ]]; then

        brew link --overwrite fontconfig gd gnutls jasper libgphoto2 libicns libtasn1 libusb libusb-compat little-cms2 nettle openssl sane-backends webp wine git-lfs gnu-tar dpkg xz
        brew link libgsf glib pcre
        brew remove osslsigncode
        brew install mono osslsigncode
        brew reinstall openssl@1.1

        brew cask install wine-stable

        # WINDOWS 64
        echo 'Building Windows 64-bit Installer...'
        mkdir dist/win64

        export WINEARCH=win64

        npm i electron-packager

        cd node_modules/electron-packager
        npm install rcedit
        cd ../..

        echo 'Running Electron Packager...'
        node_modules/electron-packager/bin/electron-packager.js . OpenBazaar2 --asar --out=dist --protocol-name=OpenBazaar --ignore="OPENBAZAAR_TEMP" --win32metadata.ProductName="OpenBazaar2" --win32metadata.CompanyName="OpenBazaar" --win32metadata.FileDescription='Decentralized p2p marketplace for Bitcoin' --win32metadata.OriginalFilename=OpenBazaar2.exe --protocol=ob --platform=win32 --arch=x64 --icon=imgs/openbazaar2.ico --electron-version=${ELECTRONVER} --overwrite

        echo 'Copying server binary into application folder...'
        cp -rf OPENBAZAAR_TEMP/openbazaar-go-windows-4.0-amd64.exe dist/OpenBazaar2-win32-x64/resources/
        cp -rf OPENBAZAAR_TEMP/libwinpthread-1.win64.dll dist/OpenBazaar2-win32-x64/resources/libwinpthread-1.dll
        mkdir dist/OpenBazaar2-win32-x64/resources/openbazaar-go
        mv dist/OpenBazaar2-win32-x64/resources/openbazaar-go-windows-4.0-amd64.exe dist/OpenBazaar2-win32-x64/resources/openbazaar-go/openbazaard.exe
        mv dist/OpenBazaar2-win32-x64/resources/libwinpthread-1.dll dist/OpenBazaar2-win32-x64/resources/openbazaar-go/libwinpthread-1.dll

        echo 'Building Installer...'
        grunt -v create-windows-installer --appname=OpenBazaar2 --obversion=$PACKAGE_VERSION --appdir=dist/OpenBazaar2-win32-x64 --outdir=dist/win64
        mv dist/win64/OpenBazaar2Setup.exe dist/win64/OpenBazaar2-$PACKAGE_VERSION-Setup-64.exe
        mv dist/win64/RELEASES dist/win64/RELEASES-x64

        #### CLIENT ONLY
        echo 'Running Electron Packager...'
        electron-packager . OpenBazaar2Client --asar --out=dist --protocol-name=OpenBazaar --ignore="OPENBAZAAR_TEMP" --win32metadata.ProductName="OpenBazaar2Client" --win32metadata.CompanyName="OpenBazaar" --win32metadata.FileDescription='Decentralized p2p marketplace for Bitcoin' --win32metadata.OriginalFilename=OpenBazaar2Client.exe --protocol=ob --platform=win32 --arch=x64 --icon=imgs/openbazaar2.ico --electron-version=${ELECTRONVER} --overwrite

        echo 'Building Installer...'
        grunt -v create-windows-installer --appname=OpenBazaar2Client --obversion=$PACKAGE_VERSION --appdir=dist/OpenBazaar2Client-win32-x64 --outdir=dist/win64
        mv dist/win64/OpenBazaar2ClientSetup.exe dist/win64/OpenBazaar2Client-$PACKAGE_VERSION-Setup-64.exe

        echo 'Sign the installer'
        osslsigncode sign -t http://timestamp.digicert.com -h sha1 -key .travis/ob1.pvk -pass "$OB1_SECRET" -certs .travis/ob1.spc -in dist/win64/OpenBazaar2-$PACKAGE_VERSION-Setup-64.exe -out dist/win64/OpenBazaar2-$PACKAGE_VERSION-Setup-64.exe
        osslsigncode sign -t http://timestamp.digicert.com -h sha1 -key .travis/ob1.pvk -pass "$OB1_SECRET" -certs .travis/ob1.spc -in dist/win64/OpenBazaar2Client-$PACKAGE_VERSION-Setup-64.exe -out dist/win64/OpenBazaar2Client-$PACKAGE_VERSION-Setup-64.exe

        mv dist/win64/RELEASES-x64 dist/win64/RELEASES

    else

        # OSX
        echo 'Building OSX Installer'
        mkdir dist/osx

        # Install the DMG packager
        echo 'Installing electron-installer-dmg'
        npm install -g electron-installer-dmg

        # Sign openbazaar-go binary
        echo 'Signing Go binary'
        mv OPENBAZAAR_TEMP/openbazaar-go-darwin-10.6-amd64 dist/osx/openbazaard
        rm -rf OPENBAZAAR_TEMP/*
        codesign --force --sign "$SIGNING_IDENTITY2" --timestamp --options runtime dist/osx/openbazaard

        # Notarize the zip files
        UPLOAD_INFO_PLIST="uploadinfo.plist"
        REQUEST_INFO_PLIST="request.plist"
        touch ${UPLOAD_INFO_PLIST}

        wait_for_notarization() {
          while true; do \

            echo "Checking Apple for notarization status..."; \
            /usr/bin/xcrun altool --notarization-info `/usr/libexec/PlistBuddy -c "Print :notarization-upload:RequestUUID" $UPLOAD_INFO_PLIST` -u $APPLE_ID -p $APPLE_PASS --output-format xml > "$REQUEST_INFO_PLIST" ;\

            cat $REQUEST_INFO_PLIST

            if [[ `/usr/libexec/PlistBuddy -c "Print :notarization-info:Status" ${REQUEST_INFO_PLIST}` != "in progress" ]] || [[ "$requestUUID" == "" ]] ; then \

               # check if it has been uploaded already and get the RequestUUID from the error message
               echo "Checking if binary has already been uploaded..."; \
               message=`/usr/libexec/PlistBuddy -c "Print :product-errors:0:message" $UPLOAD_INFO_PLIST`;\
               if [[ ${message} =~ ^ERROR\ ITMS-90732* ]]; then \
                   prefix="ERROR ITMS-90732: \"The software asset has already been uploaded. The upload ID is "; \
                   suffix="\" at SoftwareAssets\/EnigmaSoftwareAsset"; \
                   requestUUID=`echo "${message}" | sed -e "s/^$prefix//" -e "s/$suffix$//"`; \

                   echo "Binary has already been uploaded. Checking Apple status for request ${requestUUID}..."; \
                   /usr/bin/xcrun altool --notarization-info ${requestUUID} -u $APPLE_ID -p $APPLE_PASS --output-format xml > "$REQUEST_INFO_PLIST" ;\
               fi ;\

               if [[ `/usr/libexec/PlistBuddy -c "Print :notarization-info:Status" ${REQUEST_INFO_PLIST}` == "success" ]]; then \
                echo "Binary has been notarized"; \
                break; \
               fi; \
            fi ;\
            echo "Waiting 30 seconds to check status again..."; \
            sleep 30 ;\
          done
        }

        extract_app() {

            # use process redirection to capture the mount point and dev entry
            IFS=$'\n' read -rd '\n' mount_point dev_entry < <(
                # mount the diskimage; leave out -readonly if making changes to the filesystem
                hdiutil attach -readonly -plist "$1" | \

                # convert output plist to json
                plutil -convert json - -o - | \

                # extract mount point and dev entry
                jq -r '
                    .[] | .[] |
                    select(."volume-kind" == "hfs") |
                    ."mount-point" + "\n" + ."dev-entry"
                '
            )

            # work with the zip file
            cp -rf "${mount_point}/${2}.app" dist/osx

            # unmount the disk image
            hdiutil detach "$dev_entry"

        }

        if [[ ${BINARY} == 'osx' ]]; then

            echo 'Running Electron Packager...'
            electron-packager . OpenBazaar2 --out=dist -app-category-type=public.app-category.business --protocol-name=OpenBazaar --ignore="OPENBAZAAR_TEMP" --protocol=ob --platform=darwin --arch=x64 --icon=imgs/openbazaar2.icns --electron-version=${ELECTRONVER} --overwrite --app-version=$PACKAGE_VERSION

            echo 'Creating openbazaar-go folder in the OS X .app'
            mkdir dist/OpenBazaar2-darwin-x64/OpenBazaar2.app/Contents/Resources/openbazaar-go

            echo 'Moving binary to correct folder'
            mv dist/osx/openbazaard dist/OpenBazaar2-darwin-x64/OpenBazaar2.app/Contents/Resources/openbazaar-go/openbazaard
            chmod +x dist/OpenBazaar2-darwin-x64/OpenBazaar2.app/Contents/Resources/openbazaar-go/openbazaard

            echo 'Codesign the .app'
            codesign -s "$SIGNING_IDENTITY2" dist/OpenBazaar2-darwin-x64/OpenBazaar2.app/Contents/Frameworks/Electron\ Framework.framework/Versions/A/Libraries/libffmpeg.dylib
            codesign -s "$SIGNING_IDENTITY2" dist/OpenBazaar2-darwin-x64/OpenBazaar2.app/Contents/Frameworks/Electron\ Framework.framework/Versions/A/Libraries/libnode.dylib
            codesign --force --options runtime --deep --sign "$SIGNING_IDENTITY2" "dist/OpenBazaar2-darwin-x64/OpenBazaar2.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Resources/crashpad_handler"
            codesign --force --options runtime --deep --sign "$SIGNING_IDENTITY2"  "dist/OpenBazaar2-darwin-x64/OpenBazaar2.app/Contents/Frameworks/Squirrel.framework/Versions/A/Resources/ShipIt"

            codesign --force --deep --sign "$SIGNING_IDENTITY2" --timestamp --options runtime --entitlements openbazaar.entitlements dist/OpenBazaar2-darwin-x64/OpenBazaar2.app
            electron-installer-dmg dist/OpenBazaar2-darwin-x64/OpenBazaar2.app OpenBazaar2-$PACKAGE_VERSION --icon ./imgs/openbazaar2.icns --out=dist/OpenBazaar2-darwin-x64 --overwrite --background=./imgs/osx-finder_background.png --debug

            echo 'Codesign the DMG and zip'
            codesign --force --sign "$SIGNING_IDENTITY2" --timestamp --options runtime --entitlements openbazaar.entitlements dist/OpenBazaar2-darwin-x64/OpenBazaar2-$PACKAGE_VERSION.dmg
            cd dist/OpenBazaar2-darwin-x64/
            zip -q -r OpenBazaar2-mac-$PACKAGE_VERSION.zip OpenBazaar2.app
            cp -r OpenBazaar2.app ../osx/
            cp OpenBazaar2-mac-$PACKAGE_VERSION.zip ../osx/
            cp OpenBazaar2-$PACKAGE_VERSION.dmg ../osx/

            cd ../..

            zip -q -r dist/osx/OpenBazaar2.zip dist/OpenBazaar2-darwin-x64/OpenBazaar2-$PACKAGE_VERSION.dmg

            # Upload to apple and notarize
            echo "Uploading binary to Apple Notarization server for package ${PACKAGE_VERSION}..."
            xcrun altool --notarize-app --primary-bundle-id "org.openbazaar.desktop-${PACKAGE_VERSION}" --username "$APPLE_ID" --password "$APPLE_PASS" --file dist/osx/OpenBazaar2.zip --output-format xml > ${UPLOAD_INFO_PLIST}
            wait_for_notarization

            echo "Stapling ticket to the DMG..."
            xcrun stapler staple dist/osx/OpenBazaar2-$PACKAGE_VERSION.dmg

            extract_app "dist/osx/OpenBazaar2-$PACKAGE_VERSION.dmg" "OpenBazaar2"

            zip -q -r dist/osx/OpenBazaar2-mac-$PACKAGE_VERSION.zip dist/osx/OpenBazaar2.app

        else

            # Client Only
            electron-packager . OpenBazaar2Client --out=dist -app-category-type=public.app-category.business --protocol-name=OpenBazaar --ignore="OPENBAZAAR_TEMP" --protocol=ob --platform=darwin --arch=x64 --icon=imgs/openbazaar2.icns --electron-version=${ELECTRONVER} --overwrite --app-version=$PACKAGE_VERSION

            codesign -s "$SIGNING_IDENTITY2" dist/OpenBazaar2Client-darwin-x64/OpenBazaar2Client.app/Contents/Frameworks/Electron\ Framework.framework/Versions/A/Libraries/libffmpeg.dylib
            codesign -s "$SIGNING_IDENTITY2" dist/OpenBazaar2Client-darwin-x64/OpenBazaar2Client.app/Contents/Frameworks/Electron\ Framework.framework/Versions/A/Libraries/libnode.dylib
            codesign --force --options runtime --deep --sign "$SIGNING_IDENTITY2" "dist/OpenBazaar2Client-darwin-x64/OpenBazaar2Client.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Resources/crashpad_handler"
            codesign --force --options runtime --deep --sign "$SIGNING_IDENTITY2"  "dist/OpenBazaar2Client-darwin-x64/OpenBazaar2Client.app/Contents/Frameworks/Squirrel.framework/Versions/A/Resources/ShipIt"

            codesign --force --deep --sign "$SIGNING_IDENTITY2" --timestamp --options runtime --entitlements openbazaar.entitlements dist/OpenBazaar2Client-darwin-x64/OpenBazaar2Client.app
            electron-installer-dmg dist/OpenBazaar2Client-darwin-x64/OpenBazaar2Client.app OpenBazaar2Client-$PACKAGE_VERSION --icon ./imgs/openbazaar2.icns --out=dist/OpenBazaar2Client-darwin-x64 --overwrite --background=./imgs/osx-finder_background.png --debug

            # Client Only
            codesign --force --sign "$SIGNING_IDENTITY2" --timestamp --options runtime --entitlements openbazaar.entitlements dist/OpenBazaar2Client-darwin-x64/OpenBazaar2Client-$PACKAGE_VERSION.dmg
            cd dist/OpenBazaar2Client-darwin-x64/
            zip -q -r OpenBazaar2Client-mac-$PACKAGE_VERSION.zip OpenBazaar2Client.app
            cp -r OpenBazaar2Client.app ../osx/
            cp OpenBazaar2Client-mac-$PACKAGE_VERSION.zip ../osx/
            cp OpenBazaar2Client-$PACKAGE_VERSION.dmg ../osx/

            cd ../..

            zip -q -r dist/osx/OpenBazaar2Client.zip dist/OpenBazaar2Client-darwin-x64/OpenBazaar2Client-$PACKAGE_VERSION.dmg

            echo "Uploading client only binary to Apple Notarization server..."
            xcrun altool --notarize-app --primary-bundle-id "org.openbazaar.desktopclient-$PACKAGE_VERSION" --username "$APPLE_ID" --password "$APPLE_PASS" --file dist/osx/OpenBazaar2Client.zip --output-format xml > $UPLOAD_INFO_PLIST
            wait_for_notarization

            echo "Stapling ticket to the DMG..."
            xcrun stapler staple dist/osx/OpenBazaar2Client-$PACKAGE_VERSION.dmg

            extract_app "dist/osx/OpenBazaar2Client-$PACKAGE_VERSION.dmg" "OpenBazaar2Client"

            zip -q -r dist/osx/OpenBazaar2Client-mac-$PACKAGE_VERSION.zip dist/osx/OpenBazaar2Client.app
        fi

    fi

  ;;
esac
