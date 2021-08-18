import React, { Component } from 'react';
import './app.css';
import ReactImage from './react.png';
import Canvas from './CanvasDrawHE.js';


export default class App extends Component {
  state = { username: null };

  componentDidMount() {
    console.log("loaded")
  }

  render() {
    const { username } = this.state;
    return (
      <div>
        <Canvas/>
      </div>
    );
  }
}
