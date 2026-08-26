# Packaging and Installing Conda Environments on AIDA

## Overview

AIDA nodes don't have direct internet access (they're air-gapped), so you can't just run `conda env create` directly on a node. Instead, the workflow is:

1. Build the Conda environment on a machine that **does** have internet access.
2. Package ("pack") that environment into a single `.tar.gz` file.
3. Upload the file to shared storage on AIDA.
4. Unpack and activate it locally on each AIDA node that needs it.

This guide walks through that process end to end.

---

## Prerequisites

- **Conda** installed on a non-air-gapped machine (i.e. one with internet access).
- **x86_64 architecture is required.** AIDA nodes run on x86, so the environment must be built for x86 too — it will not work if built on an ARM machine.
  - If you're on **Apple Silicon (M1/M2/M3/etc.)**, you cannot build a working environment directly. Instead:
    - Use an x86 machine, **or**
    - Build inside a Docker container running an x86 image (e.g. via `--platform linux/amd64`), **or**
    - Use a remote x86 server.

---

## 1. Create the Conda Environment

You'll need an `environment.yml` file describing the packages your environment needs. If you don't already have one, it typically looks something like:

```yaml
name: sprintr_mill
channels:
  - conda-forge
dependencies:
  - python=3.10
  - numpy
  - pytorch
  ...
```

Create the environment from it:

```bash
conda env create -f environment.yml
```

The environment's name is taken from the `name:` field inside the `.yml` file (in this example, `sprintr_mill`).

Activate it:

```bash
conda activate sprintr_mill
```

### Save an exact record of installed packages (optional but recommended)

Once the environment is set up, it's good practice to export the exact list of installed packages. This gives you a reproducible record separate from your original `environment.yml`:

```bash
conda env export --no-builds > sprintr_mill-v1.yml
```

`--no-builds` omits build-specific hashes so the file is more portable across systems.

---

## 2. Package the Environment with conda-pack

`conda-pack` bundles an entire Conda environment — all its files and dependencies — into a single archive that can be copied to another machine and used **without needing Conda installed there**. This is what makes it possible to run the environment on an air-gapped AIDA node.

### Install conda-pack

```bash
conda install -c conda-forge conda-pack
```

### Create the archive

```bash
conda-pack -n sprintr_mill -o sprintr_mill-v1.tar.gz
```

This converts the environment named `sprintr_mill` into a portable file called `sprintr_mill-v1.tar.gz`.

> **Tip:** Include a version number in the filename (`-v1`, `-v2`, etc.) so you can track changes over time without overwriting older environments still in use.

---

## 3. Upload the Archive to AIDA

Use `scp` to copy the packed environment to shared storage on AIDA, so any node can access it:

```bash
scp sprintr_mill-v1.tar.gz login:/data/datasets/envs
```

> Replace `/data/datasets/envs` with the actual shared environment storage path if different, and `login` with your usual way of reaching the AIDA login node.

The idea is that the archive is uploaded **once** to shared storage, and each individual node then sets up its own local copy of the environment from it (see next step).

---

## 4. Install the Environment on an AIDA Node

Each node needs its own local, unpacked copy of the environment — this must be repeated **per node**, not just once for the whole cluster.

> **Why per node?** The unpacked Python environment should live on each node's local disk (not shared storage) for performance and path-correctness reasons. Automating this step via Ansible is planned for the future, but for now it's manual.

### 4.1 Create a directory and extract the archive

`/opt/envs` may not exist yet on a given node — create it if needed:

```bash
mkdir -p /opt/envs/sprintr_mill-v1
tar -xzf sprintr_mill-v1.tar.gz -C /opt/envs/sprintr_mill-v1
```

### 4.2 Run conda-unpack

The archive contains hardcoded paths from the machine it was built on. `conda-unpack` fixes these so the environment works correctly in its new location:

```bash
/opt/envs/sprintr_mill-v1/bin/python /opt/envs/sprintr_mill-v1/bin/conda-unpack
```

### 4.3 Verify it works

```bash
/opt/envs/sprintr_mill-v1/bin/python - <<'PY'
import openslide, pyvips, torch, numpy, anndata
print('imports ok')
print('torch', torch.__version__, 'cuda available:', torch.cuda.is_available())
if torch.cuda.is_available():
    print('device:', torch.cuda.get_device_name(0))
PY
```

If this prints `imports ok` and, on a GPU node, reports a CUDA device, the environment is ready to use.

### 4.4 Activate the environment

To use plain `python` (instead of the full path) and have the environment's packages available directly in your shell:

```bash
source /opt/envs/sprintr_mill-v1/bin/activate
```

---

## 5. Install a Jupyter Kernel (for Notebooks)

If you want to use this environment inside a Jupyter notebook, register it as a kernel:

```bash
/opt/envs/sprintr_mill-v1/bin/python -m ipykernel install --user \
  --name sprintr_mill-v1 \
  --display-name "SPRINTR_MIL (v1)"
```

`--name` is the internal kernel identifier; `--display-name` is what shows up in the Jupyter interface's kernel picker.

---

## 6. Available Environment Definitions

Environment `.yml` files are kept in the **`conda_environments`** folder:

| File | Environment name | Purpose |
|---|---|---|
| `histomil.yaml` | `sprintr_mill` | Training environment |
| `valis_registration.yaml` | `sprintr_valis_reg` | Same as above, plus VALIS registration support |

---

## 7. Adding Your Own Local Package/Repository to the Environment

Sometimes you have your own local code (e.g. a package like `mil`) that you want to be able to `import` from any notebook or script using this environment — without formally installing it as a pip package.

The simplest approach is to add a `.pth` file pointing to your code's location. Conda/Python automatically reads `.pth` files in the environment's `site-packages` directory and adds each listed path to the import search path.

```bash
echo "/opt/fovea/simplified_histomil" > $(python -c "import sysconfig; print(sysconfig.get_paths()['purelib'])")/mil.pth
```

**Before running this:**
- Replace `/opt/fovea/simplified_histomil` with the path to the directory containing the module you want to import.
- Replace `mil.pth` with a name of your choice — the filename itself doesn't matter as long as it ends in `.pth`, but naming it after the module keeps things clear.

After running this, `import mil` (or whatever your module is called) will work from any notebook or script — as long as it's using the **same kernel/environment** where you ran this command.

> **Alternative approach:** you can also package your code properly using **hatchling** (already available in the build environment) and install it with pip in editable mode. This is more robust for larger or evolving codebases, but the `.pth` file approach above is simpler and sufficient for most cases.

---

## Quick Reference: Full Workflow Summary

```bash
# 1. On a non-air-gapped x86 machine
conda env create -f environment.yml
conda activate sprintr_mill
conda install -c conda-forge conda-pack
conda-pack -n sprintr_mill -o sprintr_mill-v1.tar.gz

# 2. Upload to AIDA shared storage
scp sprintr_mill-v1.tar.gz login:/data/datasets/envs

# 3. On each AIDA node that needs it
mkdir -p /opt/envs/sprintr_mill-v1
tar -xzf sprintr_mill-v1.tar.gz -C /opt/envs/sprintr_mill-v1
/opt/envs/sprintr_mill-v1/bin/python /opt/envs/sprintr_mill-v1/bin/conda-unpack
source /opt/envs/sprintr_mill-v1/bin/activate
```

## OLD GUIDE
**Prerequisites**
Conda installed on a non air-gapped system, preferably x86 architecture. If you are on Apple Silicon you have to find a way to build the Conda environment for x86, e.g. via Docker, or find an x86 machine.

### Create the environment
Find your environment.yml file and create the Conda environment. **An x86 build environment is required for it to work on AIDA.**

```
conda env create -f environment.yml
```

With this command, the name of the environment is taken from the .yml file. Afterwards, activate the Conda environment with the following command. 
```
conda activate sprintr_mill
``` 


To be able to pack a Conda environment into a tar (compressed file), conda-pack needs to be installed into the environment. 
```
conda install -c conda-forge conda-pack
```

To get a list of all packages that will be included in the pack you can run
```conda env export --no-builds > sprintr_mill-v1.yml``` 
which will save all the packages inside the .yml file.


### Package the conda environment

```
conda-pack -n sprintr_mill -o sprintr_mill-v1.tar.gz
```
Converts the Conda environment **sprintr_mill** into the tar file **sprintr_mill-v1.tar.gz**.

### Upload the .tar.gz file to AIDA
Use scp to transfer the tar.gz file to AIDA in the shared environment storage. Here **/data/datasets/envs** is used, but it should be changed.

```
scp sprintr_mill-v1.tar.gz login:/data/datasets/envs
```
The idea is that this is uploaded to one node/shared storage, which means each node can access the tarball and set up its environment from it.
### Installing the conda environment on an AIDA node
Create the environment dir and unpack the tarball. Currently I don't think /opt/envs is set up.

```
mkdir -p /opt/envs/sprintr_mill-v1
tar -xzf sprintr_mill-v1.tar.gz -C /opt/envs/sprintr_mill-v1
```
Use conda-unpack to unpack and set up the paths to make the environment work

```
  /opt/envs/sprintr_mill-v1/bin/python /opt/envs/sprintr_mill-v1/bin/conda-unpack
```

This needs to be done on a per-node basis. The reason is that the Python environment should be stored on the node's local disk. In the future, Ansible should have functionality for this.

Now you can use your Python environment via 
```
/opt/envs/sprintr_mill-v1/bin/python - <<'PY'
import openslide, pyvips, torch, numpy, anndata
print('imports ok')
print('torch', torch.__version__, 'cuda available:', torch.cuda.is_available())
if torch.cuda.is_available():
    print('device:', torch.cuda.get_device_name(0))
PY
```

Use ```source /opt/envs/sprintr_mill-v1/bin/activate``` to activate the environment and be able to use the python command directly, without specifying the full path. 

### Installing the kernel for notebooks
To install the environment 
```
/opt/envs/sprintr_mill-v1/bin/python -m ipykernel install --user \
  --name sprintr_mill-v1 \
  --display-name "SPRINTR_MIL (v1)"
```

The environment files live in the **conda_environments** folder:
- `histomil.yaml` — the `sprintr_mill` training environment
- `valis_registration.yaml` — the `sprintr_valis_reg` environment, which adds VALIS registration on top


### Adding a repository to path
For example, the **mil** package needs to be added to the environment path in order for a Python file to import it via ```import mil```. The easiest way I have found is to add the path to the module's source files via the sysconfig paths. First, read the command below carefully and make sure the **/opt/fovea/simplified_histomil** path is changed to the directory with the module you want to add, and that **mil.pth** is replaced with the name you want for the module. After running this command you will be able to import **mil**, or whatever you named it, from anywhere — you just need to start a notebook somewhere and run it with the same kernel environment, and import mil will work normally.

```
echo "/opt/fovea/simplified_histomil" > $(python -c "import sysconfig; print(sysconfig.get_paths()['purelib'])")/mil.pth
```

There are other ways to do this, for example via **hatchling**, but the above was deemed the simplest and it should work in the majority of cases. Hatchling has also been added to the build environment. 