/**
 * @file ParallelViewInteractive.js
 * @author 
 */

/**
 * @namespace ParallelViewInteractive
 * @classdesc The root namespace for ParallelViewInteractive.
 */
 var ParallelViewInteractive;
 ParallelViewInteractive = {
   name: "Parallel view interactive",
   parameters: {
    "_parallelViewSection":{
      "label":"",
      "title":"PARALLEL VIEW",
      "type":"section"
    },
    "_parallel":{
      "label":"Parallel view",
      "type":"checkbox",
      "default":true
    },
    "_parallelOverlay1":{
      "label":"Show overlay 1 <i>(Alt-S)</i>",
      "type":"checkbox",
      "default":true,
      "attributes":{
        "accesskey":"s"
      }
    },
    "_parallelOverlay1Layer":{
        "label":"Overlay 1 layer",
        "type":"select",
        "options":[],
        "default":"1"
    },
    "_parallelOverlay1Opacity":{
        "label":"Overlay 1 opacity",
        "type":"number",
        "attributes":{
            "min":0,
            "max":100,
            "step":5
        },
        "default":80
    },
    "_parallelOverlay1Mode":{
        "label":"Overlay 1 merging mode",
        "type":"select",
        "options":[
            "normal",
            "color",
            "screen",
            "hue"
        ],
        "default":"color"
    },
    "_parallelOverlay2":{
      "label":"Show overlay 2",
      "type":"checkbox",
      "default":false
    },
    "_parallelOverlay2Layer":{
        "label":"Overlay 2 layer",
        "type":"select",
        "options":[],
        "default":"2"
    },
    "_parallelOverlay2Opacity":{
        "label":"Overlay 2 opacity",
        "type":"number",
        "attributes":{
            "min":0,
            "max":100,
            "step":5
        },
        "default":80
    },
    "_parallelOverlay2Mode":{
        "label":"Overlay 2 merging mode",
        "type":"select",
        "options":[
            "normal",
            "color",
            "screen",
            "hue"
        ],
        "default":"color"
    }
   }
 };
 /**
  * This method is called when the document is loaded. The tmapp object is built as an "app" and init is its main function.
  * Creates the OpenSeadragon (OSD) viewer and adds the handlers for interaction.
  * To know which data one is referring to, there are Object Prefixes (op). For In situ sequencing projects it can be "ISS" for
  * Cell Profiler data it can be "CP".
  * If there are images to be displayed on top of the main image, they are stored in the layers object and, if there are layers
  * it will create the buttons to display them in the settings panel.
  * The SVG overlays for the viewer are also initialized here 
  * @summary After setting up the tmapp object, initialize it*/
 ParallelViewInteractive.init = async function (container) {
    ParallelViewInteractive.numberToRange("_parallelOverlay1Opacity");
    ParallelViewInteractive.numberToRange("_parallelOverlay2Opacity");

    document.getElementById(
        ParallelViewInteractive.getInputID("_parallel")
    )?.addEventListener("change",(event)=>{
        var value=event.target.checked;
        let elements = [
            ParallelViewInteractive.getInputID("_parallelOverlay1"),
            ParallelViewInteractive.getInputID("_parallelOverlay2")
        ]
        ParallelViewInteractive.hideShow(event, elements,value?[0,1]:[]);
    });

    // Wire up enable/disable behaviour for each of the 2 parallel-view
    // overlay slots: unchecking "Show overlay N" disables that slot's
    // layer/opacity/mode controls.
    [
        ["_parallelOverlay1", ["_parallelOverlay1Layer", "_parallelOverlay1Opacity", "_parallelOverlay1Mode"]],
        ["_parallelOverlay2", ["_parallelOverlay2Layer", "_parallelOverlay2Opacity", "_parallelOverlay2Mode"]]
    ].forEach(([checkboxParam, controlledParams]) => {
        document.getElementById(
            ParallelViewInteractive.getInputID(checkboxParam)
        )?.addEventListener("change", (event) => {
            var value = event.target.checked;
            let elements = controlledParams.map(p => ParallelViewInteractive.getInputID(p));
            ParallelViewInteractive.enableDisable(event, elements, value ? [0,1,2] : []);
        });
    });

    // Trigger initial enable/disable + hide/show state
    document.getElementById(ParallelViewInteractive.getInputID("_parallel"))?.dispatchEvent(new Event('change'));
    document.getElementById(ParallelViewInteractive.getInputID("_parallelOverlay1"))?.dispatchEvent(new Event('change'));
    document.getElementById(ParallelViewInteractive.getInputID("_parallelOverlay2"))?.dispatchEvent(new Event('change'));

    ParallelViewInteractive.init_parallel();
    container.classList.add("user-select-none");
    ParallelViewInteractive.waitLayersReady().then(() => {
        tmapp.ISS_viewer.viewport.applyConstraints(new OpenSeadragon.Rect(0, 0, 1, 1), true);
        ParallelViewInteractive.populateAllLayerSelects();
        ParallelViewInteractive.updateParallel();
    });
 }
 var animationSide = 0;
 var timer = null;
 function animationHandler1(event){
    if (animationSide != 0 && animationSide != 1) return;
    clearTimeout(timer);
    animationSide = 1;
    ParallelViewInteractive.updateBounds(tmapp.ISS_viewer.viewport, ParallelViewInteractive.osd_viewer.viewport)
    timer = setTimeout(function(){animationSide = 0;},400);
 };
 function animationHandler2(event){
    if (animationSide != 0 && animationSide != 2) return;
    clearTimeout(timer);
    animationSide = 2;
    ParallelViewInteractive.updateBounds(ParallelViewInteractive.osd_viewer.viewport, tmapp.ISS_viewer.viewport)
    timer = setTimeout(function(){animationSide = 0;},400);
 }
 ParallelViewInteractive.init_parallel = async function () {
    if (document.getElementById("ParallelViewInteractive_viewer")) {
        document.getElementById("ParallelViewInteractive_viewer")?.remove();
        ParallelViewInteractive.osd_viewer.removeHandler("animation", animationHandler1);
        tmapp.ISS_viewer.removeHandler("animation", animationHandler2);
        ParallelViewInteractive.osd_viewer.removeHandler("resize", animationHandler1);
    
        $(".openseadragon-container")[0].style.display = "block";
        $(".openseadragon-container")[0].style.width = "100%";
    }
    if (!ParallelViewInteractive.get("_parallel")) return;
    var elt = document.createElement("div");
    elt.id = "ParallelViewInteractive_viewer"
    elt.style.width = "50%";
    elt.style.height = "100%";
    elt.style.display = "inline-block";
    elt.style.verticalAlign = "top";
    document.getElementById("ISS_viewer").appendChild(elt);
    $(".openseadragon-container")[0].style.display = "inline-flex";
    $(".openseadragon-container")[0].style.width = "50%";

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const path = urlParams.get('path')
    var _url_suffix = ""
    if (path != null) {
        _url_suffix = path + "/"
    }

    let options_osd = {
        id: "ParallelViewInteractive_viewer",
        showNavigator: false,
        animationTime: 0.0,
        blendTime: 0,
        minZoomImageRatio: 1,
        maxZoomPixelRatio: 30,
        immediateRender: true,
        showNavigationControl: false,
        imageLoaderLimit:50,
        preload:false,
        imageSmoothingEnabled:false,
        mouseNavEnabled:true,
        preserveImageSizeOnResize:true
    }
    /*clearTimeout(timer);
    animationSide = 2;
    setTimeout(function(){animationSide = 0;},500);*/
    ParallelViewInteractive.osd_viewer = OpenSeadragon(options_osd);
    animationHandler2(null);
    ParallelViewInteractive.osd_viewer.addHandler("animation", animationHandler1);
    tmapp.ISS_viewer.addHandler("animation", animationHandler2);
    ParallelViewInteractive.osd_viewer.addHandler("resize", animationHandler1);
    while(!tmapp.ISS_viewer.world.getItemAt(1)) {
        await new Promise(r => setTimeout(r, 200));
    }
    await overlayUtils.waitLayersReady();
    ParallelViewInteractive.loadData(ParallelViewInteractive.get("_dataset"));
    await ParallelViewInteractive.waitLayersReady();
    animationHandler2(null)
    ParallelViewInteractive.populateAllLayerSelects();
    ParallelViewInteractive.updateParallel();
 }
 ParallelViewInteractive.numberToRange = function (inputName) {
    // Get the original number input element
    const numberInput = document.getElementById(
        ParallelViewInteractive.getInputID(inputName)
    );
    if (!numberInput) return;

    // Create a new range input element
    const rangeInput = document.createElement('input');
    rangeInput.type = 'range';
    //rangeInput.id = numberInput.id;
    rangeInput.className = numberInput.className;
    rangeInput.min = numberInput.min;
    rangeInput.max = numberInput.max;
    rangeInput.step = numberInput.step;
    rangeInput.value = numberInput.value;
    rangeInput.classList.add("overlay-slider")
    rangeInput.classList.add("form-range");
    rangeInput.style = "display: inline-block;width: 150px;margin-left: 10px;border: 0px;vertical-align: bottom;";

    // Add event listeners to the new range input
    rangeInput.addEventListener('input', function() {
        console.log(rangeInput.value);
        numberInput.value = rangeInput.value;
        let e = new Event('change');
        e.target = numberInput;
        numberInput.dispatchEvent(e);
    });

    // Hide the original number input
    numberInput.style.display = 'none';

    // Insert the new range input after the original number input
    numberInput.parentNode.insertBefore(rangeInput, numberInput.nextSibling);
 }

 /**
  * Fills a "select" parameter's <select> element with one <option> per
  * loaded layer (value = layer index, text = layer name), preserving the
  * previously selected value if it is still valid.
  */
 ParallelViewInteractive.populateLayerSelect = function (paramName) {
    var select = document.getElementById(ParallelViewInteractive.getInputID(paramName));
    if (!select) return;
    var currentValue = select.value;
    select.innerHTML = "";
    for (let layerIndex in tmapp.layers) {
        let layer = tmapp.layers[layerIndex];
        let option = document.createElement("option");
        option.value = layerIndex;
        option.text = layer.name || ("Layer " + layerIndex);
        select.appendChild(option);
    }
    let values = Array.from(select.options).map(o => o.value);
    if (values.includes(currentValue)) {
        select.value = currentValue;
    }
 }

 ParallelViewInteractive.populateAllLayerSelects = function () {
    [
        "_parallelOverlay1Layer",
        "_parallelOverlay2Layer"
    ].forEach(ParallelViewInteractive.populateLayerSelect);
 }

 ParallelViewInteractive.inputTrigger = function (parameterName) {
    if (parameterName == "_parallel") { 
        ParallelViewInteractive.init_parallel();
        return;
    }
    if (parameterName.startsWith("_parallelOverlay")) {
        ParallelViewInteractive.updateParallel();
    }
 }

/**
 * Applies the show/opacity/blend-mode settings of both overlay slots
 * (1 and 2) for a given prefix ("_parallel") onto the given
 * OpenSeadragon world. Every other item in the world is hidden first,
 * so layers that aren't assigned to slot 1 or 2 (e.g. the first/base
 * layer) don't get left behind at full opacity.
 */
ParallelViewInteractive.applyOverlays = function (world, prefix) {
    if (!world) return;

    // Hide every layer first; only the two selected overlay slots below
    // get turned back on.
    for (let i = 0; i < world.getItemCount(); i++) {
        let ti = world.getItemAt(i);
        if (ti) ti.setOpacity(0);
    }

    [1, 2].forEach((n) => {
        let showKey = prefix + "Overlay" + n;
        let layerKey = showKey + "Layer";
        let opacityKey = showKey + "Opacity";
        let modeKey = showKey + "Mode";

        let layerIdxRaw = ParallelViewInteractive.get(layerKey);
        let layerIdx = parseInt(layerIdxRaw);
        if (isNaN(layerIdx)) return;

        let tiledImage = world.getItemAt(layerIdx);
        if (!tiledImage) return;

        let show = ParallelViewInteractive.get(showKey);
        let opacity = ParallelViewInteractive.get(opacityKey);
        tiledImage.setOpacity(show ? opacity / 100 : 0);

        if (typeof tiledImage.setCompositeOperation === "function") {
            tiledImage.setCompositeOperation(ParallelViewInteractive.get(modeKey));
        }
    });
}

ParallelViewInteractive.updateParallel = function () {
    ParallelViewInteractive.waitLayersReady().then(() => {
        ParallelViewInteractive.applyOverlays(ParallelViewInteractive.osd_viewer.world, "_parallel");
    });
}
ParallelViewInteractive.loadData = function (dataset) {
    /*projectUtils._activeState.layers = [
        {
            "name": "H&E",
            "tileSource": './ParallelViewInteractive/'+dataset+'.tif.dzi'
        },
        {
            "name": "Confidence mask",
            "tileSource": './ParallelViewInteractive/ConfidenceMask_'+dataset+'.tif.dzi'
        }
    ]
    projectUtils.loadLayers(projectUtils._activeState);*/
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const path = urlParams.get('path')
    var _url_suffix = ""
    if (path != null) {
        _url_suffix = path + "/"
    }
    ParallelViewInteractive.osd_viewer.world.removeAll();
    for (let layerIndex in tmapp.layers) {
        layer = tmapp.layers[layerIndex];
        console.log("Adding layer: ", layer, {
            tileSource: _url_suffix + layer.tileSource,
            x: layer.x,
            y: layer.y,
            rotation: layer.rotation,
            flip: layer.flip,
            opacity:0
        });
        layerIndex = parseInt(layerIndex);
        ParallelViewInteractive.osd_viewer.addTiledImage({
            tileSource: _url_suffix + layer.tileSource,
            x: layer.x,
            y: layer.y,
            degrees: layer.rotation,
            // NOTE: layer.scale (from the .tmap file) describes the tile
            // pyramid's own downsample factor (e.g. a coarse heatmap dzi
            // built at 1/5 resolution) - it does NOT mean "draw this 5x
            // bigger". Every layer covers the same physical tissue area
            // as the base slide, so we deliberately leave width unset:
            // OSD then defaults every layer to the same world width as
            // the first image added, aligning them all correctly
            // regardless of each layer's own pixel resolution.
            flipped: layer.flip,
            // Start hidden. Visibility/opacity for the parallel view is
            // driven entirely by applyOverlays() based on the selected
            // overlay slots, so nothing here should default to visible.
            opacity:0
        })
    }
    setTimeout(ParallelViewInteractive.setFilters,100);
}

ParallelViewInteractive.setFilters = function () {
    ParallelViewInteractive.waitLayersReady().then(() => {
        filters = [];
        for (const layer in filterUtils._filterItems) {
            processors = [];
            for(var filterIndex=0;filterIndex<filterUtils._filterItems[layer].length;filterIndex++) {
                processors.push(
                    filterUtils._filterItems[layer][filterIndex].filterFunction(filterUtils._filterItems[layer][filterIndex].value)
                );
            }
            filters.push({
                items: ParallelViewInteractive.osd_viewer.world.getItemAt(layer),
                processors: processors,
                toReset: true
            });
        };
        ParallelViewInteractive.osd_viewer.setFilterOptions({
            filters: filters,
            loadMode: "async"
        });
        for ( var i = 0; i < ParallelViewInteractive.osd_viewer.world._items.length; i++ ) {
            ParallelViewInteractive.osd_viewer.world._items[i].tilesMatrix={};
            ParallelViewInteractive.osd_viewer.world._items[i]._needsDraw = true;
        }
    });

    ParallelViewInteractive.populateAllLayerSelects();
    ParallelViewInteractive.updateParallel();
 }

 ParallelViewInteractive.waitLayersReady = async function () {
    await new Promise(r => setTimeout(r, 200));
    while (!ParallelViewInteractive.osd_viewer.world) {
        await new Promise(r => setTimeout(r, 200));
    }
    while (ParallelViewInteractive.osd_viewer.world.getItemCount() < 2) {
        await new Promise(r => setTimeout(r, 200));
    }
    console.log(ParallelViewInteractive.osd_viewer.world.getItemCount());
}

 ParallelViewInteractive.updateBounds = function (viewport1, viewport2) {
    viewport1.fitBounds(
        viewport2.getBounds(), true
    );
 }

ParallelViewInteractive.hideShow=function(event,array,options){
    array.forEach((domid, index)=>{
        domelement=interfaceUtils.getElementById(domid);
        if(domelement){
            if(options.includes(index)){
                domelement.parentElement.parentElement.classList.remove("d-none");
            }else{
                domelement.parentElement.parentElement.classList.add("d-none");
            }
        }
    });
}
ParallelViewInteractive.enableDisable=function(event,array,options){
    array.forEach((domid, index)=>{
        domelement=interfaceUtils.getElementById(domid);
        if(domelement){
            for (let c of domelement.parentElement.children) {
                if(options.includes(index)){
                    c.disabled=false;
                }else{
                    c.disabled=true;
                }
            }
        }
    });
}