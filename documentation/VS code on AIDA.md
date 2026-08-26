# Using VS Code Remote-SSH on AIDA

## Overview

VS Code's Remote-SSH feature normally installs the "VS Code Server" on the remote machine automatically the first time you connect — the server binary is downloaded directly onto the remote machine over the internet.

Because AIDA is air-gapped (no direct internet access), this automatic download fails. Instead, VS Code needs to be configured to download the server binaries **on your local machine** and transfer them to AIDA **over the SSH connection itself**. This guide shows how to enable that.

---

## 1. Configure VS Code to Use a Local Server Download

Open your VS Code **user settings** as JSON:

- Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
- Search for and select **"Preferences: Open User Settings (JSON)"**

Add the following entries to the JSON object:

```json
"remote.SSH.useLocalServer": true,
"remote.SSH.localServerDownload": "always",
"remote.SSH.useExecServer": false
```

| Setting | What it does |
|---|---|
| `remote.SSH.useLocalServer` | Enables downloading the server binaries locally instead of directly on the remote |
| `remote.SSH.localServerDownload` | Set to `"always"` so it downloads locally rather than trying (and failing) to fetch on the remote first |
| `remote.SSH.useExecServer` | Disables the newer exec-server connection method, which isn't compatible with this workaround |

Save the settings file.

---

## 2. Connect as Normal

You can now connect to AIDA via Remote-SSH as you normally would (`Cmd/Ctrl+Shift+P` → **"Remote-SSH: Connect to Host..."**).

VS Code will download the server binaries locally and transfer them to AIDA automatically over the SSH connection — no manual steps needed.

### Installing extensions

Extensions work the same way: when you install a plugin while connected to AIDA, VS Code downloads it on your local machine first, then transfers it to AIDA automatically. You don't need to do anything differently.

---

## 3. Troubleshooting: Restarting the VS Code Server

If the connection is misbehaving (e.g. hanging, extensions not loading, stale state), the first thing to try is restarting the VS Code Server process on AIDA.

**Check for running server processes:**

```bash
ps aux | grep -i vscode-server
```

**Kill them (forces a clean restart on your next connection):**

```bash
pkill -f vscode-server
```

After running this, reconnect via Remote-SSH in VS Code — a fresh server instance will start (and re-download if needed, per the settings above).

> **Tip:** if you run into issues with a Remote-SSH connection to AIDA, restarting the server this way is a good first troubleshooting step before digging further.


# Old guide
To use Vscode over ssh on AIDA, the vs code server needs to be installed first. Normally this is done automatically when connecting via ssh to a server, instead the vs code server binaries needs to be copied over ssh to AIDA. Luckily this can be enabled in the VS code settings


Open the VS code user settings, eg via Command shift + P and add
```
"remote.SSH.useLocalServer": true,
"remote.SSH.localServerDownload": "always",
"remote.SSH.useExecServer": false
```
To the JSON list. After this you should be able to connect via SSH and it should sucessfully download the vs code server binaries over ssh and allow you to connect. 

You can install plugins normally and they will be donwloaded on your local machine and transferd to AIDA automatically




To list current running vs code servers on the remote and restart them, run:
```
ps aux | grep -i vscode-server 
pkill -f vscode-server
```
This is recommended to do if things struggle, since restarting is always a good first step :)