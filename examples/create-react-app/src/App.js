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

  handleClick() {
    alert('clicked');
  }

  handleItemClick(event) {
    const name = event.target.getAttribute('data-name');
    const index = event.target.getAttribute('data-index');
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
