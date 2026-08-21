
Quality control is very usefull to run on a wsi dataset to find artifacts and problems with the stains. 

The results of quality controll can either be to fully reject a slide from continuing being process in the pipeline. or mark it as problematic and later pay extra attention to it in registration and training to see if the problems found makes it misrepresent the dataset.

For the initial quality control and verification of the dataset. we use HistoQC

Histo qc is accessed via github https://github.com/choosehappy/HistoQC and their documentation can be found here https://histoqc.readthedocs.io/en/latest/running_histoqc.html

Running HistoQC is easy, first make sure you have a working conda or similar enviorment with the installed packages for HistoQC on AIDA, follow that guide when its ready. 

To run quality control of a list of scans the following command is used, the **-c v2.1** is the config file to use, this v2.1 used is adefault one provided by HistoQC and but futher reading on the importance of the config is highly recommended. And the **-o** flag represents the HistoQC output directory. 

```
python -m histoqc -c v2.1 -o ../histoqc_output_ki "/data/datasets/**/*Ki67.ndpi"
```

For visualising the results, the builtin ui framework can be started. 
```
python -m histoqc.ui ./histoqc_output/results.tsv --port 5021
```

To access the website from your browser it can either be added to the Nginx proxy or you could create a dedicated ssh tunnel for the port application port. 

Run this on your machine and replace login with how you normally connect to the node your running the service on via ssh. Here 5021 is chosen as an arbitrary port, since the default one of 5000 could be used by another service. 
```ssh -Nf -L 5021:127.0.0.1:5021 login```
Afterwards you can visit the website by entering http://localhost:5021/ in your browser.

Inside the webpage you will se a distribution of stats for each slide in the dataset similar to this image.
![[histoqc-ui-parallel-coordinates-metrics.png]]

This is the main tool for identifing outliers in the dataset. You can by clicking selecting rectangles in the graf to show in the preview below, so you can see the patients beloning to the outliers. I highly recommend turning to the HistoQC paper or documentationf or figuring out which stats are relevant and how to interpret them. 

We have only touched the surface of how this tool but we could identify a few patients that probably should not be included in the training set. 

For example patients  umea__p0061__b01__raw__HE and umea__p0017__b01__raw__HE respectivly were identified as outliers with two diffrent kinds of scanning or staining artifacts. 
![[histoqc-outlier-p0061-b01-he-pen-marking.png|250]]![[histoqc-outlier-p0017-b01-he-staining-artifact.png|120]]


The HistoQC pipeline also outputs preview images for each patient for the different tests it performs. The storage required was calculated to be around 300MB for a dataset of 120 HE images