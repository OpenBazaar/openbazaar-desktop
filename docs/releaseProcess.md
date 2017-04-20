Release Process
====================

Before every release:

* Update translations see [doc TBD].
* Update version in sources (see below)
* Write release notes (see below)

### First time / New builders

TBD

### OpenBazaar maintainer/release engineers, update version in sources

Update the following:

* package.json
* Gruntfile.js
* build.sh
* .travis/config_amd64.json
* .travis/config_ia32.json

Write release notes. git shortlog helps a lot, for example:

    git shortlog --no-merges v2.0.0..v2.0.1

Generate list of authors:

    git log --format='%aN' | sort -ui | sed -e 's/^/- /'

Tag version (or release candidate) in git

    git tag -s v(new version, e.g. 0.8.0)

### Push tag to initiate Travis binary build process

Once a signed release tag has been pushed to the repository Travis will begin to build binaries for all operating systems
and upload them to proper GitHub release location.

### After Travis CI has successfully completed the build

- Create `SHA256SUMS.<version>.asc` for the builds, and GPG-sign it:

Make sure to set the environment variables for the GPG signing key id before running the script.

```bash
cd verify
./generateHashes.sh ${VERSION} [binaryFolder]
```

The list of files should be:
```
OpenBazaar2-${VERSION}-full.nupkg
OpenBazaar2-${VERSION}-Setup-32.exe
OpenBazaar2-${VERSION}-Setup-64.exe
OpenBazaar2-${VERSION}.dmg
OpenBazaar2-mac-${VERSION}.zip
openbazaar2_${VERSION}_amd64.deb
openbazaar2_${VERSION}_i386.deb
```

- Upload `SHA256SUMS.${VERSION}.asc` from last step, to the openbazaar.org server
  into `../domains/openbazaar.org/html/releases`

- Update OpenBazaar.org version

  - Update website downloads page

- Announce the release:

  - OpenBazaar Slack

  - OpenBazaar Twitter (@openbazaar)

  - blog.openbazaar.org blog post

  - /r/Bitcoin, /r/btc, /r/OpenBazaar

  - Facebook
