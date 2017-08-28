import { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import template from './App.pug';

const characters = [
  'Darth Vader',
  'Luke Skywalker',
  'Leia Organa',
  'Han Solo',
  'R2D2',
  'C3PO',
  'Obi-Wan Kenobi',
];

class App extends Component {

  handleClick = (event) => {
    alert('clicked');
  }

  handleRemove = (name, index, event) => {
    alert(name + ' ' + index + ' ' + event.target.tagName);
  }

  render() {
    return template.call(this, {
      // variables
      characters,
      logo,
    });
  }
}

export default App;
