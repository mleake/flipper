import Vertex from "./VertexHE";
import Seam from "./SeamHE";
import Face from "./FaceHE";
import MaximalSeam from "./MaximalSeamHE";
import Hypergraph from "./HypergraphHE";
import {
  boundaryToSVG,
  unique,
  shuffle,
  randomChoice,
  orientation,
  findClosestPointOnLine,
  dist2,
} from "./utils";
var getFaces = require("planar-dual");
var cc = require("connected-components");
const {
  checkIntersection,
  colinearPointWithinSegment,
} = require("line-intersect");
var inside = require("point-in-polygon");

/** Class representing a design. */
export default class Design {
  /**
   * Represents a design
   * @constructor
   * @param {Number} width - width of the design.
   * @param {Number} height - height of the design.
   */
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.vertexId = -1;
    this.seamId = -1;
    this.seams = {};
    this.vertices = {};
    this.faces = {};
    this.maximalSeams = {};
    this.hypergraph = {};
    this.overlappingSeams = [];
    this.sections = {};
    this.faceObjects = [];
    this.hypergraphs = {};
    this.edgeOrder = [];
  }

  /**
   * Adds a new vertex
   * @param {Number} x - x position.
   * @param {Number} y - y position.
   * @param {Boolean} isBoundary - whether vertex is on boundary.
   * @ return object {vertex: vertex obj, isNew: bool}
   */
  addVertex(x, y, isBoundary) {
    for (var i = 0; i < Object.keys(this.vertices).length; i++) {
      var existingVertex = this.vertices[Object.keys(this.vertices)[i]];
      var tempVertex = new Vertex(-1, x, y);
      if (existingVertex.equalTo(tempVertex)) {
        // console.log("using existing vertex");
        return { vertex: existingVertex, isNew: false };
      }
    }
    this.vertexId += 1; //update next vertex id
    var v = new Vertex(this.vertexId, x, y, isBoundary);
    this.vertices[v.idx] = v;
    return { vertex: v, isNew: true };
  }

  /**
   * Return existing seam if it exists or null otherwise
   * @param {Vertex} startVertex.
   * @param {Vertex} endVertex.
   * @ return Seam object if one exists or null otherwise
   */
  existingSeam(startVertex, endVertex) {
    var tempSeam = new Seam(-1, startVertex, endVertex);
    for (var i = 0; i < Object.keys(this.seams).length; i++) {
      var existingSeam = this.seams[Object.keys(this.seams)[i]];
      if (tempSeam.equalTo(existingSeam)) {
        return existingSeam;
      }
    }
    return null;
  }

  /**
   * Return existing seam if it exists or a newly created seam
   * @param {Vertex} startVertex.
   * @param {Vertex} endVertex.
   * @param {Boolean} isBoundary - whether seam is on boundary.
   * @ return Seam object
   */
  addSeam(startVertex, endVertex, isBoundary) {
    // console.log("adding seam from ", startVertex.x, startVertex.y, " to ", endVertex.x, endVertex.y)
    if (startVertex.equalTo(endVertex)) {
      //check that start and end vertices are different
      return null;
    }
    //check if seam already exists
    var existingSeam = this.existingSeam(startVertex, endVertex);
    if (existingSeam != null) {
      return existingSeam;
    }
    this.seamId += 1; //update next seam id
    var s = new Seam(this.seamId, startVertex, endVertex, isBoundary);
    this.seams[s.idx] = s;
    return s;
  }

  /**
   * Deletes seam by id
   * @param {Number} seamId.
   */
  deleteSeam(seamId) {
    var seam = this.seams[seamId];
    if (seam.isOuter) {
      return -1;
    }
    var startVertex = seam.startVertex.idx;
    var svDegree = this.getVertexDegree(startVertex);
    if (svDegree == 3) {
      //deleting stem from T-junction
      var seams = this.getSeamsAtVertex(seam.startVertex.idx);
      const otherSeams = seams.filter((seam) => seam.idx != seamId);
      if (otherSeams[0].collinear(otherSeams[1])) {
        //arms of T
        this.mergeSeams(otherSeams[0], otherSeams[1], seam.startVertex.idx);
      }
    }
    var endVertex = seam.endVertex.idx;
    var evDegree = this.getVertexDegree(endVertex);
    if (evDegree == 3) {
      //T-junction
      var seams = this.getSeamsAtVertex(seam.endVertex.idx);
      const otherSeams = seams.filter((seam) => seam.idx != seamId);
      if (otherSeams[0].collinear(otherSeams[1])) {
        //arms of T
        this.mergeSeams(otherSeams[0], otherSeams[1], seam.endVertex.idx);
      }
    }
    var newSeams = { ...this.seams };
    delete newSeams[seamId];
    this.seams = newSeams;
    svDegree = this.getVertexDegree(startVertex);
    if (svDegree == 0) {
      // dangling edge
      this.deleteVertex(startVertex);
    }
    evDegree = this.getVertexDegree(endVertex);
    if (evDegree == 0) {
      // dangling edge
      this.deleteVertex(endVertex);
    }
    this.getFaces(); //update faces after deleting
    return 0;
  }

  /**
   * Merging seams that share at least one vertex
   * @param {Seam} seam1.
   * @param {Seam} seam2.
   * @param {Vertex} vertexId - id of vertex to eliminate during merge.
   */
  mergeSeams(seam1, seam2, vertexId) {
    if (!seam1.intersects(seam2)) {
      console.log("trying to merge seams that don't intersect");
      return;
    }
    var endPts = [];
    if (seam1.startVertex.idx == vertexId) {
      endPts.push(seam1.endVertex);
    }
    if (seam1.endVertex.idx == vertexId) {
      endPts.push(seam1.startVertex);
    }
    if (seam2.startVertex.idx == vertexId) {
      endPts.push(seam2.endVertex);
    }
    if (seam2.endVertex.idx == vertexId) {
      endPts.push(seam2.startVertex);
    }
    seam1.startVertex = endPts[0];
    seam1.endVertex = endPts[1];
    var newSeams = { ...this.seams };
    delete newSeams[seam2.idx];
    this.seams = newSeams;
    var newVertices = { ...this.vertices };
    delete newVertices[vertexId];
    this.vertices = newVertices;
  }

  /**
   * Returns an array of seams that have a certain vertex
   * @param {Vertex} vertexId - id of vertex.
   * @return array of seams with vertex vertexId as an endpoint
   */
  getSeamsAtVertex(vertexId) {
    var vertex = this.vertices[vertexId];
    var seams = [];
    for (var i = 0; i < Object.keys(this.seams).length; i++) {
      var seam = this.seams[Object.keys(this.seams)[i]];
      if (seam.startVertex.idx == vertexId) {
        seams.push(seam);
      }
      if (seam.endVertex.idx == vertexId) {
        seams.push(seam);
      }
    }
    return seams;
  }

  /**
   * Returns the degree of the vertex
   * @param {Vertex} vertexId - id of vertex.
   * @return vertex degree
   */
  getVertexDegree(vertexId) {
    var vertex = this.vertices[vertexId];
    var degree = 0;
    for (var i = 0; i < Object.keys(this.seams).length; i++) {
      var seam = this.seams[Object.keys(this.seams)[i]];
      if (seam.startVertex.idx == vertexId) {
        degree += 1;
      }
      if (seam.endVertex.idx == vertexId) {
        degree += 1;
      }
    }
    return degree;
  }

  /**
   * Deletes a vertex by id and returns updated design
   * @param {Vertex} vertexId - id of vertex to delete.
   * @return updated design
   */
  deleteVertex(vertexId) {
    var okayToDelete = true;
    var foundVertex = null;
    var foundVertexKey;
    for (var i = 0; i < Object.keys(this.vertices).length; i++) {
      var idx = Object.keys(this.vertices)[i];
      var vertex = this.vertices[idx];
      if (parseInt(vertex.idx) == parseInt(vertexId)) {
        foundVertex = vertex;
        foundVertexKey = idx;
      }
    }
    if (foundVertex != null) {
      if (!foundVertex.isBoundary) {
        //can't delete vertex on boundary
        for (var i = 0; i < Object.keys(this.seams).length; i++) {
          var seamId = Object.keys(this.seams)[i];
          //check that no other seams are attached to vertex before deleting
          if (
            this.seams[seamId].startVertex.idx == vertexId ||
            this.seams[seamId].endVertex.idx == vertexId
          ) {
            okayToDelete = false;
          }
        }
        if (okayToDelete) {
          delete this.vertices[foundVertexKey];
          this.getFaces(); //update faces after deleting vertex
        }
      }
    }
    return this;
  }

  /**
   * Check if design is closed by checking that every
   * start and end vertex connects to other seams
   * @return true if design is closed
   */
  isClosed() {
    for (var i = 0; i < Object.keys(this.vertices).length; i++) {
      var vertexId = Object.keys(this.vertices)[i];
      var vertexDegree = this.getVertexDegree(this.vertices[vertexId].idx);
      if (vertexDegree < 2) {
        return false
      }
    }
    return true
  }

  getBoundarySeamsAtVertex(vertexId) {
    var seams = this.getSeamsAtVertex(vertexId);
    var boundarySeams = [];
    for (var i = 0; i < seams.length; i++) {
      if (seams[i].isBoundary) {
        boundarySeams.push(seams[i]);
      }
    }
    return boundarySeams;
  }
  /**
   * Check if section boundaries are closed by checking that every
   * start and end vertex connects to other seams
   * @return true if boundaries is closed
   */
  isClosedSection() {
    for (var i = 0; i < Object.keys(this.seams).length; i++) {
      var seamId = Object.keys(this.seams)[i];
      var seam = this.seams[seamId];
      if (seam.isBoundary) {
        if (seam.startSeam == null || seam.endSeam == null) {
          return false;
        }
        var startSeams = this.getBoundarySeamsAtVertex(seam.startVertex.idx);
        var endSeams = this.getBoundarySeamsAtVertex(seam.endVertex.idx);
        if (startSeams.length < 2 || endSeams.length < 2) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Returns the point in the center of the face
   * @param {Number} faceId - id of face.
   * @return object {x: x0, y: y0} for center of face
   */
  getFaceCenter(faceId) {
    var face = this.faces[faceId];
    var facePoints = [];
    var x = 0;
    var y = 0;
    for (var l = 0; l < face.length; l++) {
      var vertex = this.vertices[face[l]];
      x += vertex.x;
      y += vertex.y;
    }
    var centX = x / face.length;
    var centY = y / face.length;
    return { x: centX, y: centY };
  }

  /**
   * Updates the set of edges that each of the faces point to
   */
  updateFacePointers() {
    for (var i = 0; i < this.maximalSeams.length; i++) {
      var edge = maximalSeams[i];
      edge.faces = new Set();
      for (var j = 0; j < this.faceObjects.length; j++) {
        var face = this.faceObjects[j];
        if (face.edges.indexOf(edge) > -1) {
          edge.faces.add(face);
        }
      }
    }
  }

  /**
   * Poplulates face ojbect based on vertices and seams
   * @return object holding faces
   */
  getFaces() {
    this.faces = {};
    this.faceObjects = [];
    var verts = [];
    var vertIds = [];
    //create array of vertex positions
    Object.keys(this.vertices).map((vid) => {
      var vertex = this.vertices[vid];
      verts.push([vertex.x, vertex.y]);
      vertIds.push(vertex.idx);
    });
    //create array of [start, end] vertex ids
    var edges = [];
    Object.keys(this.seams).map((sid) => {
      var seam = this.seams[sid];
      //need index of verts not vert id
      var sv = vertIds.indexOf(seam.startVertex.idx);
      var ev = vertIds.indexOf(seam.endVertex.idx);
      edges.push([sv, ev]);
    });
    if (this.isClosed()) {
      var faces = getFaces(edges, verts);
      var faceList = faces.slice(1);
      faceList.forEach((face, fid) => {
        var faceMapped = [];
        face.forEach((v) => {
          faceMapped.push(vertIds[v]);
        });
        this.faces[fid] = faceMapped;
        var seams = this.getSeamsFromFace(fid);
        this.addFace(seams);
      });
      this.updateFacePointers(); //point the edges to the proper faces
    }
    else {
      console.log("design not closed")
    }
    return this.faces;
  }

  /**
   * Updates the position of a vertex by id
   * @param {Number} vertexId - id of vertex.
   * @param {Number} newX - new vertex x.
   * @param {Number} newY - new vertex y.
   * @return updated design
   */
  updateVertexPosition(vertexId, newX, newY) {
    var vIdx = -1;
    Object.keys(this.vertices).map((vid) => {
      var vertex = this.vertices[vid];
      if (vertex.idx == vertexId) {
        this.vertices[vertexId].x = newX;
        this.vertices[vertexId].y = newY;
      }
    });
    this.getFaces(); //check design is closed and faces are okay
    this.createHyperGraph();
    var valid = this.isValid();
    return this;
  }

  /**
   * Updates which faces are assigned to each section
   */
  getSections() {
    var verts = [];
    var vertIds = [];
    Object.keys(this.vertices).map((vid) => {
      var vertex = this.vertices[vid];
      if (vertex.isBoundary) {
        verts.push([vertex.x, vertex.y]);
        vertIds.push(vertex.idx);
      }
    });
    var edges = [];
    Object.keys(this.seams).map((sid) => {
      var seam = this.seams[sid];
      //need index of verts not vert id
      if (seam.isBoundary) {
        var sv = vertIds.indexOf(seam.startVertex.idx);
        var ev = vertIds.indexOf(seam.endVertex.idx);
        edges.push([sv, ev]);
      }
    });
    var faceSections = getFaces(edges, verts);
    var secList = faceSections.slice(1);

    //vertices for each section
    var sections = {};
    secList.forEach((face, fid) => {
      var secMapped = [];
      face.forEach((v) => {
        secMapped.push(vertIds[v]);
      });
      sections[fid] = secMapped;
    });
    //now figure out which faces are within each section
    // check which faces have at least 2 seams
    var sectionFaces = {};
    for (var i = 0; i < Object.keys(sections).length; i++) {
      var sectionId = Object.keys(sections)[i];
      sectionFaces[sectionId] = [];
      var section = sections[sectionId];
      var sectionPoints = [];
      var polygon = [];
      for (var j = 0; j < section.length; j++) {
        var vertex = this.vertices[section[j]];
        polygon.push([vertex.x, vertex.y]);
      }
      for (var k = 0; k < Object.keys(this.faces).length; k++) {
        var faceId = Object.keys(this.faces)[k];
        var face = this.faces[faceId];
        var facePoints = [];
        var x = 0;
        var y = 0;
        for (var l = 0; l < face.length; l++) {
          var vertex = this.vertices[face[l]];
          x += vertex.x;
          y += vertex.y;
        }
        var centX = x / face.length;
        var centY = y / face.length;
        if (inside([centX, centY], polygon)) {
          sectionFaces[sectionId].push(faceId);
        }
      }
    }
    this.sections = sectionFaces;
  }

  /**
   * Returns the SVG polygons for each face in the design
   * @return object with key = face and value = svg string
   */
  getPolys() {
    var polys = {};
    for (var i = 0; i < Object.keys(this.faces).length; i++) {
      var faceId = Object.keys(this.faces)[i];
      var face = this.faces[faceId];
      var facePoints = [];
      for (var j = 0; j < face.length; j++) {
        var vertex = this.vertices[face[j]];
        facePoints.push(vertex);
      }
      var poly = boundaryToSVG(facePoints);
      polys[faceId] = poly;
    }
    return polys;
  }

  /**
   * Adds a new face object and returns the id of that face
   * @constructor
   * @param {Set} edges - set of seam objects.
   */
  addFace(edges) {
    var idx = this.faceObjects.length;
    var newFace = new Face(idx, edges);
    newFace.addVertices();
    newFace.getSeams();
    for (var i = 0; i < this.faceObjects.length; i++) {
      var existingFace = this.faceObjects[i];
      if (existingFace.vertices == newFace.vertices) {
        return existingFace.idx;
      }
    }
    this.faceObjects.push(newFace);
    return this.faceObjects.length - 1; //return new index
  }

  /**
   * Gets the section assignment for a face
   * @param {Number} faceId
   * @return section id
   */
  getSectionFromFace(faceId) {
    for (var i = 0; i < Object.keys(this.sections).length; i++) {
      var sectionId = Object.keys(this.sections)[i];
      var faces = this.sections[sectionId];
      if (faces.indexOf(faceId) > -1) {
        return sectionId;
      }
    }
    return -1;
  }

  /**
   * Adds a new seam object and returns the Seam object
   * @param {set} edges - set of edge objects.
   */
  addMaximalSeam(edges) {
    var idx = this.maximalSeams.length;
    for (var i = 0; i < this.maximalSeams.length; i++) {
      var existingSeam = this.maximalSeams[i];
      let intersection = new Set(
        [...existingSeam.edges].filter((x) => edges.has(x))
      );
      if (intersection.size == edges.size) {
        return existingSeam;
      }
    }
    var newSeam = new MaximalSeam(idx, new Set(edges));
    newSeam.getFaces();
    var seamFaces = newSeam.faces;
    var firstFace = seamFaces.values().next().value;
    var section = this.getSectionFromFace(firstFace.idx.toString());
    newSeam.assignSection(section);
    return newSeam;
  }

  /**
   * Find a seam by the vertices
   * @param {Vertex} v1 -- vertex
   * @param {Vertex} v2 -- vertex
   * @return seam if it exists or null otherwise
   */
  getSeamFromVertices(v1, v2) {
    for (var i = 0; i < Object.keys(this.seams).length; i++) {
      var sid = Object.keys(this.seams)[i];
      var seam = this.seams[sid];
      var e1 = seam.startVertex.equalTo(v1) && seam.endVertex.equalTo(v2);
      var e2 = seam.startVertex.equalTo(v2) && seam.endVertex.equalTo(v1);
      if (e1 || e2) {
        return seam;
      }
    }
    console.log("didn't find seam from vertices");
    return null;
  }

  /**
   * Returns a list of all faces a seam touches
   * @param {Number} seamId
   * @return a list of faces adjacent to a seam
   */
  getFacesFromSeam(seamId) {
    var faces = [];
    for (var i = 0; i < Object.keys(this.faces).length; i++) {
      var faceId = Object.keys(this.faces)[i];
      var face = this.faces[faceId];
      for (var j = 0; j < face.length - 1; j++) {
        var vertex = this.vertices[face[j]];
        var nextVertex = this.vertices[face[j + 1]];
        var seam = this.getSeamFromVertices(vertex, nextVertex);
        if (seam.idx == seamId) {
          faces.push(faceId);
        }
      }
      //close the loop from the last vertex to the first
      var vertex = this.vertices[face[face.length - 1]];
      var nextVertex = this.vertices[face[0]];
      var seam = this.getSeamFromVertices(vertex, nextVertex);
      if (seam.idx == seamId) {
        faces.push(faceId);
      }
    }
    return faces;
  }

  /**
   * Returns a list of all seams around a given face
   * @param {Number} faceId
   * @return a list of seams
   */
  getSeamsFromFace(faceId) {
    var face = this.faces[faceId];
    var seams = [];
    for (var j = 0; j < face.length - 1; j++) {
      var vertex = this.vertices[face[j]];
      var nextVertex = this.vertices[face[j + 1]];
      var seam = this.getSeamFromVertices(vertex, nextVertex);
      seams.push(seam);
    }
    var vertex = this.vertices[face[face.length - 1]];
    var nextVertex = this.vertices[face[0]];
    var seam = this.getSeamFromVertices(vertex, nextVertex);
    seams.push(seam);
    return seams;
  }

  /**
   * Updates the edges that each of the faces point to
   */
  updateFacePointers() {
    for (var i = 0; i < Object.keys(this.seams).length; i++) {
      var seamId = Object.keys(this.seams)[i];
      var seam = this.seams[seamId];
      seam.faces = new Set();
      for (var j = 0; j < this.faceObjects.length; j++) {
        var face = this.faceObjects[j];
        if (face.edges.indexOf(seam) > -1) {
          seam.faces.add(face);
        }
      }
    }
  }

  /**
   * Returns the set of all maximal seams, i.e., the set of seams that are not subsets of any other seams
   */
  getMaximalSeams(sectionId) {
    var potentialMaxSeams = [];
    //get all seams from all of the faces
    for (var i = 0; i < this.faceObjects.length; i++) {
      var seams = this.faceObjects[i].seams;
      if (seams.length > 0) {
        potentialMaxSeams.push(...seams);
      }
    }
    //sort by length
    potentialMaxSeams.sort(function (a, b) {
      return b.size - a.size;
    });
    var maximalSeams = [];
    var used = new Set();
    for (var i = 0; i < potentialMaxSeams.length; i++) {
      if (used.size == 0) {
        var newSeam = this.addMaximalSeam(potentialMaxSeams[i]);
        maximalSeams.push(newSeam);
        used.add(potentialMaxSeams[i]);
      } else {
        var addItem = true;
        for (const item of used) {
          //remove subseams
          let intersection = new Set(
            [...item].filter((x) => potentialMaxSeams[i].has(x))
          );

          if (intersection.size == potentialMaxSeams[i].size) {
            addItem = false;
          }
        }
        if (addItem) {
          var newSeam = this.addMaximalSeam(potentialMaxSeams[i]);
          maximalSeams.push(newSeam);
          used.add(potentialMaxSeams[i]);
        }
      }
    }
    this.maximalSeams = maximalSeams;
    return maximalSeams;
  }

  /**
   * Generates a new hypergraph for each section
   */
  createHyperGraph() {
    this.getSections();
    this.maximalSeams = [];
    this.faceObject = [];
    this.hypergraphs = {};
    var hypergraph = this.constructHypergraph();
    return hypergraph;
  }

  /**
   * Sets a seam to be a boundary
   */
  addManualSection(seamId) {
    this.seams[seamId].isBoundary = true;
    this.seams[seamId].startVertex.isBoundary = true;
    this.seams[seamId].endVertex.isBoundary = true;
    return this;
  }

  /**
   * Sets isBoundary flag to false if the seam is not on the outer boundary
   */
  removeManualSection(seamId) {
    if (!this.seams[seamId].isOuter) {
      this.seams[seamId].isBoundary = false;
    }
    this.updateBoundaryVertices();
    return this;
  }

  /**
   * Changes isBoundary flag on vertices based on whether
   * adjacent seams are boundaries
   */
  updateBoundaryVertices() {
    for (var i = 0; i < Object.keys(this.vertices).length; i++) {
      var vertexId = Object.keys(this.vertices)[i];
      var vertex = this.vertices[vertexId];
      var seams = this.getSeamsAtVertex(vertex.idx);
      var isBoundary = false;
      for (var j = 0; j < seams.length; j++) {
        if (seams[j].isBoundary) {
          isBoundary = true;
        }
      }
      vertex.isBoundary = isBoundary;
    }
  }

  /**
   * Initializes boundary seams with optional canvas offsets
   */
  initBoundary(offsetX = 0, offsetY = 0) {
    const p1 = this.addVertex(offsetX, offsetY, true);
    const p2 = this.addVertex(this.width + offsetX, offsetY, true);
    const p3 = this.addVertex(
      this.width + offsetX,
      this.height + offsetY,
      true
    );
    const p4 = this.addVertex(offsetX, this.height + offsetY, true);

    var s1 = this.addSeam(p1.vertex, p2.vertex, true);
    var s2 = this.addSeam(p2.vertex, p3.vertex, true);
    var s3 = this.addSeam(p3.vertex, p4.vertex, true);
    var s4 = this.addSeam(p4.vertex, p1.vertex, true);

    s1.startSeam = s4.idx;
    s2.startSeam = s1.idx;
    s3.startSeam = s2.idx;
    s4.startSeam = s3.idx;
    s1.endSeam = s2.idx;
    s2.endSeam = s3.idx;
    s3.endSeam = s4.idx;
    s4.endSeam = s1.idx;
    for (var i = 0; i < Object.keys(this.seams).length; i++) {
      var sid = Object.keys(this.seams)[i];
      this.seams[sid].isOuter = true;
    }
    return this;
  }

  /**
   * Initializes boundary seams from array of points ([x,y])
   */
  initBoundaryFromArray(pts) {
    this.seams = {};
    this.vertices = {};
    if (pts.length < 3) {
      alert("too few boundary points");
      return null;
    }
    var direction = orientation(pts[0], pts[1], pts[2]);
    var points = [...pts];
    if (direction == 1) {
      //reorient to ccw
      points = pts.reverse();
    }
    var vertices = [];
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      var v = this.addVertex(p[0], p[1], true);
      vertices.push(v);
    }
    var seams = [];
    for (var i = 0; i < vertices.length - 1; i++) {
      var v1 = vertices[i];
      var v2 = vertices[i + 1];
      var s = this.addSeam(v1.vertex, v2.vertex, true);
      seams.push(s)
    }
    var v1 = vertices[vertices.length - 1];
    var v2 = vertices[0];
    var s = this.addSeam(v1.vertex, v2.vertex, true);
    seams.push(s);

    for (var i = 1; i < seams.length; i++) {
      var s = seams[i];
      var prevs = seams[i - 1];
      s.startSeam = prevs.idx;
    }
    var s = seams[0];
    var prevs = seams[seams.length - 1];
    s.startSeam = prevs.idx;

    for (var i = 0; i < seams.length - 1; i++) {
      var s = seams[i];
      var nexts = seams[i + 1];
      s.endSeam = nexts.idx;
    }
    var s = seams[seams.length - 1];
    var nexts = seams[0];
    s.endSeam = nexts.idx;


    for (var i = 0; i < Object.keys(this.seams).length; i++) {
      var sid = Object.keys(this.seams)[i];
      this.seams[sid].isOuter = true;
    }
    return this;
  }

  /**
   * Scales a design to a new width and height
   */
  scaleDesign(width, height, offset = 20) {
    var minX = 100000;
    var minY = 100000;
    var maxX = 0;
    var maxY = 0;
    for (var i = 0; i < Object.keys(this.vertices).length; i++) {
      var idx = Object.keys(this.vertices)[i];
      var vertex = this.vertices[idx];
      if (vertex.x < minX) {
        minX = vertex.x;
      }
      if (vertex.y < minY) {
        minY = vertex.y;
      }
      if (vertex.x > maxX) {
        maxX = vertex.x;
      }
      if (vertex.y > maxY) {
        maxY = vertex.y;
      }
    }
    var ratio = Math.min(width / (maxX - minX), height / (maxY - minY));
    for (var i = 0; i < Object.keys(this.vertices).length; i++) {
      var idx = Object.keys(this.vertices)[i];
      this.vertices[idx].x = (this.vertices[idx].x - minX) * ratio + 20;
      this.vertices[idx].y = (this.vertices[idx].y - minY) * ratio + 20;
    }
    return this;
  }

  /**
   * Takes a list of line objects {start: {x: x0, y: y0}, end: {x: x0, y: y0}, label: isBoundary}
   * and creates a line object
   * note: assumes that seams do not intersect except at end points
   */
  initFromSVG(lines) {
    for (var i = 0; i < Object.keys(lines).length; i++) {
      var start = lines[i].start;
      var end = lines[i].end;
      var isBoundary = false;
      if (lines[i].label == "boundary") {
        isBoundary = true;
      }
        var v1 = this.addVertex(start.x, start.y, isBoundary);
        var v2 = this.addVertex(end.x, end.y, isBoundary);
        var newStartVertex = v1.vertex;
        var newEndVertex = v2.vertex;
        var newSeam1 = this.addSeam(
        newStartVertex,
        newEndVertex,
        isBoundary)
    }
    this.getFaces();
    this.createHyperGraph();
    this.isValid();
    return this;
  }

  /**
   * Checks whether a design is closed and if there is a valid sewing order
   */
  isValid() {
    if (!this.isClosed()) {
      return false;
    }
    var result = this.getSewingOrder();
    var overlappingSeams = new Set();
    for (var i = 0; i < Object.keys(this.hypergraphs).length; i++) {
      var sectionId = Object.keys(this.hypergraphs)[i];
      var hypergraph = this.hypergraphs[sectionId];
      for (const edge of hypergraph.cycle) {
        overlappingSeams.add(edge);
      }
    }
    this.overlappingSeams = [...overlappingSeams];
    return this.valid;
  }

  /**
   * Returns a single sewing order based on peeling the hypergraph
   */
  getSewingOrder() {
    var hypergraphsToPeel = this.constructHypergraph();
    this.hypergraphs = JSON.parse(JSON.stringify(hypergraphsToPeel));
    var orderPerSection = {};
    var valid = true;
    var edgeOrder = [];
    for (var i = 0; i < Object.keys(hypergraphsToPeel).length; i++) {
      var sectionId = Object.keys(hypergraphsToPeel)[i];
      var hypergraph = hypergraphsToPeel[sectionId];
      var peelResult = hypergraph.peel();
      var peelOrder = peelResult.order;
      edgeOrder.push(hypergraph.partials);
      peelOrder.reverse();
      orderPerSection[sectionId] = peelOrder;
      if (valid) {
        //a single invalid section means the whole design in invalid
        valid = peelResult.valid;
      }
    }
    this.valid = valid;
    this.sewingOrder = orderPerSection;
    this.edgeOrder = edgeOrder
    return orderPerSection;
  }


  /**
   * Splits an existing seam when a new intersecting seam is added
   */
  splitSeam(startSeamId, endSeamId, startPos, endPos) {
    var startSeam = this.seams[startSeamId];
    var endSeam = this.seams[endSeamId];
    var startIsBoundary = false;
    var endIsBoundary = false;
    if (startSeam) {
      startIsBoundary = startSeam.isBoundary;
    }
    if (endSeam) {
      endIsBoundary = endSeam.isBoundary;
    }
    //create two new vertices
    var v1 = this.addVertex(startPos.x, startPos.y, startIsBoundary);
    var newStartVertex = v1.vertex;
    var v2 = this.addVertex(endPos.x, endPos.y, endIsBoundary);
    var newEndVertex = v2.vertex;

    if (startSeam && v1.isNew) {
      //new seam from start edge on split
      var newSeam1 = this.addSeam(
        newStartVertex,
        startSeam.endVertex,
        startIsBoundary
      );
      newSeam1.isOuter = startSeam.isOuter;
      startSeam.endVertex.removeSegment(startSeam);
      startSeam.endVertex = newStartVertex;
      newSeam1.endSeam = startSeam.endSeam;
    }

    if (endSeam && v2.isNew) {
      var newSeam2 = this.addSeam(
        endSeam.startVertex,
        newEndVertex,
        endIsBoundary
      );
      newSeam2.isOuter = endSeam.isOuter;
      endSeam.startVertex.removeSegment(endSeam);
      endSeam.startVertex = newEndVertex;
      newSeam2.startSeam = endSeam.startSeam;
    }
    //actual new seam
    var newSeam3 = this.addSeam(newStartVertex, newEndVertex, false);
    if (startSeam) {
      newSeam3.startSeam = startSeam.idx;
      if (startSeam.startSeam == null) {
        startSeam.startSeam = newSeam3.idx;
      }
    } else {
      newSeam3.startSeam = null;
    }
    if (endSeam) {
      newSeam3.endSeam = endSeam.idx;
      if (endSeam.endSeam == null) {
        endSeam.endSeam = newSeam3.idx;
      }
    } else {
      newSeam3.endSeam = null;
    }

    if (startSeam) {
      startSeam.endSeam = newSeam3.idx;
      if (v1.isNew) {
        newSeam1.startSeam = newSeam3.idx;
      }
    }
    if (endSeam) {
      endSeam.startSeam = newSeam3.idx;
      if (v2.isNew) {
        newSeam2.endSeam = newSeam3.idx;
      }
    }
  }

  /**
   * Returns an array of hyperedges with each element:
   * { idx: i, edges: {eid1, eid2,..}, faces: {fid1, fid2,...} }
   */
  constructHypergraph() {
    this.getMaximalSeams();
    var hypergraphs = {};
    for (var i = 0; i < Object.keys(this.sections).length; i++) {
      var sectionId = Object.keys(this.sections)[i];
      var hypergraph = new Hypergraph();
      var faceSet = new Set();
      const maxSeams = this.maximalSeams.filter(
        (seam) => seam.section == sectionId
      );
      for (var j = 0; j < maxSeams.length; j++) {
        var faces = maxSeams[j].faces;
        for (let face of faces) {
          faceSet.add(face.idx);
        }
      }
      var sectionFaces = this.sections[sectionId];
      if (sectionFaces.length == 1) {
        //single face section
        faceSet.add(sectionFaces[0]);
      }
      hypergraph.addNodes(faceSet);
      for (var k = 0; k < maxSeams.length; k++) {
        var faces = maxSeams[k].faces;
        faceSet = new Set();
        for (let face of faces) {
          faceSet.add(face.idx);
        }
        var edges = maxSeams[k].edges;
        var edgeSet = new Set();
        for (let edge of edges) {
          edgeSet.add(edge.idx);
        }
        hypergraph.addHyperEdge(faceSet, edgeSet);
      }
      if (sectionFaces.length == 1) {
        //single face section
        hypergraph.addHyperEdge(faceSet, new Set());
      }
      hypergraph.checkCycle();
      hypergraphs[sectionId] = hypergraph;
    }
    return hypergraphs;
  }

  /**
   * Converts a design to SVG
   */
  toSVG(canvasSize, labelMap) {
    var header = '<?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 '+canvasSize.width.toString() + " " + canvasSize.height.toString()+ '" style="enable-background:new 0 0 '+canvasSize.width.toString() +' '+ canvasSize.height.toString() +';" xml:space="preserve"><style type="text/css">.interior{fill:none;stroke:#231F20;stroke-miterlimit:10;} .boundary{fill:none;stroke:#231F20;stroke-miterlimit:10;}</style>'
    for (var i = 0; i < Object.keys(this.seams).length; i++) {
      var seamId = Object.keys(this.seams)[i]
      var seam = this.seams[seamId];
      var label = 'interior';
      if (seam.isBoundary) {
        label = 'boundary'
      }
      header += '<line class="'+label+'" x1="'+seam.startVertex.x+'" y1="'+seam.startVertex.y+'" x2="'+seam.endVertex.x+'" y2="'+seam.endVertex.y+'"/>'
    }
    for (var i = 0; i < this.faceObjects.length; i++) {
      var face = this.faceObjects[i];
      var center = face.getCenter();
      var label = labelMap[face.idx.toString()]
      header += '<text x="'+center.x+'" y="'+center.y+'" class="heavy">'+label+'</text>'
    }
    header += '</svg>'
    return header
    }
}
