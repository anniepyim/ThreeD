var d3 = require('d3');
var THREE = require ('three');
var OrbitControls = require('three-orbit-controls')(THREE);



var div = d3.select("#pcplotcanvas").append("div")
.attr("class", "tooltip")
.style("opacity", 0);    

var scene, camera, renderer, controls, pcObj, boxes, dots, raycaster;
var mouse = new THREE.Vector2(), INTERSECTED,
    pageEvent = new THREE.Vector2();
var depth = 100,
    width = 100,
    height = 100;
var rotate = true, mouseflag = 0;
var container = document.getElementById( 'pcplotcanvas' );

var pcPlot = function (obj) {
if (obj instanceof pcPlot) return obj;
if (!(this instanceof pcPlot)) return new pcPlot(obj);
this.pcPlotwrapped = obj;
};

function sceneInit(){

    scene = new THREE.Scene();

    var light = new THREE.DirectionalLight( 0xffffff, 0.5 );
    light.position.set( 1, 1, 1 ).normalize();
    scene.add( light );

    var alight = new THREE.AmbientLight( 0xffffff, 0.5 );
    scene.add( alight );

    camera = new THREE.PerspectiveCamera( 75, 600/600, 0.1, 1000 );
    camera.position.z = 300;
    controls = new OrbitControls( camera );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( 600, 600 );
    renderer.setClearColor( 0xf0f0f0 );

    raycaster = new THREE.Raycaster();

    pcObj = new THREE.Object3D();
    scene.add(pcObj);
    pcObj.rotation.y = -0.4;
    pcObj.rotation.x = 0.2;

    container.appendChild( renderer.domElement );
    container.addEventListener( 'mousemove', onDocumentMouseMove, false );
    container.addEventListener("mousedown", function(){mouseflag = 0;}, false);
    container.addEventListener("mouseup", function(){if(mouseflag === 0) rotate=!rotate;},false);}

function createTextCanvas(text, color, font, size) {
    size = size || 16;
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var fontStr = (size + 'px ') + (font || 'Arial');
    ctx.font = fontStr;
    var w = ctx.measureText(text).width;
    var h = Math.ceil(size);
    canvas.width = w;
    canvas.height = h;
    ctx.font = fontStr;
    ctx.fillStyle = color || 'black';
    ctx.fillText(text, 0, Math.ceil(size * 0.8));
    return canvas;
}

function createText2D(text, color, font, size, segW, segH) {
    var canvas = createTextCanvas(text, color, font, size);
    var plane = new THREE.PlaneGeometry(canvas.width, canvas.height, segW, segH);
    var tex = new THREE.Texture(canvas);
    tex.needsUpdate = true;
    var planeMat = new THREE.MeshBasicMaterial({
        map: tex,
        color: 0xffffff,
        transparent: true
    });
    var mesh = new THREE.Mesh(plane, planeMat);
    mesh.scale.set(0.5, 0.5, 0.5);
    mesh.doubleSided = true;
    return mesh;
}

function gridInit(depth,width,height){

    var grid = new THREE.Object3D();
    var planeXY = new THREE.GridHelper( height, 20, 0x000000, 0x000000 ),
        planeYZ = new THREE.GridHelper( depth, 20, 0x000000, 0x000000 ),
        planeXZ = new THREE.GridHelper( width, 20, 0x000000, 0x000000 );

    grid.add(planeXY);
    grid.add(planeYZ);
    grid.add(planeXZ); 

    planeXY.position.y = -height;
    planeYZ.position.z = -depth;
    planeYZ.rotation.x = Math.PI/2;
    planeXZ.position.x = -width;
    planeXZ.rotation.z = Math.PI/2;

    var labelXZ = createText2D("PC1");
    grid.add(labelXZ);
       labelXZ.position.x = width*1.1;
       labelXZ.position.y = -height;

    var labelXY = createText2D("PC2");
    grid.add(labelXY);
       labelXY.position.x = width*1.1;
       labelXY.position.z = -depth;

    var labelYZ = createText2D("PC3");
    grid.add(labelYZ);
       labelYZ.position.x = -width*1.1;
       labelYZ.position.z = depth;

    pcObj.add(grid);
}

function hexToRgb(hex) { //TODO rewrite with vector output
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function dotsInit(){
    var data = d3.csv("data/final.csv", function (d){

    dots = new THREE.Object3D();
    var sample = [];
    d.forEach(function (d,i) {
            sample[i] = {
                pc1: +d.pc1,
                pc2: +d.pc2,
                pc3: +d.pc3,
            };
        });
        
    var xmax = d3.max(sample, function (d) {return d.pc1;}),
        xmin = d3.min(sample, function (d) {return d.pc1;}),
        zmax = d3.max(sample, function (d) {return d.pc2;}),
        zmin = d3.min(sample, function (d) {return d.pc2;}),
        ymax = d3.max(sample, function (d) {return d.pc3;}),
        ymin = d3.min(sample, function (d) {return d.pc3;});

    var format = d3.format("+.2f");

    //var color = d3.scale.ordinal().range(["#fb8072", "#ffffb3", "#b3de69", "#80b1d3", "#bebada", "#fdb462", "#f781bf", "#8dd3c7", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#fbb4ae", "#b3cde3", "#ffed6f", "#decbe4", "#fed9a6"]);  
    var color = d3.scale.ordinal().range(["#e41a1c","#ffff33","#4daf4a","#377eb8","#984ea3"]);

    var xDom = (xmax-xmin)*0.1,
        yDom = (ymax-ymin)*0.1,
        zDom = (zmax-zmin)*0.1;

    var xScale = d3.scale.linear()
                  .domain([xmin-xDom,xmax+xDom])
                  .range([-100,100]);
    var yScale = d3.scale.linear()
                  .domain([ymin-yDom,ymax+yDom])
                  .range([-100,100]);                  
    var zScale = d3.scale.linear()
                  .domain([zmin-zDom,zmax+zDom])
                  .range([-100,100]);

    var sprite = new THREE.TextureLoader().load( "pics/circle.png" );   
    for ( i = 0; i < d.length; i ++ ) {
        var realcolor = color(d[i].group);
        var geometry = new THREE.SphereBufferGeometry( 3, 32, 32 );
        var material = new THREE.MeshLambertMaterial( { color: new THREE.Color().setRGB( hexToRgb(realcolor).r / 255, hexToRgb(realcolor).g / 255, hexToRgb(realcolor).b / 255 ) } );
        var particle = new THREE.Mesh( geometry, material );
        particle.position.x = xScale(d[i].pc1);
        particle.position.z = zScale(d[i].pc2);
        particle.position.y = yScale(d[i].pc3);
        particle.sampleID = d[i].sampleID;
        particle.group = d[i].group;
        particle.info = d[i].info;
        particle.pc1 = format(d[i].pc1);
        particle.pc2 = format(d[i].pc2);
        particle.pc3 = format(d[i].pc3);
        dots.add( particle );
    }
    pcObj.add(dots);
    });       
}

function boxInit(){

    var geometry = new THREE.BoxBufferGeometry( 20, 20, 20 );

    boxes = new THREE.Object3D();

    for ( var i = 0; i < 2000; i ++ ) {

      var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );

      object.position.x = Math.random() * 800 - 400;
      object.position.y = Math.random() * 800 - 400;
      object.position.z = Math.random() * 800 - 400;

      object.rotation.x = Math.random() * 2 * Math.PI;
      object.rotation.y = Math.random() * 2 * Math.PI;
      object.rotation.z = Math.random() * 2 * Math.PI;

      object.scale.x = Math.random() + 0.5;
      object.scale.y = Math.random() + 0.5;
      object.scale.z = Math.random() + 0.5;

      boxes.add( object );
    }

    pcObj.add(boxes);

}

function onDocumentMouseMove( event ) {

    event.preventDefault();

    mouse.x = ( event.clientX / 600 ) * 2 - 1;
    mouse.y = - ( event.clientY / 600 ) * 2 + 1;

    pageEvent.x = event.clientX;
    pageEvent.y = event.clientY;

    mouseflag = 1;

  }

function render() {

    requestAnimationFrame( render );

    controls.update();

    renderer.render( scene, camera );

    if (rotate) pcObj.rotation.y += 0.002;

    raycaster.setFromCamera( mouse, camera );

    var intersects = raycaster.intersectObjects( dots.children );

    if ( intersects.length > 0 ) {
        if ( INTERSECTED != intersects[ 0 ].object ) {
            if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
            INTERSECTED = intersects[ 0 ].object;
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
            INTERSECTED.material.emissive.setHex( 0xff0000 );
            if (pageEvent.x !== 0 && pageEvent.y !== 0){
                div.transition()
                    .duration(200)
                    .style("opacity", 0.9)
                    .style("height", 100);
                div.html("Sample: " + INTERSECTED.sampleID + "<br>" +
                        "Group: " + INTERSECTED.group + "<br>" +
                        "Info: " + INTERSECTED.info + "<br>" +
                        "PCs: PC1: " + INTERSECTED.pc1 + ", PC2: " + INTERSECTED.pc2 + ", PC3: " + INTERSECTED.pc3)
                    .style("left", (pageEvent.x + 5) + "px")
                    .style("top", (pageEvent.y - 10) + "px");
            }
        }   
    } else {
      if ( INTERSECTED ) {
          INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
          div.transition()
            .duration(500)
            .style("opacity", 0);
      }
      INTERSECTED = null;
    }

}

pcPlot.init = function(){
    sceneInit();
    gridInit(depth,width,height);
    dotsInit();
    //boxInit();
    //pcObj.add(new THREE.Mesh(new THREE.BoxBufferGeometry(100,100,100),new THREE.MeshNormalMaterial()))
    render();
};

pcPlot.deletedots = function(){
    alert("remove");
    pcObj.remove(dots);
    dots = null;
    render();
};

pcPlot.adddots = function(){
    alert("add");
    dotsInit();
    render();
};

if (typeof define === "function" && define.amd) {
    define(pcPlot);
} else if (typeof module === "object" && module.exports) {
    module.exports = pcPlot;
} else {
    this.pcPlot = pcPlot;
}