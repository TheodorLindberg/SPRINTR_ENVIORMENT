
the plugin name must be inside the tissuumaps plugin folder

ParallelViewInteractive.js

```
"settings": [
    {
      "module": "pluginUtils",
      "function": "startPlugin",
      "value": [
        "Parallel_view_interactive",
        [
          { "name": "_parallel", "value": true },
          { "name": "_parallelOverlay1", "value": true },
          { "name": "_parallelOverlay1Layer", "value": "1" },
          { "name": "_parallelOverlay1Opacity", "value": 50 },
          { "name": "_parallelOverlay1Mode", "value": "normal" },
          { "name": "_parallelOverlay2", "value": true },
          { "name": "_parallelOverlay2Layer", "value": "7" },
          { "name": "_parallelOverlay2Opacity", "value": 50 },
          { "name": "_parallelOverlay2Mode", "value": "normal" }
        ]
      ]
    }
  ]
  ```
  
Settings for the plugin, to load the plugin the startPlugin needs to be set in settings.
Keep Mode to normal, this is the blending mode

