
To use Vscode over ssh on AIDA, the vs code server needs to be installed first. Normally this is done automatically when connecting via ssh to a server, instead the vs code server binaries needs to be copied over ssh to AIDA. Luckily this can be enabled in the VS code settings


Open the VS code user settings, eg via Command shift + P and add
```
"remote.SSH.localServerDownload": "always",
```
To the JSON list. After this you should be able to connect via SSH and it should sucessfully download the vs code server binaries over ssh and allow you to connect. 




To list current running vs code servers on the remote and restart them, run:
```
ps aux | grep -i vscode-server 
pkill -f vscode-server
```
This is recommended to do if things struggle, since restarting is always a good first step :)