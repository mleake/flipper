import React, { Component } from "react";
import Konva from "konva";
import {
  Stage,
  Layer,
  Circle,
  Path,
  Line,
  Text,
  Rect
} from "react-konva";
import { Toolbar, Typography } from "@material-ui/core";
import Tooltip from '@material-ui/core/Tooltip';
import { Button, IconButton } from "@material-ui/core";
import { AiOutlineUpload, AiOutlineDownload } from "react-icons/ai";
import {
  BiEraser,
  BiShow,
  BiHide,
  BiBorderInner,
  BiShapeSquare,
  BiShapePolygon,
  BiImage,
  BiHelpCircle,
  BiMinus,
  BiLinkExternal
} from "react-icons/bi";
import { GrGrid } from "react-icons/gr";
import CloseIcon from '@material-ui/icons/Close';
import { HiOutlineClipboardCheck } from "react-icons/hi";
import { MdFormatColorFill, MdCheckBoxOutlineBlank } from "react-icons/md";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { GiDolphin } from "react-icons/gi";
import { SketchPicker } from "react-color";
// import ImageUploader from "react-images-upload";
import Design from "./DesignHE";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import TextField from "@material-ui/core/TextField";
import Fab from "@material-ui/core/Fab";
import Checkbox from "@material-ui/core/Checkbox";
import Select from "@material-ui/core/Select";
import Switch from "@material-ui/core/Switch";
import Grid from "@material-ui/core/Grid";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import AppBar from "@material-ui/core/AppBar";
import Divider from "@material-ui/core/Divider";
import Paper from "@material-ui/core/Paper";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Modal from '@material-ui/core/Modal';
import SvgIcon from '@material-ui/core/SvgIcon';
import Icon from '@material-ui/core/Icon';
import { makeStyles } from '@material-ui/styles';
import FAQPanel from './FAQ.js'
import { toPoints } from "svg-points";
import { withStyles } from "@material-ui/core/styles";

const { parse, stringify } = require("svgson");


const {
  checkIntersection,
  colinearPointWithinSegment,
} = require("line-intersect");

var inside = require("point-in-polygon");

const toAlpha = (num) => {
  if (num < 0 || num > 26 || typeof num !== "number") {
    return -1;
  }
  const leveller = 65;
  //since actually A is represented by 65 and we want to represent it with zero
  return String.fromCharCode(num + leveller);
};

const styles = {
  root: {
    flexGrow: 1,
  },
  flex: {
    flex: 1,
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
  },
  title: {
      flexGrow: 1,
      textAlign: "center"
    },
  heading: {
    fontSize: 15,
    flexBasis: '33.33%',
    flexShrink: 0,
  },
  secondaryHeading: {
    fontSize: 12,
    color: "black",
  },
  largeIcon: {
    width: "3em",
    height: "3em",
  },
};


class CanvasDraw extends Component {
  constructor(props) {
    super(props);
    this.state = {
      canvasSize: { width: 800, height: 800 },
      tempStart: { x: null, y: null },
      tempEnd: { x: null, y: null },
      stageEl: React.createRef(),
      startIdx: null,
      endIdx: null,
      orders: [],
      isValid: "",
      eraser: false,
      seamLabelMap: {},
      design: { seams: {}, vertices: {}, hypergraphs: {}, sewingOrder: {}, overlappingSeams: []},
      polys: {},
      faces: {},
      colors: {},
      order: [],
      overlapping: [],
      peelImages: [],
      closeVertices: [],
      closeSeams: [],
      mouseDown: false,
      recolor: false,
      currentColor: "#fff",
      blockWidth: 6,
      blockHeight: 6,
      seamAllowance: 0.25,
      uploadedFile: null,
      uploadedSVG: null,
      mode: "seam",
      curMousePos: [0, 0],
      isMouseOverStartPoint: false,
      isFinished: false,
      borderPoints: [],
      sectionImages: {},
      borderMode: "default",
      showGrid: true,
      fileAnchor: null,
      borderAnchor: null,
      alternateOrders: {},
      seamLabels: false,
      showHypergraph: true,
      showOverlap: true,
      colorFaces: true,
      selectedOrders: {},
      valid: true,
      selectedShapeName: "",
      helpText: "",
      defaultColors: [
        "#f44336",
        "#e91e63",
        "#9c27b0",
        "#673ab7",
        "#3f51b5",
        "#2196f3",
        "#03a9f4",
        "#00bcd4",
        "#009688",
        "#4caf50",
        "#8bc34a",
        "#cddc39",
        "#ffeb3b",
        "#ffc107",
        "#ff9800",
        "#ff5722",
        "#795548",
        "#607d8b",
      ],
      shift: false,
      moveDir: 0,
      intersection: false,
      mouseOverSeams: [],
      startDraw: false,
      closeMargin: 20,
      openSectionBoundary: false,
      showHelpText: true,
      closed: true,
      svg:"",
      borderDialogOpen: false,
      openFAQ: false,
    };
    this.addSeam = this.addSeam.bind(this);
  }

  componentDidMount() {
    this.initBoundary();
  }

  escFunction(event) {
    if (event.keyCode === 16) {
      //Do whatever when esc is pressed
      console.log("shift pressed");
      this.determineDirection()
      this.setState({ shift: true });
    }
    if (event.keyCode === 68) {//d
      console.log("d pressed");
      this.changeMode(event, "erase")
    }
    if (event.keyCode === 65) {//a
      console.log("a pressed");
      this.changeMode(event, "seam")
    }
    if (event.keyCode === 83) {//s
      console.log("s pressed");
      this.changeMode(event, "addsection")
    }
    if (event.keyCode === 88) {//s
      console.log("x pressed");
      this.changeMode(event, "removesection")
    }
  }

  escFunctionUp(event) {
    this.setState({ shift: false });
    this.changeMode(event, "seam")
  }

  newBlock(keepImage = false) {
    this.clearBlock();
    this.initBoundary();
  }


  clearBlock(keepImage = false) {
    var design = new Design();
    if (keepImage) {
      this.setState({
        design: design,
        faces: {},
        polys: {},
        borderPoints: [],
        fileAnchor: null,
      });
    } else {
      this.setState({
        design: design,
        backgroundImage: { file: "", width: 0, height: 0 },
        faces: {},
        polys: {},
        borderPoints: [],
        fileAnchor: null,
      });
    }
  }

  deleteBGImage() {
    this.setState({ backgroundImage: { file: "", width: 0, height: 0 } });
  }

  resetComponent() {
    var state = {
      canvasSize: { width: 800, height: 800 },
      tempStart: { x: null, y: null },
      tempEnd: { x: null, y: null },
      stageEl: React.createRef(),
      startIdx: null,
      endIdx: null,
      orders: [],
      isValid: "",
      eraser: false,
      seamLabelMap: {},
      design: { seams: {}, vertices: {}, hypergraphs: {}, sewingOrder: {}, overlappingSeams: []},
      polys: {},
      faces: {},
      colors: {},
      order: [],
      overlapping: [],
      peelImages: [],
      closeVertices: [],
      closeSeams: [],
      mouseDown: false,
      recolor: false,
      currentColor: "#fff",
      blockWidth: 6,
      blockHeight: 6,
      seamAllowance: 0.25,
      uploadedFile: null,
      uploadedSVG: null,
      mode: "seam",
      curMousePos: [0, 0],
      isMouseOverStartPoint: false,
      isFinished: false,
      borderPoints: [],
      sectionImages: {},
      borderMode: "default",
      showGrid: true,
      fileAnchor: null,
      borderAnchor: null,
      alternateOrders: {},
      seamLabels: false,
      showHypergraph: true,
      showOverlap: true,
      colorFaces: true,
      selectedOrders: {},
      valid: true,
      selectedShapeName: "",
      helpText: "",
      defaultColors: [
        "#f44336",
        "#e91e63",
        "#9c27b0",
        "#673ab7",
        "#3f51b5",
        "#2196f3",
        "#03a9f4",
        "#00bcd4",
        "#009688",
        "#4caf50",
        "#8bc34a",
        "#cddc39",
        "#ffeb3b",
        "#ffc107",
        "#ff9800",
        "#ff5722",
        "#795548",
        "#607d8b",
      ],
      shift: false,
      moveDir: 0,
      intersection: false,
      mouseOverSeams: [],
      startDraw: false,
      closeMargin: 20,
      openSectionBoundary: false,
      showHelpText: true,
      closed: true,
      svg:"",
      borderDialogOpen: false,
      openFAQ: false,
    };
    this.setState(state);
  }

  onSVGChange = async (e) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const svgString = e.target.result;
      parse(svgString).then((json) => {
        var children = json.children;
        var data = {};
        data["data"] = {};
        data["classes"] = {};
        var newChildren = [];
        for (var i = 0; i < children.length; i++) {
          var child = children[i];
          if (child.name == "g") {
            newChildren = newChildren.concat(child.children);
          }
        }
        if (newChildren.length > 0) {
          children = newChildren;
        }
        for (var i = 0; i < children.length; i++) {
          var child = children[i];
          if (child.name == "path") {
            data["data"][Object.keys(data["data"]).length] = child.attributes;
            data["type"] = "path";
          }
          if (child.name == "line") {
            data["data"][Object.keys(data["data"]).length] = child.attributes;
            data["type"] = "line";
          }
        }
        if (data.type == "line") {
          this.processLine(data.data);
        }
      });
    };
    reader.readAsText(e.target.files[0]);
  };

  
  
  processLine(attrs) {
    var start;
    var end;
    var lineIdx = 0;
    var lines = {};
    for (var i = 0; i < Object.keys(attrs).length; i++) {
      var start = { x: Number(attrs[i].x1), y: Number(attrs[i].y1) };
      var end = { x: Number(attrs[i].x2), y: Number(attrs[i].y2) };
      var c = attrs[i].class;
      lines[lineIdx] = { start: start, end: end, label: c };
      lineIdx += 1;
    }
    var allPts = [];
    for (var i = 0; i < Object.keys(lines).length; i++) {
      var pt = lines[i];
      allPts.push(pt.start);
      allPts.push(pt.end);
    }
    var maxY = Math.max.apply(
      Math,
      allPts.map(function (o) {
        return o.y;
      })
    );
    var maxX = Math.max.apply(
      Math,
      allPts.map(function (o) {
        return o.x;
      })
    );
    var minY = Math.min.apply(
      Math,
      allPts.map(function (o) {
        return o.y;
      })
    );
    var minX = Math.min.apply(
      Math,
      allPts.map(function (o) {
        return o.x;
      })
    );
    var boundary = [
      [minX, minY],
      [minX, maxY],
      [maxX, maxY],
      [maxX, minY],
    ];
   
    var des = new Design(5,5);
    var d = des.initFromSVG(lines);
    d = d.scaleDesign(
      this.state.canvasSize.width - 100,
      this.state.canvasSize.height - 100
    );
    this.setState({ design: d, fileAnchor: false });
    this.getFaces();
    this.updateHyperGraph();
    this.getOrder();
    this.state.design.isValid()
    this.setState({ fileAnchor: false });
  }

  exportSvg() {
    var svg = this.state.design.toSVG(this.state.canvasSize, this.state.seamLabelMap);
    this.setState({svg:svg})
    const fileName = "file";
    const blob = new Blob([svg], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    const image = document.createElement('img');
    image.addEventListener('load', () => URL.revokeObjectURL(url), {once: true});
    image.src = url;
    var dataURL = this.state.stageEl.current.toDataURL();
    const link = document.createElement("a");
    link.href = url;
    link.download = "pattern.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


  async exportPdf() {
    const quality = 1; // Higher the better but larger file
    html2canvas(document.querySelector("#mainstage")).then((canvas) => {
      document.body.appendChild(canvas); // if you want see your screenshot in body.
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("canvas.pdf");
      document.body.removeChild(canvas);
    });
  }

  initBoundary() {
    var maxWidth = this.state.canvasSize.width * 0.75;
    var maxHeight = this.state.canvasSize.height * 0.75;
    var ratio = Math.min(
      maxWidth / this.state.blockWidth,
      maxHeight / this.state.blockHeight
    );
    var width = this.state.blockWidth * ratio;
    var height = this.state.blockHeight * ratio;
    var design = new Design(width, height);
    var offsetX = this.state.canvasSize.width * 0.125; //center the boundary
    var offsetY = this.state.canvasSize.height * 0.125; //center the boundary
    design.initBoundary(offsetX, offsetY);
    this.setState({
      design: design,
    });
  }

  initBoundaryFromArray(pts) {
    var maxWidth = this.state.canvasSize.width * 0.75;
    var maxHeight = this.state.canvasSize.height * 0.75;
    var ratio = Math.min(
      maxWidth / this.state.blockWidth,
      maxHeight / this.state.blockHeight
    );
    var width = this.state.blockWidth * ratio;
    var height = this.state.blockHeight * ratio;
    var design = new Design(width, height);
    design.seams = {};
    design.initBoundaryFromArray(pts);
    this.setState({
      design: design,
    });
    return design;
  }

  addSeam(start, end, startIdx, endIdx) {
    this.state.design.splitSeam(startIdx, endIdx, start, end);
    this.setState({
      seams: this.state.design.seams,
      vertices: this.state.design.vertices,
    });
  }

  getIntersectingShapes() {
    var vertexMap = {};
    for (var i = 0; i < Object.keys(this.state.design.vertices).length; i++) {
      var vid = Object.keys(this.state.design.vertices)[i];
      var vertex = this.state.design.vertices[vid];
      vertexMap[vertex.idx] = [];
      for (var j = 0; j < Object.keys(this.state.design.seams).length; j++) {
        var sid = Object.keys(this.state.design.seams)[j];
        var seam = this.state.design.seams[sid];
        if (
          seam.startVertex.idx == vertex.idx ||
          seam.endVertex.idx == vertex.idx
        ) {
          vertexMap[vertex.idx].push(seam.idx);
        }
      }
    }
    return vertexMap;
  }

  findVertex(point) {
    for (var i = 0; i < this.state.vertices.length; i++) {
      var vertex = this.state.vertices[i];
      if (vertex.x == point.x && vertex.y == point.y) {
        return i;
      }
    }
    return -1;
  }

  getCoords() {
    var node = this.state.stageEl.current;
    var transform = node.getAbsoluteTransform().copy();
    // to detect relative position we need to invert transform
    transform.invert();

    // get pointer (say mouse or touch) position
    var pos = node.getStage().getPointerPosition();

    // now we can find relative point
    var posObj = transform.point(pos);
    return { x: posObj.x, y: posObj.y };
  }

  findClosestPointOnLine(a, b, p) {
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

  sqr(x) {
    return x * x;
  }

  dist2(v, w) {
    return Math.sqrt(
      this.sqr(parseFloat(v.x) - parseFloat(w.x)) +
        this.sqr(parseFloat(v.y) - parseFloat(w.y))
    );
  }

  closestVertex() {
    var closeVertices = [];
    if (this.state.stageEl.current) {
      var stage = this.state.stageEl.current.getStage();
      // const bb = stage.getPointerPosition();
      const bb = this.getCoords();
      if (bb) {
        const currentPos = { x: bb.x, y: bb.y };
        for (
          var i = 0;
          i < Object.keys(this.state.design.vertices).length;
          i++
        ) {
          var vid = Object.keys(this.state.design.vertices)[i];
          var vertex = this.state.design.vertices[vid];
          var dist = this.dist2(currentPos, vertex);
          if (dist < this.state.closeMargin) {
            this.setState({ closeVertices: [vertex] });
            return;
          }
        }
      }
    }
  }

  // From article by https://bl.ocks.org/mbostock at https://bl.ocks.org/mbostock/8027637
  // modified as prefixes (VW)
  closestPoint(line, point) {
    var points = line.points();
    var svgString = "M";
    for (var i = 0; i < points.length; i += 2) {
      var pointX = points[i];
      var pointY = points[i + 1];
      svgString += pointX.toString() + " " + pointY.toString() + " ";
    }

    var pathNode = new Konva.Path({
      x: line.x(),
      y: line.y(),
      data: svgString,
      points: points,
    });
    var pathLength = pathNode.getLength(), // (VW) replaces pathNode.getTotalLength(),
      precision = 2,
      best,
      bestLength,
      bestDistance = Infinity;

    // linear scan for coarse approximation
    for (
      var scan, scanLength = 0, scanDistance;
      scanLength <= pathLength;
      scanLength += precision
    ) {
      if (
        (scanDistance = this.distance2(
          (scan = pathNode.getPointAtLength(scanLength)),
          point
        )) < bestDistance
      ) {
        (best = scan), (bestLength = scanLength), (bestDistance = scanDistance);
      }
    }

    // binary search for precise estimate
    precision /= 2;
    while (precision > 0.5) {
      var before,
        after,
        beforeLength,
        afterLength,
        beforeDistance,
        afterDistance;
      if (
        (beforeLength = bestLength - precision) >= 0 &&
        (beforeDistance = this.distance2(
          (before = pathNode.getPointAtLength(beforeLength)),
          point
        )) < bestDistance
      ) {
        (best = before),
          (bestLength = beforeLength),
          (bestDistance = beforeDistance);
      } else if (
        (afterLength = bestLength + precision) <= pathLength &&
        (afterDistance = this.distance2(
          (after = pathNode.getPointAtLength(afterLength)),
          point
        )) < bestDistance
      ) {
        (best = after),
          (bestLength = afterLength),
          (bestDistance = afterDistance);
      } else {
        precision /= 2;
      }
    }

    best = { x: best.x, y: best.y }; // (VW) converted to object instead of array, personal choice
    best.distance = Math.sqrt(bestDistance);
    return best;
  }

  distance2(p, point) {
    var dx = p.x - point.x, // (VW) converter to object from array
      dy = p.y - point.y;
    return dx * dx + dy * dy;
  }

  intersection(x0, y0, x1, y1) {
    var stage = this.state.stageEl.current.getStage();
    const bb = this.getCoords();
    const currentPos = { x: bb.x, y: bb.y };
    var shapes = stage.find(".designSeam");
    var intersects = { intersection: false, point: null };
    for (var i = 0; i < shapes.length; i++) {
      var element = shapes[i];
      const p = element.points();
      var ints = checkIntersection(p[0], p[1], p[2], p[3], x0, y0, x1, y1);
      var p0 = { x: p[0], y: p[1] };
      var p1 = { x: p[2], y: p[3] };
      var otherp0 = { x: x0, y: y0 };
      var otherp1 = { x: x1, y: y1 };
      if (ints.type == "intersecting") {
        var intPt = ints.point;
        var d0 = this.dist2(intPt, p0);
        var d1 = this.dist2(intPt, p1);
        var d2 = this.dist2(intPt, otherp0);
        var d3 = this.dist2(intPt, otherp1);

        if (d0 < 5 || d1 < 5 || d2 < 5 || d3 < 5) {
          intersects = { intersection: false, point: null };
        } else {
          intersects = { intersection: true, point: intPt };
          return intersects;
        }
      }
    }
    return intersects;
  }

  getClosestPointOnLine() {
    var stage = this.state.stageEl.current.getStage();
    const bb = this.getCoords();
    const currentPos = { x: bb.x, y: bb.y };
    var shapes = stage.find(".designSeam");
    var minDist = 10000;
    var minPt = { x: 0, y: 0 };
    var minLine;
    for (var i = 0; i < shapes.length; i++) {
      var element = shapes[i];
      const p = element.points();
      const start = { x: p[0], y: p[1] };
      const end = { x: p[2], y: p[3] };
      const dStart = this.dist2(start, currentPos);
      const dEnd = this.dist2(end, currentPos);
      if (dStart < this.state.closeMargin) {
        minDist = dStart;
        minPt = start;
        minLine = element.id();
        return {
          minDist: minDist,
          minPt: { x: minPt.x, y: minPt.y },
          minLine: minLine,
        };
      } else if (dEnd < this.state.closeMargin) {
        minDist = dEnd;
        minPt = end;
        minLine = element.id();
        return {
          minDist: minDist,
          minPt: { x: minPt.x, y: minPt.y },
          minLine: minLine,
        };
      } else {
        const closestPt = this.closestPoint(element, currentPos);
        if (closestPt.distance < minDist) {
          minDist = closestPt.distance;
          minPt = { x: closestPt.x, y: closestPt.y };
          minLine = element.id();
        }
      }
    }
    return {
      minDist: minDist,
      minPt: { x: minPt.x, y: minPt.y },
      minLine: minLine,
    };
  }

  handleEraseSeam(e) {
    var stage = this.state.stageEl.current.getStage();
    var name = e.target.name();
    if (name == "designSeam") {
      var res = this.state.design.deleteSeam(parseInt(e.target.id()));
      if (res < 0) {
        alert("cannot delete boundary seam");
      }
    }
    if (name == "designVertex") {
      this.state.design.deleteVertex(parseInt(e.target.id()));
    }
    this.state.design.createHyperGraph();
    this.state.design.isValid();

    this.updateHyperGraph();
    this.getFaces();
    this.getOrder();
  }

  handleNewSection(e) {
    var stage = this.state.stageEl.current.getStage();
    var name = e.target.name();
    if (name == "designSeam") {
      var design = this.state.design.addManualSection(e.target.id());
      if (!design.isClosedSection()) {
        this.setState({ design: design, openSectionBoundary: true });
      } else {
        this.setState({ design: design, openSectionBoundary: false });
      }
    }
  }

  handleRemoveSection(e) {
    var stage = this.state.stageEl.current.getStage();
    var name = e.target.name();
    if (name == "designSeam") {
      var design = this.state.design.removeManualSection(e.target.id());
      if (!design.isClosedSection()) {
        this.setState({ design: design, openSectionBoundary: true });
      } else {
        this.setState({ design: design, openSectionBoundary: false });
      }
    }
  }

  determineDirection(e) {
    const { x: xPos, y: yPos } = this.getCoords(e);
    var xDiff = Math.abs(xPos - this.state.tempStart.x);
    var yDiff = Math.abs(yPos - this.state.tempStart.y);
    if (xDiff < yDiff) {
      //horizontal
      this.setState({ moveDir: 0 });
      return 0
    } else {
      //vertical
      this.setState({ moveDir: 1 });
      return 1
    }
  }
  
  handleMouseMove(e) {
    const { x: xPos, y: yPos } = this.getCoords(e);

    if (this.state.mode == "border") {
      //drawing custom border
      const mousePos = [xPos, yPos];
      this.setState({
        curMousePos: mousePos,
      });
      return;
    }

    if (this.state.eraser || this.state.recolor || this.state.mode != "seam") {
      return;
    }

    if (!this.state.mouseDown) {
      this.setState({ mouseMove: false });
      return; //stop if the mouse has not been down
    }

    var { minDist, minPt, minLine } = this.getClosestPointOnLine(); //this really slows things down
    var closeSeams = [];
    if (minDist < this.state.closeMargin) {
      // there's a close line already
      closeSeams.push(minLine);
      this.setState({
        tempEnd: { x: minPt.x, y: minPt.y },
        closeSeams: closeSeams,
        mouseMove: true,
      });
    } else {
      var intersection = this.intersection(
        this.state.tempStart.x,
        this.state.tempStart.y,
        xPos,
        yPos
      );
      if (intersection.intersection) {
        this.setState({ intersects: true });
      } else {
        if (this.state.intersects) {
          this.setState({ intersects: false });
        }
      }

      if (this.state.shift) {
        if (this.state.moveDir == 0) {
          console.log("snapping VERTICAL")
          this.setState({
          tempEnd: { x: this.state.tempStart.x, y: yPos },
          closeSeams: closeSeams,
          mouseMove: true,
          });
          return
        }
        else {
          console.log("snapping HORIZONTAL")
          this.setState({
          tempEnd: { x: xPos, y: this.state.tempStart.y },
          closeSeams: closeSeams,
          mouseMove: true,
          });
          return
        }
    }

      this.setState({
        tempEnd: { x: xPos, y: yPos },
        mouseMove: true,
        closeSeams: [],
      });
    }
  }

  handleMouseDown(e) {
    if (this.state.mode == "border") {
      this.addBorderPoint(e);
      return;
    }
    if (this.state.eraser || this.state.recolor || this.state.mode != "seam") {
      return;
    }

    var { x: xStart, y: yStart } = this.getCoords(e);

    const { minDist, minPt, minLine } = this.getClosestPointOnLine(); //check for nearby seam
    if (minDist < this.state.closeMargin) {
      //if there's a close seam, move the start point to that seam
      this.setState({
        tempStart: { x: minPt.x, y: minPt.y },
        startIdx: minLine,
        mouseDown: true,
        startDraw: true,
      });
    } else {
      // otherwise, just set the start point where it is
      this.setState({
        tempStart: { x: xStart, y: yStart },
        startIdx: null,
        mouseDown: true,
        startDraw: true,
      });
    }
  }

  handleClickStage(e) {
    if (e.shiftKey) {
      console.log("clicked with control");
      var { x: xPos, y: yPos } = this.getCoords(e);
    }
  }

  handleMouseUp(e) {
    if (this.state.eraser) {
      this.handleEraseSeam(e);
      this.setState({
        mouseDown: false,
        mouseMove: false,
        closeSeams: [],
        tempStart: { x: null, y: null },
        tempEnd: { x: null, y: null },
        intersects: false, //reset
      });
      return;
    }
    if (this.state.mode == "addsection") {
      this.handleNewSection(e);
      return;
    }

    if (this.state.mode == "removesection") {
      this.handleRemoveSection(e);
      return;
    }

    if (this.state.recolor || this.state.mode != "seam") {
      return;
    }

    if (
      this.state.intersects ||
      !this.state.mouseMove ||
      !this.state.mouseDown
    ) {
      //added seam out of bounds
      this.setState({
        mouseDown: false,
        mouseMove: false,
        closeSeams: [],
        tempStart: { x: null, y: null },
        tempEnd: { x: null, y: null },
        intersects: false, //reset
      });
      return;
    }

    const { x: xPos, y: yPos } = this.getCoords(e);

    const { minDist, minPt, minLine } = this.getClosestPointOnLine();
    var endClick = { x: xPos, y: yPos };
    var endIdx = null;
    if (minDist < this.state.closeMargin) {
      endClick = { x: minPt.x, y: minPt.y };
      endIdx = minLine;
    }
    this.addSeam(this.state.tempStart, endClick, this.state.startIdx, endIdx);
    this.getFaces();
    this.state.design.createHyperGraph();
    this.state.design.isValid();
    this.state.design.getSewingOrder();
    this.getOrder();
    var closed = this.state.design.isClosed();
    this.setState({
      mouseDown: false,
      mouseMove: false,
      overlapping: this.state.design.overlappingSeams,
      closeSeams: [],
      endClick: endClick,
      tempEnd: endClick,
      endIdx: endIdx,
      closed: closed,
    });
  }

  checkWithoutServer() {
    var hypergraph = this.state.design.createHyperGraph();
  }

  getOrder() {
    var seamLabelMap = {};
    for (var i = 0; i < Object.keys(this.state.faces).length; i++) {
      if (this.state.design.valid && !this.state.openSectionBoundary) {
        for (
          var j = 0;
          j < Object.keys(this.state.design.sewingOrder).length;
          j++
        ) {
          var sectionId = Object.keys(this.state.design.sewingOrder)[j];
          var orderPerSection = this.state.design.sewingOrder[sectionId];
          var orderIndex = orderPerSection.indexOf(i);
          var letter = toAlpha(parseInt(sectionId));
          if (orderIndex > -1) {
            seamLabelMap[i.toString()] = letter + orderIndex.toString();
          }
        }
      } else {
        seamLabelMap[i.toString()] = "xxx-" + i.toString();
      }
    }
    this.setState({ seamLabelMap: seamLabelMap });
  }

  updateHyperGraph(toggle = false) {
    if (this.state.design.isClosed()) {
      var hypergraphs = this.state.design.createHyperGraph();
      var orders = this.state.design.getSewingOrder();
      this.getOrder();
      this.setState({ closed: true });
    } else {
      this.setState({ image: "", order: [], peelImages: [], closed: false });
    }
  }

  getFaces() {
    //Compute dual graph
    var faces = this.state.design.getFaces();
    var polys = this.state.design.getPolys();
    this.setState({ faces: faces, polys: polys });
  }

  getCentroid(faceId) {
    var face = this.state.faces[faceId];
    var xs = [];
    var ys = [];
    face.forEach((vertId) => {
      xs.push(this.state.vertices[vertId].x);
      ys.push(this.state.vertices[vertId].y);
    });
    const arravg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    return { x: arravg(xs), y: arravg(ys) };
  }

  toggleEraser() {
    if (this.state.eraser) {
      this.setState({ eraser: false });
    } else {
      this.setState({ eraser: true });
    }
  }

  getPolyCenter(face) {
    var sumArea = 0,
      sumX = 0,
      sumY = 0;
    var points = [];
    face.forEach((vertexId) => {
      var vertex = this.state.design.vertices[vertexId];
      points.push(vertex);
    });
    for (var i = 0; i < face.length; i++) {
      var i_p = (i + 1) % face.length;
      var g = points[i].x * points[i_p].y - points[i_p].x * points[i].y;
      sumArea += g;
      sumX += (points[i].x + points[i_p].x) * g;
      sumY += (points[i].y + points[i_p].y) * g;
    }
    sumArea = 3 * sumArea;
    return { x: sumX / sumArea, y: sumY / sumArea };
  }

  getSeamColor(seam) {
    var seamColor = "black";
    if (seam.isBoundary && this.state.mode == "addsection") {
      return "grey";
    }
    if (!seam.isBoundary && this.state.mode == "removesection") {
      return "black";
    }
    if (
      this.state.mouseOverSeams.indexOf(seam.idx) > -1 ||
      this.state.mouseOverSeams.indexOf(seam.idx.toString()) > -1
    ) {
      return "green";
    }
    if (this.state.design.overlappingSeams.indexOf(seam.idx) > -1) {
      seamColor = "red";
    }
    if (seam.isBoundary) {
      seamColor = "grey";
    }
    return seamColor;
  }

  getVertexColor(vertex) {
    var vertexColor = "black";
    if (vertex.isBoundary) {
      vertexColor = "grey";
    }
    if (this.state.closeVertices.indexOf(vertex.idx) > -1) {
      vertexColor = "blue";
    }
    return vertexColor;
  }

  handleDragMovePointBorder(event, index) {
    const points = this.state.borderPoints;
    const pos = [event.target.attrs.x, event.target.attrs.y];
    this.setState({
      borderPoints: [
        ...points.slice(0, index),
        pos,
        ...points.slice(index + 1),
      ],
    });
  }

  changeColor() {
    var current = this.state.recolor;
    if (current) {
      this.setState({ recolor: false });
    } else {
      this.setState({ recolor: true });
    }
  }

  handleChangeComplete = (color) => {
    this.setState({ currentColor: color.hex });
  };

  recolorPoly(e) {
    if (this.state.mode == "recolor") {
      var shape = this.state.stageEl.current.findOne("#" + e.target.id());
      shape.fill(this.state.currentColor);
      var colorObj = JSON.parse(JSON.stringify(this.state.colors));
      colorObj[e.target.id()] = this.state.currentColor;
      this.setState({ colors: colorObj });
    }
  }

  changeMode(e, newMode) {
    if (this.state.mode == "border") {
      if (this.state.isFinished) {
        //make border from this
        this.initBoundaryFromArray(this.state.borderPoints);
      } else {
        //make border from default
        this.resetComponent();
        this.initBoundary();
      }
    }
    // this.setState({ mode: newMode});  <option value={"defaultborder"}>default border</option>
    if (newMode == "seam") {
      this.setState({ mode: newMode, recolor: false, eraser: false });
    }
    if (newMode == "erase") {
      this.setState({ eraser: true, mode: newMode, recolor: false });
    }
    if (newMode == "addsection") {
      this.setState({ eraser: false, mode: newMode, recolor: false });
    }
    if (newMode == "removesection") {
      this.setState({ eraser: false, mode: newMode, recolor: false });
    }
    if (newMode == "backgroundedit") {
      this.setState({ eraser: false, mode: newMode, recolor: false });
    }
    if (newMode == "borderedit") {
      this.setState({ eraser: false, mode: newMode, recolor: false });
    }
    if (newMode == "customborder") {
      this.handleClickOpen(e);
    }
    if (newMode == "defaultborder") {
      this.resetComponent();
      this.initBoundary();
    }
    if (newMode == "recolor") {
      this.setState({ mode: newMode, recolor: true, eraser: false });
    }
  }

  seamMidpoint(seam) {
    var x = Math.abs(seam.startVertex.x + seam.endVertex.x) / 2;
    var y = Math.abs(seam.startVertex.y + seam.endVertex.y) / 2;
    return { x: x, y: y };
  }

  addBorderPoint(event) {
    if (this.state.mode == "border") {
      if (this.state.isFinished) {
        return;
      }

      const coords = this.getCoords(event);
      const mousePos = [coords.x, coords.y];
      var dist = 100;
      if (this.state.borderPoints.length > 0) {
        var firstPoint = this.state.borderPoints[0];
        var dist = this.dist2(coords, { x: firstPoint[0], y: firstPoint[1] });
      }
      if (this.state.borderPoints.length >= 3 && dist < 10) {
        this.setState({
          isFinished: true,
        });
        this.changeMode(event, "seam")
        return;
      } else {
        this.setState({
          borderPoints: [...this.state.borderPoints, mousePos],
        });
      }
    }
  }

  doneSectioning(e) {
    this.state.design.getFaces();
    this.state.design.getSections();
    this.state.design.createHyperGraph();
    this.state.design.isValid();
    this.updateHyperGraph();
    if (!this.state.design.isClosedSection()) {
      this.setState({ openSectionBoundary: true });
    }
    this.setState({ mode: "seam" });
  }

  changeColorFaces(e) {
    if (this.state.colorFaces) {
      this.setState({ colorFaces: false });
    } else {
      this.setState({ colorFaces: true });
    }
  }

  changeBorder(e) {
    if (this.state.borderMode != "default") {
      this.selectDefaultBorder(e);
    } else {
      this.selectCustomBorder(e);
    }
  }

 handleClickOpen(e){
    this.setState({ borderDialogOpen: true });
  };

  handleClickCloseAgree(e){
    this.changeBorder(e);
    this.setState({ borderDialogOpen: false });
  };

  handleClickCloseDisagree(e){
    this.setState({ borderDialogOpen: false });
  };


  selectCustomBorder(e) {
    this.clearBlock(true);
    this.setState({
      borderMode: "custom",
      mode: "border",
      borderAnchor: false,
      helpText: ""
    });
  }

  selectDefaultBorder(e) {
    this.clearBlock(true);
    this.initBoundary();
    this.setState({
      borderMode: "default",
      mode: "borderedit",
      borderAnchor: false,
      helpText: "",
    });
  }

  changeHelp(e, newVal) {
    if (this.state.showHelpText) {
      this.setState({ showHelpText: false });
    } else {
      this.setState({ showHelpText: true });
    }
  }

  changeGrid(e, newVal) {
    if (this.state.showGrid) {
      this.setState({ showGrid: false });
    } else {
      this.setState({ showGrid: true });
    }
  }

  changeSeamLabel(e) {
    if (this.state.seamLabels) {
      this.setState({ seamLabels: false });
    } else {
      this.setState({ seamLabels: true });
    }
  }

  changeShowHypergraph(e) {
    if (this.state.showHypergraph) {
      this.setState({ showHypergraph: false });
    } else {
      this.setState({ showHypergraph: true });
      this.updateHyperGraph(true);
    }
  }

  reCheckHypergraph() {
    this.state.design.getFaces();
    this.state.design.getSections();
    this.state.design.createHyperGraph();
    this.updateHyperGraph();
  }

  setFileAnchor = (event) => {
    this.setState({ fileAnchor: event.currentTarget });
  };

  closeFileAnchor = (event) => {
    this.setState({ fileAnchor: null });
  };

  setBorderAnchor = (event) => {
    this.setState({ borderAnchor: event.currentTarget });
  };

  closeBorderAnchor = (event) => {
    this.setState({ borderAnchor: null });
  };

  doneBackgroundEdit() {
    this.setState({
      helpText: "select background type under border menu",
      mode: "borderedit",
    });
  }

  handleOpenFAQ() {
    this.setState({openFAQ: true})
  }

  handleCloseFAQ() {
    this.setState({openFAQ: false})
  }

  updateVertexPos(e) {
    var newX = e.target.x();
    var newY = e.target.y();
    var vertexId = e.target.id();
    var design = this.state.design;
    design = design.updateVertexPosition(vertexId, newX, newY);
    this.getFaces();
    this.updateHyperGraph();
    this.getOrder();
    this.state.design.isValid();
    this.setState({ design: design });
  }

  /**
   * Formats the elements of an array to a string
   */
  arrayToString(data, prefix = "") {
    var str = "";
    for (var i = 0; i < data.length; i++) {
      str += prefix + data[i].toString() + ", ";
    }
    const finalStr = str.slice(0, -2);
    return finalStr;
  }

  facesToLabelString(faceIds) {
    var str = "";
    for (var i = 0; i < faceIds.length; i++) {
      var faceId = faceIds[i];
      str += this.state.seamLabelMap[faceId] + ", ";
    }
    const finalStr = str.slice(0, -2);
    return finalStr;
  }

  getPeelLabel(sectionId, sewingOrderId) {
    const peelOrder = [...this.state.design.sewingOrder[sectionId]].reverse();
    var faceId = peelOrder[sewingOrderId]
    return this.state.seamLabelMap[faceId]
  }

  createPeelTables(tableRows) {
    var tables = []
     tableRows.map((x, j) => {
      tables.push(
        <>
        <TableContainer key = {"tc-"+j.toString()} component={Paper}>
            <Table key = {"table-"+j.toString()} size="small" aria-label="a dense table">
              <TableHead>
                <TableRow key = {"tablerow-"+j.toString()}>
                  <TableCell key={"section" + j.toString()}>Section</TableCell>
                  <TableCell key={"faces" + j.toString()}>Faces</TableCell>
                  <TableCell key={"edges" + j.toString()}>Edges</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.map((row, i) => (
                  (i >= j) && (
                    <TableRow key={"tablerow" + j.toString()+ "_"+i.toString()}>
                    <TableCell key={"tc" + j.toString()+ "_"+i.toString()+"_1"} component="th" scope="row">
                      {row[0]}
                    </TableCell>
                    <TableCell key={"tc" + j.toString()+ "_"+i.toString()+"_2"} component="th" scope="row">
                      {row[1]}
                    </TableCell>
                    <TableCell key={"tc" + j.toString()+ "_"+i.toString()+"_3"} component="th" scope="row">
                      {row[2]}
                    </TableCell>
                  </TableRow>
                  )
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {this.state.design.valid && <h3> {"Peel "+this.getPeelLabel(x[0], j)} </h3>}
          </>
          )})
    if (!this.state.design.valid) {
      return tables[0]
    }
    return tables
    }

  render() {
    const { classes } = this.props;


    var seams = [];
    Object.keys(this.state.design.seams).map((seamId, idx) => {
      seams.push(this.state.design.seams[seamId]);
    });
    var vertices = [];
    Object.keys(this.state.design.vertices).map((vertId, idx) => {
      vertices.push(this.state.design.vertices[vertId]);
    });
    var polys = [];
    var faces = [];
    var rects = [];
    if (Object.keys(this.state.design.vertices).length > 0) {
      if (this.state.design.isClosed()) {
        Object.keys(this.state.polys).map((polyId, idx) => {
          polys.push(this.state.polys[polyId]);
        });
      }

      if (this.state.design.isClosed()) {
        Object.keys(this.state.design.faces).map((faceId, idx) => {
          faces.push(this.state.design.faces[faceId]);
        });
      }
    }

    const flattenedPoints = this.state.borderPoints
      .concat(this.state.isFinished ? [] : this.state.curMousePos)
      .reduce((a, b) => a.concat(b), []);

    var tableRows = [];
    for (var i = 0; i < Object.keys(this.state.design.hypergraphs).length; i++) {
      var secId = Object.keys(this.state.design.hypergraphs)[i];
      var hypergraph = this.state.design.hypergraphs[secId];
      var hyperedges = hypergraph.hyperedges;
      var heArr = [...hyperedges];
      var edgeOrder = this.state.design.edgeOrder[secId];
      heArr.sort(function(a, b){  
        return edgeOrder.indexOf(a.idx) - edgeOrder.indexOf(b.idx);
      });
      for (var j = 0; j<heArr.length; j++) {
        var he = heArr[j]
        tableRows.push([
          secId,
          this.facesToLabelString(he.faces),
          this.arrayToString(he.edges),
        ]);
      }
    }

    const gridComponents = [];
    var i = 0;
    const WIDTH = 20;
    const HEIGHT = 20;
    const startX = 0;
    const endX = this.state.canvasSize.width;

    const startY = 0;
    const endY = this.state.canvasSize.height;

    const grid = [
      ["white", "white"],
      ["white", "white"],
    ];

    var i = 0;
    for (var x = startX; x < endX; x += WIDTH) {
      for (var y = startY; y < endY; y += HEIGHT) {
        if (i === 4) {
          i = 0;
        }

        const indexX = Math.abs(x / WIDTH) % grid.length;
        const indexY = Math.abs(y / HEIGHT) % grid[0].length;

        gridComponents.push(
          <Rect
            x={x}
            y={y}
            key={"gc" + x.toString() + y.toString()}
            width={WIDTH}
            height={HEIGHT}
            fill={grid[indexX][indexY]}
            stroke="lightgrey"
          />
        );
      }
    }

    return (
      <>
      <div className={classes.root}>
      <AppBar className="topBar" position="static">
      <img className="logoImg" src="https://web.stanford.edu/~mleake/uploads/flipper.svg"/>
      </AppBar>
      <AppBar position="static">
        <Toolbar>
          <Button
              aria-controls="file-menu"
              aria-haspopup="true"
              color="inherit"
              className={classes.menuButton}
              onClick={this.setFileAnchor}
            >
              File
            </Button>
            <Menu
              id="file-menu"
              anchorEl={this.state.fileAnchor}
              open={Boolean(this.state.fileAnchor)}
              onClose={this.closeFileAnchor}
            >
              <MenuItem onClick={this.closeAnchor}></MenuItem>

              <MenuItem onClick={this.newBlock.bind(this)}>New block</MenuItem>

              <input
                id="svgupload"
                type="file"
                onChange={this.onSVGChange}
                hidden
              />
              <label htmlFor="svgupload">
                <MenuItem>
                  Load SVG from file
                </MenuItem>
              </label>
               <MenuItem onClick={this.exportSvg.bind(this)}>
                Save SVG
              </MenuItem>
              <MenuItem onClick={this.exportPdf.bind(this)}>
                Save PDF
              </MenuItem>
             
              <MenuItem onClick={this.clearBlock.bind(this)}>Clear</MenuItem>
            </Menu>
            
            <Grid container direction="row" className="rightIcon">
            <Grid item>
              <IconButton color="inherit">
              <a className="instructionLink" href="http://web.stanford.edu/~mleake/projects/paperpiecing/" target="_blank">Project Info</a>
              <BiLinkExternal/>
              </IconButton>
            </Grid>

            <Grid item>
              <IconButton color="inherit">
              <a className="instructionLink" href="https://docs.google.com/document/d/101sPjTxzTI_ju9H0mVZ6SgoXHIS3I1gv5srckECIeIg/edit?usp=sharing" target="_blank">Instructions</a>
              <BiLinkExternal/>
              </IconButton>
            </Grid>
            <Grid item >
              <IconButton color="inherit" onClick={this.handleOpenFAQ.bind(this)}>
                FAQ
                <BiHelpCircle/>
              </IconButton>
            </Grid>
          </Grid>
            
            <Dialog
              open={this.state.openFAQ}
              onClose={this.handleCloseFAQ.bind(this)}
              aria-labelledby="simple-modal-title"
              aria-describedby="simple-modal-description"
              >
              <Toolbar>
                <IconButton edge="start" color="inherit" onClick={this.handleCloseFAQ.bind(this)} aria-label="close">
                <CloseIcon />
                </IconButton>
              </Toolbar>

              <DialogTitle id="customized-dialog-title">
                FAQ
              </DialogTitle>
              <FAQPanel/>
            </Dialog>

          </Toolbar>
      </AppBar>
    </div>

        <div
          id="row1"
          tabIndex="0"
          onKeyDown={this.escFunction.bind(this)}
          onKeyUp={this.escFunctionUp.bind(this)}
        >
          <div id="col1">
            <div id="maintb">
              <Toolbar position="static" disableGutters>
                <ToggleButtonGroup
                  value={this.state.mode}
                  exclusive
                  onChange={this.changeMode.bind(this)}
                  aria-label="text alignment"
                  size="small"
                >
                
                  <ToggleButton
                    value="seam"
                    aria-label="centered"
                    disabled={this.state.mode == "backgroundedit"}
                  >
                    <IoMdAdd />
                    <Tooltip title="Draw seam">
                    <div>{" seam"}</div>
                    </Tooltip>
                  </ToggleButton>
                  

                  <ToggleButton
                    value="erase"
                    aria-label="left aligned"
                    disabled={this.state.mode == "backgroundedit"}
                  >
                    <BiMinus />
                    <Tooltip title="Erase seam">
                    <div>{" seam"}</div>
                    </Tooltip>
                  </ToggleButton>

                  <ToggleButton
                    value="addsection"
                    aria-label="left aligned"
                    disabled={this.state.mode == "backgroundedit"}
                  >
                    <IoMdAdd />
                    <Tooltip title="Add section boundary">
                    <div>{" section"}</div>
                    </Tooltip>
                  </ToggleButton>

                  <ToggleButton
                    value="removesection"
                    aria-label="left aligned"
                    disabled={this.state.mode == "backgroundedit"}
                  >
                    <IoMdClose />
                    <Tooltip title="Remove section boundary">
                    <div>{" section"}</div>
                    </Tooltip>
                  </ToggleButton>

                  <ToggleButton
                    value="recolor"
                    aria-label="right aligned"
                    disabled={this.state.mode == "backgroundedit"}
                  >
                    <BiShow />
                    <Tooltip title="Color pattern faces">
                    <div>{" recolor"}</div>
                    </Tooltip>
                  </ToggleButton>

                  <Divider flexItem orientation="vertical" />

                  <ToggleButton
                    value="borderedit"
                    aria-label="right aligned"
                    disabled={this.state.mode == "borderedit"}
                  >
                    <BiShapeSquare />
                    <Tooltip title="Drag boundaries">
                    <div>{" adjust"}</div>
                    </Tooltip>

                    </ToggleButton>

                   <ToggleButton
                    value="customborder"
                    aria-label="right aligned"
                    disabled={this.state.mode == "borderedit"}
                    >
                    <BiShapeSquare />
                     <Tooltip title="Create new custom boundary">
                    <div>{" custom"}</div>
                    </Tooltip>
                    </ToggleButton>
                </ToggleButtonGroup>
              </Toolbar>
              <Dialog
                open={this.state.borderDialogOpen}
                onClose={this.handleClickCloseDisagree.bind(this)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
              >
                <DialogTitle id="alert-dialog-title">{"Create a custom border?"}</DialogTitle>
                <DialogContent>
                  <DialogContentText id="alert-dialog-description">
                    Would you like to draw a custom outer border? Note: doing so will erase any design you currently have.
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button onClick={this.handleClickCloseDisagree.bind(this)} color="primary">
                    No
                  </Button>
                  <Button onClick={this.handleClickCloseAgree.bind(this)} color="primary" autoFocus>
                    Yes
                  </Button>
                </DialogActions>
              </Dialog>

            </div>
            <div id="mainstage">
              <Stage
                width={this.state.canvasSize.width}
                height={this.state.canvasSize.height}
                onMouseDown={this.handleMouseDown.bind(this)}
                onMouseMove={this.handleMouseMove.bind(this)}
                onMouseUp={this.handleMouseUp.bind(this)}
                onClick={this.handleClickStage.bind(this)}
                x={0}
                y={0}
                scaleX={1}
                scaleY={1}
              >
                <Layer ref={this.state.stageEl}>
                  {this.state.showGrid && gridComponents}

                  {this.state.borderPoints.map((point, index) => {
                    const width = 6;
                    const x = point[0] - width / 2;
                    const y = point[1] - width / 2;
                    return (
                      <Rect
                        key={index}
                        x={x}
                        y={y}
                        width={width}
                        height={width}
                        stroke="black"
                        strokeWidth={3}
                        onDragMove={(e) =>
                          this.handleDragMovePointBorder(e, index)
                        }
                        draggable={this.state.isFinished ? false : true}
                      />
                    );
                  })}
                  {
                    <Line
                      points={flattenedPoints}
                      stroke={this.state.isFinished ? "grey" : "blue"}
                      strokeWidth={6}
                      closed={this.state.isFinished}
                    />
                  }

                  {polys.map((poly, idx) => (
                    <Path
                      name={"designFace"}
                      id={"poly" + idx}
                      key={"poly" + idx}
                      data={poly}
                      fill={
                        this.state.colorFaces
                          ? Object.keys(this.state.colors).indexOf(
                              "poly" + idx
                            ) > -1
                            ? this.state.colors["poly" + idx]
                            : this.state.defaultColors[
                                idx % this.state.defaultColors.length
                              ]
                          : "white"
                      }
                      stroke={"black"}
                      strokeWidth={6}
                      opacity={
                        this.state.showGrid ? 0.7 : 1.0
                      }
                      onClick={(e) => this.recolorPoly(e)}
                    />
                  ))}
                  {this.state.mouseDown && this.state.mouseMove && (
                    <Line
                      name={"tempSeam"}
                      key={"tempSeam"}
                      x={0}
                      y={0}
                      id={"tempSeam"}
                      points={[
                        this.state.tempStart.x,
                        this.state.tempStart.y,
                        this.state.tempEnd.x,
                        this.state.tempEnd.y,
                      ]}
                      stroke={!this.state.intersection ? "blue" : "red"}
                      strokeWidth={6}
                    />
                  )}
                  {this.state.mouseDown && this.state.mouseMove && (
                    <Circle
                      name={"tempStart"}
                      key={"tempStart"}
                      x={this.state.tempStart.x}
                      y={this.state.tempStart.y}
                      id={"tempStart"}
                      radius={10}
                      opacity={this.state.tempStart.x ? 1.0: 0}
                      fill={"blue"}
                    />
                  )}
                  {this.state.mouseDown && (
                    <Circle
                      name={"tempEnd"}
                      key={"tempEnd"}
                      x={this.state.tempEnd.x}
                      y={this.state.tempEnd.y}
                      id={"tempEnd"}
                      radius={10}
                      opacity={this.state.tempEnd.x ? 1.0: 0}
                      fill={"blue"}
                    />
                  )}

                  {seams.map((seam, idx) => (
                    <Line
                      name={"seamRegion"}
                      key={"seamRegion" + seam.idx}
                      id={"sr" + seam.idx.toString()}
                      points={[
                        seam.startVertex.x,
                        seam.startVertex.y,
                        seam.endVertex.x,
                        seam.endVertex.y,
                      ]}
                      stroke={"yellow"}
                      opacity={0}
                      strokeWidth={50}
                      onMouseEnter={(e) => {
                        // style stage container:
                        const container = e.target.getStage().container();
                        container.style.cursor = "pointer";
                        var shape = e.target;
                        var seams = [...this.state.mouseOverSeams];
                        seams.push(seam.idx.toString());
                        this.setState({ mouseOverSeams: seams });
                      }}
                      onMouseLeave={(e) => {
                        var seams = [...this.state.mouseOverSeams];
                        const index = seams.indexOf(seam.idx.toString());
                        if (index > -1) {
                          seams.splice(index, 1);
                        }
                        this.setState({ mouseOverSeams: seams });
                      }}
                    />
                  ))}
                  {seams.map((seam, idx) => (
                    <Line
                      name={"designSeam"}
                      key={"seam" + seam.idx}
                      x={0}
                      y={0}
                      id={seam.idx.toString()}
                      points={[
                        seam.startVertex.x,
                        seam.startVertex.y,
                        seam.endVertex.x,
                        seam.endVertex.y,
                      ]}
                      stroke={this.getSeamColor(seam)}
                      strokeWidth={10}
                      onMouseEnter={(e) => {
                        // style stage container:
                        const container = e.target.getStage().container();
                        container.style.cursor = "pointer";
                        var shape = e.target;
                        var seams = [...this.state.mouseOverSeams];
                        if (seams.indexOf(seam.idx.toString()) < 0) {
                          seams.push(seam.idx.toString());
                        }
                        this.setState({ mouseOverSeams: seams });
                      }}
                      onMouseLeave={(e) => {
                        var seams = [...this.state.mouseOverSeams];
                        const index = seams.indexOf(seam.idx.toString());
                        if (index > -1) {
                          seams.splice(index, 1);
                        }
                        this.setState({ mouseOverSeams: seams });
                      }}
                    />
                  ))}
                  {this.state.seamLabels &&
                    seams.map((seam, idx) => (
                      <Text
                        key={"seamText" + seam.idx}
                        className={"seamText"}
                        x={this.seamMidpoint(seam).x + 2}
                        y={this.seamMidpoint(seam).y + 2}
                        text={"e" + seam.idx}
                        fontFamily={"Lato"}
                        fontSize={12}
                      />
                    ))}
                  {faces.map((face, idx) => (
                    <Text
                      key={"faceText" + idx.toString()}
                      className={"faceText"}
                      x={this.getPolyCenter(face).x - 10}
                      y={this.getPolyCenter(face).y - 10}
                      text={this.state.seamLabelMap[idx]}
                      fontFamily={"Lato"}
                      fontSize={18}
                    />
                  ))}
                  {vertices.map((vertex, idx) => (
                    <Circle
                      name={"designVertex"}
                      key={"vertex" + vertex.idx}
                      x={vertex.x}
                      y={vertex.y}
                      id={vertex.idx}
                      radius={10}
                      fill={this.getVertexColor(vertex)}
                      draggable={this.state.mode == "borderedit"}
                      onDragMove={(e) => this.updateVertexPos(e)}
                    />
                  ))}
                  {this.state.design.overlappingSeams.length > 0 &&
                  <Text
                    text={"Design is not paper pieceable"}
                    x={0}
                    y={0}
                    fontSize={20}
                    fill={"red"}
                  />}
                </Layer>
              </Stage>
            </div>
            {this.state.showHelpText && <h2> Hints: </h2>}
            {this.state.showHelpText && this.state.mode == "addsection" && (
              <h3> Click on seams to turn them into section boundaries. 
              Seams that are grey are boundaries.
              </h3>
            )}
            {this.state.showHelpText && this.state.mode == "removesection" && (
              <h3> Click on boundary seams to turn them into normal seams. </h3>
            )}
            {this.state.showHelpText && this.state.mode == "seam" && (
              <h3>
                {" "}
                Click and drag to draw a seam. A new seam will be added when you
                release your mouse. If an existing seam turns green, the new
                seam will snap to it.{" "}
              </h3>
            )}
            {this.state.showHelpText && this.state.mode == "erase" && (
              <h3> Click on a seam to delete it. </h3>
            )}
            {this.state.showHelpText && !this.state.closed && (
              <h3>
                {" "}
                The design is not closed. Either delete the edge you just added
                or draw another seam to connect it to other seams.{" "}
              </h3>
            )}
            {this.state.showHelpText && this.state.borderMode == "custom" && (
              <h3>
                {" "}
                To draw your border click to add vertices. Be sure to close the polygon.
                When the polygon is grey, the border is closed. {" "}
              </h3>
            )}
            {this.state.intersects && <h2> Warning: intersecting seams! </h2>}
          </div>
          <div>
            {(this.state.mode == "addsection" ||
              this.state.mode == "removesection") &&
              !this.state.openSectionBoundary && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    this.doneSectioning();
                  }}
                >
                  done sectioning
                </Button>
              )}
            {this.state.openSectionBoundary && (
              <h3 className="errorText">
                Note: section boundary is not closed
              </h3>
            )}
            
            <h3>{this.state.helpText}</h3>
            {this.state.recolor && (
              <SketchPicker
                color={this.state.currentColor}
                onChangeComplete={this.handleChangeComplete}
              />
            )}
            {!this.state.valid && (
              <div>
                <h3 className="errorText">
                  This pattern is not paper pieceable in a single section!
                </h3>
                <p>Tip: try adding a section boundary or erasing seam(s)</p>
              </div>
            )}
          </div>
            <div id="col2">
            

            </div>

          <div id="col3">
            <FormGroup aria-label="position">
              <FormControlLabel
                value="showLabel"
                control={
                  <Switch
                    color="primary"
                    checked={this.state.seamLabels}
                    onChange={this.changeSeamLabel.bind(this)}
                  />
                }
                label="seam label"
                labelPlacement="top"
              />
              <FormControlLabel
                value="showHypergraph"
                control={
                  <Switch
                    color="primary"
                    checked={this.state.showHypergraph}
                    onChange={this.changeShowHypergraph.bind(this)}
                  />
                }
                label="hypergraph"
                labelPlacement="top"
              />

              <FormControlLabel
                value="colorFaces"
                control={
                  <Switch
                    color="primary"
                    checked={this.state.colorFaces}
                    onChange={this.changeColorFaces.bind(this)}
                  />
                }
                label="color faces"
                labelPlacement="top"
              />
              <FormControlLabel
                value="showGrid"
                control={
                  <Switch
                    color="primary"
                    checked={this.state.showGrid}
                    onChange={this.changeGrid.bind(this)}
                  />
                }
                label="show grid"
                labelPlacement="top"
              />
              <FormControlLabel
                value="showHelpText"
                control={
                  <Switch
                    color="primary"
                    checked={this.state.showHelpText}
                    onChange={this.changeHelp.bind(this)}
                  />
                }
                label="show help text"
                labelPlacement="top"
              />
            </FormGroup>
          </div>
        </div>
        <hr className="foo" />
        {this.state.showHypergraph && <div id = "row2">
         <h3> Starting hypergraph </h3>
          {this.createPeelTables(tableRows)}
        </div>}
      </>
    );
  }
}
export default withStyles(styles)(CanvasDraw);
