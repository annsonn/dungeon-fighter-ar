var randomColors = ['lightred', 'white', 'lightgreen', 'lightblue'];
var GAME_STATE = {
  player: 10,
  monster: 10,
  win: false
};

window.johnDebug = false;
var raycasterUpdateNeeded = false;
var raycasterInterval;
var clickHandling = false
var planeCreated = false;

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
         '<a-cylinder id="game-ring-5-pts" class="board" position="0 0.0078 0" radius="0.20" height="0.001" color="#FF0000" shadow></a-cylinder>' +
         '<a-cylinder id="game-ring-4-pts" class="board" position="0 0.0076 0" radius="0.40" height="0.001" color="#FFFFFF" shadow></a-cylinder>' +
         '<a-cylinder id="game-ring-3-pts" class="board" position="0 0.0074 0" radius="0.60" height="0.001" color="#FF0000" shadow></a-cylinder>' +
         '<a-cylinder id="game-ring-2-pts" class="board" position="0 0.0072 0" radius="0.80" height="0.001" color="#FFFFFF" shadow></a-cylinder>' +
         '<a-cylinder id="game-ring-1-pts" class="board" position="0 0.0070 0" radius="1.00" height="0.001" color="#FF0000" shadow></a-cylinder>';
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
      });
    }
    

    // We updated the plane (or added it), so update the raycaster.
    // Because there may be a DOM change, we need to wait a tick.
    if (created) { setTimeout(raycasterNeedsUpdate); } else { raycasterNeedsUpdate(); }

    return plane;
  });                  
}

function onAddedPlanes(evt) {
  var sc = AFRAME.scenes[0];
  evt.detail.anchors.forEach(function (anchor) {
    var created = false;
    var colorToUse;
    var plane = sc.querySelector('#plane_' + anchor.identifier);
    if (!plane && !planeCreated) {
      planeCreated = true;  //Only create the plane once
      var loadingText = document.querySelector("#debug");
      loadingText.setAttribute('class', 'hidden');

    
      // Create and append the plane.
      created = true;
      colorToUse = randomColors[Math.floor(Math.random() * randomColors.length)];
      plane = document.createElement('a-plane');
      plane.setAttribute('id', 'plane_' + anchor.identifier);
      plane.setAttribute('class', 'plane');
      plane.setAttribute('height', 0.001);
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
      // plane.parentElement.removeChild(plane);
      var dice = document.getElementsByClassName('dice');
      while (dice.length > 0) {
        dice[0].parentNode.removeChild(dice[0]);
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

function fudgePosition(position) {
  var maxMissDistance = 0.3; 
  
  var randomXDistance = Math.random() * maxMissDistance;
  var randomZDistance = Math.random() * maxMissDistance;
  if (Math.random() > 0.5) {
    position.x = position.x + randomXDistance;
  } else {
    position.x = position.x - randomXDistance;
  }
  
  if (Math.random() > 0.5) {
    position.z = position.z + randomXDistance;
  } else {
    position.z = position.z - randomXDistance;
  }
  
  return position;
}


// Handling Throw
function clickListener() {
  var sc = AFRAME.scenes[0];
  // If the cursor has an intersection, place a marker.
  var cursor = sc.querySelector('[ar-raycaster]').components.cursor;
  if (cursor.intersection && !clickHandling) {
    clickHandling = true;
    
    var totalAnimationTime = 3000;
    var fromPosition = cameraPosition;
    var toPosition = fudgePosition(cursor.intersection.point);
    
    var bounceAtPercent = 0.80;
    var bounceDuration = totalAnimationTime * bounceAtPercent;
    var rollDuration = totalAnimationTime - bounceDuration;
    var diceColour = randomColors[Math.floor(Math.random() * randomColors.length)];
    
    setTimeout(function(){ clickHandling = false; }, totalAnimationTime);
    
    var marker = document.createElement('a-box');
    marker.setAttribute('class', "dice");
    marker.setAttribute('width', "0.1");
    marker.setAttribute('depth', "0.1");
    marker.setAttribute('height', "0.1");
    marker.setAttribute('color', diceColour);
    marker.setAttribute('position', fromPosition.x + ' ' + fromPosition.y + ' ' + fromPosition.z);
    
    var bouncePosition = find_position_between(fromPosition, toPosition, bounceAtPercent);
    
    //alert(JSON.stringify(fromPosition) + JSON.stringify(toPosition) + JSON.stringify(bouncePosition));
    
    // Creating animation to move dice to cursor from camera position 
    var throwAnimation = document.createElement("a-animation");
        throwAnimation.setAttribute("attribute","position");
        throwAnimation.setAttribute("from", fromPosition.x + ' ' + fromPosition.y  + ' ' + fromPosition.z);
        throwAnimation.setAttribute("to", bouncePosition.x + ' ' + (toPosition.y + 0.05)  + ' ' + bouncePosition.z);
        throwAnimation.setAttribute("dur", bounceDuration + '');
        throwAnimation.setAttribute("repeat","0");
    marker.appendChild(throwAnimation);
    
    var rollAnimation = document.createElement("a-animation");
        rollAnimation.setAttribute("attribute","position");
        rollAnimation.setAttribute("from", bouncePosition.x + ' ' + (toPosition.y + 0.05)  + ' ' + bouncePosition.z);
        rollAnimation.setAttribute("to", toPosition.x + ' ' + (toPosition.y + 0.05)  + ' ' + toPosition.z);
        rollAnimation.setAttribute("begin", bounceDuration + '');
        rollAnimation.setAttribute("dur", rollDuration + '');
        rollAnimation.setAttribute("repeat","0");
    marker.appendChild(rollAnimation);
    
    // Creating animation to rotate dice
    var rotateAnimation1 = document.createElement("a-animation");
        rotateAnimation1.setAttribute("attribute", "rotation");
        rotateAnimation1.setAttribute("to", "0 360 360");
        rotateAnimation1.setAttribute("dur", bounceDuration + '');
    marker.appendChild(rotateAnimation1);
    
    var rotateAnimation2 = document.createElement("a-animation");
        rotateAnimation2.setAttribute("attribute", "rotation");
        rotateAnimation2.setAttribute("to", "360 360 0");
        rotateAnimation2.setAttribute("begin", bounceDuration + '');
        rotateAnimation2.setAttribute("dur", rollDuration + '');
    marker.appendChild(rotateAnimation2);
    
    sc.appendChild(marker);
    
    alert("detected hits: " + checkIntersectWithGameboard(toPosition));
    updateGameStateOnIntersection();
  }
   
}

function updateGameStateOnIntersection() {
  // Show plane info on click.
  // (may not have arDisplay until tick after loaded)
  var ardisplay = sc.components['three-ar'].arDisplay;
  if (!ardisplay) { 
    showText('#debug', 'no ardisplay?'); 
  } else {
    // Old versions of WebARonARKit don't expose getPlanes() correctly.
    var planes = ardisplay.getPlanes ? ardisplay.getPlanes() : ardisplay.anchors_;
    var keys = Object.keys(sc.components['three-ar-planes'].planes);
    var msg = planes.length + ' (vs. ' + keys.length + ': ' + keys.join(',') + ')\n\n';
    
    showText('#monster-health', 'M:' + decreaseMonsterHealth());
    showText('#player-health', 'P: ' + decreasePlayerHealth());
    showText('#debug', '');
  }
}

function decreaseMonsterHealth() {
  var newHealth = GAME_STATE.monster - 1;
  GAME_STATE.monster = newHealth;
  return newHealth;
}

function decreasePlayerHealth() {
  var newHealth = GAME_STATE.player + 1;
  GAME_STATE.player = newHealth;
  return newHealth;
}
  
function showText(selector, msg) {
  var sc = AFRAME.scenes[0];
  sc.querySelector(selector).setAttribute('value', msg); 
}

function checkIntersectWithGameboard(point) {
  var getPositionFromAttribute = function(attribute) {
    var attrArray = attribute.split(' ');
    return {
      x: attrArray[0],
      y: attrArray[1],
      z: attrArray[2]
    };
  }
  
  var sc = AFRAME.scenes[0];
  var boards = sc.querySelector('.board');
  var hits = [];
  for (var i=0; i < boards.length-1; i++) {
    var radius = boards[i].getAttribute('position');
    var boardPosition = getPositionFromAttribute(boards[i].getAttribute('position'));
    hits.push(point_intersect_circle(point, boardPosition, radius));
  }
  
  return hits;
}