var randomColors = ['red', 'orange', /* 'yellow', */ 'green', 'blue', 'violet'];

window.johnDebug = false;
var raycasterUpdateNeeded = false;
var raycasterInterval;

function raycasterNeedsUpdate() {
  raycasterUpdateNeeded = true;
  if (!raycasterInterval) {
    // NOTE: Assumes raycaster doesn't change.
    var raycaster = sc.querySelector('[raycaster]').components.raycaster;          
    raycasterInterval = setInterval(function() {
      if (raycasterUpdateNeeded) {
        raycaster.refreshObjects();                      
        raycasterUpdateNeeded = false;
      }
    }, raycaster.interval);
  }
}

function createGameBoard() {
  return '<a-box width="0.1" height="0.1" depth="0.1" position="-0.25 0.125 -0.75" rotation="0 45 0" color="#EFEFEF" shadow></a-box>' +
         '<a-cylinder id="game-ring-5-pts" position="0 0.0078 0" radius="0.20" height="0.001" color="#FF0000" shadow></a-cylinder>' +
         '<a-cylinder id="game-ring-4-pts" position="0 0.0076 0" radius="0.40" height="0.001" color="#FFFFFF" shadow></a-cylinder>' +
         '<a-cylinder id="game-ring-3-pts" position="0 0.0074 0" radius="0.60" height="0.001" color="#FF0000" shadow></a-cylinder>' +
         '<a-cylinder id="game-ring-2-pts" position="0 0.0072 0" radius="0.80" height="0.001" color="#FFFFFF" shadow></a-cylinder>' +
         '<a-cylinder id="game-ring-1-pts" position="0 0.0070 0" radius="1.00" height="0.001" color="#FF0000" shadow></a-cylinder>';
}

var tempMat4 = new THREE.Matrix4();
var tempScale = new THREE.Vector3();

function onUpdatedPlanes(evt) {
  var sc = AFRAME.scenes[0];
  evt.detail.anchors.forEach(function (anchor) {
    var created = false;
    var colorToUse;
    var plane = sc.querySelector('#plane_' + anchor.identifier);
  
    colorToUse = plane.getAttribute('material', 'color');

    // Update the plane.
    var dx = anchor.extent[0];
    var dz = anchor.extent[1];
    tempMat4.fromArray(anchor.modelMatrix);
    tempMat4.decompose(plane.tempPosition, plane.tempQuaternion, tempScale);
    plane.tempEuler.setFromQuaternion(plane.tempQuaternion);
    plane.tempRotation.set(
      plane.tempEuler.x * THREE.Math.RAD2DEG,
      plane.tempEuler.y * THREE.Math.RAD2DEG,
      plane.tempEuler.z * THREE.Math.RAD2DEG);
    plane.setAttribute('position', plane.tempPosition);
    plane.setAttribute('rotation', plane.tempRotation);
    // Currently, scale is always 1... 
    // plane.setAttribute('scale', evt.detail.scale);

    // If we have vertices, use polygon geometry
    if (anchor.vertices) {
      // anchor.vertices works for latest ARKit but not for latest ARCore; Float32Array issue?
      plane.setAttribute('geometry', {primitive:'polygon', vertices: anchor.vertices.join(',')});
    } else {
      plane.setAttribute('geometry', 'primitive:box; width:' + dx +
                                     '; height:0.001; depth:' + dz);                    
    }

    // Update the bounding box.
    var bbox = plane.querySelector('.bbox');
    bbox.setAttribute('width', dx);
    bbox.setAttribute('depth', dz);

    // Fill out the plane label with informative text.
    // DETAIL: when creating, getAttribute doesn't work this tick
    if (window.johnDebug) {
      plane.querySelector('.label').setAttribute('text', {
       width: dx, 
       height: dz, 
       color: 'gray',
       align: 'left',
       zOffset: 0.01,
       wrapCount: 100, value: 
        'id: ' + anchor.identifier
      + '\nwidth: ' + dx
      + '\ndepth: ' + dz
      + '\nposition x: ' + plane.tempPosition.x
      + '\nposition y: ' + plane.tempPosition.y
      + '\nposition z: ' + plane.tempPosition.z
      + '\nrotation x: ' + plane.tempRotation.x
      + '\nrotation y: ' + plane.tempRotation.y
      + '\nrotation z: ' + plane.tempRotation.z
      // Currently, scale is always 1... 
      //+ '\nscale x: ' + plane.getAttribute('scale').x
      //+ '\nscale y: ' + plane.getAttribute('scale').y
      //+ '\nscale z: ' + plane.getAttribute('scale').z
      });
    }
    

    // We updated the plane (or added it), so update the raycaster.
    // Because there may be a DOM change, we need to wait a tick.
    if (created) { setTimeout(raycasterNeedsUpdate); } else { raycasterNeedsUpdate(); }

    return plane;
  });                  
}

var planeCreated = false;
function onAddedPlanes(evt) {
  var sc = AFRAME.scenes[0];
  evt.detail.anchors.forEach(function (anchor) {
    var created = false;
    var colorToUse;
    var plane = sc.querySelector('#plane_' + anchor.identifier);
    if (!plane && !planeCreated) {
      planeCreated = true;  //Only create the plane once
      // Create and append the plane.
      created = true;
      colorToUse = randomColors[Math.floor(Math.random() * randomColors.length)];
      plane = document.createElement('a-entity');
      plane.setAttribute('id', 'plane_' + anchor.identifier);
      plane.setAttribute('class', 'plane');
      plane.setAttribute('height', 0.001);
      //plane.setAttribute('geometry', 'primitive: plane;');
      //plane.setAttribute('material', 'shader:flat; src: url(https://cdn.glitch.com/4f6957bd-cb74-44f6-808c-17ff6a8fa316%2Fgrass.jpg?1509560768477);repeat: 300 300;');
      plane.setAttribute('material', 'shader:grid;interval:0.1;side:double;opacity:0.5;color:' + colorToUse);

      sc.appendChild(plane);

      plane.insertAdjacentHTML('beforeend',                   

        // Add a plane label (which needs to be rotated to match a-box).
        '<a-entity class="label" rotation="-90 0 0"></a-entity>' + createGameBoard() +
        // Add a thing to mark the center of the plane.
        '<a-entity thing></a-entity>');
        
      // Create the temp objects we will use when updating.
      plane.tempPosition = new THREE.Vector3();
      plane.tempQuaternion = new THREE.Quaternion();
      plane.tempEuler = new THREE.Euler(0, 0, 0, 'YXZ');
      plane.tempRotation = new THREE.Vector3();            
    } else {
      colorToUse = plane.getAttribute('material', 'color');
    }

    // Update the plane.
    var dx = anchor.extent[0];
    var dz = anchor.extent[1];
    tempMat4.fromArray(anchor.modelMatrix);
    tempMat4.decompose(plane.tempPosition, plane.tempQuaternion, tempScale);
    plane.tempEuler.setFromQuaternion(plane.tempQuaternion);
    plane.tempRotation.set(
      plane.tempEuler.x * THREE.Math.RAD2DEG,
      plane.tempEuler.y * THREE.Math.RAD2DEG,
      plane.tempEuler.z * THREE.Math.RAD2DEG);
    plane.setAttribute('position', plane.tempPosition);
    plane.setAttribute('rotation', plane.tempRotation);
    // Currently, scale is always 1... 
    // plane.setAttribute('scale', evt.detail.scale);

    // If we have vertices, use polygon geometry
    if (anchor.vertices) {
      // anchor.vertices works for latest ARKit but not for latest ARCore; Float32Array issue?
      plane.setAttribute('geometry', {primitive:'polygon', vertices: anchor.vertices.join(',')});
    } else {
      plane.setAttribute('geometry', 'primitive:box; width:' + dx +
                                     '; height:0.001; depth:' + dz);                    
    }

    // Update the bounding box.
    var bbox = plane.querySelector('.bbox');
    bbox.setAttribute('width', dx);
    bbox.setAttribute('depth', dz);

    if (window.johnDebug) {
      // Fill out the plane label with informative text.
      // DETAIL: when creating, getAttribute doesn't work this tick
      plane.querySelector('.label').setAttribute('text', {
       width: dx, 
       height: dz, 
       color: 'gray',
       align: 'left',
       zOffset: 0.01,
       wrapCount: 100, value: 
        'id: ' + anchor.identifier
      + '\nwidth: ' + dx
      + '\ndepth: ' + dz
      + '\nposition x: ' + plane.tempPosition.x
      + '\nposition y: ' + plane.tempPosition.y
      + '\nposition z: ' + plane.tempPosition.z
      + '\nrotation x: ' + plane.tempRotation.x
      + '\nrotation y: ' + plane.tempRotation.y
      + '\nrotation z: ' + plane.tempRotation.z
      // Currently, scale is always 1... 
      //+ '\nscale x: ' + plane.getAttribute('scale').x
      //+ '\nscale y: ' + plane.getAttribute('scale').y
      //+ '\nscale z: ' + plane.getAttribute('scale').z
      });
    }

    // We updated the plane (or added it), so update the raycaster.
    // Because there may be a DOM change, we need to wait a tick.
    if (created) { setTimeout(raycasterNeedsUpdate); } else { raycasterNeedsUpdate(); }

    return plane;
  });                  
}

function onRemovedPlanes(evt) {
  var sc = AFRAME.scenes[0];
  evt.detail.anchors.forEach(function (anchor) {
    var plane = sc.querySelector('#plane_' + anchor.identifier);
    if (plane && plane.parentElement) {
      plane.parentElement.removeChild(plane);
      var dice = document.getElementsByClassName('dice').childNodes;
      for (var i=dice.length; i>=0; i--) {
        dice[i].parentNode.removeChild(dice[i]);
      }
    }          
  });
}            

function addPlaneListeners() {
  var sc = AFRAME.scenes[0];
  // Listen for plane events that aframe-ar generates.
  sc.addEventListener('anchorsadded', onAddedPlanes);
  sc.addEventListener('anchorsupdated', onUpdatedPlanes);
  sc.addEventListener('anchorsremoved', onRemovedPlanes);
}

var numDice = 0;
function clickListener() {
  var sc = AFRAME.scenes[0];
  // If the cursor has an intersection, place a marker.
  var cursor = sc.querySelector('[ar-raycaster]').components.cursor;
  if (cursor.intersection) {
    var marker = document.getElementById('original-dice').cloneNode(true);
    marker.setAttribute('id', 'dice-' + numDice);
    marker.setAttribute('position', cameraPosition.x + ' ' + cameraPosition.y + ' ' + cameraPosition.z);
    
    var throwAnimation = document.createElement("a-animation");
        throwAnimation.setAttribute("attribute","position");
        throwAnimation.setAttribute("to", cursor.intersection.point.x + ' ' + (cursor.intersection.point.y + 0.05)  + ' ' + cursor.intersection.point.z);
        throwAnimation.setAttribute("dur","1000");
        throwAnimation.setAttribute("repeat","0");
    marker.appendChild(throwAnimation);
    
    var rotateAnimation = document.createElement("a-animation");
        rotateAnimation.setAttribute("attribute","rotation");
        rotateAnimation.setAttribute("to","0 360 360");
        rotateAnimation.setAttribute("dur","1000");
    marker.appendChild(rotateAnimation);
    
    sc.appendChild(marker);         
  }

  /*
  // Show plane info on click.
  // (may not have arDisplay until tick after loaded)
  var ardisplay = sc.components['three-ar'].arDisplay;
  if (!ardisplay) { showHUD('no ardisplay?'); } else {
    // Old versions of WebARonARKit don't expose getPlanes() correctly.
    var planes = ardisplay.getPlanes ? ardisplay.getPlanes() : ardisplay.anchors_;

    var keys = Object.keys(sc.components['three-ar-planes'].planes);
    var msg = planes.length + ' (vs. ' + keys.length + ': ' + keys.join(',') + ')\n\n';
    showHUD(msg);
    */
  }
//function showHUD(msg) { sc.querySelector('#hud').setAttribute('value', msg); }
