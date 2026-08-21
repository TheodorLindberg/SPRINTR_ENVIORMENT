
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