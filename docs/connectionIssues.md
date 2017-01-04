Troubleshooting connection issues
=================================
<<<<<<< HEAD
### Local Bundled Server
comming soon...

### Local Stand-alone Server
1. Ensure the server is running.

### Remote Server
Check your JS console. If you are not seeing any red `WebSocket...` errors:

1. Ensure your server is running.
2. In the config file, ensure Addresses.Gateway has your server's IP embedded in it. For example, if your server ip is `123.45.6.78`, the `Gateway` value would be `/ip4/138.197.205.97/tcp/4002`.
3. In the client, ensure the port set in the server configuration UI matches the port value you set above:

![](https://github.com/OpenBazaar/openbazaar-desktop/blob/server-connect-ui/imgs/connectionIssues/setPortInUi.png)

If you are seeing the following error in your JS console:
![](https://github.com/OpenBazaar/openbazaar-desktop/blob/server-connect-ui/imgs/connectionIssues/sslProtocolError.png)

For your protection, the client will only connect to a remote server via SSL. The above error indicates that you're server is not set-up to run SSL. To enable SSL, follow this [doc](https://github.com/OpenBazaar/openbazaar-go/blob/master/docs/ssl.md).

When you install the rootCA.crt file on your client machine, be sure to enable it as a trusted certificate. On OSX, this is done via the Always Trust button.
![](https://github.com/OpenBazaar/openbazaar-desktop/blob/server-connect-ui/imgs/connectionIssues/osxTrustCertificate.png)

If you are seeing the following error in your JS console:
![](https://github.com/OpenBazaar/openbazaar-desktop/blob/server-connect-ui/imgs/connectionIssues/sslBadHandshake.png)

You did not properly specify your server ip when generating the server.csr file. When following this [doc](https://github.com/OpenBazaar/openbazaar-go/blob/master/docs/ssl.md), be sure to replace <server-ip> with the ip of your remote server when executing this command `openssl req -new -key server.key -out server.csr `...
