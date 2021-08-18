/** Class representing a Face. */
export default class Face {
  /**
   * @param {Number} idx - face id.
   * @param {Set} edges - set of edge objects.
   */
  constructor(idx, edges) {
    this.idx = parseInt(idx);
    this.vertices = [];
    this.edges = edges;
    this.seams = [];
    this.svg = "";
  }

  /**
   * Adds a new vertex object and returns vertex id
   */
  addVertex(vertex) {
    //check if vertex already exists
    for (var i = 0; i < this.vertices.length; i++) {
      var existingVertex = this.vertices[i];
      if (vertex.equalTo(existingVertex)) {
        return i; //return existing index
      }
    }
    this.vertices.push(vertex);
    return vertex.idx; //return new index
  }

  /**
   * Adds all of the vertices for the edges
   */
  addVertices() {
    this.vertices = [];
    for (var i = 0; i < this.edges.length; i++) {
      var edge = this.edges[i];
      var start = edge.startVertex;
      var end = edge.endVertex;
      this.addVertex(start);
      this.addVertex(end);
    }
  }

  /**
   * Sorts the vertices in clockwise order 
   * based on https://stackoverflow.com/questions/45660743/sort-points-in-counter-clockwise-in-javascript
   */
  sortPoints() {
    // Array of points;
    const points = this.getVertices();
    // const points = this.getOrientedEdges();

    // Find min max to get center
    // Sort from top to bottom
    points.sort((a, b) => a.y - b.y);

    // Get center y
    const cy = (points[0].y + points[points.length - 1].y) / 2;

    // Sort from right to left
    points.sort((a, b) => b.x - a.x);

    // Get center x
    const cx = (points[0].x + points[points.length - 1].x) / 2;

    // Center point
    const center = { x: cx, y: cy };

    // Pre calculate the angles as it will be slow in the sort
    // As the points are sorted from right to left the first point
    // is the rightmost

    // Starting angle used to reference other angles
    var startAng;
    points.forEach((point) => {
      var ang = Math.atan2(point.y - center.y, point.x - center.x);
      if (!startAng) {
        startAng = ang;
      } else {
        if (ang < startAng) {
          // ensure that all points are clockwise of the start point
          ang += Math.PI * 2;
        }
      }
      point.angle = ang; // add the angle to the point
    });

    // first sort clockwise
    points.sort((a, b) => a.angle - b.angle);

    return points;
  }
 
  /**
   * Creates the SVG string for the face
   * note: the edges need to be oriented either cw or ccw for the svg
   */
  boundaryToSVG() {
    var points = this.getOrientedEdges();
    var svgString = "M";
    for (var i = 0; i < points.length; i++) {
      var point = points[i];
      svgString += point.x.toString() + " " + point.y.toString() + " ";
    }
    svgString += points[0].x.toString() + " " + points[0].y.toString() + " ";
    this.svg = svgString;
    return svgString;
  }

  /**
   * Returns the next edge around the face -- either cw or ccw
   * (helper for getting the oriented edges)
   * @param {Edge} edge - current edge.
   * @param {Set} used - set of used edges.
   */
  getNextEdge(edge, used) {
    for (var i = 0; i < this.edges.length; i++) {
      var otherEdge = this.edges[i];
      if (
        otherEdge.startVertex == edge.endVertex &&
        edge != otherEdge &&
        !used.has(otherEdge)
      ) {
        return { edge: otherEdge, vertex: otherEdge.endVertex };
      }
    }
    for (var i = 0; i < this.edges.length; i++) {
      var otherEdge = this.edges[i];
      if (
        otherEdge.endVertex == edge.endVertex &&
        edge != otherEdge &&
        !used.has(otherEdge)
      ) {
        return { edge: otherEdge, vertex: otherEdge.startVertex };
      }
    }
    for (var i = 0; i < this.edges.length; i++) {
      var otherEdge = this.edges[i];
      if (
        otherEdge.startVertex == edge.startVertex &&
        edge != otherEdge &&
        !used.has(otherEdge)
      ) {
        return { edge: otherEdge, vertex: otherEdge.endVertex };
      }
    }
    for (var i = 0; i < this.edges.length; i++) {
      var otherEdge = this.edges[i];
      if (
        otherEdge.endVertex == edge.startVertex &&
        edge != otherEdge &&
        !used.has(otherEdge)
      ) {
        return { edge: otherEdge, vertex: otherEdge.startVertex };
      }
    }
    return null;
  }

  /**
   * Returns array of vertices oriented around the face
   */
  getOrientedEdges() {
    var edge = this.edges[0];
    var edges = [edge];
    var used = new Set();
    used.add(edge);
    var vertices = [];
    vertices.push(edge.startVertex);
    vertices.push(edge.endVertex);
    for (var i = 1; i < this.edges.length; i++) {
      var res = this.getNextEdge(edge, used, vertices);
      edge = res.edge;
      vertices.push(res.vertex);
      edges.push(edge);
      used.add(edge);
    }
    // console.log("oriented edges", edges, vertices);
    return vertices;
  }

  /**
   * Returns an array of {x: x0, y: y)} positions of vertices for the edges
   * note: vertices may not be oriented around the face
   */
  getVertices() {
    var points = [];
    for (var i = 0; i < this.edges.length; i++) {
      var edge = this.edges[i];
      var start = [edge.startVertex.x, edge.startVertex.y];
      var end = [edge.endVertex.x, edge.endVertex.y];
      var addStart = true;
      var addEnd = true;
      for (var j = 0; j < points.length; j++) {
        var point = points[j];
        if (start[0] == point.x && start[1] == point.y) {
          addStart = false;
        }
        if (end[0] == point.x && end[1] == point.y) {
          addEnd = false;
        }
      }
      if (addStart) {
        points.push({ x: edge.startVertex.x, y: edge.startVertex.y });
      }
      if (addEnd) {
        points.push({ x: edge.endVertex.x, y: edge.endVertex.y });
      }
    }
    return points;
  }

  /**
   * Returns an array of interior Edge objects for the face
   */
  getNonBoundaryEdges() {
    var nbEdges = [];
    for (var i = 0; i < this.edges.length; i++) {
      if (!this.edges[i].isBoundary) {
        var edge = this.edges[i];
        nbEdges.push(edge);
      }
    }
    return nbEdges;
  }

  /**
   * Returns an array of sets of edges corresponding to seams (not necessarily maximal)
   */
  getSeams() {
    var used = new Set();
    var seams = [];
    var nbEdges = this.getNonBoundaryEdges(); //interior edges
    console.log("nb edges", nbEdges)
    for (var i = 0; i < nbEdges.length; i++) {
      for (var j = i + 1; j < nbEdges.length; j++) {
        var edge = nbEdges[i];
        var otherEdge = nbEdges[j];
        if (edge.collinear(otherEdge)) {
          if (used.has(edge) || used.has(otherEdge)) {
            //set of collinear edges already exists
            for (var k = 0; k < seams.length; k++) {
              //need to add new edge to this set
              if (seams[k].has(edge)) {
                seams[k].add(otherEdge);
                used.add(otherEdge);
              } else {
                if (seams[k].has(otherEdge)) {
                  seams[k].add(edge);
                  used.add(edge);
                }
              }
            }
          } else {
            //need to create new collinear set of two seams
            seams.push(new Set([edge, otherEdge]));
            used.add(edge);
            used.add(otherEdge);
          }
        }
      }
    }
    for (var i = 0; i < nbEdges.length; i++) {
      // now we need to add binary edges
      var edge = nbEdges[i];
      if (!used.has(edge)) {
        var binEdge = new Set();
        binEdge.add(edge);
        used.add(edge);
        seams.push(binEdge);
      }
    }
    this.seams = seams;
  }

  
  /**
   * Returns an object {x: x0, y: y0} for the position of the center
   * note: accomodates both convex and concave polygons
   * code from: //https://stackoverflow.com/questions/9692448/how-can-you-find-the-centroid-of-a-concave-irregular-polygon-in-javascript
   */
  getCenter() {
    var pts = this.sortPoints();
    var first = pts[0],
      last = pts[pts.length - 1];
    if (first.x != last.x || first.y != last.y) pts.push(first);
    var twicearea = 0,
      x = 0,
      y = 0,
      nPts = pts.length,
      p1,
      p2,
      f;
    for (var i = 0, j = nPts - 1; i < nPts; j = i++) {
      p1 = pts[i];
      p2 = pts[j];
      f = p1.x * p2.y - p2.x * p1.y;
      twicearea += f;
      x += (p1.x + p2.x) * f;
      y += (p1.y + p2.y) * f;
    }
    f = twicearea * 3;
    return { x: x / f, y: y / f };
  }

}