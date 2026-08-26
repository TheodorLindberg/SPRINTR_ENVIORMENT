We use valis for registration with a small wrapper around, this wrapper is a bit to overly complicated and AI was extensivly used for creating and testing it, but it does the job and registers the images, we are no registration expers and this step could very well use some more looking into and simplification.

Our current module that wraps around valis outputs the files into a trident directory, 

When doing registration on the new dataset, its output was
umea__patient_001_1997__biopsy_01__elastic__HE.tif 
and we want to convert it into the normalized format that the mil pipeline uses which looks like

new__p001__b01__elastic__HE.tiff

With **new** since we decided to call this dataset new. 


If veryfy this code and the regex if you attempt to to renaming with slighly diffrent named files.
```
from pathlib import Path
import re

folder = Path("results/scans/elastic/new")

for f in folder.glob("*.tif"):
    m = re.match(r"umea__patient_(\d+)_\d+__biopsy_(\d+)__(.+)\.tif$", f.name)

    if m:
        patient, biopsy, rest = m.groups()
        new_name = f"new__p{patient}__b{biopsy}__{rest}.tiff"
        f.rename(folder / new_name)
        print(f"{f.name} -> {new_name}")

```