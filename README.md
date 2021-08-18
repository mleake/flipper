# FliPPer
FliPPer is an interactive design tool for drawing and checking foundation paper piecing designs. It is based on our SIGGRAPH'21 paper 'A Mathematical Foundation for Foundation Paper Pieceable Quilts.' For more information please see our [project webpage](http://web.stanford.edu/~mleake/projects/paperpiecing/).

[Demo](https://fpptool.herokuapp.com/)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/mleake/fpptool

# Go inside the directory
cd fpptool

# Install dependencies
yarn (or npm install)

# Start development server
yarn dev (or npm run dev)
```

## Code structure
* UI is contained entirely in `src/client/CanvasHE.js`
* Design gets built and organized in `src/client/DesignHE.js`, which imports `FaceHE.js`, `SeamHE.js`, `MaximalSeamHE.js`, `VertexHE.js`, and `HypergraphHE.js`. 

## More info
* Note: repo built on top of [this boilerplate](https://github.com/crsandeep/simple-react-full-stack)
* For comments and questions, please reach out to <fppresearch2021@gmail.com>


