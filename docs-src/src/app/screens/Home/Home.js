import React from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import CodeMirror from 'react-codemirror';
import pugAsJsxLoader from 'pug-as-jsx-loader/browser';
import ApplyStyles from 'helpers/ApplyStyles';

// jsx, styles
import template from './Home.pug';
import styles from './Home.scss';

// sample data
import sampleWebpack from './sample.webpack.txt';
import samplePug from './sample.pug.txt';

const { pug } = self;

const samples = samplePug.split(/-{5,}\s+/)
  .map((e) => {
    const lines = e.split(/\n/);
    const name = lines.shift().trim();
    const source = lines.join('\n').trim();
    return { name, source };
  })
  .filter(e => e.name);

class Home extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      boxes: [],
      source: '',
      usage: '1',
      jsx: '1',
    };
  }

  componentWillMount() {
    this.selectSample(samples[0]);
  }

  handleSourceChange = (value) => {
    const source = value;

    this.setState({ source });

    const callback = (err, output) => {
      let [jsx, usage] = (output || '').split('//  /* USAGE EXAMPLE */');
      jsx = `${(jsx || '')
        .replace(/(^\s*|\s*$)/g, '')}\n`;
      usage = `${(usage || '').split(/\n/)
        .map(e => e.replace(/^\/\/[\s]{0,2}/, '')).join('\n')
        .replace(/\.\/\.test\.pug/, './try-it-out.pug')
        .replace('/* // USAGE EXAMPLE */', '')
        .replace(/(^\s*|\s*$)/g, '')}\n`;
      this.setState({ jsx, usage, err: '' });
    };

    const opt = {
      callback,
      async: () => callback,
      cacheable: () => {},
      resourcePath: '.test.pug',
      __eslint: false,
    };
    try {
      pugAsJsxLoader.call(opt, source);
    } catch (err) {
      this.setState({
        jsx: '',
        usage: '',
        err: err.toString()
          .replace(/upper___/g, '')
          .replace(/___dot_btw_cpnts___/g, '.'),
      });
    }
  }

  selectSample = (sample) => {
    this.setState({ sampleName: sample.name });
    this.handleSourceChange(`${sample.source}\n`);
  }

  selectTab = (tab, event) => {
    event.preventDefault();
    this.setState({ tab });
  }

  render() {
    return template.call(this, {
      sampleWebpack,
      samples,
      CodeMirror,
      DropdownButton,
      MenuItem,
    });
  }

}

export default ApplyStyles(styles)(Home);
