/** Class representing a seam. */
export default class Seam {
  /**
   * Represents a seam
   * @constructor
   * @param {string} idx - The unique ID of the seam.
   * @param {Vertex} startVertex.
   * @param {Vertex} endVertex.
   * @param {Boolean} isBoundary - whether seam is on boundary.
   */
  constructor(idx, startVertex, endVertex, isBoundary = false) {
    this.idx = parseInt(idx);
    this.startVertex = startVertex;
    this.endVertex = endVertex;
    this.startSeam = null;
    this.endSeam = null;
    this.isOuter = false;
    this.isBoundary = isBoundary;
    this.faces = new Set();
  }

  /**
   * Return the midpoint of the seam
   * @return {Object} {x: x0, y: y0} for the midpoint of the seam
   */
  midpoint() {
    var x = Math.abs(this.startVertex.x + this.endVertex.x) / 2;
    var y = Math.abs(this.startVertex.y + this.endVertex.y) / 2;
    return { x: x, y: y };
  }

  /**
   * Calculate the angle in degrees between this seam and another
   * @param {Seam} otherSeam: a different seam object.
   * @return {Number} angle in degrees
   */
  angleBetween(otherSeam) {
    if (this.idx == otherSeam.idx) {
      return 0
    }
    var A1 = this.startVertex;
    //find vector components
    var dAx = this.endVertex.x - this.startVertex.x;
    var dAy = this.endVertex.y - this.startVertex.y;
    var dBx = otherSeam.endVertex.x - otherSeam.startVertex.x;
    var dBy = otherSeam.endVertex.y - otherSeam.startVertex.y;
    var angle = Math.atan2(dAx * dBy - dAy * dBx, dAx * dBx + dAy * dBy);
    if (angle < 0) {
      angle = angle * -1;
    }
    var angleDeg = angle * (180 / Math.PI);
    return angleDeg;
  }

  /**
   * Determines whether seams share a vertex
   * @param {Seam} otherSeam: a different seam object.
   * @return {Boolean} true if seams share a vertex
   */
  intersects(otherSeam) {
    var e1 = this.startVertex.equalTo(otherSeam.startVertex);
    var e2 = this.endVertex.equalTo(otherSeam.endVertex);
    var e3 = this.startVertex.equalTo(otherSeam.endVertex);
    var e4 = this.endVertex.equalTo(otherSeam.startVertex);
    if (e1 || e2 || e3 || e4) {
      return true;
    }
    return false;
  }

  /**
   * Determines if two seams are collinear by checking
   * if the angle between them is small and they intersect
   * @param {Seam} otherSeam: a different seam object.
   * @param {Number} angleThreshold: maximum angle to be considered collinear.
   * @return {Boolean} true if collinear
   */
  collinear(otherSeam, angleThreshold = 10) {
    if ((this.angleBetween(otherSeam) < angleThreshold || Math.abs(this.angleBetween(otherSeam) - 180) < angleThreshold) && this.intersects(otherSeam)) {
      return true;
    }
    return false;
  }

  /**
   * Check if two seams are equal by testing diferences between vertices
   * @param {Seam} otherSeam - another seam object
   * @param {Number} vertexThreshold - max distance for x and y to be considered the same vertex
   * @return {Boolean} true if two seams have the same start and end
   */
  equalTo(otherSeam, vertexThreshold = 1) {
    var s1 = this.startVertex.equalTo(otherSeam.startVertex, vertexThreshold); //starts equal
    var s2 = this.endVertex.equalTo(otherSeam.endVertex, vertexThreshold); //ends equal
    var s3 = this.startVertex.equalTo(otherSeam.endVertex, vertexThreshold);
    var s4 = this.endVertex.equalTo(otherSeam.startVertex, vertexThreshold);
    if ((s1 && s2) || (s3 && s4)) {
      console.log("using existing seam");
      return true;
    }
    return false;
  }
}