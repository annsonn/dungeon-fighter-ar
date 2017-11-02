var randomColors = ['lightred', 'white', 'lightgreen', 'lightblue'];
var GAME_STATE = {
  player: 10,
  monster: 10,
  win: false,
  lose: false
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
  return '<a-cylinder id="game-ring-5-pts" score="5" class="board" position="0 0.0078 0" radius="0.20" height="0.001" color="#FF0000" shadow></a-cylinder>' +
         '<a-cylinder id="game-ring-4-pts" score="4" class="board" position="0 0.0076 0" radius="0.40" height="0.001" color="#FFFFFF" shadow></a-cylinder>' +
         '<a-cylinder id="game-ring-3-pts" score="3" class="board" position="0 0.0074 0" radius="0.60" height="0.001" color="#FF0000" shadow></a-cylinder>' +
         '<a-cylinder id="game-ring-2-pts" score="2" class="board" position="0 0.0072 0" radius="0.80" height="0.001" color="#FFFFFF" shadow></a-cylinder>' +
         '<a-cylinder id="game-ring-1-pts" score="1" class="board" position="0 0.0070 0" radius="1.00" height="0.001" color="#FF0000" shadow></a-cylinder>' +
    
        '<a-text scale="1 1 1" position="0 0.01 0" value="5" align="center" color="#FFFFFF">' +
          '<a-animation attribute="rotation" to="-90 0 0" dur="5" repeat="0"></a-animation>' +
        '</a-text>'+
        '<a-text scale="1 1 1" position="-0.3 0.01 0" value="4" align="center" color="#FF0000">' +
          '<a-animation attribute="rotation" to="-90 0 0" dur="5" repeat="0"></a-animation>' +
        '</a-text>'+
        '<a-text scale="1 1 1" position="-0.5 0.01 0" value="3" align="center" color="#FFFFFF">' +
          '<a-animation attribute="rotation" to="-90 0 0" dur="5" repeat="0"></a-animation>' +
        '</a-text>'+
        '<a-text scale="1 1 1" position="-0.7 0.01 0" value="2" align="center" color="#FF0000">' +
          '<a-animation attribute="rotation" to="-90 0 0" dur="5" repeat="0"></a-animation>' +
        '</a-text>'+
        '<a-text scale="1 1 1" position="-0.9 0.01 0" value="1" align="center" color="#FFFFFF">' +
          '<a-animation attribute="rotation" to="-90 0 0" dur="5" repeat="0"></a-animation>' +
        '</a-text>'
    ;
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
      plane.setAttribute('id', 'plane');
      plane.setAttribute('class', 'plane');
      plane.setAttribute('height', 0.001);
      plane.setAttribute('position', '0 0 0');
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
      //plane.parentElement.removeChild(plane);
      //removeDice();
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
    var toPosition = cursor.intersection.point;
    // var toPosition = fudgePosition(cursor.intersection.point);
    
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
    
    updateGameStateOnIntersection(getScoreFromIntersectWithGameboard(toPosition));
  }
   
}

function createEndGameText(msg, color) {
  if (!document.querySelector('#endGameText')) {
    document.querySelector('#monster-health').setAttribute('visible', false);
    document.querySelector('#player-health').setAttribute('visible', false);

    var value = "value: " + msg + '; font: #optimerBoldFont';
    var endGameText = document.createElement('a-entity');
    endGameText.setAttribute('id', 'endGameText');
    endGameText.setAttribute('position', '0 0.1 0');
    endGameText.setAttribute('material', 'color: ' + color);
    endGameText.setAttribute('text-geometry', value); 

    var animation = document.createElement('a-animation');
    animation.setAttribute('attribute', 'position');
    animation.setAttribute('to', '0 1 1');
    animation.setAttribute('dur', '1000');
    animation.setAttribute('repeat', 'infinite');
    animation.setAttribute('direction', 'alternate');
    animation.setAttribute('easing', 'ease-out');
    endGameText.appendChild(animation);

    sc.appendChild(endGameText);
  }
}

function updateGameStateOnIntersection(score) {
  //alert(score);
  // Show plane info on click.
  // (may not have arDisplay until tick after loaded)
  var ardisplay = sc.components['three-ar'].arDisplay;
  if (ardisplay) { 
    if(!healthExists()) {
      createHealthElements();
    }
    
    if (score > 0) {
      decreaseMonsterHealth(score);
    } else {
      decreasePlayerHealth(score);
    }
    
    showText('#monster-health', 'M:' + GAME_STATE.monster);
    showText('#player-health', 'P: ' + GAME_STATE.player);
    
    if (GAME_STATE.win || GAME_STATE.lose) {
      if (GAME_STATE.win) {
        createEndGameText('YOU WIN!', 'gold');
      }

      if (GAME_STATE.lose) {
        createEndGameText('YOU LOSE', 'brown');
      }
      setTimeout(resetGameState, 10000);
    }
    
  }
}

function healthExists() {
  return document.querySelector('#monster-health') && document.querySelector('#player-health');
}

function resetGameState() {
  GAME_STATE = {
    player: 10,
    monster: 10,
    win: false,
    lose: false
  };
  removeDice();
}

function removeDice() {
  var dice = document.getElementsByClassName('dice');
  while (dice.length > 0) {
    dice[0].parentNode.removeChild(dice[0]);
  }
}

function createHealthElements() {
  var playerHealth = document.createElement('a-entity');
  playerHealth.setAttribute('id', 'player-health');
  playerHealth.setAttribute('scale', '0.5 0.5 0.5');
  playerHealth.setAttribute('position', '-0.5 0.25 0');
  playerHealth.setAttribute('material', 'color: blue');
  sc.appendChild(playerHealth);
  
  var monsterHealth = document.createElement('a-entity');
  monsterHealth.setAttribute('id', 'monster-health');
  monsterHealth.setAttribute('scale', '0.5 0.5 0.5');
  monsterHealth.setAttribute('position', '0.5 0.25 0');
  monsterHealth.setAttribute('material', 'color: red');
  sc.appendChild(monsterHealth);
  
}

function decreaseMonsterHealth(score) {
  GAME_STATE.monster = GAME_STATE.monster - score;
  if (GAME_STATE.monster <= 0) {
    GAME_STATE.win = true;
  }
}

function decreasePlayerHealth(score) {
  GAME_STATE.player = GAME_STATE.player - score;
  if (GAME_STATE.player <= 0) {
    GAME_STATE.lose = true;
  }
}
  
function showText(selector, msg) {
  var value = "value: " + msg + '; font: #optimerBoldFont';
  document.querySelector(selector).setAttribute('text-geometry', value); 
}

function getScoreFromIntersectWithGameboard(point) {
  var boards = document.querySelectorAll('.board');
  
  // var position = document.querySelector('a-plane').getAttribute('position');
  var scores = [];
  boards.forEach(function (board) {
    var id = board.getAttribute('id');
    var radius = parseFloat(board.getAttribute('radius'));
    var position = board.getAttribute('position');
    var score = board.getAttribute('score');
    if (point_intersect_circle(normalize(point), position, radius)) {
      scores.push(parseInt(score));
    }
  });
  
  return scores.length > 0 ? Math.max.apply(null, scores) : 0;
}