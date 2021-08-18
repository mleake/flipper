/** Class representing a hyperedge. */
class HyperEdge {
  /**
   * @param {Number} idx - vertex id.
   */
  constructor(idx, faces, edges) {
    this.idx = idx;
    this.faces = faces;
    this.edges = edges;
  }

  /**
   * returns true if edge has only two faces
   */
  isBinary() {
    return this.faces.size == 2;
  }
}

/** Class representing a hypergraph. */
class Hypergraph {
  constructor() {
    this.nodes = new Set();
    this.hyperedges = new Set();
    this.partials = [];
    this.cycle = new Set();
  }

  /**
   * Adds all nodes in set to hypergraph
   * @param {set} nodes - a set of ids.
   */
  addNodes(nodes) {
    this.nodes = new Set();
    for (let node of nodes) {
      this.nodes.add(node);
    }
  }

  /**
   * Adds a hyperedge corresponding to the set of faces and edges
   * @param {set} faces - a set of face ids.
   * @param {set} edges - a set of edge ids.
   */
  addHyperEdge(faces, edges) {
    var he = new HyperEdge(this.hyperedges.size, faces, edges);
    this.hyperedges.add(he);
    return he.idx;
  }

  /**
   * Removes the first hyperedge found with the given node
   * @param {Number} node - node id.
   */
  removeHyperedgeWithNode(node) {
    for (let hyperedge of this.hyperedges) {
      if (hyperedge.faces.has(node) || hyperedge.faces.has(node.toString())) {
        this.hyperedges.delete(hyperedge);
        return hyperedge; //return removed hyperedge
      }
    }
    return null;
  }

  /**
   * Returns a list of node (i.e., face) ids for the leaves of the hypergraph
   */
  getLeaves() {
    var faces = {}; //counter
    for (let hyperedge of this.hyperedges) {
      var heFaces = hyperedge.faces;
      for (var f of heFaces) {
        if (f in faces) {
          faces[f] += 1;
        } else {
          faces[f] = 1;
        }
      }
    }
    var leaves = [];
    Object.keys(faces).forEach((key) => {
      if (faces[key] == 1) {
        leaves.push(parseInt(key));
      }
    });
    return leaves;
  }

  /**
   * Peels a single leaf at random and returns an array of plucked items
   * (single items, except for the final peel of a binary leaf, which has 2)
   */
  singlePeel() {
    var leaves = this.getLeaves(); //list of node ids that are leaves
    if (leaves.length == 0) {
      return null;
    }
    var leaf = leaves[Math.floor(Math.random() * leaves.length)];
    var removedEdge = this.removeHyperedgeWithNode(leaf);
    this.nodes.delete(leaf);
    var removedFaces = [leaf];
    if (removedEdge.isBinary() && this.hyperedges.size == 0) {
      if (leaves.indexOf(leaf) == 1) {
        leaves.reverse(); // make sure we have the right order
      }
      removedFaces = leaves;
    }
    return {faces: removedFaces, edge: removedEdge};
  }

  /**
   * Peels the hypergraph until no leaves are left and returns the plucked order
   */
  peel() {
    var peel = this.singlePeel();
    var peelOrder = [];
    var edgeOrder = [];
    if (peel != null) {
      peelOrder.push(peel.faces);
      edgeOrder.push(peel.edge)
    }
    while (peel != null) {
      peel = this.singlePeel();
      if (peel != null) {
        peelOrder.push(peel.faces);
        edgeOrder.push(peel.edge)
      }
    }
    return { order: peelOrder.flat(), valid: this.hyperedges.size == 0, edgeOrder: edgeOrder };
  }

  //https://stackoverflow.com/questions/47766399/get-the-distinct-set-of-sets-in-javascript
  isEqual(set1, set2) {
    let s1 = Array.from(set1).sort();
    let s2 = Array.from(set2).sort();
    if (s1.length != s2.length)
       return false;

    for (let i = 0; i < s1.length; i++) 
      if (s1[i] !== s2[i])
         return false;

    return true;
  }


  checkCycle() {
    var usedEdges = new Set();
    var cycle = new Set();
    var usedFaces = new Set();
    for (let hyperedge of this.hyperedges) {
      for (let edge of hyperedge.edges) {
        if (usedEdges.has(edge)) {
          cycle.add(edge);
        }
        usedEdges.add(edge);
      }
      for (let faceSet of usedFaces) {
        if (this.isEqual(faceSet, hyperedge.faces)) {
          for (let edge of hyperedge.edges) {
            cycle.add(edge)
            usedEdges.add(edge);
          }
        }
      }
      usedFaces.add(hyperedge.faces)
    }
    this.cycle = cycle;
  }
}

export default Hypergraph;
