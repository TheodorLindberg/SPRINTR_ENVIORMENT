Running trident

Trident is used for feature extraction, its very nice since it abstracts all the complexity of suing the foundation models correct etc. 


To get started you need to prepare the conda enviormnet elsewhere, similar to the guide. Its recommended to read the getting started for Trident to unserstand its environment requirments.


## Create and fix the environment

start by downloading the git on a x86 machine
```
git clone https://github.com/mahmoodlab/TRIDENT.git
cd TRIDENT
```

In previous development we merged the extra TRIDENT dependencis into the histomil pipeline and enviorments, this was nice since we could use on apptainer but this can get a bit complicated when package version mismatch accur. And to futureproof its best to keep the enviorment seperatly, eg if TRIDENT in the future recives an breaking update you easily recreate the enviormnet and upload it and nothing else will be affected.

### Setup Conda

run 
```
conda create -n "trident" python=3.11
conda activate trident
```
We chose version 3.11 of python since its supported and the rest of our environment uses it.


TRIDENT environment can be configured with a bunch of optional packages as seen in their Github Readme

```
pip install ".[patch-encoders,slide-encoders,convert]"
```

We choose to include the above three packages. There are other packages to include for more WSI read support but openslide works for all file types used in this project. 


```
conda install -c conda-forge conda-pack
conda-pack -n trident -o trident.tar.gz

scp trident.tar.gz <login_node>:/data/datasets/envs/trident.tar.gz
```

### Setting up enviorment

At this point we didn't have a compleate setup for where to put envs etc so here is a setup for home directory
```
cd ~
mkdir trident
tar -xzf /data/datasets/envs/trident.tar.gz -C ./trident
./trident/bin/python ./trident/bin/conda-unpack
```

Then to start feature extraction run,
Here we run for the elastically registerd new dataset, /data/results/scans/elastic/new, and the output is saved at /data/results/alvis/trident/new/elastic/ 

```
source ~/trident/bin/activate
cd /opt/fovea/new/TRIDENT
python run_batch_of_slides.py  --wsi_dir /data/results/scans/elastic/new --job_dir /data/results/alvis/trident/new/elastic/  --patch_encoder uni_v2 --patch_size 256 --mag 20 --segmenter otsu --gpus 0 0 0 --task all
```

A tip above is to run ```screen``` before the above command, then after you can de attatch, mening if the ssh session drops it will keep running until compleate or the node shuts down,(now 2 hours after ssh connection drops )