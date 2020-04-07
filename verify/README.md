### Verify Binaries

This document and associated scripts are derivations of the approach Bitcoin Core uses (https://github.com/bitcoin/bitcoin/edit/master/contrib/verifybinaries).

#### Preparation:

Make sure you obtain the proper release signing key and verify the fingerprint with several independent sources.

```sh
gpg --fingerprint "Brian Hoffman [Open Bazaar] <brian@openbazaar.org>"
pub   rsa2048 2014-05-05 [SC]
      F186 A6A4 CF94 98AB E58F  53B9 DFEE B5A2 438F A17C
uid           [ultimate] Brian Hoffman [Open Bazaar] <brian@openbazaar.org>
```

#### Usage:

The verifyBinaries.sh script attempts to download the signature file `SHA256SUMS.<version>.asc` from https://openbazaar.org.

It first checks if the signature passes, and then downloads the files specified in the file, and checks if the hashes of these files match those that are specified in the signature file.

The script returns 0 if everything passes the checks. It returns 1 if either the signature check or the hash check doesn't pass. If an error occurs the return value is 2.


```sh
./verifyBinaries.sh 2.0.0
./verifyBinaries.sh 2.0.0-rc1
```

If you do not want to keep the downloaded binaries, specify anything as the second parameter.

```sh
./verifyBinaries.sh 2.0.0 delete
```
