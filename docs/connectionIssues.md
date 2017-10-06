Troubleshooting connection issues
=================================
### Local Bundled Server
comming soon...

### Local Stand-alone Server
1. Ensure the server is running.

### Remote Server
Check your JS console. If you are **not** seeing any red `WebSocket...` errors:

1. Ensure your server is running.
2. In the config file, ensure Addresses.Gateway has your server's IP embedded in it. For example, if your server ip is `123.45.6.78`, the `Gateway` value would be `/ip4/123.45.6.78/tcp/4002`.
3. In the client, ensure the port set in the server configuration UI matches the port value you set above:

![](https://github.com/OpenBazaar/openbazaar-desktop/blob/master/imgs/connectionIssues/setPortInUi.png)

4. Check the JSON-API section of your config file. Make sure:
 - Authenticated is true
 - SSL is true (and you have SSL checked in the client's server configuration)
 - SSLCert is the path to your certificate (see the next section for how to set up a certificate)
 - SSLKey is the path to your key
 - Username is your username
5. The password in your config file, in the JSON-API section, must be the hex-encoded SHA-256 hash of your plain text password. There are several options for setting it:
- In the remote server, in your OpenBazaar server directory, you can enter the command `go run openbazaard.go setapicreds` and follow the instructions.
- On Linux or Macintosh, you can use this command in your terminal: `echo -n yourpassword | sha256sum` (replace "yourpassword" with your actual password), and paste the hash into your config file.
- You can use an online hex generator (there are many options, just search for "create hex-encoded SHA-256 hash"), and paste the hash into your config file.

In the client, you should enter the plain text password in your server configuration.

---

If you are seeing the following error in your JS console:

![](https://github.com/OpenBazaar/openbazaar-desktop/blob/master/imgs/connectionIssues/sslProtocolError.png)

For your protection, the client will only connect to a remote server via SSL. The above error indicates that your server is not set-up to run SSL.

To enable SSL on your remote server, follow this [doc](https://github.com/OpenBazaar/openbazaar-go/blob/master/docs/ssl.md).

You may also find this [guide to remote server security helpful.](https://github.com/OpenBazaar/openbazaar-go/blob/master/docs/security.md#basic-authentication)

When you install the OpenBazaar.crt file on your client machine, be sure to enable it as a trusted certificate.

On OSX, this is done via the Always Trust button.

![](https://github.com/OpenBazaar/openbazaar-desktop/blob/master/imgs/connectionIssues/osxTrustCertificate.png)

On Windows, you should import the certificate using the [Microsoft Management Console.](http://www.thewindowsclub.com/manage-trusted-root-certificates-windows)

![](https://github.com/OpenBazaar/openbazaar-desktop/blob/master/imgs/connectionIssues/windowsCertManager.png)

For Linux, please follow step 2 in the next section.

---

If you are seeing the following error in your JS console:

![](https://github.com/OpenBazaar/openbazaar-desktop/blob/master/imgs/connectionIssues/sslBadHandshake.png)

It is likely one of two things:

1. You may have not properly specified your server ip when generating the server.csr file. When following this [doc](https://github.com/OpenBazaar/openbazaar-go/blob/master/docs/ssl.md), be sure to replace \<server-ip\> with the ip of your remote server when executing this command `openssl req -new -key server.key -out server.csr `...

2. If you're running on Linux, that error could also indicate that the certificate needs to be added to the trusted list. Here's how to do it on Ubuntu ([detailed instructions](http://blog.tkassembled.com/410/adding-a-certificate-authority-to-the-trusted-list-in-ubuntu/)):
  - First, install libnss3-tools, which contains the certutil command: `sudo apt-get install libnss3-tools`
  - Copy the public certificate authority file to the certificate store: `sudo cp my_ca.crt /usr/share/ca-certificates/`
  - We’ll now recompile the SSL CA list, adding our certificate: `sudo dpkg-reconfigure ca-certificates`

    This will lead to a ncurses menu. In this menu, choose ask, and scroll through the long list of trusted CAs until you   find your ‘my_ca.crt’ certificate authority file. Mark it for inclusion with Space, then hit Tab then Enter to finish up.

  - Finally, execute `certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n "My Homemade CA" -i my_ca.crt`.

---

If on Linux you are seeing an "ERR_INSECURE_RESPONSE" error, it is likely because the OS does not recognize the certificate as a trusted certificate. Complete step 2 in the section above. Not having done the last bullet point in that section is the stumbling block for most Linux users.

