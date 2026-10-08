# Connecting to AIDA via SSH

## Overview

The AIDA nodes (such as the **login** node and **worker** nodes) are virtual machines in the AIDA Data Science Platform (DSP). They can't be reached directly from the internet. Every connection goes through the DSP gateway, `dsp.aida.scilifelab.se`, which SSH jumps through automatically once your config is set up.

With the configuration below, you can connect with a short command such as:

```bash
ssh login
```

This guide is a shortened version of the official AIDA guide, adapted to our project's nodes:
**https://datahub.aida.scilifelab.se/docs/dsp-vm-access/**

---

## 1. Before You Start

You need:

- **A DSP account.** You should be able to log in to the DSP web interface at https://dsp.aida.scilifelab.se. If you can't, see the official first-login guide: https://datahub.aida.scilifelab.se/docs/dsp-first-login
- **An SSH key that has been added to the nodes.** See step 2.

---

## 2. Get Your SSH Key Onto the Nodes

The `login` and `worker` nodes are shared machines that already exist, so your key has to be added to them by someone who manages them. **Contact an administrator** and ask them to add your public key.

If you don't have an SSH key yet, create one. This works in the macOS/Linux terminal and in Windows PowerShell:

```bash
ssh-keygen -t ed25519
```

Press Enter to accept the default location. Setting a passphrase is recommended.

Send the administrator your **public** key, the file ending in `.pub`:

- **macOS/Linux:** `~/.ssh/id_ed25519.pub`
- **Windows:** `C:\Users\<you>\.ssh\id_ed25519.pub`

> **Never share the file without `.pub`.** That is your private key.

### Avoid typing your passphrase every time (optional)

If your key has a passphrase, add it to the SSH agent once per session and SSH will stop asking:

```bash
ssh-add
```

---

## 3. Create Your SSH Config

Open (or create) your SSH config file:

- **macOS/Linux:** `~/.ssh/config`
- **Windows:** `C:\Users\<you>\.ssh\config` (no file extension)

Paste in the following, then **replace the placeholders with your own details**:

- `<your-dsp-email>`: the email address you use to log in to DSP (e.g. `firstname.lastname.1234@student.uu.se`)
- `<your-aida-username>`: your username on the AIDA nodes

```
ControlMaster auto
ControlPersist 1800
ControlPath ~/.ssh/cm-%C

Host dspgateway
  Hostname dsp.aida.scilifelab.se
  User <your-dsp-email>

Host 10.253.16.*
  ProxyJump dspgateway
  User <your-aida-username>

Host worker
  Hostname 10.253.20.119
  User <your-aida-username>
  ProxyJump dspgateway

Host login
  Hostname 10.253.20.100
  User <your-aida-username>
  ProxyJump dspgateway
```

### What each part does

- **`ControlMaster` / `ControlPersist` / `ControlPath`**: after you log in once, SSH keeps that connection open for 30 minutes (1800 seconds) and reuses it for new sessions and tunnels. Without this, you'd have to go through the browser login (step 4) **every time** you connect.
- **`dspgateway`**: the gateway every other connection jumps through.
- **`10.253.16.*`**: lets you connect to any instance in that address range by IP, e.g. `ssh 10.253.16.42`.
- **`worker` / `login`**: short names for our project's nodes.

### Windows users

The built-in Windows OpenSSH does **not** support connection sharing. **Remove the first three lines** (`ControlMaster`, `ControlPersist`, `ControlPath`), or SSH will fail with errors.

The downside is that you'll have to do the browser login every time you open a new SSH connection or tunnel. If that gets tedious, install **WSL** (Windows Subsystem for Linux) and use SSH from there instead, following the macOS/Linux instructions. Connection sharing works normally in WSL.

---

## 4. Connect

```bash
ssh login
```

(or `ssh worker`)

The first time, a few things happen:

1. **Verify the gateway's host key.** SSH asks whether you trust the gateway. Check that the fingerprint it shows matches the official one before typing `yes`:
   ```
   SHA256:vg/InkHbVMb3FEyouth7f+WLi1OtEKgOJ88q49fVmj0 (ED25519)
   ```
2. **Log in through your browser.** The terminal shows a banner with a link. Open it and log in with **Life Science Login**. When the page says you're logged in, go back to the terminal and press **Enter**.
3. **Accept the node's host key.** SSH asks whether you trust the `login` (or `worker`) node. Type `yes`.

You should now be logged in to the node. With connection sharing enabled, new connections will skip the browser step.

---

## 5. Troubleshooting

### Connection times out, or you reach the wrong machine

The IP addresses for `worker` and `login` may be different for your project, or may have changed. Check the correct addresses in the DSP web interface under **Compute → Instances**:

**https://dsp.aida.scilifelab.se/project/instances/**

Update the `Hostname` lines in your config to match.

### `WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!`

This can happen when a machine is recreated and reuses an IP address. If you know the machine was recreated, SSH prints a command to remove the old entry, typically:

```bash
ssh-keygen -R 10.253.20.100
```

If you're not sure why the key changed, ask an administrator before continuing.

### `Permission denied (publickey)`

- Your key may not have been added yet. Check with the administrator.
- Check that the `User` lines in your config match your own usernames.
- Test the gateway on its own with `ssh dspgateway`. If that fails, the problem is with the gateway login (your DSP email or Life Science Login), not the node.

### See what SSH is doing

Add `-v` for detailed output, which helps when asking for help:

```bash
ssh -v login
```

---

## Next Steps

To reach web services hosted on AIDA (such as git and TissUUmaps), see the **Web Services on AIDA** guide. It uses the `login` host defined here.