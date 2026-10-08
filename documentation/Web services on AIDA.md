# Web Services on AIDA

## Overview

The AIDA login node can host web services. A few are already running, such as **git** and **TissUUmaps**.

All access to these web services currently has to go through an SSH tunnel. Because multiple services run behind a single tunnel, a **reverse proxy** (nginx) runs on AIDA and forwards incoming traffic to the correct service based on the domain name.

To use a service, you only need to:

1. Open an SSH tunnel to the AIDA login node's reverse proxy port (8080).
2. Open the service's address in your browser.

Optionally, you can set up **Caddy**, a local proxy that gives you HTTPS and shorter addresses without `:8080` (see section 3).

> **Prerequisite:** you must be able to connect with `ssh login`. If you can't yet, follow the **Connecting to AIDA via SSH** guide first.

---

## 1. Forward the AIDA Login Node's Port

You need an SSH tunnel that forwards the login node's port 8080 to port 8080 on your computer. The easiest way is to add the tunnel to your SSH config, so a short command opens it. This works the same on macOS, Linux and Windows.

### Recommended: add the tunnel to your SSH config

Open the same SSH config file you set up in the SSH guide (`~/.ssh/config` on macOS/Linux, `C:\Users\<you>\.ssh\config` on Windows) and add this block at the end:

```
Host aida
  Hostname 10.253.20.100
  User <your-aida-username>
  ProxyJump dspgateway
  LocalForward 8080 127.0.0.1:8080
```

Use the same `Hostname` and `User` as your `login` entry. The `LocalForward` line is what creates the tunnel.

Now open the tunnel with:

```bash
ssh aida
```

This logs you in to the login node **and** opens the tunnel. The tunnel stays open as long as that session is open, so leave the terminal window running (you can minimize it). When you're done, type `exit` or close the window.

If you only want the tunnel, without a shell on the node, use:

```bash
ssh -N aida
```

> **Why a separate `aida` entry instead of adding `LocalForward` to `login`?** If the tunnel were part of `login`, every extra `ssh login` session would try to open port 8080 again and print an "Address already in use" warning. A separate entry keeps normal logins and the tunnel apart.

### Alternative: the command without a config entry

You can also open the tunnel directly, without changing your config:

```bash
ssh -N -L 8080:127.0.0.1:8080 login
```

Leave this running while you use the services.

On macOS/Linux you can open the tunnel in the background with `-f`:

```bash
ssh -Nf aida
```

(Windows SSH doesn't support `-f`, so on Windows keep the tunnel in its own window as described above.)

---

## 2. Open a Service

With the tunnel running, open the service in your browser at:

```
http://<service>.sprintr.localhost:8080
```

For example:

```
http://tissuumaps.sprintr.localhost:8080
```

Replace `<service>` with the service's actual subdomain.

This works because browsers send any `*.localhost` address to your own computer, where the tunnel forwards it to nginx on AIDA. nginx then picks the right service based on the domain name.

---

## 3. (Optional) HTTPS with Caddy

The setup above uses plain HTTP. Most services work fine this way, but if a service misbehaves (for example, blocked content or broken logins because of missing HTTPS), or you'd rather not type `:8080`, you can add **Caddy**.

Caddy listens locally on ports 80/443, forwards requests over the SSH tunnel, and handles HTTPS. With Caddy running, services are available at `https://<service>.sprintr.localhost`.

### 3.1 Install Caddy

- **macOS (Homebrew):**
  ```bash
  brew install caddy
  ```
- **Windows** (choose one):
  - Scoop: `scoop install caddy`
  - Chocolatey (in an admin PowerShell): `choco install caddy`
  - Manual: download `caddy.exe` from https://caddyserver.com/download, put it in a folder such as `C:\caddy`, and add that folder to your PATH.
- **Other platforms:** see https://caddyserver.com/docs/install.

### 3.2 Create a Caddyfile

**macOS/Linux:**

```bash
touch Caddyfile
code Caddyfile
```

**Windows:**

```powershell
mkdir C:\caddy
cd C:\caddy
notepad Caddyfile
```

> On Windows, Notepad may save the file as `Caddyfile.txt`. Check with `dir` and rename it if needed: `Rename-Item Caddyfile.txt Caddyfile`

Paste in the following configuration:

```
{
    auto_https disable_redirects
}

*.sprintr.localhost {
    tls internal
    reverse_proxy localhost:8080
}
```

This forwards any request for `*.sprintr.localhost` to the AIDA reverse proxy through the SSH tunnel on port 8080.

### 3.3 Trust Caddy's Local Certificate

```bash
caddy trust
```

Follow the prompts. This makes your computer trust Caddy's self-signed certificates, so HTTPS works cleanly in your browser.

> **Windows:** run this in PowerShell **as Administrator**.

### 3.4 Run Caddy

From the folder containing your Caddyfile:

```bash
caddy run
```

Keep this running while you use the services.

### 3.5 (Optional) Run Caddy as a Background Service

Instead of running `caddy run` manually every time, you can run Caddy as a background service that starts automatically.

**macOS:**

```bash
cp ./Caddyfile /opt/homebrew/etc/Caddyfile
brew services start caddy
```

(On Intel Macs, the path is `/usr/local/etc/Caddyfile`.)

**Windows** (PowerShell **as Administrator**):

```powershell
sc.exe create caddy start= auto binPath= "C:\caddy\caddy.exe run --config C:\caddy\Caddyfile"
sc.exe start caddy
```

The space after `start=` and `binPath=` is required. If you installed Caddy with Scoop or Chocolatey, find the path to `caddy.exe` with `(Get-Command caddy).Source` and use that instead.

To remove the service later: `sc.exe stop caddy`, then `sc.exe delete caddy`.

> **Note (both platforms):** you may need to run `caddy trust` again after switching to the service, because the service creates its own certificates.

---

## 4. Troubleshooting

- **The page doesn't load at all:** check that the SSH tunnel is running. If you close the terminal or put your computer to sleep, the tunnel may stop and you need to open it again.
- **"Address already in use" when opening the tunnel:** a tunnel (or another program) is already using port 8080. If it's an old tunnel, close it first (close the window or session running it; for a background tunnel on macOS/Linux, `pkill -f "ssh -Nf aida"`).
- **A service partly works or refuses to log in:** it may need HTTPS. Set up Caddy (section 3).
- **Caddy won't start (Windows):** another program may be using port 80 or 443 (e.g. IIS or Skype). Run `netstat -ano | findstr ":80 :443"` to find the process ID, then look it up in Task Manager.
- **Certificate warnings in Firefox with Caddy:** Firefox uses its own certificate store. Go to `about:config` and set `security.enterprise_roots.enabled` to `true`. Chrome, Edge and Safari work without changes.
- **Command-line tools (e.g. `curl`) can't find `*.sprintr.localhost`:** browsers handle `.localhost` addresses automatically, but some tools don't. Add the specific subdomain to your hosts file (`/etc/hosts` on macOS/Linux, `C:\Windows\System32\drivers\etc\hosts` on Windows, edited as admin). Wildcards aren't supported, so add one line per service:
  ```
  127.0.0.1 tissuumaps.sprintr.localhost
  ```

---

## 5. Add Your Own Web Service

To expose your own service through this setup:

1. Host the service on the AIDA login node or cluster.
2. Add a `.conf` file for it, specifying the domain name and how nginx should reach your service.
3. Add that `.conf` file to the nginx configuration on AIDA.

See the infrastructure guide for details on the nginx configuration format and file placement.