let TrigUtils = {};

function solve_for_angle(opposite, adjacent) {
  // solve for angle x
  var tanx = opposite / adjacent;
  var atanx = Math.atan(tanx); // (result in radians)
  
  return from_radians_to_degree(atanx); // converted to degrees
}

function from_radians_to_degree(radians) {
  return radians * 180 / Math.PI;
}

function from_degree_to_radians(degree) {
  return degree * Math.PI / 180;
}

function solve_for_opposite(hypotenuse, angle) {
  return hypotenuse * Math.sin(from_degree_to_radians(angle));
}

function solve_for_adjacent(hypotenuse, angle) {
  return hypotenuse * Math.cos(from_degree_to_radians(angle));
}

function solve_for_hypotenuse(opposite, adjacent) {
  return Math.sqrt((Math.pow(opposite, 2) + Math.pow(adjacent, 2)));
}

function find_position(deltaZ, deltaX, distance, from) {
  var angle = solve_for_angle(deltaZ, deltaX);
  
  var dZ = solve_for_opposite(distance, angle);
  var dX = solve_for_adjacent(distance, angle);
  
  //alert(angle + ' ' + dZ + ' ' + dX);
  
  return {
    x: from.x + dX,
    y: from.y,
    z: from.z + dZ
  };  
}

function point_intersect_circle(point, circle, radius) {
  var dx = Math.abs(point.x - circle.x);
  var dy = Math.abs(point.z - circle.z);
  return Math.sqrt(dx + dy) < radius;
}

function find_position_between(from, to, percentOfDistance) {
  var deltaZ = to.z - from.z;
  var deltaX = to.x - from.x;
  
  var distance = solve_for_hypotenuse(deltaZ, deltaX);
  
  // % of from to point
  var newDistance = distance * percentOfDistance;
  
  //alert(deltaZ + ' ' + deltaX + ' ' + distance + ' ' + newDistance);
  
  return find_position(deltaZ, deltaX, newDistance, from);
};