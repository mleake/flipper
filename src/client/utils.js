export function boundaryToSVG(points) {
  var svgString = "M";
  for (var i = 0; i < Object.keys(points).length; i++) {
    var point = points[i];
    svgString += point.x.toString() + " " + point.y.toString() + " ";
  }
  return svgString;
}

export function isSuperset(set, subset) {
  for (let elem of subset) {
    if (!set.has(elem)) {
      return false;
    }
  }
  return true;
}

export function eqSet(as, bs) {
  if (as.size !== bs.size) return false;
  for (var a of as) if (!bs.has(a)) return false;
  return true;
}

export function unique(arr) {
  var u = {},
    a = [];
  for (var i = 0, l = arr.length; i < l; ++i) {
    if (!u.hasOwnProperty(arr[i])) {
      a.push(arr[i]);
      u[arr[i]] = 1;
    }
  }
  return a;
}

export function randomChoice(arr) {
  return arr[Math.floor(arr.length * Math.random())];
}

export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function findClosestPointOnLine(a, b, p) {
  var atob = { x: b.x - a.x, y: b.y - a.y };
  var atop = { x: p.x - a.x, y: p.y - a.y };
  var len = atob.x * atob.x + atob.y * atob.y;
  var dot = atop.x * atob.x + atop.y * atob.y;
  var t = Math.min(1, Math.max(0, dot / len));

  dot = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);

  return {
    point: {
      x: a.x + atob.x * t,
      y: a.y + atob.y * t,
    },
    left: dot < 1,
    dot: dot,
    t: t,
  };
}

export function sqr(x) {
  return x * x;
}

export function dist2(v, w) {
  return Math.sqrt(
    sqr(parseFloat(v.x) - parseFloat(w.x)) +
      sqr(parseFloat(v.y) - parseFloat(w.y))
  );
}

export function orientation(p1, p2, p3) {
  var val =
    (p2[1] - p1[1]) * (p3[0] - p2[0]) - (p2[0] - p1[0]) * (p3[1] - p2[1]);

  if (val == 0) return 0; // colinear
  if (val > 0) {
    return 1; //clockwise
  }
  return 2; //ccw
}

export function getCommonElements(arrays) {
  //Assumes that we are dealing with an array of arrays of integers
  var currentValues = {};
  var commonValues = {};
  for (var i = arrays[0].length - 1; i >= 0; i--) {
    //Iterating backwards for efficiency
    currentValues[arrays[0][i]] = 1; //Doesn't really matter what we set it to
  }
  for (var i = arrays.length - 1; i > 0; i--) {
    var currentArray = arrays[i];
    for (var j = currentArray.length - 1; j >= 0; j--) {
      if (currentArray[j] in currentValues) {
        commonValues[currentArray[j]] = 1; //Once again, the `1` doesn't matter
      }
    }
    currentValues = commonValues;
    commonValues = {};
  }
  return Object.keys(currentValues).map(function (value) {
    return parseInt(value);
  });
}

export function arraysEqual(_arr1, _arr2) {
  if (
    !Array.isArray(_arr1) ||
    !Array.isArray(_arr2) ||
    _arr1.length !== _arr2.length
  )
    return false;

  var arr1 = _arr1.concat().sort();
  var arr2 = _arr2.concat().sort();

  for (var i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }

  return true;
}
