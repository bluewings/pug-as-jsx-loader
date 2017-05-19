/* eslint-disable import/no-extraneous-dependencies, import/extensions, import/no-unresolved */
import React from 'react';
import PropTypes from 'prop-types';
import normalize from 'normalize.css/normalize.css';
import bootstrapTheme from 'bootswatch/lumen/bootstrap.css';
import fontAwesome from 'font-awesome/css/font-awesome.css';
import reactSelect from 'react-select/dist/react-select.css';
import codemirror from 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/pug/pug';
import 'codemirror/mode/jsx/jsx';
import commonCss from './styles/common.scss';

class App extends React.Component {

  getChildContext = () => this.props.context

  componentWillMount = () => {
    const { insertCss } = this.props.context;
    this.unmounts = [normalize, bootstrapTheme, fontAwesome, reactSelect, commonCss, codemirror]
      .map(css => insertCss(css));
  }

  componentWillUnmount = () => {
    this.unmounts.forEach(unmount => unmount());
  }

  render = () => this.props.children

}

const ContextType = {
  insertCss: PropTypes.func.isRequired,
};

App.propTypes = {
  context: PropTypes.shape(ContextType).isRequired,
  children: PropTypes.element.isRequired,
};

App.childContextTypes = ContextType;

export default App;
