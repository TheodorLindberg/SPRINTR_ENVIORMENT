# Web Services on AIDA

## Overview

The AIDA login node can host web services — a few are already running, such as **git** and **TissUUmaps**.

All access to these web services currently has to go through an SSH tunnel. Since multiple services need to run behind a single tunnel, a **reverse proxy** runs on AIDA to forward incoming traffic to the correct service based on domain name.

To use this setup from your local machine, you need:

1. An SSH tunnel to the AIDA login node's reverse proxy port (8080).
2. A local proxy (we recommend **Caddy**) that listens on ports 80/443, routes requests by domain name, and forwards them through the tunnel — while also giving you HTTPS.

---

## 1. Forward the AIDA Login Node's Port

Open the SSH tunnel, forwarding the login node's port 8080 to your local machine. Replace `login` with whatever hostname/alias you normally use to reach the node:

```bash
ssh -N -L 8080:127.0.0.1:8080 login
```

Once this is running, you can reach the nginx proxy at **http://localhost:8080**.

If you want an alias for the above command, we recommend adding the following line to your terminal enviorment, search online to find where to put this line for your terminal.
```bash
alias aida="ssh -Nf -L 8080:127.0.0.1:8080 login"
```

---

## 2. Install and Set Up Caddy

Caddy will listen locally on ports 80/443, route requests by domain, and forward them over the SSH tunnel — while also handling HTTPS so you avoid mixed-content/HTTP quirks.

### 2.1 Install Caddy

- **macOS (Homebrew):**
  ```bash
  brew install caddy
  ```
- **Other platforms:** search online or ask an AI assistant for install instructions for your OS.

### 2.2 Create a Caddyfile

```bash
touch Caddyfile
code Caddyfile
```

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

This forwards any request to `*.sprintr.localhost` to the AIDA reverse proxy (via the SSH tunnel on port 8080).

### 2.3 Run Caddy

```bash
caddy run
```

### 2.4 Trust Caddy's Local Certificate

```bash
caddy trust
```

Follow the prompts. This trusts Caddy's self-signed certificates so HTTPS works cleanly in your browser.

---

## 3. (Optional) Run Caddy as a Background Service on Mac

Instead of running `caddy run` manually every time, install it as a `brew` service:

```bash
cp ./Caddyfile /opt/homebrew/etc/Caddyfile
brew services start caddy
```

> **Note:** you may need to run `caddy trust` again after switching to the service-based setup.

---

## 4. Add Your Own Web Service

To expose your own service through this setup:

1. Host the service on the AIDA login node or cluster.
2. Add a `.conf` file for it, specifying the domain name and how nginx should reach your service.
3. Add that `.conf` file to the nginx configuration on AIDA.

See the infrastructure guide for details on the nginx configuration format and file placement.