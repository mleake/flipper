/** Class representing a vertex. */
export default class Vertex {
  /**
   * Represents a vertex
   * @constructor
   * @param {string} idx - The unique ID of the vertex.
   * @param {Number} x - x position.
   * @param {Number} y - y position.
   * @param {Boolean} isBoundary - whether vertex is on boundary.
   */
  constructor(idx, x, y, isBoundary = false) {
    this.idx = parseInt(idx);
    this.x = x;
    this.y = y;
    this.isBoundary = isBoundary;
    this.segments = [];
  }

  /**
   * Adds a seam to the list of segments for the vertex
   * @param {Seam} seam - seam object to add
   */
  addSegment(seam) {
    if (this.segments.indexOf(seam) < 0) {
      this.segments.push(seam);
    }
  }

  /**
   * Removes segment from the list of segments
   * @param {Seam} seam - seam object to remove
   */
  removeSegment(seam) {
    var index = this.segments.indexOf(seam);
    if (index > -1) {
      this.segments.splice(index, 1);
    }
  }

  /**
   * Check if positions are close enough to determine if vertices are equal
   * @param {Vertex} otherVertex - another vertex object
   * @param {Number} diff - max distance for x and y to be considered the same vertex
   * @return {Boolean} true if two vertices are within diff of each other for x and y
   */
  equalTo(otherVertex, diff = 1) {
    var xDiff = Math.abs(this.x - otherVertex.x);
    var yDiff = Math.abs(this.y - otherVertex.y);
    if (xDiff < diff && yDiff < diff) {
      return true;
    }
    return false;
  }
}