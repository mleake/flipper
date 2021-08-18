/** Class representing a Seam. */
export default class MaximalSeam {
  /**
   * @param {idx} id - seam id.
   * @param {Set} edges - set of edge objects.
   */
  constructor(idx, edges) {
    this.idx = parseInt(idx);
    this.edges = edges; //set of edge objects
    this.faces = new Set();
    this.section = -1;
  }

  /**
   * populates face set based on set of edges in seam
   */
  getFaces() {
    this.faces = new Set();
    for (const edge of this.edges) {
      for (const face of edge.faces) {
        this.faces.add(face);
      }
    }
  }

  /**
   * updates section id
   */
  assignSection(sectionId) {
    this.section = sectionId;
  }
}